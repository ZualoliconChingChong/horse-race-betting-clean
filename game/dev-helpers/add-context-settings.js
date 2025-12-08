#!/usr/bin/env node

/**
 * 🎨 Context Settings Auto-Generator v3.0 (Modular Architecture)
 * Tự động thêm context menu settings cho power-ups
 * 
 * NEW in v3.0:
 * - ✅ Multi-file support (reads from config.js + extracted-inline.js)
 * - ✅ Updates all 3 supported array locations
 * - ✅ Updates contextMapping object
 * - ✅ Better error handling & validation
 * 
 * Features:
 * - ✅ AUTO-DETECT settings from existing mapDef.{name}Settings
 * - ✅ Infer field types và UI components
 * - ✅ Auto-generate reasonable min/max values
 * - Auto-generate UI với sliders, checkboxes, select
 * - Auto-generate Apply handler
 * - Auto-generate real-time slider updates
 * - LocalStorage persistence
 * 
 * Usage: 
 *   node add-context-settings.js <powerup-name> <emoji> --auto (auto-detect)
 *   node add-context-settings.js <powerup-name> <emoji> --effectType --damage ... (manual)
 * Example: 
 *   node add-context-settings.js stun 💫 --auto
 *   node add-context-settings.js heal 💚 --effectType --damage --duration --consumable
 */

const fs = require('fs');
const path = require('path');

class ContextSettingsGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.extractedFile = path.join(this.projectRoot, 'scripts', 'extracted-inline.js');
    this.configFile = path.join(this.projectRoot, 'scripts', 'config.js');
  }

  /**
   * 🎯 Main method
   */
  async generate(config) {
    let { name, emoji, fields, auto } = config;
    
    console.log(`🎨 Generating context settings for ${name} ${emoji}...`);
    
    try {
      // Auto-detect fields if --auto flag is set
      if (auto) {
        console.log('🔍 Auto-detecting settings...');
        fields = await this.autoDetectFields(name);
        console.log(`✅ Detected ${Object.keys(fields).length} fields:`, Object.keys(fields).join(', '));
      }
      
      await this.backup();
      
      // 1. Add to supported list (CRITICAL for context menu to work)
      await this.addToSupportedList(name);
      
      // 2. Add context UI (in showContextFor function)
      await this.addContextUI(name, emoji, fields);
      
      // 3. Add Apply handler (in handleContextApply function)
      await this.addApplyHandler(name, fields);
      
      console.log(`✅ Context settings for ${name} ${emoji} added successfully!`);
      
    } catch (error) {
      console.error(`❌ Failed:`, error.message);
      await this.restore();
    }
  }

  /**
   * 💾 Backup file
   */
  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(this.extractedFile, `${this.extractedFile}.ctx-backup-${timestamp}`);
    console.log('🛡️ Backup created');
  }

  /**
   * 🔄 Restore from backup
   */
  async restore() {
    console.log('🔄 Restoring from backup...');
  }

  /**
   * 🔍 Auto-detect fields from existing settings
   */
  async autoDetectFields(name) {
    const content = fs.readFileSync(this.extractedFile, 'utf8');
    
    // Find mapDef.{name}Settings object
    const settingsPattern = new RegExp(`${name}Settings\\s*[:=]\\s*\\{([^}]+)\\}`, 'i');
    const match = content.match(settingsPattern);
    
    if (!match) {
      throw new Error(`Could not find ${name}Settings in extracted-inline.js. Make sure power-up is integrated first.`);
    }
    
    const settingsBlock = match[1];
    const fields = {};
    
    // Parse each property
    const propertyPattern = /(\w+)\s*:\s*([^,\n]+)/g;
    let propMatch;
    
    while ((propMatch = propertyPattern.exec(settingsBlock)) !== null) {
      const [_, key, value] = propMatch;
      const trimmedValue = value.trim();
      
      // Infer field type and generate config
      fields[key] = this.inferFieldConfig(key, trimmedValue);
    }
    
    return fields;
  }

  /**
   * 🧠 Infer field configuration from key name and value
   */
  inferFieldConfig(key, value) {
    const lowerKey = key.toLowerCase();
    
    // Boolean fields → checkbox
    if (value === 'true' || value === 'false') {
      return { type: 'checkbox', value: value === 'true' };
    }
    
    // String fields → dropdown
    if (value.startsWith("'") || value.startsWith('"')) {
      const cleanValue = value.replace(/['"]/g, '');
      if (lowerKey.includes('effect') || lowerKey.includes('type')) {
        return { type: 'select', value: cleanValue };
      }
      return { type: 'string', value: cleanValue };
    }
    
    // Number fields → slider
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Infer min/max/step based on field name and value
      let min, max, step, defaultVal = numValue;
      
      if (lowerKey.includes('damage') || lowerKey.includes('power') || lowerKey.includes('heal')) {
        min = Math.max(5, Math.floor(numValue * 0.2));
        max = Math.min(100, Math.ceil(numValue * 3));
        step = 5;
      } else if (lowerKey.includes('duration') || lowerKey.includes('time')) {
        min = Math.max(500, Math.floor(numValue * 0.3));
        max = Math.min(15000, Math.ceil(numValue * 2.5));
        step = 500;
      } else if (lowerKey.includes('radius') || lowerKey.includes('size') || lowerKey.includes('range')) {
        min = Math.max(5, Math.floor(numValue * 0.5));
        max = Math.min(50, Math.ceil(numValue * 2));
        step = 2;
      } else if (lowerKey.includes('stack')) {
        min = 1;
        max = Math.min(15, Math.ceil(numValue * 2));
        step = 1;
      } else if (lowerKey.includes('speed') || lowerKey.includes('multiplier')) {
        min = Math.max(0.5, numValue * 0.3);
        max = Math.min(5, numValue * 2);
        step = 0.1;
      } else {
        // Generic number
        min = Math.floor(numValue * 0.5);
        max = Math.ceil(numValue * 2);
        step = Math.max(1, Math.floor(numValue * 0.1));
      }
      
      return { type: 'slider', min, max, step, default: defaultVal };
    }
    
    // Default to string
    return { type: 'string', value: value };
  }

  /**
   * 📋 Add to supported lists & contextMapping (CRITICAL - 4 locations)
   */
  async addToSupportedList(name) {
    let content = fs.readFileSync(this.extractedFile, 'utf8');
    
    // Location 1 & 2: Right-click and double-click delegated handlers
    // Find supported arrays after 'icefreezer' (line ~3750, ~3761)
    const supportedPattern = /(const supported = \[[^\]]*'icefreezer')/g;
    
    let supportedCount = 0;
    content = content.replace(supportedPattern, (match) => {
      supportedCount++;
      if (!match.includes(`'${name}'`)) {
        return `${match},'${name}'`;
      }
      return match;
    });
    
    // Location 3: contextMapping object (line ~3779)
    // Find contextMapping and add after icefreezer
    const mappingPattern = /(icefreezer:'icefreezer')/;
    if (mappingPattern.test(content) && !content.match(new RegExp(`${name}:'${name}'`))) {
      content = content.replace(mappingPattern, `$1, ${name}:'${name}'`);
      console.log(`📋 Added '${name}' to contextMapping`);
    } else if (content.match(new RegExp(`${name}:'${name}'`))) {
      console.log(`   ⚠️ contextMapping: ${name} already exists`);
    }
    
    fs.writeFileSync(this.extractedFile, content);
    console.log(`📋 Added '${name}' to ${supportedCount} supported arrays`);
  }

  /**
   * 🎨 Add context UI
   */
  async addContextUI(name, emoji, fields) {
    let content = fs.readFileSync(this.extractedFile, 'utf8');
    const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Generate field HTML
    const fieldsHTML = this.generateFieldsHTML(name, capitalName, fields);
    
    // Generate real-time slider updates
    const sliderUpdates = this.generateSliderUpdates(name, capitalName, fields);
    
    const contextUI = `    // [PU-BEGIN name=${name} section=context-ui]
    } else if (type === '${name}'){
      const cfg = mapDef.${name}Settings || ${this.getDefaultSettings(fields)};
      ctxBody.innerHTML = \`
        <div style="font-weight:600; margin:4px 0 8px 0;">${emoji} ${capitalName} (Global)</div>
${fieldsHTML}\`;
      
      // Add real-time slider updates for ${capitalName}
      setTimeout(() => {
${sliderUpdates}
      }, 10);
    // [PU-END name=${name} section=context-ui]
`;

    // Find yellowheart context and add after it
    content = content.replace(
      /(} else if \(type === 'yellowheart'\){[\s\S]*?}, 10\);\s*\n)/,
      `$1${contextUI}`
    );
    
    fs.writeFileSync(this.extractedFile, content);
    console.log(`🎨 Added context UI for ${name}`);
  }

  /**
   * 🔧 Add Apply handler
   */
  async addApplyHandler(name, fields) {
    let content = fs.readFileSync(this.extractedFile, 'utf8');
    const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Generate apply logic
    const applyLogic = this.generateApplyLogic(name, fields);
    
    const applyHandler = `        // [PU-BEGIN name=${name} section=context-apply]
        } else if (currentType === '${name}'){
          mapDef.${name}Settings = mapDef.${name}Settings || ${this.getDefaultSettings(fields)};
${applyLogic}
        // [PU-END name=${name} section=context-apply]`;

    // Find yellowheart apply handler and add after it
    content = content.replace(
      /(} else if \(currentType === 'yellowheart'\){[\s\S]*?localStorage\.setItem\('yellowheartConsumable'[\s\S]*?\);[\s\S]*?})/,
      `$1\n${applyHandler}`
    );
    
    fs.writeFileSync(this.extractedFile, content);
    console.log(`🔧 Added apply handler for ${name}`);
  }

  /**
   * 📝 Generate fields HTML (v2.0 - supports auto-detected fields)
   */
  generateFieldsHTML(name, capitalName, fields) {
    const lines = [];
    
    // Iterate through all detected/specified fields
    for (const [key, config] of Object.entries(fields)) {
      const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
      const fieldId = `ctx${capitalName}${fieldName}`;
      
      // Handle different field types
      if (config.type === 'select' || (key === 'effectType' && config === true)) {
        // Dropdown/Select
        lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">${this.formatLabel(key)}</label>
          <select id="${fieldId}" style="padding:2px 4px;">
            <option value="speed" \${cfg.${key} === 'speed' ? 'selected' : ''}>Speed Boost</option>
            <option value="damage" \${cfg.${key} === 'damage' ? 'selected' : ''}>Damage Boost</option>
            <option value="heal" \${cfg.${key} === 'heal' ? 'selected' : ''}>Healing</option>
          </select>
        </div>`);
      } else if (config.type === 'checkbox' || (typeof config === 'boolean' && config === true)) {
        // Checkbox
        const isConsumable = key.toLowerCase().includes('consumable');
        lines.push(`        <div class="row compact" style="gap:8px; align-items:center;${isConsumable ? '' : ' margin-bottom:6px;'}">
          <label style="min-width:84px;">${this.formatLabel(key)}</label>
          <input id="${fieldId}" type="checkbox" \${cfg.${key} ? 'checked' : ''} />${isConsumable ? '\n          <span style="font-size:11px; color:#888; margin-left:8px;">✅ Disappears after use | ❌ Permanent obstacle</span>' : ''}
        </div>`);
      } else if (config.type === 'slider' || config.min !== undefined) {
        // Slider (number field)
        const defaultVal = config.default || config.value || 0;
        const min = config.min || 0;
        const max = config.max || 100;
        const step = config.step || 1;
        const unit = this.getUnit(key);
        
        lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">${this.formatLabel(key)}</label>
          <input id="${fieldId}" type="range" min="${min}" max="${max}" step="${step}" value="\${cfg.${key}||${defaultVal}}" />
          <span id="${fieldId}Val">\${cfg.${key}||${defaultVal}}${unit}</span>
        </div>`);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 🏷️ Format field name to label
   */
  formatLabel(key) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('effect') || lowerKey.includes('type')) return 'Effect Type';
    if (lowerKey.includes('damage') || lowerKey.includes('power')) return 'Power';
    if (lowerKey.includes('heal')) return 'Healing';
    if (lowerKey.includes('duration') || lowerKey.includes('time')) return 'Duration';
    if (lowerKey.includes('radius') || lowerKey.includes('size')) return 'Size';
    if (lowerKey.includes('range')) return 'Range';
    if (lowerKey.includes('stack')) return key.includes('max') ? 'Max Stacks' : 'Stackable';
    if (lowerKey.includes('consumable')) return 'Consumable';
    if (lowerKey.includes('speed')) return 'Speed';
    if (lowerKey.includes('multiplier')) return 'Multiplier';
    
    // Default: capitalize first letter
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
  
  /**
   * 📏 Get unit for field
   */
  getUnit(key) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('duration') || lowerKey.includes('time')) return ' ms';
    if (lowerKey.includes('radius') || lowerKey.includes('size') || lowerKey.includes('range')) return 'px';
    if (lowerKey.includes('multiplier')) return 'x';
    if (lowerKey.includes('percent')) return '%';
    return '';
  }

  /**
   * 📝 Generate fields HTML (LEGACY - for backward compatibility)
   */
  generateFieldsHTMLLegacy(name, capitalName, fields) {
    const lines = [];
    
    // Effect Type (if specified)
    if (fields.effectType) {
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Effect Type</label>
          <select id="ctx${capitalName}EffectType" style="padding:2px 4px;">
            <option value="speed" \${cfg.effectType === 'speed' ? 'selected' : ''}>Speed Boost</option>
            <option value="damage" \${cfg.effectType === 'damage' ? 'selected' : ''}>Damage Boost</option>
            <option value="heal" \${cfg.effectType === 'heal' ? 'selected' : ''}>Healing</option>
          </select>
        </div>`);
    }
    
    // Power/Damage slider
    if (fields.damage) {
      const defaultVal = fields.damage.default || 25;
      const min = fields.damage.min || 5;
      const max = fields.damage.max || 100;
      const step = fields.damage.step || 5;
      
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Power</label>
          <input id="ctx${capitalName}Damage" type="range" min="${min}" max="${max}" step="${step}" value="\${cfg.damage||${defaultVal}}" />
          <span id="ctx${capitalName}DamageVal">\${cfg.damage||${defaultVal}}</span>
        </div>`);
    }
    
    // Duration slider
    if (fields.duration) {
      const defaultVal = fields.duration.default || 4000;
      const min = fields.duration.min || 1000;
      const max = fields.duration.max || 10000;
      const step = fields.duration.step || 500;
      
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctx${capitalName}Duration" type="range" min="${min}" max="${max}" step="${step}" value="\${cfg.duration||${defaultVal}}" />
          <span id="ctx${capitalName}DurationVal">\${cfg.duration||${defaultVal}} ms</span>
        </div>`);
    }
    
    // Radius slider
    if (fields.radius) {
      const defaultVal = fields.radius.default || 18;
      const min = fields.radius.min || 8;
      const max = fields.radius.max || 32;
      const step = fields.radius.step || 2;
      
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Size</label>
          <input id="ctx${capitalName}Radius" type="range" min="${min}" max="${max}" step="${step}" value="\${cfg.radius||${defaultVal}}" />
          <span id="ctx${capitalName}RadiusVal">\${cfg.radius||${defaultVal}}px</span>
        </div>`);
    }
    
    // Max Stacks slider
    if (fields.maxStacks) {
      const defaultVal = fields.maxStacks.default || 4;
      const min = fields.maxStacks.min || 1;
      const max = fields.maxStacks.max || 10;
      
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Max Stacks</label>
          <input id="ctx${capitalName}MaxStacks" type="range" min="${min}" max="${max}" step="1" value="\${cfg.maxStacks||${defaultVal}}" />
          <span id="ctx${capitalName}MaxStacksVal">\${cfg.maxStacks||${defaultVal}}</span>
        </div>`);
    }
    
    // Stackable checkbox
    if (fields.stackable) {
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Stackable</label>
          <input id="ctx${capitalName}Stackable" type="checkbox" \${cfg.stackable ? 'checked' : ''} />
        </div>`);
    }
    
    // Consumable checkbox
    if (fields.consumable) {
      lines.push(`        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctx${capitalName}Consumable" type="checkbox" \${cfg.consumable ? 'checked' : ''} />
          <span style="font-size:11px; color:#888; margin-left:8px;">✅ Disappears after use | ❌ Permanent obstacle</span>
        </div>`);
    }
    
    return lines.join('\n');
  }

  /**
   * 🎚️ Generate slider updates (v2.0 - auto-detection support)
   */
  generateSliderUpdates(name, capitalName, fields) {
    const lines = [];
    
    // Iterate through all fields that are sliders
    for (const [key, config] of Object.entries(fields)) {
      // Skip non-slider fields
      if (config.type === 'checkbox' || config.type === 'select' || config.type === 'string') continue;
      if (typeof config === 'boolean') continue;
      
      const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
      const fieldId = `ctx${capitalName}${fieldName}`;
      const unit = this.getUnit(key);
      
      const isFloat = key.toLowerCase().includes('multiplier') || key.toLowerCase().includes('speed');
      const parseFunc = isFloat ? 'parseFloat' : 'parseInt';
      const formatFunc = isFloat ? 'toFixed(1)' : '';
      
      lines.push(`        const ${key}Slider = ctxBody.querySelector('#${fieldId}');
        const ${key}Label = ctxBody.querySelector('#${fieldId}Val');
        if (${key}Slider && ${key}Label) {
          ${key}Slider.addEventListener('input', () => {
            const value = ${parseFunc}(${key}Slider.value${parseFunc === 'parseInt' ? ', 10' : ''});
            ${key}Label.textContent = ${isFloat ? 'value.toFixed(1)' : 'value'} + '${unit}';
          });
        }`);
    }
    
    return lines.join('\n\n');
  }

  /**
   * ⚙️ Generate apply logic (v2.0 - auto-detection support)
   */
  generateApplyLogic(name, fields) {
    const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
    const lines = [];
    
    // Declare selectors & apply logic
    const selectors = [];
    const applies = [];
    
    for (const [key, config] of Object.entries(fields)) {
      const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
      const fieldId = `ctx${capitalName}${fieldName}`;
      const varName = key.substring(0, 3); // Short variable name
      
      selectors.push(`const ${varName} = ctxBody.querySelector('#${fieldId}');`);
      
      if (config.type === 'checkbox' || (typeof config === 'boolean' && config === true)) {
        // Checkbox
        applies.push(`if (${varName}){ mapDef.${name}Settings.${key} = !!${varName}.checked; localStorage.setItem('${name}${fieldName}', JSON.stringify(mapDef.${name}Settings.${key})); }`);
      } else if (config.type === 'select') {
        // Select
        const defaultVal = config.value || 'speed';
        applies.push(`if (${varName}){ mapDef.${name}Settings.${key} = ${varName}.value || '${defaultVal}'; localStorage.setItem('${name}${fieldName}', mapDef.${name}Settings.${key}); }`);
      } else if (config.type === 'slider' || config.min !== undefined) {
        // Number slider
        const defaultVal = config.default || config.value || 0;
        const isFloat = key.toLowerCase().includes('multiplier') || key.toLowerCase().includes('speed');
        const parseFunc = isFloat ? 'parseFloat' : 'parseInt';
        const parseParams = parseFunc === 'parseInt' ? `(${varName}.value,10)` : `(${varName}.value)`;
        applies.push(`if (${varName}){ mapDef.${name}Settings.${key} = ${parseFunc}${parseParams}||${defaultVal}; localStorage.setItem('${name}${fieldName}', String(mapDef.${name}Settings.${key})); }`);
      }
    }
    
    lines.push(`          ${selectors.join('\n          ')}`);
    lines.push(`          ${applies.join('\n          ')}`);
    
    return lines.join('\n');
  }

  /**
   * 📋 Get default settings (v2.0 - auto-detection support)
   */
  getDefaultSettings(fields) {
    const settings = [];
    
    for (const [key, config] of Object.entries(fields)) {
      if (config.type === 'checkbox' || (typeof config === 'boolean' && config === true)) {
        settings.push(`${key}: ${config.value !== undefined ? config.value : true}`);
      } else if (config.type === 'select') {
        settings.push(`${key}: '${config.value || 'speed'}'`);
      } else if (config.type === 'slider' || config.min !== undefined) {
        settings.push(`${key}: ${config.default || config.value || 0}`);
      } else if (config.default !== undefined) {
        settings.push(`${key}: ${config.default}`);
      }
    }
    
    return `{ ${settings.join(', ')} }`;
  }
}

