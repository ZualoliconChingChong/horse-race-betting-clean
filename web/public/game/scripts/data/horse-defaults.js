/**
 * Horse Default Constants
 * Default names, colors, and configuration for horses
 * 
 * Public API:
 * - window.HorseDefaults (module object)
 * - window.NAMES (array)
 * - window.COLORS (array)
 * - window.BODY (array)
 * - window.SPR_SCALE (number)
 * - window.PNG_BASE (number)
 */

(function() {
  'use strict';

  // ===== Default Horse Names =====
  const NAMES = [
    "Bullet", "Grey", "Merry", "Red", "Yellow", "Pink", "Knob", "Blue", "Swift", "Brick",
    "Nova", "Jazz", "Mint", "Coral", "Lime", "Indigo", "Olive", "Teal", "Onyx", "Pearl"
  ];

  // ===== Default Horse Colors (Label) =====
  const COLORS = [
    "#1e88e5", "#90a4ae", "#7e57c2", "#ef5350", "#f9a825", "#ec407a", "#26a69a", "#00acc1",
    "#43a047", "#8e24aa", "#5c6bc0", "#2e7d32", "#6d4c41", "#039be5", "#ff7043", "#26c6da",
    "#00897b", "#7cb342", "#c2185b", "#afb42b"
  ];

  // ===== Default Horse Body Colors =====
  const BODY = [
    "#42a5f5", "#cfd8dc", "#9575cd", "#e57373", "#ffca28", "#f48fb1", "#4db6ac", "#26c6da",
    "#81c784", "#b39ddb", "#9fa8da", "#66bb6a", "#a1887f", "#81d4fa", "#ffab91", "#80deea",
    "#80cbc4", "#aed581", "#f06292", "#cddc39"
  ];

  // ===== Sprite Configuration =====
  const SPR_SCALE = 1.5; // Sprite scale factor
  const PNG_BASE = 28 * SPR_SCALE; // Baseline for longest side (42 pixels)

  // ===== Public API =====

  const HorseDefaults = {
    NAMES,
    COLORS,
    BODY,
    SPR_SCALE,
    PNG_BASE
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.HorseDefaults = Object.freeze(HorseDefaults);
    
    // Backward compatibility - expose individual constants
    window.NAMES = NAMES;
    window.COLORS = COLORS;
    window.BODY = BODY;
    window.SPR_SCALE = SPR_SCALE;
    window.PNG_BASE = PNG_BASE;
  }

  try {
    console.log('[HorseDefaults] Loaded successfully');
  } catch {}
})();
