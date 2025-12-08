/**
 * Visibility & Editor Controls
 * Handles tab visibility changes and HUD editor button
 * 
 * Public API:
 * - window.VisibilityControls (module object)
 * 
 * Dependencies:
 * - window.paused
 * - window.last (performance timing)
 * - window.setMode()
 * - HTML elements: #openEditorBtn, #editorBar
 */

(function() {
  'use strict';

  // ===== Visibility Change Handler =====

  // Pause when tab is hidden
  if (document.visibilityState === 'hidden') {
    window.paused = true;
  }

  document.addEventListener('visibilitychange', () => {
    window.paused = (document.visibilityState === 'hidden');
    // Reset timing so we don't get a huge dt after returning
    if (typeof window.last !== 'undefined') {
      window.last = performance.now();
    }
  });

  // ===== HUD "Open Editor" Button =====

  (function initOpenEditorButton() {
    const btn = document.getElementById('openEditorBtn');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
      const rightbar = document.getElementById('editorBar');
      const cbtn = document.querySelector('#editorHeader .collapse-btn');
      
      if (rightbar) {
        rightbar.style.display = 'block';
        rightbar.classList.remove('collapsed');
        try { localStorage.setItem('rightbarCollapsed', '0'); } catch {}
      }
      
      if (cbtn) {
        cbtn.textContent = '≪';
        cbtn.title = 'Collapse panel';
      }
      
      btn.style.display = 'none';
      
      try {
        if (window.setMode) window.setMode('editor');
      } catch {}
    });
  })();

  // ===== Public API =====

  const VisibilityControls = {
    // This module primarily handles initialization, no public methods needed
  };

  if (typeof window !== 'undefined') {
    window.VisibilityControls = Object.freeze(VisibilityControls);
  }

  try {
    console.log('[VisibilityControls] Loaded successfully');
  } catch {}
})();
