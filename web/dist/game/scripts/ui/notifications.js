/**
 * Notification System
 * Manages game notifications with horse name colorization
 */

// Notification elements (will be initialized on DOMContentLoaded)
let notificationBar, notificationText, notificationIcon, notificationClose;
let topNotification, topNotificationText;
let notificationTimeout;

/**
 * Get dynamic horse colors from current game state
 * @returns {object} Map of horse names to colors
 */
function getHorseColors() {
  const colors = {};
  const horseList = (typeof horses !== 'undefined' && Array.isArray(horses)) ? horses : [];
  
  for (const h of horseList) {
    if (h && h.name) {
      // Use actual horse body color or fallback
      colors[h.name.toLowerCase()] = h.colorBody || h.bodyColor || h.fill || h.color || '#607D8B';
    }
  }
  
  // Fallback static colors for common names
  const fallbackColors = {
    'blue': '#4A90E2', 'red': '#E74C3C', 'grey': '#95A5A6', 'green': '#27AE60',
    'yellow': '#F1C40F', 'purple': '#8E44AD', 'orange': '#E67E22', 'pink': '#E91E63',
    'cyan': '#1ABC9C', 'brown': '#8D6E63', 'lime': '#CDDC39', 'indigo': '#3F51B5',
    'teal': '#009688', 'amber': '#FFC107', 'deep_orange': '#FF5722', 'light_blue': '#03A9F4',
    'light_green': '#8BC34A', 'deep_purple': '#673AB7', 'black': '#2C3E50'
  };
  
  return { ...fallbackColors, ...colors };
}

/**
 * Colorize horse names in text (backward compatibility)
 * @param {string} text 
 * @returns {string}
 */
function colorizeHorseNames(text) {
  // Logic moved to showNotification, kept for compatibility
  return text;
}

/**
 * Show notification in bottom bar with horse name colorization
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error, game)
 * @param {number} duration - Auto-hide duration (0 = no auto-hide)
 */
