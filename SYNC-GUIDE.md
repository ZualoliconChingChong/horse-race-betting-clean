# 🔄 Game Files Sync Guide

## Vấn đề
Khi chỉnh sửa `race-save-injector.js` trong `horse-maze-electron`, file này cần được sync sang `horse-race-betting-clean` để editor mode hoạt động đúng.

## ✅ Giải pháp

### Cách 1: Chạy PowerShell script (Khuyến nghị)
```powershell
.\sync-game-files.ps1
```

### Cách 2: Manual copy (nếu script không chạy được)
```powershell
# Copy race-save-injector.js
Copy-Item "e:\CascadeProjects\horse-maze-electron\race-save-injector.js" "e:\CascadeProjects\horse-race-betting-clean\web\public\horse-maze-game\" -Force
Copy-Item "e:\CascadeProjects\horse-maze-electron\race-save-injector.js" "e:\CascadeProjects\horse-race-betting-clean\web\dist\horse-maze-game\" -Force
```

### Cách 3: Tích hợp vào workflow
Thêm vào `.vscode/tasks.json` để tự động sync khi save file:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Sync Game Files",
      "type": "shell",
      "command": "powershell",
      "args": ["-ExecutionPolicy", "Bypass", "-File", "${workspaceFolder}/sync-game-files.ps1"],
      "presentation": {
        "reveal": "silent",
        "panel": "shared"
      }
    }
  ]
}
```

## 📝 Files cần sync

- `race-save-injector.js` - Script để load/save map config và inject horses vào editor

## 🎯 Khi nào cần sync?

- ✅ Sau khi sửa `race-save-injector.js`
- ✅ Sau khi thêm tính năng mới vào editor
- ✅ Trước khi test editor mode
- ✅ Trước khi deploy production

## 🔍 Cách kiểm tra đã sync chưa?

1. Mở editor mode: `http://localhost:3001/horse-maze-game/index.html?editor=true&raceId=3`
2. Mở Console (F12)
3. Kiểm tra log:
   ```
   [Race Save] Loading race data...
   [Race Save] Race data loaded: {...}
   ```
4. Nếu không thấy log → chưa sync hoặc chưa include script tag trong `index.html`

## 💡 Pro Tips

1. **Always sync before testing editor**
2. **Check console logs** để verify script đã load
3. **Hard refresh** (Ctrl+Shift+R) sau khi sync
4. **Commit both source and synced files** để team khác không bị lỗi

## 🚨 Troubleshooting

**Vấn đề: Editor không load map/ngựa**
- ✅ Kiểm tra `race-save-injector.js` có trong `web/dist/horse-maze-game/`
- ✅ Kiểm tra script tag trong `index.html`
- ✅ Chạy sync script
- ✅ Hard refresh browser

**Vấn đề: Script execution policy error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Vấn đề: Dist folder không tồn tại**
```powershell
cd web
npm run build
```
