/**
 * Drawing Helper Functions
 * Utility functions for drawing various shapes
 * 
 * Public API:
 * - window.DrawingHelpers (module object)
 * - window.drawBrushes()
 */

(function() {
  'use strict';

  /**
   * Draw all brush strokes from mapDef
   */
  function drawBrushes() {
    if (!window.ctx || !window.mapDef) return;
    
    const ctx = window.ctx;
    const mapDef = window.mapDef;
    const WALL = window.WALL || '#2c3e50';
    
    ctx.save();
    for (const b of mapDef.brushes) {
      // Visual differentiation
      if (b.type === 'break') {
        ctx.strokeStyle = '#ff6e6e';
        ctx.shadowColor = '#ff6e6e';
        ctx.shadowBlur = 6;
      } else if (b.type === 'soft') {
        ctx.strokeStyle = '#6ecbff';
        ctx.shadowColor = '#6ecbff';
        ctx.shadowBlur = 6;
      } else {
        ctx.strokeStyle = b.color || WALL;
        ctx.shadowBlur = 0;
      }
      
      // Call drawBrushStroke if available
      if (typeof window.drawBrushStroke === 'function') {
        window.drawBrushStroke(b.points, b.r, false, b);
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // ===== Public API =====

  const DrawingHelpers = {
    drawBrushes
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.DrawingHelpers = Object.freeze(DrawingHelpers);
    window.drawBrushes = drawBrushes;
  }

  try {
    console.log('[DrawingHelpers] Loaded successfully');
  } catch {}
})();
