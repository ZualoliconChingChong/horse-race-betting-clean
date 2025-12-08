/**
 * Smart i18n - Auto-detect and translate ALL UI elements
 * No manual mapping needed - uses intelligent patterns
 */

(function() {
  // Core translations dictionary
  const dictionary = {
    // Map Editor - Tools
    'Tools': 'Công Cụ',
    'Mode': 'Chế Độ',
    'Draw': 'Vẽ',
    'Erase': 'Xóa',
    'Partial Erase': 'Xóa Một Phần',
    'Select/Move': 'Chọn/Di Chuyển',
    'Wall Type': 'Loại Tường',
    'Normal': 'Bình Thường',
    'Ice': 'Băng',
    'Bouncy': 'Nảy',
    'Solid Barrier': 'Rào Cản Cứng',
    'Soft Deformable': 'Mềm Biến Dạng',
    'Mud Slowdown': 'Bùn Làm Chậm',
    'One-Way': 'Một Chiều',
    'Destructible': 'Có Thể Phá Hủy',
    'Magnetic': 'Từ Tính',
    'Brush Size': 'Kích Thước Bút',
    'Eraser Size': 'Kích Thước Tẩy',
    'Snap to Grid': 'Dính Lưới',
    'Show Grid': 'Hiện Lưới',
    'Show Debug Info': 'Hiện Thông Tin Debug',
    'Color': 'Màu',
    
    // Tool Categories
    'Essential': 'Cơ Bản',
    'Geometry': 'Hình Học',
    'Race Setup': 'Thiết Lập Đua',
    'Obstacles': 'Chướng Ngại Vật',
    'Advanced': 'Nâng Cao',
    
    // Tool Tooltips
    'Select & Move': 'Chọn & Di Chuyển',
    'Delete Objects': 'Xóa Đối Tượng',
    'Draw Walls': 'Vẽ Tường',
    'Brush Walls': 'Bút Vẽ Tường',
    'Diagonal Walls': 'Tường Chéo',
    'Half-Circle': 'Nửa Vòng Tròn',
    'Arc Walls': 'Tường Cung',
    'Eraser Brush': 'Bút Tẩy',
    'Break Wall Brush': 'Bút Phá Tường',
    'Soft Wall Brush (Deform)': 'Bút Tường Mềm (Biến Dạng)',
    'Horse Spawns': 'Điểm Xuất Hiện Ngựa',
    'Finish Line A': 'Vạch Đích A',
    'Finish Line B': 'Vạch Đích B',
    'Waiting Room': 'Phòng Chờ',
    'Start Gate': 'Cổng Xuất Phát',
    'Speed Boost': 'Tăng Tốc',
    'Ghost Mode': 'Chế Độ Ma',
    'Time Freeze': 'Đóng Băng Thời Gian',
    'Ice Freezer': 'Đóng Băng',
    'Testpower': 'Sức Mạnh Test',
    'Fire Aura': 'Hào Quang Lửa',
    'Healing Zone': 'Vùng Hồi Máu',
    'Tornado Vortex 🌪️': 'Lốc Xoáy 🌪️',
    'Volcano 🌋': 'Núi Lửa 🌋',
    'Warp Zone 🌌': 'Vùng Dịch Chuyển 🌌',
    'Quantum Dash 🔮': 'Phi Nước Đại Lượng Tử 🔮',
    'Yellowheart 💛': 'Trái Tim Vàng 💛',
    'Nebula 🔹': 'Tinh Vân 🔹',
    'Ram Attack': 'Tấn Công Húc',
    'Mud Patch': 'Vũng Bùn',
    'Healing Patch': 'Vùng Hồi Phục',
    'Rotating Barrier': 'Rào Cản Xoay',
    'Fire Trap': 'Bẫy Lửa',
    'Magnetic Pull': 'Lực Hút Từ Tính',
    'Magnetic Push': 'Lực Đẩy Từ Tính',
    'Bumper': 'Đệm Va Chạm',
    'Spinner': 'Vật Xoay',
    'Conveyor Belt': 'Băng Chuyền',
    'Wind Fan': 'Quạt Gió',
    'Weather System': 'Hệ Thống Thời Tiết',
    'One-way Gate': 'Cổng Một Chiều',
    'Landing Pad': 'Bệ Hạ Cánh',
    
    // Settings - Grid
    'Grid': 'Lưới',
    'Size': 'Kích Thước',
    'Hide in Play': 'Ẩn Khi Chơi',
    
    // Settings - Objects
    'Objects': 'Đối Tượng',
    'Horse': 'Ngựa',
    'Carrot': 'Cà Rốt',
    'Corner': 'Góc',
    
    // Game Settings
    'Game Items': 'Vật Phẩm Game',
    horses_count: '🐎 Horses (1-50)',
    game_speed: '⚡ Speed (0.1-5)',
    countdown: '⏱️ Countdown (s)',
    collision_sfx: '🔊 Collision SFX',
    trail_effect: '💨 Horse Trail Effect',
    'Trail Intensity': 'Cường Độ Đuôi',
    'Hide All Names': 'Ẩn Tất Cả Tên',
    'Trail color': 'Màu đuôi',
    name_size: '🔤 Name Size',
    horses_max_velocity: '🚀 Max Speed',
    'Spread': 'Độ Lan',
    
    // Settings - Walls
    'Walls': 'Tường',
    'Thickness': 'Độ Dày',
    'Arc Span': 'Góc Quét',
    'Brush Step': 'Bước Bút',
    'Break HP': 'HP Phá Vỡ',
    'On Break': 'Khi Vỡ',
    'Remove': 'Xóa',
    'Shards': 'Mảnh Vỡ',
    'Soft Stiffness': 'Độ Cứng Mềm',
    'Max Deform': 'Biến Dạng Tối Đa',
    'Recovery': 'Phục Hồi',
    
    // Settings - Special
    'Special': 'Đặc Biệt',
    'Spinner Speed': 'Tốc Độ Xoay',
    'Spinner Length': 'Độ Dài Xoay',
    
    // Settings - Magnet
    'Magnet': 'Nam Châm',
    'Range': 'Phạm Vi',
    'Duration': 'Thời Gian',
    'Strength': 'Sức Mạnh',
    
    // Spawn Settings
    'Spawn Settings': 'Cài Đặt Xuất Hiện',
    'Spawn Preset': 'Kiểu Xuất Hiện',
    'Auto Grid': 'Lưới Tự Động',
    'Line': 'Hàng',
    'Grid 2×': 'Lưới 2×',
    'Fan/Arc': 'Quạt/Cung',
    'Scatter': 'Rải Rác',
    'Spawn Jitter': 'Độ Lệch Xuất Hiện',
    'Start Bias': 'Độ Lệch Khởi Đầu',
    
    // Carrots
    'Active Carrot': 'Cà Rốt Hiện Tại',
    'Add Carrot': 'Thêm Cà Rốt',
    'Delete Carrot': 'Xóa Cà Rốt',
    'Clear All': 'Xóa Tất Cả',
    'Carrot A': 'Cà Rốt A',
    'Carrot B': 'Cà Rốt B',
    
    // Start/Finish
    'Start Line': 'Vạch Xuất Phát',
    'Finish Line': 'Vạch Đích',
    
    // Obstacles
    'Add Rectangle': 'Thêm Hình Chữ Nhật',
    'Add Circle': 'Thêm Hình Tròn',
    'Add Pipe': 'Thêm Ống Dẫn',
    'Delete Selected': 'Xóa Đã Chọn',
    
    // Power-ups (shortened names)
    'Boost': 'Tăng Tốc',
    'Turbo': 'Turbo',
    'Teleport': 'Dịch Chuyển',
    'Ghost': 'Ma',
    'Trap': 'Bẫy',
    'Freeze': 'Đóng Băng',
    'Poison': 'Độc',
    'Lightning': 'Sét',
    'RAM': 'RAM',
    
    // Background Music
    section_bgm: '🎵 Background Music',
    'Background Music': 'Nhạc Nền',
    'Enable Music:': 'Bật Nhạc Nền:',
    'Change Music:': 'Đổi Nhạc:',
    'Controls:': 'Điều Khiển:',
    'Playing:': 'Đang Phát:',
    'TTS Voice:': 'Giọng TTS:',
    'Enable TTS:': 'Bật TTS:',
    'TTS Source:': 'Nguồn TTS:',
    'Browser': 'Trình Duyệt',
    'Azure (Cloud)': 'Azure (Đám Mây)',
    'Azure Voice:': 'Giọng Azure:',
    'Select voice for events': 'Chọn giọng đọc sự kiện',
    'Select TTS source': 'Chọn nguồn TTS',
    'Select different music file': 'Chọn file nhạc khác',
    'Test playback: "Hello!"': 'Phát thử: "Xin chào!"',
    '🔊 Test TTS': '🔊 Test TTS',
    bgm_enable: 'Enable Music',
    bgm_change: 'Change Music:',
    bgm_controls: 'Controls:',
    bgm_test: 'Test',
    bgm_playing: '▶ Playing:',
    bgm_tts_voice: 'TTS Voice:',
    bgm_tts_enable: 'Enable TTS:',
    
    // Weather
    'Enable Weather': 'Bật Thời Tiết',
    'Weather Type': 'Loại Thời Tiết',
    'Clear': 'Quang Đãng',
    'Rain': 'Mưa',
    'Wind': 'Gió',
    'Snow': 'Tuyết',
    'Storm': 'Bão',
    'Intensity': 'Cường Độ',
    'Wind Direction': 'Hướng Gió',
    
    // Fans
    'Add Fan': 'Thêm Quạt',
    
    // Tornadoes
    'Add Tornado': 'Thêm Lốc Xoáy',
    
    // Bumpers
    'Add Bumper': 'Thêm Đệm',
    
    // Carrot Sprite
    'PNG File': 'File PNG',
    'Clear Sprite': 'Xóa Sprite',
    'Scale': 'Tỷ Lệ',
    'Auto Rotate': 'Tự Động Xoay',
    'Outline': 'Viền',
    'Outline Color': 'Màu Viền',
    'Outline Width': 'Độ Dày Viền',
    'On': 'Bật',
    'Off': 'Tắt',
    
    // Horse Customization
    'Select Horse #': 'Chọn Ngựa #',
    'Max: Current Count': 'Tối Đa: Số Hiện Tại',
    'Display Name': 'Tên Hiển Thị',
    'e.g., Thunder Bolt': 'vd: Tia Chớp',
    'Special Skill': 'Kỹ Năng Đặc Biệt',
    'None': 'Không có',
    "Hunter's Gambit": 'Ván Cược Thợ Săn',
    'Divine Guardian': 'Người Bảo Vệ Thần Thánh',
    'Phantom Strike': 'Đòn Tàng Hình',
    'Cosmic Swap': 'Hoán Đổi Vũ Trụ',
    'Chain Lightning': 'Sét Dây Chuyền',
    'Gravity Well': 'Giếng Trọng Lực',
    'Chill Guy': 'Anh Trai Thư Giãn',
    'Overdrive': 'Quá Tải',
    'Slipstream': 'Dòng Trượt',
    'Shockwave': 'Sóng Xung Kích',
    'Oguri Fat': 'Oguri Béo',
    'Body Color': 'Màu Thân',
    'Label Color': 'Màu Nhãn',
    'PNG Sprite': 'PNG Sprite',
    'Sprite Presets': 'Sprite Có Sẵn',
    'Sprite Presets…': 'Sprite Có Sẵn…',
    'Import PNGs…': 'Nhập PNG…',
    'Import Folder…': 'Nhập Thư Mục…',
    'Carrot PNG': 'PNG Cà Rốt',
    'Sprite Scale': 'Tỷ Lệ Sprite',
    'Auto Rotate': 'Tự Động Xoay',
    '(Use Global Setting)': '(Dùng Cài Đặt Toàn Cục)',
    'Outline': 'Viền',
    'Use Global Setting': 'Dùng Cài Đặt Toàn Cục',
    
    // Action Groups
    'Current Horse': 'Ngựa Hiện Tại',
    'All Horses': 'Tất Cả Ngựa',
    'Sprites': 'Sprite',
    'Colors & Skills': 'Màu & Kỹ Năng',
    'Apply': 'Áp Dụng',
    'Reset': 'Đặt Lại',
    'Random': 'Ngẫu Nhiên',
    'Skill': 'Kỹ Năng',
    'Copy All': 'Sao Chép Tất Cả',
    'Random All': 'Ngẫu Nhiên Tất Cả',
    'Skill All': 'Kỹ Năng Tất Cả',
    'Clear': 'Xóa',
    'Random #N': 'Ngẫu Nhiên #N',
    'Outline All': 'Viền Tất Cả',
    'Body All': 'Thân Tất Cả',
    'Duplicate': 'Nhân Bản',
    'Delete': 'Xóa',
    'Random Color': 'Màu Ngẫu Nhiên',
    'Random Position': 'Vị Trí Ngẫu Nhiên',
    'Random Skill': 'Kỹ Năng Ngẫu Nhiên',
    'Random Sprite': 'Sprite Ngẫu Nhiên',
    'Copy to All': 'Sao Chép Sang Tất Cả',
    'Random Colors': 'Màu Ngẫu Nhiên',
    'Random Positions': 'Vị Trí Ngẫu Nhiên',
    'Random Skills': 'Kỹ Năng Ngẫu Nhiên',
    'Random Sprites': 'Sprite Ngẫu Nhiên',
    'Clear All Sprites': 'Xóa Tất Cả Sprite',
    'Clear All Skills': 'Xóa Tất Cả Kỹ Năng',
    
    // Map Management
    'Clear Map': 'Xóa Map',
    'Load Sample': 'Tải Mẫu',
    'Generate Map': 'Tạo Map',
    'Add Items': 'Thêm Vật Phẩm',
    'Add Belt': 'Thêm Băng Chuyền',
    'Export JSON': 'Xuất JSON',
    'Import JSON': 'Nhập JSON',
    'Export as Image': 'Xuất Hình Ảnh',
    'New Map': 'Map Mới',
    'Map Presets': 'Map Có Sẵn',
    'Preset Maps': 'Map Có Sẵn',
    'Oval': 'Hình Oval',
    'Spinner': 'Xoáy',
    'Maze': 'Mê Cung',
    
    // Buttons & UI
    '▶ Test Race': '▶ Chạy Thử Đua',
    'Test Race': 'Chạy Thử Đua',
    'Results': 'Kết Quả',
    'Play Again': 'Chơi Lại',
    'Play Test': 'Chạy Thử',
    'Pause': 'Dừng',
    'Stop & Edit': 'Dừng & Sửa',
    'Close': 'Đóng',
    'Apply': 'Áp Dụng',
    'Reset to Defaults': 'Đặt Lại Mặc Định',
    'Export Settings': 'Xuất Cài Đặt',
    'Undo (recent shape)': 'Hoàn Tác (hình gần nhất)',
    'Clear ALL walls': 'Xóa TẤT CẢ tường',
    'Save to browser': 'Lưu vào trình duyệt',
    'Load': 'Tải',
    'Dev Mode': 'Chế Độ Dev',
    'Screen Border Damage': 'Sát Thương Va Chạm Viền Màn Hình',
    'Min Cruise': 'Tốc Độ Tối Thiểu',
    'Luck or Suck': 'May Mắn hoặc Xui Xẻo',
    'Luck Interval (s)': 'Khoảng Thời Gian May Mắn (s)',
    'Border Damage': 'Sát Thương Viền',
    'Border Damage Amount': 'Lượng Sát Thương Viền',
    'Wall Damage Amount': 'Lượng Sát Thương Tường',
    
    // Waiting Room
    'Waiting Room': 'Phòng Chờ',
    'Width': 'Chiều Rộng',
    'Height': 'Chiều Cao',
    'Corner Radius': 'Bán Kính Góc',
    'Auto-fit at race start': 'Tự động vừa vặn khi bắt đầu đua',
    'Safe Zone': 'Vùng An Toàn',
    'Wall Gap': 'Khoảng Trống Tường',
    
    // Advanced Carrot Settings
    'Advanced Carrot Settings': 'Cài Đặt Cà Rốt Nâng Cao',
    'Swap A/B': 'Hoán Đổi A/B',
    'Reset Positions': 'Đặt Lại Vị Trí',
    'Clear A': 'Xóa A',
    'Clear B': 'Xóa B',
    'PNG Sprite': 'PNG Sprite',
    'Sprite Scale': 'Tỷ Lệ Sprite',
    'Sprite Outline': 'Viền Sprite',
    'Outline Color': 'Màu Viền',
    'Outline Width': 'Độ Dày Viền',
    'Random Positions': 'Vị Trí Ngẫu Nhiên',
    'Auto-place Carrot(s)': 'Tự Động Đặt Cà Rốt',
    
    // Common
    'Max': 'Tối đa',
    'Current Count': 'Số Hiện Tại',
    'Test': 'Test',
    
    // Countdown
    'Chuẩn bị...': 'Preparing...',
    'Preparing...': 'Chuẩn bị...',
    
    // Dev Mode
    'Dev Mode Active': 'Chế Độ Dev Đang Bật',
    'Controls:': 'Điều Khiển:',
    'Click horse to control': 'Click ngựa để điều khiển',
    'WASD / Arrows: Move': 'WASD / Mũi tên: Di chuyển',
    'Space: Activate Skill': 'Space: Kích Hoạt Kỹ Năng',
    'Control:': 'Điều Khiển:',
    'Horse:': 'Ngựa:',
    'Skill:': 'Kỹ Năng:',
    'Ready': 'Sẵn Sàng',
    'Speed up': 'Tăng Tốc',
    'Slow down': 'Giảm Tốc',
    'Turn left': 'Rẽ Trái',
    'Turn right': 'Rẽ Phải',
    'Skill (when ready)': 'Kỹ Năng (khi sẵn sàng)',
    'Switch horse': 'Chuyển Ngựa',
    'Refresh horses': 'Làm Mới Ngựa',
    
    // Themes
    'Editor Theme': 'Giao Diện Editor',
    'Dark Professional': 'Chuyên Nghiệp Tối',
    'Modern Dark': 'Hiện Đại Tối',
    'Warm Dark': 'Ấm Áp Tối',
    'Gaming Style': 'Phong Cách Gaming',
    
    // Position
    'Vị trí panel': 'Panel Position',
    'Panel Position': 'Vị Trí Panel',
    'Bên phải': 'Right',
    'Right': 'Bên phải',
    'Bên trái': 'Left',
    'Left': 'Bên trái',
    'Dưới cùng': 'Bottom',
    'Bottom': 'Dưới cùng',
    'Reset view (Ctrl+0)': 'Đặt lại góc nhìn (Ctrl+0)',
    
    // Tooltips
    'Start Race (F1)': 'Bắt Đầu Đua (F1)',
    'Map Editor (F2)': 'Trình Sửa Map (F2)',
    'Play Test (F1)': 'Chạy Thử (F1)',
    'Open Map Editor': 'Mở Trình Sửa Map',
    'Pause / Resume': 'Tạm Dừng / Tiếp Tục',
    'Dev Mode - Control horses (F3)': 'Chế Độ Dev - Điều khiển ngựa (F3)',
    'Focus Mode': 'Chế Độ Tập Trung',
    'Sound Effects': 'Hiệu Ứng Âm Thanh',
    'HP Combat System': 'Hệ Thống Chiến Đấu HP',
    'Display HP Values': 'Hiển Thị Giá Trị HP',
    'Display velocity below horses': 'Hiển thị vận tốc bên dưới ngựa',
    'Rotate horse sprites based on movement direction': 'Xoay sprite ngựa theo hướng di chuyển',
    'Win by elimination instead of finish line': 'Thắng bằng loại bỏ thay vì đường đích',
    'Wall Collision Damage': 'Sát Thương Va Chạm Tường',
    'Border Collision Damage': 'Sát Thương Va Chạm Viền',
    'Disabled - Use global Auto-Rotate in Settings instead': 'Đã tắt - Dùng Tự Động Xoay toàn cục trong Cài Đặt',
    'Tip: You can also use built-ins below': 'Mẹo: Bạn cũng có thể dùng sprite có sẵn bên dưới',
    'Hint: Transparent PNG sprites work best. Files are saved locally (Base64) when you Save/Export.': 
      'Mẹo: Sprite PNG nền trong suốt hoạt động tốt nhất. File được lưu cục bộ (Base64) khi bạn Save/Export.',
  };
  
  // Reverse dictionary for VI → EN
  const reverseDict = {};
  Object.keys(dictionary).forEach(en => {
    const vi = dictionary[en];
    reverseDict[vi] = en;
  });
  
  function translate(text, toLang) {
    if (toLang === 'vi') {
      return dictionary[text] || text;
    } else {
      return reverseDict[text] || text;
    }
  }
  
  function translateElement(el, toLang) {
    const originalText = el.textContent.trim();
    
    // Skip if empty or only contains emoji/numbers
    if (!originalText || /^[\d\s\p{Emoji}]+$/u.test(originalText)) {
      return;
    }
    
    // Extract emoji prefix if exists
    const emojiMatch = originalText.match(/^([\p{Emoji}\s]+)/u);
    const prefix = emojiMatch ? emojiMatch[1] : '';
    const textWithoutEmoji = originalText.substring(prefix.length).trim();
    
    // Try to translate
    const translated = translate(textWithoutEmoji, toLang);
    
    if (translated !== textWithoutEmoji) {
      // Update text while preserving structure
      if (el.querySelector('span, small, em, strong')) {
        // Has child elements - update first text node only
        const firstText = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        if (firstText) {
          firstText.textContent = prefix + translated;
        }
      } else {
        el.textContent = prefix + translated;
      }
      return true;
    }
    return false;
  }
  
  function translateUI(toLang) {
    let count = 0;
    
    // Translate labels
    document.querySelectorAll('label').forEach(label => {
      if (translateElement(label, toLang)) count++;
    });
    
    // Translate section titles
    document.querySelectorAll('.section-title, .panel-title, .group-title, .category-header').forEach(title => {
      if (translateElement(title, toLang)) count++;
    });
    
    // Translate buttons
    document.querySelectorAll('button, .btn').forEach(btn => {
      if (translateElement(btn, toLang)) count++;
    });
    
    // Translate options
    document.querySelectorAll('option').forEach(opt => {
      if (translateElement(opt, toLang)) count++;
    });
    
    // Translate chip text
    document.querySelectorAll('.chip').forEach(chip => {
      if (translateElement(chip, toLang)) count++;
    });
    
    // Translate hub labels
    document.querySelectorAll('.hub-label, .hub-speed-label').forEach(label => {
      if (translateElement(label, toLang)) count++;
    });
    
    // Translate countdown
    const countdown = document.getElementById('cd');
    if (countdown) {
      const text = countdown.textContent.trim();
      const translated = translate(text, toLang);
      if (translated !== text) {
        countdown.textContent = translated;
        count++;
      }
    }
    
    // Translate Results header (inline styled div)
    const resultsHeader = document.querySelector('#resultsOverlay > div > div:first-child');
    if (resultsHeader) {
      const text = resultsHeader.textContent.trim();
      const translated = translate(text, toLang);
      if (translated !== text) {
        resultsHeader.textContent = translated;
        count++;
      }
    }
    
    // Translate Dev Mode header
    const devModeHeader = document.querySelector('#devModeControls > div:first-child');
    if (devModeHeader) {
      const text = devModeHeader.textContent.trim();
      const closeBtn = devModeHeader.querySelector('button');
      const textWithoutClose = text.replace('×', '').trim();
      const translated = translate(textWithoutClose, toLang);
      if (translated !== textWithoutClose) {
        devModeHeader.innerHTML = translated + (closeBtn ? closeBtn.outerHTML : '');
        count++;
      }
    }
    
    // Translate Dev Mode controls text (spans)
    document.querySelectorAll('#devModeControls span').forEach(span => {
      const text = span.textContent.trim();
      if (text && text !== '#1') { // Skip horse name
        const translated = translate(text, toLang);
        if (translated !== text) {
          span.textContent = translated;
          count++;
        }
      }
    });
    
    // Translate Dev Mode div content (controls list)
    document.querySelectorAll('#devModeControls > div > div > div').forEach(div => {
      const fullText = div.textContent.trim();
      // Extract text after emoji and dash
      const match = fullText.match(/^(.+?)\s*-\s*(.+)$/);
      if (match) {
        const prefix = match[1]; // e.g., "🔼 W/↑"
        const text = match[2];   // e.g., "Speed up"
        const translated = translate(text, toLang);
        if (translated !== text) {
          div.textContent = `${prefix} - ${translated}`;
          count++;
        }
      } else {
        // Try to translate whole text
        const translated = translate(fullText, toLang);
        if (translated !== fullText) {
          div.textContent = translated;
          count++;
        }
      }
    });
    
    // Translate tooltips (title attributes)
    document.querySelectorAll('[title]').forEach(el => {
      const title = el.getAttribute('title');
      const translated = translate(title, toLang);
      if (translated !== title) {
        el.setAttribute('title', translated);
        count++;
      }
    });
    
    // Translate hints (.hint class)
    document.querySelectorAll('.hint').forEach(hint => {
      if (translateElement(hint, toLang)) count++;
    });
    
    // Translate placeholder attributes
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) {
        const translated = translate(placeholder, toLang);
        if (translated !== placeholder) {
          el.setAttribute('placeholder', translated);
          count++;
        }
      }
    });
    
    // Translate chip text (Max: Current Count, etc.)
    document.querySelectorAll('.chip').forEach(chip => {
      const text = chip.textContent.trim();
      // Handle "Max: Current Count" format
      const parts = text.split(':').map(p => p.trim());
      if (parts.length === 2) {
        const translated1 = translate(parts[0], toLang);
        const translated2 = translate(parts[1], toLang);
        if (translated1 !== parts[0] || translated2 !== parts[1]) {
          chip.textContent = `${translated1}: ${translated2}`;
          count++;
        }
      }
    });
    
    // Translate small tags
    document.querySelectorAll('small').forEach(small => {
      const text = small.textContent.trim();
      if (text && !/^[\d\s\p{Emoji}]+$/u.test(text)) {
        const translated = translate(text, toLang);
        if (translated !== text) {
          small.textContent = translated;
          count++;
        }
      }
    });
    
    // Translate div text that contains inline text (like "▶ Đang phát:")
    document.querySelectorAll('div[style*="font-size"]').forEach(div => {
      const text = div.textContent.trim();
      // Skip if it has child elements that we already translated
      if (!div.querySelector('span, button, label, input') && text) {
        const match = text.match(/^([\p{Emoji}\s]*)(▶)?\s*(.+)$/u);
        if (match) {
          const prefix = (match[1] || '') + (match[2] || '');
          const content = match[3];
          const translated = translate(content, toLang);
          if (translated !== content) {
            div.textContent = prefix + ' ' + translated;
            count++;
          }
        }
      }
    });
    
    console.log(`[Smart i18n] Translated ${count} elements to ${toLang === 'vi' ? 'Vietnamese' : 'English'}`);
  }
  
  // Override i18n.setLanguage
  const originalSetLanguage = window.i18n?.setLanguage;
  if (originalSetLanguage) {
    window.i18n.setLanguage = function(lang) {
      originalSetLanguage.call(this, lang);
      setTimeout(() => translateUI(lang), 50);
    };
  }
  
  // Initial translation
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const currentLang = window.i18n?.getCurrentLang() || 'en';
      translateUI(currentLang);
    }, 300);
  });
  
  // Find untranslated text helper
  function findUntranslated() {
    const untranslated = [];
    const selectors = [
      'label', 'button', '.btn', '.section-title', '.panel-title', 
      '.group-title', '.category-header', 'option', '.hub-label', 
      '.chip', 'small', '.hint'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const text = el.textContent.trim();
        if (text && !/^[\d\s\p{Emoji}×]+$/u.test(text)) {
          const emojiMatch = text.match(/^([\p{Emoji}\s]+)/u);
          const prefix = emojiMatch ? emojiMatch[1] : '';
          const textWithoutEmoji = text.substring(prefix.length).trim();
          
          if (textWithoutEmoji && !dictionary[textWithoutEmoji] && !reverseDict[textWithoutEmoji]) {
            if (!untranslated.includes(textWithoutEmoji)) {
              untranslated.push(textWithoutEmoji);
            }
          }
        }
      });
    });
    
    // Check tooltips
    document.querySelectorAll('[title]').forEach(el => {
      const title = el.getAttribute('title');
      if (title && !dictionary[title] && !reverseDict[title]) {
        if (!untranslated.includes(title)) {
          untranslated.push(title);
        }
      }
    });
    
    // Check placeholders
    document.querySelectorAll('[placeholder]').forEach(el => {
      const placeholder = el.getAttribute('placeholder');
      if (placeholder && !dictionary[placeholder] && !reverseDict[placeholder]) {
        if (!untranslated.includes(placeholder)) {
          untranslated.push(placeholder);
        }
      }
    });
    
    console.log('🔍 Untranslated text found:', untranslated.length);
    console.table(untranslated);
    return untranslated;
  }
  
  // Expose
  window.smartI18n = {
    translate,
    translateUI,
    dictionary,
    reverseDict,
    findUntranslated,
    addTranslation: (en, vi) => { dictionary[en] = vi; reverseDict[vi] = en; }
  };
})();
