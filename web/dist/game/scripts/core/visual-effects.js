/**
 * ✨ ENHANCED VISUAL EFFECTS SYSTEM ✨
 * Beautiful particles, explosions, confetti, floating texts
 * Optimized for performance
 */

// Performance settings
const VFX_CONFIG = {
  maxParticles: 800,        // Cap total particles
  enableGlow: true,         // Can disable for low-end devices
  glowIntensity: 0.4,       // Reduced from 1.0
  skipFrames: 0             // Skip particle updates (0 = no skip)
};

// Color palette for various effects
const VFX_COLORS = {
  fire: ['#FF4500', '#FF6B35', '#FF8C00', '#FFA500', '#FFD700'],
  ice: ['#00BFFF', '#87CEEB', '#ADD8E6', '#B0E0E6', '#FFFFFF'],
  electric: ['#FFFF00', '#FFD700', '#00BFFF', '#87CEEB', '#FFFFFF'],
  nature: ['#32CD32', '#7CFC00', '#98FB98', '#90EE90', '#ADFF2F'],
  purple: ['#9400D3', '#8B008B', '#9932CC', '#BA55D3', '#DA70D6'],
  gold: ['#FFD700', '#FFC107', '#FFB300', '#FF8F00', '#FF6F00'],
  rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']
};

/**
 * 💥 Create explosion particle effect with glow
 */
function createExplosion(x, y, color, count = 30) {
  if (typeof particles === 'undefined') return;
  
  // Limit particles if too many
  if (particles.length > VFX_CONFIG.maxParticles) {
    count = Math.max(5, Math.floor(count / 3));
  }
  
  // Core particles (reduced glow)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 3 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 20,
      life0: 40,
      color: color || `hsl(${Math.random() * 60}, 100%, 50%)`,
      size: 2 + Math.random() * 1.5,
      g: 0.06
    });
  }
  
  // Fewer outer ring particles
  const ringCount = Math.floor(count / 3);
  for (let i = 0; i < ringCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 10 + Math.random() * 8,
      life0: 18,
      color: '#FFFFFF',
      size: 1,
      shape: 'trail'
    });
  }
}

/**
 * ⭐ Create sparkle effect (small twinkling particles)
 */
function createSparkle(x, y, color = '#FFD700', count = 6) {
  if (typeof particles === 'undefined') return;
  if (particles.length > VFX_CONFIG.maxParticles) return;
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      life: 15 + Math.random() * 10,
      life0: 25,
      color: color,
      size: 1 + Math.random()
    });
  }
}

/**
 * 🌊 Create shockwave ring effect
 */
function createShockwave(x, y, color = '#00BFFF', radius = 50) {
  if (typeof particles === 'undefined') return;
  if (particles.length > VFX_CONFIG.maxParticles) return;
  
  const ringCount = 16; // Reduced from 24
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const speed = 4 + Math.random() * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 15 + Math.random() * 8,
      life0: 23,
      color: color,
      size: 1.5,
      shape: 'trail'
    });
  }
}

/**
 * 🔥 Create fire burst effect
 */
function createFireBurst(x, y, count = 15) {
  if (typeof particles === 'undefined') return;
  if (particles.length > VFX_CONFIG.maxParticles) count = Math.floor(count / 2);
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 2.5;
    const color = VFX_COLORS.fire[Math.floor(Math.random() * VFX_COLORS.fire.length)];
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 20 + Math.random() * 15,
      life0: 35,
      color: color,
      size: 2 + Math.random() * 2,
      g: -0.04
    });
  }
}

/**
 * ❄️ Create ice crystal effect
 */
function createIceBurst(x, y, count = 12) {
  if (typeof particles === 'undefined') return;
  if (particles.length > VFX_CONFIG.maxParticles) return;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 2.5 + Math.random() * 1.5;
    const color = VFX_COLORS.ice[Math.floor(Math.random() * VFX_COLORS.ice.length)];
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 25 + Math.random() * 15,
      life0: 40,
      color: color,
      size: 1.5 + Math.random() * 1.5,
      shape: 'rect',
      rot: Math.random() * Math.PI,
      rotVel: (Math.random() - 0.5) * 0.15
    });
  }
}

/**
 * ⚡ Create electric zap effect
 */
function createElectricBurst(x, y, count = 10) {
  if (typeof particles === 'undefined') return;
  if (particles.length > VFX_CONFIG.maxParticles) return;
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 3;
    const color = VFX_COLORS.electric[Math.floor(Math.random() * VFX_COLORS.electric.length)];
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 8 + Math.random() * 6,
      life0: 14,
      color: color,
      size: 1,
      shape: 'trail'
    });
  }
}

