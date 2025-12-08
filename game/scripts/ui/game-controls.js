/**
 * Game Controls & Hotkeys
 * Keyboard shortcuts and play/editor mode controls
 * 
 * Public API:
 * - window.GameControls (module object)
 * 
 * Dependencies:
 * - window.paused, runtimeSpeed, runtimeSpeedSliderEl, runtimeSpeedValEl
 * - window.gridEl, gridVal, lastGridStep
 * - window.setMode(), startRace()
 * - window.toast(), playSfx(), showFlash(), updatePauseBtn(), updateSpeedUI()
 * - window.ttsSpeak()
 * - window.invalidateGrid(), drawMap()
 * - HTML elements: #testTts, #testRace, #hudPlayTest, #playBtn, #editBtn
 */

(function() {
  'use strict';

  // ===== Test TTS Button =====

  const testTtsBtn = document.getElementById('testTts');
  if (testTtsBtn) {
    testTtsBtn.addEventListener('click', () => {
      try { if (window.ttsSpeak) window.ttsSpeak('Xin chào!'); } catch {}
      try { if (window.toast) window.toast('Đang thử TTS: "Xin chào!"'); } catch {}
    });
  }

  // ===== Hotkeys: Space, T, +/- =====

  window.addEventListener('keydown', (e) => {
    // Ignore when typing into inputs/textareas/selects
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
    
    const key = e.key;
    
    // Space: Pause/Resume
    if (key === ' ') {
      e.preventDefault();
      window.paused = !window.paused;
      try { if (window.toast) window.toast(window.paused ? 'Tạm dừng' : 'Tiếp tục'); } catch {}
      try { if (window.playSfx) window.playSfx(window.paused ? 'pause_whoosh' : 'resume_whoosh'); } catch {}
      try { if (window.showFlash) window.showFlash(window.paused ? 'Paused' : 'Resumed'); } catch {}
      try { if (window.updatePauseBtn) window.updatePauseBtn(); } catch {}
    }
    
    // T: Toggle TTS
    else if (key === 't' || key === 'T') {
      const cb = document.getElementById('ttsEnabled');
      if (cb) {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
        try { if (window.toast) window.toast(cb.checked ? 'TTS: BẬT' : 'TTS: TẮT'); } catch {}
        try { if (window.playSfx) window.playSfx('toggle'); } catch {}
        try { if (window.showFlash) window.showFlash(cb.checked ? 'TTS: ON' : 'TTS: OFF'); } catch {}
      } else if (window.tts) {
        window.tts.enabled = !window.tts.enabled;
        try { localStorage.setItem('tts.enabled', window.tts.enabled ? '1' : '0'); } catch {}
      }
    }
    
    // +/=: Speed up
    else if (key === '+' || key === '=') {
      e.preventDefault();
      const minSpeed = 0.1, maxSpeed = 5.0;
      window.runtimeSpeed = Math.min(maxSpeed, (window.runtimeSpeed + 0.1));
      try { if (window.updateSpeedUI) window.updateSpeedUI(); } catch {}
      const runtimeSpeedSliderEl = document.getElementById('runtimeSpeedSlider');
      const runtimeSpeedValEl = document.getElementById('runtimeSpeedVal');
      if (runtimeSpeedSliderEl) runtimeSpeedSliderEl.value = String(window.runtimeSpeed.toFixed(1));
      if (runtimeSpeedValEl) runtimeSpeedValEl.textContent = window.runtimeSpeed.toFixed(1) + '×';
      try { if (window.playSfx) window.playSfx('speed_up'); } catch {}
      try { if (window.showFlash) window.showFlash('Speed: ' + window.runtimeSpeed.toFixed(1) + '×'); } catch {}
    }
    
    // -/_: Speed down
    else if (key === '-' || key === '_') {
      e.preventDefault();
      const minSpeed = 0.1, maxSpeed = 5.0;
      window.runtimeSpeed = Math.max(minSpeed, (window.runtimeSpeed - 0.1));
      try { if (window.updateSpeedUI) window.updateSpeedUI(); } catch {}
      const runtimeSpeedSliderEl = document.getElementById('runtimeSpeedSlider');
      const runtimeSpeedValEl = document.getElementById('runtimeSpeedVal');
      if (runtimeSpeedSliderEl) runtimeSpeedSliderEl.value = String(window.runtimeSpeed.toFixed(1));
      if (runtimeSpeedValEl) runtimeSpeedValEl.textContent = window.runtimeSpeed.toFixed(1) + '×';
      try { if (window.playSfx) window.playSfx('speed_down'); } catch {}
      try { if (window.showFlash) window.showFlash('Speed: ' + window.runtimeSpeed.toFixed(1) + '×'); } catch {}
    }
  });

  // ===== Play/Test Buttons =====

  const testRaceEl = document.getElementById('testRace');
  if (testRaceEl) {
    testRaceEl.addEventListener('click', () => {
      if (window.setMode) window.setMode('play');
      try { if (window.startRace) window.startRace(); } catch (e) { console.error(e); }
    });
  }

  const hudPlayTestEl = document.getElementById('hudPlayTest');
  if (hudPlayTestEl) {
    hudPlayTestEl.addEventListener('click', () => {
      if (window.setMode) window.setMode('play');
      try { if (window.startRace) window.startRace(); } catch (e) { console.error(e); }
    });
  }

  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (window.setMode) window.setMode('play');
      try { if (window.startRace) window.startRace(); } catch (e) { console.error(e); }
    });
  }

  // ===== F1/F2/G Hotkeys =====

  window.addEventListener('keydown', (e) => {
    // F1: Play mode
    if (e.key === 'F1') {
      e.preventDefault();
      try {
        if (window.setMode) window.setMode('play');
        if (window.startRace) window.startRace();
      } catch (err) { console.error(err); }
    }
    
    // F2: Editor mode
    else if (e.key === 'F2') {
      e.preventDefault();
      const btn = document.getElementById('editBtn');
      btn && btn.click();
    }
    
    // G: Toggle grid
    else if (e.key === 'g' || e.key === 'G') {
      const activeTag = (document.activeElement && document.activeElement.tagName) || '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
      
      const gridEl = window.gridEl || document.getElementById('grid');
      const gridVal = window.gridVal || document.getElementById('gridVal');
      if (!gridEl || !gridVal) return;
      
      const cur = parseInt(gridEl.value || '0', 10);
      if (cur > 0) {
        window.lastGridStep = cur;
        gridEl.value = '0';
      } else {
        gridEl.value = String(window.lastGridStep || 20);
      }
      
      if (window.invalidateGrid) window.invalidateGrid();
      gridVal.textContent = gridEl.value + 'px';
      if (window.drawMap) window.drawMap();
    }
  });

  // ===== Editor Button =====

  const editBtn = document.getElementById('editBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (window.setMode) window.setMode('editor');
    });
  }

  // ===== Public API =====

  const GameControls = {
    // This module primarily handles event binding, no public methods needed
  };

  if (typeof window !== 'undefined') {
    window.GameControls = Object.freeze(GameControls);
  }

  try {
    console.log('[GameControls] Loaded successfully');
  } catch {}
})();
