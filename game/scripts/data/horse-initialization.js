/**
 * Horse Initialization
 * Ensures horse custom data structure and applies defaults
 * 
 * Public API:
 * - window.HorseInitialization (module object)
 * - window.ensureCustomIndex() (for compatibility)
 * 
 * Dependencies:
 * - window.mapDef
 * - window.getDefaultHorseInfo()
 */

(function() {
  'use strict';

  /**
   * Ensure mapDef arrays exist and horse custom data is initialized
   * @param {number} i - Horse index
   * @returns {Object} Horse custom object
   */
  function ensureCustomIndex(i) {
    if (!window.mapDef.boosts) window.mapDef.boosts = [];
    if (!window.mapDef.ghosts) window.mapDef.ghosts = [];
    if (!window.mapDef.rams) window.mapDef.rams = [];
    if (!window.mapDef.teleports) window.mapDef.teleports = [];
    if (!window.mapDef.magnets) window.mapDef.magnets = [];
    if (!window.mapDef.timeFreezes) window.mapDef.timeFreezes = [];
    if (!window.mapDef.icefreezers) window.mapDef.icefreezers = [];
    if (!window.mapDef.poisons) window.mapDef.poisons = [];
    if (!window.mapDef.tornados) window.mapDef.tornados = [];
    if (!window.mapDef.spinners) window.mapDef.spinners = [];
    if (!window.mapDef.shields) window.mapDef.shields = [];
    if (!window.mapDef.turbos) window.mapDef.turbos = [];
    if (!window.mapDef.horseCustoms) window.mapDef.horseCustoms = [];
    
    while (window.mapDef.horseCustoms.length <= i) {
      window.mapDef.horseCustoms.push({});
    }
    
    const c = window.mapDef.horseCustoms[i];
    
    // Apply defaults only for missing fields (do not override user edits)
    if (!c._init) {
      const d = window.getDefaultHorseInfo(i);
      c.name = c.name || d.name;
      c.body = c.body || d.body;
      c.label = c.label || d.label;
      c.scale = c.scale || d.scale;
      c.outline = c.outline || d.outline;
      c.outlineColor = c.outlineColor || d.outlineColor;
      c.outlineWidth = c.outlineWidth || d.outlineWidth;
      c._init = true; // marker so we don't re-apply unless reset
    }
    
    return c;
  }

  // ===== Public API =====
  const HorseInitialization = {
    ensureCustomIndex
  };

  if (typeof window !== 'undefined') {
    window.HorseInitialization = Object.freeze(HorseInitialization);
    
    // Backward compatibility - expose to window for sprite-manager.js
    window.ensureCustomIndex = ensureCustomIndex;
  }

  try {
    console.log('[HorseInitialization] Loaded successfully');
  } catch {}
})();
