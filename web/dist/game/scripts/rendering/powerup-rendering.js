/**
 * Power-up Rendering Module
 * All power-up visual effects and drawing functions
 * 
 * Public API:
 * - window.PowerupRendering.drawMagneticPulls(ctx, mode)
 * - window.PowerupRendering.drawFireAuras(ctx)
 * - window.PowerupRendering.drawFireTraps(ctx, mode)
 * - window.PowerupRendering.drawFireAuraEffects(ctx, horses)
 * - window.PowerupRendering.drawPowerupTimers(ctx, horses)
 * - window.PowerupRendering.drawMagneticPushs(ctx, mode)
 * - window.PowerupRendering.drawShieldEffect(ctx, horse)
 * 
 * Dependencies:
 * - window.mapDef
 * - window.mode
 * - performance.now()
 */

(function() {
  'use strict';

  /**
   * Draw Magnetic Pull power-ups
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} mode - 'editor' or 'play'
   */
  function drawMagneticPulls(ctx, mode) {
    try {
      for (const magnet of (window.mapDef.magnetpulls || [])) {
        // Draw attraction radius in editor mode
        if (mode === 'editor') {
          ctx.strokeStyle = 'rgba(74, 144, 226, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(magnet.x, magnet.y, magnet.radius || 80, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // Draw main magnet
        ctx.fillStyle = '#4A90E2';
        ctx.shadowColor = '#4A90E2';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw metallic ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#2E5C8A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw magnet icon
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', magnet.x, magnet.y);
      }
    } catch {}
  }

  /**
   * Draw Fire Aura power-up pickups
   * @param {CanvasRenderingContext2D} ctx
   */
  function drawFireAuras(ctx) {
    try {
      for (const aura of (window.mapDef.fireaura || [])) {
        const currentTime = performance.now();
        const pulse = Math.sin(currentTime * 0.005) * 0.3 + 0.7;
        
        // Draw pickup glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF4400';
        ctx.fillStyle = `rgba(255, 68, 0, ${0.8 * pulse})`;
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, (aura.r || 20), 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pickup core
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fire icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', aura.x, aura.y);
      }
    } catch {}
  }

  /**
   * Draw Fire Trap obstacles
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} mode - 'editor' or 'play'
   */
  function drawFireTraps(ctx, mode) {
    try {
      for (const trap of (window.mapDef.firetrap || [])) {
        const currentTime = performance.now();
        const pulseSpeed = 0.003;
        const pulse = Math.sin(currentTime * pulseSpeed) * 0.3 + 0.7;
        
        // Draw trap radius
        const trapRadius = (trap.r || 50);
        const gradient = ctx.createRadialGradient(trap.x, trap.y, 0, trap.x, trap.y, trapRadius);
        gradient.addColorStop(0, `rgba(255, 102, 0, ${0.4 * pulse})`);
        gradient.addColorStop(0.7, `rgba(255, 140, 0, ${0.2 * pulse})`);
        gradient.addColorStop(1, 'rgba(255, 102, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(trap.x, trap.y, trapRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fire particles
        for (let i = 0; i < 8; i++) {
          const angle = (currentTime * 0.001 + i * Math.PI / 4) % (Math.PI * 2);
          const particleRadius = 15 + Math.sin(currentTime * 0.005 + i) * 5;
          const px = trap.x + Math.cos(angle) * particleRadius;
          const py = trap.y + Math.sin(angle) * particleRadius;
          
          ctx.fillStyle = `rgba(255, ${100 + Math.sin(currentTime * 0.01 + i) * 50}, 0, ${0.6 * pulse})`;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw core
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF6600';
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(trap.x, trap.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fire icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', trap.x, trap.y);
        
        // Show radius in editor mode
        if (mode === 'editor') {
          ctx.strokeStyle = 'rgba(255, 102, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(trap.x, trap.y, trapRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    } catch {}
  }

  /**
   * Draw Fire Aura effects around horses that have the power-up
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array} horses
   */
  function drawFireAuraEffects(ctx, horses) {
    try {
      const currentTime = performance.now();
      for (const horse of horses) {
        if (horse.eliminated || !horse.fireAuraUntil || currentTime > horse.fireAuraUntil) continue;
        
        const pulseSpeed = 0.004;
        const pulse = Math.sin(currentTime * pulseSpeed) * 0.4 + 0.6;
        const auraRadius = horse.fireAuraRange || 60;
        
        // Draw aura around horse
        const gradient = ctx.createRadialGradient(horse.x, horse.y, 0, horse.x, horse.y, auraRadius);
        gradient.addColorStop(0, `rgba(255, 68, 0, ${0.3 * pulse})`);
        gradient.addColorStop(0.7, `rgba(255, 140, 0, ${0.15 * pulse})`);
        gradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(horse.x, horse.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fire particles around horse
        for (let i = 0; i < 6; i++) {
          const angle = (currentTime * 0.002 + i * Math.PI / 3) % (Math.PI * 2);
          const particleRadius = 25 + Math.sin(currentTime * 0.006 + i) * 8;
          const px = horse.x + Math.cos(angle) * particleRadius;
          const py = horse.y + Math.sin(angle) * particleRadius;
          
          ctx.fillStyle = `rgba(255, ${120 + Math.sin(currentTime * 0.008 + i) * 60}, 0, ${0.7 * pulse})`;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw timer indicator below horse
        const timeLeft = horse.fireAuraUntil - currentTime;
        const timePercent = Math.max(0, timeLeft / 15000);
        if (timePercent > 0) {
          ctx.fillStyle = `rgba(255, 68, 0, 0.8)`;
          ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + 10, 30 * timePercent, 3);
          ctx.strokeStyle = '#FF4400';
          ctx.lineWidth = 1;
          ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + 10, 30, 3);
        }
      }
    } catch {}
  }

  /**
   * Draw power-up timers below horses
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array} horses
   */
  function drawPowerupTimers(ctx, horses) {
    try {
      const currentTime = performance.now();
      
      // Draw timers for power-ups below horses
      for (const horse of horses) {
        if (horse.eliminated) continue;
        
        let timerOffset = 15; // Start position below sprite
        
        // Turbo timer
        if (horse.turboUntil && currentTime < horse.turboUntil) {
          const timeLeft = horse.turboUntil - currentTime;
          const duration = (window.mapDef.turboSettings?.durationMs) || 5000;
          const timePercent = Math.max(0, timeLeft / duration);
          
          ctx.fillStyle = `rgba(255, 112, 67, 0.8)`;
          ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30 * timePercent, 3);
          ctx.strokeStyle = '#FF7043';
          ctx.lineWidth = 1;
          ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30, 3);
          timerOffset += 6;
        }
        
        // Shield timer
        if (horse.shieldUntil && currentTime < horse.shieldUntil) {
          const timeLeft = horse.shieldUntil - currentTime;
          const duration = (window.mapDef.shieldSettings?.durationMs) || 10000;
          const timePercent = Math.max(0, timeLeft / duration);
          
          ctx.fillStyle = `rgba(128, 203, 196, 0.8)`;
          ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30 * timePercent, 3);
          ctx.strokeStyle = '#80CBC4';
          ctx.lineWidth = 1;
          ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30, 3);
          timerOffset += 6;
        }
        
        // Magnet timer
        if (horse.magnetUntil && currentTime < horse.magnetUntil) {
          const timeLeft = horse.magnetUntil - currentTime;
          const duration = (window.mapDef.magnetSettings?.durationMs) || 3000;
          const timePercent = Math.max(0, timeLeft / duration);
          
          ctx.fillStyle = `rgba(156, 39, 176, 0.8)`;
          ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30 * timePercent, 3);
          ctx.strokeStyle = '#9C27B0';
          ctx.lineWidth = 1;
          ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30, 3);
          timerOffset += 6;
        }
        
        // Ram timer
        if (horse.ramUntil && currentTime < horse.ramUntil) {
          const timeLeft = horse.ramUntil - currentTime;
          const duration = (window.mapDef.ramSettings?.durationMs) || 4000;
          const timePercent = Math.max(0, timeLeft / duration);
          
          ctx.fillStyle = `rgba(244, 67, 54, 0.8)`;
          ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30 * timePercent, 3);
          ctx.strokeStyle = '#F44336';
          ctx.lineWidth = 1;
          ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30, 3);
          timerOffset += 6;
        }
      }
    } catch {}
  }

  /**
   * Draw Magnetic Push power-ups
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} mode - 'editor' or 'play'
   */
  function drawMagneticPushs(ctx, mode) {
    try {
      for (const magnet of (window.mapDef.magnetpushs || [])) {
        // Draw repulsion radius in editor mode
        if (mode === 'editor') {
          ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(magnet.x, magnet.y, magnet.radius || 80, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // Draw main electric core
        ctx.fillStyle = '#FF6B35';
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw electric ring
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add sparks around the core
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
          const angle = (i / sparkCount) * Math.PI * 2 + performance.now() * 0.005;
          const sparkRadius = 22 + Math.sin(performance.now() * 0.01 + i) * 3;
          const sparkX = magnet.x + Math.cos(angle) * sparkRadius;
          const sparkY = magnet.y + Math.sin(angle) * sparkRadius;
          
          ctx.fillStyle = '#FFB74D';
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Icon
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', magnet.x, magnet.y);
      }
    } catch {}
  }

  /**
   * Draw shield effect around a horse
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} horse - Horse object with x, y, r, hasShield properties
   */
  function drawShieldEffect(ctx, horse) {
    if (!horse.hasShield) return;
    
    try {
      ctx.save();
      ctx.beginPath();
      ctx.arc(horse.x, horse.y, horse.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(3, 169, 244, 0.4)'; // Light blue fill
      ctx.strokeStyle = 'rgba(3, 169, 244, 1)';   // Solid blue border
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } catch {}
  }

  // ===== Public API =====
  const PowerupRendering = {
    drawMagneticPulls,
    drawFireAuras,
    drawFireTraps,
    drawFireAuraEffects,
    drawPowerupTimers,
    drawMagneticPushs,
    drawShieldEffect
  };

  if (typeof window !== 'undefined') {
    window.PowerupRendering = Object.freeze(PowerupRendering);
  }

  try {
    console.log('[PowerupRendering] Loaded successfully');
  } catch {}
})();
