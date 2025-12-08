/**
 * History Management System (Undo/Redo)
 * Manages undo/redo stacks for map editing operations
 * 
 * Public API:
 * - window.HistorySystem (module object)
 * - window.pushHistory(reason) - Add current state to history
 * - window.undo() - Undo last action
 * - window.redo() - Redo last undone action
 * - window.updateHistoryButtons() - Update UI button states
 */

(function() {
  'use strict';

  // ===== Configuration =====
  const UNDO_LIMIT = 60;

  // ===== State =====
  const undoStack = [];
  const redoStack = [];

  // ===== Helper Functions =====

  /**
   * Clone mapDef while excluding private properties (starting with _)
   * @param {Object} src - Source object to clone
   * @returns {Object} Cloned object
   */
  function cloneMapDefClean(src) {
    try {
      return JSON.parse(JSON.stringify(src, (k, v) => (k && k[0] === '_') ? undefined : v));
    } catch {
      // Fallback shallow-ish clone
      return { ...src };
    }
  }

  /**
   * Update undo/redo button states in the UI
   */
  function updateHistoryButtons() {
    try {
      const undoBtn = document.getElementById('undo');
      if (undoBtn) {
        undoBtn.disabled = undoStack.length === 0;
        undoBtn.title = undoBtn.disabled ? 'Không có gì để Undo' : 'Undo (Ctrl+Z)';
      }
      const redoBtn = document.getElementById('redo');
      if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
        redoBtn.title = redoBtn.disabled ? 'Không có gì để Redo' : 'Redo (Ctrl+Y / Ctrl+Shift+Z)';
      }
    } catch {}
  }

  /**
   * Push current mapDef state to undo stack
   * @param {string} reason - Description of the action (for debugging)
   */
  function pushHistory(reason) {
    try {
      redoStack.length = 0; // New branch invalidates redo
      undoStack.push(cloneMapDefClean(window.mapDef));
      if (undoStack.length > UNDO_LIMIT) undoStack.shift();
      updateHistoryButtons();
    } catch {}
  }

  /**
   * Apply a snapshot to the current mapDef
   * @param {Object} snap - Snapshot to apply
   */
  function applyState(snap) {
    try {
      // Replace contents of mapDef in place to keep references stable
      const next = cloneMapDefClean(snap);
      for (const k of Object.keys(window.mapDef)) delete window.mapDef[k];
      Object.assign(window.mapDef, next);
      
      // Rebuild any runtime caches that depend on mapDef
      try {
        if (typeof window.invalidateStaticLayer === 'function') window.invalidateStaticLayer();
        if (typeof window.drawMap === 'function') window.drawMap();
        if (typeof window.startMainLoop === 'function') window.startMainLoop();
      } catch {}
    } catch {}
  }

  /**
   * Undo the last action
   */
  function undo() {
    if (!undoStack.length) {
      try {
        if (typeof window.toast === 'function') window.toast('Không có gì để Undo');
      } catch {}
      return;
    }
    const cur = cloneMapDefClean(window.mapDef);
    const prev = undoStack.pop();
    redoStack.push(cur);
    applyState(prev);
    try {
      updateHistoryButtons();
    } catch {}
  }

  /**
   * Redo the last undone action
   */
  function redo() {
    if (!redoStack.length) {
      try {
        if (typeof window.toast === 'function') window.toast('Không có gì để Redo');
      } catch {}
      return;
    }
    const cur = cloneMapDefClean(window.mapDef);
    const next = redoStack.pop();
    undoStack.push(cur);
    applyState(next);
    try {
      updateHistoryButtons();
    } catch {}
  }

  // ===== Public API =====
  const HistorySystem = {
    pushHistory,
    undo,
    redo,
    updateHistoryButtons,
    getUndoCount: () => undoStack.length,
    getRedoCount: () => redoStack.length,
    clearHistory: () => {
      undoStack.length = 0;
      redoStack.length = 0;
      updateHistoryButtons();
    }
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.HistorySystem = Object.freeze(HistorySystem);
    
    // Backward compatibility - expose individual functions
    window.pushHistory = pushHistory;
    window.undo = undo;
    window.redo = redo;
    window.updateHistoryButtons = updateHistoryButtons;
  }

  try {
    console.log('[HistorySystem] Loaded successfully');
  } catch {}
})();
