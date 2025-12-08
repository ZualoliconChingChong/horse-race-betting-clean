# 🎨 Context Settings Auto-Generator v1.0

Tự động thêm context menu settings cho power-ups, giống như Yellow Heart hiện tại.

## 🎯 Features

- ✅ **Auto-generate UI** với sliders, checkboxes, select dropdowns
- ✅ **Real-time updates** - sliders update ngay khi kéo
- ✅ **LocalStorage persistence** - settings được lưu tự động
- ✅ **Flexible configuration** - customize min/max/step cho từng field
- ✅ **Production ready** - code clean, pattern giống Yellow Heart

## 🚀 Usage

### Basic Example
```bash
node add-context-settings.js stun 💫 --effectType --damage --duration --radius --stackable --maxStacks --consumable
```

### Custom Ranges
```bash
node add-context-settings.js freeze 🧊 --damage=10,50,5,15 --duration=2000,8000,500,3000 --radius --consumable
```

## 📋 Available Options

### `--effectType`
Thêm dropdown selector cho effect types:
- Speed Boost
- Damage Boost  
- Healing

### `--damage[=min,max,step,default]`
Thêm slider cho Power/Damage:
- **Default**: `5,100,5,25` (min=5, max=100, step=5, default=25)
- **Example**: `--damage=10,50,5,20`

### `--duration[=min,max,step,default]`
Thêm slider cho Duration (ms):
- **Default**: `1000,10000,500,4000` (1s-10s, step 0.5s, default 4s)
- **Example**: `--duration=2000,8000,500,3000`

### `--radius[=min,max,step,default]`
Thêm slider cho Size (radius):
- **Default**: `8,32,2,18` (8-32px, step 2, default 18px)
- **Example**: `--radius=10,40,2,20`

### `--maxStacks[=min,max,default]`
Thêm slider cho Max Stacks:
- **Default**: `1,10,4` (1-10 stacks, default 4)
- **Example**: `--maxStacks=1,5,3`

### `--stackable`
Thêm checkbox cho Stackable setting

### `--consumable`
Thêm checkbox cho Consumable setting với tooltip:
- ✅ Disappears after use
- ❌ Permanent obstacle

## 🎯 Complete Examples

### 1. Full-Featured Power-up (like Yellow Heart)
```bash
node add-context-settings.js stun 💫 \
  --effectType \
  --damage \
  --duration \
  --radius \
  --stackable \
  --maxStacks \
  --consumable
```

**Generates:**
- Effect Type dropdown (speed/damage/heal)
- Power slider (5-100, default 25)
- Duration slider (1-10s, default 4s)
- Size slider (8-32px, default 18px)
- Max Stacks slider (1-10, default 4)
- Stackable checkbox
- Consumable checkbox

### 2. Simple Speed Boost
```bash
node add-context-settings.js speedboost ⚡ \
  --damage=10,100,10,50 \
  --duration=1000,5000,500,2000 \
  --consumable
```

**Generates:**
- Power slider (10-100, step 10, default 50)
- Duration slider (1-5s, step 0.5s, default 2s)
- Consumable checkbox

### 3. Healing Item
```bash
node add-context-settings.js healingitem 💊 \
  --damage=5,50,5,15 \
  --radius=12,24,2,16 \
  --stackable \
  --maxStacks=1,8,5 \
  --consumable
```

**Generates:**
- Healing Power slider (5-50, default 15)
- Radius slider (12-24px, default 16px)
- Stackable checkbox
- Max Stacks slider (1-8, default 5)
- Consumable checkbox

## 📊 Generated Code Structure

### 1. Context UI (in `showContextFor` function)
```javascript
} else if (type === 'stun'){
  const cfg = mapDef.stunSettings || { damage: 25, duration: 4000, ... };
  ctxBody.innerHTML = `
    <div>💫 Stun (Global)</div>
    
    <!-- Effect Type Selector -->
    <select id="ctxStunEffectType">...</select>
    
    <!-- Sliders -->
    <input id="ctxStunDamage" type="range" ... />
    <input id="ctxStunDuration" type="range" ... />
    
    <!-- Checkboxes -->
    <input id="ctxStunStackable" type="checkbox" ... />
  `;
  
  // Real-time slider updates
  setTimeout(() => {
    const damageSlider = ctxBody.querySelector('#ctxStunDamage');
    damageSlider.addEventListener('input', () => { ... });
  }, 10);
```

