const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'horse_betting.db');

async function migrate() {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    console.log('➕ Adding max_players column to races table...');
    
    try {
        // Check if column exists
        const tableInfo = db.exec('PRAGMA table_info(races)');
        const hasMaxPlayers = tableInfo[0]?.values.some(row => row[1] === 'max_players');
        
        if (!hasMaxPlayers) {
            db.run("ALTER TABLE races ADD COLUMN max_players INTEGER DEFAULT 6");
            console.log('✅ max_players column added');
        } else {
            console.log('⏭️  max_players column already exists');
        }
        
        // Save database
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
        
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    
    db.close();
}

migrate();