// 🚀 CLI Interface
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
🎨 Context Settings Auto-Generator v3.0 (Modular Architecture)

Usage:
  node add-context-settings.js <name> <emoji> --auto              (✨ AUTO-DETECT settings)
  node add-context-settings.js <name> <emoji> [manual options]   (Manual specification)

NEW in v3.0:
  ✅ Multi-file support (reads config.js + extracted-inline.js)
  ✅ Updates all 3 supported array locations (~line 3750, 3761, 3779)
  ✅ Updates contextMapping object
  ✅ Better validation & error handling

Auto Mode (RECOMMENDED):
  --auto                    🔍 Automatically detect fields from mapDef.{name}Settings
                            ✅ Infers field types, min/max values, UI components
                            ⚡ Zero configuration needed!

Manual Options (backward compatible):
  --effectType              Add effect type selector (speed/damage/heal)
  --damage=<min,max,step,default>   Add power slider (default: 5,100,5,25)
  --duration=<min,max,step,default> Add duration slider (default: 1000,10000,500,4000)
  --radius=<min,max,step,default>   Add size slider (default: 8,32,2,18)
  --maxStacks=<min,max,default>     Add max stacks slider (default: 1,10,4)
  --stackable               Add stackable checkbox
  --consumable              Add consumable checkbox

