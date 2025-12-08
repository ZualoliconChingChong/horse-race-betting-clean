/**
 * Settings Controls
 * Event handlers for game settings sliders (horse count, speed, countdown)
 * 
 * Public API:
 * - window.SettingsControls (module object)
 * 
 * Dependencies:
 * - window.runtimeSpeed
 * - HTML elements: #n, #nVal, #runtimeSpeedSlider, #runtimeSpeedVal, #countdownSlider, #countdownVal
 */

(function() {
  'use strict';

  // ===== Settings Slider Event Handlers =====

  // Horse count slider (n)
  const nEl = document.getElementById('n');
  const nValEl = document.getElementById('nVal');
  if (nEl && nValEl) {
    nEl.addEventListener('input', () => {
      nValEl.textContent = nEl.value;
    });
  }

  // Runtime speed slider
  const runtimeSpeedSliderEl = document.getElementById('runtimeSpeedSlider');
  const runtimeSpeedValEl = document.getElementById('runtimeSpeedVal');
  if (runtimeSpeedSliderEl && runtimeSpeedValEl) {
    runtimeSpeedSliderEl.addEventListener('input', () => {
      window.runtimeSpeed = parseFloat(runtimeSpeedSliderEl.value);
      runtimeSpeedValEl.textContent = window.runtimeSpeed.toFixed(1) + '×';
    });
  }

  // Countdown slider
  const countdownSliderEl = document.getElementById('countdownSlider');
  const countdownValEl = document.getElementById('countdownVal');
  if (countdownSliderEl && countdownValEl) {
    countdownSliderEl.addEventListener('input', () => {
      const val = parseInt(countdownSliderEl.value);
      countdownValEl.textContent = val === 0 ? '0s (Instant)' : val + 's';
    });
  }

  // ===== Public API =====

  const SettingsControls = {
    // This module primarily handles event binding
  };

  if (typeof window !== 'undefined') {
    window.SettingsControls = Object.freeze(SettingsControls);
  }

  try {
    console.log('[SettingsControls] Loaded successfully');
  } catch {}
})();
