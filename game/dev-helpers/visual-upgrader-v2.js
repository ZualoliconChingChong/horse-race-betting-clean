#!/usr/bin/env node

/**
 * Visual Upgrader v2.0 - Advanced Dynamic Effects
 * Creates sophisticated visual effects like the original power-ups
 * Based on analysis of Boost, Turbo, Teleport, and Magnet render functions
 */

const fs = require('fs');
const path = require('path');

class AdvancedVisualUpgrader {
  constructor() {
    this.renderFile = path.join(__dirname, '..', 'scripts', 'render.js');
    this.configFile = path.join(__dirname, '..', 'scripts', 'config.js');
    
    // Advanced style definitions with sophisticated effects
    this.styles = {
      'neon-pro': {
        name: 'Neon Pro',
        description: 'Advanced electric effects with sparks and rings',
        colors: ['#00FFFF', '#FF00FF', '#FFFF00'],
        type: 'electric'
      },
      'inferno': {
        name: 'Inferno',
        description: 'Multi-layer flame system like Turbo',
        colors: ['#FF4500', '#FF6347', '#FFD700'],
        type: 'flame'
      },
      'vortex': {
        name: 'Dimensional Vortex',
        description: 'Swirling portals with energy spirals',
        colors: ['#4B0082', '#8A2BE2', '#DA70D6'],
        type: 'dimensional'
      },
      'magnetic': {
        name: 'Magnetic Field',
        description: 'Alternating field lines with attraction particles',
        colors: ['#FF4500', '#1E90FF', '#FFD700'],
        type: 'magnetic'
      },
      'quantum': {
        name: 'Quantum Energy',
        description: 'Particle physics with wave interference',
        colors: ['#00FF7F', '#7FFF00', '#ADFF2F'],
        type: 'quantum'
      },
      'shield': {
        name: 'Shield Energy',
        description: 'Hexagonal shield pattern with energy field rings',
        colors: ['#4FC3F7', '#03A9F4', '#0288D1'],
        type: 'shield'
      },
      'icefrost': {
        name: 'Ice Frost',
        description: 'Rotating ice crystals with diamond shards and multi-layer glow',
        colors: ['#E1F5FE', '#81D4FA', '#B3E5FC'],
        type: 'icefrost'
      }
    };
  }

  /**
   * Generate advanced electric effects (based on Boost)
   */
  generateElectricEffects() {
    return `        // Advanced electric animation (like Boost)
        const pulseSpeed = 0.003;
        const pulse = Math.sin(currentTime * pulseSpeed) * 0.3 + 0.7;
        const glowIntensity = glowAlpha(0.4 * pulse, 0.9 * pulse, 0.1);
        
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + pulse * 0.2), 'rgb(0,255,255)', glowIntensity);
        } catch {}
        
        // Animated electric rings (compact)
        const ringCount = 2;
        for (let i = 0; i < ringCount; i++) {
          const ringPhase = (currentTime * 0.002 + i * Math.PI / ringCount) % (Math.PI * 2);
          const ringRadius = item.r + 2 + Math.sin(ringPhase) * 1.5;
          const ringAlpha = (Math.sin(ringPhase) * 0.3 + 0.4) * 0.5;
          
          ctx.strokeStyle = \`rgba(0, 255, 255, \${ringAlpha})\`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Electric sparks (compact)
        const sparkCount = 4;
        for (let i = 0; i < sparkCount; i++) {
          const angle = (i / sparkCount) * Math.PI * 2 + currentTime * 0.005;
          const sparkRadius = item.r + 4 + Math.sin(currentTime * 0.008 + i) * 2;
          const sparkX = item.x + Math.cos(angle) * sparkRadius;
          const sparkY = item.y + Math.sin(angle) * sparkRadius;
          
          ctx.fillStyle = \`rgba(255, 0, 255, \${0.6 * pulse})\`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }`;
  }

