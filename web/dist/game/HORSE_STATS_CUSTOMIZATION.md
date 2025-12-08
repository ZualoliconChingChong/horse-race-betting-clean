# 🐴 Horse Stats Customization System

## Overview
Individual horse customization system allows you to set unique stats for each horse, overriding global defaults.

## Available Custom Stats

### 🏃 Custom Speed
- **Field**: `customSpeed`
- **Range**: 0.1 - 5.0
- **Default**: Uses global runtime speed (usually ~0.8)
- **Effect**: Overrides the base speed for this specific horse
- **Example**: Horse #1 with speed 2.0 will be faster than others with default 0.8

### ❤️ Custom HP
- **Field**: `customHP`
- **Range**: 1 - 500
- **Default**: 100 (or global `horseMaxHP` setting)
- **Effect**: Sets maximum HP and starting HP for this horse
- **Example**: Horse #2 with HP 200 will have double health compared to default 100

## How to Use

### In Editor UI:
1. Open **Horse Customization** section in editor
2. Select **Horse #** (1-50)
3. Enter custom values:
   - **🏃 Custom Speed**: Leave empty for default, or enter 0.1-5.0
   - **❤️ Custom HP**: Leave empty for default, or enter 1-500
4. Click **✅ Apply** to save

### Leave Empty for Default:
- If you leave the field **empty**, the horse will use global/default values
- This is useful if you only want to customize some horses

## Technical Implementation

### Files Modified:
1. **index.html** (line 634-636)
   - Added UI input fields for custom speed and HP

2. **scripts/editor/horse-customization-ui.js**
   - `loadHorseToUI()`: Load custom stats from mapDef to UI
   - `applyHorseFromUI()`: Save custom stats from UI to mapDef
   - Stores in `mapDef.horseCustoms[i].customSpeed` and `.customHP`

3. **scripts/core/race.js** (line 147-161, 185-192)
   - Apply custom speed when creating horse
   - Apply custom HP after horse initialization

### Data Structure:
```javascript
mapDef.horseCustoms[0] = {
  name: "Thunder",
  skill: "guardian",
  body: "#ff0000",
  label: "#00ff00",
  customSpeed: 2.5,  // NEW: Custom speed
  customHP: 150,     // NEW: Custom HP
  // ... other properties
};
```

## Examples

### Example 1: Fast Glass Cannon
- **Speed**: 3.0 (very fast)
- **HP**: 50 (low health)
- **Result**: Quick but fragile horse

### Example 2: Tank
- **Speed**: 0.5 (slow)
- **HP**: 300 (high health)
- **Result**: Slow but very durable

### Example 3: Balanced
- **Speed**: 1.5 (moderate)
- **HP**: 150 (moderate)
- **Result**: Well-rounded horse

### Example 4: Speed Demon
- **Speed**: 5.0 (maximum)
- **HP**: 100 (default)
- **Result**: Extremely fast racer

## Testing

1. **Open Editor**
2. **Set Horse #1**:
   - Speed: 2.0
   - HP: 200
3. **Set Horse #2**:
   - Speed: 0.5
   - HP: 50
4. **Leave Horse #3** with empty fields (uses defaults)
5. **Click Apply** for each
6. **Start Race**
7. **Observe**:
   - Horse #1 runs faster and has more HP
   - Horse #2 runs slower and has less HP
   - Horse #3 uses normal settings
   - Check console logs: `🏇 Horse 0 Init: Using CUSTOM speed=2`

## Future Enhancements (Suggestions)

Additional stats that could be added:
- 🛡️ **Damage Reduction**: Reduce incoming damage by %
- ⚔️ **Damage Multiplier**: Deal more damage in combat
- 📦 **Max Boost Stacks**: Override max boost pickups
- ⚡ **Skill Cooldown Modifier**: Faster/slower skill recharge
- 🎯 **Accuracy**: Better steering/control
- 🔄 **Regeneration**: HP regen over time

## Notes

- Custom stats are **per-horse**, not global
- Empty fields = use default values
- Values are **validated** (min/max enforced)
- Settings are **saved** in mapDef.json
- Settings **persist** across sessions
- Console logs show which horses use custom stats

## Compatibility

- ✅ Works with all skills
- ✅ Works with power-ups
- ✅ Works with global speed slider
- ✅ Works in both Editor and Race modes
- ✅ Saves/loads with map files

---

**Version**: 1.0  
**Last Updated**: Oct 24, 2025  
**Status**: ✅ Fully Implemented
