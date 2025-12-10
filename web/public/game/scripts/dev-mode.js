// @ts-check
// scripts/dev-mode.js
// Dev Mode: Player-controlled horse racing

/**
 * @typedef {Window & typeof globalThis & { 
 *   horses?: any[], 
 *   gateOpen?: boolean, 
 *   ctx?: CanvasRenderingContext2D,
 *   showFlash?: (text: string) => void,
 *   DevMode?: any,
 *   gameHorses?: any[],
 *   getGameHorses?: () => any[]
 * }} ExtendedWindow
 */

(function() {
  'use strict';
  
  /** @type {ExtendedWindow} */
  // @ts-ignore
  const w = window;

  /**
   * Get horses array from global scope
   */
  function getHorses() {
    // Try multiple ways to access horses array
    let horsesArray = null;
    
    // Method 1: Direct global access (will fail if not in scope)
    try {
      // @ts-ignore
      if (typeof horses !== 'undefined' && Array.isArray(horses) && horses.length > 0) {
        // @ts-ignore
        horsesArray = horses;
      }
    } catch (e) {
      // horses not in scope
    }
    
    // Method 2: Window object (including exposed gameHorses)
    try {
      // @ts-ignore
      if (w.gameHorses && Array.isArray(w.gameHorses) && w.gameHorses.length > 0) {
        horsesArray = w.gameHorses;
      }
      // @ts-ignore
      if (!horsesArray && w.getGameHorses && typeof w.getGameHorses === 'function') {
        const gameHorses = w.getGameHorses();
        if (gameHorses && Array.isArray(gameHorses) && gameHorses.length > 0) {
          horsesArray = gameHorses;
        }
      }
      // @ts-ignore
      if (!horsesArray && w.horses && Array.isArray(w.horses) && w.horses.length > 0) {
        horsesArray = w.horses;
      }
      // @ts-ignore
      if (!horsesArray && window.horses && Array.isArray(window.horses) && window.horses.length > 0) {
        // @ts-ignore
        horsesArray = window.horses;
      }
    } catch (e) {
      // window.horses not available
    }
    
    // Method 3: Eval (last resort)
    if (!horsesArray) {
      try {
        const evalResult = eval('typeof horses !== "undefined" && Array.isArray(horses) ? horses : null');
        if (evalResult && evalResult.length > 0) {
          horsesArray = evalResult;
        }
      } catch (e) {
        // eval failed
      }
    }
    
    // Debug logging (disabled to prevent spam)
    // if (retryCount % 10 === 0) {
    //   console.log('[DevMode] Horse detection:', {
    //     found: horsesArray ? horsesArray.length : 0,
    //     method: horsesArray ? 'success' : 'none'
    //   });
    // }
    
    // Auto-setup player horse if found and Dev Mode enabled
    if (horsesArray && horsesArray.length > 0 && devModeEnabled && !playerControlledHorse) {
      // console.log('[DevMode] Auto-setting up player horse...');
      setTimeout(() => {
        populateHorseDropdown();
        setPlayerHorse(0);
      }, 100);
    }
    
    return horsesArray;
  }

  // Dev Mode state
  let devModeEnabled = false;
  let playerControlledHorse = null;
  let playerHorseIndex = 0;
  let keyStates = {};
  let retryCount = 0;
  const MAX_RETRIES = 20; // Max 10 seconds of retrying

  // Control settings
  const CONTROL_SETTINGS = {
    acceleration: 0.15,      // Tăng tốc
    deceleration: 0.08,      // Giảm tốc
    turnSpeed: 0.12,         // Tốc độ rẽ
    maxPlayerSpeed: 6.0,     // Tốc độ tối đa cho player
    minPlayerSpeed: 0.5,     // Tốc độ tối thiểu
    skillCooldown: 1000      // Cooldown giữa các lần dùng skill
  };

  // Visual indicators
  const PLAYER_INDICATORS = {
    glowColor: '#9c27b0',    // Màu glow cho player horse
    trailColor: '#e91e63',   // Màu trail
    namePrefix: '👤 '        // Prefix cho tên player horse
  };

  /**
   * Initialize Dev Mode system
   */
  function initDevMode() {
    console.log('[DevMode] Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup keyboard controls
    setupKeyboardControls();
    
    // Hook into game events to detect horses
    hookIntoGameEvents();
    
    console.log('[DevMode] Initialized successfully');
  }

  /**
   * Setup UI event listeners
   */
  function setupEventListeners() {
    // Dev Mode toggle button
    const devModeToggle = document.getElementById('devModeToggle');
    if (devModeToggle) {
      devModeToggle.addEventListener('click', toggleDevMode);
    }

    // Close dev mode controls
    const devModeClose = document.getElementById('devModeClose');
    if (devModeClose) {
      devModeClose.addEventListener('click', disableDevMode);
    }

    // Horse selection dropdown
    const horseSelect = document.getElementById('playerHorseSelect');
    if (horseSelect) {
      horseSelect.addEventListener('change', (e) => {
        const target = /** @type {HTMLSelectElement} */ (e.target);
        if (target) {
          const index = parseInt(target.value, 10);
          if (!isNaN(index)) {
            setPlayerHorse(index);
          }
        }
      });
    }

    // Refresh horses button
    const refreshBtn = document.getElementById('refreshHorses');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (devModeEnabled) {
          setupPlayerHorse(true); 
          setupKeyboardControls();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        toggleDevMode();
      }
      if (e.key === 'F5' && devModeEnabled) {
        e.preventDefault();
        setupPlayerHorse(true); // Reset retry count
      }
    });

    // Fullscreen toggle button
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    if (fullscreenToggle) {
      fullscreenToggle.addEventListener('click', toggleFullscreen);
    }
    
    // F11 key for fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    });
    
    // Update fullscreen button icon when fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  }
  
  /**
   * Toggle fullscreen mode for the stage
   * Uses FAKE fullscreen (CSS-based) to prevent browser scaling
   */
  function toggleFullscreen() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('cv');
    if (!stage) return;
    
    const isFakeFullscreen = stage.classList.contains('fake-fullscreen');
    
    if (!isFakeFullscreen) {
      // Enter FAKE fullscreen
      stage.classList.add('fake-fullscreen');
      document.body.classList.add('has-fake-fullscreen');
      
      // FORCE stage transform to none IMMEDIATELY via inline style
      stage.style.setProperty('transform', 'none', 'important');
      stage.style.setProperty('transition', 'none', 'important');
      
      // FORCE canvas size to match internal buffer
      if (canvas) {
        const internalW = canvas.width;
        const internalH = canvas.height;
        
        console.log('[DEBUG] Canvas internal buffer:', internalW, 'x', internalH);
        console.log('[DEBUG] Canvas HTML attributes:', canvas.getAttribute('width'), 'x', canvas.getAttribute('height'));
        console.log('[DEBUG] mapDef:', window.mapDef?.w, 'x', window.mapDef?.h);
        
        // Also set min/max to prevent any CSS from shrinking it
        canvas.style.setProperty('width', internalW + 'px', 'important');
        canvas.style.setProperty('height', internalH + 'px', 'important');
        canvas.style.setProperty('min-width', internalW + 'px', 'important');
        canvas.style.setProperty('min-height', internalH + 'px', 'important');
        canvas.style.setProperty('max-width', internalW + 'px', 'important');
        canvas.style.setProperty('max-height', internalH + 'px', 'important');
        canvas.style.setProperty('padding', '0', 'important');
        canvas.style.setProperty('border', 'none', 'important');
        canvas.style.setProperty('box-sizing', 'content-box', 'important');
      }
      
      // FORCE REFLOW - this makes browser apply all style changes immediately
      void stage.offsetHeight;
      void canvas?.offsetHeight;
      
      // Force redraw
      if (typeof window.render === 'function') {
        window.render();
      }
      if (typeof window.drawMap === 'function') {
        window.drawMap();
      }
      
      console.log('[Fullscreen] Stage transform:', getComputedStyle(stage).transform);
      console.log('[Fullscreen] Canvas rect:', canvas?.getBoundingClientRect().width, 'x', canvas?.getBoundingClientRect().height);
      console.log('[Fullscreen] Entered FAKE fullscreen');
    } else {
      // Exit fake fullscreen
      stage.classList.remove('fake-fullscreen');
      document.body.classList.remove('has-fake-fullscreen');
      
      // Clear stage and canvas inline styles
      stage.style.removeProperty('transform');
      stage.style.removeProperty('transition');
      if (canvas) {
        canvas.style.cssText = '';
      }
      
      // Restore stage transform
      if (typeof window.applyStageTransform === 'function') {
        window.applyStageTransform();
      }
      
      console.log('[Fullscreen] Exited FAKE fullscreen');
    }
    
    // Update button appearance
    updateFullscreenButton();
  }
  
  /**
   * Update fullscreen button appearance
   */
  function updateFullscreenButton() {
    const btn = document.getElementById('fullscreenToggle');
    const stage = document.getElementById('stage');
    
    // Check for FAKE fullscreen (CSS-based) instead of browser fullscreen
    const isFullscreen = stage && stage.classList.contains('fake-fullscreen');
    
    if (!btn) return;
    
    const icon = btn.querySelector('.btn-icon');
    const text = btn.querySelector('.btn-text');
    
    if (isFullscreen) {
      if (icon) icon.textContent = '⛶';
      if (text) text.textContent = 'Exit';
      btn.style.background = 'linear-gradient(135deg, #e65100, #bf360c)';
      btn.title = 'Thoát toàn màn hình (F11)';
    } else {
      if (icon) icon.textContent = '⛶';
      if (text) text.textContent = 'Full';
      btn.style.background = 'linear-gradient(135deg, #00897b, #00695c)';
      btn.title = 'Toàn màn hình (F11)';
    }
  }

  /**
   * Setup keyboard controls for horse movement
   */
  function setupKeyboardControls() {
    console.log('[DevMode] Setting up keyboard controls...');
    
    // Keyboard event listeners
    document.addEventListener('keydown', (e) => {
      // Dev Mode toggle (always active)
      if (e.key === 'F3') {
        e.preventDefault();
        toggleDevMode();
        return;
      }
      
      if (!devModeEnabled) return;
      
      if (e.key === 'F5') {
        e.preventDefault();
        setupPlayerHorse(true); // Reset retry count
      }
      
      // Movement keys
      const key = e.code || e.key;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space', 'Tab'].includes(key)) {
        e.preventDefault();
        keyStates[key] = true;
        // console.log('[DevMode] Key pressed:', key, '- Active keys:', Object.keys(keyStates).filter(k => keyStates[k])); // Debug disabled
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!devModeEnabled) return;
      
      const key = e.code || e.key;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space', 'Tab'].includes(key)) {
        e.preventDefault();
        keyStates[key] = false;
        // console.log('[DevMode] Key released:', key, '- Active keys:', Object.keys(keyStates).filter(k => keyStates[k])); // Debug disabled
      }
    });
    
    // console.log('[DevMode] Keyboard controls setup complete');
    // console.log('[DevMode] 🎮 Press W key to test keyboard detection...');
  }

  /**
   * Toggle Dev Mode on/off
   */
  function toggleDevMode() {
    if (devModeEnabled) {
      disableDevMode();
    } else {
      enableDevMode();
    }
  }

  /**
   * Populate horse selection dropdown
   */
  function populateHorseDropdown() {
    const horseSelect = document.getElementById('playerHorseSelect');
    const horsesArray = getHorses();
    if (!horseSelect || !horsesArray) return;

    // Clear existing options
    horseSelect.innerHTML = '';

    // Add options for each horse
    horsesArray.forEach((horse, index) => {
      const option = document.createElement('option');
      option.value = index.toString();
      
      // Get horse name or use default
      const horseName = horse.name || `#${index + 1}`;
      const skillName = horse.skillState?.name || 'none';
      
      option.textContent = `${horseName} (${skillName})`;
      horseSelect.appendChild(option);
    });

    console.log(`[DevMode] Populated dropdown with ${horsesArray.length} horses`);
  }

  /**
   * Enable Dev Mode
   */
  function enableDevMode() {
    console.log('[DevMode] Enabling...');
    
    devModeEnabled = true;
    
    // Show controls overlay
    const controlsOverlay = document.getElementById('devModeControls');
    if (controlsOverlay) {
      controlsOverlay.style.display = 'block';
    }

    // Update toggle button
    const toggleBtn = document.getElementById('devModeToggle');
    if (toggleBtn) {
      toggleBtn.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
      const btnText = toggleBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Dev ON';
    }

    // Wait for horses to be available and then setup
    setupPlayerHorse();

    console.log('[DevMode] Enabled successfully');
  }

  /**
   * Setup player horse (with retry logic)
   */
  function setupPlayerHorse(resetRetry = false) {
    if (resetRetry) {
      retryCount = 0;
    }
    
    // console.log(`[DevMode] Setting up player horse... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    
    const horsesArray = getHorses();
    if (horsesArray && horsesArray.length > 0) {
      // console.log(`[DevMode] Found ${horsesArray.length} horses`);
      
      // Reset retry count on success
      retryCount = 0;
      
      // Populate horse dropdown
      populateHorseDropdown();
      
      // Select first horse as player controlled
      setPlayerHorse(0);
      
      // Show notification
      try {
        if (w.showFlash) {
          w.showFlash(`🎮 Dev Mode: Controlling ${playerControlledHorse?.originalName || '#1'}`);
        }
      } catch {}
    } else {
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        console.warn('[DevMode] Max retries reached.');
        console.log('[DevMode] 🎯 MANUAL SETUP: Start a race first, then press F5 to refresh!');
        try {
          if (w.showFlash) {
            w.showFlash('🎮 Start race first, then press F5!');
          }
        } catch {}
        return;
      }
      
      console.log(`[DevMode] No horses found, retrying... (${retryCount}/${MAX_RETRIES})`);
      
      // Show notification that we're waiting (only first few times)
      if (retryCount <= 3) {
        try {
          if (w.showFlash) {
            w.showFlash('🎮 Dev Mode ON - Start race to create horses...');
          }
        } catch {}
      }
      
      // Retry after a short delay
      setTimeout(() => setupPlayerHorse(false), 500);
    }
  }

  /**
   * Hook into game events to detect when horses are created
   */
  function hookIntoGameEvents() {
    console.log('[DevMode] Installing game event hooks...');
    
    // Delayed hook system - wait for game to fully load
    function installDelayedHooks() {
      // Hook into startRace function where horses are created
      // @ts-ignore
      const originalStartRace = w.startRace;
      if (originalStartRace) {
        // @ts-ignore
        w.startRace = function() {
          console.log('[DevMode] startRace() called - horses will be created...');
          const result = originalStartRace.call(this);
          
          // Check for horses after race starts
          setTimeout(() => {
            if (devModeEnabled) {
              console.log('[DevMode] Auto-refreshing after startRace...');
              setupPlayerHorse(true);
            }
          }, 200);
          
          return result;
        };
        console.log('[DevMode] startRace hook installed');
      }

      // Hook into openGate function 
      // @ts-ignore
      const originalOpenGate = w.openGate;
      if (originalOpenGate) {
        // @ts-ignore
        w.openGate = function() {
          console.log('[DevMode] openGate() called - checking for horses...');
          const result = originalOpenGate.call(this);
          
          setTimeout(() => {
            if (devModeEnabled && !playerControlledHorse) {
              console.log('[DevMode] Auto-refreshing after openGate...');
              setupPlayerHorse(true);
            }
          }, 100);
          
          return result;
        };
        console.log('[DevMode] openGate hook installed');
      }

      // Try to access horses array through global scope
      try {
        // @ts-ignore
        if (typeof window.horses !== 'undefined') {
          console.log('[DevMode] Found window.horses');
        }
        // @ts-ignore  
        if (typeof globalThis.horses !== 'undefined') {
          console.log('[DevMode] Found globalThis.horses');
        }
        
        // Try to access through eval (last resort)
        try {
          const horsesTest = eval('typeof horses !== "undefined" ? horses : null');
          if (horsesTest) {
            console.log('[DevMode] Found horses via eval:', horsesTest.length);
          }
        } catch (e) {
          console.log('[DevMode] Horses not yet available via eval');
        }
      } catch (e) {
        console.log('[DevMode] Error accessing horses:', e);
      }
    }

    // Install hooks immediately
    installDelayedHooks();
    
    // Also install hooks after a delay (in case game loads later)
    setTimeout(installDelayedHooks, 1000);
    setTimeout(installDelayedHooks, 3000);

    console.log('[DevMode] Game event hooks installation complete');
  }

  /**
   * Disable Dev Mode
   */
  function disableDevMode() {
    console.log('[DevMode] Disabling...');
    
    devModeEnabled = false;
    playerControlledHorse = null;
    keyStates = {};

    // Hide controls overlay
    const controlsOverlay = document.getElementById('devModeControls');
    if (controlsOverlay) {
      controlsOverlay.style.display = 'none';
    }

    // Update toggle button
    const toggleBtn = document.getElementById('devModeToggle');
    if (toggleBtn) {
      toggleBtn.style.background = 'linear-gradient(135deg, #9c27b0, #673ab7)';
      const btnText = toggleBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Dev Mode';
    }

    // Show notification
    try {
      if (w.showFlash) {
        w.showFlash('🎮 Dev Mode Disabled');
      }
    } catch {}

    console.log('[DevMode] Disabled successfully');
  }

  /**
   * Set which horse the player controls
   */
  function setPlayerHorse(index) {
    const horsesArray = getHorses();
    if (!horsesArray || index >= horsesArray.length) return;
    
    // Clear previous player horse
    if (playerControlledHorse) {
      playerControlledHorse.isPlayerControlled = false;
    }
    
    playerHorseIndex = index;
    playerControlledHorse = horsesArray[index];
    
    // Mark horse as player controlled
    playerControlledHorse.isPlayerControlled = true;
    playerControlledHorse.originalName = playerControlledHorse.name || `#${index + 1}`;
    
    // Reset velocity to allow immediate player control
    playerControlledHorse.vx = playerControlledHorse.vx || 0;
    playerControlledHorse.vy = playerControlledHorse.vy || 0;
    
    // Update UI
    updatePlayerHorseUI();
    
    console.log(`[DevMode] Player now controls horse #${index + 1} (${playerControlledHorse.originalName})`);
  }

  /**
   * Switch to next horse
   */
  function switchPlayerHorse() {
    const horsesArray = getHorses();
    if (!horsesArray || horsesArray.length === 0) return;
    
    // Clear current player horse
    if (playerControlledHorse) {
      playerControlledHorse.isPlayerControlled = false;
    }
    
    // Switch to next horse
    playerHorseIndex = (playerHorseIndex + 1) % horsesArray.length;
    setPlayerHorse(playerHorseIndex);
    
    try {
      if (w.showFlash) {
        w.showFlash(`🎯 Switched to horse #${playerHorseIndex + 1}`);
      }
    } catch {}
  }

  /**
   * Update player horse UI info
   */
  function updatePlayerHorseUI() {
    if (!playerControlledHorse) return;
    
    const nameSpan = document.getElementById('playerHorseName');
    const skillSpan = document.getElementById('playerSkillStatus');
    const horseSelect = document.getElementById('playerHorseSelect');
    
    if (nameSpan) {
      nameSpan.textContent = playerControlledHorse.originalName || `#${playerHorseIndex + 1}`;
    }
    
    if (skillSpan && playerControlledHorse.skillState) {
      const status = playerControlledHorse.skillState.status || 'ready';
      skillSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Update dropdown selection
    if (horseSelect) {
      /** @type {HTMLSelectElement} */ (horseSelect).value = playerHorseIndex.toString();
    }
  }

  /**
   * Activate player horse skill
   */
  function activatePlayerSkill() {
    if (!playerControlledHorse || !playerControlledHorse.skillState) return;
    
    const skill = playerControlledHorse.skillState;
    const now = performance.now();
    
    // Check if skill is ready
    if (skill.status !== 'ready') {
      try {
        if (w.showFlash) {
          w.showFlash(`⏳ Skill not ready (${skill.status})`);
        }
      } catch {}
      return;
    }
    
    // Check activation time
    if (now < (skill.activationTime || 0)) {
      const remaining = Math.ceil(((skill.activationTime || 0) - now) / 1000);
      try {
        if (w.showFlash) {
          w.showFlash(`⏱️ Skill ready in ${remaining}s`);
        }
      } catch {}
      return;
    }
    
    // Activate skill manually
    skill.status = 'active';
    
    try {
      if (w.showFlash) {
        w.showFlash(`🚀 ${skill.name} activated!`);
      }
    } catch {}
    
    console.log(`[DevMode] Player activated skill: ${skill.name}`);
  }

  /**
   * Update player horse movement based on input
   */
  function updatePlayerMovement(deltaTime) {
    if (!devModeEnabled || !playerControlledHorse) return;
    
    const horse = playerControlledHorse;
    const dt = deltaTime / 16.67; // Normalize to 60fps
    
    // CRITICAL: Mark horse as player controlled to prevent AI override
    horse.isPlayerControlled = true;
    
    // Debug log when called (disabled to prevent spam)
    // if (Object.keys(keyStates).some(k => keyStates[k])) {
    //   console.log('[DevMode] updatePlayerMovement called with keys:', Object.keys(keyStates).filter(k => keyStates[k]));
    // }
    
    // Get current velocity
    let vx = horse.vx || 0;
    let vy = horse.vy || 0;
    let speed = Math.hypot(vx, vy);
    let angle = Math.atan2(vy, vx);
    
    // Handle input
    let accelerating = false;
    let turning = 0;
    let hasInput = false;
    
    // Acceleration/Deceleration
    if (keyStates['KeyW'] || keyStates['ArrowUp']) {
      speed += CONTROL_SETTINGS.acceleration * dt;
      accelerating = true;
      hasInput = true;
    }
    if (keyStates['KeyS'] || keyStates['ArrowDown']) {
      speed -= CONTROL_SETTINGS.deceleration * dt;
      hasInput = true;
    }
    
    // Turning (only when moving)
    if (speed > 0.1) {
      if (keyStates['KeyA'] || keyStates['ArrowLeft']) {
        turning = -1;
        hasInput = true;
      }
      if (keyStates['KeyD'] || keyStates['ArrowRight']) {
        turning = 1;
        hasInput = true;
      }
      
      if (turning !== 0) {
        angle += turning * CONTROL_SETTINGS.turnSpeed * dt;
      }
    }
    
    // Apply speed limits
    speed = Math.max(0, Math.min(CONTROL_SETTINGS.maxPlayerSpeed, speed));
    
    // Natural deceleration when not accelerating
    if (!accelerating && speed > 0) {
      speed *= Math.pow(0.985, dt); // Gradual slowdown
    }
    
    // If no input and speed is very low, allow horse to stop completely
    if (!hasInput && speed < 0.1) {
      speed = 0;
    }
    
    // Update velocity - FORCE override any AI movement
    horse.vx = Math.cos(angle) * speed;
    horse.vy = Math.sin(angle) * speed;
    
    // Store previous velocity for trail effects
    horse._prevVX = vx;
    horse._prevVY = vy;
    
    // Update direction for sprite rendering
    if (typeof horse.getDir === 'function') {
      horse.getDir();
    }
    
    // Debug log for troubleshooting (disabled to prevent spam)
    // if (hasInput) {
    //   console.log(`[DevMode] Player input: speed=${speed.toFixed(2)}, angle=${(angle * 180 / Math.PI).toFixed(1)}°`);
    // }
  }

  /**
   * Render player horse indicators
   */
  function renderPlayerIndicators(ctx) {
    if (!devModeEnabled || !playerControlledHorse) return;
    
    const horse = playerControlledHorse;
    
    try {
      ctx.save();
      
      // Glow effect around player horse
      ctx.shadowColor = PLAYER_INDICATORS.glowColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = PLAYER_INDICATORS.glowColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(horse.x, horse.y, (horse.r || 18) + 5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Player indicator above horse
      ctx.shadowBlur = 0;
      ctx.fillStyle = PLAYER_INDICATORS.glowColor;
      ctx.font = 'bold 16px "Segoe UI Emoji Flat","Segoe UI Emoji","Segoe UI Symbol",system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👤', horse.x, horse.y - (horse.r || 18) - 15);
      
      ctx.restore();
    } catch (e) {
      console.warn('[DevMode] Render error:', e);
    }
  }

  // Expose DevMode API
  w.DevMode = {
    enabled: () => devModeEnabled,
    playerHorse: () => playerControlledHorse,
    updateMovement: updatePlayerMovement,
    renderIndicators: renderPlayerIndicators,
    init: initDevMode,
    refresh: () => {
      if (devModeEnabled) {
        console.log('[DevMode] Manual refresh...');
        setupPlayerHorse(true); // Reset retry count
      }
    },
    debug: () => {
      console.log('[DevMode Debug]', {
        enabled: devModeEnabled,
        playerHorse: playerControlledHorse?.originalName || 'none',
        isPlayerControlled: playerControlledHorse?.isPlayerControlled || false,
        velocity: playerControlledHorse ? { vx: playerControlledHorse.vx, vy: playerControlledHorse.vy } : null,
        keyStates: Object.keys(keyStates).filter(k => keyStates[k]),
        horsesAvailable: getHorses()?.length || 0
      });
    },
    debugHorses: () => {
      // @ts-ignore
      console.log('[DevMode] Horse Detection Debug:', {
        // @ts-ignore
        globalHorses: typeof horses !== 'undefined' ? horses : 'undefined',
        // @ts-ignore
        windowHorses: window.horses || 'undefined',
        // @ts-ignore
        wHorses: w.horses || 'undefined',
        getHorsesResult: getHorses()
      });
    },
    forceCheck: () => {
      console.log('[DevMode] Force checking for horses...');
      // @ts-ignore
      console.log('Global horses type:', typeof horses);
      // @ts-ignore
      console.log('Global horses value:', horses);
      
      if (devModeEnabled) {
        setupPlayerHorse(true);
      } else {
        console.log('[DevMode] Enable Dev Mode first with F3');
      }
    },
    testHorses: () => {
      console.log('=== HORSE TEST ===');
      
      // Test Method 1: Direct access
      try {
        // @ts-ignore
        console.log('Direct access - typeof horses:', typeof horses);
        // @ts-ignore
        console.log('Direct access - horses defined:', typeof horses !== 'undefined');
        // @ts-ignore
        console.log('Direct access - horses is array:', Array.isArray(horses));
        // @ts-ignore
        console.log('Direct access - horses length:', horses ? horses.length : 'N/A');
      } catch (e) {
        console.log('Direct access failed:', e.message);
      }
      
      // Test Method 2: Window access
      try {
        // @ts-ignore
        console.log('Window access - window.horses:', window.horses);
        // @ts-ignore
        console.log('Window access - w.horses:', w.horses);
        // @ts-ignore
        console.log('Window access - window.gameHorses:', window.gameHorses);
        // @ts-ignore
        console.log('Window access - w.gameHorses:', w.gameHorses);
        // @ts-ignore
        if (w.getGameHorses) {
          console.log('Window access - getGameHorses():', w.getGameHorses());
        }
      } catch (e) {
        console.log('Window access failed:', e.message);
      }
      
      // Test Method 3: Eval access
      try {
        const evalResult = eval('typeof horses !== "undefined" ? horses : "UNDEFINED"');
        console.log('Eval access - result:', evalResult);
        console.log('Eval access - type:', typeof evalResult);
        console.log('Eval access - is array:', Array.isArray(evalResult));
      } catch (e) {
        console.log('Eval access failed:', e.message);
      }
      
      // Test getHorses function
      const getHorsesResult = getHorses();
      console.log('getHorses() result:', getHorsesResult);
      
      console.log('==================');
    },
    setupNow: () => {
      console.log('[DevMode] Manual setup now...');
      const horsesArray = getHorses();
      if (horsesArray && horsesArray.length > 0) {
        populateHorseDropdown();
        setPlayerHorse(0);
        console.log('[DevMode] Setup complete! Player controls horse #1');
      } else {
        console.log('[DevMode] No horses found for setup');
      }
    },
    testMovement: () => {
      console.log('=== MOVEMENT TEST ===');
      console.log('Dev Mode enabled:', devModeEnabled);
      console.log('Player horse:', playerControlledHorse?.originalName || 'none');
      console.log('Player horse isPlayerControlled:', playerControlledHorse?.isPlayerControlled);
      console.log('Current velocity:', {
        vx: playerControlledHorse?.vx || 0,
        vy: playerControlledHorse?.vy || 0
      });
      console.log('Key states:', Object.keys(keyStates).filter(k => keyStates[k]));
      // @ts-ignore
      console.log('Window.step exists:', typeof window.step === 'function');
      // @ts-ignore
      console.log('Window.gameStep exists:', typeof window.gameStep === 'function');
      // @ts-ignore
      console.log('Global step exists:', typeof step !== 'undefined');
      console.log('==================');
      
      // Test manual movement
      if (playerControlledHorse) {
        console.log('Testing manual movement...');
        playerControlledHorse.vx = 2;
        playerControlledHorse.vy = 0;
        console.log('Set velocity to vx=2, vy=0');
        
        // Test keyboard simulation
        console.log('Simulating W key press...');
        keyStates['KeyW'] = true;
        
        // Manual call updatePlayerMovement to test
        console.log('Manually calling updatePlayerMovement...');
        updatePlayerMovement(16.67);
        
        setTimeout(() => {
          keyStates['KeyW'] = false;
          console.log('W key released');
          
          // Check if velocity stuck after AI processing
          setTimeout(() => {
            console.log('Final velocity after AI:', {
              vx: playerControlledHorse?.vx || 0,
              vy: playerControlledHorse?.vy || 0
            });
          }, 100);
        }, 1000);
      }
    },
    testControl: () => {
      if (!playerControlledHorse) {
        console.log('❌ No player horse! Run DevMode.setupNow() first');
        return;
      }
      
      console.log('🎮 Testing manual control...');
      
      // Get current position
      const startX = playerControlledHorse.x;
      const startY = playerControlledHorse.y;
      
      // Set upward velocity
      playerControlledHorse.vx = 0;
      playerControlledHorse.vy = -3; // Move up
      
      setTimeout(() => {
        const deltaX = playerControlledHorse.x - startX;
        const deltaY = playerControlledHorse.y - startY;
        const moved = Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1;
        
        console.log(moved ? '✅ Manual control WORKS!' : '❌ Manual control FAILED');
        console.log(`📍 Movement: ${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}`);
      }, 500);
    },
    liveTest: () => {
      console.log('🔴 LIVE TEST - Hold W key and watch:');
      const interval = setInterval(() => {
        const activeKeys = Object.keys(keyStates).filter(k => keyStates[k]);
        console.log('⏰ Active keys:', activeKeys.length ? activeKeys : 'none');
        
        if (activeKeys.includes('KeyW') && playerControlledHorse) {
          console.log('🎮 W detected - applying movement...');
          playerControlledHorse.vy = -2; // Move up
        }
      }, 500);
      
      setTimeout(() => {
        clearInterval(interval);
        console.log('🔴 Live test ended');
      }, 5000);
    },
    quickTest: () => {
      console.log('🔧 Quick Status:');
      console.log('Dev Mode:', devModeEnabled ? '✅ ON' : '❌ OFF');
      console.log('Player Horse:', playerControlledHorse ? '✅ SET' : '❌ NONE');
      console.log('Keys Active:', Object.keys(keyStates).filter(k => keyStates[k]).join(', ') || 'none');
    },
    getKeyStates: () => keyStates,
    forceMove: () => {
      if (!playerControlledHorse) {
        console.log('❌ No player horse');
        return;
      }
      
      console.log('🚀 Force moving horse UP for 2 seconds...');
      console.log('Initial position:', playerControlledHorse.x, playerControlledHorse.y);
      console.log('isPlayerControlled flag:', playerControlledHorse.isPlayerControlled);
      console.log('Horse object keys:', Object.keys(playerControlledHorse).slice(0, 10));
      
      const startX = playerControlledHorse.x;
      const startY = playerControlledHorse.y;
      
      // Force movement
      playerControlledHorse.vx = 0;
      playerControlledHorse.vy = -4;
      
      // Check position every 200ms
      const checkInterval = setInterval(() => {
        const deltaX = playerControlledHorse.x - startX;
        const deltaY = playerControlledHorse.y - startY;
        console.log('Position delta:', deltaX.toFixed(1), deltaY.toFixed(1), 'Velocity:', playerControlledHorse.vx.toFixed(1), playerControlledHorse.vy.toFixed(1));
      }, 200);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('🛑 Stopping forced movement');
        const finalDeltaX = playerControlledHorse.x - startX;
        const finalDeltaY = playerControlledHorse.y - startY;
        console.log('Final movement:', finalDeltaX.toFixed(1), finalDeltaY.toFixed(1));
        
        if (Math.abs(finalDeltaX) < 1 && Math.abs(finalDeltaY) < 1) {
          console.log('❌ NO MOVEMENT DETECTED - Position update blocked!');
        } else {
          console.log('✅ Movement successful');
        }
      }, 2000);
    },
    checkGameState: () => {
      console.log('🔍 Game State Check:');
      // @ts-ignore
      console.log('mode:', window.gameMode ? window.gameMode() : 'not exposed');
      // @ts-ignore  
      console.log('running:', window.gameRunning ? window.gameRunning() : 'not exposed');
      // @ts-ignore
      console.log('gateOpen:', window.gameGateOpen ? window.gameGateOpen() : 'not exposed');
      // @ts-ignore
      console.log('paused:', window.gamePaused ? window.gamePaused() : 'not exposed');
      
      if (playerControlledHorse) {
        console.log('Player horse eliminated:', playerControlledHorse.eliminated);
        console.log('Player horse isPlayerControlled:', playerControlledHorse.isPlayerControlled);
      }
      
      // Check step function conditions
      // @ts-ignore
      const mode = window.gameMode ? window.gameMode() : null;
      // @ts-ignore
      const running = window.gameRunning ? window.gameRunning() : null;
      
      if (mode !== "play") {
        console.log('❌ Game not in PLAY mode - step function will exit');
      } else if (!running) {
        console.log('❌ Game not RUNNING - step function will exit');
      } else {
        console.log('✅ Game conditions OK for movement');
      }
    },
    directMove: () => {
      if (!playerControlledHorse) {
        console.log('❌ No player horse');
        return;
      }
      
      console.log('🎯 DIRECT position manipulation test...');
      const startX = playerControlledHorse.x;
      const startY = playerControlledHorse.y;
      
      console.log('Before:', startX.toFixed(1), startY.toFixed(1));
      
      // Direct position change (bypass all game logic)
      playerControlledHorse.x -= 50; // Move left
      playerControlledHorse.y -= 50; // Move up
      
      console.log('After:', playerControlledHorse.x.toFixed(1), playerControlledHorse.y.toFixed(1));
      
      // Check if it sticks after 500ms
      setTimeout(() => {
        console.log('Final:', playerControlledHorse.x.toFixed(1), playerControlledHorse.y.toFixed(1));
        const deltaX = playerControlledHorse.x - startX;
        const deltaY = playerControlledHorse.y - startY;
        
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          console.log('✅ Direct position change WORKS!');
          console.log('🔍 Problem is in velocity->position conversion');
        } else {
          console.log('❌ Even direct position change gets reset!');
          console.log('🔍 Something is overriding position completely');
        }
      }, 500);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevMode);
  } else {
    initDevMode();
  }

  console.log('[DevMode] Module loaded');
})();
