# 🔄 Quick Sync Guide

## ⚡ TL;DR - Cách nhanh nhất

**Sau khi sửa `race-save-injector.js`, chỉ cần:**

```
Double-click: sync-game-files.bat
```

Xong! ✅

---

## 📚 Chi tiết

### Vấn đề
File `race-save-injector.js` trong `horse-maze-electron` cần được sync sang `horse-race-betting-clean` để editor mode hoạt động.

### Giải pháp

#### Option 1: Batch File (Khuyến nghị) ✨
```
Double-click: sync-game-files.bat
```

#### Option 2: NPM Script
```bash
cd web
npm run sync
```

#### Option 3: PowerShell
```powershell
.\sync-game-files.ps1
```

### Khi nào cần sync?

- ✅ Sau khi sửa `race-save-injector.js`
- ✅ Trước khi test editor mode
- ✅ Trước khi deploy

### Verify đã sync thành công

1. Check file tồn tại:
   - `web/public/horse-maze-game/race-save-injector.js`
   - `web/dist/horse-maze-game/race-save-injector.js`

2. Mở editor và check console (F12):
   ```
   [Race Save] Loading race data...
   [Race Save] Race data loaded: {...}
   ```

### Troubleshooting

**❌ Editor không load map/horses**
→ Chạy `sync-game-files.bat` và hard refresh (Ctrl+Shift+R)

**❌ Batch file báo lỗi**
→ Check đường dẫn trong file, hoặc dùng Option 2/3

**❌ PowerShell execution policy error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

📖 Xem thêm: [WORKFLOW-CHECKLIST.md](WORKFLOW-CHECKLIST.md) | [SYNC-GUIDE.md](SYNC-GUIDE.md)
