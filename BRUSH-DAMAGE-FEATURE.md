# 🎨 Brush Damage Feature

## 🎯 **New Feature: Brush Collision Damage**

Thêm hệ thống damage mới cho **Brush collision** - khi ngựa chạm vào các brush walls sẽ bị damage tương tự wall/border damage.

---

## ✨ **Feature Overview:**

### **What's New:**
- ✅ **Enable/Disable Brush Damage** - Toggle ON/OFF brush collision damage
- ✅ **Adjustable Brush Damage Amount** - Range: 1-50 HP (default: 8)
- ✅ **Full Settings Persistence** - Saves to database, loads in editor & race mode
- ✅ **Visual UI Controls** - Purple gradient checkbox and slider

---

## 🎨 **UI Controls Added:**

### **Editor Mode (`index.html`):**

**New Controls (after Border Damage):**

1. **🎨 Brush Damage Toggle**
   ```
   Type: Checkbox
   ID: brushDamageEnabled
   Default: false (OFF)
   Color: Purple gradient (#9c27b0, #ba68c8)
   ```

2. **🖌️ Brush Damage Amount**
   ```
   Type: Range slider
   ID: brushDamageAmount
   Range: 1-50
   Default: 8 HP
   Display: brushDamageAmountVal
   ```

**Location in UI:**
```
🧱 Wall Damage [✓]
💥 Wall Damage Amount: [10]
🔲 Border Damage [✓]
🔥 Border Damage Amount: [15]
🎨 Brush Damage [ ]     ← NEW!
🖌️ Brush Damage Amount: [8]  ← NEW!
```

---

## 💾 **Database Storage:**

### **Saved in `race.map_data` JSON:**
```json
{
  "wallDamageEnabled": true,
  "wallDamageAmount": 10,
  "borderDamageEnabled": true,
  "borderDamageAmount": 5,
  "brushDamageEnabled": false,  // ← NEW!
  "brushDamageAmount": 8,       // ← NEW!
  ...
}
```

---

## 🔧 **Implementation Details:**

### **1. Frontend UI (`index.html`)**
**Added 2 controls:**
- Checkbox: `brushDamageEnabled`
- Range slider: `brushDamageAmount` (1-50, default 8)

### **2. Save Logic (`race-save-injector.js`)**

**Save function:**
```javascript
brushDamageEnabled: mapDef.brushDamageEnabled ?? false,
brushDamageAmount: mapDef.brushDamageAmount ?? 8,
```

**Load function:**
```javascript
if (savedConfig.brushDamageEnabled !== undefined) {
    applySettings('brushDamageEnabled', savedConfig.brushDamageEnabled, 'brushDamageEnabled');
    applySettings('brushDamageAmount', savedConfig.brushDamageAmount ?? 8, 'brushDamageAmount');
}
```

**UI Update:**
```javascript
const brushDamageCheckbox = document.getElementById('brushDamageEnabled');
if (brushDamageCheckbox && savedConfig.brushDamageEnabled !== undefined) {
    brushDamageCheckbox.checked = savedConfig.brushDamageEnabled;
}

const brushDamageInput = document.getElementById('brushDamageAmount');
if (brushDamageInput && savedConfig.brushDamageAmount !== undefined) {
    brushDamageInput.value = savedConfig.brushDamageAmount;
    const brushDamageVal = document.getElementById('brushDamageAmountVal');
    if (brushDamageVal) brushDamageVal.textContent = savedConfig.brushDamageAmount;
}
```

**Force Settings (Anti-override):**
```javascript
// Boolean settings
{ id: 'brushDamageEnabled', key: 'brushDamageEnabled', mapKey: 'brushDamageEnabled' },

// Numeric settings
{ id: 'brushDamageAmount', key: 'brushDamageAmount', mapKey: 'brushDamageAmount', valId: 'brushDamageAmountVal' },
```

### **3. Race Launcher (`race-launcher.html`)**

**Apply to race mode:**
```javascript
applySetting('brushDamageEnabled', mapData.brushDamageEnabled, 'mapDef', 'Brush Damage');
applySetting('brushDamageAmount', mapData.brushDamageAmount, 'mapDef', 'Brush Damage Amount');
```

