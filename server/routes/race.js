const express = require('express');
const { raceOps, betOps, userOps, transactionOps, saveDatabase } = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { calculatePayout, getPayoutStructure } = require('../utils/payout');

const router = express.Router();

const MIN_BET = parseInt(process.env.MIN_BET) || 500;
const MAX_HORSES = parseInt(process.env.MAX_HORSES_PER_RACE) || 12;
const MIN_HORSES = parseInt(process.env.MIN_HORSES_TO_START) || 2;

// Get active races (registration open or running)
router.get('/active', optionalAuth, (req, res) => {
    try {
        const races = raceOps.findActive.all();
        
        // Add participant count to each race
        const racesWithInfo = races.map(race => {
            const bets = betOps.findByRace.all(race.id);
            return {
                ...race,
                participants: bets.length,
                maxParticipants: MAX_HORSES,
                minBet: MIN_BET
            };
        });

        res.json({ races: racesWithInfo });
    } catch (error) {
        console.error('Get active races error:', error);
        res.status(500).json({ error: 'Failed to get races' });
    }
});

// Get recent races (history)
router.get('/history', (req, res) => {
    try {
        const races = raceOps.findRecent.all();
        res.json({ races });
    } catch (error) {
        console.error('Get race history error:', error);
        res.status(500).json({ error: 'Failed to get race history' });
    }
});

// Get race data for game (includes full horse data)
router.get('/:id/game-data', (req, res) => {
    try {
        const race = raceOps.findById.get(req.params.id);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        const bets = betOps.findByRace.all(race.id);
        const { userHorseOps } = require('../db/database');
        
        // Build horse customs array for game
        const horseCustoms = bets.map((bet, index) => {
            const userHorse = userHorseOps.findById.get(bet.user_horse_id);
            
            // Generate distinct colors for each horse
            const colors = [
                '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
                '#FF00FF', '#00FFFF', '#FFA500', '#800080',
                '#FFC0CB', '#A52A2A', '#808080', '#000080'
            ];
            const bodyColor = colors[index % colors.length];
            // Use user's custom label color or default to white
            const labelColor = userHorse?.label_color || '#FFFFFF';
            
            return {
                name: bet.horse_name || `Horse ${index + 1}`,
                sprite: userHorse ? {
                    key: userHorse.sprite_key,
                    scale: '1',
                    rotate: 'on',
                    outline: 'on',
                    outlineColor: '#000000',
                    outlineWidth: '2'
                } : null,
                body: bodyColor,
                label: labelColor, // Fallback for old field name
                label_color: labelColor, // New field for consistency
                skill: userHorse ? userHorse.skill_key : 'none',
                customSpeed: 1.0,
                customHP: 100,
                luck: 0,
                luckInterval: 1.0,
                betId: bet.id,
                userId: bet.user_id,
                username: bet.username
            };
        });

        res.json({
            raceId: race.id,
            status: race.status,
            horseCustoms,
            participants: bets.length,
            race: {
                ...race,
                map_data: race.map_data ? JSON.parse(race.map_data) : null
            }
        });
    } catch (error) {
        console.error('Get race game data error:', error);
        res.status(500).json({ error: 'Failed to get race data' });
    }
});

// Get payout structure for a specific bet amount and game mode
router.get('/payout/:mode/:amount', (req, res) => {
    try {
        const mode = req.params.mode;
        const amount = parseInt(req.params.amount) || 500;
        
        if (mode !== 'carrot' && mode !== 'survival') {
            return res.status(400).json({ error: 'Invalid game mode' });
        }
        
        const structure = getPayoutStructure(mode, amount);
        res.json({ mode, betAmount: amount, payouts: structure });
    } catch (error) {
        console.error('Get payout structure error:', error);
        res.status(500).json({ error: 'Failed to get payout structure' });
    }
});