  /**
   * Generate advanced flame effects (based on Turbo)
   */
  generateFlameEffects() {
    return `        // Intense flame animation (like Turbo)
        const flameSpeed = 0.008;
        const flame = Math.sin(currentTime * flameSpeed) * 0.5 + 0.5;
        const flameIntensity = Math.sin(currentTime * flameSpeed * 1.3) * 0.3 + 0.7;
        
        // Multiple flame layers (compact)
        const flameCount = 3;
        for (let i = 0; i < flameCount; i++) {
          const flamePhase = (currentTime * 0.006 + i * Math.PI / 3) % (Math.PI * 2);
          const flameRadius = item.r + 1 + i * 1.5 + Math.sin(flamePhase) * 2;
          const flameAlpha = (Math.sin(flamePhase) * 0.4 + 0.6) * (1 - i * 0.2);
          
          ctx.strokeStyle = \`rgba(255, \${112 - i * 15}, \${67 - i * 10}, \${flameAlpha})\`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, flameRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Enhanced glow with flame effect (compact)
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + flame * 0.15), 'rgb(255,69,0)', glowAlpha(0.4 * flameIntensity, 0.8 * flameIntensity, 0.1));
        } catch {}
        
        // Fire particles (compact)
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + currentTime * 0.01;
          const particleRadius = item.r + 4 + Math.sin(currentTime * 0.012 + i) * 3;
          const particleX = item.x + Math.cos(angle) * particleRadius;
          const particleY = item.y + Math.sin(angle) * particleRadius;
          
          const particleSize = 0.8 + Math.sin(currentTime * 0.015 + i) * 0.7;
          ctx.fillStyle = \`rgba(255, \${200 + Math.sin(i) * 55}, 0, \${0.6 * flameIntensity})\`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }`;
  }

  /**
   * Generate dimensional vortex effects (based on Teleport)
   */
  generateDimensionalEffects() {
    return `        // Dimensional vortex animation (like Teleport)
        const vortexSpeed = 0.006;
        const vortex = Math.sin(currentTime * vortexSpeed) * 0.4 + 0.6;
        const dimensionalShift = Math.sin(currentTime * vortexSpeed * 1.8) * 0.3 + 0.7;
        
        // Swirling portal rings (like Teleport)
        const portalCount = 6;
        for (let i = 0; i < portalCount; i++) {
          const portalPhase = (currentTime * 0.005 + i * Math.PI / 3) % (Math.PI * 2);
          const portalRadius = item.r + 2 + i * 3 + Math.sin(portalPhase) * 2;
          const portalAlpha = (Math.sin(portalPhase + i) * 0.3 + 0.4) * (1 - i * 0.12);
          
          // Rotating gradient colors for dimensional effect
          const hue = (currentTime * 0.1 + i * 60) % 360;
          ctx.strokeStyle = \`hsla(\${hue}, 70%, 60%, \${portalAlpha})\`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, portalRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Enhanced dimensional glow
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + vortex * 0.25), 'rgb(75,0,130)', glowAlpha(0.6 * dimensionalShift, 1.2 * dimensionalShift, 0.2));
        } catch {}
        
        // Dimensional energy spirals (like Teleport)
        const spiralCount = 3;
        for (let s = 0; s < spiralCount; s++) {
          ctx.strokeStyle = \`rgba(75, 0, 130, \${0.6 * vortex})\`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          
          const spiralTurns = 3;
          const spiralRadius = item.r * 0.8;
          const spiralOffset = (currentTime * 0.003 + s * Math.PI * 2 / spiralCount) % (Math.PI * 2);
          
          for (let t = 0; t < spiralTurns * Math.PI * 2; t += 0.1) {
            const r = (spiralRadius * (spiralTurns * Math.PI * 2 - t)) / (spiralTurns * Math.PI * 2);
            const x = item.x + Math.cos(t + spiralOffset) * r;
            const y = item.y + Math.sin(t + spiralOffset) * r;
            
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }`;
  }

