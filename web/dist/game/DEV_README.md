# Horse Maze Game - Developer Documentation 🐎🎮

> **Comprehensive development guide for Horse Maze Electron**  
> Version: 1.1 | Last Updated: 2025-10-10  
> Difficulty: Intermediate to Advanced (Automated tools available)

## 📖 Table of Contents

### 🎯 Getting Started
- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Code Organization Principles](#code-organization-principles)
- [Development Workflow](#development-workflow)

### 🛠️ Core Systems
- [Power-up System Deep Dive](#power-up-system-deep-dive)
- [Creating New Power-ups (Complete Guide)](#creating-new-power-ups-complete-guide)
- [Context Menu System](#context-menu-system)
- [Rendering Pipeline](#rendering-pipeline)
- [Physics & Collision System](#physics--collision-system)
- [Effect Duration Management](#effect-duration-management)

### 🐛 Troubleshooting & Best Practices
- [Common Issues & Solutions](#common-issues--solutions)
- [Anti-patterns to Avoid](#anti-patterns-to-avoid)
- [Performance Optimization](#performance-optimization)
- [Debugging Techniques](#debugging-techniques)

### 📚 Reference
- [Game Logic Flow](#game-logic-flow)
- [API Reference](#api-reference)
- [Testing Checklist](#testing-checklist)
- [Migration Guide](#migration-guide)

---

## 🏗️ Architecture Overview

### Core Technologies
- **Electron**: Desktop app framework
- **Vanilla JavaScript**: No external game frameworks
- **HTML5 Canvas**: Rendering engine
- **localStorage**: Settings persistence

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELECTRON MAIN PROCESS                     │
│                      (Window Management, IPC)                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RENDERER PROCESS (index.html)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐    │
│  │  CONFIG.JS     │  │  RENDER.JS     │  │  RACE.JS      │    │
│  │  (Settings)    │  │  (Visuals)     │  │  (Lifecycle)  │    │
│  └────────┬───────┘  └────────┬───────┘  └───────┬───────┘    │
│           │                   │                   │             │
│           └───────────────────┼───────────────────┘             │
│                               │                                 │
│                               ▼                                 │
│                  ┌──────────────────────────┐                  │
│                  │  EXTRACTED-INLINE.JS     │                  │
│                  │  (Game Logic Core)       │                  │
│                  │  ┌────────────────────┐  │                  │
│                  │  │ Collision Engine   │  │                  │
│                  │  │ Physics System     │  │                  │
│                  │  │ Event Handlers     │  │                  │
│                  │  │ Context Menu       │  │                  │
│                  │  │ Editor Tools       │  │                  │
│                  │  └────────────────────┘  │                  │
│                  └──────────────────────────┘                  │
│                               │                                 │
│                               ▼                                 │
│                  ┌──────────────────────────┐                  │
│                  │   HTML5 CANVAS CONTEXT   │                  │
│                  │   (2D Rendering)         │                  │
│                  └──────────────────────────┘                  │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │   localStorage       │
                    │   (Persistence)      │
                    └──────────────────────┘
```

### Main Components

1. **Editor Mode**: Track/map design with drag-drop tools
   - Visual editor for placing power-ups, walls, spawns
   - Real-time preview
   - Context menu configuration
   - Save/load map functionality

2. **Race Mode**: Game simulation with physics & collisions
   - Frame-based game loop (requestAnimationFrame)
   - Real-time physics calculations
   - Collision detection & response
   - Win condition checking

3. **Power-up System**: Modular collectible effects
   - Type-based architecture
   - Settings-driven behavior
   - Consumable/non-consumable modes
   - Visual & audio feedback

4. **Rendering Engine**: Canvas-based visual system
   - Layered rendering (static → dynamic → UI)
   - Particle effects
   - Glow/blur effects
   - Text rendering

### Data Flow Architecture

```
User Input → Event Handler → State Update → Physics → Collision → Effects → Render
     │                                                                      │
     └──────────────────────────────────────────────────────────────────────┘
                              (Game Loop)
```

### Key Design Patterns

**1. Type-Based Dispatch Pattern**
```javascript
// Power-ups handled via switch statement based on type
switch (type) {
  case 'boost': handleBoost(); break;
  case 'icefreezer': handleIceFreezer(); break;
  // ...
}
```

**2. Settings Inheritance**
```javascript
// Default settings → mapDef settings → individual item settings
const settings = item.settings || mapDef.typeSettings || DEFAULT_SETTINGS;
```

**3. Time-Based Effect Management**
```javascript
// Effects tracked by expiration timestamp
horse.effectUntil = performance.now() + duration;
if (now < horse.effectUntil) { applyEffect(); }
```

**4. Consumable State Machine**
```javascript
// Power-ups transition: active → consumed → hidden
if (!powerUp.consumed) {
  // Available for collision
  if (collides && isConsumable) {
    powerUp.consumed = true; // State transition
  }
}
```

---

## 📁 File Structure (Detailed)

```
horse-maze-electron/
├── index.html                      # Main entry point (1 file)
│   └── Loads all scripts, initializes canvas
│
├── main.js                         # Electron main process
│   └── Window management, app lifecycle
│
├── scripts/
│   ├── config.js                   # Configuration hub (★ HIGH PRIORITY)
│   │   ├── powerUps: {}           # Visual & gameplay settings
│   │   ├── editorTools: {}        # Tool definitions & hotkeys
│   │   ├── physics: {}            # Global physics constants
│   │   └── rendering: {}          # Rendering settings
│   │
│   ├── render.js                   # Rendering engine (3,176 lines)
│   │   ├── drawPowerUps()         # Main power-up render dispatcher
│   │   ├── draw{PowerUpType}()    # Individual draw functions
│   │   ├── drawGlow()             # Glow effect helper
│   │   ├── drawParticles()        # Particle system
│   │   └── drawUI()               # UI elements
│   │
│   ├── extracted-inline.js         # Core game logic (★ 13,120 lines)
│   │   ├── Lines 1-1000:          # Initialization & mapDef
│   │   ├── Lines 1000-3000:       # UI & context menu system
│   │   ├── Lines 3000-6000:       # Editor tools & handlers
│   │   ├── Lines 6000-9000:       # Collision & power-up logic (★)
│   │   ├── Lines 9000-12000:      # Physics & effects
│   │   └── Lines 12000-13120:     # Canvas event handlers
│   │
│   ├── core/
│   │   ├── race.js                # Race lifecycle (303 lines)
│   │   │   ├── startRace()       # Initialize race state
│   │   │   ├── stopRace()        # Cleanup & reset
│   │   │   └── resetPowerUps()   # Clone mapDef → live arrays
│   │   │
│   │   └── powerup-system.js     # Power-up type definitions
│   │       └── POWERUP_TYPES     # Master list of all types
│   │
│   └── editor/
│       └── powerup-settings-init.js  # Editor initialization
│           └── Load settings from localStorage
│
├── assets/                         # Audio & visual assets
│   ├── sounds/                    # SFX files
│   └── images/                    # Icons (if any)
│
├── maps/                          # Saved map files (JSON)
│   └── *.json                     # Map definitions
│
├── DEV_README.md                  # This file
└── README.md                      # User documentation
```

### File Dependency Graph

```
index.html
  ├─ config.js (loads first, no dependencies)
  ├─ render.js (depends on config.js)
  ├─ powerup-system.js (depends on config.js)
  ├─ race.js (depends on config.js, powerup-system.js)
  ├─ powerup-settings-init.js (depends on config.js)
  └─ extracted-inline.js (depends on ALL above)
      └─ Must load LAST (has references to everything)
```

**⚠️ CRITICAL**: Script load order in `index.html` must match dependency graph!

---

## 🧩 Code Organization Principles

### 1. Single Responsibility Principle

Each file has a clear, singular purpose:
- ✅ `config.js`: Configuration only
- ✅ `render.js`: Visual rendering only
- ✅ `race.js`: Race lifecycle only
- ❌ Don't mix concerns (e.g., rendering logic in config.js)

### 2. DRY (Don't Repeat Yourself)

**Bad:**
```javascript
// Power-up A
horse.vx *= 1.5;
horse.vy *= 1.5;
horse.speedUntil = now + 3000;

// Power-up B (duplicate logic)
horse.vx *= 2.0;
horse.vy *= 2.0;
horse.speedUntil = now + 5000;
```

**Good:**
```javascript
function applySpeedBoost(horse, multiplier, duration) {
  horse.vx *= multiplier;
  horse.vy *= multiplier;
  horse.speedUntil = performance.now() + duration;
}

applySpeedBoost(horse, 1.5, 3000); // Power-up A
applySpeedBoost(horse, 2.0, 5000); // Power-up B
```

### 3. Configuration Over Code

**Bad:**
```javascript
case 'turbo':
  horse.vx *= 2.2; // Magic number
  horse.turboUntil = now + 5000; // Magic number
```

**Good:**
```javascript
case 'turbo':
  const cfg = mapDef.turboSettings || { multiplier: 2.2, duration: 5000 };
  horse.vx *= cfg.multiplier;
  horse.turboUntil = now + cfg.duration;
```

### 4. Defensive Programming

```javascript
// Always validate inputs
const duration = typeof cfg.duration === 'number' && isFinite(cfg.duration) 
  ? Math.max(100, Math.min(60000, cfg.duration))  // Clamp to safe range
  : 3000; // Fallback default

// Safe property access
const liveArray = window.liveIceFreezers || liveIceFreezers || [];

// Try-catch for non-critical operations
try { playSfx('freeze'); } catch {}
```

### 5. Naming Conventions

```javascript
// Variables: camelCase
const powerUpSettings = {};
const iceFreezerDuration = 2000;

// Constants: UPPER_SNAKE_CASE
const MAX_HORSES = 8;
const DEFAULT_SPEED = 4.0;

// Functions: verbNoun (action-oriented)
function applyEffect() {}
function checkCollision() {}
function updatePhysics() {}

// Classes: PascalCase (if used)
class PowerUpManager {}

// Private/internal: prefix with underscore
function _internalHelper() {}
```

---

## 🔄 Development Workflow

### 1. Planning Phase
```
1. Define power-up concept (name, icon, effect)
2. Determine effect type (instant, duration, stacking)
3. List required settings (duration, multiplier, etc.)
4. Sketch visual appearance
5. Plan collision behavior
```

### 2. Implementation Phase
```
Follow the 15-location checklist (see Creating New Power-ups)
Implement in this order:
  1. Data structures (powerup-system.js)
  2. Configuration (config.js)
  3. Initialization (race.js)
  4. Rendering (render.js)
  5. Collision logic (extracted-inline.js)
  6. Context menu (extracted-inline.js)
```

### 3. Testing Phase
```
1. Editor mode: Can place/delete?
2. Visual: Renders correctly?
3. Collision: Effect triggers?
4. Duration: Effect expires correctly?
5. Settings: Context menu works?
6. Persistence: Settings save/load?
7. Edge cases: Multiple horses, multiple items?
```

### 4. Debugging Workflow
```
1. Open DevTools (Ctrl+Shift+I)
2. Set breakpoints in extracted-inline.js collision logic
3. Add console.log() in effect handler
4. Check localStorage in Application tab
5. Monitor performance in Performance tab
6. Use debugger; statement for precise breaks
```

---

## 🛠️ Development Tools

### Automated Power-up Development

**🚀 integrate-v3.js** - Automated Power-up Integration
```bash
# Create a new power-up with full integration
node dev-helpers/integrate-v3.js testdamage "💥" --damage=20 --consumable=true

# What it does:
✅ Updates 7 files automatically
✅ Adds collision detection
✅ Creates render function  
✅ Adds editor handlers
✅ Validates integration
✅ Rollback on errors
```

**🧽 marker-remover-v3.js** - Reliable Power-up Removal
```bash
# Remove a power-up completely
node dev-helpers/marker-remover-v3.js testdamage

# What it does:
✅ Removes from all 7 files
✅ Smart syntax validation
✅ Bracket balancing
✅ Automatic rollback
✅ Backup creation
```

### Development Workflow (Automated)

**Modern Approach (Recommended):**
```bash
# 1. Rapid prototyping
node dev-helpers/integrate-v3.js mypower "⚡" --damage=15 --duration=3000

# 2. Test in game (editor + race mode)
# 3. Iterate quickly
node dev-helpers/marker-remover-v3.js mypower
node dev-helpers/integrate-v3.js mypower "⚡" --damage=25 --duration=2000

# 4. Final cleanup
node dev-helpers/marker-remover-v3.js mypower
```

**Traditional Approach (Manual):**
```bash
# Follow 15-location checklist manually
# Risk of missing locations or syntax errors
# Time-consuming and error-prone
```

### Tool Reliability

**integrate-v3.js Features:**
- ✅ **10-point validation** ensures complete integration
- ✅ **Template-based generation** for consistent code
- ✅ **Windows emoji handling** with fallback
- ✅ **Automatic rollback** on validation failure

**marker-remover-v3.js v3.3 Improvements:**
- ✅ **Fixed render.js patterns** - No more parentheses mismatch
- ✅ **Smart syntax validation** - No false positives  
- ✅ **Precise brace balancing** - Handles complex nested structures
- ✅ **Realistic validation** - Allows natural JavaScript patterns

### Debug Tools

```bash
# Debug integration issues
node dev-helpers/debug-remover.js <powerup-name>

# Test syntax validation
node dev-helpers/test-extracted-inline-syntax.js

# Analyze removal patterns
node dev-helpers/debug-game-logic.js <powerup-name>
```

### Best Practices with Tools

**DO:**
- ✅ Use automated tools for rapid iteration
- ✅ Test thoroughly after integration
- ✅ Keep backups (tools create them automatically)
- ✅ Use descriptive power-up names

**DON'T:**
- ❌ Mix manual and automated changes
- ❌ Skip testing after integration
- ❌ Ignore validation warnings
- ❌ Use special characters in names

---

## 💎 Power-up System Deep Dive

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    POWER-UP LIFECYCLE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DEFINITION (powerup-system.js)                          │
│     └─ Add to POWERUP_TYPES object                          │
│                                                              │
│  2. CONFIGURATION (config.js)                               │
│     ├─ Visual properties (color, emoji, radius)             │
│     ├─ Effect properties (duration, multiplier)             │
│     └─ Editor properties (hotkey, label)                    │
│                                                              │
│  3. INITIALIZATION (race.js)                                │
│     ├─ Clone from mapDef → live array                       │
│     └─ Reset consumed flags                                 │
│                                                              │
│  4. RENDERING (render.js)                                   │
│     ├─ Draw static elements (body, outline)                 │
│     ├─ Draw dynamic elements (glow, particles)              │
│     └─ Skip if consumed                                     │
│                                                              │
│  5. COLLISION DETECTION (extracted-inline.js)               │
│     ├─ Calculate distance to horse                          │
│     ├─ Check if within collision radius                     │
│     └─ Trigger if colliding && !consumed                    │
│                                                              │
│  6. EFFECT APPLICATION (extracted-inline.js)                │
│     ├─ Modify horse properties                              │
│     ├─ Set expiration timestamp                             │
│     ├─ Play visual/audio feedback                           │
│     └─ Mark as consumed (if consumable)                     │
│                                                              │
│  7. EFFECT DURATION (extracted-inline.js game loop)         │
│     ├─ Check if effect active (now < expirationTime)        │
│     ├─ Apply modifiers continuously                         │
│     └─ Clean up when expired                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Power-up Type Categories

**Category 1: Instant Effects**
- Execute once, no duration tracking
- Examples: Teleport, Time Freeze
```javascript
case 'teleport':
  horse.x = newX;
  horse.y = newY;
  // Done - no duration needed
  break;
```

**Category 2: Duration Effects**
- Continuous effect over time
- Examples: Turbo, Poison, Ice Freezer
```javascript
case 'turbo':
  horse.turboUntil = now + duration;
  // In game loop:
  if (now < horse.turboUntil) {
    horse.vx *= multiplier;
    horse.vy *= multiplier;
  }
  break;
```

**Category 3: Stacking Effects**
- Multiple collections increase effect
- Examples: Boost (speed stacks)
```javascript
case 'boost':
  horse.boostStacks = (horse.boostStacks || 0) + 1;
  horse.boostStacks = Math.min(horse.boostStacks, maxStacks);
  // Speed = baseSpeed * (1 + 0.2 * stacks)
  break;
```

**Category 4: Toggle Effects**
- On/off state
- Examples: Shield, Ghost mode
```javascript
case 'shield':
  horse.shieldUntil = now + duration;
  horse.hasShield = true;
  // In damage logic:
  if (horse.hasShield) {
    preventDamage();
  }
  break;
```

### Effect Property Naming Convention

```javascript
// Duration effects use {effectName}Until
horse.turboUntil = timestamp;
horse.poisonUntil = timestamp;
horse.frozenUntil = timestamp;

// Multipliers use {effectName}Multiplier or {effectName}Modifier
horse.speedMultiplier = 1.5;
horse.iceSlowMultiplier = 0.7;

// Boolean flags use has{EffectName} or is{State}
horse.hasShield = true;
horse.isGhost = true;

// Counters use {effectName}Stacks or {effectName}Count
horse.boostStacks = 3;
horse.magnetCount = 1;
```

---

## 📁 File Structure

```
horse-maze-electron/
├── index.html                  # Main entry point
├── scripts/
│   ├── config.js              # Global configuration & power-up definitions
│   ├── render.js              # Canvas rendering for all visual elements
│   ├── extracted-inline.js    # Core game logic (collision, physics, UI)
│   ├── core/
│   │   ├── race.js           # Race initialization & state management
│   │   └── powerup-system.js # Power-up type definitions
│   └── editor/
│       └── powerup-settings-init.js # Editor settings initialization
└── DEV_README.md              # This file
```

### Key Files Explained

**`config.js`**: Central configuration for all power-ups
- Visual properties (color, emoji, radius)
- Effect parameters (duration, multipliers)
- Editor hotkeys

**`extracted-inline.js`**: Main game logic (13,000+ lines)
- Power-up collision detection
- Effect application
- Context menu system
- Editor tools

**`render.js`**: Visual rendering
- Draw functions for each power-up type
- Animation logic
- Glow effects, particles

**`race.js`**: Race lifecycle
- Initialize `livePowerUps` arrays
- Reset game state
- Clone power-ups from mapDef

---

## 🎯 Creating New Power-ups (Complete Guide)

### Step 1: Define in `powerup-system.js`

```javascript
// Add to POWERUP_TYPES array
icefreezers: []
```

### Step 2: Configure in `config.js`

```javascript
icefreezer: {
  radius: 15,
  color: '#b3e5fc',
  outlineColor: '#01579b',
  emoji: '🧊',
  duration: 2000,
  freezeDurationMs: 2000,
  slowdownFactor: 0.7,
  glowColor: '#b3e5fc',
  glowAlpha: 0.9
}
```

**Add editor hotkey:**
```javascript
editorTools: {
  // ... other tools
  icefreezer: { label: '🧊 Ice Freezer', hotkey: '' }
}
```

### Step 3: Add to `race.js` initialization

```javascript
window.liveIceFreezers = JSON.parse(JSON.stringify(window.mapDef.icefreezers || []));
```

**Also add to reset arrays:**
```javascript
const allPowerUpArrays = [
  { live: window.liveBoosts, mapDef: window.mapDef.boosts },
  // ...
  { live: window.liveIceFreezers, mapDef: window.mapDef.icefreezers },
];
```

### Step 4: Add rendering in `render.js`

```javascript
drawIceFreezers(ctx, mode, liveIceFreezers, mapDef, drawGlow, glowAlpha) {
  try {
    ctx.save();
    const iceFreezersToDraw = (mode === 'play' || mode === 'race')
      ? (window.liveIceFreezers || liveIceFreezers || [])
      : (mapDef?.icefreezers || []);
    
    for (const ice of iceFreezersToDraw) {
      if (ice.consumed && (mode === 'play' || mode === 'race')) continue;
      
      // Drawing logic here
      // - Gradients
      // - Shapes
      // - Glows
      // - Emoji/icon
    }
  } finally {
    ctx.restore();
  }
}
```

**Call it in main render function:**
```javascript
drawPowerUps(ctx, mode) {
  // ...
  this.drawIceFreezers(ctx, mode, window.liveIceFreezers, window.mapDef, this.drawGlow, this.glowAlpha);
}
```

### Step 5: Add collision detection in `extracted-inline.js`

**A. Add to powerUpTypes array (~line 6032):**
```javascript
const powerUpTypes = [
  { array: window.liveBoosts || liveBoosts, type: 'boost' },
  // ...
  { array: window.liveIceFreezers || liveIceFreezers, type: 'icefreezer' },
];
```

**B. Add case handler (~line 6313+):**
```javascript
case 'icefreezer':
  const iceNow = performance.now();
  const iceFreezeSettings = mapDef.icefreezerSettings || { 
    durationMs: 2000, 
    freezeDurationMs: 2000, 
    slowMultiplier: 0.7 
  };
  
  // Apply effects to horse
  horse.frozenUntil = Math.max(horse.frozenUntil || 0, iceNow + iceFreezeSettings.freezeDurationMs);
  horse.vx = 0;
  horse.vy = 0;
  
  // Visual/audio feedback
  try { playSfx('freeze'); } catch {}
  floatingTexts.push({ 
    x: horse.x, 
    y: horse.y - horse.r - 6, 
    t: iceNow, 
    life: 1600, 
    text: `🧊 FROZEN ${Math.round(iceFreezeSettings.freezeDurationMs/1000)}s!`, 
    color: '#01579b' 
  });
  
  logEvent(`🧊 Ngựa ${horse.name || ('#'+(horse.i+1))} bị đóng băng!`);
  break;
```

**C. Add to consumable settings check (~line 6502):**
```javascript
} else if (type === 'icefreezer') {
  powerUpSettings = mapDef.icefreezerSettings || {};
```

### Step 6: Add default settings in `extracted-inline.js` mapDef

```javascript
icefreezerSettings: {
  durationMs: 2000,
  freezeDurationMs: 2000,
  slowMultiplier: 0.7,
  consumable: true
}
```

---

## ⚙️ Context Menu System

### How it works:
1. User right-clicks power-up tool → triggers `contextmenu` event
2. `openCtx(type, x, y)` is called
3. `buildBody(type)` generates HTML for settings
4. User adjusts settings → saved to `localStorage`
5. Settings applied to `mapDef.{type}Settings`

### Adding Context Menu for New Power-up

**Step 1: Add to context menu mappings (~line 3750, 3761, 3779)**

```javascript
// Right-click support
const supported = [
  'magnet', 'turbo', 'timefreeze', 
  'icefreezer', // <-- Add here
  // ...
];

// Canvas right-click mapping
const contextMapping = {
  magnet: 'magnet',
  icefreezer: 'icefreezer', // <-- Add here
  // ...
};
```

**Step 2: Create settings panel in `buildBody()` (~line 1908+)**

```javascript
} else if (type === 'icefreezer'){
  const cfg = mapDef.icefreezerSettings || { 
    durationMs: 2000, 
    freezeDurationMs: 2000, 
    slowMultiplier: 0.7, 
    consumable: true 
  };
  
  ctxBody.innerHTML = `
    <div style="font-weight:600; margin:4px 0 8px 0;">🧊 Ice Freezer (Self-Freeze)</div>
    
    <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
      <label style="min-width:100px;">Freeze Duration</label>
      <input id="ctxIceFreezeDuration" type="range" min="500" max="5000" step="100" value="${cfg.freezeDurationMs||2000}" />
      <span id="ctxIceFreezeDurationVal">${cfg.freezeDurationMs||2000} ms</span>
    </div>
    
    <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
      <label style="min-width:100px;">Slow Multiplier</label>
      <input id="ctxIceSlowMult" type="range" min="0.1" max="1.0" step="0.05" value="${cfg.slowMultiplier||0.7}" />
      <span id="ctxIceSlowMultVal">${((cfg.slowMultiplier||0.7)*100).toFixed(0)}%</span>
    </div>
    
    <div class="row compact" style="gap:8px; align-items:center;">
      <label style="min-width:100px;">Consumable</label>
      <input id="ctxIceFreezerConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
    </div>
  `;
  
  // Real-time slider updates
  setTimeout(() => {
    const durationSlider = ctxBody.querySelector('#ctxIceFreezeDuration');
    const durationLabel = ctxBody.querySelector('#ctxIceFreezeDurationVal');
    
    if (durationSlider && durationLabel) {
      durationSlider.addEventListener('input', () => {
        durationLabel.textContent = parseInt(durationSlider.value, 10) + ' ms';
      });
    }
  }, 10);
}
```

**Step 3: Add Apply button handler (~line 3108+)**

```javascript
} else if (currentType === 'icefreezer'){
  mapDef.icefreezerSettings = mapDef.icefreezerSettings || { 
    durationMs: 2000, 
    freezeDurationMs: 2000, 
    slowMultiplier: 0.7, 
    consumable: true 
  };
  
  const d = ctxBody.querySelector('#ctxIceFreezeDuration');
  const sm = ctxBody.querySelector('#ctxIceSlowMult');
  const c = ctxBody.querySelector('#ctxIceFreezerConsumable');
  
  if (d){ 
    mapDef.icefreezerSettings.freezeDurationMs = parseInt(d.value,10)||2000; 
    mapDef.icefreezerSettings.durationMs = mapDef.icefreezerSettings.freezeDurationMs;
    localStorage.setItem('iceFreezerDuration', String(mapDef.icefreezerSettings.freezeDurationMs)); 
  }
  if (sm){ 
    mapDef.icefreezerSettings.slowMultiplier = parseFloat(sm.value)||0.7; 
    localStorage.setItem('iceFreezerSlowMultiplier', String(mapDef.icefreezerSettings.slowMultiplier)); 
  }
  if (c){ 
    mapDef.icefreezerSettings.consumable = !!c.checked; 
    localStorage.setItem('iceFreezerConsumable', JSON.stringify(mapDef.icefreezerSettings.consumable)); 
  }
}
```

**Step 4: Load from localStorage (~line 1153+ and powerup-settings-init.js)**

```javascript
// In extracted-inline.js initialization
const iceFreezerConsumable = localStorage.getItem('iceFreezerConsumable');
if (iceFreezerConsumable !== null) {
  mapDef.icefreezerSettings = mapDef.icefreezerSettings || {};
  mapDef.icefreezerSettings.consumable = JSON.parse(iceFreezerConsumable);
}

try {
  const iceDur = parseInt(localStorage.getItem('iceFreezerDuration') || '');
  const iceSlow = parseFloat(localStorage.getItem('iceFreezerSlowMultiplier') || '');
  if (!Number.isNaN(iceDur)) {
    mapDef.icefreezerSettings.freezeDurationMs = Math.max(500, Math.min(5000, iceDur));
    mapDef.icefreezerSettings.durationMs = mapDef.icefreezerSettings.freezeDurationMs;
  }
  if (!Number.isNaN(iceSlow)) mapDef.icefreezerSettings.slowMultiplier = Math.max(0.1, Math.min(1.0, iceSlow));
} catch {}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Power-up not appearing in editor
**Symptoms**: Can't place power-up, tool button doesn't work

**Solutions**:
- ✅ Check `config.js` has entry in `powerUps` object
- ✅ Check `editorTools` has tool definition
- ✅ Verify `powerup-system.js` has array defined
- ✅ Check render.js has draw function
- ✅ Verify draw function is called in `drawPowerUps()`

### Issue 2: Power-up not colliding with horses
**Symptoms**: Horse runs through power-up, no effect

**Solutions**:
- ✅ Add to `powerUpTypes` array in extracted-inline.js (~line 6032)
- ✅ Add case handler in switch statement (~line 6313+)
- ✅ Initialize `window.live{PowerUpType}` in race.js
- ✅ Check `consumed` flag isn't prematurely set

### Issue 3: Consumable setting not working
**Symptoms**: Power-up always disappears or never disappears

**Solutions**:
- ✅ Add to consumable settings check (~line 6502):
  ```javascript
  } else if (type === 'yourpowerup') {
    powerUpSettings = mapDef.yourpowerupSettings || {};
  ```
- ✅ Ensure mapDef has default settings with `consumable: true/false`
- ✅ Check localStorage is saving/loading correctly

### Issue 4: Context menu doesn't open
**Symptoms**: Right-click does nothing

**Solutions**:
- ✅ Add to `supported` arrays (lines 3750, 3761)
- ✅ Add to `contextMapping` object (line 3779)
- ✅ Implement `buildBody()` case for your type
- ✅ Implement Apply button handler

### Issue 5: Settings don't persist
**Symptoms**: Settings reset after reload

**Solutions**:
- ✅ Add localStorage.setItem() in Apply handler
- ✅ Add localStorage.getItem() in initialization
- ✅ Check key names match exactly
- ✅ Add to powerup-settings-init.js

### Issue 6: Visual effects not showing
**Symptoms**: Power-up invisible or looks broken

**Solutions**:
- ✅ Check draw function has `ctx.save()` and `ctx.restore()`
- ✅ Verify conditional check for consumed items
- ✅ Check array reference: `window.live{Type} || {type} || []`
- ✅ Ensure gradient/color values are valid

---

## 🎮 Game Logic Flow

### Race Start
```
1. User clicks Start Race
2. race.js: initializeRace()
   - Clone mapDef.{powerups} → window.live{Powerups}
   - Reset consumed flags
   - Initialize horse positions
3. Game loop starts (requestAnimationFrame)
```

### Game Loop (extracted-inline.js)
```
Every frame:
1. Update horse physics (velocity, acceleration)
2. Apply effects (frozen, turbo, poison, etc.)
3. Check collisions:
   - Horses vs Walls
   - Horses vs Power-ups
   - Horses vs Other Horses
4. Update particles & visual effects
5. Render frame (render.js)
6. Check win conditions
```

### Power-up Collision Flow
```
1. Loop through powerUpTypes array
2. For each power-up:
   - Check if consumed (skip if true)
   - Calculate distance to horse
   - If distance < (horse.r + powerUp.r):
     a. Execute effect (switch case)
     b. Check isConsumable setting
     c. If consumable: powerUp.consumed = true
     d. Play sound/visual effects
```

### Effect Duration System
```
Horse properties:
- frozenUntil: timestamp
- magnetUntil: timestamp
- poisonUntil: timestamp
- etc.

Each frame:
- Check if performance.now() > {effect}Until
- If expired: delete property
- If active: apply modifier
```

---

## ✅ Testing Checklist

### For New Power-ups

**Editor Mode:**
- [ ] Tool appears in sidebar
- [ ] Hotkey works (if assigned)
- [ ] Can place on canvas
- [ ] Can delete with Delete key
- [ ] Visual rendering correct
- [ ] Can save/load map with power-up
- [ ] Context menu opens (right-click)
- [ ] Settings sliders work
- [ ] Apply button saves changes

**Race Mode:**
- [ ] Power-up appears on track
- [ ] Horse collides and effect triggers
- [ ] Visual effects display (particles, glow)
- [ ] Sound effects play
- [ ] Floating text appears
- [ ] Event log message shows
- [ ] Effect duration correct
- [ ] Effect expires properly
- [ ] Consumable setting works (both on/off)

**Settings Persistence:**
- [ ] Settings save to localStorage
- [ ] Settings load on app restart
- [ ] Default values correct
- [ ] Min/max validation works

---

## 🚀 Advanced Topics

### Custom Effect Types

**Instant Effects** (Teleport, Time Freeze):
- Execute once on collision
- No duration tracking needed

**Duration Effects** (Turbo, Poison, Freeze):
- Set `horse.{effect}Until = now + duration`
- Check in game loop: `if (now < horse.{effect}Until)`
- Apply modifier continuously

**Stacking Effects** (Boost):
- Use counter: `horse.boostStacks`
- Increase on each collision
- Apply multiplier: `speedMod * (1 + 0.2 * stacks)`

### Performance Optimization

**Avoid in game loop:**
- ❌ Object creation (`new Object()`)
- ❌ Large array operations
- ❌ Heavy calculations

**Prefer:**
- ✅ Object pooling
- ✅ Pre-calculated values
- ✅ Early returns
- ✅ Cached lookups

### Debug Tools

**Console logging:**
```javascript
try { console.debug('[PowerUp] collected', type, settings); } catch {}
```

**Visual debug:**
- Draw collision circles with `ctx.strokeRect()`
- Show effect timers as text
- Highlight active effects with color

---

## 📚 Resources

### Key Functions Reference

**Collision Detection:**
- `Math.hypot(dx, dy)` - Calculate distance
- `horse.r + powerUp.r` - Combined radius

**Visual Effects:**
- `createExplosion(x, y, color, size)` - Particle burst
- `createPickupBurst(type, x, y, r)` - Type-specific particles
- `floatingTexts.push({...})` - Floating text
- `drawGlow(ctx, x, y, r, color, alpha)` - Glow effect

**Audio:**
- `playSfx(soundName)` - Play sound effect

**Logging:**
- `logEvent(message)` - Add to event log

### Common Patterns

**Safe property access:**
```javascript
const settings = mapDef?.icefreezerSettings || { /* defaults */ };
```

**Type checking:**
```javascript
if (typeof value === 'number' && isFinite(value)) {
  // Use value
}
```

**Try-catch for non-critical code:**
```javascript
try { playSfx('sound'); } catch {}
```

---

## 🎨 Rendering Pipeline

### Render Order (Critical!)

```
1. Static Background Layer
   └─ Track boundaries, static walls

2. Dynamic Environment Layer
   ├─ Mud patches
   ├─ Gravity wells
   └─ Environmental hazards

3. Power-up Layer (consumed items hidden)
   ├─ Boosts, Turbos, Teleports
   ├─ Ice Freezers, Time Freezes
   └─ All collectibles

4. Horse Layer
   ├─ Horse bodies
   ├─ Horse effects (glow, particles)
   └─ Ram/Shield indicators

5. Particle Effects Layer
   ├─ Explosions
   ├─ Pickup bursts
   └─ Trail effects

6. UI Layer (always on top)
   ├─ Floating texts
   ├─ Timers
   └─ Event log
```

### Rendering Best Practices

**Always use ctx.save() and ctx.restore():**
```javascript
drawIceFreezers(ctx, mode, liveIceFreezers, mapDef, drawGlow, glowAlpha) {
  try {
    ctx.save(); // ← Save current state
    
    // Your drawing code here
    ctx.fillStyle = '#b3e5fc';
    ctx.globalAlpha = 0.8;
    // ...
    
  } finally {
    ctx.restore(); // ← Always restore (even if error occurs)
  }
}
```

**Performance optimization:**
```javascript
// ❌ BAD - Creates new gradient every frame
for (const item of items) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  // ...
}

// ✅ GOOD - Cache gradients when possible
const gradientCache = new Map();
for (const item of items) {
  const key = `${x},${y},${r}`;
  if (!gradientCache.has(key)) {
    gradientCache.set(key, ctx.createRadialGradient(x, y, 0, x, y, r));
  }
  const gradient = gradientCache.get(key);
  // ...
}
```

**Animation timing:**
```javascript
// Use performance.now() for consistent animations
const currentTime = performance.now();
const pulse = 0.85 + 0.15 * Math.sin(currentTime * 0.003);
const rotation = currentTime * 0.0005;
```

### Visual Effect Patterns

**Glow Effects:**
```javascript
// Multi-layer glow for depth
drawGlow(ctx, x, y, r * 2.8, '#b3e5fc', 0.15); // Outer
drawGlow(ctx, x, y, r * 1.8, '#81d4fa', 0.3);  // Middle
drawGlow(ctx, x, y, r * 1.2, '#e1f5fe', 0.5);  // Inner
```

**Pulsing Animation:**
```javascript
// Slow pulse for breathing effect
const pulse = 0.85 + 0.15 * Math.sin(time * 0.003);

// Fast pulse for urgency
const fastPulse = 0.7 + 0.3 * Math.sin(time * 0.006);
```

**Rotation:**
```javascript
// Slow rotation
const rotation = time * 0.0005;

// Reverse rotation for rings
const ringRotation = rotation * (index % 2 === 0 ? 1 : -1);
```

---

## ⚙️ Physics & Collision System

### Collision Detection Algorithm

```javascript
// 1. Calculate distance between centers
const dx = horse.x - powerUp.x;
const dy = horse.y - powerUp.y;
const distance = Math.hypot(dx, dy);

// 2. Calculate combined radius
const collisionRadius = horse.r + powerUp.r;

// 3. Check collision
if (distance < collisionRadius) {
  // Collision detected!
  applyPowerUpEffect(horse, powerUp);
}
```

### Optimization: Spatial Partitioning

**For large maps with many power-ups:**
```javascript
// Divide map into grid cells
const CELL_SIZE = 100;
const grid = new Map();

// Hash function for cell position
function getCellKey(x, y) {
  const cellX = Math.floor(x / CELL_SIZE);
  const cellY = Math.floor(y / CELL_SIZE);
  return `${cellX},${cellY}`;
}

// Only check power-ups in same cell + adjacent cells
function getNearbyPowerUps(horse) {
  const cellKey = getCellKey(horse.x, horse.y);
  return grid.get(cellKey) || [];
}
```

### Physics Constants (config.js)

```javascript
physics: {
  maxVelocity: 4.0,          // Maximum horse speed
  acceleration: 0.15,         // How fast horses speed up
  friction: 0.95,             // Velocity decay per frame
  wallBounce: 0.5,            // Velocity retained on wall hit
  horseCollisionForce: 2.0,   // Push force between horses
}
```

### Velocity Modifiers Chain

```javascript
// Final velocity calculation
const finalModifier = 
  baseFactor *              // Base speed setting
  speedMod *                // General speed modifier
  mudSpeedModifier *        // Mud slow (0.3)
  turboMult *               // Turbo boost (2.2)
  trapSlowMult *            // Trap slow (0.5)
  iceSlowMult *             // Ice freeze slow (0.7)
  poisonMult *              // Poison slow
  // ... etc

horse.vx *= finalModifier;
horse.vy *= finalModifier;
```

---

## ⏱️ Effect Duration Management

### Timestamp-Based System

```javascript
// Setting effect
const now = performance.now();
horse.turboUntil = now + 5000; // Expires in 5 seconds

// Checking effect (every frame)
if (now < horse.turboUntil) {
  // Effect is active
  applyTurboMultiplier();
} else {
  // Effect expired - clean up
  delete horse.turboUntil;
  delete horse.turboMultiplier;
}
```

### Multiple Effects Interaction

**Approach 1: Independent Effects**
```javascript
// Each effect tracked separately
if (now < horse.turboUntil) speedMult *= 2.2;
if (now < horse.poisonUntil) speedMult *= 0.5;
if (now < horse.iceFreezUntil) speedMult *= 0.7;
// Final: speedMult = 2.2 * 0.5 * 0.7 = 0.77
```

**Approach 2: Priority System**
```javascript
// Higher priority overrides lower
const effects = [
  { name: 'frozen', mult: 0.0, priority: 100, until: horse.frozenUntil },
  { name: 'turbo', mult: 2.2, priority: 50, until: horse.turboUntil },
  { name: 'poison', mult: 0.5, priority: 30, until: horse.poisonUntil },
];

const activeEffect = effects
  .filter(e => now < e.until)
  .sort((a, b) => b.priority - a.priority)[0];

if (activeEffect) {
  speedMult *= activeEffect.mult;
}
```

### Effect Stacking Patterns

**Additive Stacking:**
```javascript
// Boost: each stack adds 20%
const boostStacks = horse.boostStacks || 0;
const speedBonus = 1 + (0.2 * boostStacks); // 1.0, 1.2, 1.4, 1.6...
horse.vx *= speedBonus;
```

**Multiplicative Stacking (diminishing returns):**
```javascript
// Each stack multiplies by 1.15
const stacks = horse.shieldStacks || 0;
const protection = Math.pow(1.15, stacks); // 1.0, 1.15, 1.32, 1.52...
```

**Capped Stacking:**
```javascript
const MAX_STACKS = 10;
horse.boostStacks = Math.min((horse.boostStacks || 0) + 1, MAX_STACKS);
```

---

## 🚫 Anti-patterns to Avoid

### 1. Forgetting to Check `consumed` Flag

**❌ BAD:**
```javascript
for (const powerUp of liveIceFreezers) {
  const dist = Math.hypot(horse.x - powerUp.x, horse.y - powerUp.y);
  if (dist < horse.r + powerUp.r) {
    applyEffect(horse, powerUp);
    // Will trigger multiple times!
  }
}
```

**✅ GOOD:**
```javascript
for (const powerUp of liveIceFreezers) {
  if (powerUp.consumed) continue; // ← Skip consumed items
  
  const dist = Math.hypot(horse.x - powerUp.x, horse.y - powerUp.y);
  if (dist < horse.r + powerUp.r) {
    applyEffect(horse, powerUp);
    if (isConsumable) powerUp.consumed = true;
  }
}
```

### 2. Not Handling Race vs Editor Mode

**❌ BAD:**
```javascript
// Will cause errors in editor mode
for (const ice of window.liveIceFreezers) {
  // window.liveIceFreezers doesn't exist in editor!
}
```

**✅ GOOD:**
```javascript
const iceFreezersToDraw = (mode === 'play' || mode === 'race')
  ? (window.liveIceFreezers || liveIceFreezers || [])
  : (mapDef?.icefreezers || []);

for (const ice of iceFreezersToDraw) {
  // Works in both modes
}
```

### 3. Forgetting ctx.save()/restore()

**❌ BAD:**
```javascript
function drawItem(ctx) {
  ctx.fillStyle = 'red';
  ctx.globalAlpha = 0.5;
  ctx.fill();
  // State persists to next draw call!
}
```

**✅ GOOD:**
```javascript
function drawItem(ctx) {
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.restore(); // State cleaned up
}
```

### 4. Magic Numbers

**❌ BAD:**
```javascript
horse.vx *= 2.2;
horse.turboUntil = now + 5000;
```

**✅ GOOD:**
```javascript
const cfg = mapDef.turboSettings || { multiplier: 2.2, duration: 5000 };
horse.vx *= cfg.multiplier;
horse.turboUntil = now + cfg.duration;
```

### 5. Synchronous Blocking Operations in Game Loop

**❌ BAD:**
```javascript
function gameLoop() {
  // Blocks entire game!
  const data = loadLargeFileSync();
  processData(data);
  
  render();
  requestAnimationFrame(gameLoop);
}
```

**✅ GOOD:**
```javascript
async function loadData() {
  const data = await loadLargeFileAsync();
  processData(data);
}

function gameLoop() {
  // Non-blocking
  render();
  requestAnimationFrame(gameLoop);
}
```

### 6. Not Validating User Input

**❌ BAD:**
```javascript
const duration = parseInt(input.value);
horse.effectUntil = now + duration; // Could be NaN or Infinity!
```

**✅ GOOD:**
```javascript
const duration = parseInt(input.value, 10);
const validDuration = (typeof duration === 'number' && isFinite(duration))
  ? Math.max(100, Math.min(60000, duration)) // Clamp to safe range
  : 3000; // Fallback
horse.effectUntil = now + validDuration;
```

---

## 🐛 Debugging Techniques

### 1. Console Logging Strategy

**Structured logging:**
```javascript
// Use prefixes for easy filtering
console.log('[PowerUp] Ice Freezer collected by', horse.name);
console.log('[Collision] Distance:', dist, 'Threshold:', collisionRadius);
console.log('[Effect] Applied turbo until', horse.turboUntil);

// Filter in DevTools console:
// [PowerUp]  - shows only power-up logs
```

**Conditional debug mode:**
```javascript
const DEBUG_MODE = true;

function debug(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

debug('Current velocity:', horse.vx, horse.vy);
```

### 2. Visual Debugging

**Draw collision circles:**
```javascript
if (DEBUG_MODE) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, powerUp.r, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = 'blue';
  ctx.beginPath();
  ctx.arc(horse.x, horse.y, horse.r, 0, Math.PI * 2);
  ctx.stroke();
}
```

**Show effect timers:**
```javascript
if (DEBUG_MODE && horse.turboUntil) {
  const remaining = Math.max(0, horse.turboUntil - performance.now());
  ctx.fillStyle = 'white';
  ctx.fillText(`Turbo: ${(remaining/1000).toFixed(1)}s`, horse.x, horse.y - 30);
}
```

### 3. Breakpoint Strategy

**In Chrome DevTools:**
```javascript
// 1. Set conditional breakpoint
// Right-click line number → "Add conditional breakpoint"
// Condition: horse.name === 'Horse 1'

// 2. Use debugger statement
if (horse.boostStacks > 5) {
  debugger; // Pauses execution here
}

// 3. DOM breakpoints for context menu
// Right-click element → Break on → Subtree modifications
```

### 4. Performance Profiling

**Chrome DevTools Performance Tab:**
```
1. Open DevTools → Performance tab
2. Click Record
3. Start race, collect power-ups
4. Click Stop after 5-10 seconds
5. Look for:
   - Long frames (red bars above 16.67ms)
   - Function call times
   - Memory allocation spikes
```

**Manual timing:**
```javascript
console.time('collision-check');
for (const powerUp of powerUps) {
  checkCollision(horse, powerUp);
}
console.timeEnd('collision-check'); // Logs elapsed time
```

### 5. localStorage Inspection

**Chrome DevTools Application Tab:**
```
1. Open DevTools → Application tab
2. Left sidebar → Storage → Local Storage
3. Look for keys: iceFreezerDuration, iceFreezerSlowMultiplier, etc.
4. Can manually edit values for testing
5. Clear All to reset to defaults
```

### 6. Network Tab (for asset loading)

```
1. Open DevTools → Network tab
2. Reload page
3. Check:
   - Are all scripts loading? (200 OK)
   - Load order correct?
   - Any 404 errors for sounds/images?
```

---

## 📘 API Reference

### Core Functions

#### `applyPowerUpEffect(horse, powerUp, type)`
Applies a power-up effect to a horse.

**Parameters:**
- `horse` (Object): The horse object
- `powerUp` (Object): The power-up item
- `type` (String): Power-up type ('boost', 'icefreezer', etc.)

**Returns:** void

**Example:**
```javascript
applyPowerUpEffect(horse, iceFreezer, 'icefreezer');
```

---

#### `createExplosion(x, y, color, size)`
Creates a particle explosion effect.

**Parameters:**
- `x` (Number): X coordinate
- `y` (Number): Y coordinate
- `color` (String): CSS color string
- `size` (Number): Explosion radius

**Returns:** void

**Example:**
```javascript
createExplosion(horse.x, horse.y, '#b3e5fc', 28);
```

---

#### `playSfx(soundName)`
Plays a sound effect.

**Parameters:**
- `soundName` (String): Sound identifier ('freeze', 'powerup', 'teleport', etc.)

**Returns:** void

**Example:**
```javascript
try { playSfx('freeze'); } catch {}
```

---

#### `logEvent(message)`
Adds a message to the event log.

**Parameters:**
- `message` (String): The log message

**Returns:** void

**Example:**
```javascript
logEvent(`🧊 Ngựa ${horse.name} bị đóng băng!`);
```

---

#### `drawGlow(ctx, x, y, radius, color, alpha)`
Draws a radial glow effect.

**Parameters:**
- `ctx` (CanvasRenderingContext2D): Canvas context
- `x` (Number): Center X
- `y` (Number): Center Y
- `radius` (Number): Glow radius
- `color` (String): Glow color
- `alpha` (Number): Transparency (0-1)

**Returns:** void

**Example:**
```javascript
drawGlow(ctx, ice.x, ice.y, ice.r * 2, '#b3e5fc', 0.5);
```

---

### Horse Object Properties

```javascript
{
  // Identity
  name: String,           // Horse name
  i: Number,              // Horse index
  
  // Position & Physics
  x: Number,              // X coordinate
  y: Number,              // Y coordinate
  vx: Number,             // X velocity
  vy: Number,             // Y velocity
  r: Number,              // Radius (collision size)
  
  // State
  eliminated: Boolean,    // Is horse eliminated?
  finished: Boolean,      // Has horse finished race?
  finishTime: Number,     // Finish timestamp
  
  // Effects (duration-based)
  turboUntil: Number,     // Turbo expiration time
  poisonUntil: Number,    // Poison expiration time
  frozenUntil: Number,    // Frozen expiration time
  magnetUntil: Number,    // Magnet expiration time
  shieldUntil: Number,    // Shield expiration time
  // ... etc
  
  // Effects (toggles)
  hasShield: Boolean,     // Shield active?
  hasRam: Boolean,        // Ram power active?
  isGhost: Boolean,       // Ghost mode active?
  
  // Effects (stacking)
  boostStacks: Number,    // Number of boost stacks
  magnetStacks: Number,   // Number of magnet stacks
  
  // Modifiers
  speedMod: Number,       // Speed multiplier
  mudSpeedModifier: Number,
  iceSlowMultiplier: Number,
  trapSlowMultiplier: Number,
  // ... etc
}
```

---

### Power-up Object Structure

```javascript
{
  // Required
  x: Number,              // X position
  y: Number,              // Y position
  r: Number,              // Radius
  type: String,           // Type identifier
  
  // State
  consumed: Boolean,      // Has been collected?
  
  // Optional (per-item overrides)
  consumable: Boolean,    // Override consumable setting
  duration: Number,       // Override duration
  multiplier: Number,     // Override multiplier
  // ... other custom properties
}
```

---

### MapDef Structure

```javascript
window.mapDef = {
  // Map properties
  w: Number,              // Width
  h: Number,              // Height
  maxVel: Number,         // Max velocity
  minCruise: Number,      // Min cruise speed
  
  // Power-up arrays
  boosts: Array,
  turbos: Array,
  icefreezers: Array,
  // ... one array per power-up type
  
  // Power-up settings
  boostSettings: {
    stackBonus: 0.2,
    maxStacks: 10,
    consumable: true
  },
  icefreezerSettings: {
    durationMs: 2000,
    freezeDurationMs: 2000,
    slowMultiplier: 0.7,
    consumable: true
  },
  // ... one settings object per power-up type
  
  // Walls, obstacles, etc.
  walls: Array,
  muds: Array,
  // ... etc
}
```

---

## 🔄 Migration Guide

### Upgrading from Old Power-up System

**Old way (hardcoded):**
```javascript
case 'turbo':
  horse.vx *= 2.2;
  horse.vy *= 2.2;
  horse.turboUntil = now + 5000;
```

**New way (settings-driven):**
```javascript
case 'turbo':
  const cfg = mapDef.turboSettings || { multiplier: 2.2, duration: 5000 };
  horse.vx *= cfg.multiplier;
  horse.vy *= cfg.multiplier;
  horse.turboUntil = now + cfg.duration;
```

### Converting to Consumable System

**Step 1: Add default settings**
```javascript
// In extracted-inline.js mapDef initialization (~line 970)
icefreezerSettings: {
  durationMs: 2000,
  consumable: true
}
```

**Step 2: Add to consumable check**
```javascript
// In collision handler (~line 6502)
} else if (type === 'icefreezer') {
  powerUpSettings = mapDef.icefreezerSettings || {};
}
```

**Step 3: Test both modes**
- With consumable: true → should disappear
- With consumable: false → should remain

---

## 🎯 Quick Reference: Complete Power-up Checklist

- [ ] **powerup-system.js**: Add array
- [ ] **config.js**: Add config object + editor tool
- [ ] **race.js**: Initialize live array + reset logic
- [ ] **render.js**: Add draw function + call it
- [ ] **extracted-inline.js**: 
  - [ ] Add to powerUpTypes array
  - [ ] Add case handler
  - [ ] Add to consumable check
  - [ ] Add default settings to mapDef
  - [ ] Add context menu (supported arrays + contextMapping)
  - [ ] Add buildBody() case
  - [ ] Add Apply handler
  - [ ] Add localStorage loading
- [ ] **powerup-settings-init.js**: Add initialization

**Total: ~15 code locations to update** ✨

---

Created: 2025-10-08  
Game Version: Horse Maze Electron  
Author: Development Team

🐎 Happy Coding! 🎮
