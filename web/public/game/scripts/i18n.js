/**
 * Internationalization (i18n) System
 * Supports: English (en), Vietnamese (vi)
 */

const translations = {
  en: {
    // Loading Screen
    loading_title: 'HORSE MAZE RACE',
    loading_subtitle: 'Ultimate Racing Experience',
    loading_initializing: 'Initializing...',
    loading_tip: '💡 Tip: Use RAM power-up to eliminate opponents!',
    
    // Game HUB
    hub_horses: 'Horses',
    hub_carrots: 'Carrots',
    hub_time: 'Time',
    hub_fps: 'FPS',
    hub_speed: '⚡ Speed',
    hub_playtest: 'Play Test',
    hub_editor: 'Editor',
    hub_stop: 'Stop',
    hub_restart: 'Restart',
    
    // Main Panel
    panel_map_editor: '🗺️ Map Editor',
    panel_mode: 'Mode',
    panel_draw: 'Draw',
    panel_erase: 'Erase',
    panel_partial_erase: 'Partial Erase',
    panel_select_move: 'Select/Move',
    panel_wall_type: 'Wall Type',
    panel_normal_wall: 'Normal',
    panel_ice_wall: 'Ice',
    panel_bouncy_wall: 'Bouncy',
    panel_solid_barrier: 'Solid Barrier',
    panel_brush_size: 'Brush Size',
    panel_eraser_size: 'Eraser Size',
    panel_snap_grid: 'Snap to Grid',
    panel_grid_size: 'Grid',
    panel_show_grid: 'Show Grid',
    panel_show_debug: 'Show Debug Info',
    
    // Horses Section
    section_horses: '🐴 Horses',
    horses_count: 'Horse Count',
    horses_radius: 'Horse Radius',
    horses_speed_base: 'Base Speed',
    horses_max_velocity: 'Max Velocity',
    horses_min_cruise: 'Min Cruise Speed',
    horses_collision_scale: 'Collision Scale',
    horses_collision_inset: 'Collision Inset',
    
    // Settings Panel
    section_settings: '⚙️ Settings',
    game_settings: '🎮 Game Settings',
    settings_hp_system: '❤️ Enable HP System',
    settings_max_hp: '💖 Horse Max HP',
    settings_show_hp: '🔢 Show HP Numbers',
    settings_show_speed: '⚡ Show Horse Speed',
    settings_auto_rotate: '🔄 Auto-Rotate Sprites',
    settings_last_horse: '👑 Last Horse Standing Wins',
    settings_wall_damage: '🧱 Wall Damage',
    settings_wall_damage_amount: '💥 Wall Damage Amount',
    settings_border_damage: '🚧 Border Damage',
    settings_border_damage_amount: '💥 Border Damage Amount',
    
    // Game Settings
    horses_count: '🐎 Horses (1-50)',
    game_speed: '⚡ Speed (0.1-5)',
    countdown: '⏱️ Countdown (s)',
    collision_sfx: '🔊 Collision SFX',
    trail_effect: '💨 Horse Trail Effect',
    name_size: '🔤 Name Size',
    horses_max_velocity: '🚀 Max Speed',
    
    // Background Music
    section_bgm: '🎵 Background Music',
    bgm_enable: 'Enable Music',
    bgm_change: 'Change Music:',
    bgm_controls: 'Controls:',
    bgm_test: 'Test',
    bgm_playing: '▶ Playing:',
    bgm_tts_voice: 'TTS Voice:',
    bgm_tts_enable: 'Enable TTS:',
    
    // Carrots Section
    section_carrots: '🥕 Carrots',
    carrots_active: 'Active Carrot',
    carrots_radius: 'Carrot Radius',
    carrots_add: '➕ Add Carrot',
    carrots_delete: '🗑️ Delete Carrot',
    carrots_clear: '🧹 Clear All',
    
    // Start/Finish
    section_start_finish: '🏁 Start & Finish Lines',
    start_line: 'Start Line',
    finish_line: 'Finish Line',
    
    // Obstacles
    section_obstacles: '🚧 Obstacles',
    obstacles_add_rect: '⬛ Add Rectangle',
    obstacles_add_circle: '⚫ Add Circle',
    obstacles_add_pipe: '🔀 Add Pipe',
    obstacles_delete: '🗑️ Delete Selected',
    obstacles_clear: '🧹 Clear All',
    
    // Power-ups
    section_powerups: '⚡ Power-ups',
    powerup_boost: 'Boost',
    powerup_turbo: 'Turbo',
    powerup_teleport: 'Teleport',
    powerup_ghost: 'Ghost',
    powerup_trap: 'Trap',
    powerup_freeze: 'Freeze',
    powerup_magnet: 'Magnet',
    powerup_poison: 'Poison',
    powerup_lightning: 'Lightning',
    powerup_ram: 'RAM',
    powerup_ice: 'Ice',
    
    // Weather
    section_weather: '🌦️ Weather System',
    weather_enable: 'Enable Weather',
    weather_type: 'Weather Type',
    weather_clear: 'Clear',
    weather_rain: 'Rain',
    weather_wind: 'Wind',
    weather_snow: 'Snow',
    weather_storm: 'Storm',
    weather_intensity: 'Intensity',
    weather_wind_direction: 'Wind Direction',
    
    // Fans
    section_fans: '💨 Fans',
    fans_add: '➕ Add Fan',
    fans_delete: '🗑️ Delete Selected',
    fans_clear: '🧹 Clear All',
    
    // Tornadoes
    section_tornadoes: '🌪️ Tornadoes',
    tornado_add: '➕ Add Tornado',
    tornado_delete: '🗑️ Delete Selected',
    tornado_clear: '🧹 Clear All',
    
    // Bumpers
    section_bumpers: '🛡️ Bumpers',
    bumper_add: '➕ Add Bumper',
    bumper_delete: '🗑️ Delete Selected',
    bumper_clear: '🧹 Clear All',
    
    // Carrot Sprite
    section_carrot_sprite: '🥕 Carrot Sprite',
    sprite_png: 'PNG File',
    sprite_clear: '🗑️ Clear Sprite',
    sprite_scale: 'Scale',
    sprite_auto_rotate: 'Auto Rotate',
    sprite_outline: 'Outline',
    sprite_outline_color: 'Outline Color',
    sprite_outline_width: 'Outline Width',
    sprite_on: 'On',
    sprite_off: 'Off',
    
    // Horse Customization
    section_horse_custom: '🐴 Horse Customization',
    horse_select: 'Select Horse #',
    horse_name: 'Display Name',
    horse_skill: 'Special Skill',
    horse_skill_none: 'None',
    horse_skill_hunter: "Hunter's Gambit",
    horse_skill_guardian: 'Divine Guardian',
    horse_skill_phantom: 'Phantom Strike',
    horse_skill_cosmic: 'Cosmic Swap',
    horse_skill_lightning: 'Chain Lightning',
    horse_skill_gravity: 'Gravity Well',
    horse_skill_chill: 'Chill Guy',
    horse_skill_overdrive: 'Overdrive',
    horse_skill_slipstream: 'Slipstream',
    horse_skill_shockwave: 'Shockwave',
    horse_skill_oguri_fat: 'Oguri Fat',
    horse_body_color: 'Body Color',
    horse_label_color: 'Label Color',
    horse_sprite_png: 'PNG Sprite',
    horse_sprite_presets: '📚 Sprite Presets…',
    horse_carrot_png: 'Carrot PNG',
    horse_sprite_scale: 'Sprite Scale',
    horse_auto_rotate: 'Auto Rotate',
    horse_auto_rotate_note: '(Use Global Setting)',
    horse_outline: 'Outline',
    horse_outline_color: 'Outline Color',
    horse_outline_width: 'Outline Width',
    
    // Action Groups
    actions_current_horse: '🎯 Current Horse',
    actions_all_horses: '🌐 All Horses',
    actions_duplicate: '📋 Duplicate',
    actions_delete: '🗑️ Delete',
    actions_random_color: '🎨 Random Color',
    actions_random_position: '🎲 Random Position',
    actions_random_skill: '⚡ Random Skill',
    actions_random_sprite: '🖼️ Random Sprite',
    actions_copy_to_all: '📢 Copy to All',
    actions_random_colors_all: '🎨 Random Colors',
    actions_random_positions_all: '🎲 Random Positions',
    actions_random_skills_all: '⚡ Random Skills',
    actions_random_sprites_all: '🖼️ Random Sprites',
    actions_clear_all_sprites: '🧹 Clear All Sprites',
    actions_clear_all_skills: '⚠️ Clear All Skills',
    
    // Map Management
    section_map_management: '💾 Map Management',
    map_export_json: '📤 Export JSON',
    map_import_json: '📥 Import JSON',
    map_export_image: '🖼️ Export as Image',
    map_new: '🆕 New Map',
    map_presets: '📚 Map Presets',
    
    // Sprite Picker Modal
    modal_sprite_presets: 'Sprite Presets',
    modal_import_pngs: '➕ Import PNGs…',
    modal_import_folder: '📂 Import Folder…',
    modal_tip: 'Tip: You can also use built-ins below',
    modal_close: '✖',
    
    // Common
    common_max: 'Max',
    common_current_count: 'Current Count',
    common_cancel: 'Cancel',
    common_ok: 'OK',
    common_apply: 'Apply',
    common_save: 'Save',
    common_load: 'Load',
    common_delete: 'Delete',
    common_clear: 'Clear',
    
    // Messages & Tooltips
    tooltip_playtest: 'Play Test (F1)',
    tooltip_editor: 'Open Map Editor',
    tooltip_stop: 'Stop Game',
    tooltip_restart: 'Restart Game',
    tooltip_hp_system: 'Enable HP combat system',
    tooltip_show_hp: 'Display HP Values',
    tooltip_show_speed: 'Display velocity below horses',
    tooltip_auto_rotate: 'Rotate horse sprites based on movement direction',
    tooltip_last_horse: 'Win by elimination instead of finish line',
    tooltip_wall_damage: 'Wall Collision Damage',
    tooltip_border_damage: 'Border Collision Damage',
  },
  
  vi: {
    // Loading Screen
    loading_title: 'ĐUA NGỰA MÊ CUNG',
    loading_subtitle: 'Trải Nghiệm Đua Xe Tối Thượng',
    loading_initializing: 'Đang khởi tạo...',
    loading_tip: '💡 Mẹo: Dùng sức mạnh RAM để loại bỏ đối thủ!',
    
    // Game HUB
    hub_horses: 'Ngựa',
    hub_carrots: 'Cà rốt',
    hub_time: 'Thời gian',
    hub_fps: 'FPS',
    hub_speed: '⚡ Tốc độ',
    hub_playtest: 'Chạy thử',
    hub_editor: 'Editor',
    hub_stop: 'Dừng',
    hub_restart: 'Khởi động lại',
    
    // Main Panel
    panel_map_editor: '🗺️ Trình Chỉnh Sửa Map',
    panel_mode: 'Chế độ',
    panel_draw: 'Vẽ',
    panel_erase: 'Xóa',
    panel_partial_erase: 'Xóa Một Phần',
    panel_select_move: 'Chọn/Di Chuyển',
    panel_wall_type: 'Loại Tường',
    panel_normal_wall: 'Bình thường',
    panel_ice_wall: 'Băng',
    panel_bouncy_wall: 'Nảy',
    panel_solid_barrier: 'Rào Cản Cứng',
    panel_brush_size: 'Kích Thước Bút',
    panel_eraser_size: 'Kích Thước Tẩy',
    panel_snap_grid: 'Dính Lưới',
    panel_grid_size: 'Lưới',
    panel_show_grid: 'Hiện Lưới',
    panel_show_debug: 'Hiện Thông Tin Debug',
    
    // Horses Section
    section_horses: '🐴 Ngựa',
    horses_count: 'Số Lượng Ngựa',
    horses_radius: 'Bán Kính Ngựa',
    horses_speed_base: 'Tốc Độ Cơ Bản',
    horses_max_velocity: 'Tốc Độ Tối Đa',
    horses_min_cruise: 'Tốc Độ Tối Thiểu',
    horses_collision_scale: 'Tỷ Lệ Va Chạm',
    horses_collision_inset: 'Độ Lệch Va Chạm',
    
    // Settings Panel
    section_settings: '⚙️ Cài Đặt',
    game_settings: '🎮 Cài Đặt Game',
    settings_hp_system: '❤️ Bật Hệ Thống HP',
    settings_max_hp: '💖 HP Tối Đa Ngựa',
    settings_show_hp: '🔢 Hiện Số HP',
    settings_show_speed: '⚡ Hiện Tốc Độ Ngựa',
    settings_auto_rotate: '🔄 Tự Động Xoay Sprite',
    settings_last_horse: '👑 Ngựa Cuối Thắng',
    settings_wall_damage: '🧱 Sát Thương Tường',
    settings_wall_damage_amount: '💥 Lượng Sát Thương Tường',
    settings_border_damage: '🚧 Sát Thương Viền',
    settings_border_damage_amount: '💥 Lượng Sát Thương Viền',
    
    // Game Settings
    horses_count: '🐎 Số Ngựa (1-50)',
    game_speed: '⚡ Tốc Độ (0.1-5)',
    countdown: '⏱️ Đếm Ngược (s)',
    collision_sfx: '🔊 Âm Thanh Va Chạm',
    trail_effect: '💨 Hiệu Ứng Đuôi Ngựa',
    name_size: '🔤 Kích Thước Tên',
    horses_max_velocity: '🚀 Tốc Độ Tối Đa',
    
    // Background Music
    section_bgm: '🎵 Nhạc Nền',
    bgm_enable: 'Bật nhạc nền',
    bgm_change: 'Đổi nhạc:',
    bgm_controls: 'Điều khiển:',
    bgm_test: 'Test',
    bgm_playing: '▶ Đang phát:',
    bgm_tts_voice: 'Giọng TTS:',
    bgm_tts_enable: 'Bật TTS:',
    
    // Carrots Section
    section_carrots: '🥕 Cà Rốt',
    carrots_active: 'Cà Rốt Hiện Tại',
    carrots_radius: 'Bán Kính Cà Rốt',
    carrots_add: '➕ Thêm Cà Rốt',
    carrots_delete: '🗑️ Xóa Cà Rốt',
    carrots_clear: '🧹 Xóa Tất Cả',
    
    // Start/Finish
    section_start_finish: '🏁 Vạch Xuất Phát & Đích',
    start_line: 'Vạch Xuất Phát',
    finish_line: 'Vạch Đích',
    
    // Obstacles
    section_obstacles: '🚧 Chướng Ngại Vật',
    obstacles_add_rect: '⬛ Thêm Hình Chữ Nhật',
    obstacles_add_circle: '⚫ Thêm Hình Tròn',
    obstacles_add_pipe: '🔀 Thêm Ống Dẫn',
    obstacles_delete: '🗑️ Xóa Đã Chọn',
    obstacles_clear: '🧹 Xóa Tất Cả',
    
    // Power-ups
    section_powerups: '⚡ Vật Phẩm Tăng Sức',
    powerup_boost: 'Tăng Tốc',
    powerup_turbo: 'Turbo',
    powerup_shield: 'Khiên',
    powerup_teleport: 'Dịch Chuyển',
    powerup_ghost: 'Ma',
    powerup_trap: 'Bẫy',
    powerup_freeze: 'Đóng Băng',
    powerup_magnet: 'Nam Châm',
    powerup_poison: 'Độc',
    powerup_lightning: 'Sét',
    powerup_ram: 'RAM',
    powerup_ice: 'Băng',
    
    // Weather
    section_weather: '🌦️ Hệ Thống Thời Tiết',
    weather_enable: 'Bật Thời Tiết',
    weather_type: 'Loại Thời Tiết',
    weather_clear: 'Quang Đãng',
    weather_rain: 'Mưa',
    weather_wind: 'Gió',
    weather_snow: 'Tuyết',
    weather_storm: 'Bão',
    weather_intensity: 'Cường Độ',
    weather_wind_direction: 'Hướng Gió',
    
    // Fans
    section_fans: '💨 Quạt',
    fans_add: '➕ Thêm Quạt',
    fans_delete: '🗑️ Xóa Đã Chọn',
    fans_clear: '🧹 Xóa Tất Cả',
    
    // Tornadoes
    section_tornadoes: '🌪️ Lốc Xoáy',
    tornado_add: '➕ Thêm Lốc Xoáy',
    tornado_delete: '🗑️ Xóa Đã Chọn',
    tornado_clear: '🧹 Xóa Tất Cả',
    
    // Bumpers
    section_bumpers: '🛡️ Đệm Va Chạm',
    bumper_add: '➕ Thêm Đệm',
    bumper_delete: '🗑️ Xóa Đã Chọn',
    bumper_clear: '🧹 Xóa Tất Cả',
    
    // Carrot Sprite
    section_carrot_sprite: '🥕 Sprite Cà Rốt',
    sprite_png: 'File PNG',
    sprite_clear: '🗑️ Xóa Sprite',
    sprite_scale: 'Tỷ Lệ',
    sprite_auto_rotate: 'Tự Động Xoay',
    sprite_outline: 'Viền',
    sprite_outline_color: 'Màu Viền',
    sprite_outline_width: 'Độ Dày Viền',
    sprite_on: 'Bật',
    sprite_off: 'Tắt',
    
    // Horse Customization
    section_horse_custom: '🐴 Tùy Chỉnh Ngựa',
    horse_select: 'Chọn Ngựa #',
    horse_name: 'Tên Hiển Thị',
    horse_skill: 'Kỹ Năng Đặc Biệt',
    horse_skill_none: 'Không có',
    horse_skill_hunter: 'Ván Cược Thợ Săn',
    horse_skill_guardian: 'Người Bảo Vệ Thần Thánh',
    horse_skill_phantom: 'Đòn Tàng Hình',
    horse_skill_cosmic: 'Hoán Đổi Vũ Trụ',
    horse_skill_lightning: 'Sét Dây Chuyền',
    horse_skill_gravity: 'Giếng Trọng Lực',
    horse_skill_chill: 'Anh Trai Thư Giãn',
    horse_skill_overdrive: 'Quá Tải',
    horse_skill_slipstream: 'Dòng Trượt',
    horse_skill_shockwave: 'Sóng Xung Kích',
    horse_body_color: 'Màu Thân',
    horse_label_color: 'Màu Nhãn',
    horse_sprite_png: 'PNG Sprite',
    horse_sprite_presets: '📚 Sprite Có Sẵn…',
    horse_carrot_png: 'PNG Cà Rốt',
    horse_sprite_scale: 'Tỷ Lệ Sprite',
    horse_auto_rotate: 'Tự Động Xoay',
    horse_auto_rotate_note: '(Dùng Cài Đặt Toàn Cục)',
    horse_outline: 'Viền',
    horse_outline_color: 'Màu Viền',
    horse_outline_width: 'Độ Dày Viền',
    
    // Action Groups
    actions_current_horse: '🎯 Ngựa Hiện Tại',
    actions_all_horses: '🌐 Tất Cả Ngựa',
    actions_duplicate: '📋 Nhân Bản',
    actions_delete: '🗑️ Xóa',
    actions_random_color: '🎨 Màu Ngẫu Nhiên',
    actions_random_position: '🎲 Vị Trí Ngẫu Nhiên',
    actions_random_skill: '⚡ Kỹ Năng Ngẫu Nhiên',
    actions_random_sprite: '🖼️ Sprite Ngẫu Nhiên',
    actions_copy_to_all: '📢 Sao Chép Sang Tất Cả',
    actions_random_colors_all: '🎨 Màu Ngẫu Nhiên',
    actions_random_positions_all: '🎲 Vị Trí Ngẫu Nhiên',
    actions_random_skills_all: '⚡ Kỹ Năng Ngẫu Nhiên',
    actions_random_sprites_all: '🖼️ Sprite Ngẫu Nhiên',
    actions_clear_all_sprites: '🧹 Xóa Tất Cả Sprite',
    actions_clear_all_skills: '⚠️ Xóa Tất Cả Kỹ Năng',
    
    // Map Management
    section_map_management: '💾 Quản Lý Map',
    map_export_json: '📤 Xuất JSON',
    map_import_json: '📥 Nhập JSON',
    map_export_image: '🖼️ Xuất Hình Ảnh',
    map_new: '🆕 Map Mới',
    map_presets: '📚 Map Có Sẵn',
    
    // Sprite Picker Modal
    modal_sprite_presets: 'Sprite Có Sẵn',
    modal_import_pngs: '➕ Nhập PNG…',
    modal_import_folder: '📂 Nhập Thư Mục…',
    modal_tip: 'Mẹo: Bạn cũng có thể dùng sprite có sẵn bên dưới',
    modal_close: '✖',
    
    // Common
    common_max: 'Tối đa',
    common_current_count: 'Số Hiện Tại',
    common_cancel: 'Hủy',
    common_ok: 'OK',
    common_apply: 'Áp Dụng',
    common_save: 'Lưu',
    common_load: 'Tải',
    common_delete: 'Xóa',
    common_clear: 'Xóa',
    
    // Messages & Tooltips
    tooltip_playtest: 'Chạy thử (F1)',
    tooltip_editor: 'Mở Trình Chỉnh Sửa Map',
    tooltip_stop: 'Dừng Game',
    tooltip_restart: 'Khởi Động Lại Game',
    tooltip_hp_system: 'Bật hệ thống chiến đấu HP',
    tooltip_show_hp: 'Hiển thị giá trị HP',
    tooltip_show_speed: 'Hiển thị vận tốc bên dưới ngựa',
    tooltip_auto_rotate: 'Xoay sprite ngựa theo hướng di chuyển',
    tooltip_last_horse: 'Thắng bằng cách loại bỏ thay vì đường đích',
    tooltip_wall_damage: 'Sát thương va chạm tường',
    tooltip_border_damage: 'Sát thương va chạm viền',
  }
};

