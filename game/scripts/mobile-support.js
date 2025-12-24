// Mobile Support Module - Rebuilt from scratch
// Simple and clean: pinch zoom + touch-to-mouse conversion

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  // Always run on all devices - don't check hasTouch
  // This ensures no early return that could cause issues
  console.log('[MobileSupport] Module starting...');
  
  console.log('[MobileSupport] Touch support detected, initializing...');

  // State for pinch zoom
  let pinchActive = false;
  let initialPinchDistance = 0;
  let initialZoom = 1;
  
  // State for touch-to-mouse
  let touchActive = false;

  // Calculate distance between two touch points
  function getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get canvas element (with retry)
  function getCanvas() {
    return document.getElementById('cv');
  }

  // Check if touch is on canvas
  function isTouchOnCanvas(touch) {
    const canvas = getCanvas();
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    return touch.clientX >= rect.left && touch.clientX <= rect.right &&
           touch.clientY >= rect.top && touch.clientY <= rect.bottom;
  }

  // Convert touch to mouse event and dispatch on canvas
  function dispatchMouseEvent(type, touch) {
    const canvas = getCanvas();
    if (!canvas) return;
    
    const mouseEvent = new MouseEvent(type, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: type === 'mouseup' ? 0 : 1,
      bubbles: true,
      cancelable: true
    });
    canvas.dispatchEvent(mouseEvent);
  }

  // TOUCH START
  document.addEventListener('touchstart', (e) => {
    const touches = e.touches;
    
    // 2 fingers = pinch zoom
    if (touches.length === 2) {
      e.preventDefault();
      pinchActive = true;
      touchActive = false;
      initialPinchDistance = getDistance(touches[0], touches[1]);
      
      // Get current zoom from StageTransform
      if (window.StageTransform && window.StageTransform.zoom) {
        initialZoom = window.StageTransform.zoom;
      } else {
        initialZoom = 1;
      }
      console.log('[MobileSupport] Pinch started, initialZoom:', initialZoom);
      return;
    }
    
    // 1 finger on canvas = drawing/interaction
    if (touches.length === 1) {
      const touch = touches[0];
      
      if (isTouchOnCanvas(touch)) {
        e.preventDefault();
        touchActive = true;
        dispatchMouseEvent('mousedown', touch);
        console.log('[MobileSupport] Touch on canvas - mousedown');
      }
    }
  }, { passive: false, capture: true });

  // TOUCH MOVE
  document.addEventListener('touchmove', (e) => {
    const touches = e.touches;
    
    // 2 fingers = zoom
    if (touches.length === 2 && pinchActive) {
      e.preventDefault();
      
      const currentDistance = getDistance(touches[0], touches[1]);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.max(0.1, Math.min(5, initialZoom * scale));
      
      // Apply zoom via StageTransform
      if (window.StageTransform && window.StageTransform.setZoom) {
        window.StageTransform.setZoom(newZoom);
      }
      return;
    }
    
    // 1 finger = drawing
    if (touches.length === 1 && touchActive) {
      e.preventDefault();
      dispatchMouseEvent('mousemove', touches[0]);
    }
  }, { passive: false, capture: true });

  // TOUCH END
  document.addEventListener('touchend', (e) => {
    if (pinchActive && e.touches.length < 2) {
      pinchActive = false;
      console.log('[MobileSupport] Pinch ended');
    }
    
    if (touchActive && e.touches.length === 0) {
      touchActive = false;
      // Dispatch mouseup at last known position
      if (e.changedTouches.length > 0) {
        dispatchMouseEvent('mouseup', e.changedTouches[0]);
      }
      console.log('[MobileSupport] Touch ended - mouseup');
    }
  }, { passive: false, capture: true });

  // TOUCH CANCEL
  document.addEventListener('touchcancel', () => {
    pinchActive = false;
    touchActive = false;
  }, { capture: true });

  // Prevent double-tap zoom
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
    }
    lastTap = now;
  }, { passive: false });

  console.log('[MobileSupport] Module initialized successfully');
})();
