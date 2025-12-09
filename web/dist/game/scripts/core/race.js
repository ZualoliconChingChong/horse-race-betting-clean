/**
 * Race Control System
 * Manages race lifecycle: start, countdown, gate opening, and timing
 * 
 * Note: All functions use window.* directly to ensure game loop sees changes immediately
 */

// ===== Helper Functions =====

// Function to update window references when live arrays change
// (This is a no-op now since we work directly with window.*, kept for compatibility)
function updateWindowLiveReferences() {
  // All arrays are already on window.*, no sync needed
}

// ===== Race Control Functions =====

function startRace(){
  // Ensure static cached layer is rebuilt for play mode (no editor-only artifacts)
  try { if (typeof invalidateStaticLayer === 'function') { invalidateStaticLayer(); } } catch {}
  try { if (typeof drawMap === 'function') { drawMap(); } } catch {}
  // Dynamically enlarge waiting room based on number of horses (if enabled)
  try {
    const rm = window.mapDef.waitingRoom;
    const allowAutoFit = (function(){ const el = document.getElementById('autoFitWaitingRoom'); return !!(el && el.checked); })();
    if (rm && allowAutoFit) {
      const nEl = document.getElementById('n');
      const n = Math.max(1, Math.min(50, parseInt((nEl && nEl.value) || '8', 10)));
      const cols = 4; // show up to 4 per row visually
      const rows = Math.ceil(n / cols);
      const padding = 24; // top/bottom margin for labels
      const rowPitch = 56; // vertical spacing per row
      const targetH = Math.max(360, padding + rows * rowPitch);
      const targetW = Math.max(260, rm.w);
      // Never shrink compared to current editor size
      rm.h = Math.max(rm.h, targetH);
      rm.w = Math.max(rm.w, targetW);
      // Keep top aligned; adjust gate + start line
      if (typeof alignGateToWaitingRoom === 'function') alignGateToWaitingRoom();
      if (typeof invalidateStaticLayer === 'function') invalidateStaticLayer();
      if (typeof drawMap === 'function') drawMap();
      // Randomize spawn positions inside waiting room each race
      try { makeSpawnsPreset(n, 'scatter'); } catch {}
    }
  } catch {}
  window.liveBoosts = JSON.parse(JSON.stringify(window.mapDef.boosts || []));
  window.liveGhosts = JSON.parse(JSON.stringify(window.mapDef.ghosts || []));
  window.liveRams = JSON.parse(JSON.stringify(window.mapDef.rams || []));
  window.liveTeleports = JSON.parse(JSON.stringify(window.mapDef.teleports || []));
  window.liveMagnets = JSON.parse(JSON.stringify(window.mapDef.magnets || []));
  window.liveTimeFreezes = JSON.parse(JSON.stringify(window.mapDef.timeFreezes || []));
  window.liveIceFreezers = JSON.parse(JSON.stringify(window.mapDef.icefreezers || []));
  window.liveTestpowers = JSON.parse(JSON.stringify(window.mapDef.testpowers || []));window.livePoisons = JSON.parse(JSON.stringify(window.mapDef.poisons || []));
  window.liveTurbos = JSON.parse(JSON.stringify(window.mapDef.turbos || []));
  window.liveLightnings = JSON.parse(JSON.stringify(window.mapDef.lightnings || []));
  window.liveTornados = JSON.parse(JSON.stringify(window.mapDef.tornados || []));
  window.liveVolcanos = JSON.parse(JSON.stringify(window.mapDef.volcanos || []));
  window.liveSpinners = (window.mapDef.spinners || []).map(s => ({...s, speed: s.speed || 1}));
  window.liveShields = JSON.parse(JSON.stringify(window.mapDef.shields || []));
  window.liveWarpzones = JSON.parse(JSON.stringify(window.mapDef.warpzones || []));
  window.liveQuantumdashs = JSON.parse(JSON.stringify(window.mapDef.quantumdashs || []));
  window.liveNebulas = JSON.parse(JSON.stringify(window.mapDef.nebulas || []));
  window.liveMeteors = JSON.parse(JSON.stringify(window.mapDef.meteors || []));
  
  // Reset consumed flags for ALL power-ups at race start
  const allPowerUpArrays = [
    { live: window.liveBoosts, mapDef: window.mapDef.boosts },
    { live: window.liveGhosts, mapDef: window.mapDef.ghosts },
    { live: window.liveRams, mapDef: window.mapDef.rams },
    { live: window.liveShields, mapDef: window.mapDef.shields },
    { live: window.liveTurbos, mapDef: window.mapDef.turbos },
    { live: window.liveTeleports, mapDef: window.mapDef.teleports },
    { live: window.liveMagnets, mapDef: window.mapDef.magnets },
    { live: window.liveTimeFreezes, mapDef: window.mapDef.timeFreezes },
    { live: window.liveIceFreezers, mapDef: window.mapDef.icefreezers },
    { live: window.liveTestpowers, mapDef: window.mapDef.testpowers },{ live: window.livePoisons, mapDef: window.mapDef.poisons },
    { live: window.liveLightnings, mapDef: window.mapDef.lightnings },
    { live: window.liveTornados, mapDef: window.mapDef.tornados },
    { live: window.liveVolcanos, mapDef: window.mapDef.volcanos },
    { live: window.liveMeteors, mapDef: window.mapDef.meteors },
    { live: window.liveWarpzones, mapDef: window.mapDef.warpzones },
    { live: window.liveQuantumdashs, mapDef: window.mapDef.quantumdashs },
    { live: window.liveNebulas, mapDef: window.mapDef.nebulas },
    { live: null, mapDef: window.mapDef.yellowhearts } // yellowhearts don't have live array
  ];
  
  allPowerUpArrays.forEach(({ live, mapDef }) => {
    if (Array.isArray(live)) {
      live.forEach(item => { if (item) item.consumed = false; });
    }
    if (Array.isArray(mapDef)) {
      mapDef.forEach(item => { if (item) item.consumed = false; });
    }
  });
  
  window.liveSlipstreams = [];
  
  // Update window references for RenderModule access
  updateWindowLiveReferences();
  // Speed slider UI - MOVED TO: scripts/ui/hud.js (initSpeedSlider)
  try {
    if (typeof initSpeedSlider === 'function') initSpeedSlider();
  } catch(e) {
    console.warn('Failed to initialize speed slider:', e);
  }

  if (!window.mapDef.waitingRoom || !window.mapDef.startLine || !window.mapDef.carrots){ alert("Thiếu đối tượng: WaitingRoom / StartLine / Carrots"); return; }
  window.mode = "play"; 
  if (window.editorBar) window.editorBar.style.display = "none"; 
  const toEditorEl = document.getElementById('toEditor');
  if (toEditorEl) toEditorEl.style.display = "inline-flex"; 
  if (window.hud) window.hud.style.display = "flex";
  setEditorVisible(false);
  
  // Show pause button when race starts
  const pauseBtn = document.getElementById('pauseBtnHUD');
  if (pauseBtn) { 
    pauseBtn.style.display = 'block'; 
    pauseBtn.textContent = window.paused ? '▶️' : '⏸️';
  }

  const nEl = document.getElementById('n');
  const speedEl = document.getElementById('speed');
  const csecEl = document.getElementById('countdownSlider'); // Fixed: use correct slider ID
  const jitterEl = document.getElementById('spawnJitter');

  const n = Math.max(1, Math.min(50, parseInt((nEl && nEl.value) || "8", 10)));
  const sp = parseInt((speedEl && speedEl.value) || "2", 10);
  const csec = parseInt((csecEl && csecEl.value) || "0", 10); // Default 0s for instant start (testing)
  const jitter = parseInt((jitterEl && jitterEl.value) || "0", 10);

  window.speedScale = (sp===1? 0.9 : sp===2? 1.3 : 1.6);
  const spawnPresetEl = document.getElementById('spawnPreset');
  const spawnPresetVal = (spawnPresetEl && spawnPresetEl.value) || 'line';
  if (!window.mapDef.spawnPoints || window.mapDef.spawnPoints.length < n){ makeSpawnsPreset(n, spawnPresetVal); }
  else if (window.mapDef.spawnPoints.length > n){ window.mapDef.spawnPoints = window.mapDef.spawnPoints.slice(0,n); }

  window.horses.length=0;
  // Clear collision history for all horses when starting new race
  for (let i=0;i<n;i++){
    const custom = (window.mapDef.horseCustoms && window.mapDef.horseCustoms[i]) || {};
    const name=(custom.name && custom.name.trim()) || window.NAMES[i%window.NAMES.length];
    const body=custom.body || window.BODY[i%window.BODY.length];
    const label=custom.label || window.COLORS[i%window.COLORS.length];
    const spriteCfg = custom.sprite ? {
      _img: custom._img, scale: custom.scale||'1', rotate: custom.rotate||'on',
      outline: custom.outline||'off', outlineColor: custom.outlineColor||'#000000', outlineWidth: custom.outlineWidth||'2'
    } : null;

    const s = window.mapDef.spawnPoints[i] || {x:50+30*i, y:50+30*i};
    const jx = (Math.random()*2-1) * jitter, jy = (Math.random()*2-1) * jitter;
    const pos = insideRoomClamp(s.x + jx, s.y + jy);
    
    // Custom speed per horse (overrides global speed if set)
    let base;
    if (custom.customSpeed && typeof custom.customSpeed === 'number' && custom.customSpeed > 0) {
      base = custom.customSpeed;
    } else {
      const configuredSpeed = window.runtimeSpeed || 1.0;
      base = configuredSpeed * 0.8;
    }
    
    const h=new window.Horse(i,name,body,label,pos.x, pos.y, base, spriteCfg, window.mapDef.horseRadius);
    // Initialize collision history to prevent duplicate power-up collisions
    h.collidedPowerUps = new Set();
    // Apply hitbox scaling so collisions match visuals more closely
    h.hitScale = (typeof window.mapDef.horseHitScale === 'number' && isFinite(window.mapDef.horseHitScale)) ? window.mapDef.horseHitScale : 0.85;
    h.hitInset = (typeof window.mapDef.horseHitInset === 'number' && isFinite(window.mapDef.horseHitInset)) ? window.mapDef.horseHitInset : 2;
    // Initialize runtime speed fields
    h.baseSpeedFactor = 1.0;      // permanent base speed multiplier from stacks
    h.boostStacks = 0;            // permanent +20% per Boost pickup (max 10)
    h.lastBorderDamageTime = 0;   // cooldown for border damage
    h.mudSpeedModifier = 1.0;     // transient mud slow
    h.healingPatchEffect = 0;     // transient healing patch effect
    h.gravityWellSpeedModifier = 1.0; // transient gravity well slow
    h.gravityWellSpeedBoost = 1.0;    // transient gravity well owner boost
    h.frozenUntil = 0;
    // Turbo (temporary super boost) runtime fields
    h.turboMultiplier = 1.0; // 2.2 during turbo
    h.turboUntil = 0;        // timestamp when turbo expires
    
    // Store the calculated base speed before Object.assign
    const calculatedBaseSpeed = base;
    
    if (custom) {
      // Store values that need special handling before Object.assign
      const customLuck = custom.luck;
      const customLuckInterval = custom.luckInterval;
      
      Object.assign(h, custom);
      h.speedMod = 1.0;
      // Restore baseSpeed after Object.assign to prevent overwriting
      h.baseSpeed = calculatedBaseSpeed;
      
      // Apply custom HP if specified
      if (custom.customHP && typeof custom.customHP === 'number' && custom.customHP > 0) {
        h.maxHP = custom.customHP;
        h.hp = custom.customHP;
      }
      
      // Apply Luck stat if specified (0-100%) - use stored value
      if (customLuck !== undefined && typeof customLuck === 'number' && customLuck >= 0) {
        h.luck = Math.min(100, customLuck); // Cap at 100%
      } else {
        h.luck = 0; // Default: no luck
      }
      
      // Apply Luck Interval if specified (seconds) - use stored value
      if (customLuckInterval !== undefined && typeof customLuckInterval === 'number' && customLuckInterval > 0) {
        h.luckInterval = Math.max(0.1, customLuckInterval); // Min 0.1s
        // Always log when custom luckInterval is set
        console.log(`✅ [Race Init] Horse ${i} "${name}": luckInterval=${h.luckInterval}s (custom=${customLuckInterval})`);
      } else {
        h.luckInterval = 1.0; // Default: 1 second
        console.log(`⚠️ [Race Init] Horse ${i} "${name}": luckInterval=1.0s (default, custom=${customLuckInterval})`);
      }
      
      if (custom.skill === 'hunter') {
        h.skillState = {
          name: 'hunter',
          status: 'ready',
          activationTime: 10000,
          duration: 15000,
          cooldown: 90000
        };
      } else if (custom.skill === 'guardian') {
        h.skillState = {
          name: 'guardian',
          status: 'ready',
          activationTime: 0,
          cooldown: 60000
        };
      } else if (custom.skill === 'phantom_strike') {
        h.skillState = {
          name: 'phantom_strike',
          status: 'ready',
          activationTime: 10000,
          duration: 5000,
          canAttack: false,
          cooldown: 85000
        };
      } else if (custom.skill === 'cosmic_swap') {
        h.skillState = {
          name: 'cosmic_swap',
          status: 'ready',
          activationTime: 10000,
          cooldown: 80000
        };
      } else if (custom.skill === 'overdrive') {
        h.skillState = {
          name: 'overdrive',
          status: 'ready',
          activationTime: 10000,
          duration: 5000,
          cooldown: 50000,
          overheatDuration: 5000
        };
      } else if (custom.skill === 'slipstream') {
        h.skillState = {
          name: 'slipstream',
          status: 'ready',
          activationTime: 10000,
          duration: 6000,   // self buff duration
          cooldown: 55000,  // cooldown
          wakeDuration: 4000, // wake lingers
          draftBonus: 1.25   // others get +25% speed
        };
        h._lastSlipEmitTs = 0;
      } else if (custom.skill === 'shockwave') {
        h.skillState = {
          name: 'shockwave',
          status: 'ready',
          activationTime: 10000,
          duration: 7000,
          cooldown: 45000,
          radius: 80
        };
      } else if (custom.skill === 'chain_lightning') {
        h.skillState = {
          name: 'chain_lightning',
          status: 'ready',
          activationTime: 10000,
          duration: 1200,     // longer visuals window
          cooldown: 42000,
          jumpRadius: 180,
          maxJumps: 4,
          stunMs: 2500,
          slowMs: 3500,
          slowMultiplier: 0.55
        };
      } else if (custom.skill === 'gravity_well') {
        h.skillState = {
          name: 'gravity_well',
          status: 'ready',
          activationTime: 10000,
          duration: 5000,
          cooldown: 45000,
          radius: 150,
          pullStrength: 0.8
        };
      } else if (custom.skill === 'chill_guy') {
        h.skillState = {
          name: 'chill_guy',
          status: 'active' // Passive skill, always on
        };
      } else if (custom.skill === 'oguri_fat') {
        h.skillState = {
          name: 'oguri_fat',
          status: 'ready',
          activationTime: 10000, // 10s delay like other skills
          duration: 5000,        // 5s active duration
          cooldown: 60000        // 60s cooldown
        };
      } else if (custom.skill === 'silence_shizuka') {
        h.skillState = {
          name: 'silence_shizuka',
          status: 'ready',
          activationTime: 10000, // 10s delay
          duration: 10000,       // 10s healing duration
          cooldown: 45000,       // 45s cooldown
          healPerSecond: 5       // 5 HP per second
        };
      } else if (custom.skill === 'fireball') {
        h.skillState = {
          name: 'fireball',
          status: 'ready',
          activationTime: 8000,  // 8s delay
          duration: 8000,        // 8s active duration
          cooldown: 40000,       // 40s cooldown
          fireballCount: 3,      // 3 fireballs
          fireballDamage: 10,    // -10 HP per hit
          orbitRadius: 50,       // orbit distance from horse (wider)
          orbitSpeed: 0.7        // radians per second (slow and elegant)
        };
      } else if (custom.skill === 'energy_ball') {
        h.skillState = {
          name: 'energy_ball',
          status: 'ready',
          activationTime: 10000, // 10s delay
          castTime: 1000,        // 1s cast time
          duration: 20000,       // 20s active window (ball travels slowly)
          cooldown: 35000,       // 35s cooldown (reduced for more usage)
          damagePercent: 30,     // 30% of target's max HP
          ballSpeed: 1,          // direction unit vector
          ballRadius: 30         // large ball (bigger for visibility)
        };
      } else if (custom.skill === 'supersonic_speed') {
        h.skillState = {
          name: 'supersonic_speed',
          status: 'ready',
          activationTime: 10000,
          duration: 4000,
          cooldown: 60000,
          boostMultiplier: 10.0,
          slowMultiplier: 0.5,
          recoveryDuration: 15000
        };
      } else if (custom.skill === 'meteor_strike') {
        h.skillState = { name: 'meteor_strike', status: 'ready', activationTime: 12000, cooldown: 45000, meteorCount: 4, damage: 15, stunDuration: 1000 };
      } else if (custom.skill === 'black_hole') {
        h.skillState = { name: 'black_hole', status: 'ready', activationTime: 15000, duration: 3000, cooldown: 50000, radius: 200, pullStrength: 2.0 };
      } else if (custom.skill === 'ice_age') {
        h.skillState = { name: 'ice_age', status: 'ready', activationTime: 12000, duration: 4000, cooldown: 55000, radius: 180, slowMultiplier: 0.3 };
      } else if (custom.skill === 'mirror_image') {
        h.skillState = { name: 'mirror_image', status: 'ready', activationTime: 8000, duration: 8000, cooldown: 40000, cloneCount: 2 };
      } else if (custom.skill === 'time_warp') {
        h.skillState = { name: 'time_warp', status: 'ready', activationTime: 8000, cooldown: 60000, rewindDuration: 8000 };
      } else if (custom.skill === 'blink') {
        h.skillState = { name: 'blink', status: 'ready', activationTime: 5000, cooldown: 15000, distance: 150 };
      } else if (custom.skill === 'rocket_boost') {
        h.skillState = { name: 'rocket_boost', status: 'ready', activationTime: 10000, duration: 1500, cooldown: 35000, speedMultiplier: 8.0, knockbackForce: 3.0 };
      } else if (custom.skill === 'gravity_flip') {
        h.skillState = { name: 'gravity_flip', status: 'ready', activationTime: 12000, duration: 3000, cooldown: 40000 };
      } else if (custom.skill === 'phoenix_rebirth') {
        h.skillState = { name: 'phoenix_rebirth', status: 'passive', used: false, revivePercent: 0.5, invincibleDuration: 3000 };
      } else if (custom.skill === 'avatar_state') {
        h.skillState = { name: 'avatar_state', status: 'ready', activationTime: 10000, duration: 6000, cooldown: 90000, speedMultiplier: 3.0, damageMultiplier: 2.0 };
      } else if (custom.skill === 'rainbow_trail') {
        h.skillState = { name: 'rainbow_trail', status: 'ready', activationTime: 8000, duration: 5000, cooldown: 45000, speedBoost: 1.3, trailBoost: 1.15 };
      } else if (custom.skill === 'disco_chaos') {
        h.skillState = { name: 'disco_chaos', status: 'ready', activationTime: 12000, duration: 4000, cooldown: 50000, radius: 150, redirectInterval: 500 };
      } else if (custom.skill === 'aurora_shield') {
        h.skillState = { name: 'aurora_shield', status: 'ready', activationTime: 10000, duration: 6000, cooldown: 55000, shieldHP: 30, reflectPercent: 0.5 };
      }
    }
  
  // Consumed flags already cleared for all power-ups above
  const startCx = window.mapDef.startLine.x + window.mapDef.startLine.w*0.5, startCy = window.mapDef.startLine.y + window.mapDef.startLine.h*0.5;
    const gx = startCx - pos.x, gy = startCy - pos.y; const L=Math.hypot(gx,gy)||1;
    h.vx = Math.abs(base)*0.95 + (gx/L)*0.05; h.vy = (gy/L)*0.05;
    window.horses.push(h);
  }

  DOMCache.setText(DOMCache.elements.horsesCount, n.toString());
  try { if (typeof updateCarrotHUD === 'function') updateCarrotHUD(); } catch {}
  // reset results overlay state
  window.resultsShown = false;
  const ov = DOMCache.get('resultsOverlay'); if (ov) ov.style.display = 'none';
  window.gateOpen=false; window.winner=null; window.running=true; window.countdown=csec;
  // DON'T reset runtimeSpeed - preserve user's UI setting!
  // window.runtimeSpeed = 1.0;  // REMOVED: This was overriding user settings
  try { if (typeof updateSpeedUI === 'function') updateSpeedUI(); } catch {}
  
  // If countdown is 0, skip countdown and start immediately
  if (csec <= 0) {
    const cdEl = document.getElementById('cd');
    if (cdEl) {
      cdEl.style.display = 'block';
      cdEl.textContent = "GO!";
    }
    try { playSfx('go'); showFlash('GO!'); } catch {}
    setTimeout(() => { 
      if (cdEl) cdEl.style.display = 'none';
      openGate(); 
    }, 350);
  } else {
    showCountdown(true);
    startCountdown();
  }
}

