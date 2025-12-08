/**
 * Drawing Effects Utilities
 * Helper functions for visual effects (glow, animations, etc.)
 * 
 * Public API:
 * - window.DrawingEffects (module object)
 * - window.drawGlow(ctx, x, y, r, color, alpha)
 * - window.glowAlpha(base, speed, phase)
 */

(function() {
  'use strict';

  // ===== Glow Effects =====

  /**
   * Draw a subtle radial glow around an object
   * Note: Currently disabled globally, but kept for future use
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} r - Radius
   * @param {string} color - Glow color
   * @param {number} alpha - Glow opacity (0-1)
   */
  function drawGlow(ctx, x, y, r, color, alpha = 0.35) {
    // Glow disabled globally for performance
    // Uncomment below to re-enable:
    /*
    const gradient = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.6);
    gradient.addColorStop(0, color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    */
    return;
  }

  /**
   * Calculate breathing/pulsing alpha value over time
   * Useful for animated glow effects
   * @param {number} base - Base alpha value (0-1)
   * @param {number} speed - Animation speed multiplier
   * @param {number} phase - Phase offset for animation
   * @returns {number} Animated alpha value
   */
  function glowAlpha(base = 0.35, speed = 1.0, phase = 0) {
    const t = performance.now() * 0.001 * speed + phase;
    const k = 0.85 + 0.15 * Math.sin(t); // ~15% breathing effect
    return Math.max(0, Math.min(1, base * k));
  }

  // ===== Public API =====

  const DrawingEffects = {
    drawGlow,
    glowAlpha
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.DrawingEffects = Object.freeze(DrawingEffects);
    
    // Backward compatibility - expose individual functions
    window.drawGlow = drawGlow;
    window.glowAlpha = glowAlpha;
  }

  try {
    console.log('[DrawingEffects] Loaded successfully');
  } catch {}
})();
