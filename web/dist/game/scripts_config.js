// scripts/config.js
/**
 * Centralized configuration for the Horse Maze Game
 * This file contains all magic numbers, constants, and configuration values
 * to make the codebase more maintainable and AI-friendly.
 */

/**
 * @typedef {Object} GameConfig
 * @property {RenderConfig} render - Rendering configuration
 * @property {PhysicsConfig} physics - Physics and movement configuration
 * @property {UIConfig} ui - User interface configuration
 * @property {PowerUpConfig} powerUps - Power-up configuration
 * @property {AudioConfig} audio - Audio configuration
 */

/**
 * @typedef {Object} RenderConfig
 * @property {Object} canvas - Canvas settings
 * @property {Object} colors - Color definitions
 * @property {Object} fonts - Font settings
 * @property {Object} effects - Visual effects settings
 */

/**
 * @typedef {Object} PhysicsConfig
 * @property {Object} horse - Horse physics
 * @property {Object} collision - Collision detection
 * @property {Object} movement - Movement parameters
 */

/**
 * @typedef {Object} PowerUpConfig
 * @property {Object} boost - Boost power-up settings
 * @property {Object} turbo - Turbo power-up settings
 * @property {Object} teleport - Teleport power-up settings
 * @property {Object} magnet - Magnet power-up settings
 * @property {Object} timeFreeze - Time freeze power-up settings
 * @property {Object} ghost - Ghost power-up settings
 * @property {Object} trap - Trap power-up settings
 * @property {Object} ram - Ram power-up settings
 * @property {Object} shield - Shield power-up settings
 */