  /**
   * Generate magnetic field effects (based on Magnet)
   */
  generateMagneticEffects() {
    return `        // Magnetic field animation (like Magnet)
        const fieldSpeed = 0.003;
        const fieldPulse = Math.sin(currentTime * fieldSpeed) * 0.4 + 0.6;
        const magneticWave = Math.sin(currentTime * fieldSpeed * 2) * 0.3 + 0.7;
        
        // Magnetic field lines (like Magnet)
        const fieldCount = 8;
        for (let i = 0; i < fieldCount; i++) {
          const fieldPhase = (currentTime * 0.002 + i * Math.PI / 4) % (Math.PI * 2);
          const fieldRadius = item.r + 4 + i * 2 + Math.sin(fieldPhase) * 3;
          const fieldAlpha = (Math.sin(fieldPhase + i) * 0.3 + 0.4) * (1 - i * 0.1);
          
          // Alternating red and blue field lines (N/S poles)
          const fieldColor = i % 2 === 0 ? \`rgba(255, 69, 0, \${fieldAlpha})\` : \`rgba(30, 144, 255, \${fieldAlpha})\`;
          ctx.strokeStyle = fieldColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, fieldRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Enhanced magnetic glow
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + fieldPulse * 0.2), 'rgb(255,235,59)', glowAlpha(0.5 * magneticWave, 1.0 * magneticWave, 0.1));
        } catch {}
        
        // Magnetic attraction particles (like Magnet)
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + currentTime * 0.004;
          const particleRadius = item.r + 6 + Math.sin(currentTime * 0.008 + i) * 4;
          const particleX = item.x + Math.cos(angle) * particleRadius;
          const particleY = item.y + Math.sin(angle) * particleRadius;
          
          const particleSize = 1 + Math.sin(currentTime * 0.01 + i) * 0.5;
          ctx.fillStyle = \`rgba(255, 215, 0, \${0.7 * fieldPulse})\`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }`;
  }

  /**
   * Generate quantum effects with wave interference
   */
  generateQuantumEffects() {
    return `        // Quantum energy animation
        const quantumSpeed = 0.005;
        const wave1 = Math.sin(currentTime * quantumSpeed) * 0.4 + 0.6;
        const wave2 = Math.sin(currentTime * quantumSpeed * 1.618) * 0.3 + 0.7; // Golden ratio
        const interference = wave1 * wave2;
        
        // Quantum field fluctuations (compact)
        const fieldCount = 2;
        for (let i = 0; i < fieldCount; i++) {
          const fieldPhase = (currentTime * 0.004 + i * Math.PI / 2) % (Math.PI * 2);
          const fieldRadius = item.r + 2 + i * 2 + Math.sin(fieldPhase) * 2;
          const fieldAlpha = (Math.sin(fieldPhase + i) * 0.3 + 0.4) * interference;
          
          // Quantum color shifting
          const hue = (currentTime * 0.05 + i * 90) % 360;
          ctx.strokeStyle = \`hsla(\${hue}, 70%, 60%, \${fieldAlpha})\`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, fieldRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Enhanced quantum glow (compact)
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + interference * 0.15), 'rgb(0,255,127)', glowAlpha(0.4 * wave1, 0.8 * wave2, 0.2));
        } catch {}
        
        // Quantum particles with uncertainty principle (compact)
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + currentTime * 0.003;
          const uncertainty = Math.sin(currentTime * 0.007 + i) * 1.5; // Heisenberg uncertainty
          const particleRadius = item.r + 5 + uncertainty;
          const particleX = item.x + Math.cos(angle) * particleRadius;
          const particleY = item.y + Math.sin(angle) * particleRadius;
          
          const particleSize = 0.4 + Math.abs(Math.sin(currentTime * 0.012 + i)) * 0.8;
          const particleAlpha = 0.3 + 0.4 * Math.abs(Math.sin(currentTime * 0.009 + i));
          ctx.fillStyle = \`rgba(127, 255, 0, \${particleAlpha})\`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }`;
  }

