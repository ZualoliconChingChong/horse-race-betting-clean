# Shield & Ram Power-Up Removal Guide

## Ngày: 2025-10-15

## Lý do xóa
- Visual bug không thể fix được do nhiều đường render trùng lặp
- Code phức tạp, khó maintain
- Quyết định xóa hoàn toàn và giữ backup để tái sử dụng sau

## Files đã backup
- `dev-helpers/SHIELD-RAM-BACKUP.js` - Chứa toàn bộ code visual, effect, collision

## Files đã xóa/sửa

### 1. `scripts_render.js` (RenderModule)
- ✅ Đã xóa `drawRams()` function
- ✅ Đã xóa `drawShields()` function  
- ✅ Đã xóa lời gọi trong `drawDynamicItems()`
- ✅ Đã xóa references trong `drawFrame()`

### 2. `scripts/render.js` (Secondary Renderer)
- ⏳ Cần xóa toàn bộ `drawRams()` function
- ⏳ Cần xóa toàn bộ `drawShields()` function
- ⏳ Cần xóa lời gọi trong `drawDynamicItems()`

### 3. `scripts/extracted-inline.js` (Main Game Logic)
- ⏳ Cần xóa Shield collision/pickup logic
- ⏳ Cần xóa Ram collision/pickup logic
- ⏳ Cần xóa Shield effect application
- ⏳ Cần xóa Ram effect application
- ⏳ Cần xóa Shield timer rendering
- ⏳ Cần xóa Ram timer rendering
- ⏳ Cần xóa inline fallback rendering

### 4. `scripts_extracted-inline.js` (Inline Extracted)
- ⏳ Cần xóa tương tự như file trên
- ⏳ Cần xóa khỏi `mapDef` initialization
- ⏳ Cần xóa khỏi `liveArrays` initialization
- ⏳ Cần xóa context menu code
- ⏳ Cần xóa editor tools

## Cần xóa các phần sau

### Data Structures
```javascript
// Trong mapDef
shields: []
rams: []
shieldSettings: { durationMs, consumable }
ramSettings: { durationMs, range, consumable }

// Live arrays
liveShields
liveRams
window.liveShields
window.liveRams
```

### Functions cần xóa
```javascript
// Rendering
drawShields()
drawRams()

// Collision
nearShield()
nearRam()

// Effects
applyShieldEffect()
applyRamEffect()
drawShieldEffect()
drawShieldTimer()
drawRamTimer()

// Pickup logic
handleShieldPickup()
handleRamPickup()
```

### Editor UI cần xóa
- Shield tool button
- Ram tool button
- Shield context menu
- Ram context menu
- Shield settings panel
- Ram settings panel

## Sau khi xóa xong

### Test checklist
- [ ] Game vẫn load được
- [ ] Editor vẫn hoạt động
- [ ] Play mode không có lỗi
- [ ] Các power-up khác vẫn hoạt động bình thường
- [ ] Không còn console errors liên quan Shield/Ram

### Cleanup
- [ ] Xóa các biến global `window.liveShields`, `window.liveRams`
- [ ] Xóa các localStorage keys: `shieldDuration`, `shieldConsumable`, `ramDuration`, `ramRange`, `ramConsumable`
- [ ] Xóa các sound effects: `shield_on`, `ram_on` (nếu có)

## Cách tái sử dụng sau này

1. Copy code từ `dev-helpers/SHIELD-RAM-BACKUP.js`
2. Tạo module riêng cho Shield và Ram
3. Implement theo pattern Integrate v3:
   - Chỉ render từ live arrays trong play/race
   - Skip consumed items
   - Không vẽ vào static layer
   - Centralize rendering qua RenderModule
4. Test kỹ trước khi merge

## Notes
- Các lỗi TS lint trong `scripts_render.js` là pre-existing, không liên quan tới việc xóa này
- Code backup đã được test và hoạt động tốt, chỉ cần refactor lại structure