/** @type {GameConfig} */
const CONFIG = {
  // Rendering Configuration
  render: {
    canvas: {
      defaultWidth: 800,
      defaultHeight: 600,
      backgroundColor: '#f5f5dc', // beige
      gridColor: 'rgba(0,0,0,0.1)',
      gridSize: 20
    },
    
    colors: {
      // Horse colors
      horseDefault: '#8B4513',
      horseOutline: '#654321',
      horseSelected: '#FF6B35',
      
      // UI colors
      buttonPrimary: '#4CAF50',
      buttonSecondary: '#2196F3',
      buttonDanger: '#f44336',
      textPrimary: '#333333',
      textSecondary: '#666666',
      
      // Map elements
      wall: '#8B4513',
      wallOutline: '#654321',
      finish: '#FFD700',
      finishOutline: '#FFA500'
    },
    
    fonts: {
      primary: 'Arial, sans-serif',
      monospace: 'Courier New, monospace',
      emoji: '"Segoe UI Emoji","Segoe UI Symbol",system-ui,sans-serif',
      sizes: {
        small: 12,
        medium: 16,
        large: 20,
        xlarge: 24
      }
    },
    
    effects: {
      glowIntensity: 0.7,
      shadowBlur: 4,
      shadowOffset: 2,
      animationDuration: 300,
      fadeInDuration: 200,
      fadeOutDuration: 150
    }
  },

  // Physics Configuration
  physics: {
    horse: {
      defaultRadius: 8,
      maxSpeed: 4,
      acceleration: 0.3,
      friction: 0.85,
      bounceDamping: 0.7
    },
    
    collision: {
      wallBounce: 0.8,
      horseBounce: 0.6,
      detectionBuffer: 2,
      minSeparation: 1,
      preventSpeedChange: false  // Ngăn chặn thay đổi tốc độ khi va chạm (ngựa, tường, vật thể)
    },
    
    movement: {
      keyboardSensitivity: 1.0,
      mouseSensitivity: 0.8,
      smoothingFactor: 0.1,
      deadZone: 0.1
    }
  },

  // User Interface Configuration
  ui: {
    toolbar: {
      height: 60,
      backgroundColor: '#f0f0f0',
      borderColor: '#ccc',
      buttonSpacing: 10,
      buttonSize: 40
    },
    
    editor: {
      selectionColor: 'rgba(0, 123, 255, 0.3)',
      selectionBorder: '#007bff',
      gridSnap: true,
      snapTolerance: 10,
      showCoordinates: true
    },
    
    game: {
      hudHeight: 80,
      timerPosition: { x: 10, y: 30 },
      speedometerPosition: { x: 200, y: 30 },
      leaderboardWidth: 200
    }
  },

  // Power-Up Configuration
  powerUps: {
    boost: {
      radius: 16,
      color: '#ffeb3b',
      outlineColor: 'rgba(255,255,255,0.3)',
      emoji: '🌟',
      duration: 3000,
      speedMultiplier: 1.5,
      glowColor: 'rgb(255,235,59)',
      glowAlpha: 0.7
    },
    
    turbo: {
      radius: 16,
      color: 'rgb(255,112,67)',
      outlineColor: 'white',
      emoji: '💫',
      duration: 2000,
      speedMultiplier: 2.0,
      glowColor: 'rgb(255,112,67)',
      glowAlpha: 0.8
    },
    
    teleport: {
      radius: 16,
      color: '#00bcd4',
      outlineColor: 'white',
      emoji: '🌊',
      cooldown: 1000,
      range: 100,
      glowColor: '#00bcd4',
      glowAlpha: 1.0
    },
    
    magnet: {
      radius: 16,
      color: '#ffeb3b',
      outlineColor: 'white',
      emoji: '🔗',
      duration: 5000,
      attractionRadius: 50,
      attractionForce: 0.2,
      glowColor: '#ffeb3b',
      glowAlpha: 0.7
    },
    
    timeFreeze: {
      radius: 16,
      color: '#e1f5fe',
      outlineColor: '#0277bd',
      emoji: '☃️',
      duration: 3000,
      slowdownFactor: 0.3,
      glowColor: '#e1f5fe',
      glowAlpha: 1.0
    },
    
    ghost: {
      radius: 16,
      color: 'rgba(137, 207, 240, 0.5)',
      outlineColor: 'rgba(255,255,255,0.25)',
      emoji: '👻',
      duration: 4000,
      phaseOpacity: 0.5,
      glowColor: 'rgba(137, 207, 240, 0.3)',
      glowAlpha: 0.6
    },
    
    trap: {
      radius: 16,
      color: 'rgba(173, 216, 230, 0.6)',
      outlineColor: 'rgba(255,255,255,0.25)',
      emoji: '🔷',
      duration: 2000,
      slowdownFactor: 0.1,
      glowColor: 'rgba(173, 216, 230, 0.4)',
      glowAlpha: 0.8
    },
    
    ram: {
      radius: 16,
      color: '#f44336',
      outlineColor: 'rgba(255,255,255,0.28)',
      emoji: '💥',
      knockbackForce: 8,
      stunDuration: 1000,
      glowColor: '#f44336',
      glowAlpha: 0.9
    },
    
    shield: {
      radius: 16,
      color: '#03A9F4',
      outlineColor: 'rgba(255,255,255,0.28)',
      emoji: '🛡️',
      duration: 6000,
      absorptionCapacity: 3,
      glowColor: '#03A9F4',
      glowAlpha: 0.8
    },
    
    warpzone: {
      radius: 16,
      color: '#9C27B0',
      outlineColor: 'rgba(255,255,255,0.5)',
      emoji: '🌌',
      duration: 0, // Permanent portal
      range: 200,
      cooldown: 500,
      glowColor: '#9C27B0',
      glowAlpha: 0.8
    },
    
    quantumdash: {
      radius: 16,
      color: '#00BCD4',
      outlineColor: 'rgba(255,255,255,0.5)',
      emoji: '🔮',
      duration: 2500,
      speedMultiplier: 3.0,
      phaseEnabled: true,
      glowColor: '#00BCD4',
      glowAlpha: 0.9
    }
  },

  // Audio Configuration
  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    
    sounds: {
      powerUpCollect: { file: 'powerup.wav', volume: 0.6 },
      horseCollision: { file: 'collision.wav', volume: 0.4 },
      raceStart: { file: 'start.wav', volume: 0.8 },
      raceFinish: { file: 'finish.wav', volume: 0.9 },
      buttonClick: { file: 'click.wav', volume: 0.3 }
    }
  },

  // Game Modes
  modes: {
    editor: {
      name: 'editor',
      allowPowerUps: true,
      showGrid: true,
      enableSnapping: true,
      showDebugInfo: true
    },
    
    play: {
      name: 'play',
      allowPowerUps: true,
      showGrid: false,
      enableSnapping: false,
      showDebugInfo: false
    },
    
    race: {
      name: 'race',
      allowPowerUps: true,
      showGrid: false,
      enableSnapping: false,
      showDebugInfo: false,
      enableTimer: true,
      enableLeaderboard: true
    }
  },

  // Editor Configuration
  editor: {
    tools: {
      brush: { name: 'brush', icon: '🖌️', hotkey: 'B' },
      wall: { name: 'wall', icon: '🧱', hotkey: 'W' },
      boost: { name: 'boost', icon: '🔆', hotkey: '1' },
      turbo: { name: 'turbo', icon: '🚀', hotkey: '2' },
      teleport: { name: 'teleport', icon: '〰️', hotkey: '3' },
      magnet: { name: 'magnet', icon: '💎', hotkey: '4' },
      timeFreeze: { name: 'timeFreeze', icon: '💎', hotkey: '5' },
      ghost: { name: 'ghost', icon: '👻', hotkey: '6' },
      trap: { name: 'trap', icon: '🕳️', hotkey: '7' },
      ram: { name: 'ram', icon: '💥', hotkey: '8' },
      shield: { name: 'shield', icon: '🛡️', hotkey: '9' },
      warpzone: { name: 'warpzone', icon: '🌌', hotkey: '0' },
      quantumdash: { name: 'quantumdash', icon: '🔮', hotkey: 'Q' }
    },
    
    defaultBrushSize: 8,
    minBrushSize: 4,
    maxBrushSize: 32,
    brushSizeStep: 2
  },

  // Performance Configuration
  performance: {
    targetFPS: 60,
    maxParticles: 100,
    cullingDistance: 1000,
    lodDistance: 500,
    enableVSync: true,
    enableOptimizations: true
  },

  // Debug Configuration
  debug: {
    showFPS: false,
    showCollisionBoxes: false,
    showVelocityVectors: false,
    showPerformanceMetrics: false,
    enableConsoleLogging: true,
    logLevel: 'info' // 'debug', 'info', 'warn', 'error'
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
