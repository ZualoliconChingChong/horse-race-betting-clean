/**
 * Performance Timing
 * Legacy FPS timing variables for render loop compatibility
 * 
 * Public API:
 * - window.PerformanceTiming (module object)
 * - window.fpsAccum, fpsCount, fpsStamp (for compatibility)
 * - window.fpsHudEl (DOM element reference)
 * 
 * Dependencies:
 * - HTML elements: #fpsHud
 */

(function() {
  'use strict';

  // ===== Performance Timing Variables =====
  let fpsAccum = 0;
  let fpsCount = 0; 
  let fpsStamp = performance.now();
  const fpsHudEl = document.getElementById('fpsHud');

  // ===== Public API =====
  const PerformanceTiming = {
    get fpsAccum() { return fpsAccum; },
    set fpsAccum(val) { fpsAccum = val; },
    get fpsCount() { return fpsCount; },
    set fpsCount(val) { fpsCount = val; },
    get fpsStamp() { return fpsStamp; },
    set fpsStamp(val) { fpsStamp = val; },
    get fpsHudEl() { return fpsHudEl; }
  };

  if (typeof window !== 'undefined') {
    window.PerformanceTiming = Object.freeze(PerformanceTiming);
    
    // Expose variables for backward compatibility
    Object.defineProperty(window, 'fpsAccum', {
      get: () => fpsAccum,
      set: (val) => { fpsAccum = val; },
      enumerable: true
    });
    Object.defineProperty(window, 'fpsCount', {
      get: () => fpsCount,
      set: (val) => { fpsCount = val; },
      enumerable: true
    });
    Object.defineProperty(window, 'fpsStamp', {
      get: () => fpsStamp,
      set: (val) => { fpsStamp = val; },
      enumerable: true
    });
    window.fpsHudEl = fpsHudEl;
  }

  try {
    console.log('[PerformanceTiming] Loaded successfully');
  } catch {}
})();