// Get single race details
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const race = raceOps.findById.get(req.params.id);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        const bets = betOps.findByRace.all(race.id);
        
        // Get user horse details for label color and skill
        const { userHorseOps } = require('../db/database');
        
        // Hide bet amounts from other users if race is still open
        const participants = bets.map(bet => {
            const userHorse = userHorseOps.findById.get(bet.user_horse_id);
            
            return {
                bet_id: bet.id,
                username: bet.username,
                horse_name: bet.horse_name,
                horse_sprite: bet.horse_sprite,
                horse_color: bet.horse_color,
                horse_label_color: userHorse?.label_color || null,
                horse_skill: userHorse?.skill_key || null,
                bet_amount: bet.bet_amount, // Always show bet amount
                horse_position: bet.horse_position,
                payout: bet.payout,
                isCurrentUser: req.user ? bet.user_id === req.user.id : false
            };
        });

        res.json({
            race: {
                ...race,
                map_data: race.map_data ? JSON.parse(race.map_data) : null,
                results: race.results ? JSON.parse(race.results) : null
            },
            participants,
            minBet: MIN_BET,
            maxParticipants: MAX_HORSES
        });
    } catch (error) {
        console.error('Get race error:', error);
        res.status(500).json({ error: 'Failed to get race' });
    }
});

// Save race map config
router.post('/:id/config', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const { mapData, previewImage } = req.body;

        console.log('[Race Config] User:', req.user);
        console.log('[Race Config] is_admin:', req.user.is_admin);
        console.log('[Race Config] username:', req.user.username);
        console.log('[Race Config] Has preview image:', !!previewImage);

        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        // Allow admin OR race creator to update config
        const isAdmin = req.user.is_admin === 1 || req.user.username === 'admin';
        const isCreator = race.created_by === req.user.id;
        console.log('[Race Config] isAdmin:', isAdmin, 'isCreator:', isCreator);
        
        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'Only admin or race creator can edit config' });
        }

        // Update map data
        raceOps.updateMapData.run(JSON.stringify(mapData), raceId);
        
        // Update preview image if provided
        if (previewImage) {
            const { db } = require('../db/database');
            db.run('UPDATE races SET preview_image = ? WHERE id = ?', [previewImage, raceId]);
            console.log('[Race Config] ✅ Saved map preview image');
        }
        
        saveDatabase();

        res.json({ message: 'Map config saved successfully', hasPreview: !!previewImage });
    } catch (error) {
        console.error('Save config error:', error);
        res.status(500).json({ error: 'Failed to save config' });
    }
});

// Update race name (Admin or Creator)
router.put('/:id/name', authenticateToken, (req, res) => {
    try {
        const { name } = req.body;
        const raceId = parseInt(req.params.id, 10);
        
        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }
        
        // Check if user is admin or creator
        const { userOps } = require('../db/database');
        const currentUser = userOps.findById.get(req.user.id);
        const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.username === 'admin');
        const isCreator = race.created_by === req.user.id;
        
        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'Only admin or race creator can rename' });
        }
        
        // Update name
        raceOps.updateName.run(name || null, raceId);
        saveDatabase();
        
        const updatedRace = raceOps.findById.get(raceId);
        
        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('race:updated', { raceId, race: updatedRace });
        }
        
        res.json({ success: true, race: updatedRace });
    } catch (error) {
        console.error('Update race name error:', error);
        res.status(500).json({ error: 'Failed to update race name' });
    }
});

// Update bet amount (Player can change their bet)
router.put('/:id/bet', authenticateToken, (req, res) => {
    try {
        const { newAmount } = req.body;
        const raceId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        // Validate new amount
        if (!newAmount || newAmount < 100) {
            return res.status(400).json({ error: 'Số tiền cược tối thiểu là 100' });
        }

        // Get race
        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        // Only allow during registration
        if (race.status !== 'registration') {
            return res.status(400).json({ error: 'Chỉ có thể đổi cược khi đang đăng ký' });
        }

        // Get user's bet
        const existingBet = betOps.findByUserAndRace.get(userId, raceId);
        if (!existingBet) {
            return res.status(400).json({ error: 'Bạn chưa đăng ký race này' });
        }

        const oldAmount = existingBet.bet_amount;
        const difference = newAmount - oldAmount;

        // Get user
        const user = userOps.findById.get(userId);

        // Check if user has enough coins for increase
        if (difference > 0 && user.coins < difference) {
            return res.status(400).json({ error: `Không đủ tiền. Cần thêm ${difference.toLocaleString()} coins` });
        }

        // Update user coins
        const newBalance = user.coins - difference;
        userOps.updateCoins.run(newBalance, userId);

        // Update bet amount
        betOps.updateBetAmount.run(newAmount, existingBet.id);

        // Update race total pool
        const newTotalPool = (race.total_pool || 0) + difference;
        raceOps.updateTotalPool.run(newTotalPool, raceId);

        // Record transaction
        transactionOps.create.run(
            userId,
            difference > 0 ? 'bet_increase' : 'bet_decrease',
            Math.abs(difference),
            newBalance,
            difference > 0 
                ? `Tăng cược từ ${oldAmount.toLocaleString()} lên ${newAmount.toLocaleString()} (Race #${raceId})`
                : `Giảm cược từ ${oldAmount.toLocaleString()} xuống ${newAmount.toLocaleString()} (Race #${raceId})`,
            raceId
        );

        saveDatabase();

        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('race:bet_updated', { 
                raceId, 
                oderId: existingBet.id,
                userId,
                oldAmount,
                newAmount
            });
        }

        res.json({ 
            success: true, 
            oldAmount, 
            newAmount, 
            difference,
            newBalance
        });

    } catch (error) {
        console.error('Update bet error:', error);
        res.status(500).json({ error: 'Failed to update bet' });
    }
});

