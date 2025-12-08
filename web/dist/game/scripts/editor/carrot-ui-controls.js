/**
 * Carrot UI Controls
 * Manages carrot toggle checkboxes and updates carrot state
 * 
 * Public API:
 * - window.CarrotUIControls (module object)
 * - window.updateCarrots()
 * - window.initCarrotListeners()
 * 
 * Dependencies:
 * - window.mapDef.carrots
 * - window.rebuildCarrotSpriteCaches()
 * - window.updateCarrotHUD()
 * - window.drawMap()
 * - HTML elements: #carrotAOn, #carrotBOn
 */

(function() {
  'use strict';

  // ===== Carrot Update Function =====

  /**
   * Create/refresh carrots from UI toggles while preserving existing positions/sprites
   */
  function updateCarrots() {
    if (!window.mapDef) window.mapDef = {};
    const prev = Array.isArray(window.mapDef.carrots) ? window.mapDef.carrots.slice() : [];
    const getPrev = id => prev.find(c => c.id === id);

    const aEl = document.getElementById('carrotAOn');
    const bEl = document.getElementById('carrotBOn');
    if (!aEl || !bEl) {
      console.warn('[CarrotUIControls] Carrot toggle elements not found');
      return;
    }

    const wantA = !!aEl.checked;
    const wantB = !!bEl.checked;
    const r = parseInt((window.mapDef.carrotRadius ?? 15), 10) || 15;

    const next = [];
    
    if (wantA) {
      const pa = getPrev('A');
      next.push({
        id: 'A',
        x: pa?.x ?? 1120,
        y: pa?.y ?? 820,
        r: pa?.r ?? r,
        enabled: true,
        sprite: pa?.sprite,
        _img: pa?._img,
        scale: pa?.scale ?? '1.0',
        outline: pa?.outline ?? 'off',
        outlineColor: pa?.outlineColor ?? '#FFFFFF',
        outlineWidth: pa?.outlineWidth ?? 2
      });
    }
    
    if (wantB) {
      const pb = getPrev('B');
      next.push({
        id: 'B',
        x: pb?.x ?? 980,
        y: pb?.y ?? 820,
        r: pb?.r ?? r,
        enabled: true,
        sprite: pb?.sprite,
        _img: pb?._img,
        scale: pb?.scale ?? '1.0',
        outline: pb?.outline ?? 'off',
        outlineColor: pb?.outlineColor ?? '#FFFFFF',
        outlineWidth: pb?.outlineWidth ?? 2
      });
    }

    window.mapDef.carrots = next;
    
    if (typeof window.rebuildCarrotSpriteCaches === 'function') {
      window.rebuildCarrotSpriteCaches();
    }
    if (typeof window.updateCarrotHUD === 'function') {
      window.updateCarrotHUD();
    }
    if (typeof window.drawMap === 'function') {
      window.drawMap();
    }
  }

  // ===== Initialize Carrot Listeners =====

  /**
   * Initialize carrot toggle listeners
   */
  function initCarrotListeners() {
    const carrotAEl = document.getElementById('carrotAOn');
    const carrotBEl = document.getElementById('carrotBOn');
    
    if (carrotAEl && carrotBEl) {
      carrotAEl.addEventListener('change', updateCarrots);
      carrotBEl.addEventListener('change', updateCarrots);
      
      // Initialize carrots after listeners are set
      updateCarrots();
    } else {
      console.warn('[CarrotUIControls] Carrot toggle elements not found');
    }
  }

  // Initialize carrot system when DOM is ready
  initCarrotListeners();

  // ===== Public API =====

  const CarrotUIControls = {
    updateCarrots,
    initCarrotListeners
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.CarrotUIControls = Object.freeze(CarrotUIControls);
    
    // Backward compatibility - expose individual functions
    window.updateCarrots = updateCarrots;
    window.initCarrotListeners = initCarrotListeners;
  }

  try {
    console.log('[CarrotUIControls] Loaded successfully');
  } catch {}
})();
