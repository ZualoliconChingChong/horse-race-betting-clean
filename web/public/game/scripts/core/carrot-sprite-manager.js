/**
 * Carrot Sprite Manager
 * Handles loading and caching of carrot sprites
 * 
 * Public API:
 * - window.CarrotSpriteManager (module object)
 * - window.carrotSpriteImg (global sprite image)
 * - window.rebuildCarrotSpriteCaches()
 * - window.loadCarrotSprites()
 * 
 * Dependencies:
 * - window.mapDef
 * - window.invalidateStaticLayer()
 * - window.drawMap()
 * - window.toast()
 */

(function() {
  'use strict';

  // ===== Global Carrot Sprite Image =====
  
  /**
   * Global carrot sprite image (shared across all carrots unless overridden)
   */
  let carrotSpriteImg = window.carrotSpriteImg || null;

  // ===== Sprite Cache Management =====

  /**
   * Rebuild sprite caches for all carrots
   */
  function rebuildCarrotSpriteCaches() {
    if (!window.mapDef || !window.mapDef.carrots) return;
    
    window.mapDef.carrots.forEach(c => {
      if (c.sprite) {
        c._img = new Image();
        c._img.src = c.sprite;
      }
    });
  }

  /**
   * Load carrot sprites from mapDef and localStorage
   */
  function loadCarrotSprites() {
    if (carrotSpriteImg) return; // Already loaded
    
    try {
      let src = (window.mapDef && window.mapDef.carrotSprite) 
        ? window.mapDef.carrotSprite 
        : (localStorage.getItem('carrotSprite') || '');
      
      if (!src) {
        // Lightweight default without base64: external file bundled with the game
        src = 'assets/carrot.png';
      }
      
      carrotSpriteImg = new Image();
      
      carrotSpriteImg.onload = () => {
        try {
          if (typeof window.invalidateStaticLayer === 'function') {
            window.invalidateStaticLayer();
          }
          if (typeof window.drawMap === 'function') {
            window.drawMap();
          }
        } catch {}
      };
      
      carrotSpriteImg.onerror = () => {
        // Silently ignore if file not found; fallback vector will render
      };
      
      carrotSpriteImg.src = src;
      
      // Only sync back to mapDef if it's a data URL (to keep exports portable)
      if (window.mapDef && !window.mapDef.carrotSprite && typeof src === 'string' && src.startsWith('data:')) {
        window.mapDef.carrotSprite = src;
      }
      
      // Expose globally
      window.carrotSpriteImg = carrotSpriteImg;
    } catch {}
  }

  // ===== Public API =====

  const CarrotSpriteManager = {
    rebuildCarrotSpriteCaches,
    loadCarrotSprites,
    getCarrotSprite: () => carrotSpriteImg,
    setCarrotSprite: (img) => {
      carrotSpriteImg = img;
      window.carrotSpriteImg = img;
    }
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.CarrotSpriteManager = Object.freeze(CarrotSpriteManager);
    
    // Backward compatibility - expose individual functions
    window.rebuildCarrotSpriteCaches = rebuildCarrotSpriteCaches;
    window.loadCarrotSprites = loadCarrotSprites;
    
    // Initialize carrot sprite on load
    loadCarrotSprites();
  }

  try {
    console.log('[CarrotSpriteManager] Loaded successfully');
  } catch {}
})();