// Create a new race (any logged-in user can create, but only admin can start)
router.post('/create', authenticateToken, (req, res) => {
    try {
        const { mapData, registrationMinutes = 30, name = null, gameMode = 'carrot', maxPlayers = 6 } = req.body;

        const now = new Date();
        const registrationEnd = new Date(now.getTime() + registrationMinutes * 60 * 1000);

        const result = raceOps.create.run(
                'registration',
                mapData ? JSON.stringify(mapData) : null,
                now.toISOString(),
                registrationEnd.toISOString(),
                req.user.id,
                name,
                gameMode,
                Math.max(maxPlayers, 2) // Minimum 2 players, no max limit
            );

        const race = raceOps.findById.get(result.lastInsertRowid);

        // Broadcast to all connected clients
        const io = req.app.get('io');
        io.emit('race:created', {
            race: {
                ...race,
                participants: 0,
                maxParticipants: MAX_HORSES,
                minBet: MIN_BET
            }
        });

        res.status(201).json({
            message: 'Race created successfully!',
            race,
            registrationEndsAt: registrationEnd.toISOString()
        });
    } catch (error) {
        console.error('Create race error:', error);
        res.status(500).json({ error: 'Failed to create race' });
    }
});

// Join a race (place bet with custom horse)
router.post('/:id/join', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const { userHorseId, betAmount } = req.body;

        // Validate required fields
        if (!userHorseId) {
            return res.status(400).json({ error: 'Please select a horse to race' });
        }

        // Validate bet amount
        const amount = parseInt(betAmount);
        if (!amount || amount < MIN_BET) {
            return res.status(400).json({ error: `Minimum bet is ${MIN_BET} coins` });
        }

        // Get user's horse
        const { userHorseOps } = require('../db/database');
        const userHorse = userHorseOps.findById.get(userHorseId);
        if (!userHorse || userHorse.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Horse not found or not yours' });
        }

        // Get race
        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        if (race.status !== 'registration') {
            return res.status(400).json({ error: 'Race is not accepting registrations' });
        }

        // Check if user already joined
        const existingBet = betOps.findByUserAndRace.get(req.user.id, raceId);
        if (existingBet) {
            return res.status(400).json({ error: 'You already joined this race' });
        }

        // Check participant limit
        const currentBets = betOps.findByRace.all(raceId);
        if (currentBets.length >= MAX_HORSES) {
            return res.status(400).json({ error: 'Race is full' });
        }

        // Check user has enough coins
        const user = userOps.findById.get(req.user.id);
        if (user.coins < amount) {
            return res.status(400).json({ error: 'Not enough coins' });
        }

        // Deduct coins and create bet (transaction)
        const newBalance = user.coins - amount;
        
        // Deduct coins
        userOps.updateCoins.run(newBalance, req.user.id);
        
        // Create bet with user's custom horse
        betOps.create.run(
            req.user.id,
            raceId,
            userHorseId,
            userHorse.horse_name,
            userHorse.sprite_key,
            '#FF6B6B', // Default color for now
            amount
        );

        // Update race pool
        raceOps.updatePool.run(amount, raceId);

        // Record transaction
        transactionOps.create.run(
            req.user.id,
            'bet_placed',
            -amount,
            newBalance,
            `Bet on race #${raceId}`,
            raceId
        );
        
        // Save database
        saveDatabase();

        // Broadcast update
        const io = req.app.get('io');
        const updatedBets = betOps.findByRace.all(raceId);
        io.emit('race:updated', {
            raceId,
            participants: updatedBets.length,
            newParticipant: {
                username: user.username,
                horse_name: userHorse.horse_name,
                horse_sprite: userHorse.sprite_key,
                horse_color: '#FF6B6B'
            }
        });

        res.json({
            message: 'Joined race successfully!',
            newBalance,
            betAmount: amount
        });

    } catch (error) {
        console.error('Join race error:', error);
        res.status(500).json({ error: 'Failed to join race' });
    }
});

