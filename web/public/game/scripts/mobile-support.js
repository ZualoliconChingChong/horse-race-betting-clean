// Mobile Support - Complete Rewrite for Gameplay + Editor
// Handles: auto-fit canvas, touch-to-mouse, pinch zoom/pan, mobile HUD

(function() {
  'use strict';
  
  // Only run on touch devices
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isMobile) return;
  
  console.log('[Mobile] Touch device detected, enabling mobile support');
  
  function init() {
    const canvas = document.getElementById('cv');
    const stage = document.getElementById('stage');
    if (!canvas || !stage) {
      console.warn('[Mobile] Canvas or stage not found, retrying...');
      setTimeout(init, 300);
      return;
    }
    
    // Add body class for mobile-specific CSS
    document.body.classList.add('is-mobile');
    
    // ===== STATE =====
    let lastTouchDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };
    let isTwoFinger = false;
    
    // CSS Transform zoom state
    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    
    // Long-press pan state
    let longPressTimer = null;
    let isLongPressPan = false;
    let panStartX = 0, panStartY = 0;
    let lastPanX = 0, lastPanY = 0;
    let hasStartedDrawing = false;
    const LONG_PRESS_DELAY = 500;
    
    // ===== AUTO-FIT CANVAS TO VIEWPORT =====
    function fitCanvasToScreen() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Get actual canvas pixel dimensions
      const cw = canvas.width || 1200;
      const ch = canvas.height || 800;
      
      // Reserve space for top editor bar (~44px) and game hub (~36px)
      const topBar = document.querySelector('.top-editor-bar');
      const gameHub = document.querySelector('.game-hub');
      const topHeight = topBar && !topBar.classList.contains('hidden') ? 44 : 0;
      const bottomHeight = gameHub ? 36 : 0;
      const availH = vh - topHeight - bottomHeight;
      
      // Calculate scale to fit
      const scaleX = vw / cw;
      const scaleY = availH / ch;
      currentScale = Math.min(scaleX, scaleY);
      currentScale = Math.max(0.1, Math.min(1.5, currentScale));
      
      // Center canvas
      const scaledW = cw * currentScale;
      const scaledH = ch * currentScale;
      translateX = (vw - scaledW) / 2;
      translateY = topHeight + (availH - scaledH) / 2;
      
      applyTransform();
      console.log('[Mobile] fitCanvas: scale=' + currentScale.toFixed(3) + 
                  ' canvas=' + cw + 'x' + ch + ' viewport=' + vw + 'x' + vh);
    }
    
    // Apply CSS transform to stage
    function applyTransform() {
      stage.style.transformOrigin = '0 0';
      stage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }
    
    // Reset view to fit screen
    function resetView() {
      fitCanvasToScreen();
      showHint('🔄 View reset');
    }
    
    // Initial fit after layout settles
    setTimeout(fitCanvasToScreen, 600);
    setTimeout(fitCanvasToScreen, 1500); // Re-fit after map loads
    
    // Re-fit on orientation change and resize
    window.addEventListener('orientationchange', () => setTimeout(fitCanvasToScreen, 300));
    window.addEventListener('resize', () => setTimeout(fitCanvasToScreen, 200));
    
    // Watch for canvas size changes (map load)
    let lastCanvasW = 0, lastCanvasH = 0;
    const canvasObserver = setInterval(() => {
      if (canvas.width !== lastCanvasW || canvas.height !== lastCanvasH) {
        lastCanvasW = canvas.width;
        lastCanvasH = canvas.height;
        fitCanvasToScreen();
      }
    }, 1000);
    
    // ===== TOUCH TO MOUSE CONVERSION =====
    function touchToMouse(type, touch, target) {
      const mouseType = {
        'touchstart': 'mousedown',
        'touchmove': 'mousemove',
        'touchend': 'mouseup'
      }[type];
      
      if (!mouseType) return;
      
      // Convert screen coordinates to canvas coordinates accounting for CSS transform
      const rect = canvas.getBoundingClientRect();
      const scaleRatioX = canvas.width / rect.width;
      const scaleRatioY = canvas.height / rect.height;
      
      const canvasX = (touch.clientX - rect.left) * scaleRatioX;
      const canvasY = (touch.clientY - rect.top) * scaleRatioY;
      
      const mouseEvent = new MouseEvent(mouseType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        button: 0,
        buttons: type === 'touchend' ? 0 : 1
      });
      
      // Store canvas-local coords for any code that reads them
      mouseEvent._canvasX = canvasX;
      mouseEvent._canvasY = canvasY;
      
      target.dispatchEvent(mouseEvent);
    }
    
    // ===== GESTURE HELPERS =====
    function getTouchDistance(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    function getTouchCenter(t1, t2) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }
    
    // ===== HINT OVERLAY =====
    let hintTimeout = null;
    function showHint(text) {
      let hint = document.getElementById('mobile-zoom-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'mobile-zoom-hint';
        hint.className = 'mobile-zoom-hint';
        document.body.appendChild(hint);
      }
      hint.textContent = text;
      hint.classList.add('show');
      clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => hint.classList.remove('show'), 1500);
    }
    
    function showPanIndicator(show) {
      let indicator = document.getElementById('mobile-pan-indicator');
      if (show) {
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.id = 'mobile-pan-indicator';
          indicator.innerHTML = '✋ Pan Mode';
          indicator.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:white;padding:12px 24px;border-radius:8px;font-size:16px;z-index:99999;pointer-events:none;';
          document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
      } else if (indicator) {
        indicator.style.display = 'none';
      }
    }
    
    // ===== CANVAS TOUCH HANDLERS =====
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        panStartX = touch.clientX;
        panStartY = touch.clientY;
        lastPanX = touch.clientX;
        lastPanY = touch.clientY;
        hasStartedDrawing = false;
        
        // Long-press for pan (editor mode)
        longPressTimer = setTimeout(() => {
          if (!hasStartedDrawing) {
            isLongPressPan = true;
            showPanIndicator(true);
            if (navigator.vibrate) navigator.vibrate(50);
          }
        }, LONG_PRESS_DELAY);
        
        // Forward as mouse event
        touchToMouse('touchstart', touch, canvas);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // Cancel long-press and drawing
        clearTimeout(longPressTimer);
        isLongPressPan = false;
        hasStartedDrawing = false;
        showPanIndicator(false);
        
        // Start pinch zoom/pan
        isTwoFinger = true;
        lastTouchDistance = getTouchDistance(e.touches[0], e.touches[1]);
        lastTouchCenter = getTouchCenter(e.touches[0], e.touches[1]);
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - panStartX, 2) + 
          Math.pow(touch.clientY - panStartY, 2)
        );
        
        if (moveDistance > 5) {
          hasStartedDrawing = true;
          clearTimeout(longPressTimer);
        }
        
        if (isLongPressPan) {
          // Pan mode - move the stage view
          const dx = touch.clientX - lastPanX;
          const dy = touch.clientY - lastPanY;
          translateX += dx;
          translateY += dy;
          applyTransform();
          lastPanX = touch.clientX;
          lastPanY = touch.clientY;
        } else if (!isTwoFinger) {
          // Normal touch interaction (drawing/clicking)
          touchToMouse('touchmove', touch, canvas);
        }
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // Pinch zoom + pan
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
        
        if (lastTouchDistance > 0) {
          const scaleFactor = currentDistance / lastTouchDistance;
          const newScale = Math.max(0.1, Math.min(3, currentScale * scaleFactor));
          
          // Zoom towards pinch center
          const cx = currentCenter.x;
          const cy = currentCenter.y;
          const ratio = newScale / currentScale;
          translateX = cx - ratio * (cx - translateX);
          translateY = cy - ratio * (cy - translateY);
          currentScale = newScale;
        }
        
        // Pan
        const dx = currentCenter.x - lastTouchCenter.x;
        const dy = currentCenter.y - lastTouchCenter.y;
        translateX += dx;
        translateY += dy;
        
        applyTransform();
        
        lastTouchDistance = currentDistance;
        lastTouchCenter = currentCenter;
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
      clearTimeout(longPressTimer);
      
      if (e.touches.length === 0) {
        if (isLongPressPan) {
          isLongPressPan = false;
          showPanIndicator(false);
        } else if (!isTwoFinger) {
          touchToMouse('touchend', e.changedTouches[0], canvas);
        }
        isTwoFinger = false;
        hasStartedDrawing = false;
        lastTouchDistance = 0;
      } else if (e.touches.length === 1) {
        isTwoFinger = false;
      }
      e.preventDefault();
    }, { passive: false });
    
    // ===== DOUBLE-TAP TO RESET VIEW =====
    let lastTap = 0;
    canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        const now = Date.now();
        if (now - lastTap < 300) {
          resetView();
        }
        lastTap = now;
      }
    });
    
    // ===== FULLSCREEN BUTTON =====
    const fsBtn = document.createElement('button');
    fsBtn.className = 'mobile-fullscreen-btn';
    fsBtn.innerHTML = '⛶';
    fsBtn.title = 'Fit to screen';
    fsBtn.addEventListener('click', () => {
      resetView();
    });
    document.body.appendChild(fsBtn);
    
    // ===== PREVENT DEFAULT BROWSER BEHAVIORS =====
    // Prevent pull-to-refresh and rubber-band scrolling
    document.body.addEventListener('touchmove', (e) => {
      if (e.target === canvas || canvas.contains(e.target)) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Prevent double-tap zoom on body
    let lastBodyTap = 0;
    document.body.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastBodyTap < 300) {
        e.preventDefault();
      }
      lastBodyTap = now;
    }, { passive: false });
    
    // ===== SHOW INITIAL HINT =====
    setTimeout(() => {
      showHint('📱 2 ngón: zoom/pan • 2x tap: reset view');
    }, 2000);
    
    // ===== EXPOSE API =====
    window.MobileSupport = {
      fitToScreen: fitCanvasToScreen,
      resetView: resetView,
      getScale: () => currentScale,
      isMobile: true
    };
    
    console.log('[Mobile] Touch handlers attached, auto-fit enabled');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure canvas is initialized
    setTimeout(init, 100);
  }
})();
