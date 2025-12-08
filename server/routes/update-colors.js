const express = require('express');
const router = express.Router();
const { userHorseOps } = require('../db/database');

// Random color generator
function generateRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#F67280',
        '#C06C84', '#6C5B7B', '#355C7D', '#99B898', '#FECEAB',
        '#FF847C', '#E84A5F', '#2A363B', '#A8E6CF', '#FFD3B6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Update all white horses with random colors
router.post('/update-white-horses', (req, res) => {
    try {
        const { db } = require('../db/database');
        
        // Get horses with white or null color
        const result = db.exec('SELECT * FROM user_horses WHERE label_color = ? OR label_color IS NULL', ['#FFFFFF']);
        
        if (!result || !result.length) {
            return res.json({ message: 'No horses to update', count: 0 });
        }
        
        const [{ columns, values }] = result;
        const horses = values.map(row => {
            const obj = {};
            columns.forEach((col, i) => obj[col] = row[i]);
            return obj;
        });
        
        // Update each horse
        const updated = [];
        horses.forEach(horse => {
            const newColor = generateRandomColor();
            db.run('UPDATE user_horses SET label_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newColor, horse.id]);
            updated.push({
                id: horse.id,
                name: horse.horse_name,
                oldColor: horse.label_color || 'NULL',
                newColor
            });
        });
        
        // Save database
        const { saveDatabase } = require('../db/database');
        saveDatabase();
        
        res.json({
            success: true,
            message: `Updated ${updated.length} horses with random colors`,
            horses: updated
        });
        
    } catch (error) {
        console.error('Update colors error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
