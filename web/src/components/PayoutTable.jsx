import { Trophy, TrendingUp, TrendingDown } from 'lucide-react'

// Icons for positions
const POSITION_ICONS = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '⬇️', '💀']

/**
 * Calculate dynamic multiplier for survival mode (same logic as backend)
 */
function getSurvivalMultiplier(position, totalPlayers) {
  const N = totalPlayers
  
  if (N <= 1) return 5.0
  if (position === 1) return 5.0
  if (position >= N) return 0.0
  if (N === 2) return 0.0
  if (N === 3 && position === 2) return 0.9
  
  // 4+ players: interpolate from 1.6x (2nd) to 0.2x (N-1th)
  const startMult = 1.6
  const endMult = 0.2
  const ratio = (position - 2) / (N - 3)
  const multiplier = startMult - ratio * (startMult - endMult)
  
  return Math.max(0, multiplier)
}

function buildPayoutData(mode, betAmount, totalPlayers = 6) {
  if (betAmount <= 0 || Number.isNaN(betAmount)) {
    betAmount = 0
  }

  if (mode === 'survival') {
    const N = Math.max(2, totalPlayers)
    const result = []
    
    for (let pos = 1; pos <= N; pos++) {
      const mult = getSurvivalMultiplier(pos, N)
      const totalPayout = Math.floor(betAmount * mult)
      const profit = totalPayout - betAmount
      const percentage = Math.round((mult - 1) * 100)
      
      let label = ''
      if (pos === 1) label = 'Survivor (sống sót)'
      else if (pos === 2) label = 'Chết cuối'
      else if (pos === N) label = 'Chết đầu'
      
      // Get icon (last position always gets skull)
      const icon = pos === N ? '💀' : (POSITION_ICONS[pos - 1] || '⬇️')
      
      result.push({
        position: `${pos}${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'}`,
        label,
        icon,
        percentage,
        totalPayout,
        profit
      })
    }
    
    return result
  }

  // Default: carrot mode
  const winnerPayout = Math.floor(betAmount * 5)
  const loserPayout = Math.floor(betAmount * 0.6)

  return [
    {
      position: '1st',
      label: 'Winner (ăn cà rốt)',
      icon: '🥕',
      percentage: 400,
      totalPayout: winnerPayout,
      profit: winnerPayout - betAmount
    },
    {
      position: 'Others',
      label: 'Losers',
      icon: '❌',
      percentage: -40,
      totalPayout: loserPayout,
      profit: loserPayout - betAmount
    }
  ]
}

export default function PayoutTable({ mode = 'carrot', betAmount = 500, totalPlayers = 6, compact = false }) {
  const payouts = buildPayoutData(mode, betAmount, totalPlayers)
  
  if (compact) {
    return (
      <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-yellow-400" />
          <h4 className="text-sm font-bold">Bảng thưởng</h4>
        </div>
        <div className="space-y-1 text-xs">
          {payouts.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-400">
                {p.icon} {p.position}
              </span>
              <span className={p.profit > 0 ? 'text-green-400 font-bold' : 'text-red-400'}>
                {p.profit > 0 ? '+' : ''}{p.profit.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <h3 className="text-lg font-bold">
            {mode === 'carrot' ? '🥕 Bảng thưởng - Cà Rốt' : '⚔️ Bảng thưởng - Sống Còn'}
          </h3>
        </div>
        <span className="text-sm text-gray-500">Cược: {betAmount.toLocaleString()}</span>
      </div>

      <div className="space-y-2">
        {payouts.map((payout, idx) => {
          const totalPayout = payout.totalPayout
          const isWin = payout.profit > 0
          const isBreakEven = payout.profit === 0
          
          return (
            <div 
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isWin 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : isBreakEven
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{payout.icon}</span>
                <div>
                  <div className="font-bold text-sm">
                    {payout.position} {payout.label && `- ${payout.label}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    Nhận: {totalPayout.toLocaleString()} coins
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`flex items-center gap-1 font-bold ${
                  isWin ? 'text-green-400' : isBreakEven ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {isWin ? <TrendingUp size={16} /> : isBreakEven ? '=' : <TrendingDown size={16} />}
                  <span>
                    {payout.profit > 0 ? '+' : ''}{payout.profit.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  ({payout.percentage > 0 ? '+' : ''}{payout.percentage}%)
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-dark-700 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          {mode === 'carrot' 
            ? '🥕 Game kết thúc khi có ngựa ăn cà rốt. Chỉ người thắng mới lời!' 
            : '⚔️ Ngựa va chạm cho đến khi chỉ còn 1 con sống sót. Chết sớm = thua nặng!'}
        </p>
      </div>
    </div>
  )
}
