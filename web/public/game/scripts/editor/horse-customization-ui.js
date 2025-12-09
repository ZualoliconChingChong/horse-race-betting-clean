/**
 * Horse Customization UI
 * UI handlers for horse customization panel in editor
 * 
 * Public API:
 * - window.HorseCustomizationUI (module object)
 * - window.getDefaultHorseInfo(i)
 * - window.getCurrentHorseIndex()
 * - window.loadHorseToUI()
 * - window.applyHorseFromUI()
 * - window.applySkillToHorse(h, skill)
 * 
 * Dependencies:
 * - window.mapDef
 * - window.ensureCustomIndex
 * - window.horses
 * - window.horseIdxEl, horseNameEl, etc. (UI elements)
 * - window.updateSwatches()
 * - window.toast()
 * - window.rebuildSpriteCacheFor()
 */

(function() {
  'use strict';

  // ===== Default Horse Info =====

  /**
   * Get default horse information for a given index
   * @param {number} i - Horse index
   * @returns {Object} Default horse configuration
   */
  function getDefaultHorseInfo(i) {
    const names = Array.from({length: 20}, (_, k) => `Ngựa ${k + 1}`);
    const bodies = [
      '#42a5f5', '#ef5350', '#66bb6a', '#ffa726', '#ab47bc',
      '#26a69a', '#ec407a', '#7e57c2', '#29b6f6', '#ff7043',
      '#26c6da', '#9ccc65', '#ffca28', '#8d6e63', '#5c6bc0',
      '#26a69a', '#42a5f5', '#ef5350', '#66bb6a', '#ffa726'
    ];
    const labels = [
      '#1e88e5', '#c62828', '#2e7d32', '#fb8c00', '#8e24aa',
      '#00897b', '#ad1457', '#5e35b1', '#0288d1', '#f4511e',
      '#00acc1', '#7cb342', '#f9a825', '#6d4c41', '#3949ab',
      '#00897b', '#1e88e5', '#c62828', '#2e7d32', '#fb8c00'
    ];
    const idx = i % 20;
    return {
      name: names[idx],
      body: bodies[idx],
      label: labels[idx],
      scale: '1',
      outline: 'off',
      outlineColor: '#000000',
      outlineWidth: '2'
    };
  }

  // ===== UI Helper Functions =====

  /**
   * Get currently selected horse index from UI
   * @returns {number} Horse index (0-based)
   */
  function getCurrentHorseIndex() {
    const el = document.getElementById('horseIdx');
    if (!el) return 0;
    return Math.max(1, Math.min(50, parseInt(el.value || '1', 10))) - 1;
  }

  /**
   * Load horse data from mapDef to UI elements
   */
  function loadHorseToUI() {
    if (!window.ensureCustomIndex) {
      console.warn('[HorseCustomizationUI] ensureCustomIndex not available');
      return;
    }

    const i = getCurrentHorseIndex();
    const c = window.ensureCustomIndex(i);

    const horseNameEl = document.getElementById('horseName');
    const colorBodyEl = document.getElementById('colorBody');
    const colorLabelEl = document.getElementById('colorLabel');
    const spriteScale = document.getElementById('spriteScale');
    const spriteScaleVal = document.getElementById('spriteScaleVal');
    const spriteOutline = document.getElementById('spriteOutline');
    const spriteOutlineColor = document.getElementById('spriteOutlineColor');
    const spriteOutlineWidth = document.getElementById('spriteOutlineWidth');
    const spriteOutlineWidthVal = document.getElementById('spriteOutlineWidthVal');
    const horseSkillEl = document.getElementById('horseSkill');
    const horseSpeedEl = document.getElementById('horseSpeed');
    const horseHPEl = document.getElementById('horseHP');
    const horseLuckEl = document.getElementById('horseLuck');
    const horseLuckIntervalEl = document.getElementById('horseLuckInterval');

    if (horseNameEl) horseNameEl.value = c.name || '';
    if (colorBodyEl) colorBodyEl.value = c.body || '#42a5f5';
    if (colorLabelEl) colorLabelEl.value = c.label || '#1e88e5';
    if (spriteScale) {
      spriteScale.value = c.scale || '1';
      if (spriteScaleVal) {
        spriteScaleVal.textContent = parseFloat(spriteScale.value).toFixed(2) + '×';
      }
    }
    if (spriteOutline) spriteOutline.value = c.outline || 'off';
    if (spriteOutlineColor) spriteOutlineColor.value = c.outlineColor || '#000000';
    if (spriteOutlineWidth) {
      spriteOutlineWidth.value = c.outlineWidth || '2';
      if (spriteOutlineWidthVal) {
        spriteOutlineWidthVal.textContent = (c.outlineWidth || '2') + 'px';
      }
    }
    if (horseSkillEl) horseSkillEl.value = c.skill || 'none';
    if (horseSpeedEl) horseSpeedEl.value = c.customSpeed || '';
    if (horseHPEl) horseHPEl.value = c.customHP || '';
    if (horseLuckEl) horseLuckEl.value = c.luck || '';
    if (horseLuckIntervalEl) horseLuckIntervalEl.value = c.luckInterval || '';
    if (window.updateSwatches) window.updateSwatches();
  }

  /**
   * Apply skill configuration to an existing horse object
   * @param {Object} h - Horse object
   * @param {string} skill - Skill name
   */
  function applySkillToHorse(h, skill) {
    if (!h || !skill) return;
    // Reset basics that may be affected
    h.speedMod = 1.0;
    h.hasRam = false; h.ramUntil = 0;
    h.hasShield = false; h.shieldUntil = 0;
    h.ghostedUntil = 0;
    h.chainStunUntil = 0; h.chainSlowUntil = 0; h.chainSlowMultiplier = 1.0;
    
    // Build new skillState
    if (skill === 'hunter') {
      h.skillState = { name: 'hunter', status: 'ready', activationTime: 10000, duration: 4500, cooldown: 90000 };
    } else if (skill === 'guardian') {
      h.skillState = { name: 'guardian', status: 'ready', activationTime: 0, cooldown: 60000 };
    } else if (skill === 'phantom_strike') {
      h.skillState = { name: 'phantom_strike', status: 'ready', activationTime: 10000, duration: 2600, cooldown: 85000 };
    } else if (skill === 'cosmic_swap') {
      h.skillState = { name: 'cosmic_swap', status: 'ready', activationTime: 10000, cooldown: 80000 };
    } else if (skill === 'overdrive') {
      h.skillState = { name: 'overdrive', status: 'ready', activationTime: 10000, duration: 2200, cooldown: 60000, overheatDuration: 5000 };
    } else if (skill === 'slipstream') {
      h.skillState = { name: 'slipstream', status: 'ready', activationTime: 10000, duration: 3200, cooldown: 70000 }; h._lastSlipEmitTs = 0;
    } else if (skill === 'shockwave') {
      h.skillState = { name: 'shockwave', status: 'ready', activationTime: 10000, duration: 1200, cooldown: 75000, radius: 80 };
    } else if (skill === 'chain_lightning') {
      h.skillState = { name: 'chain_lightning', status: 'ready', activationTime: 10000, duration: 1200, cooldown: 90000, maxJumps: 3, jumpRadius: 130, stunMs: 2500, slowMs: 3500, slowMultiplier: 0.55 };
    } else if (skill === 'gravity_well') {
      h.skillState = { name: 'gravity_well', status: 'ready', activationTime: 10000, duration: 1400, cooldown: 80000, pullStrength: 0.8 };
    } else if (skill === 'chill_guy') {
      h.skillState = { name: 'chill_guy', status: 'active' };
    } else if (skill === 'energy_ball') {
      // Energy Ball: After 1s cast, creates large slow-moving energy ball that deals 30% HP damage
      h.skillState = { name: 'energy_ball', status: 'ready', activationTime: 10000, castTime: 1000, duration: 20000, cooldown: 35000, damagePercent: 30, ballSpeed: 1, ballRadius: 30 };
    } else if (skill === 'supersonic_speed') {
      // Supersonic Speed: x10 speed for 4s, then 0.5x recovering over 15s
      h.skillState = { name: 'supersonic_speed', status: 'ready', activationTime: 10000, duration: 4000, cooldown: 60000, boostMultiplier: 10.0, slowMultiplier: 0.5, recoveryDuration: 15000 };
    } else if (skill === 'meteor_strike') {
      h.skillState = { name: 'meteor_strike', status: 'ready', activationTime: 12000, cooldown: 45000, meteorCount: 4, damage: 15, stunDuration: 1000 };
    } else if (skill === 'black_hole') {
      h.skillState = { name: 'black_hole', status: 'ready', activationTime: 15000, duration: 3000, cooldown: 50000, radius: 200, pullStrength: 2.0 };
    } else if (skill === 'ice_age') {
      h.skillState = { name: 'ice_age', status: 'ready', activationTime: 12000, duration: 4000, cooldown: 55000, radius: 180, slowMultiplier: 0.3 };
    } else if (skill === 'mirror_image') {
      h.skillState = { name: 'mirror_image', status: 'ready', activationTime: 8000, duration: 8000, cooldown: 40000, cloneCount: 2 };
    } else if (skill === 'time_warp') {
      h.skillState = { name: 'time_warp', status: 'ready', activationTime: 8000, cooldown: 60000, rewindDuration: 8000 };
    } else if (skill === 'blink') {
      h.skillState = { name: 'blink', status: 'ready', activationTime: 5000, cooldown: 15000, distance: 150 };
    } else if (skill === 'rocket_boost') {
      h.skillState = { name: 'rocket_boost', status: 'ready', activationTime: 10000, duration: 1500, cooldown: 35000, speedMultiplier: 8.0, knockbackForce: 3.0 };
    } else if (skill === 'gravity_flip') {
      h.skillState = { name: 'gravity_flip', status: 'ready', activationTime: 12000, duration: 3000, cooldown: 40000 };
    } else if (skill === 'phoenix_rebirth') {
      h.skillState = { name: 'phoenix_rebirth', status: 'passive', used: false, revivePercent: 0.5, invincibleDuration: 3000 };
    } else if (skill === 'avatar_state') {
      h.skillState = { name: 'avatar_state', status: 'ready', activationTime: 10000, duration: 6000, cooldown: 90000, speedMultiplier: 3.0, damageMultiplier: 2.0 };
    } else if (skill === 'dimension_rift') {
      h.skillState = { name: 'dimension_rift', status: 'ready', activationTime: 10000, duration: 10000, cooldown: 50000, portalRadius: 80 };
    } else if (skill === 'rainbow_trail') {
      h.skillState = { name: 'rainbow_trail', status: 'ready', activationTime: 8000, duration: 5000, cooldown: 45000, speedBoost: 1.3, trailBoost: 1.15 };
    } else if (skill === 'disco_chaos') {
      h.skillState = { name: 'disco_chaos', status: 'ready', activationTime: 12000, duration: 4000, cooldown: 50000, radius: 150, redirectInterval: 500 };
    } else if (skill === 'aurora_shield') {
      h.skillState = { name: 'aurora_shield', status: 'ready', activationTime: 10000, duration: 6000, cooldown: 55000, shieldHP: 30, reflectPercent: 0.5 };
    } else {
      h.skillState = null;
    }
  }

  /**
   * Apply horse settings from UI to mapDef
   */
  function applyHorseFromUI() {
    if (!window.ensureCustomIndex) {
      console.warn('[HorseCustomizationUI] ensureCustomIndex not available');
      return;
    }

    const horseIdxEl = document.getElementById('horseIdx');
    const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value || "8", 10)));
    let idx = Math.max(1, Math.min(N, parseInt(horseIdxEl ? horseIdxEl.value : '1', 10))) - 1;
    if (horseIdxEl) horseIdxEl.value = (idx + 1).toString();
    
    const c = window.ensureCustomIndex(getCurrentHorseIndex());
    
    const horseNameEl = document.getElementById('horseName');
    const horseSkillEl = document.getElementById('horseSkill');
    const colorBodyEl = document.getElementById('colorBody');
    const colorLabelEl = document.getElementById('colorLabel');
    const spriteScale = document.getElementById('spriteScale');
    const spriteOutline = document.getElementById('spriteOutline');
    const spriteOutlineColor = document.getElementById('spriteOutlineColor');
    const spriteOutlineWidth = document.getElementById('spriteOutlineWidth');
    const horseSpeedEl = document.getElementById('horseSpeed');
    const horseHPEl = document.getElementById('horseHP');
    const horseLuckEl = document.getElementById('horseLuck');
    const horseLuckIntervalEl = document.getElementById('horseLuckInterval');

    if (horseNameEl) c.name = (horseNameEl.value || '').slice(0, 18);
    if (horseSkillEl) c.skill = horseSkillEl.value;
    if (colorBodyEl) c.body = colorBodyEl.value;
    if (colorLabelEl) c.label = colorLabelEl.value;
    if (spriteScale) c.scale = spriteScale.value;
    if (spriteOutline) c.outline = spriteOutline.value;
    if (spriteOutlineColor) c.outlineColor = spriteOutlineColor.value;
    if (spriteOutlineWidth) c.outlineWidth = spriteOutlineWidth.value;
    
    // Custom stats
    if (horseSpeedEl && horseSpeedEl.value !== '') {
      c.customSpeed = parseFloat(horseSpeedEl.value);
    } else {
      delete c.customSpeed; // Remove if empty
    }
    if (horseHPEl && horseHPEl.value !== '') {
      c.customHP = parseInt(horseHPEl.value, 10);
    } else {
      delete c.customHP; // Remove if empty
    }
    if (horseLuckEl && horseLuckEl.value !== '') {
      c.luck = parseFloat(horseLuckEl.value);
    } else {
      delete c.luck; // Remove if empty
    }
    if (horseLuckIntervalEl && horseLuckIntervalEl.value !== '') {
      c.luckInterval = parseFloat(horseLuckIntervalEl.value);
    } else {
      delete c.luckInterval; // Remove if empty
    }
    
    // If a sprite base64 exists and not loaded yet, rebuild cache
    if (window.rebuildSpriteCacheFor) window.rebuildSpriteCacheFor(idx);
    
    // Live apply: update the currently selected horse object if exists
    try {
      if (Array.isArray(window.horses) && window.horses[idx]) {
        const h = window.horses[idx];
        // Apply color/name immediately
        if (c.name != null) h.name = c.name;
        if (c.body) h.colorBody = c.body;
        if (c.label) h.colorLabel = c.label;
        // Apply skill immediately
        applySkillToHorse(h, c.skill);
      }
    } catch {}
    
    if (window.toast) window.toast(`Đã áp dụng cho ngựa #${idx + 1}`);
  }

  // ===== Auto-apply when custom stats change =====
  
  function initAutoApplyListeners() {
    const horseSpeedEl = document.getElementById('horseSpeed');
    const horseHPEl = document.getElementById('horseHP');
    const horseLuckEl = document.getElementById('horseLuck');
    const horseLuckIntervalEl = document.getElementById('horseLuckInterval');
    
    // Auto-apply when speed changes
    if (horseSpeedEl) {
      horseSpeedEl.addEventListener('input', () => {
        applyHorseFromUI();
      });
    }
    
    // Auto-apply when HP changes
    if (horseHPEl) {
      horseHPEl.addEventListener('input', () => {
        applyHorseFromUI();
      });
    }
    
    // Auto-apply when Luck changes
    if (horseLuckEl) {
      horseLuckEl.addEventListener('input', () => {
        applyHorseFromUI();
      });
    }
    
    // Auto-apply when Luck Interval changes
    if (horseLuckIntervalEl) {
      horseLuckIntervalEl.addEventListener('input', () => {
        applyHorseFromUI();
      });
    }
  }
  
  // Initialize auto-apply listeners when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoApplyListeners);
  } else {
    initAutoApplyListeners();
  }

  // ===== Debug Helper =====
  
  function debugCustomStats() {
    console.log('=== CUSTOM STATS DEBUG ===');
    if (!window.mapDef || !window.mapDef.horseCustoms) {
      console.log('❌ No horseCustoms found in mapDef');
      return;
    }
    
    window.mapDef.horseCustoms.forEach((c, i) => {
      if (!c) return;
      const hasSpeed = c.customSpeed !== undefined;
      const hasHP = c.customHP !== undefined;
      const hasLuck = c.luck !== undefined;
      const hasLuckInterval = c.luckInterval !== undefined;
      
      if (hasSpeed || hasHP || hasLuck || hasLuckInterval) {
        console.log(`Horse #${i + 1} "${c.name || 'Unnamed'}"`);
        if (hasSpeed) console.log(`  🏃 Custom Speed: ${c.customSpeed}`);
        if (hasHP) console.log(`  ❤️ Custom HP: ${c.customHP}`);
        if (hasLuck) console.log(`  🍀 Luck: ${c.luck}%`);
        if (hasLuckInterval) console.log(`  ⏱️ Luck Interval: ${c.luckInterval}s`);
      }
    });
    console.log('======================');
  }

  // ===== Public API =====

  const HorseCustomizationUI = {
    getDefaultHorseInfo,
    getCurrentHorseIndex,
    loadHorseToUI,
    applyHorseFromUI,
    applySkillToHorse,
    debugCustomStats
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.HorseCustomizationUI = Object.freeze(HorseCustomizationUI);
    
    // Backward compatibility - expose individual functions
    window.getDefaultHorseInfo = getDefaultHorseInfo;
    window.getCurrentHorseIndex = getCurrentHorseIndex;
    window.loadHorseToUI = loadHorseToUI;
    window.applyHorseFromUI = applyHorseFromUI;
    window.applySkillToHorse = applySkillToHorse;
    window.debugCustomStats = debugCustomStats;
  }

  try {
    console.log('[HorseCustomizationUI] Loaded successfully');
  } catch {}
})();
