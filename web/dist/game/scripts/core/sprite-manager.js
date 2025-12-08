/**
 * Sprite Management System
 * Handles loading, caching, and randomization of horse sprites
 * 
 * Public API:
 * - window.SpriteManager (module object)
 * - window.rebuildSpriteCacheFor(i)
 * - window.rebuildSpriteCaches()
 * - window.getAllHorseSpriteSources()
 * - window.randomizeSpriteAt(i)
 * 
 * Dependencies:
 * - window.mapDef
 * - window.ensureCustomIndex(i)
 * - window.availableBuiltInHorseSprites
 * - window.customSpriteSources
 */

(function() {
  'use strict';

  // ===== Sprite Cache Management =====

  /**
   * Rebuild sprite cache for a specific horse index
   * @param {number} i - Horse index
   */
  function rebuildSpriteCacheFor(i) {
    if (!window.ensureCustomIndex) {
      console.warn('[SpriteManager] ensureCustomIndex not available');
      return;
    }
    
    const c = window.ensureCustomIndex(i);
    if (!c.sprite) {
      delete c._img;
      delete c._tinted;
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      c._img = img;
      c._tinted = null; // Will rebuild when first draw with current color
    };
    img.src = c.sprite;
  }

  /**
   * Rebuild all sprite caches for all horses
   */
  function rebuildSpriteCaches() {
    if (!window.mapDef || !window.mapDef.horseCustoms) return;
    
    for (let i = 0; i < window.mapDef.horseCustoms.length; i++) {
      if (window.mapDef.horseCustoms[i] && window.mapDef.horseCustoms[i].sprite) {
        rebuildSpriteCacheFor(i);
      }
    }
  }

  // ===== Sprite Source Management =====

  /**
   * Get all available horse sprite sources (built-in + custom)
   * @returns {string[]} Array of sprite sources
   */
  function getAllHorseSpriteSources() {
    try {
      const builtins = Array.isArray(window.availableBuiltInHorseSprites) 
        ? window.availableBuiltInHorseSprites 
        : [];
      const customs = Array.isArray(window.customSpriteSources) 
        ? window.customSpriteSources 
        : [];
      const all = builtins.concat(customs).filter(Boolean);
      return Array.from(new Set(all));
    } catch {
      return [];
    }
  }

  /**
   * Assign a random sprite to a horse
   * @param {number} i - Horse index
   * @returns {boolean} True if sprite was applied, false if no sprites available
   */
  function randomizeSpriteAt(i) {
    const pool = getAllHorseSpriteSources();
    if (!pool || pool.length === 0) return false;
    
    const src = pool[Math.floor(Math.random() * pool.length)];
    
    if (!window.ensureCustomIndex || !window.mapDef) {
      console.warn('[SpriteManager] Dependencies not available');
      return false;
    }
    
    window.ensureCustomIndex(i);
    window.mapDef.horseCustoms[i].sprite = src;
    rebuildSpriteCacheFor(i);
    return true;
  }

  // ===== Public API =====

  const SpriteManager = {
    rebuildSpriteCacheFor,
    rebuildSpriteCaches,
    getAllHorseSpriteSources,
    randomizeSpriteAt
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.SpriteManager = Object.freeze(SpriteManager);
    
    // Backward compatibility - expose individual functions
    window.rebuildSpriteCacheFor = rebuildSpriteCacheFor;
    window.rebuildSpriteCaches = rebuildSpriteCaches;
    window.getAllHorseSpriteSources = getAllHorseSpriteSources;
    window.randomizeSpriteAt = randomizeSpriteAt;
  }

  try {
    console.log('[SpriteManager] Loaded successfully');
  } catch {}
})();
