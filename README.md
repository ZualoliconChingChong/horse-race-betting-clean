# 🐴 Horse Race Betting Game

## 📁 Project Structure

```
horse-race-betting-clean/
├── game/                          # Game source (MAIN)
│   ├── index.html                 # Game UI + skill dropdown
│   ├── scripts/
│   │   ├── extracted-inline.js    # Core game logic, skills activation/effects/rendering
│   │   ├── game-logic.js          # Game state management
│   │   ├── i18n.js                # Translations (Vietnamese)
│   │   ├── smart-i18n.js          # Dynamic translations
│   │   ├── config.js              # Game config
│   │   ├── core/
│   │   │   └── race.js            # Race initialization, skill states
│   │   └── editor/
│   │       └── horse-customization-ui.js  # Editor skill initialization
│   └── styles/
│       └── main.css               # Game styles
│
├── web/                           # Web app (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MyHorse.jsx        # User's horse management (loads skills from API)
│   │   │   └── Race.jsx           # Race page (skillDescriptions object)
│   │   └── ...
│   ├── public/game/               # Auto-synced from game/ (git handles this)
│   └── dist/game/                 # Build output (needs manual sync)
│
├── shared/
│   └── skills.json                # ⚠️ BACKEND API source for skill list
│
└── server/                        # Backend server
```

---

## 🎮 Skill System Architecture

### Skill Data Flow
```
1. User selects skill in web app (/my-horse)
   ↓
2. Backend returns skills from: shared/skills.json
   ↓
3. Game loads skill from: 
   - game/scripts/editor/horse-customization-ui.js (editor mode)
   - game/scripts/core/race.js (race mode)
   ↓
4. Skill activation/effects in: game/scripts/extracted-inline.js
   ↓
5. Visual rendering in: game/scripts/extracted-inline.js (render section)
```

---

## ➕ Adding a New Skill

### Step 1: Add to `shared/skills.json`
```json
{
  "key": "skill_key",
  "name": "Tên Tiếng Việt",
  "nameEn": "English Name",
  "desc": "Mô tả tiếng Việt. CD: XXs",
  "descEn": "English description. CD: XXs"
}
```

### Step 2: Add to `game/index.html` dropdown
```html
<option value="skill_key">🎯 Skill Name</option>
```

### Step 3: Add to `game/scripts/extracted-inline.js`

#### a) Skill descriptions (~line 5445)
```javascript
const skillDescriptions = {
  // ...
  skill_key: { vi: "Mô tả VN", en: "EN description" },
};
```

#### b) Skill names for event logs (~line 8672)
```javascript
const _skillNames = {
  // ...
  skill_key: "🎯 Skill Name",
};
```

#### c) Activation case (~line 8900+)
```javascript
case 'skill_key':
  h.skillState.endTime = now + (h.skillState.duration || 5000);
  // Initialize skill state
  floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: now, life: 1200, text: '🎯 SKILL!', color: '#FF0000' });
  try { playSfx('powerup'); } catch {}
  break;
```

#### d) Active logic case (~line 9500+)
```javascript
case 'skill_key':
  // Per-frame effects during skill active
  if (now >= h.skillState.endTime) {
    h.skillState.status = 'cooldown';
    h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 30000);
  }
  break;
```

#### e) Per-frame effects (if needed) (~line 9900+)
```javascript
// --- SKILL_KEY PER-FRAME EFFECT ---
if (h.skillState && h.skillState.name === 'skill_key') {
  // Apply effects every frame
}
```

#### f) Visual rendering (~line 14000+)
```javascript
// Skill Visual
if (h.skillState && h.skillState.name === 'skill_key' && h.skillState.status === 'active') {
  ctx.save();
  // Draw visual effects
  ctx.restore();
}
```

### Step 4: Add to skill initialization files

#### `game/scripts/editor/horse-customization-ui.js`
```javascript
} else if (skill === 'skill_key') {
  h.skillState = { name: 'skill_key', status: 'ready', activationTime: 10000, duration: 5000, cooldown: 30000 };
}
```

#### `game/scripts/core/race.js`
```javascript
} else if (custom.skill === 'skill_key') {
  h.skillState = { name: 'skill_key', status: 'ready', activationTime: 10000, duration: 5000, cooldown: 30000 };
}
```

### Step 5: Add translations

#### `game/scripts/i18n.js`
```javascript
horse_skill_key: 'Tên Skill',
```

#### `game/scripts/smart-i18n.js`
```javascript
'Skill Name': 'Tên Skill',
```

### Step 6: Add to web app

#### `web/src/pages/Race.jsx`
```javascript
const skillDescriptions = {
  // ...
  skill_key: "🎯 Mô tả skill. CD: XXs",
}
```

### Step 7: Sync files
```bash
# Auto-sync to web/public/game (git handles this)
git add -A
git commit -m "Add new skill: skill_key"

# Manual sync to web/dist/game
Copy-Item -Path "game\*" -Destination "web\dist\game\" -Recurse -Force
```

### Step 8: Restart backend
Backend server cần restart để load `shared/skills.json` mới.

