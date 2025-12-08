/**
 * Global Constants & Configuration
 * Emoji font settings and debug configuration
 * 
 * Public API:
 * - window.EMOJI_FONT
 * - window.DEBUG_MODE
 * - window.debugLog()
 * 
 * Dependencies: None
 */

(function() {
  'use strict';

  // ===== Emoji Font Configuration =====
  // Windows 10 Flat Emoji Font (Override Windows 11 3D emojis)
  const EMOJI_FONT = '"Segoe UI Emoji Flat","Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji",system-ui,sans-serif';

  // ===== Debug Configuration =====
  const DEBUG_MODE = false; // Set to true for development
  const debugLog = DEBUG_MODE ? console.log.bind(console) : () => {};

  // ===== Export to Global Scope =====
  if (typeof window !== 'undefined') {
    window.EMOJI_FONT = EMOJI_FONT;
    window.DEBUG_MODE = DEBUG_MODE;
    window.debugLog = debugLog;
  }

  try {
    console.log('[Constants] Loaded successfully');
  } catch {}
})();
