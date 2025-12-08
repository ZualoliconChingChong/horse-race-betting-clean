// scripts/ui-handlers.js
/**
 * UI Event Handlers for Horse Maze Game
 * Extracted from index.html for better maintainability and AI-friendly structure
 * 
 * This module handles all user interface interactions including:
 * - Toolbar button clicks
 * - Canvas mouse/touch events
 * - Keyboard shortcuts
 * - Modal dialogs
 * - Settings changes
 */

/**
 * @typedef {Object} UIHandlers
 * @property {Function} initializeEventListeners - Initialize all event listeners
 * @property {Function} handleToolSelection - Handle tool selection
 * @property {Function} handleCanvasInteraction - Handle canvas mouse/touch events
 * @property {Function} handleKeyboardInput - Handle keyboard shortcuts
 * @property {Function} handleGameControls - Handle game control buttons
 * @property {Function} handleSettingsChange - Handle settings changes
 */

(function() {
  'use strict';

  // Import configuration if available
  const config = window.CONFIG || {};
  
  /**
   * UI Handlers namespace
   * @type {UIHandlers}
   */
  const UIHandlers = {
    
    /**
     * Initialize all event listeners
     * @param {Object} gameState - Reference to game state
     * @param {Object} gameActions - Reference to game actions
     */
    initializeEventListeners(gameState, gameActions) {
      this.gameState = gameState;
      this.gameActions = gameActions;
      
      this.setupToolbarEvents();
      this.setupCanvasEvents();
      this.setupKeyboardEvents();
      this.setupGameControlEvents();
      this.setupModalEvents();
      this.setupSettingsEvents();
      
      console.log('[UIHandlers] Event listeners initialized');
    },

    /**
     * Setup toolbar button events
     */
    setupToolbarEvents() {
      // Tool selection buttons
      const toolButtons = document.querySelectorAll('.tool-btn');
      toolButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const tool = button.dataset.tool;
          if (tool) {
            this.handleToolSelection(tool, button);
          }
        });
      });

      // Brush size slider
      const brushSizeSlider = document.getElementById('brushSize');
      if (brushSizeSlider) {
        brushSizeSlider.addEventListener('input', (e) => {
          const size = parseInt(e.target.value);
          this.handleBrushSizeChange(size);
        });
      }

      // Game speed slider
      const gameSpeedSlider = document.getElementById('gameSpeed');
      if (gameSpeedSlider) {
        gameSpeedSlider.addEventListener('input', (e) => {
          const speed = parseFloat(e.target.value);
          this.handleGameSpeedChange(speed);
        });
      }
    },

    /**
     * Setup canvas interaction events
     */
    setupCanvasEvents() {
      const canvas = document.getElementById('canvas');
      if (!canvas) return;

      // Mouse events
      canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
      canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
      canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
      canvas.addEventListener('mouseleave', (e) => this.handleCanvasMouseLeave(e));
      
      // Touch events for mobile
      canvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e));
      canvas.addEventListener('touchmove', (e) => this.handleCanvasTouchMove(e));
      canvas.addEventListener('touchend', (e) => this.handleCanvasTouchEnd(e));
      
      // Wheel event for zooming
      canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
      
      // Context menu prevention
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    /**
     * Setup keyboard event handlers
     */
    setupKeyboardEvents() {
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));
      document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },

    /**
     * Setup game control button events
     */
    setupGameControlEvents() {
      // Play/Pause button
      const playPauseBtn = document.getElementById('playPause');
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => this.handlePlayPause());
      }

      // Stop button
      const stopBtn = document.getElementById('stop');
      if (stopBtn) {
        stopBtn.addEventListener('click', () => this.handleStop());
      }

      // Reset button
      const resetBtn = document.getElementById('reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.handleReset());
      }

      // Mode switch buttons
      const modeButtons = document.querySelectorAll('.mode-btn');
      modeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const mode = button.dataset.mode;
          if (mode) {
            this.handleModeSwitch(mode);
          }
        });
      });
    },

    /**
     * Setup modal dialog events
     */
    setupModalEvents() {
      // Close buttons
      const closeButtons = document.querySelectorAll('.modal-close');
      closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const modal = button.closest('.modal');
          if (modal) {
            this.closeModal(modal);
          }
        });
      });

      // Modal backdrop clicks
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal);
          }
        });
      });
    },

    /**
     * Setup settings change events
     */
    setupSettingsEvents() {
      // Settings form changes
      const settingsForm = document.getElementById('settingsForm');
      if (settingsForm) {
        settingsForm.addEventListener('change', (e) => {
          this.handleSettingsChange(e.target);
        });
      }
    },

    /**
     * Handle tool selection
     * @param {string} toolName - Name of the selected tool
     * @param {HTMLElement} button - The clicked button element
     */
    handleToolSelection(toolName, button) {
      try {
        // Remove active class from all tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
          btn.classList.remove('active', 'selected');
        });

        // Add active class to selected button
        button.classList.add('active', 'selected');

        // Update game state
        if (this.gameState) {
          this.gameState.selectedTool = toolName;
        }

        // Call game action if available
        if (this.gameActions && this.gameActions.selectTool) {
          this.gameActions.selectTool(toolName);
        }

        // Update cursor style based on tool
        this.updateCanvasCursor(toolName);

        console.log(`[UIHandlers] Tool selected: ${toolName}`);
      } catch (error) {
        console.error('[UIHandlers] Error selecting tool:', error);
      }
    },

    /**
     * Update canvas cursor based on selected tool
     * @param {string} toolName - Name of the selected tool
     */
    updateCanvasCursor(toolName) {
      const canvas = document.getElementById('canvas');
      if (!canvas) return;

      const cursorMap = {
        brush: 'crosshair',
        wall: 'crosshair',
        eraser: 'crosshair',
        select: 'default',
        move: 'move',
        zoom: 'zoom-in'
      };

      canvas.style.cursor = cursorMap[toolName] || 'crosshair';
    },

    /**
     * Handle canvas mouse down event
     * @param {MouseEvent} e - Mouse event
     */
    handleCanvasMouseDown(e) {
      e.preventDefault();
      
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.isMouseDown = true;
      this.lastMousePos = { x, y };

      if (this.gameActions && this.gameActions.handleCanvasClick) {
        this.gameActions.handleCanvasClick(x, y, e.button, 'down');
      }
    },

    /**
     * Handle canvas mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    handleCanvasMouseMove(e) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.currentMousePos = { x, y };

      if (this.gameActions && this.gameActions.handleCanvasMove) {
        this.gameActions.handleCanvasMove(x, y, this.isMouseDown);
      }

      // Update last position for next frame
      this.lastMousePos = { x, y };
    },

    /**
     * Handle canvas mouse up event
     * @param {MouseEvent} e - Mouse event
     */
    handleCanvasMouseUp(e) {
      e.preventDefault();
      
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.isMouseDown = false;

      if (this.gameActions && this.gameActions.handleCanvasClick) {
        this.gameActions.handleCanvasClick(x, y, e.button, 'up');
      }
    },

    /**
     * Handle canvas mouse leave event
     * @param {MouseEvent} e - Mouse event
     */
    handleCanvasMouseLeave(e) {
      this.isMouseDown = false;
      this.currentMousePos = null;
    },

    /**
     * Handle canvas touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleCanvasTouchStart(e) {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.isMouseDown = true;
        this.lastMousePos = { x, y };

        if (this.gameActions && this.gameActions.handleCanvasClick) {
          this.gameActions.handleCanvasClick(x, y, 0, 'down');
        }
      }
    },

    /**
     * Handle canvas touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleCanvasTouchMove(e) {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.currentMousePos = { x, y };

        if (this.gameActions && this.gameActions.handleCanvasMove) {
          this.gameActions.handleCanvasMove(x, y, this.isMouseDown);
        }

        this.lastMousePos = { x, y };
      }
    },

    /**
     * Handle canvas touch end event
     * @param {TouchEvent} e - Touch event
     */
    handleCanvasTouchEnd(e) {
      e.preventDefault();
      this.isMouseDown = false;
      this.currentMousePos = null;
    },

    /**
     * Handle canvas wheel event for zooming
     * @param {WheelEvent} e - Wheel event
     */
    handleCanvasWheel(e) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      
      if (this.gameActions && this.gameActions.handleZoom) {
        this.gameActions.handleZoom(delta, e.clientX, e.clientY);
      }
    },

    /**
     * Handle tool selection
     * @param {string} toolName - Name of tool to select
     * @param {HTMLElement} toolButton - Tool button element
     */
    handleToolSelection(toolName, toolButton) {
      console.log('[DEBUG] UIHandlers.handleToolSelection:', toolName);
      
      // Remove active class from all tools
      document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
      
      // Add active class to selected tool
      if (toolButton) {
        toolButton.classList.add('active');
      }
      
      // Set global tool variable (for compatibility with existing code)
      window.tool = toolName;
      console.log('[DEBUG] Global tool set to:', toolName);
      
      // Also update the internal tool variable if it exists
      if (typeof tool !== 'undefined') {
        tool = toolName;
      }
    },

    /**
     * Handle key down events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
      // Don't handle if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Tool shortcuts
      const toolShortcuts = {
        'b': 'brush',
        'w': 'wall',
        'e': 'eraser',
        's': 'select',
        'm': 'move',
        'z': 'zoom',
        '1': 'boost',
        '2': 'turbo',
        '3': 'teleport',
        '4': 'magnet',
        '5': 'timeFreeze',
        'i': 'icefreezer',
        '6': 'ghost',
        '7': 'ram',
        '8': 'shield',
        'n': 'nebula'
      };

      if (toolShortcuts[key]) {
        console.log('[DEBUG] Keyboard shortcut:', key, '→', toolShortcuts[key]);
        const toolButton = document.querySelector(`[data-tool="${toolShortcuts[key]}"]`);
        if (toolButton) {
          console.log('[DEBUG] Tool button found:', toolButton);
          this.handleToolSelection(toolShortcuts[key], toolButton);
        } else {
          console.log('[DEBUG] Tool button NOT found for:', toolShortcuts[key]);
        }
        e.preventDefault();
        return;
      }

      // Game control shortcuts
      switch (key) {
        case ' ':
        case 'space':
          this.handlePlayPause();
          e.preventDefault();
          break;
        case 'escape':
          this.handleStop();
          e.preventDefault();
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            this.handleReset();
            e.preventDefault();
          }
          break;
        case 'delete':
        case 'backspace':
          if (this.gameActions && this.gameActions.deleteSelected) {
            this.gameActions.deleteSelected();
            e.preventDefault();
          }
          break;
      }

      // Pass to game actions for movement keys
      if (this.gameActions && this.gameActions.handleKeyDown) {
        this.gameActions.handleKeyDown(e);
      }
    },

    /**
     * Handle key up events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
      if (this.gameActions && this.gameActions.handleKeyUp) {
        this.gameActions.handleKeyUp(e);
      }
    },

    /**
     * Handle brush size change
     * @param {number} size - New brush size
     */
    handleBrushSizeChange(size) {
      if (this.gameState) {
        this.gameState.brushSize = size;
      }

      // Update display
      const sizeDisplay = document.getElementById('brushSizeDisplay');
      if (sizeDisplay) {
        sizeDisplay.textContent = size;
      }

      console.log(`[UIHandlers] Brush size changed to: ${size}`);
    },

    /**
     * Handle game speed change
     * @param {number} speed - New game speed
     */
    handleGameSpeedChange(speed) {
      if (this.gameState) {
        this.gameState.gameSpeed = speed;
      }

      if (this.gameActions && this.gameActions.setGameSpeed) {
        this.gameActions.setGameSpeed(speed);
      }

      // Update display
      const speedDisplay = document.getElementById('gameSpeedDisplay');
      if (speedDisplay) {
        speedDisplay.textContent = `${speed}x`;
      }

      console.log(`[UIHandlers] Game speed changed to: ${speed}x`);
    },

    /**
     * Handle play/pause button
     */
    handlePlayPause() {
      if (this.gameActions && this.gameActions.togglePlayPause) {
        this.gameActions.togglePlayPause();
      }
    },

    /**
     * Handle stop button
     */
    handleStop() {
      if (this.gameActions && this.gameActions.stop) {
        this.gameActions.stop();
      }
    },

    /**
     * Handle reset button
     */
    handleReset() {
      if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        if (this.gameActions && this.gameActions.reset) {
          this.gameActions.reset();
        }
      }
    },

    /**
     * Handle mode switch
     * @param {string} mode - New mode ('editor', 'play', 'race')
     */
    handleModeSwitch(mode) {
      if (this.gameActions && this.gameActions.switchMode) {
        this.gameActions.switchMode(mode);
      }

      // Update UI to reflect mode change
      this.updateModeUI(mode);
    },

    /**
     * Update UI based on current mode
     * @param {string} mode - Current mode
     */
    updateModeUI(mode) {
      // Update mode buttons
      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });

      // Show/hide mode-specific UI elements
      const editorUI = document.querySelectorAll('.editor-only');
      const gameUI = document.querySelectorAll('.game-only');

      editorUI.forEach(el => {
        el.style.display = mode === 'editor' ? '' : 'none';
      });

      gameUI.forEach(el => {
        el.style.display = mode !== 'editor' ? '' : 'none';
      });
    },

    /**
     * Handle settings changes
     * @param {HTMLElement} element - Changed settings element
     */
    handleSettingsChange(element) {
      const setting = element.name;
      const value = element.type === 'checkbox' ? element.checked : element.value;

      if (this.gameState && this.gameState.settings) {
        this.gameState.settings[setting] = value;
      }

      if (this.gameActions && this.gameActions.updateSetting) {
        this.gameActions.updateSetting(setting, value);
      }

      console.log(`[UIHandlers] Setting changed: ${setting} = ${value}`);
    },

    /**
     * Show modal dialog
     * @param {string} modalId - ID of modal to show
     */
    showModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('show');
        
        // Focus first input if available
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 100);
        }
      }
    },

    /**
     * Close modal dialog
     * @param {HTMLElement} modal - Modal element to close
     */
    closeModal(modal) {
      if (modal) {
        modal.classList.remove('show');
      }
    },

    /**
     * Show notification message
     * @param {string} message - Message to show
     * @param {string} type - Type of notification ('info', 'success', 'warning', 'error')
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showNotification(message, type = 'info', duration = 3000) {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => notification.classList.add('show'), 10);
      
      // Remove after duration
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    },

    /**
     * Update UI state based on game state
     * @param {Object} gameState - Current game state
     */
    updateUI(gameState) {
      // Update play/pause button
      const playPauseBtn = document.getElementById('playPause');
      if (playPauseBtn && gameState.running !== undefined) {
        playPauseBtn.textContent = gameState.running ? '⏸️ Pause' : '▶️ Play';
        playPauseBtn.classList.toggle('btn-warning', gameState.running);
        playPauseBtn.classList.toggle('btn-success', !gameState.running);
      }

      // Update status indicator
      const statusIndicator = document.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.className = 'status-indicator';
        if (gameState.running) {
          statusIndicator.classList.add('running');
          statusIndicator.textContent = '🟢 Running';
        } else {
          statusIndicator.classList.add('stopped');
          statusIndicator.textContent = '🔴 Stopped';
        }
      }

      // Update mode display
      if (gameState.mode) {
        this.updateModeUI(gameState.mode);
      }
    }
  };

  // Export to global scope
  window.UIHandlers = UIHandlers;

  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[UIHandlers] Module loaded and ready for initialization');
      // Initialize keyboard shortcuts
      document.addEventListener('keydown', (e) => UIHandlers.handleKeyDown(e));
      document.addEventListener('keyup', (e) => UIHandlers.handleKeyUp(e));
    });
  } else {
    console.log('[UIHandlers] Module loaded and ready for initialization');
    // Initialize keyboard shortcuts immediately
    document.addEventListener('keydown', (e) => UIHandlers.handleKeyDown(e));
    document.addEventListener('keyup', (e) => UIHandlers.handleKeyUp(e));
  }

})();