---

## 🔄 Sync Workflow

### Folders that need to stay in sync:
| Source | Destination | Sync Method |
|--------|-------------|-------------|
| `game/` | `web/public/game/` | Git (automatic) |
| `game/` | `web/dist/game/` | Manual copy |
| `game/scripts/i18n.js` | All copies | Edit all |
| `game/scripts/smart-i18n.js` | All copies | Edit all |

### Quick sync command:
```powershell
Copy-Item -Path "game\*" -Destination "web\dist\game\" -Recurse -Force
Copy-Item -Path "game\*" -Destination "web\public\game\" -Recurse -Force
```

---

## 🛠️ Common Issues & Solutions

### 1. Skill not appearing in web dropdown
**Cause:** Missing from `shared/skills.json`
**Fix:** Add skill to `shared/skills.json` and restart backend

### 2. Skill activates but no effect on other horses
**Cause:** Per-frame logic inside `switch` statement only runs once
**Fix:** Move logic to "PER-FRAME SKILL EFFECTS" section (~line 9900)

### 3. Visual effect not showing
**Cause:** Missing rendering code or wrong condition
**Fix:** Add rendering in the render section (~line 14000+), check `h.skillState.status === 'active'`

### 4. Skill not activating
**Cause:** `activationTime` too high
**Fix:** Reduce `activationTime` in `horse-customization-ui.js` and `race.js`

### 5. Translation not working
**Cause:** Missing from `i18n.js` or `smart-i18n.js`
**Fix:** Add to both files in all locations (game/, web/dist/game/, web/public/game/)

### 6. File locked error when copying
**Fix:** Use git commit instead:
```bash
git add -A
git commit -m "message"
```

---

## 📋 Skill Properties Reference

```javascript
h.skillState = {
  name: 'skill_key',           // Skill identifier
  status: 'ready',             // ready | active | cooldown | passive
  activationTime: 10000,       // ms after race starts to activate
  duration: 5000,              // ms skill lasts
  cooldown: 30000,             // ms before can use again
  endTime: null,               // Set when activated: now + duration
  cooldownUntil: null,         // Set when ends: now + cooldown
  
  // Custom properties per skill:
  speedMultiplier: 2.0,
  damageMultiplier: 1.5,
  radius: 150,
  // ...
};
```

---

## 🎨 Visual Effects Functions

```javascript
// Explosion effect
createExplosion(x, y, color, radius);

// Floating text
floatingTexts.push({
  x: h.x,
  y: h.y - h.r - 10,
  t: now,
  life: 1200,
  text: '🎯 TEXT!',
  color: '#FF0000'
});

// Sound effect
try { playSfx('powerup'); } catch {}
// Available: 'powerup', 'explosion', 'hit', 'portal', 'ultimate'
```

---

## 📊 Current Skills (29 total)

| Key | Icon | Name |
|-----|------|------|
| hunter | 🎯 | Hunter's Gambit |
| guardian | 🛡️ | Divine Guardian |
| phantom_strike | 👻 | Phantom Strike |
| cosmic_swap | 🔀 | Cosmic Swap |
| chain_lightning | ⚡ | Chain Lightning |
| gravity_well | 🌀 | Gravity Well |
| chill_guy | 😎 | Chill Guy |
| overdrive | ⚡ | Overdrive |
| slipstream | 💨 | Slipstream |
| shockwave | 💥 | Shockwave |
| oguri_fat | 🍔 | Oguri Fat |
| silence_shizuka | 🤫 | Silence Shizuka |
| fireball | 🔥 | Fireball |
| energy_ball | ⚡ | Energy Ball |
| supersonic_speed | 💨 | Supersonic Speed |
| meteor_strike | ☄️ | Meteor Strike |
| black_hole | 🕳️ | Black Hole |
| ice_age | ❄️ | Ice Age |
| mirror_image | 🪞 | Mirror Image |
| time_warp | ⏰ | Time Warp |
| blink | ✨ | Blink |
| rocket_boost | 🚀 | Rocket Boost |
| gravity_flip | 🔄 | Gravity Flip |
| phoenix_rebirth | 🔥 | Phoenix Rebirth |
| avatar_state | 🌀 | Avatar State |
| rainbow_trail | 🌈 | Rainbow Trail |
| disco_chaos | 🪩 | Disco Chaos |
| aurora_shield | ✨ | Aurora Shield |

---

## 🚀 Quick Commands

```bash
# Start dev server
cd web && npm run dev

# Build web
cd web && npm run build

# Git sync
git add -A && git commit -m "message" && git push origin master

# Full sync to dist
Copy-Item -Path "game\*" -Destination "web\dist\game\" -Recurse -Force
```

---

## ⚠️ Important Notes

1. **Always update ALL copies** of i18n files when adding translations
2. **Backend restart required** after changing `shared/skills.json`
3. **Use global `window.horses`** for skills affecting all horses
4. **Per-frame effects** must be OUTSIDE the switch statement
5. **Test in both editor and race mode** after adding skills

---

*Last updated: December 10, 2025*
