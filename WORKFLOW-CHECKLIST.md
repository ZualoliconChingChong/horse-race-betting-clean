# ✅ Development Workflow Checklist

## 🎨 Khi sửa Editor/Game Logic

### Nếu sửa `race-save-injector.js`:

- [ ] 1. Edit file trong `horse-maze-electron/race-save-injector.js`
- [ ] 2. **SYNC FILES** bằng 1 trong các cách:
  - Double-click `sync-game-files.bat` ✨ (Đơn giản nhất)
  - Hoặc chạy `npm run sync` trong thư mục `web/`
  - Hoặc chạy `.\sync-game-files.ps1` trong PowerShell
- [ ] 3. Hard refresh browser (Ctrl+Shift+R)
- [ ] 4. Test editor mode
- [ ] 5. Commit cả 2 files (source + synced)

### Nếu sửa Backend API:

- [ ] 1. Edit files trong `server/routes/`
- [ ] 2. Server tự restart (nodemon)
- [ ] 3. Test API endpoint
- [ ] 4. Update frontend nếu cần

### Nếu sửa Frontend UI:

- [ ] 1. Edit files trong `web/src/`
- [ ] 2. Chạy `npm run build` trong `web/`
- [ ] 3. Hard refresh browser (Ctrl+Shift+R)
- [ ] 4. Test UI changes

## 🚀 Trước khi Deploy/Test Production

- [ ] Sync game files (`sync-game-files.bat`)
- [ ] Build frontend (`cd web && npm run build`)
- [ ] Restart server nếu cần
- [ ] Test tất cả features:
  - [ ] Login/Register
  - [ ] Create horse
  - [ ] Join race
  - [ ] Editor mode (load map + horses)
  - [ ] Start race
  - [ ] Submit results
  - [ ] Admin kick user
  - [ ] Admin close lobby
  - [ ] Map preview trong lobby

## 🐛 Khi gặp lỗi

### Editor không load map/horses:
1. Check console log (F12)
2. Verify `race-save-injector.js` có trong dist/
3. Chạy sync script
4. Hard refresh

### UI changes không hiển thị:
1. `cd web && npm run build`
2. Hard refresh (Ctrl+Shift+R)
3. Clear cache nếu cần

### Backend API error:
1. Check server console
2. Verify database schema
3. Check API endpoint path
4. Restart server nếu cần

## 📁 File Structure Quick Reference

```
horse-maze-electron/
  └── race-save-injector.js  ← SOURCE (edit here)

horse-race-betting-clean/
  ├── sync-game-files.bat     ← Double-click để sync
  ├── sync-game-files.ps1     ← PowerShell script
  ├── server/
  │   └── routes/             ← Backend API
  └── web/
      ├── src/                ← Frontend React
      ├── public/
      │   └── horse-maze-game/
      │       └── race-save-injector.js  ← SYNCED (dev)
      └── dist/
          └── horse-maze-game/
              └── race-save-injector.js  ← SYNCED (prod)
```

## 💡 Pro Tips

1. **Always sync before testing editor** - Tránh lỗi "map reset"
2. **Use batch file** - Nhanh nhất, chỉ cần double-click
3. **Hard refresh after changes** - Tránh cache cũ
4. **Check console logs** - Debug dễ hơn
5. **Commit synced files** - Team khác không bị lỗi

## 🎯 Quick Commands

```bash
# Sync game files
.\sync-game-files.bat

# Build frontend
cd web
npm run build

# Or use npm script
npm run sync

# Restart server (if not using nodemon)
cd server
npm start
```
