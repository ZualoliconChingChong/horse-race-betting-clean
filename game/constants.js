// Expose power-up type definitions for reuse across modules
// Keeping values identical to inlined version in index.html
(function () {
  if (typeof window === 'undefined') return;
  if (window.POWERUP_TYPES) return; // do not overwrite if already defined
  window.POWERUP_TYPES = {
    boost: { name: 'Boost', r: 15, color: '#ffd54f' },
    ghost: { name: 'Ghost', r: 15, color: '#9c27b0' },
    trap: { name: 'Trap', r: 15, color: '#f44336' },
    ram: { name: 'Ram', r: 15, color: '#ff5722' },
    turbo: { name: 'Turbo', r: 15, color: '#ff7043' },
    shield: { name: 'Shield', r: 15, color: '#80cbc4' },
    teleport: { name: 'Teleport', r: 18, color: '#00bcd4' },
    magnet: { name: 'Magnet', r: 20, color: '#ffeb3b' },
    timefreeze: { name: 'Time Freeze', r: 16, color: '#e1f5fe' },
  };
})();
