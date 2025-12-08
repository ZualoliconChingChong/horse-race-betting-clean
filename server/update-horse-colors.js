const database = require('./db/database');

// Random color generator (same as in routes/horses.js)
function generateRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#F67280',
        '#C06C84', '#6C5B7B', '#355C7D', '#99B898', '#FECEAB',
        '#FF847C', '#E84A5F', '#2A363B', '#A8E6CF', '#FFD3B6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function toObjects(result) {
    if (!result || !result.length) return [];
    const [{ columns, values }] = result;
    return values.map(row => {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
    });
}

async function updateColors() {
    console.log('=== Updating horses with white color to random colors ===\n');
    
    // Initialize database
    await database.initDatabase();
    
    // Get db after init
    const db = database.db;
    
    // Get all horses with white or null color
    const horses = toObjects(db.exec('SELECT * FROM user_horses WHERE label_color = ? OR label_color IS NULL', ['#FFFFFF']));
    
    console.log(`Found ${horses.length} horses with white/null color\n`);
    
    if (horses.length === 0) {
        console.log('No horses need updating!');
        return;
    }
    
    // Update each horse with random color
    horses.forEach(horse => {
        const newColor = generateRandomColor();
        db.run('UPDATE user_horses SET label_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newColor, horse.id]);
        console.log(`✅ Updated horse ${horse.id} "${horse.horse_name}": ${horse.label_color || 'NULL'} → ${newColor}`);
    });
    
    // Save database
    database.saveDatabase();
    
    console.log(`\n✅ Updated ${horses.length} horses with random colors!`);
    console.log('Now reload the editor page to see the new colors.');
}

updateColors().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
