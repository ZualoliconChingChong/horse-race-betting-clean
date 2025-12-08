/**
 * Input Validation Utilities
 * Safely validates and sanitizes user inputs
 * SAFE: Pure functions, no side effects
 */

const Validators = {
  /**
   * Validate number with min/max bounds
   * @param {*} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} defaultValue - Default if invalid
   * @returns {number} Valid number
   */
  number(value, min = -Infinity, max = Infinity, defaultValue = 0) {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, num));
  },
  
  /**
   * Validate integer
   */
  integer(value, min = -Infinity, max = Infinity, defaultValue = 0) {
    const num = parseInt(value, 10);
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, Math.floor(num)));
  },
  
  /**
   * Validate hex color
   * @param {string} value - Color to validate
   * @param {string} defaultValue - Default color
   * @returns {string} Valid hex color
   */
  hexColor(value, defaultValue = '#000000') {
    if (typeof value !== 'string') return defaultValue;
    
    const hex = value.trim().toUpperCase();
    
    // Full hex: #RRGGBB
    if (/^#[0-9A-F]{6}$/.test(hex)) return hex;
    
    // Short hex: #RGB -> #RRGGBB
    if (/^#[0-9A-F]{3}$/.test(hex)) {
      const r = hex[1], g = hex[2], b = hex[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    
    return defaultValue;
  },
  
  /**
   * Validate speed multiplier (0.1 - 10.0)
   */
  speed(value) {
    return this.number(value, 0.1, 10.0, 1.0);
  },
  
  /**
   * Validate angle (normalize to 0-2π)
   */
  angle(value) {
    const rad = this.number(value, -Infinity, Infinity, 0);
    // Normalize to 0-2π range
    const TWO_PI = Math.PI * 2;
    return ((rad % TWO_PI) + TWO_PI) % TWO_PI;
  },
  
  /**
   * Validate boolean
   */
  boolean(value, defaultValue = false) {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return defaultValue;
  },
  
  /**
   * Validate string with max length
   */
  string(value, maxLength = 100, defaultValue = '') {
    if (typeof value !== 'string') return defaultValue;
    return value.slice(0, maxLength);
  },
  
  /**
   * Validate array index
   */
  arrayIndex(index, arrayLength, defaultValue = -1) {
    const idx = this.integer(index);
    if (idx < 0 || idx >= arrayLength) {
      return defaultValue;
    }
    return idx;
  },
  
  /**
   * Clamp value between min and max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.Validators = Validators;
}
