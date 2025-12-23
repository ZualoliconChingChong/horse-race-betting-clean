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
    
    // Don't apply transform when in fullscreen mode (browser OR fake fullscreen)
    const isBrowserFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    const isFakeFullscreen = stage.classList.contains('fake-fullscreen');
    
    if (isBrowserFullscreen || isFakeFullscreen) {
      stage.style.transform = 'none';
      return;
    }
    
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

  // ===== Touch pinch-zoom handling =====
  let pinchState = null;

  function getTouchDistance(touches) {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchCenter(touches) {
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  }

  function beginPinch(e) {
    if (e.touches.length < 2 || !stage) return;
    const rect = stage.getBoundingClientRect();
    const distance = getTouchDistance(e.touches);
    if (!distance) return;
    const center = getTouchCenter(e.touches);
    // Convert center to stage-local coords
    pinchState = {
      distance,
      center,
      rect,
      zoom: zoomScale,
      panX,
      panY
    };
  }

  function updatePinch(e) {
    if (!pinchState || e.touches.length < 2) return;
    e.preventDefault();
    const newDistance = getTouchDistance(e.touches);
    if (!newDistance) return;
    const scaleFactor = newDistance / pinchState.distance;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchState.zoom * scaleFactor));

    const center = getTouchCenter(e.touches);
    const rect = pinchState.rect;

    const stageX = center.x - rect.left;
    const stageY = center.y - rect.top;

    const relativeX = (stageX - stageOffsetX - pinchState.panX) / pinchState.zoom;
    const relativeY = (stageY - pinchState.panY) / pinchState.zoom;

    zoomScale = newZoom;
    panX = stageX - stageOffsetX - relativeX * newZoom;
    panY = stageY - relativeY * newZoom;

    localStorage.setItem('stageZoom', String(zoomScale));
    localStorage.setItem('stagePanX', String(panX));
    localStorage.setItem('stagePanY', String(panY));

    applyStageTransform();
  }

  function endPinch() {
    pinchState = null;
  }

  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 2) {
        beginPinch(e);
      }
    }, { passive: false });

    stage.addEventListener('touchmove', (e) => {
      if (e.touches.length >= 2) {
        updatePinch(e);
      } else {
        endPinch();
      }
    }, { passive: false });

    stage.addEventListener('touchend', () => {
      endPinch();
    });

    stage.addEventListener('touchcancel', () => {
      endPinch();
    });
  }

  // ===== Initialization =====
  applyStageTransform();
  setStageDrag(stageDragEnabled);
  
  // ===== Fullscreen Change Listener =====
  // Reset transform when entering/exiting fullscreen
  document.addEventListener('fullscreenchange', () => {
    applyStageTransform();
  });
  document.addEventListener('webkitfullscreenchange', () => {
    applyStageTransform();
  });

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
