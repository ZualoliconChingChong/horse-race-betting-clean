/**
 * Grid Drawing Utilities
 * Cached grid rendering for editor performance
 * 
 * Public API:
 * - window.GridDrawing (module object)
 * - window.invalidateGrid() (for compatibility)
 * - window.drawGridCached() (for compatibility)
 * - window.lastGridStep (for compatibility)
 * 
 * Dependencies: None
 */

(function() {
  'use strict';

  // ===== Grid Cache Variables =====
  let gridCanvas = null;
  let gridCtx = null;
  let gridCacheKey = '';
  let lastGridStep = 20; // remember last non-zero grid step for toggle

  /**
   * Invalidate grid offscreen cache.
   */
  function invalidateGrid() { 
    gridCacheKey = ''; 
  }

  /**
   * Draw the snapping grid using an offscreen cache for performance.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} step
   * @param {number} width
   * @param {number} height
   */
  function drawGridCached(ctx, step, width, height) {
    const key = `${width}x${height}@${step}`;
    if (!gridCanvas || !gridCtx || gridCacheKey !== key) {
      gridCanvas = document.createElement('canvas');
      gridCanvas.width = width;
      gridCanvas.height = height;
      gridCtx = gridCanvas.getContext('2d');
      gridCtx.clearRect(0, 0, width, height);
      gridCtx.strokeStyle = 'rgba(0,0,0,0.1)';
      gridCtx.lineWidth = 1;
      gridCtx.beginPath();
      for (let x = 0; x < width; x += step) { 
        gridCtx.moveTo(x, 0); 
        gridCtx.lineTo(x, height); 
      }
      for (let y = 0; y < height; y += step) { 
        gridCtx.moveTo(0, y); 
        gridCtx.lineTo(width, y); 
      }
      gridCtx.stroke();
      gridCacheKey = key;
    }
    ctx.drawImage(gridCanvas, 0, 0);
  }

  // ===== Public API =====
  const GridDrawing = {
    invalidateGrid,
    drawGridCached,
    get lastGridStep() { return lastGridStep; },
    set lastGridStep(val) { lastGridStep = val; }
  };

  if (typeof window !== 'undefined') {
    window.GridDrawing = Object.freeze(GridDrawing);
    
    // Backward compatibility
    window.invalidateGrid = invalidateGrid;
    window.drawGridCached = drawGridCached;
    Object.defineProperty(window, 'lastGridStep', {
      get: () => lastGridStep,
      set: (val) => { lastGridStep = val; },
      enumerable: true
    });
  }

  try {
    console.log('[GridDrawing] Loaded successfully');
  } catch {}
})();
