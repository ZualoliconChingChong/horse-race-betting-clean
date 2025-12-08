/**
 * Editor Theme System
 * Manages visual themes for editor and HUB elements
 */

// Theme definitions
const editorThemes = {
  professional: {
    bg: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    btnBg: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
    hubBg: 'rgba(44, 62, 80, 0.95)',
    hubAccent: '#3498db',
    notificationBg: 'rgba(52, 73, 94, 0.95)'
  },
  modern: {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    btnBg: 'linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)',
    hubBg: 'rgba(26, 26, 46, 0.95)',
    hubAccent: '#9b59b6',
    notificationBg: 'rgba(22, 33, 62, 0.95)'
  },
  warm: {
    bg: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    btnBg: 'linear-gradient(135deg, #11998e 0%, #2d1b69 100%)',
    hubBg: 'rgba(45, 27, 105, 0.95)',
    hubAccent: '#f39c12',
    notificationBg: 'rgba(17, 153, 142, 0.95)'
  },
  gaming: {
    bg: 'linear-gradient(135deg, #0f3460 0%, #e94560 100%)',
    btnBg: 'linear-gradient(135deg, #e94560 0%, #0f3460 100%)',
    hubBg: 'rgba(15, 52, 96, 0.95)',
    hubAccent: '#e74c3c',
    notificationBg: 'rgba(233, 69, 96, 0.95)'
  }
};

let currentTheme = 'professional';

/**
 * Set editor theme
 * @param {string} themeName - Theme name (professional, modern, warm, gaming)
 */
function setEditorTheme(themeName) {
  if (!editorThemes[themeName]) return;
  
  const theme = editorThemes[themeName];
  const root = document.documentElement;
  
  // Editor theme variables
  root.style.setProperty('--editor-bg', theme.bg);
  root.style.setProperty('--editor-btn-bg', theme.btnBg);
  
  // HUB theme variables
  root.style.setProperty('--hub-bg', theme.hubBg);
  root.style.setProperty('--hub-accent', theme.hubAccent);
  root.style.setProperty('--notification-bg', theme.notificationBg);
  
  // Apply theme to HUBs
  applyHubTheme(theme);
  
  // Update active theme button
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`theme${themeName.charAt(0).toUpperCase() + themeName.slice(1)}`);
  if (activeBtn) activeBtn.classList.add('active');
  
  currentTheme = themeName;
  
  // Save to localStorage
  try {
    localStorage.setItem('editorTheme', themeName);
  } catch {}
  
  // Trigger HUD repositioning to ensure proper styling
  try {
    if (typeof requestHudReposition === 'function') requestHudReposition();
  } catch {}
}

/**
 * Apply theme to HUB elements
 * @param {object} theme - Theme object with colors
 */
function applyHubTheme(theme) {
  const gameHub = document.getElementById('gameHub');
  const notificationBar = document.getElementById('notificationBar');
  
  if (gameHub) {
    gameHub.style.background = theme.hubBg;
    gameHub.style.border = 'none';
    
    // Update text color based on theme
    const hubItems = gameHub.querySelectorAll('.hub-item');
    const isLightTheme = currentTheme === 'light';
    hubItems.forEach(item => {
      item.style.color = isLightTheme ? '#333333' : '#ffffff';
      item.style.textShadow = isLightTheme ? '0 1px 2px rgba(255,255,255,0.8)' : '0 1px 2px rgba(0,0,0,0.8)';
    });
    
    // Update hub icons and accents
    const hubIcons = gameHub.querySelectorAll('.hub-icon');
    hubIcons.forEach(icon => {
      icon.style.color = theme.hubAccent;
    });
    
    // Update slider accents
    const sliders = gameHub.querySelectorAll('.speed-val, .slider-val');
    sliders.forEach(slider => {
      slider.style.background = theme.hubAccent;
    });
    
    const thumbs = gameHub.querySelectorAll('.speed-thumb, .slider-thumb');
    thumbs.forEach(thumb => {
      thumb.style.borderColor = theme.hubAccent;
    });
  }
  
  if (notificationBar) {
    notificationBar.style.background = theme.notificationBg;
    notificationBar.style.borderBottom = `1px solid ${theme.hubAccent}`;
    const isLightTheme = currentTheme === 'light';
    notificationBar.style.color = isLightTheme ? '#333333' : '#ffffff';
    notificationBar.style.textShadow = isLightTheme ? '0 1px 2px rgba(255,255,255,0.8)' : '0 1px 2px rgba(0,0,0,0.8)';
  }
}

/**
 * Get current theme name
 * @returns {string}
 */
function getCurrentTheme() {
  return currentTheme;
}

/**
 * Get theme object by name
 * @param {string} themeName 
 * @returns {object|null}
 */
function getTheme(themeName) {
  return editorThemes[themeName] || null;
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  try {
    const savedTheme = localStorage.getItem('editorTheme');
    if (savedTheme && editorThemes[savedTheme]) {
      setEditorTheme(savedTheme);
    } else {
      // Apply default theme to HUBs
      setEditorTheme('professional');
    }
  } catch {}
});

// Export to global scope
if (typeof window !== 'undefined') {
  window.ThemeSystem = {
    setTheme: setEditorTheme,
    applyHubTheme,
    getCurrentTheme,
    getTheme,
    themes: editorThemes
  };
  
  // Backward compatibility
  window.setEditorTheme = setEditorTheme;
  window.editorThemes = editorThemes;
  window.currentTheme = currentTheme;
}
