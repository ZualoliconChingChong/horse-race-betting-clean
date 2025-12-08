// scripts/dev-mode-integration.js
// Integration hooks for Dev Mode with existing game loop

(function() {
  'use strict';

  // Wait for game to be ready
  function waitForGame() {
    if (typeof window.step !== 'function' || typeof window.render !== 'function') {
      setTimeout(waitForGame, 100);
      return;
    }
    
    console.log('[DevMode Integration] Game ready, integrating...');
    integrateWithGameLoop();
  }

  /**
   * Integrate Dev Mode with existing game loop
   */
  function integrateWithGameLoop() {
    console.log('[DevMode Integration] Starting integration...');
    
    // Method 1: Hook into step function
    const originalStep = window.step;
    if (originalStep) {
      console.log('[DevMode Integration] Hooking into step function...');
      window.step = function(deltaTime) {
        // Update player movement BEFORE original step to override AI
        try {
          if (window.DevMode && window.DevMode.enabled() && window.DevMode.playerHorse()) {
            window.DevMode.updateMovement(deltaTime || 16.67);
          }
        } catch (e) {
          console.warn('[DevMode Integration] Movement update error:', e);
        }
        
        // Call original step
        const result = originalStep.call(this, deltaTime);
        
        // Force re-apply player control AFTER step to ensure it sticks
        try {
          if (window.DevMode && window.DevMode.enabled() && window.DevMode.playerHorse()) {
            const playerHorse = window.DevMode.playerHorse();
            if (playerHorse) {
              playerHorse.isPlayerControlled = true;
            }
          }
        } catch (e) {
          console.warn('[DevMode Integration] Post-step update error:', e);
        }
        
        return result;
      };
      console.log('[DevMode Integration] Step function hooked successfully');
    } else {
      console.warn('[DevMode Integration] Step function not found');
    }

    // Method 2: Try to hook into extracted-inline step function
    try {
      // @ts-ignore
      if (typeof step === 'function') {
        console.log('[DevMode Integration] Found global step function');
        const originalGlobalStep = step;
        // @ts-ignore
        step = function(deltaTime) {
          // Update player movement
          try {
            if (window.DevMode && window.DevMode.enabled() && window.DevMode.playerHorse()) {
              window.DevMode.updateMovement(deltaTime || 16.67);
            }
          } catch (e) {
            console.warn('[DevMode Integration] Global step movement error:', e);
          }
          
          return originalGlobalStep.call(this, deltaTime);
        };
        console.log('[DevMode Integration] Global step function hooked');
      }
    } catch (e) {
      console.log('[DevMode Integration] Global step hook failed:', e);
    }

    // Hook into render function for visual indicators
    const originalRender = window.render;
    if (originalRender) {
      window.render = function() {
        // Call original render first
        const result = originalRender.call(this);
        
        // Render player indicators if Dev Mode is active
        try {
          if (window.DevMode && window.DevMode.enabled() && window.ctx) {
            window.DevMode.renderIndicators(window.ctx);
          }
        } catch (e) {
          console.warn('[DevMode Integration] Render error:', e);
        }
        
        return result;
      };
    }

    console.log('[DevMode Integration] Integration complete');
  }

  // Start integration when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGame);
  } else {
    waitForGame();
  }

})();
