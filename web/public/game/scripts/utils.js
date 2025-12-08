// scripts/utils.js
/**
 * Utility Functions and Error Handling for Horse Maze Game
 * Provides common utilities, error handling, and helper functions
 * to make the codebase more maintainable and AI-friendly
 */

(function() {
  'use strict';

  /**
   * Error handling utilities
   */
  const ErrorHandler = {
    /**
     * Log error with context
     * @param {string} context - Context where error occurred
     * @param {Error} error - Error object
     * @param {Object} additionalData - Additional debug data
     */
    logError(context, error, additionalData = {}) {
      const errorInfo = {
        context,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      console.error(`[${context}] Error:`, errorInfo);
      
      // Store error for debugging
      if (!window.gameErrors) window.gameErrors = [];
      window.gameErrors.push(errorInfo);
      
      // Keep only last 50 errors
      if (window.gameErrors.length > 50) {
        window.gameErrors.shift();
      }
    },

    /**
     * Safe function execution with error handling
     * @param {Function} fn - Function to execute
     * @param {string} context - Context description
     * @param {*} defaultReturn - Default return value on error
     * @returns {*} Function result or default value
     */
    safeExecute(fn, context, defaultReturn = null) {
      try {
        return fn();
      } catch (error) {
        this.logError(context, error);
        return defaultReturn;
      }
    },

    /**
     * Async safe function execution
     * @param {Function} fn - Async function to execute
     * @param {string} context - Context description
     * @param {*} defaultReturn - Default return value on error
     * @returns {Promise<*>} Function result or default value
     */
    async safeExecuteAsync(fn, context, defaultReturn = null) {
      try {
        return await fn();
      } catch (error) {
        this.logError(context, error);
        return defaultReturn;
      }
    }
  };

  /**
   * Math utilities
   */
  const MathUtils = {
    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    /**
     * Linear interpolation
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp(a, b, t) {
      return a + (b - a) * this.clamp(t, 0, 1);
    },

    /**
     * Distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance
     */
    distance(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Angle between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Angle in radians
     */
    angle(x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1);
    },

    /**
     * Normalize angle to 0-2π range
     * @param {number} angle - Angle in radians
     * @returns {number} Normalized angle
     */
    normalizeAngle(angle) {
      while (angle < 0) angle += Math.PI * 2;
      while (angle >= Math.PI * 2) angle -= Math.PI * 2;
      return angle;
    },

    /**
     * Random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    random(min, max) {
      return Math.random() * (max - min) + min;
    },

    /**
     * Random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  };

  /**
   * DOM utilities
   */
  const DOMUtils = {
    /**
     * Get element by ID with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null
     */
    getElementById(id) {
      return ErrorHandler.safeExecute(
        () => document.getElementById(id),
        `DOMUtils.getElementById(${id})`,
        null
      );
    },

    /**
     * Query selector with error handling
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     * @returns {HTMLElement|null} Element or null
     */
    querySelector(selector, parent = document) {
      return ErrorHandler.safeExecute(
        () => parent.querySelector(selector),
        `DOMUtils.querySelector(${selector})`,
        null
      );
    },

    /**
     * Query all selectors with error handling
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     * @returns {NodeList|Array} Elements or empty array
     */
    querySelectorAll(selector, parent = document) {
      return ErrorHandler.safeExecute(
        () => Array.from(parent.querySelectorAll(selector)),
        `DOMUtils.querySelectorAll(${selector})`,
        []
      );
    },

    /**
     * Add event listener with error handling
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListener(element, event, handler, options = {}) {
      if (!element || typeof handler !== 'function') return;

      ErrorHandler.safeExecute(
        () => element.addEventListener(event, handler, options),
        `DOMUtils.addEventListener(${event})`,
        null
      );
    },

    /**
     * Create element with attributes
     * @param {string} tagName - Tag name
     * @param {Object} attributes - Element attributes
     * @param {string} textContent - Text content
     * @returns {HTMLElement} Created element
     */
    createElement(tagName, attributes = {}, textContent = '') {
      return ErrorHandler.safeExecute(() => {
        const element = document.createElement(tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
          } else {
            element.setAttribute(key, value);
          }
        });

        if (textContent) {
          element.textContent = textContent;
        }

        return element;
      }, 'DOMUtils.createElement', null);
    }
  };

  /**
   * Canvas utilities
   */
  const CanvasUtils = {
    /**
     * Get canvas context with error handling
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} contextType - Context type ('2d', 'webgl', etc.)
     * @returns {CanvasRenderingContext2D|null} Context or null
     */
    getContext(canvas, contextType = '2d') {
      if (!canvas) return null;
      
      return ErrorHandler.safeExecute(
        () => canvas.getContext(contextType),
        `CanvasUtils.getContext(${contextType})`,
        null
      );
    },

    /**
     * Clear canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    clear(ctx, width, height) {
      if (!ctx) return;
      
      ErrorHandler.safeExecute(
        () => ctx.clearRect(0, 0, width, height),
        'CanvasUtils.clear',
        null
      );
    },

    /**
     * Save canvas state
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    save(ctx) {
      if (!ctx) return;
      
      ErrorHandler.safeExecute(
        () => ctx.save(),
        'CanvasUtils.save',
        null
      );
    },

    /**
     * Restore canvas state
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    restore(ctx) {
      if (!ctx) return;
      
      ErrorHandler.safeExecute(
        () => ctx.restore(),
        'CanvasUtils.restore',
        null
      );
    },

    /**
     * Set canvas transform with error handling
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} a - Horizontal scaling
     * @param {number} b - Horizontal skewing
     * @param {number} c - Vertical skewing
     * @param {number} d - Vertical scaling
     * @param {number} e - Horizontal translation
     * @param {number} f - Vertical translation
     */
    setTransform(ctx, a, b, c, d, e, f) {
      if (!ctx) return;
      
      ErrorHandler.safeExecute(
        () => ctx.setTransform(a, b, c, d, e, f),
        'CanvasUtils.setTransform',
        null
      );
    }
  };

  /**
   * Performance utilities
   */
  const PerformanceUtils = {
    /**
     * Measure function execution time
     * @param {Function} fn - Function to measure
     * @param {string} label - Label for measurement
     * @returns {*} Function result
     */
    measure(fn, label) {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    },

    /**
     * Debounce function calls
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(fn, delay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    /**
     * Throttle function calls
     * @param {Function} fn - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(fn, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return fn.apply(this, args);
        }
      };
    },

    /**
     * Request animation frame with fallback
     * @param {Function} callback - Animation callback
     * @returns {number} Request ID
     */
    requestAnimationFrame(callback) {
      return (window.requestAnimationFrame || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame || 
              ((cb) => setTimeout(cb, 16)))(callback);
    }
  };

  /**
   * Data validation utilities
   */
  const ValidationUtils = {
    /**
     * Check if value is a number
     * @param {*} value - Value to check
     * @returns {boolean} True if number
     */
    isNumber(value) {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    /**
     * Check if value is a valid coordinate
     * @param {*} x - X coordinate
     * @param {*} y - Y coordinate
     * @returns {boolean} True if valid coordinates
     */
    isValidCoordinate(x, y) {
      return this.isNumber(x) && this.isNumber(y);
    },

    /**
     * Check if object has required properties
     * @param {Object} obj - Object to check
     * @param {Array<string>} requiredProps - Required property names
     * @returns {boolean} True if has all required properties
     */
    hasRequiredProperties(obj, requiredProps) {
      if (!obj || typeof obj !== 'object') return false;
      return requiredProps.every(prop => obj.hasOwnProperty(prop));
    },

    /**
     * Sanitize string for HTML
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHTML(str) {
      if (typeof str !== 'string') return '';
      
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  /**
   * Storage utilities
   */
  const StorageUtils = {
    /**
     * Save data to localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     * @returns {boolean} True if saved successfully
     */
    save(key, data) {
      return ErrorHandler.safeExecute(() => {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      }, `StorageUtils.save(${key})`, false);
    },

    /**
     * Load data from localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Loaded data or default value
     */
    load(key, defaultValue = null) {
      return ErrorHandler.safeExecute(() => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }, `StorageUtils.load(${key})`, defaultValue);
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if removed successfully
     */
    remove(key) {
      return ErrorHandler.safeExecute(() => {
        localStorage.removeItem(key);
        return true;
      }, `StorageUtils.remove(${key})`, false);
    },

    /**
     * Clear all localStorage data
     * @returns {boolean} True if cleared successfully
     */
    clear() {
      return ErrorHandler.safeExecute(() => {
        localStorage.clear();
        return true;
      }, 'StorageUtils.clear', false);
    }
  };

  /**
   * Color utilities
   */
  const ColorUtils = {
    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {Object} RGB object {r, g, b}
     */
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    /**
     * Convert RGB to hex color
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {string} Hex color string
     */
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Create RGBA color string
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha component (0-1)
     * @returns {string} RGBA color string
     */
    rgba(r, g, b, a = 1) {
      return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
    },

    /**
     * Interpolate between two colors
     * @param {string} color1 - First color (hex)
     * @param {string} color2 - Second color (hex)
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {string} Interpolated color (hex)
     */
    interpolate(color1, color2, factor) {
      const c1 = this.hexToRgb(color1);
      const c2 = this.hexToRgb(color2);
      
      if (!c1 || !c2) return color1;
      
      const r = Math.round(MathUtils.lerp(c1.r, c2.r, factor));
      const g = Math.round(MathUtils.lerp(c1.g, c2.g, factor));
      const b = Math.round(MathUtils.lerp(c1.b, c2.b, factor));
      
      return this.rgbToHex(r, g, b);
    }
  };

  // Export all utilities to global scope
  window.Utils = {
    ErrorHandler,
    MathUtils,
    DOMUtils,
    CanvasUtils,
    PerformanceUtils,
    ValidationUtils,
    StorageUtils,
    ColorUtils
  };

  console.log('[Utils] Utility modules loaded');

})();
