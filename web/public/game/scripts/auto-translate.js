/**
 * Auto-translate existing UI text
 * Maps Vietnamese → English based on common patterns
 */

(function() {
  // Text mapping: Current text → {english, vietnamese, i18nKey}
  const textMappings = {
    // Game HUB
    'Ngựa': { en: 'Horses', vi: 'Ngựa', key: 'hub_horses' },
    'Horses': { en: 'Horses', vi: 'Ngựa', key: 'hub_horses' },
    'Cà rốt': { en: 'Carrots', vi: 'Cà rốt', key: 'hub_carrots' },
    'Carrots': { en: 'Carrots', vi: 'Cà rốt', key: 'hub_carrots' },
    'Thời gian': { en: 'Time', vi: 'Thời gian', key: 'hub_time' },
    'Time': { en: 'Time', vi: 'Thời gian', key: 'hub_time' },
    '⚡ Tốc độ': { en: '⚡ Speed', vi: '⚡ Tốc độ', key: 'hub_speed' },
    '⚡ Speed': { en: '⚡ Speed', vi: '⚡ Tốc độ', key: 'hub_speed' },
    'Chạy thử': { en: 'Play Test', vi: 'Chạy thử', key: 'hub_playtest' },
    'Play Test': { en: 'Play Test', vi: 'Chạy thử', key: 'hub_playtest' },
    'Editor': { en: 'Editor', vi: 'Editor', key: 'hub_editor' },
    'Dừng': { en: 'Stop', vi: 'Dừng', key: 'hub_stop' },
    'Stop': { en: 'Stop', vi: 'Dừng', key: 'hub_stop' },
    'Khởi động lại': { en: 'Restart', vi: 'Khởi động lại', key: 'hub_restart' },
    'Restart': { en: 'Restart', vi: 'Khởi động lại', key: 'hub_restart' },
    
    // Settings - Match exactly what's in HTML
    '❤️ Enable HP System': { en: '❤️ Enable HP System', vi: '❤️ Bật Hệ Thống HP', key: 'settings_hp_system' },
    '💖 Horse Max HP': { en: '💖 Horse Max HP', vi: '💖 HP Tối Đa', key: 'settings_max_hp' },
    '🔢 Show HP Numbers': { en: '🔢 Show HP Numbers', vi: '🔢 Hiện Số HP', key: 'settings_show_hp' },
    '⚡ Show Horse Speed': { en: '⚡ Show Horse Speed', vi: '⚡ Hiện Tốc Độ Ngựa', key: 'settings_show_speed' },
    '🔄 Auto-Rotate Sprites': { en: '🔄 Auto-Rotate Sprites', vi: '🔄 Tự Động Xoay Sprite', key: 'settings_auto_rotate' },
    '👑 Last Horse Standing Wins': { en: '👑 Last Horse Standing Wins', vi: '👑 Ngựa Cuối Thắng', key: 'settings_last_horse' },
    '🧱 Wall Damage': { en: '🧱 Wall Damage', vi: '🧱 Sát Thương Tường', key: 'settings_wall_damage' },
    '💥 Wall Damage Amount': { en: '💥 Wall Damage Amount', vi: '💥 Lượng Sát Thương Tường', key: 'settings_wall_damage_amount' },
    '🚧 Border Damage': { en: '🚧 Border Damage', vi: '🚧 Sát Thương Viền', key: 'settings_border_damage' },
    '💥 Border Damage Amount': { en: '💥 Border Damage Amount', vi: '💥 Lượng Sát Thương Viền', key: 'settings_border_damage_amount' },
    
    // Game Settings
    '🐎 Horses (1-50)': { en: '🐎 Horses (1-50)', vi: '🐎 Số Ngựa (1-50)', key: 'horses_count' },
    '⚡ Speed (0.1-5)': { en: '⚡ Speed (0.1-5)', vi: '⚡ Tốc Độ (0.1-5)', key: 'game_speed' },
    '⏱️ Countdown (s)': { en: '⏱️ Countdown (s)', vi: '⏱️ Đếm Ngược (s)', key: 'countdown' },
    '🔊 Collision SFX': { en: '🔊 Collision SFX', vi: '🔊 Âm Thanh Va Chạm', key: 'collision_sfx' },
    '💨 Horse Trail Effect': { en: '💨 Horse Trail Effect', vi: '💨 Hiệu Ứng Đuôi Ngựa', key: 'trail_effect' },
    '🎯 Horse Radius': { en: '🎯 Horse Radius', vi: '🎯 Bán Kính Ngựa', key: 'horses_radius' },
    '⚡ Base Speed': { en: '⚡ Base Speed', vi: '⚡ Tốc Độ Cơ Bản', key: 'horses_speed_base' },
    '🔤 Name Size': { en: '🔤 Name Size', vi: '🔤 Kích Thước Tên', key: 'name_size' },
    '🚀 Max Speed': { en: '🚀 Max Speed', vi: '🚀 Tốc Độ Tối Đa', key: 'horses_max_velocity' },
    'Dừng': { en: 'Stop', vi: 'Dừng', key: 'hub_stop' },
    
    // Sections
    '🗺️ Trình Chỉnh Sửa Map': { en: '🗺️ Map Editor', vi: '🗺️ Trình Chỉnh Sửa Map', key: 'panel_map_editor' },
    '🗺️ Map Editor': { en: '🗺️ Map Editor', vi: '🗺️ Trình Chỉnh Sửa Map', key: 'panel_map_editor' },
    '🐴 Ngựa': { en: '🐴 Horses', vi: '🐴 Ngựa', key: 'section_horses' },
    '🐴 Horses': { en: '🐴 Horses', vi: '🐴 Ngựa', key: 'section_horses' },
    '⚙️ Settings': { en: '⚙️ Settings', vi: '⚙️ Cài Đặt', key: 'section_settings' },
    '⚙️ Cài Đặt': { en: '⚙️ Settings', vi: '⚙️ Cài Đặt', key: 'section_settings' },
    '🎮 Game Settings': { en: '🎮 Game Settings', vi: '🎮 Cài Đặt Game', key: 'game_settings' },
    '🎮 Cài Đặt Game': { en: '🎮 Game Settings', vi: '🎮 Cài Đặt Game', key: 'game_settings' },
    '🎵 Nhạc Nền': { en: '🎵 Background Music', vi: '🎵 Nhạc Nền', key: 'section_bgm' },
    '🎵 Background Music': { en: '🎵 Background Music', vi: '🎵 Nhạc Nền', key: 'section_bgm' },
    '🥕 Cà Rốt': { en: '🥕 Carrots', vi: '🥕 Cà Rốt', key: 'section_carrots' },
    '🥕 Carrots': { en: '🥕 Carrots', vi: '🥕 Cà Rốt', key: 'section_carrots' },
    '🏁 Vạch Xuất Phát & Đích': { en: '🏁 Start & Finish Lines', vi: '🏁 Vạch Xuất Phát & Đích', key: 'section_start_finish' },
    '🏁 Start & Finish Lines': { en: '🏁 Start & Finish Lines', vi: '🏁 Vạch Xuất Phát & Đích', key: 'section_start_finish' },
    '🚧 Chướng Ngại Vật': { en: '🚧 Obstacles', vi: '🚧 Chướng Ngại Vật', key: 'section_obstacles' },
    '🚧 Obstacles': { en: '🚧 Obstacles', vi: '🚧 Chướng Ngại Vật', key: 'section_obstacles' },
    '⚡ Vật Phẩm Tăng Sức': { en: '⚡ Power-ups', vi: '⚡ Vật Phẩm Tăng Sức', key: 'section_powerups' },
    '⚡ Power-ups': { en: '⚡ Power-ups', vi: '⚡ Vật Phẩm Tăng Sức', key: 'section_powerups' },
    '🌦️ Hệ Thống Thời Tiết': { en: '🌦️ Weather System', vi: '🌦️ Hệ Thống Thời Tiết', key: 'section_weather' },
    '🌦️ Weather System': { en: '🌦️ Weather System', vi: '🌦️ Hệ Thống Thời Tiết', key: 'section_weather' },
    '💨 Quạt': { en: '💨 Fans', vi: '💨 Quạt', key: 'section_fans' },
    '💨 Fans': { en: '💨 Fans', vi: '💨 Quạt', key: 'section_fans' },
    '🌪️ Lốc Xoáy': { en: '🌪️ Tornadoes', vi: '🌪️ Lốc Xoáy', key: 'section_tornadoes' },
    '🌪️ Tornadoes': { en: '🌪️ Tornadoes', vi: '🌪️ Lốc Xoáy', key: 'section_tornadoes' },
    '🛡️ Đệm Va Chạm': { en: '🛡️ Bumpers', vi: '🛡️ Đệm Va Chạm', key: 'section_bumpers' },
    '🛡️ Bumpers': { en: '🛡️ Bumpers', vi: '🛡️ Đệm Va Chạm', key: 'section_bumpers' },
    '🥕 Sprite Cà Rốt': { en: '🥕 Carrot Sprite', vi: '🥕 Sprite Cà Rốt', key: 'section_carrot_sprite' },
    '🥕 Carrot Sprite': { en: '🥕 Carrot Sprite', vi: '🥕 Sprite Cà Rốt', key: 'section_carrot_sprite' },
    '🐴 Tùy Chỉnh Ngựa': { en: '🐴 Horse Customization', vi: '🐴 Tùy Chỉnh Ngựa', key: 'section_horse_custom' },
    '🐴 Horse Customization': { en: '🐴 Horse Customization', vi: '🐴 Tùy Chỉnh Ngựa', key: 'section_horse_custom' },
    '💾 Quản Lý Map': { en: '💾 Map Management', vi: '💾 Quản Lý Map', key: 'section_map_management' },
    '💾 Map Management': { en: '💾 Map Management', vi: '💾 Quản Lý Map', key: 'section_map_management' },
    
    // Common Labels
    'Bật nhạc nền': { en: 'Enable Music', vi: 'Bật nhạc nền', key: 'bgm_enable' },
    'Enable Music': { en: 'Enable Music', vi: 'Bật nhạc nền', key: 'bgm_enable' },
    'Đổi nhạc:': { en: 'Change Music:', vi: 'Đổi nhạc:', key: 'bgm_change' },
    'Change Music:': { en: 'Change Music:', vi: 'Đổi nhạc:', key: 'bgm_change' },
    'Điều khiển:': { en: 'Controls:', vi: 'Điều khiển:', key: 'bgm_controls' },
    'Controls:': { en: 'Controls:', vi: 'Điều khiển:', key: 'bgm_controls' },
    '▶ Đang phát:': { en: '▶ Playing:', vi: '▶ Đang phát:', key: 'bgm_playing' },
    '▶ Playing:': { en: '▶ Playing:', vi: '▶ Đang phát:', key: 'bgm_playing' },
    'Giọng TTS:': { en: 'TTS Voice:', vi: 'Giọng TTS:', key: 'bgm_tts_voice' },
    'TTS Voice:': { en: 'TTS Voice:', vi: 'Giọng TTS:', key: 'bgm_tts_voice' },
    'Bật TTS:': { en: 'Enable TTS:', vi: 'Bật TTS:', key: 'bgm_tts_enable' },
    'Enable TTS:': { en: 'Enable TTS:', vi: 'Bật TTS:', key: 'bgm_tts_enable' },
  };
  
  function autoTranslate() {
    const currentLang = window.i18n?.getCurrentLang() || 'en';
    console.log('[Auto-Translate] Current language:', currentLang);
    
    let count = 0;
    
    // Scan all labels
    document.querySelectorAll('label').forEach(label => {
      const text = label.textContent.trim();
      const mapping = textMappings[text];
      
      if (mapping) {
        // Add data-i18n attribute
        label.setAttribute('data-i18n', mapping.key);
        count++;
      }
    });
    
    // Scan section/panel titles
    document.querySelectorAll('.section-title, .panel-title, .group-title').forEach(title => {
      const text = title.textContent.trim();
      const mapping = textMappings[text];
      
      if (mapping) {
        title.setAttribute('data-i18n', mapping.key);
        count++;
      }
    });
    
    // Scan button text
    document.querySelectorAll('.btn-text').forEach(btn => {
      const text = btn.textContent.trim();
      const mapping = textMappings[text];
      
      if (mapping) {
        btn.setAttribute('data-i18n', mapping.key);
        count++;
      }
    });
    
    // Scan hub labels
    document.querySelectorAll('.hub-label').forEach(label => {
      const text = label.textContent.trim();
      const mapping = textMappings[text];
      
      if (mapping) {
        label.setAttribute('data-i18n', mapping.key);
        count++;
      }
    });
    
    console.log('[Auto-Translate] Applied data-i18n to', count, 'elements');
    
    // Force update UI after adding attributes
    if (window.i18n && window.i18n.updateUI) {
      console.log('[Auto-Translate] Triggering UI update...');
      window.i18n.updateUI();
    }
  }
  
  // Run after i18n loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(autoTranslate, 200);
    });
  } else {
    setTimeout(autoTranslate, 200);
  }
  
  // Expose autoTranslate globally for manual re-run
  window.autoTranslate = autoTranslate;
})();
