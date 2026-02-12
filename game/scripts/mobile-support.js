// Mobile Support - Auto-fit canvas to viewport using fake-fullscreen
// No manual zoom/pan needed — game fits perfectly on mobile from start

(function() {
  'use strict';
  
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isMobile) return;
  
  console.log('[Mobile] Touch device detected');
  
  function init() {
    const canvas = document.getElementById('cv');
    const stage = document.getElementById('stage');
    if (!canvas || !stage) {
      setTimeout(init, 300);
      return;
    }
    
    document.body.classList.add('is-mobile');
    
    // ===== AUTO-ENTER FAKE FULLSCREEN =====
    // Reuses the game's existing fake-fullscreen CSS for perfect canvas fitting
    function enterMobileFullscreen() {
      if (stage.classList.contains('fake-fullscreen')) return;
      
      stage.classList.add('fake-fullscreen');
      document.body.classList.add('has-fake-fullscreen');
      
      // Force stage transform off — CSS handles sizing via object-fit
      stage.style.setProperty('transform', 'none', 'important');
      stage.style.setProperty('transition', 'none', 'important');
      
      // Clear canvas inline styles so CSS takes over
      canvas.removeAttribute('style');
      
      // Force reflow
      void stage.offsetHeight;
      void canvas.offsetHeight;
      
      // Force redraw
      if (typeof window.render === 'function') window.render();
      if (typeof window.drawMap === 'function') window.drawMap();
      
      updateOrientation();
      console.log('[Mobile] Auto-entered fullscreen, canvas:', canvas.width + 'x' + canvas.height,
                  'viewport:', window.innerWidth + 'x' + window.innerHeight);
    }
    
    // ===== ORIENTATION HANDLING =====
    function isLandscape() {
      return window.innerWidth > window.innerHeight;
    }
    
    function updateOrientation() {
      if (isLandscape()) {
        document.body.classList.add('mobile-landscape');
        document.body.classList.remove('mobile-portrait');
      } else {
        document.body.classList.add('mobile-portrait');
        document.body.classList.remove('mobile-landscape');
      }
    }
    
    // Re-fit on orientation change / resize
    function onViewportChange() {
      updateOrientation();
      // Clear canvas inline styles so CSS recalculates
      canvas.removeAttribute('style');
      void canvas.offsetHeight;
      if (typeof window.render === 'function') window.render();
    }
    
    window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 300));
    window.addEventListener('resize', () => setTimeout(onViewportChange, 150));
    
    // Watch for canvas dimension changes (map load) and re-enter fullscreen
    let lastCW = 0, lastCH = 0;
    const sizeWatcher = setInterval(() => {
      if (canvas.width !== lastCW || canvas.height !== lastCH) {
        lastCW = canvas.width;
        lastCH = canvas.height;
        // Re-clear styles so CSS object-fit recalculates for new dimensions
        canvas.removeAttribute('style');
        void canvas.offsetHeight;
        console.log('[Mobile] Canvas resized to', lastCW + 'x' + lastCH + ', re-fitting');
      }
    }, 800);
    
    // Enter fullscreen immediately and again after map loads
    enterMobileFullscreen();
    setTimeout(enterMobileFullscreen, 500);
    setTimeout(enterMobileFullscreen, 1500);
    setTimeout(enterMobileFullscreen, 3000);
    
    // ===== TOUCH → MOUSE CONVERSION =====
    function touchToMouse(type, touch, target) {
      const mouseType = {
        'touchstart': 'mousedown',
        'touchmove': 'mousemove',
        'touchend': 'mouseup'
      }[type];
      if (!mouseType) return;
      
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
      
      target.dispatchEvent(mouseEvent);
    }
    
    // ===== TOUCH HANDLERS =====
    let isTwoFinger = false;
    
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchToMouse('touchstart', e.touches[0], canvas);
        e.preventDefault();
      } else if (e.touches.length >= 2) {
        isTwoFinger = true;
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && !isTwoFinger) {
        touchToMouse('touchmove', e.touches[0], canvas);
      }
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        if (!isTwoFinger) {
          touchToMouse('touchend', e.changedTouches[0], canvas);
        }
        isTwoFinger = false;
      }
      e.preventDefault();
    }, { passive: false });
    
    // ===== PREVENT BROWSER GESTURES =====
    document.body.addEventListener('touchmove', (e) => {
      if (e.target === canvas || stage.contains(e.target)) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Prevent double-tap zoom
    let lastTapTime = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTapTime < 300) e.preventDefault();
      lastTapTime = now;
    }, { passive: false });
    
    // ===== LANDSCAPE EDITOR BAR TOGGLE =====
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-editor-toggle';
    toggleBtn.innerHTML = '🛠️ Editor';
    document.body.appendChild(toggleBtn);
    
    toggleBtn.addEventListener('click', () => {
      const topBar = stage.querySelector('.top-editor-bar');
      if (!topBar) return;
      const isOpen = topBar.classList.toggle('mobile-bar-open');
      toggleBtn.classList.toggle('bar-open', isOpen);
      toggleBtn.innerHTML = isOpen ? '✕ Đóng' : '🛠️ Editor';
      // Re-clear canvas style so CSS recalculates max-height
      canvas.removeAttribute('style');
      void canvas.offsetHeight;
    });
    
    // Close editor bar when switching to landscape (start clean)
    function onOrientationUpdate() {
      const topBar = stage.querySelector('.top-editor-bar');
      if (topBar) {
        topBar.classList.remove('mobile-bar-open');
        toggleBtn.classList.remove('bar-open');
        toggleBtn.innerHTML = '🛠️ Editor';
      }
    }
    
    // Hook into orientation change
    window.addEventListener('orientationchange', () => setTimeout(onOrientationUpdate, 350));
    window.addEventListener('resize', () => setTimeout(onOrientationUpdate, 200));
    
    // ===== EXPOSE API =====
    window.MobileSupport = {
      refit: onViewportChange,
      isLandscape: isLandscape,
      isMobile: true
    };
    
    console.log('[Mobile] Auto-fit fullscreen mode active');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
