/**
 * Canvas Resize Handles System
 * Creates interactive resize handles for the canvas element in editor mode
 * 
 * Features:
 * - Corner resize (width + height)
 * - Right edge resize (width only)
 * - Bottom edge resize (height only)
 * - Minimum size constraints (320x240)
 * - Visual cursor feedback
 * - Auto-render on resize
 */

(function() {
  'use strict';

  // ===== Configuration =====
  const MIN_WIDTH = 320;
  const MIN_HEIGHT = 240;

  // ===== Setup Function =====
  
  /**
   * Create and attach resize handles to the stage
   */
  function setupResizeHandles() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('cv');
    
    if (!stage || !canvas) {
      console.warn('[CanvasResize] Stage or canvas not found, skipping resize handles');
      return;
    }

    const handles = [
      { type: 'corner', cursor: 'nwse-resize' },
      { type: 'right', cursor: 'ew-resize' },
      { type: 'bottom', cursor: 'ns-resize' }
    ];

    handles.forEach(h => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${h.type}`;
      stage.appendChild(handle);

      handle.addEventListener('mousedown', e => {
        // Don't allow resize in fullscreen mode
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        if (isFullscreen) return;
        
        e.preventDefault();
        e.stopPropagation();

        const startW = canvas.width;
        const startH = canvas.height;
        const startX = e.clientX;
        const startY = e.clientY;
        document.body.style.cursor = h.cursor;

        const doResize = (moveEvent) => {
          // Double check fullscreen during resize
          const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
          if (isFullscreen) {
            stopResize();
            return;
          }
          
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          if (h.type === 'corner' || h.type === 'right') {
            canvas.width = Math.round(Math.max(MIN_WIDTH, startW + dx));
          }
          if (h.type === 'corner' || h.type === 'bottom') {
            canvas.height = Math.round(Math.max(MIN_HEIGHT, startH + dy));
          }
          
          // Trigger render if function exists
          if (typeof window.render === 'function') {
            window.render();
          }
        };

        const stopResize = () => {
          document.body.style.cursor = 'default';
          window.removeEventListener('mousemove', doResize);
          window.removeEventListener('mouseup', stopResize);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
      });
    });
  }

  // ===== Auto-Initialize =====
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupResizeHandles);
  } else {
    setupResizeHandles();
  }

  // ===== Public API =====
  
  const CanvasResize = {
    setup: setupResizeHandles
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.CanvasResize = Object.freeze(CanvasResize);
  }

  try {
    console.log('[CanvasResize] Loaded successfully');
  } catch {}
})();
