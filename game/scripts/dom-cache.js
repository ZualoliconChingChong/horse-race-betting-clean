/**
 * DOM Element Cache System
 * Caches frequently accessed DOM elements for better performance
 * SAFE: This file doesn't modify existing code, just provides utilities
 */

const DOMCache = {
  // Cached elements
  elements: {},
  
  /**
   * Initialize cache - call after DOM loads
   */
  init() {
    console.log('[DOMCache] Initializing...');
    
    // HUD elements
    this.elements.timer = document.getElementById('timer');
    this.elements.fpsHud = document.getElementById('fpsHud');
    this.elements.horsesCount = document.getElementById('horsesCount');
    this.elements.carrotActive = document.getElementById('carrotActive');
    this.elements.speedVal = document.getElementById('speedVal');
    this.elements.speedThumb = document.getElementById('speedThumb');
    this.elements.speedLiveVal = document.getElementById('speedLiveVal');
    
    // Notification
    this.elements.notificationBar = document.getElementById('notificationBar');
    this.elements.notificationIcon = document.getElementById('notificationIcon');
    this.elements.gameNotificationText = document.getElementById('gameNotificationText');
    this.elements.gameHub = document.getElementById('gameHub');
    
    // Controls
    this.elements.playPause = document.getElementById('playPause');
    this.elements.hudPlayTest = document.getElementById('hudPlayTest');
    
    // Canvas
    this.elements.canvas = document.getElementById('cv');
    this.elements.ctx = this.elements.canvas ? this.elements.canvas.getContext('2d') : null;
    
    const valid = this.validate();
    console.log('[DOMCache] Initialized:', valid ? 'SUCCESS' : 'PARTIAL');
    return valid;
  },
  
  /**
   * Validate critical elements exist
   */
  validate() {
    const critical = ['canvas', 'ctx', 'timer', 'fpsHud'];
    const missing = critical.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      console.warn('[DOMCache] Missing critical elements:', missing);
      return false;
    }
    return true;
  },
  
  /**
   * Get cached element (fallback to document.getElementById)
   */
  get(id) {
    if (this.elements[id]) {
      return this.elements[id];
    }
    // Fallback to direct query if not cached
    return document.getElementById(id);
  },
  
  /**
   * Safe text setter - won't crash if element is null
   */
  setText(element, text) {
    if (element && element.textContent !== undefined) {
      element.textContent = text;
      return true;
    }
    return false;
  },
  
  /**
   * Batch HUD update
   */
  updateHUD(data) {
    if (data.timer !== undefined) {
      this.setText(this.elements.timer, data.timer);
    }
    if (data.fps !== undefined) {
      this.setText(this.elements.fpsHud, data.fps);
    }
    if (data.horses !== undefined) {
      this.setText(this.elements.horsesCount, data.horses);
    }
    if (data.carrot !== undefined) {
      this.setText(this.elements.carrotActive, data.carrot);
    }
  }
};

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DOMCache.init());
  } else {
    // DOM already loaded
    DOMCache.init();
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.DOMCache = DOMCache;
}
