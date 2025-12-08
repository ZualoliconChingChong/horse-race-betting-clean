# 🔍 Debug Guide: Settings Not Saving

## 🚨 Problem Analysis

Settings như "Sát thương tường" và "Sát thương biên" bị **reset về ON** khi vào lại editor.

### 💡 Possible Causes:

1. ❌ **JavaScript `||` operator bug** - `false || true = true` (FIXED)
2. ⚠️ **Game code override** - Game's "One-time startup sync" runs AFTER our script
3. ⚠️ **Timing issue** - Checkboxes initialized before we can update them

## ✅ Fixes Applied

### Fix #1: Boolean Save Bug (DONE)
Changed from `||` to `??` operator in `race-save-injector.js`:
```javascript
// ✅ FIXED
wallDamageEnabled: mapDef.wallDamageEnabled ?? true
borderDamageEnabled: mapDef.borderDamageEnabled ?? true
```

### Fix #2: Aggressive UI Update (NEW)
Added **force settings checker** that runs every second for 10 seconds:
```javascript
// Watches for game code overriding our values
const forceSettings = () => {
    if (cb.checked !== savedConfig.wallDamageEnabled) {
        console.warn('[Race Save] ⚠️ Forcing saved value!');
        cb.checked = savedConfig.wallDamageEnabled;
    }
};
```

### Fix #3: Extended Delays (NEW)
UI updates now run at: 1s, 2s, 3s, 4s (instead of 0.5s, 1s, 2s)

### Fix #4: Monitoring Loop (NEW)
Settings are force-checked every second for the first 10 seconds after load

## 🎯 Testing Steps

### Step 1: Hard Refresh Editor
```
http://localhost:3001/horse-maze-game/index.html?editor=true&raceId=3
```
**Press: `Ctrl + Shift + R`** (hard refresh to clear cache)

### Step 2: Open Console (F12)
Keep console open để xem logs

### Step 3: Wait for Load & Check Console
Sau khi trang load xong, bạn sẽ thấy:
```
[Race Save] Loading saved map config...
[Race Save] ✅ Set wallDamageEnabled: false amount: 10
[Race Save] ✅ Set borderDamageEnabled: false amount: 5
[Race Save] 🎨 Updating UI checkboxes...
[Race Save] ✅ Updated wallDamageEnabled checkbox: false
[Race Save] ✅ Updated borderDamageEnabled checkbox: false
```

### Step 4: Watch for Warnings (IMPORTANT!)
Nếu game code tries to override, bạn sẽ thấy:
```
[Race Save] ⚠️ wallDamageEnabled was changed by game code! Forcing saved value: false
[Race Save] ⚠️ borderDamageEnabled was changed by game code! Forcing saved value: false
```

**→ Nếu thấy warnings này, nghĩa là có conflict với game code!**

### Step 5: Verify UI
Check các checkboxes:
- ☐ **Sát thương tường** = should be UNCHECKED (if you saved it as OFF)
- ☐ **Sát thương biên** = should be UNCHECKED (if you saved it as OFF)

### Step 6: Change Settings
Toggle settings như bạn muốn:
- ☐ Sát thương tường = **OFF**
- ☐ Sát thương biên = **OFF**

### Step 7: Save (Ctrl+S)
Check console log khi save:
```
[Race Save] 💾 Saving config with settings: {
  wallDamageEnabled: false,   ← MUST be false!
  borderDamageEnabled: false  ← MUST be false!
}
[Race Config] ✅ Saved map preview image
✅ Saved!
```

**❗ CRITICAL CHECK:**
- Settings phải hiển thị `false` trong console
- Nếu hiển thị `true` → bug vẫn còn trong save logic

### Step 8: Hard Refresh Again
```
Ctrl + Shift + R
```

### Step 9: Wait & Monitor Console
Watch console logs for 10 seconds:
- First few seconds: UI updates
- Throughout 10s: Force checks running
- Look for any warnings about overrides

### Step 10: Final Verification
After 10 seconds:
- ☐ Sát thương tường = still UNCHECKED?
- ☐ Sát thương biên = still UNCHECKED?

## 📊 Expected Console Output (Full Flow)

```
[Race Save] Loading race data...
[Race Save] Race data loaded
[Race Save] Loading saved map config...
[Race Save] ✅ Set wallDamageEnabled: false amount: 10
[Race Save] ✅ Set borderDamageEnabled: false amount: 5
[Race Save] 🎨 Updating UI checkboxes...          ← 1s delay
[Race Save] ✅ Updated wallDamageEnabled checkbox: false
[Race Save] ✅ Updated borderDamageEnabled checkbox: false
[Race Save] 🎨 Updating UI checkboxes...          ← 2s delay
[Race Save] ✅ Updated wallDamageEnabled checkbox: false
[Race Save] ✅ Updated borderDamageEnabled checkbox: false
[Race Save] 🎨 Updating UI checkboxes...          ← 3s delay
...
(every second for 10 seconds, checking and forcing if needed)
```

## 🐛 If Still Not Working

### Debug Checklist:

1. **Check if settings are saved correctly:**
   ```
   [Race Save] 💾 Saving config with settings: {
     wallDamageEnabled: false  ← MUST be false, not true!
   }
   ```

2. **Check if settings are loaded correctly:**
   ```
   [Race Save] ✅ Set wallDamageEnabled: false
   ```

3. **Check for override warnings:**
   ```
   [Race Save] ⚠️ ... was changed by game code!
   ```

4. **Check database:**
   Open SQLite browser and check `races` table:
   - Column: `map_data`
   - Should contain: `"wallDamageEnabled":false`
   
5. **Check network:**
   - Open Network tab (F12 → Network)
   - Reload page
   - Find request to `/api/race/3/game-data`
   - Check response → `race.map_data` → should have `wallDamageEnabled: false`

## 📝 Send Me This Info If Still Failing:

1. **Full console log** from page load
2. **Screenshot** of checkboxes after load
3. **Network response** of `/api/race/3/game-data`
4. **Any warnings** about game code overrides

## 🔧 Alternative Solution (If Nothing Works)

If game code continues to override, we may need to:
1. Patch the game code's "One-time startup sync" function
2. OR disable that sync entirely for editor mode with raceId
3. OR modify the game's mapDef initialization to read from a saved config first