  /**
   * Generate shield energy effects (based on Shield)
   */
  generateShieldEffects() {
    return `        // Animated shield energy field (like Shield)
        const pulseSpeed = 0.004;
        const pulse = Math.sin(currentTime * pulseSpeed) * 0.4 + 0.6;
        
        // Energy field rings (like Shield) - EXACT COUNT
        const ringCount = 4;
        for (let i = 0; i < ringCount; i++) {
          const ringPhase = (currentTime * 0.003 + i * Math.PI / 2) % (Math.PI * 2);
          const ringRadius = item.r + 2 + i * 3 + Math.sin(ringPhase) * 2;
          const ringAlpha = (Math.sin(ringPhase + i) * 0.2 + 0.3) * (1 - i * 0.2);
          
          ctx.strokeStyle = \`rgba(3, 169, 244, \${ringAlpha})\`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Enhanced shield glow
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + pulse * 0.15), 'rgb(3,169,244)', glowAlpha(0.4 * pulse, 1.0 * pulse, 0.2));
        } catch {}
        
        // Hexagonal shield pattern (like Shield)
        const hexRadius = item.r * 0.7;
        ctx.strokeStyle = \`rgba(255, 255, 255, \${0.3 * pulse})\`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = item.x + Math.cos(angle) * hexRadius;
          const y = item.y + Math.sin(angle) * hexRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Energy particles (like Shield) - EXACT COUNT
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + currentTime * 0.002;
          const particleRadius = item.r + 6 + Math.sin(currentTime * 0.006 + i) * 3;
          const particleX = item.x + Math.cos(angle) * particleRadius;
          const particleY = item.y + Math.sin(angle) * particleRadius;
          
          ctx.fillStyle = \`rgba(79, 195, 247, \${0.7 * pulse})\`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Enhanced outline (like Shield)
        ctx.strokeStyle = \`rgba(255, 255, 255, \${0.5 * pulse})\`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.stroke()`;
  }

