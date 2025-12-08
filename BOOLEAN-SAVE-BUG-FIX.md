# 🐛 Fix: Boolean Settings không được Save đúng

## 🔥 Critical Bug

**Triệu chứng:**
- Tắt "Sát thương tường" (Wall Damage) → Save → Vào lại → **Bật lại**
- Tắt "Sát thương biên" (Border Damage) → Save → Vào lại → **Bật lại**
- Bất kỳ settings nào = `false` đều không được save

## 🐛 Nguyên nhân

**JavaScript `||` operator bug:**

```javascript
// ❌ SAI - Bug ở đây!
wallDamageEnabled: mapDef.wallDamageEnabled || true
borderDamageEnabled: mapDef.borderDamageEnabled || true

// Khi wallDamageEnabled = false:
// false || true = true  ← Luôn luôn là true!
```

**Giải thích:**
- Operator `||` treats `false` as "falsy"
- Khi left operand là falsy → return right operand
- `false || true` → returns `true`
- → Settings luôn save `true`, không bao giờ save `false`!

## ✅ Giải pháp

**Dùng Nullish Coalescing `??` operator:**

```javascript
// ✅ ĐÚNG - Chỉ check null/undefined
wallDamageEnabled: mapDef.wallDamageEnabled ?? true
borderDamageEnabled: mapDef.borderDamageEnabled ?? true

// Khi wallDamageEnabled = false:
// false ?? true = false  ← Giữ nguyên false!

// Khi wallDamageEnabled = undefined:
// undefined ?? true = true  ← Dùng default
```

**Khác biệt:**
- `||` checks for "falsy" values: `false`, `0`, `''`, `null`, `undefined`, `NaN`
- `??` checks ONLY for `null` or `undefined`

## 📝 File đã fix

`race-save-injector.js` - Lines 837-842:
```javascript
// Game settings - use ?? to avoid false being treated as falsy
lastHorseWins: mapDef.lastHorseWins ?? false,
hpSystemEnabled: mapDef.hpSystemEnabled ?? true,
wallDamageEnabled: mapDef.wallDamageEnabled ?? true,
wallDamageAmount: mapDef.wallDamageAmount ?? 10,
borderDamageEnabled: mapDef.borderDamageEnabled ?? true,
borderDamageAmount: mapDef.borderDamageAmount ?? 5
```

## 🔍 Debug Logs Added

Console sẽ hiển thị settings khi save:
```
[Race Save] 💾 Saving config with settings: {
  lastHorseWins: false,
  hpSystemEnabled: true,
  wallDamageEnabled: false,  ← Giờ save false đúng!
  wallDamageAmount: 10,
  borderDamageEnabled: false,  ← Giờ save false đúng!
  borderDamageAmount: 5
}
```

## 🎯 Test Case

**1. Vào Editor:**
```
http://localhost:3001/horse-maze-game/index.html?editor=true&raceId=3
Ctrl + Shift + R
```

**2. Change settings:**
- ☑️ Bật hệ thống HP = **ON**
- ☐ Sát thương tường = **OFF**
- ☐ Sát thương biên = **OFF**

**3. Save (Ctrl+S)**

**4. Check console log:**
```
[Race Save] 💾 Saving config with settings: {
  hpSystemEnabled: true,
  wallDamageEnabled: false,   ← Must be false!
  borderDamageEnabled: false  ← Must be false!
}
[Race Config] ✅ Saved map preview image
```

**5. Reload page (Ctrl+Shift+R)**

**6. Check console log:**
```
[Race Save] ✅ Set wallDamageEnabled: false amount: 10
[Race Save] ✅ Set borderDamageEnabled: false amount: 5
[Race Save] 🎨 Updating UI checkboxes...
[Race Save] ✅ Updated wallDamageEnabled checkbox: false
[Race Save] ✅ Updated borderDamageEnabled checkbox: false
```

**7. Verify UI:**
- ✅ Sát thương tường = **UNCHECKED** (not reset to checked!)
- ✅ Sát thương biên = **UNCHECKED** (not reset to checked!)

## 💡 Lesson Learned

**Khi làm việc với boolean settings:**
- ❌ Không dùng `||` cho default values
- ✅ Dùng `??` (nullish coalescing)
- ✅ Hoặc check explicitly: `value !== undefined ? value : defaultValue`

**Các trường hợp dễ bug:**
```javascript
const showHidden = config.showHidden || true;  // ❌ false → true
const count = config.count || 10;              // ❌ 0 → 10
const name = config.name || 'Default';         // ❌ '' → 'Default'

// Đúng:
const showHidden = config.showHidden ?? true;  // ✅ false → false
const count = config.count ?? 10;              // ✅ 0 → 0  
const name = config.name ?? 'Default';         // ✅ '' → ''
```
