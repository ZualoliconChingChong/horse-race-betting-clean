/**
 * Editor Keyboard Shortcuts
 * Handles Undo/Redo hotkeys and Delete key for editor objects
 * 
 * Public API:
 * - window.EditorShortcuts (module object)
 * 
 * Dependencies:
 * - window.undo(), redo(), pushHistory()
 * - window.selected (selected editor object)
 * - window.mapDef.spinners, mapDef.belts
 * - window.invalidateStaticLayer(), drawMap(), startMainLoop()
 * - window.setMode(), startRace()
 */

(function() {
  'use strict';

  // ===== Editor Keyboard Shortcuts =====

  window.addEventListener('keydown', (e) => {
    // Undo / Redo hotkeys (Ctrl/Cmd+Z, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      try { if (window.undo) window.undo(); } catch {}
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      try { if (window.redo) window.redo(); } catch {}
      return;
    }
    
    // Delete spinner
    if (e.key === 'Delete' && window.selected && window.selected.type === 'spinner') {
      const idx = window.mapDef.spinners.indexOf(window.selected);
      if (idx > -1) {
        try { if (window.pushHistory) window.pushHistory('delete spinner'); } catch {}
        window.mapDef.spinners.splice(idx, 1);
        window.selected = null;
        try {
          if (window.invalidateStaticLayer) window.invalidateStaticLayer();
          if (window.drawMap) window.drawMap();
          if (window.startMainLoop) window.startMainLoop();
        } catch {}
      }
    }
    
    // Delete belt
    else if (e.key === 'Delete' && window.selected && window.selected.type === 'belt') {
      const idx = (window.mapDef.belts || []).indexOf(window.selected);
      if (idx > -1) {
        try { if (window.pushHistory) window.pushHistory('delete belt'); } catch {}
        window.mapDef.belts.splice(idx, 1);
        window.selected = null;
        try {
          if (window.invalidateStaticLayer) window.invalidateStaticLayer();
          if (window.drawMap) window.drawMap();
          if (window.startMainLoop) window.startMainLoop();
        } catch {}
      }
    }
  });

  // ===== Public API =====

  const EditorShortcuts = {
    // This module primarily handles keyboard events
  };

  if (typeof window !== 'undefined') {
    window.EditorShortcuts = Object.freeze(EditorShortcuts);
  }

  try {
    console.log('[EditorShortcuts] Loaded successfully');
  } catch {}
})();
