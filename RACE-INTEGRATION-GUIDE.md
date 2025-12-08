# 🏇 Race Game Integration Guide

## ✅ Đã hoàn thành

### Backend APIs:
1. **`GET /api/race/:id/game-data`** - Lấy data ngựa để load vào game
   - Trả về `horseCustoms` array với sprite_key, skill_key, name
   - Mỗi ngựa có `betId` để link với kết quả

2. **`POST /api/race/:id/results`** - Nhận kết quả từ game
   - Nhận array: `[{ betId, position, finishTime }, ...]`
   - Tự động tính toán payout: 1st (70%), 2nd (20%), 3rd (10%)
   - Update `bets` table với position và payout
   - Cộng coins cho người thắng
   - Ghi transaction log
   - Broadcast kết quả qua Socket.IO

### Frontend:
1. **Race Launcher** (`/race-launcher.html?raceId=X`)
   - Load race data từ server
   - Nhúng game HTML trong iframe
   - Inject `window.mapDef.horseCustoms` vào game
   - Auto-start race sau 2 giây
   - Poll để detect race kết thúc (khi `window.winner` tồn tại)
   - Thu thập kết quả và gửi về server
   - Hiển thị thông báo kết quả

2. **Race Detail Page** (`/race/:id`)
   - Nút **"🏁 Start Race"** cho admin (khi có ≥2 người đăng ký)
   - Click → mở Race Launcher trong tab mới

### Database:
- Đã thêm column `user_horse_id` vào `bets` table
- Migration tự động chạy khi server start
- Link giữa bet và user's custom horse

---

## 📋 Flow hoàn chỉnh:

### 1. Tạo ngựa
```
http://localhost:4000/my-horse
```
- Tạo ít nhất 1 con ngựa (tên, sprite PNG, skill)
- Ngựa đầu tiên FREE

### 2. Tạo cuộc đua (Admin)
```
http://localhost:4000/lobby
```
- Bấm **"+ Tạo cuộc đua mới"**
- Confirm → Race ID mới xuất hiện
- Status: **"Đang mở"** (registration)

### 3. Đăng ký tham gia (Players)
```
http://localhost:4000/race/1
```
- Bấm **"Tham gia đua"**
- Chọn 1 trong các ngựa của bạn
- Nhập số tiền cược (min 500 coins)
- Confirm → Ngựa xuất hiện trong danh sách

### 4. Start Race (Admin)
```
http://localhost:4000/race/1
```
- Khi có ≥2 người đăng ký
- Admin thấy nút **"🏁 Start Race"**
- Click → Mở tab mới với game

### 5. Chạy game
- Game tự động load ngựa đã đăng ký
- Hiển thị sprite PNG, tên ngựa
- Tự động start race sau 2 giây
- Chạy bình thường với AI pathfinding

### 6. Kết thúc race
- Game detect ngựa về đích
- Launcher thu thập kết quả (position, time)
- Tự động gửi về server
- Alert hiển thị payout
- Tự động redirect về `/race/:id`

### 7. Xem kết quả
```
http://localhost:4000/race/1
```
- Danh sách ngựa hiển thị position (🥇🥈🥉)
- Người thắng thấy payout xanh lá
- Profile → Transaction history → "Bet won"
- Coins tự động cộng vào tài khoản

---

## 🎮 Test ngay:

### Prerequisites:
- Đã tạo ngựa ở `/my-horse`
- Đăng nhập với account có coins

### Step-by-step:
1. **F5** `http://localhost:4000/lobby`
2. **Tạo race** (nút xanh ở góc phải)
3. **Click vào race card** → trang detail
4. **"Tham gia đua"** → chọn ngựa → nhập coins → Join
5. **Lặp lại bước 3-4** với nhiều accounts (hoặc tạo thêm ngựa)
6. **Admin login** → vào race detail → **"🏁 Start Race"**
7. **Game mở** → tự động chạy → chờ kết thúc
8. **Alert hiển thị** payout → OK → về trang race
9. **Xem kết quả** trong danh sách người chơi

---

## 🔧 Troubleshooting:

### Game không load ngựa:
- Check console: `gameWindow.mapDef.horseCustoms` có data không
- Kiểm tra API: `GET /api/race/:id/game-data`

### Kết quả không gửi về:
- Check console: có error ở `handleRaceComplete()`?
- Verify: `window.winner` và `window.horses` tồn tại?
- Kiểm tra network tab: POST request có fail?

### Sprites không hiển thị:
- Game cần folder `/assets/horses/*.png`
- Đã copy toàn bộ game vào `/web/public/horse-maze-game/`

---

## 📊 Payout Formula:
```
Total Pool = Tổng tiền cược của tất cả người chơi

1st place: 70% của total pool
2nd place: 20% của total pool
3rd place: 10% của total pool
Others: Thua hết (bet_amount đã trừ khi join)
```

### Ví dụ:
```
Total Pool: 5000 coins (10 người x 500 coins)

Winner 1st: +3500 coins
Winner 2nd: +1000 coins
Winner 3rd: +500 coins
Others (7 người): 0 (đã mất 500 khi join)
```

---

## 🚀 Future Enhancements:

### Phase 1 (Đã xong):
- ✅ Custom horse với sprite PNG
- ✅ Skill system integration
- ✅ Race registration system
- ✅ Game launcher với auto-inject data
- ✅ Result collection & payout
- ✅ Real-time Socket.IO events

### Phase 2 (TODO):
- [ ] Live spectating (real-time game state broadcast)
- [ ] Betting during race (dynamic odds)
- [ ] Replay system (save & playback)
- [ ] Tournament system (multi-round)
- [ ] Achievements & rewards
- [ ] Leaderboard integration

---

## 💡 Tips:

1. **Testing**: Dùng nhiều browser/incognito để test nhiều user
2. **Admin**: Username `admin` có quyền tạo race và start race
3. **Coins**: Mỗi ngày login +500 coins (daily reward)
4. **Sprites**: Có 435+ sprites trong `/assets/horses/`
5. **Skills**: 9 skills khác nhau (hunter, guardian, overdrive, etc.)

---

## 📝 Known Issues:

1. **Game window**: Phải chờ game load xong mới inject data (có delay 1s)
2. **Results detection**: Poll mỗi 500ms để check `window.winner`
3. **Iframe security**: Cần same-origin để access `gameWindow` object
4. **Race status**: Không auto-change từ 'registration' → 'running' (manual start)

---

## 🎉 Conclusion:

Hệ thống betting đã tích hợp hoàn chỉnh với game!

**Luồng chính:**
User → Tạo ngựa → Join race → Admin start → Game chạy → Kết quả tự động → Coins phân phối

**Key features:**
- Custom horses với PNG sprites
- Skill system hoạt động đầy đủ
- Payout tự động
- Transaction logging
- Real-time updates

🏁 **Ready to race!**
