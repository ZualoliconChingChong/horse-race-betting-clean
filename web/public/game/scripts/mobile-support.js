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

  // Pinch-to-Zoom Support
  let pinchState = {
    active: false,
    initialDistance: 0,
    initialScale: 1
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

  // Add pinch zoom to canvas
  const canvas = document.getElementById('cv');
  if (canvas && isMobile) {
    // Pinch zoom (2 fingers)
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchState.active = true;
        pinchState.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
        
        // Get current zoom from stage transform if available
        if (window.StageTransform && typeof window.StageTransform.getZoom === 'function') {
          pinchState.initialScale = window.StageTransform.getZoom();
        } else {
          pinchState.initialScale = 1;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinchState.active) {
        e.preventDefault();
        
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = (currentDistance / pinchState.initialDistance) * pinchState.initialScale;
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        
        // Apply zoom via stage transform if available
        if (window.StageTransform && typeof window.StageTransform.setZoom === 'function') {
          window.StageTransform.setZoom(scale, true);
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        pinchState.active = false;
      }
    });

    canvas.addEventListener('touchcancel', () => {
      pinchState.active = false;
    });

    // Convert single-touch to mouse events for drag/resize compatibility
    // This allows existing mouse-based drag logic to work with touch
    let touchToMouseActive = false;
    
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !pinchState.active) {
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
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && touchToMouseActive && !pinchState.active) {
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
      if (touchToMouseActive) {
        touchToMouseActive = false;
        const mouseEvent = new MouseEvent('mouseup', {
          button: 0,
          bubbles: true,
          cancelable: true
        });
        canvas.dispatchEvent(mouseEvent);
      }
    });
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
