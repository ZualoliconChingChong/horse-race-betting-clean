/**
 * Waiting Room Interactive Resize System
 * Handles drag-to-resize functionality for the waiting room in editor mode
 * 
 * Features:
 * - Right edge resize
 * - Bottom edge resize
 * - Corner resize (both width and height)
 * - Grid snapping support
 * - Visual cursor feedback
 * - Auto-update gate and start line alignment
 */

(function() {
  'use strict';

  // ===== Configuration =====
  const TOL = 8; // px tolerance in canvas space for hit detection
  const W_MIN = 160, H_MIN = 160;
  const W_MAX = 1200, H_MAX = 1200;

  // ===== State =====
  let wrDrag = null; // { mode:'right'|'bottom'|'corner', startX, startY, startW, startH }

  // ===== Helper Functions =====

  /**
   * Get mouse position in canvas coordinates (accounting for zoom)
   * @param {MouseEvent} e - Mouse event
   * @returns {{x: number, y: number}} Canvas coordinates
   */
  function getMouseInCanvas(e) {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
    const zoomScale = window.zoomScale || 1;
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;
    return { x, y };
  }

  /**
   * Test if mouse is on resize handle
   * @param {number} mx - Mouse X in canvas
   * @param {number} my - Mouse Y in canvas
   * @returns {string|null} 'right', 'bottom', 'corner', or null
   */
  function hitTest(mx, my) {
    const rm = window.mapDef?.waitingRoom;
    if (!rm) return null;

    const rightDist = Math.abs(mx - (rm.x + rm.w));
    const bottomDist = Math.abs(my - (rm.y + rm.h));
    const onRight = (my >= rm.y - TOL && my <= rm.y + rm.h + TOL && rightDist <= TOL);
    const onBottom = (mx >= rm.x - TOL && mx <= rm.x + rm.w + TOL && bottomDist <= TOL);
    const inCorner = (Math.hypot(mx - (rm.x + rm.w), my - (rm.y + rm.h)) <= TOL * 1.6);

    if (inCorner) return 'corner';
    if (onRight) return 'right';
    if (onBottom) return 'bottom';
    return null;
  }

  /**
   * Snap value to grid if grid is enabled
   * @param {number} v - Value to snap
   * @returns {number} Snapped value
   */
  function snap(v) {
    try {
      const el = document.getElementById('grid');
      const step = Math.max(1, parseInt(el && el.value || '0', 10) || 0);
      if (!step) return Math.round(v);
      return Math.round(v / step) * step;
    } catch {
      return Math.round(v);
    }
  }

  /**
   * Clamp width and height to valid ranges
   * @param {number} w - Width
   * @param {number} h - Height
   * @returns {{w: number, h: number}} Clamped dimensions
   */
  function clampWH(w, h) {
    return {
      w: Math.max(W_MIN, Math.min(W_MAX, w)),
      h: Math.max(H_MIN, Math.min(H_MAX, h))
    };
  }

  /**
   * Update UI and redraw after resize
   */
  function updateUIAndRedraw() {
    try {
      if (typeof window.alignGateToWaitingRoom === 'function') {
        window.alignGateToWaitingRoom();
      }
    } catch {}
    
    try {
      if (typeof window.refreshWaitingRoomInputs === 'function') {
        window.refreshWaitingRoomInputs();
      }
    } catch {}
    
    try {
      if (typeof window.invalidateStaticLayer === 'function') {
        window.invalidateStaticLayer();
      }
      if (typeof window.drawMap === 'function') {
        window.drawMap();
      }
    } catch {}
  }

  // ===== Event Handlers =====
  const canvas = document.getElementById('cv');

  if (canvas) {
    // Mouse move: update cursor and handle dragging
    canvas.addEventListener('mousemove', (e) => {
      if (window.mode !== 'editor') return;
      const rm = window.mapDef?.waitingRoom;
      if (!rm) return;

      const { x: mx, y: my } = getMouseInCanvas(e);

      if (wrDrag) {
        // Dragging active - resize
        const dx = mx - wrDrag.startX;
        const dy = my - wrDrag.startY;
        let w = wrDrag.startW;
        let h = wrDrag.startH;

        if (wrDrag.mode === 'right' || wrDrag.mode === 'corner') {
          w = snap(wrDrag.startW + dx);
        }
        if (wrDrag.mode === 'bottom' || wrDrag.mode === 'corner') {
          h = snap(wrDrag.startH + dy);
        }

        const cl = clampWH(w, h);
        rm.w = cl.w;
        rm.h = cl.h;
        updateUIAndRedraw();
        return;
      }

      // Not dragging - update cursor
      const hit = hitTest(mx, my);
      if (hit === 'corner') canvas.style.cursor = 'nwse-resize';
      else if (hit === 'right') canvas.style.cursor = 'ew-resize';
      else if (hit === 'bottom') canvas.style.cursor = 'ns-resize';
      else canvas.style.cursor = '';
    });

    // Mouse down: start drag
    canvas.addEventListener('mousedown', (e) => {
      if (window.mode !== 'editor') return;
      const rm = window.mapDef?.waitingRoom;
      if (!rm) return;

      const { x: mx, y: my } = getMouseInCanvas(e);
      const hit = hitTest(mx, my);
      if (!hit) return; // Let other tools handle

      e.preventDefault();
      e.stopPropagation();

      wrDrag = {
        mode: hit,
        startX: mx,
        startY: my,
        startW: rm.w,
        startH: rm.h
      };

      if (hit === 'corner') canvas.style.cursor = 'nwse-resize';
      else if (hit === 'right') canvas.style.cursor = 'ew-resize';
      else if (hit === 'bottom') canvas.style.cursor = 'ns-resize';
    });

    // Mouse up: end drag
    window.addEventListener('mouseup', () => {
      if (!wrDrag) return;
      wrDrag = null;
      canvas.style.cursor = '';
    });
  }

  // ===== Public API =====
  const WaitingRoomResize = {
    isResizing: () => wrDrag !== null,
    cancelResize: () => {
      wrDrag = null;
      if (canvas) canvas.style.cursor = '';
    }
  };

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.WaitingRoomResize = Object.freeze(WaitingRoomResize);
  }

  try {
    console.log('[WaitingRoomResize] Loaded successfully');
  } catch {}
})();
