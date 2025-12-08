/**
 * UI Initialization
 * Button event handlers and UI element initialization
 * 
 * Public API:
 * - window.UIInitialization (module object)
 * 
 * Dependencies:
 * - window.loadHorseToUI, applyHorseFromUI, getCurrentHorseIndex, resetHorseAt
 * - window.copyNameAndLabelFrom
 * - window.toast
 * - window.setMode, startRace
 * - window.resultsShown
 * - HTML elements: various UI buttons
 */

(function() {
  'use strict';

  // ===== Horse Editor Button Handlers =====

  const horseIdxEl = document.getElementById('horseIdx');
  const applyHorseBtn = document.getElementById('applyHorse');
  const resetHorseBtn = document.getElementById('resetHorse');
  const copyAllBtn = document.getElementById('copyAll');

  if (horseIdxEl && window.loadHorseToUI) {
    horseIdxEl.addEventListener('change', window.loadHorseToUI);
  }

  if (applyHorseBtn && window.applyHorseFromUI) {
    applyHorseBtn.addEventListener('click', window.applyHorseFromUI);
  }

  if (resetHorseBtn && window.getCurrentHorseIndex && window.resetHorseAt && window.loadHorseToUI) {
    resetHorseBtn.addEventListener('click', () => {
      const i = window.getCurrentHorseIndex();
      window.resetHorseAt(i);
      window.loadHorseToUI();
    });
  }

  if (copyAllBtn && window.getCurrentHorseIndex && window.copyNameAndLabelFrom && window.toast) {
    copyAllBtn.addEventListener('click', () => {
      const i0 = window.getCurrentHorseIndex();
      const nEl = document.getElementById('n');
      const N = Math.max(2, Math.min(50, parseInt(nEl ? nEl.value : '8', 10)));
      window.copyNameAndLabelFrom(i0, N);
      window.toast(`Đã copy Tên và Màu tên từ #${i0 + 1} cho ${N} ngựa`);
    });
  }

  // Load initial horse to UI
  if (window.loadHorseToUI) {
    window.loadHorseToUI();
  }

  // ===== Button Tooltips =====

  (function initializeTooltips() {
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
  })();

  // ===== Results Overlay Handlers =====

  const playAgainBtn = document.getElementById('playAgainBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      const ov = document.getElementById('resultsOverlay');
      if (ov) ov.style.display = 'none';
      if (typeof window.resultsShown !== 'undefined') window.resultsShown = false;
      if (window.setMode) window.setMode('play');
      try {
        if (window.startRace) window.startRace();
      } catch (e) {
        console.error(e);
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

  const UIInitialization = {
    // This module primarily handles initialization, no public methods needed
  };

  if (typeof window !== 'undefined') {
    window.UIInitialization = Object.freeze(UIInitialization);
  }

  try {
    console.log('[UIInitialization] Loaded successfully');
  } catch {}
})();