function stopRaceToEditor(){
  window.mode = "editor";
  if (window.hud) window.hud.style.display = "none";
  setEditorVisible(true);
  const toEditorEl = document.getElementById('toEditor');
  if (toEditorEl) toEditorEl.style.display = "none";
  
  // Clear consumed flags on all power-ups when returning to editor
  try {
    const powerUpArrays = [
      'boosts', 'turbos', 'teleports', 'magnets', 'timeFreezes', 'icefreezers', 'poisons',
      'ghosts', 'rams', 'shields', 'warpzones', 'quantumdashs',
      'nebulas', 'yellowhearts', 'spinners', 'lightnings', 'tornados', 'volcanos'
    ];
    console.log(`[CLEANUP START] Clearing consumed flags from power-ups...`);
    powerUpArrays.forEach(arrName => {
      const arr = window.mapDef?.[arrName];
      if (Array.isArray(arr)) {
        let cleared = 0;
        arr.forEach(item => { 
          if (item && item.consumed) {
            console.log(`[✓ CLEAR CONSUMED] ${arrName} at (${Math.round(item.x)}, ${Math.round(item.y)})`);
            delete item.consumed;
            cleared++;
          }
        });
        if (cleared > 0) console.log(`[CLEANUP] Cleared ${cleared} consumed ${arrName}`);
      }
    });
    console.log(`[CLEANUP END] Done clearing consumed flags`);
  } catch (e) {
    console.warn('Failed to clear consumed flags:', e);
  }
  
  // === CLEANUP LUCK-SPAWNED POWER-UPS ===
  try {
    console.log('[Luck] 🧹 Cleaning up luck-spawned power-ups...');
    const cleanupLuckItems = (arr, name) => {
      if (!Array.isArray(arr)) return 0;
      let removed = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] && arr[i]._luckSpawned) {
          arr.splice(i, 1);
          removed++;
        }
      }
      return removed;
    };
    const mapDef = window.mapDef;
    const arraysToClean = [
      'boosts', 'ghosts', 'traps', 'shields', 'rams', 'turbos',
      'teleports', 'magnets', 'timeFreezes', 'poisons', 'warpzones', 'quantumdashs'
    ];
    let totalRemoved = 0;
    arraysToClean.forEach(name => {
      if (mapDef && mapDef[name]) totalRemoved += cleanupLuckItems(mapDef[name], name);
      if (window['live' + name.charAt(0).toUpperCase() + name.slice(1)]) {
        totalRemoved += cleanupLuckItems(window['live' + name.charAt(0).toUpperCase() + name.slice(1)], 'live' + name);
      }
    });
    // Also clean specific live arrays
    if (window.liveBoosts) totalRemoved += cleanupLuckItems(window.liveBoosts, 'liveBoosts');
    if (window.liveGhosts) totalRemoved += cleanupLuckItems(window.liveGhosts, 'liveGhosts');
    if (window.liveTraps) totalRemoved += cleanupLuckItems(window.liveTraps, 'liveTraps');
    if (window.liveShields) totalRemoved += cleanupLuckItems(window.liveShields, 'liveShields');
    console.log(`[Luck] 🧹 Removed ${totalRemoved} luck-spawned items`);
  } catch (e) {
    console.warn('[Luck] Cleanup error:', e);
  }
  
  try { if (typeof invalidateStaticLayer === 'function') invalidateStaticLayer(); } catch {}
  try { if (typeof drawMap === 'function') drawMap(); } catch {}
}

