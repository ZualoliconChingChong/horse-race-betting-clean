/**
 * Vector Drawing Utilities
 * Helper functions for drawing shapes using canvas vector operations
 * 
 * Public API:
 * - window.VectorDrawing (module object)
 * - window.drawVectorCarrot(ctx, x, y, r)
 */

(function() {
  'use strict';

  // ===== Vector Drawing Functions =====

  /**
   * Draw a vector-drawn carrot (no external assets needed)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} r - Radius/size of the carrot
   */
  function drawVectorCarrot(ctx, x, y, r) {
    ctx.save();
    try {
      // Slight tilt for style
      ctx.translate(x, y);
      ctx.rotate(-0.2);

      // Body (triangular-ish)
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.2);
      ctx.lineTo(r * 0.55, r * 0.95);
      ctx.lineTo(-r * 0.55, r * 0.95);
      ctx.closePath();
      ctx.fillStyle = '#ff9800';
      ctx.fill();

      // Soft highlight
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffffff';
      try {
        ctx.beginPath();
        ctx.ellipse(0, r * 0.25, r * 0.35, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      } catch {}
      ctx.globalAlpha = 1.0;

      // Leaves
      ctx.fillStyle = '#43a047';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.35);
        ctx.bezierCurveTo(
          i * r * 0.25, -r * 0.7,
          i * r * 0.45, -r * 0.95,
          i * r * 0.2, -r * 1.1
        );
        ctx.bezierCurveTo(
          i * r * 0.05, -r * 0.98,
          -i * r * 0.05, -r * 0.98,
          0, -r * 0.75
        );
        ctx.closePath();
        ctx.fill();
      }
    } finally {
      ctx.restore();
    }
  }

  // ===== Public API =====

  const VectorDrawing = {
    drawVectorCarrot
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.VectorDrawing = Object.freeze(VectorDrawing);
    
    // Backward compatibility - expose individual functions
    window.drawVectorCarrot = drawVectorCarrot;
  }

  try {
    console.log('[VectorDrawing] Loaded successfully');
  } catch {}
})();