function showNotification(message, type = 'info', duration = 5000) {
  if (!notificationBar || !notificationText || !notificationIcon) {
    return;
  }
  
  // Clear existing timeout - disabled to keep notification always visible
  // if (notificationTimeout) clearTimeout(notificationTimeout);
  
  // Set icon based on type
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    game: '🎮'
  };
  
  notificationIcon.textContent = icons[type] || icons.info;
  
  // Clear and rebuild notification text with proper DOM elements
  notificationText.innerHTML = '';
  
  // Split message and create elements with dynamic horse colors
  let remainingText = message;
  const horseColors = getHorseColors();
  let foundMatch = false;
  
  // Try to match actual horse names first
  Object.keys(horseColors).forEach(horseName => {
    if (foundMatch) return;
    
    const regex = new RegExp(`\\b${horseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(remainingText)) {
      const parts = remainingText.split(regex);
      const matches = remainingText.match(regex) || [];
      
      notificationText.innerHTML = '';
      
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          const textNode = document.createTextNode(parts[i]);
          notificationText.appendChild(textNode);
        }
        
        if (matches[i]) {
          const badge = document.createElement('span');
          badge.className = 'horse-badge';
          badge.style.backgroundColor = horseColors[horseName.toLowerCase()];
          badge.style.color = 'white';
          badge.style.padding = '3px 8px';
          badge.style.borderRadius = '12px';
          badge.style.fontSize = '11px';
          badge.style.fontWeight = '600';
          badge.style.marginLeft = '2px';
          badge.style.marginRight = '2px';
          badge.style.display = 'inline-block';
          badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
          
          // Add colored dot
          const dot = document.createElement('span');
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.backgroundColor = horseColors[horseName.toLowerCase()];
          dot.style.border = '1px solid white';
          dot.style.display = 'inline-block';
          dot.style.marginRight = '4px';
          
          badge.appendChild(dot);
          badge.appendChild(document.createTextNode(matches[i]));
          notificationText.appendChild(badge);
        }
      }
      foundMatch = true;
      return;
    }
  });
  
  // If no horse names found, just set text normally
  if (!foundMatch) {
    if (notificationText.innerHTML === '') {
      notificationText.textContent = message;
    }
  }
  
  // Show notification - force display
  notificationBar.classList.remove('hidden');
  notificationBar.style.display = 'flex';
  notificationBar.style.opacity = '1';
  notificationBar.style.transform = 'translateY(0)';
  
  // Auto-hide disabled - keep notification always visible
  // if (duration > 0) {
  //   notificationTimeout = setTimeout(() => {
  //     notificationBar.classList.add('hidden');
  //   }, duration);
  // }
}

/**
 * Show top notification with horse name colorization
 * @param {string} message - Notification message
 * @param {number} duration - Auto-hide duration
 */
function showTopNotificationWithHorseColor(message, duration = 4000) {
  const topNotificationText = document.getElementById('notificationText');
  if (!topNotification || !topNotificationText) return;
  
  // Clear existing timeout
  // if (notificationTimeout) clearTimeout(notificationTimeout);
  
  // Clear previous content
  topNotificationText.innerHTML = '';
  
  // Try to colorize horse names
  let colored = false;
  try {
    const deaccent = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const textSoft = deaccent(message).toLowerCase();
    const list = (typeof horses !== 'undefined' && Array.isArray(horses)) ? horses : (Array.isArray(window.horses) ? window.horses : []);
    
    if (list.length) {
      for (const h of list) {
        if (!h || !h.name) continue;
        const name = String(h.name);
        const nameSoft = deaccent(name).toLowerCase();
        const idxSoft = textSoft.indexOf(nameSoft);
        
        if (idxSoft >= 0) {
          const idx = idxSoft;
          const matchedText = message.substr(idx, name.length);
          
          // Build: [before] [badge(name with color)] [after]
          const before = document.createTextNode(message.slice(0, idx));
          const after = document.createTextNode(message.slice(idx + matchedText.length));
          
          const badge = document.createElement('span');
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '4px';
          badge.style.padding = '2px 6px';
          badge.style.borderRadius = '999px';
          badge.style.background = (h.colorBody || '#666');
          badge.style.color = '#fff';
          badge.style.border = '1px solid rgba(255,255,255,.4)';
          badge.style.fontWeight = '600';
          badge.style.fontSize = '11px';
          
          const dot = document.createElement('span');
          dot.style.display = 'inline-block';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.background = (h.colorLabel || h.colorBody || '#fff');
          dot.style.border = '1px solid rgba(255,255,255,.6)';
          
          const nm = document.createElement('span');
          nm.textContent = matchedText;
          
          badge.appendChild(dot);
          badge.appendChild(nm);
          
          topNotificationText.appendChild(before);
          topNotificationText.appendChild(badge);
          topNotificationText.appendChild(after);
          colored = true;
          break;
        }
      }
    }
  } catch(e) {}
  
  if (!colored) {
    topNotificationText.textContent = message;
  }
  
  // Show notification
  topNotification.classList.add('show');
  
  // Auto-hide
  if (duration > 0) {
    notificationTimeout = setTimeout(() => {
      topNotification.classList.remove('show');
    }, duration);
  }
}

/**
 * Initialize notification system
 */
function initNotificationSystem() {
  // Get notification elements from DOMCache or document
  notificationBar = (typeof DOMCache !== 'undefined' && DOMCache.elements) 
    ? (DOMCache.elements.notificationBar || document.getElementById('notificationBar'))
    : document.getElementById('notificationBar');
    
  notificationText = (typeof DOMCache !== 'undefined' && DOMCache.elements)
    ? (DOMCache.elements.gameNotificationText || document.getElementById('gameNotificationText'))
    : document.getElementById('gameNotificationText');
    
  notificationIcon = (typeof DOMCache !== 'undefined' && DOMCache.elements)
    ? (DOMCache.elements.notificationIcon || document.getElementById('notificationIcon'))
    : document.getElementById('notificationIcon');
    
  notificationClose = document.getElementById('notificationClose');
  topNotification = document.getElementById('topNotification');
  
  // Close notification handler - Disabled to keep notification always visible
  // notificationClose?.addEventListener('click', () => {
  //   notificationBar?.classList.add('hidden');
  // });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initNotificationSystem);

// Export to global scope
if (typeof window !== 'undefined') {
  window.NotificationSystem = {
    show: showNotification,
    showTop: showTopNotificationWithHorseColor,
    getHorseColors,
    colorizeHorseNames
  };
  
  // Backward compatibility
  window.showNotification = showNotification;
  window.showTopNotificationWithHorseColor = showTopNotificationWithHorseColor;
  window.getHorseColors = getHorseColors;
  window.colorizeHorseNames = colorizeHorseNames;
}