function showCountdown(show){ 
  const cdEl = DOMCache.get('cd'); 
  if (cdEl) { 
    cdEl.style.display = show ? 'block' : 'none'; 
    if (show) cdEl.textContent="Chuẩn bị... " + window.countdown; 
  } 
}

function startCountdown(){ 
  const cdEl = document.getElementById('cd'); 
  if (window.countdownTimer) clearInterval(window.countdownTimer); 
  
  window.countdownTimer = setInterval(() => {
    window.countdown--;
    if (window.countdown <= 3 && window.countdown > 0) {
      try { if (typeof cheer === 'function') cheer(); } catch {}
    }
    if (window.countdown <= 0) {
      clearInterval(window.countdownTimer);
      window.countdownTimer = null;
      cdEl.textContent = "GO!";
      try { playSfx('go'); showFlash('GO!'); } catch {}
      setTimeout(() => { showCountdown(false); openGate(); }, 350);
    } else {
      cdEl.textContent = "Chuẩn bị... " + window.countdown;
    }
  }, 1000);
}

function openGate(){
  window.gateOpen = true;
  window.openTime = performance.now();
  window.biasUntil = window.openTime + parseInt((document.getElementById('startBias') && document.getElementById('startBias').value) || "0",10);
  if (window.luckEnabled) { window.nextLuckTs = 0; }
  for (const h of window.horses){ 
    if (!h.isPlayerControlled) {
      // Use horse's baseSpeed (which includes customSpeed if set)
      // baseSpeed was already set during horse creation with custom or default speed
      // Use the same calculation as in startRace() for consistency
      const baseSpeedRef = (h.baseSpeed && typeof h.baseSpeed === 'number' && h.baseSpeed > 0) 
        ? h.baseSpeed 
        : (window.runtimeSpeed || 1.0) * 0.8;
      
      const oldVx = h.vx, oldVy = h.vy;
      // Apply the same velocity calculation as in startRace (Math.abs(base)*0.95 + random)
      h.vx = Math.abs(baseSpeedRef) * 0.95 + Math.random() * 0.05;
      h.vy += (Math.random() * 2 - 1) * 0.05; // Reduce random Y component
      
    }
  }
  // Trigger GO! FX
  try { window.goFxStart = performance.now(); window.goFxUntil = window.goFxStart + 900; } catch {}
  // Hide waiting room and start line right away by rebuilding static layer
  try { if (typeof invalidateStaticLayer === 'function') invalidateStaticLayer(); } catch {}
  try { if (typeof drawMap === 'function') drawMap(); } catch {}
}