/**
 * Create confetti burst for celebration
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function createConfettiBurst(x, y) {
  if (typeof particles === 'undefined') return;
  
  const palette = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#FF5722'
  ];
  
  const cap = (typeof window.trailParticlesCap === 'number' && isFinite(window.trailParticlesCap)) ? window.trailParticlesCap : 1500;
  const remain = Math.max(0, cap - (particles ? particles.length : 0));
  const n = Math.min(140, Math.max(40, Math.floor(remain * 0.35)));
  
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.2 + Math.random() * 2.4; // moderate initial speed
    const vx = Math.cos(ang) * spd;
    const vy = Math.sin(ang) * spd * 0.7; // flatter launch
    const life = Math.floor(50 + Math.random() * 60); // ~0.8–1.8s @60fps
    const color = palette[(Math.random() * palette.length) | 0];
    const size = 2 + Math.random() * 1.8;
    const rot = Math.random() * Math.PI * 2;
    const rotVel = (Math.random() - 0.5) * 0.25;
    const g = 0.06 + Math.random() * 0.05; // gentle gravity
    const drag = 0.992; // light air drag
    particles.push({ x, y, vx, vy, life, life0: life, color, size, shape: 'rect', rot, rotVel, g, drag });
  }
}

/**
 * Create distinct pickup particle bursts per item type
 * @param {string} type - Pickup type (boost, turbo, ghost, trap, shield, ram)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} r - Radius (default 16)
 */
function createPickupBurst(type, x, y, r = 16) {
  if (typeof particles === 'undefined') return;
  
  try {
    const addRing = (color, count = 14, speed = 2.8, jitter = 0.6, life = 14) => {
      for (let k = 0; k < count; k++) {
        const ang = (k / count) * Math.PI * 2;
        const rv = speed + Math.random() * jitter;
        particles.push({ x, y, vx: Math.cos(ang) * rv, vy: Math.sin(ang) * rv, life: life + Math.random() * 6, color });
      }
    };
    
    const addBurst = (n, base, spread, life, alpha = 1) => {
      for (let i = 0; i < n; i++) {
        particles.push({ x, y, vx: (Math.random() - 0.5) * spread, vy: (Math.random() - 0.5) * spread, life: life + Math.random() * life * 0.6, color: base.replace('ALPHA', alpha.toFixed(2)) });
      }
    };
    
    switch (type) {
      case 'boost':
        addBurst(20, 'rgba(255,235,59,ALPHA)', 7, 24, 0.9);
        addRing('rgba(255,213,79,0.8)', 12, 2.2);
        break;
      case 'turbo':
        addBurst(24, 'rgba(255,87,34,ALPHA)', 8, 26, 0.95);
        addRing('rgba(255,255,255,0.8)', 10, 3.2, 1.2, 12);
        break;
      case 'ghost':
        addBurst(18, 'rgba(179,157,219,ALPHA)', 6, 22, 0.85);
        addRing('rgba(137,207,240,0.6)', 12, 2.0);
        break;
      case 'icefreezer':
        addBurst(20, 'rgba(179,229,252,ALPHA)', 5, 26, 0.9);
        addRing('rgba(179,229,252,0.8)', 14, 2.3);
        break;
      case 'shield':
        addBurst(16, 'rgba(128,203,196,ALPHA)', 6, 22, 0.9);
        addRing('rgba(3,169,244,0.7)', 14, 2.4);
        break;
      case 'ram':
        addBurst(22, 'rgba(244,67,54,ALPHA)', 8, 26, 0.9);
        addRing('rgba(255,235,59,0.7)', 12, 2.6);
        break;
      default:
        addBurst(16, 'rgba(255,255,255,ALPHA)', 6, 20, 0.8);
    }
  } catch {}
}

/**
 * Render particles on canvas (optimized)
 */
