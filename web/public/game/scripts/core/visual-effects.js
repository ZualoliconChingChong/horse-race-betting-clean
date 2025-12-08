/**
 * Visual Effects System
 * Manages particles, explosions, confetti, floating texts
 */

/**
 * Create explosion particle effect
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} color - Color override (optional)
 * @param {number} count - Particle count (optional, default 30)
 */
function createExplosion(x, y, color, count = 30) {
  if (typeof particles === 'undefined') return;
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30 + Math.random() * 30, // 0.5 to 1 second
      color: color || `hsl(${Math.random() * 60}, 100%, 50%)`
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
 * Render particles on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} particlesArray - Particles array
 */
function renderParticles(ctx, particlesArray) {
  if (!particlesArray || !Array.isArray(particlesArray)) return;
  
  try {
    for (let i = particlesArray.length - 1; i >= 0; i--) {
      const p = particlesArray[i];
      if (typeof p.g === 'number') p.vy += p.g;
      if (typeof p.drag === 'number') { p.vx *= p.drag; p.vy *= p.drag; }
      if (typeof p.wind === 'number') p.vx += p.wind;
      p.x += p.vx; p.y += p.vy; p.life--;
      
      if (p.life <= 0) {
        particlesArray.splice(i, 1);
      } else {
        const life0 = (typeof p.life0 === 'number' && p.life0 > 0) ? p.life0 : 60;
        const fade = Math.max(0, Math.min(1, p.life / life0));
        ctx.save();
        
        if (p.glow) { ctx.shadowColor = p.color || '#FFF'; ctx.shadowBlur = p.glow * fade; }
        ctx.globalAlpha = fade * (p.alpha || 1);
        
        if (p.shape === 'rect') {
          ctx.translate(p.x, p.y);
          if (typeof p.rot === 'number') { ctx.rotate(p.rot); if (typeof p.rotVel === 'number') p.rot += p.rotVel; }
          const sz = (typeof p.size === 'number') ? p.size : 2;
          ctx.fillStyle = p.color || '#FFF'; 
          ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        } else if (p.shape === 'star') {
          if (typeof drawStar === 'function') {
            drawStar(ctx, p.x, p.y, p.size || 3, p.color || '#FFD700');
          }
        } else if (p.shape === 'trail') {
          ctx.strokeStyle = p.color || '#FFF'; 
          ctx.lineWidth = p.size || 2; 
          ctx.lineCap = 'round';
          ctx.beginPath(); 
          ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3); 
          ctx.lineTo(p.x, p.y); 
          ctx.stroke();
        } else {
          if (p.gradient) { 
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size || 2); 
            grad.addColorStop(0, p.color || '#FFF'); 
            grad.addColorStop(1, 'transparent'); 
            ctx.fillStyle = grad; 
          } else { 
            ctx.fillStyle = p.color || '#FFF'; 
          }
          const sz = (typeof p.size === 'number') ? p.size : 2; 
          ctx.beginPath(); 
          ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); 
          ctx.fill();
        }
        ctx.restore();
      }
    }
  } catch {}
}

/**
 * Render floating texts (damage, pickups, etc.)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} textsArray - Floating texts array
 */
function renderFloatingTexts(ctx, textsArray) {
  if (!textsArray || !Array.isArray(textsArray) || textsArray.length === 0) return;
  
  const now = performance.now();
  ctx.save();
  ctx.textAlign = 'center';
  
  try {
    for (let i = textsArray.length - 1; i >= 0; i--) {
      const ft = textsArray[i];
      const age = now - ft.t;
      if (age > ft.life) { textsArray.splice(i, 1); continue; }
      
      const k = 1 - age / ft.life; // 1 -> 0
      const isDamage = ft.type === 'damage';
      const isHeal = ft.type === 'heal';
      const isCrit = ft.critical;
      
      // Enhanced movement for damage indicators
      let x = ft.x;
      let y = ft.y;
      
      if (isDamage) {
        // Damage floats up and slightly curves
        const curve = Math.sin(age * 0.008) * 8; // subtle curve
        x += curve;
        y -= age * 0.08; // faster upward drift
        
        // Scale effect for critical hits
        if (isCrit) {
          const scalePhase = Math.min(1, age / 200); // first 200ms
          const scale = 1 + (1 - scalePhase) * 0.5; // starts 1.5x, goes to 1x
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(scale, scale);
          x = 0; y = 0;
        }
      } else {
        // Regular floating text (pickups, etc.)
        y -= age * 0.05;
      }
      
      // Simple alpha - no fade effect for damage
      ctx.globalAlpha = isDamage ? 1.0 : k;
      
      // Clear font
      const fontSize = (isDamage && isCrit) ? 20 : (isDamage ? 18 : 14);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      
      // Simple solid text - no outline
      ctx.fillStyle = ft.color || '#FFF';
      ctx.fillText(ft.text, x, y);
      
      if (isCrit) {
        ctx.restore(); // Restore from scale transform
      }
    }
  } catch {}
  
  ctx.restore();
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.VisualEffects = {
    createExplosion,
    createConfettiBurst,
    createPickupBurst,
    renderParticles,
    renderFloatingTexts
  };
  
  // Backward compatibility
  window.createExplosion = createExplosion;
  window.createConfettiBurst = createConfettiBurst;
  window.createPickupBurst = createPickupBurst;
  window.renderParticles = renderParticles;
  window.renderFloatingTexts = renderFloatingTexts;
}
