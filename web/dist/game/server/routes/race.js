const express = require('express');
const { raceOps, betOps, userOps, transactionOps, saveDatabase } = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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

// Get single race details
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const race = raceOps.findById.get(req.params.id);
        if (!race) {
            return res.status(404).json({ error: 'Race not found' });
        }

        const bets = betOps.findByRace.all(race.id);
        
        // Hide bet amounts from other users if race is still open
        const participants = bets.map(bet => ({
            id: bet.id,
            username: bet.username,
            horse_name: bet.horse_name,
            horse_sprite: bet.horse_sprite,
            horse_color: bet.horse_color,
            bet_amount: race.status === 'finished' ? bet.bet_amount : undefined,
            horse_position: bet.horse_position,
            payout: bet.payout,
            isCurrentUser: req.user ? bet.user_id === req.user.id : false
        }));

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

// Create a new race (Admin only for now - later add admin check)
router.post('/create', authenticateToken, (req, res) => {
    try {
        const { mapData, registrationMinutes = 30 } = req.body;

        const now = new Date();
        const registrationEnd = new Date(now.getTime() + registrationMinutes * 60 * 1000);

        const result = raceOps.create.run(
            'registration',
            mapData ? JSON.stringify(mapData) : null,
            now.toISOString(),
            registrationEnd.toISOString(),
            req.user.id
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

// Join a race (place bet)
router.post('/:id/join', authenticateToken, (req, res) => {
    try {
        const raceId = parseInt(req.params.id);
        const { horseName, horseSprite, horseColor, betAmount } = req.body;

        // Validate bet amount
        const amount = parseInt(betAmount);
        if (!amount || amount < MIN_BET) {
            return res.status(400).json({ error: `Minimum bet is ${MIN_BET} coins` });
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
        
        // Create bet
        betOps.create.run(
            req.user.id,
            raceId,
            horseName || `Horse #${currentBets.length + 1}`,
            horseSprite || 'default',
            horseColor || '#FF6B6B',
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
                horse_name: horseName || `Horse #${currentBets.length + 1}`,
                horse_color: horseColor || '#FF6B6B'
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
        const totalPool = race.total_pool;
        
        // Calculate payouts (50% for 1st, 30% for 2nd, 15% for 3rd, 5% house)
        const payoutRatios = [0.50, 0.30, 0.15];
        
        for (const bet of bets) {
            const result = results.find(r => r.oderId === bet.id);
            const position = result ? result.position : bets.length;
            
            let payout = 0;
            let status = 'lost';

            if (position <= 3) {
                payout = Math.floor(totalPool * payoutRatios[position - 1]);
                status = 'won';
                
                // Add coins to user
                const user = userOps.findById.get(bet.user_id);
                const newBalance = user.coins + payout;
                userOps.updateCoins.run(newBalance, bet.user_id);
                
                // Record transaction
                transactionOps.create.run(
                    bet.user_id,
                    'bet_won',
                    payout,
                    newBalance,
                    `Won ${position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'} place in race #${raceId}`,
                    raceId
                );

                // Update user stats
                if (position === 1) {
                    userOps.incrementWins.run(bet.user_id);
                } else {
                    userOps.incrementRaces.run(bet.user_id);
                }
            } else {
                userOps.incrementRaces.run(bet.user_id);
            }

            // Update bet result
            betOps.updateResult.run(position, payout, status, bet.id);
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

module.exports = router;