// Start a race (Admin)
router.post('/:id/start', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const race = raceOps.findById.get(raceId);

        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        if (race.status !== 'registration') {
            return res.status(400).json({ error: 'Race cannot be started' });
        }

        const bets = betOps.findByRace.all(raceId);
        if (bets.length < MIN_HORSES) {
            return res.status(400).json({ 
                error: `Need at least ${MIN_HORSES} participants to start` 
            });
        }

        // Start the race
        raceOps.startRace.run(new Date().toISOString(), raceId);

        // Broadcast race start
        const io = req.app.get('io');
        io.emit('race:started', {
            raceId,
            participants: bets.map(b => ({
                oderId: b.id,
                username: b.username,
                horse_name: b.horse_name,
                horse_sprite: b.horse_sprite,
                horse_color: b.horse_color
            })),
            mapData: race.map_data ? JSON.parse(race.map_data) : null
        });

        res.json({ message: 'Race started!', raceId });

    } catch (error) {
        console.error('Start race error:', error);
        res.status(500).json({ error: 'Failed to start race' });
    }
});

// End a race with results (called by game host)
router.post('/:id/finish', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const { results } = req.body; // Array of { oderId, position }

        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        if (race.status !== 'running') {
            return res.status(400).json({ error: 'Race is not running' });
        }

        const bets = betOps.findByRace.all(raceId);
        const gameMode = race.game_mode || 'carrot'; // Default to carrot mode
        
        for (const bet of bets) {
            const result = results.find(r => r.oderId === bet.id);
            const position = result ? result.position : bets.length;
            
            // Calculate payout based on game mode
            const totalPayout = calculatePayout(gameMode, position, bet.bet_amount, bets.length);
            const profit = totalPayout - bet.bet_amount;
            const status = profit > 0 ? 'won' : profit === 0 ? 'refunded' : 'lost';
            
            // Add/deduct coins to/from user
            const user = userOps.findById.get(bet.user_id);
            const newBalance = user.coins + totalPayout;
            userOps.updateCoins.run(newBalance, bet.user_id);
            
            // Record transaction
            const transactionType = profit > 0 ? 'bet_won' : profit === 0 ? 'bet_refund' : 'bet_lost';
            let description = '';
            if (gameMode === 'carrot') {
                description = position === 1 
                    ? `Won carrot race #${raceId} (1st place)` 
                    : `Lost carrot race #${raceId}`;
            } else {
                description = `Finished ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} in survival race #${raceId}`;
            }
            
            transactionOps.create.run(
                bet.user_id,
                transactionType,
                profit,
                newBalance,
                description,
                raceId
            );

            // Update user stats
            if (position === 1) {
                userOps.incrementWins.run(bet.user_id);
            } else {
                userOps.incrementRaces.run(bet.user_id);
            }

            // Update bet result
            betOps.updateResult.run(position, totalPayout, status, bet.id);
        }

        // Update race status
        raceOps.updateResults.run(
            JSON.stringify(results),
            new Date().toISOString(),
            raceId
        );
        
        // Save database
        saveDatabase();

        // Broadcast results
        const io = req.app.get('io');
        const finalBets = betOps.findByRace.all(raceId);
        io.emit('race:finished', {
            raceId,
            results: finalBets.map(b => ({
                username: b.username,
                horse_name: b.horse_name,
                position: b.horse_position,
                payout: b.payout,
                bet_amount: b.bet_amount
            })),
            totalPool
        });

        res.json({ 
            message: 'Race finished!', 
            results: finalBets 
        });

    } catch (error) {
        console.error('Finish race error:', error);
        res.status(500).json({ error: 'Failed to finish race' });
    }
});

