/**
 * 🎵 ULTIMATE AUDIO SYSTEM 🎵
 * Fun & Exciting Web Audio API Sound Effects
 */

// Audio Context
let AC = null;
try { 
  AC = new (window.AudioContext || window.webkitAudioContext)(); 
} catch(e) { 
  AC = null; 
}

// Master volume control
let masterVolume = 0.7;

/**
 * Play simple beep sound
 */
function beep(freq = 440, dur = 0.10, type = 'sine', gain = 0.04) {
  if (!AC) return;
  const t0 = AC.currentTime;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain * masterVolume;
  o.connect(g);
  g.connect(AC.destination);
  o.start(t0);
  o.stop(t0 + dur);
}

/**
 * 🎉 Play cheer sound (crowd goes wild!)
 */
function cheer() {
  if (!AC) return;
  const t0 = AC.currentTime;
  
  // Excited ascending notes
  [880, 988, 1046, 1318].forEach((f, i) => 
    setTimeout(() => beep(f, 0.12, 'square', 0.06), i * 80)
  );
  
  // Add crowd noise
  const dur = 0.6;
  const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const d = i / data.length;
    data[i] = (Math.random() * 2 - 1) * 0.3 * Math.sin(d * Math.PI);
  }
  const src = AC.createBufferSource();
  src.buffer = buf;
  const lp = AC.createBiquadFilter();
  lp.type = 'bandpass';
  lp.frequency.value = 800;
  const g = AC.createGain();
  g.gain.value = 0.05 * masterVolume;
  src.connect(lp);
  lp.connect(g);
  g.connect(AC.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

/**
 * 🏆 Epic win jingle (full victory fanfare!)
 */
function winJingle() {
  if (!AC) return;
  const t0 = AC.currentTime;
  
  // Main melody (triumphant fanfare)
  const melody = [
    { f: 523, t: 0, d: 0.15 },      // C5
    { f: 659, t: 0.12, d: 0.15 },   // E5
    { f: 784, t: 0.24, d: 0.15 },   // G5
    { f: 1047, t: 0.36, d: 0.4 },   // C6 (hold)
    { f: 988, t: 0.6, d: 0.12 },    // B5
    { f: 1047, t: 0.72, d: 0.5 },   // C6 (final)
  ];
  
  melody.forEach(note => {
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = 'triangle';
    o.frequency.value = note.f;
    g.gain.setValueAtTime(0.0001, t0 + note.t);
    g.gain.exponentialRampToValueAtTime(0.08 * masterVolume, t0 + note.t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + note.t + note.d);
    o.connect(g);
    g.connect(AC.destination);
    o.start(t0 + note.t);
    o.stop(t0 + note.t + note.d + 0.02);
  });
  
  // Add sparkle effect
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      beep(2000 + Math.random() * 2000, 0.05, 'sine', 0.02);
    }, 400 + i * 60);
  }
}

/**
 * 🔊 Master sound effect player with many presets
 */