### 2. Apply Handler (in `handleContextApply` function)
```javascript
} else if (currentType === 'stun'){
  mapDef.stunSettings = mapDef.stunSettings || { ... };
  
  const et = ctxBody.querySelector('#ctxStunEffectType');
  const d = ctxBody.querySelector('#ctxStunDamage');
  
  if (et){ 
    mapDef.stunSettings.effectType = et.value;
    localStorage.setItem('stunEffectType', mapDef.stunSettings.effectType);
  }
  
  if (d){ 
    mapDef.stunSettings.damage = parseInt(d.value,10);
    localStorage.setItem('stunDamage', String(mapDef.stunSettings.damage));
  }
  
  // ... more fields
```

## 🎯 Integration Workflow

### Step 1: Integrate Power-up
```bash
node integrate-v2.js custom stun 💫 "#8B008B" --damage=25 --duration=3000
```

### Step 2: Add Context Settings
```bash
node add-context-settings.js stun 💫 --effectType --damage --duration --radius --stackable --maxStacks --consumable
```

### Step 3: Test in Editor
1. Refresh browser
2. Right-click power-up tool 💫
3. Context menu appears with all settings
4. Adjust sliders → see real-time updates
5. Click Apply → settings saved to localStorage

## 🎨 UI Preview

```
┌────────────────────────────────┐
│ 💫 Stun (Global)               │
├────────────────────────────────┤
│ Effect Type: [Speed Boost ▼]  │
│                                │
│ Power:       ───●──── 25      │
│ Duration:    ───●──── 4000 ms │
│ Size:        ───●──── 18px    │
│ Max Stacks:  ───●──── 4       │
│                                │
│ ☑ Stackable                    │
│ ☑ Consumable                   │
│   ✅ Disappears after use      │
│   ❌ Permanent obstacle         │
│                                │
│            [Apply]             │
└────────────────────────────────┘
```

## 🛡️ Safety Features

- ✅ **Auto-backup** before modifications
- ✅ **Pattern matching** - inserts after yellowheart
- ✅ **Default values** - sensible defaults for all fields
- ✅ **LocalStorage** - persistent across sessions
- ✅ **Real-time validation** - sliders constrained to min/max

## 📝 Notes

### Best Practices
1. **Always use integrate-v2.js first** để tạo basic structure
2. **Then use add-context-settings.js** để add context menu
3. **Test in browser** trước khi commit
4. **Backup files** được tạo tự động với timestamp

### Limitations
- Script insert sau yellowheart context (phải có yellowheart trong code)
- Chỉ support các field types: effectType, damage, duration, radius, maxStacks, stackable, consumable
- Nếu cần custom fields khác, cần modify script

### Future Enhancements
- [ ] Support custom field types (color picker, text input, etc.)
- [ ] Auto-detect existing settings và skip
- [ ] Generate context settings as part of integrate-v2.js
- [ ] Visual preview của settings changes

## 🎯 Pro Tips

### Tip 1: Reuse Existing Ranges
```bash
# Copy Yellow Heart's exact ranges
node add-context-settings.js mystun 💫 \
  --damage=5,100,5,25 \
  --duration=1000,10000,500,4000 \
  --radius=8,32,2,18 \
  --maxStacks=1,10,4
```

### Tip 2: Balance Ranges
```bash
# Weak power-up (low damage, short duration)
node add-context-settings.js weakboost 🔹 \
  --damage=5,30,5,10 \
  --duration=1000,3000,500,1500
  
# Strong power-up (high damage, long duration)
node add-context-settings.js megaboost 💥 \
  --damage=30,150,10,50 \
  --duration=3000,15000,1000,8000
```

### Tip 3: Specialized Power-ups
```bash
# Speed-only (no damage)
node add-context-settings.js turbo 🏃 \
  --duration=2000,8000,500,3000 \
  --radius \
  --consumable

# Healing-only (no damage/speed)
node add-context-settings.js medkit 🏥 \
  --damage=10,100,10,25 \
  --radius=16,40,4,24 \
  --consumable
```

## 🚀 Result

**Before**: Power-up có settings cố định, không thể customize
**After**: Power-up có rich context menu, fully customizable, production-ready

**Development time**: 30 giây thay vì 20 phút manual coding! 🎯✨
