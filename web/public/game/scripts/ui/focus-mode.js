/**
 * Focus Mode
 * Fullscreen/distraction-free viewing mode for races
 * 
 * Public API:
 * - window.FocusMode (module object)
 * - window.toggleFocusMode()
 * - window.updateFocusScale()
 * 
 * Dependencies:
 * - HTML elements: #stage, .focus-mode class
 * - window.canvas
 */

(function() {
  'use strict';

  // ===== Focus Mode Functions =====

  /**
   * Toggle focus mode on/off
   */
  function toggleFocusMode() {
    const isFocused = document.body.classList.toggle('focus-mode');
    const stage = document.getElementById('stage');
    if (isFocused) {
      updateFocusScale();
    } else {
      if (stage) stage.style.transform = 'scale(1)';
    }
  }

  /**
   * Helper to compute focus-mode scale
   */
  function updateFocusScale() {
    const stage = document.getElementById('stage');
    const canvas = window.canvas;
    if (!stage || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = window.innerWidth / rect.width;
    const scaleY = window.innerHeight / rect.height;
    const scale = Math.min(scaleX, scaleY) * 0.98; // 2% margin
    stage.style.transform = `scale(${scale})`;
  }

  // ===== Event Listeners =====

  // Focus button click handler
  const focusBtn = document.getElementById('focusBtn');
  if (focusBtn) {
    focusBtn.addEventListener('click', toggleFocusMode);
  }

  // F3 hotkey for focus mode
  document.addEventListener('keydown', (e) => {
    // Toggle Focus Mode (F3) only when focus button is visible (i.e., play mode)
    if (e.code === 'F3') {
      const btn = focusBtn;
      if (btn && getComputedStyle(btn).display !== 'none') {
        e.preventDefault();
        try { toggleFocusMode(); } catch {}
      }
    }
  });

  // Recompute focus-mode scale on resize
  window.addEventListener('resize', () => {
    if (document.body.classList.contains('focus-mode')) {
      updateFocusScale();
    }
  });

  // ===== Public API =====

  const FocusMode = {
    toggleFocusMode,
    updateFocusScale
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.FocusMode = Object.freeze(FocusMode);
    
    // Backward compatibility - expose individual functions
    window.toggleFocusMode = toggleFocusMode;
    window.updateFocusScale = updateFocusScale;
  }

  try {
    console.log('[FocusMode] Loaded successfully');
  } catch {}
})();
