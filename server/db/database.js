const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Database instance
let db = null;
const dbPath = path.join(__dirname, 'horse_betting.db');

// Helper to convert sql.js results to array of objects
function toObjects(result) {
    if (!result || !result.length) return [];
    const [{ columns, values }] = result;
    return values.map(row => {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
    });
}

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Try to load existing database
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
    
    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.run(schema);

    // Simple migrations for new columns
    try {
        const userCols = toObjects(db.exec('PRAGMA table_info(users)'));
        const colNames = userCols.map(c => c.name);

        if (!colNames.includes('is_admin')) {
            db.run('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
        }
        if (!colNames.includes('banned')) {
            db.run('ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0');
        }
        if (!colNames.includes('avatar')) {
            db.run('ALTER TABLE users ADD COLUMN avatar TEXT');
        }
        if (!colNames.includes('facebook_url')) {
            db.run('ALTER TABLE users ADD COLUMN facebook_url TEXT');
            console.log('✅ Added facebook_url column to users table');
        }
        if (!colNames.includes('facebook_name')) {
            db.run('ALTER TABLE users ADD COLUMN facebook_name TEXT');
            console.log('✅ Added facebook_name column to users table');
        }
    } catch (e) {
        console.error('Migration error:', e);
    }
    
    // Migration for user_horses table
    try {
        const tables = toObjects(db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_horses'"));
        if (!tables || tables.length === 0) {
            // Create new table
            db.run(`CREATE TABLE IF NOT EXISTS user_horses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                horse_name TEXT NOT NULL,
                sprite_key TEXT NOT NULL,
                skill_key TEXT NOT NULL,
                is_active INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);
            db.run('CREATE INDEX IF NOT EXISTS idx_user_horses_user ON user_horses(user_id)');
        } else {
            // Check if table has UNIQUE constraint on user_id
            const cols = toObjects(db.exec('PRAGMA table_info(user_horses)'));
            const colNames = cols.map(c => c.name);
            
            // Check if we need to recreate table (remove UNIQUE constraint)
            try {
                // Try to detect UNIQUE constraint by trying to insert duplicate
                const testQuery = db.exec('SELECT sql FROM sqlite_master WHERE type="table" AND name="user_horses"');
                const tableSql = testQuery[0]?.values[0]?.[0] || '';
                
                // If table has UNIQUE constraint or missing is_active, recreate it
                if (tableSql.includes('UNIQUE') || !colNames.includes('is_active')) {
                    console.log('🔄 Recreating user_horses table to remove UNIQUE constraint...');
                    
                    // Backup existing data
                    const existingHorses = toObjects(db.exec('SELECT * FROM user_horses'));
                    
                    // Drop old table
                    db.run('DROP TABLE user_horses');
                    
                    // Create new table without UNIQUE constraint
                    db.run(`CREATE TABLE user_horses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        horse_name TEXT NOT NULL,
                        sprite_key TEXT NOT NULL,
                        skill_key TEXT NOT NULL,
                        is_active INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )`);
                    db.run('CREATE INDEX idx_user_horses_user ON user_horses(user_id)');
                    
                    // Restore data with is_active flag (first horse of each user becomes active)
                    const userFirstHorse = {};
                    existingHorses.forEach(horse => {
                        const isActive = !userFirstHorse[horse.user_id] ? 1 : 0;
                        if (!userFirstHorse[horse.user_id]) {
                            userFirstHorse[horse.user_id] = true;
                        }
                        
                        db.run(
                            'INSERT INTO user_horses (user_id, horse_name, sprite_key, skill_key, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [horse.user_id, horse.horse_name, horse.sprite_key, horse.skill_key, isActive, horse.created_at, horse.updated_at]
                        );
                    });
                    
                    console.log('✅ user_horses table recreated successfully');
                }
            } catch (e) {
                console.error('User horses migration error:', e);
            }
        }
    } catch (e) {
        console.error('User horses table migration error:', e);
    }
    
    // Migration for bets table - add user_horse_id
    try {
        const betCols = toObjects(db.exec('PRAGMA table_info(bets)'));
        const betColNames = betCols.map(c => c.name);
        
        if (!betColNames.includes('user_horse_id')) {
            db.run('ALTER TABLE bets ADD COLUMN user_horse_id INTEGER');
            console.log('✅ Added user_horse_id column to bets table');
        }
    } catch (e) {
        console.error('Bets migration error:', e);
    }
    
    // Migration for user_horses table - add label_color
    try {
        const horseCols = toObjects(db.exec('PRAGMA table_info(user_horses)'));
        const horseColNames = horseCols.map(c => c.name);
        
        if (!horseColNames.includes('label_color')) {
            db.run('ALTER TABLE user_horses ADD COLUMN label_color TEXT DEFAULT NULL');
            console.log('✅ Added label_color column to user_horses table');
        }
    } catch (e) {
        console.error('User horses label_color migration error:', e);
    }
    
    // Migration for races table - add preview_image
    try {
        const raceCols = toObjects(db.exec('PRAGMA table_info(races)'));
        const raceColNames = raceCols.map(c => c.name);
        
        if (!raceColNames.includes('preview_image')) {
            db.run('ALTER TABLE races ADD COLUMN preview_image TEXT DEFAULT NULL');
            console.log('✅ Added preview_image column to races table');
        }
        if (!raceColNames.includes('game_mode')) {
            db.run("ALTER TABLE races ADD COLUMN game_mode TEXT DEFAULT 'carrot'");
            console.log('✅ Added game_mode column to races table');
        }
        if (!raceColNames.includes('max_players')) {
            db.run('ALTER TABLE races ADD COLUMN max_players INTEGER DEFAULT 6');
            console.log('✅ Added max_players column to races table');
        }
        if (!raceColNames.includes('name')) {
            db.run('ALTER TABLE races ADD COLUMN name TEXT DEFAULT NULL');
            console.log('✅ Added name column to races table');
        }
        if (!raceColNames.includes('serial')) {
            db.run('ALTER TABLE races ADD COLUMN serial TEXT');
            console.log('✅ Added serial column to races table');
        }
    } catch (e) {
        console.error('Races migration error:', e);
    }
    
    // Save periodically
    setInterval(saveDatabase, 30000);
    
    console.log('✅ Database initialized successfully');
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// User operations
const userOps = {
    create: {
        run: (username, password, coins, facebookUrl = null, facebookName = null) => {
            db.run('INSERT INTO users (username, password, coins, facebook_url, facebook_name) VALUES (?, ?, ?, ?, ?)', [username, password, coins, facebookUrl, facebookName]);
            return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
        }
    },
    findByUsername: {
        get: (username) => toObjects(db.exec('SELECT id, username, password, coins, total_wins, total_races, last_login, last_daily_reward, is_admin, banned, avatar, facebook_url, facebook_name, created_at FROM users WHERE username = ?', [username]))[0]
    },
    findById: {
        get: (id) => toObjects(db.exec('SELECT id, username, coins, total_wins, total_races, last_login, last_daily_reward, is_admin, banned, avatar, facebook_url, facebook_name, created_at FROM users WHERE id = ?', [id]))[0]
    },
    getAll: {
        all: () => toObjects(db.exec('SELECT id, username, coins, total_wins, total_races, last_login, last_daily_reward, is_admin, banned, avatar, facebook_url, facebook_name, created_at FROM users ORDER BY created_at DESC'))
    },
    updateCoins: {
        run: (coins, id) => db.run('UPDATE users SET coins = ? WHERE id = ?', [coins, id])
    },
    addCoins: {
        run: (amount, id) => db.run('UPDATE users SET coins = coins + ? WHERE id = ?', [amount, id])
    },
    subtractCoins: {
        run: (amount, id) => db.run('UPDATE users SET coins = coins - ? WHERE id = ?', [amount, id])
    },
    delete: {
        run: (id) => db.run('DELETE FROM users WHERE id = ?', [id])
    },
    updateBanned: {
        run: (banned, id) => db.run('UPDATE users SET banned = ? WHERE id = ?', [banned, id])
    },
    updateLastLogin: {
        run: (date, id) => db.run('UPDATE users SET last_login = ? WHERE id = ?', [date, id])
    },
    updateDailyReward: {
        run: (date, amount, id) => db.run('UPDATE users SET last_daily_reward = ?, coins = coins + ? WHERE id = ?', [date, amount, id])
    },
    incrementWins: {
        run: (id) => db.run('UPDATE users SET total_wins = total_wins + 1, total_races = total_races + 1 WHERE id = ?', [id])
    },
    incrementRaces: {
        run: (id) => db.run('UPDATE users SET total_races = total_races + 1 WHERE id = ?', [id])
    },
    getLeaderboard: {
        all: () => toObjects(db.exec('SELECT id, username, coins, total_wins, total_races, avatar FROM users ORDER BY total_wins DESC, coins DESC LIMIT 50'))
    },
    updateAvatar: {
        run: (avatar, id) => db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, id])
    },
    updatePassword: {
        run: (hashedPassword, id) => db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id])
    }
};

// This file contains the updated raceOps section to add into database.js
// Copy this and replace the existing raceOps section

// This file contains the updated raceOps section to add into database.js
// Copy this and replace the existing raceOps section

// Helper function to generate next serial number
function generateRaceSerial(db) {
    const result = db.exec('SELECT serial FROM races WHERE serial IS NOT NULL ORDER BY id DESC LIMIT 1');
    
    if (!result.length || !result[0].values.length) {
        return 'LB-001';
    }
    
    const lastSerial = result[0].values[0][0];
    const match = lastSerial.match(/LB-(\d+)/);
    
    if (!match) {
        return 'LB-001';
    }
    
    const nextNum = parseInt(match[1], 10) + 1;
    return `LB-${String(nextNum).padStart(3, '0')}`;
}

// Race operations
const raceOps = {
    create: {
        run: (status, mapData, registrationStart, registrationEnd, createdBy, name = null, gameMode = 'carrot', maxPlayers = 6) => {
            const serial = generateRaceSerial(db);
            db.run(
                'INSERT INTO races (status, map_data, registration_start, registration_end, created_by, name, serial, game_mode, max_players) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [status, mapData, registrationStart, registrationEnd, createdBy, name, serial, gameMode, maxPlayers]
            );
            return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
        }
    },
    findById: {
        get: (id) => toObjects(db.exec('SELECT * FROM races WHERE id = ?', [id]))[0]
    },
    findActive: {
        all: () => toObjects(db.exec("SELECT * FROM races WHERE status IN ('waiting', 'registration', 'running') ORDER BY created_at DESC"))
    },
    findRecent: {
        all: () => toObjects(db.exec('SELECT * FROM races ORDER BY created_at DESC LIMIT 20'))
    },
    updateStatus: {
        run: (status, id) => db.run('UPDATE races SET status = ? WHERE id = ?', [status, id])
    },
    updateResults: {
        run: (results, raceEnd, id) => db.run("UPDATE races SET status = 'finished', results = ?, race_end = ? WHERE id = ?", [results, raceEnd, id])
    },
    updatePool: {
        run: (amount, id) => db.run('UPDATE races SET total_pool = total_pool + ? WHERE id = ?', [amount, id])
    },
    startRace: {
        run: (raceStart, id) => db.run("UPDATE races SET status = 'running', race_start = ? WHERE id = ?", [raceStart, id])
    },
    updateMapData: {
        run: (mapData, id) => db.run('UPDATE races SET map_data = ? WHERE id = ?', [mapData, id])
    },
    updateName: {
        run: (name, id) => db.run('UPDATE races SET name = ? WHERE id = ?', [name, id])
    },
    updateTotalPool: {
        run: (amount, id) => db.run('UPDATE races SET total_pool = ? WHERE id = ?', [amount, id])
    }
};


// Bet operations  
const betOps = {
    create: {
        run: (userId, raceId, userHorseId, horseName, horseSprite, horseColor, betAmount) => {
            db.run('INSERT INTO bets (user_id, race_id, user_horse_id, horse_name, horse_sprite, horse_color, bet_amount) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                [userId, raceId, userHorseId, horseName, horseSprite, horseColor, betAmount]);
            return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
        }
    },
    findByRace: {
        all: (raceId) => toObjects(db.exec('SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id WHERE b.race_id = ?', [raceId]))
    },
    findByUser: {
        all: (userId) => toObjects(db.exec('SELECT b.*, r.status as race_status FROM bets b JOIN races r ON b.race_id = r.id WHERE b.user_id = ? ORDER BY b.created_at DESC LIMIT 50', [userId]))
    },
    findByUserAndRace: {
        get: (userId, raceId) => toObjects(db.exec('SELECT * FROM bets WHERE user_id = ? AND race_id = ?', [userId, raceId]))[0]
    },
    findById: {
        get: (id) => toObjects(db.exec('SELECT * FROM bets WHERE id = ?', [id]))[0]
    },
    updateResult: {
        run: (position, payout, status, id) => db.run('UPDATE bets SET horse_position = ?, payout = ?, status = ? WHERE id = ?', [position, payout, status, id])
    },
    updatePosition: {
        run: (position, id) => db.run('UPDATE bets SET horse_position = ? WHERE id = ?', [position, id])
    },
    updatePayout: {
        run: (payout, status, id) => db.run('UPDATE bets SET payout = ?, status = ? WHERE id = ?', [payout, status, id])
    },
    refundBet: {
        run: (id) => db.run("UPDATE bets SET status = 'refunded', payout = bet_amount WHERE id = ?", [id])
    },
    updateBetAmount: {
        run: (newAmount, id) => db.run("UPDATE bets SET bet_amount = ? WHERE id = ?", [newAmount, id])
    }
};

// Transaction operations
const transactionOps = {
    create: {
        run: (...args) => db.run('INSERT INTO transactions (user_id, type, amount, balance_after, description, race_id) VALUES (?, ?, ?, ?, ?, ?)', args)
    },
    findByUser: {
        all: (userId) => toObjects(db.exec('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]))
    }
};

// User horse operations
const userHorseOps = {
    findByUserId: {
        all: (userId) => toObjects(db.exec('SELECT * FROM user_horses WHERE user_id = ? ORDER BY created_at DESC', [userId]))
    },
    findActiveByUserId: {
        get: (userId) => toObjects(db.exec('SELECT * FROM user_horses WHERE user_id = ? AND is_active = 1', [userId]))[0]
    },
    findById: {
        get: (id) => toObjects(db.exec('SELECT * FROM user_horses WHERE id = ?', [id]))[0]
    },
    countByUserId: {
        get: (userId) => {
            const result = toObjects(db.exec('SELECT COUNT(*) as count FROM user_horses WHERE user_id = ?', [userId]));
            return result[0]?.count || 0;
        }
    },
    create: {
        run: (userId, horseName, spriteKey, skillKey, labelColor = null, isActive = 0) => {
            db.run('INSERT INTO user_horses (user_id, horse_name, sprite_key, skill_key, label_color, is_active) VALUES (?, ?, ?, ?, ?, ?)', 
                [userId, horseName, spriteKey, skillKey, labelColor, isActive ? 1 : 0]);
            return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
        }
    },
    update: {
        run: (id, horseName, spriteKey, skillKey, labelColor = null) => {
            db.run('UPDATE user_horses SET horse_name = ?, sprite_key = ?, skill_key = ?, label_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [horseName, spriteKey, skillKey, labelColor, id]);
        }
    },
    setActive: {
        run: (userId, horseId) => {
            // Deactivate all horses for this user
            db.run('UPDATE user_horses SET is_active = 0 WHERE user_id = ?', [userId]);
            // Activate the selected horse
            db.run('UPDATE user_horses SET is_active = 1 WHERE id = ? AND user_id = ?', [horseId, userId]);
        }
    },
    delete: {
        run: (id) => db.run('DELETE FROM user_horses WHERE id = ?', [id])
    }
};

// Transaction wrapper
function transaction(fn) {
    return () => {
        db.run('BEGIN TRANSACTION');
        try {
            fn();
            db.run('COMMIT');
            saveDatabase();
        } catch (e) {
            db.run('ROLLBACK');
            throw e;
        }
    };
}

module.exports = {
    get db() { return db; },
    initDatabase,
    saveDatabase,
    userOps,
    raceOps,
    betOps,
    transactionOps,
    userHorseOps,
    transaction
};


