const express = require('express');
const bcrypt = require('bcryptjs');
const { userOps, transactionOps, db } = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

const DAILY_REWARD = parseInt(process.env.DAILY_REWARD) || 500;
const INITIAL_COINS = 500;

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, facebookUrl, facebookName } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        // Validate Facebook info (optional but recommended)
        if (facebookUrl && !facebookUrl.includes('facebook.com')) {
            return res.status(400).json({ error: 'URL Facebook không hợp lệ' });
        }

        // Check if username exists
        const existing = userOps.findByUsername.get(username);
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with Facebook info
        const result = userOps.create.run(username, hashedPassword, INITIAL_COINS, facebookUrl || null, facebookName || null);
        const userId = result.lastInsertRowid;

        // Record initial coins transaction
        transactionOps.create.run(
            userId,
            'registration_bonus',
            INITIAL_COINS,
            INITIAL_COINS,
            'Welcome bonus!',
            null
        );

        // Get user data
        const user = userOps.findById.get(userId);

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: user.id,
                username: user.username,
                coins: user.coins,
                total_wins: user.total_wins,
                total_races: user.total_races,
                is_admin: user.username === 'admin' ? 1 : (user.is_admin || 0),
                banned: user.banned || 0
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const user = userOps.findByUsername.get(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check ban status
        if (user.banned) {
            return res.status(403).json({ error: 'Account banned' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check daily reward
        const today = new Date().toISOString().split('T')[0];
        let dailyRewardGiven = false;
        let newCoins = user.coins;

        if (user.last_daily_reward !== today) {
            // Give daily reward
            userOps.updateDailyReward.run(today, DAILY_REWARD, user.id);
            newCoins = user.coins + DAILY_REWARD;
            dailyRewardGiven = true;

            // Record transaction
            transactionOps.create.run(
                user.id,
                'daily_reward',
                DAILY_REWARD,
                newCoins,
                'Daily login reward',
                null
            );
        }

        // Update last login
        userOps.updateLastLogin.run(new Date().toISOString(), user.id);

        // Generate token
        const token = generateToken(user);

        const responseUser = {
            id: user.id,
            username: user.username,
            coins: newCoins,
            total_wins: user.total_wins,
            total_races: user.total_races,
            is_admin: user.username === 'admin' ? 1 : (user.is_admin || 0),
            banned: user.banned || 0
        };

        console.log('Login response user:', responseUser);

        res.json({
            message: dailyRewardGiven 
                ? `Welcome back! You received ${DAILY_REWARD} coins!` 
                : 'Welcome back!',
            token,
            dailyReward: dailyRewardGiven ? DAILY_REWARD : 0,
            user: responseUser
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = userOps.findById.get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                coins: user.coins,
                total_wins: user.total_wins,
                total_races: user.total_races,
                is_admin: user.username === 'admin' ? 1 : (user.is_admin || 0),
                avatar: user.avatar,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

module.exports = router;
