/**
 * FPS Monitor
 * Tracks and displays frame rate performance
 * 
 * Public API:
 * - window.FPSMonitor (module object)
 * - window.updateFPS() (for compatibility)
 * - window.currentFPS (read-only)
 * 
 * Dependencies:
 * - window.DOMCache
 */

(function() {
  'use strict';

  // ===== FPS Monitoring Variables =====
  let fpsFrames = 0;
  let fpsLastTime = performance.now();
  let currentFPS = 60;

  // ===== FPS Update Function =====
  function updateFPS() {
    fpsFrames++;
    const now = performance.now();
    if (now >= fpsLastTime + 1000) {
      currentFPS = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
      fpsFrames = 0;
      fpsLastTime = now;
      
      // Use DOMCache for better performance
      try {
        if (window.DOMCache && window.DOMCache.setText && window.DOMCache.elements.fpsHud) {
          window.DOMCache.setText(window.DOMCache.elements.fpsHud, currentFPS);
        }
      } catch {}
    }
  }

  // ===== Public API =====
  const FPSMonitor = {
    updateFPS,
    get currentFPS() { return currentFPS; }
  };

  if (typeof window !== 'undefined') {
    window.FPSMonitor = Object.freeze(FPSMonitor);
    window.updateFPS = updateFPS; // Backward compatibility
    Object.defineProperty(window, 'currentFPS', {
      get: () => currentFPS,
      enumerable: true
    });
  }

  try {
    console.log('[FPSMonitor] Loaded successfully');
  } catch {}
})();
