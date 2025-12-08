# Test Custom Horse Speed

## Vấn đề đã sửa
Tính năng custom horse speed cho riêng 1 ngựa không hoạt động đúng.

## Nguyên nhân
1. **Object.assign overwrite**: Trong `race.js`, `Object.assign(h, custom)` đang ghi đè `baseSpeed` đã được tính toán
2. **openGate() logic sai**: Hàm `openGate()` không sử dụng đúng `baseSpeed` để tính velocity
3. **minCruise conflict**: Game loop sử dụng global `minCruise` thay vì tính theo `targetSpeed` cho custom speed horses

## Các thay đổi đã thực hiện

### 1. File: `scripts/core/race.js`

#### Fix 1: Preserve baseSpeed after Object.assign (dòng 175-182)
```javascript
// Store the calculated base speed before Object.assign
const calculatedBaseSpeed = base;

if (custom) {
  Object.assign(h, custom);
  h.speedMod = 1.0;
  // Restore baseSpeed after Object.assign to prevent overwriting
  h.baseSpeed = calculatedBaseSpeed;
```

#### Fix 2: Correct velocity calculation in openGate() (dòng 389-400)
```javascript
// Use horse's baseSpeed (which includes customSpeed if set)
// baseSpeed was already set during horse creation with custom or default speed
// Use the same calculation as in startRace() for consistency
const baseSpeedRef = (h.baseSpeed && typeof h.baseSpeed === 'number' && h.baseSpeed > 0) 
  ? h.baseSpeed 
  : (window.runtimeSpeed || 1.0) * 0.8;

const oldVx = h.vx, oldVy = h.vy;
// Apply the same velocity calculation as in startRace (Math.abs(base)*0.20 + random)
h.vx = Math.abs(baseSpeedRef) * 0.20 + Math.random() * 0.3;
h.vy += (Math.random() * 2 - 1) * 0.2;
```

### 2. File: `scripts/extracted-inline.js`

#### Fix 3: Custom speed horses use dedicated minCruise (dòng 10331-10342)
```javascript
const hasCustomSpeed = (h.baseSpeed && typeof h.baseSpeed === 'number' && h.baseSpeed > 0);
const targetSpeed = hasCustomSpeed ? h.baseSpeed : editorSpeedValue;

// For custom speed horses, always use targetSpeed * 0.95 for minCruise
// For normal horses, use global minCruise setting or targetSpeed * 0.95 as fallback
const minCruise = hasCustomSpeed 
  ? (targetSpeed * 0.95) 
  : ((typeof mapDef.minCruise === 'number' && isFinite(mapDef.minCruise)) ? mapDef.minCruise : (targetSpeed * 0.95));
```

## Cách test

1. Mở Horse Customization panel
2. Chọn một ngựa (ví dụ: Horse #1)
3. Set Custom Speed = 3 (để trống = dùng default)
4. Click "Apply" hoặc auto-apply sẽ chạy
5. Start race
6. Quan sát ngựa #1 chạy nhanh hơn các ngựa khác

## Debug logs

Khi có ngựa với custom speed > 1.5, console sẽ hiển thị:
```
⚡ Horse 0 "Ngựa 1": customSpeed=3.00, targetSpeed=3.00, maxVel=3.00, minCruise=2.85, velBefore=0.XX
✅ FINAL - Horse 0 "Ngựa 1": velocity=2.XX, customSpeed=3.00, effectiveMaxVel=3.00
```

## Kết quả mong đợi

- Ngựa có custom speed sẽ chạy với tốc độ đã set
- Không bị ảnh hưởng bởi global speed settings
- minCruise tự động điều chỉnh theo custom speed (95% của targetSpeed)
- maxVel tự động tăng để cho phép custom speed
