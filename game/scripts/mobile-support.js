// @ts-check
// Mobile Support Module
// Adds pinch-to-zoom, touch gestures, and mobile-specific UI adaptations

(function() {
  if (typeof window === 'undefined') return;

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = () => window.innerWidth > window.innerHeight;

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

  // Add touch support to canvas
  const canvas = document.getElementById('cv');
  if (canvas && isMobile) {
    let touchToMouseActive = false;
    
    console.log('[MobileSupport] Canvas touch handlers initialized');
    console.log('[MobileSupport] StageTransform available:', !!window.StageTransform);
    
    // Unified touch handler
    canvas.addEventListener('touchstart', (e) => {
      console.log('[MobileSupport] touchstart - fingers:', e.touches.length);
      
      if (e.touches.length === 2) {
        // 2-finger: pinch zoom & pan
        e.preventDefault();
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
        // 1-finger: convert to mouse event for drag/draw
        touchToMouseActive = true;
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
          bubbles: true,
          cancelable: true
        });
        canvas.dispatchEvent(mouseEvent);
        console.log('[MobileSupport] 1-finger - dispatched mousedown');
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && (pinchState.active || panState.active)) {
        // 2-finger: pinch & pan
        e.preventDefault();
        
        if (pinchState.active) {
          const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
          const scale = (currentDistance / pinchState.initialDistance) * pinchState.initialScale;
          
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
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
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

    canvas.addEventListener('touchcancel', () => {
      pinchState.active = false;
      panState.active = false;
      touchToMouseActive = false;
    });
  }

  // Add touch support for stage resize handles
  if (isMobile) {
    const stage = document.getElementById('stage');
    if (stage) {
      // Find all resize handles
      const resizeHandles = stage.querySelectorAll('.resize-handle');
      
      resizeHandles.forEach(handle => {
        handle.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            const canvas = document.getElementById('cv');
            if (!canvas) return;
            
            const startW = canvas.width;
            const startH = canvas.height;
            const startX = touch.clientX;
            const startY = touch.clientY;
            const handleType = handle.classList.contains('corner') ? 'corner' :
                             handle.classList.contains('right') ? 'right' : 'bottom';
            
            const doResize = (moveEvent) => {
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
              
              // Trigger redraw if function exists
              if (typeof window.drawMap === 'function') {
                window.drawMap();
              }
            };
            
            const stopResize = () => {
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
    }
  }

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
