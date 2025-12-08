# Luck System - Horse Skill Cooldown Bypass

## Tổng quan

Hệ thống **Luck** cho phép ngựa có cơ hội kích hoạt skill ngay cả khi đang trong thời gian cooldown.

## Cách hoạt động

### 1. Luck Stat
- **Range**: 0-100%
- **Default**: 0 (không có luck)
- **Ý nghĩa**: % cơ hội bypass cooldown **mỗi giây**

### 2. Cơ chế

Khi skill đang cooldown:
1. **Mỗi 1 giây**, game sẽ roll một số ngẫu nhiên từ 0-100
2. Nếu số roll < Luck stat → **LUCKY!** Skill reset về trạng thái `ready`
3. Visual feedback:
   - Floating text "🍀 LUCKY!" màu xanh lá
   - Green explosion effect
   - Debug log (nếu `window.debugSkills = true`)

### 3. Xác suất

**Xác suất bypass = Luck% mỗi giây**

Ví dụ:
- **Luck = 1%** → 1% chance bypass **mỗi giây**
- **Luck = 5%** → 5% chance bypass **mỗi giây**
- **Luck = 10%** → 10% chance bypass **mỗi giây**
- **Luck = 50%** → 50% chance bypass **mỗi giây**

**Thời gian bypass trung bình:**
```
Avg. bypass time = 100 / Luck (giây)
```

Ví dụ:
- Luck = 1% → Avg. 100 giây
- Luck = 5% → Avg. 20 giây
- Luck = 10% → Avg. 10 giây
- Luck = 25% → Avg. 4 giây
- Luck = 50% → Avg. 2 giây

## Cách sử dụng

### 1. Trong Editor

1. Mở **Horse Customization** panel
2. Chọn ngựa muốn set Luck
3. Nhập giá trị **Luck** (0-100)
4. Auto-apply sẽ lưu ngay

### 2. Trong Code

```javascript
// Set luck khi tạo horse custom
const custom = {
  name: "Lucky Horse",
  skill: "hunter",
  luck: 10  // 10% chance bypass cooldown
};

// Luck được apply trong race.js
if (custom.luck && typeof custom.luck === 'number' && custom.luck >= 0) {
  h.luck = Math.min(100, custom.luck); // Cap at 100%
} else {
  h.luck = 0; // Default: no luck
}
```

### 3. Trong Game Loop

```javascript
// extracted-inline.js - Skill system
case 'cooldown':
  const luckChance = (typeof h.luck === 'number' && h.luck > 0) ? h.luck : 0;
  if (luckChance > 0) {
    // Check luck every 1 second for intuitive % chance
    const lastLuckCheck = h._lastLuckCheck || 0;
    if ((now - lastLuckCheck) >= 1000) {
      h._lastLuckCheck = now;
      const roll = Math.random() * 100;
      if (roll < luckChance) {
        // Lucky! Bypass cooldown
        h.skillState.status = 'ready';
        h.skillState.cooldownUntil = 0;
        // Visual feedback...
      }
    }
  }
```

## Balance Recommendations

### Suggested Luck Values

| Luck % | Description | Avg. Bypass Time | Use Case |
|--------|-------------|------------------|----------|
| 1-2% | Very Low | 50-100s | Rare lucky moments |
| 3-5% | Low Luck | 20-33s | Balanced gameplay |
| 5-10% | Medium Luck | 10-20s | Slightly favored |
| 10-20% | High Luck | 5-10s | Strong advantage |
| 20-50% | Very High | 2-5s | OP, testing only |
| 50-100% | Instant | 1-2s | Debug/cheat mode |

### Cooldown Times Reference

| Skill | Cooldown | With 5% Luck | With 10% Luck | With 20% Luck |
|-------|----------|--------------|---------------|---------------|
| Hunter's Gambit | 90s | ~20s avg | ~10s avg | ~5s avg |
| Divine Guardian | 60s | ~20s avg | ~10s avg | ~5s avg |
| Phantom Strike | 85s | ~20s avg | ~10s avg | ~5s avg |
| Cosmic Swap | 80s | ~20s avg | ~10s avg | ~5s avg |
| Chain Lightning | 42s | ~20s avg | ~10s avg | ~5s avg |
| Gravity Well | 45s | ~20s avg | ~10s avg | ~5s avg |
| Overdrive | 50s | ~20s avg | ~10s avg | ~5s avg |
| Slipstream | 55s | ~20s avg | ~10s avg | ~5s avg |
| Shockwave | 45s | ~20s avg | ~10s avg | ~5s avg |

**Note**: Avg. bypass time chỉ phụ thuộc vào Luck%, không phụ thuộc vào cooldown gốc!

## Testing

### Test Case 1: Very Low Luck (1%)
```javascript
// Horse #1
luck: 1
skill: "hunter"
// Expected: 1% chance/giây → Avg. 100s để bypass (có thể không xảy ra trong 90s cooldown)
```

### Test Case 2: Low Luck (5%)
```javascript
// Horse #1
luck: 5
skill: "chain_lightning"
// Expected: 5% chance/giây → Avg. 20s để bypass
```

### Test Case 3: Medium Luck (10%)
```javascript
// Horse #1
luck: 10
skill: "phantom_strike"
// Expected: 10% chance/giây → Avg. 10s để bypass
```

### Test Case 4: High Luck (25%)
```javascript
// Horse #1
luck: 25
skill: "gravity_well"
// Expected: 25% chance/giây → Avg. 4s để bypass
```

## Debug

Để xem luck rolls trong console, enable debug mode:
```javascript
// Trong browser console
window.debugSkills = true;

// Khi lucky bypass xảy ra, sẽ log:
// 🍀 Horse 0 "Lucky Horse" got LUCKY! (2.3 < 10)
```

Hoặc xem trực tiếp trong game:
- Floating text "🍀 LUCKY!" màu xanh lá xuất hiện trên ngựa
- Green explosion effect tại vị trí ngựa

## Files Modified

1. **index.html** - Added Luck input field
2. **scripts/editor/horse-customization-ui.js** - Save/load Luck stat
3. **scripts/core/race.js** - Apply Luck to horse object
4. **scripts/extracted-inline.js** - Implement Luck bypass mechanic

## Future Enhancements

- [ ] Luck-based critical hits (double damage)
- [ ] Luck affects power-up spawn rate
- [ ] Luck reduces negative effect duration
- [ ] Visual indicator for high-luck horses (sparkles)
- [ ] Sound effect for lucky bypass
