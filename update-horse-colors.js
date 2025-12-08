// Random color generator (same as in horses.js)
function generateRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#F67280',
        '#C06C84', '#6C5B7B', '#355C7D', '#99B898', '#FECEAB',
        '#FF847C', '#E84A5F', '#2A363B', '#A8E6CF', '#FFD3B6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

console.log('=== Updating horses with white color to random colors ===\n');

// Get all horses
const Database = require('better-sqlite3');
const db = new Database('./db/database.sqlite');

const horses = db.prepare('SELECT * FROM user_horses WHERE label_color = ? OR label_color IS NULL').all('#FFFFFF');

console.log(`Found ${horses.length} horses with white/null color\n`);

const updateStmt = db.prepare('UPDATE user_horses SET label_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

horses.forEach(horse => {
    const newColor = generateRandomColor();
    updateStmt.run(newColor, horse.id);
    console.log(`✅ Updated horse ${horse.id} "${horse.horse_name}": ${horse.label_color || 'NULL'} → ${newColor}`);
});

db.close();

console.log(`\n✅ Updated ${horses.length} horses with random colors!`);
console.log('Now reload the editor page to see the new colors.');