  /**
   * Generate ice frost effects (based on IceFreezer)
   */
  generateIceFrostEffects() {
    return `        // Ice frost animation (like IceFreezer)
        const pulse = 0.85 + 0.15 * Math.sin(currentTime * 0.003);
        const fastPulse = 0.7 + 0.3 * Math.sin(currentTime * 0.006);
        const rotation = currentTime * 0.0005;
        
        // Multi-layer glowing aura (like IceFreezer) - EXACT MATCH
        try {
          drawGlow(ctx, item.x, item.y, item.r * 2.8 * pulse, '#b3e5fc', glowAlpha(0.15 * pulse, 0.8, 0.3));
          drawGlow(ctx, item.x, item.y, item.r * 1.8 * pulse, '#81d4fa', glowAlpha(0.3 * pulse, 1.0, 0.4));
          drawGlow(ctx, item.x, item.y, item.r * 1.2 * fastPulse, '#e1f5fe', glowAlpha(0.5 * fastPulse, 1.3, 0.6));
        } catch {}
        
        // Rotating ice crystal rings (like IceFreezer) - FULL VERSION
        const ringCount = 3;
        for (let ring = 0; ring < ringCount; ring++) {
          const ringRadius = item.r + 6 + ring * 5;
          const ringRotation = rotation * (ring % 2 === 0 ? 1 : -1) + (ring * Math.PI / 3);
          const ringAlpha = (0.4 - ring * 0.1) * pulse;
          
          ctx.strokeStyle = \`rgba(129, 212, 250, \${ringAlpha})\`;
          ctx.lineWidth = 2 - ring * 0.3;
          ctx.beginPath();
          
          // Draw hexagonal ice ring
          for (let i = 0; i < 6; i++) {
            const angle = ringRotation + (i * Math.PI) / 3;
            const x = item.x + Math.cos(angle) * ringRadius;
            const y = item.y + Math.sin(angle) * ringRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        
        // Floating ice shards (orbiting) (like IceFreezer) - EXACT MATCH
        const shardCount = 8;
        for (let i = 0; i < shardCount; i++) {
          const angle = (i / shardCount) * Math.PI * 2 + rotation * 1.5;
          const orbitRadius = item.r + 10 + Math.sin(currentTime * 0.004 + i) * 4;
          const shardX = item.x + Math.cos(angle) * orbitRadius;
          const shardY = item.y + Math.sin(angle) * orbitRadius;
          const shardSize = 2.5 + Math.sin(currentTime * 0.005 + i) * 0.8;
          const shardAlpha = (0.6 + 0.4 * Math.sin(currentTime * 0.004 + i)) * pulse;
          
          ctx.save();
          ctx.translate(shardX, shardY);
          ctx.rotate(angle + currentTime * 0.002);
          
          // Diamond-shaped ice shard (like IceFreezer) - EXACT SHAPE
          ctx.fillStyle = \`rgba(225, 245, 254, \${shardAlpha})\`;
          ctx.beginPath();
          ctx.moveTo(0, -shardSize * 2);
          ctx.lineTo(shardSize, 0);
          ctx.lineTo(0, shardSize * 1.2);
          ctx.lineTo(-shardSize, 0);
          ctx.closePath();
          ctx.fill();
          
          // Shard glow
          ctx.strokeStyle = \`rgba(129, 212, 250, \${shardAlpha * 0.6})\`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          
          ctx.restore();
        }
        
        // Ice spikes radiating outward (like IceFreezer)
        ctx.save();
        ctx.translate(item.x, item.y);
        const spikeCount = 6;
        for (let i = 0; i < spikeCount; i++) {
          const spikeAngle = rotation * 2 + (i * Math.PI * 2) / spikeCount;
          const spikeLength = item.r * (0.3 + 0.1 * Math.sin(currentTime * 0.006 + i));
          const spikeAlpha = 0.5 * pulse;
          
          ctx.save();
          ctx.rotate(spikeAngle);
          
          ctx.fillStyle = \`rgba(179, 229, 252, \${spikeAlpha})\`;
          ctx.beginPath();
          ctx.moveTo(item.r * 0.6, 0);
          ctx.lineTo(item.r * 0.6 + spikeLength, -2);
          ctx.lineTo(item.r * 0.6 + spikeLength * 1.2, 0);
          ctx.lineTo(item.r * 0.6 + spikeLength, 2);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }
        ctx.restore()
        
        // Sparkling stars around ice (like IceFreezer)
        const starCount = 6;
        for (let i = 0; i < starCount; i++) {
          const starAngle = (i / starCount) * Math.PI * 2 + currentTime * 0.001;
          const starDist = item.r * (1.4 + 0.2 * Math.sin(currentTime * 0.007 + i));
          const starX = item.x + Math.cos(starAngle) * starDist;
          const starY = item.y + Math.sin(starAngle) * starDist;
          const starSize = 1.5 + Math.sin(currentTime * 0.008 + i) * 0.8;
          const starAlpha = (0.5 + 0.5 * Math.sin(currentTime * 0.009 + i)) * pulse;
          
          ctx.fillStyle = \`rgba(255, 255, 255, \${starAlpha})\`;
          ctx.beginPath();
          ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Main ice block with layered gradient (like IceFreezer)
        const iceGradient = ctx.createRadialGradient(
          item.x - item.r * 0.4, item.y - item.r * 0.4, 0,
          item.x, item.y, item.r * 1.3
        );
        iceGradient.addColorStop(0, \`rgba(255, 255, 255, \${0.95 * pulse})\`);
        iceGradient.addColorStop(0.3, \`rgba(225, 245, 254, \${0.9 * pulse})\`);
        iceGradient.addColorStop(0.6, \`rgba(179, 229, 252, \${0.85 * pulse})\`);
        iceGradient.addColorStop(0.85, \`rgba(129, 212, 250, \${0.75 * pulse})\`);
        iceGradient.addColorStop(1, \`rgba(66, 165, 245, \${0.6 * pulse})\`);
        
        ctx.fillStyle = iceGradient;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill()
        
        // Ice outline with glow (like IceFreezer)
        ctx.strokeStyle = \`rgba(1, 87, 155, \${0.8 * pulse})\`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner highlight - the bright sparkle inside (like IceFreezer)
        ctx.strokeStyle = \`rgba(255, 255, 255, \${0.6 * fastPulse})\`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(item.x - item.r * 0.2, item.y - item.r * 0.2, item.r * 0.4, 0, Math.PI * 2);
        ctx.stroke()`;
  }

