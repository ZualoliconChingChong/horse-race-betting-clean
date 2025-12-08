/**
 * Button Tooltips
 * Sets helpful tooltips for UI buttons
 * 
 * Public API:
 * - window.ButtonTooltips (module object)
 * 
 * Dependencies:
 * - HTML elements: #playBtn, #editBtn, #focusBtn, editor buttons
 */

(function() {
  'use strict';

  // ===== Set Button Tooltips =====

  const playBtnTop = document.getElementById('playBtn');
  if (playBtnTop) playBtnTop.title = 'Start Race (F1)';
  
  const editBtnTop = document.getElementById('editBtn');
  if (editBtnTop) editBtnTop.title = 'Map Editor (F2)';
  
  const focusBtn = document.getElementById('focusBtn');
  if (focusBtn) focusBtn.title = 'Focus Mode';
  
  // Assign titles for editor bar buttons if missing
  document.querySelectorAll('#editorBar button.btn').forEach(b => {
    if (!b.title) b.title = b.textContent.trim();
  });

  // ===== Public API =====

  const ButtonTooltips = {
    // Tooltips initialized
  };

  if (typeof window !== 'undefined') {
    window.ButtonTooltips = Object.freeze(ButtonTooltips);
  }

  try {
    console.log('[ButtonTooltips] Loaded successfully');
  } catch {}
})();
