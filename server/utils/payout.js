/**
 * Calculate dynamic multiplier for survival mode based on position and total players
 * 
 * @param {number} position - Player's position (1-based)
 * @param {number} totalPlayers - Total number of players
 * @returns {number} Multiplier (0.0 to 5.0)
 */
function getSurvivalMultiplier(position, totalPlayers) {
    const N = totalPlayers;
    
    // Edge case: only 1 player
    if (N <= 1) return 5.0;
    
    // 1st place (winner): always 5x
    if (position === 1) return 5.0;
    
    // Last place: always 0x (total loss)
    if (position >= N) return 0.0;
    
    // 2 players: winner 5x, loser 0x
    if (N === 2) return 0.0;
    
    // 3 players: 1st=5x, 2nd=0.9x (middle), 3rd=0x
    if (N === 3 && position === 2) return 0.9;
    
    // 4+ players: interpolate from 1.6x (2nd) to 0.2x (N-1th)
    // Position 2 → mult = 1.6
    // Position N-1 → mult = 0.2
    const startMult = 1.6;
    const endMult = 0.2;
    const ratio = (position - 2) / (N - 3);
    const multiplier = startMult - ratio * (startMult - endMult);
    
    return Math.max(0, multiplier);
}

/**
 * Calculate payout for race based on game mode (PERCENTAGE-BASED + DYNAMIC SCALING)
 * 
 * @param {string} mode - 'carrot' or 'survival'
 * @param {number} position - Player's finish position (1-based)
 * @param {number} betAmount - Amount player bet
 * @param {number} totalPlayers - Total number of players
 * @returns {number} Payout amount (total amount to return to player)
 */
function calculatePayout(mode, position, betAmount, totalPlayers) {
    if (mode === 'carrot') {
        // 🥕 CARROT MODE: Winner takes 5x, Losers get 60% back
        // Winner: 500% (profit 400%)
        // Losers: 60% (loss 40%)
        if (position === 1) {
            return Math.floor(betAmount * 5); // 5x bet (400% profit)
        } else {
            return Math.floor(betAmount * 0.6); // 60% back (40% loss)
        }
    } else if (mode === 'survival') {
        // ⚔️ SURVIVAL MODE: Dynamic scaling based on total players
        const multiplier = getSurvivalMultiplier(position, totalPlayers);
        return Math.floor(betAmount * multiplier);
    }
    
    // Default fallback
    return 0;
}

/**
 * Get payout structure for display to users (DYNAMIC SCALING)
 * 
 * @param {string} mode - 'carrot' or 'survival'
 * @param {number} betAmount - Amount player is betting
 * @param {number} totalPlayers - Total number of players (for survival mode)
 * @returns {Array} Array of payout info for each position
 */
function getPayoutStructure(mode, betAmount, totalPlayers = 6) {
    if (mode === 'carrot') {
        const winnerPayout = Math.floor(betAmount * 5);
        const loserPayout = Math.floor(betAmount * 0.6);
        
        return [
            { 
                position: 1, 
                label: 'Winner (ăn cà rốt)', 
                payout: winnerPayout, 
                profit: winnerPayout - betAmount, 
                percentage: 400 
            },
            { 
                position: 'Others', 
                label: 'Losers', 
                payout: loserPayout, 
                profit: loserPayout - betAmount, 
                percentage: -40 
            }
        ];
    } else if (mode === 'survival') {
        // Dynamic generation based on totalPlayers
        const N = Math.max(2, totalPlayers);
        const result = [];
        
        for (let pos = 1; pos <= N; pos++) {
            const mult = getSurvivalMultiplier(pos, N);
            const payout = Math.floor(betAmount * mult);
            const profit = payout - betAmount;
            const percentage = Math.round((mult - 1) * 100);
            
            let label = '';
            if (pos === 1) label = 'Survivor (sống sót)';
            else if (pos === 2) label = 'Chết cuối';
            else if (pos === N) label = 'Chết đầu';
            
            result.push({
                position: pos,
                label: label,
                payout: payout,
                profit: profit,
                percentage: percentage,
                multiplier: mult
            });
        }
        
        return result;
    }
    
    return [];
}

module.exports = {
    calculatePayout,
    getPayoutStructure,
    getSurvivalMultiplier
};
