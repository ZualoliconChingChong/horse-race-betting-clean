/**
 * Sprite Drawing Utilities
 * Helper functions for drawing sprites with effects (outlines, rotation, tinting)
 * 
 * Public API:
 * - window.SpriteDrawing (module object)
 * - window.getTintedCanvas(img, color)
 * - window.darkenColor(hex, amount)
 * - window.drawSpritePNG(ctx, img, x, y, dir, scale, rotate, outlineOn, outlineColor, outlineWidth, radius)
 * - window.drawHorseSpriteDefault(ctx, x, y, dir, mainColor, accentColor, radius)
 * 
 * Dependencies:
 * - window.PNG_BASE (sprite baseline size)
 * - window.SPR_SCALE (sprite scale factor)
 */

(function() {
  'use strict';

  // ===== Color Utilities =====

  /**
   * Create a tinted canvas from an image
   * @param {HTMLImageElement} img - Source image
   * @param {string} color - Tint color (hex)
   * @returns {HTMLCanvasElement} Tinted canvas
   */
  function getTintedCanvas(img, color) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  /**
   * Darken a hex color by a factor
   * @param {string} hex - Hex color code
   * @param {number} amount - Amount to darken (0..1)
   * @returns {string} Darkened hex color
   */
  function darkenColor(hex, amount) {
    try {
      const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
      if (!m) return hex;
      const r = Math.max(0, Math.min(255, Math.floor(parseInt(m[1], 16) * (1 - amount))));
      const g = Math.max(0, Math.min(255, Math.floor(parseInt(m[2], 16) * (1 - amount))));
      const b = Math.max(0, Math.min(255, Math.floor(parseInt(m[3], 16) * (1 - amount))));
      const toHex = (v) => ('#' + v.toString(16).padStart(2, '0'));
      return toHex(r) + toHex(g).slice(1) + toHex(b).slice(1);
    } catch (e) {
      return hex;
    }
  }

  // ===== Sprite Drawing Functions =====

  /**
   * Draw a PNG sprite with rotation, scaling, and outline
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement} img - Sprite image
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} dir - Direction ('U', 'D', 'L', 'R')
   * @param {number} scale - Scale factor
   * @param {boolean} rotate - Whether to rotate based on direction
   * @param {boolean} outlineOn - Whether to draw outline
   * @param {string} outlineColor - Outline color
   * @param {number} outlineWidth - Outline width in pixels
   * @param {number} radius - Optional radius override
   */
  function drawSpritePNG(ctx, img, x, y, dir, scale, rotate, outlineOn, outlineColor, outlineWidth, radius) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const longest = Math.max(1, Math.max(iw, ih));
    const PNG_BASE = window.PNG_BASE || 42; // Fallback
    const target = radius ? (radius * 2) : (PNG_BASE * scale);
    const drawW = target * (iw / longest);
    const drawH = target * (ih / longest);
    const rot = rotate ? (dir === 'U' ? -Math.PI / 2 : dir === 'D' ? Math.PI / 2 : dir === 'L' ? Math.PI : 0) : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    
    if (outlineOn && outlineWidth > 0) {
      // Build tinted cache lazily per img & color
      let tinted = img._tintedCache && img._tintedCache[outlineColor];
      if (!img._tintedCache) img._tintedCache = {};
      if (!tinted) {
        tinted = getTintedCanvas(img, outlineColor);
        img._tintedCache[outlineColor] = tinted;
      }
      // Draw 8 directions offsets
      const off = outlineWidth;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          ctx.drawImage(tinted, -drawW / 2 + dx * off, -drawH / 2 + dy * off, drawW, drawH);
        }
      }
    }
    
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  /**
   * Draw default horse sprite (fallback vector graphics)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} dir - Direction ('U', 'D', 'L', 'R')
   * @param {string} mainColor - Main body color
   * @param {string} accentColor - Accent color (unused in current implementation)
   * @param {number} radius - Horse radius
   * @param {boolean} rotate - Whether to rotate based on direction (optional, defaults to true for backward compatibility)
   */
  function drawHorseSpriteDefault(ctx, x, y, dir, mainColor, accentColor, radius, rotate = true) {
    ctx.save();
    const SPR_SCALE = window.SPR_SCALE || 1.5; // Fallback
    const scale = radius ? (radius / (10 * SPR_SCALE)) : 1;
    const w = 18 * SPR_SCALE * scale;
    const h = 12 * SPR_SCALE * scale;
    ctx.translate(x, y);
    let rot = 0;
    if (rotate) {
      if (dir === 'U') rot = -Math.PI / 2;
      else if (dir === 'D') rot = Math.PI / 2;
      else if (dir === 'L') rot = Math.PI;
    }
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
    
    // Base body
    ctx.fillStyle = mainColor;
    ctx.fillRect(2 * SPR_SCALE * scale, 3 * SPR_SCALE * scale, 12 * SPR_SCALE * scale, 6 * SPR_SCALE * scale);
    ctx.fillRect(12 * SPR_SCALE * scale, 4 * SPR_SCALE * scale, 4 * SPR_SCALE * scale, 4 * SPR_SCALE * scale);
    
    // Upper body shading uses a darker shade of mainColor
    const shade = darkenColor(mainColor, 0.25);
    ctx.fillStyle = shade;
    ctx.fillRect(3 * SPR_SCALE * scale, 2 * SPR_SCALE * scale, 6 * SPR_SCALE * scale, 2 * SPR_SCALE * scale);
    ctx.fillRect(13 * SPR_SCALE * scale, 4 * SPR_SCALE * scale, 1 * SPR_SCALE * scale, 4 * SPR_SCALE * scale);
    ctx.fillRect(1 * SPR_SCALE * scale, 4 * SPR_SCALE * scale, 1 * SPR_SCALE * scale, 4 * SPR_SCALE * scale);
    
    // Legs
    ctx.fillStyle = "#111";
    ctx.fillRect(4 * SPR_SCALE * scale, 9 * SPR_SCALE * scale, 2 * SPR_SCALE * scale, 2 * SPR_SCALE * scale);
    ctx.fillRect(8 * SPR_SCALE * scale, 9 * SPR_SCALE * scale, 2 * SPR_SCALE * scale, 2 * SPR_SCALE * scale);
    ctx.fillRect(12 * SPR_SCALE * scale, 9 * SPR_SCALE * scale, 2 * SPR_SCALE * scale, 2 * SPR_SCALE * scale);
    
    ctx.restore();
  }

  // ===== Public API =====

  const SpriteDrawing = {
    getTintedCanvas,
    darkenColor,
    drawSpritePNG,
    drawHorseSpriteDefault
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.SpriteDrawing = Object.freeze(SpriteDrawing);
    
    // Backward compatibility - expose individual functions
    window.getTintedCanvas = getTintedCanvas;
    window.darkenColor = darkenColor;
    window.drawSpritePNG = drawSpritePNG;
    window.drawHorseSpriteDefault = drawHorseSpriteDefault;
  }

  try {
    console.log('[SpriteDrawing] Loaded successfully');
  } catch {}
})();
