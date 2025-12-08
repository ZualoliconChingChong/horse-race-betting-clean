// Migration script to add name and serial columns to races table
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

async function migrate() {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, 'horse_betting.db');
    
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Database not found');
        return;
    }
    
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);
    
    try {
        // Check if columns already exist
        const tableInfo = db.exec('PRAGMA table_info(races)');
        const columns = tableInfo[0]?.values.map(row => row[1]) || [];
        
        if (!columns.includes('name')) {
            console.log('➕ Adding name column...');
            db.run('ALTER TABLE races ADD COLUMN name TEXT DEFAULT NULL');
        }
        
        if (!columns.includes('serial')) {
            console.log('➕ Adding serial column...');
            db.run('ALTER TABLE races ADD COLUMN serial TEXT');
        }
        
        // Generate serials for existing races
        const races = db.exec('SELECT id FROM races ORDER BY id ASC');
        if (races.length > 0 && races[0].values.length > 0) {
            console.log('🔢 Generating serials for existing races...');
            races[0].values.forEach((row, index) => {
                const raceId = row[0];
                const serial = `LB-${String(index + 1).padStart(3, '0')}`;
                db.run('UPDATE races SET serial = ? WHERE id = ?', [serial, raceId]);
            });
        }
        
        // Save database
        const data = db.export();
        fs.writeFileSync(dbPath, data);
        
        console.log('✅ Migration completed successfully!');
        db.close();
    } catch (error) {
        console.error('❌ Migration error:', error);
        db.close();
        process.exit(1);
    }
}

migrate();