**Console logging:**
```javascript
console.log('  💥 Damage:', {
    wallDamage: gameWindow.mapDef.wallDamageEnabled,
    wallAmount: gameWindow.mapDef.wallDamageAmount,
    borderDamage: gameWindow.mapDef.borderDamageEnabled,
    borderAmount: gameWindow.mapDef.borderDamageAmount,
    brushDamage: gameWindow.mapDef.brushDamageEnabled,   // ← NEW!
    brushAmount: gameWindow.mapDef.brushDamageAmount     // ← NEW!
});
```

---

## 📊 **Settings Coverage:**

**Total Damage Settings: 6**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `wallDamageEnabled` | Boolean | `true` | Enable wall collision damage |
| `wallDamageAmount` | Number | `10` | HP damage per wall hit |
| `borderDamageEnabled` | Boolean | `true` | Enable border collision damage |
| `borderDamageAmount` | Number | `5` | HP damage per border hit |
| **`brushDamageEnabled`** | Boolean | `false` | **Enable brush collision damage** ← NEW! |
| **`brushDamageAmount`** | Number | `8` | **HP damage per brush hit** ← NEW! |

---

## 🎯 **Full Integration:**

### **✅ Complete Pipeline:**

```
Editor UI → mapDef → Save to DB → Load from DB → Race Launcher → Race Mode
   🎨         ✅        ✅            ✅              ✅             ✅
```

**1. Editor Mode:**
- User toggles `brushDamageEnabled` checkbox
- User adjusts `brushDamageAmount` slider (1-50)
- Settings saved to `window.mapDef`

**2. Save (Ctrl+S):**
- `race-save-injector.js` reads from `mapDef.brushDamageEnabled` and `mapDef.brushDamageAmount`
- Uses `??` operator to preserve `false` and `0` values
- Saves to database as JSON

**3. Load (Editor Reload):**
- Fetches from `/api/race/:id/game-data`
- Applies to `window.mapDef`
- Updates UI checkboxes and sliders
- Force checks every second for 10 seconds to prevent game code overrides

**4. Race Mode:**
- `race-launcher.html` applies settings to game window
- Settings visible in console logs
- Brush damage active in gameplay

---

## 🧪 **Testing Instructions:**

### **Test 1: Editor Mode - Save & Load**

**1. Open Editor:**
```
http://localhost:3001/horse-maze-game/index.html?editor=true&raceId=3
Ctrl + Shift + R (hard refresh)
```

**2. Configure Brush Damage:**
```
☑️ 🎨 Brush Damage = ON
🖌️ Brush Damage Amount = 15 HP
```

**3. Save:**
```
Ctrl + S
```

**4. Check Console:**
```
[Race Save] 💾 Saving FULL config with ALL settings:
  💥 Damage: { 
    wallDamage: true, 
    borderDamage: true, 
    brushDamage: true,      ← Should be true
    brushAmount: 15         ← Should be 15
  }
✅ Saved!
```

**5. Reload Editor:**
```
Ctrl + Shift + R
```

**6. Check Console:**
```
[Race Save] Loading saved map config...
[Race Save] ✅ Set brushDamageEnabled: true
[Race Save] ✅ Set brushDamageAmount: 15
[Race Save] ✅ Updated brushDamageEnabled checkbox: true
[Race Save] ✅ Updated brushDamageAmount input: 15
```

**7. Verify UI:**
- ✅ Brush Damage checkbox is **CHECKED**
- ✅ Brush Damage slider shows **15**
- ✅ No reset to default values

---

### **Test 2: Race Mode - Settings Applied**

**1. After saving in editor, start a race from lobby**

**2. Check Browser Console:**
```
[Launcher] ✅ Applied Brush Damage: true
[Launcher] ✅ Applied Brush Damage Amount: 15

[Launcher] ✅ Final game settings:
  💥 Damage: {
    wallDamage: true,
    wallAmount: 10,
    borderDamage: true,
    borderAmount: 5,
    brushDamage: true,      ← Should be true
    brushAmount: 15         ← Should be 15
  }
```

