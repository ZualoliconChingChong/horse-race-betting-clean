/**
 * Draggable Editor Panel
 * Handles dragging, positioning, collapsing of the editor panel
 * 
 * Public API:
 * - window.DraggablePanel (module object)
 * - window.setPanelPosition(position)
 * 
 * Dependencies:
 * - HTML elements: #editorBar, #editorHeader, #dragHandle
 * - Position buttons: #posRight, #posLeft, #posBottom
 * - window.setMode (for mode switching)
 * - window.localStorage
 */

(function() {
  'use strict';

  // ===== State Variables =====
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let currentPosition = 'right'; // 'right', 'left', 'bottom', 'custom'

  // ===== DOM Elements =====
  const draggablePanel = document.getElementById('editorBar');
  const editorHeader = document.getElementById('editorHeader');
  const dragHandle = document.getElementById('dragHandle');

  if (!draggablePanel || !editorHeader) {
    console.warn('[DraggablePanel] Required elements not found');
    return;
  }

  // ===== Collapse/Expand Functionality =====

  /**
   * Initialize collapse button and persistence
   */
  function initCollapseButton() {
    const rightbar = draggablePanel;
    const header = editorHeader;
    
    let cbtn = header.querySelector('.collapse-btn');
    if (!cbtn) {
      cbtn = document.createElement('button');
      cbtn.className = 'collapse-btn';
      cbtn.textContent = '━';
      cbtn.title = 'Thu nhỏ Map Editor';
      header.appendChild(cbtn);
    }

    const COLLAPSE_KEY = 'rightbarCollapsed';
    const SIZE_KEY = 'rightbarSize';
    const MIN_W = 360;
    const MIN_H = 260;

    // Migrate legacy key if present
    try {
      const legacy = localStorage.getItem('editorBarCollapsed');
      if (legacy !== null && localStorage.getItem(COLLAPSE_KEY) === null) {
        localStorage.setItem(COLLAPSE_KEY, legacy);
        localStorage.removeItem('editorBarCollapsed');
      }
    } catch {}

    // Restore state
    try {
      const collapsed = localStorage.getItem(COLLAPSE_KEY);
      if (collapsed === '1') rightbar.classList.add('collapsed');
      
      const size = JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
      if (size && typeof size.w === 'number' && size.w >= MIN_W) rightbar.style.width = size.w + 'px';
      if (size && typeof size.h === 'number' && size.h >= MIN_H) rightbar.style.height = size.h + 'px';
      
      const isCollapsed = rightbar.classList.contains('collapsed');
      cbtn.textContent = '━';
      cbtn.title = 'Thu nhỏ Map Editor';
      rightbar.style.display = isCollapsed ? 'none' : 'block';
    } catch {}

    // Sync HUD open-editor button on init
    try {
      const openBtn = document.getElementById('openEditorBtn');
      if (openBtn) {
        const isHidden = rightbar.classList.contains('collapsed') || getComputedStyle(rightbar).display === 'none';
        openBtn.style.display = isHidden ? 'inline-block' : 'none';
      }
    } catch {}

    // Collapse button click handler
    cbtn.addEventListener('click', () => {
      rightbar.classList.toggle('collapsed');
      const isCollapsed = rightbar.classList.contains('collapsed');
      cbtn.textContent = '━';
      cbtn.title = 'Thu nhỏ Map Editor';
      
      try { localStorage.setItem(COLLAPSE_KEY, isCollapsed ? '1' : '0'); } catch {}
      
      const openBtn = document.getElementById('openEditorBtn');
      if (openBtn) openBtn.style.display = isCollapsed ? 'inline-block' : 'none';
      
      rightbar.style.display = isCollapsed ? 'none' : 'block';
    });

    // Header click to expand when collapsed
    header.addEventListener('click', (e) => {
      if (e.target === cbtn || cbtn.contains(e.target)) return;
      if (rightbar.classList.contains('collapsed')) {
        rightbar.classList.remove('collapsed');
        cbtn.textContent = '≪';
        cbtn.title = 'Collapse panel';
        try { localStorage.setItem(COLLAPSE_KEY, '0'); } catch {}
        try {
          const openBtn = document.getElementById('openEditorBtn');
          if (openBtn) openBtn.style.display = 'none';
        } catch {}
        try { if (window.setMode) window.setMode('editor'); } catch {}
        e.stopPropagation();
        e.preventDefault();
      }
    });

    // Observe size changes to persist
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => {
        for (const e of entries) {
          const cr = e.contentRect;
          if (rightbar.classList.contains('collapsed')) continue;
          const w = Math.round(cr.width), h = Math.round(cr.height);
          if (w >= MIN_W && h >= MIN_H) {
            try { localStorage.setItem(SIZE_KEY, JSON.stringify({ w, h })); } catch {}
          }
        }
      });
      ro.observe(rightbar);
    }
  }

  // ===== Position Control =====

  const posRightBtn = document.getElementById('posRight');
  const posLeftBtn = document.getElementById('posLeft');
  const posBottomBtn = document.getElementById('posBottom');

  /**
   * Set panel to a preset position
   * @param {string} position - 'right', 'left', or 'bottom'
   */
  function setPanelPosition(position) {
    draggablePanel.classList.remove('position-right', 'position-left', 'position-bottom');
    draggablePanel.classList.add(`position-${position}`);
    
    document.querySelectorAll('.position-btn').forEach(btn => btn.classList.remove('active'));
    
    if (position === 'right' && posRightBtn) posRightBtn.classList.add('active');
    else if (position === 'left' && posLeftBtn) posLeftBtn.classList.add('active');
    else if (position === 'bottom' && posBottomBtn) posBottomBtn.classList.add('active');
    
    currentPosition = position;
    
    // Reset custom positioning
    if (position !== 'custom') {
      draggablePanel.style.left = '';
      draggablePanel.style.right = '';
      draggablePanel.style.top = '';
      draggablePanel.style.bottom = '';
      draggablePanel.style.transform = '';
    }
  }

  // Position button event listeners
  if (posRightBtn) posRightBtn.addEventListener('click', () => setPanelPosition('right'));
  if (posLeftBtn) posLeftBtn.addEventListener('click', () => setPanelPosition('left'));
  if (posBottomBtn) posBottomBtn.addEventListener('click', () => setPanelPosition('bottom'));

  // ===== Emergency Restore =====

  /**
   * Emergency restore: Ctrl+Shift+E to force show editor panel
   */
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      const panel = document.getElementById('editorBar');
      if (!panel) return;
      
      try { if (window.setMode) window.setMode('editor'); } catch {}
      
      panel.classList.remove('collapsed');
      panel.style.display = 'block';
      panel.style.left = '';
      panel.style.top = '';
      panel.style.right = '14px';
      panel.style.bottom = '';
      panel.style.width = '480px';
      panel.style.height = 'auto';
      panel.classList.remove('position-left', 'position-bottom');
      panel.classList.add('position-right');
      
      try {
        localStorage.setItem('rightbarCollapsed', '0');
        localStorage.setItem('editorBarCollapsed', '0');
      } catch {}
    }
  });

  // ===== Drag Functionality =====

  function startDrag(e) {
    isDragging = true;
    draggablePanel.classList.add('dragging');
    
    const rect = draggablePanel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    draggablePanel.classList.remove('position-right', 'position-left', 'position-bottom');
    document.querySelectorAll('.position-btn').forEach(btn => btn.classList.remove('active'));
    currentPosition = 'custom';
    
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - draggablePanel.offsetWidth;
    const maxY = window.innerHeight - draggablePanel.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));
    
    draggablePanel.style.left = constrainedX + 'px';
    draggablePanel.style.top = constrainedY + 'px';
    draggablePanel.style.right = 'auto';
    draggablePanel.style.bottom = 'auto';
    draggablePanel.style.transform = 'none';
    
    e.preventDefault();
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    draggablePanel.classList.remove('dragging');
  }

  // Event listeners for dragging
  editorHeader.addEventListener('mousedown', startDrag);
  if (dragHandle) dragHandle.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  // Prevent text selection during drag
  editorHeader.addEventListener('selectstart', e => e.preventDefault());
  if (dragHandle) dragHandle.addEventListener('selectstart', e => e.preventDefault());

  // ===== Initialize =====

  initCollapseButton();
  setPanelPosition('right'); // Initialize default position

  // ===== Public API =====

  const DraggablePanel = {
    setPanelPosition
  };

  if (typeof window !== 'undefined') {
    window.DraggablePanel = Object.freeze(DraggablePanel);
    window.setPanelPosition = setPanelPosition;
  }

  try {
    console.log('[DraggablePanel] Loaded successfully');
  } catch {}
})();
