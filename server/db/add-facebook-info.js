const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'horse_betting.db');

async function migrate() {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    console.log('➕ Adding Facebook info columns to users table...');
    
    try {
        // Check if columns exist
        const tableInfo = db.exec('PRAGMA table_info(users)');
        const columns = tableInfo[0]?.values.map(row => row[1]) || [];
        
        if (!columns.includes('facebook_url')) {
            db.run("ALTER TABLE users ADD COLUMN facebook_url TEXT");
            console.log('✅ facebook_url column added');
        } else {
            console.log('⏭️  facebook_url column already exists');
        }
        
        if (!columns.includes('facebook_name')) {
            db.run("ALTER TABLE users ADD COLUMN facebook_name TEXT");
            console.log('✅ facebook_name column added');
        } else {
            console.log('⏭️  facebook_name column already exists');
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
