const express = require('express');
const fs = require('fs');
const path = require('path');
const { userHorseOps, userOps, transactionOps } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Load sprite list from game assets
let SPRITE_PRESETS = [];
try {
    const listPath = path.join(__dirname, '../../web/public/assets/horses/list.js');
    if (fs.existsSync(listPath)) {
        const listContent = fs.readFileSync(listPath, 'utf8');
        // Extract array from window.horseSpriteList = [...]
        const match = listContent.match(/window\.horseSpriteList\s*=\s*\[([\s\S]*?)\];/);
        if (match && match[1]) {
            const spriteFiles = match[1]
                .split(',')
                .map(s => s.trim().replace(/['"]/g, ''))
                .filter(s => s && s.endsWith('.png'));
            
            // Convert to sprite preset format
            SPRITE_PRESETS = spriteFiles.map((filename, index) => ({
                key: filename.replace('.png', ''),
                name: `Sprite #${index + 1}`,
                path: `/assets/horses/${filename}`
            }));
        }
    }
} catch (err) {
    console.error('Failed to load sprite list:', err);
}

// Fallback to a few defaults if list.js failed to load
if (SPRITE_PRESETS.length === 0) {
    SPRITE_PRESETS = [
        { key: 'default', name: 'Default', path: '/assets/horses/default.png' }
    ];
}

// Horse skills - load dynamically from shared config
let SKILL_PRESETS = [];
const skillsPath = path.join(__dirname, '../../shared/skills.json');

function loadSkillPresets() {
    try {
        if (fs.existsSync(skillsPath)) {
            const content = fs.readFileSync(skillsPath, 'utf8');
            SKILL_PRESETS = JSON.parse(content);
            console.log(`✅ Loaded ${SKILL_PRESETS.length} skills from skills.json`);
        }
    } catch (err) {
        console.error('Failed to load skills.json:', err);
    }
    
    // Fallback if file not found
    if (SKILL_PRESETS.length === 0) {
        SKILL_PRESETS = [
            { key: 'none', name: 'Không có skill', nameEn: 'None' }
        ];
    }
}

// Load initially
loadSkillPresets();

// Watch for changes and auto-reload
fs.watch(skillsPath, (eventType) => {
    if (eventType === 'change') {
        console.log('🔄 skills.json changed, reloading...');
        loadSkillPresets();
    }
});

// Get available sprite and skill options
router.get('/options', (req, res) => {
    try {
        res.json({
            sprites: SPRITE_PRESETS,
            skills: SKILL_PRESETS
        });
    } catch (error) {
        console.error('Get horse options error:', error);
        res.status(500).json({ error: 'Failed to get horse options' });
    }
});

// Get all user's horses
router.get('/my', authenticateToken, (req, res) => {
    try {
        const horses = userHorseOps.findByUserId.all(req.user.id);
        const activeHorse = horses.find(h => h.is_active === 1) || null;
        
        res.json({ 
            horses,
            activeHorse,
            count: horses.length
        });
    } catch (error) {
        console.error('Get user horses error:', error);
        res.status(500).json({ error: 'Failed to get user horses' });
    }
});

// Helper to generate random bright color
function generateRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#F67280',
        '#C06C84', '#6C5B7B', '#355C7D', '#99B898', '#FECEAB',
        '#FF847C', '#E84A5F', '#2A363B', '#A8E6CF', '#FFD3B6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Create new horse (with fee after first one)
router.post('/my', authenticateToken, (req, res) => {
    try {
        const { horseName, spriteKey, skillKey, labelColor } = req.body || {};

        // Validation
        if (!horseName || typeof horseName !== 'string' || horseName.length < 1 || horseName.length > 30) {
            return res.status(400).json({ error: 'Horse name must be 1-30 characters' });
        }

        if (!spriteKey || typeof spriteKey !== 'string') {
            return res.status(400).json({ error: 'Sprite key is required' });
        }

        const validSpriteKeys = SPRITE_PRESETS.map(s => s.key);
        if (!validSpriteKeys.includes(spriteKey)) {
            return res.status(400).json({ error: 'Invalid sprite key' });
        }

        if (!skillKey || typeof skillKey !== 'string') {
            return res.status(400).json({ error: 'Skill key is required' });
        }

        const validSkillKeys = SKILL_PRESETS.map(s => s.key);
        if (!validSkillKeys.includes(skillKey)) {
            return res.status(400).json({ error: 'Invalid skill key' });
        }
        
        // Validate label color or generate random one
        let finalLabelColor = labelColor;
        if (labelColor) {
            // Validate hex color format
            if (!/^#[0-9A-F]{6}$/i.test(labelColor)) {
                return res.status(400).json({ error: 'Invalid color format (use #RRGGBB)' });
            }
            console.log('[Horses] Using custom label color:', finalLabelColor);
        } else {
            // Generate random bright color if not provided
            finalLabelColor = generateRandomColor();
            console.log('[Horses] Generated random label color:', finalLabelColor);
        }

        // Check how many horses user has
        const horseCount = userHorseOps.countByUserId.get(req.user.id);
        const CREATION_FEE = 100; // Fee for creating horse after first one
        
        // If not first horse, charge fee
        if (horseCount > 0) {
            const user = userOps.findById.get(req.user.id);
            if (user.coins < CREATION_FEE) {
                return res.status(400).json({ 
                    error: `Không đủ coins. Cần ${CREATION_FEE} coins để tạo ngựa mới.`,
                    required: CREATION_FEE,
                    current: user.coins
                });
            }
            // Deduct fee
            userOps.updateCoins.run(user.coins - CREATION_FEE, req.user.id);
            transactionOps.create.run(
                req.user.id,
                'horse_creation',
                -CREATION_FEE,
                user.coins - CREATION_FEE,
                `Created horse: ${horseName}`,
                null
            );
        }

        // Create new horse (active if it's the first one)
        const isFirstHorse = horseCount === 0;
        const result = userHorseOps.create.run(req.user.id, horseName, spriteKey, skillKey, finalLabelColor, isFirstHorse);
        
        const newHorse = userHorseOps.findById.get(result.lastInsertRowid);
        const horses = userHorseOps.findByUserId.all(req.user.id);
        
        res.json({ 
            success: true, 
            horse: newHorse,
            horses,
            message: horseCount === 0 ? 'Ngựa đầu tiên tạo miễn phí!' : `Đã tạo ngựa mới (-${CREATION_FEE} coins)`,
            charged: horseCount > 0 ? CREATION_FEE : 0
        });

    } catch (error) {
        console.error('Create horse error:', error);
        res.status(500).json({ error: 'Failed to create horse' });
    }
});

// Update existing horse
router.put('/my/:id', authenticateToken, (req, res) => {
    try {
        const horseId = parseInt(req.params.id, 10);
        const { horseName, spriteKey, skillKey, labelColor } = req.body || {};

        // Validation
        if (!horseName || typeof horseName !== 'string' || horseName.length < 1 || horseName.length > 30) {
            return res.status(400).json({ error: 'Horse name must be 1-30 characters' });
        }

        const validSpriteKeys = SPRITE_PRESETS.map(s => s.key);
        if (!validSpriteKeys.includes(spriteKey)) {
            return res.status(400).json({ error: 'Invalid sprite key' });
        }

        const validSkillKeys = SKILL_PRESETS.map(s => s.key);
        if (!validSkillKeys.includes(skillKey)) {
            return res.status(400).json({ error: 'Invalid skill key' });
        }
        
        // Validate label color
        let finalLabelColor = labelColor;
        if (labelColor) {
            if (!/^#[0-9A-F]{6}$/i.test(labelColor)) {
                return res.status(400).json({ error: 'Invalid color format (use #RRGGBB)' });
            }
            console.log('[Horses] Updating with custom label color:', finalLabelColor);
        } else {
            console.log('[Horses] Updating without color (will keep existing or set to null)');
        }

        const horse = userHorseOps.findById.get(horseId);
        if (!horse || horse.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Horse not found' });
        }

        userHorseOps.update.run(horseId, horseName, spriteKey, skillKey, finalLabelColor);
        
        const updatedHorse = userHorseOps.findById.get(horseId);
        res.json({ 
            success: true, 
            horse: updatedHorse,
            message: 'Đã cập nhật ngựa'
        });

    } catch (error) {
        console.error('Update horse error:', error);
        res.status(500).json({ error: 'Failed to update horse' });
    }
});

// Set active horse
router.post('/my/:id/activate', authenticateToken, (req, res) => {
    try {
        const horseId = parseInt(req.params.id, 10);
        
        const horse = userHorseOps.findById.get(horseId);
        if (!horse || horse.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Horse not found' });
        }

        userHorseOps.setActive.run(req.user.id, horseId);
        
        const horses = userHorseOps.findByUserId.all(req.user.id);
        const activeHorse = horses.find(h => h.is_active === 1);
        
        res.json({ 
            success: true,
            activeHorse,
            horses,
            message: `Đã chọn ${activeHorse.horse_name} làm ngựa chính`
        });

    } catch (error) {
        console.error('Set active horse error:', error);
        res.status(500).json({ error: 'Failed to set active horse' });
    }
});

// Delete horse
router.delete('/my/:id', authenticateToken, (req, res) => {
    try {
        const horseId = parseInt(req.params.id, 10);
        
        const horse = userHorseOps.findById.get(horseId);
        if (!horse || horse.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Horse not found' });
        }

        // Don't allow deleting if it's the only horse
        const horseCount = userHorseOps.countByUserId.get(req.user.id);
        if (horseCount === 1) {
            return res.status(400).json({ error: 'Không thể xóa ngựa duy nhất' });
        }

        userHorseOps.delete.run(horseId);
        
        // If deleted horse was active, activate another one
        if (horse.is_active === 1) {
            const remaining = userHorseOps.findByUserId.all(req.user.id);
            if (remaining.length > 0) {
                userHorseOps.setActive.run(req.user.id, remaining[0].id);
            }
        }
        
        const horses = userHorseOps.findByUserId.all(req.user.id);
        res.json({ 
            success: true,
            horses,
            message: 'Đã xóa ngựa'
        });

    } catch (error) {
        console.error('Delete horse error:', error);
        res.status(500).json({ error: 'Failed to delete horse' });
    }
});

// ADMIN/DEV: Update all white horses with random colors
router.post('/update-white-colors', authenticateToken, (req, res) => {
    try {
        const { db, saveDatabase } = require('../db/database');
        
        // Get horses with white or null color
        const result = db.exec('SELECT * FROM user_horses WHERE label_color = ? OR label_color IS NULL', ['#FFFFFF']);
        
        if (!result || !result.length) {
            return res.json({ message: 'No horses to update', count: 0, horses: [] });
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
        saveDatabase();
        
        res.json({
            success: true,
            message: `Updated ${updated.length} horses with random colors`,
            count: updated.length,
            horses: updated
        });
        
    } catch (error) {
        console.error('Update white colors error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
