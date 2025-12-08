/**
 * HUD Speed Slider
 * Interactive speed slider for Game HUB
 * 
 * Public API:
 * - window.HUDSpeedSlider (module object)
 * - window.initializeGameHubSpeedSlider()
 * - window.showGameNotification(message, type)
 * - window.showSuccessNotification(message)
 * - window.showWarningNotification(message)
 * - window.showErrorNotification(message)
 * 
 * Dependencies:
 * - window.gameSpeed (global speed variable)
 * - window.showNotification (from notifications.js)
 * - HTML elements: #speedSlider, #speedVal, #speedThumb, #speedLiveVal
 */

(function() {
  'use strict';

  // ===== HUB Speed Slider =====

  /**
   * Initialize the Game HUB speed slider
   */
  function initializeGameHubSpeedSlider() {
    const hubSpeedSlider = document.getElementById('speedSlider');
    const hubSpeedVal = document.getElementById('speedVal');
    const hubSpeedThumb = document.getElementById('speedThumb');
    const hubSpeedValue = document.getElementById('speedLiveVal');
    
    if (!hubSpeedSlider || !hubSpeedVal || !hubSpeedThumb || !hubSpeedValue) {
      console.warn('[HUDSpeedSlider] Required elements not found');
      return;
    }
    
    let isDragging = false;
    
    function updateSlider(value) {
      const percentage = ((value - 0.1) / (3.0 - 0.1)) * 100;
      hubSpeedVal.style.width = percentage + '%';
      hubSpeedThumb.style.left = percentage + '%';
      hubSpeedValue.textContent = value.toFixed(1) + '×';
      
      // Update global speed
      if (window.gameSpeed !== undefined) {
        window.gameSpeed = value;
      }
    }
    
    function handleSliderInteraction(e) {
      const rect = hubSpeedSlider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const value = 0.1 + (percentage / 100) * (3.0 - 0.1);
      updateSlider(value);
    }
    
    hubSpeedSlider.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleSliderInteraction(e);
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        handleSliderInteraction(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    hubSpeedSlider.addEventListener('click', handleSliderInteraction);
    
    // Initialize with default value
    updateSlider(1.0);
  }

  // ===== Enhanced Notification Functions =====

  /**
   * Show game notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  function showGameNotification(message, type = 'game') {
    if (window.showNotification) {
      window.showNotification(message, type, 4000);
    }
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  function showSuccessNotification(message) {
    if (window.showNotification) {
      window.showNotification(message, 'success', 3000);
    }
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   */
  function showWarningNotification(message) {
    if (window.showNotification) {
      window.showNotification(message, 'warning', 5000);
    }
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  function showErrorNotification(message) {
    if (window.showNotification) {
      window.showNotification(message, 'error', 6000);
    }
  }

  // ===== Public API =====

  const HUDSpeedSlider = {
    initializeGameHubSpeedSlider,
    showGameNotification,
    showSuccessNotification,
    showWarningNotification,
    showErrorNotification
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.HUDSpeedSlider = Object.freeze(HUDSpeedSlider);
    
    // Backward compatibility - expose individual functions
    window.initializeGameHubSpeedSlider = initializeGameHubSpeedSlider;
    window.showGameNotification = showGameNotification;
    window.showSuccessNotification = showSuccessNotification;
    window.showWarningNotification = showWarningNotification;
    window.showErrorNotification = showErrorNotification;
  }

  try {
    console.log('[HUDSpeedSlider] Loaded successfully');
  } catch {}
})();
