/**
 * Stage Transform & Zoom/Pan System
 * Handles canvas zoom, pan, and stage positioning with persistence
 * 
 * Public API:
 * - window.StageTransform (module object)
 * - window.applyStageTransform() - Apply current transform
 * - window.setStageDrag(enabled) - Enable/disable stage dragging
 * - window.zoomScale, window.panX, window.panY (read-only state)
 */

(function() {
  'use strict';

  // ===== Configuration =====
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2.5;
  const ZOOM_STEP = 0.1;

  // ===== DOM Elements =====
  const stage = document.getElementById('stage');
  const stageHandle = document.getElementById('stageHandle');
  const canvas = document.getElementById('cv');

  // ===== State (restored from localStorage) =====
  let stageDragEnabled = (localStorage.getItem('stageDragEnabled') === '1');
  let stageOffsetX = parseInt(localStorage.getItem('stageOffsetX') || '0', 10);
  let zoomScale = parseFloat(localStorage.getItem('stageZoom') || '1');
  let panX = parseFloat(localStorage.getItem('stagePanX') || '0');
  let panY = parseFloat(localStorage.getItem('stagePanY') || '0');

  // ===== Core Functions =====

  /**
   * Apply current transform to stage
   */
  function applyStageTransform() {
    if (!stage) return;
    stage.style.transformOrigin = '0 0';
    stage.style.transform = `translate(${stageOffsetX + panX}px, ${panY}px) scale(${zoomScale})`;
    
    // Notify HUD to reposition if function exists
    try {
      if (typeof window.positionHudNearStage === 'function') {
        window.positionHudNearStage();
      }
    } catch {}
  }

  /**
   * Enable/disable stage dragging
   * @param {boolean} enabled - Whether dragging is enabled
   */
  function setStageDrag(enabled) {
    stageDragEnabled = enabled;
    localStorage.setItem('stageDragEnabled', enabled ? '1' : '0');
    if (stageHandle) {
      stageHandle.classList.toggle('active', enabled);
    }
  }

  /**
   * Set zoom level (clamped to min/max)
   * @param {number} newZoom - New zoom scale
   * @param {boolean} persist - Whether to save to localStorage
   */
  function setZoom(newZoom, persist = true) {
    zoomScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
    if (persist) {
      localStorage.setItem('stageZoom', String(zoomScale));
    }
    applyStageTransform();
  }

  /**
   * Set pan position
   * @param {number} x - Pan X offset
   * @param {number} y - Pan Y offset
   * @param {boolean} persist - Whether to save to localStorage
   */
  function setPan(x, y, persist = true) {
    panX = x;
    panY = y;
    if (persist) {
      localStorage.setItem('stagePanX', String(panX));
      localStorage.setItem('stagePanY', String(panY));
    }
    applyStageTransform();
  }

  /**
   * Reset zoom and pan to defaults
   */
  function resetTransform() {
    setZoom(1);
    setPan(0, 0);
    stageOffsetX = 0;
    localStorage.setItem('stageOffsetX', '0');
    applyStageTransform();
  }

  // ===== Mouse Wheel Zoom (Zoom-to-Cursor) =====
  if (canvas) {
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      if (!stage) return;
      
      const rect = stage.getBoundingClientRect(); // Transformed rect
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const oldZ = zoomScale;
      const delta = Math.sign(e.deltaY);
      const newZ = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, oldZ + (delta < 0 ? ZOOM_STEP : -ZOOM_STEP)));
      
      if (newZ === oldZ) return;
      
      // Keep world point under cursor stationary: T' = T + (1 - newZ/oldZ) * (S - T)
      const Tx = stageOffsetX + panX;
      const Ty = panY;
      const k = 1 - (newZ / oldZ);
      const Tpx = Tx + k * (cursorX - Tx);
      const Tpy = Ty + k * (cursorY - Ty);
      
      zoomScale = newZ;
      panX = Tpx - stageOffsetX;
      panY = Tpy;
      
      localStorage.setItem('stageZoom', String(zoomScale));
      localStorage.setItem('stagePanX', String(panX));
      localStorage.setItem('stagePanY', String(panY));
      
      applyStageTransform();
      
      // Force immediate HUD repositioning after zoom - multiple calls to ensure it works
      try {
        if (typeof window.positionHudNearStage === 'function') {
          window.positionHudNearStage();
        }
      } catch {}
      
      requestAnimationFrame(() => {
        try {
          if (typeof window.positionHudNearStage === 'function') {
            window.positionHudNearStage();
          }
        } catch {}
      });
      
      setTimeout(() => {
        try {
          if (typeof window.positionHudNearStage === 'function') {
            window.positionHudNearStage();
          }
        } catch {}
      }, 10);
    }, { passive: false });
  }

  // ===== Initialization =====
  applyStageTransform();
  setStageDrag(stageDragEnabled);

  // ===== Public API =====
  const StageTransform = {
    applyTransform: applyStageTransform,
    setStageDrag,
    setZoom,
    setPan,
    resetTransform,
    getZoom: () => zoomScale,
    getPan: () => ({ x: panX, y: panY }),
    getOffset: () => stageOffsetX,
    setOffset: (x) => {
      stageOffsetX = x;
      localStorage.setItem('stageOffsetX', String(x));
      applyStageTransform();
    }
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.StageTransform = Object.freeze(StageTransform);
    
    // Backward compatibility - expose individual functions and state
    window.applyStageTransform = applyStageTransform;
    window.setStageDrag = setStageDrag;
    
    // Expose state as read-only getters
    Object.defineProperty(window, 'zoomScale', {
      get: () => zoomScale,
      enumerable: true
    });
    Object.defineProperty(window, 'panX', {
      get: () => panX,
      enumerable: true
    });
    Object.defineProperty(window, 'panY', {
      get: () => panY,
      enumerable: true
    });
    Object.defineProperty(window, 'stageOffsetX', {
      get: () => stageOffsetX,
      set: (v) => {
        stageOffsetX = v;
        localStorage.setItem('stageOffsetX', String(v));
        applyStageTransform();
      },
      enumerable: true
    });
    Object.defineProperty(window, 'stageDragEnabled', {
      get: () => stageDragEnabled,
      enumerable: true
    });
  }

  try {
    console.log('[StageTransform] Loaded successfully');
  } catch {}
})();