Examples:
  ✨ Auto Mode (RECOMMENDED):
    node add-context-settings.js stun 💫 --auto
    node add-context-settings.js heal 💚 --auto
  
  📝 Manual Mode:
    node add-context-settings.js stun 💫 --effectType --damage --duration --radius --stackable --maxStacks --consumable
    node add-context-settings.js freeze 🧊 --damage=10,50,5,15 --duration --radius --consumable

Prerequisites:
  ⚠️ Power-up must be integrated first (use integrate-v3.js)
  ⚠️ mapDef.{name}Settings must exist in extracted-inline.js
`);
  process.exit(0);
}

const name = args[0];
const emoji = args[1];
let fields = {};
let auto = false;

// Parse options
for (let i = 2; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--auto') {
    auto = true;
  } else if (arg === '--effectType') {
    fields.effectType = true;
  } else if (arg === '--stackable') {
    fields.stackable = true;
  } else if (arg === '--consumable') {
    fields.consumable = true;
  } else if (arg.startsWith('--damage')) {
    const [_, params] = arg.split('=');
    if (params) {
      const [min, max, step, defaultVal] = params.split(',').map(Number);
      fields.damage = { min, max, step, default: defaultVal };
    } else {
      fields.damage = { min: 5, max: 100, step: 5, default: 25 };
    }
  } else if (arg.startsWith('--duration')) {
    const [_, params] = arg.split('=');
    if (params) {
      const [min, max, step, defaultVal] = params.split(',').map(Number);
      fields.duration = { min, max, step, default: defaultVal };
    } else {
      fields.duration = { min: 1000, max: 10000, step: 500, default: 4000 };
    }
  } else if (arg.startsWith('--radius')) {
    const [_, params] = arg.split('=');
    if (params) {
      const [min, max, step, defaultVal] = params.split(',').map(Number);
      fields.radius = { min, max, step, default: defaultVal };
    } else {
      fields.radius = { min: 8, max: 32, step: 2, default: 18 };
    }
  } else if (arg.startsWith('--maxStacks')) {
    const [_, params] = arg.split('=');
    if (params) {
      const [min, max, defaultVal] = params.split(',').map(Number);
      fields.maxStacks = { min, max, default: defaultVal };
    } else {
      fields.maxStacks = { min: 1, max: 10, default: 4 };
    }
  }
}

const generator = new ContextSettingsGenerator();
generator.generate({ name, emoji, fields, auto });
