const express = require('express');
const bcrypt = require('bcryptjs');
const { userOps, betOps, transactionOps } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = userOps.findById.get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            coins: user.coins,
            total_wins: user.total_wins,
            total_races: user.total_races,
            is_admin: user.is_admin || 0,
            banned: user.banned || 0,
            avatar: user.avatar,
            created_at: user.created_at
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Get user's bet history
router.get('/bets', authenticateToken, (req, res) => {
    try {
        const bets = betOps.findByUser.all(req.user.id);
        res.json({ bets });
    } catch (error) {
        console.error('Get bets error:', error);
        res.status(500).json({ error: 'Failed to get bet history' });
    }
});

// Get user's transaction history
router.get('/transactions', authenticateToken, (req, res) => {
    try {
        const transactions = transactionOps.findByUser.all(req.user.id);
        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transaction history' });
    }
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
    try {
        const leaderboard = userOps.getLeaderboard.all();
        res.json({ leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// Change password (self-service)
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters' });
        }

        const user = userOps.findByUsername.get(req.user.username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        userOps.updatePassword.run(hashed, user.id);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Update avatar
router.post('/avatar', authenticateToken, (req, res) => {
    try {
        const { avatar } = req.body || {};

        if (typeof avatar !== 'string' || avatar.length === 0 || avatar.length > 32) {
            return res.status(400).json({ error: 'Invalid avatar' });
        }

        userOps.updateAvatar.run(avatar, req.user.id);
        const updated = userOps.findById.get(req.user.id);

        res.json({ success: true, avatar: updated.avatar });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

module.exports = router;
