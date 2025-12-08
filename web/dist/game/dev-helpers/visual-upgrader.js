#!/usr/bin/env node

/**
 * 🎨 Visual Upgrader v1.0 - Power-up Style Enhancement
 * 
 * Nâng cấp hình ảnh power-ups với nhiều preset styles:
 * - Neon Glow: Hiệu ứng neon sáng
 * - Particle Storm: Hiệu ứng hạt bay
 * - Crystal: Hiệu ứng pha lê trong suốt
 * - Fire: Hiệu ứng lửa cháy
 * - Ice: Hiệu ứng băng giá
 * - Lightning: Hiệu ứng sét điện
 * - Galaxy: Hiệu ứng thiên hà
 * - Vintage: Style cổ điển
 */

const fs = require('fs');
const path = require('path');

class VisualUpgrader {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.renderFile = path.join(this.projectRoot, 'scripts', 'render.js');
    this.configFile = path.join(this.projectRoot, 'scripts', 'config.js');
    
    this.styles = {
      neon: {
        name: 'Neon Glow',
        description: 'Hiệu ứng neon sáng với glow mạnh',
        colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00'],
        glowIntensity: 2.5,
        pulseSpeed: 0.008
      },
      particle: {
        name: 'Particle Storm', 
        description: 'Hiệu ứng hạt bay xung quanh',
        colors: ['#FFD700', '#FF6347', '#98FB98', '#87CEEB'],
        particleCount: 8,
        particleSpeed: 0.05
      },
      crystal: {
        name: 'Crystal',
        description: 'Hiệu ứng pha lê trong suốt',
        colors: ['#E6E6FA', '#F0F8FF', '#F5F5DC', '#FFF8DC'],
        transparency: 0.8,
        refraction: true
      },
      fire: {
        name: 'Fire',
        description: 'Hiệu ứng lửa cháy',
        colors: ['#FF4500', '#FF6347', '#FFD700', '#FF8C00'],
        flicker: true,
        heatWave: true
      },
      ice: {
        name: 'Ice',
        description: 'Hiệu ứng băng giá',
        colors: ['#B0E0E6', '#87CEEB', '#ADD8E6', '#E0FFFF'],
        frost: true,
        sparkle: true
      },
      lightning: {
        name: 'Lightning',
        description: 'Hiệu ứng sét điện',
        colors: ['#FFFF00', '#FFFFFF', '#E6E6FA', '#F0F8FF'],
        electric: true,
        zap: true
      },
      galaxy: {
        name: 'Galaxy',
        description: 'Hiệu ứng thiên hà',
        colors: ['#4B0082', '#8A2BE2', '#9400D3', '#FF1493'],
        stars: true,
        nebula: true
      },
      vintage: {
        name: 'Vintage',
        description: 'Style cổ điển',
        colors: ['#DEB887', '#D2691E', '#CD853F', '#A0522D'],
        sepia: true,
        grain: true
      }
    };
  }

  /**
   * Main upgrade method
   */
  async upgrade(powerupName, styleName) {
    console.log(`\n🎨 Visual Upgrader: Upgrading ${powerupName} with ${styleName} style...`);
    
    if (!this.styles[styleName]) {
      console.log(`❌ Style '${styleName}' not found!`);
      this.listStyles();
      return;
    }

    const style = this.styles[styleName];
    console.log(`📝 Applying: ${style.name} - ${style.description}`);

    try {
      // Backup files
      await this.createBackups(powerupName);
      
      // Update render function
      await this.updateRenderFunction(powerupName, styleName, style);
      
      // Update config colors
      await this.updateConfig(powerupName, style);
      
      console.log(`✅ ${powerupName} upgraded to ${style.name} style successfully!`);
      console.log(`💡 Reload browser to see changes`);
      
    } catch (error) {
      console.log(`❌ Upgrade failed: ${error.message}`);
    }
  }

  /**
   * Create backups
   */
  async createBackups(powerupName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup render.js
    const renderBackup = `${this.renderFile}.visual-backup-${timestamp}`;
    fs.copyFileSync(this.renderFile, renderBackup);
    
    // Backup config.js
    const configBackup = `${this.configFile}.visual-backup-${timestamp}`;
    fs.copyFileSync(this.configFile, configBackup);
    
    console.log(`🛡️ Backups created with timestamp: ${timestamp}`);
  }

  /**
   * Update render function with new style
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
    
    // Generate new function based on style
    const newFunction = this.generateStyledFunction(powerupName, styleName, style);
    
    // Replace function
    content = content.replace(oldFunction, newFunction);
    
    fs.writeFileSync(this.renderFile, content);
    console.log(`   ✓ Updated draw${capitalName}s function with ${style.name} style`);
  }

  /**
   * Generate styled render function
   */
  generateStyledFunction(powerupName, styleName, style) {
    const capitalName = powerupName.charAt(0).toUpperCase() + powerupName.slice(1);
    
    let functionCode = `  /** @param {CanvasRenderingContext2D} ctx */
  draw${capitalName}s(ctx, mode, live${capitalName}s, mapDef, drawGlow, glowAlpha) {
    try {
      ctx.save();
      const ${powerupName}sToDraw = (mode === 'play' || mode === 'race')
        ? (window.live${capitalName}s || live${capitalName}s || [])
        : (mapDef?.${powerupName}s || []);
      
      const currentTime = performance.now();
      
      for (const item of ${powerupName}sToDraw) {
        if (item.consumed && (mode === 'play' || mode === 'race')) continue;
        
        ${this.generateStyleEffects(styleName, style)}
        
        ${this.generateMainShape(powerupName, styleName, style)}
        
        ${this.generateIcon(powerupName, style)}
      }
    } finally {
      try { ctx.restore(); } catch {}
    }
  },`;

    return functionCode;
  }

  /**
   * Generate style-specific effects
   */
  generateStyleEffects(styleName, style) {
    switch (styleName) {
      case 'neon':
        return `        // Advanced neon glow with electric rings (like Boost)
        const pulseSpeed = 0.003;
        const neonPulse = Math.sin(currentTime * pulseSpeed) * 0.3 + 0.7;
        const glowIntensity = glowAlpha(0.4 * neonPulse, 0.9 * neonPulse, 0.1);
        
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + neonPulse * 0.2), '${style.colors[0]}', glowIntensity);
        } catch {}
        
        // Animated electric rings (like Boost)
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
          const ringPhase = (currentTime * 0.002 + i * Math.PI / ringCount) % (Math.PI * 2);
          const ringRadius = item.r + 4 + Math.sin(ringPhase) * 3;
          const ringAlpha = (Math.sin(ringPhase) * 0.3 + 0.4) * 0.6;
          
          ctx.strokeStyle = \`rgba(0, 255, 255, \${ringAlpha})\`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Electric sparks around the power-up (like Boost)
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
          const angle = (i / sparkCount) * Math.PI * 2 + currentTime * 0.005;
          const sparkRadius = item.r + 8 + Math.sin(currentTime * 0.008 + i) * 4;
          const sparkX = item.x + Math.cos(angle) * sparkRadius;
          const sparkY = item.y + Math.sin(angle) * sparkRadius;
          
          ctx.fillStyle = \`rgba(255, 0, 255, \${0.8 * neonPulse})\`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
          ctx.fill();
        }`;

      case 'particle':
        return `        // Particle storm effect
        for (let p = 0; p < ${style.particleCount}; p++) {
          const angle = (currentTime * ${style.particleSpeed} + p * Math.PI * 2 / ${style.particleCount}) % (Math.PI * 2);
          const distance = item.r * 2 + 5 * Math.sin(currentTime * ${style.particleSpeed * 2} + p);
          const px = item.x + Math.cos(angle) * distance;
          const py = item.y + Math.sin(angle) * distance;
          
          ctx.fillStyle = '${style.colors[0]}';
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(currentTime * ${style.particleSpeed * 3} + p);
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }`;

      case 'crystal':
        return `        // Crystal refraction effect
        ctx.globalAlpha = ${style.transparency};
        const crystalShimmer = 0.8 + 0.2 * Math.sin(currentTime * 0.003);
        try {
          drawGlow(ctx, item.x, item.y, item.r * 1.3 * crystalShimmer, '${style.colors[0]}', glowAlpha(0.4 * crystalShimmer, 1.2, 0.4));
        } catch {}`;

      case 'fire':
        return `        // Intense flame animation (like Turbo)
        const flameSpeed = 0.008;
        const flame = Math.sin(currentTime * flameSpeed) * 0.5 + 0.5;
        const flameIntensity = Math.sin(currentTime * flameSpeed * 1.3) * 0.3 + 0.7;
        
        // Multiple flame layers (like Turbo)
        const flameCount = 5;
        for (let i = 0; i < flameCount; i++) {
          const flamePhase = (currentTime * 0.006 + i * Math.PI / 3) % (Math.PI * 2);
          const flameRadius = item.r + 3 + i * 2 + Math.sin(flamePhase) * 4;
          const flameAlpha = (Math.sin(flamePhase) * 0.4 + 0.6) * (1 - i * 0.15);
          
          ctx.strokeStyle = \`rgba(255, \${112 - i * 15}, \${67 - i * 10}, \${flameAlpha})\`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, flameRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Enhanced glow with flame effect
        try {
          drawGlow(ctx, item.x, item.y, item.r * (1 + flame * 0.3), '${style.colors[0]}', glowAlpha(0.5 * flameIntensity, 1.2 * flameIntensity, 0.1));
        } catch {}
        
        // Fire particles (like Turbo)
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + currentTime * 0.01;
          const particleRadius = item.r + 8 + Math.sin(currentTime * 0.012 + i) * 6;
          const particleX = item.x + Math.cos(angle) * particleRadius;
          const particleY = item.y + Math.sin(angle) * particleRadius;
          
          const particleSize = 1 + Math.sin(currentTime * 0.015 + i) * 1;
          ctx.fillStyle = \`rgba(255, \${200 + Math.sin(i) * 55}, 0, \${0.8 * flameIntensity})\`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }`;

      case 'ice':
        return `        // Ice frost effect
        const frost = 0.85 + 0.15 * Math.sin(currentTime * 0.002);
        try {
          drawGlow(ctx, item.x, item.y, item.r * 1.6 * frost, '${style.colors[0]}', glowAlpha(0.5 * frost, 1.3, 0.5));
        } catch {}
        
        // Ice sparkles
        for (let s = 0; s < 4; s++) {
          const sparkleAngle = currentTime * 0.001 + s * Math.PI / 2;
          const sx = item.x + Math.cos(sparkleAngle) * item.r * 0.8;
          const sy = item.y + Math.sin(sparkleAngle) * item.r * 0.8;
          
          ctx.fillStyle = '${style.colors[3]}';
          ctx.globalAlpha = 0.8 * Math.abs(Math.sin(currentTime * 0.005 + s));
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }`;

      case 'lightning':
        return `        // Lightning electric effect
        const electric = 0.7 + 0.3 * Math.random();
        try {
          drawGlow(ctx, item.x, item.y, item.r * 2.2 * electric, '${style.colors[0]}', glowAlpha(0.9 * electric, 2.0, 0.9));
          
          // Electric arcs
          if (Math.random() < 0.3) {
            ctx.strokeStyle = '${style.colors[1]}';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(item.x - item.r, item.y);
            ctx.lineTo(item.x + item.r + Math.random() * 10 - 5, item.y + Math.random() * 10 - 5);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        } catch {}`;

      case 'galaxy':
        return `        // Galaxy nebula effect
        const nebula = 0.8 + 0.2 * Math.sin(currentTime * 0.002);
        try {
          drawGlow(ctx, item.x, item.y, item.r * 2.0 * nebula, '${style.colors[0]}', glowAlpha(0.6 * nebula, 1.8, 0.6));
          drawGlow(ctx, item.x, item.y, item.r * 1.3 * nebula, '${style.colors[1]}', glowAlpha(0.4 * nebula, 1.2, 0.4));
        } catch {}
        
        // Galaxy stars
        for (let st = 0; st < 6; st++) {
          const starAngle = currentTime * 0.0005 + st * Math.PI / 3;
          const starDist = item.r * (1.2 + 0.3 * Math.sin(currentTime * 0.003 + st));
          const stx = item.x + Math.cos(starAngle) * starDist;
          const sty = item.y + Math.sin(starAngle) * starDist;
          
          ctx.fillStyle = '${style.colors[2]}';
          ctx.globalAlpha = 0.9 * Math.abs(Math.sin(currentTime * 0.004 + st));
          ctx.beginPath();
          ctx.arc(stx, sty, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }`;

      case 'vintage':
        return `        // Vintage sepia effect
        const sepia = 0.9 + 0.1 * Math.sin(currentTime * 0.001);
        try {
          drawGlow(ctx, item.x, item.y, item.r * 1.1 * sepia, '${style.colors[0]}', glowAlpha(0.3 * sepia, 0.8, 0.3));
        } catch {}`;

      default:
        return `        // Default pulse effect
        const pulse = 0.85 + 0.15 * Math.sin(currentTime * 0.003);
        try {
          drawGlow(ctx, item.x, item.y, item.r * 1.5 * pulse, '${style.colors[0]}', glowAlpha(0.5 * pulse, 1.2, 0.6));
        } catch {}`;
    }
  }

  /**
   * Generate main shape based on style
   */
  generateMainShape(powerupName, styleName, style) {
    const baseShape = `        // Main shape with gradient
        const gradient = ctx.createRadialGradient(
          item.x - item.r * 0.3, item.y - item.r * 0.3, 0,
          item.x, item.y, item.r
        );`;

    switch (styleName) {
      case 'crystal':
        return baseShape + `
        gradient.addColorStop(0, '${style.colors[0]}');
        gradient.addColorStop(0.4, '${style.colors[1]}');
        gradient.addColorStop(0.8, '${style.colors[2]}');
        gradient.addColorStop(1, '${style.colors[3]}');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Crystal hexagon shape
        for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          const x = item.x + Math.cos(angle) * item.r;
          const y = item.y + Math.sin(angle) * item.r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();`;

      case 'fire':
        return baseShape + `
        gradient.addColorStop(0, '${style.colors[3]}');
        gradient.addColorStop(0.3, '${style.colors[2]}');
        gradient.addColorStop(0.7, '${style.colors[1]}');
        gradient.addColorStop(1, '${style.colors[0]}');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Fire flame shape
        const flamePoints = 8;
        for (let i = 0; i < flamePoints; i++) {
          const angle = (i / flamePoints) * Math.PI * 2;
          const radius = item.r * (0.8 + 0.2 * Math.random());
          const x = item.x + Math.cos(angle) * radius;
          const y = item.y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();`;

      default:
        return baseShape + `
        gradient.addColorStop(0, '${style.colors[0]}');
        gradient.addColorStop(0.5, '${style.colors[1]}');
        gradient.addColorStop(1, '${style.colors[2] || style.colors[0]}');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();`;
    }
  }

  /**
   * Generate icon rendering
   */
  generateIcon(powerupName, style) {
    return `        
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
        }`;
  }

  /**
   * Update config colors
   */
  async updateConfig(powerupName, style) {
    let content = fs.readFileSync(this.configFile, 'utf8');
    
    // Find powerup config
    const configPattern = new RegExp(
      `(${powerupName}:\\s*\\{[\\s\\S]*?)(color:\\s*['"][^'"]*['"])([\\s\\S]*?\\})`,
      'g'
    );
    
    const newColor = style.colors[0];
    content = content.replace(configPattern, `$1color: '${newColor}'$3`);
    
    fs.writeFileSync(this.configFile, content);
    console.log(`   ✓ Updated config color to ${newColor}`);
  }

  /**
   * List available styles
   */
  listStyles() {
    console.log('\n🎨 Available Styles:');
    Object.entries(this.styles).forEach(([key, style]) => {
      console.log(`   ${key.padEnd(12)} - ${style.name}: ${style.description}`);
    });
    console.log('\nUsage: node visual-upgrader.js <powerup-name> <style-name>');
    console.log('Example: node visual-upgrader.js testdamage neon');
  }

  /**
   * Show preview of style
   */
  showPreview(styleName) {
    if (!this.styles[styleName]) {
      console.log(`❌ Style '${styleName}' not found!`);
      return;
    }

    const style = this.styles[styleName];
    console.log(`\n🎨 ${style.name} Preview:`);
    console.log(`📝 ${style.description}`);
    console.log(`🎨 Colors: ${style.colors.join(', ')}`);
    
    if (style.glowIntensity) console.log(`✨ Glow Intensity: ${style.glowIntensity}x`);
    if (style.particleCount) console.log(`🌟 Particles: ${style.particleCount}`);
    if (style.transparency) console.log(`👻 Transparency: ${style.transparency}`);
    
    console.log(`\nTo apply: node visual-upgrader.js <powerup-name> ${styleName}`);
  }
}

// CLI Interface
if (require.main === module) {
  const upgrader = new VisualUpgrader();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🎨 Visual Upgrader v1.0 - Power-up Style Enhancement

Nâng cấp hình ảnh power-ups với nhiều preset styles đẹp mắt.

Usage:
  node visual-upgrader.js <powerup-name> <style-name>
  node visual-upgrader.js list                    # List all styles
  node visual-upgrader.js preview <style-name>    # Preview style

Examples:
  node visual-upgrader.js testdamage neon        # Apply neon style
  node visual-upgrader.js lightning fire         # Apply fire style
  node visual-upgrader.js heal crystal           # Apply crystal style
`);
    upgrader.listStyles();
  } else if (args[0] === 'list') {
    upgrader.listStyles();
  } else if (args[0] === 'preview' && args[1]) {
    upgrader.showPreview(args[1]);
  } else if (args.length === 2) {
    upgrader.upgrade(args[0], args[1]);
  } else {
    console.log('❌ Invalid arguments. Use: node visual-upgrader.js <powerup-name> <style-name>');
    upgrader.listStyles();
  }
}

module.exports = VisualUpgrader;
