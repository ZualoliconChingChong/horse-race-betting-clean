// @ts-check
// Mobile Support Module
// Adds pinch-to-zoom, touch gestures, and mobile-specific UI adaptations

(function() {
  if (typeof window === 'undefined') return;

  // Detect if device is mobile - improved detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || 'ontouchstart' in window 
    || navigator.maxTouchPoints > 0
    || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  
  // Also detect if touch is available (for hybrid devices like Surface)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const isLandscape = () => window.innerWidth > window.innerHeight;
  
  console.log('[MobileSupport] isMobile:', isMobile, 'hasTouch:', hasTouch, 'userAgent:', navigator.userAgent.substring(0, 50));

  // Add mobile class to body for CSS targeting
  if (isMobile) {
    document.body.classList.add('is-mobile');
    if (isLandscape()) {
      document.body.classList.add('is-landscape');
    }
  }

  // Update landscape class on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (isMobile) {
        document.body.classList.toggle('is-landscape', isLandscape());
      }
    }, 100);
  });

  window.addEventListener('resize', () => {
    if (isMobile) {
      document.body.classList.toggle('is-landscape', isLandscape());
    }
  });

  // Pinch-to-Zoom & Pan Support
  let pinchState = {
    active: false,
    initialDistance: 0,
    initialScale: 1
  };

  let panState = {
    active: false,
    lastX: 0,
    lastY: 0,
    initialPanX: 0,
    initialPanY: 0
  };

  function getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  // Add touch support - attach to document to avoid being blocked
  function initCanvasTouchHandlers() {
    const canvas = document.getElementById('cv');
    if (!canvas) {
      console.log('[MobileSupport] Canvas not found, retrying...');
      setTimeout(initCanvasTouchHandlers, 100);
      return;
    }
    
    // REMOVED isMobile check - always enable touch handlers for testing
    // if (!isMobile) return;
    
    let touchToMouseActive = false;
    
    // Create visual indicator for debugging
    const debugDiv = document.createElement('div');
    debugDiv.id = 'touch-debug';
    debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:#0f0;padding:10px;font-size:12px;z-index:999999;font-family:monospace;max-width:300px;pointer-events:none;';
    debugDiv.textContent = 'Touch: waiting...';
    document.body.appendChild(debugDiv);
    
    function updateDebug(msg) {
      debugDiv.textContent = msg;
      debugDiv.style.background = 'rgba(0,100,0,0.9)';
      setTimeout(() => { debugDiv.style.background = 'rgba(0,0,0,0.8)'; }, 200);
    }
    
    console.log('[MobileSupport] Canvas touch handlers initialized');
    console.log('[MobileSupport] Canvas element:', canvas);
    console.log('[MobileSupport] isMobile:', isMobile, 'hasTouch:', hasTouch);
    console.log('[MobileSupport] StageTransform available:', !!window.StageTransform);
    updateDebug('Ready! mobile=' + isMobile + ' touch=' + hasTouch);
    
    // Helper to check if touch is on canvas
    function isTouchOnCanvas(touch) {
      const rect = canvas.getBoundingClientRect();
      return touch.clientX >= rect.left && touch.clientX <= rect.right &&
             touch.clientY >= rect.top && touch.clientY <= rect.bottom;
    }
    
    // Attach to document with capture phase to intercept ALL touch events
    document.addEventListener('touchstart', (e) => {
      updateDebug('Touch START: ' + e.touches.length + ' fingers');
      console.log('[MobileSupport] touchstart - fingers:', e.touches.length);
      
      // 2-finger gestures (pinch/pan) work ANYWHERE on the page
      if (e.touches.length === 2) {
        // 2-finger: pinch zoom & pan
        e.preventDefault();
        e.stopPropagation();
        updateDebug('PINCH activated!');
        console.log('[MobileSupport] 2-finger detected - activating pinch/pan');
        
        pinchState.active = true;
        pinchState.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
        
        if (window.StageTransform && typeof window.StageTransform.getZoom === 'function') {
          pinchState.initialScale = window.StageTransform.getZoom();
          console.log('[MobileSupport] Initial zoom:', pinchState.initialScale);
        } else {
          pinchState.initialScale = 1;
          console.log('[MobileSupport] StageTransform not available, using default zoom');
        }
        
        panState.active = true;
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        panState.lastX = center.x;
        panState.lastY = center.y;
        
        if (window.StageTransform && typeof window.StageTransform.getPan === 'function') {
          const currentPan = window.StageTransform.getPan();
          panState.initialPanX = currentPan.x;
          panState.initialPanY = currentPan.y;
          console.log('[MobileSupport] Initial pan:', currentPan);
        }
      } else if (e.touches.length === 1 && !pinchState.active && !panState.active) {
        const touch = e.touches[0];
        
        // Check if touch is on canvas → mouse event for draw/drag
        if (isTouchOnCanvas(touch)) {
          touchToMouseActive = true;
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            bubbles: true,
            cancelable: true
          });
          canvas.dispatchEvent(mouseEvent);
          updateDebug('1-finger ON canvas');
          console.log('[MobileSupport] 1-finger on canvas - dispatched mousedown');
        } else {
          // Touch is outside canvas - allow dragging stage from anywhere
          // (except UI buttons which will handle their own events)
          const stage = document.getElementById('stage');
          
          // Check if touch target is a button or interactive element
          const target = e.target;
          const isButton = target && (
            target.tagName === 'BUTTON' || 
            target.tagName === 'INPUT' || 
            target.tagName === 'SELECT' ||
            target.closest('button') ||
            target.closest('.btn') ||
            target.closest('.dropdown') ||
            target.closest('.top-editor-bar')
          );
          
          if (stage && !isButton) {
            e.preventDefault();
            e.stopPropagation();
            updateDebug('1-finger DRAG stage');
            console.log('[MobileSupport] 1-finger outside canvas - starting stage drag');
            
            // Use window scroll instead of moving stage element
            const startX = touch.clientX;
            const startY = touch.clientY;
            const startScrollX = window.scrollX;
            const startScrollY = window.scrollY;
            
            console.log('[MobileSupport] Starting drag, scroll:', startScrollX, startScrollY);
            
            const stageDragMove = (moveEvent) => {
              if (moveEvent.touches.length !== 1) return;
              moveEvent.preventDefault();
              moveEvent.stopPropagation();
              const moveTouch = moveEvent.touches[0];
              const dx = moveTouch.clientX - startX;
              const dy = moveTouch.clientY - startY;
              
              // Scroll the window in opposite direction of drag
              window.scrollTo(startScrollX - dx, startScrollY - dy);
              
              updateDebug('SCROLL: ' + (-dx).toFixed(0) + ',' + (-dy).toFixed(0));
            };
            
            const stageDragEnd = () => {
              updateDebug('DRAG ended');
              document.removeEventListener('touchmove', stageDragMove);
              document.removeEventListener('touchend', stageDragEnd);
              document.removeEventListener('touchcancel', stageDragEnd);
            };
            
            document.addEventListener('touchmove', stageDragMove, { passive: false });
            document.addEventListener('touchend', stageDragEnd);
            document.addEventListener('touchcancel', stageDragEnd);
          } else {
            updateDebug('Touch on UI element');
          }
        }
      }
    }, { passive: false, capture: true });

    document.addEventListener('touchmove', (e) => {
      // 2-finger gestures work ANYWHERE
      if (e.touches.length === 2 && (pinchState.active || panState.active)) {
        // 2-finger: pinch & pan
        e.preventDefault();
        e.stopPropagation();
        
        if (pinchState.active) {
          const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
          const scale = (currentDistance / pinchState.initialDistance) * pinchState.initialScale;
          
          updateDebug('ZOOM: ' + scale.toFixed(2));
          console.log('[MobileSupport] Pinch zoom - scale:', scale);
          
          if (window.StageTransform && typeof window.StageTransform.setZoom === 'function') {
            window.StageTransform.setZoom(scale, true);
            console.log('[MobileSupport] Applied zoom via StageTransform');
          } else {
            // Fallback: apply zoom directly to stage
            const stage = document.getElementById('stage');
            if (stage) {
              stage.style.transform = `scale(${scale})`;
              stage.style.transformOrigin = 'center center';
              console.log('[MobileSupport] Applied zoom via direct CSS');
            }
          }
        }
        
        if (panState.active) {
          const center = getTouchCenter(e.touches[0], e.touches[1]);
          const deltaX = center.x - panState.lastX;
          const deltaY = center.y - panState.lastY;
          
          panState.lastX = center.x;
          panState.lastY = center.y;
          
          console.log('[MobileSupport] Pan delta:', deltaX, deltaY);
          
          if (window.StageTransform && typeof window.StageTransform.getPan === 'function') {
            const currentPan = window.StageTransform.getPan();
            window.StageTransform.setPan(currentPan.x + deltaX, currentPan.y + deltaY, true);
            console.log('[MobileSupport] Applied pan via StageTransform');
          } else {
            // Fallback: apply pan directly to stage
            const stage = document.getElementById('stage');
            if (stage) {
              const currentTransform = stage.style.transform || '';
              const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              
              stage.style.transform = `translate(${currentX + deltaX}px, ${currentY + deltaY}px)`;
              console.log('[MobileSupport] Applied pan via direct CSS');
            }
          }
        }
      } else if (e.touches.length === 1 && touchToMouseActive) {
        // 1-finger: convert to mousemove
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true
        });
        canvas.dispatchEvent(mouseEvent);
      }
    }, { passive: false, capture: true });

    document.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        pinchState.active = false;
        panState.active = false;
      }
      
      if (touchToMouseActive && e.touches.length === 0) {
        touchToMouseActive = false;
        const mouseEvent = new MouseEvent('mouseup', {
          button: 0,
          bubbles: true,
          cancelable: true
        });
        canvas.dispatchEvent(mouseEvent);
      }
    });

    document.addEventListener('touchcancel', () => {
      pinchState.active = false;
      panState.active = false;
      touchToMouseActive = false;
    }, { capture: true });
  }
  
  // Initialize handlers
  initCanvasTouchHandlers();

  // Create mobile control panel for map editor
  function createMobileControls() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('cv');
    if (!stage || !canvas) {
      console.log('[MobileSupport] Stage/canvas not found, retrying...');
      setTimeout(createMobileControls, 200);
      return;
    }
    
    console.log('[MobileSupport] Creating mobile controls');
    
    // DO NOT modify stage margins - it breaks layout
    
    // Create mobile control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'mobile-editor-controls';
    controlPanel.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:11px;opacity:0.7;">Map:</span>
        <button id="mobile-move-btn" style="padding:8px 12px;border:none;border-radius:8px;background:#4a90d9;color:white;font-size:14px;touch-action:none;">✋ Move</button>
        <button id="mobile-resize-btn" style="padding:8px 12px;border:none;border-radius:8px;background:#d94a4a;color:white;font-size:14px;touch-action:none;">↔️ Size</button>
        <button id="mobile-reset-btn" style="padding:8px 12px;border:none;border-radius:8px;background:#888;color:white;font-size:14px;touch-action:none;">🔄</button>
      </div>
    `;
    controlPanel.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);padding:12px 16px;border-radius:16px;z-index:10000;display:flex;gap:12px;align-items:center;';
    document.body.appendChild(controlPanel);
    
    let moveMode = false;
    let resizeMode = false;
    
    const moveBtn = document.getElementById('mobile-move-btn');
    const resizeBtn = document.getElementById('mobile-resize-btn');
    const resetBtn = document.getElementById('mobile-reset-btn');
    const debugDiv = document.getElementById('touch-debug');
    
    // Reset button - bring map back to center
    if (resetBtn) resetBtn.addEventListener('click', () => {
      stage.style.transform = '';
      moveMode = false;
      resizeMode = false;
      if (moveBtn) moveBtn.style.background = '#4a90d9';
      if (resizeBtn) resizeBtn.style.background = '#d94a4a';
      if (debugDiv) debugDiv.textContent = 'Map reset';
    });
    
    // Move mode
    moveBtn.addEventListener('click', () => {
      moveMode = !moveMode;
      resizeMode = false;
      moveBtn.style.background = moveMode ? '#2ecc71' : '#4a90d9';
      resizeBtn.style.background = '#d94a4a';
      if (debugDiv) debugDiv.textContent = moveMode ? 'MOVE mode ON - drag anywhere' : 'MOVE mode OFF';
    });
    
    // Resize mode
    resizeBtn.addEventListener('click', () => {
      resizeMode = !resizeMode;
      moveMode = false;
      resizeBtn.style.background = resizeMode ? '#2ecc71' : '#d94a4a';
      moveBtn.style.background = '#4a90d9';
      if (debugDiv) debugDiv.textContent = resizeMode ? 'RESIZE mode ON - drag to resize' : 'RESIZE mode OFF';
    });
    
    // Handle touch on stage when in move/resize mode
    let activeDrag = null;
    
    stage.addEventListener('touchstart', (e) => {
      if (!moveMode && !resizeMode) return;
      if (e.touches.length !== 1) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      activeDrag = {
        startX: touch.clientX,
        startY: touch.clientY,
        startMarginLeft: parseInt(window.getComputedStyle(stage).marginLeft) || 0,
        startMarginTop: parseInt(window.getComputedStyle(stage).marginTop) || 0,
        startWidth: canvas.width,
        startHeight: canvas.height
      };
      
      if (debugDiv) debugDiv.textContent = moveMode ? 'MOVING...' : 'RESIZING...';
    }, { passive: false });
    
    stage.addEventListener('touchmove', (e) => {
      if (!activeDrag) return;
      if (e.touches.length !== 1) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const dx = touch.clientX - activeDrag.startX;
      const dy = touch.clientY - activeDrag.startY;
      
      if (moveMode) {
        // Use transform instead of margin to avoid breaking layout
        stage.style.transform = `translate(${dx}px, ${dy}px)`;
        if (debugDiv) debugDiv.textContent = 'MOVE: ' + dx + ', ' + dy;
      } else if (resizeMode) {
        canvas.width = Math.max(320, activeDrag.startWidth + dx);
        canvas.height = Math.max(240, activeDrag.startHeight + dy);
        if (debugDiv) debugDiv.textContent = 'SIZE: ' + canvas.width + 'x' + canvas.height;
        // Trigger redraw
        if (typeof window.drawMap === 'function') window.drawMap();
      }
    }, { passive: false });
    
    stage.addEventListener('touchend', () => {
      if (activeDrag) {
        activeDrag = null;
        if (debugDiv) debugDiv.textContent = moveMode ? 'MOVE mode ON' : resizeMode ? 'RESIZE mode ON' : 'Ready';
      }
    });
    
    console.log('[MobileSupport] Mobile controls created');
  }
  
  // Initialize mobile controls
  createMobileControls();

  // Legacy: Add touch support for existing resize handles
  function initStageTouch() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('cv');
    if (!stage || !canvas) {
      return; // Mobile controls handle this now
    }
    
    // Find all resize handles
    const resizeHandles = stage.querySelectorAll('.resize-handle');
    
    // Make resize handles bigger and visible for touch
    resizeHandles.forEach(handle => {
      handle.style.cssText += ';min-width:50px;min-height:50px;opacity:1;background:rgba(0,120,255,0.8);';
      
      handle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const debugDiv = document.getElementById('touch-debug');
        if (debugDiv) debugDiv.textContent = 'RESIZE started';
        
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          
          const startW = canvas.width;
          const startH = canvas.height;
          const startX = touch.clientX;
          const startY = touch.clientY;
          const handleType = handle.classList.contains('corner') ? 'corner' :
                           handle.classList.contains('right') ? 'right' : 'bottom';
          
          const doResize = (moveEvent) => {
            moveEvent.preventDefault();
            if (moveEvent.touches.length !== 1) return;
            const moveTouch = moveEvent.touches[0];
            const dx = moveTouch.clientX - startX;
            const dy = moveTouch.clientY - startY;
            
            if (handleType === 'corner' || handleType === 'right') {
              canvas.width = Math.round(Math.max(320, startW + dx));
            }
            if (handleType === 'corner' || handleType === 'bottom') {
              canvas.height = Math.round(Math.max(240, startH + dy));
            }
            
            if (debugDiv) debugDiv.textContent = 'RESIZE: ' + canvas.width + 'x' + canvas.height;
            
            // Trigger redraw if function exists
            if (typeof window.drawMap === 'function') {
              window.drawMap();
            }
          };
          
          const stopResize = () => {
            if (debugDiv) debugDiv.textContent = 'RESIZE ended';
            window.removeEventListener('touchmove', doResize);
            window.removeEventListener('touchend', stopResize);
            window.removeEventListener('touchcancel', stopResize);
          };
          
          window.addEventListener('touchmove', doResize, { passive: false });
          window.addEventListener('touchend', stopResize);
          window.addEventListener('touchcancel', stopResize);
        }
      }, { passive: false });
    });
    
    // Add stage drag handle for moving the entire stage
    const stageHandle = stage.querySelector('.stage-handle');
    if (stageHandle) {
      console.log('[MobileSupport] Stage handle found, adding touch support');
      stageHandle.style.cssText += ';min-width:80px;min-height:40px;';
      
      stageHandle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const debugDiv = document.getElementById('touch-debug');
        if (debugDiv) debugDiv.textContent = 'DRAG stage started';
        
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          const startX = touch.clientX;
          const startY = touch.clientY;
          const stageRect = stage.getBoundingClientRect();
          const startLeft = stageRect.left;
          const startTop = stageRect.top;
          
          const doDrag = (moveEvent) => {
            moveEvent.preventDefault();
            if (moveEvent.touches.length !== 1) return;
            const moveTouch = moveEvent.touches[0];
            const dx = moveTouch.clientX - startX;
            const dy = moveTouch.clientY - startY;
            
            stage.style.position = 'relative';
            stage.style.left = dx + 'px';
            stage.style.top = dy + 'px';
            
            if (debugDiv) debugDiv.textContent = 'DRAG: ' + dx + ', ' + dy;
          };
          
          const stopDrag = () => {
            if (debugDiv) debugDiv.textContent = 'DRAG ended';
            window.removeEventListener('touchmove', doDrag);
            window.removeEventListener('touchend', stopDrag);
            window.removeEventListener('touchcancel', stopDrag);
          };
          
          window.addEventListener('touchmove', doDrag, { passive: false });
          window.addEventListener('touchend', stopDrag);
          window.addEventListener('touchcancel', stopDrag);
        }
      }, { passive: false });
    } else {
      console.log('[MobileSupport] Stage handle not found');
    }
    
    // Add a mobile-only drag button if stage handle is not visible
    if (!stageHandle || window.getComputedStyle(stageHandle).display === 'none') {
      const mobileDragBtn = document.createElement('div');
      mobileDragBtn.id = 'mobile-stage-drag';
      mobileDragBtn.textContent = '✥ DRAG';
      mobileDragBtn.style.cssText = 'position:absolute;top:-35px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:bold;z-index:100;cursor:grab;touch-action:none;';
      stage.appendChild(mobileDragBtn);
      
      console.log('[MobileSupport] Created mobile drag button');
      
      mobileDragBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const debugDiv = document.getElementById('touch-debug');
        if (debugDiv) debugDiv.textContent = 'DRAG stage started';
        
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          const startX = touch.clientX;
          const startY = touch.clientY;
          
          // Get current transform or position
          const computedStyle = window.getComputedStyle(stage);
          const matrix = new DOMMatrix(computedStyle.transform);
          const currentX = matrix.m41 || 0;
          const currentY = matrix.m42 || 0;
          
          const doDrag = (moveEvent) => {
            moveEvent.preventDefault();
            if (moveEvent.touches.length !== 1) return;
            const moveTouch = moveEvent.touches[0];
            const dx = moveTouch.clientX - startX;
            const dy = moveTouch.clientY - startY;
            
            stage.style.transform = `translate(${currentX + dx}px, ${currentY + dy}px)`;
            
            if (debugDiv) debugDiv.textContent = 'DRAG: ' + (currentX + dx).toFixed(0) + ', ' + (currentY + dy).toFixed(0);
          };
          
          const stopDrag = () => {
            if (debugDiv) debugDiv.textContent = 'DRAG ended';
            window.removeEventListener('touchmove', doDrag);
            window.removeEventListener('touchend', stopDrag);
            window.removeEventListener('touchcancel', stopDrag);
          };
          
          window.addEventListener('touchmove', doDrag, { passive: false });
          window.addEventListener('touchend', stopDrag);
          window.addEventListener('touchcancel', stopDrag);
        }
      }, { passive: false });
    }
  }
  
  // Initialize stage touch handlers
  initStageTouch();

  // Mobile UI Enhancements
  if (isMobile) {
    // Make editor bar collapsible by default on mobile
    const topEditorBar = document.getElementById('topEditorBar');
    const tebRestoreBar = document.getElementById('tebRestoreBar');
    
    if (topEditorBar && isLandscape()) {
      // Start collapsed on mobile landscape for more screen space
      topEditorBar.classList.add('hidden');
      if (tebRestoreBar) {
        tebRestoreBar.style.display = 'flex';
      }
    }

    // Improve touch targets for small buttons
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 1024px) and (orientation: landscape) {
        /* Larger touch targets for mobile */
        .teb-btn, .teb-action-btn, .tool {
          min-width: 44px !important;
          min-height: 44px !important;
          padding: 8px 12px !important;
        }

        /* Collapsible sidebar on mobile */
        .sidebar {
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar.mobile-open {
          transform: translateX(0);
        }

        /* Floating toggle button for sidebar */
        .mobile-sidebar-toggle {
          position: fixed;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          background: var(--panel);
          border: 2px solid var(--accent);
          border-radius: 8px;
          padding: 12px 8px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* Adjust context menu positioning for mobile */
        .ctx-menu {
          max-width: 90vw !important;
          max-height: 80vh !important;
          overflow-y: auto !important;
        }

        /* Make dropdowns full-width on mobile */
        .teb-dropdown-menu {
          left: 0 !important;
          right: 0 !important;
          max-width: 100vw !important;
        }

        /* Improve number input controls */
        input[type="number"] {
          font-size: 16px !important; /* Prevents zoom on iOS */
        }
      }
    `;
    document.head.appendChild(style);

    // Add sidebar toggle button for mobile
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && isLandscape()) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'mobile-sidebar-toggle';
      toggleBtn.innerHTML = '🛠️';
      toggleBtn.title = 'Toggle Tools';
      
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
      
      document.body.appendChild(toggleBtn);

      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }
  }

  // Prevent double-tap zoom on iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevent pull-to-refresh on mobile
  document.body.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  console.log('[Mobile Support] Module loaded', { isMobile, isLandscape: isLandscape() });
})();
