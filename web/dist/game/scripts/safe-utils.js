/**
 * Safe Utility Functions
 * Array and DOM utilities with safety checks
 * SAFE: All functions have fallbacks, won't crash
 */

const SafeUtils = {
  /**
   * Safe array access - returns null if out of bounds
   */
  arrayGet(array, index, defaultValue = null) {
    if (!Array.isArray(array)) return defaultValue;
    if (index < 0 || index >= array.length) return defaultValue;
    return array[index];
  },
  
  /**
   * Safe array forEach - handles array mutations during iteration
   */
  arrayForEach(array, callback) {
    if (!Array.isArray(array)) return;
    
    // Cache length to handle array modifications
    const originalLength = array.length;
    
    for (let i = 0; i < originalLength; i++) {
      // Check if index still valid (array might have been modified)
      if (i >= array.length) break;
      
      const item = array[i];
      if (item !== undefined) {
        callback(item, i, array);
      }
    }
  },
  
  /**
   * Safe nested loop for collision detection
   * Handles array modifications gracefully
   */
  arrayNestedLoop(array, callback) {
    if (!Array.isArray(array)) return;
    
    const len = array.length;
    
    for (let i = 0; i < len; i++) {
      if (i >= array.length) break;
      
      for (let j = i + 1; j < len; j++) {
        if (j >= array.length) break;
        
        const itemA = array[i];
        const itemB = array[j];
        
        if (itemA && itemB) {
          callback(itemA, itemB, i, j);
        }
      }
    }
  },
  
  /**
   * Safe DOM element getter
   */
  getElement(id) {
    try {
      return document.getElementById(id);
    } catch (e) {
      console.warn('[SafeUtils] Failed to get element:', id, e);
      return null;
    }
  },
  
  /**
   * Safe DOM text setter
   */
  setElementText(id, text) {
    try {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = text;
        return true;
      }
    } catch (e) {
      console.warn('[SafeUtils] Failed to set text:', id, e);
    }
    return false;
  },
  
  /**
   * Safe function execution with fallback
   */
  safeExecute(fn, context = '', defaultValue = null) {
    try {
      return fn();
    } catch (error) {
      if (window.DEBUG_MODE) {
        console.error(`[SafeUtils] Error in ${context}:`, error);
      }
      return defaultValue;
    }
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.SafeUtils = SafeUtils;
}