function playSfx(kind) {
  if (!AC) return;
  const t0 = AC.currentTime;
  const vol = masterVolume;

  switch(kind) {
    // === RACE EVENTS ===
    case 'countdown_3':
    case 'countdown_2':
    case 'countdown_1': {
      const num = parseInt(kind.split('_')[1]);
      const freq = 400 + (3 - num) * 100;
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12 * vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
      break;
    }
    
    case 'go':
    case 'race_start': {
      // Epic "GO!" sound
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = AC.createOscillator();
        const g = AC.createGain();
        o.type = i < 2 ? 'square' : 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.1 * vol, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
        o.connect(g);
        g.connect(AC.destination);
        o.start(t0 + i * 0.03);
        o.stop(t0 + 0.3);
      });
      break;
    }
    
    case 'finish_swell': {
      // Dramatic finish approach
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(300, t0);
      o.frequency.exponentialRampToValueAtTime(1200, t0 + 0.8);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.1 * vol, t0 + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 1.0);
      break;
    }
    
    case 'lead_change': {
      // Quick exciting blip for position change
      [1200, 1400, 1600].forEach((f, i) => {
        setTimeout(() => beep(f, 0.06, 'square', 0.04), i * 40);
      });
      break;
    }
    
    // === POWERUPS ===
    case 'powerup':
    case 'pickup': {
      // Magical pickup sound
      [800, 1000, 1200, 1600].forEach((f, i) => {
        const o = AC.createOscillator();
        const g = AC.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.06 * vol, t0 + i * 0.04 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.04 + 0.1);
        o.connect(g);
        g.connect(AC.destination);
        o.start(t0 + i * 0.04);
        o.stop(t0 + i * 0.04 + 0.12);
      });
      break;
    }
    
    case 'boost_up':
    case 'speed_boost': {
      // Whooshing speed boost
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, t0);
      o.frequency.exponentialRampToValueAtTime(1500, t0 + 0.2);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.08 * vol, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.3);
      break;
    }
    
    case 'slow_down':
    case 'speed_down': {
      // Descending slow sound
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(800, t0);
      o.frequency.exponentialRampToValueAtTime(200, t0 + 0.3);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.07 * vol, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.4);
      break;
    }
    
    case 'shield_on':
    case 'shield_activate': {
      // Protective shield sound
      [660, 880, 1100].forEach((f, i) => {
        const o = AC.createOscillator();
        const g = AC.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.06 * vol, t0 + i * 0.05 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.05 + 0.2);
        o.connect(g);
        g.connect(AC.destination);
        o.start(t0 + i * 0.05);
        o.stop(t0 + i * 0.05 + 0.25);
      });
      break;
    }
    
    case 'shield_break': {
      // Shield breaking sound
      const dur = 0.3;
      const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const d = i / data.length;
        data[i] = (Math.random() * 2 - 1) * (1 - d) * 0.8;
      }
      const src = AC.createBufferSource();
      src.buffer = buf;
      const hp = AC.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1000;
      const g = AC.createGain();
      g.gain.value = 0.1 * vol;
      src.connect(hp);
      hp.connect(g);
      g.connect(AC.destination);
      src.start(t0);
      src.stop(t0 + dur);
      break;
    }
    
    // === COMBAT ===
    case 'collision':
    case 'bump': {
      // Horses bumping
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(150, t0);
      o.frequency.exponentialRampToValueAtTime(80, t0 + 0.1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12 * vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.2);
      break;
    }
    
    case 'ram_hit':
    case 'heavy_hit': {
      // Heavy impact
      const o = AC.createOscillator();
      const o2 = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'triangle';
      o2.type = 'sine';
      o.frequency.setValueAtTime(100, t0);
      o2.frequency.setValueAtTime(50, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.15 * vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.connect(g);
      o2.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o2.start(t0);
      o.stop(t0 + 0.3);
      o2.stop(t0 + 0.3);
      break;
    }
    
    case 'damage':
    case 'hit': {
      // Taking damage
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(200, t0);
      o.frequency.exponentialRampToValueAtTime(100, t0 + 0.1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.08 * vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.15);
      break;
    }
    
    case 'heal': {
      // Healing sound (magical sparkle)
      [1000, 1200, 1400, 1200, 1400, 1600].forEach((f, i) => {
        setTimeout(() => beep(f, 0.08, 'sine', 0.03), i * 50);
      });
      break;
    }
    
    // === SKILLS ===
    case 'skill_activate':
    case 'skill_ready': {
      // Skill activation whoosh
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, t0);
      o.frequency.exponentialRampToValueAtTime(1200, t0 + 0.15);
      o.frequency.exponentialRampToValueAtTime(800, t0 + 0.25);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.08 * vol, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
      break;
    }
    
    case 'fireball': {
      // Fireball whoosh
      const dur = 0.25;
      const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const d = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.sin(d * Math.PI) * 0.7;
      }
      const src = AC.createBufferSource();
      src.buffer = buf;
      const lp = AC.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2000, t0);
      lp.frequency.exponentialRampToValueAtTime(500, t0 + dur);
      const g = AC.createGain();
      g.gain.value = 0.1 * vol;
      src.connect(lp);
      lp.connect(g);
      g.connect(AC.destination);
      src.start(t0);
      src.stop(t0 + dur);
      break;
    }
    
    case 'lightning':
    case 'electric': {
      // Electric zap
      const dur = 0.2;
      const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const d = i / data.length;
        data[i] = (Math.random() > 0.5 ? 1 : -1) * (1 - d) * Math.random();
      }
      const src = AC.createBufferSource();
      src.buffer = buf;
      const hp = AC.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      const g = AC.createGain();
      g.gain.value = 0.08 * vol;
      src.connect(hp);
      hp.connect(g);
      g.connect(AC.destination);
      src.start(t0);
      src.stop(t0 + dur);
      // Add zap tone
      beep(4000, 0.05, 'square', 0.04);
      setTimeout(() => beep(3500, 0.03, 'square', 0.03), 50);
      break;
    }
    
    case 'teleport':
    case 'warp': {
      // Teleport whoosh
      const o = AC.createOscillator();
      const o2 = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sine';
      o2.type = 'triangle';
      o.frequency.setValueAtTime(2000, t0);
      o.frequency.exponentialRampToValueAtTime(100, t0 + 0.3);
      o2.frequency.setValueAtTime(100, t0);
      o2.frequency.exponentialRampToValueAtTime(2000, t0 + 0.3);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06 * vol, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g);
      o2.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o2.start(t0);
      o.stop(t0 + 0.4);
      o2.stop(t0 + 0.4);
      break;
    }
    
    case 'freeze':
    case 'ice_crack': {
      // Ice/freeze sound
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(600, t0);
      o.frequency.exponentialRampToValueAtTime(150, t0 + 0.15);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.08 * vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.25);
      // Add crackle
      beep(3000, 0.03, 'square', 0.02);
      break;
    }
    
    case 'shockwave': {
      // Expanding shockwave
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(400, t0);
      o.frequency.exponentialRampToValueAtTime(80, t0 + 0.4);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.1 * vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.5);
      break;
    }
    
    case 'gravity': {
      // Gravity well humming
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(80, t0);
      o.frequency.setValueAtTime(100, t0 + 0.2);
      o.frequency.setValueAtTime(80, t0 + 0.4);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06 * vol, t0 + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.55);
      break;
    }
    
    // === UI SOUNDS ===
    case 'click':
    case 'toggle': {
      beep(800, 0.05, 'sine', 0.04);
      break;
    }
    
    case 'pause_whoosh': {
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1000, t0);
      o.frequency.exponentialRampToValueAtTime(200, t0 + 0.25);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06 * vol, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
      break;
    }
    
    case 'resume_whoosh': {
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, t0);
      o.frequency.exponentialRampToValueAtTime(1000, t0 + 0.25);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06 * vol, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
      break;
    }
    
    case 'error': {
      // Error buzzer
      beep(200, 0.15, 'square', 0.06);
      setTimeout(() => beep(150, 0.2, 'square', 0.06), 150);
      break;
    }
    
    case 'success': {
      // Success ding
      [800, 1000, 1200].forEach((f, i) => {
        setTimeout(() => beep(f, 0.1, 'sine', 0.05), i * 80);
      });
      break;
    }
    
    case 'coin':
    case 'money': {
      // Coin collect
      beep(1500, 0.05, 'square', 0.03);
      setTimeout(() => beep(2000, 0.08, 'square', 0.04), 50);
      break;
    }
    
    case 'metal_tick': {
      beep(1200, 0.03, 'square', 0.04);
      break;
    }
    
    default: {
      // Generic blip
      beep(600, 0.08, 'sine', 0.04);
    }
  }
}

