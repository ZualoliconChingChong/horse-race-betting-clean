/**
 * Game Constants
 * Centralized configuration values to replace magic numbers
 */

const GAME_CONSTANTS = {
  // Performance
  MAX_FPS: 60,
  MIN_FRAME_TIME: 33, // ~30 FPS minimum
  
  // Game Settings
  MAX_HORSES: 50,
  DEFAULT_COUNTDOWN: 5,
  CHEER_COUNTDOWN_THRESHOLD: 3,
  
  // Physics
  DEFAULT_SPEED: 1.0,
  MIN_SPEED: 0.1,
  MAX_SPEED: 10.0,
  
  // Collision
  HORSE_SELECTION_PADDING: 12,
  COLLISION_EPSILON: 0.01,
  
  // UI
  NOTIFICATION_LIMIT: 2, // Show max 2 notifications
  HUD_UPDATE_INTERVAL: 1000, // Update FPS every 1 second
  
  // Animation
  SLOW_PULSE_SPEED: 0.0015,
  FAST_PULSE_SPEED: 0.003,
  ULTRA_PULSE_SPEED: 0.005,
  
  // Power-ups (default values)
  POWERUP_DEFAULT_RADIUS: 16,
  BOOST_SPEED_MULTIPLIER: 2.5,
  TURBO_SPEED_MULTIPLIER: 3.0,
  SHIELD_DURATION: 5000, // ms
  
  // Damage
  RAM_DAMAGE: 20,
  NEBULA_DAMAGE: 20,
  PHANTOM_STRIKE_REDUCTION: 0.5,
  
  // Editor
  SNAP_GRID_SIZE: 10,
  DEFAULT_WALL_WIDTH: 20,
  DEFAULT_WALL_HEIGHT: 100,
  
  // Canvas
  DEFAULT_CANVAS_WIDTH: 1400,
  DEFAULT_CANVAS_HEIGHT: 900,
  
  // Colors
  DEFAULT_WALL_COLOR: '#8e44ad',
  DEFAULT_GATE_COLOR: '#f39c12',
  DEFAULT_START_LINE_COLOR: '#27ae60',
  
  // Fonts
  EMOJI_FONT: '"Segoe UI Emoji Flat","Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji",system-ui,sans-serif',
  PRIMARY_FONT: 'Arial, sans-serif',
  
  // Storage
  LOCALSTORAGE_KEY: 'horseMazeMap',
  
  // Timing
  GO_ANIMATION_DURATION: 350, // ms
  FLASH_DURATION: 1000, // ms
  PARTICLE_LIFETIME: 1000, // ms
};

// Freeze to prevent modifications
if (typeof Object.freeze === 'function') {
  Object.freeze(GAME_CONSTANTS);
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.GAME_CONSTANTS = GAME_CONSTANTS;
}

// Also create shorter alias
if (typeof window !== 'undefined') {
  window.CONST = GAME_CONSTANTS;
}