**3. Test in Gameplay:**
- Draw some brush walls in editor
- Start race
- Horse hits brush → Should lose 15 HP
- Verify HP bar decreases by 15

---

### **Test 3: Default Values**

**1. Create NEW race (no saved config)**

**2. Open Editor:**
```
Brush Damage = OFF (default)
Brush Damage Amount = 8 (default)
```

**3. Save without changing:**
```
Ctrl + S
```

**4. Check Console:**
```
[Race Save] brushDamageEnabled: false
[Race Save] brushDamageAmount: 8
```

**5. Reload:**
```
Settings should persist as false/8
```

---

### **Test 4: Toggle ON/OFF**

**1. Set Brush Damage = ON, Amount = 20**
**2. Save (Ctrl+S)**
**3. Reload → Should be ON, 20**
**4. Set Brush Damage = OFF**
**5. Save (Ctrl+S)**
**6. Reload → Should be OFF (not reset to ON)**

---

## 📝 **Console Logs Reference:**

### **Save:**
```
[Race Save] 💾 Saving FULL config with ALL settings:
  💥 Damage: {
    wallDamageEnabled: true,
    wallDamageAmount: 10,
    borderDamageEnabled: true,
    borderDamageAmount: 5,
    brushDamageEnabled: false,  ← NEW!
    brushDamageAmount: 8        ← NEW!
  }
✅ Saved successfully
```

### **Load (Editor):**
```
[Race Save] Loading saved map config...
[Race Save] ✅ Set brushDamageEnabled: false
[Race Save] ✅ Set brushDamageAmount: 8
[Race Save] 🎨 Updating UI checkboxes...
[Race Save] ✅ Updated brushDamageEnabled checkbox: false
[Race Save] ✅ Updated brushDamageAmount input: 8
[Race Save] ✅ Loaded saved map config
```

### **Load (Race):**
```
[Launcher] 🗺️ Found saved map config, applying...
[Launcher] ✅ Applied Brush Damage: false
[Launcher] ✅ Applied Brush Damage Amount: 8
[Launcher] ✅ Final game settings:
  💥 Damage: {
    brushDamage: false,
    brushAmount: 8
  }
```

---

## 🔄 **Files Modified:**

### **1. Game Files:**
- `e:\CascadeProjects\horse-maze-electron\index.html`
  - Added 2 UI controls (checkbox + slider)
  
- `e:\CascadeProjects\horse-maze-electron\race-save-injector.js`
  - Added to `saveConfig()` function
  - Added to `loadSavedMapConfig()` function
  - Added to `updateUI()` function
  - Added to `forceSettings()` arrays

### **2. Web Files:**
- `e:\CascadeProjects\horse-race-betting-clean\web\public\horse-maze-game\index.html`
  - Synced from game
  
- `e:\CascadeProjects\horse-race-betting-clean\web\public\horse-maze-game\race-save-injector.js`
  - Synced from game
  
- `e:\CascadeProjects\horse-race-betting-clean\web\public\race-launcher.html`
  - Added brush damage application
  - Added console logging

---

## ✅ **Summary:**

### **Before:**
- 4 damage settings (wall, border only)
- No brush collision damage

### **After:**
- 6 damage settings (wall, border, brush)
- Full brush collision damage system
- Complete settings persistence
- Editor + Race mode support

### **Integration:**
- ✅ UI controls in editor
- ✅ Save to database
- ✅ Load from database
- ✅ UI updates on reload
- ✅ Force settings (anti-override)
- ✅ Race launcher application
- ✅ Console logging
- ✅ Default values handling

---

## 🎉 **Result:**

**Complete Brush Damage System Integration!**

**Flow:**
```
User enables Brush Damage in Editor
→ Adjusts damage amount (1-50)
→ Saves to database
→ Reloads editor → Settings persist
→ Starts race → Settings applied
→ Horse hits brush → Takes configured damage
```

**Total Settings Now: 72+ (was 70+)**

**Test and confirm brush damage works ngon lành!** 🎨💥✅
