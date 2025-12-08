const express = require('express');
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

module.exports = router;
