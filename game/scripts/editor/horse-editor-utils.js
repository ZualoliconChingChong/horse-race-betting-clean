/**
 * Horse Editor Utilities
 * Bulk operations and utilities for editing horses in the editor
 * 
 * Public API:
 * - window.HorseEditorUtils (module object)
 * - window.resetHorseAt(i)
 * - window.copyAllFrom(i0)
 * - window.copyNameAndLabelFrom(srcIdx, N)
 * - window.copySpriteToAllFrom(srcIdx, N)
 * - window.copyOutlineToAllFrom(srcIdx, N)
 * - window.copyBodyColorToAllFrom(srcIdx, N)
 * - window.copySkillToAllFrom(srcIdx, N)
 * - window.randomizeHorseAt(i)
 * - window.randHexColor()
 * - window.getSkillOptions()
 * 
 * Dependencies:
 * - window.ensureCustomIndex
 * - window.mapDef
 * - window.rebuildSpriteCacheFor
 * - window.rebuildSpriteCaches
 * - window.horseSkillEl, colorBodyEl, colorLabelEl
 * - window.updateSwatches
 */

(function() {
  'use strict';

  // ===== Reset Function =====

  /**
   * Reset horse customization to defaults
   * @param {number} i - Horse index
   */
  function resetHorseAt(i) {
    const c = window.ensureCustomIndex(i);
    Object.keys(c).forEach(key => {
      if (['_img', '_tinted'].includes(key)) return; // Don't delete cached images
      delete c[key];
    });
  }

  // ===== Copy Functions =====

  /**
   * Copy all settings from one horse to all others
   * @param {number} i0 - Source horse index
   */
  function copyAllFrom(i0) {
    const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value || "8", 10)));
    const src = window.ensureCustomIndex(i0);
    for (let i = 0; i < N; i++) {
      if (i === i0) continue;
      window.ensureCustomIndex(i);
      window.mapDef.horseCustoms[i] = JSON.parse(JSON.stringify(src));
      if (window.rebuildSpriteCacheFor) window.rebuildSpriteCacheFor(i);
    }
  }

  /**
   * Copy only name and label color
   * @param {number} srcIdx - Source horse index
   * @param {number} N - Number of horses
   */
  function copyNameAndLabelFrom(srcIdx, N) {
    window.ensureCustomIndex(srcIdx);
    const src = window.mapDef.horseCustoms[srcIdx] || {};
    for (let i = 0; i < N; i++) {
      window.ensureCustomIndex(i);
      window.mapDef.horseCustoms[i].name = src.name;
      window.mapDef.horseCustoms[i].label = src.label;
    }
  }

  /**
   * Copy only sprite settings
   * @param {number} srcIdx - Source horse index
   * @param {number} N - Number of horses
   */
  function copySpriteToAllFrom(srcIdx, N) {
    window.ensureCustomIndex(srcIdx);
    const src = window.mapDef.horseCustoms[srcIdx] || {};
    const fields = ['sprite', 'scale', 'rotate', 'outline', 'outlineColor', 'outlineWidth'];
    for (let i = 0; i < N; i++) {
      window.ensureCustomIndex(i);
      for (const f of fields) {
        if (src[f] !== undefined) window.mapDef.horseCustoms[i][f] = src[f];
        else delete window.mapDef.horseCustoms[i][f];
      }
    }
    if (window.rebuildSpriteCaches) window.rebuildSpriteCaches();
  }

  /**
   * Copy only outline settings
   * @param {number} srcIdx - Source horse index
   * @param {number} N - Number of horses
   */
  function copyOutlineToAllFrom(srcIdx, N) {
    window.ensureCustomIndex(srcIdx);
    const src = window.mapDef.horseCustoms[srcIdx] || {};
    const fields = ['outline', 'outlineColor', 'outlineWidth'];
    for (let i = 0; i < N; i++) {
      window.ensureCustomIndex(i);
      for (const f of fields) {
        if (src[f] !== undefined) window.mapDef.horseCustoms[i][f] = src[f];
        else delete window.mapDef.horseCustoms[i][f];
      }
    }
  }

  /**
   * Copy only body color
   * @param {number} srcIdx - Source horse index
   * @param {number} N - Number of horses
   */
  function copyBodyColorToAllFrom(srcIdx, N) {
    window.ensureCustomIndex(srcIdx);
    const src = window.mapDef.horseCustoms[srcIdx] || {};
    for (let i = 0; i < N; i++) {
      window.ensureCustomIndex(i);
      window.mapDef.horseCustoms[i].body = src.body;
      // If sprite has color cache (_tinted), invalidate to rebuild when drawing
      if (window.mapDef.horseCustoms[i]._tinted) delete window.mapDef.horseCustoms[i]._tinted;
    }
  }

  /**
   * Copy only skill
   * @param {number} srcIdx - Source horse index
   * @param {number} N - Number of horses
   */
  function copySkillToAllFrom(srcIdx, N) {
    window.ensureCustomIndex(srcIdx);
    const src = window.mapDef.horseCustoms[srcIdx] || {};
    for (let i = 0; i < N; i++) {
      window.ensureCustomIndex(i);
      window.mapDef.horseCustoms[i].skill = src.skill;
    }
  }

  // ===== Randomization Functions =====

  /**
   * Generate random hex color
   * @returns {string} Hex color string
   */
  function randHexColor() {
    const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }

  /**
   * Get available skill options from select element
   * @returns {string[]} Array of skill names
   */
  function getSkillOptions() {
    const el = document.getElementById('horseSkill');
    if (!el) return ['none'];
    const vals = Array.from(el.options).map(o => (o.value ?? '').trim()).filter(v => v !== '');
    if (!vals.includes('none')) vals.unshift('none');
    return vals;
  }

  /**
   * Randomize horse skill and colors
   * @param {number} i - Horse index
   */
  function randomizeHorseAt(i) {
    window.ensureCustomIndex(i);
    const opts = getSkillOptions();
    const skill = opts[Math.floor(Math.random() * opts.length)];
    const body = randHexColor();
    const label = randHexColor();
    const hc = window.mapDef.horseCustoms[i];
    hc.skill = skill;
    hc.body = body;
    hc.label = label;
    // Update UI immediately if showing this horse
    if (window.horseSkillEl) window.horseSkillEl.value = skill;
    if (window.colorBodyEl) window.colorBodyEl.value = body;
    if (window.colorLabelEl) window.colorLabelEl.value = label;
    if (window.updateSwatches) window.updateSwatches();
    // Invalidate tint cache if exists
    delete hc._tinted;
  }

  // ===== Public API =====

  const HorseEditorUtils = {
    resetHorseAt,
    copyAllFrom,
    copyNameAndLabelFrom,
    copySpriteToAllFrom,
    copyOutlineToAllFrom,
    copyBodyColorToAllFrom,
    copySkillToAllFrom,
    randomizeHorseAt,
    randHexColor,
    getSkillOptions
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.HorseEditorUtils = Object.freeze(HorseEditorUtils);
    
    // Backward compatibility - expose individual functions
    window.resetHorseAt = resetHorseAt;
    window.copyAllFrom = copyAllFrom;
    window.copyNameAndLabelFrom = copyNameAndLabelFrom;
    window.copySpriteToAllFrom = copySpriteToAllFrom;
    window.copyOutlineToAllFrom = copyOutlineToAllFrom;
    window.copyBodyColorToAllFrom = copyBodyColorToAllFrom;
    window.copySkillToAllFrom = copySkillToAllFrom;
    window.randomizeHorseAt = randomizeHorseAt;
    window.randHexColor = randHexColor;
    window.getSkillOptions = getSkillOptions;
  }

  try {
    console.log('[HorseEditorUtils] Loaded successfully');
  } catch {}
})();