// Cancel a race (refund all bets)
router.post('/:id/cancel', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const race = raceOps.findById.get(raceId);

        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        if (race.status === 'finished' || race.status === 'cancelled') {
            return res.status(400).json({ error: 'Race already ended' });
        }

        const bets = betOps.findByRace.all(raceId);

        // Refund all bets
        for (const bet of bets) {
            const user = userOps.findById.get(bet.user_id);
            const newBalance = user.coins + bet.bet_amount;
            
            userOps.updateCoins.run(newBalance, bet.user_id);
            betOps.refundBet.run(bet.id);
            
            transactionOps.create.run(
                bet.user_id,
                'bet_refund',
                bet.bet_amount,
                newBalance,
                `Refund for cancelled race #${raceId}`,
                raceId
            );
        }

        // Cancel race
        raceOps.updateStatus.run('cancelled', raceId);
        
        // Save database
        saveDatabase();

        // Broadcast cancellation
        const io = req.app.get('io');
        io.emit('race:cancelled', { raceId });

        res.json({ message: 'Race cancelled, all bets refunded' });

    } catch (error) {
        console.error('Cancel race error:', error);
        res.status(500).json({ error: 'Failed to cancel race' });
    }
});

// Submit race results from game
router.post('/:id/results', (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const { results } = req.body; // Array of { betId, position, finishTime }

        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        if (race.status === 'finished') {
            return res.status(400).json({ error: 'Race already finished' });
        }

        // Update race status
        raceOps.updateResults.run(
            JSON.stringify(results),
            new Date().toISOString(),
            raceId
        );

        // Update bets with positions
        results.forEach((result) => {
            betOps.updatePosition.run(result.position, result.betId);
        });

        // Calculate payouts (winner takes 70%, 2nd: 20%, 3rd: 10%)
        const totalPool = race.total_pool;
        const winner = results.find(r => r.position === 1);
        const second = results.find(r => r.position === 2);
        const third = results.find(r => r.position === 3);

        if (winner) {
            const payout = Math.floor(totalPool * 0.7);
            const bet = betOps.findById.get(winner.betId);
            if (bet) {
                betOps.updatePayout.run(payout, 'won', winner.betId);
                userOps.addCoins.run(payout, bet.user_id);
                const user = userOps.findById.get(bet.user_id);
                transactionOps.create.run(
                    bet.user_id,
                    'bet_won',
                    payout,
                    user.coins,
                    `Won race #${raceId} (1st place)`,
                    raceId
                );
                userOps.incrementWins.run(bet.user_id);
            }
        }

        if (second) {
            const payout = Math.floor(totalPool * 0.2);
            const bet = betOps.findById.get(second.betId);
            if (bet) {
                betOps.updatePayout.run(payout, 'won', second.betId);
                userOps.addCoins.run(payout, bet.user_id);
                const user = userOps.findById.get(bet.user_id);
                transactionOps.create.run(
                    bet.user_id,
                    'bet_won',
                    payout,
                    user.coins,
                    `Won race #${raceId} (2nd place)`,
                    raceId
                );
                userOps.incrementRaces.run(bet.user_id);
            }
        }

        if (third) {
            const payout = Math.floor(totalPool * 0.1);
            const bet = betOps.findById.get(third.betId);
            if (bet) {
                betOps.updatePayout.run(payout, 'won', third.betId);
                userOps.addCoins.run(payout, bet.user_id);
                const user = userOps.findById.get(bet.user_id);
                transactionOps.create.run(
                    bet.user_id,
                    'bet_won',
                    payout,
                    user.coins,
                    `Won race #${raceId} (3rd place)`,
                    raceId
                );
                userOps.incrementRaces.run(bet.user_id);
            }
        }

        // Mark others as lost
        const winnerIds = [winner?.betId, second?.betId, third?.betId].filter(Boolean);
        results.forEach((result) => {
            if (!winnerIds.includes(result.betId)) {
                betOps.updatePayout.run(0, 'lost', result.betId);
                const bet = betOps.findById.get(result.betId);
                if (bet) {
                    userOps.incrementRaces.run(bet.user_id);
                }
            }
        });

        saveDatabase();

        // Broadcast results
        const io = req.app.get('io');
        io.emit('race:finished', {
            raceId,
            results,
            totalPool
        });

        res.json({
            message: 'Results recorded successfully',
            totalPool,
            payouts: {
                first: winner ? Math.floor(totalPool * 0.7) : 0,
                second: second ? Math.floor(totalPool * 0.2) : 0,
                third: third ? Math.floor(totalPool * 0.1) : 0
            }
        });

    } catch (error) {
        console.error('Submit race results error:', error);
        res.status(500).json({ error: 'Failed to record results' });
    }
});

