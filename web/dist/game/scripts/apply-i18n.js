/**
 * Auto-apply i18n to existing UI elements
 * Run this once after page load to add data-i18n attributes
 */

function autoApplyI18n() {
  const mappings = [
    // Game HUB
    { selector: '.hub-label', text: 'Ngựa', key: 'hub_horses' },
    { selector: '.hub-label', text: 'Cà rốt', key: 'hub_carrots' },
    { selector: '.hub-label', text: 'Thời gian', key: 'hub_time' },
    { selector: '#hudPlayTest .btn-text', text: 'Chạy thử', key: 'hub_playtest' },
    { selector: '#openEditorBtn .btn-text', text: 'Editor', key: 'hub_editor' },
    { selector: '#hudStop .btn-text', text: 'Dừng', key: 'hub_stop' },
    { selector: '#hudRestart .btn-text', text: 'Khởi động lại', key: 'hub_restart' },
    
    // Section titles
    { selector: '.section-title', text: '🗺️ Trình Chỉnh Sửa Map', key: 'panel_map_editor' },
    { selector: '.section-title', text: '🐴 Ngựa', key: 'section_horses' },
    { selector: '.section-title', text: '⚙️ Cài Đặt', key: 'section_settings' },
    { selector: '.panel-title', text: '🎵 Nhạc Nền', key: 'section_bgm' },
    { selector: '.section-title', text: '🥕 Cà Rốt', key: 'section_carrots' },
    { selector: '.section-title', text: '🏁 Vạch Xuất Phát & Đích', key: 'section_start_finish' },
    { selector: '.section-title', text: '🚧 Chướng Ngại Vật', key: 'section_obstacles' },
    { selector: '.section-title', text: '⚡ Vật Phẩm Tăng Sức', key: 'section_powerups' },
    { selector: '.section-title', text: '🌦️ Hệ Thống Thời Tiết', key: 'section_weather' },
    { selector: '.section-title', text: '💨 Quạt', key: 'section_fans' },
    { selector: '.section-title', text: '🌪️ Lốc Xoáy', key: 'section_tornadoes' },
    { selector: '.section-title', text: '🛡️ Đệm Va Chạm', key: 'section_bumpers' },
    { selector: '.section-title', text: '🥕 Sprite Cà Rốt', key: 'section_carrot_sprite' },
    { selector: '.section-title', text: '🐴 Tùy Chỉnh Ngựa', key: 'section_horse_custom' },
    { selector: '.section-title', text: '💾 Quản Lý Map', key: 'section_map_management' },
  ];
  
  // Apply mappings
  mappings.forEach(({ selector, text, key }) => {
    const elements = Array.from(document.querySelectorAll(selector));
    elements.forEach(el => {
      if (el.textContent.includes(text)) {
        el.setAttribute('data-i18n', key);
      }
    });
  });
  
  console.log('[i18n] Auto-applied data-i18n attributes to', mappings.length, 'element types');
}

// Run after DOM loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoApplyI18n);
} else {
  autoApplyI18n();
}
