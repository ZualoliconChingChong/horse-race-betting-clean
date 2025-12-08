# 🖼️ Tạo Map Preview cho Race

## Vấn đề
Race được tạo trước khi có feature preview nên chưa có ảnh.

## ✅ Giải pháp (Dễ nhất)

### 1. Vào Editor của race:
```
http://localhost:3001/horse-maze-game/index.html?editor=true&raceId=1
```
*(Thay `raceId=1` bằng ID race bạn muốn)*

### 2. Đợi map load xong

### 3. Save map (1 trong 2 cách):
- ✅ Nhấn nút **💾 Save** (góc trên phải)
- ✅ Hoặc nhấn **Ctrl+S**

### 4. Kiểm tra console log:
```
[Race Config] Has preview image: true
[Race Config] ✅ Saved map preview image
```

### 5. Quay lại Lobby:
```
http://localhost:3001/lobby
```

### 6. Hard refresh (Ctrl+Shift+R)

→ **Sẽ thấy map preview!** 🎉

---

## 🔍 Debug

### Nếu vẫn không thấy preview:

**1. Check console trong Lobby:**
```javascript
// Xem races array
console.log('[Lobby] Races:', races)

// Check race có preview_image không
races.forEach(r => console.log(`Race #${r.id}:`, r.preview_image ? 'HAS PREVIEW' : 'NO PREVIEW'))
```

**2. Check API response:**
```
http://localhost:3001/api/race/active
```
→ Xem race object có field `preview_image` không

**3. Check database:**
```sql
SELECT id, preview_image IS NOT NULL as has_preview FROM races;
```

---

## 📋 Tạo preview cho tất cả races

Với mỗi race:
1. Vào editor: `?editor=true&raceId=X`
2. Save (Ctrl+S)
3. Done!

---

**Tip:** Preview chỉ cần tạo 1 lần. Sau đó mỗi khi admin save map, preview sẽ tự động update!