  /**
   * Generate complete advanced function
   */
  generateAdvancedFunction(powerupName, styleName) {
    const capitalName = powerupName.charAt(0).toUpperCase() + powerupName.slice(1);
    const style = this.styles[styleName];
    
    let effectsCode = '';
    switch (style.type) {
      case 'electric':
        effectsCode = this.generateElectricEffects();
        break;
      case 'flame':
        effectsCode = this.generateFlameEffects();
        break;
      case 'dimensional':
        effectsCode = this.generateDimensionalEffects();
        break;
      case 'magnetic':
        effectsCode = this.generateMagneticEffects();
        break;
      case 'quantum':
        effectsCode = this.generateQuantumEffects();
        break;
      case 'shield':
        effectsCode = this.generateShieldEffects();
        break;
      case 'icefrost':
        effectsCode = this.generateIceFrostEffects();
        break;
    }

    return `  /** @param {CanvasRenderingContext2D} ctx */
  draw${capitalName}s(ctx, mode, live${capitalName}s, mapDef, drawGlow, glowAlpha) {
    try {
      ctx.save();
      const ${powerupName}sToDraw = (mode === 'play' || mode === 'race')
        ? (window.live${capitalName}s || live${capitalName}s || [])
        : (mapDef?.${powerupName}s || []);
      
      const currentTime = performance.now();
      
      for (const item of ${powerupName}sToDraw) {
        if (item.consumed && (mode === 'play' || mode === 'race')) continue;
        
${effectsCode}
        
        // Main body with advanced gradient
        const gradient = ctx.createRadialGradient(
          item.x - item.r * 0.3, item.y - item.r * 0.3, 0,
          item.x, item.y, item.r
        );
        gradient.addColorStop(0, '${style.colors[0]}');
        gradient.addColorStop(0.5, '${style.colors[1]}');
        gradient.addColorStop(1, '${style.colors[2]}');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.font = \`bold \${Math.max(12, Math.round(item.r * 0.85))}px \${EMOJI_FONT}\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        
        if (mode === 'editor' && mapDef?.editorVectorIconsOnly) {
          try { this._drawVectorIcon(ctx, '${powerupName}', item.x, item.y, item.r); } catch {}
        } else {
          const configEmoji = window.config?.powerUps?.${powerupName}?.emoji;
          const icon = (mode === 'editor' && mapDef?.editorEmojiEnabled === false) 
            ? '${powerupName.substring(0, 3).toUpperCase()}' 
            : (configEmoji || '⭐');
          ctx.fillText(icon, item.x, item.y);
        }
      }
    } finally {
      try { ctx.restore(); } catch {}
    }
  },`;
  }

  /**
   * Apply advanced visual upgrade
   */
  async upgrade(powerupName, styleName) {
    if (!this.styles[styleName]) {
      console.log(`❌ Unknown style: ${styleName}`);
      console.log(`Available styles: ${Object.keys(this.styles).join(', ')}`);
      return;
    }

    const style = this.styles[styleName];
    console.log(`🚀 Advanced Visual Upgrader v2.0: Upgrading ${powerupName} with ${styleName}...`);
    console.log(`📝 Applying: ${style.name} - ${style.description}`);

    try {
      // Backup files
      await this.createBackups(powerupName);
      
      // Update render function with advanced effects
      await this.updateRenderFunction(powerupName, styleName, style);
      
      // Update config colors
      await this.updateConfig(powerupName, style);
      
      console.log(`✅ ${powerupName} upgraded to ${style.name} style successfully!`);
      console.log(`💡 Reload browser to see advanced effects`);
      
    } catch (error) {
      console.log(`❌ Advanced upgrade failed: ${error.message}`);
    }
  }