// Trigger 0.25× slow-mo for 1.5s on photo finish
function triggerPhotoFinishSlowmo(){
  if (window.photoFinishActive) return;
  window.photoFinishActive = true;
  window._prevRuntimeSpeed = window.runtimeSpeed;
  window.runtimeSpeed = 0.25;
  try { if (typeof updateSpeedUI === 'function') updateSpeedUI(); } catch {}
  try { playSfx('finish_swell'); } catch {}
  window.photoFinishStartTs = performance.now();
  if (window._slowmoTimer) clearTimeout(window._slowmoTimer);
  window._slowmoTimer = setTimeout(()=>{
    window.runtimeSpeed = window._prevRuntimeSpeed ?? 1.0;
    try { if (typeof updateSpeedUI === 'function') updateSpeedUI(); } catch {}
    window.photoFinishActive = false;
  }, 1500);
}

// ===== Speed Limiting =====
function limitHorseSpeed(horse, maxSpeedMultiplier = 2.5) {
  if (!horse || horse.eliminated) return;

  // Use configurable cap from mapDef (falls back to 4, matching default maxVel)
  const maxVel = Math.max(1, parseFloat((window.mapDef && window.mapDef.maxVel) ?? 4));
  const currentVel = Math.hypot(horse.vx, horse.vy);

  if (currentVel > maxVel) {
    const velRatio = maxVel / currentVel;
    horse.vx *= velRatio;
    horse.vy *= velRatio;
  }
}

function findFarthestHorse(fromHorse) {
  let farthestHorse = null;
  let maxDistance = 0;
  
  for (const horse of window.horses) {
    if (horse === fromHorse || horse.eliminated) continue;
    
    const distance = Math.hypot(horse.x - fromHorse.x, horse.y - fromHorse.y);
    if (distance > maxDistance) {
      maxDistance = distance;
      farthestHorse = horse;
    }
  }
  
  return farthestHorse;
}
