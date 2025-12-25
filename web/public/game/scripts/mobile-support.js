// Mobile Support - Clean Implementation
// Single-finger = mouse (draw/drag), 2-finger = zoom/pan

(function() {
  'use strict';
  
  // Only run on touch devices
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isMobile) return;
  
  console.log('[Mobile] Touch device detected, enabling mobile support');
  
  // Wait for DOM ready
  function init() {
    const canvas = document.getElementById('cv');
    const stage = document.getElementById('stage');
    if (!canvas || !stage) {
      console.warn('[Mobile] Canvas or stage not found');
      return;
    }
    
    // State
    let lastTouchDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };
    let isTwoFinger = false;
    
    // Convert touch to mouse event
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
    
    // Get distance between two touch points
    function getTouchDistance(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Get center point between two touches
    function getTouchCenter(t1, t2) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }
    
    // Canvas touch handlers - convert to mouse for drawing
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        // Single finger - convert to mouse for drawing
        touchToMouse('touchstart', e.touches[0], canvas);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // 2-finger - start zoom/pan
        isTwoFinger = true;
        lastTouchDistance = getTouchDistance(e.touches[0], e.touches[1]);
        lastTouchCenter = getTouchCenter(e.touches[0], e.touches[1]);
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && !isTwoFinger) {
        // Single finger - convert to mouse for drawing
        touchToMouse('touchmove', e.touches[0], canvas);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // 2-finger zoom/pan
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
        
        // Pinch zoom via StageTransform
        if (lastTouchDistance > 0 && window.StageTransform) {
          const scaleFactor = currentDistance / lastTouchDistance;
          const currentScale = window.StageTransform.getScale ? window.StageTransform.getScale() : 1;
          const newScale = Math.max(0.25, Math.min(3, currentScale * scaleFactor));
          if (window.StageTransform.setScale) {
            window.StageTransform.setScale(newScale, currentCenter.x, currentCenter.y);
          }
        }
        
        // Pan (scroll page)
        const dx = currentCenter.x - lastTouchCenter.x;
        const dy = currentCenter.y - lastTouchCenter.y;
        window.scrollBy(-dx, -dy);
        
        lastTouchDistance = currentDistance;
        lastTouchCenter = currentCenter;
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        if (!isTwoFinger) {
          // Single finger ended - send mouseup
          touchToMouse('touchend', e.changedTouches[0], canvas);
        }
        isTwoFinger = false;
        lastTouchDistance = 0;
      } else if (e.touches.length === 1) {
        // Went from 2 fingers to 1
        isTwoFinger = false;
      }
      e.preventDefault();
    }, { passive: false });
    
    // Make Map Editor panel draggable on mobile
    const mapEditor = document.querySelector('.map-editor');
    if (mapEditor) {
      let isDraggingPanel = false;
      let panelStartX = 0, panelStartY = 0;
      let panelOrigX = 0, panelOrigY = 0;
      
      const header = mapEditor.querySelector('.me-header');
      if (header) {
        header.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            isDraggingPanel = true;
            panelStartX = e.touches[0].clientX;
            panelStartY = e.touches[0].clientY;
            const rect = mapEditor.getBoundingClientRect();
            panelOrigX = rect.left;
            panelOrigY = rect.top;
            e.preventDefault();
          }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
          if (isDraggingPanel && e.touches.length === 1) {
            const dx = e.touches[0].clientX - panelStartX;
            const dy = e.touches[0].clientY - panelStartY;
            mapEditor.style.position = 'fixed';
            mapEditor.style.left = (panelOrigX + dx) + 'px';
            mapEditor.style.top = (panelOrigY + dy) + 'px';
            mapEditor.style.right = 'auto';
            e.preventDefault();
          }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
          isDraggingPanel = false;
        });
      }
    }
    
    console.log('[Mobile] Touch handlers attached');
    
    // Add body class for mobile-specific CSS
    document.body.classList.add('is-mobile');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
