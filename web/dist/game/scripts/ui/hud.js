/**
 * HUD (Heads-Up Display) System
 * Manages game UI updates: timer, speed, results
 */

/**
 * Update race timer display
 */
function updateTimer() {
  // Check if game variables are defined
  if (typeof gateOpen === 'undefined' || typeof winner === 'undefined' || typeof openTime === 'undefined') {
    return;
  }
  
  if (!gateOpen || winner) return;
  const t = (performance.now() - openTime) / 1000;
  if (typeof DOMCache !== 'undefined' && DOMCache.setText && DOMCache.elements) {
    DOMCache.setText(DOMCache.elements.timer, t.toFixed(2));
  } else {
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = t.toFixed(2);
  }
}

/**
 * Update speed slider UI visualization
 */
function updateSpeedUI() {
  // Check if runtimeSpeed is defined (may not be available on initial load)
  if (typeof runtimeSpeed === 'undefined') {
    return;
  }
  
  const minSpeed = 0.1, maxSpeed = 5.0;
  const p = (runtimeSpeed - minSpeed) / (maxSpeed - minSpeed);
  
  const speedValEl = (typeof DOMCache !== 'undefined' && DOMCache.elements) 
    ? (DOMCache.elements.speedVal || document.getElementById('speedVal'))
    : document.getElementById('speedVal');
    
  const speedThumbEl = (typeof DOMCache !== 'undefined' && DOMCache.elements)
    ? (DOMCache.elements.speedThumb || document.getElementById('speedThumb'))
    : document.getElementById('speedThumb');
    
  const speedLiveValEl = (typeof DOMCache !== 'undefined' && DOMCache.elements)
    ? (DOMCache.elements.speedLiveVal || document.getElementById('speedLiveVal'))
    : document.getElementById('speedLiveVal');
    
  if (speedValEl) speedValEl.style.width = `${p * 100}%`;
  if (speedThumbEl) speedThumbEl.style.left = `${p * 100}%`;
  if (speedLiveValEl) speedLiveValEl.textContent = runtimeSpeed.toFixed(1) + "×";
}

/**
 * Format time in MM:SS.MS format
 * @param {number} sec - Time in seconds
 * @returns {string}
 */
function formatTimeSec(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
}

/**
 * Show race results overlay
 */