  /**
   * Create backups
   */
  async createBackups(powerupName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup render.js
    const renderBackup = `${this.renderFile}.advanced-backup-${timestamp}`;
    fs.copyFileSync(this.renderFile, renderBackup);
    
    // Backup config.js
    const configBackup = `${this.configFile}.advanced-backup-${timestamp}`;
    fs.copyFileSync(this.configFile, configBackup);
    
    console.log(`🛡️ Advanced backups created with timestamp: ${timestamp}`);
  }

  /**
   * Update render function with advanced effects
   */
  async updateRenderFunction(powerupName, styleName, style) {
    let content = fs.readFileSync(this.renderFile, 'utf8');
    const capitalName = powerupName.charAt(0).toUpperCase() + powerupName.slice(1);
    
    // Find the draw function with proper bracket matching
    const funcStart = content.indexOf(`draw${capitalName}s(`);
    if (funcStart === -1) {
      throw new Error(`Draw function for ${powerupName} not found`);
    }
    
    // Find the complete function by counting braces with safety limit
    let braceCount = 0;
    let funcEnd = funcStart;
    let inFunction = false;
    const maxSearch = 10000; // Safety limit to prevent infinite loops
    
    for (let i = funcStart; i < content.length && i < funcStart + maxSearch; i++) {
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          funcEnd = i + 1;
          // Check for trailing comma
          if (content[i + 1] === ',') {
            funcEnd = i + 2;
          }
          break;
        }
      }
    }
    
    if (!inFunction || braceCount !== 0) {
      throw new Error(`Could not find complete function for ${powerupName} - bracket mismatch`);
    }
    
    // Extract the old function
    const oldFunction = content.substring(funcStart, funcEnd);
    
    // Generate new advanced function
    const newFunction = this.generateAdvancedFunction(powerupName, styleName);
    
    // Replace function
    content = content.replace(oldFunction, newFunction);
    
    fs.writeFileSync(this.renderFile, content);
    console.log(`   ✓ Updated draw${capitalName}s function with ${style.name} advanced effects`);
  }

  /**
   * Update config colors
   */
  async updateConfig(powerupName, style) {
    let content = fs.readFileSync(this.configFile, 'utf8');
    
    // Update color in config
    const colorPattern = new RegExp(`(${powerupName}:\\s*{[^}]*color:\\s*['"])[^'"]*(['"][^}]*})`, 'g');
    content = content.replace(colorPattern, `$1${style.colors[0]}$2`);
    
    fs.writeFileSync(this.configFile, content);
    console.log(`   ✓ Updated config color to ${style.colors[0]}`);
  }

  /**
   * List available advanced styles
   */
  listStyles() {
    console.log(`\n🚀 Advanced Visual Upgrader v2.0 - Available Styles:`);
    for (const [key, style] of Object.entries(this.styles)) {
      console.log(`   ${key.padEnd(12)} - ${style.name}: ${style.description}`);
    }
    console.log(`\nUsage: node visual-upgrader-v2.js <powerup-name> <style-name>`);
    console.log(`Example: node visual-upgrader-v2.js testpower inferno`);
  }
}

// CLI Interface
if (require.main === module) {
  const upgrader = new AdvancedVisualUpgrader();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'list') {
    upgrader.listStyles();
  } else if (args.length === 2) {
    const [powerupName, styleName] = args;
    upgrader.upgrade(powerupName, styleName);
  } else {
    console.log('Usage: node visual-upgrader-v2.js <powerup-name> <style-name>');
    console.log('       node visual-upgrader-v2.js list');
  }
}

module.exports = AdvancedVisualUpgrader;
