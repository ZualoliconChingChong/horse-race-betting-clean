-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    coins INTEGER DEFAULT 500,
    total_wins INTEGER DEFAULT 0,
    total_races INTEGER DEFAULT 0,
    last_login DATE,
    last_daily_reward DATE,
    is_admin INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT DEFAULT 'waiting', -- waiting, registration, running, finished, cancelled
    map_data TEXT, -- JSON string of map configuration
    registration_start DATETIME,
    registration_end DATETIME,
    race_start DATETIME,
    race_end DATETIME,
    results TEXT, -- JSON string of race results
    total_pool INTEGER DEFAULT 0,
    created_by INTEGER,`n    name TEXT DEFAULT NULL, -- Custom lobby name`n    serial TEXT, -- Auto-generated serial (LB-001, LB-002, ...),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bets/Entries table (each bet = one horse entry)
CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    user_horse_id INTEGER, -- Link to user's custom horse
    horse_name TEXT,
    horse_sprite TEXT,
    horse_color TEXT,
    bet_amount INTEGER NOT NULL,
    horse_position INTEGER, -- Final position (1st, 2nd, 3rd...)
    payout INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, won, lost, refunded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (race_id) REFERENCES races(id),
    FOREIGN KEY (user_horse_id) REFERENCES user_horses(id)
);

-- Transactions table (coin history)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- daily_reward, bet_placed, bet_won, bet_refund
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    race_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (race_id) REFERENCES races(id)
);

-- User horses table (each user can have multiple horses)
CREATE TABLE IF NOT EXISTS user_horses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    horse_name TEXT NOT NULL,
    sprite_key TEXT NOT NULL,
    skill_key TEXT NOT NULL,
    label_color TEXT DEFAULT NULL, -- Custom label color for horse name (hex)
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_race ON bets(race_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);
CREATE INDEX IF NOT EXISTS idx_user_horses_user ON user_horses(user_id);
