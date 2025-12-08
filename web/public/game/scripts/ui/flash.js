/**
 * Flash Notification System
 * Displays temporary overlay messages (e.g., for hotkey feedback)
 */

/**
 * Show flash notification at top center of screen
 * @param {string} text - Message to display
 * @param {number} duration - Display duration in ms (default 700ms)
 */
function showFlash(text, duration = 700) {
  try {
    let el = document.getElementById('hotkeyFlash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hotkeyFlash';
      el.style.position = 'fixed';
      el.style.top = '12px';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(0,0,0,0.65)';
      el.style.color = '#fff';
      el.style.padding = '6px 10px';
      el.style.borderRadius = '8px';
      el.style.font = '600 14px system-ui, Arial';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
      el.style.transition = 'opacity 160ms ease';
      el.style.zIndex = '9999';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { 
      el.style.opacity = '0'; 
    }, duration);
  } catch(e) {
    console.error('Flash notification error:', e);
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.FlashSystem = {
    show: showFlash
  };
  
  // Backward compatibility
  window.showFlash = showFlash;
}