// Leave lobby (delete bet and refund)
router.delete('/:id/bet/:betId', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const betId = parseInt(req.params.betId);

        // Get race
        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        // Only allow leaving during registration
        if (race.status !== 'registration') {
            return res.status(400).json({ error: 'Cannot leave race after registration closes' });
        }

        // Get bet
        const { db } = require('../db/database');
        const betResult = db.exec('SELECT * FROM bets WHERE id = ? AND race_id = ?', [betId, raceId]);
        
        if (!betResult || !betResult.length || !betResult[0].values.length) {
            return res.status(404).json({ error: 'Bet not found' });
        }

        const bet = {};
        betResult[0].columns.forEach((col, i) => {
            bet[col] = betResult[0].values[0][i];
        });

        // Check if user is admin or bet owner
        const isAdmin = req.user.is_admin === 1 || req.user.username === 'admin';
        const isOwner = bet.user_id === req.user.id;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'This bet does not belong to you' });
        }

        // Refund coins to bet owner
        const betOwner = userOps.findById.get(bet.user_id);
        const newBalance = betOwner.coins + bet.bet_amount;
        userOps.updateCoins.run(newBalance, bet.user_id);

        // Update race pool
        const newPool = (race.total_pool || 0) - bet.bet_amount;
        raceOps.updatePool.run(-bet.bet_amount, raceId);

        // Delete bet
        db.run('DELETE FROM bets WHERE id = ?', [betId]);

        // Record transaction
        const transactionNote = isAdmin && !isOwner 
            ? `Kicked from Race #${raceId} by admin`
            : `Refund from Race #${raceId}`;
        
        transactionOps.create.run(
            bet.user_id,
            'bet_refund',
            bet.bet_amount,
            newBalance,
            transactionNote,
            raceId
        );

        // Save database
        saveDatabase();

        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('race:participant_left', {
                raceId,
                userId: bet.user_id,
                betId,
                kicked: isAdmin && !isOwner
            });
        }

        const message = isAdmin && !isOwner
            ? 'Player kicked and refunded'
            : 'Left race successfully and refunded bet';

        res.json({
            success: true,
            message,
            refundAmount: bet.bet_amount,
            newBalance
        });

    } catch (error) {
        console.error('Leave race error:', error);
        res.status(500).json({ error: 'Failed to leave race' });
    }
});

// Close/Cancel race lobby (Admin only)
router.post('/:id/close', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);

        // Check admin permission
        const isAdmin = req.user.is_admin === 1 || req.user.username === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Get race
        const race = raceOps.findById.get(raceId);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        // Only allow closing during registration
        if (race.status !== 'registration') {
            return res.status(400).json({ error: 'Can only close races in registration phase' });
        }

        // Get all bets for this race
        const { db } = require('../db/database');
        const betsResult = db.exec('SELECT * FROM bets WHERE race_id = ?', [raceId]);
        
        let refundedCount = 0;
        let totalRefunded = 0;

        if (betsResult && betsResult.length && betsResult[0].values.length) {
            const bets = betsResult[0].values.map(row => {
                const bet = {};
                betsResult[0].columns.forEach((col, i) => {
                    bet[col] = row[i];
                });
                return bet;
            });

            // Refund all participants
            bets.forEach(bet => {
                const user = userOps.findById.get(bet.user_id);
                const newBalance = user.coins + bet.bet_amount;
                userOps.updateCoins.run(newBalance, bet.user_id);

                // Record transaction
                transactionOps.create.run(
                    bet.user_id,
                    'bet_refund',
                    bet.bet_amount,
                    newBalance,
                    `Race #${raceId} cancelled by admin`,
                    raceId
                );

                refundedCount++;
                totalRefunded += bet.bet_amount;
            });

            // Delete all bets
            db.run('DELETE FROM bets WHERE race_id = ?', [raceId]);
        }

        // Update race status to cancelled and reset pool
        db.run('UPDATE races SET status = ?, total_pool = 0 WHERE id = ?', ['cancelled', raceId]);
        
        // Save database
        saveDatabase();

        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('race:cancelled', {
                raceId,
                refundedCount,
                totalRefunded
            });
        }

        res.json({
            success: true,
            message: `Race cancelled. Refunded ${refundedCount} participants.`,
            refundedCount,
            totalRefunded
        });

    } catch (error) {
        console.error('Close race error:', error);
        res.status(500).json({ error: 'Failed to close race' });
    }
});

module.exports = router;



