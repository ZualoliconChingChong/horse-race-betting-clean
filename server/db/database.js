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
        run: (...args) => {
            db.run('INSERT INTO users (username, password, coins) VALUES (?, ?, ?)', args);
            return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
        }
    },
    findByUsername: {
        get: (username) => toObjects(db.exec('SELECT * FROM users WHERE username = ?', [username]))[0]
    },
    findById: {
        get: (id) => toObjects(db.exec('SELECT id, username, coins, total_wins, total_races, last_login, created_at FROM users WHERE id = ?', [id]))[0]
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
        all: () => toObjects(db.exec('SELECT id, username, coins, total_wins, total_races FROM users ORDER BY total_wins DESC, coins DESC LIMIT 50'))
    }
};

// Race operations
const raceOps = {
    create: {
        run: (...args) => {
            db.run('INSERT INTO races (status, map_data, registration_start, registration_end, created_by) VALUES (?, ?, ?, ?, ?)', args);
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
    }
};

// Bet operations  
const betOps = {
    create: {
        run: (...args) => {
            db.run('INSERT INTO bets (user_id, race_id, horse_name, horse_sprite, horse_color, bet_amount) VALUES (?, ?, ?, ?, ?, ?)', args);
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
    updateResult: {
        run: (position, payout, status, id) => db.run('UPDATE bets SET horse_position = ?, payout = ?, status = ? WHERE id = ?', [position, payout, status, id])
    },
    refundBet: {
        run: (id) => db.run("UPDATE bets SET status = 'refunded', payout = bet_amount WHERE id = ?", [id])
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
    transaction
};
