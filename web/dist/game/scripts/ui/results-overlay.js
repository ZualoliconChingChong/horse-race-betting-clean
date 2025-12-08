/**
 * Results Overlay Controls
 * Handles "Play Again" and "Close" buttons in race results overlay
 * 
 * Public API:
 * - window.ResultsOverlay (module object)
 * 
 * Dependencies:
 * - window.resultsShown
 * - window.setMode(), startRace()
 * - HTML elements: #playAgainBtn, #closeResultsBtn, #resultsOverlay
 */

(function() {
  'use strict';

  // ===== Results Overlay Button Handlers =====

  const playAgainBtn = document.getElementById('playAgainBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      const ov = document.getElementById('resultsOverlay');
      if (ov) ov.style.display = 'none';
      window.resultsShown = false;
      
      if (window.setMode) window.setMode('play');
      try {
        if (window.startRace) window.startRace();
      } catch (e) {
        console.error('[ResultsOverlay] Failed to start race:', e);
      }
    });
  }

  if (closeResultsBtn) {
    closeResultsBtn.addEventListener('click', () => {
      const ov = document.getElementById('resultsOverlay');
      if (ov) ov.style.display = 'none';
    });
  }

  // ===== Public API =====

  const ResultsOverlay = {
    // Button handlers initialized
  };

  if (typeof window !== 'undefined') {
    window.ResultsOverlay = Object.freeze(ResultsOverlay);
  }

  try {
    console.log('[ResultsOverlay] Loaded successfully');
  } catch {}
})();
