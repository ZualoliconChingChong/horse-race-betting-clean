# ✅ Fix: Race Settings Not Applied

## 🐛 Vấn đề

Khi start race, các config settings từ editor không được sử dụng:
- HP System
- Wall Damage & Amount
- Border Damage & Amount  
- Last Horse Wins mode

## 🔍 Nguyên nhân

Trong `race-launcher.html`, settings được apply theo thứ tự SAI:

```javascript
// 1. Load saved config từ DB → update vào biến `settings`
if (mapData.hpSystemEnabled !== undefined) settings.hpSystem = mapData.hpSystemEnabled;

// 2. Nhưng sau đó lại OVERRIDE ngược lại bằng default values!
gameWindow.mapDef.hpSystemEnabled = settings.hpSystem; // ❌ Sai!
```

→ Settings từ editor bị ghi đè bởi default values

## 🔧 Giải pháp

Apply settings **trực tiếp** vào `gameWindow.mapDef` thay vì qua biến trung gian:

```javascript
// ✅ Đúng: Apply trực tiếp từ saved config
if (mapData.hpSystemEnabled !== undefined) {
    gameWindow.mapDef.hpSystemEnabled = mapData.hpSystemEnabled;
}
if (mapData.wallDamageEnabled !== undefined) {
    gameWindow.mapDef.wallDamageEnabled = mapData.wallDamageEnabled;
}
// ... và các settings khác
```

**Logic mới:**
1. Nếu có saved config → dùng saved config
2. Nếu KHÔNG có saved config → dùng default values

## 📝 File đã fix

- `web/public/race-launcher.html` ✅
- `web/dist/race-launcher.html` ✅

## 🎯 Test

1. Vào Editor và config settings:
   - HP System: ON/OFF
   - Wall Damage: ON/OFF + Amount
   - Border Damage: ON/OFF + Amount
   - Mode: First to Finish / Last Horse Wins

2. Save map (Ctrl+S)

3. Start race từ admin

4. Check console log:
   ```
   [Launcher] ✅ Applied HP System: true
   [Launcher] ✅ Applied Wall Damage: true
   [Launcher] ✅ Applied Wall Damage Amount: 15
   [Launcher] ✅ Final game settings: { ... }
   ```

5. Verify trong game:
   - HP system hoạt động đúng
   - Wall damage đúng amount
   - Border damage đúng amount
   - Win condition đúng mode

## 💡 Lưu ý

Settings chỉ apply khi:
- ✅ Map đã được save từ editor (có map_data)
- ✅ Settings được lưu trong map_data
- ✅ Server trả về map_data trong /game-data endpoint

Nếu race chưa có map_data → dùng default settings
