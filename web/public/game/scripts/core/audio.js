/**
 * Audio System
 * Web Audio API based sound effects
 */

// Audio Context
let AC = null;
try { 
  AC = new (window.AudioContext || window.webkitAudioContext)(); 
} catch(e) { 
  AC = null; 
}

/**
 * Play simple beep sound
 * @param {number} freq - Frequency in Hz
 * @param {number} dur - Duration in seconds
 * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
 * @param {number} gain - Volume level
 */
function beep(freq = 440, dur = 0.10, type = 'sine', gain = 0.04) {
  if (!AC) return;
  const t0 = AC.currentTime;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(AC.destination);
  o.start(t0);
  o.stop(t0 + dur);
}

/**
 * Play cheer sound (ascending notes)
 */
function cheer() {
  [880, 988, 1046].forEach((f, i) => 
    setTimeout(() => beep(f, 0.09, 'square', 0.05), i * 90)
  );
}

/**
 * Play win jingle (victory sound)
 */
function winJingle() {
  [740, 660, 988, 1318].forEach((f, i) => 
    setTimeout(() => beep(f, 0.16, 'triangle', 0.06), i * 170)
  );
}

/**
 * Play rich sound effect
 * @param {string} kind - Sound effect type
 */
function playSfx(kind) {
  if (!AC) return;
  const t0 = AC.currentTime;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.connect(g);
  g.connect(AC.destination);
  g.gain.value = 0.0001;

  // Presets
  if (kind === 'pause_whoosh' || kind === 'resume_whoosh') {
    o.type = 'sawtooth';
    const startF = kind === 'pause_whoosh' ? 900 : 300;
    const endF = kind === 'pause_whoosh' ? 300 : 900;
    o.frequency.setValueAtTime(startF, t0);
    o.frequency.exponentialRampToValueAtTime(endF, t0 + 0.22);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
    o.start(t0);
    o.stop(t0 + 0.26);
  } else if (kind === 'speed_up' || kind === 'speed_down') {
    o.type = 'square';
    const f = kind === 'speed_up' ? 960 : 520;
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.10);
    o.start(t0);
    o.stop(t0 + 0.12);
  } else if (kind === 'finish_swell') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(420, t0);
    o.frequency.exponentialRampToValueAtTime(980, t0 + 0.6);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
    o.start(t0);
    o.stop(t0 + 0.72);
  } else if (kind === 'go') { // start race
    o.type = 'sine';
    o.frequency.setValueAtTime(660, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.20);
    o.start(t0);
    o.stop(t0 + 0.22);
  } else if (kind === 'toggle') {
    o.type = 'sine';
    o.frequency.setValueAtTime(720, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    o.start(t0);
    o.stop(t0 + 0.16);
  } else if (kind === 'boost_up') {
    o.type = 'square';
    o.frequency.setValueAtTime(540, t0);
    o.frequency.exponentialRampToValueAtTime(980, t0 + 0.18);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    o.start(t0);
    o.stop(t0 + 0.22);
  } else if (kind === 'shield_on') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(660, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
    o.start(t0);
    o.stop(t0 + 0.26);
  } else if (kind === 'ice_crack') {
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420, t0);
    o.frequency.exponentialRampToValueAtTime(220, t0 + 0.12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    o.start(t0);
    o.stop(t0 + 0.16);
  } else if (kind === 'metal_tick') {
    o.type = 'square';
    o.frequency.setValueAtTime(880, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
    o.start(t0);
    o.stop(t0 + 0.1);
  } else if (kind === 'ram_hit') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(240, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.start(t0);
    o.stop(t0 + 0.2);
  } else {
    // default blip
    o.type = 'sine';
    o.frequency.setValueAtTime(600, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    o.start(t0);
    o.stop(t0 + 0.14);
  }
}

/**
 * Play death sound effect
 * Explosion-fade with noise burst and lowpass sweep + low thump
 */
function playDeathSfx() {
  if (!AC) return;
  const t0 = AC.currentTime;
  
  // Noise burst with decaying envelope and sweeping lowpass
  const dur = 0.36;
  const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const d = i / data.length;
    data[i] = (Math.random() * 2 - 1) * (1 - Math.pow(d, 0.9));
  }
  const src = AC.createBufferSource();
  src.buffer = buf;
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2000, t0);
  lp.frequency.exponentialRampToValueAtTime(220, t0 + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.00008, t0 + dur);
  src.connect(lp);
  lp.connect(g);
  g.connect(AC.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);

  // Low thump underlay
  const o = AC.createOscillator();
  const g2 = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(160, t0);
  o.frequency.exponentialRampToValueAtTime(80, t0 + 0.22);
  g2.gain.setValueAtTime(0.0001, t0);
  g2.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
  o.connect(g2);
  g2.connect(AC.destination);
  o.start(t0);
  o.stop(t0 + 0.26);
}

/**
 * Get audio context (for external use)
 * @returns {AudioContext|null}
 */
function getAudioContext() {
  return AC;
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.AudioSystem = {
    beep,
    cheer,
    winJingle,
    playSfx,
    playDeathSfx,
    getAudioContext
  };
  
  // Backward compatibility
  window.beep = beep;
  window.cheer = cheer;
  window.winJingle = winJingle;
  window.playSfx = playSfx;
  window.playDeathSfx = playDeathSfx;
  window.AC = AC;
}