/**
 * Play death sound effect
 * Epic explosion with multiple layers: boom, crackle, debris, reverb tail
 */
function playDeathSfx() {
  if (!AC) return;
  const t0 = AC.currentTime;
  
  // === LAYER 1: Initial BOOM (loud, punchy) ===
  const boomDur = 0.5;
  const boomBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * boomDur), AC.sampleRate);
  const boomData = boomBuf.getChannelData(0);
  for (let i = 0; i < boomData.length; i++) {
    const d = i / boomData.length;
    boomData[i] = (Math.random() * 2 - 1) * Math.pow(1 - d, 1.5) * (1 + Math.sin(d * 50) * 0.3);
  }
  const boomSrc = AC.createBufferSource();
  boomSrc.buffer = boomBuf;
  const boomLp = AC.createBiquadFilter();
  boomLp.type = 'lowpass';
  boomLp.frequency.setValueAtTime(3000, t0);
  boomLp.frequency.exponentialRampToValueAtTime(100, t0 + boomDur);
  const boomGain = AC.createGain();
  boomGain.gain.setValueAtTime(0.0001, t0);
  boomGain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.015);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, t0 + boomDur);
  boomSrc.connect(boomLp);
  boomLp.connect(boomGain);
  boomGain.connect(AC.destination);
  boomSrc.start(t0);
  boomSrc.stop(t0 + boomDur + 0.02);

  // === LAYER 2: Deep sub bass thump ===
  const subOsc = AC.createOscillator();
  const subGain = AC.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(80, t0);
  subOsc.frequency.exponentialRampToValueAtTime(30, t0 + 0.4);
  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
  subOsc.connect(subGain);
  subGain.connect(AC.destination);
  subOsc.start(t0);
  subOsc.stop(t0 + 0.5);

  // === LAYER 3: Crackle/debris (high freq noise) ===
  const crackleDur = 0.8;
  const crackleBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * crackleDur), AC.sampleRate);
  const crackleData = crackleBuf.getChannelData(0);
  for (let i = 0; i < crackleData.length; i++) {
    const d = i / crackleData.length;
    // Sparse crackles
    crackleData[i] = Math.random() < 0.1 ? (Math.random() * 2 - 1) * (1 - d) : 0;
  }
  const crackleSrc = AC.createBufferSource();
  crackleSrc.buffer = crackleBuf;
  const crackleHp = AC.createBiquadFilter();
  crackleHp.type = 'highpass';
  crackleHp.frequency.value = 2000;
  const crackleGain = AC.createGain();
  crackleGain.gain.setValueAtTime(0.08, t0 + 0.05);
  crackleGain.gain.exponentialRampToValueAtTime(0.0001, t0 + crackleDur);
  crackleSrc.connect(crackleHp);
  crackleHp.connect(crackleGain);
  crackleGain.connect(AC.destination);
  crackleSrc.start(t0 + 0.05);
  crackleSrc.stop(t0 + crackleDur + 0.02);

  // === LAYER 4: Reverb tail (fading echo) ===
  const tailOsc = AC.createOscillator();
  const tailGain = AC.createGain();
  tailOsc.type = 'triangle';
  tailOsc.frequency.setValueAtTime(200, t0 + 0.1);
  tailOsc.frequency.exponentialRampToValueAtTime(60, t0 + 0.8);
  tailGain.gain.setValueAtTime(0.0001, t0 + 0.1);
  tailGain.gain.exponentialRampToValueAtTime(0.04, t0 + 0.15);
  tailGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
  tailOsc.connect(tailGain);
  tailGain.connect(AC.destination);
  tailOsc.start(t0 + 0.1);
  tailOsc.stop(t0 + 1.0);
}