function renderParticles(ctx, particlesArray) {
  if (!particlesArray || !Array.isArray(particlesArray)) return;
  
  // Hard cap - remove oldest if too many
  while (particlesArray.length > VFX_CONFIG.maxParticles) {
    particlesArray.shift();
  }
  
  try {
    ctx.save();
    
    for (let i = particlesArray.length - 1; i >= 0; i--) {
      const p = particlesArray[i];
      
      // Physics update
      if (typeof p.g === 'number') p.vy += p.g;
      if (typeof p.drag === 'number') { p.vx *= p.drag; p.vy *= p.drag; }
      p.x += p.vx; p.y += p.vy; p.life--;
      
      if (p.life <= 0) {
        particlesArray.splice(i, 1);
        continue;
      }
      
      const life0 = p.life0 || 60;
      const fade = p.life / life0;
      ctx.globalAlpha = fade * (p.alpha || 1);
      
      // Simple rendering - no shadows for performance
      if (p.shape === 'rect') {
        ctx.fillStyle = p.color || '#FFF';
        const sz = p.size || 2;
        if (p.rot !== undefined) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          if (p.rotVel) p.rot += p.rotVel;
          ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
          ctx.restore();
        } else {
          ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
        }
      } else if (p.shape === 'trail') {
        ctx.strokeStyle = p.color || '#FFF';
        ctx.lineWidth = p.size || 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color || '#FFF';
        const sz = p.size || 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  } catch {}
}

/**
 * 📝 Render floating texts (lightweight)
 */
function renderFloatingTexts(ctx, textsArray) {
  if (!textsArray || !Array.isArray(textsArray) || textsArray.length === 0) return;
  
  const now = performance.now();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  try {
    for (let i = textsArray.length - 1; i >= 0; i--) {
      const ft = textsArray[i];
      const age = now - ft.t;
      if (age > ft.life) { textsArray.splice(i, 1); continue; }
      
      const k = 1 - age / ft.life;
      const isEliminated = ft.text && ft.text.includes('ELIMINATED');
      const isSkill = ft.text && ft.text.includes('!');
      
      // Simple upward float
      let x = ft.x;
      let y = ft.y - age * 0.05;
      
      // Simple fade
      ctx.globalAlpha = Math.min(1, k * 1.2);
      
      // Font size based on type
      const fontSize = isEliminated ? 18 : (isSkill ? 15 : 13);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      
      // Light shadow only (reduced from heavy glow)
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Thin outline
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(ft.text, x, y);
      
      // Fill
      ctx.shadowBlur = 0;
      ctx.fillStyle = ft.color || '#FFFFFF';
      ctx.fillText(ft.text, x, y);
    }
  } catch {}
  
  ctx.restore();
}

/**
 * 🌟 Draw a star shape
 */
function drawStar(ctx, x, y, size, color) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size / 2;
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 🎯 Create impact effect at collision point
 */
function createImpactEffect(x, y, intensity = 1) {
  if (typeof particles === 'undefined') return;
  
  // Impact sparks
  const count = Math.floor(8 * intensity);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 4 * intensity;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 10 + Math.random() * 8,
      life0: 18,
      color: '#FFFFFF',
      size: 1 + Math.random(),
      glow: 6
    });
  }
  
  // Impact ring
  particles.push({
    x, y,
    vx: 0, vy: 0,
    life: 6,
    life0: 6,
    color: '#FFFFFF',
    size: 10 * intensity,
    gradient: true,
    glow: 15
  });
}

/**
 * 🏃 Create speed lines effect (for fast-moving objects)
 */
function createSpeedLines(x, y, vx, vy, color = '#FFFFFF') {
  if (typeof particles === 'undefined') return;
  
  const speed = Math.hypot(vx, vy);
  if (speed < 3) return;
  
  const count = Math.min(5, Math.floor(speed / 2));
  const angle = Math.atan2(vy, vx);
  
  for (let i = 0; i < count; i++) {
    const offset = (Math.random() - 0.5) * 10;
    const perpAngle = angle + Math.PI / 2;
    particles.push({
      x: x + Math.cos(perpAngle) * offset,
      y: y + Math.sin(perpAngle) * offset,
      vx: -vx * 0.3,
      vy: -vy * 0.3,
      life: 8 + Math.random() * 5,
      life0: 13,
      color: color,
      size: 1.5,
      shape: 'trail',
      alpha: 0.5
    });
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.VisualEffects = {
    // Core functions
    createExplosion,
    createConfettiBurst,
    createPickupBurst,
    renderParticles,
    renderFloatingTexts,
    // New effects
    createSparkle,
    createShockwave,
    createFireBurst,
    createIceBurst,
    createElectricBurst,
    createImpactEffect,
    createSpeedLines,
    drawStar,
    // Color palettes
    VFX_COLORS
  };
  
  // Backward compatibility + new functions
  window.createExplosion = createExplosion;
  window.createConfettiBurst = createConfettiBurst;
  window.createPickupBurst = createPickupBurst;
  window.renderParticles = renderParticles;
  window.renderFloatingTexts = renderFloatingTexts;
  window.createSparkle = createSparkle;
  window.createShockwave = createShockwave;
  window.createFireBurst = createFireBurst;
  window.createIceBurst = createIceBurst;
  window.createElectricBurst = createElectricBurst;
  window.createImpactEffect = createImpactEffect;
  window.createSpeedLines = createSpeedLines;
  window.drawStar = drawStar;
}
