#!/usr/bin/env node

/**
 * 🚀 Modular Power-up Integrator v3.0
 * Tự động tích hợp power-ups vào Horse Maze Electron (Modular Architecture)
 * 
 * MAJOR CHANGES from v2:
 * - ✅ Multi-file support (config.js, render.js, race.js, powerup-system.js, extracted-inline.js)
 * - ✅ Cross-file validation
 * - ✅ Template-based rendering
 * - ✅ Better error handling
 * - ✅ Rollback support
 * 
 * Usage: 
 *   node integrate-v3.js <name> <emoji> [options]
 * 
 * Examples:
 *   node integrate-v3.js stun 💫 --damage=20 --duration=3000
 *   node integrate-v3.js heal 💚 --healAmount=30 --duration=5000 --radius=18
 */

const fs = require('fs');
const path = require('path');

class ModularIntegrator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.files = {
      powerupSystem: path.join(this.projectRoot, 'scripts', 'core', 'powerup-system.js'),
      config: path.join(this.projectRoot, 'scripts', 'config.js'),
      race: path.join(this.projectRoot, 'scripts', 'core', 'race.js'),
      render: path.join(this.projectRoot, 'scripts', 'render.js'),
      gameLogic: path.join(this.projectRoot, 'scripts', 'extracted-inline.js'),
      editorInit: path.join(this.projectRoot, 'scripts', 'editor', 'powerup-settings-init.js'),
      index: path.join(this.projectRoot, 'index.html')
    };
    this.backups = {};
  }

  /**
   * 🎯 Main integration method
   */
  async integrate(config) {
    const { name, emoji, settings } = config;
    
    // Store config for access in other methods
    this.config = config;
    
    console.log(`\n🚀 Integrating ${name} ${emoji} (Modular Architecture)...`);
    console.log(`📦 Settings:`, settings);
    
    // Validate emoji
    this.validateEmoji(emoji);
    
    try {
      // 1. Backup all files
      await this.backupAllFiles();
      
      // 2. Update files in order (dependencies matter)
      console.log('\n📝 Updating files...');
      await this.updatePowerupSystem(name);
      await this.updateConfig(name, emoji, settings);
      await this.updateRace(name);
      await this.updateRender(name, emoji, settings);
      await this.updateGameLogic(name, emoji, settings);
      await this.updateEditorInit(name, settings);
      await this.addToolButton(name, emoji);
      
      // 3. Validate integration
      console.log('\n🔍 Validating integration...');
      const isValid = await this.validate(name);
      
      if (isValid) {
        console.log(`\n✅ ${name} ${emoji} integrated successfully!`);
        console.log(`📁 Modified files:`);
        console.log(`   - scripts/core/powerup-system.js`);
        console.log(`   - scripts/config.js`);
        console.log(`   - scripts/core/race.js`);
        console.log(`   - scripts/render.js`);
        console.log(`   - scripts/extracted-inline.js`);
        console.log(`   - scripts/editor/powerup-settings-init.js`);
        console.log(`   - index.html`);
        console.log(`\n🎨 Next steps:`);
        console.log(`   1. Polish rendering in render.js (add custom animations)`);
        console.log(`   2. Test in editor mode (place & delete)`);
        console.log(`   3. Test in race mode (collision & effects)`);
        console.log(`   4. Add context menu: node add-context-settings.js ${name} ${emoji} --auto`);
      } else {
        throw new Error('Validation failed - rolling back changes');
      }
      
    } catch (error) {
      console.error(`\n❌ Integration failed:`, error.message);
      await this.rollback();
    }
  }

  /**
   * 💾 Backup all files
   */
  async backupAllFiles() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    console.log('🛡️ Creating backups...');
    
    for (const [key, filePath] of Object.entries(this.files)) {
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup-${timestamp}`;
        fs.copyFileSync(filePath, backupPath);
        this.backups[key] = backupPath;
        console.log(`   ✓ ${path.basename(filePath)}`);
      }
    }
  }

  /**
   * 🔄 Rollback changes
   */
  async rollback() {
    console.log('\n🔄 Rolling back changes...');
    
    for (const [key, backupPath] of Object.entries(this.backups)) {
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, this.files[key]);
        fs.unlinkSync(backupPath);
        console.log(`   ✓ Restored ${path.basename(this.files[key])}`);
      }
    }
    
    console.log('✅ Rollback complete');
  }

  /**
   * 📊 Update powerup-system.js
   */
  async updatePowerupSystem(name) {
    let content = fs.readFileSync(this.files.powerupSystem, 'utf8');
    const capitalName = this.capitalize(name);
    
    // Check if already exists in POWERUP_TYPES object
    if (content.includes(`${name}: { name:`)) {
      console.log(`   ⚠️ powerup-system.js: ${name} already exists, skipping`);
      return;
    }
    
    // Add to POWERUP_TYPES object (before closing brace)
    const configEntry = `    ${name}: { name: '${capitalName}', r: ${this.config.settings.radius || 15}, color: '${this.config.settings.color || '#ffffff'}' }`;
    
    // Find the last entry and add comma if needed, then insert new entry
    content = content.replace(
      /(const POWERUP_TYPES = \{[\s\S]*?)(\n  \};)/,
      (match, before, after) => {
        // Add comma to last line if it doesn't have one
        const lines = before.split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine.trim() && !lastLine.trim().endsWith(',')) {
          lines[lines.length - 1] = lastLine + ',';
        }
        return lines.join('\n') + `\n${configEntry}` + after;
      }
    );
    
    // Add to addPowerupToLive switch statement (after icefreezer case)
    const switchCase = `      case '${name}': 
        if (window.live${capitalName}s) window.live${capitalName}s.push(obj);
        break;`;
    
    content = content.replace(
      /(case 'icefreezer':[\s\S]*?break;)/,
      `$1\n${switchCase}`
    );
    
    fs.writeFileSync(this.files.powerupSystem, content);
    console.log(`   ✓ powerup-system.js: Added ${name} config + switch case`);
  }

  /**
   * ⚙️ Update config.js
   */
  async updateConfig(name, emoji, settings) {
    let content = fs.readFileSync(this.files.config, 'utf8');
    
    // 1. Add to powerUps object
    const configBlock = `  ${name}: {
    radius: ${settings.radius || 15},
    color: '${settings.color || '#ffffff'}',
    outlineColor: '${settings.outlineColor || '#000000'}',
    emoji: '${emoji}',
    duration: ${settings.duration || 3000},
    ${settings.damage ? `damage: ${settings.damage},` : ''}
    ${settings.healAmount ? `healAmount: ${settings.healAmount},` : ''}
    glowColor: '${settings.glowColor || settings.color || '#ffffff'}',
    glowAlpha: ${settings.glowAlpha || 0.8}
  },`;
    
    if (content.includes(`${name}: {`)) {
      console.log(`   ⚠️ config.js: ${name} powerUp already exists, skipping`);
    } else {
      // Insert after icefreezer (or last power-up)
      content = content.replace(
        /(icefreezer: \{[\s\S]*?\},)/,
        `$1\n${configBlock}`
      );
      console.log(`   ✓ config.js: Added ${name} to powerUps`);
    }
    
    // 2. Add to editorTools
    const toolBlock = `    ${name}: { label: '${emoji} ${this.capitalize(name)}', hotkey: '' },`;
    
    if (content.includes(`${name}: { label:`)) {
      console.log(`   ⚠️ config.js: ${name} editorTool already exists, skipping`);
    } else {
      // Insert after icefreezer in editorTools
      const editorToolsMatch = content.match(/editorTools:\s*\{([\s\S]*?)\}/);
      if (editorToolsMatch) {
        const beforeClosing = editorToolsMatch[0].lastIndexOf('}');
        const editorToolsSection = editorToolsMatch[0];
        const updated = editorToolsSection.slice(0, beforeClosing) + `\n${toolBlock}` + editorToolsSection.slice(beforeClosing);
        content = content.replace(editorToolsMatch[0], updated);
        console.log(`   ✓ config.js: Added ${name} to editorTools`);
      }
    }
    
    fs.writeFileSync(this.files.config, content);
  }

  /**
   * 🏁 Update race.js
   */
  async updateRace(name) {
    let content = fs.readFileSync(this.files.race, 'utf8');
    const capitalName = this.capitalize(name);
    
    // 1. Add initialization
    const init = `  window.live${capitalName}s = JSON.parse(JSON.stringify(window.mapDef.${name}s || []));`;
    
    if (content.includes(`window.live${capitalName}s`)) {
      console.log(`   ⚠️ race.js: live${capitalName}s already exists, skipping init`);
    } else {
      // Find initializeRace function and add after liveIceFreezers
      content = content.replace(
        /(window\.liveIceFreezers = [\s\S]*?;)/,
        `$1\n${init}`
      );
      console.log(`   ✓ race.js: Added live${capitalName}s initialization`);
    }
    
    // 2. Add to reset array
    const resetEntry = `    { live: window.live${capitalName}s, mapDef: window.mapDef.${name}s },`;
    
    if (content.includes(`live: window.live${capitalName}s`)) {
      console.log(`   ⚠️ race.js: Reset entry already exists, skipping`);
    } else {
      // Find allPowerUpArrays and add entry
      content = content.replace(
        /(\{ live: window\.liveIceFreezers[\s\S]*?\},)/,
        `$1\n${resetEntry}`
      );
      console.log(`   ✓ race.js: Added to allPowerUpArrays reset`);
    }
    
    fs.writeFileSync(this.files.race, content);
  }

  /**
   * 🎨 Update render.js
   */
  async updateRender(name, emoji, settings) {
    let content = fs.readFileSync(this.files.render, 'utf8');
    const capitalName = this.capitalize(name);
    
    if (content.includes(`draw${capitalName}s(`)) {
      console.log(`   ⚠️ render.js: draw${capitalName}s already exists, skipping`);
      return;
    }
    
    // Create draw function
    const drawFunction = this.generateDrawFunction(name, emoji, settings);
    
    // Insert after drawIceFreezers (more flexible pattern)
    const insertResult = content.replace(
      /(drawIceFreezers\(ctx[^}]*\{[\s\S]*?\n    \},)/,
      `$1\n${drawFunction}`
    );
    
    if (insertResult === content) {
      console.log(`   ⚠️ render.js: Could not find insertion point for draw function`);
      // Try alternative pattern
      content = content.replace(
        /(    \},\n    \/\*\* @param \{CanvasRenderingContext2D\} ctx \*\/\n    drawGhosts)/,
        `    },\n${drawFunction}    /** @param {CanvasRenderingContext2D} ctx */\n    drawGhosts`
      );
    } else {
      content = insertResult;
    }
    
    // Add call in drawPowerUps (more flexible pattern)
    const call = `    this.draw${capitalName}s(ctx, mode, window.live${capitalName}s, window.mapDef, this.drawGlow, this.glowAlpha);`;
    
    const callInsert = content.replace(
      /(this\.drawIceFreezers\([^)]*\);)/,
      `$1\n${call}`
    );
    
    if (callInsert === content) {
      console.log(`   ⚠️ render.js: Could not find insertion point for function call`);
    } else {
      content = callInsert;
    }
    
    fs.writeFileSync(this.files.render, content);
    console.log(`   ✓ render.js: Added draw${capitalName}s function + call`);
  }

  /**
   * 🎮 Update extracted-inline.js (game logic)
   */
  async updateGameLogic(name, emoji, settings) {
    let content = fs.readFileSync(this.files.gameLogic, 'utf8');
    const capitalName = this.capitalize(name);
    
    // 1. Add helper function (nearTestpower)
    if (!content.includes(`function near${capitalName}`)) {
      const helperFunc = `
// Helper function for ${name}
function near${capitalName}(mx, my) {
  for (let i = 0; i < (mapDef.${name}s || []).length; i++) {
    const item = mapDef.${name}s[i];
    const radius = item.r || ${settings.radius || 15};
    if (Math.hypot(mx - item.x, my - item.y) < radius) return i;
  }
  return -1;
}
`;
      // Insert after nearIcefreezer function
      content = content.replace(
        /(function nearIcefreezer[\s\S]*?return -1;\n})/,
        `$1\n${helperFunc}`
      );
      console.log(`   ✓ game-logic: Added near${capitalName} helper function`);
    }
    
    // 2. Add to mapDef initialization (after yellowhearts)
    if (!content.includes(`${name}s: []`)) {
      content = content.replace(
        /(yellowhearts: \[\],[^\n]*\n\/\/ \[PU-END[^\]]*\])/,
        `$1\n  ${name}s: [], // ${emoji} ${capitalName} power-ups`
      );
      console.log(`   ✓ game-logic: Added ${name}s to mapDef`);
    }
    
    // 2. Add settings to mapDef
    if (!content.includes(`${name}Settings: {`)) {
      const settingsBlock = `  ${name}Settings: {
    durationMs: ${settings.duration || 3000},
    ${settings.damage ? `damage: ${settings.damage},` : ''}
    ${settings.healAmount ? `healAmount: ${settings.healAmount},` : ''}
    radius: ${settings.radius || 15},
    consumable: ${settings.consumable !== false}
  },`;
      
      content = content.replace(
        /(icefreezerSettings: \{[\s\S]*?\},)/,
        `$1\n${settingsBlock}`
      );
      console.log(`   ✓ game-logic: Added ${name}Settings to mapDef`);
    }
    
    // 3. Add to powerUpTypes array
    if (!content.includes(`window.live${capitalName}s`)) {
      const typeEntry = `    { array: window.live${capitalName}s || live${capitalName}s, type: '${name}' },`;
      content = content.replace(
        /(\{ array: window\.liveIceFreezers[\s\S]*?\},)/,
        `$1\n${typeEntry}`
      );
      console.log(`   ✓ game-logic: Added to powerUpTypes array`);
    }
    
    // 4. Add random placement case (simple one-liner)
    if (!content.match(new RegExp(`case '${name}':[\\s\\S]*?mapDef\\.${name}s\\.push`))) {
      const randomCase = `case '${name}': mapDef.${name}s.push({ x, y, r: ${settings.radius || 15} }); break;`;
      content = content.replace(
        /(case 'icefreezer': mapDef\.icefreezers\.push[^;]*;[^;]*break;)/,
        `$1\n          ${randomCase}`
      );
      console.log(`   ✓ game-logic: Added random placement case`);
    }
    
    // 5. Add collision case handler (in powerUpTypes loop, not random placement)
    if (!content.match(new RegExp(`case '${name}':[\\s\\S]*?${name}Now`))) {
      const caseHandler = this.generateCaseHandler(name, emoji, settings);
      // Find the collision handler section (after icefreezer collision case)
      const beforeReplace = content;
      
      // Pattern 1: Find collision section with iceFreezeGlowUntil marker (unique to collision, not random placement)
      content = content.replace(
        /(horse\.iceFreezeGlowUntil[\s\S]*?break;)([\s\S]*?case 'poison':)/,
        `$1\n\n${caseHandler}\n            $2`
      );
      
      if (content === beforeReplace) {
        console.log(`   ⚠️ game-logic: Could not find iceFreezeGlowUntil pattern, trying logEvent...`);
        // Pattern 2: Try with specific logEvent pattern from collision section
        content = content.replace(
          /(logEvent\(`🧊 Ngựa[\s\S]*?đóng băng hoàn toàn[\s\S]*?\);[\s\S]*?break;)([\s\S]*?case 'poison':)/,
          `$1\n\n${caseHandler}\n            $2`
        );
      }
      
      if (content === beforeReplace) {
        console.log(`   ⚠️ game-logic: Trying createPickupBurst pattern...`);
        // Pattern 3: Find with createPickupBurst marker (also unique to collision section)
        content = content.replace(
          /(createPickupBurst\('icefreezer'[\s\S]*?break;)([\s\S]*?case 'poison':)/,
          `$1\n\n${caseHandler}\n            $2`
        );
      }
      
      if (content !== beforeReplace) {
        console.log(`   ✓ game-logic: Added collision case handler`);
        // Validate insertion by checking if case exists
        if (content.includes(`case '${name}':`)) {
          console.log(`   ✅ Validation: collision case '${name}' found in code`);
        } else {
          console.log(`   ⚠️ Validation: collision case '${name}' NOT found - insertion may have failed`);
        }
      } else {
        console.log(`   ❌ game-logic: FAILED to add collision case handler`);
        console.log(`   💡 Manual fix needed: Add collision case after icefreezer case in powerUpTypes loop`);
        console.log(`   📍 Location: ~line 6400+ in extracted-inline.js`);
      }
    }
    
    // 6. Add to consumable check
    if (!content.includes(`} else if (type === '${name}') {`)) {
      const consumableCheck = `} else if (type === '${name}') {
              powerUpSettings = mapDef.${name}Settings || {};`;
      content = content.replace(
        /(\} else if \(type === 'icefreezer'\) \{[\s\S]*?\}\})/,
        `$1\n            ${consumableCheck}\n            }`
      );
      console.log(`   ✓ game-logic: Added to consumable check`);
    }
    
    // 7. Add to context menu supported arrays (3 locations)
    const supported = `'${name}'`;
    
    // Location 1: Right-click delegated handler (~line 3750)
    if (!content.match(/const supported = \[[\s\S]*?'icefreezer'/)) {
      console.log(`   ⚠️ game-logic: Could not find supported array for context menu`);
    } else {
      // Add after icefreezer in all 3 supported arrays
      content = content.replace(
        /(const supported = \[[^\]]*'icefreezer')/g,
        `$1,${supported}`
      );
      console.log(`   ✓ game-logic: Added to context menu supported arrays`);
    }
    
    // 8. Add to contextMapping
    if (!content.includes(`${name}:'${name}'`)) {
      content = content.replace(
        /(icefreezer:'icefreezer')/,
        `$1, ${name}:'${name}'`
      );
      console.log(`   ✓ game-logic: Added to contextMapping`);
    }
    
    // 9. Add editor mousedown handler (place on click)
    if (!content.includes(`if (tool === '${name}' && e.button === 0)`)) {
      const placeHandler = `
  if (tool === '${name}' && e.button === 0) {
    if (!mapDef.${name}s) mapDef.${name}s = [];
    // Check if there's already a ${name} at this position
    let tooClose = false;
    for (const item of mapDef.${name}s) {
      if (Math.hypot(mx - item.x, my - item.y) < ${settings.radius || 15}) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      try { pushHistory('add_${name}'); } catch {}
      mapDef.${name}s.push({ x: snapVal(mx), y: snapVal(my), r: ${settings.radius || 15} });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }
`;
      
      content = content.replace(
        /(if \(tool === 'icefreezer' && e\.button === 0\) \{[\s\S]*?return;\n  \})/,
        `$1${placeHandler}`
      );
      console.log(`   ✓ game-logic: Added editor mousedown handler (place)`);
    }
    
    // 10. Add editor delete handler (right-click)
    if (!content.includes(`// Delete ${name}`)) {
      const deleteHandler = `    // Delete ${name}
    if (mapDef.${name}s) {
      for (let i = 0; i < mapDef.${name}s.length; i++) {
        if (Math.hypot(mx - mapDef.${name}s[i].x, my - mapDef.${name}s[i].y) < ${settings.radius || 15}) {
          mapDef.${name}s.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return;
        }
      }
    }
`;
      
      content = content.replace(
        /(const poison_i = nearPoison\(mx,my\);[\s\S]*?return; \})/,
        `$1\n${deleteHandler}`
      );
      console.log(`   ✓ game-logic: Added editor delete handler (right-click)`);
    }
    
    fs.writeFileSync(this.files.gameLogic, content);
  }

  /**
   * 📝 Update powerup-settings-init.js
   */
  async updateEditorInit(name, settings) {
    let content = fs.readFileSync(this.files.editorInit, 'utf8');
    
    if (content.includes(`${name}Duration`)) {
      console.log(`   ⚠️ editor-init: ${name} already exists, skipping`);
      return;
    }
    
    const initBlock = `
    try {
      const ${name}Dur = parseInt(localStorage.getItem('${name}Duration') || '');
      if (!Number.isNaN(${name}Dur)) {
        window.mapDef.${name}Settings.durationMs = Math.max(500, Math.min(10000, ${name}Dur));
      }
    } catch {}
`;
    
    // Insert after icefreezer init
    content = content.replace(
      /(\/\/ Load Ice Freezer[\s\S]*?\} catch \{\})/,
      `$1\n${initBlock}`
    );
    
    fs.writeFileSync(this.files.editorInit, content);
    console.log(`   ✓ editor-init: Added localStorage initialization`);
  }

  /**
   * 🔘 Add tool button to index.html
   */
  async addToolButton(name, emoji) {
    let content = fs.readFileSync(this.files.index, 'utf8');
    const capitalName = this.capitalize(name);
    
    // Check if already exists
    if (content.includes(`data-tool="${name}"`)) {
      console.log(`   ⚠️ index.html: ${name} tool button already exists`);
      return;
    }
    
    // Create tool button HTML
    const toolButton = `<div class="tool" data-tool="${name}" title="${capitalName}">${emoji}</div>`;
    
    // Insert after icefreezer button
    content = content.replace(
      /(<div class="tool" data-tool="icefreezer"[^>]*>[^<]*<\/div>)/,
      `$1\n          ${toolButton}`
    );
    
    fs.writeFileSync(this.files.index, content);
    console.log(`   ✓ index.html: Added ${name} tool button`);
  }

  /**
   * 🔍 Validate integration
   */
  async validate(name) {
    const capitalName = this.capitalize(name);
    const checks = [
      { 
        file: 'powerupSystem', 
        pattern: new RegExp(`${name}s: \\[\\]`),
        desc: `${name} POWERUP_TYPES config`,
        optional: true  // This check is optional
      },
      { 
        file: 'config', 
        pattern: new RegExp(`${name}: \\{[\\s\\S]*?emoji: '`),
        desc: `${name} powerUp config` 
      },
      { 
        file: 'race', 
        pattern: new RegExp(`window\\.live${capitalName}s`),
        desc: `live${capitalName}s initialization` 
      },
      { 
        file: 'render', 
        pattern: new RegExp(`draw${capitalName}s\\(ctx`),
        desc: `draw${capitalName}s function` 
      },
      { 
        file: 'gameLogic', 
        pattern: new RegExp(`case '${name}':`),
        desc: `collision case handler` 
      },
      { 
        file: 'gameLogic', 
        pattern: new RegExp(`${name}Settings: \\{`),
        desc: `${name}Settings object` 
      },
      { 
        file: 'gameLogic', 
        pattern: new RegExp(`if \\(tool === '${name}' && e\\.button === 0\\)`),
        desc: `editor mousedown handler (place)` 
      },
      { 
        file: 'gameLogic', 
        pattern: new RegExp(`// Delete ${name}`),
        desc: `editor delete handler (right-click)` 
      },
      { 
        file: 'index', 
        pattern: new RegExp(`data-tool="${name}"`),
        desc: `tool button in HTML` 
      }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      const content = fs.readFileSync(this.files[check.file], 'utf8');
      if (!check.pattern.test(content)) {
        if (check.optional) {
          console.log(`   ⚠️ ${check.desc} - NOT FOUND (optional)`);
        } else {
          console.log(`   ❌ ${check.desc} - NOT FOUND`);
          allPassed = false;
        }
      } else {
        console.log(`   ✅ ${check.desc}`);
      }
    }
    
    return allPassed;
  }

  /**
   * 🎨 Generate draw function template
   */
  generateDrawFunction(name, emoji, settings) {
    const capitalName = this.capitalize(name);
    const color = settings.color || '#ffffff';
    const glowColor = settings.glowColor || color;
    
    return `
  /** @param {CanvasRenderingContext2D} ctx */
  draw${capitalName}s(ctx, mode, live${capitalName}s, mapDef, drawGlow, glowAlpha) {
    try {
      ctx.save();
      const ${name}sToDraw = (mode === 'play' || mode === 'race')
        ? (window.live${capitalName}s || live${capitalName}s || [])
        : (mapDef?.${name}s || []);
      
      const currentTime = performance.now();
      
      for (const item of ${name}sToDraw) {
        if (item.consumed && (mode === 'play' || mode === 'race')) continue;
        
        const pulse = 0.85 + 0.15 * Math.sin(currentTime * 0.003);
        
        // Glow effect
        try {
          drawGlow(ctx, item.x, item.y, item.r * 1.5 * pulse, '${glowColor}', glowAlpha(0.5 * pulse, 1.2, 0.6));
        } catch {}
        
        // Main circle with gradient
        const gradient = ctx.createRadialGradient(
          item.x - item.r * 0.3, item.y - item.r * 0.3, 0,
          item.x, item.y, item.r
        );
        gradient.addColorStop(0, '${this.lighten(color, 30)}');
        gradient.addColorStop(0.7, '${color}');
        gradient.addColorStop(1, '${this.darken(color, 20)}');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '${settings.outlineColor || '#000000'}';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon
        ctx.font = \`bold \${Math.max(12, Math.round(item.r * 0.85))}px \${EMOJI_FONT}\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        
        if (mode === 'editor' && mapDef?.editorVectorIconsOnly) {
          try { this._drawVectorIcon(ctx, '${name}', item.x, item.y, item.r); } catch {}
        } else {
          // Get emoji from config, fallback to command line arg
          const configEmoji = window.config?.powerUps?.${name}?.emoji;
          const icon = (mode === 'editor' && mapDef?.editorEmojiEnabled === false) 
            ? '${name.substring(0, 3).toUpperCase()}' 
            : (configEmoji || '${emoji}');
          ctx.fillText(icon, item.x, item.y);
        }
      }
    } finally {
      try { ctx.restore(); } catch {}
    }
  },`;
  }

  /**
   * ⚡ Generate collision case handler
   */
  generateCaseHandler(name, emoji, settings) {
    const effect = settings.damage ? 'damage' : settings.healAmount ? 'heal' : 'status';
    const capitalName = this.capitalize(name);
    
    // Debug effect detection
    console.log(`   🔍 Effect detection: ${effect} (damage: ${settings.damage}, heal: ${settings.healAmount})`);
    
    let floatingText = `'${emoji} ${capitalName.toUpperCase()}!'`;
    let logMessage = `\`${emoji} Ngựa \${horse.name || ('#'+(horse.i+1))} nhặt được ${name}\``;
    
    if (effect === 'damage') {
      floatingText = `\`${emoji} -\${${name}Settings.damage || ${settings.damage || 20}} HP!\``;
      logMessage = `\`${emoji} Ngựa \${horse.name || ('#'+(horse.i+1))} nhặt được ${name}! (-\${${name}Settings.damage || ${settings.damage || 20}} HP)\``;
    } else if (effect === 'heal') {
      floatingText = `\`${emoji} +\${${name}Settings.healAmount || ${settings.healAmount || 30}} HP!\``;
      logMessage = `\`${emoji} Ngựa \${horse.name || ('#'+(horse.i+1))} nhặt được ${name}! (+\${${name}Settings.healAmount || ${settings.healAmount || 30}} HP)\``;
    }
    
    return `            case '${name}':
              const ${name}Now = performance.now();
              const ${name}Settings = mapDef.${name}Settings || { damage: ${settings.damage || 0}, healAmount: ${settings.healAmount || 0}, consumable: true };
              
              ${effect === 'damage' ? `// Apply damage immediately
              horse.hp = (horse.hp || 100) - (${name}Settings.damage || ${settings.damage || 20});
              if (horse.hp <= 0) {
                horse.eliminated = true;
                horse.hp = 0;
              }` : ''}
              ${effect === 'heal' ? `// Apply healing immediately
              horse.hp = Math.min((horse.hp || 100) + (${name}Settings.healAmount || ${settings.healAmount || 30}), 100);` : ''}
              
              // Visual effects
              try { playSfx('powerup'); } catch {}
              floatingTexts.push({ 
                x: horse.x, 
                y: horse.y - horse.r - 6, 
                t: ${name}Now, 
                life: 1600, 
                text: ${floatingText}, 
                color: '${settings.color || '#ffffff'}' 
              });
              try { createExplosion(powerUp.x, powerUp.y, '${settings.color || '#ffffff'}', 24); } catch {}
              ${effect === 'damage' ? `try { createExplosion(horse.x, horse.y, '${this.darken(settings.color || '#ff0000', 20)}', 20); } catch {}` : ''}
              try { createPickupBurst('${name}', horse.x, horse.y, powerUp.r); } catch {}
              
              logEvent(${logMessage});
              break;`;
  }

  /**
   * 🎨 Color utilities
   */
  lighten(color, percent) {
    if (!color.startsWith('#')) return color;
    const num = parseInt(color.replace('#',''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
  }

  darken(color, percent) {
    if (!color.startsWith('#')) return color;
    const num = parseInt(color.replace('#',''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 🔍 Validate emoji (check if it's a real emoji, not a flag or option)
   */
  validateEmoji(emoji) {
    // Check if emoji starts with -- (it's a flag that got parsed wrong)
    if (emoji.startsWith('--')) {
      console.log(`\n⚠️  WARNING: Emoji looks like a command flag: "${emoji}"`);
      console.log(`   This usually means Windows didn't parse the emoji correctly.`);
      console.log(`   The emoji will be saved incorrectly. Please manually fix:`);
      console.log(`   - scripts/config.js (emoji: '...')`);
      console.log(`   - index.html (tool button)`);
      console.log(`\n💡 TIP: Always wrap emoji in quotes on Windows:`);
      console.log(`   node integrate-v3.js mypower "🔥" --damage=20`);
      return false;
    }
    return true;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🚀 Modular Power-up Integrator v3.0

Usage: node integrate-v3.js <name> <emoji> [options]

Arguments:
  name      Power-up name (lowercase, no spaces)
  emoji     Power-up emoji icon

Options:
  --color=<hex>           Main color (default: #ffffff)
  --outlineColor=<hex>    Outline color (default: #000000)
  --radius=<number>       Collision radius (default: 15)
  --duration=<number>     Effect duration in ms (default: 3000)
  --damage=<number>       Damage amount (for damage effects)
  --healAmount=<number>   Heal amount (for heal effects)
  --consumable=<bool>     Disappears after use (default: true)
  --glowColor=<hex>       Glow color (default: same as color)

Examples:
  node integrate-v3.js stun 💫 --damage=20 --duration=3000 --color=#9C27B0
  node integrate-v3.js heal 💚 --healAmount=30 --duration=5000 --color=#4CAF50
  node integrate-v3.js shield 🛡️ --duration=8000 --color=#2196F3 --consumable=true
`);
    process.exit(1);
  }

  const name = args[0];
  let emoji = args[1];
  
  // Fix Windows emoji parsing issue
  if (!emoji || emoji.startsWith('--')) {
    console.log(`\n⚠️  WARNING: Emoji missing or parsed as flag: "${emoji || 'undefined'}"`);
    console.log(`   Using fallback emoji based on power-up type...`);
    
    // Provide sensible fallbacks based on name
    const emojiMap = {
      damage: '💥', testdamage: '💥', hurt: '💥', bomb: '💥',
      heal: '💚', health: '💚', medkit: '💚', heart: '❤️',
      speed: '⚡', boost: '⚡', turbo: '🚀', fast: '⚡',
      shield: '🛡️', protect: '🛡️', armor: '🛡️',
      freeze: '❄️', ice: '🧊', cold: '❄️',
      fire: '🔥', burn: '🔥', flame: '🔥',
      poison: '☠️', toxic: '☠️', venom: '☠️',
      magic: '✨', spell: '🔮', star: '⭐'
    };
    
    emoji = emojiMap[name] || emojiMap[name.toLowerCase()] || '⚡';
    console.log(`   Using: ${emoji}`);
  }
  
  // Parse options
  const settings = {
    color: '#ffffff',
    outlineColor: '#000000',
    radius: 15,
    duration: 3000,
    consumable: true
  };
  
  // Parse options - handle case where emoji was parsed as flag
  let optionStartIndex = 2;
  if (args[1] && args[1].startsWith('--')) {
    // Emoji was missing, args shifted
    optionStartIndex = 1;
  }
  
  args.slice(optionStartIndex).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key === 'damage' || key === 'healAmount' || key === 'radius' || key === 'duration') {
        settings[key] = parseInt(value);
      } else if (key === 'consumable') {
        settings[key] = value === 'true';
      } else {
        settings[key] = value;
      }
    }
  });
  
  const integrator = new ModularIntegrator();
  integrator.integrate({ name, emoji, settings });
}

module.exports = ModularIntegrator;