/**
 * Get audio context (for external use)
 * @returns {AudioContext|null}
 */
function getAudioContext() {
  return AC;
}

/**
 * 🔊 Set master volume (0.0 to 1.0)
 */
function setVolume(vol) {
  masterVolume = Math.max(0, Math.min(1, vol));
}

/**
 * 🔊 Get current master volume
 */
function getVolume() {
  return masterVolume;
}

/**
 * 🎺 Play countdown sequence (3, 2, 1, GO!)
 */
function playCountdown(callback) {
  playSfx('countdown_3');
  setTimeout(() => playSfx('countdown_2'), 1000);
  setTimeout(() => playSfx('countdown_1'), 2000);
  setTimeout(() => {
    playSfx('go');
    if (callback) callback();
  }, 3000);
}

/**
 * 🎵 Play random fun sound
 */
function playRandomFun() {
  const sounds = ['powerup', 'coin', 'success', 'boost_up', 'heal'];
  playSfx(sounds[Math.floor(Math.random() * sounds.length)]);
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.AudioSystem = {
    beep,
    cheer,
    winJingle,
    playSfx,
    playDeathSfx,
    getAudioContext,
    setVolume,
    getVolume,
    playCountdown,
    playRandomFun
  };
  
  // Backward compatibility
  window.beep = beep;
  window.cheer = cheer;
  window.winJingle = winJingle;
  window.playSfx = playSfx;
  window.playDeathSfx = playDeathSfx;
  window.setVolume = setVolume;
  window.getVolume = getVolume;
  window.playCountdown = playCountdown;
  window.AC = AC;
}