// Current language
let currentLang = localStorage.getItem('gameLang') || 'en';

// Translation function
function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

// Change language
function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language '${lang}' not supported, using English`);
    lang = 'en';
  }
  currentLang = lang;
  localStorage.setItem('gameLang', lang);
  updateUI();
  console.log(`[i18n] Language changed to: ${lang === 'en' ? 'English' : 'Tiếng Việt'}`);
}

// Update all UI text
function updateUI() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    
    // Update based on element type
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
      el.value = text;
    } else if (el.tagName === 'OPTION') {
      el.textContent = text;
    } else if (el.hasAttribute('data-i18n-placeholder')) {
      el.placeholder = text;
    } else if (el.hasAttribute('data-i18n-title')) {
      el.title = text;
    } else {
      // For other elements, try to preserve HTML structure
      if (el.querySelector('span, small, em, strong')) {
        // Has child elements, be careful
        const firstText = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        if (firstText) {
          firstText.textContent = text;
        }
      } else {
        el.textContent = text;
      }
    }
  });
  
  // Update HTML lang attribute
  document.documentElement.lang = currentLang;
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  updateUI();
  
  // Wire up language selector
  const langSelector = document.getElementById('languageSelector');
  if (langSelector) {
    // Set initial value
    langSelector.value = currentLang;
    
    // Add change listener
    langSelector.addEventListener('change', () => {
      setLanguage(langSelector.value);
    });
  }
});

// Expose to window
window.i18n = {
  t,
  setLanguage,
  getCurrentLang: () => currentLang,
  updateUI,
  translations
};
