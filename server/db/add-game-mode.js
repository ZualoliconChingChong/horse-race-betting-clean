const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'horse_betting.db');

async function migrate() {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    console.log('➕ Adding game_mode column to races table...');
    
    try {
        // Check if column exists
        const tableInfo = db.exec('PRAGMA table_info(races)');
        const hasGameMode = tableInfo[0]?.values.some(row => row[1] === 'game_mode');
        
        if (!hasGameMode) {
            db.run("ALTER TABLE races ADD COLUMN game_mode TEXT DEFAULT 'carrot'");
            console.log('✅ game_mode column added');
        } else {
            console.log('⏭️  game_mode column already exists');
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