function showResultsOverlay() {
  console.log('[HUD] showResultsOverlay() called');
  
  // Check if game variables are defined
  if (typeof winner === 'undefined' || typeof openTime === 'undefined') {
    console.warn('[HUD] Winner or openTime is undefined:', { winner, openTime });
    return;
  }
  
  console.log('[HUD] Winner found:', winner?.name);
  
  const ov = (typeof DOMCache !== 'undefined' && DOMCache.get)
    ? DOMCache.get('resultsOverlay')
    : document.getElementById('resultsOverlay');
    
  const body = (typeof DOMCache !== 'undefined' && DOMCache.get)
    ? DOMCache.get('resultsBody')
    : document.getElementById('resultsBody');
  
  console.log('[HUD] DOM elements:', { overlay: !!ov, body: !!body });
    
  if (!ov || !body) {
    console.error('[HUD] Results overlay DOM elements not found!');
    return;
  }
  
  let t = 0;
  if (openTime && typeof openTime === 'number') {
    t = Math.max(0, (performance.now() - openTime) / 1000);
  }
  
  const winName = winner ? (winner.name || '???') : '???';
  
  // Build full standings table - ALWAYS show this
  let standingsHTML = '';
  if (window.horses && window.horses.length > 0) {
    // Sort horses with proper logic for both finish line and survivor modes
    const sortedHorses = [...window.horses]
      .sort((a, b) => {
        // Winner always first
        if (a === winner) return -1;
        if (b === winner) return 1;
        
        // If both have finish times (finish line mode), sort by time (fastest first)
        if (a.finishTime && b.finishTime) {
          return a.finishTime - b.finishTime;
        }
        
        // Horses with finish time before those without
        if (a.finishTime && !b.finishTime) return -1;
        if (!a.finishTime && b.finishTime) return 1;
        
        // For survivor mode: alive horses before eliminated
        const aAlive = !a.eliminated;
        const bAlive = !b.eliminated;
        if (aAlive && !bAlive) return -1;
        if (!aAlive && bAlive) return 1;
        
        // Both eliminated: sort by elimination time (died LATER = higher rank)
        if (a.eliminated && b.eliminated) {
          const aTime = a.eliminatedTime || 0;
          const bTime = b.eliminatedTime || 0;
          return bTime - aTime; // Later death time = higher position
        }
        
        // Both alive: sort by HP (higher HP first)
        return (b.hp || 0) - (a.hp || 0);
      });
    
    standingsHTML = '<div style="margin-top:16px; font-size:14px; font-weight:600; margin-bottom:8px;">📊 Bảng xếp hạng:</div>';
    standingsHTML += '<div style="max-height:250px; overflow-y:auto; margin-top:8px; padding-right:4px;">';
    
    sortedHorses.forEach((horse, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}`;
      
      // Calculate display time
      let time = 'DNF';
      if (horse.finishTime) {
        // Finish line mode: show finish time
        time = formatTimeSec(horse.finishTime / 1000);
      } else if (horse.eliminatedTime && openTime) {
        // Survivor mode: show survival time (từ lúc bắt đầu đến lúc chết)
        const survivalTime = (horse.eliminatedTime - openTime) / 1000;
        time = formatTimeSec(survivalTime);
      } else if (!horse.eliminated && openTime) {
        // Still alive: show current survival time
        const currentTime = (performance.now() - openTime) / 1000;
        time = '⏱️ ' + formatTimeSec(currentTime);
      } else if (winner && winner.finishTime && !horse.finishTime) {
        // Finish line mode: winner crossed finish line, this horse didn't
        time = 'Lose';
      }
      
      const bgColor = position <= 3 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.04)';
      const borderColor = position <= 3 ? '#4ade80' : 'rgba(255,255,255,0.1)';
      
      standingsHTML += `
        <div style="padding:8px 12px; margin-bottom:6px; background:${bgColor}; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border-left:3px solid ${borderColor};">
          <span style="display:flex; align-items:center; gap:10px;">
            <span style="min-width:28px; font-weight:600; font-size:15px;">${medal}</span>
            <span style="font-weight:500;">${horse.name}</span>
          </span>
          <span style="color:#94a3b8; font-weight:500;">${time}</span>
        </div>
      `;
    });
    
    standingsHTML += '</div>';
  }
  
  // Check if betting data is available (optional payout info)
  const bettingData = window.raceResults || {};
  const hasBetting = bettingData.totalPool > 0;
  
  let payoutHTML = '';
  if (hasBetting) {
    payoutHTML = `
      <div style="margin-top:16px; padding:12px; background:rgba(59,130,246,0.1); border-radius:8px; border:1px solid rgba(59,130,246,0.3);">
        <div style="font-weight:600; margin-bottom:8px; color:#60a5fa;">💰 Giải thưởng:</div>
        <div style="font-size:13px; color:#cbd5e1;">
          <div>🥇 ${bettingData.first?.toLocaleString() || 0} • 🥈 ${bettingData.second?.toLocaleString() || 0} • 🥉 ${bettingData.third?.toLocaleString() || 0} coins</div>
        </div>
      </div>
    `;
  }
    
  body.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="font-size:16px; font-weight:600; margin-bottom:4px;">🏆 Quán quân: ${winName}</div>
      <div style="color:#94a3b8;">⏱️ Thời gian: ${formatTimeSec(t)}</div>
    </div>
    ${payoutHTML}
    ${standingsHTML}
  `;
  ov.style.display = 'flex';
  
  console.log('[HUD] ✅ Results overlay shown with', window.horses?.length, 'horses');
}

/**
 * Initialize speed slider interactive controls
 */
function initSpeedSlider() {
  const speedSlider = document.getElementById('speedSlider');
  const speedVal = document.getElementById('speedVal');
  const speedThumb = document.getElementById('speedThumb');
  const speedLiveVal = document.getElementById('speedLiveVal');
  
  if (!speedSlider) return;
  
  let isDraggingSpeed = false;

  function onSpeedSliderMove(e) {
    const rect = speedSlider.getBoundingClientRect();
    let p = (e.clientX - rect.left) / rect.width;
    p = Math.max(0, Math.min(1, p)); // Clamp to 0-1 range
    const minSpeed = 0.1, maxSpeed = 5.0;
    
    if (typeof window.runtimeSpeed !== 'undefined') {
      window.runtimeSpeed = minSpeed + p * (maxSpeed - minSpeed);
      updateSpeedUI();
    }
  }

  speedSlider.addEventListener('mousedown', (e) => {
    isDraggingSpeed = true;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    onSpeedSliderMove(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingSpeed) {
      onSpeedSliderMove(e);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingSpeed) {
      isDraggingSpeed = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    }
  });
  
  updateSpeedUI(); // Initial call
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.HUDSystem = {
    updateTimer,
    updateSpeedUI,
    formatTimeSec,
    showResultsOverlay,
    initSpeedSlider
  };
  
  // Backward compatibility
  window.updateTimer = updateTimer;
  window.updateSpeedUI = updateSpeedUI;
  window.formatTimeSec = formatTimeSec;
  window.showResultsOverlay = showResultsOverlay;
}
