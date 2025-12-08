// scripts/game-logic.js
/**
 * Core Game Logic for Horse Maze Game
 * Extracted from index.html for better maintainability and AI-friendly structure
 * 
 * This module contains all core game mechanics including:
 * - Horse movement and physics
 * - Collision detection
 * - Power-up effects
 * - Game state management
 * - Race logic
 */

(function() {
  'use strict';

  // Import configuration if available
  const config = window.CONFIG || {};

  /**
   * @typedef {Object} Horse
   * @property {number} x - X position
   * @property {number} y - Y position
   * @property {number} vx - X velocity
   * @property {number} vy - Y velocity
   * @property {number} r - Radius
   * @property {string} color - Horse color
   * @property {boolean} eliminated - Whether horse is eliminated
   * @property {Object} effects - Active power-up effects
   * @property {number} lapTime - Current lap time
   * @property {number} bestTime - Best lap time
   */

  /**
   * @typedef {Object} PowerUp
   * @property {number} x - X position
   * @property {number} y - Y position
   * @property {number} r - Radius
   * @property {string} type - Power-up type
   * @property {number} duration - Effect duration
   * @property {boolean} collected - Whether collected
   */

  /**
   * Game Logic namespace
   */
  const GameLogic = {

    /**
     * Initialize game logic with references to game state
     * @param {Object} gameState - Reference to game state
     * @param {Object} renderModule - Reference to render module
     */
    initialize(gameState, renderModule) {
      this.gameState = gameState;
      this.renderModule = renderModule;
      this.lastUpdateTime = performance.now();
      
      console.log('[GameLogic] Initialized');
    },

    /**
     * Update game state for one frame
     * @param {number} deltaTime - Time elapsed since last update (ms)
     */
    update(deltaTime) {
      if (!this.gameState || !this.gameState.running) return;

      try {
        this.updateHorses(deltaTime);
        this.updatePowerUps(deltaTime);
        this.checkCollisions();
        this.updateEffects(deltaTime);
        this.checkRaceConditions();
      } catch (error) {
        console.error('[GameLogic] Update error:', error);
      }
    },

    /**
     * Update horse positions and physics
     * @param {number} deltaTime - Time elapsed since last update (ms)
     */
    updateHorses(deltaTime) {
      const horses = this.gameState.horses || [];
      const walls = this.gameState.mapDef?.walls || [];
      const dt = deltaTime / 16.67; // Normalize to 60fps

      horses.forEach(horse => {
        if (horse.eliminated) return;

        // Apply input forces
        this.applyHorseInput(horse, dt);

        // Apply power-up effects
        this.applyPowerUpEffects(horse, dt);

        // Update velocity with friction
        const friction = config.physics?.horse?.friction || 0.85;
        horse.vx *= friction;
        horse.vy *= friction;

        // Limit maximum speed
        const maxSpeed = (config.physics?.horse?.maxSpeed || 4) * (horse.speedMultiplier || 1);
        const speed = Math.sqrt(horse.vx * horse.vx + horse.vy * horse.vy);
        if (speed > maxSpeed) {
          horse.vx = (horse.vx / speed) * maxSpeed;
          horse.vy = (horse.vy / speed) * maxSpeed;
        }

        // Update position
        horse.x += horse.vx * dt;
        horse.y += horse.vy * dt;

        // Check wall collisions
        this.checkWallCollisions(horse, walls);

        // Update lap time
        if (this.gameState.mode === 'race') {
          horse.lapTime += deltaTime;
        }
      });
    },

    /**
     * Apply input forces to horse
     * @param {Horse} horse - Horse object
     * @param {number} dt - Delta time multiplier
     */
    applyHorseInput(horse, dt) {
      // Use UI speed setting if available, otherwise fall back to config
      const baseSpeed = window.runtimeSpeed || config.physics?.horse?.speed || config.physics?.horse?.baseSpeed || 1;
      
      // Debug logging to verify speed setting
      if (Math.random() < 0.01) { // Only log occasionally
        console.log(`🎯 Speed Check: window.runtimeSpeed=${window.runtimeSpeed}, baseSpeed=${baseSpeed}, maxSpeed=${config.physics?.horse?.maxSpeed || 4}`);
      }
      const acceleration = config.physics?.horse?.acceleration || 0.15; // Reduced for smoother control
      const keys = this.gameState.keys || {};
      
      // Target velocity based on input and configured base speed
      let targetVx = 0;
      let targetVy = 0;

      // Calculate target velocity based on input
      if (keys['ArrowUp'] || keys['KeyW']) {
        targetVy -= baseSpeed;
      }
      if (keys['ArrowDown'] || keys['KeyS']) {
        targetVy += baseSpeed;
      }
      if (keys['ArrowLeft'] || keys['KeyA']) {
        targetVx -= baseSpeed;
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        targetVx += baseSpeed;
      }
      
      // Smooth acceleration towards target velocity
      horse.vx += (targetVx - horse.vx) * acceleration * dt;
      horse.vy += (targetVy - horse.vy) * acceleration * dt;

      // Mouse/touch input (if enabled)
      if (this.gameState.mouseControl && this.gameState.mousePos) {
        const dx = this.gameState.mousePos.x - horse.x;
        const dy = this.gameState.mousePos.y - horse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
          const force = Math.min(distance / 100, 1) * acceleration;
          horse.vx += (dx / distance) * force * dt;
          horse.vy += (dy / distance) * force * dt;
        }
      }
    },

    /**
     * Apply active power-up effects to horse
     * @param {Horse} horse - Horse object
     * @param {number} dt - Delta time multiplier
     */
    applyPowerUpEffects(horse, dt) {
      if (!horse.effects) return;

      // Speed boost effects
      if (horse.effects.boost) {
        horse.speedMultiplier = config.powerUps?.boost?.speedMultiplier || 1.5;
      } else if (horse.effects.turbo) {
        horse.speedMultiplier = config.powerUps?.turbo?.speedMultiplier || 2.0;
      } else {
        horse.speedMultiplier = 1.0;
      }

      // Ghost effect (phase through walls)
      horse.canPhase = !!horse.effects.ghost;

      // Shield effect
      horse.hasShield = !!horse.effects.shield;

      // Ram aura effect (deadly to other horses)
      horse.hasRamAura = !!horse.effects.ramAura;
      if (horse.effects.ramAura) {
        horse.ramAuraRadius = horse.effects.ramAura.radius;
        console.log('Setting Ram aura on horse:', horse.name, 'radius:', horse.ramAuraRadius);
      }

      // Time freeze effect (slow down other horses)
      if (horse.effects.timeFreeze) {
        // This affects other horses, handled in main update loop
      }

      // Magnet effect (attract power-ups)
      if (horse.effects.magnet) {
        this.applyMagnetEffect(horse);
      }
    },

    /**
     * Apply magnet effect to attract nearby power-ups
     * @param {Horse} horse - Horse with magnet effect
     */
    applyMagnetEffect(horse) {
      const powerUps = [
        ...(this.gameState.liveBoosts || []),
        ...(this.gameState.liveTurbos || []),
        ...(this.gameState.liveTeleports || []),
        ...(this.gameState.liveMagnets || []),
        ...(this.gameState.liveTimeFreezes || []),
        ...(this.gameState.liveGhosts || []),
        ...(this.gameState.liveShields || [])
      ];

      const attractionRadius = config.powerUps?.magnet?.attractionRadius || 50;
      const attractionForce = config.powerUps?.magnet?.attractionForce || 0.2;

      powerUps.forEach(powerUp => {
        const dx = horse.x - powerUp.x;
        const dy = horse.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < attractionRadius && distance > 0) {
          const force = attractionForce * (1 - distance / attractionRadius);
          powerUp.x += (dx / distance) * force;
          powerUp.y += (dy / distance) * force;
        }
      });
    },

    /**
     * Check wall collisions for a horse
     * @param {Horse} horse - Horse object
     * @param {Array} walls - Array of wall objects
     */
    checkWallCollisions(horse, walls) {
      if (horse.canPhase) return; // Ghost effect allows phasing through walls

      const canvas = document.getElementById('canvas');
      if (!canvas) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const bounce = config.physics?.collision?.wallBounce || 0.8;

      // Check collision speed change prevention setting
      const preventSpeedChange = config.physics?.collision?.preventSpeedChange || false;
      
      // Canvas boundary collisions
      if (horse.x - horse.r < 0) {
        horse.x = horse.r;
        if (!preventSpeedChange) {
          horse.vx = Math.abs(horse.vx) * bounce;
        } else {
          // Preserve speed mode: just flip direction
          horse.vx = Math.abs(horse.vx);
        }
      }
      if (horse.x + horse.r > canvasWidth) {
        horse.x = canvasWidth - horse.r;
        if (!preventSpeedChange) {
          horse.vx = -Math.abs(horse.vx) * bounce;
        } else {
          // Preserve speed mode: just flip direction
          horse.vx = -Math.abs(horse.vx);
        }
      }
      if (horse.y - horse.r < 0) {
        horse.y = horse.r;
        if (!preventSpeedChange) {
          horse.vy = Math.abs(horse.vy) * bounce;
        } else {
          // Preserve speed mode: just flip direction
          horse.vy = Math.abs(horse.vy);
        }
      }
      if (horse.y + horse.r > canvasHeight) {
        horse.y = canvasHeight - horse.r;
        if (!preventSpeedChange) {
          horse.vy = -Math.abs(horse.vy) * bounce;
        } else {
          // Preserve speed mode: just flip direction
          horse.vy = -Math.abs(horse.vy);
        }
      }

      // Wall collisions
      walls.forEach(wall => {
        if (this.circleRectCollision(horse, wall)) {
          this.resolveWallCollision(horse, wall, bounce);
        }
      });
    },

    /**
     * Check if circle collides with rectangle
     * @param {Object} circle - Circle object with x, y, r
     * @param {Object} rect - Rectangle object with x, y, w, h
     * @returns {boolean} True if collision detected
     */
    circleRectCollision(circle, rect) {
      const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
      const dx = circle.x - closestX;
      const dy = circle.y - closestY;
      return (dx * dx + dy * dy) < (circle.r * circle.r);
    },

    /**
     * Resolve collision between horse and wall
     * @param {Horse} horse - Horse object
     * @param {Object} wall - Wall object
     * @param {number} bounce - Bounce factor
     */
    resolveWallCollision(horse, wall, bounce) {
      // Find closest point on wall to horse
      const closestX = Math.max(wall.x, Math.min(horse.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(horse.y, wall.y + wall.h));
      
      // Calculate collision normal
      const dx = horse.x - closestX;
      const dy = horse.y - closestY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) return;
      
      const nx = dx / distance;
      const ny = dy / distance;
      
      // Move horse out of wall
      const overlap = horse.r - distance;
      if (overlap > 0) {
        horse.x += nx * overlap;
        horse.y += ny * overlap;
      }
      
      // Reflect velocity (optional based on settings)
      const preventSpeedChange = config.physics?.collision?.preventSpeedChange || false;
      const dotProduct = horse.vx * nx + horse.vy * ny;
      
      if (!preventSpeedChange) {
        // Normal velocity reflection with bounce factor
        horse.vx -= 2 * dotProduct * nx * bounce;
        horse.vy -= 2 * dotProduct * ny * bounce;
      } else {
        // Preserve speed mode: Reflect direction but maintain speed magnitude
        const currentSpeed = Math.sqrt(horse.vx * horse.vx + horse.vy * horse.vy);
        
        // Reflect velocity vector
        horse.vx -= 2 * dotProduct * nx;
        horse.vy -= 2 * dotProduct * ny;
        
        // Restore original speed magnitude
        const newSpeed = Math.sqrt(horse.vx * horse.vx + horse.vy * horse.vy);
        if (newSpeed > 0.001) {
          const speedRatio = currentSpeed / newSpeed;
          horse.vx *= speedRatio;
          horse.vy *= speedRatio;
        }
      }
    },

    /**
     * Update power-up states
     * @param {number} deltaTime - Time elapsed since last update (ms)
     */
    updatePowerUps(deltaTime) {
      // Update power-up effect durations
      const horses = this.gameState.horses || [];
      
      horses.forEach(horse => {
        if (!horse.effects) return;

        Object.keys(horse.effects).forEach(effectType => {
          const effect = horse.effects[effectType];
          if (effect && effect.duration > 0) {
            effect.duration -= deltaTime;
            if (effect.duration <= 0) {
              delete horse.effects[effectType];
              console.log(`[GameLogic] ${effectType} effect expired for horse`);
            }
          }
        });
      });
    },

    /**
     * Check collisions between horses and power-ups
     */
    checkCollisions() {
      const horses = this.gameState.horses || [];

      horses.forEach(horse => {
        if (horse.eliminated) return;

        // Check power-up collisions
        this.checkPowerUpCollisions(horse);

        // Check horse-to-horse collisions
        this.checkHorseCollisions(horse, horses);
      });
    },

    /**
     * Check collisions between horse and power-ups
     * @param {Horse} horse - Horse object
     */
    checkPowerUpCollisions(horse) {
      const powerUpTypes = [
        { array: this.gameState.liveBoosts, type: 'boost' },
        { array: this.gameState.liveTurbos, type: 'turbo' },
        { array: this.gameState.liveTeleports, type: 'teleport' },
        { array: this.gameState.liveMagnets, type: 'magnet' },
        { array: this.gameState.liveTimeFreezes, type: 'timeFreeze' },
        { array: this.gameState.liveIceFreezers, type: 'icefreezer' },
        { array: this.gameState.liveGhosts, type: 'ghost' },
        { array: this.gameState.liveRams, type: 'ram' },
        { array: this.gameState.liveShields, type: 'shield' },
        { array: this.gameState.liveWarpzones, type: 'warpzone' },
        { array: this.gameState.liveQuantumdashs, type: 'quantumdash' },
        { array: this.gameState.liveNebulas, type: 'nebula' }
      ];

      powerUpTypes.forEach(({ array, type }) => {
        if (!Array.isArray(array)) return;

        for (let i = array.length - 1; i >= 0; i--) {
          const powerUp = array[i];
          const dx = horse.x - powerUp.x;
          const dy = horse.y - powerUp.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < horse.r + powerUp.r) {
            console.log(`[DEBUG] Collision detected: Horse at (${horse.x}, ${horse.y}) with ${type} at (${powerUp.x}, ${powerUp.y}), distance: ${distance.toFixed(2)}`);
            // Check for warp cooldown to prevent immediate re-warp
            if (type === 'warpzone' && horse.effects?.warpCooldown) {
              continue; // Skip this warp zone if horse is on cooldown
            }
            
            this.collectPowerUp(horse, powerUp, type);
            
            // Only remove power-up if it's not a permanent warp zone
            if (type !== 'warpzone') {
              array.splice(i, 1);
            }
            break;
          }
        }
      });
    },

    /**
     * Apply power-up effect to horse
     * @param {Horse} horse - Horse object
     * @param {PowerUp} powerUp - Power-up object
     * @param {string} type - Power-up type
     */
    collectPowerUp(horse, powerUp, type) {
      if (!horse.effects) horse.effects = {};

      const powerUpConfig = config.powerUps?.[type] || {};
      console.log(`[PowerUp] ${horse.name || '#' + (horse.i+1)} collected ${type}`, powerUpConfig);

      switch (type) {
        case 'boost':
        case 'turbo':
          horse.effects[type] = {
            duration: powerUpConfig.duration || 3000,
            speedMultiplier: powerUpConfig.speedMultiplier || 1.5
          };
          break;

        case 'teleport':
          this.applyTeleportEffect(horse);
          break;

        case 'magnet':
          horse.effects.magnet = {
            duration: powerUpConfig.duration || 5000
          };
          break;

        case 'timeFreeze':
          horse.effects.timeFreeze = {
            duration: powerUpConfig.duration || 3000
          };
          this.applyTimeFreezeEffect(horse);
          break;

        case 'icefreezer':
          this.applyIceFreezerEffect(horse, powerUpConfig);
          break;

        case 'ghost':
          horse.effects.ghost = {
            duration: powerUpConfig.duration || 4000
          };
          break;

        case 'ram':
          this.applyRamEffect(horse);
          break;

        case 'shield':
          horse.effects.shield = {
            duration: powerUpConfig.duration || 6000,
            absorptionCapacity: powerUpConfig.absorptionCapacity || 3
          };
          break;

        case 'warpzone':
          this.applyWarpzoneEffect(horse, powerUp);
          break;

        case 'quantumdash':
          horse.effects.quantumdash = {
            duration: powerUpConfig.duration || 2500,
            speedMultiplier: powerUpConfig.speedMultiplier || 3.0,
            phaseEnabled: powerUpConfig.phaseEnabled || true
          };
          break;

        case 'nebula':
          console.log('[DEBUG] Applying Nebula effect to horse:', horse.id || 'unknown');
          horse.effects.nebula = {
            duration: powerUpConfig.duration || 4000,
            speedMultiplier: powerUpConfig.speedMultiplier || 2.5,
            damage: powerUpConfig.damage || 20,
            particleEnabled: powerUpConfig.particleEnabled || true
          };
          console.log('[DEBUG] Nebula effect applied:', horse.effects.nebula);
          break;
      }

      console.log(`[GameLogic] Horse collected ${type} power-up`);
    },

    /**
     * Apply teleport effect
     * @param {Horse} horse - Horse object
     */
    applyTeleportEffect(horse) {
      const canvas = document.getElementById('canvas');
      if (!canvas) return;

      // Find safe teleport location
      const attempts = 10;
      for (let i = 0; i < attempts; i++) {
        const newX = horse.r + Math.random() * (canvas.width - 2 * horse.r);
        const newY = horse.r + Math.random() * (canvas.height - 2 * horse.r);

        // Check if location is safe (no walls)
        if (this.isLocationSafe(newX, newY, horse.r)) {
          horse.x = newX;
          horse.y = newY;
          horse.vx *= 0.5; // Reduce velocity after teleport
          horse.vy *= 0.5;
          break;
        }
      }
    },

    /**
     * Check if location is safe for teleportation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Object radius
     * @returns {boolean} True if location is safe
     */
    isLocationSafe(x, y, radius) {
      const walls = this.gameState.mapDef?.walls || [];
      const testCircle = { x, y, r: radius };

      return !walls.some(wall => this.circleRectCollision(testCircle, wall));
    },

    /**
     * Apply time freeze effect to other horses
     * @param {Horse} caster - Horse that cast the effect
     */
    applyTimeFreezeEffect(caster) {
      const horses = this.gameState.horses || [];
      const slowdownFactor = config.powerUps?.timeFreeze?.slowdownFactor || 0.3;

      horses.forEach(horse => {
        if (horse !== caster) {
          if (!horse.effects) horse.effects = {};
          horse.effects.slowed = {
            duration: 3000,
            factor: slowdownFactor
          };
        }
      });
    },

    /**
     * Apply ice freezer effect (freeze and slow the horse that collected it)
     * @param {Horse} horse - Horse object
     * @param {Object} powerUpConfig - Power-up configuration
     */
    applyIceFreezerEffect(horse, powerUpConfig) {
      if (!horse.effects) horse.effects = {};
      
      const duration = powerUpConfig.duration || 2000;
      horse.effects.icefrozen = {
        duration: duration,
        slowdownFactor: powerUpConfig.slowdownFactor || 0.7
      };

      // Immediately slow down the horse
      horse.vx *= 0.3;
      horse.vy *= 0.3;

      // Log event
      const horseName = horse.name || `#${(horse.i || 0) + 1}`;
      console.log(`🧊 ${horseName} bị đóng băng! (${Math.round(duration/1000)}s)`);
      if (typeof window.logEvent === 'function') {
        window.logEvent(`🧊 Ngựa ${horseName} bị đóng băng (${Math.round(duration/1000)}s).`);
      }
    },

    /**
     * Apply ram effect (deadly aura)
     * @param {Horse} horse - Horse object
     */
    applyRamEffect(horse) {
      if (!horse.effects) horse.effects = {};
      
      // Create deadly aura effect for 4 seconds
      horse.effects.ramAura = {
        duration: 4000, // 4 seconds
        radius: horse.r * 3 // 3 times horse radius
      };
    },

    /**
     * Apply warp zone effect (teleport to linked warp zone)
     * @param {Horse} horse - Horse object
     * @param {Object} currentWarpzone - The warp zone that was entered
     */
    applyWarpzoneEffect(horse, currentWarpzone) {
      // Find all warp zones (both static and live)
      const allWarpzones = [
        ...(this.gameState.mapDef?.warpzones || []),
        ...(this.gameState.liveWarpzones || [])
      ];

      // Find another warp zone to teleport to (not the current one)
      const targetWarpzones = allWarpzones.filter(wz => 
        wz !== currentWarpzone && 
        Math.hypot(wz.x - currentWarpzone.x, wz.y - currentWarpzone.y) > 50
      );

      if (targetWarpzones.length > 0) {
        // Choose random target warp zone
        const target = targetWarpzones[Math.floor(Math.random() * targetWarpzones.length)];
        
        // Teleport horse to target with small offset to avoid immediate re-trigger
        const angle = Math.random() * Math.PI * 2;
        const offset = 25; // Distance from warp zone center
        horse.x = target.x + Math.cos(angle) * offset;
        horse.y = target.y + Math.sin(angle) * offset;
        
        // Reduce velocity slightly
        horse.vx *= 0.8;
        horse.vy *= 0.8;

        // Add cooldown to prevent immediate re-warp
        if (!horse.effects) horse.effects = {};
        horse.effects.warpCooldown = {
          duration: config.powerUps?.warpzone?.cooldown || 500
        };

        console.log('[GameLogic] Horse warped from', currentWarpzone.x, currentWarpzone.y, 'to', target.x, target.y);
      }
    },

    /**
     * Check collisions between horses
     * @param {Horse} horse - Current horse
     * @param {Array} allHorses - All horses array
     */
    checkHorseCollisions(horse, allHorses) {
      const bounce = config.physics?.collision?.horseBounce || 0.6;

      allHorses.forEach(other => {
        if (other === horse || other.eliminated) return;

        const dx = horse.x - other.x;
        const dy = horse.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for Ram aura deadly effect first
        if (horse.hasRamAura && horse.ramAuraRadius) {
          console.log('Horse has Ram aura:', horse.name, 'radius:', horse.ramAuraRadius, 'distance to other:', distance);
          if (distance < horse.ramAuraRadius) {
            console.log('Eliminating horse due to Ram aura:', other.name);
            other.eliminated = true;
            return;
          }
        }

        if (other.hasRamAura && other.ramAuraRadius) {
          console.log('Other horse has Ram aura:', other.name, 'radius:', other.ramAuraRadius, 'distance:', distance);
          if (distance < other.ramAuraRadius) {
            // Current horse enters other's ram aura - eliminate it
            horse.eliminated = true;
            console.log('[GameLogic] Horse eliminated by Ram aura!');
            return; // Skip normal collision since current horse is eliminated
          }
        }

        const minDistance = horse.r + other.r;

        if (distance < minDistance && distance > 0) {
          // Separate horses
          const overlap = minDistance - distance;
          const separationX = (dx / distance) * overlap * 0.5;
          const separationY = (dy / distance) * overlap * 0.5;

          horse.x += separationX;
          horse.y += separationY;
          other.x -= separationX;
          other.y -= separationY;

          // Apply collision response
          const relativeVx = horse.vx - other.vx;
          const relativeVy = horse.vy - other.vy;
          const relativeSpeed = relativeVx * (dx / distance) + relativeVy * (dy / distance);

          if (relativeSpeed > 0) return; // Horses moving apart

          // Check if collision speed change prevention is enabled
          const preventSpeedChange = (window.config && window.config.physics && window.config.physics.collision && window.config.physics.collision.preventSpeedChange) || false;
          
          // Debug logging for collision prevention
          if (window._debugCollision) {
            console.log('[DEBUG] GameLogic horse collision - preventSpeedChange:', preventSpeedChange, 'config:', window.config?.physics?.collision);
            console.log('[DEBUG] GameLogic Before velocity change - horse:', horse.vx.toFixed(2), horse.vy.toFixed(2), 'other:', other.vx.toFixed(2), other.vy.toFixed(2));
          }
          
          if (!preventSpeedChange) {
            if (window._debugCollision) {
              console.log('[DEBUG] APPLYING velocity changes in GameLogic collision');
            }
            // Normal collision response - change velocities
            const impulse = 2 * relativeSpeed / 2; // Assuming equal mass
            const impulseX = (dx / distance) * impulse * bounce;
            const impulseY = (dy / distance) * impulse * bounce;

            horse.vx -= impulseX;
            horse.vy -= impulseY;
            other.vx += impulseX;
            other.vy += impulseY;
            
            if (window._debugCollision) {
              console.log('[DEBUG] GameLogic After velocity change - horse:', horse.vx.toFixed(2), horse.vy.toFixed(2), 'other:', other.vx.toFixed(2), other.vy.toFixed(2));
              console.log('[DEBUG] GameLogic Applied impulse:', impulseX.toFixed(2), impulseY.toFixed(2));
            }
          } else {
            if (window._debugCollision) {
              console.log('[DEBUG] SKIPPING velocity changes in GameLogic due to preventSpeedChange setting');
            }
          }
          // If preventSpeedChange is true, horses only separate but keep their velocities
          // Power-ups, skills, and other effects still work normally
        }
      });
    },

    /**
     * Update active effects on all horses
     * @param {number} deltaTime - Time elapsed since last update (ms)
     */
    updateEffects(deltaTime) {
      const horses = this.gameState.horses || [];

      horses.forEach(horse => {
        if (!horse.effects) return;

        // Update effect durations
        Object.keys(horse.effects).forEach(effectKey => {
          const effect = horse.effects[effectKey];
          if (effect && typeof effect.duration === 'number') {
            effect.duration -= deltaTime;
            if (effect.duration <= 0) {
              delete horse.effects[effectKey];
            }
          }
        });

        // Apply speed modifications from effects
        let speedMultiplier = 1.0;

        if (horse.effects.boost) {
          speedMultiplier *= horse.effects.boost.speedMultiplier || 1.5;
        }
        if (horse.effects.turbo) {
          speedMultiplier *= horse.effects.turbo.speedMultiplier || 2.0;
        }
        if (horse.effects.trapped) {
          speedMultiplier *= horse.effects.trapped.slowdownFactor || 0.1;
        }
        if (horse.effects.slowed) {
          speedMultiplier *= horse.effects.slowed.factor || 0.3;
        }
        if (horse.effects.icefrozen) {
          speedMultiplier *= horse.effects.icefrozen.slowdownFactor || 0.7;
        }

        horse.speedMultiplier = speedMultiplier;

        // Handle stunned effect (prevent input)
        if (horse.effects.stunned) {
          horse.vx *= 0.9; // Gradually slow down
          horse.vy *= 0.9;
        }
      });
    },

    /**
     * Check race conditions (finish line, lap completion, etc.)
     */
    checkRaceConditions() {
      if (this.gameState.mode !== 'race') return;

      const horses = this.gameState.horses || [];
      const finishLine = this.gameState.mapDef?.finishLine;

      if (!finishLine) return;

      horses.forEach(horse => {
        if (horse.eliminated || horse.finished) return;

        // Check if horse crossed finish line
        if (this.checkFinishLineCollision(horse, finishLine)) {
          this.handleRaceFinish(horse);
        }
      });
    },

    /**
     * Check if horse crossed finish line
     * @param {Horse} horse - Horse object
     * @param {Object} finishLine - Finish line object
     * @returns {boolean} True if horse crossed finish line
     */
    checkFinishLineCollision(horse, finishLine) {
      return this.circleRectCollision(horse, finishLine);
    },

    /**
     * Handle race finish for a horse
     * @param {Horse} horse - Horse that finished
     */
    handleRaceFinish(horse) {
      horse.finished = true;
      horse.finishTime = horse.lapTime;

      // Update best time if applicable
      if (!horse.bestTime || horse.lapTime < horse.bestTime) {
        horse.bestTime = horse.lapTime;
      }

      // Update race standings
      if (!this.gameState.raceStandings) {
        this.gameState.raceStandings = [];
      }
      
      this.gameState.raceStandings.push({
        horse: horse,
        time: horse.lapTime,
        position: this.gameState.raceStandings.length + 1
      });

      console.log(`[GameLogic] Horse finished race in ${(horse.lapTime / 1000).toFixed(2)}s`);

      // Check if race is complete
      const finishedHorses = this.gameState.horses.filter(h => h.finished || h.eliminated);
      if (finishedHorses.length === this.gameState.horses.length) {
        this.handleRaceComplete();
      }
    },

    /**
     * Handle race completion
     */
    handleRaceComplete() {
      this.gameState.raceComplete = true;
      this.gameState.running = false;

      console.log('[GameLogic] Race completed!');

      // Show results
      if (window.UIHandlers && window.UIHandlers.showModal) {
        window.UIHandlers.showModal('raceResultsModal');
      }
    },

    /**
     * Reset game state
     */
    reset() {
      if (this.gameState) {
        this.gameState.running = false;
        this.gameState.raceComplete = false;
        this.gameState.raceStandings = [];
        
        // Reset horses
        if (this.gameState.horses) {
          this.gameState.horses.forEach(horse => {
            horse.eliminated = false;
            horse.finished = false;
            horse.lapTime = 0;
            horse.finishTime = 0;
            horse.effects = {};
            horse.vx = 0;
            horse.vy = 0;
            // Reset to starting position
            horse.x = horse.startX || horse.x;
            horse.y = horse.startY || horse.y;
          });
        }

        // Reset power-ups to map definition
        this.resetPowerUps();
      }

      console.log('[GameLogic] Game reset');
    },

    /**
     * Reset power-ups to map definition
     */
    resetPowerUps() {
      const mapDef = this.gameState.mapDef;
      if (!mapDef) return;

      // Copy power-ups from map definition to live arrays
      this.gameState.liveBoosts = [...(mapDef.boosts || [])];
      this.gameState.liveTurbos = [...(mapDef.turbos || [])];
      this.gameState.liveTeleports = [...(mapDef.teleports || [])];
      this.gameState.liveMagnets = [...(mapDef.magnets || [])];
      this.gameState.liveTimeFreezes = [...(mapDef.timeFreezes || [])];
      this.gameState.liveIceFreezers = [...(mapDef.icefreezers || [])];
      this.gameState.liveGhosts = [...(mapDef.ghosts || [])];
      this.gameState.liveRams = [...(mapDef.rams || [])];
      this.gameState.liveShields = [...(mapDef.shields || [])];
      this.gameState.liveSpinners = [...(mapDef.spinners || [])];
      this.gameState.liveWarpzones = [...(mapDef.warpzones || [])];
      this.gameState.liveQuantumdashs = [...(mapDef.quantumdashs || [])];
      this.gameState.liveNebulas = [...(mapDef.nebulas || [])];
    },

    /**
     * Get game statistics
     * @returns {Object} Game statistics
     */
    getStats() {
      const horses = this.gameState.horses || [];
      
      return {
        totalHorses: horses.length,
        activeHorses: horses.filter(h => !h.eliminated && !h.finished).length,
        finishedHorses: horses.filter(h => h.finished).length,
        eliminatedHorses: horses.filter(h => h.eliminated).length,
        raceTime: this.gameState.raceTime || 0,
        powerUpsRemaining: this.getTotalPowerUps()
      };
    },

    /**
     * Get total number of remaining power-ups
     * @returns {number} Total power-ups remaining
     */
    getTotalPowerUps() {
      const arrays = [
        this.gameState.liveBoosts,
        this.gameState.liveTurbos,
        this.gameState.liveTeleports,
        this.gameState.liveMagnets,
        this.gameState.liveTimeFreezes,
        this.gameState.liveGhosts,
        this.gameState.liveRams,
        this.gameState.liveShields,
        this.gameState.liveSpinners
      ];

      return arrays.reduce((total, array) => {
        return total + (Array.isArray(array) ? array.length : 0);
      }, 0);
    }
  };

  // Export to global scope
  window.GameLogic = GameLogic;

  console.log('[GameLogic] Module loaded');

})();
