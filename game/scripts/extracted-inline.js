// Global constants (emoji font, debug mode) - MOVED TO: scripts/core/constants.js
// Access via: window.EMOJI_FONT, window.DEBUG_MODE, window.debugLog()

// FPS monitoring - MOVED TO: scripts/core/fps-monitor.js
// Access via: window.FPSMonitor or window.updateFPS(), window.currentFPS for compatibility

// ===== Editor Theme System ===== 
// MOVED TO: scripts/ui/theme.js
// Access via: window.ThemeSystem or window.setEditorTheme() for compatibility

document.addEventListener('DOMContentLoaded', () => {
  // Apply hide/show for rows that are duplicated by Context Settings
  function applyHideCtxDup(on){
    const ids = [
      // power-ups
      'magnetRange','magnetDuration','magnetPower','magnetAttractAll',
      'turboDuration','turboMultiplier','shieldDuration',
      'timeFreezeDuration','timeFreezeAffectSelf',
      'teleportSafeMargin','teleportMinDistance',
      // geometry / tools
      'thick','radius','brushStep','arcSpan',
      'bumperRadius','bumperElasticity','bumperNoise',
      'spinnerSpeed','spinnerAngle',
      // gameplay
      'spawnJitter','startBias','carrotRadius'
    ];
    for (const id of ids){
      const el = document.getElementById(id);
      if (!el) continue;
      const row = el.closest('.row') || el.parentElement;
      if (row) row.style.display = on ? 'none' : '';
    }
  }

  // Add toggle button into Map Editor header
  (function setupHideCtxDupHeaderToggle(){
    const controls = document.querySelector('#editorHeader .editor-controls');
    if (!controls) return;
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.marginLeft = '8px';
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.id = 'ctxDupToggleBtn';
    const saved = localStorage.getItem('hideContextDuplicates');
    const initial = saved === 'true';
    function setState(on){
      btn.textContent = on ? 'Show duplicate settings' : 'Hide duplicate settings';
      try { localStorage.setItem('hideContextDuplicates', String(on)); } catch {}
      applyHideCtxDup(on);
    }
    setState(initial);
    btn.addEventListener('click', ()=>{
      const next = !(localStorage.getItem('hideContextDuplicates') === 'true');
      setState(next);
    });
    wrap.appendChild(btn);
    controls.appendChild(wrap);
  })();

  // ===== Sync NEW wall tool settings to mapDef + localStorage =====
  (function setupNewWallSettingsSync(){
    const bhp = document.getElementById('breakHp');
    const bon = document.getElementById('breakOn');
    const sst = document.getElementById('softStiff');
    const smd = document.getElementById('softMaxDef');
    const srcv = document.getElementById('softRecover');
    if (bhp){
      bhp.addEventListener('input', ()=>{
        try{ mapDef.breakWallSettings = mapDef.breakWallSettings||{hp:8,on:'shards'}; mapDef.breakWallSettings.hp = parseInt(bhp.value,10)||8; localStorage.setItem('breakHp', String(mapDef.breakWallSettings.hp)); }catch{}
      });
    }
    if (bon){
      bon.addEventListener('change', ()=>{
        try{ mapDef.breakWallSettings = mapDef.breakWallSettings||{hp:8,on:'shards'}; mapDef.breakWallSettings.on = (bon.value==='remove')?'remove':'shards'; localStorage.setItem('breakOn', mapDef.breakWallSettings.on); }catch{}
      });
    }
    if (sst){
      sst.addEventListener('input', ()=>{
        try{ mapDef.softWallSettings = mapDef.softWallSettings||{stiffness:0.25,maxDeform:18,recover:24}; mapDef.softWallSettings.stiffness = Math.max(0.05, Math.min(999, parseFloat(sst.value)||0.25)); localStorage.setItem('softStiff', String(mapDef.softWallSettings.stiffness)); document.getElementById('softStiffVal').textContent = mapDef.softWallSettings.stiffness.toFixed(2); }catch{}
      });
    }
    if (smd){
      smd.addEventListener('input', ()=>{
        try{ mapDef.softWallSettings = mapDef.softWallSettings||{stiffness:0.25,maxDeform:18,recover:24}; mapDef.softWallSettings.maxDeform = Math.max(4, Math.min(999, parseInt(smd.value,10)||18)); localStorage.setItem('softMaxDef', String(mapDef.softWallSettings.maxDeform)); document.getElementById('softMaxDefVal').textContent = mapDef.softWallSettings.maxDeform + 'px'; }catch{}
      });
    }
    if (srcv){
      srcv.addEventListener('input', ()=>{
        try{ mapDef.softWallSettings = mapDef.softWallSettings||{stiffness:0.25,maxDeform:18,recover:24}; mapDef.softWallSettings.recover = Math.max(0, parseInt(srcv.value,10)||0); localStorage.setItem('softRecover', String(mapDef.softWallSettings.recover)); document.getElementById('softRecoverVal').textContent = mapDef.softWallSettings.recover + 'px/s';
          // propagate to existing soft strokes
          for (const sb of (mapDef.brushes||[])) if (sb && sb.type==='soft') sb.recover = mapDef.softWallSettings.recover;
        }catch{}
      });
    }
  })();
  
  // Theme button handlers
  document.getElementById('themeProfessional')?.addEventListener('click', () => setEditorTheme('professional'));
  document.getElementById('themeModern')?.addEventListener('click', () => setEditorTheme('modern'));
  document.getElementById('themeWarm')?.addEventListener('click', () => setEditorTheme('warm'));
  document.getElementById('themeGaming')?.addEventListener('click', () => setEditorTheme('gaming'));

  // Notification Bar System - Hệ thống thanh thông báo
  const notificationBar = DOMCache.elements.notificationBar || document.getElementById('notificationBar');
  const notificationText = DOMCache.elements.gameNotificationText || document.getElementById('gameNotificationText');
  const notificationIcon = DOMCache.elements.notificationIcon || document.getElementById('notificationIcon');
  const notificationClose = document.getElementById('notificationClose');
  
  // Close notification handler - Disabled to keep notification always visible
  // notificationClose?.addEventListener('click', () => {
  //   notificationBar?.classList.add('hidden');
  // });
  
  // Auto-hide after duration
  let notificationTimeout;
  
  // Dynamic horse color mapping - gets colors from actual horses
  function getHorseColors() {
    const colors = {};
    const horseList = (typeof horses !== 'undefined' && Array.isArray(horses)) ? horses : [];
    
    for (const h of horseList) {
      if (h && h.name) {
        // Use actual horse body color or fallback
        colors[h.name.toLowerCase()] = h.colorBody || h.bodyColor || h.fill || h.color || '#607D8B';
      }
    }
    
    // Fallback static colors for common names
    const fallbackColors = {
      'blue': '#4A90E2', 'red': '#E74C3C', 'grey': '#95A5A6', 'green': '#27AE60',
      'yellow': '#F1C40F', 'purple': '#8E44AD', 'orange': '#E67E22', 'pink': '#E91E63',
      'cyan': '#1ABC9C', 'brown': '#8D6E63', 'lime': '#CDDC39', 'indigo': '#3F51B5',
      'teal': '#009688', 'amber': '#FFC107', 'deep_orange': '#FF5722', 'light_blue': '#03A9F4',
      'light_green': '#8BC34A', 'deep_purple': '#673AB7', 'black': '#2C3E50'
    };
    
    return { ...fallbackColors, ...colors };
  }

  // Function to colorize horse names - now handled directly in showNotification
  function colorizeHorseNames(text) {
    // This function is kept for compatibility but logic moved to showNotification
    return text;
  }

  window.showNotification = (message, type = 'info', duration = 5000) => {
    if (!notificationBar || !notificationText || !notificationIcon) {
      return;
    }
    
    // Clear existing timeout - disabled to keep notification always visible
    // if (notificationTimeout) clearTimeout(notificationTimeout);
    
    // Set icon based on type
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      game: '🎮'
    };
    
    notificationIcon.textContent = icons[type] || icons.info;
    
    // Clear and rebuild notification text with proper DOM elements
    notificationText.innerHTML = '';
    
    // Split message and create elements with dynamic horse colors
    let remainingText = message;
    const horseColors = getHorseColors();
    let foundMatch = false;
    
    // Try to match actual horse names first
    Object.keys(horseColors).forEach(horseName => {
      if (foundMatch) return;
      
      const regex = new RegExp(`\\b${horseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(remainingText)) {
        const parts = remainingText.split(regex);
        const matches = remainingText.match(regex) || [];
        
        notificationText.innerHTML = '';
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) {
            const textNode = document.createTextNode(parts[i]);
            notificationText.appendChild(textNode);
          }
          
          if (matches[i]) {
            const badge = document.createElement('span');
            badge.className = 'horse-badge';
            badge.style.backgroundColor = horseColors[horseName.toLowerCase()];
            badge.style.color = 'white';
            badge.style.padding = '3px 8px';
            badge.style.borderRadius = '12px';
            badge.style.fontSize = '11px';
            badge.style.fontWeight = '600';
            badge.style.marginLeft = '2px';
            badge.style.marginRight = '2px';
            badge.style.display = 'inline-block';
            badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
            
            // Add colored dot
            const dot = document.createElement('span');
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = horseColors[horseName.toLowerCase()];
            dot.style.border = '1px solid white';
            dot.style.display = 'inline-block';
            dot.style.marginRight = '4px';
            
            badge.appendChild(dot);
            badge.appendChild(document.createTextNode(matches[i]));
            notificationText.appendChild(badge);
          }
        }
        foundMatch = true;
        return;
      }
    });
    
    // If no horse names found, just set text normally
    if (!foundMatch) {
      if (notificationText.innerHTML === '') {
        notificationText.textContent = message;
      }
    }
    
    // Show notification - force display
    notificationBar.classList.remove('hidden');
    notificationBar.style.display = 'flex';
    notificationBar.style.opacity = '1';
    notificationBar.style.transform = 'translateY(0)';
    
    
    // Auto-hide disabled - keep notification always visible
    // if (duration > 0) {
    //   notificationTimeout = setTimeout(() => {
    //     notificationBar.classList.add('hidden');
    //   }, duration);
    // }
  };

  // Enhanced function with horse colors like bottom event log
  window.showTopNotificationWithHorseColor = (message, duration = 4000) => {
    const topNotificationText = document.getElementById('notificationText');
    if (!topNotification || !topNotificationText) return;
    
    // Clear existing timeout - disabled to keep notification always visible
    // if (notificationTimeout) clearTimeout(notificationTimeout);
    
    // Clear previous content
    topNotificationText.innerHTML = '';
    
    // Try to colorize horse names like in bottom event log
    let colored = false;
    try {
      const deaccent = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const textSoft = deaccent(message).toLowerCase();
      const list = (typeof horses !== 'undefined' && Array.isArray(horses)) ? horses : (Array.isArray(window.horses) ? window.horses : []);
      
      if (list.length) {
        for (const h of list) {
          if (!h || !h.name) continue;
          const name = String(h.name);
          const nameSoft = deaccent(name).toLowerCase();
          const idxSoft = textSoft.indexOf(nameSoft);
          
          if (idxSoft >= 0) {
            const idx = idxSoft;
            const matchedText = message.substr(idx, name.length);
            
            // Build: [before] [badge(name with color)] [after]
            const before = document.createTextNode(message.slice(0, idx));
            const after = document.createTextNode(message.slice(idx + matchedText.length));
            
            const badge = document.createElement('span');
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '4px';
            badge.style.padding = '2px 6px';
            badge.style.borderRadius = '999px';
            badge.style.background = (h.colorBody || '#666');
            badge.style.color = '#fff';
            badge.style.border = '1px solid rgba(255,255,255,.4)';
            badge.style.fontWeight = '600';
            badge.style.fontSize = '11px';
            
            const dot = document.createElement('span');
            dot.style.display = 'inline-block';
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.borderRadius = '50%';
            dot.style.background = (h.colorLabel || h.colorBody || '#fff');
            dot.style.border = '1px solid rgba(255,255,255,.6)';
            
            const nm = document.createElement('span');
            nm.textContent = matchedText;
            
            badge.appendChild(dot);
            badge.appendChild(nm);
            
            topNotificationText.appendChild(before);
            topNotificationText.appendChild(badge);
            topNotificationText.appendChild(after);
            colored = true;
            break;
          }
        }
      }
    } catch(e) {}
    
    if (!colored) {
      topNotificationText.textContent = message;
    }
    
    // Show notification
    topNotification.classList.add('show');
    
    // Auto-hide
    if (duration > 0) {
      notificationTimeout = setTimeout(() => {
        topNotification.classList.remove('show');
      }, duration);
    }
  };
  
  // Top notification will scale automatically with canvas since it's positioned inside canvas container
  
  // Initialize notification system - ready to show horse events
  // Test notification removed - no longer needed
  // setTimeout(() => {
  //   // Test a real horse event to verify the system works
  //   if (typeof logEvent === 'function') {
  //     logEvent('Blue nhặt được Boost: +20% tốc độ cơ bản!');
  //   }
  // }, 2000);

// --- Safe error surface
window.addEventListener('error', (e)=>{
  if (window.showNotification) {
    showNotification('Lỗi: ' + (e.message || e.error), 'error', 3000);
  }
});

// Init main canvas and 2D context
const canvas = document.getElementById('cv');
const ctx = canvas ? canvas.getContext('2d') : null;
// Expose for any helper using global
window.canvas = canvas;
window.ctx = ctx;

// Sync Fan inspector from selected fan
function syncFanInspectorFrom(obj){
  const fanInspector = document.getElementById('fanInspector');
  if (!fanInspector) return;
  const fanRadiusEl = document.getElementById('fanRadius');
  const fanRadiusVal = document.getElementById('fanRadiusVal');
  const fanAngleEl = document.getElementById('fanAngle');
  const fanAngleVal = document.getElementById('fanAngleVal');
  const fanSpreadEl = document.getElementById('fanSpread');
  const fanSpreadVal = document.getElementById('fanSpreadVal');
  const fanStrengthEl = document.getElementById('fanStrength');
  const fanStrengthVal = document.getElementById('fanStrengthVal');
  const r = Math.max(10, Math.round(obj?.r ?? 120));
  const angDeg = Math.round(((obj?.angle ?? 0) * 180 / Math.PI) % 360);
  const spreadDeg = Math.max(1, Math.round(((obj?.spread ?? (Math.PI/3)) * 180 / Math.PI)));
  const strength = +(obj?.strength ?? 0.08).toFixed(3);
  if (fanRadiusEl) { fanRadiusEl.value = String(r); fanRadiusVal.textContent = String(r); }
  if (fanAngleEl) { fanAngleEl.value = String(angDeg); fanAngleVal.textContent = angDeg + '°'; }
  if (fanSpreadEl) { fanSpreadEl.value = String(spreadDeg); fanSpreadVal.textContent = spreadDeg + '°'; }
  if (fanStrengthEl) { fanStrengthEl.value = String(strength); fanStrengthVal.textContent = String(strength); }
}

// Live update selected fan when inspector changes
{
  const fanRadiusEl = document.getElementById('fanRadius');
  const fanRadiusVal = document.getElementById('fanRadiusVal');
  const fanAngleEl = document.getElementById('fanAngle');
  const fanAngleVal = document.getElementById('fanAngleVal');
  const fanSpreadEl = document.getElementById('fanSpread');
  const fanSpreadVal = document.getElementById('fanSpreadVal');
  const fanStrengthEl = document.getElementById('fanStrength');
  const fanStrengthVal = document.getElementById('fanStrengthVal');
  for (const [el, valEl, prop, fmt] of [
    [fanRadiusEl, fanRadiusVal, 'r', (v)=>String(Math.round(v))],
    [fanAngleEl, fanAngleVal, 'angle', (v)=>Math.round(v)%360 + '°'],
    [fanSpreadEl, fanSpreadVal, 'spread', (v)=>Math.round(v) + '°'],
    [fanStrengthEl, fanStrengthVal, 'strength', (v)=>v.toFixed(3)]
  ]){
  if (el && valEl){
    el.addEventListener('input', ()=>{
      let v = parseFloat(el.value);
      if (prop==='r') v = Math.max(10, v);
      if (prop==='angle') v = (v % 360) * Math.PI/180;
      if (prop==='spread') v = Math.max(1, v) * Math.PI/180;
      valEl.textContent = fmt(prop==='angle' || prop==='spread' ? (prop==='angle'? (v*180/Math.PI) : (v*180/Math.PI)) : v);
      if (selected && selected.type==='fan'){
        selected[prop] = (prop==='angle' || prop==='spread') ? v : parseFloat(v);
        try { invalidateStaticLayer(); drawMap(); } catch {}
      }
    });
  }
  }
}
  
  const W = canvas.width, H = canvas.height;
  const BG=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const LANE=getComputedStyle(document.documentElement).getPropertyValue('--lane').trim();
  const WALL=getComputedStyle(document.documentElement).getPropertyValue('--wall').trim();
  
  // ===== Map Editor: Trail Effect Toggle, Color, Intensity =====
  try{
    const trailToggle = document.getElementById('trailEnabled');
    const trailColorInput = document.getElementById('trailColor');
    const trailIntensity = document.getElementById('trailIntensity');
    const trailIntensityVal = document.getElementById('trailIntensityVal');

    function hexToRgbArr(hex){
      if (!hex) return [158,158,158];
      let h = hex.trim();
      if (h[0] === '#') h = h.slice(1);
      if (h.length === 3){ h = h.split('').map(x=>x+x).join(''); }
      const num = parseInt(h,16);
      if (!isFinite(num)) return [158,158,158];
      return [(num>>16)&255, (num>>8)&255, num&255];
    }
    function setTrailColor(hex){
      const [r,g,b] = hexToRgbArr(hex);
      window.horseTrailColorHex = '#' + (hex||'').replace(/^#/,'');
      window.horseTrailColorA = `rgba(${r},${g},${b},0.75)`;
      window.horseTrailColorB = `rgba(${r},${g},${b},0.65)`;
      try { if (window.mapDef) mapDef.trailColor = window.horseTrailColorHex; } catch {}
    }

    const initialOn = !!(window.mapDef && mapDef.trailEnabled);
    window.horseMotionTrailEnabled = initialOn; // default off when absent
    const initialColor = (window.mapDef && mapDef.trailColor) || '#9e9e9e';
    setTrailColor(initialColor);

    // Intensity (affects count, life, slight spread). Default 1.0
    const initIntensity = (window.mapDef && typeof mapDef.trailIntensity === 'number') ? mapDef.trailIntensity : 1.0;
    window.horseTrailIntensity = Math.max(0, Math.min(1.6, initIntensity));
    if (trailIntensity){
      trailIntensity.value = String(window.horseTrailIntensity);
      if (trailIntensityVal) trailIntensityVal.textContent = window.horseTrailIntensity.toFixed(2) + '×';
      trailIntensity.addEventListener('input', (e)=>{
        const v = parseFloat(e.target.value)||1.0;
        window.horseTrailIntensity = Math.max(0, Math.min(1.6, v));
        if (trailIntensityVal) trailIntensityVal.textContent = window.horseTrailIntensity.toFixed(2) + '×';
      });
      trailIntensity.addEventListener('change', (e)=>{
        const v = parseFloat(e.target.value)||1.0;
        window.horseTrailIntensity = Math.max(0, Math.min(1.6, v));
        try { if (window.mapDef) mapDef.trailIntensity = window.horseTrailIntensity; } catch {}
      });
    }

    if (trailToggle){
      trailToggle.checked = !!window.horseMotionTrailEnabled;
      trailToggle.addEventListener('change', (e)=>{
        window.horseMotionTrailEnabled = !!e.target.checked;
        try { if (window.mapDef) mapDef.trailEnabled = window.horseMotionTrailEnabled; } catch {}
      });
    }
    if (trailColorInput){
      trailColorInput.value = initialColor;
      trailColorInput.addEventListener('input', (e)=>{ setTrailColor(e.target.value); });
      trailColorInput.addEventListener('change', (e)=>{ setTrailColor(e.target.value); });
    }

    // Expose a sync helper to refresh UI from mapDef (for Import/Load)
    window.syncTrailUIFromMapDef = function(){
      try{
        const on = !!(window.mapDef && mapDef.trailEnabled);
        const col = (window.mapDef && mapDef.trailColor) || '#9e9e9e';
        const inten = (window.mapDef && typeof mapDef.trailIntensity === 'number') ? mapDef.trailIntensity : 1.0;

        if (trailToggle) trailToggle.checked = on;
        if (trailColorInput) trailColorInput.value = col;
        if (trailIntensity){
          const clamped = Math.max(0, Math.min(1.6, inten));
          trailIntensity.value = String(clamped);
          if (trailIntensityVal) trailIntensityVal.textContent = clamped.toFixed(2) + '×';
          window.horseTrailIntensity = clamped;
        }
        // Apply runtime vars
        window.horseMotionTrailEnabled = on;
        setTrailColor(col);
      } catch {}
    }

    // Hook common map actions to auto-sync after they run
    const idsToHook = ['importMap','importFile','loadLS','loadSample','randomMap','preset1','preset2','preset3'];
    idsToHook.forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', ()=>{ setTimeout(()=>{ try{ window.syncTrailUIFromMapDef(); } catch{} }, 200); });
      // for file input change
      if (el.tagName === 'INPUT' && el.type === 'file'){
        el.addEventListener('change', ()=>{ setTimeout(()=>{ try{ window.syncTrailUIFromMapDef(); } catch{} }, 200); });
      }
    });
  } catch{}
  
  // ===== Static Layer Cache (offscreen) =====
  let staticLayerCanvas = null;
  let staticLayerCtx = null;
  let staticLayerDirty = true;
  let staticLayerW = 0, staticLayerH = 0;
  function ensureStaticLayer(){
    if (!staticLayerCanvas) {
      staticLayerCanvas = document.createElement('canvas');
      staticLayerCtx = staticLayerCanvas.getContext('2d');
    }
    if (staticLayerW !== canvas.width || staticLayerH !== canvas.height) {
      staticLayerW = staticLayerCanvas.width = canvas.width;
      staticLayerH = staticLayerCanvas.height = canvas.height;
      staticLayerDirty = true;
    }
  }
  function invalidateStaticLayer(){ staticLayerDirty = true; }
  
  // ===== HUD: fixed bottom under map (stretches to map width) =====
  const hudEl = document.getElementById('hud');
  function applyHudDock(){
    if (!hudEl) return;
    // force docked-bottom mode
    hudEl.classList.remove('hud-overlay','hud-top','hud-right','hud-bottom','hud-left');
    hudEl.classList.add('hud-docked','hud-bottom');
    // reset positional styles before compute
    hudEl.style.left = '';
    hudEl.style.right = '';
    hudEl.style.top = '';
    hudEl.style.bottom = '';
    hudEl.style.width = '';
    hudEl.style.display = 'flex';
    requestHudReposition();
  }
  function clamp(val, min, max){ return Math.max(min, Math.min(max, val)); }
  let hudRepositionReq = 0;
  // Cache last applied HUD box to avoid jittery updates
  let __lastHudBox = { left: NaN, top: NaN, width: NaN };
  let __lastHudApplyTs = 0;
  function requestHudReposition(){
    if (hudRepositionReq) return;
    // Skip if screen is shaking or photo-finish zooming to avoid visible jitter
    try {
      const now = performance.now ? performance.now() : Date.now();
      const photoActive = !!(window.photoFinishStartTs) && (now - window.photoFinishStartTs) < 1600;
      if ((now < (shakeUntil || 0)) || photoActive) return;
      // Also skip while race is running to prevent jitter from minor layout shifts
      // REMOVED: if (typeof running !== 'undefined' && running === true) return;
    } catch {}
    hudRepositionReq = requestAnimationFrame(()=>{ hudRepositionReq = 0; positionHudNearStage(); });
  }
  function positionHudNearStage(){
    if (!hudEl) return;
    const stageEl = document.getElementById('stage');
    const cvEl = document.getElementById('cv');
    // Prefer stage as visual anchor so HUD matches visible map width
    const anchor = stageEl || cvEl;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const GAP = 6; // khoảng cách dưới map - giảm từ 14px xuống 6px
    // Snap to whole pixels; prefer integer layout metrics
    const left = Math.round(r.left);
    const top = Math.round(r.bottom + GAP);
    const width = Math.round(r.width);
    
    // Hysteresis: only update if meaningfully changed (>=2px)
    const eps = 2;
    const nowTs = performance.now ? performance.now() : Date.now();
    // Rate-limit: at most every 50ms unless a big jump
    const minInterval = 50;
    const dL = Math.abs((__lastHudBox.left ?? NaN) - left);
    const dT = Math.abs((__lastHudBox.top ?? NaN) - top);
    const dW = Math.abs((__lastHudBox.width ?? NaN) - width);
    if (!Number.isNaN(__lastHudBox.left) && dL < eps && dT < eps && dW < eps && (nowTs - __lastHudApplyTs) < minInterval) {
      return;
    }
    
    // Calculate scale factor from map zoom - use actual canvas scale ratio
    const mapScale = typeof zoomScale !== 'undefined' ? zoomScale : 1;
    const baseWidth = width / mapScale; // original unscaled width
    
    // khớp chính xác bề ngang map (snapped)
    hudEl.style.position = 'fixed';
    hudEl.style.left = left + 'px';
    hudEl.style.top = top + 'px';
    hudEl.style.right = 'auto';
    hudEl.style.bottom = 'auto';
    hudEl.style.width = baseWidth + 'px';
    // Apply scale transform to match map zoom
    hudEl.style.transform = `scale(${mapScale})`;
    hudEl.style.transformOrigin = 'left top';
    __lastHudBox = { left, top, width };
    __lastHudApplyTs = nowTs;
    
    // Position top notification above map using same logic
    positionTopNotificationNearStage();
  }
  
  function positionTopNotificationNearStage(){
    const topNotification = document.getElementById('topNotification');
    if (!topNotification) return;
    const stageEl = document.getElementById('stage');
    const cvEl = document.getElementById('cv');
    // Use same anchor as HUD
    const anchor = stageEl || cvEl;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const GAP = 6; // same gap as HUD but above map - giảm từ 14px xuống 6px
    // Position above map with gap (like HUD below map)
    const left = Math.round(r.left);
    const top = Math.round(r.top - GAP - 50); // 50px estimated height for larger notification
    const width = Math.round(r.width);
    
    // Apply same scale logic as HUD
    const mapScale = typeof zoomScale !== 'undefined' ? zoomScale : 1;
    const baseWidth = width / mapScale; // original unscaled width
    
    topNotification.style.position = 'fixed';
    topNotification.style.left = left + 'px';
    topNotification.style.top = top + 'px';
    topNotification.style.width = baseWidth + 'px';
    topNotification.style.transform = `scale(${mapScale})`;
    topNotification.style.transformOrigin = 'left top';
  }
  window.addEventListener('resize', requestHudReposition);
  window.addEventListener('orientationchange', requestHudReposition);
  // Observe stage/canvas size changes (layout shifts) to keep HUD width in sync
  try {
    const ro = new ResizeObserver(()=> requestHudReposition());
    const cvWatch = document.getElementById('cv');
    const stWatch = document.getElementById('stage');
    if (cvWatch) ro.observe(cvWatch);
    if (stWatch) ro.observe(stWatch);
  } catch {}
  // Also watch for transform/style mutations on the stage (ResizeObserver won't catch transforms)
  try {
    const stageNode = document.getElementById('stage');
    if (stageNode) {
      const mo = new MutationObserver(()=> requestHudReposition());
      mo.observe(stageNode, { attributes: true, attributeFilter: ['style', 'class'] });
      stageNode.addEventListener('transitionend', requestHudReposition);
    }
  } catch {}
  // Extra: schedule a late recalc after initial layout settles
  setTimeout(requestHudReposition, 0);
  applyHudDock();
  // Ensure early docking even before any resize happens
  document.addEventListener('DOMContentLoaded', ()=> {
    requestHudReposition();
    requestAnimationFrame(()=> requestHudReposition());
  });
  window.addEventListener('load', ()=> {
    requestHudReposition();
    // Wait for layout to settle
    requestAnimationFrame(()=> requestHudReposition());
  });
  const shapeColorEl = document.getElementById('shapeColor');
  shapeColorEl.addEventListener('input', () => {
    if (selected) {
      selected.color = shapeColorEl.value;
      try { invalidateStaticLayer(); drawMap(); } catch {}
    }
  });

// --- Localization System ---

const TOOLTIPS_DATA = {
  'en': {
    'select': 'Select & Move: Drag to move, Click to select',
    'erase': 'Delete: Click object to remove',
    'wall': 'Draw Wall: Drag to create straight walls',
    'brush': 'Brush: Freehand drawing',
    'diag': 'Diagonal Wall: Drag to create diagonal walls',
    'semi': 'Half-Circle: Semicircular obstacle',
    'arc': 'Arc: Curved wall obstacle',
    'text': 'Text Wall: Create walls from text',
    'ebrush': 'Eraser Brush: Erase walls with brush',
    'breakwall': 'Breakable Wall: Walls that break on impact',
    'softwall': 'Soft Wall: Deformable elastic walls',
    'spawn': 'Spawn Point: Where horses start',
    'carrotA': 'Finish Line A: Main objective',
    'carrotB': 'Finish Line B: Secondary objective',
    'room': 'Waiting Room: Pre-race holding area',
    'start': 'Start Gate: Opens when race starts',
    'boost': 'Speed Boost: Temporarily increases speed',
    'turbo': 'Turbo: Massive speed burst',
    'ghost': 'Ghost: Pass through walls',
    'shield': 'Shield: Protection from collisions',
    'teleport': 'Teleport: Random location jump',
    'magnet': 'Magnet: Attracts nearby items',
    'timefreeze': 'Time Freeze: Slows all opponents',
    'icefreezer': 'Ice Trap: Freezes horses on contact',
    'testpower': 'Test Power: Experimental item',
    'poison': 'Poison: Reduces HP over time',
    'fireaura': 'Fire Aura: Damages nearby horses',
    'healingzone': 'Healing Zone: Restores HP inside',
    'tornado': 'Tornado: Sweeps horses away',
    'volcano': 'Volcano: Erupts fire damage',
    'warpzone': 'Warp Zone: Teleport to fixed location',
    'quantumdash': 'Quantum Dash: Dash through obstacles',
    'yellowheart': 'Yellow Heart: Major HP recovery',
    'nebula': 'Nebula: Slows and blinds view',
    'ram': 'Ram: Knockback attack',
    'mud': 'Mud: Slows movement',
    'healingpatch': 'Healing Patch: Small HP recovery',
    'rotbarrier': 'Rotating Barrier: Spinning obstacle',
    'firetrap': 'Fire Trap: Damage on contact',
    'magnetpull': 'Magnet Pull: Pulls to center',
    'magnetpush': 'Magnet Push: Pushes away',
    'bumper': 'Bumper: Bounces horses away',
    'spinner': 'Spinner: Rotates and pushes',
    'belt': 'Conveyor Belt: Pushes in direction',
    'fan': 'Fan: Blows wind force',
    'weather': 'Weather: Rain, Snow, Sandstorm',
    'oneway': 'One-way Gate: Single direction passage',
    'pad': 'Speed Pad: Boosts speed on touch'
  },
  'vi': {
    'select': 'Chọn & Di chuyển: Kéo để di chuyển, Click để chọn đối tượng',
    'erase': 'Xóa: Click vào đối tượng để xóa',
    'wall': 'Vẽ Tường: Kéo chuột để vẽ tường thẳng',
    'brush': 'Vẽ Tự Do: Vẽ tường bằng nét cọ tự do',
    'diag': 'Tường Chéo: Kéo để tạo tường chéo',
    'semi': 'Bán Nguyệt: Vật cản hình bán nguyệt',
    'arc': 'Cung Tròn: Tường hình cung tròn',
    'text': 'Chữ: Tạo tường bằng ký tự text',
    'ebrush': 'Tẩy: Xóa tường nét cọ (Eraser Brush)',
    'breakwall': 'Tường Vỡ: Tường có thể bị phá hủy khi va chạm',
    'softwall': 'Tường Mềm: Biến dạng đàn hồi khi va chạm',
    'spawn': 'Điểm Xuất Phát: Vị trí ngựa bắt đầu (Spawn Point)',
    'carrotA': 'Đích A: Cà rốt mục tiêu chính',
    'carrotB': 'Đích B: Cà rốt mục tiêu phụ',
    'room': 'Phòng Chờ: Khu vực tập trung ngựa trước khi đua',
    'start': 'Cổng Xuất Phát: Thanh chắn cửa phòng chờ',
    'boost': 'Boost: Tăng tốc độ tạm thời',
    'turbo': 'Turbo: Tăng tốc cực đại trong thời gian ngắn',
    'ghost': 'Ghost: Đi xuyên tường và vật cản',
    'shield': 'Khiên: Bảo vệ khỏi va chạm và hiệu ứng xấu',
    'teleport': 'Dịch chuyển: Nhảy đến vị trí ngẫu nhiên',
    'magnet': 'Nam châm: Hút các vật phẩm xung quanh',
    'timefreeze': 'Đóng băng thời gian: Làm chậm tất cả đối thủ',
    'icefreezer': 'Bẫy băng: Đóng băng ngựa chạm phải',
    'testpower': 'Testpower: Vật phẩm thử nghiệm',
    'poison': 'Độc dược: Làm giảm HP theo thời gian',
    'fireaura': 'Vòng lửa: Gây sát thương cho ngựa xung quanh',
    'healingzone': 'Vùng hồi máu: Hồi phục HP khi đứng trong vùng',
    'tornado': 'Lốc xoáy: Cuốn và đẩy ngựa đi nơi khác',
    'volcano': 'Núi lửa: Phun lửa gây sát thương diện rộng',
    'warpzone': 'Cổng không gian: Dịch chuyển tức thời đến vị trí khác',
    'quantumdash': 'Lướt lượng tử: Lướt nhanh về phía trước bỏ qua vật cản',
    'yellowheart': 'Trái tim vàng: Hồi phục lượng lớn HP',
    'nebula': 'Tinh vân: Làm chậm và che khuất tầm nhìn',
    'ram': 'Húc (Ram): Tấn công húc văng đối thủ',
    'mud': 'Bùn lầy: Làm giảm tốc độ di chuyển',
    'healingpatch': 'Miếng hồi máu: Hồi một lượng HP nhỏ khi nhặt',
    'rotbarrier': 'Rào chắn xoay: Thanh chắn xoay tròn cản đường',
    'firetrap': 'Bẫy lửa: Gây sát thương khi chạm vào',
    'magnetpull': 'Hút nam châm: Kéo ngựa về phía trung tâm',
    'magnetpush': 'Đẩy nam châm: Đẩy ngựa ra xa trung tâm',
    'bumper': 'Bumper: Đệm đàn hồi nảy ngựa ra xa',
    'spinner': 'Spinner: Chong chóng xoay đẩy ngựa',
    'belt': 'Băng chuyền: Đẩy ngựa trượt theo hướng mũi tên',
    'fan': 'Quạt gió: Thổi bay ngựa bằng luồng gió',
    'weather': 'Thời tiết: Hệ thống mưa, tuyết, bão cát...',
    'oneway': 'Cổng một chiều: Chỉ đi qua được theo một hướng',
    'pad': 'Pad tăng tốc: Tăng tốc độ khi đi qua'
  }
};

const EDITOR_DESCRIPTIONS_DATA = {
  'en': {
    'wall': 'Wall: Blocks movement',
    'pipe': 'Pipe: Circular obstacle',
    'semi': 'Half-Circle: Semicircular obstacle',
    'arc': 'Arc: Curved wall obstacle',
    'brush': 'Brush Stroke: Freeform obstacle',
    'belt': 'Conveyor Belt: Pushes horses in arrow direction',
    'oneway': 'One-way Gate: Allows passage in one direction only',
    'pad': 'Boost Pad: Increases speed when passed over',
    'room': 'Waiting Room: Starting area for horses',
    'start': 'Start Line: Race starting point',
    'carrot': 'Carrot: Race objective',
    'spawn': 'Spawn Point: Where horses appear',
    'bumper': 'Bumper: Bounces horses away on impact',
    'spinner': 'Spinner: Rotates and pushes horses',
    'fan': 'Fan: Pushes horses with wind',
    'boost': 'Boost: Temporary speed increase',
    'turbo': 'Turbo: Massive speed burst',
    'shield': 'Shield: Protects from collisions and effects',
    'ghost': 'Ghost: Phase through walls temporarily',
    'magnet': 'Magnet: Attracts nearby items',
    'timefreeze': 'Time Freeze: Slows down all other horses',
    'icefreezer': 'Ice Trap: Freezes horses on contact',
    'poison': 'Poison: Damages health over time',
    'trap': 'Trap: Slows or damages horses',
    'lightning': 'Lightning: Strikes nearby horses',
    'tornado': 'Tornado: Sweeps and pushes horses',
    'volcano': 'Volcano: Erupts fire damage',
    'teleport': 'Teleport: Random location jump',
    'warpzone': 'Warp Zone: Fixed location teleport',
    'quantumdash': 'Quantum Dash: Dash forward instantly',
    'yellowheart': 'Yellow Heart: Heals or damages',
    'magnetpull': 'Magnet Pull: Pulls horses to center',
    'magnetpush': 'Magnet Push: Pushes horses away',
    'diag': 'Diagonal Wall: Sloped obstacle',
    'testpower': 'Test Power: Experimental item',
    'fireaura': 'Fire Aura: Damages surrounding area',
    'healingzone': 'Healing Zone: Heals horses inside',
    'firetrap': 'Fire Trap: Damages on contact',
    'nebula': 'Nebula: Slows and obscures vision',
    'mud': 'Mud: Slows movement speed'
  },
  'vi': {
    'wall': 'Tường: Chặn đường di chuyển',
    'pipe': 'Ống tròn: Vật cản hình tròn',
    'semi': 'Bán nguyệt: Vật cản hình bán nguyệt',
    'arc': 'Vòng cung: Vật cản hình cung tròn',
    'brush': 'Nét vẽ: Vật cản tự do',
    'belt': 'Băng chuyền: Đẩy ngựa theo hướng mũi tên',
    'oneway': 'Cổng một chiều: Chỉ đi qua được theo hướng mũi tên',
    'pad': 'Pad tăng tốc: Tăng tốc độ khi đi qua',
    'room': 'Phòng chờ: Khu vực xuất phát của ngựa',
    'start': 'Vạch xuất phát: Điểm bắt đầu đua',
    'carrot': 'Cà rốt: Mục tiêu của ngựa',
    'spawn': 'Điểm hồi sinh: Vị trí ngựa xuất hiện',
    'bumper': 'Bumper: Đẩy bật ngựa ra xa khi va chạm',
    'spinner': 'Spinner: Xoay tròn và đẩy ngựa',
    'fan': 'Quạt: Đẩy ngựa bằng luồng gió',
    'boost': 'Boost: Tăng tốc độ tạm thời',
    'turbo': 'Turbo: Tăng tốc cực đại trong thời gian ngắn',
    'shield': 'Khiên: Bảo vệ khỏi va chạm và hiệu ứng xấu',
    'ghost': 'Ghost: Đi xuyên tường trong thời gian ngắn',
    'magnet': 'Nam châm: Hút các vật phẩm xung quanh',
    'timefreeze': 'Đóng băng thời gian: Làm chậm tất cả ngựa khác',
    'icefreezer': 'Bẫy băng: Đóng băng ngựa chạm phải',
    'poison': 'Độc dược: Làm giảm máu theo thời gian',
    'trap': 'Bẫy: Làm chậm hoặc gây hại cho ngựa',
    'lightning': 'Sấm sét: Tấn công ngựa gần đó',
    'tornado': 'Lốc xoáy: Cuốn và đẩy ngựa đi',
    'volcano': 'Núi lửa: Phun lửa gây sát thương',
    'teleport': 'Dịch chuyển: Nhảy đến vị trí ngẫu nhiên',
    'warpzone': 'Cổng không gian: Dịch chuyển đến vị trí cố định',
    'quantumdash': 'Lướt lượng tử: Lướt nhanh về phía trước',
    'yellowheart': 'Trái tim vàng: Hồi máu hoặc gây sát thương',
    'magnetpull': 'Hút nam châm: Kéo ngựa về phía tâm',
    'magnetpush': 'Đẩy nam châm: Đẩy ngựa ra xa',
    'diag': 'Tường chéo: Vật cản đường chéo',
    'testpower': 'Test Power: Vật phẩm thử nghiệm',
    'fireaura': 'Vòng lửa: Gây sát thương xung quanh',
    'healingzone': 'Vùng hồi máu: Hồi máu cho ngựa đứng trong vùng',
    'firetrap': 'Bẫy lửa: Gây sát thương khi chạm vào',
    'nebula': 'Tinh vân: Làm chậm và che khuất tầm nhìn',
    'mud': 'Bùn lầy: Làm chậm ngựa khi đi qua'
  }
};

const UI_TEXT_DATA = {
  'en': {
    'cat_essential': '🎯 Essential',
    'cat_geometry': '📐 Geometry',
    'cat_race': '🏁 Race Setup',
    'cat_powerups': '⚡ Power-ups',
    'cat_obstacles': '🚧 Obstacles',
    'cat_advanced': '🔧 Advanced',
    'settings': '⚙️ Settings',
    'language': '🌐 Language',
    'grid': '📏 Grid',
    'color': '🎨 Color',
    'grid_size': 'Size',
    'hide_in_play': 'Hide in Play',
    'cat_objects': '🎯 Objects',
    'horse_speed': '🐎 Horse Speed',
    'max_horse_speed': '🐎 Max Horse Speed',
    'horse_radius': '🐎 Horse Radius',
    'carrot_size': '🥕 Carrot',
    'corner_radius': '🔘 Corner',
    'cat_walls': '🧱 Walls',
    'wall_width': 'Width',
    'round_cap': 'Round Cap',
    'arc_span': '🌈 Arc Span',
    'brush_step': '🖌️ Brush Step',
    'break_hp': '💥 Break HP',
    'on_break': '💥 On Break',
    'soft_stiffness': '🧽 Soft Stiffness',
    'soft_max_def': '🧽 Max Deform',
    'soft_recover': '🧽 Recovery',
    'cat_spawn': '🏁 Spawn Settings',
    'spawn_preset': '📋 Spawn Preset',
    'spawn_jitter': '🎲 Spawn Jitter',
    'start_bias': '⏱️ Start Bias',
    'cat_game_items': '🎮 Game Items',
    'cat_game_settings': '🎮 Game Settings',
    'num_horses': '🐎 Horses (1-50)',
    'game_speed': '⚡ Speed (0.1-5)',
    'countdown': '⏱️ Countdown (s)',
    'collision_sfx': '🔊 Collision SFX',
    'trail_effect': '💨 Horse Trail Effect',
    'trail_intensity': '💨 Trail Intensity',
    'cat_special': '🔧 Special',
    'spinner_speed': '🔄 Spinner Speed',
    'spinner_length': '📏 Spinner Length',
    'mud_slowdown': '🟤 Mud Slowdown',
    'cat_magnet': '🧲 Magnet',
    'magnet_range': 'Range',
    'magnet_duration': 'Duration',
    'magnet_power': 'Power',
    'magnet_attract_all': 'Attract All',
    'context_title': '⚙️ Context Settings',
    'btn_apply': 'Apply',
    'label_spinner_angle': '🧭 Spinner Angle',
    'cat_bumper': '🟦 Bumper',
    'bumper_radius': '🔘 Radius',
    'bumper_elasticity': '🪗 Elasticity',
    'bumper_noise': '🌫️ Angle Noise',
    'bumper_color': '🎨 Bumper Color',
    'cat_fan': '🌀 Fan',
    'fan_radius': '🔘 Radius',
    'fan_angle': '📐 Angle',
    'fan_spread': '🍕 Spread',
    'fan_strength': '💨 Strength',
    'hide_all_names': '🙈 Hide All Names',
    'name_size': '🔤 Name Size',
    'enable_hp_system': '❤️ Enable HP System',
    'horse_max_hp': '💖 Horse Max HP',
    'show_hp_numbers': '🔢 Show HP Numbers',
    'show_horse_speed': '⚡ Show Horse Speed',
    'auto_rotate_sprite': '🔄 Auto Rotate Horse Sprite',
    'last_horse_wins': '👑 Last Horse Standing Wins',
    'wall_damage': '🧱 Wall Damage',
    'border_damage': '🔲 Border Damage',
    'wall_damage_amount': '💥 Wall Damage Amount',
    'border_damage_amount': '🔥 Border Damage Amount',
    'min_cruise': '🏎️ Min Cruise',
    'luck_or_suck': '🍀 Luck or Suck',
    'luck_interval': '⏲️ Luck Interval (s)',
    'test_race_btn': '▶ Test Race',
    'panel_bgm': '🎵 Background Music',
    'label_bgm_file': 'Music File:',
    'label_controls': 'Controls:',
    'label_tts_voice': 'TTS Voice:',
    'label_tts_enabled': 'Enable TTS:',
    'label_tts_source': 'TTS Source:',
    'label_azure_key': 'Azure Key:',
    'label_azure_region': 'Region:',
    'label_azure_voice': 'Azure Voice:',
    'test_tts_btn': '🔊 Test TTS',
    'test_tts_hint': 'Plays: "Hello!"',
    'btn_clear_map': '🗑️ Clear Map',
    'btn_load_sample': '📋 Load Sample',
    'btn_generate_map': '🎲 Generate Map',
    'btn_add_items': '✨ Add Items',
    'btn_add_belt': '➕ Add Belt',
    'btn_export_json': '📤 Export JSON',
    'btn_import_json': '📥 Import JSON',
    'cat_preset_maps': '🗺️ Preset Maps',
    'btn_preset_oval': '🏁 Oval',
    'btn_preset_spinner': '🌪️ Spinner',
    'btn_preset_maze': '🧱 Maze',
    'cat_waiting_room': '🚪 Waiting Room',
    'wr_width': '📏 Width',
    'wr_height': '📐 Height',
    'wr_corner_radius': '⬜ Corner Radius',
    'wr_auto_fit': '⚙️ Auto-fit at race start',
    'cat_carrot_settings': '🥕 Advanced Carrot Settings',
    'btn_swap_ab': '🔄 Swap A/B',
    'btn_reset_pos': '🎯 Reset Positions',
    'label_png_sprite': '🖼️ PNG Sprite',
    'btn_clear_a': '🗑️ Clear A',
    'btn_clear_b': '🗑️ Clear B',
    'label_sprite_scale': '📏 Sprite Scale',
    'label_sprite_outline': '🖌️ Sprite Outline',
    'label_outline_color': '🎨 Outline Color',
    'label_outline_width': '📏 Outline Width',
    'cat_horse_custom': '🐴 Horse Customization',
    'label_select_horse': '🔢 Select Horse #',
    'label_display_name': '📝 Display Name',
    'label_special_skill': '⚡ Special Skill',
    'label_custom_speed': '🏃 Custom Speed',
    'label_custom_hp': '❤️ Custom HP',
    'label_luck': '🍀 Luck',
    'label_luck_int': '⏱️ Luck Interval',
    'label_body_color': '🎨 Body Color',
    'label_label_color': '🏷️ Label Color',
    'btn_sprite_presets': '📚 Sprite Presets…',
    'title_sprite_presets': 'Sprite Presets',
    'btn_import_pngs': '➕ Import PNGs…',
    'btn_import_folder': '📂 Import Folder…',
    'tip_sprite_presets': 'Tip: You can also use built-ins below',
    'current_horse_group': '🎯 Current Horse',
    'all_horses_group': '👥 All Horses',
    'sprites_group': '🖼️ Sprites',
    'colors_skills_group': '🎨 Colors & Skills',
    'btn_reset': '🔄 Reset',
    'btn_random': '🎲 Random',
    'btn_skill': '🎲 Skill',
    'btn_copy_all': '📋 Copy All',
    'btn_random_all': '🎲 Random All',
    'btn_skill_all': '🎲 Skill All',
    'btn_clear': '🗑️ Clear',
    'btn_random_n': '🎲 Random #N',
    'btn_outline_all': '✏️ Outline All',
    'btn_body_all': '🎨 Body All',
    'btn_undo': 'Undo (recent shape)',
    'btn_clear_walls': 'Clear ALL walls',
    'btn_save_browser': 'Save to browser',
    'btn_load_browser': 'Load'
  },
  'vi': {
    'cat_essential': '🎯 Cơ bản',
    'cat_geometry': '📐 Hình học',
    'cat_race': '🏁 Đua xe',
    'cat_powerups': '⚡ Power-ups',
    'cat_obstacles': '🚧 Chướng ngại vật',
    'cat_advanced': '🔧 Nâng cao',
    'settings': '⚙️ Cài đặt',
    'language': '🌐 Ngôn ngữ',
    'grid': '📏 Lưới',
    'color': '🎨 Màu sắc',
    'grid_size': 'Kích thước',
    'hide_in_play': 'Ẩn khi chơi',
    'cat_objects': '🎯 Đối tượng',
    'horse_speed': '🐎 Tốc độ ngựa',
    'max_horse_speed': '🐎 Tốc độ tối đa',
    'horse_radius': '🐎 Bán kính ngựa',
    'carrot_size': '🥕 Cà rốt',
    'corner_radius': '🔘 Góc bo',
    'cat_walls': '🧱 Tường',
    'wall_width': 'Độ dày',
    'round_cap': 'Bo tròn đầu',
    'arc_span': '🌈 Độ mở cung',
    'brush_step': '🖌️ Bước cọ',
    'break_hp': '💥 Độ bền',
    'on_break': '💥 Khi vỡ',
    'soft_stiffness': '🧽 Độ cứng',
    'soft_max_def': '🧽 Biến dạng max',
    'soft_recover': '🧽 Hồi phục',
    'cat_spawn': '🏁 Cài đặt xuất phát',
    'spawn_preset': '📋 Kiểu xuất phát',
    'spawn_jitter': '🎲 Độ lệch',
    'start_bias': '⏱️ Độ trễ',
    'cat_game_items': '🎮 Vật phẩm game',
    'cat_game_settings': '🎮 Cài đặt game',
    'num_horses': '🐎 Số lượng ngựa',
    'game_speed': '⚡ Tốc độ game',
    'countdown': '⏱️ Đếm ngược (s)',
    'collision_sfx': '🔊 Âm thanh va chạm',
    'trail_effect': '💨 Hiệu ứng vệt đuôi',
    'trail_intensity': '💨 Độ đậm vệt',
    'cat_special': '🔧 Đặc biệt',
    'spinner_speed': '🔄 Tốc độ Spinner',
    'spinner_length': '📏 Chiều dài Spinner',
    'mud_slowdown': '🟤 Độ chậm Bùn',
    'cat_magnet': '🧲 Nam châm',
    'magnet_range': 'Tầm hút',
    'magnet_duration': 'Thời gian',
    'magnet_power': 'Lực hút',
    'magnet_attract_all': 'Hút tất cả',
    'context_title': '⚙️ Cài đặt Context',
    'btn_apply': 'Áp dụng',
    'label_spinner_angle': '🧭 Góc Spinner',
    'cat_bumper': '🟦 Bumper',
    'bumper_radius': '🔘 Bán kính',
    'bumper_elasticity': '🪗 Độ đàn hồi',
    'bumper_noise': '🌫️ Độ lệch góc',
    'bumper_color': '🎨 Màu Bumper',
    'cat_fan': '🌀 Quạt',
    'fan_radius': '🔘 Bán kính',
    'fan_angle': '📐 Góc',
    'fan_spread': '🍕 Độ mở',
    'fan_strength': '💨 Sức gió',
    'hide_all_names': '🙈 Ẩn tên',
    'name_size': '🔤 Cỡ tên',
    'enable_hp_system': '❤️ Bật hệ thống HP',
    'horse_max_hp': '💖 HP tối đa',
    'show_hp_numbers': '🔢 Hiện chỉ số HP',
    'show_horse_speed': '⚡ Hiện tốc độ',
    'auto_rotate_sprite': '🔄 Tự xoay Sprite',
    'last_horse_wins': '👑 Ngựa cuối cùng thắng',
    'wall_damage': '🧱 Sát thương tường',
    'border_damage': '🔲 Sát thương biên',
    'wall_damage_amount': '💥 Lượng dam tường',
    'border_damage_amount': '🔥 Lượng dam biên',
    'min_cruise': '🏎️ Tốc độ trôi min',
    'luck_or_suck': '🍀 Luck or Suck',
    'luck_interval': '⏲️ Chu kỳ Luck (s)',
    'test_race_btn': '▶ Đua thử',
    'panel_bgm': '🎵 Nhạc nền',
    'label_bgm_file': 'Tệp nhạc:',
    'label_controls': 'Điều khiển:',
    'label_tts_voice': 'Giọng TTS:',
    'label_tts_enabled': 'Bật TTS:',
    'label_tts_source': 'Nguồn TTS:',
    'label_azure_key': 'Azure Key:',
    'label_azure_region': 'Region:',
    'label_azure_voice': 'Azure Voice:',
    'test_tts_btn': '🔊 Test TTS',
    'test_tts_hint': 'Phát: "Xin chào!"',
    'btn_clear_map': '🗑️ Xóa Map',
    'btn_load_sample': '📋 Map Mẫu',
    'btn_generate_map': '🎲 Tạo Map',
    'btn_add_items': '✨ Thêm Item',
    'btn_add_belt': '➕ Thêm Belt',
    'btn_export_json': '📤 Xuất JSON',
    'btn_import_json': '📥 Nhập JSON',
    'cat_preset_maps': '🗺️ Map có sẵn',
    'btn_preset_oval': '🏁 Oval',
    'btn_preset_spinner': '🌪️ Spinner',
    'btn_preset_maze': '🧱 Mê cung',
    'cat_waiting_room': '🚪 Phòng chờ',
    'wr_width': '📏 Rộng',
    'wr_height': '📐 Cao',
    'wr_corner_radius': '⬜ Góc bo',
    'wr_auto_fit': '⚙️ Tự chỉnh khi đua',
    'cat_carrot_settings': '🥕 Cài đặt Cà rốt',
    'btn_swap_ab': '🔄 Đổi A/B',
    'btn_reset_pos': '🎯 Đặt lại vị trí',
    'label_png_sprite': '🖼️ PNG Sprite',
    'btn_clear_a': '🗑️ Xóa A',
    'btn_clear_b': '🗑️ Xóa B',
    'label_sprite_scale': '📏 Tỉ lệ Sprite',
    'label_sprite_outline': '🖌️ Viền Sprite',
    'label_outline_color': '🎨 Màu viền',
    'label_outline_width': '📏 Độ dày viền',
    'cat_horse_custom': '🐴 Tùy chỉnh Ngựa',
    'label_select_horse': '🔢 Chọn Ngựa #',
    'label_display_name': '📝 Tên hiển thị',
    'label_special_skill': '⚡ Kỹ năng',
    'label_custom_speed': '🏃 Tốc độ riêng',
    'label_custom_hp': '❤️ HP riêng',
    'label_luck': '🍀 Luck (%)',
    'label_luck_int': '⏱️ Luck Interval',
    'label_body_color': '🎨 Màu thân',
    'label_label_color': '🏷️ Label Color',
    'btn_sprite_presets': '📚 Thư viện Sprite...',
    'title_sprite_presets': 'Thư viện Sprite',
    'btn_import_pngs': '➕ Nhập PNG...',
    'btn_import_folder': '📂 Nhập Thư mục...',
    'tip_sprite_presets': 'Mẹo: Bạn có thể dùng sprite có sẵn bên dưới',
    'current_horse_group': '🎯 Ngựa hiện tại',
    'all_horses_group': '👥 Tất cả ngựa',
    'sprites_group': '🖼️ Sprites',
    'colors_skills_group': '🎨 Màu & Skill',
    'btn_reset': '🔄 Đặt lại',
    'btn_random': '🎲 Ngẫu nhiên',
    'btn_skill': '🎲 Skill',
    'btn_copy_all': '📋 Chép cho tất cả',
    'btn_random_all': '🎲 Random Tất cả',
    'btn_skill_all': '🎲 Skill Tất cả',
    'btn_clear': '🗑️ Xóa',
    'btn_random_n': '🎲 Random #N',
    'btn_outline_all': '✏️ Viền Tất cả',
    'btn_body_all': '🎨 Body Tất cả',
    'btn_undo': 'Hoàn tác (Undo)',
    'btn_clear_walls': 'Xóa TƯỜNG',
    'btn_save_browser': 'Lưu (Browser)',
    'btn_load_browser': 'Tải (Browser)'
  }
};

// Current language state
let currentLanguage = 'en';
let EDITOR_ITEM_DESCRIPTIONS = EDITOR_DESCRIPTIONS_DATA['en'];

function setLanguage(lang) {
  if (!TOOLTIPS_DATA[lang]) return;
  currentLanguage = lang;
  
  // Update Editor Tooltips (Toolbar)
  const tools = document.querySelectorAll('.tool[data-tool]');
  tools.forEach(t => {
    const key = t.getAttribute('data-tool');
    if (TOOLTIPS_DATA[lang][key]) {
      t.title = TOOLTIPS_DATA[lang][key];
    }
  });
  
  // Update UI Text
  const i18nElements = document.querySelectorAll('[data-i18n]');
  i18nElements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (UI_TEXT_DATA[lang][key]) {
      el.textContent = UI_TEXT_DATA[lang][key];
    }
  });
  
  // Update Hover Item Descriptions
  EDITOR_ITEM_DESCRIPTIONS = EDITOR_DESCRIPTIONS_DATA[lang];
  
  // Save preference
  try { localStorage.setItem('editor_language', lang); } catch {}
}

// Initialize Language
function initLanguage() {
  const langSelect = document.getElementById('languageSelect');
  const toggleBtn = document.getElementById('languageToggleBtn');

  // Load saved language or default to Vietnamese (as preferred by user)
  const savedLang = localStorage.getItem('editor_language') || 'vi';
  setLanguage(savedLang);

  if (langSelect) {
    langSelect.value = savedLang;
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLanguage === 'en' ? 'vi' : 'en';
      setLanguage(newLang);
      if (langSelect) langSelect.value = newLang;
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguage);
} else {
  // DOM already ready, run immediately
  initLanguage();
}

// Helper to find item under cursor for tooltip
function findHoveredItem(mx, my) {
  if (!mapDef) return null;
  
  // Check walls
  for (const w of mapDef.walls) {
    if (mx >= w.x && mx <= w.x + w.w && my >= w.y && my <= w.y + w.h) return { type: 'wall', item: w };
  }
  
  // Check circular/radius based items using existing near functions or direct check
  if (typeof nearBumper === 'function') { const i = nearBumper(mx, my); if (i !== -1) return { type: 'bumper', item: mapDef.bumpers[i] }; }
  if (typeof nearSpinner === 'function') { const i = nearSpinner(mx, my); if (i !== -1) return { type: 'spinner', item: mapDef.spinners[i] }; }
  if (typeof nearFan === 'function') { const i = nearFan(mx, my); if (i !== -1) return { type: 'fan', item: mapDef.fans[i] }; }
  if (typeof nearBoost === 'function') { const i = nearBoost(mx, my); if (i !== -1) return { type: 'boost', item: mapDef.boosts[i] }; }
  if (typeof nearTurbo === 'function') { const i = nearTurbo(mx, my); if (i !== -1) return { type: 'turbo', item: mapDef.turbos[i] }; }
  if (typeof nearShield === 'function') { const i = nearShield(mx, my); if (i !== -1) return { type: 'shield', item: mapDef.shields[i] }; }
  if (typeof nearGhost === 'function') { const i = nearGhost(mx, my); if (i !== -1) return { type: 'ghost', item: mapDef.ghosts[i] }; }
  if (typeof nearMagnet === 'function') { const i = nearMagnet(mx, my); if (i !== -1) return { type: 'magnet', item: mapDef.magnets[i] }; }
  if (typeof nearTimeFreeze === 'function') { const i = nearTimeFreeze(mx, my); if (i !== -1) return { type: 'timefreeze', item: mapDef.timeFreezes[i] }; }
  if (typeof nearIceFreezer === 'function') { const i = nearIceFreezer(mx, my); if (i !== -1) return { type: 'icefreezer', item: mapDef.icefreezers[i] }; }
  if (typeof nearPoison === 'function') { const i = nearPoison(mx, my); if (i !== -1) return { type: 'poison', item: mapDef.poisons[i] }; }
  if (typeof nearTrap === 'function') { const i = nearTrap(mx, my); if (i !== -1) return { type: 'trap', item: mapDef.traps[i] }; }
  if (typeof nearLightning === 'function') { const i = nearLightning(mx, my); if (i !== -1) return { type: 'lightning', item: mapDef.lightnings[i] }; }
  if (typeof nearTornado === 'function') { const i = nearTornado(mx, my); if (i !== -1) return { type: 'tornado', item: mapDef.tornados[i] }; }
  if (typeof nearVolcano === 'function') { const i = nearVolcano(mx, my); if (i !== -1) return { type: 'volcano', item: mapDef.volcanos[i] }; }
  if (typeof nearTeleport === 'function') { const i = nearTeleport(mx, my); if (i !== -1) return { type: 'teleport', item: mapDef.teleports[i] }; }
  if (typeof nearWarpzone === 'function') { const i = nearWarpzone(mx, my); if (i !== -1) return { type: 'warpzone', item: mapDef.warpzones[i] }; }
  if (typeof nearQuantumdash === 'function') { const i = nearQuantumdash(mx, my); if (i !== -1) return { type: 'quantumdash', item: mapDef.quantumdashs[i] }; }
  if (typeof nearYellowheart === 'function') { const i = nearYellowheart(mx, my); if (i !== -1) return { type: 'yellowheart', item: mapDef.yellowhearts[i] }; }
  if (typeof nearMagnetpull === 'function') { const i = nearMagnetpull(mx, my); if (i !== -1) return { type: 'magnetpull', item: mapDef.magnetpulls[i] }; }
  if (typeof nearMagnetpush === 'function') { const i = nearMagnetpush(mx, my); if (i !== -1) return { type: 'magnetpush', item: mapDef.magnetpushs[i] }; }
  if (typeof nearNebula === 'function') { const i = nearNebula(mx, my); if (i !== -1) return { type: 'nebula', item: mapDef.nebulas[i] }; }
  if (typeof nearFiretrap === 'function') { const i = nearFiretrap(mx, my); if (i !== -1) return { type: 'firetrap', item: mapDef.firetrap[i] }; }
  if (typeof nearHealingzone === 'function') { const i = nearHealingzone(mx, my); if (i !== -1) return { type: 'healingzone', item: mapDef.healingzones[i] }; }
  if (typeof nearFireaura === 'function') { const i = nearFireaura(mx, my); if (i !== -1) return { type: 'fireaura', item: mapDef.fireaura[i] }; }
  if (typeof nearMud === 'function') { const i = nearMud(mx, my); if (i !== -1) return { type: 'mud', item: mapDef.mudPatches[i] }; }
  if (typeof nearRam === 'function') { const i = nearRam(mx, my); if (i !== -1) return { type: 'ram', item: mapDef.rams[i] }; }
  
  // Check belts
  if (typeof nearBelt === 'function') { const i = nearBelt(mx, my); if (i !== -1) return { type: 'belt', item: mapDef.belts[i] }; }
  
  // Check pipes (diags)
  if (typeof pickPipeIndex === 'function') { const i = pickPipeIndex(mx, my); if (i !== -1) return { type: 'pipe', item: mapDef.pipes[i] }; }
  
  // Check start line
  if (mapDef.startLine) {
    const s = mapDef.startLine;
    if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) return { type: 'start', item: s };
  }
  
  // Check waiting room
  if (mapDef.waitingRoom) {
    const r = mapDef.waitingRoom;
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return { type: 'room', item: r };
  }
  
  // Check carrots
  if (typeof nearCarrot === 'function') { const i = nearCarrot(mx, my); if (i !== -1) return { type: 'carrot', item: mapDef.carrots[i] }; }
  
  // Check spawn points
  if (typeof nearSpawn === 'function') { const i = nearSpawn(mx, my); if (i !== -1) return { type: 'spawn', item: mapDef.spawnPoints[i] }; }

  return null;
}

let editorHoveredItem = null;
let editorMouseX = 0;
let editorMouseY = 0;

// Pause button on HUD
function updatePauseBtn(){
  const pb = document.getElementById('pauseBtnHUD');
  if (!pb) return;
  pb.textContent = paused ? '▶️' : '⏸️';
  pb.title = paused ? 'Tiếp tục (Space)' : 'Tạm dừng (Space)';
}

const pauseBtnHUD = document.getElementById('pauseBtnHUD');
if (pauseBtnHUD){
  pauseBtnHUD.addEventListener('click', ()=>{
    paused = !paused;
    try { toast(paused ? 'Tạm dừng' : 'Tiếp tục'); } catch {}
    try { playSfx(paused ? 'pause_whoosh' : 'resume_whoosh'); } catch {}
    try { showFlash(paused ? 'Paused' : 'Resumed'); } catch {}
    updatePauseBtn();
  });
}
  const GATECOLOR=getComputedStyle(document.documentElement).getPropertyValue('--gate').trim();
  // Grid drawing utilities - MOVED TO: scripts/utils/grid-drawing.js
  // Access via: window.GridDrawing or window.invalidateGrid(), drawGridCached(), lastGridStep for compatibility

// ===== Draggable number inputs =====
function createCustomSlider(originalInput) {
  if (originalInput.type !== 'range') return;

  const slider = document.createElement('div');
  slider.className = 'custom-slider';

  const val = document.createElement('div');
  val.className = 'slider-val';

  const thumb = document.createElement('div');
  thumb.className = 'slider-thumb';

  slider.appendChild(val);
  slider.appendChild(thumb);

  // Insert the new slider and hide the original
  originalInput.style.display = 'none';
  originalInput.parentNode.insertBefore(slider, originalInput);

  const updateVisuals = () => {
    const min = parseFloat(originalInput.min) || 0;
    const max = parseFloat(originalInput.max) || 100;
    const value = parseFloat(originalInput.value);
    const percent = ((value - min) / (max - min)) * 100;
    val.style.width = `${percent}%`;
    thumb.style.left = `${percent}%`;
  };

  const handleDrag = (e) => {
    const rect = slider.getBoundingClientRect();
    const min = parseFloat(originalInput.min) || 0;
    const max = parseFloat(originalInput.max) || 100;
    const step = parseFloat(originalInput.step) || 1;

    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    let newValue = min + percent * (max - min);
    newValue = Math.round(newValue / step) * step;
    
    // Clamp and format
    newValue = Math.max(min, Math.min(max, newValue));
    const precision = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    originalInput.value = newValue.toFixed(precision);

    originalInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  slider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleDrag(e);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => handleDrag(moveEvent);
    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  
  // Touch support
  slider.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    handleDrag(t);
    document.body.style.userSelect = 'none';
    const onMove = (me) => handleDrag(me.touches[0]);
    const onEnd = () => {
      document.body.style.userSelect = '';
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }, {passive:false});

  originalInput.addEventListener('input', updateVisuals);
  updateVisuals(); // Initial call
}

// ===== Stage (draggable horizontally) + Zoom/Pan =====
// MOVED TO: scripts/editor/stage-transform.js
// Access via: window.StageTransform or window.applyStageTransform(), window.setStageDrag() for compatibility

// Keep local reference for backward compatibility
const stage = document.getElementById('stage');

// Force simple setup: always use browser TTS source
(function enforceBrowserTTS(){
  try{
    window.tts.source = 'browser';
    try{ localStorage.setItem('tts.source','browser'); }catch{}
    const srcSel = document.getElementById('ttsSourceSel');
    const cfgBox = document.getElementById('ttsAzureCfg');
    if (srcSel) srcSel.value = 'browser';
    if (cfgBox) cfgBox.style.display = 'none';
  }catch{}
})();

// ===== Waiting Room Drag-Resize (editor) =====
// MOVED TO: scripts/editor/waiting-room-resize.js
// Access via: window.WaitingRoomResize for status checks

// Central function to reset view
function resetView(){
  if (window.StageTransform && typeof window.StageTransform.resetTransform === 'function') {
    window.StageTransform.resetTransform();
  }
}

// Pan by dragging canvas: middle mouse, or hold Space + left mouse
(function(){
  let panning = false, lastX = 0, lastY = 0, useButton = 0;
  let spaceHeld = false;
  window.addEventListener('keydown', (e)=>{ if (e.code === 'Space') spaceHeld = true; });
  window.addEventListener('keyup', (e)=>{ if (e.code === 'Space') spaceHeld = false; });
  canvas.addEventListener('mousedown', (e)=>{
    if (e.button === 1 || (e.button === 0 && spaceHeld)){
      panning = true; useButton = e.button; lastX = e.clientX; lastY = e.clientY; document.body.style.cursor = 'grabbing'; e.preventDefault();
    }
  });
  window.addEventListener('mousemove', (e)=>{
    if (!panning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const currentPan = window.StageTransform?.getPan() || { x: 0, y: 0 };
    if (window.StageTransform && typeof window.StageTransform.setPan === 'function') {
      window.StageTransform.setPan(currentPan.x + dx, currentPan.y + dy);
    }
  });
  window.addEventListener('mouseup', (e)=>{
    if (!panning) return;
    if (e.button === useButton){ panning = false; document.body.style.cursor = ''; }
  });
})();

const resetViewBtnEl = document.getElementById('resetViewBtn');
if (resetViewBtnEl) resetViewBtnEl.addEventListener('click', resetView);

// Keyboard shortcuts: Ctrl+= / Ctrl+- / Ctrl+0
window.addEventListener('keydown', (e)=>{
  if (e.ctrlKey && (e.key==='+' || e.key==='=')){
    e.preventDefault();
    const fake = { clientX: window.innerWidth/2, clientY: window.innerHeight/2, deltaY: -1, preventDefault: ()=>{} };
    canvas.dispatchEvent(new WheelEvent('wheel', fake));
  } else if (e.ctrlKey && (e.key==='-' || e.key==='_')){
    e.preventDefault();
    const fake = { clientX: window.innerWidth/2, clientY: window.innerHeight/2, deltaY: 1, preventDefault: ()=>{} };
    canvas.dispatchEvent(new WheelEvent('wheel', fake));
  } else if (e.ctrlKey && (e.key === '0' || e.code === 'Numpad0')){
    e.preventDefault();
    resetView();
  }
});

// Live fine-tuning of horse collision hitbox
window.addEventListener('keydown', (e) => {
  let updated = false;
  // [ / ] adjust hit scale
  if (e.key === '[') {
    mapDef.horseHitScale = Math.max(0.70, Math.min(1.00, (mapDef.horseHitScale||0.85) - 0.01));
    updated = true;
  } else if (e.key === ']') {
    mapDef.horseHitScale = Math.max(0.70, Math.min(1.00, (mapDef.horseHitScale||0.85) + 0.01));
    updated = true;
  }
  // ; / ' adjust hit inset
  else if (e.key === ';') {
    mapDef.horseHitInset = Math.max(0, Math.min(8, (mapDef.horseHitInset||2) - 1));
    updated = true;
  } else if (e.key === "'") {
    mapDef.horseHitInset = Math.max(0, Math.min(8, (mapDef.horseHitInset||2) + 1));
    updated = true;
  }

  if (updated) {
    // Apply to live horses
    for (const h of horses) {
      h.hitScale = mapDef.horseHitScale;
      h.hitInset = mapDef.horseHitInset;
    }
    if (typeof toast === 'function') {
      toast(`Hitbox: scale ${mapDef.horseHitScale.toFixed(2)} | inset ${mapDef.horseHitInset}px`);
    }
    e.preventDefault();
  }
  // H toggles hitbox overlay
  if (e.key === 'h' || e.key === 'H') {
    debugShowHitbox = !debugShowHitbox;
    if (typeof toast === 'function') toast(`Hitbox overlay: ${debugShowHitbox ? 'ON' : 'OFF'}`);
  }
});

// ===== Mode & Map =====
let mode = "editor";
// Sync local mode with window for race.js compatibility
Object.defineProperty(window, 'mode', {
  get() { return mode; },
  set(v) { mode = v; }
});

const mapDef = {
  walls: [], pipes: [], semis: [], arcs: [], brushes: [],
  spawnPoints: [], horseCustoms: [],
  waitingRoom: { x: 40, y: 120, w: 260, h: 480, r: 18 },
  startLine: { x: 310, y: 120, w: 8, h: 480 },
  gateBar: { x: 322, y: 120, w: 10, h: 480 },
  carrots: [{ x: 1120, y: 820, r: 30, enabled: false }, { x: 980, y: 820, r: 30, enabled: false }],
  boosts: [],
  ghosts: [],
  traps: [],
  rams: [],
  poisons: [],
  mudPatches: [],
  healingPatches: [],
  rotatingBarriers: [], 
  magnetpulls: [], 
  magnetpushs: [], 
  fans: [],
  belts: [],
  magnets: [],
  teleports: [],
  timeFreezes: [],
  spinners: [],
  lightnings: [], // ⭐ Lightning power-ups
  volcanos: [], // 🌋 Volcano hazards
  shields: [], // 🛡️ Shield power-ups
  warpzones: [], // 🌌 Warp Zone power-ups
  quantumdashs: [], // 🔮 Quantum Dash power-ups
  // [PU-BEGIN name=yellowheart section=data-structure]
  yellowhearts: [], // 💛 Yellowheart power-ups
// [PU-END name=yellowheart section=data-structure]
  testpowers: [], // ⚡ Testpower power-ups// ⚡ Simpletest power-ups// ⚡ Simpletest power-ups// ⚡ Simpletest power-ups// 💥 Testdamage power-ups// 💥 Testdamage power-ups
  // Magnet settings (editor configurable)
  magnetSettings: {
    range: 100,        // pixels (default 100)
    durationMs: 3000,  // 3 seconds by default
    attractAll: false, // false = only beneficial items
    power: 200,        // attraction strength scalar
    consumable: true   // always consumable by default
  },
  // Turbo settings (global)
  turboSettings: {
    durationMs: 5000,
    multiplier: 2.2,
    consumable: true   // always consumable by default
  },
  // Shield settings (global)
  shieldSettings: {
    durationMs: 10000,
    consumable: true   // always consumable by default
  },
  // Poison settings (global)
  poisonSettings: {
    durationMs: 5000,  // 5 seconds of chaos
    consumable: true   // always consumable by default
  },
  // Time Freeze settings (global)
  timeFreezeSettings: {
    durationMs: 5000,
    affectSelf: false,
    consumable: true   // always consumable by default
  },
  // Ice Freezer settings (global)
  icefreezerSettings: {
    durationMs: 2000,
    freezeDurationMs: 2000,
    slowMultiplier: 0.7,
    consumable: true   // always consumable by default
  },
  testpowerSettings: {
    durationMs: 3000,
    damage: 20,
    
    radius: 15,
    consumable: true
  },// Teleport settings (global)
  teleportSettings: {
    safeMargin: 20,
    minDistance: 0,
    consumable: true   // always consumable by default
  },
  // Warp Zone settings (global)
  warpzoneSettings: {
    cooldownMs: 500,        // Cooldown between warps
    minDistance: 50,        // Minimum distance between zones
    teleportOffset: 25,     // Offset from target zone center
    consumable: true        // always consumable by default
  },
  // Quantum Dash settings (global)
  quantumdashSettings: {
    durationMs: 2500,       // Effect duration
    speedMultiplier: 3.0,   // Speed boost multiplier
    phaseEnabled: true,     // Wall phasing enabled
    consumable: true        // always consumable by default
  },
  // [PU-BEGIN name=yellowheart section=settings]
  // Yellowheart settings (global)
  yellowheartSettings: {
    damage: 25,
    duration: 4000,
    radius: 18,
    effectType: 'speed',   // 'damage', 'speed', 'heal'
    consumable: true,       // Disappears after use
    stackable: true,       // Can stack effects
    maxStacks: 4           // Maximum stacks
  },
// [PU-END name=yellowheart section=settings]
  // Boost settings (global)
  boostSettings: {
    stackBonus: 0.2,
    maxStacks: 10,
    consumable: true        // always consumable by default
  },
  // Ghost settings (global)
  ghostSettings: {
    durationMs: 4000,
    transparency: 0.3,
    consumable: true        // always consumable by default
  },
  // Nebula settings (global)
  nebulaSettings: {
    speedMultiplier: 2.5,
    durationMs: 4000,
    damage: 20,
    radius: 16,
    particleEnabled: true,
    glowEnabled: true,
    intensity: 1,
    consumable: true        // always consumable by default
  },
  // Ram settings (global)
  ramSettings: {
    durationMs: 4000,
    range: 25,
    consumable: true        // always consumable by default
  },
  // New: Circular springy bumpers
  // Each: { x, y, r, e, noise, color }
  //  - r: bumper radius (default ~22)
  //  - e: bounce amplification multiplier (>1 = speed up, default 1.15)
  //  - noise: max angle noise in radians (default ~0.15)
  //  - color: optional core color
  bumpers: [],
  // Weather System
  weather: {
    type: 'clear', // 'clear', 'rain', 'wind', 'snow', 'storm'
    intensity: 0.5, // 0.0 - 1.0
    windDirection: 0, // radians (0 = right, PI/2 = down)
    enabled: false
  },
  horseRadius: 36, // Default horse radius
  // Dynamic defaults based on saved horse speed setting
  get maxVel() { 
    const horseSpeed = this.horseSpeed || 1.0;
    return horseSpeed; // Match horse speed exactly
  },
  get minCruise() { 
    const horseSpeed = this.horseSpeed || 1.0;
    return horseSpeed * 0.5; // Horse speed * 0.5 for min cruise  
  },
  horseSpeed: 1.0, // Default horse speed from map editor
  maxHorseSpeed: 4.0, // Max horse speed limit from map editor
  carrotRadius: 30, // Default carrot radius
  horseHitScale: 0.85, // New: scale collision radius to better match sprite visuals
  horseHitInset: 2, // New: subtract fixed pixels from hitbox for finer tuning
  hpSystemEnabled: true, // HP combat system toggle (default ON)
  horseMaxHP: 100, // Maximum HP for horses
  showHPNumbers: true, // Show HP numbers on HP bars (default ON)
  showHorseSpeed: true, // Show velocity below horse sprite
  autoRotateHorseSprite: false, // Auto rotate all horse sprites based on movement direction (global)
  lastHorseWins: true, // Win condition: last horse standing (default ON)
  wallDamageEnabled: false, // Wall collision damage toggle
  wallDamageAmount: 10 // Damage taken when hitting walls
};

// Make mapDef globally accessible for other modules
window.mapDef = mapDef;

// Initialize weather settings from localStorage
try {
  const savedWeatherEnabled = localStorage.getItem('weather_enabled');
  const savedWeatherType = localStorage.getItem('weather_type');
  const savedWeatherIntensity = localStorage.getItem('weather_intensity');
  const savedWeatherWindDirection = localStorage.getItem('weather_windDirection');
  
  if (savedWeatherEnabled !== null) mapDef.weather.enabled = savedWeatherEnabled === 'true';
  if (savedWeatherType) mapDef.weather.type = savedWeatherType;
  if (savedWeatherIntensity) mapDef.weather.intensity = parseFloat(savedWeatherIntensity) || 0.5;
  if (savedWeatherWindDirection) mapDef.weather.windDirection = parseFloat(savedWeatherWindDirection) || 0;
} catch {}

// DISABLED: Power-up consumable flags are now ALWAYS TRUE by default
// Old localStorage values can cause issues, so we ignore them
// Users can still toggle via context menu, but settings won't persist across reloads
/*
// Initialize power-up consumable settings from localStorage
try {
  const boostConsumable = localStorage.getItem('boostConsumable');
  const turboConsumable = localStorage.getItem('turboConsumable');
  const shieldConsumable = localStorage.getItem('shieldConsumable');
  const teleportConsumable = localStorage.getItem('teleportConsumable');
  const quantumdashConsumable = localStorage.getItem('quantumdashConsumable');
  const nebulaConsumable = localStorage.getItem('nebulaConsumable');
  const yellowheartConsumable = localStorage.getItem('yellowheartConsumable');
  const ghostConsumable = localStorage.getItem('ghostConsumable');
  const poisonConsumable = localStorage.getItem('poisonConsumable');
  const ramConsumable = localStorage.getItem('ramConsumable');
  const magnetConsumable = localStorage.getItem('magnetConsumable');
  const timeFreezeConsumable = localStorage.getItem('timeFreezeConsumable');
  const iceFreezerConsumable = localStorage.getItem('iceFreezerConsumable');
  const tornadoConsumable = localStorage.getItem('tornadoConsumable');
  const volcanoConsumable = localStorage.getItem('volcanoConsumable');
  const warpzoneConsumable = localStorage.getItem('warpzoneConsumable');
  
  if (boostConsumable !== null) {
    mapDef.boostSettings = mapDef.boostSettings || {};
    mapDef.boostSettings.consumable = JSON.parse(boostConsumable);
  }
  if (turboConsumable !== null) {
    mapDef.turboSettings = mapDef.turboSettings || {};
    mapDef.turboSettings.consumable = JSON.parse(turboConsumable);
  }
  if (shieldConsumable !== null) {
    mapDef.shieldSettings = mapDef.shieldSettings || {};
    mapDef.shieldSettings.consumable = JSON.parse(shieldConsumable);
  }
  if (teleportConsumable !== null) {
    mapDef.teleportSettings = mapDef.teleportSettings || {};
    mapDef.teleportSettings.consumable = JSON.parse(teleportConsumable);
  }
  if (quantumdashConsumable !== null) {
    mapDef.quantumdashSettings = mapDef.quantumdashSettings || {};
    mapDef.quantumdashSettings.consumable = JSON.parse(quantumdashConsumable);
  }
  if (nebulaConsumable !== null) {
    mapDef.nebulaSettings = mapDef.nebulaSettings || {};
    mapDef.nebulaSettings.consumable = JSON.parse(nebulaConsumable);
  }
  if (yellowheartConsumable !== null) {
    mapDef.yellowheartSettings = mapDef.yellowheartSettings || {};
    mapDef.yellowheartSettings.consumable = JSON.parse(yellowheartConsumable);
  }
  if (ghostConsumable !== null) {
    mapDef.ghostSettings = mapDef.ghostSettings || {};
    mapDef.ghostSettings.consumable = JSON.parse(ghostConsumable);
  }
  if (poisonConsumable !== null) {
    mapDef.poisonSettings = mapDef.poisonSettings || {};
    mapDef.poisonSettings.consumable = JSON.parse(poisonConsumable);
  }
  if (ramConsumable !== null) {
    mapDef.ramSettings = mapDef.ramSettings || {};
    mapDef.ramSettings.consumable = JSON.parse(ramConsumable);
  }
  if (magnetConsumable !== null) {
    mapDef.magnetSettings = mapDef.magnetSettings || {};
    mapDef.magnetSettings.consumable = JSON.parse(magnetConsumable);
  }
  if (timeFreezeConsumable !== null) {
    mapDef.timeFreezeSettings = mapDef.timeFreezeSettings || {};
    mapDef.timeFreezeSettings.consumable = JSON.parse(timeFreezeConsumable);
  }
  if (iceFreezerConsumable !== null) {
    mapDef.icefreezerSettings = mapDef.icefreezerSettings || {};
    mapDef.icefreezerSettings.consumable = JSON.parse(iceFreezerConsumable);
  }
  // Load Ice Freezer settings from localStorage
  try {
    const iceDur = parseInt(localStorage.getItem('iceFreezerDuration') || '');
    const iceSlow = parseFloat(localStorage.getItem('iceFreezerSlowMultiplier') || '');
    if (!Number.isNaN(iceDur)) {
      mapDef.icefreezerSettings.freezeDurationMs = Math.max(500, Math.min(5000, iceDur));
      mapDef.icefreezerSettings.durationMs = mapDef.icefreezerSettings.freezeDurationMs;
    }
    if (!Number.isNaN(iceSlow)) mapDef.icefreezerSettings.slowMultiplier = Math.max(0.1, Math.min(1.0, iceSlow));
  } catch {}
  if (tornadoConsumable !== null) {
    mapDef.tornadoSettings = mapDef.tornadoSettings || {};
    mapDef.tornadoSettings.consumable = JSON.parse(tornadoConsumable);
  }
  if (volcanoConsumable !== null) {
    mapDef.volcanoSettings = mapDef.volcanoSettings || {};
    mapDef.volcanoSettings.consumable = JSON.parse(volcanoConsumable);
  }
  if (warpzoneConsumable !== null) {
    mapDef.warpzoneSettings = mapDef.warpzoneSettings || {};
    mapDef.warpzoneSettings.consumable = JSON.parse(warpzoneConsumable);
  }
} catch (e) {
  console.warn('Failed to load power-up settings from localStorage:', e);
}
*/

// ===== Undo/Redo History =====
// MOVED TO: scripts/editor/history.js
// Access via: window.HistorySystem or window.pushHistory(), window.undo(), window.redo() for compatibility

// Collision Speed Prevention Toggle Handler
try {
  const preventCollisionToggle = document.getElementById('preventCollisionSpeedChange');
  if (preventCollisionToggle) {
    // Initialize config structure if not exists
    if (!window.config) window.config = {};
    if (!window.config.physics) window.config.physics = {};
    if (!window.config.physics.collision) window.config.physics.collision = {};
    
    // Load from localStorage first
    let savedState = false;
    try {
      const saved = localStorage.getItem('preventCollisionSpeedChange');
      if (saved !== null) {
        savedState = JSON.parse(saved);
      }
    } catch {}
    
    // Set initial state
    window.config.physics.collision.preventSpeedChange = savedState;
    preventCollisionToggle.checked = savedState;
    
    // console.log('[Physics] Collision prevention initialized:', savedState);
    
    preventCollisionToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      
      // Update config
      window.config.physics.collision.preventSpeedChange = enabled;
      
      // Enable debug mode for 10 seconds when setting changes
      window._debugCollision = true;
      setTimeout(() => { window._debugCollision = false; }, 10000);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('preventCollisionSpeedChange', JSON.stringify(enabled));
      } catch {}
      
      // Feedback to user
      const message = enabled ? '🛡️ Ngăn tất cả va chạm thay đổi tốc độ: BẬT' : '⚡ Cho phép va chạm thay đổi tốc độ: TẮT';
      if (typeof toast === 'function') {
        toast(message);
      } else {
        console.log('[Physics] ' + message);
      }
      
      // console.log('[Physics] Collision prevention changed to:', enabled, 'Config:', window.config.physics.collision);
    });
    
  }
  
  // Debug function for testing collision prevention
  window.debugCollisionPrevention = function() {
    const current = window.config?.physics?.collision?.preventSpeedChange || false;
    console.log('=== COLLISION PREVENTION DEBUG ===');
    console.log('Current setting:', current);
    console.log('Config object:', window.config?.physics?.collision);
    console.log('Toggle element:', document.getElementById('preventCollisionSpeedChange')?.checked);
    console.log('LocalStorage:', localStorage.getItem('preventCollisionSpeedChange'));
    console.log('Enabling debug mode for 10 seconds...');
    window._debugCollision = true;
    setTimeout(() => { 
      window._debugCollision = false;
      console.log('Debug mode disabled.');
    }, 10000);
    return current;
  };
  
  // Test function to force horse collision
  window.testHorseCollision = function() {
    if (!window.horses || window.horses.length < 2) {
      console.log('Need at least 2 horses to test collision');
      return;
    }
    
    // Enable debug mode immediately
    window._debugCollision = true;
    
    const h1 = window.horses[0];
    const h2 = window.horses[1];
    
    console.log('=== FORCING HORSE COLLISION TEST ===');
    console.log('Prevention setting:', window.config?.physics?.collision?.preventSpeedChange);
    console.log('Config object:', window.config?.physics?.collision);
    
    // Store original velocities
    const originalH1Vx = h1.vx;
    const originalH1Vy = h1.vy;
    const originalH2Vx = h2.vx;
    const originalH2Vy = h2.vy;
    
    console.log('Before collision:');
    console.log('Horse 1 velocity:', h1.vx.toFixed(2), h1.vy.toFixed(2));
    console.log('Horse 2 velocity:', h2.vx.toFixed(2), h2.vy.toFixed(2));
    
    // Force horses close together
    h1.x = 200;
    h1.y = 200;
    h2.x = 215; // Close enough to trigger collision
    h2.y = 200;
    
    // Give them some velocity
    h1.vx = 3;
    h1.vy = 0;
    h2.vx = -3;
    h2.vy = 0;
    
    console.log('Horses positioned for collision with velocities:', h1.vx, 'and', h2.vx);
    console.log('Horse objects:', h1, h2);
    console.log('Horses array reference:', window.horses);
    
    // Store direct references
    const h1Ref = h1;
    const h2Ref = h2;
    
    // Hook into velocity setters to track what's changing them
    const originalH1VxDescriptor = Object.getOwnPropertyDescriptor(h1, 'vx') || { value: h1.vx, writable: true };
    const originalH2VxDescriptor = Object.getOwnPropertyDescriptor(h2, 'vx') || { value: h2.vx, writable: true };
    
    console.log('Original descriptors:', originalH1VxDescriptor, originalH2VxDescriptor);
    
    Object.defineProperty(h1, 'vx', {
      get: () => originalH1VxDescriptor.value,
      set: (newValue) => {
        if (Math.abs(newValue - originalH1VxDescriptor.value) > 0.01) {
          console.log('🔥 H1.VX CHANGED:', originalH1VxDescriptor.value.toFixed(3), '→', newValue.toFixed(3));
          console.trace('Stack trace:');
        }
        originalH1VxDescriptor.value = newValue;
      }
    });
    
    Object.defineProperty(h2, 'vx', {
      get: () => originalH2VxDescriptor.value,
      set: (newValue) => {
        if (Math.abs(newValue - originalH2VxDescriptor.value) > 0.01) {
          console.log('🔥 H2.VX CHANGED:', originalH2VxDescriptor.value.toFixed(3), '→', newValue.toFixed(3));
          console.trace('Stack trace:');
        }
        originalH2VxDescriptor.value = newValue;
      }
    });
    
    // Monitor velocity changes with comprehensive tracking
    let checkCount = 0;
    const velocityMonitor = setInterval(() => {
      checkCount++;
      
      // Check if horse objects have been replaced
      const currentH1 = window.horses[0];
      const currentH2 = window.horses[1];
      
      if (currentH1 !== h1Ref) {
        console.log('⚠️ HORSE 1 OBJECT REPLACED!', 'Original:', h1Ref, 'Current:', currentH1);
      }
      if (currentH2 !== h2Ref) {
        console.log('⚠️ HORSE 2 OBJECT REPLACED!', 'Original:', h2Ref, 'Current:', currentH2);
      }
      
      console.log(`[${checkCount}] Current velocities:`);
      console.log('  h1 (original ref):', h1.vx.toFixed(2), h1.vy.toFixed(2));
      console.log('  h2 (original ref):', h2.vx.toFixed(2), h2.vy.toFixed(2));
      console.log('  horses[0] (current):', window.horses[0]?.vx?.toFixed(2), window.horses[0]?.vy?.toFixed(2));
      console.log('  horses[1] (current):', window.horses[1]?.vx?.toFixed(2), window.horses[1]?.vy?.toFixed(2));
      
      // Check for suspicious patterns
      if (Math.abs(h1.vx - h2.vx) < 0.01 && h1.vx !== 0) {
        console.log('🚨 SUSPICIOUS: Both horses have same velocity!', h1.vx.toFixed(3));
      }
      
      if (checkCount >= 10) { // Shortened to see results faster
        clearInterval(velocityMonitor);
        window._debugCollision = false;
        
        // Restore original descriptors
        Object.defineProperty(h1, 'vx', { value: h1.vx, writable: true });
        Object.defineProperty(h2, 'vx', { value: h2.vx, writable: true });
        
        console.log('=== COLLISION TEST COMPLETE ===');
        console.log('Final velocities:');
        console.log('Horse 1:', h1.vx.toFixed(2), h1.vy.toFixed(2), '(was:', originalH1Vx.toFixed(2), originalH1Vy.toFixed(2), ')');
        console.log('Horse 2:', h2.vx.toFixed(2), h2.vy.toFixed(2), '(was:', originalH2Vx.toFixed(2), originalH2Vy.toFixed(2), ')');
        
        const h1Changed = Math.abs(h1.vx - 3) > 0.1 || Math.abs(h1.vy - 0) > 0.1;
        const h2Changed = Math.abs(h2.vx - (-3)) > 0.1 || Math.abs(h2.vy - 0) > 0.1;
        
        if (h1Changed || h2Changed) {
          console.log('❌ VELOCITIES CHANGED despite prevention setting!');
          console.log('Check stack traces above to see what modified velocities!');
        } else {
          console.log('✅ Velocities preserved correctly!');
        }
      }
    }, 200);
  };
  
  // Function to disable physics systems that modify velocities
  window.disablePhysicsEffects = function(seconds = 10) {
    console.log('🛑 Disabling physics effects (friction, damping, speed limits) for', seconds, 'seconds...');
    
    // Store original GameLogic.updateHorses function
    if (!window._originalUpdateHorses && window.GameLogic) {
      window._originalUpdateHorses = window.GameLogic.updateHorses;
      
      // Replace with version that skips physics effects
      window.GameLogic.updateHorses = function(deltaTime) {
        const horses = this.gameState.horses || [];
        const walls = this.gameState.mapDef?.walls || [];
        const dt = deltaTime / 16.67;

        horses.forEach(horse => {
          if (horse.eliminated) return;

          // Apply input forces (KEEP THIS)
          this.applyHorseInput(horse, dt);

          // Apply power-up effects (KEEP THIS)
          this.applyPowerUpEffects(horse, dt);

          // SKIP: Update velocity with friction
          // SKIP: Limit maximum speed
          
          console.log('🚫 Skipping friction and speed limiting for', horse.name || 'horse');

          // Update position (KEEP THIS)
          horse.x += horse.vx * dt;
          horse.y += horse.vy * dt;

          // Check wall collisions (KEEP THIS)
          this.checkWallCollisions(horse, walls);

          // Update lap time (KEEP THIS)
          if (this.gameState.mode === 'race') {
            horse.lapTime += deltaTime;
          }
        });
      };
    }
    
    // Re-enable after timeout
    setTimeout(() => {
      console.log('✅ Re-enabling physics effects...');
      if (window._originalUpdateHorses && window.GameLogic) {
        window.GameLogic.updateHorses = window._originalUpdateHorses;
      }
    }, seconds * 1000);
  };
  
  // Function to disable other collision systems temporarily
  window.disableOtherCollisions = function(seconds = 10) {
    console.log('Disabling other collision systems for', seconds, 'seconds...');
    
    // Store original functions
    if (!window._originalCollisionFunctions) {
      window._originalCollisionFunctions = {
        reflect: window.reflect,
        checkWallCollisions: window.GameLogic?.checkWallCollisions,
        circleRectCollide: window.circleRectCollide,
        circleOBBCollide: window.circleOBBCollide
      };
    }
    
    // Replace with no-op functions
    if (window.reflect) {
      window.reflect = function() { 
        if (window._debugCollision) console.log('[DEBUG] reflect() disabled'); 
      };
    }
    
    if (window.GameLogic && window.GameLogic.checkWallCollisions) {
      window.GameLogic.checkWallCollisions = function() { 
        if (window._debugCollision) console.log('[DEBUG] checkWallCollisions() disabled'); 
      };
    }
    
    // Re-enable after timeout
    setTimeout(() => {
      console.log('Re-enabling collision systems...');
      if (window._originalCollisionFunctions.reflect) {
        window.reflect = window._originalCollisionFunctions.reflect;
      }
      if (window._originalCollisionFunctions.checkWallCollisions) {
        window.GameLogic.checkWallCollisions = window._originalCollisionFunctions.checkWallCollisions;
      }
    }, seconds * 1000);
  };
  
  // NUCLEAR OPTION: Hook ALL horses velocity changes
  window.hookAllHorseVelocities = function(seconds = 15) {
    if (!window.horses || window.horses.length === 0) {
      console.log('No horses found to hook');
      return;
    }
    
    console.log('🔥 HOOKING ALL', window.horses.length, 'HORSES for', seconds, 'seconds...');
    
    const originalDescriptors = [];
    
    window.horses.forEach((horse, index) => {
      const originalVxDesc = Object.getOwnPropertyDescriptor(horse, 'vx') || { value: horse.vx, writable: true };
      const originalVyDesc = Object.getOwnPropertyDescriptor(horse, 'vy') || { value: horse.vy, writable: true };
      
      originalDescriptors[index] = { vx: originalVxDesc, vy: originalVyDesc };
      
      // Hook vx
      Object.defineProperty(horse, 'vx', {
        get: () => originalVxDesc.value,
        set: (newValue) => {
          if (Math.abs(newValue - originalVxDesc.value) > 0.001) {
            console.log(`🔥 HORSE[${index}].VX:`, originalVxDesc.value.toFixed(3), '→', newValue.toFixed(3));
            console.trace(`Stack for horse[${index}].vx change:`);
          }
          originalVxDesc.value = newValue;
        }
      });
      
      // Hook vy
      Object.defineProperty(horse, 'vy', {
        get: () => originalVyDesc.value,
        set: (newValue) => {
          if (Math.abs(newValue - originalVyDesc.value) > 0.001) {
            console.log(`🔥 HORSE[${index}].VY:`, originalVyDesc.value.toFixed(3), '→', newValue.toFixed(3));
            console.trace(`Stack for horse[${index}].vy change:`);
          }
          originalVyDesc.value = newValue;
        }
      });
    });
    
    // Restore after timeout
    setTimeout(() => {
      console.log('✅ Restoring velocity hooks for', window.horses.length, 'horses...');
      window.horses.forEach((horse, index) => {
        if (originalDescriptors[index]) {
          Object.defineProperty(horse, 'vx', { value: horse.vx, writable: true });
          Object.defineProperty(horse, 'vy', { value: horse.vy, writable: true });
        }
      });
    }, seconds * 1000);
    
    console.log('🔥 All horses hooked! Watch console for velocity changes...');
  };
  
  // console.log('[Physics] Debug function available: debugCollisionPrevention()');
  // console.log('[Physics] Test function available: testHorseCollision()');
  // console.log('[Physics] Disable collisions: disableOtherCollisions(seconds)');
  // console.log('[Physics] Disable physics effects: disablePhysicsEffects(seconds)');
  // console.log('[Physics] NUCLEAR OPTION: hookAllHorseVelocities(seconds)');
  
  // Emergency restore function
  window.restoreNormalCollisions = function() {
    console.log('🚨 RESTORING normal collision physics...');
    location.reload(); // Quick restore
  };
  
  // TARGETED: Only track velocity changes during collision periods
  window.trackCollisionVelocityChanges = function() {
    if (!window.horses || window.horses.length < 2) {
      console.log('Need at least 2 horses');
      return;
    }
    
    const h1 = window.horses[0];
    const h2 = window.horses[1];
    
    console.log('🎯 TARGETED collision velocity tracking...');
    
    // Store original velocities
    const originalH1Vx = h1.vx;
    const originalH1Vy = h1.vy;
    const originalH2Vx = h2.vx;
    const originalH2Vy = h2.vy;
    
    console.log('Pre-collision velocities:');
    console.log('H1:', originalH1Vx.toFixed(3), originalH1Vy.toFixed(3));
    console.log('H2:', originalH2Vx.toFixed(3), originalH2Vy.toFixed(3));
    
    // Position horses for collision
    h1.x = 300;
    h1.y = 300;
    h2.x = 320;
    h2.y = 300;
    
    h1.vx = 2;
    h1.vy = 0;
    h2.vx = -2; 
    h2.vy = 0;
    
    // Only hook during collision window
    let hookingActive = true;
    const startTime = performance.now();
    
    const originalH1VxDesc = { value: h1.vx };
    const originalH2VxDesc = { value: h2.vx };
    
    Object.defineProperty(h1, 'vx', {
      get: () => originalH1VxDesc.value,
      set: (newValue) => {
        if (hookingActive && Math.abs(newValue - originalH1VxDesc.value) > 0.01) {
          const elapsed = performance.now() - startTime;
          console.log(`[${elapsed.toFixed(0)}ms] 🔥 H1.VX: ${originalH1VxDesc.value.toFixed(3)} → ${newValue.toFixed(3)}`);
          
          // Get stack trace
          const stack = new Error().stack;
          console.log('🔍 H1 STACK TRACE:');
          console.log(stack);
          
          // Also try console.trace
          console.trace('H1 velocity setter called from:');
        }
        originalH1VxDesc.value = newValue;
      }
    });
    
    Object.defineProperty(h2, 'vx', {
      get: () => originalH2VxDesc.value,
      set: (newValue) => {
        if (hookingActive && Math.abs(newValue - originalH2VxDesc.value) > 0.01) {
          const elapsed = performance.now() - startTime;
          console.log(`[${elapsed.toFixed(0)}ms] 🔥 H2.VX: ${originalH2VxDesc.value.toFixed(3)} → ${newValue.toFixed(3)}`);
          
          // Get stack trace
          const stack = new Error().stack;
          console.log('🔍 H2 STACK TRACE:');
          console.log(stack);
          
          // Also try console.trace
          console.trace('H2 velocity setter called from:');
        }
        originalH2VxDesc.value = newValue;
      }
    });
    
    // Stop hooking after 3 seconds
    setTimeout(() => {
      hookingActive = false;
      Object.defineProperty(h1, 'vx', { value: h1.vx, writable: true });
      Object.defineProperty(h2, 'vx', { value: h2.vx, writable: true });
      
      console.log('✅ Targeted tracking complete:');
      console.log('Final H1:', h1.vx.toFixed(3), h1.vy.toFixed(3));
      console.log('Final H2:', h2.vx.toFixed(3), h2.vy.toFixed(3));
      
      const h1Changed = Math.abs(h1.vx - 2) > 0.1;
      const h2Changed = Math.abs(h2.vx - (-2)) > 0.1;
      
      if (h1Changed || h2Changed) {
        console.log('❌ VELOCITIES CHANGED! Check stack traces above.');
      } else {
        console.log('✅ Velocities preserved correctly!');
      }
    }, 3000);
  };
  
  // console.log('[Physics] TARGETED: trackCollisionVelocityChanges()');
} catch {}

// Keep start line and gate aligned with the waiting room dimensions
function alignGateToWaitingRoom(){
  try{
    const rm = mapDef.waitingRoom;
    if (!rm) return;
    // 10px gap after room for startLine, then 12px to gateBar
    mapDef.startLine.x = rm.x + rm.w + 10;
    mapDef.startLine.y = rm.y;
    mapDef.startLine.h = rm.h;
    mapDef.gateBar.x = mapDef.startLine.x + 12;
    mapDef.gateBar.y = rm.y;
    mapDef.gateBar.h = rm.h;
  }catch{}
}
alignGateToWaitingRoom();

// Build sample Z-track only on demand
function loadSample(){
  const add = (x,y,w,h,r=14)=>mapDef.walls.push({x,y,w,h,r, angle:0});
  // Clear current shapes first
  ['walls','pipes','semis','arcs','brushes'].forEach(k=>{ if(!Array.isArray(mapDef[k])) mapDef[k]=[]; mapDef[k].length=0; });
  add(300,120,1080,28,14); // Top wall
  add(300,120,28,110,14);  // Left wall 1
  add(300,310,28,130,14); // Left wall 2
  add(300,440,1040,28,14); // Middle wall
  add(1312,440,28,280,14); // Right wall
  add(260,720,1080,28,14); // Bottom wall
  add(520,200,26,120,12);  // Inner wall 1
  add(760,200,26,120,12);  // Inner wall 2
  add(600,520,26,120,12);  // Inner wall 3
  add(1000,520,26,120,12); // Inner wall 4
  try{ invalidateStaticLayer(); }catch{}
  try{ drawMap(); }catch{}
  try{ toast('Đã tải bản mẫu map'); }catch{}
}
// Wire the button if present
(function(){
  const btn = document.getElementById('loadSample');
  if (btn) btn.addEventListener('click', loadSample);
})();

// ===== Editor UI =====
const editorBar = document.getElementById('editorBar');
let hud = document.getElementById('hud');
// Make UI elements globally accessible for other modules
window.editorBar = editorBar;
window.hud = hud;
if (editorBar) editorBar.style.display = "block";

// Restore saved width/size (legacy keys) with clamping to avoid tiny start
(function(){
  const MIN_W = 360, MIN_H = 260;
  const wStr = localStorage.getItem('editor_w');
  const hStr = localStorage.getItem('editor_h');
  const w = wStr ? parseInt(wStr, 10) : NaN;
  const h = hStr ? parseInt(hStr, 10) : NaN;
  if (!Number.isNaN(w) && w >= MIN_W) editorBar.style.width = w + 'px';
  if (!Number.isNaN(h) && h >= MIN_H) editorBar.style.height = h + 'px';
})();

// Toggle show/hide editor
let editorVisible = true;
function setEditorVisible(v){
  editorVisible = v;
  editorBar.style.display = v ? 'block' : 'none';
}
// Make globally accessible for other modules
window.setEditorVisible = setEditorVisible;

// Fullscreen button was removed.

document.addEventListener('fullscreenchange', (event) => {
  const isFullscreen = !!document.fullscreenElement;

  // Show/hide the editor panel
  setEditorVisible(!isFullscreen);

    // The toggle buttons were removed.
});

// Left edge manual resizer
(function(){
  const grip = document.getElementById('gripL');
  let dragging = false, startX=0, startW=0;
  const minW=340, maxW=820;
  grip.addEventListener('mousedown', (e)=>{
    dragging = true; startX = e.clientX; startW = editorBar.getBoundingClientRect().width;
    document.body.style.userSelect = 'none';
  });
  window.addEventListener('mousemove', (e)=>{
    if (!dragging) return;
    const dx = startX - e.clientX;
    const nw = Math.min(maxW, Math.max(minW, startW + dx));
    editorBar.style.width = nw + 'px';
  });
  window.addEventListener('mouseup', ()=>{
    if (!dragging) return; dragging=false; document.body.style.userSelect='';
    localStorage.setItem('editor_w', parseInt(editorBar.getBoundingClientRect().width));
    localStorage.setItem('editor_h', parseInt(editorBar.getBoundingClientRect().height));
  });
})();

// Corner custom resizers (no scroll/white area required)
(function(){
  const grips = [
    { el: document.getElementById('gripBR'), kind: 'br' },
    { el: document.getElementById('gripBL'), kind: 'bl' },
    { el: document.getElementById('gripTR'), kind: 'tr' },
    { el: document.getElementById('gripTL'), kind: 'tl' }];
  const MIN_W=360, MIN_H=260;
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  let dragging=false, sx=0, sy=0, sw=0, sh=0, kind='br', startTop=0, bottomEdge=0;
  grips.forEach(g=>{
    if (!g.el) return;
    g.el.addEventListener('mousedown', (e)=>{
      e.preventDefault();
      dragging=true; kind=g.kind; sx=e.clientX; sy=e.clientY;
      const r = editorBar.getBoundingClientRect(); sw=r.width; sh=r.height;
      // capture current top in px and the bottom edge to allow top resizing
      const cs = getComputedStyle(editorBar);
      startTop = parseInt(cs.top) || r.top;
      bottomEdge = startTop + sh;
      document.body.style.userSelect='none';
    });
  });
  window.addEventListener('mousemove', (e)=>{
    if (!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    const MAX_W = Math.max(MIN_W, Math.min(1200, window.innerWidth - 40));
    const MAX_H = Math.max(MIN_H, Math.min(Math.round(window.innerHeight*0.92), window.innerHeight - 40));
    let w = sw, h = sh;
    if (kind==='br') { w = clamp(sw + dx, MIN_W, MAX_W); h = clamp(sh + dy, MIN_H, MAX_H); }
    else if (kind==='bl') { w = clamp(sw - dx, MIN_W, MAX_W); h = clamp(sh + dy, MIN_H, MAX_H); }
    else if (kind==='tr') { w = clamp(sw + dx, MIN_W, MAX_W); h = clamp(sh - dy, MIN_H, MAX_H); }
    else if (kind==='tl') { w = clamp(sw - dx, MIN_W, MAX_W); h = clamp(sh - dy, MIN_H, MAX_H); }
    editorBar.style.width = Math.round(w) + 'px';
    editorBar.style.height = Math.round(h) + 'px';
    // If resizing from top, move the panel to keep bottom edge fixed
    if (kind==='tr' || kind==='tl'){
      const newTop = Math.max(14, bottomEdge - Math.round(h));
      editorBar.style.top = newTop + 'px';
    }
  });
  window.addEventListener('mouseup', ()=>{
    if (!dragging) return; dragging=false; document.body.style.userSelect='';
    try {
      const r = editorBar.getBoundingClientRect();
      localStorage.setItem('rightbarSize', JSON.stringify({ w: Math.round(r.width), h: Math.round(r.height) }));
    } catch {}
  });
})();

let tool = "select";
window.tool = tool; // Expose for UI handlers
const toolBtns = [...document.querySelectorAll('.tool')];
// Weather tool integration complete
toolBtns.forEach(btn => btn.addEventListener('click',()=>{
  toolBtns.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); 
  tool = btn.dataset.tool;
  window.tool = tool; // Keep window.tool in sync
  // Debug logging removed
  // Toggle contextual inspectors
  if (spinnerAngleControl) spinnerAngleControl.style.display = (tool==='spinner') ? 'flex' : 'none';
  showBumperInspector(tool==='bumper' || (selected && selected.type==='bumper'));
  
  // Auto-open weather context menu when weather tool is selected
  if (tool === 'weather') {
    setTimeout(() => {
      try {
        if (typeof openCtx === 'function') {
          const rect = btn.getBoundingClientRect();
          openCtx('weather', rect.right + 10, rect.top);
        }
      } catch (e) {
        // Weather can be accessed via right-click if auto-open fails
      }
    }, 100);
  }
}));

const CARROT = "#ff9800"; // Fix missing constant

// Controls
const gridEl = document.getElementById('grid');
const gridVal = document.getElementById('gridVal');
// Hide grid when game starts (user option)
const hideGridOnPlayEl = document.getElementById('hideGridOnPlay');
let hideGridOnPlay = false;
try { hideGridOnPlay = JSON.parse(localStorage.getItem('hideGridOnPlay')||'false'); } catch {}
if (hideGridOnPlayEl){
  hideGridOnPlayEl.checked = !!hideGridOnPlay;
  hideGridOnPlayEl.addEventListener('change', ()=>{
    hideGridOnPlay = !!hideGridOnPlayEl.checked;
    try { localStorage.setItem('hideGridOnPlay', JSON.stringify(hideGridOnPlay)); } catch {}
    try { invalidateStaticLayer(); drawMap(); } catch {}
  });
}
const horseRadiusEl = document.getElementById('horseRadius');
const horseRadiusVal = document.getElementById('horseRadiusVal');
const carrotRadiusEl = document.getElementById('carrotRadius');
const carrotRadiusVal = document.getElementById('carrotRadiusVal');
const radiusEl = document.getElementById('radius');
const radiusVal = document.getElementById('radiusVal');
const thickEl = document.getElementById('thick');
const thickVal = document.getElementById('thickVal');
const arcSpanEl = document.getElementById('arcSpan');
const arcSpanVal = document.getElementById('arcSpanVal');
const brushStepEl = document.getElementById('brushStep');
const brushStepVal = document.getElementById('brushStepVal');
const spawnJitterEl = document.getElementById('spawnJitter');
const spawnJitterVal = document.getElementById('spawnJitterVal');
const startBiasEl = document.getElementById('startBias');
const startBiasVal = document.getElementById('startBiasVal');
const spinnerAngleControl = document.getElementById('spinnerAngleControl');
const spinnerAngleEl = document.getElementById('spinnerAngle');
const spinnerAngleVal = document.getElementById('spinnerAngleVal');
const spinnerSpeedEl = document.getElementById('spinnerSpeed');
const spinnerSpeedVal = document.getElementById('spinnerSpeedVal');
const spinnerLengthEl = document.getElementById('spinnerLength');
const spinnerLengthVal = document.getElementById('spinnerLengthVal');
// Magnet settings controls
const magnetRangeEl = document.getElementById('magnetRange');
const magnetRangeVal = document.getElementById('magnetRangeVal');
const magnetDurationEl = document.getElementById('magnetDuration');
const magnetDurationVal = document.getElementById('magnetDurationVal');
const magnetAttractAllEl = document.getElementById('magnetAttractAll');
const magnetPowerEl = document.getElementById('magnetPower');
const magnetPowerVal = document.getElementById('magnetPowerVal');
// Bumper inspector controls
const bumperInspector = document.getElementById('bumperInspector');
const bumperRadiusEl = document.getElementById('bumperRadius');
const bumperRadiusVal = document.getElementById('bumperRadiusVal');
const bumperElasticityEl = document.getElementById('bumperElasticity');
const bumperElasticityVal = document.getElementById('bumperElasticityVal');
const bumperNoiseEl = document.getElementById('bumperNoise');
const bumperNoiseVal = document.getElementById('bumperNoiseVal');

// Fan inspector controls are queried on demand to avoid TDZ issues
const bumperColorEl = document.getElementById('bumperColor');

function showBumperInspector(show){ if (bumperInspector) bumperInspector.style.display = show ? 'block' : 'none'; }
function showFanInspector(show){ const el=document.getElementById('fanInspector'); if (el) el.style.display = show ? 'block' : 'none'; }

function syncBumperInspectorFrom(obj){
  if (!bumperInspector) return;
  const r = Math.max(6, Math.round(obj?.r ?? 22));
  const e = +(obj?.e ?? 1.15).toFixed(2);
  const n = +(obj?.noise ?? 0.15).toFixed(2);
  const c = obj?.color || '#7cf1ff';
  bumperRadiusEl.value = String(r); bumperRadiusVal.textContent = String(r);
  bumperElasticityEl.value = String(e); bumperElasticityVal.textContent = String(e);
  bumperNoiseEl.value = String(n); bumperNoiseVal.textContent = String(n);
  bumperColorEl.value = c;
}

// Update selected bumper live when inspector changes
for (const [el, valEl, prop, post] of [
  [bumperRadiusEl, bumperRadiusVal, 'r'],
  [bumperElasticityEl, bumperElasticityVal, 'e'],
  [bumperNoiseEl, bumperNoiseVal, 'noise']
]){
  if (el && valEl){
    el.addEventListener('input', ()=>{
      const v = prop==='r' ? Math.max(6, parseFloat(el.value)) : parseFloat(el.value);
      valEl.textContent = (prop==='r') ? String(Math.round(v)) : v.toFixed(2);
      if (selected && selected.type==='bumper'){
        selected[prop] = v;
        try { invalidateStaticLayer(); drawMap(); } catch {}
      }
    });
  }
}
if (bumperColorEl){
  bumperColorEl.addEventListener('input', ()=>{
    if (selected && selected.type==='bumper'){
      selected.color = bumperColorEl.value;
      try { invalidateStaticLayer(); drawMap(); } catch {}
    }
  });
}
const carrotSpriteFile = document.getElementById('carrotSpriteFile');
const carrotSpriteScale = document.getElementById('carrotSpriteScale');
const carrotSpriteScaleVal = document.getElementById('carrotSpriteScaleVal');
const carrotSpriteOutline = document.getElementById('carrotSpriteOutline');
const carrotSpriteOutlineColor = document.getElementById('carrotSpriteOutlineColor');
const carrotSpriteOutlineWidth = document.getElementById('carrotSpriteOutlineWidth');
const carrotSpriteOutlineWidthVal = document.getElementById('carrotSpriteOutlineWidthVal');
// === Luck or Suck controls ===

// Waiting Room controls
const waitingRoomWEl = document.getElementById('waitingRoomW');
const waitingRoomHEl = document.getElementById('waitingRoomH');
const waitingRoomREl = document.getElementById('waitingRoomR');
const autoFitWaitingRoomEl = document.getElementById('autoFitWaitingRoom');

function refreshWaitingRoomInputs(){
  try{
    const rm = mapDef.waitingRoom;
    if (!rm) return;
    if (waitingRoomWEl) waitingRoomWEl.value = String(Math.round(rm.w));
    if (waitingRoomHEl) waitingRoomHEl.value = String(Math.round(rm.h));
    if (waitingRoomREl) waitingRoomREl.value = String(Math.round(rm.r||0));
  }catch{}
}
refreshWaitingRoomInputs();

function applyWaitingRoomSize(){
  try{
    const rm = mapDef.waitingRoom; if (!rm) return;
    const wMin=160, hMin=160, wMax=1200, hMax=1200;
    if (waitingRoomWEl){ const v = parseInt(waitingRoomWEl.value||'0',10); if (!isNaN(v)) rm.w = clamp(v, wMin, wMax); }
    if (waitingRoomHEl){ const v = parseInt(waitingRoomHEl.value||'0',10); if (!isNaN(v)) rm.h = clamp(v, hMin, hMax); }
    if (waitingRoomREl){ const v = parseInt(waitingRoomREl.value||'0',10); if (!isNaN(v)) rm.r = clamp(v, 0, 60); }
    if (typeof alignGateToWaitingRoom === 'function') alignGateToWaitingRoom();
    try{ invalidateStaticLayer(); drawMap(); }catch{}
  }catch{}
}

if (waitingRoomWEl) waitingRoomWEl.addEventListener('input', applyWaitingRoomSize);
if (waitingRoomHEl) waitingRoomHEl.addEventListener('input', applyWaitingRoomSize);
if (waitingRoomREl) waitingRoomREl.addEventListener('input', applyWaitingRoomSize);

// ===== Angle helpers and bindings =====
function syncAngleUI(rad){
  if (!spinnerAngleControl) return;
  const deg = Math.round((rad||0) * 180 / Math.PI) % 360;
  if (spinnerAngleEl) spinnerAngleEl.value = String(deg);
  if (spinnerAngleVal) spinnerAngleVal.textContent = deg + '°';
}

// Bind the angle slider to the currently selected rotatable object
if (spinnerAngleEl) spinnerAngleEl.addEventListener('input', (e)=>{
  if (!selected) return;
  const deg = parseInt(spinnerAngleEl.value||'0', 10);
  const rad = (deg % 360) * Math.PI/180;
  if (spinnerAngleVal) spinnerAngleVal.textContent = deg + '°';
  try {
    if (selected.type === 'spinner') {
      selected.angle = rad;
    } else if (selected.type === 'belt') {
      selected.angle = rad;
    } else if (selected.type === 'semi') {
      selected.angle = rad;
    } else if (selected.type === 'arc') {
      selected.angle = rad;
    } else if (selected.type === 'wall') {
      selected.angle = rad;
    } else if (selected.type === 'pipe') {
      // Rotate pipe endpoints around its center, preserving length
      const cx = (selected.x1 + selected.x2)/2, cy = (selected.y1 + selected.y2)/2;
      const len = Math.hypot(selected.x2-selected.x1, selected.y2-selected.y1)/2;
      selected.x1 = snapVal(cx - Math.cos(rad)*len); selected.y1 = snapVal(cy - Math.sin(rad)*len);
      selected.x2 = snapVal(cx + Math.cos(rad)*len); selected.y2 = snapVal(cy + Math.sin(rad)*len);
    }
  } finally {
    try { invalidateStaticLayer(); drawMap(); } catch {}
  }
});

// Keyboard rotation: Q/E with Shift for fine steps (editor mode only)
function rotateSelectedBy(delta){
  if (!selected) return;
  if (selected.type === 'spinner' || selected.type === 'belt' || selected.type === 'semi' || selected.type === 'arc'){
    const cur = selected.angle || 0;
    selected.angle = cur + delta;
    syncAngleUI(selected.angle);
  } else if (selected.type === 'wall'){
    const cur = selected.angle || 0;
    selected.angle = cur + delta;
    syncAngleUI(selected.angle);
  } else if (selected.type === 'pipe'){
    const idx = getSelectedIndex(selected);
    const p = mapDef.pipes[idx];
    if (p){
      const cx = (p.x1 + p.x2)/2, cy = (p.y1 + p.y2)/2;
      const curAng = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
      const newAng = curAng + delta;
      const len = Math.hypot(p.x2-p.x1, p.y2-p.y1)/2;
      p.x1 = snapVal(cx - Math.cos(newAng)*len); p.y1 = snapVal(cy - Math.sin(newAng)*len);
      p.x2 = snapVal(cx + Math.cos(newAng)*len); p.y2 = snapVal(cy + Math.sin(newAng)*len);
      syncAngleUI(newAng);
    }
  }
  try { invalidateStaticLayer(); drawMap(); } catch {}
}

window.addEventListener('keydown', (e)=>{
  if (mode !== 'editor') return;
  if (!selected && selectedObjects.length === 0) return;
  // Ignore typing into inputs/textareas/selects
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  
  // Delete selected objects (multi or single)
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    if (selectedObjects.length > 0) {
      deleteMultipleObjects();
    } else {
      deleteSelectedObject();
    }
    return;
  }
  
  // Select All (Ctrl+A)
  if (e.ctrlKey && e.key === 'a') {
    e.preventDefault();
    selectAllObjects();
    return;
  }
  
  const step = (e.shiftKey ? 1 : 5) * Math.PI/180;
  if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); rotateSelectedBy(-step); }
  else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); rotateSelectedBy(step); }
});

// Delete multiple selected objects
function deleteMultipleObjects() {
  if (selectedObjects.length === 0) return;
  
  try { pushHistory('delete_multiple'); } catch {}
  
  let deleteCount = 0;
  
  // Group objects by type for efficient deletion
  const byType = {};
  for (const obj of selectedObjects) {
    if (!obj || !obj.type) continue;
    if (!byType[obj.type]) byType[obj.type] = [];
    byType[obj.type].push(obj);
  }
  
  // Delete from each array
  for (const type in byType) {
    const objects = byType[type];
    const arrayName = getArrayNameForType(type);
    const array = mapDef[arrayName];
    
    if (Array.isArray(array)) {
      // Delete in reverse order to avoid index shifting issues
      for (let i = array.length - 1; i >= 0; i--) {
        if (objects.includes(array[i])) {
          array.splice(i, 1);
          deleteCount++;
        }
      }
    }
  }
  
  // Clear selection
  selectedObjects = [];
  selected = null;
  
  console.log(`Deleted ${deleteCount} objects`);
  try { invalidateStaticLayer(); drawMap(); } catch {}
}

// Get array name for object type
function getArrayNameForType(type) {
  const typeMap = {
    'wall': 'walls',
    'pipe': 'pipes',
    'semi': 'semis',
    'arc': 'arcs',
    'brush': 'brushes',
    'belt': 'belts',
    'spinner': 'spinners',
    'bumper': 'bumpers',
    'fan': 'fans',
    'boost': 'boosts',
    'turbo': 'turbos',
    'ghost': 'ghosts',
    'trap': 'traps',
    'ram': 'rams',
    'mud': 'mudPatches',
    'shield': 'shields',
    'poison': 'poisons',
    'lightning': 'lightnings',
    'tornado': 'tornados',
    'volcano': 'volcanos',
    'teleport': 'teleports',
    'magnet': 'magnets',
    'timefreeze': 'timeFreezes',
    'warpzone': 'warpzones',
    'quantumdash': 'quantumdashs',
    'nebula': 'nebulas',
    'yellowheart': 'yellowhearts',
    'fireaura': 'fireaura',
    'firetrap': 'firetrap',
    'magnetpull': 'magnetpulls',
    'magnetpush': 'magnetpushs',
    'rotbarrier': 'rotatingBarriers',
    'healingzone': 'healingzones',
    'icefreezer': 'icefreezers'
  };
  return typeMap[type] || (type + 's');
}

// Select all objects in the map
function selectAllObjects() {
  selectedObjects = [];
  
  // Add all objects
  const addAll = (array, typeName) => {
    if (!Array.isArray(array)) return;
    for (const obj of array) {
      obj.type = typeName;
      selectedObjects.push(obj);
    }
  };
  
  addAll(mapDef.walls, 'wall');
  addAll(mapDef.pipes, 'pipe');
  addAll(mapDef.semis, 'semi');
  addAll(mapDef.arcs, 'arc');
  addAll(mapDef.brushes, 'brush');
  addAll(mapDef.belts, 'belt');
  addAll(mapDef.spinners, 'spinner');
  addAll(mapDef.bumpers, 'bumper');
  addAll(mapDef.fans, 'fan');
  addAll(mapDef.boosts, 'boost');
  addAll(mapDef.turbos, 'turbo');
  addAll(mapDef.ghosts, 'ghost');
  addAll(mapDef.traps, 'trap');
  addAll(mapDef.rams, 'ram');
  addAll(mapDef.mudPatches, 'mud');
  addAll(mapDef.shields, 'shield');
  addAll(mapDef.poisons, 'poison');
  addAll(mapDef.lightnings, 'lightning');
  addAll(mapDef.tornados, 'tornado');
  addAll(mapDef.volcanos, 'volcano');
  addAll(mapDef.teleports, 'teleport');
  addAll(mapDef.magnets, 'magnet');
  addAll(mapDef.timeFreezes, 'timefreeze');
  addAll(mapDef.warpzones, 'warpzone');
  addAll(mapDef.quantumdashs, 'quantumdash');
  addAll(mapDef.nebulas, 'nebula');
  addAll(mapDef.yellowhearts, 'yellowheart');
  addAll(mapDef.fireaura, 'fireaura');
  addAll(mapDef.firetrap, 'firetrap');
  addAll(mapDef.magnetpulls, 'magnetpull');
  addAll(mapDef.magnetpushs, 'magnetpush');
  addAll(mapDef.rotatingBarriers, 'rotbarrier');
  addAll(mapDef.healingzones, 'healingzone');
  addAll(mapDef.icefreezers, 'icefreezer');
  
  if (selectedObjects.length > 0) {
    selected = selectedObjects[0];
  }
  
  console.log(`Selected all ${selectedObjects.length} objects`);
  try { drawMap(); } catch {}
}

// Comprehensive delete function for all object types
function deleteSelectedObject() {
  if (!selected || !selected.type) return;
  
  try { pushHistory('delete_' + selected.type); } catch {}
  
  let deleted = false;
  const type = selected.type;
  
  // Handle different object types
  if (type === 'spinner') {
    const idx = mapDef.spinners.indexOf(selected);
    if (idx !== -1) { mapDef.spinners.splice(idx, 1); deleted = true; }
  } else if (type === 'bumper') {
    const idx = mapDef.bumpers.indexOf(selected);
    if (idx !== -1) { mapDef.bumpers.splice(idx, 1); deleted = true; }
  } else if (type === 'belt') {
    const idx = mapDef.belts.indexOf(selected);
    if (idx !== -1) { mapDef.belts.splice(idx, 1); deleted = true; }
  } else if (type === 'wall') {
    const idx = mapDef.walls.indexOf(selected);
    if (idx !== -1) { mapDef.walls.splice(idx, 1); deleted = true; }
  } else if (type === 'pipe') {
    const idx = mapDef.pipes.indexOf(selected);
    if (idx !== -1) { mapDef.pipes.splice(idx, 1); deleted = true; }
  } else if (type === 'semi') {
    const idx = mapDef.semis.indexOf(selected);
    if (idx !== -1) { mapDef.semis.splice(idx, 1); deleted = true; }
  } else if (type === 'arc') {
    const idx = mapDef.arcs.indexOf(selected);
    if (idx !== -1) { mapDef.arcs.splice(idx, 1); deleted = true; }
  } else if (type === 'brush') {
    const idx = mapDef.brushes.indexOf(selected);
    if (idx !== -1) { mapDef.brushes.splice(idx, 1); deleted = true; }
  } else if (type === 'fan') {
    const idx = mapDef.fans.indexOf(selected);
    if (idx !== -1) { mapDef.fans.splice(idx, 1); deleted = true; }
  } else if (type === 'boost') {
    const idx = mapDef.boosts.indexOf(selected);
    if (idx !== -1) { mapDef.boosts.splice(idx, 1); deleted = true; }
  } else if (type === 'turbo') {
    const idx = mapDef.turbos.indexOf(selected);
    if (idx !== -1) { mapDef.turbos.splice(idx, 1); deleted = true; }
  } else if (type === 'ghost') {
    const idx = mapDef.ghosts.indexOf(selected);
    if (idx !== -1) { mapDef.ghosts.splice(idx, 1); deleted = true; }
  } else if (type === 'trap') {
    const idx = mapDef.traps.indexOf(selected);
    if (idx !== -1) { mapDef.traps.splice(idx, 1); deleted = true; }
  } else if (type === 'ram') {
    const idx = mapDef.rams.indexOf(selected);
    if (idx !== -1) { mapDef.rams.splice(idx, 1); deleted = true; }
  } else if (type === 'shield') {
    const idx = mapDef.shields.indexOf(selected);
    if (idx !== -1) { mapDef.shields.splice(idx, 1); deleted = true; }
  } else if (type === 'poison') {
    const idx = mapDef.poisons.indexOf(selected);
    if (idx !== -1) { mapDef.poisons.splice(idx, 1); deleted = true; }
  } else if (type === 'lightning') {
    const idx = mapDef.lightnings.indexOf(selected);
    if (idx !== -1) { mapDef.lightnings.splice(idx, 1); deleted = true; }
  } else if (type === 'tornado') {
    const idx = mapDef.tornados.indexOf(selected);
    if (idx !== -1) { mapDef.tornados.splice(idx, 1); deleted = true; }
  } else if (type === 'volcano') {
    const idx = mapDef.volcanos.indexOf(selected);
    if (idx !== -1) { mapDef.volcanos.splice(idx, 1); deleted = true; }
  } else if (type === 'teleport') {
    const idx = mapDef.teleports.indexOf(selected);
    if (idx !== -1) { mapDef.teleports.splice(idx, 1); deleted = true; }
  } else if (type === 'magnet') {
    const idx = mapDef.magnets.indexOf(selected);
    if (idx !== -1) { mapDef.magnets.splice(idx, 1); deleted = true; }
  } else if (type === 'timefreeze') {
    const idx = mapDef.timeFreezes.indexOf(selected);
    if (idx !== -1) { mapDef.timeFreezes.splice(idx, 1); deleted = true; }
  } else if (type === 'warpzone') {
    const idx = mapDef.warpzones.indexOf(selected);
    if (idx !== -1) { mapDef.warpzones.splice(idx, 1); deleted = true; }
  } else if (type === 'quantumdash') {
    const idx = mapDef.quantumdashs.indexOf(selected);
    if (idx !== -1) { mapDef.quantumdashs.splice(idx, 1); deleted = true; }
  } else if (type === 'nebula') {
    const idx = mapDef.nebulas.indexOf(selected);
    if (idx !== -1) { mapDef.nebulas.splice(idx, 1); deleted = true; }
  } else if (type === 'yellowheart') {
    const idx = mapDef.yellowhearts.indexOf(selected);
    if (idx !== -1) { mapDef.yellowhearts.splice(idx, 1); deleted = true; }
  } else if (type === 'fireaura') {
    const idx = mapDef.fireaura.indexOf(selected);
    if (idx !== -1) { mapDef.fireaura.splice(idx, 1); deleted = true; }
  } else if (type === 'firetrap') {
    const idx = mapDef.firetrap.indexOf(selected);
    if (idx !== -1) { mapDef.firetrap.splice(idx, 1); deleted = true; }
  } else if (type === 'magnetpush') {
    const idx = mapDef.magnetpushs.indexOf(selected);
    if (idx !== -1) { mapDef.magnetpushs.splice(idx, 1); deleted = true; }
  } else if (type === 'magnetpull') {
    const idx = mapDef.magnetpulls.indexOf(selected);
    if (idx !== -1) { mapDef.magnetpulls.splice(idx, 1); deleted = true; }
  } else if (type === 'mud') {
    const idx = mapDef.mudPatches.indexOf(selected);
    if (idx !== -1) { mapDef.mudPatches.splice(idx, 1); deleted = true; }
  }
  
  if (deleted) {
    selected = null; // Clear selection
    try { invalidateStaticLayer(); drawMap(); } catch {}
  }
}

function getSelectedIndex(sel){
  if (!sel || !sel.type) return -1;
  const arr = mapDef[sel.type + 's'];
  if (Array.isArray(arr)) return arr.indexOf(sel);
  return -1;
}

function nearFireaura(mx,my){
  for (let i=0; i<(mapDef.fireaura||[]).length; i++){
    const item = mapDef.fireaura[i];
    const radius = item.r || 50;
    if (Math.hypot(mx-item.x, my-item.y) < radius) return i;
  }
  return -1;
}

function nearHealingzone(mx,my){
  for (let i=0; i<(mapDef.healingzones||[]).length; i++){
    const item = mapDef.healingzones[i];
    const radius = item.r || 40;
    if (Math.hypot(mx-item.x, my-item.y) < radius) return i;
  }
  return -1;
}

function nearFiretrap(mx,my){
  for (let i=0; i<(mapDef.firetrap||[]).length; i++){
    const item = mapDef.firetrap[i];
    const radius = item.r || 50;
    if (Math.hypot(mx-item.x, my-item.y) < radius) return i;
  }
  return -1;
}

function nearNebula(mx,my){
  for (let i=0; i<(mapDef.nebulas||[]).length; i++){
    const item = mapDef.nebulas[i];
    const radius = item.r || 16;
    if (Math.hypot(mx-item.x, my-item.y) < radius) return i;
  }
  return -1;
}

function nearBumper(mx,my){
  for (let i=0; i<(mapDef.bumpers||[]).length; i++){
    const b = mapDef.bumpers[i];
    const r = Math.max(6, b.r || 22);
    if (Math.hypot(mx-b.x, my-b.y) < r) return i;
  }
  return -1;
}

// Fan hit-test: within radius from center
function nearFan(mx, my){
  const arr = mapDef.fans || [];
  for (let i = 0; i < arr.length; i++){
    const f = arr[i];
    const r = Math.max(10, f.r || 120);
    if (Math.hypot(mx - f.x, my - f.y) <= r) return i;
  }
  return -1;
}

// Hit-test the fan rotation handle (a small dot along the angle direction)
function pickFanRotateHandle(mx, my){
  const arr = mapDef.fans || [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const f = arr[i];
    const r = Math.max(10, f.r || 120);
    const ang = f.angle || 0;
    // handle at 60% of radius along angle
    const rr = r * 0.6;
    const hx = f.x + Math.cos(ang) * rr;
    const hy = f.y + Math.sin(ang) * rr;
    if (Math.hypot(mx - hx, my - hy) <= 18) return i;
  }
  return -1;
}

if (spinnerAngleEl){
  spinnerAngleEl.addEventListener('input', () => {
    if (!selected) return;
    const deg = parseInt(spinnerAngleEl.value, 10) || 0;
    const rad = deg * Math.PI / 180;
    if (['spinner','belt','semi','arc','wall'].includes(selected.type||'')){
      selected.angle = rad;
    } else if (selected.type === 'pipe'){
      const idx = getSelectedIndex(selected);
      const p = mapDef.pipes[idx];
      if (!p) return;
      const cx = (p.x1 + p.x2)/2, cy = (p.y1 + p.y2)/2;
      const len = Math.hypot(p.x2-p.x1, p.y2-p.y1)/2;
      p.x1 = cx - Math.cos(rad)*len; p.y1 = cy - Math.sin(rad)*len;
      p.x2 = cx + Math.cos(rad)*len; p.y2 = cy + Math.sin(rad)*len;
    }
    try { invalidateStaticLayer(); drawMap(); } catch {}
    if (spinnerAngleVal) spinnerAngleVal.textContent = deg + '°';
  });
}
const luckEnabledEl = document.getElementById('luckEnabled');
const luckIntervalEl = document.getElementById('luckInterval');
let luckEnabled = false;
let luckIntervalSec = 12;
let nextLuckTs = 0;
// Sync luck globals with window using getters/setters for race.js compatibility
Object.defineProperty(window, 'luckEnabled', {
  get() { return luckEnabled; },
  set(v) { luckEnabled = v; }
});
Object.defineProperty(window, 'nextLuckTs', {
  get() { return nextLuckTs; },
  set(v) { nextLuckTs = v; }
});

if (luckEnabledEl) {
  luckEnabledEl.addEventListener('change', () => {
    luckEnabled = !!luckEnabledEl.checked;
    // reset timer when toggled on
    if (luckEnabled) { nextLuckTs = 0; try { toast('🍀 Luck or Suck: ON'); } catch{} }
    else { try { toast('🍀 Luck or Suck: OFF'); } catch{} }
  });
}
if (luckIntervalEl) {
  luckIntervalEl.addEventListener('input', () => {
    const v = parseInt(luckIntervalEl.value, 10);
    if (!isNaN(v)) luckIntervalSec = Math.max(3, Math.min(60, v));
  });
}

// Luck item spawner (moved from horse rendering loop)
function spawnRandomLuckItem(){
  try {
    // Use live* arrays from game state
    const choices = ['boost','ghost','trap','ram','turbo','shield','teleport','magnet','timefreeze'];
    const type = choices[Math.floor(Math.random()*choices.length)];
    const config = POWERUP_TYPES[type];
    const r = config ? config.r : 16;
    // Spawn within canvas bounds, avoiding edges
    const x = Math.max(r+10, Math.min(cv.width - r - 10, Math.random()*cv.width));
    const y = Math.max(r+10, Math.min(cv.height - r - 10, Math.random()*cv.height));
    let obj = createPowerupObject(type, x, y) || { x, y, r };
    addPowerupToLive(type, obj);
    
    const powerupName = getPowerupName(type);
    if (typeof logEvent === 'function') logEvent(`Luck drop: tạo ${powerupName} tại (${Math.round(x)}, ${Math.round(y)})`);
    else if (typeof toast === 'function') toast(`Luck drop: ${powerupName}!`);
    try { createExplosion(x, y, '#00FF7F', 16); } catch {}
  } catch (e) { /* ignore */ }
}

gridEl.addEventListener('input', ()=> { gridVal.textContent = gridEl.value+"px"; invalidateGrid(); invalidateStaticLayer(); drawMap(); });
radiusEl.addEventListener('input', ()=> radiusVal.textContent = radiusEl.value);
thickEl.addEventListener('input', ()=> thickVal.textContent = thickEl.value+"px");
arcSpanEl.addEventListener('input', ()=> arcSpanVal.textContent=arcSpanEl.value+"°");
brushStepEl.addEventListener('input', ()=> brushStepVal.textContent=brushStepEl.value+"px");
horseRadiusEl.addEventListener('input', (e)=>{ const r = Validators.integer(e.target.value, 8, 40, 12); horseRadiusVal.textContent=r; mapDef.horseRadius=r; });


carrotRadiusEl.addEventListener('input', (e)=>{ 
  const r = Validators.integer(e.target.value, 8, 40, 16); 
  carrotRadiusVal.textContent=r; 
  mapDef.carrotRadius=r; 
  if(mapDef.carrots) { for(const c of mapDef.carrots) { c.r = r; } }
  invalidateStaticLayer();
  drawMap();
});

spawnJitterEl.addEventListener('input', ()=> spawnJitterVal.textContent = spawnJitterEl.value+"px");
startBiasEl.addEventListener('input', ()=> startBiasVal.textContent = startBiasEl.value+"ms");
spinnerSpeedEl.addEventListener('input', () => {
  const v = Validators.number(spinnerSpeedEl.value, -10, 10, 1.0);
  spinnerSpeedVal.textContent = v.toFixed(1);
  // If a spinner is selected in the editor, update its speed
  if (selected && selected.type === 'spinner') {
    selected.speed = v;
  }
});

// Mud slowdown setting
const mudSlowdownEl = document.getElementById('mudSlowdown');
const mudSlowdownVal = document.getElementById('mudSlowdownVal');
if (mudSlowdownEl && mudSlowdownVal) {
  // Load saved value
  try {
    const saved = localStorage.getItem('mudSlowdown');
    if (saved) {
      mudSlowdownEl.value = saved;
      const percentage = Math.round((1 - parseFloat(saved)) * 100);
      mudSlowdownVal.textContent = percentage + '%';
    }
  } catch {}
  
  mudSlowdownEl.addEventListener('input', () => {
    const value = Validators.number(mudSlowdownEl.value, 0, 1, 0.5);
    const percentage = Math.round((1 - value) * 100);
    mudSlowdownVal.textContent = percentage + '%';
    try {
      localStorage.setItem('mudSlowdown', mudSlowdownEl.value);
    } catch {}
  });
}

// Spinner length control: update selected spinner width and label
if (spinnerLengthEl && spinnerLengthVal) {
  spinnerLengthEl.addEventListener('input', () => {
    const w = parseInt(spinnerLengthEl.value, 10) || 80;
    spinnerLengthVal.textContent = `${w}px`;
    if (selected && selected.type === 'spinner') {
      selected.w = w;
    }
  });
}

// Power-up settings initialization - MOVED TO: scripts/editor/powerup-settings-init.js
// Access via: window.PowerupSettingsInit module

// ===== Context Settings (Global Quick-Access) for multiple power-ups =====
(function setupContextInspector(){
  const tools = {
    healingzone: document.querySelector('.tool[data-tool="healingzone"]'),
    healingpatch: document.querySelector('.tool[data-tool="healingpatch"]'),
    fireaura: document.querySelector('.tool[data-tool="fireaura"]'),
    weather: document.querySelector('.tool[data-tool="weather"]'),
    firetrap: document.querySelector('.tool[data-tool="firetrap"]'),
    trap: document.querySelector('.tool[data-tool="trap"]'),
    magnet: document.querySelector('.tool[data-tool="magnet"]'),
    turbo: document.querySelector('.tool[data-tool="turbo"]'),
    shield: document.querySelector('.tool[data-tool="shield"]'),
    timefreeze: document.querySelector('.tool[data-tool="timefreeze"]'),
    teleport: document.querySelector('.tool[data-tool="teleport"]'),
    boost: document.querySelector('.tool[data-tool="boost"]'),
    ghost: document.querySelector('.tool[data-tool="ghost"]'),
    poison: document.querySelector('.tool[data-tool="poison"]'),
    lightning: document.querySelector('.tool[data-tool="lightning"]'),
    tornado: document.querySelector('.tool[data-tool="tornado"]'),
    volcano: document.querySelector('.tool[data-tool="volcano"]'),
    wall: document.querySelector('.tool[data-tool="wall"]'),
    brush: document.querySelector('.tool[data-tool="brush"]'),
    arc: document.querySelector('.tool[data-tool="arc"]'),
    bumper: document.querySelector('.tool[data-tool="bumper"]'),
    spinner: document.querySelector('.tool[data-tool="spinner"]')
    , rotbarrier: document.querySelector('.tool[data-tool="rotbarrier"]')
    , magnetpull: document.querySelector('.tool[data-tool="magnetpull"]')
    , magnetpush: document.querySelector('.tool[data-tool="magnetpush"]')
    , diag: document.querySelector('.tool[data-tool="diag"]')
    , semi: document.querySelector('.tool[data-tool="semi"]')
    , ebrush: document.querySelector('.tool[data-tool="ebrush"]')
    , spawn: document.querySelector('.tool[data-tool="spawn"]')
    , start: document.querySelector('.tool[data-tool="start"]')
    , carrotA: document.querySelector('.tool[data-tool="carrotA"]')
    , carrotB: document.querySelector('.tool[data-tool="carrotB"]')
    , breakwall: document.querySelector('.tool[data-tool="breakwall"]')
    , softwall: document.querySelector('.tool[data-tool="softwall"]')
    , warpzone: document.querySelector('.tool[data-tool="warpzone"]')
    , quantumdash: document.querySelector('.tool[data-tool="quantumdash"]')
  };
  const ctx = document.getElementById('contextInspector');
  const ctxBody = document.getElementById('contextBody');
  const ctxApply = document.getElementById('contextApply');
  const ctxClose = document.getElementById('contextClose');
  if (!ctx || !ctxBody || !ctxApply || !ctxClose) return;

  try { if (ctx.parentElement !== document.body) { document.body.appendChild(ctx); } } catch {}
  ctx.style.position = 'fixed';

  let currentType = null;

  function buildBody(type){
    currentType = type;
    if (type === 'magnet'){
      const cfg = mapDef.magnetSettings || { range: 100, durationMs: 3000, power: 200, attractAll: false, consumable: true };
      ctxBody.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; font-weight:600; margin:4px 0 8px 0;">🧲 Magnet (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Range</label>
          <input id="ctxMagnetRange" type="range" min="50" max="400" step="10" value="${cfg.range||100}" />
          <span id="ctxMagnetRangeVal">${cfg.range||100}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxMagnetDuration" type="range" min="1000" max="10000" step="500" value="${cfg.durationMs||3000}" />
          <span id="ctxMagnetDurationVal">${cfg.durationMs||3000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Power</label>
          <input id="ctxMagnetPower" type="range" min="100" max="1000" step="10" value="${cfg.power||200}" />
          <span id="ctxMagnetPowerVal">${cfg.power||200}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Attract All</label>
          <input id="ctxMagnetAttractAll" type="checkbox" ${cfg.attractAll ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxMagnetConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'turbo'){
      const cfg = mapDef.turboSettings || { durationMs: 5000, multiplier: 2.2, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🚀 Turbo (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxTurboDuration" type="range" min="500" max="15000" step="500" value="${cfg.durationMs||5000}" />
          <span id="ctxTurboDurationVal">${cfg.durationMs||5000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Multiplier</label>
          <input id="ctxTurboMultiplier" type="range" min="1.1" max="5.0" step="0.1" value="${cfg.multiplier||2.2}" />
          <span id="ctxTurboMultiplierVal">${(cfg.multiplier||2.2).toFixed(1)}x</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxTurboConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'shield'){
      const cfg = mapDef.shieldSettings || { durationMs: 10000, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🛡️ Shield (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxShieldDuration" type="range" min="500" max="60000" step="500" value="${cfg.durationMs||10000}" />
          <span id="ctxShieldDurationVal">${cfg.durationMs||10000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxShieldConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'timefreeze'){
      const cfg = mapDef.timeFreezeSettings || { durationMs: 5000, affectSelf: false, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">❄️ Time Freeze (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxFreezeDuration" type="range" min="1000" max="15000" step="500" value="${cfg.durationMs||5000}" />
          <span id="ctxFreezeDurationVal">${cfg.durationMs||5000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Affect Self</label>
          <input id="ctxFreezeAffectSelf" type="checkbox" ${cfg.affectSelf ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxFreezeConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'icefreezer'){
      const cfg = mapDef.icefreezerSettings || { durationMs: 2000, freezeDurationMs: 2000, slowMultiplier: 0.7, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🧊 Ice Freezer (Self-Freeze)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:100px;">Freeze Duration</label>
          <input id="ctxIceFreezeDuration" type="range" min="500" max="5000" step="100" value="${cfg.freezeDurationMs||2000}" />
          <span id="ctxIceFreezeDurationVal">${cfg.freezeDurationMs||2000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:100px;">Slow Multiplier</label>
          <input id="ctxIceSlowMult" type="range" min="0.1" max="1.0" step="0.05" value="${cfg.slowMultiplier||0.7}" />
          <span id="ctxIceSlowMultVal">${((cfg.slowMultiplier||0.7)*100).toFixed(0)}%</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:100px;">Consumable</label>
          <input id="ctxIceFreezerConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>
        <div style="margin-top:8px; padding:6px; background:rgba(179,229,252,0.15); border-radius:4px; font-size:11px; color:#81d4fa;">
          ℹ️ Freezes the horse that collects it completely for the duration
        </div>`;
      
      // Real-time slider updates for Ice Freezer
      setTimeout(() => {
        const durationSlider = ctxBody.querySelector('#ctxIceFreezeDuration');
        const durationLabel = ctxBody.querySelector('#ctxIceFreezeDurationVal');
        const slowSlider = ctxBody.querySelector('#ctxIceSlowMult');
        const slowLabel = ctxBody.querySelector('#ctxIceSlowMultVal');
        
        if (durationSlider && durationLabel) {
          durationSlider.addEventListener('input', () => {
            durationLabel.textContent = parseInt(durationSlider.value, 10) + ' ms';
          });
        }
        
        if (slowSlider && slowLabel) {
          slowSlider.addEventListener('input', () => {
            const val = parseFloat(slowSlider.value);
            slowLabel.textContent = (val * 100).toFixed(0) + '%';
          });
        }
      }, 10);

    } else if (type === 'teleport'){
      const cfg = mapDef.teleportSettings || { safeMargin: 20, minDistance: 0, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🌀 Teleport (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Safe Margin</label>
          <input id="ctxTpSafe" type="range" min="0" max="200" step="5" value="${cfg.safeMargin||20}" />
          <span id="ctxTpSafeVal">${cfg.safeMargin||20}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Min Distance</label>
          <input id="ctxTpMin" type="range" min="0" max="2000" step="50" value="${cfg.minDistance||0}" />
          <span id="ctxTpMinVal">${cfg.minDistance||0}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxTpConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'boost'){
      const cfg = mapDef.boostSettings || { stackBonus: 0.2, maxStacks: 10, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">⚡ Boost (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Stack Bonus</label>
          <input id="ctxBoostStackBonus" type="range" min="0.1" max="0.5" step="0.05" value="${cfg.stackBonus||0.2}" />
          <span id="ctxBoostStackBonusVal">${Math.round((cfg.stackBonus||0.2)*100)}%</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Max Stacks</label>
          <input id="ctxBoostMaxStacks" type="range" min="5" max="20" step="1" value="${cfg.maxStacks||10}" />
          <span id="ctxBoostMaxStacksVal">${cfg.maxStacks||10}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxBoostConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'nebula'){
      const cfg = mapDef.nebulaSettings || { speedMultiplier: 2.5, durationMs: 4000, damage: 20, radius: 16, particleEnabled: true, glowEnabled: true, intensity: 1, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🟣 Nebula (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Damage</label>
          <input id="ctxNebulaDamage" type="range" min="1" max="100" step="1" value="${cfg.damage||20}" />
          <span id="ctxNebulaDamageVal">${cfg.damage||20}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxNebulaDuration" type="range" min="500" max="15000" step="250" value="${cfg.durationMs||4000}" />
          <span id="ctxNebulaDurationVal">${cfg.durationMs||4000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Size</label>
          <input id="ctxNebulaRadius" type="range" min="8" max="48" step="2" value="${cfg.radius||16}" />
          <span id="ctxNebulaRadiusVal">${cfg.radius||16}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Particles</label>
          <input id="ctxNebulaParticles" type="checkbox" ${cfg.particleEnabled ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Glow</label>
          <input id="ctxNebulaGlow" type="checkbox" ${cfg.glowEnabled ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxNebulaConsumable" type="checkbox" ${cfg.consumable ? 'checked' : ''} />
          <span style="font-size:11px; color:#888; margin-left:8px;">✅ Disappears after use | ❌ Permanent obstacle</span>
        </div>`;
      
      // Add real-time slider updates for Nebula
      setTimeout(() => {
        const damageSlider = ctxBody.querySelector('#ctxNebulaDamage');
        const damageLabel = ctxBody.querySelector('#ctxNebulaDamageVal');
        if (damageSlider && damageLabel) {
          damageSlider.addEventListener('input', () => {
            damageLabel.textContent = parseInt(damageSlider.value);
          });
        }
        
        const durationSlider = ctxBody.querySelector('#ctxNebulaDuration');
        const durationLabel = ctxBody.querySelector('#ctxNebulaDurationVal');
        if (durationSlider && durationLabel) {
          durationSlider.addEventListener('input', () => {
            durationLabel.textContent = parseInt(durationSlider.value) + ' ms';
          });
        }
        
        const radiusSlider = ctxBody.querySelector('#ctxNebulaRadius');
        const radiusLabel = ctxBody.querySelector('#ctxNebulaRadiusVal');
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value) + 'px';
          });
        }
      }, 10);
    } else if (type === 'yellowheart'){
      const cfg = mapDef.yellowheartSettings || { damage: 25, duration: 4000, radius: 18, effectType: 'speed', consumable: true, stackable: true, maxStacks: 4 };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">💛 Yellow Heart (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Effect Type</label>
          <select id="ctxYellowheartEffectType" style="padding:2px 4px;">
            <option value="speed" ${cfg.effectType === 'speed' ? 'selected' : ''}>Speed Boost</option>
            <option value="damage" ${cfg.effectType === 'damage' ? 'selected' : ''}>Damage Boost</option>
            <option value="heal" ${cfg.effectType === 'heal' ? 'selected' : ''}>Healing</option>
          </select>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Power</label>
          <input id="ctxYellowheartDamage" type="range" min="5" max="100" step="5" value="${cfg.damage||25}" />
          <span id="ctxYellowheartDamageVal">${cfg.damage||25}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxYellowheartDuration" type="range" min="1000" max="10000" step="500" value="${cfg.duration||4000}" />
          <span id="ctxYellowheartDurationVal">${cfg.duration||4000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Size</label>
          <input id="ctxYellowheartRadius" type="range" min="8" max="32" step="2" value="${cfg.radius||18}" />
          <span id="ctxYellowheartRadiusVal">${cfg.radius||18}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Max Stacks</label>
          <input id="ctxYellowheartMaxStacks" type="range" min="1" max="10" step="1" value="${cfg.maxStacks||4}" />
          <span id="ctxYellowheartMaxStacksVal">${cfg.maxStacks||4}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Stackable</label>
          <input id="ctxYellowheartStackable" type="checkbox" ${cfg.stackable ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxYellowheartConsumable" type="checkbox" ${cfg.consumable ? 'checked' : ''} />
          <span style="font-size:11px; color:#888; margin-left:8px;">✅ Disappears after use | ❌ Permanent obstacle</span>
        </div>`;
      
      // Add real-time slider updates for Yellow Heart
      setTimeout(() => {
        const damageSlider = ctxBody.querySelector('#ctxYellowheartDamage');
        const damageLabel = ctxBody.querySelector('#ctxYellowheartDamageVal');
        if (damageSlider && damageLabel) {
          damageSlider.addEventListener('input', () => {
            damageLabel.textContent = parseInt(damageSlider.value);
          });
        }
        
        const durationSlider = ctxBody.querySelector('#ctxYellowheartDuration');
        const durationLabel = ctxBody.querySelector('#ctxYellowheartDurationVal');
        if (durationSlider && durationLabel) {
          durationSlider.addEventListener('input', () => {
            durationLabel.textContent = parseInt(durationSlider.value) + ' ms';
          });
        }
        
        const radiusSlider = ctxBody.querySelector('#ctxYellowheartRadius');
        const radiusLabel = ctxBody.querySelector('#ctxYellowheartRadiusVal');
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value) + 'px';
          });
        }
        
        const maxStacksSlider = ctxBody.querySelector('#ctxYellowheartMaxStacks');
        const maxStacksLabel = ctxBody.querySelector('#ctxYellowheartMaxStacksVal');
        if (maxStacksSlider && maxStacksLabel) {
          maxStacksSlider.addEventListener('input', () => {
            maxStacksLabel.textContent = parseInt(maxStacksSlider.value);
          });
        }
      }, 10);
    } else if (type === 'ghost'){
      const cfg = mapDef.ghostSettings || { durationMs: 4000, transparency: 0.3, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">👻 Ghost (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxGhostDuration" type="range" min="1000" max="15000" step="500" value="${cfg.durationMs||4000}" />
          <span id="ctxGhostDurationVal">${cfg.durationMs||4000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Transparency</label>
          <input id="ctxGhostTransparency" type="range" min="0.1" max="0.8" step="0.05" value="${cfg.transparency||0.3}" />
          <span id="ctxGhostTransparencyVal">${Math.round((1-(cfg.transparency||0.3))*100)}%</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxGhostConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'poison'){
      const cfg = mapDef.poisonSettings || { durationMs: 5000, chaosLevel: 0.7, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">☠️ Poison (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxPoisonDuration" type="range" min="1000" max="15000" step="500" value="${cfg.durationMs||5000}" />
          <span id="ctxPoisonDurationVal">${cfg.durationMs||5000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Chaos Level</label>
          <input id="ctxPoisonChaos" type="range" min="0.2" max="1.0" step="0.05" value="${cfg.chaosLevel||0.7}" />
          <span id="ctxPoisonChaosVal">${Math.round((cfg.chaosLevel||0.7)*100)}%</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxPoisonConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
      
      // Add real-time slider updates for boost
      setTimeout(() => {
        const stackBonusSlider = ctxBody.querySelector('#ctxBoostStackBonus');
        const stackBonusLabel = ctxBody.querySelector('#ctxBoostStackBonusVal');
        const maxStacksSlider = ctxBody.querySelector('#ctxBoostMaxStacks');
        const maxStacksLabel = ctxBody.querySelector('#ctxBoostMaxStacksVal');
        
        if (stackBonusSlider && stackBonusLabel) {
          stackBonusSlider.addEventListener('input', () => {
            const value = parseFloat(stackBonusSlider.value);
            stackBonusLabel.textContent = Math.round(value * 100) + '%';
          });
        }
        
        if (maxStacksSlider && maxStacksLabel) {
          maxStacksSlider.addEventListener('input', () => {
            const value = parseInt(maxStacksSlider.value, 10);
            maxStacksLabel.textContent = value;
          });
        }
      }, 10);
      
      // Add real-time slider updates for ghost
      setTimeout(() => {
        const durationSlider = ctxBody.querySelector('#ctxGhostDuration');
        const durationLabel = ctxBody.querySelector('#ctxGhostDurationVal');
        const transparencySlider = ctxBody.querySelector('#ctxGhostTransparency');
        const transparencyLabel = ctxBody.querySelector('#ctxGhostTransparencyVal');
        
        if (durationSlider && durationLabel) {
          durationSlider.addEventListener('input', () => {
            const value = parseInt(durationSlider.value, 10);
            durationLabel.textContent = value + ' ms';
          });
        }
        
        if (transparencySlider && transparencyLabel) {
          transparencySlider.addEventListener('input', () => {
            const value = parseFloat(transparencySlider.value);
            const percentage = Math.round((1 - value) * 100);
            transparencyLabel.textContent = percentage + '%';
          });
        }
      }, 10);
      
      // Add real-time slider updates for poison
      setTimeout(() => {
        const durationSlider = ctxBody.querySelector('#ctxPoisonDuration');
        const durationLabel = ctxBody.querySelector('#ctxPoisonDurationVal');
        const chaosSlider = ctxBody.querySelector('#ctxPoisonChaos');
        const chaosLabel = ctxBody.querySelector('#ctxPoisonChaosVal');
        
        if (durationSlider && durationLabel) {
          durationSlider.addEventListener('input', () => {
            const value = parseInt(durationSlider.value, 10);
            durationLabel.textContent = value + ' ms';
          });
        }
        
        if (chaosSlider && chaosLabel) {
          chaosSlider.addEventListener('input', () => {
            const value = parseFloat(chaosSlider.value);
            const percentage = Math.round(value * 100);
            chaosLabel.textContent = percentage + '%';
          });
        }
      }, 10);
    } else if (type === 'tornado'){
      // Initialize tornado settings from localStorage
      if (!mapDef.tornadoSettings) {
        mapDef.tornadoSettings = {
          vortexRadius: parseInt(localStorage.getItem('tornadoVortexRadius')) || 120,
          pullStrength: parseFloat(localStorage.getItem('tornadoPullStrength')) || 1.2,
          damage: parseInt(localStorage.getItem('tornadoDamage')) || 5,
          speedPenalty: parseFloat(localStorage.getItem('tornadoSpeedPenalty')) || 0.7,
          damageInterval: parseInt(localStorage.getItem('tornadoDamageInterval')) || 500
        };
      }
      const cfg = mapDef.tornadoSettings;
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🌪️ Tornado Vortex (Global)</div>
        
        <div style="font-weight:500; margin:8px 0 4px 0; color:#87CEEB;">Vortex Effects</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Radius</label>
          <input id="ctxTornadoRadius" type="range" min="60" max="200" step="10" value="${cfg.vortexRadius||120}" />
          <span id="ctxTornadoRadiusVal">${cfg.vortexRadius||120}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Pull Force</label>
          <input id="ctxTornadoPull" type="range" min="0.5" max="3.0" step="0.1" value="${cfg.pullStrength||1.2}" />
          <span id="ctxTornadoPullVal">${(cfg.pullStrength||1.2).toFixed(1)}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Speed Penalty</label>
          <input id="ctxTornadoSpeed" type="range" min="0.3" max="1.0" step="0.05" value="${cfg.speedPenalty||0.7}" />
          <span id="ctxTornadoSpeedVal">${Math.round((cfg.speedPenalty||0.7)*100)}%</span>
        </div>
        
        <div style="font-weight:500; margin:8px 0 4px 0; color:#FF6B35;">Eye Damage</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Damage</label>
          <input id="ctxTornadoDamage" type="range" min="1" max="20" step="1" value="${cfg.damage||5}" />
          <span id="ctxTornadoDamageVal">${cfg.damage||5} HP</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Interval</label>
          <input id="ctxTornadoInterval" type="range" min="200" max="1000" step="100" value="${cfg.damageInterval||500}" />
          <span id="ctxTornadoIntervalVal">${cfg.damageInterval||500} ms</span>
        </div>
        <!-- Consumable removed: Tornado is a permanent environment hazard -->`;
      
      // Add real-time slider updates for tornado
      setTimeout(() => {
        const radiusSlider = ctxBody.querySelector('#ctxTornadoRadius');
        const radiusLabel = ctxBody.querySelector('#ctxTornadoRadiusVal');
        const pullSlider = ctxBody.querySelector('#ctxTornadoPull');
        const pullLabel = ctxBody.querySelector('#ctxTornadoPullVal');
        const speedSlider = ctxBody.querySelector('#ctxTornadoSpeed');
        const speedLabel = ctxBody.querySelector('#ctxTornadoSpeedVal');
        const damageSlider = ctxBody.querySelector('#ctxTornadoDamage');
        const damageLabel = ctxBody.querySelector('#ctxTornadoDamageVal');
        const intervalSlider = ctxBody.querySelector('#ctxTornadoInterval');
        const intervalLabel = ctxBody.querySelector('#ctxTornadoIntervalVal');
        
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            const value = parseInt(radiusSlider.value, 10);
            radiusLabel.textContent = value + 'px';
          });
        }
        
        if (pullSlider && pullLabel) {
          pullSlider.addEventListener('input', () => {
            const value = parseFloat(pullSlider.value);
            pullLabel.textContent = value.toFixed(1);
          });
        }
        
        if (speedSlider && speedLabel) {
          speedSlider.addEventListener('input', () => {
            const value = parseFloat(speedSlider.value);
            speedLabel.textContent = Math.round(value * 100) + '%';
          });
        }
        
        if (damageSlider && damageLabel) {
          damageSlider.addEventListener('input', () => {
            const value = parseInt(damageSlider.value, 10);
            damageLabel.textContent = value + ' HP';
          });
        }
        
        if (intervalSlider && intervalLabel) {
          intervalSlider.addEventListener('input', () => {
            const value = parseInt(intervalSlider.value, 10);
            intervalLabel.textContent = value + ' ms';
          });
        }
      }, 10);
    } else if (type === 'volcano'){
      // Initialize volcano settings from localStorage
      if (!mapDef.volcanoSettings) {
        mapDef.volcanoSettings = {
          effectRadius: parseInt(localStorage.getItem('volcanoEffectRadius')) || 120,
          damage: parseInt(localStorage.getItem('volcanoDamage')) || 5,
          damageInterval: parseInt(localStorage.getItem('volcanoDamageInterval')) || 500,
          particleCount: parseInt(localStorage.getItem('volcanoParticleCount')) || 3,
          eruptionInterval: parseInt(localStorage.getItem('volcanoEruptionInterval')) || 1000,
          launchSpeed: parseFloat(localStorage.getItem('volcanoLaunchSpeed')) || 1.7,
          gravity: parseFloat(localStorage.getItem('volcanoGravity')) || 0.005
        };
      }
      const cfg = mapDef.volcanoSettings;
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🌋 Volcano (Global)</div>
        
        <div style="font-weight:500; margin:8px 0 4px 0; color:#FF6B35;">Area Effects</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Radius</label>
          <input id="ctxVolcanoRadius" type="range" min="60" max="200" step="10" value="${cfg.effectRadius||120}" />
          <span id="ctxVolcanoRadiusVal">${cfg.effectRadius||120}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Damage</label>
          <input id="ctxVolcanoDamage" type="range" min="1" max="30" step="1" value="${cfg.damage||5}" />
          <span id="ctxVolcanoDamageVal">${cfg.damage||5} HP</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Interval</label>
          <input id="ctxVolcanoInterval" type="range" min="1000" max="5000" step="500" value="${cfg.damageInterval||500}" />
          <span id="ctxVolcanoIntervalVal">${cfg.damageInterval||500} ms</span>
        </div>
        
        <div style="font-weight:500; margin:8px 0 4px 0; color:#FF4500;">🔥 Particle System</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Particles</label>
          <input id="ctxVolcanoParticles" type="range" min="1" max="8" step="1" value="${cfg.particleCount||3}" />
          <span id="ctxVolcanoParticlesVal">${cfg.particleCount||3} per eruption</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Eruption</label>
          <input id="ctxVolcanoEruption" type="range" min="500" max="3000" step="250" value="${cfg.eruptionInterval||1000}" />
          <span id="ctxVolcanoEruptionVal">${cfg.eruptionInterval||1000} ms</span>
        </div>
        
        <div style="font-weight:500; margin:8px 0 4px 0; color:#FFD700;">🎆 Trajectory</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Launch Speed</label>
          <input id="ctxVolcanoSpeed" type="range" min="0.5" max="4.0" step="0.1" value="${cfg.launchSpeed||1.7}" />
          <span id="ctxVolcanoSpeedVal">${cfg.launchSpeed||1.7}x</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Arc Height</label>
          <input id="ctxVolcanoGravity" type="range" min="0.001" max="0.02" step="0.001" value="${cfg.gravity||0.005}" />
          <span id="ctxVolcanoGravityVal">${cfg.gravity||0.005}</span>
        </div>
        <!-- Consumable removed: Volcano is a permanent environment hazard -->`;
      
      // Real-time slider updates
      setTimeout(() => {
        const radiusSlider = ctxBody.querySelector('#ctxVolcanoRadius');
        const radiusLabel = ctxBody.querySelector('#ctxVolcanoRadiusVal');
        const damageSlider = ctxBody.querySelector('#ctxVolcanoDamage');
        const damageLabel = ctxBody.querySelector('#ctxVolcanoDamageVal');
        const intervalSlider = ctxBody.querySelector('#ctxVolcanoInterval');
        const intervalLabel = ctxBody.querySelector('#ctxVolcanoIntervalVal');
        const particlesSlider = ctxBody.querySelector('#ctxVolcanoParticles');
        const particlesLabel = ctxBody.querySelector('#ctxVolcanoParticlesVal');
        const eruptionSlider = ctxBody.querySelector('#ctxVolcanoEruption');
        const eruptionLabel = ctxBody.querySelector('#ctxVolcanoEruptionVal');
        const speedSlider = ctxBody.querySelector('#ctxVolcanoSpeed');
        const speedLabel = ctxBody.querySelector('#ctxVolcanoSpeedVal');
        const gravitySlider = ctxBody.querySelector('#ctxVolcanoGravity');
        const gravityLabel = ctxBody.querySelector('#ctxVolcanoGravityVal');
        
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value, 10) + 'px';
          });
        }
        
        if (damageSlider && damageLabel) {
          damageSlider.addEventListener('input', () => {
            damageLabel.textContent = parseInt(damageSlider.value, 10) + ' HP';
          });
        }
        
        if (intervalSlider && intervalLabel) {
          intervalSlider.addEventListener('input', () => {
            intervalLabel.textContent = parseInt(intervalSlider.value, 10) + ' ms';
          });
        }
        
        if (particlesSlider && particlesLabel) {
          particlesSlider.addEventListener('input', () => {
            particlesLabel.textContent = parseInt(particlesSlider.value, 10) + ' per eruption';
          });
        }
        
        if (eruptionSlider && eruptionLabel) {
          eruptionSlider.addEventListener('input', () => {
            eruptionLabel.textContent = parseInt(eruptionSlider.value, 10) + ' ms';
          });
        }
        
        if (speedSlider && speedLabel) {
          speedSlider.addEventListener('input', () => {
            speedLabel.textContent = parseFloat(speedSlider.value).toFixed(1) + 'x';
          });
        }
        
        if (gravitySlider && gravityLabel) {
          gravitySlider.addEventListener('input', () => {
            gravityLabel.textContent = parseFloat(gravitySlider.value).toFixed(3);
          });
        }
      }, 10);
    } else if (type === 'wall'){
      const thickVal = 24;
      const radiusVal = 14;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🧱 Walls (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Thickness</label>
          <input id=\"ctxThick\" type=\"range\" min=\"6\" max=\"80\" step=\"2\" value=\"${thickVal}\" />
          <span id=\"ctxThickVal\">${thickVal}px</span>
        </div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Corner</label>
          <input id=\"ctxRadius\" type=\"range\" min=\"6\" max=\"30\" step=\"2\" value=\"${radiusVal}\" />
          <span id=\"ctxRadiusVal\">${radiusVal}</span>
        </div>`;
    } else if (type === 'brush' || type === 'ebrush'){
      const bsVal = 6;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">${type==='ebrush'?'🧹 Eraser Brush':'🖌️ Brush'} (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Step</label>
          <input id=\"ctxBrushStep\" type=\"range\" min=\"2\" max=\"16\" step=\"1\" value=\"${bsVal}\" />
          <span id=\"ctxBrushStepVal\">${bsVal}px</span>
        </div>`;
    } else if (type === 'arc'){
      const asVal = 180;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🌈 Arc (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Span</label>
          <input id=\"ctxArcSpan\" type=\"range\" min=\"30\" max=\"330\" step=\"5\" value=\"${asVal}\" />
          <span id=\"ctxArcSpanVal\">${asVal}°</span>
        </div>`;
    } else if (type === 'semi' || type === 'diag'){
      const thickVal = 24;
      const radiusVal = 14;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">${type==='diag'?'📐 Diagonal':'🌙 Semi'} (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Thickness</label>
          <input id=\"ctxThick\" type=\"range\" min=\"6\" max=\"80\" step=\"2\" value=\"${thickVal}\" />
          <span id=\"ctxThickVal\">${thickVal}px</span>
        </div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Corner</label>
          <input id=\"ctxRadius\" type=\"range\" min=\"6\" max=\"30\" step=\"2\" value=\"${radiusVal}\" />
          <span id=\"ctxRadiusVal\">${radiusVal}</span>
        </div>`;
    } else if (type === 'bumper'){
      const brVal = 22, beVal = 1.15, bnVal = 0.15;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🟦 Bumper (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Radius</label>
          <input id=\"ctxBumperRadius\" type=\"range\" min=\"6\" max=\"80\" step=\"1\" value=\"${brVal}\" />
          <span id=\"ctxBumperRadiusVal\">${brVal}</span>
        </div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Elasticity</label>
          <input id=\"ctxBumperElasticity\" type=\"range\" min=\"0.5\" max=\"2.5\" step=\"0.01\" value=\"${beVal}\" />
          <span id=\"ctxBumperElasticityVal\">${beVal}</span>
        </div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Noise</label>
          <input id=\"ctxBumperNoise\" type=\"range\" min=\"0\" max=\"0.8\" step=\"0.01\" value=\"${bnVal}\" />
          <span id=\"ctxBumperNoiseVal\">${bnVal}</span>
        </div>`;
    } else if (type === 'mud'){
      const mudSlowdownEl = document.getElementById('mudSlowdown');
      const currentSlowdown = mudSlowdownEl ? parseFloat(mudSlowdownEl.value) : 0.4;
      const percentage = Math.round((1 - currentSlowdown) * 100);
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🟤 Mud (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Slowdown</label>
          <input id="ctxMudSlowdown" type="range" min="0.1" max="0.9" step="0.05" value="${currentSlowdown}" />
          <span id="ctxMudSlowdownVal">${percentage}%</span>
        </div>`;
      
      // Add real-time slider update
      setTimeout(() => {
        const slider = ctxBody.querySelector('#ctxMudSlowdown');
        const label = ctxBody.querySelector('#ctxMudSlowdownVal');
        if (slider && label) {
          slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            const percentage = Math.round((1 - value) * 100);
            label.textContent = percentage + '%';
          });
        }
      }, 10);
    } else if (type === 'spinner'){
      const spVal = (window.selected && selected.type==='spinner' && Number.isFinite(selected.speed)) ? selected.speed : (spinnerSpeedEl ? parseFloat(spinnerSpeedEl.value) : 1.0);
      const saVal = (window.selected && selected.type==='spinner' && Number.isFinite(selected.angle)) ? Math.round(selected.angle * 180 / Math.PI) : (spinnerAngleEl ? parseInt(spinnerAngleEl.value, 10) : 0);
      const slVal = (window.selected && selected.type==='spinner' && Number.isFinite(selected.w)) ? Math.round(selected.w) : (spinnerLengthEl ? parseInt(spinnerLengthEl.value, 10) : 80);
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🔄 Spinner (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Speed</label>
          <input id=\"ctxSpinnerSpeed\" type=\"range\" min=\"0.1\" max=\"5\" step=\"0.1\" value=\"${spVal}\" />
          <span id=\"ctxSpinnerSpeedVal\">${spVal.toFixed ? spVal.toFixed(1) : spVal}</span>
        </div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Angle</label>
          <input id=\"ctxSpinnerAngle\" type=\"range\" min=\"0\" max=\"359\" step=\"1\" value=\"${saVal}\" />
          <span id=\"ctxSpinnerAngleVal\">${saVal}°</span>
        </div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center; margin-bottom:6px;\">
          <label style=\"min-width:84px;\">Length</label>
          <input id=\"ctxSpinnerLength\" type=\"range\" min=\"20\" max=\"200\" step=\"5\" value=\"${slVal}\" />
          <span id=\"ctxSpinnerLengthVal\">${slVal}px</span>
        </div>`;
    } else if (type === 'rotbarrier') {
      // Get values from localStorage or defaults like other tools
      const defaultSpeed = parseFloat(localStorage.getItem('pendulumSpeed')) || 1.2;
      const defaultRange = parseInt(localStorage.getItem('pendulumRange')) || 72;
      const defaultLength = parseInt(localStorage.getItem('pendulumLength')) || 150;
      
      const swSpeedVal = (window.selected && selected.type === 'rotbarrier' && selected.swingSpeed !== undefined) ? selected.swingSpeed : defaultSpeed;
      const swRangeVal = (window.selected && selected.type === 'rotbarrier' && selected.swingRange !== undefined) ? (selected.swingRange * 180 / Math.PI) : defaultRange;
      const lengthVal = (window.selected && selected.type === 'rotbarrier' && selected.length !== undefined) ? selected.length : defaultLength;
    } else if (type === 'healingpatch') {
      const defaultRadius = parseInt(localStorage.getItem('healingpatch_radius')) || 30;
      const defaultHealRate = parseInt(localStorage.getItem('healingpatch_healrate')) || 5;
      const defaultCooldown = parseInt(localStorage.getItem('healingpatch_cooldown')) || 1000;
      
      const radiusVal = (window.selected && selected.type === 'healingpatch' && selected.r !== undefined) ? selected.r : defaultRadius;
      const healRateVal = (window.selected && selected.type === 'healingpatch' && selected.healRate !== undefined) ? selected.healRate : defaultHealRate;
      const cooldownVal = (window.selected && selected.type === 'healingpatch' && selected.cooldown !== undefined) ? selected.cooldown : defaultCooldown;
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">💚 Healing Patch Settings</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Patch Radius</label>
          <input id="ctxHealingpatchRadius" type="range" min="20" max="60" step="5" value="${radiusVal}" />
          <span id="ctxHealingpatchRadiusVal">${radiusVal}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Heal Rate</label>
          <input id="ctxHealingpatchHealRate" type="range" min="1" max="20" step="1" value="${healRateVal}" />
          <span id="ctxHealingpatchHealRateVal">${healRateVal} HP/s</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Cooldown</label>
          <input id="ctxHealingpatchCooldown" type="range" min="500" max="3000" step="100" value="${cooldownVal}" />
          <span id="ctxHealingpatchCooldownVal">${(cooldownVal/1000).toFixed(1)}s</span>
        </div>`;
      
      // Real-time slider updates
      setTimeout(() => {
        const radiusSlider = ctxBody.querySelector('#ctxHealingpatchRadius');
        const radiusLabel = ctxBody.querySelector('#ctxHealingpatchRadiusVal');
        const healRateSlider = ctxBody.querySelector('#ctxHealingpatchHealRate');
        const healRateLabel = ctxBody.querySelector('#ctxHealingpatchHealRateVal');
        const cooldownSlider = ctxBody.querySelector('#ctxHealingpatchCooldown');
        const cooldownLabel = ctxBody.querySelector('#ctxHealingpatchCooldownVal');
        
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value, 10) + 'px';
          });
        }
        if (healRateSlider && healRateLabel) {
          healRateSlider.addEventListener('input', () => {
            healRateLabel.textContent = parseInt(healRateSlider.value, 10) + ' HP/s';
          });
        }
        if (cooldownSlider && cooldownLabel) {
          cooldownSlider.addEventListener('input', () => {
            cooldownLabel.textContent = (parseInt(cooldownSlider.value, 10)/1000).toFixed(1) + 's';
          });
        }
      }, 10);

    } else if (type === 'healingpatch') {
      const defaultRadius = parseInt(localStorage.getItem('healingpatch_radius')) || 15;
      const defaultHealRate = parseInt(localStorage.getItem('healingpatch_healrate')) || 5;
      const defaultCooldown = parseInt(localStorage.getItem('healingpatch_cooldown')) || 1000;
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">💚 Healing Patch Settings</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Patch Radius</label>
          <input id="ctxHealingpatchRadius" type="range" min="10" max="30" step="1" value="${defaultRadius}" />
          <span id="ctxHealingpatchRadiusVal">${defaultRadius}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Heal Rate</label>
          <input id="ctxHealingpatchHealRate" type="range" min="1" max="20" step="1" value="${defaultHealRate}" />
          <span id="ctxHealingpatchHealRateVal">${defaultHealRate} HP/s</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Cooldown</label>
          <input id="ctxHealingpatchCooldown" type="range" min="500" max="3000" step="100" value="${defaultCooldown}" />
          <span id="ctxHealingpatchCooldownVal">${(defaultCooldown/1000).toFixed(1)}s</span>
        </div>`;
      
      // Real-time slider updates
      setTimeout(() => {
        const radiusSlider = ctxBody.querySelector('#ctxHealingpatchRadius');
        const radiusLabel = ctxBody.querySelector('#ctxHealingpatchRadiusVal');
        const healRateSlider = ctxBody.querySelector('#ctxHealingpatchHealRate');
        const healRateLabel = ctxBody.querySelector('#ctxHealingpatchHealRateVal');
        const cooldownSlider = ctxBody.querySelector('#ctxHealingpatchCooldown');
        const cooldownLabel = ctxBody.querySelector('#ctxHealingpatchCooldownVal');
        
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value, 10) + 'px';
          });
        }
        
        if (healRateSlider && healRateLabel) {
          healRateSlider.addEventListener('input', () => {
            healRateLabel.textContent = parseInt(healRateSlider.value, 10) + ' HP/s';
          });
        }
        
        if (cooldownSlider && cooldownLabel) {
          cooldownSlider.addEventListener('input', () => {
            const ms = parseInt(cooldownSlider.value, 10);
            cooldownLabel.textContent = (ms/1000).toFixed(1) + 's';
          });
        }
      }, 10);

    } else if (type === 'healingzone') {
      const defaultRadius = parseInt(localStorage.getItem('healingzone_radius')) || 40;
      const defaultHealAmount = parseInt(localStorage.getItem('healingzone_healamount')) || 10;
      
      const radiusVal = (window.selected && selected.type === 'healingzone' && selected.r !== undefined) ? selected.r : defaultRadius;
      const healAmountVal = (window.selected && selected.type === 'healingzone' && selected.healAmount !== undefined) ? selected.healAmount : defaultHealAmount;
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">💚 Healing Pickup Settings</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Pickup Radius</label>
          <input id="ctxHealingzoneRadius" type="range" min="20" max="80" step="5" value="${radiusVal}" />
          <span id="ctxHealingzoneRadiusVal">${radiusVal}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Heal Amount</label>
          <input id="ctxHealingzoneHealAmount" type="range" min="5" max="50" step="5" value="${healAmountVal}" />
          <span id="ctxHealingzoneHealAmountVal">${healAmountVal} HP</span>
        </div>`;
      
      // Real-time slider updates
      setTimeout(() => {
        const radiusSlider = ctxBody.querySelector('#ctxHealingzoneRadius');
        const radiusLabel = ctxBody.querySelector('#ctxHealingzoneRadiusVal');
        const healAmountSlider = ctxBody.querySelector('#ctxHealingzoneHealAmount');
        const healAmountLabel = ctxBody.querySelector('#ctxHealingzoneHealAmountVal');
        
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value, 10) + 'px';
          });
        }
        if (healAmountSlider && healAmountLabel) {
          healAmountSlider.addEventListener('input', () => {
            healAmountLabel.textContent = parseInt(healAmountSlider.value, 10) + ' HP';
          });
        }
      }, 10);
    } else if (type === 'weather') {
      const weather = mapDef.weather || { type: 'clear', intensity: 0.5, windDirection: 0, enabled: false };
      const weatherTypes = ['clear', 'rain', 'wind', 'snow', 'storm'];
      const weatherEmojis = { clear: '☀️', rain: '🌧️', wind: '💨', snow: '❄️', storm: '⛈️' };
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🌦️ Weather System Settings</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Enable Weather</label>
          <input id="ctxWeatherEnabled" type="checkbox" ${weather.enabled ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Weather Type</label>
          <select id="ctxWeatherType" style="flex:1;">
            ${weatherTypes.map(type => `<option value="${type}" ${weather.type === type ? 'selected' : ''}>${weatherEmojis[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Intensity</label>
          <input id="ctxWeatherIntensity" type="range" min="0.1" max="1.0" step="0.1" value="${weather.intensity}" />
          <span id="ctxWeatherIntensityVal">${Math.round(weather.intensity * 100)}%</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Wind Direction</label>
          <input id="ctxWeatherWindDir" type="range" min="0" max="360" step="15" value="${Math.round(weather.windDirection * 180 / Math.PI)}" />
          <span id="ctxWeatherWindDirVal">${Math.round(weather.windDirection * 180 / Math.PI)}°</span>
        </div>`;
      
      // Real-time updates
      setTimeout(() => {
        const enabledCheck = ctxBody.querySelector('#ctxWeatherEnabled');
        const typeSelect = ctxBody.querySelector('#ctxWeatherType');
        const intensitySlider = ctxBody.querySelector('#ctxWeatherIntensity');
        const intensityLabel = ctxBody.querySelector('#ctxWeatherIntensityVal');
        const windDirSlider = ctxBody.querySelector('#ctxWeatherWindDir');
        const windDirLabel = ctxBody.querySelector('#ctxWeatherWindDirVal');
        
        if (intensitySlider && intensityLabel) {
          intensitySlider.addEventListener('input', () => {
            intensityLabel.textContent = Math.round(parseFloat(intensitySlider.value) * 100) + '%';
          });
        }
        
        if (windDirSlider && windDirLabel) {
          windDirSlider.addEventListener('input', () => {
            windDirLabel.textContent = parseInt(windDirSlider.value, 10) + '°';
          });
        }
      }, 10);
    } else if (type === 'magnetpush') {
      // Get values from localStorage or defaults
      const defaultRadius = parseInt(localStorage.getItem('magnetpush_radius')) || 80;
      const defaultStrength = parseFloat(localStorage.getItem('magnetpush_strength')) || 2.0;
      
      const radiusVal = (window.selected && selected.type === 'magnetpush' && selected.radius !== undefined) ? selected.radius : defaultRadius;
      const strengthVal = (window.selected && selected.type === 'magnetpush' && selected.strength !== undefined) ? selected.strength : defaultStrength;
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">⚡ Magnetic Push Settings</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Repulsion Radius</label>
          <input id="ctxMagnetpushRadius" type="range" min="40" max="150" step="5" value="${radiusVal}" />
          <span id="ctxMagnetpushRadiusVal">${radiusVal}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Push Strength</label>
          <input id="ctxMagnetpushStrength" type="range" min="0.5" max="5.0" step="0.1" value="${strengthVal}" />
          <span id="ctxMagnetpushStrengthVal">${strengthVal.toFixed(1)}</span>
        </div>`;
      
      // Add real-time slider updates
      setTimeout(() => {
        const radiusSlider = ctxBody.querySelector('#ctxMagnetpushRadius');
        const radiusLabel = ctxBody.querySelector('#ctxMagnetpushRadiusVal');
        const strengthSlider = ctxBody.querySelector('#ctxMagnetpushStrength');
        const strengthLabel = ctxBody.querySelector('#ctxMagnetpushStrengthVal');
        
        if (radiusSlider && radiusLabel) {
          radiusSlider.addEventListener('input', () => {
            radiusLabel.textContent = parseInt(radiusSlider.value, 10) + 'px';
          });
        }
        if (strengthSlider && strengthLabel) {
          strengthSlider.addEventListener('input', () => {
            strengthLabel.textContent = parseFloat(strengthSlider.value).toFixed(1);
          });
        }
      }, 10);
    } else if (type === 'rotbarrier') {
      // Get values from localStorage or defaults like other tools
      const defaultSpeed = parseFloat(localStorage.getItem('pendulumSpeed')) || 1.2;
      const defaultRange = parseInt(localStorage.getItem('pendulumRange')) || 72;
      const defaultLength = parseInt(localStorage.getItem('pendulumLength')) || 150;
      
      const swSpeedVal = (window.selected && selected.type === 'rotbarrier' && selected.swingSpeed !== undefined) ? selected.swingSpeed : defaultSpeed;
      const swRangeVal = (window.selected && selected.type === 'rotbarrier' && selected.swingRange !== undefined) ? (selected.swingRange * 180 / Math.PI) : defaultRange;
      const lengthVal = (window.selected && selected.type === 'rotbarrier' && selected.length !== undefined) ? selected.length : defaultLength;
      
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">⚖️ Pendulum Barrier (Quick)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Swing Speed</label>
          <input id="ctxPendulumSpeed" type="range" min="0.5" max="3" step="0.1" value="${swSpeedVal}" />
          <span id="ctxPendulumSpeedVal">${swSpeedVal.toFixed ? swSpeedVal.toFixed(1) : swSpeedVal}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Swing Range</label>
          <input id="ctxPendulumRange" type="range" min="30" max="120" step="5" value="${swRangeVal}" />
          <span id="ctxPendulumRangeVal">${swRangeVal}°</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Length</label>
          <input id="ctxPendulumLength" type="range" min="80" max="250" step="10" value="${lengthVal}" />
          <span id="ctxPendulumLengthVal">${lengthVal}px</span>
        </div>`;
      
      // CRITICAL: Add real-time slider updates
      setTimeout(() => {
        const speedSlider = ctxBody.querySelector('#ctxPendulumSpeed');
        const speedLabel = ctxBody.querySelector('#ctxPendulumSpeedVal');
        const rangeSlider = ctxBody.querySelector('#ctxPendulumRange');
        const rangeLabel = ctxBody.querySelector('#ctxPendulumRangeVal');
        const lengthSlider = ctxBody.querySelector('#ctxPendulumLength');
        const lengthLabel = ctxBody.querySelector('#ctxPendulumLengthVal');
        
        if (speedSlider && speedLabel) {
          speedSlider.addEventListener('input', () => {
            const value = parseFloat(speedSlider.value);
            speedLabel.textContent = value.toFixed(1);
          });
        }
        if (rangeSlider && rangeLabel) {
          rangeSlider.addEventListener('input', () => {
            const value = parseInt(rangeSlider.value, 10);
            rangeLabel.textContent = value + '°';
          });
        }
        if (lengthSlider && lengthLabel) {
          lengthSlider.addEventListener('input', () => {
            const value = parseInt(lengthSlider.value, 10);
            lengthLabel.textContent = value + 'px';
          });
        }
      }, 10);
    } else if (type === 'spawn'){
      const jVal = 0;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🏁 Spawns (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Jitter</label>
          <input id=\"ctxSpawnJitter\" type=\"range\" min=\"0\" max=\"60\" step=\"1\" value=\"${jVal}\" />
          <span id=\"ctxSpawnJitterVal\">${jVal}px</span>
        </div>`;
    } else if (type === 'start'){
      const sVal = 0;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🚦 Start Gate (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Bias</label>
          <input id=\"ctxStartBias\" type=\"range\" min=\"0\" max=\"3000\" step=\"50\" value=\"${sVal}\" />
          <span id=\"ctxStartBiasVal\">${sVal} ms</span>
        </div>`;
    } else if (type === 'carrotA' || type === 'carrotB'){
      const cVal = 30;
      ctxBody.innerHTML = `
        <div style=\"font-weight:600; margin:4px 0 8px 0;\">🥕 Finish (${type==='carrotA'?'A':'B'}) (Quick)</div>
        <div class=\"row compact\" style=\"gap:8px; align-items:center;\">
          <label style=\"min-width:84px;\">Radius</label>
          <input id=\"ctxCarrotRadius\" type=\"range\" min=\"8\" max=\"60\" step=\"1\" value=\"${cVal}\" />
          <span id=\"ctxCarrotRadiusVal\">${cVal}</span>
        </div>`;
    } else if (type === 'breakwall'){
      const cfg = (mapDef && mapDef.breakWallSettings) ? mapDef.breakWallSettings : { hp: 8, on: 'shards' };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">💥 Break Wall (Quick)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">HP</label>
          <input id="ctxBreakHp" type="range" min="1" max="50" step="1" value="${cfg.hp||8}" />
          <span id="ctxBreakHpVal">${cfg.hp||8}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">On Break</label>
          <select id="ctxBreakOn">
            <option value="remove" ${cfg.on==='remove'?'selected':''}>Remove</option>
            <option value="shards" ${cfg.on!=='remove'?'selected':''}>Shards</option>
          </select>
        </div>`;
    } else if (type === 'softwall'){
      const cfg = (mapDef && mapDef.softWallSettings) ? mapDef.softWallSettings : { stiffness: 0.25, maxDeform: 18, recover: 24 };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🧽 Soft Wall (Quick)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Stiffness</label>
          <input id="ctxSoftStiff" type="range" min="0.05" max="999" step="0.05" value="${cfg.stiffness||0.25}" />
          <span id="ctxSoftStiffVal">${(cfg.stiffness||0.25).toFixed(2)}</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Max Deform</label>
          <input id="ctxSoftMaxDef" type="range" min="4" max="999" step="1" value="${cfg.maxDeform||18}" />
          <span id="ctxSoftMaxDefVal">${cfg.maxDeform||18}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Recovery</label>
          <input id="ctxSoftRecover" type="range" min="0" max="120" step="2" value="${cfg.recover !== undefined ? cfg.recover : 24}" />
          <span id="ctxSoftRecoverVal">${cfg.recover !== undefined ? cfg.recover : 24}px/s</span>
        </div>`;
    } else if (type === 'trap') {
      const cfg = mapDef.trapSettings || { durationMs: 3000, slowMultiplier: 0.5, consumable: false };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🧊 Ice Trap (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxTrapDuration" type="range" min="1000" max="8000" step="250" value="${cfg.durationMs||3000}" />
          <span id="ctxTrapDurationVal">${cfg.durationMs||3000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Slow Power</label>
          <input id="ctxTrapSlow" type="range" min="0.1" max="0.9" step="0.05" value="${cfg.slowMultiplier||0.5}" />
          <span id="ctxTrapSlowVal">${Math.round((1 - (cfg.slowMultiplier||0.5)) * 100)}% slower</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxTrapConsumable" type="checkbox" ${cfg.consumable === true ? 'checked' : ''} />
        </div>`;
      
      // Add real-time slider updates
      setTimeout(() => {
        const durSlider = ctxBody.querySelector('#ctxTrapDuration');
        const durLabel = ctxBody.querySelector('#ctxTrapDurationVal');
        const slowSlider = ctxBody.querySelector('#ctxTrapSlow');
        const slowLabel = ctxBody.querySelector('#ctxTrapSlowVal');
        
        if (durSlider && durLabel) {
          durSlider.addEventListener('input', () => {
            durLabel.textContent = durSlider.value + ' ms';
          });
        }
        if (slowSlider && slowLabel) {
          slowSlider.addEventListener('input', () => {
            const slowVal = parseFloat(slowSlider.value);
            slowLabel.textContent = Math.round((1 - slowVal) * 100) + '% slower';
          });
        }
      }, 50);
    } else if (type === 'ram'){
      const cfg = mapDef.ramSettings || { durationMs: 4000, range: 25, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">💥 Ram (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxRamDuration" type="range" min="1000" max="10000" step="500" value="${cfg.durationMs||4000}" />
          <span id="ctxRamDurationVal">${cfg.durationMs||4000} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Aura Range</label>
          <input id="ctxRamRange" type="range" min="15" max="50" step="2" value="${cfg.range||25}" />
          <span id="ctxRamRangeVal">${cfg.range||25}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxRamConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    } else if (type === 'warpzone'){
      const cfg = mapDef.warpzoneSettings || { cooldownMs: 500, minDistance: 50, teleportOffset: 25, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🌌 Warp Zone (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Cooldown</label>
          <input id="ctxWarpCooldown" type="range" min="100" max="2000" step="50" value="${cfg.cooldownMs||500}" />
          <span id="ctxWarpCooldownVal">${cfg.cooldownMs||500} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Min Distance</label>
          <input id="ctxWarpMinDist" type="range" min="20" max="200" step="10" value="${cfg.minDistance||50}" />
          <span id="ctxWarpMinDistVal">${cfg.minDistance||50}px</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Teleport Offset</label>
          <input id="ctxWarpOffset" type="range" min="10" max="80" step="5" value="${cfg.teleportOffset||25}" />
          <span id="ctxWarpOffsetVal">${cfg.teleportOffset||25}px</span>
        </div>
        <!-- Consumable removed: Warpzone is a permanent portal -->`;
    } else if (type === 'quantumdash'){
      const cfg = mapDef.quantumdashSettings || { durationMs: 2500, speedMultiplier: 3.0, phaseEnabled: true, consumable: true };
      ctxBody.innerHTML = `
        <div style="font-weight:600; margin:4px 0 8px 0;">🔮 Quantum Dash (Global)</div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Duration</label>
          <input id="ctxQuantumDuration" type="range" min="1000" max="8000" step="250" value="${cfg.durationMs||2500}" />
          <span id="ctxQuantumDurationVal">${cfg.durationMs||2500} ms</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Speed Multiplier</label>
          <input id="ctxQuantumSpeed" type="range" min="1.5" max="5.0" step="0.1" value="${cfg.speedMultiplier||3.0}" />
          <span id="ctxQuantumSpeedVal">${(cfg.speedMultiplier||3.0).toFixed(1)}x</span>
        </div>
        <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
          <label style="min-width:84px;">Wall Phasing</label>
          <input id="ctxQuantumPhase" type="checkbox" ${cfg.phaseEnabled ? 'checked' : ''} />
        </div>
        <div class="row compact" style="gap:8px; align-items:center;">
          <label style="min-width:84px;">Consumable</label>
          <input id="ctxQuantumConsumable" type="checkbox" ${cfg.consumable !== false ? 'checked' : ''} />
        </div>`;
    }

    // Bind live labels for whichever UI is present
      const pairs = [
      ['#ctxMagnetRange','#ctxMagnetRangeVal','px'],
      ['#ctxMagnetDuration','#ctxMagnetDurationVal',' ms'],
      ['#ctxMagnetPower','#ctxMagnetPowerVal',''],
      ['#ctxTurboDuration','#ctxTurboDurationVal',' ms'],
      ['#ctxTurboMultiplier','#ctxTurboMultiplierVal','x', true],
      ['#ctxShieldDuration','#ctxShieldDurationVal',' ms'],
      ['#ctxFreezeDuration','#ctxFreezeDurationVal',' ms'],
      ['#ctxTpSafe','#ctxTpSafeVal','px'],
      ['#ctxTpMin','#ctxTpMinVal','px'],
      ['#ctxThick','#ctxThickVal','px'],
      ['#ctxRadius','#ctxRadiusVal',''],
      ['#ctxBrushStep','#ctxBrushStepVal','px'],
      ['#ctxArcSpan','#ctxArcSpanVal','°'],
      ['#ctxBumperRadius','#ctxBumperRadiusVal',''],
      ['#ctxBumperElasticity','#ctxBumperElasticityVal',''],
      ['#ctxBumperNoise','#ctxBumperNoiseVal',''],
      ['#ctxSpinnerLength','#ctxSpinnerLengthVal','px'],
      ['#ctxSpinnerSpeed','#ctxSpinnerSpeedVal','', true],
      ['#ctxSpinnerAngle','#ctxSpinnerAngleVal','°'],
      ['#ctxPendulumSpeed','#ctxPendulumSpeedVal','', true],
      ['#ctxPendulumRange','#ctxPendulumRangeVal','°'],
      ['#ctxPendulumLength','#ctxPendulumLengthVal','px']
      , ['#ctxSpawnJitter','#ctxSpawnJitterVal','px']
      , ['#ctxStartBias','#ctxStartBiasVal',' ms']
      , ['#ctxCarrotRadius','#ctxCarrotRadiusVal','']
      , ['#ctxBreakHp','#ctxBreakHpVal','']
      , ['#ctxSoftStiff','#ctxSoftStiffVal','', true]
      , ['#ctxSoftMaxDef','#ctxSoftMaxDefVal','px']
      , ['#ctxSoftRecover','#ctxSoftRecoverVal','px/s']
      , ['#ctxRamDuration','#ctxRamDurationVal',' ms']
      , ['#ctxRamRange','#ctxRamRangeVal','px']
      , ['#ctxWarpCooldown','#ctxWarpCooldownVal',' ms']
      , ['#ctxWarpMinDist','#ctxWarpMinDistVal','px']
      , ['#ctxWarpOffset','#ctxWarpOffsetVal','px']
      , ['#ctxQuantumDuration','#ctxQuantumDurationVal',' ms']
      , ['#ctxQuantumSpeed','#ctxQuantumSpeedVal','x', true]
    ];
    for (const [sel, lab, suf, fmt1] of pairs){
      const el = ctxBody.querySelector(sel); const vl = ctxBody.querySelector(lab);
      if (el && vl){
        el.addEventListener('input', ()=>{
          const val = fmt1 ? (parseFloat(el.value).toFixed(1)) : el.value;
          vl.textContent = val + suf;
        });
      }
    }
  }

  function openCtx(type, x, y){
    buildBody(type);
    const pad = 8, vw = window.innerWidth||1920, vh = window.innerHeight||1080;
    const width = 280, height = 200;
    const px = Math.max(pad, Math.min(vw - width - pad, Math.round(x)));
    const py = Math.max(pad, Math.min(vh - height - pad, Math.round(y)));
    ctx.style.left = px + 'px';
    ctx.style.top = py + 'px';
    ctx.style.display = 'block';
    ctxApply.onclick = (e)=>{
      e.preventDefault();
      e.stopPropagation();
      // Debug logging removed
      try {
        if (currentType === 'magnet'){
          const r = ctxBody.querySelector('#ctxMagnetRange');
          const d = ctxBody.querySelector('#ctxMagnetDuration');
          const p = ctxBody.querySelector('#ctxMagnetPower');
          const a = ctxBody.querySelector('#ctxMagnetAttractAll');
          const c = ctxBody.querySelector('#ctxMagnetConsumable');
          if (r){ mapDef.magnetSettings.range = parseInt(r.value,10)||100; localStorage.setItem('magnetRange', String(mapDef.magnetSettings.range)); }
          if (d){ mapDef.magnetSettings.durationMs = parseInt(d.value,10)||3000; localStorage.setItem('magnetDuration', String(mapDef.magnetSettings.durationMs)); }
          if (p){ mapDef.magnetSettings.power = parseInt(p.value,10)||200; localStorage.setItem('magnetPower', String(mapDef.magnetSettings.power)); }
          if (a){ mapDef.magnetSettings.attractAll = !!a.checked; localStorage.setItem('magnetAttractAll', JSON.stringify(mapDef.magnetSettings.attractAll)); }
          if (c){ mapDef.magnetSettings.consumable = !!c.checked; localStorage.setItem('magnetConsumable', JSON.stringify(mapDef.magnetSettings.consumable)); }
          if (magnetRangeEl){ magnetRangeEl.value = String(mapDef.magnetSettings.range); magnetRangeVal.textContent = mapDef.magnetSettings.range + 'px'; }
          if (magnetDurationEl){ magnetDurationEl.value = String(mapDef.magnetSettings.durationMs); magnetDurationVal.textContent = mapDef.magnetSettings.durationMs + ' ms'; }
          if (magnetPowerEl){ magnetPowerEl.value = String(mapDef.magnetSettings.power); magnetPowerVal.textContent = String(mapDef.magnetSettings.power); }
          if (magnetAttractAllEl){ magnetAttractAllEl.checked = !!mapDef.magnetSettings.attractAll; }
        } else if (currentType === 'turbo'){
          mapDef.turboSettings = mapDef.turboSettings || { durationMs: 5000, multiplier: 2.2, consumable: true };
          const d = ctxBody.querySelector('#ctxTurboDuration');
          const m = ctxBody.querySelector('#ctxTurboMultiplier');
          const c = ctxBody.querySelector('#ctxTurboConsumable');
          if (d){ mapDef.turboSettings.durationMs = parseInt(d.value,10)||5000; localStorage.setItem('turboDuration', String(mapDef.turboSettings.durationMs)); }
          if (m){ mapDef.turboSettings.multiplier = parseFloat(m.value)||2.2; localStorage.setItem('turboMultiplier', String(mapDef.turboSettings.multiplier)); }
          if (c){ mapDef.turboSettings.consumable = !!c.checked; localStorage.setItem('turboConsumable', JSON.stringify(mapDef.turboSettings.consumable)); }
        } else if (currentType === 'shield'){
          mapDef.shieldSettings = mapDef.shieldSettings || { durationMs: 10000, consumable: true };
          const d = ctxBody.querySelector('#ctxShieldDuration');
          const c = ctxBody.querySelector('#ctxShieldConsumable');
          if (d){ mapDef.shieldSettings.durationMs = parseInt(d.value,10)||10000; localStorage.setItem('shieldDuration', String(mapDef.shieldSettings.durationMs)); }
          if (c){ mapDef.shieldSettings.consumable = !!c.checked; localStorage.setItem('shieldConsumable', JSON.stringify(mapDef.shieldSettings.consumable)); }
        } else if (currentType === 'timefreeze'){
          const d = ctxBody.querySelector('#ctxFreezeDuration');
          const s = ctxBody.querySelector('#ctxFreezeAffectSelf');
          const c = ctxBody.querySelector('#ctxFreezeConsumable');
          if (d){ mapDef.timeFreezeSettings.durationMs = parseInt(d.value,10)||5000; localStorage.setItem('timeFreezeDuration', String(mapDef.timeFreezeSettings.durationMs)); }
          if (s){ mapDef.timeFreezeSettings.affectSelf = !!s.checked; localStorage.setItem('timeFreezeAffectSelf', JSON.stringify(mapDef.timeFreezeSettings.affectSelf)); }
          if (c){ mapDef.timeFreezeSettings.consumable = !!c.checked; localStorage.setItem('timeFreezeConsumable', JSON.stringify(mapDef.timeFreezeSettings.consumable)); }
        } else if (currentType === 'icefreezer'){
          mapDef.icefreezerSettings = mapDef.icefreezerSettings || { durationMs: 2000, freezeDurationMs: 2000, slowMultiplier: 0.7, consumable: true };
          const d = ctxBody.querySelector('#ctxIceFreezeDuration');
          const sm = ctxBody.querySelector('#ctxIceSlowMult');
          const c = ctxBody.querySelector('#ctxIceFreezerConsumable');
          if (d){ mapDef.icefreezerSettings.freezeDurationMs = parseInt(d.value,10)||2000; mapDef.icefreezerSettings.durationMs = mapDef.icefreezerSettings.freezeDurationMs; localStorage.setItem('iceFreezerDuration', String(mapDef.icefreezerSettings.freezeDurationMs)); }
          if (sm){ mapDef.icefreezerSettings.slowMultiplier = parseFloat(sm.value)||0.7; localStorage.setItem('iceFreezerSlowMultiplier', String(mapDef.icefreezerSettings.slowMultiplier)); }
          if (c){ mapDef.icefreezerSettings.consumable = !!c.checked; localStorage.setItem('iceFreezerConsumable', JSON.stringify(mapDef.icefreezerSettings.consumable)); }
        } else if (currentType === 'teleport'){
          mapDef.teleportSettings = mapDef.teleportSettings || { safeMargin: 20, minDistance: 0, consumable: true };
          const sm = ctxBody.querySelector('#ctxTpSafe');
          const md = ctxBody.querySelector('#ctxTpMin');
          const c = ctxBody.querySelector('#ctxTpConsumable');
          if (sm){ mapDef.teleportSettings.safeMargin = parseInt(sm.value,10)||20; localStorage.setItem('teleportSafeMargin', String(mapDef.teleportSettings.safeMargin)); }
          if (md){ mapDef.teleportSettings.minDistance = parseInt(md.value,10)||0; localStorage.setItem('teleportMinDistance', String(mapDef.teleportSettings.minDistance)); }
          if (c){ mapDef.teleportSettings.consumable = !!c.checked; localStorage.setItem('teleportConsumable', JSON.stringify(mapDef.teleportSettings.consumable)); }
        } else if (currentType === 'boost'){
          mapDef.boostSettings = mapDef.boostSettings || { stackBonus: 0.2, maxStacks: 10, consumable: true };
          const sb = ctxBody.querySelector('#ctxBoostStackBonus');
          const ms = ctxBody.querySelector('#ctxBoostMaxStacks');
          const c = ctxBody.querySelector('#ctxBoostConsumable');
          if (sb){ mapDef.boostSettings.stackBonus = parseFloat(sb.value)||0.2; localStorage.setItem('boostStackBonus', String(mapDef.boostSettings.stackBonus)); }
          if (ms){ mapDef.boostSettings.maxStacks = parseInt(ms.value,10)||10; localStorage.setItem('boostMaxStacks', String(mapDef.boostSettings.maxStacks)); }
          if (c){ mapDef.boostSettings.consumable = !!c.checked; localStorage.setItem('boostConsumable', JSON.stringify(mapDef.boostSettings.consumable)); }
        } else if (currentType === 'nebula'){
          mapDef.nebulaSettings = mapDef.nebulaSettings || { speedMultiplier: 2.5, durationMs: 4000, damage: 20, radius: 16, particleEnabled: true, glowEnabled: true, intensity: 1, consumable: true };
          const s = ctxBody.querySelector('#ctxNebulaSpeed');
          const d = ctxBody.querySelector('#ctxNebulaDuration');
          const dm = ctxBody.querySelector('#ctxNebulaDamage');
          const r = ctxBody.querySelector('#ctxNebulaRadius');
          const p = ctxBody.querySelector('#ctxNebulaParticles');
          const g = ctxBody.querySelector('#ctxNebulaGlow');
          const c = ctxBody.querySelector('#ctxNebulaConsumable');
          if (s){ mapDef.nebulaSettings.speedMultiplier = parseFloat(s.value)||2.5; localStorage.setItem('nebulaSpeedMultiplier', String(mapDef.nebulaSettings.speedMultiplier)); }
          if (d){ mapDef.nebulaSettings.durationMs = parseInt(d.value,10)||4000; localStorage.setItem('nebulaDurationMs', String(mapDef.nebulaSettings.durationMs)); }
          if (dm){ mapDef.nebulaSettings.damage = parseInt(dm.value,10)||20; localStorage.setItem('nebulaDamage', String(mapDef.nebulaSettings.damage)); }
          if (r){ mapDef.nebulaSettings.radius = parseInt(r.value,10)||16; localStorage.setItem('nebulaRadius', String(mapDef.nebulaSettings.radius)); }
          if (p){ mapDef.nebulaSettings.particleEnabled = !!p.checked; localStorage.setItem('nebulaParticleEnabled', JSON.stringify(mapDef.nebulaSettings.particleEnabled)); }
          if (g){ mapDef.nebulaSettings.glowEnabled = !!g.checked; localStorage.setItem('nebulaGlowEnabled', JSON.stringify(mapDef.nebulaSettings.glowEnabled)); }
          if (c){ mapDef.nebulaSettings.consumable = !!c.checked; localStorage.setItem('nebulaConsumable', JSON.stringify(mapDef.nebulaSettings.consumable)); }
          // Debug logging removed
        } else if (currentType === 'yellowheart'){
          mapDef.yellowheartSettings = mapDef.yellowheartSettings || { damage: 25, duration: 4000, radius: 18, effectType: 'speed', consumable: true, stackable: true, maxStacks: 4 };
          const et = ctxBody.querySelector('#ctxYellowheartEffectType');
          const d = ctxBody.querySelector('#ctxYellowheartDamage');
          const dur = ctxBody.querySelector('#ctxYellowheartDuration');
          const r = ctxBody.querySelector('#ctxYellowheartRadius');
          const ms = ctxBody.querySelector('#ctxYellowheartMaxStacks');
          const s = ctxBody.querySelector('#ctxYellowheartStackable');
          const c = ctxBody.querySelector('#ctxYellowheartConsumable');
          if (et){ mapDef.yellowheartSettings.effectType = et.value || 'speed'; localStorage.setItem('yellowheartEffectType', mapDef.yellowheartSettings.effectType); }
          if (d){ mapDef.yellowheartSettings.damage = parseInt(d.value,10)||25; localStorage.setItem('yellowheartDamage', String(mapDef.yellowheartSettings.damage)); }
          if (dur){ mapDef.yellowheartSettings.duration = parseInt(dur.value,10)||4000; localStorage.setItem('yellowheartDuration', String(mapDef.yellowheartSettings.duration)); }
          if (r){ mapDef.yellowheartSettings.radius = parseInt(r.value,10)||18; localStorage.setItem('yellowheartRadius', String(mapDef.yellowheartSettings.radius)); }
          if (ms){ mapDef.yellowheartSettings.maxStacks = parseInt(ms.value,10)||4; localStorage.setItem('yellowheartMaxStacks', String(mapDef.yellowheartSettings.maxStacks)); }
          if (s){ mapDef.yellowheartSettings.stackable = !!s.checked; localStorage.setItem('yellowheartStackable', JSON.stringify(mapDef.yellowheartSettings.stackable)); }
          if (c){ mapDef.yellowheartSettings.consumable = !!c.checked; localStorage.setItem('yellowheartConsumable', JSON.stringify(mapDef.yellowheartSettings.consumable)); }
        } else if (currentType === 'ghost'){
          mapDef.ghostSettings = mapDef.ghostSettings || { durationMs: 4000, transparency: 0.3, consumable: true };
          const d = ctxBody.querySelector('#ctxGhostDuration');
          const t = ctxBody.querySelector('#ctxGhostTransparency');
          const c = ctxBody.querySelector('#ctxGhostConsumable');
          if (d){ mapDef.ghostSettings.durationMs = parseInt(d.value,10)||4000; localStorage.setItem('ghostDuration', String(mapDef.ghostSettings.durationMs)); }
          if (t){ mapDef.ghostSettings.transparency = parseFloat(t.value)||0.3; localStorage.setItem('ghostTransparency', String(mapDef.ghostSettings.transparency)); }
          if (c){ mapDef.ghostSettings.consumable = !!c.checked; localStorage.setItem('ghostConsumable', JSON.stringify(mapDef.ghostSettings.consumable)); }
        } else if (currentType === 'poison'){
          mapDef.poisonSettings = mapDef.poisonSettings || { durationMs: 5000, chaosLevel: 0.7, consumable: true };
          const d = ctxBody.querySelector('#ctxPoisonDuration');
          const chaos = ctxBody.querySelector('#ctxPoisonChaos');
          const c = ctxBody.querySelector('#ctxPoisonConsumable');
          if (d){ mapDef.poisonSettings.durationMs = parseInt(d.value,10)||5000; localStorage.setItem('poisonDuration', String(mapDef.poisonSettings.durationMs)); }
          if (chaos){ mapDef.poisonSettings.chaosLevel = parseFloat(chaos.value)||0.7; localStorage.setItem('poisonChaosLevel', String(mapDef.poisonSettings.chaosLevel)); }
          if (c){ mapDef.poisonSettings.consumable = !!c.checked; localStorage.setItem('poisonConsumable', JSON.stringify(mapDef.poisonSettings.consumable)); }
        } else if (currentType === 'tornado'){
          mapDef.tornadoSettings = mapDef.tornadoSettings || { 
            vortexRadius: 120,
            pullStrength: 1.2,
            damage: 5,
            speedPenalty: 0.7,
            damageInterval: 500,
            consumable: false
          };
          const radius = ctxBody.querySelector('#ctxTornadoRadius');
          const pull = ctxBody.querySelector('#ctxTornadoPull');
          const speed = ctxBody.querySelector('#ctxTornadoSpeed');
          const damage = ctxBody.querySelector('#ctxTornadoDamage');
          const interval = ctxBody.querySelector('#ctxTornadoInterval');
          // Consumable checkbox removed - tornado is permanent
          
          if (radius){ 
            mapDef.tornadoSettings.vortexRadius = parseInt(radius.value,10)||120; 
            localStorage.setItem('tornadoVortexRadius', String(mapDef.tornadoSettings.vortexRadius)); 
          }
          if (pull){ mapDef.tornadoSettings.pullStrength = parseFloat(pull.value)||1.2; localStorage.setItem('tornadoPullStrength', String(mapDef.tornadoSettings.pullStrength)); }
          if (speed){ mapDef.tornadoSettings.speedPenalty = parseFloat(speed.value)||0.7; localStorage.setItem('tornadoSpeedPenalty', String(mapDef.tornadoSettings.speedPenalty)); }
          if (damage){ mapDef.tornadoSettings.damage = parseInt(damage.value,10)||5; localStorage.setItem('tornadoDamage', String(mapDef.tornadoSettings.damage)); }
          if (interval){ mapDef.tornadoSettings.damageInterval = parseInt(interval.value,10)||500; localStorage.setItem('tornadoDamageInterval', String(mapDef.tornadoSettings.damageInterval)); }
          // Consumable setting removed - tornado is permanent
          
          // Force redraw to show updated vortex radius
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'volcano'){
          mapDef.volcanoSettings = mapDef.volcanoSettings || { consumable: false };
          
          const radius = ctxBody.querySelector('#ctxVolcanoRadius');
          const damage = ctxBody.querySelector('#ctxVolcanoDamage');
          const interval = ctxBody.querySelector('#ctxVolcanoInterval');
          const particles = ctxBody.querySelector('#ctxVolcanoParticles');
          const eruption = ctxBody.querySelector('#ctxVolcanoEruption');
          const speed = ctxBody.querySelector('#ctxVolcanoSpeed');
          const gravity = ctxBody.querySelector('#ctxVolcanoGravity');
          // Consumable checkbox removed - volcano is permanent
          
          if (radius){ 
            mapDef.volcanoSettings.effectRadius = parseInt(radius.value,10)||120; 
            localStorage.setItem('volcanoEffectRadius', String(mapDef.volcanoSettings.effectRadius)); 
          }
          if (damage){ 
            mapDef.volcanoSettings.damage = parseInt(damage.value,10)||5; 
            localStorage.setItem('volcanoDamage', String(mapDef.volcanoSettings.damage)); 
          }
          if (interval){ 
            mapDef.volcanoSettings.damageInterval = parseInt(interval.value,10)||500; 
            localStorage.setItem('volcanoDamageInterval', String(mapDef.volcanoSettings.damageInterval)); 
          }
          if (particles){ 
            mapDef.volcanoSettings.particleCount = parseInt(particles.value,10)||3; 
            localStorage.setItem('volcanoParticleCount', String(mapDef.volcanoSettings.particleCount)); 
          }
          if (eruption){ 
            mapDef.volcanoSettings.eruptionInterval = parseInt(eruption.value,10)||1000; 
            localStorage.setItem('volcanoEruptionInterval', String(mapDef.volcanoSettings.eruptionInterval)); 
          }
          if (speed){ 
            mapDef.volcanoSettings.launchSpeed = parseFloat(speed.value)||1.7; 
            localStorage.setItem('volcanoLaunchSpeed', String(mapDef.volcanoSettings.launchSpeed)); 
          }
          if (gravity){ 
            mapDef.volcanoSettings.gravity = parseFloat(gravity.value)||0.005; 
            localStorage.setItem('volcanoGravity', String(mapDef.volcanoSettings.gravity)); 
          }
          // Consumable setting removed - volcano is permanent
          
          // Force redraw to show updated visuals
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'meteor'){
// Enhanced Context Menu Settings for meteor
if (type === 'meteor') {
  if (!mapDef.meteorSettings) {
    mapDef.meteorSettings = {
      effectRadius: parseInt(localStorage.getItem('meteorEffectRadius')) || 120,
      damage: parseInt(localStorage.getItem('meteorDamage')) || 5,
      damageInterval: parseInt(localStorage.getItem('meteorDamageInterval')) || 500,
      particleCount: parseInt(localStorage.getItem('meteorParticleCount')) || 3,
      eruptionInterval: parseInt(localStorage.getItem('meteorEruptionInterval')) || 1000,
      launchSpeed: parseFloat(localStorage.getItem('meteorLaunchSpeed')) || 1.7,
      gravity: parseFloat(localStorage.getItem('meteorGravity')) || 0.005
    };
  }
  const cfg = mapDef.meteorSettings;
  
  ctxBody.innerHTML = `
    <div style="font-weight:600; margin:4px 0 8px 0;">☄️ Meteor (Global)</div>
    
    <div style="font-weight:500; margin:8px 0 4px 0; color:#FF6600;">Area Effects</div>
    <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
      <label style="min-width:84px;">Radius</label>
      <input id="ctxMeteorRadius" type="range" min="60" max="300" step="10" value="${cfg.effectRadius||120}" />
      <span id="ctxMeteorRadiusVal">${cfg.effectRadius||120}px</span>
    </div>
    
    <div style="font-weight:500; margin:8px 0 4px 0; color:#FF4500;">🔥 Particle System</div>
    <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
      <label style="min-width:84px;">Particles</label>
      <input id="ctxMeteorParticles" type="range" min="1" max="8" step="1" value="${cfg.particleCount||3}" />
      <span id="ctxMeteorParticlesVal">${cfg.particleCount||3} per eruption</span>
    </div>
    
    <div style="font-weight:500; margin:8px 0 4px 0; color:#FFD700;">🎆 Trajectory</div>
    <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
      <label style="min-width:84px;">Launch Speed</label>
      <input id="ctxMeteorSpeed" type="range" min="0.5" max="4.0" step="0.1" value="${cfg.launchSpeed||1.7}" />
      <span id="ctxMeteorSpeedVal">${cfg.launchSpeed||1.7}x</span>
    </div>
    <div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
      <label style="min-width:84px;">Arc Height</label>
      <input id="ctxMeteorGravity" type="range" min="0.001" max="0.02" step="0.001" value="${cfg.gravity||0.005}" />
      <span id="ctxMeteorGravityVal">${cfg.gravity||0.005}</span>
    </div>`;
}
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'wall'){
          const t = ctxBody.querySelector('#ctxThick');
          const r = ctxBody.querySelector('#ctxRadius');
          if (t){ const v = parseInt(t.value,10)||24; const el = document.getElementById('thick'); const lab = document.getElementById('thickVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + 'px'; }
          if (r){ const v = parseInt(r.value,10)||14; const el = document.getElementById('radius'); const lab = document.getElementById('radiusVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v); }
        } else if (currentType === 'brush'){
          const s = ctxBody.querySelector('#ctxBrushStep');
          if (s){ const v = parseInt(s.value,10)||6; const el = document.getElementById('brushStep'); const lab = document.getElementById('brushStepVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + 'px'; }
        } else if (currentType === 'arc'){
          const a = ctxBody.querySelector('#ctxArcSpan');
          if (a){ const v = parseInt(a.value,10)||180; const el = document.getElementById('arcSpan'); const lab = document.getElementById('arcSpanVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + '°'; }
        } else if (currentType === 'mud'){
          const ms = ctxBody.querySelector('#ctxMudSlowdown');
          if (ms){ 
            const v = parseFloat(ms.value) || 0.4; 
            const el = document.getElementById('mudSlowdown'); 
            const lab = document.getElementById('mudSlowdownVal'); 
            if (el){ 
              el.value = String(v); 
              el.dispatchEvent(new Event('input')); 
            } 
            if (lab) {
              const percentage = Math.round((1 - v) * 100);
              lab.textContent = percentage + '%'; 
            }
            localStorage.setItem('mudSlowdown', String(v));
          }
        } else if (currentType === 'bumper'){
          const br = ctxBody.querySelector('#ctxBumperRadius');
          const be = ctxBody.querySelector('#ctxBumperElasticity');
          const bn = ctxBody.querySelector('#ctxBumperNoise');
          if (br){ const v = parseInt(br.value,10)||22; const el = document.getElementById('bumperRadius'); const lab = document.getElementById('bumperRadiusVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v); if (window.selected && selected.type==='bumper') selected.r = v; }
          if (be){ const v = parseFloat(be.value)||1.15; const el = document.getElementById('bumperElasticity'); const lab = document.getElementById('bumperElasticityVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v); if (window.selected && selected.type==='bumper') selected.e = v; }
          if (bn){ const v = parseFloat(bn.value)||0.15; const el = document.getElementById('bumperNoise'); const lab = document.getElementById('bumperNoiseVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v); if (window.selected && selected.type==='bumper') selected.noise = v; }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'magnetpull'){
          const mr = ctxBody.querySelector('#ctxMagnetpullRadius');
          const ms = ctxBody.querySelector('#ctxMagnetpullStrength');
          if (mr){ 
            const v = parseInt(mr.value,10)||80; 
            localStorage.setItem('magnetpull_radius', String(v));
            if (window.selected && selected.type==='magnetpull') selected.radius = v;
          }
          if (ms){ 
            const v = parseFloat(ms.value)||2.0; 
            localStorage.setItem('magnetpull_strength', String(v));
            if (window.selected && selected.type==='magnetpull') selected.strength = v;
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'healingpatch'){
          const hr = ctxBody.querySelector('#ctxHealingpatchRadius');
          const hhr = ctxBody.querySelector('#ctxHealingpatchHealRate');
          const hc = ctxBody.querySelector('#ctxHealingpatchCooldown');
          if (hr){ 
            const v = parseInt(hr.value,10)||30; 
            localStorage.setItem('healingpatch_radius', String(v));
            if (window.selected && selected.type==='healingpatch') selected.r = v;
          }
          if (hhr){ 
            const v = parseInt(hhr.value,10)||5; 
            localStorage.setItem('healingpatch_healrate', String(v));
            if (window.selected && selected.type==='healingpatch') selected.healRate = v;
          }
          if (hc){ 
            const v = parseInt(hc.value,10)||1000; 
            localStorage.setItem('healingpatch_cooldown', String(v));
            if (window.selected && selected.type==='healingpatch') selected.cooldown = v;
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'healingzone'){
          const hr = ctxBody.querySelector('#ctxHealingzoneRadius');
          const ha = ctxBody.querySelector('#ctxHealingzoneHealAmount');
          if (hr){ 
            const v = parseInt(hr.value,10)||40; 
            localStorage.setItem('healingzone_radius', String(v));
            if (window.selected && selected.type==='healingzone') selected.r = v;
          }
          if (ha){ 
            const v = parseInt(ha.value,10)||10; 
            localStorage.setItem('healingzone_healamount', String(v));
            if (window.selected && selected.type==='healingzone') selected.healAmount = v;
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'weather'){
          const enabled = ctxBody.querySelector('#ctxWeatherEnabled');
          const type = ctxBody.querySelector('#ctxWeatherType');
          const intensity = ctxBody.querySelector('#ctxWeatherIntensity');
          const windDir = ctxBody.querySelector('#ctxWeatherWindDir');
          
          if (!mapDef.weather) mapDef.weather = { type: 'clear', intensity: 0.5, windDirection: 0, enabled: false };
          
          if (enabled) mapDef.weather.enabled = enabled.checked;
          if (type) mapDef.weather.type = type.value;
          if (intensity) mapDef.weather.intensity = parseFloat(intensity.value) || 0.5;
          if (windDir) mapDef.weather.windDirection = (parseInt(windDir.value, 10) || 0) * Math.PI / 180;
          
          // Save to localStorage
          localStorage.setItem('weather_enabled', String(mapDef.weather.enabled));
          localStorage.setItem('weather_type', mapDef.weather.type);
          localStorage.setItem('weather_intensity', String(mapDef.weather.intensity));
          localStorage.setItem('weather_windDirection', String(mapDef.weather.windDirection));
          
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'fireaura'){
          const fr = ctxBody.querySelector('#ctxFireauraRadius');
          const frange = ctxBody.querySelector('#ctxFireauraRange');
          const fd = ctxBody.querySelector('#ctxFireauraDamage');
          const fdur = ctxBody.querySelector('#ctxFireauraDuration');
          if (fr){ 
            const v = parseInt(fr.value,10)||20; 
            localStorage.setItem('fireaura_radius', String(v));
            if (window.selected && selected.type==='fireaura') selected.r = v;
          }
          if (frange){ 
            const v = parseInt(frange.value,10)||60; 
            localStorage.setItem('fireaura_range', String(v));
            if (window.selected && selected.type==='fireaura') selected.range = v;
          }
          if (fd){ 
            const v = parseInt(fd.value,10)||5; 
            localStorage.setItem('fireaura_damage', String(v));
            if (window.selected && selected.type==='fireaura') selected.damage = v;
          }
          if (fdur){ 
            const v = parseInt(fdur.value,10)||8000; 
            localStorage.setItem('fireaura_duration', String(v));
            if (window.selected && selected.type==='fireaura') selected.duration = v;
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'firetrap'){
          const fr = ctxBody.querySelector('#ctxFiretrapRadius');
          const fd = ctxBody.querySelector('#ctxFiretrapDamage');
          if (fr){ 
            const v = parseInt(fr.value,10)||50; 
            localStorage.setItem('firetrap_radius', String(v));
            if (window.selected && selected.type==='firetrap') selected.r = v;
          }
          if (fd){ 
            const v = parseInt(fd.value,10)||10; 
            localStorage.setItem('firetrap_damage', String(v));
            if (window.selected && selected.type==='firetrap') selected.damage = v;
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'magnetpush'){
          const mr = ctxBody.querySelector('#ctxMagnetpushRadius');
          const ms = ctxBody.querySelector('#ctxMagnetpushStrength');
          if (mr){ 
            const v = parseInt(mr.value,10)||80; 
            localStorage.setItem('magnetpush_radius', String(v));
            if (window.selected && selected.type==='magnetpush') selected.radius = v;
          }
          if (ms){ 
            const v = parseFloat(ms.value)||2.0; 
            localStorage.setItem('magnetpush_strength', String(v));
            if (window.selected && selected.type==='magnetpush') selected.strength = v;
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'spinner'){
          const sp = ctxBody.querySelector('#ctxSpinnerSpeed');
          const sa = ctxBody.querySelector('#ctxSpinnerAngle');
          const sl = ctxBody.querySelector('#ctxSpinnerLength');
          if (sp){ const v = parseFloat(sp.value)||1.0; const el = document.getElementById('spinnerSpeed'); const lab = document.getElementById('spinnerSpeedVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v.toFixed(1); if (window.selected && selected.type==='spinner') selected.speed = v; }
          if (sa){ const v = parseInt(sa.value,10)||0; const el = document.getElementById('spinnerAngle'); const lab = document.getElementById('spinnerAngleVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v)+'°'; if (window.selected && selected.type==='spinner') selected.angle = v * Math.PI / 180; }
          if (sl){ const v = parseInt(sl.value,10)||80; const el = document.getElementById('spinnerLength'); const lab = document.getElementById('spinnerLengthVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v)+'px'; if (window.selected && selected.type==='spinner') selected.w = v; }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'rotbarrier'){
          const ps = ctxBody.querySelector('#ctxPendulumSpeed');
          const pr = ctxBody.querySelector('#ctxPendulumRange');
          const pl = ctxBody.querySelector('#ctxPendulumLength');
          if (ps){ 
            const v = parseFloat(ps.value)||1.2; 
            localStorage.setItem('pendulumSpeed', String(v));
            if (window.selected && selected.type==='rotbarrier') {
              selected.swingSpeed = v;
            }
          }
          if (pr){ 
            const v = parseInt(pr.value,10)||72; 
            localStorage.setItem('pendulumRange', String(v));
            if (window.selected && selected.type==='rotbarrier') {
              selected.swingRange = v * Math.PI / 180;
            }
          }
          if (pl){ 
            const v = parseInt(pl.value,10)||150; 
            localStorage.setItem('pendulumLength', String(v));
            if (window.selected && selected.type==='rotbarrier') {
              selected.length = v;
            }
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'magnetpull'){
          const radius = ctxBody.querySelector('#ctxMagnetRadius');
          const strength = ctxBody.querySelector('#ctxMagnetStrength');
          if (radius){ 
            const v = parseInt(radius.value,10)||80; 
            localStorage.setItem('magnetpull_radius', String(v));
            if (window.selected && selected.type==='magnetpull') {
              selected.radius = v;
            }
          }
          if (strength){ 
            const v = parseFloat(strength.value)||2.0; 
            localStorage.setItem('magnetpull_strength', String(v));
            if (window.selected && selected.type==='magnetpull') {
              selected.strength = v;
            }
          }
          try { invalidateStaticLayer(); drawMap(); } catch {}
        } else if (currentType === 'diag' || currentType === 'semi'){
          const t = ctxBody.querySelector('#ctxThick');
          const r = ctxBody.querySelector('#ctxRadius');
          if (t){ const v = parseInt(t.value,10)||24; const el = document.getElementById('thick'); const lab = document.getElementById('thickVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + 'px'; }
          if (r){ const v = parseInt(r.value,10)||14; const el = document.getElementById('radius'); const lab = document.getElementById('radiusVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v); }
        } else if (currentType === 'ebrush'){
          const s = ctxBody.querySelector('#ctxBrushStep');
          if (s){ const v = parseInt(s.value,10)||6; const el = document.getElementById('brushStep'); const lab = document.getElementById('brushStepVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + 'px'; }
        } else if (currentType === 'spawn'){
          const j = ctxBody.querySelector('#ctxSpawnJitter');
          if (j){ const v = parseInt(j.value,10)||0; const el = document.getElementById('spawnJitter'); const lab = document.getElementById('spawnJitterVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + 'px'; }
        } else if (currentType === 'start'){
          const s = ctxBody.querySelector('#ctxStartBias');
          if (s){ const v = parseInt(s.value,10)||0; const el = document.getElementById('startBias'); const lab = document.getElementById('startBiasVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = v + 'ms'; }
        } else if (currentType === 'carrotA' || currentType === 'carrotB'){
          const c = ctxBody.querySelector('#ctxCarrotRadius');
          if (c){ const v = parseInt(c.value,10)||30; const el = document.getElementById('carrotRadius'); const lab = document.getElementById('carrotRadiusVal'); if (el){ el.value=String(v); el.dispatchEvent(new Event('input')); } if (lab) lab.textContent = String(v); }
        } else if (currentType === 'breakwall'){
          // Debug logging removed
          const hp = ctxBody.querySelector('#ctxBreakHp');
          const on = ctxBody.querySelector('#ctxBreakOn');
          if (!mapDef.breakWallSettings) mapDef.breakWallSettings = {hp:8,on:'shards'};
          if (hp){ 
            const newHp = parseInt(hp.value,10)||8;
            // Debug logging removed
            mapDef.breakWallSettings.hp = newHp; 
            try{ localStorage.setItem('breakHp', String(newHp)); }catch(err){ console.error('[Context] Failed to save breakHp:', err); }
            const el=document.getElementById('breakHp'); const lab=document.getElementById('breakHpVal'); 
            if (el){ el.value=String(newHp); el.dispatchEvent(new Event('input')); } 
            if (lab) lab.textContent=String(newHp); 
          }
          if (on){ 
            const newOn = on.value==='remove'?'remove':'shards';
            // Debug logging removed
            mapDef.breakWallSettings.on = newOn; 
            try{ localStorage.setItem('breakOn', newOn); }catch(err){ console.error('[Context] Failed to save breakOn:', err); }
            const el=document.getElementById('breakOn'); 
            if (el){ el.value = newOn; el.dispatchEvent(new Event('change')); } 
          }
        } else if (currentType === 'softwall'){
          // Debug logging removed
          const st = ctxBody.querySelector('#ctxSoftStiff');
          const md = ctxBody.querySelector('#ctxSoftMaxDef');
          const rc = ctxBody.querySelector('#ctxSoftRecover');
          if (!mapDef.softWallSettings) mapDef.softWallSettings = {stiffness:0.25,maxDeform:18,recover:24};
          if (st){ 
            const newStiff = parseFloat(st.value)||0.25;
            console.log('[Context] Setting softwall stiffness to:', newStiff);
            mapDef.softWallSettings.stiffness = Math.max(0.05, Math.min(999, newStiff)); 
            try{ localStorage.setItem('softStiff', String(mapDef.softWallSettings.stiffness)); console.log('[Context] Saved softStiff to localStorage'); }catch(err){ console.error('[Context] Failed to save softStiff:', err); }
            const el=document.getElementById('softStiff'); const lab=document.getElementById('softStiffVal'); 
            if (el){ el.value=String(newStiff); el.dispatchEvent(new Event('input')); } 
            if (lab) lab.textContent = newStiff.toFixed(2); 
          }
          if (md){ 
            const newMaxDef = parseInt(md.value,10)||18;
            console.log('[Context] Setting softwall maxDeform to:', newMaxDef);
            mapDef.softWallSettings.maxDeform = Math.max(4, Math.min(999, newMaxDef)); 
            try{ localStorage.setItem('softMaxDef', String(mapDef.softWallSettings.maxDeform)); console.log('[Context] Saved softMaxDef to localStorage'); }catch(err){ console.error('[Context] Failed to save softMaxDef:', err); }
            const el=document.getElementById('softMaxDef'); const lab=document.getElementById('softMaxDefVal'); 
            if (el){ el.value=String(newMaxDef); el.dispatchEvent(new Event('input')); } 
            if (lab) lab.textContent = newMaxDef + 'px'; 
          }
          if (rc){ 
            const newRecover = Math.max(0, parseInt(rc.value,10)||0);
            console.log('[Context] Setting softwall recover to:', newRecover);
            mapDef.softWallSettings.recover = newRecover; 
            try{ localStorage.setItem('softRecover', String(newRecover)); console.log('[Context] Saved softRecover to localStorage'); }catch(err){ console.error('[Context] Failed to save softRecover:', err); }
            const el=document.getElementById('softRecover'); const lab=document.getElementById('softRecoverVal'); 
            if (el){ el.value=String(newRecover); el.dispatchEvent(new Event('input')); } 
            if (lab) lab.textContent = newRecover + 'px/s';
            // Propagate to existing soft strokes so changes apply immediately
            try {
              let propagated = 0;
              for (const sb of (mapDef.brushes||[])){
                if (sb && sb.type === 'soft') {
                  sb.recover = newRecover;
                  propagated++;
                }
              }
              console.log('[Context] Propagated recover to', propagated, 'existing soft strokes');
            } catch (err) {
              console.error('[Context] Failed to propagate recover:', err);
            }
          }
        } else if (currentType === 'trap') {
          console.log('[Context] Applying trap settings');
          const dur = ctxBody.querySelector('#ctxTrapDuration');
          const slow = ctxBody.querySelector('#ctxTrapSlow');
          const c = ctxBody.querySelector('#ctxTrapConsumable');
          if (!mapDef.trapSettings) mapDef.trapSettings = { durationMs: 3000, slowMultiplier: 0.5, consumable: false };
          if (dur) {
            const newDur = parseInt(dur.value, 10) || 3000;
            console.log('[Context] Setting trap duration to:', newDur);
            mapDef.trapSettings.durationMs = Math.max(1000, Math.min(8000, newDur));
            try { localStorage.setItem('trapDuration', String(mapDef.trapSettings.durationMs)); } catch (err) { console.error('[Context] Failed to save trapDuration:', err); }
          }
          if (slow) {
            const newSlow = parseFloat(slow.value) || 0.5;
            console.log('[Context] Setting trap slowMultiplier to:', newSlow);
            mapDef.trapSettings.slowMultiplier = Math.max(0.1, Math.min(0.9, newSlow));
            try { localStorage.setItem('trapSlowMultiplier', String(mapDef.trapSettings.slowMultiplier)); } catch (err) { console.error('[Context] Failed to save trapSlowMultiplier:', err); }
          }
          if (c) {
            mapDef.trapSettings.consumable = !!c.checked;
            try { localStorage.setItem('trapConsumable', JSON.stringify(mapDef.trapSettings.consumable)); } catch (err) { console.error('[Context] Failed to save trapConsumable:', err); }
          }
        } else if (currentType === 'ram'){
          console.log('[Context] Applying ram settings');
          const dur = ctxBody.querySelector('#ctxRamDuration');
          const rng = ctxBody.querySelector('#ctxRamRange');
          const c = ctxBody.querySelector('#ctxRamConsumable');
          if (!mapDef.ramSettings) mapDef.ramSettings = { durationMs: 4000, range: 25, consumable: true };
          if (dur){ 
            const newDur = parseInt(dur.value,10)||4000;
            console.log('[Context] Setting ram duration to:', newDur);
            mapDef.ramSettings.durationMs = Math.max(1000, Math.min(10000, newDur)); 
            try{ localStorage.setItem('ramDuration', String(mapDef.ramSettings.durationMs)); console.log('[Context] Saved ramDuration to localStorage'); }catch(err){ console.error('[Context] Failed to save ramDuration:', err); }
          }
          if (rng){ 
            const newRange = parseInt(rng.value,10)||25;
            console.log('[Context] Setting ram range to:', newRange);
            mapDef.ramSettings.range = Math.max(15, Math.min(50, newRange)); 
            try{ localStorage.setItem('ramRange', String(mapDef.ramSettings.range)); console.log('[Context] Saved ramRange to localStorage'); }catch(err){ console.error('[Context] Failed to save ramRange:', err); }
          }
          if (c){ 
            mapDef.ramSettings.consumable = !!c.checked; 
            try{ localStorage.setItem('ramConsumable', JSON.stringify(mapDef.ramSettings.consumable)); }catch(err){ console.error('[Context] Failed to save ramConsumable:', err); }
          }
        } else if (currentType === 'warpzone'){
          mapDef.warpzoneSettings = mapDef.warpzoneSettings || { cooldownMs: 500, minDistance: 50, teleportOffset: 25, consumable: false };
          const cooldown = ctxBody.querySelector('#ctxWarpCooldown');
          const minDist = ctxBody.querySelector('#ctxWarpMinDist');
          const offset = ctxBody.querySelector('#ctxWarpOffset');
          // Consumable checkbox removed - warpzone is permanent
          
          if (cooldown){ mapDef.warpzoneSettings.cooldownMs = parseInt(cooldown.value,10)||500; localStorage.setItem('warpzoneCooldown', String(mapDef.warpzoneSettings.cooldownMs)); }
          if (minDist){ mapDef.warpzoneSettings.minDistance = parseInt(minDist.value,10)||50; localStorage.setItem('warpzoneMinDistance', String(mapDef.warpzoneSettings.minDistance)); }
          if (offset){ mapDef.warpzoneSettings.teleportOffset = parseInt(offset.value,10)||25; localStorage.setItem('warpzoneTeleportOffset', String(mapDef.warpzoneSettings.teleportOffset)); }
          // Consumable setting removed - warpzone is permanent
        } else if (currentType === 'quantumdash'){
          mapDef.quantumdashSettings = mapDef.quantumdashSettings || { durationMs: 2500, speedMultiplier: 3.0, phaseEnabled: true, consumable: true };
          const duration = ctxBody.querySelector('#ctxQuantumDuration');
          const speed = ctxBody.querySelector('#ctxQuantumSpeed');
          const phase = ctxBody.querySelector('#ctxQuantumPhase');
          const consumable = ctxBody.querySelector('#ctxQuantumConsumable');
          
          if (duration){ mapDef.quantumdashSettings.durationMs = parseInt(duration.value,10)||2500; localStorage.setItem('quantumdashDuration', String(mapDef.quantumdashSettings.durationMs)); }
          if (speed){ mapDef.quantumdashSettings.speedMultiplier = parseFloat(speed.value)||3.0; localStorage.setItem('quantumdashSpeedMultiplier', String(mapDef.quantumdashSettings.speedMultiplier)); }
          if (phase){ mapDef.quantumdashSettings.phaseEnabled = !!phase.checked; localStorage.setItem('quantumdashPhaseEnabled', JSON.stringify(mapDef.quantumdashSettings.phaseEnabled)); }
          if (consumable){ mapDef.quantumdashSettings.consumable = !!consumable.checked; localStorage.setItem('quantumdashConsumable', JSON.stringify(mapDef.quantumdashSettings.consumable)); }
        }
        // Confirmation toast
        console.log('[Context] Apply completed successfully');
        try { if (typeof toast === 'function') toast('✓ Đã lưu Context Settings'); else console.log('[Context] Toast not available, but settings saved'); } catch (toastErr) { console.warn('[Context] Toast failed:', toastErr); }
      } catch (err) {
        console.error('[Context] Apply failed:', err);
        try { if (typeof toast === 'function') toast('❌ Lỗi khi lưu Context Settings'); } catch {}
      }
      closeCtx();
    };
  }

  function closeCtx(){ ctx.style.display = 'none'; currentType = null; }
  ctxClose.addEventListener('click', closeCtx);
  document.addEventListener('mousedown', (e)=>{ if (ctx.style.display==='block' && !ctx.contains(e.target)) closeCtx(); });

  function attach(toolEl, type){
    if (!toolEl) return;
    toolEl.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      try { console.debug('[Context] right-click tool', type); } catch {}
      // Open regardless of mode to avoid missing due to mode issues
      openCtx(type, e.clientX, e.clientY);
    });
    toolEl.addEventListener('dblclick', (e)=>{
      try { console.debug('[Context] dblclick tool', type); } catch {}
      const r = toolEl.getBoundingClientRect();
      openCtx(type, e.clientX||r.right, e.clientY||r.bottom);
    });
    toolEl.addEventListener('click', (e)=>{
      if (!e.altKey) return;
      try { console.debug('[Context] Alt+Click tool', type); } catch {}
      const r = toolEl.getBoundingClientRect();
      openCtx(type, e.clientX||r.right, e.clientY||r.bottom);
    });
  }
  attach(tools.firetrap,'firetrap');
  attach(tools.fireaura,'fireaura');
  attach(tools.magnet,'magnet');
  attach(tools.turbo,'turbo');
  attach(tools.shield,'shield');
  attach(tools.timefreeze,'timefreeze');
  attach(tools.teleport,'teleport');
  attach(tools.boost,'boost');
  attach(tools.ghost,'ghost');
  attach(tools.poison,'poison');
  attach(tools.trap,'trap');
  attach(tools.lightning);
  attach(tools.tornado,'tornado');
  attach(tools.volcano,'volcano');
  attach(tools.wall,'wall');
  attach(tools.brush,'brush');
  attach(tools.arc,'arc');
  attach(tools.bumper,'bumper');
  attach(tools.spinner,'spinner');
  attach(tools.rotbarrier,'rotbarrier');
  attach(tools.magnetpull,'magnetpull');
  attach(tools.magnetpush,'magnetpush');
  attach(tools.breakwall,'breakwall');
  attach(tools.softwall,'softwall');
  attach(tools.ram,'ram');
  attach(tools.healingzone,'healingzone');
  attach(tools.weather,'weather');

  // Delegated handlers for any tool element (covers cases where specific queries miss)
  document.addEventListener('contextmenu', (e)=>{
    const el = e.target && e.target.closest ? e.target.closest('.tool') : null;
    if (!el) return;
    const t = el.getAttribute('data-tool');
    const supported = ['magnet','turbo','shield','timefreeze','icefreezer','testpower','teleport','boost','ghost','poison','warpzone','quantumdash','nebula','yellowheart','wall','brush','arc','bumper','spinner','rotbarrier','magnetpull','magnetpush','diag','semi','ebrush','spawn','start','carrotA','carrotB','breakwall','softwall','ram','mud','healingpatch','healingzone','weather'];
    if (supported.includes(t)){
      e.preventDefault();
      try { console.debug('[Context] delegated right-click tool', t); } catch {}
      openCtx(t, e.clientX, e.clientY);
    }
  }, true);
  document.addEventListener('dblclick', (e)=>{
    const el = e.target && e.target.closest ? e.target.closest('.tool') : null;
    if (!el) return;
    const t = el.getAttribute('data-tool');
    const supported = ['magnet','turbo','shield','timefreeze','icefreezer','testpower','teleport','boost','ghost','poison','warpzone','quantumdash','nebula','yellowheart','wall','brush','arc','bumper','spinner','rotbarrier','diag','semi','ebrush','spawn','start','carrotA','carrotB','ram','mud','healingpatch','healingzone','weather'];
    if (supported.includes(t)){
      try { console.debug('[Context] delegated dblclick tool', t); } catch {}
      const r = el.getBoundingClientRect();
      openCtx(t, e.clientX||r.right, e.clientY||r.bottom);
    }
  }, true);

  // Also open on right-click over canvas/editor area based on current selection type
  document.addEventListener('contextmenu', (e)=>{
    try {
      if (typeof mode === 'undefined' || mode !== 'editor') return;
      // If the target is one of our tool buttons, let the specific handler run
      const t = e.target;
      if (t && t.classList && t.classList.contains('tool')) return;
      if (!window.selected || !selected.type) return;
      const st = String(selected.type);
      const contextMapping = {
        magnet:'magnet', turbo:'turbo', shield:'shield', timefreeze:'timefreeze', icefreezer:'icefreezer', testpower:'testpower', teleport:'teleport', boost:'boost', ghost:'ghost', poison:'poison', lightning:'lightning', tornado:'tornado', volcano:'volcano', warpzone:'warpzone', quantumdash:'quantumdash', wall:'wall', brush:'brush', arc:'arc', bumper:'bumper', spinner:'spinner', diag:'diag', semi:'semi', ebrush:'ebrush', spawn:'spawn', start:'start', carrotA:'carrotA', carrotB:'carrotB', breakwall:'breakwall', softwall:'softwall', ram:'ram', mud:'mud', rotbarrier:'rotbarrier', magnetpull:'magnetpull', magnetpush:'magnetpush'
      };
      if (contextMapping[st]){
        // Prevent default browser menu and open our context popup at pointer
        e.preventDefault();
        openCtx(contextMapping[st], e.clientX, e.clientY);
      }
    } catch {}
  }, true);
})();
spinnerAngleEl.addEventListener('input', () => {
  const angle = parseInt(spinnerAngleEl.value, 10);
  spinnerAngleVal.textContent = angle + '°';
  if (selected && selected.type === 'spinner') {
    selected.angle = angle * Math.PI / 180; // Convert to radians for consistency
  }
});
horseRadiusEl.addEventListener('input', ()=>horseRadiusVal.textContent = horseRadiusEl.value);

// Carrot sprite controls listeners
carrotSpriteScale.addEventListener('input', () => {
  const scale = carrotSpriteScale.value;
  carrotSpriteScaleVal.textContent = parseFloat(scale).toFixed(2)+'×';
  mapDef.carrots.forEach(c => c.scale = scale);
});
carrotSpriteOutline.addEventListener('change', () => {
  const outline = carrotSpriteOutline.value;
  mapDef.carrots.forEach(c => c.outline = outline);
});
carrotSpriteOutlineColor.addEventListener('input', () => {
  const color = carrotSpriteOutlineColor.value;
  mapDef.carrots.forEach(c => c.outlineColor = color);
});
carrotSpriteOutlineWidth.addEventListener('input', () => {
  const width = carrotSpriteOutlineWidth.value;
  carrotSpriteOutlineWidthVal.textContent = width + 'px';
  mapDef.carrots.forEach(c => c.outlineWidth = width);
});
gridVal.textContent = gridEl.value+"px"; radiusVal.textContent = radiusEl.value; thickVal.textContent = thickEl.value+"px"; arcSpanVal.textContent=arcSpanEl.value+"°"; brushStepVal.textContent=brushStepEl.value+"px"; spawnJitterVal.textContent = spawnJitterEl.value+"px"; startBiasVal.textContent = startBiasEl.value+"ms";

// Carrot toggle
// Old carrot event listeners removed - now handled by new carrot system

carrotSpriteFile.addEventListener('change', ev => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    // Apply to enabled carrots
    const carrotA = mapDef.carrots.find(c => c.id === 'A');
    const carrotB = mapDef.carrots.find(c => c.id === 'B');
    
    if (carrotA) carrotA.sprite = e.target.result;
    if (carrotB) carrotB.sprite = e.target.result;
    
    if (carrotA || carrotB) {
      rebuildCarrotSpriteCaches();
      startMainLoop();
      toast('Đã tải sprite cho cà rốt');
    } else {
      toast('Cần bật ít nhất một carrot trước khi tải sprite');
    }
  };
  reader.readAsDataURL(f);
});

// Carrot sprite system - MOVED TO: scripts/core/carrot-sprite-manager.js
// Access via: window.CarrotSpriteManager or window.carrotSpriteImg, window.rebuildCarrotSpriteCaches() for compatibility
var carrotSpriteImg = window.carrotSpriteImg || null;

// Carrot PNG loader (default sprite for all carrots unless overridden per-carrot)
const carrotSpriteFileEl = document.getElementById('carrotSpriteFile');
if (carrotSpriteFileEl) carrotSpriteFileEl.addEventListener('change', ev => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    // Persist in mapDef so it exports/saves with the map
    mapDef.carrotSprite = e.target.result; // base64 data URL
    // Also persist locally so it auto-loads next time without re-importing map
    try { localStorage.setItem('carrotSprite', mapDef.carrotSprite); } catch {}
    // Build cache image
    carrotSpriteImg = new Image();
    carrotSpriteImg.onload = ()=>{ invalidateStaticLayer(); drawMap(); toast('Đã đặt PNG cho carrot mặc định'); };
    carrotSpriteImg.src = mapDef.carrotSprite;
  };
  reader.readAsDataURL(f);
});

// Carrot sprite initialization - MOVED TO: scripts/core/carrot-sprite-manager.js
const clearCarrotSpriteABtn = document.getElementById('clearCarrotSpriteA');
if (clearCarrotSpriteABtn) clearCarrotSpriteABtn.addEventListener('click', () => {
  const carrotA = mapDef.carrots.find(c => c.id === 'A');
  if (carrotA) {
    delete carrotA.sprite;
    delete carrotA._img;
    rebuildCarrotSpriteCaches();
    invalidateStaticLayer();
    drawMap();
    toast('Đã xoá sprite cho Carrot A');
  } else {
    toast('Carrot A chưa được bật');
  }
});
const clearCarrotSpriteBBtn = document.getElementById('clearCarrotSpriteB');
if (clearCarrotSpriteBBtn) clearCarrotSpriteBBtn.addEventListener('click', () => {
  const carrotB = mapDef.carrots.find(c => c.id === 'B');
  if (carrotB) {
    delete carrotB.sprite;
    delete carrotB._img;
    rebuildCarrotSpriteCaches();
    invalidateStaticLayer();
    drawMap();
    toast('Đã xoá sprite cho Carrot B');
  } else {
    toast('Carrot B chưa được bật');
  }
});
const swapCarrotsBtn = document.getElementById('swapCarrots');
if (swapCarrotsBtn) swapCarrotsBtn.addEventListener('click', ()=>{
  try { pushHistory('swapCarrots'); } catch {}
  const A = mapDef.carrots.find(c => c.id === 'A');
  const B = mapDef.carrots.find(c => c.id === 'B');
  if (A && B) {
    const tmp = { x: A.x, y: A.y };
    A.x = B.x; A.y = B.y; B.x = tmp.x; B.y = tmp.y;
    invalidateStaticLayer();
    drawMap();
    toast('Đã hoán đổi vị trí Carrot A ↔ B');
  } else {
    toast('Cần bật cả carrot A và B để hoán đổi');
  }
});
const resetCarrotsBtn = document.getElementById('resetCarrots');
if (resetCarrotsBtn) resetCarrotsBtn.addEventListener('click', ()=>{
  try { pushHistory('resetCarrots'); } catch {}
  const A = mapDef.carrots.find(c => c.id === 'A');
  const B = mapDef.carrots.find(c => c.id === 'B');
  if (A) { A.x=1120; A.y=820; }
  if (B) { B.x=980; B.y=820; }
  invalidateStaticLayer();
  drawMap();
  toast('Đã đặt lại vị trí carrot mặc định');
});
function updateCarrotHUD(){
  if (!mapDef.carrots || mapDef.carrots.length === 0) {
    DOMCache.setText(DOMCache.elements.carrotActive, 'None');
    return;
  }
  
  const carrotA = mapDef.carrots.find(c => c.id === 'A');
  const carrotB = mapDef.carrots.find(c => c.id === 'B');
  
  let active = '';
  if (carrotA && carrotB) {
    active = 'A+B';
  } else if (carrotA) {
    active = 'A';
  } else if (carrotB) {
    active = 'B';
  } else {
    active = 'None';
  }
  
  DOMCache.setText(DOMCache.elements.carrotActive, active);
}
// Make globally accessible for race.js
window.updateCarrotHUD = updateCarrotHUD;

// ===== Palettes & Custom Horse UI =====
const horseIdxEl = document.getElementById('horseIdx');
const horseNameEl = document.getElementById('horseName');
const colorBodyEl = document.getElementById('colorBody');
const colorLabelEl = document.getElementById('colorLabel');
const swBody = document.getElementById('swBody');
const swLabel = document.getElementById('swLabel');
const spriteFile = document.getElementById('spriteFile');
const spriteScale = document.getElementById('spriteScale');
const spriteScaleVal = document.getElementById('spriteScaleVal');
const spriteOutline = document.getElementById('spriteOutline');
const spriteOutlineColor = document.getElementById('spriteOutlineColor');
const spriteOutlineWidth = document.getElementById('spriteOutlineWidth');
const spriteOutlineWidthVal = document.getElementById('spriteOutlineWidthVal');
const horseSkillEl = document.getElementById('horseSkill');
const clearSpriteBtn = document.getElementById('clearSprite');
// ===== Sliders for N / Speed / Countdown (match custom look) =====
const nEl = document.getElementById('n');
const nValEl = document.getElementById('nVal');
const speedEl = document.getElementById('speed');
const speedValEditor = document.getElementById('speedValEditor');
const countdownEl = document.getElementById('countdownSlider'); // Fixed: use correct slider ID
const countdownValEl = document.getElementById('countdownVal');

function syncBasicControlsUI(){
  const nValSafe = nEl ? String(nEl.value || '8') : '8';
  if (nValEl) nValEl.textContent = nValSafe;
  const speedValSafe = speedEl ? String(speedEl.value || '1') + '×' : '1×';
  if (speedValEditor) speedValEditor.textContent = speedValSafe;
  const cdVal = countdownEl ? parseInt(countdownEl.value || '3') : 3;
  const countdownValSafe = cdVal === 0 ? '0s (Instant)' : cdVal + 's';
  if (countdownValEl) countdownValEl.textContent = countdownValSafe;
  if (typeof horseIdxEl !== 'undefined' && horseIdxEl && nEl) {
    horseIdxEl.max = parseInt(nEl.value || '8', 10);
  }
}
[nEl, speedEl, countdownEl].forEach(el => {
  el && el.addEventListener('input', syncBasicControlsUI);
});
syncBasicControlsUI();

// Add horse speed slider event listener (base speed - after speedEl is declared)
if (speedEl && speedValEditor) {
  // Load saved horse speed from localStorage
  const savedHorseSpeed = localStorage.getItem('editorHorseSpeed');
  if (savedHorseSpeed) {
    const speed = parseFloat(savedHorseSpeed) || 1.0;
    speedEl.value = speed;
    speedValEditor.textContent = speed.toFixed(1) + '×';
    mapDef.horseSpeed = speed;
    console.log(`🐎 Loaded Horse Speed: ${speed}`);
  }
  
  speedEl.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value) || 1.0;
    speedValEditor.textContent = speed.toFixed(1) + '×';
    mapDef.horseSpeed = speed; // Save to mapDef
    localStorage.setItem('editorHorseSpeed', String(speed));
    console.log(`🐎 Map Editor Horse Speed: ${speed}`);
  });
}

// Add max horse speed slider event listener (limit - after elements are declared)
const maxHorseSpeedEl = document.getElementById('maxHorseSpeed');
const maxHorseSpeedVal = document.getElementById('maxHorseSpeedVal');
if (maxHorseSpeedEl && maxHorseSpeedVal) {
  // Load saved max horse speed from localStorage
  const savedMaxSpeed = localStorage.getItem('editorMaxHorseSpeed');
  if (savedMaxSpeed) {
    const maxSpeed = parseFloat(savedMaxSpeed) || 4.0;
    maxHorseSpeedEl.value = maxSpeed;
    maxHorseSpeedVal.textContent = maxSpeed.toFixed(1) + '×';
    mapDef.maxHorseSpeed = maxSpeed;
    console.log(`🐎 Loaded Max Horse Speed: ${maxSpeed}`);
  } else {
    mapDef.maxHorseSpeed = 4.0;
  }
  
  maxHorseSpeedEl.addEventListener('input', (e) => {
    const maxSpeed = parseFloat(e.target.value) || 4.0;
    maxHorseSpeedVal.textContent = maxSpeed.toFixed(1) + '×';
    mapDef.maxHorseSpeed = maxSpeed; // Save to mapDef
    localStorage.setItem('editorMaxHorseSpeed', String(maxSpeed));
    console.log(`🐎 Map Editor Max Horse Speed: ${maxSpeed}`);
  });
}

function updateSwatches(){ swBody.style.background=colorBodyEl.value; swLabel.style.background=colorLabelEl.value; }
[colorBodyEl,colorLabelEl].forEach(el=>el.addEventListener('input', updateSwatches)); updateSwatches();
spriteScale.addEventListener('input', ()=> spriteScaleVal.textContent = parseFloat(spriteScale.value).toFixed(2)+'×' );
spriteOutlineWidth.addEventListener('input', ()=> spriteOutlineWidthVal.textContent = spriteOutlineWidth.value+'px' );

// --- Auto-apply Custom Horse changes (debounced) ---
function debounce(fn, ms){ let t; return function(){ clearTimeout(t); const self=this, args=arguments; t=setTimeout(()=>fn.apply(self,args), ms); }; }
const autoApply = debounce(()=>{
  // Silence toast during auto-apply to avoid spam
  const oldToast = window.toast;
  window.toast = function(){};
  try { applyHorseFromUI(); } catch {}
  window.toast = oldToast;
}, 160);

function bindAutoApply(){
  if (!horseIdxEl) return;
  // Changing selected horse index loads its values; don't auto-apply on index change
  horseIdxEl.addEventListener('input', ()=>{ try{ loadHorseToUI(); }catch{} });
  if (horseNameEl) horseNameEl.addEventListener('input', autoApply);
  if (colorBodyEl) colorBodyEl.addEventListener('input', autoApply);
  if (colorLabelEl) colorLabelEl.addEventListener('input', autoApply);
  if (typeof spriteScale !== 'undefined' && spriteScale) spriteScale.addEventListener('input', autoApply);
  if (typeof spriteOutline !== 'undefined' && spriteOutline) spriteOutline.addEventListener('change', autoApply);
  if (typeof spriteOutlineColor !== 'undefined' && spriteOutlineColor) spriteOutlineColor.addEventListener('input', autoApply);
  if (typeof spriteOutlineWidth !== 'undefined' && spriteOutlineWidth) spriteOutlineWidth.addEventListener('input', autoApply);
  if (typeof horseSkillEl !== 'undefined' && horseSkillEl) {
    horseSkillEl.addEventListener('input', autoApply);
    horseSkillEl.addEventListener('change', autoApply);
  }
  // spriteFile input likely triggers async image load elsewhere; we leave it as-is
}

// Skill descriptions for info button
const skillDescriptions = {
  none: { vi: "Không có kỹ năng đặc biệt", en: "No special ability" },
  hunter: { vi: "RAM 15s, TIÊU DIỆT ngựa va chạm. Không giết ai = -50% tốc độ. CD: 90s", en: "RAM 15s, KILL horse on collision. No kill = -50% speed. CD: 90s" },
  guardian: { vi: "Khiên vĩnh viễn chặn 1 hiệu ứng tiêu cực. Kích hoạt ngay. CD: 60s", en: "Permanent shield blocks 1 negative effect. Instant. CD: 60s" },
  phantom_strike: { vi: "Bóng ma 5s, xuyên qua ngựa khác, có thể tấn công khi vô hình. CD: 85s", en: "Ghost 5s, phase through, can attack while invisible. CD: 85s" },
  cosmic_swap: { vi: "Đóng băng TẤT CẢ ngựa 1s, dịch chuyển đến ngựa xa nhất. CD: 80s", en: "Freeze ALL horses 1s, teleport to farthest horse. CD: 80s" },
  chain_lightning: { vi: "Sét nhảy 4 ngựa (180 bán kính), choáng 2.5s + chậm 55% trong 3.5s. CD: 42s", en: "Lightning jumps 4 horses, stun 2.5s + 55% slow 3.5s. CD: 42s" },
  gravity_well: { vi: "Vùng hấp dẫn (150 bán kính) kéo ngựa khác về trong 5s. CD: 45s", en: "Gravity field (150 radius) pulls horses for 5s. CD: 45s" },
  chill_guy: { vi: "THỤ ĐỘNG: Miễn nhiễm boost và ghost pickup (bỏ qua chúng)", en: "PASSIVE: Immune to boost and ghost pickups" },
  overdrive: { vi: "+60% tốc độ 5s, sau đó quá nhiệt -25% tốc độ 5s. CD: 50s", en: "+60% speed 5s, then -25% overheat 5s. CD: 50s" },
  slipstream: { vi: "+40% tốc độ 6s, để lại vệt khí +25% cho ngựa đi sau. CD: 55s", en: "+40% speed 6s, trail gives +25% to followers. CD: 55s" },
  shockwave: { vi: "Vòng sóng 7s đẩy lùi và -30% tốc độ ngựa tại vành sóng. CD: 45s", en: "Ring 7s pushes and -30% slow at wavefront. CD: 45s" },
  oguri_fat: { vi: "x2 tốc độ, x1.5 sát thương va chạm, aura lửa 5s. CD: 60s", en: "x2 speed, x1.5 collision damage, fire aura 5s. CD: 60s" },
  silence_shizuka: { vi: "Aura xanh hồi 5 HP/giây trong 10s (tổng 50 HP). CD: 45s", en: "Blue aura heals 5 HP/sec for 10s (50 HP total). CD: 45s" },
  fireball: { vi: "3 quả cầu lửa xoay quanh 8s, va chạm gây -10 HP. CD: 40s", en: "3 fireballs orbit for 8s, collision deals -10 HP. CD: 40s" },
  energy_ball: { vi: "Bắn quả cầu năng lượng nảy trong map, đẩy lùi và gây -1 HP liên tục. CD: 35s", en: "Fires bouncing energy ball, pushes and deals -1 HP continuously. CD: 35s" },
  supersonic_speed: { vi: "Siêu tốc x10 trong 4s, sau đó giảm còn 0.5x và phục hồi dần trong 15s. CD: 60s", en: "x10 speed for 4s, then 0.5x speed recovering over 15s. CD: 60s" }
};

// Skill description auto-update (always visible)
(function initSkillInfo() {
  const skillDescEl = document.getElementById('skillDesc');
  const horseSkillEl = document.getElementById('horseSkill');
  
  if (!skillDescEl || !horseSkillEl) return;
  
  function updateSkillDesc() {
    const skill = horseSkillEl.value || 'none';
    const desc = skillDescriptions[skill];
    if (desc) {
      const lang = (typeof window.currentLang === 'string' && window.currentLang === 'en') ? 'en' : 'vi';
      skillDescEl.textContent = desc[lang] || desc.vi;
    } else {
      skillDescEl.textContent = 'Không có mô tả';
    }
  }
  
  // Update on skill change
  horseSkillEl.addEventListener('change', updateSkillDesc);
  horseSkillEl.addEventListener('input', updateSkillDesc);
  
  // Initial update
  updateSkillDesc();
})();
try { bindAutoApply(); } catch {}

document.getElementById('undo').addEventListener('click', ()=>{
  // Use centralized undo system
  try { undo(); } catch {}
});
// Optional: Redo button if present
(function(){
  const redoBtnEl = document.getElementById('redo');
  if (redoBtnEl) {
    redoBtnEl.addEventListener('click', ()=>{ try { redo(); } catch {} });
  }
  // Initialize button states
  try { updateHistoryButtons(); } catch {}
})();
document.getElementById('clearWalls').addEventListener('click', ()=>{
  try { pushHistory('clear_walls'); } catch {}
  mapDef.walls.length = 0; mapDef.pipes.length = 0; mapDef.semis.length = 0; mapDef.arcs.length = 0; mapDef.brushes.length = 0;
  invalidateStaticLayer();
  drawMap();
});

// Enable Clear Map safely: ensure arrays exist before clearing
(function(){
  const btn = document.getElementById('clearMap');
  if (!btn) return;
  btn.addEventListener('click', () => {
    try { pushHistory('clearMap'); } catch {}
    const keys = ['walls','pipes','semis','arcs','brushes','spawnPoints','boosts','ghosts','traps','rams','shields','spinners','rotatingBarriers','magnetpulls','magnetpushs','mudPatches','fans','belts','magnets','teleports','timeFreezes','bumpers','poisons'];
    keys.forEach(k => { if (!Array.isArray(mapDef[k])) mapDef[k] = []; mapDef[k].length = 0; });
    toast('Đã xoá toàn bộ map');
    invalidateStaticLayer();
    drawMap();
  }, { once: false });
})();

// Random Map Generator
function generateRandomMap() {
  try { pushHistory('randomMap'); } catch {}
  // 1. Clear Map
  const keys = ['walls', 'pipes', 'semis', 'arcs', 'brushes', 'spawnPoints', 'carrots', 'boosts', 'ghosts', 'traps', 'rams', 'shields', 'spinners', 'rotatingBarriers', 'magnetpulls', 'magnetpushs', 'mudPatches', 'healingPatches', 'fans', 'belts', 'magnets', 'teleports', 'timeFreezes', 'bumpers', 'poisons'];
  keys.forEach(k => { if (!Array.isArray(mapDef[k])) mapDef[k] = []; mapDef[k].length = 0; });

  // 2. Define Track Parameters
  const margin = 100;
  const trackWidth = cv.width - margin * 2;
  const trackHeight = cv.height - margin * 2;
  const cornerRadius = 150;
  const wallThickness = 14;

  // 3. Create Outer Boundary
  const addWall = (x, y, w, h) => mapDef.walls.push({ x, y, w, h, r: wallThickness / 2 });
  const addArc = (x, y, r, sA, eA) => mapDef.arcs.push({ x, y, r, w: wallThickness, sA, eA });

  // Straights
  addWall(margin + cornerRadius, margin, trackWidth - cornerRadius * 2, wallThickness);
  addWall(margin + cornerRadius, cv.height - margin - wallThickness, trackWidth - cornerRadius * 2, wallThickness);
  addWall(margin, margin + cornerRadius, wallThickness, trackHeight - cornerRadius * 2);
  addWall(cv.width - margin - wallThickness, margin + cornerRadius, wallThickness, trackHeight - cornerRadius * 2);

  // Corners
  addArc(margin + cornerRadius, margin + cornerRadius, cornerRadius, Math.PI, 1.5 * Math.PI);
  addArc(cv.width - margin - cornerRadius, margin + cornerRadius, cornerRadius, 1.5 * Math.PI, 2 * Math.PI);
  addArc(margin + cornerRadius, cv.height - margin - cornerRadius, cornerRadius, 0.5 * Math.PI, Math.PI);
  addArc(cv.width - margin - cornerRadius, cv.height - margin - cornerRadius, cornerRadius, 0, 0.5 * Math.PI);

  // 4. Add Inner Obstacles
  const numObstacles = 15;
  const innerMargin = margin + cornerRadius + 50;
  for (let i = 0; i < numObstacles; i++) {
    const x = innerMargin + Math.random() * (cv.width - innerMargin * 2);
    const y = innerMargin + Math.random() * (cv.height - innerMargin * 2);
    const type = Math.random();

    if (type < 0.5) { // Add a random Wall
      const w = 80 + Math.random() * 120;
      const h = wallThickness - 4;
      addWall(x - w / 2, y - h / 2, w, h);
    } else if (type < 0.85) { // Add a random Arc
      const r = 40 + Math.random() * 80;
      const startAngle = Math.random() * 2 * Math.PI;
      const endAngle = startAngle + (0.5 + Math.random()) * Math.PI;
      addArc(x, y, r, startAngle, endAngle);
    } else { // Add a random Semi
        mapDef.semis.push({ x, y, r: 40 + Math.random() * 50, w: wallThickness - 4 });
    }
  }

  // 5. Add Spawn Points & Carrot
  for (let i = 0; i < 8; i++) {
    mapDef.spawnPoints.push({ x: margin + cornerRadius + 50 + (i % 4) * 50, y: margin + 50 + (i < 4 ? 0 : 50) });
  }
  mapDef.carrots.push({ x: cv.width - margin - cornerRadius, y: cv.height / 2, r: 18, enabled: true, id: 'A' });

  toast('Đã tạo map cong ngẫu nhiên!');
  invalidateStaticLayer();
  drawMap();
  startMainLoop();
}

function addRandomItems() {
  try { pushHistory('randomItems'); } catch {}
  // 1. Clear existing items
  const itemKeys = ['boosts','ghosts','traps','rams','shields','turbos','spinners'];
  itemKeys.forEach(k => { if (!Array.isArray(mapDef[k])) mapDef[k] = []; mapDef[k].length = 0; });

  // Helper function to check for walls at a specific point
  const isWall = (x, y) => {
    const point = { x, y, r: 1 }; // Check a tiny point
    const check = (o, p) => p.x > o.x - p.r && p.x < o.x + o.w + p.r && p.y > o.y - p.r && p.y < o.y + o.h + p.r;
    if (mapDef.walls.some(wall => check(wall, point))) return true;
    if (mapDef.pipes.some(pipe => check(pipe, point))) return true;
    // Add more checks for other wall types if needed (semis, arcs)
    return false;
  };

  // 2. Randomly place new items
  const itemTypes = ['spinner', 'boost', 'ram', 'shield', 'icefreezer', 'turbo'];
  const itemChance = 0.1; // 10% chance per spot
  const step = 60; // Check every 60 pixels

  for (let y = step; y < cv.height - step; y += step) {
    for (let x = step; x < cv.width - step; x += step) {
      if (isWall(x, y)) continue; // Don't place items inside walls

      if (Math.random() < itemChance) {
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        switch (itemType) {
          case 'spinner':
            mapDef.spinners.push({ x, y, r: 30, speed: (Math.random() - 0.5) * 4, type: 'spinner' });
            break;
          case 'boost': mapDef.boosts.push({ x, y, r: 15 }); break;
          case 'ram': mapDef.rams.push({ x, y, r: 15 }); break;
          case 'shield': mapDef.shields.push({ x, y, r: 15 }); break;
          case 'teleport': mapDef.teleports.push({ x, y, r: 18 }); break;
          case 'magnet': mapDef.magnets.push({ x, y, r: 20 }); break;
          case 'timefreeze': mapDef.timeFreezes.push({ x, y, r: 16 }); break;
          case 'icefreezer': mapDef.icefreezers.push({ x, y, r: 15 }); break;
          case 'testpower': mapDef.testpowers.push({ x, y, r: 15 }); break;case 'poison': mapDef.poisons.push({ x, y, r: 15 }); break;
          case 'turbo': mapDef.turbos.push({ x, y, r: 15 }); break;
        }
      }
    }
  }
  toast('Đã thêm vật phẩm ngẫu nhiên!');
  startMainLoop();
}

onId('randomMap','click', generateRandomMap);
onId('randomItems','click', addRandomItems);
onId('undo','click', ()=>{ try { undo(); } catch {} });
onId('addBelt','click', ()=>{
  try { pushHistory('addBelt'); } catch {}
  if (!Array.isArray(mapDef.belts)) mapDef.belts = [];
  // Sample belt in the track area; tweak as needed
  mapDef.belts.push({ x: 900, y: 740, w: 240, h: 64, dir: 'E', speed: 0.12, r: 16 });
  toast('Đã thêm băng chuyền (Conveyor Belt)');
  invalidateStaticLayer();
  drawMap();
  startMainLoop();
});

// Background Music Handler
(function(){
  const bgm = new Audio();
  bgm.loop = true;
  const fileInput = document.getElementById('bgmFile');
  const volumeSlider = document.getElementById('bgmVolume');
  const pauseBtn = document.getElementById('bgmPause');

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const url = URL.createObjectURL(file);
    bgm.src = url;
    bgm.play().catch(e => console.warn("Audio playback failed. User may need to interact with the page first."));
    pauseBtn.innerHTML = '⏸️';
  });

  volumeSlider.addEventListener('input', () => {
    bgm.volume = volumeSlider.value;
  });

  pauseBtn.addEventListener('click', () => {
    if (!bgm.src) return; // Do nothing if no song is loaded
    if (bgm.paused) {
      bgm.play();
      pauseBtn.innerHTML = '⏸️';
    } else {
      bgm.pause();
      pauseBtn.innerHTML = '▶️';
    }
  });

  // Set initial volume from the slider's default value
  bgm.volume = volumeSlider.value;
})();

// Safe event binder
function onId(id, ev, handler){ const el = document.getElementById(id); if (el) el.addEventListener(ev, handler); }

document.getElementById('exportJson').addEventListener('click', ()=>{
  mapDef.horseRadius = parseInt(horseRadiusEl.value, 10);
  mapDef.carrotRadius = parseInt(carrotRadiusEl.value, 10);
  const data = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapDef, null, 2));
  const a = document.createElement('a'); a.href = data; a.download = "map.json"; a.click();
});
onId('exportJson','click', ()=>{}); // ensure no error if button missing
const importFileEl = document.getElementById('importFile');
if (importFileEl) importFileEl.addEventListener('change', ev=>{
  const f = ev.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      Object.assign(mapDef, obj);
      mapDef.semis ||= [];
      mapDef.arcs ||= [];
      mapDef.brushes ||= [];
      mapDef.spawnPoints ||= [];
      mapDef.horseCustoms ||= [];
      mapDef.carrots ||= [{x:1120,y:820,r:18,enabled:true},{x:980,y:820,r:18,enabled:false}];
      mapDef.carrots.forEach(c => {
        c.scale = c.scale || '1.0';
        c.outline = c.outline || 'off';
        c.outlineColor = c.outlineColor || '#FFFFFF';
        c.outlineWidth = c.outlineWidth || '2';
      });
      loadCarrotSprites();
      updateCarrotHUD();
      loadHorseToUI();
      rebuildSpriteCaches();
      rebuildCarrotSpriteCaches();
      invalidateStaticLayer();
      drawMap();
      horseRadiusEl.value = mapDef.horseRadius || 36; // Update horseRadius input value
      horseRadiusVal.textContent = mapDef.horseRadius || 36;
      // Sync maxVel slider
      const maxVelEl = document.getElementById('maxVel');
      const maxVelVal = document.getElementById('maxVelVal');
      if (maxVelEl && maxVelVal) {
        maxVelEl.value = (mapDef.maxVel ?? 30);
        maxVelVal.textContent = String(mapDef.maxVel ?? 30);
      }
      // Sync minCruise slider
      const minCruiseEl = document.getElementById('minCruise');
      const minCruiseVal = document.getElementById('minCruiseVal');
      if (minCruiseEl && minCruiseVal) {
        const v = (typeof mapDef.minCruise === 'number' && isFinite(mapDef.minCruise)) ? mapDef.minCruise : 1.5;
        minCruiseEl.value = String(v);
        minCruiseVal.textContent = v.toFixed(1);
      }
      carrotRadiusEl.value = mapDef.carrotRadius || 30; // Update carrotRadius input value
      carrotRadiusVal.textContent = mapDef.carrotRadius || 30;
    } catch(e){
      alert("JSON không hợp lệ: " + e.message);
    }
  };
  reader.readAsText(f);
});
onId('saveLS','click', ()=>{
  mapDef.horseRadius = parseInt(horseRadiusEl.value, 10); localStorage.setItem('horse_map', JSON.stringify(mapDef)); alert("Đã lưu map vào trình duyệt ✔"); });
onId('loadLS','click', ()=>{
  const data = localStorage.getItem('horse_map');
  if (data) {
    const o=JSON.parse(data);
    Object.assign(mapDef, o);
    mapDef.semis ||= [];
    mapDef.arcs ||= [];
    mapDef.brushes ||= [];
    mapDef.spawnPoints ||= [];
    mapDef.horseCustoms ||= [];
    mapDef.carrots ||= [{x:1120,y:820,r:18,enabled:true},{x:980,y:820,r:18,enabled:false}];
    mapDef.carrots.forEach(c => {
        c.scale = c.scale || '1.0';
        c.outline = c.outline || 'off';
        c.outlineColor = c.outlineColor || '#FFFFFF';
        c.outlineWidth = c.outlineWidth || '2';
      });
    loadCarrotSprites();
    updateCarrotHUD();
    loadHorseToUI();
    rebuildSpriteCaches();
    rebuildCarrotSpriteCaches();
    invalidateStaticLayer();
    drawMap();
    horseRadiusEl.value = mapDef.horseRadius || 36; // Update horseRadius input value
    horseRadiusValEl.textContent = horseRadiusEl.value;
    // Sync maxVel slider from loaded map
    const maxVelEl2 = document.getElementById('maxVel');
    const maxVelVal2 = document.getElementById('maxVelVal');
    if (maxVelEl2 && maxVelVal2) {
      maxVelEl2.value = (mapDef.maxVel ?? 30);
      maxVelVal2.textContent = String(mapDef.maxVel ?? 30);
    }
    // Sync minCruise slider from loaded map
    const minCruiseEl2 = document.getElementById('minCruise');
    const minCruiseVal2 = document.getElementById('minCruiseVal');
    if (minCruiseEl2 && minCruiseVal2) {
      const v2 = (typeof mapDef.minCruise === 'number' && isFinite(mapDef.minCruise)) ? mapDef.minCruise : 1.5;
      minCruiseEl2.value = String(v2);
      minCruiseVal2.textContent = Number(v2).toFixed(1);
    }
  } else {
    alert("Chưa có dữ liệu lưu");
  }
});

const collisionSfxToggle = document.getElementById('collisionSfx');
let collisionSfxEnabled = collisionSfxToggle.checked;
collisionSfxToggle.addEventListener('change', () => collisionSfxEnabled = collisionSfxToggle.checked);

// MaxVel slider hook
const maxVelEl = document.getElementById('maxVel');
const maxVelVal = document.getElementById('maxVelVal');
if (maxVelEl && maxVelVal){
  maxVelVal.textContent = String(maxVelEl.value);
  maxVelEl.addEventListener('input', ()=>{
    const v = parseInt(maxVelEl.value||'30',10);
    mapDef.maxVel = v;
    maxVelVal.textContent = String(v);
  });
}

// MinCruise slider hook
const minCruiseEl = document.getElementById('minCruise');
const minCruiseVal = document.getElementById('minCruiseVal');
if (minCruiseEl && minCruiseVal){
  minCruiseVal.textContent = Number(minCruiseEl.value||'1.0').toFixed(1);
  minCruiseEl.addEventListener('input', ()=>{
    const v = parseFloat(minCruiseEl.value||'1.0');
    mapDef.minCruise = isFinite(v) ? v : 1.0;
    minCruiseVal.textContent = Number(mapDef.minCruise).toFixed(1);
  });
}

// HP System Settings Event Handlers
const hpSystemEnabledEl = document.getElementById('hpSystemEnabled');
const horseMaxHPEl = document.getElementById('horseMaxHP');
const horseMaxHPVal = document.getElementById('horseMaxHPVal');
const showHPNumbersEl = document.getElementById('showHPNumbers');
const showHorseSpeedEl = document.getElementById('showHorseSpeed');
const autoRotateHorseSpriteEl = document.getElementById('autoRotateHorseSprite');

if (hpSystemEnabledEl) {
  hpSystemEnabledEl.addEventListener('change', () => {
    mapDef.hpSystemEnabled = hpSystemEnabledEl.checked;
  });
}

if (horseMaxHPEl && horseMaxHPVal) {
  horseMaxHPVal.textContent = String(horseMaxHPEl.value);
  horseMaxHPEl.addEventListener('input', () => {
    const v = parseInt(horseMaxHPEl.value || '100', 10);
    mapDef.horseMaxHP = v;
    horseMaxHPVal.textContent = String(v);
    // Update existing horses' max HP
    for (const h of horses) {
      if (h.maxHP !== v) {
        const hpRatio = h.hp / h.maxHP;
        h.maxHP = v;
        h.hp = Math.round(v * hpRatio);
      }
    }
  });
}

if (showHPNumbersEl) {
  showHPNumbersEl.addEventListener('change', () => {
    mapDef.showHPNumbers = showHPNumbersEl.checked;
  });
}

if (showHorseSpeedEl) {
  showHorseSpeedEl.addEventListener('change', () => {
    mapDef.showHorseSpeed = showHorseSpeedEl.checked;
  });
}

if (autoRotateHorseSpriteEl) {
  autoRotateHorseSpriteEl.addEventListener('change', () => {
    mapDef.autoRotateHorseSprite = autoRotateHorseSpriteEl.checked;
  });
}

const lastHorseWinsEl = document.getElementById('lastHorseWins');
if (lastHorseWinsEl) {
  lastHorseWinsEl.addEventListener('change', () => {
    mapDef.lastHorseWins = lastHorseWinsEl.checked;
  });
}

const borderDamageEnabledEl = document.getElementById('borderDamageEnabled');
const borderDamageAmountEl = document.getElementById('borderDamageAmount');
const borderDamageAmountVal = document.getElementById('borderDamageAmountVal');

if (borderDamageEnabledEl) {
  borderDamageEnabledEl.addEventListener('change', () => {
    mapDef.borderDamageEnabled = borderDamageEnabledEl.checked;
  });
}

if (borderDamageAmountEl && borderDamageAmountVal) {
  borderDamageAmountVal.textContent = String(borderDamageAmountEl.value);
  borderDamageAmountEl.addEventListener('input', () => {
    const v = parseInt(borderDamageAmountEl.value || '15', 10);
    mapDef.borderDamageAmount = v;
    borderDamageAmountVal.textContent = String(v);
  });
}

const wallDamageEnabledEl = document.getElementById('wallDamageEnabled');
if (wallDamageEnabledEl) {
  wallDamageEnabledEl.addEventListener('change', () => {
    mapDef.wallDamageEnabled = wallDamageEnabledEl.checked;
  });
}

const wallDamageAmountEl = document.getElementById('wallDamageAmount');
const wallDamageAmountVal = document.getElementById('wallDamageAmountVal');
if (wallDamageAmountEl && wallDamageAmountVal) {
  wallDamageAmountEl.addEventListener('input', () => {
    const value = parseInt(wallDamageAmountEl.value, 10);
    wallDamageAmountVal.textContent = String(value);
    mapDef.wallDamageAmount = value;
  });
}

// One-time startup sync: ensure sliders reflect mapDef defaults on initial load
try{
  if (typeof mapDef === 'object'){
    if (horseRadiusEl && horseRadiusVal){
      horseRadiusEl.value = String(mapDef.horseRadius ?? 36);
      horseRadiusVal.textContent = String(mapDef.horseRadius ?? 36);
    }
    if (carrotRadiusEl && carrotRadiusVal){
      carrotRadiusEl.value = String(mapDef.carrotRadius ?? 30);
      carrotRadiusVal.textContent = String(mapDef.carrotRadius ?? 30);
    }
    if (maxVelEl && maxVelVal){
      const v = (typeof mapDef.maxVel === 'number' && isFinite(mapDef.maxVel)) ? mapDef.maxVel : 4;
      maxVelEl.value = String(v);
      maxVelVal.textContent = String(v);
    }
    // HP System settings sync
    if (hpSystemEnabledEl) {
      hpSystemEnabledEl.checked = mapDef.hpSystemEnabled || false;
    }
    if (horseMaxHPEl && horseMaxHPVal) {
      const v = (typeof mapDef.horseMaxHP === 'number' && isFinite(mapDef.horseMaxHP)) ? mapDef.horseMaxHP : 100;
      horseMaxHPEl.value = String(v);
      horseMaxHPVal.textContent = String(v);
    }
    if (showHPNumbersEl) {
      showHPNumbersEl.checked = mapDef.showHPNumbers || false;
    }
    if (showHorseSpeedEl) {
      showHorseSpeedEl.checked = mapDef.showHorseSpeed || false;
    }
    if (autoRotateHorseSpriteEl) {
      autoRotateHorseSpriteEl.checked = mapDef.autoRotateHorseSprite || false;
    }
    if (lastHorseWinsEl) {
      lastHorseWinsEl.checked = mapDef.lastHorseWins || false;
    }
    if (wallDamageEnabledEl) {
      wallDamageEnabledEl.checked = mapDef.wallDamageEnabled || false;
    }
    if (wallDamageAmountEl && wallDamageAmountVal) {
      const v = (typeof mapDef.wallDamageAmount === 'number' && isFinite(mapDef.wallDamageAmount)) ? mapDef.wallDamageAmount : 10;
      wallDamageAmountEl.value = String(v);
      wallDamageAmountVal.textContent = String(v);
    }
    if (borderDamageEnabledEl) {
      borderDamageEnabledEl.checked = mapDef.borderDamageEnabled || false;
    }
    if (borderDamageAmountEl && borderDamageAmountVal) {
      const v = (typeof mapDef.borderDamageAmount === 'number' && isFinite(mapDef.borderDamageAmount)) ? mapDef.borderDamageAmount : 15;
      borderDamageAmountEl.value = String(v);
      borderDamageAmountVal.textContent = String(v);
    }
  }
} catch(e){ console.warn('Startup sync error:', e); }

// Hide all horse names toggle
const hideNamesToggle = document.getElementById('hideHorseNames');
let hideHorseNames = hideNamesToggle ? hideNamesToggle.checked : false;
if (hideNamesToggle) {
  hideNamesToggle.addEventListener('change', () => {
    hideHorseNames = hideNamesToggle.checked;
  });
}

// Name font scale slider
const nameFontScaleEl = document.getElementById('nameFontScale');
const nameFontScaleVal = document.getElementById('nameFontScaleVal');
let nameFontScale = nameFontScaleEl ? parseFloat(nameFontScaleEl.value || '0.55') : 0.55;
if (nameFontScaleEl && nameFontScaleVal) {
  nameFontScaleVal.textContent = (nameFontScale).toFixed(2) + '×';
  nameFontScaleEl.addEventListener('input', () => {
    nameFontScale = parseFloat(nameFontScaleEl.value || '0.55');
    nameFontScaleVal.textContent = nameFontScale.toFixed(2) + '×';
  });
}

onId('playBtnLegacy','click', ()=> setMode('play'));
onId('playBtnLegacy','click', ()=> { try { startRace(); } catch (e) { console.error(e); } });
onId('toEditor','click', ()=> stopRaceToEditor()); // ensure works

// Replace range inputs with custom sliders
document.querySelectorAll('#editorBar input[type=range]').forEach(createCustomSlider);

// Make number inputs draggable
document.querySelectorAll('#editorBar input[type=number]').forEach(input => {
  input.style.cursor = 'ew-resize';
  // A simplified drag logic for number inputs can be added here if needed
  // For now, we just keep the cursor style as a hint
});

// Handle sprite file load
spriteFile.addEventListener('change', ev=>{
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    const i = getCurrentHorseIndex();
    ensureCustomIndex(i);
    mapDef.horseCustoms[i].sprite = e.target.result; // base64
    rebuildSpriteCacheFor(i);
    toast(`Đã tải PNG cho #${i+1}`);
  };
  reader.readAsDataURL(f);
});

// Built-in Horse Sprite Presets (auto-scans predefined file names under assets/horses/)
// If assets/horses/list.js exists, it defines window.horseSpriteList dynamically.
let builtInHorseSprites = [
  'brown.png','black.png','white.png','red.png','blue.png','green.png','yellow.png','purple.png','pixel.png'
];
// Persist user-imported sprite sources across modal openings
let customSpriteSources = [];
let customSpriteSet = new Set();
// Track which built-in sprites actually exist (loaded successfully)
let availableBuiltInHorseSprites = [];
// Expose to window for sprite-manager.js
window.availableBuiltInHorseSprites = availableBuiltInHorseSprites;
window.customSpriteSources = customSpriteSources;
function initHorseSpritePresets(){
  try {
    const cont = document.getElementById('spritePickerGrid');
    if (!cont) return;
    cont.innerHTML = '';
    let shown = 0;
    availableBuiltInHorseSprites.length = 0;
    builtInHorseSprites.forEach(fname => {
      const src = 'assets/horses/' + fname;
      const probe = new Image();
      // Only add tile if the image actually exists/loads
      probe.onload = () => {
        // Record as available for randomization
        if (!availableBuiltInHorseSprites.includes(src)) availableBuiltInHorseSprites.push(src);
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.padding = '0';
        btn.style.width = '112px';
        btn.style.height = '112px';
        btn.style.borderRadius = '10px';
        btn.style.overflow = 'hidden';
        btn.style.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%)';
        btn.style.backgroundSize = '16px 16px';
        btn.style.backgroundPosition = '0 0, 0 8px, 8px -8px, -8px 0px';
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.style.width = '100%';
        thumb.style.height = '100%';
        thumb.style.objectFit = 'contain';
        thumb.style.imageRendering = 'auto';
        thumb.decoding = 'async';
        thumb.loading = 'eager';
        btn.appendChild(thumb);
        btn.addEventListener('click', () => {
          const i = getCurrentHorseIndex();
          ensureCustomIndex(i);
          // Use a bundled relative path so no upload needed
          mapDef.horseCustoms[i].sprite = src;
          rebuildSpriteCacheFor(i);
          toast(`Đã áp dụng sprite mẫu cho #${i+1}`);
        });
        cont.appendChild(btn);
        shown++;
      };
      probe.onerror = () => {};
      probe.src = src;
    });
  } catch (e) { console.warn('initHorseSpritePresets failed', e); }
}

// Sprite Picker Modal wiring
(function setupSpritePicker(){
  const openBtn = document.getElementById('openSpritePicker');
  const modal = document.getElementById('spritePickerModal');
  const closeBtn = document.getElementById('closeSpritePicker');
  const backdrop = document.getElementById('spritePickerBackdrop');
  const grid = document.getElementById('spritePickerGrid');
  const importFilesBtn = document.getElementById('importSpriteFiles');
  const importFolderBtn = document.getElementById('importSpriteFolder');
  if (!openBtn || !modal || !grid) return;

  function showModal(){
    modal.style.display = 'block';
    initHorseSpritePresets();
    // Append previously imported custom sprites (if any)
    try {
      if (Array.isArray(customSpriteSources) && customSpriteSources.length){
        customSpriteSources.forEach(src => { try { addTileFromSrc(src); } catch {} });
      }
    } catch {}
    tryAutoScanPictures();
  }
  function hideModal(){ modal.style.display = 'none'; }
  if (openBtn) openBtn.addEventListener('click', showModal);
  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (backdrop) backdrop.addEventListener('click', hideModal);

  function addTileFromSrc(src){
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0';
    btn.style.width = '112px';
    btn.style.height = '112px';
    btn.style.borderRadius = '10px';
    btn.style.overflow = 'hidden';
    btn.style.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%)';
    btn.style.backgroundSize = '16px 16px';
    btn.style.backgroundPosition = '0 0, 0 8px, 8px -8px, -8px 0px';

    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.imageRendering = 'auto';
    img.decoding = 'async';
    img.loading = 'eager';
    btn.appendChild(img);

    // Generate a crisp nearest-neighbor preview if the source is small
    try {
      const raw = new Image();
      raw.decoding = 'async';
      raw.loading = 'eager';
      raw.onload = () => {
        const TILE = 112;
        const iw = raw.naturalWidth || raw.width || 0;
        const ih = raw.naturalHeight || raw.height || 0;
        if (!iw || !ih) return;
        const isSmall = Math.max(iw, ih) <= 96;
        if (!isSmall) return; // keep smooth for large art
        const scale = Math.max(1, Math.floor(Math.min(TILE / iw, TILE / ih)));
        const cw = Math.min(TILE, iw * scale);
        const ch = Math.min(TILE, ih * scale);
        const off = document.createElement('canvas');
        off.width = TILE; off.height = TILE;
        const c2 = off.getContext('2d');
        if (!c2) return;
        c2.imageSmoothingEnabled = false;
        const dx = Math.floor((TILE - cw) / 2);
        const dy = Math.floor((TILE - ch) / 2);
        c2.clearRect(0,0,TILE,TILE);
        c2.drawImage(raw, 0,0, iw, ih, dx, dy, cw, ch);
        try { img.src = off.toDataURL('image/png'); } catch {}
      };
      raw.onerror = () => {};
      raw.src = src;
    } catch {}

    btn.addEventListener('click', ()=>{
      try { pushHistory('apply sprite'); } catch {}
      const i = getCurrentHorseIndex();
      ensureCustomIndex(i);
      mapDef.horseCustoms[i].sprite = src;
      rebuildSpriteCacheFor(i);
      toast(`Đã áp dụng sprite cho #${i+1}`);
      hideModal();
    });
    grid.appendChild(btn);
  }

  // Hidden inputs for imports
  const hiddenFiles = document.createElement('input');
  hiddenFiles.type = 'file';
  hiddenFiles.accept = 'image/png';
  hiddenFiles.multiple = true;
  hiddenFiles.style.display = 'none';
  document.body.appendChild(hiddenFiles);
  hiddenFiles.addEventListener('change', ev => {
    const files = Array.from(ev.target.files||[]);
    if (!files.length) return;
    files.forEach(f => {
      try {
        const reader = new FileReader();
        reader.onload = e => {
          const src = e.target.result;
          if (!customSpriteSet.has(src)) { customSpriteSet.add(src); customSpriteSources.push(src); }
          addTileFromSrc(src);
        };
        reader.readAsDataURL(f);
      } catch{}
    });
    toast(`Đã nhập ${files.length} PNG`);
    // allow selecting the same files again later
    try { ev.target.value = ''; } catch {}
  });
  if (importFilesBtn) importFilesBtn.addEventListener('click', ()=> { try { hiddenFiles.value = ''; } catch {}; hiddenFiles.click(); });

  const hiddenFolder = document.createElement('input');
  hiddenFolder.type = 'file';
  hiddenFolder.accept = 'image/png';
  hiddenFolder.style.display = 'none';
  // @ts-ignore - webkitdirectory is non-standard but supported by Chromium
  hiddenFolder.webkitdirectory = true;
  document.body.appendChild(hiddenFolder);
  hiddenFolder.addEventListener('change', ev => {
    const files = Array.from(ev.target.files||[]).filter(f => /\.png$/i.test(f.name));
    if (!files.length) { toast('Thư mục không có PNG'); return; }
    files.forEach(f => {
      try {
        const reader = new FileReader();
        reader.onload = e => {
          const src = e.target.result;
          if (!customSpriteSet.has(src)) { customSpriteSet.add(src); customSpriteSources.push(src); }
          addTileFromSrc(src);
        };
        reader.readAsDataURL(f);
      } catch{}
    });
    toast(`Đã nhập ${files.length} PNG từ thư mục`);
    // reset to ensure change fires if re-importing the same folder
    try { ev.target.value = ''; } catch {}
  });
  if (importFolderBtn) importFolderBtn.addEventListener('click', ()=> { try { hiddenFolder.value = ''; } catch {}; hiddenFolder.click(); });

  function tryAutoScanPictures(){
    try {
      // Do not add built-in list.js items here; presets are handled in initHorseSpritePresets()
      let fs = null, path = null;
      try {
        const wreq = (typeof window !== 'undefined' && window.require) ? window.require : null;
        if (wreq) { fs = wreq('fs'); path = wreq('path'); }
      } catch {}
      if (fs && path) {
        try {
          // Scan local assets/horses for any images, dedup against customSpriteSet
          try {
            const assetsDir = path.join(__dirname || '', 'assets', 'horses');
            if (assetsDir && fs.existsSync(assetsDir)) {
              const ents = fs.readdirSync(assetsDir, { withFileTypes: true });
              let addedLocal = 0;
              for (const ent of ents) {
                if (ent.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(ent.name)) {
                  const rel = 'assets/horses/' + ent.name;
                  if (!customSpriteSet.has(rel)) {
                    customSpriteSet.add(rel);
                    try { customSpriteSources.push(rel); } catch {}
                    addTileFromSrc(rel);
                    addedLocal++;
                  }
                }
              }
              if (addedLocal > 0) { try { toast(`Đã bổ sung ${addedLocal} ảnh từ assets/horses/`); } catch {} }
            }
          } catch {}

          // Attempt to import PNGs from user's Pictures and Saved Pictures (recursive)
          const base = (typeof process !== 'undefined' && process.env && process.env.USERPROFILE) ? process.env.USERPROFILE : '';
          const picsDir = base ? path.join(base, 'Pictures') : 'C:\\Users\\VMX\\Pictures';
          const savedDir = base ? path.join(picsDir, 'Saved Pictures') : path.join('C:\\Users\\VMX\\Pictures', 'Saved Pictures');
          const roots = [picsDir, savedDir];
          const seenFiles = new Set();

          function walk(dir, depth, maxDepth, out, cap){
            if (!fs.existsSync(dir)) return;
            if (out.length >= cap) return;
            let entries = [];
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
            for (const ent of entries) {
              if (out.length >= cap) break;
              const full = path.join(dir, ent.name);
              if (ent.isDirectory()) {
                if (depth < maxDepth) walk(full, depth+1, maxDepth, out, cap);
              } else if (ent.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(ent.name)) {
                if (!seenFiles.has(full)) { seenFiles.add(full); out.push(full); }
              }
            }
          }

          const collected = [];
          const CAP = 200; // safety cap
          const MAX_DEPTH = 3; // reasonable depth
          for (const r of roots) { walk(r, 0, MAX_DEPTH, collected, CAP); if (collected.length >= CAP) break; }

          // Add all collected paths into grid
          let added = 0;
          for (const p of collected) {
            const url = 'file://'+p.replace(/\\/g,'/');
            if (!customSpriteSet.has(url)) {
              customSpriteSet.add(url);
              try { customSpriteSources.push(url); } catch {}
              addTileFromSrc(url);
              added++;
            }
          }
          if (added > 0) try { toast(`Đã tự động thêm ${added} PNG từ Pictures`); } catch {}
        } catch {}
      } else {
        // Not running with Node integration; prompt user to use Import Folder
        try { toast('Không truy cập được thư mục. Dùng “Import Folder…” để thêm sprites'); } catch {}
      }
    } catch {}
  }
})();
// Try to load dynamic list from assets/horses/list.js, then init. Fallback to defaults on error.
(function loadHorseListThenInit(){
  try {
    const s = document.createElement('script');
    s.src = 'assets/horses/list.js';
    s.async = true;
    s.onload = () => {
      try {
        if (Array.isArray(window.horseSpriteList) && window.horseSpriteList.length) {
          builtInHorseSprites = window.horseSpriteList.slice();
        }
      } catch {}
      initHorseSpritePresets();
    };
    s.onerror = () => { initHorseSpritePresets(); };
    document.head.appendChild(s);
  } catch { initHorseSpritePresets(); }
})();
clearSpriteBtn.addEventListener('click', ()=>{
  const i = getCurrentHorseIndex(); ensureCustomIndex(i);
  delete mapDef.horseCustoms[i].sprite;
  delete mapDef.horseCustoms[i]._img;
  delete mapDef.horseCustoms[i]._tinted;
  toast(`Đã xoá sprite của #${i+1}`);
});

// Copy Sprite to All: chỉ copy sprite & cài đặt sprite
document.getElementById('copySpriteAll').addEventListener('click', ()=>{
  const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
  const srcIdx = getCurrentHorseIndex();
  copySpriteToAllFrom(srcIdx, N);
  toast(`Đã copy sprite từ #${srcIdx+1} cho ${N} ngựa`);
});

// Copy Outline to All: chỉ copy outline (bật/tắt, màu, độ dày)
document.getElementById('copyOutlineAll').addEventListener('click', ()=>{
  const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
  const srcIdx = getCurrentHorseIndex();
  copyOutlineToAllFrom(srcIdx, N);
  toast(`Đã copy Outline từ #${srcIdx+1} cho ${N} ngựa`);
});

// Copy Body Color to All: chỉ copy màu thân
document.getElementById('copyBodyAll').addEventListener('click', ()=>{
  const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
  const srcIdx = getCurrentHorseIndex();
  copyBodyColorToAllFrom(srcIdx, N);
  toast(`Đã copy Body Color từ #${srcIdx+1} cho ${N} ngựa`);
});

// Copy Skill to All: chỉ copy kỹ năng
document.getElementById('copySkillAll').addEventListener('click', ()=>{
  const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
  const srcIdx = getCurrentHorseIndex();
  copySkillToAllFrom(srcIdx, N);
  toast(`Đã copy Skill từ #${srcIdx+1} cho ${N} ngựa`);
});

// ===== Random Sprite Helpers & Wiring =====
// MOVED TO: scripts/core/sprite-manager.js
// Access via: window.SpriteManager or window.getAllHorseSpriteSources(), window.randomizeSpriteAt() for compatibility

// UI: Randomize sprite for current horse
try {
  const btnOne = document.getElementById('randomSprite');
  if (btnOne) btnOne.addEventListener('click', ()=>{
    const i = getCurrentHorseIndex();
    const ok = randomizeSpriteAt(i);
    if (ok) {
      loadHorseToUI();
      toast(`Đã random Sprite cho #${i+1}`);
    } else {
      toast('Không có sprite nào khả dụng');
    }
  });
} catch {}

// UI: Randomize sprite for all horses
try {
  const btnAll = document.getElementById('randomSpriteAll');
  if (btnAll) btnAll.addEventListener('click', ()=>{
    const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
    let applied = 0;
    for (let i=0;i<N;i++) { if (randomizeSpriteAt(i)) applied++; }
    loadHorseToUI();
    toast(`Đã random Sprite cho ${applied}/${N} ngựa`);
  });
} catch {}

// Randomize current horse: skill (có cả none), body color, label color
document.getElementById('randomHorse').addEventListener('click', ()=>{
  const i = getCurrentHorseIndex();
  randomizeHorseAt(i);
  loadHorseToUI();
  toast(`Đã random #${i+1}`);
});

// Randomize all horses in the team
document.getElementById('randomAllHorses').addEventListener('click', ()=>{
  const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
  for (let i=0;i<N;i++) randomizeHorseAt(i);
  loadHorseToUI();
  toast(`Đã random toàn bộ ${N} ngựa`);
});

// Random only skill for current horse
function randomizeSkillAt(i){
  ensureCustomIndex(i);
  const opts = getSkillOptions();
  const skill = opts[Math.floor(Math.random()*opts.length)];
  const hc = mapDef.horseCustoms[i];
  hc.skill = skill;
  if (horseSkillEl) horseSkillEl.value = skill;
}

document.getElementById('randomSkill').addEventListener('click', ()=>{
  const i = getCurrentHorseIndex();
  randomizeSkillAt(i);
  toast(`Đã random Skill cho #${i+1}`);
});

// Random skill for all horses
document.getElementById('randomSkillAll').addEventListener('click', ()=>{
  const N = Math.max(1, Math.min(50, parseInt(document.getElementById('n').value||"8",10)));
  for (let i=0;i<N;i++) randomizeSkillAt(i);
  loadHorseToUI();
  toast(`Đã random Skill cho toàn bộ ${N} ngựa`);
});

function toast(msg){ 
  // Keep toast for editor changes only - don't use top notification
  const el = document.querySelector('.err');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 1200);
  }
}

// ===== Event Log (UI) =====
// Create panel if missing
(function(){
  let el = document.getElementById('eventLog');
  if (!el){
    el = document.createElement('div');
    el.id = 'eventLog';
    // Initial styles; contained inside HUD for a cleaner look
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = 'auto'; // will be set precisely by applyEventLogDock()
    el.style.maxWidth = 'none';
    el.style.maxHeight = '30vh';
    el.style.display = 'flex';
    el.style.transform = 'scale(var(--ui-scale, 1))';
    el.style.transformOrigin = 'left top';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'stretch'; // rows fill full width
    el.style.gap = '4px';
    // Add a bit more vertical padding to avoid top/bottom clipping of row pills
    el.style.padding = '4px 0';
    el.style.overflow = 'hidden'; // keep content clipped within HUD box
    el.style.pointerEvents = 'none';
    el.style.zIndex = '1200';
    el.style.backdropFilter = 'saturate(120%)';
    const hud = document.getElementById('hud');
    if (hud) {
      // ensure HUD can contain absolutely positioned children
      if (getComputedStyle(hud).position === 'static') hud.style.position = 'relative';
      hud.appendChild(el);
    } else {
      document.body.appendChild(el);
    }
    
    // Create top notification and append to body (will be positioned via positionTopNotificationNearStage)
    const topNotification = document.createElement('div');
    topNotification.className = 'top-notification';
    topNotification.id = 'topNotification';
    const topNotificationText = document.createElement('span');
    topNotification.appendChild(topNotificationText);
    document.body.appendChild(topNotification);
  }
})();

// ===== Event Log Text-To-Speech (TTS) =====
// Adds voice for event log using Web Speech API with a safe queue.
// Toggle by setting window.tts.enabled = true/false
window.tts = window.tts || { enabled: true, queue: [], speaking: false, voice: null, rate: 1.0, pitch: 1.0, volume: 1.0, voiceURI: null, source: 'browser', azure: { key: null, region: 'southeastasia', voice: 'vi-VN-HoaiMyNeural' }, _audio: null };

function ttsGetVoices(){
  try{ return (window.speechSynthesis && window.speechSynthesis.getVoices()) || []; }catch{ return []; }
}

function ttsRankVoices(voices){
  // Return voices sorted by preference: Vietnamese female-ish, Vietnamese, Vietnamese by name, en-*, then others
  const score = (v)=>{
    const lang = (v.lang||'').toLowerCase();
    const name = (v.name||'').toLowerCase();
    const isVi = lang.startsWith('vi') || /viet/.test(name);
    const isEn = /^en[-_]/.test(lang);
    // crude female detection by name tokens common in engines
    const isFemale = /(female|wavenet\-f|\bf\d?\b|\bfemale\b)/i.test(v.name||'');
    let s = 0;
    if (isVi) s += 10;
    if (isFemale && isVi) s += 5;
    if (!isVi && isEn) s += 1;
    return -s; // lower is better for sort()
  };
  return [...voices].sort((a,b)=> score(a)-score(b));
}

function populateTTSVoiceSelect(){
  try{
    const sel = document.getElementById('ttsVoiceSel');
    if (!sel) return;
    const voices = ttsGetVoices();
    const ranked = ttsRankVoices(voices);
    const prev = sel.value;
    sel.innerHTML = '';
    ranked.forEach(v=>{
      const opt = document.createElement('option');
      opt.value = v.voiceURI || v.name;
      opt.textContent = `${v.name} ${v.lang ? `(${v.lang})` : ''}`.trim();
      sel.appendChild(opt);
    });
    const stored = window.localStorage && localStorage.getItem('tts.voiceURI');
    const targetURI = stored || window.tts.voiceURI;
    if (targetURI && ranked.some(v=> (v.voiceURI||v.name) === targetURI)) sel.value = targetURI;
    else if (prev && [...sel.options].some(o=>o.value===prev)) sel.value = prev;
    // attach once
    if (!sel._hooked){
      sel.addEventListener('change', ()=>{
        const uri = sel.value;
        window.tts.voiceURI = uri;
        try{ localStorage.setItem('tts.voiceURI', uri); }catch{}
        const v = ttsGetVoices().find(vo=> (vo.voiceURI||vo.name) === uri);
        if (v) window.tts.voice = v;
      });
      sel._hooked = true;
    }
  }catch{}
}

function initTTSVoices(){
  try{
    if (!('speechSynthesis' in window)) return;
    const applyChoice = ()=>{
      const voices = ttsGetVoices();
      const ranked = ttsRankVoices(voices);
      const stored = window.localStorage && localStorage.getItem('tts.voiceURI');
      let chosen = null;
      if (stored) chosen = voices.find(v=> (v.voiceURI||v.name) === stored) || null;
      if (!chosen) chosen = ranked[0] || null;
      window.tts.voice = chosen;
      window.tts.voiceURI = chosen ? (chosen.voiceURI||chosen.name) : null;
      populateTTSVoiceSelect();
    };
    applyChoice();
    if (window.speechSynthesis){
      window.speechSynthesis.onvoiceschanged = ()=>{ try{ applyChoice(); }catch{} };
    }
  }catch{}
}
initTTSVoices();
// Setup TTS enable/disable toggle with persistence
(function setupTTSToggle(){
  try{
    const cb = document.getElementById('ttsEnabled');
    if (!cb) return;
    const stored = (function(){ try{ return localStorage.getItem('tts.enabled'); }catch{ return null; } })();
    const enabled = stored === null ? true : stored === '1';
    if (!window.tts) window.tts = { enabled: enabled };
    window.tts.enabled = enabled;
    cb.checked = !!enabled;
    cb.addEventListener('change', ()=>{
      const val = cb.checked;
      window.tts.enabled = val;
      try{ localStorage.setItem('tts.enabled', val ? '1' : '0'); }catch{}
      if (!val && window.speechSynthesis){
        try{ window.speechSynthesis.cancel(); }catch{}
        try{ window.tts.queue.length = 0; window.tts.speaking = false; }catch{}
        try{ if (window.tts._audio){ window.tts._audio.pause(); window.tts._audio.src=''; window.tts._audio=null; } }catch{}
      }
    });
  }catch{}
})();

// Setup TTS source and Azure config UI with persistence
(function setupTTSSourceUI(){
  try{
    const srcSel = document.getElementById('ttsSourceSel');
    const cfgBox = document.getElementById('ttsAzureCfg');
    const keyEl = document.getElementById('ttsAzureKey');
    const regEl = document.getElementById('ttsAzureRegion');
    const voiceEl = document.getElementById('ttsAzureVoice');
    if (!srcSel || !cfgBox || !keyEl || !regEl || !voiceEl) return;
    // restore
    const src = (function(){ try{ return localStorage.getItem('tts.source') || 'browser'; }catch{ return 'browser'; } })();
    window.tts.source = src;
    srcSel.value = src;
    const key = (function(){ try{ return localStorage.getItem('tts.azure.key'); }catch{ return null; } })();
    const region = (function(){ try{ return localStorage.getItem('tts.azure.region') || window.tts.azure.region; }catch{ return window.tts.azure.region; } })();
    const voice = (function(){ try{ return localStorage.getItem('tts.azure.voice') || window.tts.azure.voice; }catch{ return window.tts.azure.voice; } })();
    if (key) window.tts.azure.key = key;
    window.tts.azure.region = region;
    window.tts.azure.voice = voice;
    keyEl.value = key || '';
    regEl.value = region || '';
    voiceEl.value = voice || '';
    cfgBox.style.display = (srcSel.value === 'azure') ? 'block' : 'none';
    // events
    srcSel.addEventListener('change', ()=>{
      window.tts.source = srcSel.value;
      try{ localStorage.setItem('tts.source', window.tts.source); }catch{}
      cfgBox.style.display = (window.tts.source === 'azure') ? 'block' : 'none';
    });
    keyEl.addEventListener('change', ()=>{ window.tts.azure.key = keyEl.value.trim(); try{ localStorage.setItem('tts.azure.key', window.tts.azure.key || ''); }catch{} });
    regEl.addEventListener('change', ()=>{ window.tts.azure.region = regEl.value.trim(); try{ localStorage.setItem('tts.azure.region', window.tts.azure.region || ''); }catch{} });
    voiceEl.addEventListener('change', ()=>{ window.tts.azure.voice = voiceEl.value.trim() || 'vi-VN-HoaiMyNeural'; try{ localStorage.setItem('tts.azure.voice', window.tts.azure.voice); }catch{} });
  }catch{}
})();
function ttsNormalize(text){
  try{
    // Prefer Vietnamese spelling for better TTS if user logs without accents
    return text.replace(/\bNgua\b/g, 'Ngựa');
  }catch{return text}
}
function ttsSpeak(text){
  try{
    if (!window.tts || !window.tts.enabled) return;
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
    const say = ttsNormalize(String(text));
    window.tts.queue.push(say);
    ttsProcess();
  }catch{}
}
function ttsProcess(){
  try{
    if (window.tts.speaking) return;
    const next = window.tts.queue.shift();
    if (!next) return;
    window.tts.speaking = true;
    if (window.tts.source === 'azure'){
      ttsAzureSpeak(next, (ok)=>{ window.tts.speaking = false; ttsProcess(); });
    } else {
      const u = new SpeechSynthesisUtterance(next);
      if (window.tts.voice) u.voice = window.tts.voice;
      u.rate = window.tts.rate; u.pitch = window.tts.pitch; u.volume = window.tts.volume;
      u.onend = ()=>{ window.tts.speaking = false; ttsProcess(); };
      u.onerror = ()=>{ window.tts.speaking = false; ttsProcess(); };
      window.speechSynthesis.speak(u);
    }
  }catch{}
}

// Azure synthesize and play helper
async function ttsAzureSpeak(text, done){
  const finish = (ok)=>{ try{ done && done(!!ok); }catch{} };
  try{
    const { key, region, voice } = window.tts.azure || {};
    if (!key || !region || !voice){ finish(false); return; }
    const ssml = `<?xml version="1.0" encoding="UTF-8"?>\n<speak version="1.0" xml:lang="vi-VN">\n  <voice xml:lang="vi-VN" name="${voice}">${text}</voice>\n</speak>`;
    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
      },
      body: ssml
    });
    if (!resp.ok){ finish(false); return; }
    const blob = await resp.blob();
    const urlObj = URL.createObjectURL(blob);
    try{ if (window.tts._audio){ window.tts._audio.pause(); window.tts._audio.src=''; window.tts._audio=null; } }catch{}
    const audio = new Audio();
    window.tts._audio = audio;
    audio.src = urlObj;
    audio.onended = ()=>{ try{ URL.revokeObjectURL(urlObj); }catch{} finish(true); };
    audio.onerror = ()=>{ try{ URL.revokeObjectURL(urlObj); }catch{} finish(false); };
    await audio.play().catch(()=>{ finish(false); });
  }catch(e){ finish(false); }
}

// Compute position so event log sits to the RIGHT of the Stop & Edit button, contained inside HUD
function applyEventLogDock(){
  try{
    const el = document.getElementById('eventLog');
    const btn = document.getElementById('toEditor');
    const hud = document.getElementById('hud');
    if (!el || !btn || getComputedStyle(btn).display === 'none') return;
    const r = btn.getBoundingClientRect();
    const gap = 0; // no gap to maximize log width
    const w = el.offsetWidth || 320;
    const h = el.offsetHeight || 160;
    // If we have HUD, place INSIDE the HUD using offsets relative to HUD
    if (hud) {
      const hr = hud.getBoundingClientRect();
      // Horizontal within HUD: start just to the right of the button
      const padL = 4, padR = 6; // small paddings for cleaner look
      const leftWithinHud = Math.max(padL, (r.right - hr.left) + gap);
      // Vertical within HUD: top-align with the button, then nudge slightly (small) to avoid clipping
      const verticalNudge = -2; // px
      const topWithinHud = Math.min(
        Math.max(4, (r.top - hr.top) + verticalNudge),
        Math.max(4, hr.height - h - 6)
      );
      // Keep log height within HUD to avoid spilling
      const maxH = Math.max(40, (hr.height) - 8);
      el.style.maxHeight = maxH + 'px';
      el.style.left = leftWithinHud + 'px';
      el.style.right = padR + 'px';
      el.style.top = topWithinHud + 'px';
      // Let width be determined by left/right so it auto-resizes with HUD
      el.style.width = '';
    } else {
      // Fallback to viewport fixed positioning if HUD missing
      let desiredLeft = Math.min(r.right + gap, window.innerWidth - w - 16);
      desiredLeft = Math.max(16, desiredLeft);
      let desiredTop = Math.max(16, Math.min(window.innerHeight - h - 16, r.top));
      el.style.left = desiredLeft + 'px';
      el.style.top = desiredTop + 'px';
    }
    // Clean conflicting properties
    // if using HUD we set right; if not, clear right
    if (!hud) el.style.right = '';
    el.style.bottom = '';
  }catch{}
}
window.addEventListener('resize', applyEventLogDock);
// Initial dock after creation
try { applyEventLogDock(); } catch {}

// Re-dock when HUD size changes (e.g., window zoom, layout shifts)
try {
  const hudWatch = document.getElementById('hud');
  if (hudWatch && 'ResizeObserver' in window) {
    const eo = new ResizeObserver(()=>{ try{ applyEventLogDock(); }catch{} });
    eo.observe(hudWatch);
  }
} catch {}

// Ensure editor content is visible (auto-heal if hidden unexpectedly)
function ensureEditorContentVisible() {
  const panel = document.getElementById('editorBar');
  if (!panel) return;
  const content = panel.querySelector('.editor-content');
  if (!content) return;
  const isCollapsed = panel.classList.contains('collapsed');
  const cs = getComputedStyle(content);
  const h = content.offsetHeight;
  if (!isCollapsed && (cs.display === 'none' || h < 10)) {
    // Force visible and reasonable geometry
    content.style.display = 'block';
    panel.style.height = 'auto';
    panel.style.maxHeight = '92vh';
    // As a last resort, remove any inline styles that could hide it
    content.style.maxHeight = '';
  }
}

// ===== Event Log System =====
// MOVED TO: scripts/ui/event-log.js
// Access via: window.EventLog or window.logEvent() for compatibility

// ===== Audio System =====
// MOVED TO: scripts/core/audio.js
// Access via: window.AudioSystem or window.beep(), window.playSfx(), etc. for compatibility

// showFlash() - MOVED TO: scripts/ui/flash.js

// ===== Geometry & Collision Helpers =====
// MOVED TO: scripts/core/geometry.js
// Access via: window.GeometryUtils or window.clamp(), window.reflect(), etc. for compatibility

// drawBrushes - MOVED TO: scripts/utils/drawing-helpers.js
// Access via: window.DrawingHelpers or window.drawBrushes() for compatibility

// Ensure spawn points exist in editor mode before first race
function ensureSpawnPointsForEditor(){
  // Safety check: Ensure mapDef.waitingRoom exists before generating spawn points
  if (!mapDef || !mapDef.waitingRoom) {
    return; // Exit gracefully if map not ready
  }
  
  const nInput = document.getElementById('n');
  const n = Math.max(2, Math.min(50, parseInt((nInput && nInput.value) || '8', 10)));
  const presetEl = document.getElementById('spawnPreset');
  const rawPreset = (presetEl && presetEl.value) || 'scatter';
  // If user hasn't chosen yet (default is 'auto'), prefer scatter for a non-row randomized preview
  const preset = (rawPreset === 'auto') ? 'scatter' : rawPreset;
  if (!Array.isArray(mapDef.spawnPoints) || mapDef.spawnPoints.length < n){
    try { makeSpawnsPreset(n, preset); } catch(e) {
      console.warn('Failed to generate spawn points:', e.message);
    }
    try { if (typeof invalidateStaticLayer === 'function') invalidateStaticLayer(); } catch {}
    try { if (typeof drawMap === 'function') drawMap(); } catch {}
  }
}

// ===== Horses (defaults) =====
// MOVED TO: scripts/data/horse-defaults.js
// Access via: window.HorseDefaults or window.NAMES, window.COLORS, window.BODY, window.SPR_SCALE, window.PNG_BASE for compatibility
function resizeCanvas(){
  canvas.width = mapDef.w;
  canvas.height = mapDef.h;
  gridCacheKey = '';
  ensureStaticLayer();
  invalidateStaticLayer();
  drawMap();
}

// ===== Canvas Resizing Logic =====
// MOVED TO: scripts/editor/canvas-resize.js
// Access via: window.CanvasResize for manual setup if needed
// Sprite drawing utilities - MOVED TO: scripts/utils/sprite-drawing.js
// Access via: window.SpriteDrawing or window.getTintedCanvas(), window.darkenColor() for compatibility
// Sprite cache functions - MOVED TO: scripts/core/sprite-manager.js
// Access via: window.SpriteManager or window.rebuildSpriteCacheFor(), window.rebuildSpriteCaches() for compatibility
// drawSpritePNG and drawHorseSpriteDefault - MOVED TO: scripts/utils/sprite-drawing.js
// Access via: window.SpriteDrawing or window.drawSpritePNG(), window.drawHorseSpriteDefault() for compatibility

class Horse{
    constructor(id,name,colorBody,colorLabel,x,y,speedBase, spriteCfg, radius){
    this.id=id; this.name=name; this.colorBody=colorBody; this.colorLabel=colorLabel;
    this.x=x; this.y=y;
    // Store base speed for reference, but start with zero velocity
    // Actual movement will be controlled by input system respecting UI settings
    this.baseSpeed = speedBase;
    this.vx = 0; this.vy = 0;  // Start stationary - movement controlled by input
        this.r = radius || (10 * SPR_SCALE); this.dir='R';
    this.spriteCfg = spriteCfg || null;
    this.boostedUntil = 0; // Timestamp for boost effect
    this.ghostedUntil = 0; // Timestamp for ghost effect
    this.frozenUntil = 0; // Timestamp for frozen effect
    this.hasRam = false;
    this.ramUntil = 0; // Timestamp for ram effect
    this.hasShield = false;
    this.shieldUntil = 0; // Timestamp for shield effect
    this.guardianShieldActive = false; // Divine Guardian permanent shield flag
    this.ghost = 0; // CRITICAL FIX: Initialize ghost property for collision detection
    // HP system
    this.maxHP = (typeof mapDef.horseMaxHP === 'number' && isFinite(mapDef.horseMaxHP)) ? mapDef.horseMaxHP : 100;
    this.hp = this.maxHP;
    this.lastDamageTime = 0;
    this.lastWallDamageTime = 0;
    this.damageImpactUntil = 0;
    this.damageImpactStrength = 0;
    // Turbo trail state
    this.trail = [];
    this.trailMax = 18;
    this._lastTrailSample = 0;
  }
  getDir(){ if (Math.abs(this.vx)>=Math.abs(this.vy)) this.dir=(this.vx>=0)?'R':'L'; else this.dir=(this.vy>=0)?'D':'U'; }
  draw(){
    const isGhosted = this.ghostedUntil && performance.now() < this.ghostedUntil;
    if (isGhosted) {
        // Phantom Strike has a specific aura
        if (this.skillState?.name === 'phantom_strike' && this.skillState.status === 'active') {
          const gradient = ctx.createRadialGradient(this.x, this.y, this.r, this.x, this.y, this.r + 8);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)'); // Inner: Faint white
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');   // Outer: Translucent black

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 8; // Width of the aura
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r + 4, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          // Generic ghost power-up aura
          ctx.globalAlpha = 0.5;
        }
      }

      // Draw RAM aura matching the reference image
      if (this.hasRam) {
        const now = performance.now();
        const timeLeft = Math.max(0, this.ramUntil - now);
        const configDuration = (mapDef && mapDef.ramSettings && Number.isFinite(mapDef.ramSettings.durationMs)) ? mapDef.ramSettings.durationMs : 4000;
        const progress = Math.max(0, Math.min(1, timeLeft / configDuration));
        
        // Gentle pulsing effect
        const pulseSpeed = 1.8;
        const pulsePhase = (now * pulseSpeed / 1000) % (Math.PI * 2);
        const pulseIntensity = (Math.sin(pulsePhase) + 1) * 0.5; // 0 to 1
        
        // Main aura - use configurable range from settings
        const configRange = (mapDef && mapDef.ramSettings && Number.isFinite(mapDef.ramSettings.range)) ? mapDef.ramSettings.range : 25;
        const baseRadius = this.r + configRange;
        const maxRadius = baseRadius + (8 * pulseIntensity);
        const currentAlpha = progress * (0.6 + 0.2 * pulseIntensity);
        
        try {
          // Soft radial gradient with more red tones
          const gradient = ctx.createRadialGradient(
            this.x, this.y, this.r,
            this.x, this.y, maxRadius
          );
          gradient.addColorStop(0, `rgba(220, 20, 20, ${currentAlpha * 0.9})`);     // Đỏ đậm ở giữa
          gradient.addColorStop(0.25, `rgba(255, 60, 40, ${currentAlpha * 0.7})`);  // Đỏ cam
          gradient.addColorStop(0.5, `rgba(255, 100, 60, ${currentAlpha * 0.5})`);  // Cam đỏ
          gradient.addColorStop(0.75, `rgba(255, 140, 100, ${currentAlpha * 0.3})`); // Cam nhạt
          gradient.addColorStop(1, 'rgba(255, 180, 140, 0)');                       // Trong suốt
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(this.x, this.y, maxRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw small dots around the perimeter (like in the image)
          const dotCount = 8;
          const dotRadius = maxRadius * 0.85;
          const dotSize = 2;
          const dotAlpha = currentAlpha * 0.8;
          
          ctx.fillStyle = `rgba(255, 100, 100, ${dotAlpha})`;
          for (let i = 0; i < dotCount; i++) {
            const angle = (i / dotCount) * Math.PI * 2 + (now * 0.001); // Rotating dots
            const dotX = this.x + Math.cos(angle) * dotRadius;
            const dotY = this.y + Math.sin(angle) * dotRadius;
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, 2 * Math.PI);
            ctx.fill();
          }
          
        } catch {}
      }

    // Visual effect for frozen state
    if (this.frozenUntil > performance.now()) {
      ctx.fillStyle = 'rgba(173, 216, 230, 0.7)'; // Icy blue
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Visual effect for damage impact (only if HP system is enabled)
    if (mapDef.hpSystemEnabled && this.damageImpactUntil && performance.now() < this.damageImpactUntil) {
      const now = performance.now();
      const remain = this.damageImpactUntil - now; // 0..200ms
      const t = 1 - (remain / 200);
      const strength = Math.max(0.2, Math.min(1, this.damageImpactStrength || 0.6));
      const r = this.r + 2 + t * (6 + 4*strength);
      const a1 = 0.4 * (1 - t);
      const a2 = 0.2 * (1 - t);
      
      // Expanding ring effect similar to spinner impact
      ctx.strokeStyle = `rgba(255, 100, 100, ${a1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(255, 150, 150, ${a2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    // --- PREMIUM TURBO TRAIL (behind sprite) ---
    {
      const now = performance.now();
      const turboActive = (typeof this.turboMultiplier === 'number' && isFinite(this.turboMultiplier) && this.turboMultiplier > 1) && (this.turboUntil && now < this.turboUntil);
      
      // Sample trail while active
      if (turboActive) {
        if (!this._lastTrailSample || (now - this._lastTrailSample) > 16) { // ~60 Hz cap
          this._lastTrailSample = now;
          this.trail.push({ x: this.x, y: this.y, r: this.r, t: now, vx: this.vx, vy: this.vy });
          if (this.trail.length > this.trailMax) this.trail.shift();
        }
        
        // Spawn fire particles behind horse
        if (!this._lastTurboParticle || (now - this._lastTurboParticle) > 30) {
          this._lastTurboParticle = now;
          const dirLen = Math.hypot(this.vx || 0, this.vy || 0) || 1;
          const backX = this.x - (this.vx || 0) / dirLen * (this.r + 5);
          const backY = this.y - (this.vy || 0) / dirLen * (this.r + 5);
          
          // Multiple fire particles for intensity
          for (let i = 0; i < 3; i++) {
            const spreadX = (Math.random() - 0.5) * this.r * 0.8;
            const spreadY = (Math.random() - 0.5) * this.r * 0.8;
            try {
              particles.push({
                x: backX + spreadX,
                y: backY + spreadY,
                vx: -(this.vx || 0) * 0.3 + (Math.random() - 0.5) * 1.5,
                vy: -(this.vy || 0) * 0.3 + (Math.random() - 0.5) * 1.5,
                life: 25 + Math.random() * 15,
                color: i === 0 ? '#FFEB3B' : (i === 1 ? '#FFC107' : '#FF9800'),
                alpha: 0.9,
                size: 2.5 + Math.random() * 2,
                shape: 'circle'
              });
            } catch {}
          }
          
          // Spark particles - bright yellow for jet engine effect
          if (Math.random() < 0.4) {
            try {
              particles.push({
                x: backX,
                y: backY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15 + Math.random() * 10,
                color: '#FFEB3B',
                alpha: 0.85,
                size: 1.5,
                shape: 'star'
              });
            } catch {}
          }
        }
      }
      
      // Draw enhanced trail
      if (this.trail && this.trail.length) {
        ctx.save();
        
        // Speed streaks DISABLED - was causing bright yellow-white streaks
        // (User feedback: still showing white/yellow even after color changes)
        
        // Main fire trail - normal blend (NO 'lighter' to prevent white wash-out)
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        for (let i = this.trail.length - 1; i >= 0; i--) {
          const p = this.trail[i];
          const age = now - p.t;
          const life = 260; // ms
          if (age > life) { this.trail.splice(i, 1); continue; }
          const k = 1 - (age / life);
          const dirLen = Math.hypot(p.vx || 0, p.vy || 0) || 1;
          const ox = -(p.vx || 0) / dirLen * Math.min(28, 10 + 20 * k);
          const oy = -(p.vy || 0) / dirLen * Math.min(28, 10 + 20 * k);
          const rr = p.r * (1.2 + 0.8 * k);
          const gx = p.x + ox, gy = p.y + oy;
          
          // Jet engine flame - elongated small flame trail
          // Draw multiple small circles along the velocity direction for elongation
          const flameLength = 3; // Number of flame segments
          const baseRadius = rr * 0.35; // Half size (smaller)
          
          for (let j = 0; j < flameLength; j++) {
            const t = j / (flameLength - 1); // 0 to 1
            const segX = gx + ox * t * 0.8; // Elongate along velocity
            const segY = gy + oy * t * 0.8;
            const segRadius = baseRadius * (1 - t * 0.5); // Taper towards tail
            const segAlpha = k * (1 - t * 0.4); // Fade towards tail
            
            const flameGrad = ctx.createRadialGradient(segX, segY, 0, segX, segY, segRadius);
            flameGrad.addColorStop(0.0, `rgba(255, 235, 59, ${0.95 * segAlpha})`);
            flameGrad.addColorStop(0.3, `rgba(255, 193, 7, ${0.8 * segAlpha})`);
            flameGrad.addColorStop(0.6, `rgba(255, 152, 0, ${0.5 * segAlpha})`);
            flameGrad.addColorStop(0.85, `rgba(255, 87, 34, ${0.2 * segAlpha})`);
            flameGrad.addColorStop(1.0, `rgba(244, 67, 54, 0)`);
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.arc(segX, segY, segRadius, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Flame distortion rings DISABLED - user feedback: "xập xình hơi dư thừa"
        }
        
        ctx.globalAlpha = 1.0; // Reset alpha
        ctx.restore();
      }
      
      // Heat distortion aura DISABLED - too bright/large
      // (User feedback: "trigger quá" - removed to reduce visual clutter)
    }
    // Vẽ tên (nhỏ hơn và gần hơn), có thể ẩn toàn bộ bằng cờ hideHorseNames
    if (!hideHorseNames) {
      const baseR = 10 * SPR_SCALE; // bán kính chuẩn tương ứng sprite mặc định
      const nameScale = Math.max(0.5, (this.r || baseR) / baseR) * 0.9 * (typeof nameFontScale === 'number' ? nameFontScale : 1.0);
      const nameFontPx = Math.max(8, Math.round(10 * SPR_SCALE * nameScale));
      const spriteRadius = this.r || 10 * SPR_SCALE;
      const nameOffset = spriteRadius + 0.5 * SPR_SCALE + (4 * SPR_SCALE * nameScale); // Tên gần sprite hơn + scale theo nameScale
      // Dùng font tỉ lệ (system-ui) thay vì monospace để giảm khoảng trắng giữa ký tự/số
      // Đồng thời nén nhiều khoảng trắng liên tiếp thành một khoảng trắng
      const label = String(this.name || '').replace(/\s+/g,' ').trim();
      ctx.fillStyle = this.colorLabel;
      ctx.font = `${nameFontPx}px system-ui, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, this.x, this.y - nameOffset);
      
      // Show velocity below sprite if enabled (only in play mode)
      if (mapDef.showHorseSpeed && mode === 'play' && !this.eliminated) {
        // Calculate effective speed (raw velocity × all modifiers)
        const rawVelocity = Math.hypot(this.vx || 0, this.vy || 0);
        const speedMultiplier = this._effectiveSpeedMultiplier || 1.0;
        const effectiveSpeed = rawVelocity * speedMultiplier;
        const velocityText = effectiveSpeed.toFixed(1);
        const velocityY = this.y + spriteRadius + 10 * SPR_SCALE; // Below sprite (moved down)
        ctx.fillStyle = this.colorLabel; // Same color as horse name
        ctx.font = `bold ${Math.max(9, Math.round(11 * SPR_SCALE))}px system-ui, Arial, sans-serif`;
        ctx.fillText(velocityText, this.x, velocityY);
      }
      
      // Draw HP bar (only if HP system is enabled) - positioned below name text
      if (mapDef.hpSystemEnabled) {
        const hpBarWidth = 32 * SPR_SCALE;
        const hpBarHeight = 5 * SPR_SCALE;
        const hpBarY = this.y - nameOffset + 4 * SPR_SCALE; // HP bar cố định 4 pixel dưới tên
        const hpPercent = Math.max(0, this.hp / this.maxHP);
        
        // HP bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - hpBarWidth/2, hpBarY, hpBarWidth, hpBarHeight);
        
        // HP bar fill
        const hpColor = hpPercent > 0.6 ? '#4CAF50' : hpPercent > 0.3 ? '#FF9800' : '#F44336';
        ctx.fillStyle = hpColor;
        ctx.fillRect(this.x - hpBarWidth/2, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
        
        // HP bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - hpBarWidth/2, hpBarY, hpBarWidth, hpBarHeight);
        
        // Show HP numbers if enabled - positioned on left and right sides of HP bar
        if (mapDef.showHPNumbers) {
          ctx.fillStyle = this.colorLabel; // Use same color as horse name
          ctx.font = `${Math.max(7, Math.round(8 * SPR_SCALE))}px system-ui, Arial, sans-serif`;
          
          // Current HP on the left
          ctx.textAlign = "right";
          ctx.fillText(`${Math.round(this.hp)}`, this.x - hpBarWidth/2 - 3, hpBarY + hpBarHeight - 1);
          
          // Max HP on the right
          ctx.textAlign = "left";
          ctx.fillText(`${this.maxHP}`, this.x + hpBarWidth/2 + 3, hpBarY + hpBarHeight - 1);
        }
      }
    }
    const cfg = this.spriteCfg;
    if (cfg && cfg._img){
            // Use global auto rotate setting instead of per-sprite setting
            const shouldRotate = mapDef.autoRotateHorseSprite || false;
            window.drawSpritePNG(ctx, cfg._img, this.x, this.y, this.dir,
        parseFloat(cfg.scale||'1'), shouldRotate, cfg.outline==='on',
        cfg.outlineColor||'#000', parseInt(cfg.outlineWidth||'2',10), this.r);
    } else {
            // Apply global auto rotate to default sprites too
            const shouldRotate = mapDef.autoRotateHorseSprite || false;
            window.drawHorseSpriteDefault(ctx,this.x,this.y,this.dir,this.colorBody,this.colorLabel, this.r, shouldRotate);
    }

    // Draw poison aura if present
    if (this.poisonAura) {
      ctx.save();
      
      // Inner subtle green aura
      ctx.globalAlpha = this.poisonAura.pulseAlpha1;
      ctx.strokeStyle = '#32CD32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.poisonAura.pulseSize1, 0, Math.PI * 2);
      ctx.stroke();
      
      // Outer very subtle aura
      ctx.globalAlpha = this.poisonAura.pulseAlpha2;
      ctx.strokeStyle = '#90EE90';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.poisonAura.pulseSize2, 0, Math.PI * 2);
      ctx.stroke();
      
      // Very subtle poison cloud effect
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#90EE90';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // Debug: draw effective collision hitbox
    if (typeof debugShowHitbox !== 'undefined' && debugShowHitbox) {
      const effR = Math.max(1, (this.r * (this.hitScale || 1.0)) - Math.max(0, this.hitInset || 0));
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, effR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    const isBoosted = this.boostedUntil && performance.now() < this.boostedUntil;
    if (isBoosted) {
      // Draw a subtle yellow aura to indicate boost
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 235, 59, 0.35)';
      ctx.fill();
      ctx.restore();
    }

    // If ghost was generic (not phantom_strike aura), restore alpha
    if (isGhosted && !(this.skillState?.name === 'phantom_strike' && this.skillState.status === 'active')) {
      ctx.globalAlpha = 1.0;
    }

    // Draw shield effect - MOVED TO: scripts/rendering/powerup-rendering.js
    try { if (window.PowerupRendering) window.PowerupRendering.drawShieldEffect(ctx, this); } catch {}

    // Debug text
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // Overdrive debuff label: show during overheat (slow)
    if (this.skillState && this.skillState.name === 'overdrive' && this.skillState.status === 'overheat') {
      const nowTs = performance.now();
      if (typeof this.overheatUntil === 'number' && nowTs < this.overheatUntil) {
        const label = '🐢 SLOW';
        ctx.save();
        // Draw a subtle pill background for readability
        const padX = 6, padY = 3;
        ctx.font = 'bold 11px Arial';
        const metrics = ctx.measureText(label);
        const w = metrics.width + padX * 2;
        const h = 14 + padY * 2;
        const x = this.x - w / 2;
        const y = this.y - (this.r + 18) - h; // above the horse
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeStyle = 'rgba(255,80,0,0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const r = 6;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Text
        ctx.fillStyle = '#FFD180';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, this.x, y + h / 2);
        ctx.restore();
      }
    }

  }
}
// Make Horse class globally accessible for race.js
window.Horse = Horse;

// ===== Game State =====
let gateOpen=false, openTime=0, biasUntil=0, goFxStart=0, goFxUntil=0;
let horses=[], running=false, winner=null, speedScale=1, liveBoosts=[], liveGhosts=[], liveTraps=[], liveRams=[], liveSpinners=[], liveShields=[], liveTurbos=[], liveSlipstreams=[], liveTeleports=[], liveMagnets=[], liveTimeFreezes=[], livePoisons=[], liveLightnings=[], liveTornados=[], liveVolcanos=[], liveMeteors=[], liveWarpzones=[], liveQuantumdashs=[], liveNebulas=[], particles=[];

// Global override flag removed - no longer needed

// Helper functions for color manipulation
function lightenColor(color, amount) {
  const usePound = color[0] === "#";
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) + Math.round(255 * amount);
  let g = (num >> 8 & 0x00FF) + Math.round(255 * amount);
  let b = (num & 0x0000FF) + Math.round(255 * amount);
  r = r < 255 ? r : 255;
  g = g < 255 ? g : 255;
  b = b < 255 ? b : 255;
  return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

function darkenColor(color, amount) {
  const usePound = color[0] === "#";
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) - Math.round(255 * amount);
  let g = (num >> 8 & 0x00FF) - Math.round(255 * amount);
  let b = (num & 0x0000FF) - Math.round(255 * amount);
  r = r > 0 ? r : 0;
  g = g > 0 ? g : 0;
  b = b > 0 ? b : 0;
  return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// Sync critical race state with window using getters/setters for race.js compatibility
Object.defineProperty(window, 'gateOpen', {
  get() { return gateOpen; },
  set(v) { gateOpen = v; }
});
Object.defineProperty(window, 'running', {
  get() { return running; },
  set(v) { running = v; }
});
Object.defineProperty(window, 'winner', {
  get() { return winner; },
  set(v) { winner = v; }
});
Object.defineProperty(window, 'speedScale', {
  get() { return speedScale; },
  set(v) { speedScale = v; }
});
Object.defineProperty(window, 'openTime', {
  get() { return openTime; },
  set(v) { openTime = v; }
});
Object.defineProperty(window, 'biasUntil', {
  get() { return biasUntil; },
  set(v) { biasUntil = v; }
});
Object.defineProperty(window, 'goFxStart', {
  get() { return goFxStart; },
  set(v) { goFxStart = v; }
});
Object.defineProperty(window, 'goFxUntil', {
  get() { return goFxUntil; },
  set(v) { goFxUntil = v; }
});

// Direct references (arrays are already shared by reference)
window.horses = horses;
window.particles = particles;
window.liveSlipstreams = liveSlipstreams;
window.liveLightnings = liveLightnings;
window.liveMeteors = liveMeteors;

// Fix spinner duplicate visual bug - track mode changes (after mode & horses are declared)
let previousMode = mode;
function checkModeChange() {
  if (typeof mode !== 'undefined' && previousMode !== mode) {
    // Mode changed - force static layer rebuild to remove spinner artifacts
    if ((previousMode === 'editor' && (mode === 'play' || mode === 'race')) || 
        ((previousMode === 'play' || previousMode === 'race') && mode === 'editor')) {
      invalidateStaticLayer();
      console.log('🔄 Mode changed:', previousMode, '->', mode, '- Static layer invalidated');
    }
    previousMode = mode;
  }
}

// DEV MODE: Expose horses to global scope for Dev Mode access
window.gameHorses = horses;

// Expose live variables to global scope for RenderModule access
window.liveBoosts = liveBoosts;
window.liveTurbos = liveTurbos;
window.liveTeleports = liveTeleports;
window.liveMagnets = liveMagnets;
window.liveTimeFreezes = liveTimeFreezes;
window.livePoisons = livePoisons;
window.liveGhosts = liveGhosts;
window.liveTraps = liveTraps;
window.liveRams = liveRams;
window.liveShields = liveShields;
window.liveSpinners = liveSpinners;
window.liveTornados = liveTornados;
window.liveVolcanos = liveVolcanos;
window.liveMeteors = liveMeteors;
window.liveWarpzones = liveWarpzones;
window.liveQuantumdashs = liveQuantumdashs;
window.liveNebulas = liveNebulas;
window.getGameHorses = () => horses;

// updateWindowLiveReferences() - MOVED TO: scripts/core/race.js

// Enhanced Visual Effects
let screenShakeX = 0, screenShakeY = 0;
let backgroundParticles = [];
let lightningEffects = [];
let glowEffects = [];
// Winner spotlight timing
let winnerSpotlightUntil = 0;
// Floating texts for pickups/feedback
let floatingTexts = [];

// ===== Power-up System =====
// MOVED TO: scripts/core/powerup-system.js
// Access via: window.PowerupSystem or window.POWERUP_TYPES, window.createPowerupObject(), etc. for compatibility
// Default carrot sprite cache (if user provides PNG)
carrotSpriteImg = carrotSpriteImg || null;
// Screen shake
let shakeUntil = 0, shakeMag = 0;
let resultsShown = false; // to ensure results overlay shows once per race
let countdown=0, countdownTimer=null; // Set to 0 for instant race start (testing)
// Sync countdown/results with window using getters/setters for race.js compatibility
Object.defineProperty(window, 'resultsShown', {
  get() { return resultsShown; },
  set(v) { resultsShown = v; }
});
Object.defineProperty(window, 'countdown', {
  get() { return countdown; },
  set(v) { countdown = v; }
});
Object.defineProperty(window, 'countdownTimer', {
  get() { return countdownTimer; },
  set(v) { countdownTimer = v; }
});
// speed runtime
// Visual toggles
window.horseShadowEnabled = false; // default off per user preference
window.spinnerShadowEnabled = false; // default off per user preference
let runtimeSpeed=1.0;
Object.defineProperty(window, 'runtimeSpeed', {
  get() { return runtimeSpeed; },
  set(v) { runtimeSpeed = v; }
});
// Cached track noise pattern for subtle texture
let trackNoiseCanvas = null, trackNoisePattern = null;
// Motion trail settings for horses
window.horseMotionTrailEnabled = false;  // ← CHANGED: Disabled motion trail (was: true)
window.horseTrailMinSpeed = 2.2; // threshold to start trails
window.horseTrailCopies = 5;     // number of ghost stamps
window.horseTrailSpacing = 2.8;  // pixels per copy per unit speed
window.horseTrailAlpha = 0.12;   // base alpha per copy
let paused = false;
let photoFinishActive = false;
let _slowmoTimer = null, _prevRuntimeSpeed = null;
// Sync photo finish globals with window using getters/setters for race.js compatibility
Object.defineProperty(window, 'photoFinishActive', {
  get() { return photoFinishActive; },
  set(v) { photoFinishActive = v; }
});
Object.defineProperty(window, '_slowmoTimer', {
  get() { return _slowmoTimer; },
  set(v) { _slowmoTimer = v; }
});
Object.defineProperty(window, '_prevRuntimeSpeed', {
  get() { return _prevRuntimeSpeed; },
  set(v) { _prevRuntimeSpeed = v; }
});
const speedLiveVal = document.getElementById('speedLiveVal');

// Vector-drawn carrot helper - MOVED TO: scripts/utils/vector-drawing.js
// Access via: window.VectorDrawing or window.drawVectorCarrot() for compatibility
// Debug: show effective hitbox overlay
let debugShowHitbox = false;

// Debug: expose read-only references for console inspection
try {
  Object.defineProperty(window, 'liveTurbosRef', { get: ()=> liveTurbos });
  Object.defineProperty(window, 'mapTurbosRef', { get: ()=> mapDef.turbos });
} catch {}

// ===== Race functions - MOVED TO: scripts/core/race.js =====
// - startRace() - Start a new race with initialization
// - stopRaceToEditor() - Stop race and return to editor mode
// - showCountdown() - Show/hide countdown display
// - startCountdown() - Start countdown timer
// - openGate() - Open gate and begin race
// - triggerPhotoFinishSlowmo() - Trigger photo finish slow-motion effect
// - limitHorseSpeed() - Limit horse speed to maximum velocity
// - findFarthestHorse() - Find the farthest horse from a given horse

// ===== Simulation & Collisions =====

// Advanced Particle System for meteor
window.meteorParticles = window.meteorParticles || [];

function createMeteorParticles(meteor, settings) {
  const now = performance.now();
  if (now - meteor.lastEruption < (settings.eruptionInterval || 1000)) return;
  
  meteor.lastEruption = now;
  
  // Create particles with firework-style trajectory
  for (let i = 0; i < (settings.particleCount || 3); i++) {
    // Launch angle: upward arc like fireworks
    const baseAngle = -Math.PI/2; // -90° (straight up)
    const angleSpread = Math.PI/2; // ±45° spread
    const angle = baseAngle + (Math.random() - 0.5) * angleSpread;
    
    const baseSpeed = settings.launchSpeed || 1.7;
    const speed = baseSpeed * (0.7 + Math.random() * 0.6);
    
    const particle = {
      x: meteor.x,
      y: meteor.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 8000 + Math.random() * 4000, // 8-12 seconds
      maxLife: 12000,
      damage: settings.damage,
      color: '#FF6600'
    };
    
    window.meteorParticles.push(particle);
  }
}

// Particle physics and collision detection
function updateMeteorParticles() {
  for (let i = window.meteorParticles.length - 1; i >= 0; i--) {
    const particle = window.meteorParticles[i];
    
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Apply configurable gravity
    const gravityValue = (mapDef.meteorSettings && mapDef.meteorSettings.gravity) || 0.005;
    particle.vy += gravityValue;
    
    // Reduce life
    particle.life -= 16; // 60fps
    
    // Remove expired particles
    if (particle.life <= 0) {
      window.meteorParticles.splice(i, 1);
      continue;
    }
    
    // Collision detection with horses
    for (const horse of horses) {
      if (horse.eliminated) continue;
      
      const distance = Math.hypot(horse.x - particle.x, horse.y - particle.y);
      if (distance < (horse.r + 8)) {
        // Divine Guardian shield blocks lava particle damage
        if (horse.hasShield) {
          createExplosion(particle.x, particle.y, '#FFD700', 15);
          window.meteorParticles.splice(i, 1);
          i--;
          break; // Exit inner horse loop, move to next particle
        }
        
        // Damage horse
        horse.hp -= particle.damage;
        
        // Visual effects
        createExplosion(particle.x, particle.y, particle.color, 15);
        floatingTexts.push({
          x: particle.x, y: particle.y - 20,
          t: performance.now(), life: 1000,
          text: `-${particle.damage}`, color: particle.color
        });
        
        // Remove particle
        window.meteorParticles.splice(i, 1);
        break;
      }
    }
  }
}

function step(dt){
  if (mode!=="play" || !running) return;

  // === LUCK OR SUCK scheduler (spawn random power-ups during race) ===
  const now = performance.now();
  if (luckEnabled && gateOpen) {
    if (!nextLuckTs) {
      nextLuckTs = now + luckIntervalSec * 1000 * (0.7 + 0.6 * Math.random());
      console.log(`[Luck] 🍀 Scheduler started! Next spawn in ${Math.round((nextLuckTs - now)/1000)}s`);
    } else if (now >= nextLuckTs) {
      console.log(`[Luck] 🍀 Spawning power-up...`);
      spawnRandomLuckItem();
      nextLuckTs = now + luckIntervalSec * 1000 * (0.7 + 0.6 * Math.random());
    }
  }

  // DEV MODE: Update player movement before AI
  try {
    if (window.DevMode && window.DevMode.enabled() && window.DevMode.playerHorse()) {
      window.DevMode.updateMovement(dt || 16.67);
      
      // Also apply simple WASD movement
      const horse = window.DevMode.playerHorse();
      if (horse && horse.isPlayerControlled) {
        const keyStates = window.DevMode.getKeyStates ? window.DevMode.getKeyStates() : {};
        
        // Reset velocity and apply directional movement
        let vx = 0, vy = 0;
        const speed = 3; // Base movement speed
        
        if (keyStates['KeyW'] || keyStates['ArrowUp']) {
          vy = -speed; // Move up
        }
        if (keyStates['KeyS'] || keyStates['ArrowDown']) {
          vy = speed; // Move down
        }
        if (keyStates['KeyA'] || keyStates['ArrowLeft']) {
          vx = -speed; // Move left
        }
        if (keyStates['KeyD'] || keyStates['ArrowRight']) {
          vx = speed; // Move right
        }
        
        // Apply diagonal movement (normalize)
        if (vx !== 0 && vy !== 0) {
          const factor = speed / Math.hypot(vx, vy);
          vx *= factor;
          vy *= factor;
        }
        
        // Set velocity directly (don't accumulate)
        if (vx !== 0 || vy !== 0) {
          horse.vx = vx;
          horse.vy = vy;
        } else {
          // No keys pressed - gradual stop
          horse.vx *= 0.9;
          horse.vy *= 0.9;
        }
      }
    }
  } catch (e) {
    // Dev Mode not available or error
  }

  // Fire Aura power-up pickup collision (only in play/race mode, not editor)
  if (mode === 'play' || mode === 'race') {
    for (const horse of horses) {
      if (horse.eliminated) continue;
      
      for (let i = (mapDef.fireaura || []).length - 1; i >= 0; i--) {
        const aura = mapDef.fireaura[i];
        const dx = horse.x - aura.x;
        const dy = horse.y - aura.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < (aura.r || 20)) {
          // Horse picks up fire aura power-up
          const duration = aura.duration || 8000;
          horse.fireAuraUntil = performance.now() + duration;
          horse.fireAuraLastDamage = 0;
          horse.fireAuraDamage = aura.damage || 5; // Store damage from pickup
          horse.fireAuraRange = aura.range || 60; // Store range from pickup
          
          // Remove pickup from map
          mapDef.fireaura.splice(i, 1);
          
          // Visual effects
          createExplosion(aura.x, aura.y, '#FF4400', 20);
          const durationSec = Math.round(duration / 1000);
          floatingTexts.push({
            x: horse.x, y: horse.y - (horse.r || 8) - 10,
            t: performance.now(), life: 1000,
            text: `Fire Aura ${durationSec}s!`, color: '#FF4400'
          });
          
          try { playSfx('powerup'); } catch {}
          break;
        }
      }
    }
  }

  // Fire Aura effects for horses that have the power-up
  const currentTime = performance.now();
  for (const horse of horses) {
    if (horse.eliminated || !horse.fireAuraUntil || currentTime > horse.fireAuraUntil) continue;
    
    // This horse has fire aura active - damage nearby enemies
    for (const enemy of horses) {
      if (enemy === horse || enemy.eliminated) continue;
      
      const dx = enemy.x - horse.x;
      const dy = enemy.y - horse.y;
      const distance = Math.hypot(dx, dy);
      const auraRadius = horse.fireAuraRange || 60;
      
      if (distance < auraRadius) {
        // Apply slow effect (20% speed reduction)
        enemy.vx = (enemy.vx || 0) * 0.8;
        enemy.vy = (enemy.vy || 0) * 0.8;
        
        // Apply damage every 1 second
        if (!horse.fireAuraLastDamage) horse.fireAuraLastDamage = 0;
        if (currentTime - horse.fireAuraLastDamage >= 1000) {
          // Initialize enemy health if not exists
          if (!enemy.health) enemy.health = 100;
          
          // Apply damage (use stored damage from pickup)
          const damage = horse.fireAuraDamage || 5;
          enemy.health -= damage;
          horse.fireAuraLastDamage = currentTime;
          
          // Visual damage effect
          enemy.damageFlash = currentTime;
          
          // Floating damage text
          floatingTexts.push({
            x: enemy.x, y: enemy.y - (enemy.r || 8) - 5,
            t: currentTime, life: 800,
            text: `-${damage}`, color: '#FF0000'
          });
          
          // Eliminate enemy if health <= 0
          if (enemy.health <= 0) {
            enemy.eliminated = true;
            enemy.eliminatedTime = currentTime;
          }
        }
      }
    }
  }

  // Power-up collision detection (Nebula, Warpzone, Quantum Dash, etc.)
  // Use window.liveXXX if available (set by race.js), otherwise fallback to local
  const powerUpTypes = [
    { array: window.liveBoosts || liveBoosts, type: 'boost' },
    { array: window.liveTurbos || liveTurbos, type: 'turbo' },
    { array: window.liveTeleports || liveTeleports, type: 'teleport' },
    { array: window.liveMagnets || liveMagnets, type: 'magnet' },
    { array: window.liveTimeFreezes || liveTimeFreezes, type: 'timefreeze' },
    { array: window.liveIceFreezers || liveIceFreezers, type: 'icefreezer' },
    { array: window.liveTestpowers || liveTestpowers, type: 'testpower' },{ array: window.livePoisons || livePoisons, type: 'poison' },
    { array: window.liveGhosts || liveGhosts, type: 'ghost' },
    { array: window.liveRams || liveRams, type: 'ram' },
    { array: window.liveShields || liveShields, type: 'shield' },
    { array: window.liveWarpzones || liveWarpzones, type: 'warpzone' },
    { array: window.liveQuantumdashs || liveQuantumdashs, type: 'quantumdash' },
    { array: mapDef.nebulas, type: 'nebula' }, // Check mapDef.nebulas for collision (removed duplicate liveNebulas)
    // [PU-BEGIN name=yellowheart section=powerUpTypes]
    { array: mapDef.yellowhearts, type: 'yellowheart' }, // 💛 Yellowheart power-ups
    // [PU-END name=yellowheart section=powerUpTypes]
  ];

  for (const horse of horses) {
    if (horse.eliminated) continue;

    const isChillGuy = horse.skillState && horse.skillState.name === 'chill_guy';
    const chillBlockedTypes = ['boost','turbo','shield','ghost','ram','teleport','magnet','nebula','yellowheart','poison','trap','icefreezer','testpower'];

    powerUpTypes.forEach(({ array, type }) => {
      if (!Array.isArray(array)) return;

      for (let i = array.length - 1; i >= 0; i--) {
        const powerUp = array[i];
        if (!powerUp) continue;
        
        // Skip consumed power-ups
        if (powerUp.consumed) {
          // Debug logging removed
          continue;
        }

        const dx = horse.x - powerUp.x;
        const dy = horse.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < horse.r + powerUp.r) {
          // Skip already consumed power-ups
          if (powerUp.consumed && mode !== 'editor') {
            continue;
          }
          
          // Simple collision cooldown system
          const powerUpId = `${type}_${powerUp.x}_${powerUp.y}`;
          const now = performance.now();
          const COLLISION_COOLDOWN = 500; // 0.5 second cooldown for re-collision
          
          horse.lastCollisions = horse.lastCollisions || {};
          const lastCollisionTime = horse.lastCollisions[powerUpId] || 0;
          const timeSinceCollision = now - lastCollisionTime;
          
          // Skip if collided recently (cooldown active)
          if (timeSinceCollision < COLLISION_COOLDOWN) {
            continue;
          }
          
          // Update last collision time
          horse.lastCollisions[powerUpId] = now;
          
          // Chill Guy: completely ignores both positive and negative power-up effects
          if (isChillGuy && chillBlockedTypes.includes(type)) {
            continue;
          }

          // Apply power-up effects
          switch (type) {
            case 'nebula':
              horse.effects = horse.effects || {};
              const nebulaSettings = mapDef.nebulaSettings || {};
              horse.effects.nebula = {
                duration: powerUp.duration || nebulaSettings.durationMs || 4000,
                damageBoost: powerUp.damage || nebulaSettings.damage || 20,
                particleEnabled: powerUp.particleEnabled !== false && (nebulaSettings.particleEnabled !== false),
                intensity: powerUp.intensity || nebulaSettings.intensity || 1,
                startTime: performance.now()
              };
              
              // Visual effects
              createExplosion(powerUp.x, powerUp.y, '#9C27B0', 25);
              floatingTexts.push({
                x: horse.x, y: horse.y - (horse.r || 8) - 10,
                t: performance.now(), life: 1000,
                text: 'Nebula Damage!', color: '#9C27B0'
              });
              break;
              
            // [PU-BEGIN name=yellowheart section=collision-effects]
            case 'yellowheart':
              horse.effects = horse.effects || {};
              const yellowheartSettings = mapDef.yellowheartSettings || {};
              
              // Check stacking
              if (yellowheartSettings.stackable && horse.effects.yellowheart) {
                const currentStacks = horse.effects.yellowheart.stacks || 1;
                if (currentStacks < yellowheartSettings.maxStacks) {
                  horse.effects.yellowheart.stacks = currentStacks + 1;
                  horse.effects.yellowheart.startTime = performance.now(); // Reset timer
                }
              } else {
                horse.effects.yellowheart = {
                  duration: powerUp.duration || yellowheartSettings.duration || 4000,
                  damage: powerUp.damage || yellowheartSettings.damage || 25,
                  effectType: powerUp.effectType || yellowheartSettings.effectType || 'speed',
                  stacks: 1,
                  startTime: performance.now()
                };
              }
              
              // Visual effects
              createExplosion(powerUp.x, powerUp.y, '#FFD700', 25);
              floatingTexts.push({
                x: horse.x, y: horse.y - (horse.r || 8) - 10,
                t: performance.now(), life: 1000,
                text: 'Yellowheart 💛!', color: '#FFD700'
              });
              break;
            // [PU-END name=yellowheart section=collision-effects]
              
            case 'boost':
              // Apply permanent boost stack using settings
              const boostSettings = mapDef.boostSettings || { stackBonus: 0.2, maxStacks: 10, consumable: true };
              if (horse.skillState?.name !== 'chill_guy') {
                horse.boostStacks = Math.min(boostSettings.maxStacks, (horse.boostStacks||0) + 1);
                const t = horse.trapStacks||0, b = horse.boostStacks||0;
                horse.baseSpeedFactor = Math.max(0, 1 + boostSettings.stackBonus*b - 0.2*t);
              }
              
              // Visual effects
              createExplosion(powerUp.x, powerUp.y, '#FFD700', 20);
              try { createPickupBurst('boost', horse.x, horse.y, powerUp.r); } catch {}
              horse.speedLineUntil = performance.now() + 600;
              
              // Floating text
              const bonusPct = Math.round(boostSettings.stackBonus * 100);
              floatingTexts.push({ 
                x: horse.x, 
                y: horse.y - horse.r - 6, 
                t: performance.now(), 
                life: 900, 
                text: `Speed Up! +${bonusPct}%`, 
                color: '#ffd54f' 
              });
              
              // Event log
              const pctB = Math.round((horse.baseSpeedFactor||0) * 100);
              logEvent(`Ngựa ${horse.name || ('#'+(horse.i+1))} nhặt Boost: +${bonusPct}% tốc cơ bản (x${horse.boostStacks}) → ${pctB}%`);
              
              // Sound effect
              try { playSfx('boost_up'); } catch {}
              break;
              
            case 'turbo':
              // Apply turbo effect using settings
              const turboSettings = mapDef.turboSettings || { durationMs: 5000, multiplier: 2.2, consumable: true };
              horse.effects = horse.effects || {};
              horse.effects.turbo = { 
                duration: turboSettings.durationMs, 
                multiplier: turboSettings.multiplier, 
                startTime: performance.now() 
              };
              
              // CRITICAL: Set turboMultiplier and turboUntil for speed display calculation
              horse.turboMultiplier = turboSettings.multiplier;
              horse.turboUntil = performance.now() + turboSettings.durationMs;
              
              // Visual effects
              createExplosion(powerUp.x, powerUp.y, '#FF6B35', 20);
              try { createPickupBurst('turbo', horse.x, horse.y, powerUp.r); } catch {}
              
              // Floating text
              floatingTexts.push({ 
                x: horse.x, 
                y: horse.y - horse.r - 6, 
                t: performance.now(), 
                life: 1000, 
                text: `Turbo ${turboSettings.multiplier.toFixed(1)}x!`, 
                color: '#FF6B35' 
              });
              
              // Event log
              logEvent(`Ngựa ${horse.name || ('#'+(horse.i+1))} nhặt Turbo: ${turboSettings.multiplier.toFixed(1)}x tốc độ trong ${turboSettings.durationMs}ms`);
              break;
              
            case 'shield':
              // Apply shield using settings
              const shieldSettings = mapDef.shieldSettings || { durationMs: 10000, consumable: true };
              horse.hasShield = true;
              horse.shieldUntil = performance.now() + shieldSettings.durationMs;
              
              // Visual effects
              createExplosion(powerUp.x, powerUp.y, '#03A9F4', 20);
              try { createPickupBurst('shield', horse.x, horse.y, powerUp.r); } catch {}
              
              // Floating text
              floatingTexts.push({ 
                x: horse.x, 
                y: horse.y - horse.r - 6, 
                t: performance.now(), 
                life: 1000, 
                text: `Shield ${(shieldSettings.durationMs/1000).toFixed(0)}s!`, 
                color: '#03A9F4' 
              });
              
              // Event log
              logEvent(`Ngựa ${horse.name || ('#'+(horse.i+1))} nhặt Shield: bảo vệ ${(shieldSettings.durationMs/1000).toFixed(1)}s`);
              break;
              
            case 'ghost':
              const ghostSettings = mapDef.ghostSettings || { durationMs: 4000, transparency: 0.3 };
              if (horse.skillState?.name !== 'chill_guy') {
                horse.ghostedUntil = performance.now() + ghostSettings.durationMs;
              }
              try { playSfx('toggle'); } catch {}
              const ghostDurationSec = Math.round(ghostSettings.durationMs / 1000);
              floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: performance.now(), life: 800, text: `Ghost ${ghostDurationSec}s`, color: '#b39ddb' });
              horse.ghostRippleStart = performance.now();
              horse.doubleImageUntil = horse.ghostedUntil;
              try { createPickupBurst('ghost', horse.x, horse.y, powerUp.r); } catch {}
              logEvent(`Ngựa ${horse.name || ('#'+(horse.i+1))} đã nhặt được Ghost trong ${ghostDurationSec}s`);
              break;
              
            
            case 'ram':
              horse.hasRam = true;
              try {
                const ramDur = (mapDef && mapDef.ramSettings && Number.isFinite(mapDef.ramSettings.durationMs))
                  ? Math.max(200, mapDef.ramSettings.durationMs)
                  : 4000;
                horse.ramUntil = performance.now() + ramDur;
              } catch { horse.ramUntil = performance.now() + 4000; }
              try { playSfx('metal_tick'); } catch {}
              try { createPickupBurst('ram', horse.x, horse.y, powerUp.r); } catch {}
              floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: performance.now(), life: 900, text: 'RAM Power!', color: '#f44336' });
              logEvent(`Ngựa ${horse.name || ('#'+(horse.i+1))} đã nhặt được Ram`);
              break;
              
            case 'teleport':
              const teleportSettings = mapDef.teleportSettings || { safeMargin: 20, minDistance: 0 };
              const sm = teleportSettings.safeMargin;
              const md = teleportSettings.minDistance;
              let attempts = 20;
              let safeX = horse.x, safeY = horse.y;
              while (attempts-- > 0){
                const candX = Math.max(horse.r + sm, Math.min(cv.width - horse.r - sm, Math.random() * cv.width));
                const candY = Math.max(horse.r + sm, Math.min(cv.height - horse.r - sm, Math.random() * cv.height));
                const dist = Math.hypot(candX - horse.x, candY - horse.y);
                if (dist >= md){ safeX = candX; safeY = candY; break; }
              }
              horse.x = safeX; horse.y = safeY;
              horse.teleportGlowUntil = performance.now() + 1000;
              try { playSfx('teleport'); } catch {}
              floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: performance.now(), life: 1200, text: 'Teleported!', color: '#00bcd4' });
              try { createExplosion(powerUp.x, powerUp.y, '#00bcd4', 20); } catch {}
              try { createExplosion(horse.x, horse.y, '#00bcd4', 15); } catch {}
              logEvent(`Ngựa ${horse.name || ('#'+(horse.i+1))} đã dịch chuyển tức thời!`);
              break;
              
            case 'magnet':
              const nowTs = performance.now();
              const magnetSettings = mapDef.magnetSettings || { durationMs: 3000, power: 350 };
              const magnetDur = magnetSettings.durationMs;
              horse.magnetUntil = nowTs + magnetDur;
              horse.magnetPower = magnetSettings.power;
              horse.magnetStacks = 1;
              try { playSfx('magnet_on'); } catch {}
              floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: nowTs, life: 1400, text: `Magnet ${Math.round(magnetDur/1000)}s`, color: '#ffeb3b' });
              try { createExplosion(powerUp.x, powerUp.y, '#ffeb3b', 24); } catch {}
              try { createExplosion(horse.x, horse.y, '#ffeb3b', 20); } catch {}
              logEvent(`🧲 Ngựa ${horse.name || ('#'+(horse.i+1))} kích hoạt Magnet (${Math.round(magnetDur/1000)}s).`);
              break;
              
            case 'timefreeze':
              const timeNow = performance.now();
              const freezeTime = timeNow + 5000;
              let frozenCount = 0;
              for (const otherHorse of horses) {
                if (otherHorse !== horse && !otherHorse.eliminated) {
                  // Divine Guardian shield blocks Time Freeze
                  if (otherHorse.hasShield) {
                    try { createExplosion(otherHorse.x, otherHorse.y, '#FFD700', 18); } catch {}
                    floatingTexts.push({ x: otherHorse.x, y: otherHorse.y - otherHorse.r - 6, t: timeNow, life: 1000, text: 'Blocked!', color: '#FFD700' });
                    
                    // Consume Divine Guardian shield
                    otherHorse.hasShield = false;
                    if (otherHorse.guardianShieldActive && otherHorse.skillState?.name === 'guardian') {
                      otherHorse.guardianShieldActive = false;
                      otherHorse.skillState.status = 'cooldown';
                      otherHorse.skillState.cooldownUntil = timeNow + (otherHorse.skillState?.cooldown || 60000);
                      createExplosion(otherHorse.x, otherHorse.y, '#FFD700', 35);
                      floatingTexts.push({ x: otherHorse.x, y: otherHorse.y - otherHorse.r - 12, t: timeNow, life: 1200, text: 'Shield Used!', color: '#FF6B35' });
                    }
                    continue;
                  }
                  
                  otherHorse.timeFrozenUntil = freezeTime;
                  otherHorse.frozenUntil = Math.max(otherHorse.frozenUntil || 0, freezeTime);
                  // Save original speed before freezing (only if not already saved)
                  if (typeof otherHorse._preFreezeVx === 'undefined') {
                    otherHorse._preFreezeVx = otherHorse.vx;
                    otherHorse._preFreezeVy = otherHorse.vy;
                  }
                  otherHorse.vx = 0; otherHorse.vy = 0;
                  frozenCount++;
                  try { createExplosion(otherHorse.x, otherHorse.y, '#e1f5fe', 18); } catch {}
                }
              }
              horse.timeFreezeGlowUntil = timeNow + 1400;
              try { playSfx('time_freeze'); } catch {}
              floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: timeNow, life: 2200, text: `TIME FREEZE! ${frozenCount} horses`, color: '#0277bd' });
              try { createExplosion(powerUp.x, powerUp.y, '#e1f5fe', 34); } catch {}
              try { createExplosion(horse.x, horse.y, '#0277bd', 26); } catch {}
              try { addScreenShake(10, 420); } catch {}
              logEvent(`❄️ Ngựa ${horse.name || ('#'+(horse.i+1))} đã đóng băng ${frozenCount} ngựa khác trong 5 giây!`);
              break;

            case 'icefreezer':
              // Divine Guardian shield blocks ice freeze
              if (horse.hasShield) {
                createExplosion(powerUp.x, powerUp.y, '#FFD700', 25);
                floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: performance.now(), life: 1000, text: 'Blocked!', color: '#FFD700' });
                
                // Consume Divine Guardian shield
                horse.hasShield = false;
                if (horse.guardianShieldActive && horse.skillState?.name === 'guardian') {
                  horse.guardianShieldActive = false;
                  horse.skillState.status = 'cooldown';
                  horse.skillState.cooldownUntil = performance.now() + (horse.skillState?.cooldown || 60000);
                  createExplosion(horse.x, horse.y, '#FFD700', 35); // Shield break effect
                  floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 12, t: performance.now(), life: 1200, text: 'Shield Used!', color: '#FF6B35' });
                }
                break;
              }
              
              const iceNow = performance.now();
              const iceFreezeSettings = mapDef.icefreezerSettings || { durationMs: 2000, slowMultiplier: 0.7, freezeDurationMs: 2000 };
              const iceDur = iceFreezeSettings.durationMs;
              const iceSlow = iceFreezeSettings.slowMultiplier;
              const iceFreezeDur = iceFreezeSettings.freezeDurationMs || iceDur;
              
              // Apply ice freeze effect to the horse that hit it
              horse.iceFrozenUntil = iceNow + iceDur;
              horse.iceSlowMultiplier = iceSlow;
              
              // Freeze the horse completely for the duration (like Time Freeze but only this horse)
              horse.frozenUntil = Math.max(horse.frozenUntil || 0, iceNow + iceFreezeDur);
              // Save original speed before freezing (only if not already saved)
              if (typeof horse._preFreezeVx === 'undefined') {
                horse._preFreezeVx = horse.vx;
                horse._preFreezeVy = horse.vy;
              }
              horse.vx = 0;
              horse.vy = 0;
              
              // Visual effects
              try { playSfx('freeze'); } catch {}
              floatingTexts.push({ 
                x: horse.x, 
                y: horse.y - horse.r - 6, 
                t: iceNow, 
                life: 1600, 
                text: `🧊 FROZEN ${Math.round(iceFreezeDur/1000)}s!`, 
                color: '#01579b' 
              });
              try { createExplosion(powerUp.x, powerUp.y, '#b3e5fc', 28); } catch {}
              try { createExplosion(horse.x, horse.y, '#81d4fa', 22); } catch {}
              try { createExplosion(horse.x, horse.y, '#b3e5fc', 18); } catch {}
              try { createPickupBurst('icefreezer', horse.x, horse.y, powerUp.r); } catch {}
              horse.iceFreezeGlowUntil = iceNow + iceFreezeDur;
              logEvent(`🧊 Ngựa ${horse.name || ('#'+(horse.i+1))} bị đóng băng hoàn toàn (${Math.round(iceFreezeDur/1000)}s).`);
              break;

            case 'testpower':
              const testpowerNow = performance.now();
              const testpowerSettings = mapDef.testpowerSettings || { damage: 20, healAmount: 0, consumable: true };
              
              // Apply damage immediately
              horse.hp = (horse.hp || 100) - (testpowerSettings.damage || 20);
              if (horse.hp <= 0) {
                horse.eliminated = true;
                horse.hp = 0;
              }
              
              
              // Visual effects
              try { playSfx('powerup'); } catch {}
              floatingTexts.push({ 
                x: horse.x, 
                y: horse.y - horse.r - 6, 
                t: testpowerNow, 
                life: 1600, 
                text: `⚡ -${testpowerSettings.damage || 20} HP!`, 
                color: '#ffffff' 
              });
              try { createExplosion(powerUp.x, powerUp.y, '#ffffff', 24); } catch {}
              try { createExplosion(horse.x, horse.y, '#cccccc', 20); } catch {}
              try { createPickupBurst('testpower', horse.x, horse.y, powerUp.r); } catch {}
              
              logEvent(`⚡ Ngựa ${horse.name || ('#'+(horse.i+1))} nhặt được testpower! (-${testpowerSettings.damage || 20} HP)`);
              break;
            case 'poison':
              // Divine Guardian shield blocks poison
              if (horse.hasShield) {
                createExplosion(powerUp.x, powerUp.y, '#FFD700', 25);
                floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: performance.now(), life: 1000, text: 'Blocked!', color: '#FFD700' });
                
                // Consume Divine Guardian shield
                horse.hasShield = false;
                if (horse.guardianShieldActive && horse.skillState?.name === 'guardian') {
                  horse.guardianShieldActive = false;
                  horse.skillState.status = 'cooldown';
                  horse.skillState.cooldownUntil = performance.now() + (horse.skillState?.cooldown || 60000);
                  createExplosion(horse.x, horse.y, '#FFD700', 35);
                  floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 12, t: performance.now(), life: 1200, text: 'Shield Used!', color: '#FF6B35' });
                }
                break;
              }
              
              const poisonNow = performance.now();
              const poisonSettings = mapDef.poisonSettings || { durationMs: 5000 };
              const poisonDur = poisonSettings.durationMs;
              horse.poisonUntil = poisonNow + poisonDur;
              try { playSfx('poison_on'); } catch {}
              floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: poisonNow, life: 1400, text: `Poisoned ${Math.round(poisonDur/1000)}s`, color: '#8e24aa' });
              try { createExplosion(powerUp.x, powerUp.y, '#8e24aa', 24); } catch {}
              try { createExplosion(horse.x, horse.y, '#8e24aa', 20); } catch {}
              logEvent(`☠️ Ngựa ${horse.name || ('#'+(horse.i+1))} bị nhiễm độc (${Math.round(poisonDur/1000)}s).`);
              break;
              
            case 'trap':
              // Divine Guardian shield blocks trap
              if (horse.hasShield) {
                createExplosion(powerUp.x, powerUp.y, '#FFD700', 25);
                floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 6, t: performance.now(), life: 1000, text: 'Blocked!', color: '#FFD700' });
                
                // Consume Divine Guardian shield
                horse.hasShield = false;
                if (horse.guardianShieldActive && horse.skillState?.name === 'guardian') {
                  horse.guardianShieldActive = false;
                  horse.skillState.status = 'cooldown';
                  horse.skillState.cooldownUntil = performance.now() + (horse.skillState?.cooldown || 60000);
                  createExplosion(horse.x, horse.y, '#FFD700', 35);
                  floatingTexts.push({ x: horse.x, y: horse.y - horse.r - 12, t: performance.now(), life: 1200, text: 'Shield Used!', color: '#FF6B35' });
                }
                break;
              }
              
              // Ice trap: freezes the horse that hits it (not others)
              const trapNow = performance.now();
              const trapSettings = mapDef.trapSettings || { durationMs: 3000, slowMultiplier: 0.5 };
              const trapDur = trapSettings.durationMs;
              const trapSlow = trapSettings.slowMultiplier;
              
              // Apply slow effect to the horse that hit the trap
              horse.trapSlowUntil = trapNow + trapDur;
              horse.trapSlowMultiplier = trapSlow;
              
              // Visual effects
              try { playSfx('freeze'); } catch {}
              try { createExplosion(powerUp.x, powerUp.y, '#b3e5fc', 24); } catch {}
              try { createExplosion(horse.x, horse.y, '#87CEEB', 20); } catch {}
              
              // Floating text
              const slowPercent = Math.round((1 - trapSlow) * 100);
              floatingTexts.push({
                x: horse.x,
                y: horse.y - horse.r - 6,
                t: trapNow,
                life: 1400,
                text: `Frozen ${Math.round(trapDur / 1000)}s (-${slowPercent}%)`,
                color: '#64b5f6'
              });
              
              logEvent(`🧊 Ngựa ${horse.name || ('#'+(horse.i+1))} bị đóng băng (${Math.round(trapDur/1000)}s, -${slowPercent}% tốc độ).`);
              break;
              
            // Add other power-up cases as needed
          }
          
          // Remove power-up (except permanent ones like warpzones and non-consumable items)
          if (type !== 'warpzone') {
            // Universal consumable logic for all power-ups
            let powerUpSettings = {};
            let defaultConsumable = true; // Default: all power-ups are consumable
            
            if (type === 'nebula') {
              powerUpSettings = mapDef.nebulaSettings || {};
              defaultConsumable = false; // Nebula defaults to non-consumable
            } else if (type === 'warpzone') {
              powerUpSettings = mapDef.warpzoneSettings || {};
              defaultConsumable = false; // Warpzone defaults to non-consumable
            } else if (type === 'yellowheart') {
              powerUpSettings = mapDef.yellowheartSettings || {};
            } else if (type === 'boost') {
              powerUpSettings = mapDef.boostSettings || {};
            } else if (type === 'turbo') {
              powerUpSettings = mapDef.turboSettings || {};
            } else if (type === 'shield') {
              powerUpSettings = mapDef.shieldSettings || {};
            } else if (type === 'teleport') {
              powerUpSettings = mapDef.teleportSettings || {};
            } else if (type === 'quantumdash') {
              powerUpSettings = mapDef.quantumdashSettings || {};
            } else if (type === 'ghost') {
              powerUpSettings = mapDef.ghostSettings || {};
            } else if (type === 'poison') {
              powerUpSettings = mapDef.poisonSettings || {};
            } else if (type === 'ram') {
              powerUpSettings = mapDef.ramSettings || {};
            } else if (type === 'magnet') {
              powerUpSettings = mapDef.magnetSettings || {};
            } else if (type === 'trap') {
              powerUpSettings = mapDef.trapSettings || {};
              defaultConsumable = false; // Trap defaults to non-consumable
            } else if (type === 'timefreeze') {
              powerUpSettings = mapDef.timeFreezeSettings || {};
            } else if (type === 'icefreezer') {
              powerUpSettings = mapDef.icefreezerSettings || {};
            } else if (type === 'tornado') {
              powerUpSettings = mapDef.tornadoSettings || {};
            } else if (type === 'volcano') {
              powerUpSettings = mapDef.volcanoSettings || {};
            } else if (type === 'lightning') {
              powerUpSettings = mapDef.lightningSettings || {};
            } else if (type === 'meteor') {
              powerUpSettings = mapDef.meteorSettings || {};
            }
            
            const isConsumable = powerUp.consumable !== undefined ? 
              powerUp.consumable : (powerUpSettings.consumable !== undefined ? powerUpSettings.consumable : defaultConsumable);
            
            // Mark consumable items as consumed (they disappear after first use)
            if (isConsumable && mode !== 'editor') {
              powerUp.consumed = true;
            }
          }
          
          try { playSfx('powerup'); } catch {}
          break;
        }
      }
    });
  }

  // Process horse effects (speed multipliers, etc.)
  for (const horse of horses) {
    if (horse.eliminated || !horse.effects) continue;

    const currentTime = performance.now();
    let speedMultiplier = 1.0;

    // Process Nebula effect
    if (horse.effects.nebula) {
      const nebula = horse.effects.nebula;
      const elapsed = currentTime - (nebula.startTime || currentTime);
      
      if (elapsed < nebula.duration) {
        // Apply damage boost to horse
        horse.damageBoost = (horse.damageBoost || 0) + (nebula.damageBoost || 20);
      } else {
        // Effect expired - remove damage boost
        horse.damageBoost = Math.max(0, (horse.damageBoost || 0) - (nebula.damageBoost || 20));
        delete horse.effects.nebula;
      }
    }

    // Process other effects
    if (horse.effects.boost) {
      const elapsed = currentTime - (horse.effects.boost.startTime || currentTime);
      if (elapsed < horse.effects.boost.duration) {
        speedMultiplier *= 1.5;
      } else {
        delete horse.effects.boost;
      }
    }

    if (horse.effects.turbo) {
      const elapsed = currentTime - (horse.effects.turbo.startTime || currentTime);
      if (elapsed < horse.effects.turbo.duration) {
        // Use actual multiplier from settings, not hardcoded 2.0
        speedMultiplier *= (horse.effects.turbo.multiplier || 2.0);
      } else {
        delete horse.effects.turbo;
        // Clean up turboMultiplier when effect expires
        horse.turboMultiplier = 1.0;
        horse.turboUntil = 0;
      }
    }

    // Apply speed multiplier
    if (speedMultiplier !== 1.0) {
      horse.vx = (horse.vx || 0) * speedMultiplier;
      horse.vy = (horse.vy || 0) * speedMultiplier;
    }
  }

  // Fire Trap physics effects (ONLY in play/race mode and HP system enabled)
  if ((mode === 'play' || mode === 'race') && mapDef.hpSystemEnabled) {
    const firetraps = mapDef.firetrap || [];
    for (const item of firetraps) {
      // Initialize trap timer if not exists
      if (!item.lastDamageTime) item.lastDamageTime = 0;
      
      for (const horse of horses) {
        if (horse.eliminated) continue;
        const dx = horse.x - item.x;
        const dy = horse.y - item.y;
        const distance = Math.hypot(dx, dy);
        const trapRadius = (item.r || 50);
        
        if (distance < trapRadius) {
          // Divine Guardian shield blocks firetrap effects
          if (horse.hasShield) {
            continue; // Skip this horse
          }
          
          // Apply slow effect (20% speed reduction)
          horse.vx = (horse.vx || 0) * 0.8;
          horse.vy = (horse.vy || 0) * 0.8;
          
          // Apply damage every 1 second (1000ms)
          const currentTime = performance.now();
          if (currentTime - item.lastDamageTime >= 1000) {
            // Initialize horse HP if not exists
            if (typeof horse.hp !== 'number') horse.hp = mapDef.horseMaxHP || 100;
            
            // Apply damage (use setting from object or default)
            const damage = item.damage || 10;
            horse.hp -= damage;
            item.lastDamageTime = currentTime;
            
            // Visual damage effect
            horse.damageFlash = currentTime;
            horse.damageImpactUntil = currentTime + 200;
            horse.damageImpactStrength = 0.8;
            
            // Floating damage text
            floatingTexts.push({
              x: horse.x, y: horse.y - (horse.r || 8) - 5,
              t: currentTime, life: 800,
              text: `-${damage}`, color: '#FF0000'
            });
            
            // Eliminate horse if health <= 0
            if (horse.hp <= 0) {
              horse.eliminated = true;
              horse.eliminatedTime = currentTime;
            }
          }
        }
      }
    }
  }

  // Update live spinners rotation
  const tooManySpinners = (liveSpinners && liveSpinners.length > 40);
  for (const s of liveSpinners) {
    s.angle += s.speed * dt * 0.1; // Adjust multiplier for desired speed
    // Maintain a short trail of previous angles (time-based decay)
    try {
      if (tooManySpinners) continue; // performance guard
      const nowTrail = performance.now();
      const trailMs = Math.max(60, Math.min(600, window.spinnerTrailMs ?? 200));
      const trailSamples = Math.max(3, Math.min(16, window.spinnerTrailSamples ?? 8));
      if (!s._trail) s._trail = [];
      s._trail.push({ angle: s.angle, ts: nowTrail });
      // Keep only recent samples within configured ms window
      const cutoff = nowTrail - trailMs;
      while (s._trail.length > 0 && s._trail[0].ts < cutoff) s._trail.shift();
      if (s._trail.length > trailSamples) s._trail.splice(0, s._trail.length - trailSamples);
    } catch {}
  }
  
function spawnRandomLuckItem(){
  try {
    // ALL power-up types in the game
    const choices = [
      'boost', 'ghost', 'trap', 'shield', 'ram', 'turbo',
      'teleport', 'magnet', 'timefreeze', 'poison', 'warpzone', 'quantumdash'
    ];
    const type = choices[Math.floor(Math.random() * choices.length)];
    const r = 16; // Standard radius like other power-ups
    
    // Use mapDef dimensions
    const mapW = mapDef.width || 1600;
    const mapH = mapDef.height || 900;
    const waitingRoom = mapDef.waitingRoom || { x: 0, w: 300 };
    const minX = (waitingRoom.x || 0) + (waitingRoom.w || 300) + 100;
    const maxX = mapW - 100;
    const minY = 100;
    const maxY = mapH - 100;
    
    const x = Math.round(minX + Math.random() * (maxX - minX));
    const y = Math.round(minY + Math.random() * (maxY - minY));
    const obj = { x, y, r, _luckSpawned: true }; // Flag for cleanup
    
    // Push to appropriate arrays
    switch(type){
      case 'boost':
        liveBoosts.push(obj);
        if (!mapDef.boosts) mapDef.boosts = [];
        mapDef.boosts.push(obj);
        break;
      case 'ghost':
        liveGhosts.push(obj);
        if (!mapDef.ghosts) mapDef.ghosts = [];
        mapDef.ghosts.push(obj);
        break;
      case 'trap':
        liveTraps.push(obj);
        if (!mapDef.traps) mapDef.traps = [];
        mapDef.traps.push(obj);
        break;
      case 'shield':
        liveShields.push(obj);
        if (!mapDef.shields) mapDef.shields = [];
        mapDef.shields.push(obj);
        break;
      case 'ram':
        liveRams.push(obj);
        if (!mapDef.rams) mapDef.rams = [];
        mapDef.rams.push(obj);
        break;
      case 'turbo':
        liveTurbos.push(obj);
        if (!mapDef.turbos) mapDef.turbos = [];
        mapDef.turbos.push(obj);
        break;
      case 'teleport':
        liveTeleports.push(obj);
        if (!mapDef.teleports) mapDef.teleports = [];
        mapDef.teleports.push(obj);
        break;
      case 'magnet':
        liveMagnets.push(obj);
        if (!mapDef.magnets) mapDef.magnets = [];
        mapDef.magnets.push(obj);
        break;
      case 'timefreeze':
        liveTimeFreezes.push(obj);
        if (!mapDef.timeFreezes) mapDef.timeFreezes = [];
        mapDef.timeFreezes.push(obj);
        break;
      case 'poison':
        livePoisons.push(obj);
        if (!mapDef.poisons) mapDef.poisons = [];
        mapDef.poisons.push(obj);
        break;
      case 'warpzone':
        liveWarpzones.push(obj);
        if (!mapDef.warpzones) mapDef.warpzones = [];
        mapDef.warpzones.push(obj);
        break;
      case 'quantumdash':
        liveQuantumdashs.push(obj);
        if (!mapDef.quantumdashs) mapDef.quantumdashs = [];
        mapDef.quantumdashs.push(obj);
        break;
    }
    
    // CRITICAL: Sync to window for RenderModule to see
    window.liveBoosts = liveBoosts;
    window.liveGhosts = liveGhosts;
    window.liveTraps = liveTraps;
    window.liveShields = liveShields;
    window.liveRams = liveRams;
    window.liveTurbos = liveTurbos;
    window.liveTeleports = liveTeleports;
    window.liveMagnets = liveMagnets;
    window.liveTimeFreezes = liveTimeFreezes;
    window.livePoisons = livePoisons;
    window.liveWarpzones = liveWarpzones;
    window.liveQuantumdashs = liveQuantumdashs;
    
    console.log(`[Luck] ✅ Spawned ${type} at (${x}, ${y})`);
    
    const nameMap = {
      boost:'⚡ Boost', ghost:'👻 Ghost', trap:'🪤 Trap', shield:'🛡️ Shield',
      ram:'🐏 Ram', turbo:'🚀 Turbo', teleport:'🌀 Teleport', magnet:'🧲 Magnet',
      timefreeze:'❄️ Time Freeze', poison:'☠️ Poison', warpzone:'🌌 Warpzone', quantumdash:'⚡ Quantum Dash'
    };
    if (typeof logEvent === 'function') logEvent(`🍀 ${nameMap[type]} spawned!`);
    try { createExplosion(x, y, '#00FF7F', 25); } catch {}
  } catch (e) { console.error('[Luck] Error:', e); }
}

// Luck scheduler moved to step() function

  // Update rotating barriers - pendulum swing motion (always, even in editor mode)
  const rotatingBarriers = mapDef.rotatingBarriers || [];
  for (const barrier of rotatingBarriers) {
    const dt = 1/60; // Assume 60 FPS
    const time = performance.now() / 1000; // Convert to seconds
    const swingSpeed = barrier.swingSpeed || 1.5; // oscillations per second
    const swingRange = barrier.swingRange || Math.PI / 3; // 60 degrees total swing
    
    // Pendulum motion: sin wave between -swingRange/2 and +swingRange/2
    barrier.angle = Math.sin(time * swingSpeed * 2 * Math.PI) * (swingRange / 2);
  }

  // Process magnetic pull effects on horses (only in play mode)
  if (mode === 'play' || mode === 'race') {
    const magnetpulls = mapDef.magnetpulls || [];
    for (const magnet of magnetpulls) {
      for (const horse of horses) {
        if (horse.eliminated) continue;
        
        const dx = magnet.x - horse.x;
        const dy = magnet.y - horse.y;
        const distance = Math.hypot(dx, dy);
        
        // Check if horse is within attraction radius
        if (distance < (magnet.radius || 80) && distance > 10) {
          const strength = magnet.strength || 2.0;
          const force = strength * 0.5; // Stronger base force
          
          // Normalize direction and apply force
          const forceX = (dx / distance) * force;
          const forceY = (dy / distance) * force;
          
          // Apply magnetic attraction to horse position directly
          horse.x += forceX * 0.3;
          horse.y += forceY * 0.3;
          
          // Also apply to velocity for smooth movement
          horse.vx = (horse.vx || 0) + forceX * 0.2;
          horse.vy = (horse.vy || 0) + forceY * 0.2;
          
          // Limit maximum velocity to prevent chaos
          const maxVel = 6;
          const currentVel = Math.hypot(horse.vx, horse.vy);
          if (currentVel > maxVel) {
            horse.vx = (horse.vx / currentVel) * maxVel;
            horse.vy = (horse.vy / currentVel) * maxVel;
          }
        }
      }
    }

    // Process magnetic push effects on horses (repulsion)
    const magnetpushs = mapDef.magnetpushs || [];
    for (const magnet of magnetpushs) {
      for (const horse of horses) {
        if (horse.eliminated) continue;
        
        const dx = horse.x - magnet.x; // Reversed direction for repulsion
        const dy = horse.y - magnet.y;
        const distance = Math.hypot(dx, dy);
        
        // Check if horse is within repulsion radius
        if (distance < (magnet.radius || 80) && distance > 5) {
          const strength = magnet.strength || 2.0;
          const force = strength * 0.6; // Slightly stronger for push effect
          
          // Normalize direction and apply repulsive force
          const forceX = (dx / distance) * force;
          const forceY = (dy / distance) * force;
          
          // Apply magnetic repulsion to horse position directly
          horse.x += forceX * 0.4;
          horse.y += forceY * 0.4;
          
          // Also apply to velocity for smooth movement
          horse.vx = (horse.vx || 0) + forceX * 0.3;
          horse.vy = (horse.vy || 0) + forceY * 0.3;
          
          // Limit maximum velocity to prevent chaos
          const maxVel = 8; // Slightly higher for dramatic push effect
          const currentVel = Math.hypot(horse.vx, horse.vy);
          if (currentVel > maxVel) {
            horse.vx = (horse.vx / currentVel) * maxVel;
            horse.vy = (horse.vy / currentVel) * maxVel;
          }
        }
      }
    }
  }

  for (const h of horses){
    if (h.eliminated) continue;
    
    // Reset per-frame modifiers
    h.damageBonus = 0; // Reset damage bonus each frame
    
    // Track previous velocity for dust FX
    const _pvx = h.vx || 0, _pvy = h.vy || 0;
    h._prevVX = _pvx; h._prevVY = _pvy;
    
    // Skip movement if frozen, but allow other logic to run
    const isFrozen = now < h.frozenUntil;
    
    // Restore speed when freeze ends (if speed was saved before freezing)
    if (!isFrozen && typeof h._preFreezeVx !== 'undefined') {
      // Only restore if horse is still at 0 speed (wasn't modified by other effects)
      if (h.vx === 0 && h.vy === 0) {
        h.vx = h._preFreezeVx;
        h.vy = h._preFreezeVy;
        console.log(`[TimeFreeze] ❄️→🏃 ${h.name || '#'+(h.i+1)} speed restored: (${h.vx.toFixed(2)}, ${h.vy.toFixed(2)})`);
      }
      delete h._preFreezeVx;
      delete h._preFreezeVy;
    }
    
    // DEV MODE: Skip AI processing for player-controlled horses but allow movement
    if (h.isPlayerControlled) {
      // Skip AI logic but continue to movement code
    } else {

    // --- SKILL STATE MANAGEMENT ---
    if (h.skillState) {
      // Guard raceTime and activationTime
      const raceTime = gateOpen ? (now - openTime) : 0;
      

      switch (h.skillState.status) {
        case 'ready':
          {
            const act = (isFinite(h.skillState.activationTime) ? h.skillState.activationTime : 0);
            // Debug: show timing until activation
            if (gateOpen && window.debugSkills) {
              const _ld = h._lastSkillDbgTs || 0;
              if ((now - _ld) > 1000) {
                try { console.debug(`[SkillDBG] #${h.i} ${h.skillState.name} status=ready raceTime=${Math.round(raceTime)} act=${act}`); } catch {}
                h._lastSkillDbgTs = now;
              }
            }
            if (gateOpen && raceTime >= act) {
            h.skillState.status = 'active';
            try { if (window.debugSkills) console.debug(`[SkillDBG] #${h.i} ${h.skillState.name} ACTIVATED at raceTime=${Math.round(raceTime)}`); } catch {}
            // === Event announce: horse uses skill ===

            // === Event announce: horse uses skill ===
            try {
              const _skillNames = {
                hunter: "Hunter's Gambit",
                guardian: "Divine Guardian",
                phantom_strike: "Phantom Strike",
                cosmic_swap: "Cosmic Swap",
                gravity_well: "Gravity Well",
                overdrive: "Overdrive",
                slipstream: "Slipstream",
                shockwave: "Shockwave",
                chill_guy: "Chill Guy",
                oguri_fat: "Oguri Fat",
                silence_shizuka: "Silence Shizuka",
                fireball: "Fireball",
                energy_ball: "Energy Ball",
                supersonic_speed: "Supersonic Speed"
              };
              const _sname = _skillNames[h.skillState.name] || h.skillState.name;
              const _hname = (h && (h.name || ('#' + ((h.i!=null? h.i+1 : (h.idx||'')))))) || 'Ngựa';
              if (typeof logEvent === 'function') {
                logEvent(`Ngựa ${_hname} đã sử dụng kỹ năng ${_sname}.`);
              } else if (typeof toast === 'function') {
                toast(`Ngựa ${_hname} đã sử dụng kỹ năng ${_sname}.`);
              } else if (typeof addEvent === 'function') {
                addEvent(`Ngựa ${_hname} đã sử dụng kỹ năng ${_sname}.`);
              }
            } catch (e) { /* silent */ }

            switch (h.skillState.name) {
              case 'hunter':
                h.skillState.endTime = now + h.skillState.duration;
                h.hasRam = true;
                h.ramUntil = h.skillState.endTime;
                createExplosion(h.x, h.y, '#FFA500', 15);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '🎯 HUNTER MODE!', color: '#FFA500' });
                break;
              case 'shockwave':
                // Simple AOE: knockback + slow opponents; visual expanding ring
                h.skillState.endTime = now + (h.skillState.duration || 1200);
                createExplosion(h.x, h.y, '#FF1493', 25);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '💥 SHOCKWAVE!', color: '#FF1493' });
                try { playSfx('powerup'); } catch {}
                break;
              case 'chain_lightning':
                {
                  // Build chain to up to N targets within radius; track by IDs so arcs follow movement
                  const maxJumps = Math.max(1, h.skillState.maxJumps || 3);
                  const R = Math.max(20, h.skillState.jumpRadius || 130);
                  const arcs = [];
                  const hit = new Set();
                  let current = h;
                  for (let j=0; j<maxJumps; j++){
                    let best=null, bestD=1e9;
                    for (const o of horses){
                      if (!o || o===current || o===h || o.eliminated) continue;
                      if (hit.has(o)) continue;
                      // Skip ghosted targets (e.g., Phantom Strike)
                      if (o.ghostedUntil && now < o.ghostedUntil) continue;
                      const dx=o.x-current.x, dy=o.y-current.y; const d=Math.hypot(dx,dy);
                      if (d<bestD && d<=R) { best=o; bestD=d; }
                    }
                    if (!best) break;
                    // Record arc segment by horse IDs with explicit lifetime
                    const life0 = 900; // ms, longer persistence for visibility
                    arcs.push({fromId: current.id, toId: best.id, until: now + life0, life0});
                    hit.add(best);
                    
                    // Effects on target - Divine Guardian shield blocks Chain Lightning
                    if (!best.hasShield) {
                      // Save velocity before stun (for restoration after)
                      if (typeof best._preChainStunVx === 'undefined') {
                        best._preChainStunVx = best.vx;
                        best._preChainStunVy = best.vy;
                      }
                      best.chainStunUntil = now + (h.skillState.stunMs || 2500);
                      best.chainSlowMultiplier = h.skillState.slowMultiplier || 0.55;
                      best.chainSlowUntil = now + (h.skillState.slowMs || 3500);
                      floatingTexts.push({ x: best.x, y: best.y - (best.r||8) - 6, t: performance.now(), life: 500, text: 'ZAP!', color: '#b3e5fc' });
                    } else {
                      floatingTexts.push({ x: best.x, y: best.y - (best.r||8) - 6, t: performance.now(), life: 500, text: 'BLOCKED!', color: '#FFD700' });
                    }
                    // impact sparks
                    try {
                      for (let k=0;k<6;k++) {
                        particles.push({ x: best.x, y: best.y, vx:(Math.random()-0.5)*1.2, vy:(Math.random()-0.5)*1.2, life: 28 + (Math.random()*14)|0, color:'#81D4FA' });
                      }
                    } catch {}
                    current = best;
                  }
                  h._chainArcs = arcs;
                  h.skillState.endTime = now + (h.skillState.duration || 1200);
                  // brief caster flash
                  h._chainFlashUntil = now + 160;
                  try { playSfx('zap'); } catch {}
                  floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 600, text: 'Chain Lightning!', color: '#e1f5fe' });
                }
                break;
              case 'phantom_strike':
                h.skillState.endTime = now + h.skillState.duration;
                h.ghostedUntil = h.skillState.endTime;
                h.skillState.canAttack = true;
                createExplosion(h.x, h.y, '#9400D3', 20);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '👻 PHANTOM!', color: '#9400D3' });
                break;
              case 'cosmic_swap':
                // Freeze others for 1s and mark target at activation time
                const markedTarget = findFarthestHorse(h);
                for (const other of horses) {
                  if (other !== h) other.frozenUntil = now + 1000;
                }
                createExplosion(h.x, h.y, '#00FFFF', 25);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '🌌 COSMIC SWAP!', color: '#00FFFF' });
                try { playSfx('powerup'); } catch {}
                setTimeout(() => {
                  // Prefer marked target if still valid; fallback to current farthest
                  const target = (markedTarget && !markedTarget.eliminated) ? markedTarget : findFarthestHorse(h);
                  if (target) {
                    // Teleport near target (not swapping). Offset slightly to avoid perfect overlap
                    const ang = Math.atan2(target.y - h.y, target.x - h.x) || 0;
                    const offset = (h.r || 8) + 2;
                    h.x = target.x + Math.cos(ang) * offset;
                    h.y = target.y + Math.sin(ang) * offset;
                  }
                  h.skillState.status = 'cooldown';
                  h.skillState.cooldownUntil = performance.now() + (h.skillState?.cooldown || 80000);
                  h._lastLuckCheck = performance.now(); // Reset luck timer when entering cooldown
                }, 1000);
                break;
              case 'overdrive':
                h.skillState.endTime = now + h.skillState.duration;
                h.speedMod = 1.6; // boost during active
                createExplosion(h.x, h.y, '#FF4500', 20);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '⚡ OVERDRIVE!', color: '#FF4500' });
                try { playSfx('boost_up'); } catch {}
                break;
              case 'slipstream':
                h.skillState.endTime = now + h.skillState.duration;
                h.speedMod = 1.4; // +40% self
                try { playSfx('boost_up'); } catch {}
                floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1000, text: 'Slipstream +40%', color: '#b2ebf2' });
                h.speedLineUntil = performance.now() + 1200;
                const emitGapMs = (h.skillState?.emitGapMs || 120);
                const _last = (h._lastSlipEmitTs || 0);
                if ((now - _last) >= emitGapMs) {
                  h._lastSlipEmitTs = now;
                  const dir = h.dir || 'R';
                  let backX = h.x, backY = h.y;
                  const backOff = Math.max(6, h.r || 8);
                  if (dir === 'L') backX = h.x + backOff;
                  else if (dir === 'R') backX = h.x - backOff;
                  else if (dir === 'U') backY = h.y + backOff;
                  else if (dir === 'D') backY = h.y - backOff;
                  const life0 = (h.skillState?.wakeDuration || 4000);
                  (window.liveSlipstreams || (window.liveSlipstreams = [])).push({ x: backX, y: backY, r: Math.max(18, (h.r||8)+6), owner: h.i, until: now + life0, life0 });
                  // Light particles for visual hint
                  try { particles.push({ x: backX, y: backY, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6, life:30, color:'#80DEEA' }); } catch {}
                }
                break;
              case 'gravity_well':
                h.skillState.activeUntil = now + h.skillState.duration;
                createExplosion(h.x, h.y, '#8A2BE2', 25);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '🌀 GRAVITY WELL!', color: '#8A2BE2' });
                try { playSfx('powerup'); } catch {}
                break;
              case 'guardian':
                // Divine Guardian: Permanent shield until consumed
                h.hasShield = true;
                h.guardianShieldActive = true; // Special flag for Divine Guardian
                h.shieldUntil = Infinity; // Never expires on its own
                createExplosion(h.x, h.y, '#FFD700', 30); // Golden explosion
                floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1200, text: 'Divine Shield!', color: '#FFD700' });
                try { playSfx('powerup'); } catch {}
                break;
              case 'oguri_fat':
                // Oguri Fat: Super Saiyan mode - x2 speed, x1.5 damage for 5 seconds
                h.skillState.endTime = now + 5000; // 5 seconds duration
                h.speedMod = 2.0; // x2 speed boost
                h.oguriFatDamageBonus = 1.5; // x1.5 collision damage
                h.oguriFatAuraUntil = now + 5000; // Golden aura duration
                // Super Saiyan transformation effects
                createExplosion(h.x, h.y, '#FFD700', 40); // Big golden explosion
                createExplosion(h.x, h.y, '#FFA500', 30); // Orange inner
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1500, text: '🔥 OGURI FAT! 🔥', color: '#FFD700' });
                try { playSfx('powerup'); } catch {}
                // Screen shake effect
                if (typeof window.cameraShake === 'function') window.cameraShake(8, 300);
                break;
              case 'silence_shizuka':
                // Silence Shizuka: Healing aura - restore 5 HP per second for 10 seconds
                h.skillState.endTime = now + 10000; // 10 seconds duration
                h.shizukaAuraUntil = now + 10000; // Green healing aura duration
                h.shizukaLastHeal = now; // Track last heal time
                // Activation effects
                createExplosion(h.x, h.y, '#32CD32', 35); // Lime green explosion
                createExplosion(h.x, h.y, '#9ACD32', 25); // Yellow-green inner
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1500, text: '💚 SHIZUKA HEAL! 💚', color: '#32CD32' });
                try { playSfx('powerup'); } catch {}
                break;
              case 'fireball':
                // Fireball: Create 3 orbiting fireballs that damage enemies
                h.skillState.endTime = now + (h.skillState.duration || 8000);
                h.fireballsUntil = h.skillState.endTime;
                h.fireballStartAngle = 0; // Starting angle for orbit
                h.fireballHitCooldowns = {}; // Track hit cooldowns per target horse
                // Activation effects
                createExplosion(h.x, h.y, '#FF4500', 30);
                createExplosion(h.x, h.y, '#FF6347', 20);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '🔥 FIREBALL! 🔥', color: '#FF4500' });
                try { playSfx('powerup'); } catch {}
                break;
              case 'energy_ball':
                // Energy Ball: After 1s cast time, create a large slow-moving projectile
                h.skillState.endTime = now + (h.skillState.duration || 8000);
                h.skillState.castComplete = false;
                h.skillState.castStartTime = now;
                // Show casting effect
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1000, text: '⚡ Charging...', color: '#00BFFF' });
                try { playSfx('powerup'); } catch {}
                break;
              case 'supersonic_speed':
                // Supersonic Speed: x5 speed for 4s
                h.skillState.endTime = now + (h.skillState.duration || 4000);
                h.speedMod = h.skillState.boostMultiplier || 10.0;
                h.supersonicAuraUntil = h.skillState.endTime; // Aura effect
                h.supersonicBaseSpeed = h.baseSpeedMod || 1.0; // Store original speed
                createExplosion(h.x, h.y, '#00FFFF', 35);
                createExplosion(h.x, h.y, '#FFFF00', 25);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1500, text: '🚀 SUPERSONIC! 🚀', color: '#00FFFF' });
                try { playSfx('powerup'); } catch {}
                break;
            }
          }
          }
          break;
        case 'active':
            switch (h.skillState.name) {
              case 'hunter':
                if (now >= h.skillState.endTime) {
                  // Apply failure penalty, end Ram, then start cooldown
                  h.speedMod = 0.5;
                  h.hasRam = false;
                  createExplosion(h.x, h.y, '#FF0000', 25);
                  h.skillState.status = 'cooldown';
                  h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 90000);
                  h._lastLuckCheck = now; // Reset luck timer when entering cooldown
                }
                break;
              case 'slipstream':
                if (now >= h.skillState.endTime) {
                  // End self boost and enter cooldown
                  h.speedMod = 1.0;
                  h.skillState.status = 'cooldown';
                  h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 70000);
                  h._lastLuckCheck = now; // Reset luck timer when entering cooldown
                }
                break;
            case 'phantom_strike':
              if (now >= h.skillState.endTime) {
                h.skillState.canAttack = false;
                // Move to cooldown after invis window ends
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 85000);
                h._lastLuckCheck = now; // Reset luck timer when entering cooldown
              }
              break;
            case 'overdrive':
              if (now >= h.skillState.endTime) {
                // Enter overheat phase before cooldown
                h.speedMod = 0.75;
                h.overheatUntil = now + (h.skillState?.overheatDuration || 5000);
                h.skillState.status = 'overheat';
              }
              break;
            case 'oguri_fat':
              if (now >= h.skillState.endTime) {
                // End Oguri Fat mode
                h.speedMod = 1.0; // Reset speed
                h.oguriFatDamageBonus = 1.0; // Reset damage
                h.oguriFatAuraUntil = 0; // Remove aura
                createExplosion(h.x, h.y, '#888888', 20); // Grey poof - power down
                floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1000, text: 'Power Down...', color: '#AAAAAA' });
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 60000); // 60s cooldown
                h._lastLuckCheck = now;
              }
              break;
            case 'silence_shizuka':
              // Continuous healing: 5 HP per second
              if (now < h.skillState.endTime) {
                const healInterval = 1000; // Heal every 1 second
                if (!h.shizukaLastHeal || (now - h.shizukaLastHeal) >= healInterval) {
                  const healAmount = h.skillState.healPerSecond || 5;
                  const maxHP = h.maxHP || 100;
                  const oldHP = h.hp || 100;
                  h.hp = Math.min(maxHP, oldHP + healAmount);
                  h.shizukaLastHeal = now;
                  
                  // Show healing effect
                  if (h.hp > oldHP) {
                    floatingTexts.push({ 
                      x: h.x, 
                      y: h.y - h.r - 6, 
                      t: performance.now(), 
                      life: 600, 
                      text: `+${healAmount} HP`, 
                      color: '#00FF7F' 
                    });
                    // Healing particles
                    try {
                      for (let k = 0; k < 4; k++) {
                        particles.push({ 
                          x: h.x + (Math.random() - 0.5) * h.r * 2, 
                          y: h.y + (Math.random() - 0.5) * h.r * 2, 
                          vx: (Math.random() - 0.5) * 0.5, 
                          vy: -Math.random() * 0.8 - 0.3, 
                          life: 25 + Math.random() * 15, 
                          color: '#00BFFF' 
                        });
                      }
                    } catch {}
                  }
                }
              } else {
                // End Silence Shizuka mode
                h.shizukaAuraUntil = 0;
                h.shizukaLastHeal = null;
                createExplosion(h.x, h.y, '#87CEEB', 18);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1000, text: 'Healing Complete', color: '#87CEEB' });
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 45000);
                h._lastLuckCheck = now;
              }
              break;
            case 'fireball':
              if (now < h.skillState.endTime) {
                // Update fireball orbit angle based on elapsed time (not dt)
                const orbitSpeed = h.skillState.orbitSpeed || 0.7;
                const elapsed = now - (h.skillState.endTime - (h.skillState.duration || 8000));
                h.fireballStartAngle = (elapsed / 1000) * orbitSpeed; // Convert ms to seconds
                
                // Check collision with other horses
                const fireballCount = h.skillState.fireballCount || 3;
                const orbitRadius = h.skillState.orbitRadius || 35;
                const fireballRadius = 8; // Size of each fireball
                const damage = h.skillState.fireballDamage || 10;
                
                for (let i = 0; i < fireballCount; i++) {
                  const angle = h.fireballStartAngle + (i * Math.PI * 2 / fireballCount);
                  const fbX = h.x + Math.cos(angle) * orbitRadius;
                  const fbY = h.y + Math.sin(angle) * orbitRadius;
                  
                  // Check collision with other horses
                  for (const o of horses) {
                    if (!o || o === h || o.eliminated) continue;
                    
                    const dx = o.x - fbX;
                    const dy = o.y - fbY;
                    const dist = Math.hypot(dx, dy);
                    const hitDist = fireballRadius + (o.r || 8);
                    
                    if (dist < hitDist) {
                      // Check cooldown for this target (prevent rapid multi-hits)
                      const hitKey = `${o.i || o.idx}`;
                      const lastHit = h.fireballHitCooldowns?.[hitKey] || 0;
                      if (now - lastHit < 500) continue; // 500ms cooldown per target
                      
                      h.fireballHitCooldowns = h.fireballHitCooldowns || {};
                      h.fireballHitCooldowns[hitKey] = now;
                      
                      // Divine Guardian shield blocks fireball damage
                      if (o.hasShield) {
                        o.hasShield = false;
                        o.guardianShieldActive = false;
                        o.shieldUntil = 0;
                        floatingTexts.push({ x: o.x, y: o.y - (o.r||8) - 6, t: performance.now(), life: 800, text: 'SHIELD BROKEN!', color: '#FFD700' });
                        createExplosion(o.x, o.y, '#FFD700', 15);
                        continue;
                      }
                      
                      // Apply damage
                      if (typeof o.hp !== 'number') o.hp = mapDef.horseMaxHP || 100;
                      o.hp = Math.max(0, o.hp - damage);
                      o.damageImpactUntil = now + 200;
                      
                      // Visual effects
                      floatingTexts.push({ x: o.x, y: o.y - (o.r||8) - 6, t: performance.now(), life: 600, text: `-${damage} HP`, color: '#FF4500' });
                      createExplosion(fbX, fbY, '#FF6347', 12);
                      
                      // Fire particles on impact
                      try {
                        for (let k = 0; k < 5; k++) {
                          particles.push({
                            x: fbX,
                            y: fbY,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2 - 1,
                            life: 15 + Math.random() * 10,
                            color: Math.random() > 0.5 ? '#FF4500' : '#FFD700'
                          });
                        }
                      } catch {}
                    }
                  }
                }
              } else {
                // End Fireball mode
                h.fireballsUntil = 0;
                h.fireballHitCooldowns = null;
                createExplosion(h.x, h.y, '#FF6347', 20);
                floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1000, text: 'Fireballs Gone', color: '#FF6347' });
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 40000);
                h._lastLuckCheck = now;
              }
              break;
            case 'energy_ball':
              {
                // Create energy ball immediately (no charging)
                if (!h.energyBall) {
                  // Calculate direction based on horse's current velocity or last movement
                  let dirX = 1, dirY = 0;
                  if (h.vx !== 0 || h.vy !== 0) {
                    const mag = Math.hypot(h.vx, h.vy) || 1;
                    dirX = h.vx / mag;
                    dirY = h.vy / mag;
                  } else if (h.dir) {
                    // Fallback to direction flag
                    if (h.dir === 'L') { dirX = -1; dirY = 0; }
                    else if (h.dir === 'R') { dirX = 1; dirY = 0; }
                    else if (h.dir === 'U') { dirX = 0; dirY = -1; }
                    else if (h.dir === 'D') { dirX = 0; dirY = 1; }
                  }
                  
                  // Create the energy ball projectile immediately
                  const ballRadius = h.skillState.ballRadius || 30;
                  h.energyBall = {
                    x: h.x + dirX * (h.r + ballRadius + 5),
                    y: h.y + dirY * (h.r + ballRadius + 5),
                    vx: dirX,
                    vy: dirY,
                    radius: ballRadius,
                    damagePercent: h.skillState.damagePercent || 30,
                    lastDamageTime: {},
                    createdAt: now
                  };
                  
                  // Visual effects
                  createExplosion(h.x, h.y, '#00BFFF', 35);
                  createExplosion(h.x, h.y, '#87CEEB', 25);
                  floatingTexts.push({ x: h.x, y: h.y - h.r - 10, t: performance.now(), life: 1200, text: '⚡ ENERGY BALL! ⚡', color: '#00BFFF' });
                  try { playSfx('powerup'); } catch {}
                }
                
                // Ball is moving
                if (h.energyBall) {
                  const ball = h.energyBall;
                  // Use fixed movement speed
                  const moveSpeed = 2.5;
                  
                  // Get map bounds from canvas (guaranteed to exist)
                  const canvas = document.getElementById('cv') || document.getElementById('canvas');
                  const mapW = canvas?.width || 1920;
                  const mapH = canvas?.height || 1080;
                  const padding = ball.radius + 2; // Stay inside by radius + small buffer
                  
                  // Calculate next position
                  let nextX = ball.x + ball.vx * moveSpeed;
                  let nextY = ball.y + ball.vy * moveSpeed;
                  
                  // Bounce BEFORE moving if would go out of bounds
                  if (nextX < padding) {
                    nextX = padding;
                    ball.vx = Math.abs(ball.vx);
                  } else if (nextX > mapW - padding) {
                    nextX = mapW - padding;
                    ball.vx = -Math.abs(ball.vx);
                  }
                  if (nextY < padding) {
                    nextY = padding;
                    ball.vy = Math.abs(ball.vy);
                  } else if (nextY > mapH - padding) {
                    nextY = mapH - padding;
                    ball.vy = -Math.abs(ball.vy);
                  }
                  
                  // Apply clamped position
                  ball.x = nextX;
                  ball.y = nextY;
                  
                  // Check for collision with horses - CONTINUOUS PUSH like a physical object
                  for (const o of horses) {
                    if (!o || o === h || o.eliminated) continue;
                    
                    const dx = o.x - ball.x;
                    const dy = o.y - ball.y;
                    const dist = Math.hypot(dx, dy);
                    const hitDist = ball.radius + (o.r || 8);
                    
                    if (dist < hitDist) {
                      // Divine Guardian shield blocks energy ball
                      if (o.hasShield) {
                        // Shield absorbs the ball completely
                        o.hasShield = false;
                        o.guardianShieldActive = false;
                        o.shieldUntil = 0;
                        floatingTexts.push({ x: o.x, y: o.y - (o.r||8) - 6, t: performance.now(), life: 800, text: 'SHIELD BLOCKED!', color: '#FFD700' });
                        createExplosion(o.x, o.y, '#FFD700', 20);
                        h.energyBall = null; // Ball is destroyed by shield
                        break;
                      }
                      
                      // CONTINUOUS PUSH - push horse away from ball center
                      const pushForce = 1.2; // Strong push force
                      const nx = dist > 0.1 ? dx / dist : 1;
                      const ny = dist > 0.1 ? dy / dist : 0;
                      
                      // Apply velocity push
                      o.vx += nx * pushForce;
                      o.vy += ny * pushForce;
                      
                      // Also nudge position to prevent overlap
                      const overlap = hitDist - dist;
                      if (overlap > 0) {
                        o.x += nx * overlap * 0.5;
                        o.y += ny * overlap * 0.5;
                      }
                      
                      // Continuous damage: -1 HP per frame while pushing
                      const targetMaxHP = o.maxHP || mapDef.horseMaxHP || 100;
                      if (typeof o.hp !== 'number') o.hp = targetMaxHP;
                      o.hp = Math.max(0, o.hp - 1); // -1 HP per frame
                      o.damageImpactUntil = now + 100;
                      
                      // Show damage text occasionally (not every frame)
                      if (!ball.lastDamageTime) ball.lastDamageTime = {};
                      const horseKey = o.i !== undefined ? o.i : o.idx;
                      const lastDmg = ball.lastDamageTime[horseKey] || 0;
                      if (now - lastDmg >= 300) { // Show text every 0.3s
                        ball.lastDamageTime[horseKey] = now;
                        floatingTexts.push({ x: o.x, y: o.y - (o.r||8) - 6, t: performance.now(), life: 400, text: `-1 HP`, color: '#00BFFF' });
                      }
                      
                      // Continuous energy sparks while pushing
                      if (Math.random() < 0.3) {
                        try {
                          particles.push({
                            x: ball.x + nx * ball.radius,
                            y: ball.y + ny * ball.radius,
                            vx: nx * 2 + (Math.random() - 0.5),
                            vy: ny * 2 + (Math.random() - 0.5),
                            life: 10 + Math.random() * 8,
                            color: Math.random() > 0.5 ? '#00BFFF' : '#FFFFFF'
                          });
                        } catch {}
                      }
                    }
                  }
                  
                  // Check ball expiration
                  const ballAge = now - ball.createdAt;
                  const maxBallDuration = 15000; // Ball lasts max 15 seconds
                  
                  // Expire by time
                  if (ballAge > maxBallDuration) {
                    h.energyBall = null;
                    floatingTexts.push({ x: ball.x, y: ball.y, t: performance.now(), life: 800, text: 'Energy Faded', color: '#87CEEB' });
                  }
                }
                
                // Skill duration ended - only go to cooldown when ball is gone or expired
                if (now >= h.skillState.endTime && !h.energyBall) {
                  h.skillState.status = 'cooldown';
                  h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 50000);
                  h._lastLuckCheck = now;
                }
              }
              break;
            case 'supersonic_speed':
              // Supersonic Speed: x5 for 4s, then recovery phase
              if (now >= h.skillState.endTime) {
                // Boost phase ended, enter recovery phase
                if (!h.supersonicRecoveryStartTime) {
                  // Start recovery phase
                  h.supersonicRecoveryStartTime = now;
                  h.speedMod = h.skillState.slowMultiplier || 0.5;
                  h.supersonicAuraUntil = 0; // Remove boost aura
                  createExplosion(h.x, h.y, '#FF6600', 20);
                  floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1200, text: '💨 Recovering...', color: '#FF6600' });
                }
                
                // Gradual recovery from 0.5x to 1.0x over 15s
                const recoveryDuration = h.skillState.recoveryDuration || 15000;
                const recoveryElapsed = now - h.supersonicRecoveryStartTime;
                const recoveryProgress = Math.min(1, recoveryElapsed / recoveryDuration);
                
                // Linear interpolation from slowMultiplier to baseSpeed
                const slowMult = h.skillState.slowMultiplier || 0.5;
                const baseMult = h.supersonicBaseSpeed || 1.0;
                h.speedMod = slowMult + (baseMult - slowMult) * recoveryProgress;
                
                // Recovery complete
                if (recoveryProgress >= 1) {
                  h.speedMod = baseMult;
                  h.supersonicRecoveryStartTime = null;
                  h.supersonicBaseSpeed = null;
                  floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 1000, text: '✓ Recovered', color: '#00FF00' });
                  h.skillState.status = 'cooldown';
                  h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 60000);
                  h._lastLuckCheck = now;
                }
              }
              break;
            case 'shockwave':
              {
                // Push only at the expanding ring front (wave shell), not continuously
                const maxR = h._shockwaveMaxR || (h.skillState.radius || 80);
                const dur = Math.max(300, (h.skillState?.duration || 5000));
                const elapsed = Math.max(0, now - (h._shockwaveStart || now));
                const speed = 9; // 9x faster open/close
                const phase = (elapsed / dur) * speed;
                const tTri = 1 - Math.abs(((phase % 2) + 2) % 2 - 1); // triangle wave 0..1..0
                const tprog = Math.max(0, Math.min(1, tTri));
                const R = maxR * tprog;
                const band = 14; // shell thickness around the ring front
                const pushAccel = 1.0; // per-frame accel at ring front, scaled by dt*60
                const posNudgeBase = 0.6; // small positional nudge

                if (elapsed <= dur && tprog > 0 && tprog <= 1.01) {
                  for (const o of horses) {
                    if (!o || o === h || o.eliminated) continue;
                    const dx = o.x - h.x, dy = o.y - h.y;
                    const dist = Math.hypot(dx, dy);
                    // Only affect targets within the shell around current ring radius
                    if (Math.abs(dist - R) <= band + (o.r||8)*0.5) {
                      // Divine Guardian shield blocks Shockwave effects
                      if (o.hasShield) {
                        continue; // Skip this target completely
                      }
                      
                      const nx = (dist > 1e-6 ? dx / dist : 1), ny = (dist > 1e-6 ? dy / dist : 0);
                      const scale = (typeof dt === 'number' && isFinite(dt)) ? (dt * 60) : 1;
                      // Strength tapers with distance from exact ring front (0 at outer edge of band)
                      const falloff = Math.max(0, 1 - (Math.abs(dist - R) / Math.max(1, band)));
                      const accel = pushAccel * falloff;
                      o.vx += nx * accel * scale;
                      o.vy += ny * accel * scale;
                      // Slight position nudge for visual feedback
                      o.x += nx * posNudgeBase * falloff * scale * 0.15;
                      o.y += ny * posNudgeBase * falloff * scale * 0.15;
                      // Apply/refresh slow for the full skill window
                      o.shockwaveSlowMultiplier = 0.7;
                      o.shockwaveSlowUntil = performance.now() + (h.skillState?.duration || 5000);
                    }
                  }
                }

                if (now >= h.skillState.endTime) {
                  h.skillState.status = 'cooldown';
                  h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 45000);
                  h._lastLuckCheck = now; // Reset luck timer when entering cooldown
                  try { delete h._shockwaveStart; delete h._shockwaveMaxR; } catch {}
                }
              }
              break;
            case 'chain_lightning':
              if (now >= h.skillState.endTime) {
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 42000);
                h._lastLuckCheck = now; // Reset luck timer when entering cooldown
                try { delete h._chainArcs; } catch {}
              }
              break;
            case 'gravity_well':
              if (now > h.skillState.activeUntil) {
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + h.skillState.cooldown;
                h._lastLuckCheck = now; // Reset luck timer when entering cooldown
                for (const other of horses) {
                  if (other !== h) {
                    other.gravityWellCaught = false;
                    // Don't reset gravityWellSpeedModifier - it's permanent!
                  }
                }
              }
              break;
            case 'guardian':
              // Divine Guardian: Shield stays active indefinitely until consumed
              // Shield break is handled in collision logic
              // No time-based expiration
              if (!h.guardianShieldActive) {
                // Shield was consumed, move to cooldown
                h.skillState.status = 'cooldown';
                h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 60000);
                h._lastLuckCheck = now; // Reset luck timer when entering cooldown
              }
              break;
          }
          break;
        case 'overheat':
          if (now > h.overheatUntil) {
            h.speedMod = 1.0;
            h.skillState.status = 'cooldown';
            h.skillState.cooldownUntil = now + (h.skillState?.cooldown || 50000);
            h._lastLuckCheck = now; // Reset luck timer when entering cooldown
          }
          break;
        case 'cooldown':
          // Luck mechanic: chance to bypass cooldown (customizable interval)
          const luckChance = (typeof h.luck === 'number' && h.luck > 0) ? h.luck : 0;
          if (luckChance > 0) {
            // Use horse's luckInterval (default 1 second)
            const intervalMs = ((typeof h.luckInterval === 'number' && h.luckInterval > 0) ? h.luckInterval : 1.0) * 1000;
            
            // Always log luckInterval on first check (no debug flag needed)
            if (!h._luckIntervalLogged) {
              console.log(`🔍 [Luck Check] Horse ${h.i} "${h.name}": luckInterval=${h.luckInterval}, intervalMs=${intervalMs}ms, luck=${luckChance}%`);
              h._luckIntervalLogged = true;
            }
            
            const lastLuckCheck = h._lastLuckCheck || 0;
            if ((now - lastLuckCheck) >= intervalMs) {
              h._lastLuckCheck = now;
              const roll = Math.random() * 100;
              if (roll < luckChance) {
                // Lucky! Bypass cooldown
                h.skillState.status = 'ready';
                h.skillState.cooldownUntil = 0;
                // Visual feedback
                try {
                  floatingTexts.push({ 
                    x: h.x, 
                    y: h.y - (h.r || 8) - 10, 
                    t: performance.now(), 
                    life: 800, 
                    text: '🍀 LUCKY!', 
                    color: '#00ff00' 
                  });
                  createExplosion(h.x, h.y, '#00ff00', 15);
                  // Debug log
                  if (window.debugSkills) {
                    const intervalSec = (intervalMs / 1000).toFixed(1);
                    console.log(`🍀 Horse ${h.i} "${h.name}" got LUCKY! (${roll.toFixed(1)} < ${luckChance}% per ${intervalSec}s)`);
                  }
                } catch {}
              }
            }
          }
          
          // Normal cooldown expiration
          if (now > h.skillState.cooldownUntil) {
            h.skillState.status = 'ready';
          }
          break;
      }
    }

    // --- PER-FRAME SKILL EFFECTS ---
    if (h.skillState && h.skillState.name === 'gravity_well' && h.skillState.status === 'active') {
      let paralyzedCount = 0; // Count horses paralyzed in aura
      
      for (const other of horses) {
        if (other === h || other.eliminated) continue;
        const dist = Math.hypot(h.x - other.x, h.y - other.y);
        if (dist < h.skillState.radius) {
          // Horse is inside the aura - freeze completely
          other.frozenUntil = now + 100; // Keep frozen while in aura (refresh every frame)
          paralyzedCount++; // Count this paralyzed horse
          
          if (!other.gravityWellCaught) {
            other.gravityWellCaught = true;
          }
        } else {
          // Horse escaped the aura
          if (other.gravityWellCaught) {
            other.gravityWellCaught = false;
            other.gravityWellSpeedModifier = 0.5; // Permanent 50% speed reduction
          }
        }
      }
      
      // Apply speed boost to Gravity Well owner based on paralyzed horses
      h.gravityWellSpeedBoost = 1.0 + (paralyzedCount * 0.5); // +50% per paralyzed horse
      if (paralyzedCount > 0) {
      }
    } else {
      // Reset speed boost when skill is not active
      if (h.gravityWellSpeedBoost && h.gravityWellSpeedBoost !== 1.0) {
        h.gravityWellSpeedBoost = 1.0;
      }
    }

    // Check for Ram expiration
    if (h.hasRam && performance.now() > h.ramUntil) {
      h.hasRam = false;
    }

    // Check for Spinner collision
    for (const s of liveSpinners) {
      // Transform horse's center to spinner's local coordinates
      const dx = h.x - s.x;
      const dy = h.y - s.y;
      const rotatedX = dx * Math.cos(-s.angle) - dy * Math.sin(-s.angle);
      const rotatedY = dx * Math.sin(-s.angle) + dy * Math.cos(-s.angle);

      // Find the closest point on the spinner to the horse's center
      const closestX = Math.max(-s.w / 2, Math.min(s.w / 2, rotatedX));
      const closestY = Math.max(-s.h / 2, Math.min(s.h / 2, rotatedY));

      const distance = Math.hypot(rotatedX - closestX, rotatedY - closestY);

      if (distance < h.r) {
        // 1. Calculate collision normal (and safeguard)
        let normalX = (rotatedX - closestX) / (distance || 1);
        let normalY = (rotatedY - closestY) / (distance || 1);

        // 2. Rotate normal back to world coordinates
        const worldNormalX = normalX * Math.cos(s.angle) - normalY * Math.sin(s.angle);
        const worldNormalY = normalX * Math.sin(s.angle) + normalY * Math.cos(s.angle);

        // 3. Push the horse out to prevent getting stuck
        const overlap = h.r - distance;
        pushOutAlong(h, worldNormalX, worldNormalY, overlap);

        // 4. Reflect velocity
        reflect(h, worldNormalX, worldNormalY);

        // 5. Add a stronger tangential velocity from the spinner's rotation
        const impulseStrength = s.speed * 1.5; // Stronger imparted spin
        h.vx += -worldNormalY * impulseStrength * dt * 60;
        h.vy += worldNormalX * impulseStrength * dt * 60;

        // 6. Add knockback along the collision normal based on overlap
        const kb = Math.max(0.5, overlap) * 0.9; // tune knockback scalar
        h.vx += worldNormalX * kb;
        h.vy += worldNormalY * kb;

        // Optional: Slightly boost resulting speed (feels punchier), with soft clamp to maxVel if present
        {
          const maxV = (mapDef && typeof mapDef.maxVel === 'number') ? mapDef.maxVel : 999;
          const spd = Math.hypot(h.vx, h.vy);
          const target = spd * 1.12; // +12%
          if (target < maxV * 1.25) {
            const scale = target / Math.max(1e-6, spd);
            h.vx *= scale; h.vy *= scale;
          }
        }

        // Sparks + tick with throttle to avoid spam
        const nowHit = performance.now();
        if (!h._lastSpinnerHitTs || (nowHit - h._lastSpinnerHitTs) > 120){
          h._lastSpinnerHitTs = nowHit;
          try { playSfx('metal_tick'); } catch {}
          // (disabled) No global screen shake on spinner impact
          try { /* no camera shake */ } catch {}
          try {
            // Sparks burst
            createEnhancedExplosion(h.x, h.y, '#FFC107', 15);
            // Shock ring (two quick outward-moving particles approximating a ring)
            for (let a=0;a<12;a++){
              const ang = (a/12) * Math.PI*2;
              const rv = 3 + Math.random()*1.5;
              particles.push({ x:h.x, y:h.y, vx:Math.cos(ang)*rv, vy:Math.sin(ang)*rv, life:12+Math.random()*6, color:'rgba(200,255,255,0.6)' });
            }
          } catch {}
          // Visual-only impact state for rendering (no screen shake)
          h.spinnerImpactUntil = nowHit + 200;
          h.spinnerImpactStrength = Math.min(1, Math.abs(s.speed) / 4 + 0.3);
          h._lastSpinnerNormalX = worldNormalX;
          h._lastSpinnerNormalY = worldNormalY;
          // Spinner-side flash
          s._flashUntil = nowHit + Math.max(60, Math.min(400, window.spinnerFlashMs ?? 120));
          s._flashStrength = Math.min(1, Math.abs(s.speed) / 4 + 0.3);
        }
      }
    }

    // Check for Shield expiration
    if (h.hasShield && performance.now() > h.shieldUntil) {
      h.hasShield = false;
    }
    

    // Apply conveyor belt acceleration (if inside any belt) with rotation support
    if (Array.isArray(mapDef.belts) && mapDef.belts.length) {
      for (const b of mapDef.belts) {
        const bx=b.x, by=b.y, bw=b.w, bh=b.h;
        const angle = b.angle || 0;
        const cx = bx + bw/2, cy = by + bh/2;
        // Move horse position into belt's local space (rotate by -angle)
        const dx = h.x - cx, dy = h.y - cy;
        const cosA = Math.cos(-angle), sinA = Math.sin(-angle);
        const lx = dx * cosA - dy * sinA;
        const ly = dx * sinA + dy * cosA;
        if (lx > -bw/2 - h.r && lx < bw/2 + h.r && ly > -bh/2 - h.r && ly < bh/2 + h.r) {
          // Base direction from dir, then rotate by angle
          const dir = (b.dir || 'E').toUpperCase();
          let ux=1, uy=0;
          if (dir==='W'){ux=-1;uy=0;} else if (dir==='N'){ux=0;uy=-1;} else if (dir==='S'){ux=0;uy=1;}
          const rx = ux * Math.cos(angle) - uy * Math.sin(angle);
          const ry = ux * Math.sin(angle) + uy * Math.cos(angle);
          const acc = (b.speed ?? 0.12) * speedScale; // tune default belt speed
          // convert to per-frame delta v (dt is in 1/60 seconds units)
          h.vx += rx * acc * dt * 60;
          h.vy += ry * acc * dt * 60;
        }
      }
    }

    // ===== WEATHER EFFECTS =====
    // MOVED TO: scripts/core/weather.js
    // Access via: window.WeatherSystem.applyWeatherEffects() or window.applyWeatherEffects()
    if (typeof applyWeatherEffects === 'function') {
      applyWeatherEffects(h, dt, mode);
    }
    } // End of AI processing else block

    if (!gateOpen){
      const r=mapDef.waitingRoom; const left=r.x, right=r.x+r.w, top=r.y, bottom=r.y+r.h;
      
      // DEV MODE: Player horse can move freely even in waiting room
      if (h.isPlayerControlled) {
        // Player horse: free movement, no boundaries
        h.x += h.vx*dt; 
        h.y += h.vy*dt;
      } else {
        // AI horses: normal waiting room constraints
        limitHorseSpeed(h);
        h.x += h.vx*dt; h.y += h.vy*dt;
        // Use editor speed-scaled bounce velocities in waiting room
        const speedEl = document.getElementById('speed');
        const editorSpeed = speedEl ? parseFloat(speedEl.value) || 1.0 : 1.0;
        const bounceVel = editorSpeed * 0.5; // Reasonable bounce speed
        if (h.x - h.r < left){ h.x=left+h.r; h.vx = bounceVel; }
        if (h.x + h.r > right){ h.x=right-h.r; h.vx = bounceVel * 0.1; }
        if (h.y - h.r < top){ h.y=top+h.r; h.vy = bounceVel; }
        if (h.y + h.r > bottom){ h.y=bottom-h.r; h.vy = -bounceVel; }
      }
      continue;
    }

    if (!isFrozen) {
      const gravityWellBoost = h.gravityWellSpeedBoost || 1.0;
      
      // Apply movement with time freeze check
      const isFrozenByTimeFreeze = h.timeFrozenUntil && performance.now() < h.timeFrozenUntil;
      if (!isFrozenByTimeFreeze) {
        // Check mud brushes - slow down horses in mud
        h.mudSpeedModifier = 1.0; // Reset mud modifier each frame
        const mudBrushes = (mapDef.brushes || []).filter(b => b.type === 'mud');
        for (const mudBrush of mudBrushes) {
          const r = mudBrush.r || 10;
          for (const point of mudBrush.points) {
            const d = Math.hypot(h.x - point.x, h.y - point.y);
            if (d < r + h.r) {
              const mudSlowdownEl = document.getElementById('mudSlowdown');
              const mudSlowdown = mudSlowdownEl ? parseFloat(mudSlowdownEl.value) : 0.4;
              h.mudSpeedModifier = mudSlowdown; // Configurable speed reduction in mud
              // Add mud particles
              if (Math.random() < 0.3) {
                try {
                  createExplosion(h.x + (Math.random() - 0.5) * 20, h.y + (Math.random() - 0.5) * 20, '#8B4513', 8);
                } catch {}
              }
              break; // Only apply one mud effect at a time
            }
          }
          if (h.mudSpeedModifier < 1.0) break; // Already in mud, no need to check other brushes
        }

        // Check healing brushes - heal horses over time
        h.healingPatchEffect = 0; // Reset healing effect each frame
        if (mapDef.hpSystemEnabled) {
          const healingBrushes = (mapDef.brushes || []).filter(b => b.type === 'healingpatch');
          for (const healingBrush of healingBrushes) {
            // Check if horse is touching any point in the healing brush
            let isInHealing = false;
            for (const point of (healingBrush.points || [])) {
              const d = Math.hypot(h.x - point.x, h.y - point.y);
              if (d < (healingBrush.r || 15) + h.r) {
                isInHealing = true;
                break;
              }
            }
            
            if (isInHealing) {
              // Initialize horse HP if not exists
              if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
              
              const maxHP = mapDef.horseMaxHP || 100;
              if (h.hp < maxHP) {
                const currentTime = performance.now();
                const horseId = h.name || horses.indexOf(h);
                const brushId = (mapDef.brushes || []).indexOf(healingBrush);
                
                // Initialize brush healing timers
                if (!healingBrush.lastHealTime) healingBrush.lastHealTime = {};
                const cooldown = healingBrush.cooldown || 1000; // 1 second cooldown per horse
                
                // Apply healing based on cooldown per horse
                if (!healingBrush.lastHealTime[horseId] || currentTime - healingBrush.lastHealTime[horseId] >= cooldown) {
                  const healRate = healingBrush.healRate || 5; // HP per second
                  const oldHP = h.hp;
                  h.hp = Math.min(maxHP, h.hp + healRate);
                  const actualHeal = h.hp - oldHP;
                  healingBrush.lastHealTime[horseId] = currentTime;
                  
                  if (actualHeal > 0) {
                    h.healingPatchEffect = 1; // Mark as being healed
                    
                    // Visual healing effect
                    h.healFlash = currentTime;
                    h.healImpactUntil = currentTime + 300;
                    h.healImpactStrength = 0.4;
                    
                    // Floating healing text
                    floatingTexts.push({
                      x: h.x, y: h.y - (h.r || 8) - 5,
                      t: currentTime, life: 800,
                      text: `+${actualHeal}`, color: '#4CAF50'
                    });
                    
                    // Healing particle effect
                    if (Math.random() < 0.4) {
                      try {
                        createExplosion(h.x + (Math.random() - 0.5) * 15, h.y + (Math.random() - 0.5) * 15, '#4CAF50', 6);
                      } catch {}
                    }
                  }
                }
              }
              break; // Only apply one healing effect at a time
            }
          }
        }

        // Poison effect - slow drift and visual changes
        if (h.poisonUntil && performance.now() < h.poisonUntil) {
          // Initialize poison state if not set
          if (h.poisonState === undefined) {
            h.poisonState = {
              driftAngle: Math.random() * Math.PI * 2,
              driftSpeed: 0.15 + Math.random() * 0.1, // 0.15-0.25 (very slow drift)
              targetVx: 0,
              targetVy: 0,
              changeTimer: 0,
              nextChange: 2000 + Math.random() * 3000, // 2-5 seconds
              originalColor: h.color || '#4CAF50',
              damageTimer: 0,
              nextDamage: 1000 // Damage every 1 second
            };
          }
          
          const state = h.poisonState;
          
          // Smooth drift direction changes
          state.changeTimer += dt * 1000;
          if (state.changeTimer > state.nextChange) {
            // Gradually change drift direction
            state.driftAngle += (Math.random() - 0.5) * 0.8;
            // Set new target velocity - super slow
            const driftMagnitude = 5 + Math.random() * 5; // 5-10 (much smaller)
            state.targetVx = Math.cos(state.driftAngle) * driftMagnitude;
            state.targetVy = Math.sin(state.driftAngle) * driftMagnitude;
            state.nextChange = 5000 + Math.random() * 5000; // 5-10 seconds (longer)
            state.changeTimer = 0;
          }
          
          // Super slow interpolation toward target velocity
          const lerpFactor = 0.005; // Much slower transition
          h.vx = h.vx * (1 - lerpFactor) + state.targetVx * lerpFactor;
          h.vy = h.vy * (1 - lerpFactor) + state.targetVy * lerpFactor;
          
          // Apply very gentle continuous drift
          state.driftAngle += state.driftSpeed * dt;
          const gentleDrift = 1 * dt; // Much smaller drift
          h.vx += Math.cos(state.driftAngle) * gentleDrift;
          h.vy += Math.sin(state.driftAngle) * gentleDrift;
          
          // Apply strong drag
          h.vx *= 0.85; // More drag
          h.vy *= 0.85;
          
          // Very low speed limit
          const currentSpeed = Math.hypot(h.vx, h.vy);
          if (currentSpeed > 8) { // Much lower limit
            const factor = 8 / currentSpeed;
            h.vx *= factor;
            h.vy *= factor;
          }
          
          // HP damage from poison (if HP system is enabled)
          if (mapDef && mapDef.hpSystemEnabled && h.hp > 0 && !h.hasShield) { // Divine Guardian shield blocks poison damage
            state.damageTimer += dt * 1000;
            if (state.damageTimer >= state.nextDamage) {
              // Deal 10% of current HP as damage
              const damage = Math.max(1, Math.ceil(h.hp * 0.1));
              h.hp -= damage;
              if (h.hp < 0) h.hp = 0;
              
              // Reset damage timer
              state.damageTimer = 0;
              
              // Create damage indicator particles
              try {
                particles.push({
                  x: h.x,
                  y: h.y - h.r - 10,
                  vx: (Math.random() - 0.5) * 20,
                  vy: -20 - Math.random() * 10,
                  life: 30,
                  color: '#FF4444',
                  alpha: 1.0,
                  size: 2,
                  text: `-${damage}`
                });
              } catch {}
            }
          }
          
          // Visual poison effects - dramatic and eye-catching
          h.color = '#7CFC00'; // Bright lime green for more visibility
          
          // Multiple pulsing effects for dramatic impact
          if (!h.poisonPulse) h.poisonPulse = 0;
          if (!h.poisonPulse2) h.poisonPulse2 = 0;
          h.poisonPulse += dt * 4; // Faster pulse
          h.poisonPulse2 += dt * 2.5; // Secondary pulse
          
          const pulseAlpha1 = 0.15 + Math.sin(h.poisonPulse) * 0.1;
          const pulseAlpha2 = 0.08 + Math.sin(h.poisonPulse2) * 0.05;
          const pulseSize1 = h.r + 6 + Math.sin(h.poisonPulse) * 3;
          const pulseSize2 = h.r + 10 + Math.sin(h.poisonPulse2) * 4;
          
          // Store aura data for rendering in draw phase
          h.poisonAura = {
            pulseAlpha1: pulseAlpha1,
            pulseAlpha2: pulseAlpha2,
            pulseSize1: pulseSize1,
            pulseSize2: pulseSize2
          };
          
          // Intense poison particles - more frequent and varied
          if (Math.random() < 0.7) { // Increased frequency
            try {
              // Bright poison bubbles
              particles.push({ 
                x: h.x + (Math.random()-0.5)*h.r*3, 
                y: h.y + (Math.random()-0.5)*h.r*3, 
                vx: (Math.random()-0.5)*15, 
                vy: -Math.random()*8 - 3, // Float upward faster
                life: 25 + Math.random()*20, 
                color: Math.random() < 0.5 ? '#00FF00' : '#32CD32', 
                alpha: 0.8, 
                size: 1.5 + Math.random()*2.5 
              });
            } catch {}
          }
          
          // Toxic smoke effect
          if (Math.random() < 0.5) {
            try {
              particles.push({ 
                x: h.x + (Math.random()-0.5)*h.r*2, 
                y: h.y - h.r, 
                vx: (Math.random()-0.5)*10, 
                vy: -Math.random()*12 - 5, // Rise like smoke
                life: 35, 
                color: '#90EE90', 
                alpha: 0.6, 
                size: 2 + Math.random()*3 
              });
            } catch {}
          }
          
          // Dripping poison - more dramatic
          if (Math.random() < 0.3) {
            try {
              particles.push({ 
                x: h.x + (Math.random()-0.5)*h.r*1.5, 
                y: h.y + h.r, 
                vx: (Math.random()-0.5)*5, 
                vy: Math.random()*12 + 8, // Drip faster
                life: 30, 
                color: '#228B22', 
                alpha: 0.9, 
                size: 1.2 + Math.random()*1.5 
              });
            } catch {}
          }
          
          // Sparkling toxic effect
          if (Math.random() < 0.4) {
            try {
              particles.push({ 
                x: h.x + (Math.random()-0.5)*h.r*2.5, 
                y: h.y + (Math.random()-0.5)*h.r*2.5, 
                vx: (Math.random()-0.5)*20, 
                vy: (Math.random()-0.5)*20, 
                life: 15, 
                color: '#ADFF2F', 
                alpha: 1.0, 
                size: 0.8 + Math.random()*1.2 
              });
            } catch {}
          }
          
        } else if (h.poisonState !== undefined) {
          // Clean up poison state when effect ends
          h.color = h.poisonState.originalColor; // Restore original color
          delete h.poisonState;
          delete h.poisonPulse; // Clean up pulse effect
          delete h.poisonPulse2; // Clean up secondary pulse
          delete h.poisonAura; // Clean up aura data
        }

        // Magnet effect - attract nearby power-ups (configurable range and target types)
        if (h.magnetUntil && performance.now() < h.magnetUntil) {
          const cfg = (mapDef && mapDef.magnetSettings) ? mapDef.magnetSettings : { range: 200, attractAll: false };
          const magnetRange = Math.max(20, Math.min(600, cfg.range || 200));
          const attractAll = !!cfg.attractAll;
          // Use window.liveXXX if available (set by race.js), otherwise fallback to local
          const beneficial = [
            ...(window.liveBoosts || liveBoosts), ...(window.liveGhosts || liveGhosts), 
            ...(window.liveRams || liveRams), ...(window.liveTurbos || liveTurbos), 
            ...(window.liveShields || liveShields), ...(window.liveTeleports || liveTeleports),
            /* no magnets */ ...(window.liveTimeFreezes || liveTimeFreezes)
          ];
          const all = [
            ...beneficial,
            ...(window.liveTraps || liveTraps), ...(window.livePoisons || livePoisons) // include traps and poisons only when attractAll=true
          ];
          const attractPowerups = attractAll ? all : beneficial;
          for (const powerup of attractPowerups) {
            const dist = Math.hypot(h.x - powerup.x, h.y - powerup.y);
            if (dist < magnetRange && dist > 3) {
              const cfgPower = (mapDef && mapDef.magnetSettings && mapDef.magnetSettings.power) ? mapDef.magnetSettings.power : 350;
              const force = Math.min((h.magnetPower || cfgPower) * 0.04, 12.0) * dt;
              const dx = (h.x - powerup.x) / dist;
              const dy = (h.y - powerup.y) / dist;
              powerup.x += dx * force;
              powerup.y += dy * force;
              // Visual trail effect for attracted items
              try {
                particles.push({ x: powerup.x, y: powerup.y, vx: dx*1.5, vy: dy*1.5, life: 18, color: '#ffeb3b', alpha: 0.6, size: 2 });
              } catch {}
            }
          }
        }
        h.x += h.vx * dt;
        h.y += h.vy * dt;
      } else {
        // Hard freeze: keep velocity zero and add icy particles
        h.vx = 0; h.vy = 0;
        try {
          particles.push({ x: h.x + (Math.random()-0.5)*h.r*2, y: h.y + (Math.random()-0.5)*h.r*2, vx: 0, vy: 0, life: 28, color: '#b3e5fc', alpha: 0.9, size: 3, shape: 'star' });
        } catch {}
      }
      const turboMult = (typeof h.turboMultiplier === 'number' && isFinite(h.turboMultiplier)) ? h.turboMultiplier : 1.0;
      
      
      // Slipstream draft bonus handling
      if (h.draftUntil && now > h.draftUntil) h.draftMultiplier = 1.0;
      const draftMult = (typeof h.draftMultiplier === 'number' && isFinite(h.draftMultiplier)) ? h.draftMultiplier : 1.0;
      // Shockwave slow expire and multiplier
      if (h.shockwaveSlowUntil && now > h.shockwaveSlowUntil) h.shockwaveSlowMultiplier = 1.0;
      const swMult = (typeof h.shockwaveSlowMultiplier === 'number' && isFinite(h.shockwaveSlowMultiplier))
        ? ((h.shockwaveSlowUntil && now < h.shockwaveSlowUntil) ? h.shockwaveSlowMultiplier : 1.0)
        : 1.0;
      // Chain Lightning slow + stun multipliers
      if (h.chainSlowUntil && now > h.chainSlowUntil) h.chainSlowMultiplier = 1.0;
      const clSlow = (typeof h.chainSlowMultiplier === 'number' && isFinite(h.chainSlowMultiplier))
        ? ((h.chainSlowUntil && now < h.chainSlowUntil) ? h.chainSlowMultiplier : 1.0)
        : 1.0;
      
      // Check if chain stun just ended - restore velocity
      const wasChainStunned = h._preChainStunVx !== undefined;
      const isChainStunned = h.chainStunUntil && now < h.chainStunUntil;
      if (wasChainStunned && !isChainStunned) {
        // Stun ended, restore original velocity
        h.vx = h._preChainStunVx;
        h.vy = h._preChainStunVy;
        delete h._preChainStunVx;
        delete h._preChainStunVy;
        console.log(`[ChainLightning] ⚡→🏃 ${h.name || '#'+(h.i+1)} speed restored: (${h.vx.toFixed(2)}, ${h.vy.toFixed(2)})`);
      }
      
      const clStun = isChainStunned ? 0.03 : 1.0; // stronger near-freeze while stunned
      const baseFactor = (typeof h.baseSpeedFactor === 'number' && isFinite(h.baseSpeedFactor)) ? h.baseSpeedFactor : 1.0;
      const weatherMod = (typeof h.weatherSpeedModifier === 'number' && isFinite(h.weatherSpeedModifier)) ? h.weatherSpeedModifier : 1.0;
      const lightningMult = (h.lightningBoostUntil && now < h.lightningBoostUntil) ? (h.lightningSpeedMultiplier || 3.0) : 1.0; // Lightning speed boost
      const tornadoPenalty = (h.tornadoSpeedPenaltyUntil && now < h.tornadoSpeedPenaltyUntil) ? (h.tornadoSpeedPenalty || 0.7) : 1.0; // Tornado vortex slowdown
      const volcanoPenalty = (h.volcanoSpeedPenaltyUntil && now < h.volcanoSpeedPenaltyUntil) ? (h.volcanoSpeedPenalty || 0.7) : 1.0; // Volcano area slowdown
      
      // Ice trap slow effect handling
      if (h.trapSlowUntil && now > h.trapSlowUntil) {
        delete h.trapSlowUntil;
        delete h.trapSlowMultiplier;
      }
      const trapSlowMult = (h.trapSlowUntil && now < h.trapSlowUntil && typeof h.trapSlowMultiplier === 'number') 
        ? h.trapSlowMultiplier 
        : 1.0;

      // Ice freezer slow effect handling
      if (h.iceFrozenUntil && now > h.iceFrozenUntil) {
        delete h.iceFrozenUntil;
        delete h.iceSlowMultiplier;
      }
      const iceSlowMult = (h.iceFrozenUntil && now < h.iceFrozenUntil && typeof h.iceSlowMultiplier === 'number') 
        ? h.iceSlowMultiplier 
        : 1.0;
      
      // Add ice particles when trapped or ice frozen
      if ((trapSlowMult < 1.0 || iceSlowMult < 1.0) && Math.random() < 0.15) {
        try {
          particles.push({
            x: h.x + (Math.random() - 0.5) * h.r * 1.5,
            y: h.y + (Math.random() - 0.5) * h.r * 1.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            life: 20,
            color: '#b3e5fc',
            alpha: 0.7,
            size: 2,
            shape: 'circle'
          });
        } catch {}
      }
      
      const finalModifier = baseFactor * h.speedMod * h.mudSpeedModifier * h.gravityWellSpeedModifier * gravityWellBoost * turboMult * trapSlowMult * iceSlowMult * draftMult * swMult * clSlow * clStun * weatherMod * lightningMult * tornadoPenalty * volcanoPenalty;
      
      // Debug massive finalModifier values - MORE AGGRESSIVE
      if (finalModifier > 2.0 && h === horses[0] && Math.random() < 0.1) {
        console.log(`🚀 finalModifier=${finalModifier.toFixed(2)} (threshold lowered)`);
        console.log(`   baseFactor=${baseFactor}, speedMod=${h.speedMod || 1}, turboMult=${turboMult}, lightningMult=${lightningMult}`);
        console.log(`   draftMult=${draftMult}, gravityWellBoost=${gravityWellBoost}`);
      }
      
      // SAFETY CAP: Respect editor speed settings by capping finalModifier
      const speedEl = document.getElementById('speed');
      const editorSpeed = speedEl ? parseFloat(speedEl.value) || 1.0 : 1.0;
      const maxAllowedModifier = Math.max(1.0, editorSpeed * 3.0); // Allow up to 3x editor speed
      const cappedFinalModifier = Math.min(finalModifier, maxAllowedModifier);
      
      // Store effective speed multiplier for display purposes
      h._effectiveSpeedMultiplier = cappedFinalModifier;
      
      if (finalModifier !== cappedFinalModifier && h === horses[0] && Math.random() < 0.2) {
        console.log(`🚨 CAPPED finalModifier: ${finalModifier.toFixed(2)} → ${cappedFinalModifier.toFixed(2)} (editorSpeed=${editorSpeed})`);
      }
      
      // Extra damping while stunned to reduce sliding
      // Only apply damping if we haven't saved velocity yet (to preserve restore value)
      if (clStun < 1.0 && h._preChainStunVx === undefined) { 
        // Save velocity before damping starts
        h._preChainStunVx = h.vx;
        h._preChainStunVy = h.vy;
      }
      // Apply visual slowdown during stun (velocity will be restored when stun ends)
      if (clStun < 1.0) { h.vx *= 0.85; h.vy *= 0.85; } // Gentler damping
      
        // [PU-BEGIN name=yellowheart section=effect-processing]
        // Yellowheart effect processing (speed/damage/heal based on effectType)
        if (h.effects && h.effects.yellowheart) {
          const effect = h.effects.yellowheart;
          const now = performance.now();
          const elapsed = now - effect.startTime;
          
          if (elapsed < effect.duration) {
            const stacks = effect.stacks || 1;
            const power = effect.damage || 25; // "damage" field stores power value
            const effectType = effect.effectType || 'speed';
            
            if (effectType === 'speed') {
              // Speed boost
              const speedBoost = power / 100; // Convert to percentage
              const totalBoost = 1 + (speedBoost * stacks);
              h.speedMod = Math.max(h.speedMod || 1.0, totalBoost);
            } else if (effectType === 'damage') {
              // Damage boost
              const damageBoost = power * stacks;
              h.damageBonus = (h.damageBonus || 0) + damageBoost;
            } else if (effectType === 'heal') {
              // Healing over time (once per second)
              if (!effect.lastHealTime || (now - effect.lastHealTime) >= 1000) {
                // Initialize horse HP if not exists
                if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
                
                const healAmount = power * stacks;
                const maxHP = mapDef.horseMaxHP || 100;
                const oldHP = h.hp;
                h.hp = Math.min(maxHP, h.hp + healAmount);
                const actualHeal = h.hp - oldHP;
                
                effect.lastHealTime = now;
                
                // Show healing text (use floatingTexts like other effects)
                if (actualHeal > 0) {
                  floatingTexts.push({
                    x: h.x, y: h.y - h.r - 5,
                    t: now, life: 1000,
                    text: `+${actualHeal} HP 💛`, color: '#4CAF50',
                    type: 'heal'
                  });
                  
                  // Debug logging
                  console.log(`[YELLOWHEART HEAL] Horse ${h.id || 'unknown'}: ${oldHP} → ${h.hp} (+${actualHeal})`);
                }
              }
            }
          } else {
            // Effect expired, remove it
            delete h.effects.yellowheart;
          }
        }
        // [PU-END name=yellowheart section=effect-processing]
      // Apply Fan forces (per-frame acceleration along fan angle)
      try {
        const fans = mapDef.fans || [];
        if (fans.length) {
          for (const f of fans) {
            const fx = h.x - f.x;
            const fy = h.y - f.y;
            const d = Math.hypot(fx, fy);
            const R = Math.max(10, f.r || 120);
            if (d > R || d < 1) continue;
            const dir = Math.atan2(fy, fx);
            const ang = f.angle || 0;
            // angle diff normalized to [-PI, PI]
            const diff = Math.atan2(Math.sin(dir - ang), Math.cos(dir - ang));
            const spread = Math.max(1e-3, f.spread || (Math.PI/3));
            if (Math.abs(diff) <= spread * 0.5) {
              const strength = Math.max(0, Math.min(1, (typeof f.strength === 'number' ? f.strength : 0.08)));
              const falloff = 1 - (d / R);
              const push = strength * falloff * (dt * 60);
              h.vx += Math.cos(ang) * push;
              h.vy += Math.sin(ang) * push;
            }
          }
        }
      } catch {}
      if (h.gravityWellSpeedModifier !== 1.0) {
      }
      if (gravityWellBoost > 1.0) {
      }
      // Clamp speed before applying movement during race
      limitHorseSpeed(h);
      
      // Apply cappedFinalModifier to all horses (including player-controlled)
      h.x += h.vx*dt*cappedFinalModifier;
      h.y += h.vy*dt*cappedFinalModifier;
    }

    if (now < biasUntil && !h.isPlayerControlled){
      const startCx = mapDef.startLine.x + mapDef.startLine.w*0.5, startCy = mapDef.startLine.y + mapDef.startLine.h*0.5;
      const gx = startCx - h.x, gy = startCy - h.y, L=Math.hypot(gx,gy)||1;
      // Use editor speed instead of speedScale for bias acceleration
      const speedEl = document.getElementById('speed');
      const editorSpeed = speedEl ? parseFloat(speedEl.value) || 1.0 : 1.0;
      const biasAccel = 0.05 * editorSpeed; // Much smaller, editor speed-scaled acceleration
      const ax = (gx/L) * biasAccel, ay = (gy/L) * biasAccel;
      h.vx += ax * dt*60; h.vy += ay * dt*60;
      
      // Debug excessive bias acceleration
      if (h === horses[0] && Math.random() < 0.02) {
        console.log(`🎯 BIAS: biasAccel=${biasAccel.toFixed(3)}, editorSpeed=${editorSpeed}, old speedScale=${speedScale}`);
      }
    }

    const isGhosted = h.ghostedUntil && performance.now() < h.ghostedUntil;
    const isQuantumPhasing = h.phaseEnabled && h.quantumDashUntil && performance.now() < h.quantumDashUntil;

    if (!isGhosted && !isQuantumPhasing) {
      for (const w of mapDef.walls){ 
        const a=w.angle||0; 
        const c=a?circleOBBCollide(h.x,h.y,h.r,w.x,w.y,w.w,w.h,w.r||12,a):circleRectCollide(h.x,h.y,h.r,w.x,w.y,w.w,w.h,w.r||12); 
        if (c.hit){ 
          pushOutAlong(h,c.nx,c.ny,Math.max(0,c.overlap||0)); 
          reflect(h,c.nx,c.ny);
          
          // Apply wall damage if enabled
          
          // Only deal wall damage when HP system and wall damage are enabled and race has started
          if (mapDef.hpSystemEnabled && mapDef.wallDamageEnabled && gateOpen && !h.hasShield) { // Divine Guardian shield blocks wall damage
            // Initialize horse HP if not exists
            if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
            
            const now = performance.now();
            const cooldown = h.lastWallDamageTime ? (now - h.lastWallDamageTime) : 1000;
            
            if (cooldown > 500) {
              const damage = mapDef.wallDamageAmount || 10;
              const oldHP = h.hp;
              
              // Direct HP modification
              h.hp -= damage;
              if (h.hp < 0) h.hp = 0;
              
              h.lastWallDamageTime = now;
              h.damageImpactUntil = now + 200;
              h.damageImpactStrength = 0.5;
              
              
              // Enhanced damage indicator for wall collision
              const isCritical = damage >= 10; // Lowered from 15 to 10
              floatingTexts.push({ 
                x: h.x + (Math.random() - 0.5) * 10, // slight random offset
                y: h.y - h.r - 5, 
                t: now, 
                life: isCritical ? 1200 : 900, 
                text: `-${damage} WALL`, 
                color: isCritical ? '#FF1744' : '#FF5722',
                type: 'damage',
                critical: isCritical
              });
            } else {
              // console.log(`[WALL DAMAGE] Cooldown active: ${cooldown}ms < 500ms`);
            }
          } else {
            // console.log(`[WALL DAMAGE] HP System disabled: ${mapDef.hpSystemEnabled}`);
          }
        } 
      }
      for (const p of mapDef.pipes){ const c=circleCapsuleCollide(h.x,h.y,h.r,p.x1,p.y1,p.x2,p.y2,p.r); if (c.hit){ pushOutAlong(h,c.nx,c.ny,Math.max(0,c.overlap||0)); reflect(h,c.nx,c.ny);} }
      for (const s of mapDef.semis){ const c=circleSemiCollide(h.x,h.y,h.r,s.x,s.y,s.r,s.angle||0); if (c.hit){ pushOutAlong(h,c.nx,c.ny,Math.max(0,c.overlap||0)); reflect(h,c.nx,c.ny);} }
      for (const a of mapDef.arcs){ const c=circleArcCollide(h.x,h.y,h.r,a.x,a.y,a.r,a.thick,a.angle||0,a.span||Math.PI); if (c.hit){ pushOutAlong(h,c.nx,c.ny,Math.max(0,c.overlap||0)); reflect(h,c.nx,c.ny);} }
      for (let bi=mapDef.brushes.length-1; bi>=0; bi--){
        const b = mapDef.brushes[bi];
        const r=b.r;
        
        // Skip collision for mud and healing brushes - they only affect, don't block
        if (b.type === 'mud' || b.type === 'healingpatch') continue;
        
        // PERFORMANCE OPTIMIZATION: Bounding box early exit
        // Calculate bounding box for the entire brush (cached)
        if (!b._bbox) {
          const allPts = b.segments ? b.segments.flat() : b.points;
          if (allPts && allPts.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of allPts) {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            }
            b._bbox = { minX, minY, maxX, maxY };
          }
        }
        
        // Quick bounding box check - skip if horse is far away
        if (b._bbox) {
          const margin = h.r + r + 10;
          if (h.x + margin < b._bbox.minX || h.x - margin > b._bbox.maxX ||
              h.y + margin < b._bbox.minY || h.y - margin > b._bbox.maxY) {
            continue; // Horse is too far from this brush
          }
        }
        
        // Check if merged text with segments array
        let segmentsToCheck = [];
        if (b.segments && Array.isArray(b.segments)) {
          // Merged text - check all segments
          segmentsToCheck = b.segments;
        } else if (b.points) {
          // Normal brush - check main points array
          segmentsToCheck = [b.points];
        }
        
        // Check collision for all segments
        for (const pts of segmentsToCheck) {
          if (!pts || pts.length < 2) continue;
          
          for (let i=0;i<pts.length-1;i++){
            const p1=pts[i], p2=pts[i+1];
            const c=circleCapsuleCollide(h.x,h.y,h.r, p1.x,p1.y,p2.x,p2.y, r);
            if (c.hit){
              // resolve collision as usual
              pushOutAlong(h,c.nx,c.ny,Math.max(0,c.overlap||0));
              reflect(h,c.nx,c.ny);
            
            // Apply wall damage for brush walls (same as regular walls)
            if (mapDef.hpSystemEnabled && mapDef.wallDamageEnabled && gateOpen && b.type !== 'break' && !h.hasShield) { // Divine Guardian shield blocks brush damage
              // Initialize horse HP if not exists
              if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
              
              const now = performance.now();
              const cooldown = h.lastWallDamageTime ? (now - h.lastWallDamageTime) : 1000;
              
              if (cooldown > 500) {
                const damage = mapDef.wallDamageAmount || 10;
                const oldHP = h.hp;
                
                // Direct HP modification
                h.hp -= damage;
                if (h.hp < 0) h.hp = 0;
                
                h.lastWallDamageTime = now;
                h.damageImpactUntil = now + 200;
                h.damageImpactStrength = 0.5;
                
                // Enhanced damage indicator for brush wall collision
                const isCritical = damage >= 10;
                floatingTexts.push({ 
                  x: h.x + (Math.random() - 0.5) * 10,
                  y: h.y - h.r - 5, 
                  t: now, 
                  life: isCritical ? 1200 : 900, 
                  text: `-${damage} BRUSH`, 
                  color: isCritical ? '#FF1744' : '#FF5722',
                  type: 'damage',
                  critical: isCritical
                });
                
                // Debug logging
                // console.log(`[BRUSH DAMAGE] Horse ${h.id || 'unknown'}: ${oldHP} → ${h.hp} (-${damage})`);
              }
            }
            
            // special behaviors
            if (b.type === 'break'){
              const now = (typeof performance!=='undefined' && performance.now) ? performance.now() : Date.now();
              if (!b._cooldownUntil || now > b._cooldownUntil){
                b.hp = Math.max(0, (parseInt(b.hp,10)||8) - 1);
                b._cooldownUntil = now + 150; // debounce so one sweep counts once
                // small hit particles
                try {
                  if (window.particles && particles.length < 2400){
                    for (let k=0;k<6;k++){
                      const ang = Math.atan2(-c.ny, -c.nx) + (Math.random()*2-1)*0.6;
                      const spd = 1.0 + Math.random()*1.0;
                      particles.push({ x: h.x, y: h.y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd, life: 14+Math.random()*12, color: b.color || '#b0bec5' });
                    }
                  }
                } catch {}
                if (b.hp <= 0){
                  const mode = (b.onBreak==='remove' || b.onBreak==='shards') ? b.onBreak : 'shards';
                  // big shards
                  if (mode==='shards'){
                    try {
                      if (window.particles && particles.length < 2400){
                        for (let k=0;k<18;k++){
                          const ang = Math.random()*Math.PI*2;
                          const spd = 1.5 + Math.random()*2.0;
                          particles.push({ x: h.x, y: h.y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd, life: 24+Math.random()*24, color: b.color || '#90a4ae', glow: 0 });
                        }
                      }
                    } catch {}
                  }
                  mapDef.brushes.splice(bi,1);
                  try { invalidateStaticLayer(); drawMap(); } catch {}
                }
              }
            } else if (b.type === 'soft'){
              // ensure original snapshot exists
              if (!b.original || b.original.length !== pts.length){
                try { b.original = pts.map(p=>({x:p.x,y:p.y})); } catch {}
              }
              const stiff = (typeof b.stiffness==='number') ? b.stiffness : 0.25;
              const maxDef = (typeof b.maxDeform==='number') ? b.maxDeform : 18;
              // deform points near the impact segment
              const segLen = Math.hypot(p2.x-p1.x, p2.y-p1.y) || 1;
              const ux = (p2.x-p1.x)/segLen, uy = (p2.y-p1.y)/segLen;
              // project horse position onto segment to find local center
              const vx = h.x - p1.x, vy = h.y - p1.y;
              let t = vx*ux + vy*uy; t = Math.max(0, Math.min(segLen, t));
              const cx = p1.x + ux*t, cy = p1.y + uy*t;
              for (let j=Math.max(0,i-4); j<Math.min(pts.length, i+5); j++){
                const pj = pts[j]; const oj = (b.original && b.original[j]) ? b.original[j] : pj;
                const dx = pj.x - cx, dy = pj.y - cy;
                const d = Math.hypot(dx,dy) + 1e-6;
                const falloff = Math.max(0, 1 - d/(r*3));
                const push = (c.overlap||0) * stiff * falloff;
                // move along collision normal (away from horse)
                pj.x -= c.nx * push;
                pj.y -= c.ny * push;
                // clamp to maxDeform from original
                const odx = pj.x - oj.x, ody = pj.y - oj.y;
                const od = Math.hypot(odx, ody);
                if (od > maxDef){ pj.x = oj.x + odx/od*maxDef; pj.y = oj.y + ody/od*maxDef; }
              }
              try { invalidateStaticLayer(); drawMap(); } catch {}
            }
          }
        }
        }
      }

      // Soft wall recovery towards original shape (simple per-frame step)
      try {
        const nowSR = (typeof performance!=='undefined' && performance.now) ? performance.now() : Date.now();
        const dtSR = Math.min(0.05, ((nowSR - (window.softRecoverLastTs||nowSR)) / 1000) || 0);
        window.softRecoverLastTs = nowSR;
        if (dtSR > 0){
          let changed = false;
          for (const b of mapDef.brushes){
            if (b.type === 'soft' && b.original && b.original.length === (b.points?b.points.length:0)){
              const rec = (typeof b.recover==='number') ? b.recover : 24;
              const maxStep = rec * dtSR;
              for (let j=0;j<b.points.length;j++){
                const pj = b.points[j], oj = b.original[j];
                const dx = oj.x - pj.x, dy = oj.y - pj.y;
                const d = Math.hypot(dx,dy);
                if (d > 0.001){
                  const step = Math.min(maxStep, d);
                  pj.x += dx / d * step;
                  pj.y += dy / d * step;
                  changed = true;
                }
              }
            }
          }
          if (changed){ try { invalidateStaticLayer(); /* drawMap is called by main loop */ } catch {} }
        }
      } catch {}

      // Check rotating barriers collision - SOLID WALLS that completely block movement
      for (const barrier of (mapDef.rotatingBarriers || [])) {
        const halfLength = barrier.length / 2;
        const halfWidth = barrier.width / 2;
        
        // Transform horse position to barrier's local coordinate system
        const dx = h.x - barrier.x;
        const dy = h.y - barrier.y;
        const cos = Math.cos(-barrier.angle);
        const sin = Math.sin(-barrier.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        // Check collision with rotated rectangle using capsule collision
        const closestX = Math.max(-halfLength, Math.min(halfLength, localX));
        const closestY = Math.max(-halfWidth, Math.min(halfWidth, localY));
        const distX = localX - closestX;
        const distY = localY - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance < h.r) {
          // SOLID BARRIER - completely stop and push back
          const pushAngle = Math.atan2(dy, dx);
          const pushDistance = h.r - distance + 5; // Extra push for solid feel
          h.x += Math.cos(pushAngle) * pushDistance;
          h.y += Math.sin(pushAngle) * pushDistance;
          
          // STOP movement completely (like hitting a wall)
          h.vx = 0;
          h.vy = 0;
          
          // Create impact effect
          try {
            createExplosion(h.x, h.y, '#FF4444', 15);
          } catch {}
        }
      }

      // Bumpers: circle-circle bounce with amplification and angle noise
      for (const bb of (mapDef.bumpers || [])){
        const br = Math.max(6, bb.r || 22);
        const dx = h.x - bb.x, dy = h.y - bb.y;
        const dist = Math.hypot(dx, dy) || 1;
        const sumR = (h.r || 12) + br;
        if (dist < sumR) {
          // Normal from bumper center to horse
          const nx = dx / dist, ny = dy / dist;
          const overlap = sumR - dist;
          // push out and reflect
          pushOutAlong(h, nx, ny, Math.max(0, overlap||0));
          reflect(h, nx, ny);
          // scale speed by elasticity e
          const e = (typeof bb.e === 'number' && isFinite(bb.e)) ? bb.e : 1.15;
          h.vx *= e; h.vy *= e;
          // add slight angle noise
          const noise = (typeof bb.noise === 'number' && isFinite(bb.noise)) ? bb.noise : 0.15;
          if (noise > 0) {
            const sp = Math.hypot(h.vx, h.vy);
            let ang = Math.atan2(h.vy, h.vx);
            ang += (Math.random()*2-1) * noise;
            h.vx = Math.cos(ang) * sp;
            h.vy = Math.sin(ang) * sp;
          }
          // small visual feedback particles
          try {
            if (particles && particles.length < 2400){
              for (let k=0;k<6;k++){
                const pang = Math.atan2(ny, nx) + (Math.random()*2-1)*0.8;
                const spd = 1.2 + Math.random()*1.2;
                particles.push({ x: h.x - nx* (h.r*0.2), y: h.y - ny*(h.r*0.2), vx: Math.cos(pang)*spd, vy: Math.sin(pang)*spd, life: 14+Math.random()*12, color: 'rgba(124,241,255,0.8)' });
              }
            }
          } catch {}
        }
      }
    }

    // Border collision with damage
    let borderHit = false;
    
    // Get both top and bottom hub heights to create collision boundaries
    const gameHubEl = document.getElementById('gameHub');
    const notificationBarEl = document.getElementById('notificationBar');
    const bottomHubHeight = gameHubEl ? gameHubEl.offsetHeight : 34; // fallback to min-height
    const topHubHeight = notificationBarEl ? notificationBarEl.offsetHeight : 44; // fallback to min-height
    
    // Check collision speed change prevention setting
    const preventBorderSpeedChange = (window.config && window.config.physics && window.config.physics.collision && window.config.physics.collision.preventSpeedChange) || false;
    
    if (h.x-h.r<0){ 
      h.x=h.r; 
      h.vx=Math.abs(h.vx); // Always preserve speed magnitude, just change direction
      borderHit = true; 
    }
    if (h.x+h.r>canvas.width){ 
      h.x=canvas.width-h.r; 
      h.vx=-Math.abs(h.vx); // Always preserve speed magnitude, just change direction
      borderHit = true; 
    }
    // Top collision now accounts for notification bar height
    if (h.y-h.r<topHubHeight){ 
      h.y=topHubHeight+h.r; 
      h.vy=Math.abs(h.vy); // Always preserve speed magnitude, just change direction
      borderHit = true; 
    }
    // Bottom collision now accounts for hub height
    if (h.y+h.r>canvas.height-bottomHubHeight){ 
      h.y=canvas.height-bottomHubHeight-h.r; 
      h.vy=-Math.abs(h.vy); // Always preserve speed magnitude, just change direction
      borderHit = true; 
    }
    
    // Apply border damage if enabled
    if (borderHit && mapDef.hpSystemEnabled && mapDef.borderDamageEnabled && gateOpen && !h.hasShield) { // Divine Guardian shield blocks border damage
      const now = performance.now();
      const cooldown = h.lastBorderDamageTime ? (now - h.lastBorderDamageTime) : 1000;
      
      if (cooldown > 500) {
        const damage = mapDef.borderDamageAmount || 15;
        const oldHP = h.hp;
        
        // Direct HP modification
        h.hp -= damage;
        if (h.hp < 0) h.hp = 0;
        
        h.lastBorderDamageTime = now;
        h.damageImpactUntil = now + 200;
        h.damageImpactStrength = 0.5;
        
        
        // Enhanced damage indicator for border collision
        const isCritical = damage >= 12; // Lowered from 20 to 12
        floatingTexts.push({ 
          x: h.x + (Math.random() - 0.5) * 10,
          y: h.y - h.r - 5, 
          t: now, 
          life: isCritical ? 1200 : 900, 
          text: `-${damage} BORDER`, 
          color: isCritical ? '#FF1744' : '#607D8B',
          type: 'damage',
          critical: isCritical
        });
      }
    }

    // Dust FX on acceleration/braking (after velocity changes and movement)
  try {
    const nvx = h.vx || 0, nvy = h.vy || 0;
    const dvx = nvx - (h._prevVX || 0), dvy = nvy - (h._prevVY || 0);
    const dv = Math.hypot(dvx, dvy);
    const vNow = Math.hypot(nvx, nvy), vPrev = Math.hypot(h._prevVX || 0, h._prevVY || 0);
    const braking = (vPrev > 0.01 && vNow < vPrev * 0.85);
    const strongAccel = dv > 0.8 * speedScale; // tune threshold
    if ((strongAccel || braking) && particles && particles.length < 2000){
      const dir = Math.atan2(nvy, nvx);
      const base = braking ? 6 : 3;
      const count = braking ? 10 : 5;
      for (let k=0;k<count;k++){
        const ang = dir + Math.PI + (Math.random()-0.5)*0.8;
        const spd = (Math.random()*base + base*0.5) * (braking ? 1.2 : 1.0);
        particles.push({
          x: h.x + Math.cos(ang) * (h.r*0.2),
          y: h.y + Math.sin(ang) * (h.r*0.2),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 20 + Math.random()*20,
          color: (Math.random()<0.5? 'rgba(80,80,80,0.8)':'rgba(120,120,120,0.7)')
        });
      }
    }

    // Skid marks on sharp turns or hard braking
    if (particles && particles.length < 2200) {
      const prevDir = Math.atan2(h._prevVY || 0, h._prevVX || 0);
      const newDir = Math.atan2(nvy, nvx);
      // smallest angle difference
      let d = newDir - prevDir;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const angleDelta = Math.abs(d);
      const turningHard = angleDelta > 0.45 && vNow > 0.8; // ~26deg
      const hardBrake = braking && vPrev > 1.2;
      if ((turningHard || hardBrake) && Math.random() < 0.7){
        const dir = Math.atan2(nvy||1e-6, nvx||1e-6);
        const back = h.r * 0.6;
        const count = 1 + (turningHard ? 1 : 0);
        for (let i=0;i<count;i++){
          const jitterR = (Math.random()-0.5) * 3;
          const jitterT = (Math.random()-0.5) * 0.2;
          const px = h.x - Math.cos(dir) * back + Math.cos(dir + Math.PI/2) * jitterR;
          const py = h.y - Math.sin(dir) * back + Math.sin(dir + Math.PI/2) * jitterR;
          const size = 2 + Math.random()*2.5;
          const rot = dir + Math.PI/2 + jitterT;
          const life = 28 + Math.random()*32;
          const col = (Math.random()<0.5) ? 'rgba(40,40,40,0.65)' : 'rgba(60,60,60,0.55)';
          particles.push({ x:px, y:py, vx:0, vy:0, life, life0: life, color: col, size, shape: 'rect', rot, rotVel: (Math.random()-0.5)*0.02, drag: 0.99 });
        }
      }
    }
  } catch {}

    // Item pickup logic (use effective hit radius)

    let effR = Math.max(1, (h.r * (h.hitScale || 1.0)) - Math.max(0, h.hitInset || 0));
    // Prevent tunneling at high speed by inflating pickup radius based on per-frame travel
    {
      const speed = Math.hypot(h.vx, h.vy);
      const turboMult = (typeof h.turboMultiplier === 'number' && isFinite(h.turboMultiplier)) ? h.turboMultiplier : 1.0;
      const travel = speed * dt * turboMult; // px this frame
      // Add a portion of travel to effective radius, with a reasonable cap
      effR += Math.min(28, travel * 0.6);
    }
    // ❌ OLD BOOST COLLISION CODE - DISABLED (replaced by universal power-up system at line ~7180)
    // This old code was splicing boosts from array, preventing consumable=false from working
    /*
            for (let i = liveBoosts.length - 1; i >= 0; i--) {
      const boost = liveBoosts[i];
      if (Math.hypot(h.x - boost.x, h.y - boost.y) < effR + boost.r) {
        // Apply permanent boost stack using settings
        const boostSettings = mapDef.boostSettings || { stackBonus: 0.2, maxStacks: 10 };
        if (h.skillState?.name !== 'chill_guy') {
          h.boostStacks = Math.min(boostSettings.maxStacks, (h.boostStacks||0) + 1);
          const t = h.trapStacks||0, b = h.boostStacks||0;
          h.baseSpeedFactor = Math.max(0, 1 + boostSettings.stackBonus*b - 0.2*t);
        }
        liveBoosts.splice(i, 1);
        try { playSfx('boost_up'); } catch {}
        // Floating text: Speed Up!
        const bonusPct = Math.round(boostSettings.stackBonus * 100);
        floatingTexts.push({ x: h.x, y: h.y - h.r - 6, t: performance.now(), life: 900, text: `Speed Up! +${bonusPct}%`, color: '#ffd54f' });
        try { createPickupBurst('boost', h.x, h.y, boost.r); } catch {}
        h.speedLineUntil = performance.now() + 600;
        const pctB = Math.round((h.baseSpeedFactor||0) * 100);
        logEvent(`Ngựa ${h.name || ('#'+(h.i+1))} nhặt Boost: +${bonusPct}% tốc cơ bản (x${h.boostStacks}) → ${pctB}%`);
      }
    }
    */

    // Lightning collision - Speed Boost + Chain Lightning Effect
    for (let i = liveLightnings.length - 1; i >= 0; i--) {
      const lightning = liveLightnings[i];
      if (Math.hypot(h.x - lightning.x, h.y - lightning.y) < effR + lightning.r) {
        // Lightning Effect 1: Instant Speed Boost (configurable)
        const lightningSettings = mapDef.lightningSettings || { 
          speedMultiplier: 3.0, 
          speedDuration: 3000, 
          chainDamage: 15, 
          chainRadius: 120,
          visualDuration: 3000,
          screenShake: true,
          particleEffects: true
        };
        
        h.lightningBoostUntil = performance.now() + lightningSettings.speedDuration;
        h.lightningSpeedMultiplier = lightningSettings.speedMultiplier;
        
        // Lightning Effect 2: Chain Lightning - damage nearby horses (configurable)
        const chainRadius = lightningSettings.chainRadius;
        const chainDamage = lightningSettings.chainDamage;
        let chainTargets = 0;
        
        for (const otherHorse of horses) {
          if (otherHorse !== h && !otherHorse.eliminated) {
            const chainDist = Math.hypot(h.x - otherHorse.x, h.y - otherHorse.y);
            if (chainDist < chainRadius) {
              // Apply chain lightning damage (if HP system enabled)
              if (mapDef.hpSystemEnabled) {
                if (typeof otherHorse.hp !== 'number') otherHorse.hp = mapDef.horseMaxHP || 100;
                otherHorse.hp = Math.max(0, otherHorse.hp - chainDamage);
                otherHorse.damageImpactUntil = performance.now() + 300;
                otherHorse.damageImpactStrength = 0.8;
                
                // Floating damage text
                floatingTexts.push({ 
                  x: otherHorse.x, 
                  y: otherHorse.y - otherHorse.r - 8, 
                  t: performance.now(), 
                  life: 1200, 
                  text: `-${chainDamage} ⚡`, 
                  color: '#FFD700' 
                });
              }
              
              // Chain lightning visual effect
              try {
                lightningEffects.push({
                  x1: h.x, y1: h.y,
                  x2: otherHorse.x, y2: otherHorse.y,
                  startTime: performance.now(),
                  duration: 500,
                  intensity: 1.0
                });
              } catch {}
              
              chainTargets++;
            }
          }
        }
        
        // Remove lightning (consumed)
        liveLightnings.splice(i, 1);
        
        // Sound effects
        try { playSfx('lightning_strike'); } catch {}
        
        // Visual effects (configurable)
        try {
          // Lightning burst effect (if particles enabled)
          if (lightningSettings.particleEffects) {
            createPickupBurst( h.x, h.y, lightning.r);
          }
          
          // Screen shake (if enabled)
          if (lightningSettings.screenShake) {
            screenShakeX = Math.random() * 8 - 4;
            screenShakeY = Math.random() * 8 - 4;
          }
          
          // Lightning aura around horse (configurable duration)
          h.lightningAuraUntil = performance.now() + lightningSettings.visualDuration;
        } catch {}
        
        // Floating text
        floatingTexts.push({ 
          x: h.x, 
          y: h.y - h.r - 10, 
          t: performance.now(), 
          life: 1500, 
          text: `⚡ LIGHTNING BOOST! ⚡`, 
          color: '#FFD700' 
        });
        
        if (chainTargets > 0) {
          floatingTexts.push({ 
            x: h.x, 
            y: h.y - h.r - 25, 
            t: performance.now(), 
            life: 1200, 
            text: `Chain Lightning: ${chainTargets} targets!`, 
            color: '#FFFFFF' 
          });
        }
        
        // Log event
        logEvent(`Ngựa ${h.name || ('#'+(h.i+1))} nhặt Lightning: 3x tốc độ + Chain Lightning (${chainTargets} targets)`);
      }
    }

    // Tornado vortex effects - Continuous area hazard
    for (const tornado of liveTornados) {
      const tornadoDistance = Math.hypot(h.x - tornado.x, h.y - tornado.y);
      
      // Get tornado settings
      const settings = mapDef.tornadoSettings || {
        vortexRadius: 120,
        pullStrength: 1.2,
        damage: 5,
        speedPenalty: 0.7
      };
      
      // Apply vortex effects if horse is within tornado radius
      if (tornadoDistance < settings.vortexRadius) {
        // Calculate pull force (stronger when closer)
        const pullForce = settings.pullStrength * (1 - tornadoDistance / settings.vortexRadius);
        const pullAngle = Math.atan2(tornado.y - h.y, tornado.x - h.x);
        
        // Apply vortex pull to current horse
        h.x += Math.cos(pullAngle) * pullForce;
        h.y += Math.sin(pullAngle) * pullForce;
        
        // Spinning effect - add rotational velocity
        const spinAngle = pullAngle + Math.PI / 2; // Perpendicular for spin
        const spinForce = pullForce * 0.3;
        h.x += Math.cos(spinAngle) * spinForce;
        h.y += Math.sin(spinAngle) * spinForce;
        
        // Speed penalty while in vortex
        h.tornadoSpeedPenalty = settings.speedPenalty;
        h.tornadoSpeedPenaltyUntil = performance.now() + 100; // Reset every frame
        
        // Continuous damage in tornado eye (reduced rate)
        if (tornadoDistance < 40 && mapDef.hpSystemEnabled && !h.hasShield) { // Divine Guardian shield blocks tornado damage
          if (!h.lastTornadoDamage || performance.now() - h.lastTornadoDamage > 500) { // Damage every 0.5s
            if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
            h.hp = Math.max(0, h.hp - settings.damage);
            h.damageImpactUntil = performance.now() + 300;
            h.damageImpactStrength = 0.6;
            h.lastTornadoDamage = performance.now();
            
            // Tornado damage text (less frequent)
            floatingTexts.push({
              x: h.x, y: h.y - h.r - 8,
              t: performance.now(), life: 1000,
              text: `-${settings.damage} 🌪️`, color: '#87CEEB'
            });
          }
        }
        
        // Visual vortex effect on affected horses
        h.vortexEffectUntil = performance.now() + 200;
        
        // Occasional sound effect (not every frame)
        if (!h.lastTornadoSound || performance.now() - h.lastTornadoSound > 2000) {
          try { playSfx('tornado_ambient'); } catch {}
          h.lastTornadoSound = performance.now();
        }
      }
    }

    // Volcano particle system - Lava projectiles
    
    // Initialize volcano particles array if not exists
    if (!window.volcanoParticles) {
      window.volcanoParticles = [];
    }
    
    // Processing volcanos for particles
    for (const volcano of liveVolcanos) {
      // Get volcano settings
      const settings = mapDef.volcanoSettings || {
        effectRadius: 120,
        damage: 5,
        damageInterval: 500,
        particleCount: 3,
        eruptionInterval: 1000
      };
      
      // Check volcano eruption timing
      
      // Spawn new lava particles periodically
      if (!volcano.lastEruption || now - volcano.lastEruption > settings.eruptionInterval) {
        // Eruption time - creating particles
        volcano.lastEruption = now;
        
        // Create multiple lava particles per eruption
        for (let i = 0; i < (settings.particleCount || 3); i++) {
          // Launch angle: -45° to -135° (upward arc like fireworks)
          const baseAngle = -Math.PI/2; // -90° (straight up)
          const angleSpread = Math.PI/2; // ±45° spread
          const angle = baseAngle + (Math.random() - 0.5) * angleSpread;
          
          const baseSpeed = settings.launchSpeed || 1.7;
          const speed = baseSpeed * (0.7 + Math.random() * 0.6); // Variable speed based on setting
          const distance = 50 + Math.random() * (settings.effectRadius - 50); // Random distance
          
          const particle = {
            x: volcano.x,
            y: volcano.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed, // Pure angle-based velocity for natural arc
            life: 8000 + Math.random() * 4000, // 8-12 seconds for ultra-slow motion
            maxLife: 12000,
            damage: settings.damage,
            size: 4 + Math.random() * 4, // Size 4-8px
            startTime: now,
            volcanoId: volcano.x + ',' + volcano.y // Track source volcano
          };
          
          window.volcanoParticles.push(particle);
          // Particle created
        }
      }
    }
    
    // Update and check particle collisions with horses
    for (let i = window.volcanoParticles.length - 1; i >= 0; i--) {
      const particle = window.volcanoParticles[i];
      
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity to particles (configurable from context menu)
      const gravityValue = (mapDef.volcanoSettings && mapDef.volcanoSettings.gravity) || 0.005;
      particle.vy += gravityValue; // Configurable gravity for adjustable arc height
      
      // Reduce particle life (adjusted for ultra-slow motion)
      particle.life -= 16; // 60fps, ~12 seconds total life for slow motion
      
      // Remove expired particles
      if (particle.life <= 0) {
        window.volcanoParticles.splice(i, 1);
        continue;
      }
      
      // Check collision with current horse
      const particleDistance = Math.hypot(h.x - particle.x, h.y - particle.y);
      const hitRadius = h.r + particle.size;
      
      if (particleDistance < hitRadius && mapDef.hpSystemEnabled) {
        // Particle hit horse - deal damage
        if (!h.lastVolcanoParticleDamage || now - h.lastVolcanoParticleDamage > 200) { // Damage cooldown
          if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
          h.hp = Math.max(0, h.hp - particle.damage);
          h.damageImpactUntil = now + 300;
          h.damageImpactStrength = 0.8;
          h.lastVolcanoParticleDamage = now;
          
          // Lava particle damage text
          floatingTexts.push({
            x: h.x, y: h.y - h.r - 8,
            t: now, life: 1000,
            text: `-${particle.damage} 🔥`, color: 'rgba(255,69,0,1.0)'
          });
          
          // Visual impact effect
          h.volcanoHitEffectUntil = now + 500;
        }
        
        // Remove particle after hit
        window.volcanoParticles.splice(i, 1);
      }
    }

    // Healing Zone pickup (HP restoration)
    if (mapDef.hpSystemEnabled) {
      for (let i = (mapDef.healingzones || []).length - 1; i >= 0; i--) {
        const zone = mapDef.healingzones[i];
        const pickupRadius = zone.r || 40;
        const healAmount = zone.healAmount || 10;
        
        if (Math.hypot(h.x - zone.x, h.y - zone.y) < effR + pickupRadius) {
          // Initialize horse HP if not exists
          if (typeof h.hp !== 'number') h.hp = mapDef.horseMaxHP || 100;
          
          const maxHP = mapDef.horseMaxHP || 100;
          const oldHP = h.hp;
          h.hp = Math.min(maxHP, h.hp + healAmount);
          const actualHeal = h.hp - oldHP;
          
          if (actualHeal > 0) {
            // Remove the healing zone after pickup
            mapDef.healingzones.splice(i, 1);
            try { invalidateStaticLayer(); } catch {}
            
            try { playSfx('boost_up'); } catch {}
            
            // Floating text: +HP
            floatingTexts.push({ 
              x: h.x, y: h.y - h.r - 6, 
              t: performance.now(), life: 1000, 
              text: `+${actualHeal} HP`, color: '#4CAF50' 
            });
            
            try { createPickupBurst('heal', h.x, h.y, 12); } catch {}
            
            // Visual healing effect
            h.healFlash = performance.now();
            h.healImpactUntil = performance.now() + 300;
            h.healImpactStrength = 0.6;
            
            logEvent(`Ngựa ${h.name || ('#'+(h.i+1))} nhặt Healing Zone: +${actualHeal} HP → ${h.hp}/${maxHP}`);
          }
        }
      }
    }

    // Turbo pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
    // Trap pickup - REMOVED: Now handled by universal collision system (power-up collision)
    // Shield pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
    // RAM pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
    
    // Teleport pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
    
    // Magnet pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
    
    // New Power-ups: Warp Zone (cosmic teleportation network)
    
    // Check static warp zones from mapDef
    for (let i = (mapDef.warpzones || []).length - 1; i >= 0; i--) {
      const warpzone = mapDef.warpzones[i];
      const dist = Math.hypot(h.x - warpzone.x, h.y - warpzone.y);
      if (dist < effR + warpzone.r) {
        // Check cooldown to prevent immediate re-warp
        if (h.warpCooldownUntil && performance.now() < h.warpCooldownUntil) {
          continue; // Skip if on cooldown
        }
        
        // Find all warp zones (both static and live)
        const allWarpzones = [...(mapDef.warpzones || []), ...liveWarpzones];
        
        // Find another warp zone to teleport to (not current one, min 50px away)
        const targetWarpzones = allWarpzones.filter(wz => 
          wz !== warpzone && 
          Math.hypot(wz.x - warpzone.x, wz.y - warpzone.y) > 50
        );
        
        if (targetWarpzones.length > 0) {
          // Choose random target warp zone
          const target = targetWarpzones[Math.floor(Math.random() * targetWarpzones.length)];
          
          // Teleport horse OUTSIDE the target warp zone radius to prevent re-trigger
          const angle = Math.random() * Math.PI * 2;
          const offset = (target.r || 20) + h.r + 10; // Outside the target zone radius
          h.x = target.x + Math.cos(angle) * offset;
          h.y = target.y + Math.sin(angle) * offset;
          
          // Reduce velocity and add cooldown (2 seconds to prevent ping-pong)
          h.vx *= 0.5;
          h.vy *= 0.5;
          h.warpCooldownUntil = performance.now() + 2000; // 2s cooldown
          
          // Visual effects
          try { createExplosion(warpzone.x, warpzone.y, '#9C27B0', 20); } catch {}
          try { createExplosion(h.x, h.y, '#9C27B0', 15); } catch {}
          floatingTexts.push({ 
            x: h.x, y: h.y - h.r - 6, 
            t: performance.now(), life: 1200, 
            text: 'Warped! 🌌', color: '#9C27B0' 
          });
          
          try { playSfx('teleport'); } catch {}
          logEvent(`🌌 Ngựa ${h.name || ('#'+(h.i+1))} đã warp qua Warp Zone!`);
        }
        
        // Note: Warp zones are NOT removed (permanent portals)
        break;
      }
    }
    
    // Check live warp zones
    for (let i = liveWarpzones.length - 1; i >= 0; i--) {
      const warpzone = liveWarpzones[i];
      const dist = Math.hypot(h.x - warpzone.x, h.y - warpzone.y);
      if (dist < effR + warpzone.r) {
        // Check cooldown to prevent immediate re-warp
        if (h.warpCooldownUntil && performance.now() < h.warpCooldownUntil) {
          continue; // Skip if on cooldown
        }
        
        // Find all warp zones (both static and live)
        const allWarpzones = [...(mapDef.warpzones || []), ...liveWarpzones];
        
        // Find another warp zone to teleport to (not current one, min 50px away)
        const targetWarpzones = allWarpzones.filter(wz => 
          wz !== warpzone && 
          Math.hypot(wz.x - warpzone.x, wz.y - warpzone.y) > 50
        );
        
        if (targetWarpzones.length > 0) {
          // Choose random target warp zone
          const target = targetWarpzones[Math.floor(Math.random() * targetWarpzones.length)];
          
          // Teleport horse OUTSIDE the target warp zone radius to prevent re-trigger
          const angle = Math.random() * Math.PI * 2;
          const offset = (target.r || 20) + h.r + 10; // Outside the target zone radius
          h.x = target.x + Math.cos(angle) * offset;
          h.y = target.y + Math.sin(angle) * offset;
          
          // Reduce velocity and add cooldown (2 seconds to prevent ping-pong)
          h.vx *= 0.5;
          h.vy *= 0.5;
          h.warpCooldownUntil = performance.now() + 2000; // 2s cooldown
          
          // Visual effects
          try { createExplosion(warpzone.x, warpzone.y, '#9C27B0', 20); } catch {}
          try { createExplosion(h.x, h.y, '#9C27B0', 15); } catch {}
          floatingTexts.push({ 
            x: h.x, y: h.y - h.r - 6, 
            t: performance.now(), life: 1200, 
            text: 'Warped! 🌌', color: '#9C27B0' 
          });
          
          try { playSfx('teleport'); } catch {}
          logEvent(`🌌 Ngựa ${h.name || ('#'+(h.i+1))} đã warp qua Warp Zone!`);
        }
        
        // Note: Warp zones are NOT removed (permanent portals)
        break;
      }
    }
    
    // New Power-ups: Quantum Dash (speed + phase power-up)
    
    // Check static quantum dash from mapDef
    for (let i = (mapDef.quantumdashs || []).length - 1; i >= 0; i--) {
      const quantumdash = mapDef.quantumdashs[i];
      const dist = Math.hypot(h.x - quantumdash.x, h.y - quantumdash.y);
      if (dist < effR + quantumdash.r) {
        // Check if already has quantum dash effect (prevent spam)
        if (h.quantumDashUntil && performance.now() < h.quantumDashUntil) {
          continue; // Skip if already active
        }
        
        // Use configurable settings
        const duration = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.durationMs) ? mapDef.quantumdashSettings.durationMs : 2500;
        const speedMultiplier = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.speedMultiplier) ? mapDef.quantumdashSettings.speedMultiplier : 3.0;
        const phaseEnabled = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.phaseEnabled) ? mapDef.quantumdashSettings.phaseEnabled : true;
        const consumable = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.consumable) ? mapDef.quantumdashSettings.consumable : false;
        
        // Apply quantum dash effect
        h.quantumDashUntil = performance.now() + duration;
        h.quantumDashMultiplier = speedMultiplier;
        h.phaseEnabled = phaseEnabled;
        
        // Check if consumable setting - remove if true, keep if false
        if (consumable) {
          // Remove from static mapDef array if consumable
          mapDef.quantumdashs.splice(i, 1);
        }
        
        // Visual effects
        try { createExplosion(quantumdash.x, quantumdash.y, '#00BCD4', 30); } catch {}
        floatingTexts.push({ 
          x: h.x, y: h.y - h.r - 6, 
          t: performance.now(), life: 1500, 
          text: 'Quantum Dash! 🔮', color: '#00BCD4' 
        });
        
        // Speed lines effect
        h.speedLineUntil = performance.now() + duration;
        
        try { playSfx('boost_up'); } catch {}
        logEvent(`🔮 Ngựa ${h.name || ('#'+(h.i+1))} kích hoạt Quantum Dash: 3x tốc độ + xuyên tường!`);
        break;
      }
    }
    
    // Check live quantum dash
    for (let i = liveQuantumdashs.length - 1; i >= 0; i--) {
      const quantumdash = liveQuantumdashs[i];
      const dist = Math.hypot(h.x - quantumdash.x, h.y - quantumdash.y);
      if (dist < effR + quantumdash.r) {
        // Check if already has quantum dash effect (prevent spam)
        if (h.quantumDashUntil && performance.now() < h.quantumDashUntil) {
          continue; // Skip if already active
        }
        
        // Use configurable settings
        const duration = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.durationMs) ? mapDef.quantumdashSettings.durationMs : 2500;
        const speedMultiplier = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.speedMultiplier) ? mapDef.quantumdashSettings.speedMultiplier : 3.0;
        const phaseEnabled = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.phaseEnabled) ? mapDef.quantumdashSettings.phaseEnabled : true;
        const consumable = (mapDef.quantumdashSettings && mapDef.quantumdashSettings.consumable) ? mapDef.quantumdashSettings.consumable : false;
        
        // Apply quantum dash effect
        h.quantumDashUntil = performance.now() + duration;
        h.quantumDashMultiplier = speedMultiplier;
        h.phaseEnabled = phaseEnabled;
        
        // Note: Live Quantum Dash can be removed (runtime spawned)
        liveQuantumdashs.splice(i, 1);
        
        // Visual effects
        try { createExplosion(quantumdash.x, quantumdash.y, '#00BCD4', 30); } catch {}
        floatingTexts.push({ 
          x: h.x, y: h.y - h.r - 6, 
          t: performance.now(), life: 1500, 
          text: 'Quantum Dash! 🔮', color: '#00BCD4' 
        });
        
        // Speed lines effect
        h.speedLineUntil = performance.now() + duration;
        
        try { playSfx('boost_up'); } catch {}
        logEvent(`🔮 Ngựa ${h.name || ('#'+(h.i+1))} kích hoạt Quantum Dash: 3x tốc độ + xuyên tường!`);
        break;
      }
    }
    
    // Poison pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
    
    // Time Freeze pickup - REMOVED: Now handled by universal collision system (line 7274-7535)
  }
    
  // ===== SPATIAL HASH COLLISION (O(n) instead of O(n²)) =====
  // Initialize spatial hash (reuse instance for performance)
  if (!window.horsesSpatialHash) {
    window.horsesSpatialHash = new SpatialHash(60); // 60px cells = ~2x max horse radius
  }
  const spatialHash = window.horsesSpatialHash;
  spatialHash.clear();

  // Build spatial hash with non-eliminated, non-ghost horses
  horses.forEach(h => {
    if (!h.eliminated && h.ghost <= 0) {
      spatialHash.insert(h);
    }
  });

  // Track checked pairs to avoid duplicates
  const checkedPairs = new Set();

  // Check collisions using spatial hash
  horses.forEach((h1, i) => {
    if (h1.eliminated || h1.ghost > 0) return;
    
    // Get nearby horses (O(1) lookup instead of checking all horses)
    const nearby = spatialHash.getNearby(h1);
    
    nearby.forEach(h2 => {
      if (h2.eliminated || h2.ghost > 0) return;
      
      // Avoid duplicate checks (A-B and B-A)
      const id1 = h1.id || h1.i || i;
      const id2 = h2.id || h2.i || horses.indexOf(h2);
      if (id1 >= id2) return; // Only check once per pair
      
      const pairKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
      if (checkedPairs.has(pairKey)) return;
      checkedPairs.add(pairKey);
      
      // === COLLISION DETECTION (same as before) ===
      const dx = h2.x - h1.x, dy = h2.y - h1.y, dist = Math.hypot(dx, dy);
      // Use scaled radii for more accurate sprite-based collisions
      let r1 = h1.r * (h1.hitScale || 1.0);
      let r2 = h2.r * (h2.hitScale || 1.0);
      const inset1 = Math.max(0, h1.hitInset || 0);
      const inset2 = Math.max(0, h2.hitInset || 0);
      r1 = Math.max(1, r1 - inset1);
      r2 = Math.max(1, r2 - inset2);
      const overlap = (r1 + r2) - dist;

      if (overlap > 0) {
          // Nebula damage boost collision
          if (h1.damageBoost > 0 && !h2.hasShield) {
            const damage = h1.damageBoost;
            h2.speedMod = Math.max(0.1, h2.speedMod - (damage / 50)); // Damage reduces speed
            createExplosion(h2.x, h2.y, '#9C27B0', 20); // Purple explosion
            floatingTexts.push({
              x: h2.x, y: h2.y - (h2.r || 8) - 10,
              t: performance.now(), life: 1000,
              text: `-${damage}`, color: '#9C27B0'
            });
            debugLog(`[DEBUG] Horse ${h1.id || 'unknown'} deals ${damage} damage to horse ${h2.id || 'unknown'}`);
          }
          if (h2.damageBoost > 0 && !h1.hasShield) {
            const damage = h2.damageBoost;
            h1.speedMod = Math.max(0.1, h1.speedMod - (damage / 50)); // Damage reduces speed
            createExplosion(h1.x, h1.y, '#9C27B0', 20); // Purple explosion
            floatingTexts.push({
              x: h1.x, y: h1.y - (h1.r || 8) - 10,
              t: performance.now(), life: 1000,
              text: `-${damage}`, color: '#9C27B0'
            });
            debugLog(`[DEBUG] Horse ${h2.id || 'unknown'} deals ${damage} damage to horse ${h1.id || 'unknown'}`);
          }

          // Ram collision logic
          // Shield vs. Ram collision logic
          // Phantom Strike collision
    if (h1.skillState?.name === 'phantom_strike' && h1.skillState.canAttack && !h2.hasShield) {
      h2.speedMod = Math.max(0.1, h2.speedMod - 0.5); // Reduce speed by 50% base
      h1.skillState.canAttack = false; // Only hits once
      createExplosion(h2.x, h2.y, '#9400D3', 25); // Purple flash on victim
      beep(150, 0.2, 'sawtooth', 0.1);
    } else if (h2.skillState?.name === 'phantom_strike' && h2.skillState.canAttack && !h1.hasShield) {
      h1.speedMod = Math.max(0.1, h1.speedMod - 0.5);
      h2.skillState.canAttack = false;
      createExplosion(h1.x, h1.y, '#9400D3', 25);
      beep(150, 0.2, 'sawtooth', 0.1);
    }

    if (h1.hasRam && h2.hasShield) {
            h1.hasRam = false;
            h2.hasShield = false;
            
            // Check if Divine Guardian shield was consumed
            if (h2.guardianShieldActive && h2.skillState?.name === 'guardian') {
              h2.guardianShieldActive = false;
              h2.skillState.status = 'cooldown';
              h2.skillState.cooldownUntil = performance.now() + (h2.skillState?.cooldown || 60000);
              createExplosion(h2.x, h2.y, '#FFD700', 35); // Golden shield break
              floatingTexts.push({ x: h2.x, y: h2.y - h2.r - 6, t: performance.now(), life: 1200, text: 'Shield Used!', color: '#FF6B35' });
            }
            
            createExplosion(h1.x + dx/2, h1.y + dy/2, '#8888FF'); // Blue/purple explosion
            return; // Skip rest of collision
          } else if (h2.hasRam && h1.hasShield) {
            h2.hasRam = false;
            h1.hasShield = false;
            
            // Check if Divine Guardian shield was consumed
            if (h1.guardianShieldActive && h1.skillState?.name === 'guardian') {
              h1.guardianShieldActive = false;
              h1.skillState.status = 'cooldown';
              h1.skillState.cooldownUntil = performance.now() + (h1.skillState?.cooldown || 60000);
              createExplosion(h1.x, h1.y, '#FFD700', 35); // Golden shield break
              floatingTexts.push({ x: h1.x, y: h1.y - h1.r - 6, t: performance.now(), life: 1200, text: 'Shield Used!', color: '#FF6B35' });
            }
            
            createExplosion(h1.x + dx/2, h1.y + dy/2, '#8888FF');
            return; // Skip rest of collision
          }

          if (h1.hasRam && h2.hasRam) {
            // Both have Ram: both lose it, no one is eliminated
            h1.hasRam = false;
            h2.hasRam = false;
            createExplosion(h1.x + dx/2, h1.y + dy/2, '#FFFF00'); // Yellow explosion for clash
            return; // Skip normal collision physics
          } else if (h1.hasRam) {
            // h1 has Ram, eliminates h2
            h2.eliminated = true; createExplosion(h2.x, h2.y);
            try { playDeathSfx(); } catch {}
            if (h1.skillState && h1.skillState.status === 'active') {
              h1.speedMod = 2.0;
              h1.skillState.status = 'completed_success';
              // Immediately begin cooldown so UI shows the timer
              try {
                const t = performance.now();
                h1.skillState.status = 'cooldown';
                h1.skillState.cooldownUntil = t + (h1.skillState?.cooldown || 90000);
              } catch {}
              createExplosion(h1.x, h1.y, '#00FF00', 25);
            }
            h1.hasRam = false; // Ram is always consumed
            logEvent(`Ngựa ${h1.name || ('#'+(h1.i+1))} đã tiêu diệt ngựa ${h2.name || ('#'+(h2.i+1))}`);
            return; // Skip rest of collision
          } else if (h2.hasRam) {
            // h2 has Ram, eliminates h1
            h1.eliminated = true; createExplosion(h1.x, h1.y);
            try { playDeathSfx(); } catch {}
            if (h2.skillState && h2.skillState.status === 'active') {
              h2.speedMod = 2.0;
              h2.skillState.status = 'completed_success';
              // Immediately begin cooldown so UI shows the timer
              try {
                const t = performance.now();
                h2.skillState.status = 'cooldown';
                h2.skillState.cooldownUntil = t + (h2.skillState?.cooldown || 90000);
              } catch {}
              createExplosion(h2.x, h2.y, '#00FF00', 25);
            }
            h2.hasRam = false; // Ram is always consumed
            logEvent(`Ngựa ${h2.name || ('#'+(h2.i+1))} đã tiêu diệt ngựa ${h1.name || ('#'+(h1.i+1))}`);
            return; // Skip rest of collision
          }

          // Standard collision physics (proportional push-out by scaled hitboxes)
          // Collision sound with cooldown to prevent spam
          if (collisionSfxEnabled) {
            const now = performance.now();
            const cooldown = 150; // 150ms cooldown between collision sounds
            
            // Check if enough time has passed since last collision sound for EITHER horse
            const h1CanPlay = !h1._lastCollisionSoundTime || (now - h1._lastCollisionSoundTime) > cooldown;
            const h2CanPlay = !h2._lastCollisionSoundTime || (now - h2._lastCollisionSoundTime) > cooldown;
            
            if (h1CanPlay && h2CanPlay) {
              beep(780, 0.06, 'sine', 0.025);
              h1._lastCollisionSoundTime = now;
              h2._lastCollisionSoundTime = now;
            }
          }
          const nx = dx / (dist || 1), ny = dy / (dist || 1);
          const rr1 = h1.r * (h1.hitScale || 1.0);
          const rr2 = h2.r * (h2.hitScale || 1.0);
          const sum = (rr1 + rr2) || 1;
          const move1 = overlap * (rr2 / sum);
          const move2 = overlap * (rr1 / sum);
          h1.x -= nx * move1;
          h1.y -= ny * move1;
          h2.x += nx * move2;
          h2.y += ny * move2;
          
          // Velocity bounce physics (optional based on settings)
          const preventSpatialSpeedChange = (window.config && window.config.physics && window.config.physics.collision && window.config.physics.collision.preventSpeedChange) || false;
          
          if (!preventSpatialSpeedChange) {
            // Apply velocity bounce/reflection for realistic collision
            const bounce = 0.4; // Bounce damping factor
            const relativeVx = h1.vx - h2.vx;
            const relativeVy = h1.vy - h2.vy;
            const relativeSpeed = relativeVx * nx + relativeVy * ny;
            
            if (relativeSpeed > 0) { // Only if approaching each other
              const impulse = 2 * relativeSpeed / 2; // Equal mass assumption
              const impulseX = nx * impulse * bounce;
              const impulseY = ny * impulse * bounce;
              
              h1.vx -= impulseX;
              h1.vy -= impulseY;
              h2.vx += impulseX;
              h2.vy += impulseY;
              
              if (window._debugCollision) {
                console.log('[DEBUG] After velocity change - h1:', h1.vx.toFixed(2), h1.vy.toFixed(2), 'h2:', h2.vx.toFixed(2), h2.vy.toFixed(2));
                console.log('[DEBUG] Applied impulse:', impulseX.toFixed(2), impulseY.toFixed(2));
              }
            }
          } else {
            if (window._debugCollision) {
              console.log('[DEBUG] TRUE PREVENTION - Position separation only, NO velocity changes');
            }
            // TRUE PREVENTION: Position separation already handled above, NO velocity modifications
          }
          // If preventSpeedChange is true, only position separation occurs
          // Power-ups, skills, and other speed effects still work normally

          // Calculate HP damage based on velocity (only if HP system is enabled and race has started)
          if (mapDef.hpSystemEnabled && gateOpen) {
            const now = performance.now();
            const vel1 = Math.hypot(h1.vx || 0, h1.vy || 0);
            const vel2 = Math.hypot(h2.vx || 0, h2.vy || 0);
            
            // Get speed modifiers (skills like Oguri Fat boost speedMod)
            const h1SpeedMod = h1.speedMod || 1.0;
            const h2SpeedMod = h2.speedMod || 1.0;
            
            // DAMAGE FORMULA: (base velocity × speedMod) × 2 × damage bonus
            // Example: velocity=1.0, speedMod=2.0 (Oguri Fat) → effective speed = 2.0
            // Damage = 2.0 × 2 = 4.0, with 1.5x bonus = 6.0
            const h1DamageBonus = h1.oguriFatDamageBonus || 1.0;
            const h2DamageBonus = h2.oguriFatDamageBonus || 1.0;
            const effectiveVel1 = vel1 * h1SpeedMod;
            const effectiveVel2 = vel2 * h2SpeedMod;
            const damage1 = Math.max(0.1, effectiveVel1 * 2 * h1DamageBonus); // h1 gây sát thương cho h2
            const damage2 = Math.max(0.1, effectiveVel2 * 2 * h2DamageBonus); // h2 gây sát thương cho h1
            
            // Apply damage with cooldown to prevent spam
            let h1Killed = false, h2Killed = false;
            let killer = null, victim = null;
            
            if (!h1.lastDamageTime || (now - h1.lastDamageTime) > 800) {
              const oldHP1 = h1.hp;
              h1.hp = Math.max(0, h1.hp - damage2);
              h1.lastDamageTime = now;
              h1.damageImpactUntil = now + 200;
              h1.damageImpactStrength = Math.min(1, vel2 / 10 + 0.3);
              
              // Enhanced damage indicator for horse collision
              // Damage text uses the COLOR of the horse receiving damage (h1)
              const isCritical1 = damage2 >= 6; // Critical when speed >= 3 (3*2=6)
              const damageColor1 = h1.colorBody || h1.colorLabel || '#FF5722';
              floatingTexts.push({
                x: h1.x + (Math.random() - 0.5) * 15,
                y: h1.y - h1.r - 8,
                t: now,
                life: isCritical1 ? 1400 : 1000,
                text: `-${damage2.toFixed(1)}`,
                color: damageColor1,
                type: 'damage',
                critical: isCritical1,
                outline: true // Add outline for visibility
              });
              
              // Check if h1 was killed by h2
              if (oldHP1 > 0 && h1.hp <= 0) {
                h1Killed = true;
                killer = h2;
                victim = h1;
              }
            }
            
            if (!h2.lastDamageTime || (now - h2.lastDamageTime) > 800) {
              const oldHP2 = h2.hp;
              
              // If h1 was killed, h2 gets immunity from this collision
              if (!h1Killed) {
                h2.hp = Math.max(0, h2.hp - damage1);
                
                // Enhanced damage indicator for horse collision
                // Damage text uses the COLOR of the horse receiving damage (h2)
                const isCritical2 = damage1 >= 6; // Critical when speed >= 3 (3*2=6)
                const damageColor2 = h2.colorBody || h2.colorLabel || '#FF5722';
                floatingTexts.push({
                  x: h2.x + (Math.random() - 0.5) * 15,
                  y: h2.y - h2.r - 8,
                  t: now,
                  life: isCritical2 ? 1400 : 1000,
                  text: `-${damage1.toFixed(1)}`,
                  color: damageColor2,
                  type: 'damage',
                  critical: isCritical2,
                  outline: true // Add outline for visibility
                });
                
                // Check if h2 was killed by h1
                if (oldHP2 > 0 && h2.hp <= 0) {
                  h2Killed = true;
                  killer = h1;
                  victim = h2;
                }
              }
              
              h2.lastDamageTime = now;
              h2.damageImpactUntil = now + 200;
              h2.damageImpactStrength = Math.min(1, vel1 / 10 + 0.3);
            }
            
            // Apply kill rewards
            if (killer && victim) {
              // Heal killer by 20% of max HP
              const healAmount = Math.round(killer.maxHP * 0.2);
              const oldKillerHP = killer.hp;
              killer.hp = Math.min(killer.maxHP, killer.hp + healAmount);
              
              // Heal indicator for killer
              if (healAmount > 0) {
                floatingTexts.push({
                  x: killer.x + (Math.random() - 0.5) * 10,
                  y: killer.y - killer.r - 12,
                  t: now,
                  life: 1200,
                  text: `+${healAmount}`,
                  color: '#4CAF50',
                  type: 'heal'
                });
              }
              
              
              // Visual effect for killer
              killer.damageImpactUntil = 0; // Cancel damage effect
              floatingTexts.push({ 
                x: killer.x, 
                y: killer.y - killer.r - 10, 
                t: performance.now(), 
                life: 1500, 
                text: `KILL! +20%HP`, 
                color: '#4CAF50' 
              });
            }
          }

          // Check collision speed change prevention setting
          const preventHorseSpeedChange = (window.config && window.config.physics && window.config.physics.collision && window.config.physics.collision.preventSpeedChange) || false;
          
          // Store original speeds for verification
          const originalSpeed1 = Math.hypot(h1.vx, h1.vy);
          const originalSpeed2 = Math.hypot(h2.vx, h2.vy);
          
          if (!preventHorseSpeedChange) {
            // Full collision response
            const va = h1.vx * nx + h1.vy * ny;
            const vb = h2.vx * nx + h2.vy * ny;
            const impulse = (vb - va) * 0.95; // slight damping to reduce jitter
            h1.vx += impulse * nx;
            h1.vy += impulse * ny;
            h2.vx -= impulse * nx;
            h2.vy -= impulse * ny;
          } else {
            // SPEED-PRESERVING COLLISION: Realistic direction changes while maintaining exact speeds
            
            // Calculate collision response directions
            const va = h1.vx * nx + h1.vy * ny; // velocity component along collision normal
            const vb = h2.vx * nx + h2.vy * ny;
            
            // Only redirect if horses are moving toward each other
            if (va - vb > 0) {
              // Calculate new velocity directions (elastic collision response)
              const newVa = vb; // swap velocity components along normal
              const newVb = va;
              
              // Apply the collision response
              h1.vx += (newVa - va) * nx;
              h1.vy += (newVa - va) * ny;
              h2.vx += (newVb - vb) * nx;
              h2.vy += (newVb - vb) * ny;
              
              // Preserve original speeds by normalizing to original magnitudes
              const currentSpeed1 = Math.hypot(h1.vx, h1.vy);
              const currentSpeed2 = Math.hypot(h2.vx, h2.vy);
              
              if (currentSpeed1 > 0) {
                h1.vx = (h1.vx / currentSpeed1) * originalSpeed1;
                h1.vy = (h1.vy / currentSpeed1) * originalSpeed1;
              }
              
              if (currentSpeed2 > 0) {
                h2.vx = (h2.vx / currentSpeed2) * originalSpeed2;
                h2.vy = (h2.vy / currentSpeed2) * originalSpeed2;
              }
              
            }
          }
          // If preventHorseSpeedChange is true, horses only separate positions, velocities unchanged
        }
    }); // end nearby.forEach
  }); // end horses.forEach
  
  // Check for HP elimination (only if HP system is enabled)
  if (mapDef.hpSystemEnabled) {
    for (const h of horses) {
      if (!h.eliminated && h.hp <= 0) {
        h.eliminated = true;
        h.eliminatedTime = performance.now(); // Track when eliminated for ranking
        
        // === EPIC EXPLOSION EFFECT ===
        // Layer 1: Core explosion (bright white/yellow)
        createExplosion(h.x, h.y, '#FFFFFF', 50);
        createExplosion(h.x, h.y, '#FFFF00', 45);
        createExplosion(h.x, h.y, '#FF6600', 40);
        createExplosion(h.x, h.y, '#FF0000', 35);
        
        // Layer 2: Shockwave ring particles
        for (let ring = 0; ring < 24; ring++) {
          const angle = (Math.PI * 2 * ring) / 24;
          const speed = 6 + Math.random() * 4;
          particles.push({
            x: h.x, y: h.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40 + Math.random() * 20,
            color: ['#FFFFFF', '#FFFF00', '#FF6600', '#FF0000'][Math.floor(Math.random() * 4)]
          });
        }
        
        // Layer 3: Debris/sparks flying outward
        for (let spark = 0; spark < 30; spark++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 6;
          particles.push({
            x: h.x + (Math.random() - 0.5) * 20,
            y: h.y + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // Slight upward bias
            life: 30 + Math.random() * 40,
            color: ['#FF4444', '#FF8800', '#FFCC00', '#FFFFFF'][Math.floor(Math.random() * 4)]
          });
        }
        
        // Layer 4: Smoke particles (slower, longer lasting)
        for (let smoke = 0; smoke < 15; smoke++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          particles.push({
            x: h.x + (Math.random() - 0.5) * 30,
            y: h.y + (Math.random() - 0.5) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 60 + Math.random() * 40,
            color: ['#666666', '#888888', '#444444'][Math.floor(Math.random() * 3)]
          });
        }
        
        // Floating text
        floatingTexts.push({ 
          x: h.x, 
          y: h.y - 20, 
          t: performance.now(), 
          life: 2000, 
          text: '💀 ELIMINATED! 💀', 
          color: '#FF0000' 
        });
        floatingTexts.push({ 
          x: h.x, 
          y: h.y - 40, 
          t: performance.now(), 
          life: 1500, 
          text: h.name || ('#' + (h.i + 1)), 
          color: '#FFFFFF' 
        });
        
        // Screen shake effect
        if (typeof window.screenShakeUntil !== 'undefined') {
          window.screenShakeUntil = performance.now() + 400;
          window.screenShakeIntensity = 8;
        }
        
        // Play death sound
        try { playDeathSfx(); } catch {}
        
        logEvent(`💀 Ngựa ${h.name || ('#'+(h.i+1))} đã bị tiêu diệt!`);
      }
    }
    
    // Check for last horse standing win condition
    if (mapDef.lastHorseWins && !winner) {
      const aliveHorses = horses.filter(h => !h.eliminated);
      if (aliveHorses.length === 1) {
        const lastHorse = aliveHorses[0];
        console.log('👑👑👑 [GAME] SURVIVOR WIN - NEW VERSION 2025-11-28:', lastHorse.name);
        winner = lastHorse;
        running = false;
        winJingle();
        winnerSpotlightUntil = performance.now() + 2200;
        showFlash('👑 LAST STANDING!');
        logEvent(`Ngựa ${lastHorse.name || ('#'+(lastHorse.i+1))} thắng cuộc bằng cách là ngựa cuối cùng sống sót!`);
        
        // Confetti for last standing winner
        try {
          for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
              for (let k = 0; k < 15; k++) {
                const ang = (Math.PI * 2 * k) / 15 + Math.random() * 0.3;
                const spd = 3 + Math.random() * 4;
                particles.push({
                  x: lastHorse.x, y: lastHorse.y,
                  vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                  life: 60 + Math.random() * 40,
                  color: ['#FFD700', '#FF6B35', '#F7931E', '#FFB74D'][Math.floor(Math.random() * 4)]
                });
              }
            }, burst * 200);
          }
        } catch {}
        
        // Show results overlay for survivor mode
        if (!resultsShown) {
          resultsShown = true;
          console.log('[GAME] Survivor mode - showing results overlay...');
          try {
            showResultsOverlay();
          } catch (err) {
            console.error('[GAME] Error showing results overlay (survivor):', err);
          }
        }
      }
    }
  }
  
  // Apply Fan forces to horses
  try {
    const fans = mapDef.fans || [];
    if (fans.length){
      for (const h of horses){
        if (h.eliminated || h.isPlayerControlled) continue;
        for (const f of fans){
          const fx = h.x - f.x;
          const fy = h.y - f.y;
          const d = Math.hypot(fx, fy);
          const R = Math.max(10, f.r || 120);
          if (d > R || d < 1) continue;
          const dir = Math.atan2(fy, fx);
          let ang = f.angle || 0;
          // Normalize angle diff to [-PI, PI]
          let diff = Math.atan2(Math.sin(dir - ang), Math.cos(dir - ang));
          const spread = Math.max(1e-3, f.spread || (Math.PI/3));
          if (Math.abs(diff) <= spread/2){
            const strength = Math.max(0, Math.min(1, (typeof f.strength === 'number' ? f.strength : 0.08)));
            const falloff = 1 - (d / R);
            const push = strength * falloff;
            // Push along fan angle
            h.vx += Math.cos(ang) * push;
            h.vy += Math.sin(ang) * push;
          }
        }
      }
    }
  } catch {}
  
  // Enforce min cruise and cap max speed for all horses
  for (const h of horses) {
    if (h && !h.eliminated && !h.isPlayerControlled) {
      // Use custom speed if set, otherwise use map editor speed setting
      // Custom speed per horse overrides global speed
      const editorSpeedValue = mapDef.horseSpeed || 1.0; // Global default
      const hasCustomSpeed = (h.baseSpeed && typeof h.baseSpeed === 'number' && h.baseSpeed > 0);
      const targetSpeed = hasCustomSpeed ? h.baseSpeed : editorSpeedValue;
      
      // maxVel should match target speed exactly, minCruise close to target for custom speeds
      const maxVelRaw = (typeof mapDef.maxVel === 'number' && isFinite(mapDef.maxVel)) ? Math.max(mapDef.maxVel, targetSpeed) : targetSpeed;
      const baseFactor = (typeof h.baseSpeedFactor === 'number' && isFinite(h.baseSpeedFactor)) ? h.baseSpeedFactor : 1.0;
      const maxVel = Math.max(0, maxVelRaw * baseFactor);
      // For custom speed horses, always use targetSpeed * 0.95 for minCruise
      // For normal horses, use global minCruise setting or targetSpeed * 0.95 as fallback
      const minCruise = hasCustomSpeed 
        ? (targetSpeed * 0.95) 
        : ((typeof mapDef.minCruise === 'number' && isFinite(mapDef.minCruise)) ? mapDef.minCruise : (targetSpeed * 0.95));
      
      // Debug log ONCE per horse with custom speed - BEFORE minCruise
      if (!h._customSpeedLogged && h.baseSpeed && h.baseSpeed > 1.5) {
        const velBefore = Math.hypot(h.vx || 0, h.vy || 0);
        console.log(`⚡ Horse ${h.i} "${h.name}": customSpeed=${h.baseSpeed.toFixed(2)}, targetSpeed=${targetSpeed.toFixed(2)}, maxVel=${maxVel.toFixed(2)}, minCruise=${minCruise.toFixed(2)}, velBefore=${velBefore.toFixed(2)}`);
        h._customSpeedLogged = true;
      }
      // Per-horse min cruise scales with Boost stacks: +20% per Boost
      const boostStacks = (typeof h.boostStacks === 'number' && isFinite(h.boostStacks)) ? h.boostStacks : 0;
      const minCruiseEff = minCruise * Math.max(0, 1 + 0.2 * boostStacks);
      let vel = Math.hypot(h.vx || 0, h.vy || 0);
      // Determine if horse is currently debuffed (any speed modifier < 1.0)
      const hasDebuff = ((typeof h.mudSpeedModifier === 'number' && h.mudSpeedModifier < 1.0) ||
                         (typeof h.gravityWellSpeedModifier === 'number' && h.gravityWellSpeedModifier < 1.0) ||
                         (typeof h.speedMod === 'number' && h.speedMod < 1.0) ||
                         (h.trapSlowUntil && typeof h.trapSlowMultiplier === 'number' && h.trapSlowMultiplier < 1.0) ||
                         (h.iceFrozenUntil && typeof h.iceSlowMultiplier === 'number' && h.iceSlowMultiplier < 1.0) ||
                         (baseFactor < 1.0));
      // Boost to minimum cruising speed only if not debuffed AND not player controlled
      // BUT: Respect user's low speed settings - don't force speed up if editor speed is low
      const allowMinCruiseBoost = targetSpeed >= 1.0; // Only enforce minCruise for normal/high speeds
      if (gateOpen && minCruiseEff > 0 && vel < minCruiseEff && !hasDebuff && !h.isPlayerControlled && allowMinCruiseBoost) {
        if (vel < 0.001) {
          const ang = Math.random() * Math.PI * 2;
          h.vx = Math.cos(ang) * minCruiseEff;
          h.vy = Math.sin(ang) * minCruiseEff;
        } else {
          const ratioMin = minCruiseEff / Math.max(vel, 1e-6);
          h.vx *= ratioMin;
          h.vy *= ratioMin;
        }
        vel = Math.hypot(h.vx, h.vy);
      }
      
      
      // Cap to max velocity - but allow custom speed horses to exceed default cap
      const editorMaxSpeed = mapDef.maxHorseSpeed || 4.0; // Map editor max speed limit
      // If horse has custom speed, use the higher of editorMaxSpeed or custom speed
      const effectiveMaxVel = (h.baseSpeed && h.baseSpeed > editorMaxSpeed) 
        ? Math.max(maxVel, h.baseSpeed * 1.2)  // Allow 20% over custom speed
        : Math.min(maxVel, editorMaxSpeed);
      
      if (vel > effectiveMaxVel) {
        const ratioMax = effectiveMaxVel / vel;
        h.vx *= ratioMax;
        h.vy *= ratioMax;
      }
      
      // Final velocity check for custom speed horses
      if (!h._finalVelLogged && h.baseSpeed && h.baseSpeed > 1.5) {
        const finalVel = Math.hypot(h.vx || 0, h.vy || 0);
        console.log(`✅ FINAL - Horse ${h.i} "${h.name}": velocity=${finalVel.toFixed(2)}, customSpeed=${h.baseSpeed.toFixed(2)}, effectiveMaxVel=${effectiveMaxVel.toFixed(2)}`);
        h._finalVelLogged = true;
      }
    }
  }
  
  for (const h of horses) h.getDir();
  if (!winner && gateOpen){
    for (const h of horses){
      for (const c of (mapDef.carrots || [])){
        if (c && c.enabled === false) continue;
        const carrotR = (typeof c.r === 'number' && isFinite(c.r)) ? c.r : ((mapDef.carrotRadius || 15));
        if (Math.hypot(h.x - c.x, h.y - c.y) < (h.r + carrotR) * 0.7){
          // Always trigger slow-mo on finish
          try{ logEvent('Ảnh chụp đích!'); }catch{}
          triggerPhotoFinishSlowmo();
          console.log('🏆🏆🏆 [GAME] WINNER DETECTED - NEW VERSION 2025-11-28:', h.name);
          winner=h; running=false; winJingle();
          // Winner spotlight lasts ~2.2s
          try { winnerSpotlightUntil = performance.now() + 2200; } catch {}
          try { showFlash('🏆 WIN!'); } catch {}
          try {
            // Confetti bursts at winner (multi-pulse)
            createConfettiBurst(h.x, h.y);
            setTimeout(()=>createConfettiBurst(h.x+18, h.y-12), 140);
            setTimeout(()=>createConfettiBurst(h.x-20, h.y+14), 300);
          } catch {}
          console.log('[GAME] resultsShown before:', resultsShown);
          if (!resultsShown){ 
            resultsShown = true; 
            console.log('[GAME] Attempting to show results overlay...');
            console.log('[GAME] showResultsOverlay function exists?', typeof showResultsOverlay);
            try{ 
              console.log('[GAME] Calling showResultsOverlay...');
              showResultsOverlay(); 
            } catch(err) {
              console.error('[GAME] Error showing results overlay:', err);
            } 
          } else {
            console.warn('[GAME] Results already shown, skipping');
          }
          break;
        }
      }
      if (winner) break;
    }
  }

  // Power-up effect expiration checks
  const timeNow = performance.now();
  for (const h of horses) {
    // Quantum Dash expiration
    if (h.quantumDashUntil && timeNow > h.quantumDashUntil) {
      h.quantumDashUntil = 0;
      h.quantumDashMultiplier = 1.0;
      h.phaseEnabled = false;
    }
    
    // Turbo expiration (if not already handled)
    if (h.turboUntil && timeNow > h.turboUntil) {
      h.turboUntil = 0;
      h.turboMultiplier = 1.0;
    }
  }

  // DEV MODE: Final override to ensure player control sticks
  try {
    if (window.DevMode && window.DevMode.enabled() && window.DevMode.playerHorse()) {
      const playerHorse = window.DevMode.playerHorse();
      if (playerHorse) {
        playerHorse.isPlayerControlled = true;
      }
    }
  } catch (e) {
    // Dev Mode not available or error
  }
}

// DEV MODE: Expose step function and game variables after they're defined
window.gameStep = step;
window.gameMode = () => mode;
window.gameRunning = () => running;
window.gameGateOpen = () => gateOpen;
window.gamePaused = () => paused;

// ===== Drawing Functions =====
// rebuildCarrotSpriteCaches - MOVED TO: scripts/core/carrot-sprite-manager.js
// drawGlow and glowAlpha - MOVED TO: scripts/utils/drawing-effects.js
// Access via: window.DrawingEffects or window.drawGlow(), window.glowAlpha() for compatibility

function drawMap(){
  const map = mapDef;
  ensureStaticLayer();

  // Rebuild static cache if needed
  if (staticLayerDirty) {
    // Draw static content to the main canvas using existing helpers
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Base track fill (lane) + gentle vertical gradient + subtle noise
    try {
      ctx.save();
      // Base lane
      ctx.fillStyle = LANE;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Gentle vertical gradient to add depth
      const lg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      lg.addColorStop(0, 'rgba(255,255,255,0.06)');
      lg.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Build cached noise pattern once
      if (!trackNoisePattern) {
        trackNoiseCanvas = document.createElement('canvas');
        trackNoiseCanvas.width = 64; trackNoiseCanvas.height = 64;
        const nctx = trackNoiseCanvas.getContext('2d');
        const id = nctx.createImageData(64, 64);
        for (let i=0;i<id.data.length;i+=4){
          const v = 240 + Math.floor(Math.random()*15); // near-white noise
          id.data[i] = v; id.data[i+1] = v; id.data[i+2] = v; id.data[i+3] = 18; // very low alpha
        }
        nctx.putImageData(id, 0, 0);
        trackNoisePattern = ctx.createPattern(trackNoiseCanvas, 'repeat');
      }
      // Overlay noise very subtly
      if (trackNoisePattern) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = trackNoisePattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    } catch {}

    // Weather Background Effects (static layer)
    // MOVED TO: scripts/core/weather.js
    try {
      if (typeof renderWeatherBackground === 'function') {
        renderWeatherBackground(ctx, canvas);
      }
    } catch {}

    // Grid
    const gridStep = parseInt(gridEl.value);
    const allowGridNow = !(hideGridOnPlay === true);
    if(allowGridNow && gridStep > 0) { drawGridCached(ctx, gridStep, canvas.width, canvas.height); }

    // Waiting Room (visible in editor and during countdown; hidden after gate opens)
    if (mode !== 'play' || (mode === 'play' && !gateOpen)){
      ctx.fillStyle=LANE;
      roundRectPath(map.waitingRoom.x,map.waitingRoom.y,map.waitingRoom.w,map.waitingRoom.h,map.waitingRoom.r);
      ctx.fill();
    }

    // Walls & Obstacles (static) with subtle shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    for (const w of mapDef.walls){
      ctx.fillStyle = w.color || WALL;
      const ang = w.angle || 0;
      if (ang){
        const cx = w.x + w.w/2, cy = w.y + w.h/2;
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang);
        roundRectPath(-w.w/2, -w.h/2, w.w, w.h, w.r);
        ctx.fill(); ctx.restore();
      } else {
        roundRectPath(w.x,w.y,w.w,w.h,w.r); ctx.fill();
      }
    }
    for (const p of map.pipes){ ctx.fillStyle = p.color || WALL; drawCapsule(p.x1,p.y1,p.x2,p.y2,p.r); }
    // One-way gates
    for (const g of (mapDef.oneways || [])){
      const ang = g.angle || 0; const {x,y,w,h} = g;
      ctx.save();
      const cx = x + w/2, cy = y + h/2;
      ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(76,175,80,0.35)';
      roundRectPath(-w/2, -h/2, w, h, 8); ctx.fill();
      // Direction chevrons
      ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w*0.25, 0);
      ctx.moveTo(w*0.05, -h*0.18); ctx.lineTo(w*0.22, 0); ctx.lineTo(w*0.05, h*0.18);
      ctx.stroke();
      ctx.restore();
    }
    // Pads
    for (const pd of (mapDef.pads || [])){
      const ang = pd.angle || 0; const {x,y,w,h} = pd;
      ctx.save(); const cx=x+w/2, cy=y+h/2; ctx.translate(cx,cy); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(33,150,243,0.25)';
      roundRectPath(-w/2, -h/2, w, h, 8); ctx.fill();
      // Arrow indicating push
      ctx.strokeStyle = '#2196f3'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-w*0.2, 0); ctx.lineTo(w*0.25, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w*0.1, -h*0.18); ctx.lineTo(w*0.25, 0); ctx.lineTo(w*0.1, h*0.18); ctx.stroke();
      ctx.restore();
    }
    for (const s of map.semis){ ctx.fillStyle = s.color || WALL; drawSemi(s.x,s.y,s.r,s.angle||0); }
    for (const a of map.arcs){ ctx.fillStyle = a.color || WALL; drawArcBand(a.x,a.y,a.r,a.thick,a.angle||0,a.span||Math.PI); }

    // Brushes also benefit from shadow
    drawBrushes();
    ctx.restore();
    

    // Draw Fans (cone visible always; editor-only gizmo for selected fan)
    try {
      ctx.save();
      const arr = mapDef.fans || [];
      for (const f of arr){
        const x = f.x, y = f.y;
        const r = Math.max(10, f.r || 120);
        const ang = f.angle || 0;
        const spread = Math.max(1e-3, f.spread || (Math.PI/3));
        // Cone sector (visible in both play and editor)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r, ang - spread/2, ang + spread/2, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(130, 200, 255, 0.14)';
        ctx.fill();
        // Animated airflow streaks inside cone (visual only)
        try {
          const t = performance.now() / 1000;
          const flowSpeed = (typeof f.flowSpeed === 'number' && isFinite(f.flowSpeed)) ? f.flowSpeed : 140; // px/s
          const lineCount = 10;
          const lineLen = Math.max(12, Math.min(r * 0.25, 28));
          ctx.strokeStyle = 'rgba(120, 180, 255, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          for (let i = 0; i < lineCount; i++){
            // Pseudo-random stable per-line offset within spread
            const h = (Math.sin(i * 12.9898) * 43758.5453);
            const rand = h - Math.floor(h);
            const aOff = (rand - 0.5) * (spread * 0.85); // stay within cone
            const a = ang + aOff;
            // Radial position advances with time to simulate flow
            const phase = (i * (r / lineCount)) + (t * flowSpeed);
            const baseS = (phase % (r * 0.95));
            const s1 = Math.max(6, baseS);
            const s2 = Math.min(r * 0.98, s1 + lineLen);
            // Gentle waviness
            const wob = Math.sin(t * 2.0 + i * 0.7) * Math.max(0.0, 0.02 * r);
            const nx = Math.cos(a + Math.PI/2), ny = Math.sin(a + Math.PI/2);
            const x1 = x + Math.cos(a) * s1 + nx * wob;
            const y1 = y + Math.sin(a) * s1 + ny * wob;
            const x2 = x + Math.cos(a) * s2 + nx * wob;
            const y2 = y + Math.sin(a) * s2 + ny * wob;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        } catch {}
        // Editor-only gizmo for the selected fan: direction line + handle (no outer circle)
        let showEditorGizmo = false;
        try {
          showEditorGizmo = (mode === 'editor') && selected && selected.type === 'fan' && selected === f;
        } catch {}
        if (showEditorGizmo) {
          const rr = r * 0.6;
          const hx = x + Math.cos(ang) * rr;
          const hy = y + Math.sin(ang) * rr;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(hx, hy);
          ctx.strokeStyle = 'rgba(130, 200, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(hx, hy, 6, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
        }
      }
      ctx.restore();
    } catch {}

    // Soft highlight/glow along wall edges for depth separation
    try {
      ctx.save();
      // Light inner edge
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.2;
      for (const w of mapDef.walls){
        const ang = w.angle || 0;
        if (ang){
          const cx = w.x + w.w/2, cy = w.y + w.h/2;
          ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang);
          roundRectPath(-w.w/2, -w.h/2, w.w, w.h, w.r);
          ctx.stroke(); ctx.restore();
        } else {
          roundRectPath(w.x,w.y,w.w,w.h,w.r); ctx.stroke();
        }
      }
      ctx.restore();
    } catch {}

    // Start line (visible in editor and during countdown; hidden after gate opens) — Gate removed visually
    if (mode !== 'play' || (mode === 'play' && !gateOpen)){
      ctx.fillStyle="#fff";
      ctx.fillRect(map.startLine.x,map.startLine.y,map.startLine.w,map.startLine.h);
    }
    // GateBar intentionally not drawn

    // Carrots (static)
    for (const c of map.carrots){
      if (c._img && c._img.complete) {
        const img = c._img;
        const scale = (c.radius * 2) / Math.max(img.width, img.height);
        ctx.drawImage(img, c.x - img.width * scale / 2, c.y - img.height * scale / 2, img.width * scale, img.height * scale);
      } else {
        ctx.fillStyle = c.color || '#ff9800';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // Belts (static visual) with subtle inner stroke + shadow
    ctx.save();
    const prevShadowColor = ctx.shadowColor;
    const prevShadowBlur = ctx.shadowBlur;
    const prevShadowOX = ctx.shadowOffsetX;
    const prevShadowOY = ctx.shadowOffsetY;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    for (const b of (mapDef.belts || [])) {
      const {x,y,w,h} = b;
      const angle = b.angle || 0;
      const cx = x + w/2, cy = y + h/2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(33, 150, 243, 0.20)';
      ctx.strokeStyle = 'rgba(33, 150, 243, 0.9)';
      ctx.lineWidth = 2;
      roundRectPath(-w/2, -h/2, w, h, 8);
      ctx.fill();
      ctx.stroke();
      // subtle inner border glow
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
    // restore belt shadow state
    ctx.shadowColor = prevShadowColor;
    ctx.shadowBlur = prevShadowBlur;
    ctx.shadowOffsetX = prevShadowOX;
    ctx.shadowOffsetY = prevShadowOY;
    ctx.restore();

    // Healing Zones (static)
    try {
      for (const zone of (mapDef.healingzones || [])) {
        ctx.save();
        
        // Draw healing radius in editor mode
        if (mode === 'editor') {
          ctx.strokeStyle = 'rgba(76, 175, 80, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.r || 40, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // Draw main healing core (scale with radius)
        const coreRadius = Math.max(8, (zone.r || 40) * 0.3);
        const ringRadius = Math.max(12, (zone.r || 40) * 0.45);
        
        ctx.fillStyle = '#4CAF50';
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw healing ring
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Icon (show in both editor and play mode)
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💚', zone.x, zone.y);
        
        ctx.restore();
      }
    } catch {}

    // Healing Brushes (static) - now using brush system instead of circles
    try {
      const healingBrushes = (mapDef.brushes || []).filter(b => b.type === 'healingpatch');
      for (const healingBrush of healingBrushes) {
        ctx.save();
        ctx.strokeStyle = '#4CAF50'; // Green healing color
        ctx.lineWidth = (healingBrush.r || 15) * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw healing brush stroke
        if (healingBrush.points && healingBrush.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(healingBrush.points[0].x, healingBrush.points[0].y);
          for (let i = 1; i < healingBrush.points.length; i++) {
            ctx.lineTo(healingBrush.points[i].x, healingBrush.points[i].y);
          }
          ctx.stroke();
          
          // Add lighter inner stroke for glow effect
          ctx.strokeStyle = '#81C784';
          ctx.lineWidth = (healingBrush.r || 15) * 1.2;
          ctx.stroke();
        }
        
        ctx.restore();
      }
    } catch {}

    // Mud Brushes (static) - now using brush system instead of circles
    try {
      const mudBrushes = (mapDef.brushes || []).filter(b => b.type === 'mud');
      for (const mudBrush of mudBrushes) {
        ctx.save();
        ctx.strokeStyle = '#8B4513'; // Brown mud color
        ctx.lineWidth = (mudBrush.r || 10) * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw mud brush stroke
        if (mudBrush.points && mudBrush.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(mudBrush.points[0].x, mudBrush.points[0].y);
          for (let i = 1; i < mudBrush.points.length; i++) {
            ctx.lineTo(mudBrush.points[i].x, mudBrush.points[i].y);
          }
          ctx.stroke();
          
          // Add darker inner stroke for depth
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = (mudBrush.r || 10) * 1.2;
          ctx.stroke();
        }
        
        // Add mud icons in editor mode for visibility
        if (mode === 'editor' && mudBrush.points) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px system-ui,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Place icons along the brush stroke
          for (let i = 0; i < mudBrush.points.length; i += Math.max(1, Math.floor(mudBrush.points.length / 5))) {
            const pt = mudBrush.points[i];
            ctx.fillText('🟤', pt.x, pt.y);
          }
        }
        
        ctx.restore();
      }
    } catch {}

    // Bumpers (static core only; glow drawn per-frame after blit)
    try {
      for (const b of (mapDef.bumpers || [])){
        const r = Math.max(6, b.r || 22);
        const core = b.color || '#7cf1ff';
        // Core filled circle with inner stroke
        ctx.save();
        ctx.fillStyle = core;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        // Inner ring highlight
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.arc(b.x, b.y, Math.max(2, r*0.55), 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
    } catch {}

    // Ambient gradient + vignette (subtle, static for performance)
    try {
      ctx.save();
      // Ambient vertical gradient
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const __ambientAlpha = (window.ambientAlpha ?? 0.02);
      const aTop = Math.max(0, Math.min(1, __ambientAlpha * 2.5));
      const aBot = Math.max(0, Math.min(1, __ambientAlpha));
      g.addColorStop(0, `rgba(0,0,0,${aTop.toFixed(3)})`);
      g.addColorStop(0.5, 'rgba(0,0,0,0.0)');
      g.addColorStop(1, `rgba(0,0,0,${aBot.toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vignette
      const cx = canvas.width/2, cy = canvas.height/2;
      const maxR = Math.hypot(cx, cy);
      const rg = ctx.createRadialGradient(cx, cy, maxR*0.55, cx, cy, maxR);
      rg.addColorStop(0, 'rgba(0,0,0,0.0)');
      const vA = (window.enableVignette === false) ? 0 : (window.vignetteAlpha ?? 0.03);
      rg.addColorStop(1, `rgba(0,0,0,${(+vA).toFixed(3)})`);
      ctx.fillStyle = rg;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } catch {}

    // Copy static to offscreen cache
    staticLayerCtx.clearRect(0,0,staticLayerCanvas.width, staticLayerCanvas.height);
    staticLayerCtx.drawImage(canvas, 0, 0);
    staticLayerDirty = false;
  } else {
    // Ensure main is cleared when using cached layer
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  // Blit cached static layer to main canvas
  ctx.drawImage(staticLayerCanvas, 0, 0);

  // Weather Dynamic Effects (particles, animations)
  // MOVED TO: scripts/core/weather.js
  try {
    if (typeof renderWeatherDynamic === 'function') {
      renderWeatherDynamic(ctx, canvas);
    }
  } catch {}

// Firetraps (dynamic - must be drawn every frame)
try {
  for (const item of (mapDef.firetrap || [])) {
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r || 12, 0, Math.PI * 2);
    ctx.fill();
    
    if (mode === 'editor') {
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', item.x, item.y);
    }
  }
} catch {}

// Fireauras (dynamic - must be drawn every frame)
try {
  for (const item of (mapDef.fireaura || [])) {
    ctx.fillStyle = '#FF4400';
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r || 12, 0, Math.PI * 2);
    ctx.fill();
    
    if (mode === 'editor') {
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', item.x, item.y);
    }
  }
} catch {}

  // Blit cached static layer to main canvas
  ctx.drawImage(staticLayerCanvas, 0, 0);
  
  // Rotating Barriers (dynamic - must be drawn every frame for animation)
  try {
    for (const barrier of (mapDef.rotatingBarriers || [])) {
      const x = barrier.x, y = barrier.y;
      const length = barrier.length, width = barrier.width;
      const angle = barrier.angle || 0;
      const color = barrier.color || '#FF6B35';
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Simple clean barrier rectangle
      ctx.fillStyle = color;
      ctx.fillRect(-length/2, -width/2, length, width);
      
      
      // Editor mode: show pendulum icon
      if (mode === 'editor') {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚖️', 0, 0);
      }
      
      ctx.restore();
    }
  } catch {}

  // Power-up rendering - MOVED TO: scripts/rendering/powerup-rendering.js
  try { if (window.PowerupRendering) window.PowerupRendering.drawMagneticPulls(ctx, mode); } catch {}
  try { if (window.PowerupRendering) window.PowerupRendering.drawFireAuras(ctx); } catch {}
  try { if (window.PowerupRendering) window.PowerupRendering.drawFireTraps(ctx, mode); } catch {}
  try { if (window.PowerupRendering) window.PowerupRendering.drawFireAuraEffects(ctx, horses); } catch {}
  try { if (window.PowerupRendering) window.PowerupRendering.drawPowerupTimers(ctx, horses); } catch {}
  try { if (window.PowerupRendering) window.PowerupRendering.drawMagneticPushs(ctx, mode); } catch {}

  // Spinners (dynamic - must be drawn every frame for rotation animation)
  try {
    // Fix spinner duplicate visual bug - check for mode changes
    checkModeChange();
    
    // ENHANCED FIX: Render ONLY live spinners in play mode, both in editor mode
    let spinnersToRender = [];
    if (mode === 'play' || mode === 'race') {
      // Play mode: ONLY render live spinners (the real rotating ones), ignore static mapDef.spinners
      // Additional safeguard: filter out any static spinners that might slip through
      spinnersToRender = (liveSpinners || []).filter(s => !s._isStatic);
      // Debug log (only occasionally to avoid spam)
      if (performance.now() % 3000 < 100) {
        console.log('🔄 Play mode spinner fix active:', spinnersToRender.length, 'live spinners,', (mapDef.spinners || []).length, 'static ignored');
      }
    } else {
      // Editor mode: render both mapDef and live for editing
      spinnersToRender = [ ...(mapDef.spinners || []), ...((Array.isArray(liveSpinners) ? liveSpinners : [])) ];
    }
    
    for (const s of spinnersToRender) {
      const x = s.x, y = s.y;
      const w = s.w || 80, h = s.h || 20;
      const angle = s.angle || 0;
      const baseColor = s.color || '#9E9E9E';
      const time = performance.now() * 0.001;
      const speed = s.speed || 1;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Enhanced Spinner Design
      const cornerRadius = Math.min(w, h) * 0.15;
      
      // Drop shadow for depth
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.roundRect(-w/2 + 2, -h/2 + 2, w, h, cornerRadius);
      ctx.fill();
      ctx.restore();
      
      // Simple solid color body
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, cornerRadius);
      ctx.fill();
      
      // No animated effects - keep it simple and clean
      
      // Glossy top highlight
      const topGrad = ctx.createLinearGradient(0, -h/2, 0, 0);
      topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      topGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h/2, [cornerRadius, cornerRadius, 0, 0]);
      ctx.fill();
      
      // Subtle inner border glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, cornerRadius);
      ctx.stroke();
      
      // Editor mode: enhanced rotation indicator
      if (mode === 'editor') {
        // Rotation direction arrows
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const arrowSize = Math.min(w, h) * 0.3;
        const arrowY = h * 0.15;
        
        // Left arrow
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowY);
        ctx.lineTo(-arrowSize/2, -arrowY - arrowSize/3);
        ctx.moveTo(-arrowSize, -arrowY);
        ctx.lineTo(-arrowSize/2, -arrowY + arrowSize/3);
        ctx.stroke();
        
        // Right arrow  
        ctx.beginPath();
        ctx.moveTo(arrowSize, arrowY);
        ctx.lineTo(arrowSize/2, arrowY - arrowSize/3);
        ctx.moveTo(arrowSize, arrowY);
        ctx.lineTo(arrowSize/2, arrowY + arrowSize/3);
        ctx.stroke();
        
        // Center rotation symbol
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⟲', 0, 0);
      }
      
      ctx.restore();
    }
  } catch {}

  // Per-frame dynamic glow for bumpers disabled
  try { /* glow disabled */ } catch {}
  // Editor overlays (not cached): selection/handles
  try{
    if (mode === 'editor'){
      // Bumper selection highlight and handle
      if (selected && selected.type === 'bumper'){
        const b = selected;
        const r = Math.max(6, b.r || 22);
        ctx.save();
        // Outer selection ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6,4]);
        ctx.arc(b.x, b.y, r + 6, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Resize handle at east
        const hx = b.x + r;
        const hy = b.y;
        const hs = 7;
        ctx.beginPath();
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.rect(hx - hs, hy - hs, hs*2, hs*2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
    if (mode === 'editor' && map.waitingRoom){
      const rm = map.waitingRoom;
      ctx.save();
      // Corner handle
      const s = 10; // size
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(rm.x + rm.w - s/2, rm.y + rm.h - s/2, s, s);
      ctx.fill();
      ctx.stroke();
      // Edge hints (subtle)
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(rm.x + rm.w, rm.y + 8);
      ctx.lineTo(rm.x + rm.w, rm.y + rm.h - 8);
      ctx.moveTo(rm.x + 8, rm.y + rm.h);
      ctx.lineTo(rm.x + rm.w - 8, rm.y + rm.h);
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();
    }
  }catch{}
}

// ===== Visual Effects =====
// MOVED TO: scripts/core/visual-effects.js
// Access via: window.VisualEffects or window.createExplosion(), etc. for compatibility

function render(){
  const usePhoto = !!(photoFinishActive && window.photoFinishStartTs);
  // Screen shake offset
  let shakeX = 0, shakeY = 0;
  if (performance.now() < shakeUntil && shakeMag > 0){
    shakeX = (Math.random()*2-1) * shakeMag;
    shakeY = (Math.random()*2-1) * shakeMag;
  }
  const needTransform = usePhoto || (shakeX || shakeY);
  // FX Settings panel: removed; ensure it's not present
  try {
    const fp = document.getElementById('fx-panel');
    if (fp) fp.remove();
    window.__fxPanelInit = false;
    // Editor-integrated controls: create once inside rightbar editor
    if (!window.__fxEditorInit) {
      const editorBar = document.getElementById('editorBar');
      const content = editorBar?.querySelector('.editor-content');
      if (content) {
        const fxSection = document.createElement('div');
        fxSection.className = 'section';
        fxSection.id = 'effects-editor-section';
        fxSection.innerHTML = `
          <div class="section-title">✨ Effects</div>
          <div class="form-row" style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;align-items:center;">
            <label for="edVignetteToggle">Vignette</label>
            <div><input id="edVignetteToggle" type="checkbox" /></div>
            <label for="edVignetteRange">Vignette Intensity</label>
            <div><input id="edVignetteRange" type="range" min="0" max="0.12" step="0.005" style="width:100%" /><span id="edVignetteVal" style="margin-left:8px;color:#fff"></span></div>
            <label for="edAmbientRange">Ambient Intensity</label>
            <div><input id="edAmbientRange" type="range" min="0" max="0.08" step="0.005" style="width:100%" /><span id="edAmbientVal" style="margin-left:8px;color:#fff"></span></div>
            <label for="edSpinTrailMs">Spinner Trail (ms)</label>
            <div><input id="edSpinTrailMs" type="range" min="60" max="600" step="20" style="width:100%" /><span id="edSpinTrailMsVal" style="margin-left:8px;color:#fff"></span></div>
            <label for="edSpinTrailSamples">Trail Samples</label>
            <div><input id="edSpinTrailSamples" type="range" min="3" max="16" step="1" style="width:100%" /><span id="edSpinTrailSamplesVal" style="margin-left:8px;color:#fff"></span></div>
            <label for="edSpinFlashMs">Spinner Flash (ms)</label>
            <div><input id="edSpinFlashMs" type="range" min="60" max="400" step="10" style="width:100%" /><span id="edSpinFlashMsVal" style="margin-left:8px;color:#fff"></span></div>
          </div>
        `;
        content.appendChild(fxSection);
        const elT = fxSection.querySelector('#edVignetteToggle');
        const elVR = fxSection.querySelector('#edVignetteRange');
        const elAR = fxSection.querySelector('#edAmbientRange');
        const elVV = fxSection.querySelector('#edVignetteVal');
        const elAV = fxSection.querySelector('#edAmbientVal');
        const elSTM = fxSection.querySelector('#edSpinTrailMs');
        const elSTMV = fxSection.querySelector('#edSpinTrailMsVal');
        const elSTS = fxSection.querySelector('#edSpinTrailSamples');
        const elSTSV = fxSection.querySelector('#edSpinTrailSamplesVal');
        const elSFM = fxSection.querySelector('#edSpinFlashMs');
        const elSFMV = fxSection.querySelector('#edSpinFlashMsVal');
        const sync = ()=>{
          elT.checked = !!window.enableVignette;
          elVR.value = String(window.vignetteAlpha ?? 0.03);
          elAR.value = String(window.ambientAlpha ?? 0.02);
          elVV.textContent = (+(window.vignetteAlpha ?? 0.03)).toFixed(3);
          elAV.textContent = (+(window.ambientAlpha ?? 0.02)).toFixed(3);
          // defaults
          if (window.spinnerTrailMs == null) window.spinnerTrailMs = 200;
          if (window.spinnerTrailSamples == null) window.spinnerTrailSamples = 8;
          if (window.spinnerFlashMs == null) window.spinnerFlashMs = 120;
          elSTM.value = String(window.spinnerTrailMs);
          elSTMV.textContent = `${window.spinnerTrailMs}ms`;
          elSTS.value = String(window.spinnerTrailSamples);
          elSTSV.textContent = `${window.spinnerTrailSamples}`;
          elSFM.value = String(window.spinnerFlashMs);
          elSFMV.textContent = `${window.spinnerFlashMs}ms`;
          // keep floating panel in sync if it exists
          const fp = document.getElementById('fx-panel');
          if (fp){
            const t = fp.querySelector('#fxVignetteToggle');
            const vr = fp.querySelector('#fxVignetteRange');
            const ar = fp.querySelector('#fxAmbientRange');
            const vv = fp.querySelector('#fxVignetteVal');
            const av = fp.querySelector('#fxAmbientVal');
            if (t) t.checked = !!window.enableVignette;
            if (vr) vr.value = String(window.vignetteAlpha);
            if (ar) ar.value = String(window.ambientAlpha);
            if (vv) vv.textContent = (+(window.vignetteAlpha)).toFixed(3);
            if (av) av.textContent = (+(window.ambientAlpha)).toFixed(3);
          }
        };
        const repaint = ()=>{ 
          try { 
            invalidateStaticLayer(); 
            drawMap(); 
            // Force immediate redraw of full frame
            render();
            // Ensure loop is active for subsequent frames if needed
            startMainLoop();
          } catch {}
        };
        elT.addEventListener('change', ()=>{ window.enableVignette = !!elT.checked; try{ invalidateStaticLayer(); }catch{} sync(); repaint(); });
        elVR.addEventListener('input', ()=>{ window.vignetteAlpha = Math.max(0, Math.min(0.5, +elVR.value)); try{ invalidateStaticLayer(); }catch{} sync(); repaint(); });
        elAR.addEventListener('input', ()=>{ window.ambientAlpha = Math.max(0, Math.min(0.3, +elAR.value)); try{ invalidateStaticLayer(); }catch{} sync(); repaint(); });
        elSTM.addEventListener('input', ()=>{ window.spinnerTrailMs = Math.max(60, Math.min(600, +elSTM.value)); sync(); repaint(); });
        elSTS.addEventListener('input', ()=>{ window.spinnerTrailSamples = Math.max(3, Math.min(16, +elSTS.value)); sync(); repaint(); });
        elSFM.addEventListener('input', ()=>{ window.spinnerFlashMs = Math.max(60, Math.min(400, +elSFM.value)); sync(); repaint(); });
        sync();
        window.__fxEditorInit = true;
      }
    }
  } catch {}
  if (needTransform){
    ctx.save();
    // Apply shake first (screen-space)
    if (shakeX || shakeY) ctx.translate(shakeX, shakeY);
    // Then apply photo-finish zoom centered
    if (usePhoto){
      const w = canvas.width, h = canvas.height;
      const t = Math.min(1, (performance.now() - window.photoFinishStartTs) / 1500);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const scale = 1 + 0.04 * (1 - ease); // start 1.04 -> 1.0
      ctx.translate(w/2, h/2);
      ctx.scale(scale, scale);
      ctx.translate(-w/2, -h/2);
    }
  }

  // Draw cached static map background
  drawMap();

  // Editor preview sync: phản chiếu mapDef.* sang live* để mọi renderer thấy ngay
  try {
    if (mode === 'editor' && mapDef) {
      liveBoosts = Array.isArray(mapDef.boosts) ? mapDef.boosts : [];
      liveTurbos = Array.isArray(mapDef.turbos) ? mapDef.turbos : [];
      liveTeleports = Array.isArray(mapDef.teleports) ? mapDef.teleports : [];
      liveMagnets = Array.isArray(mapDef.magnets) ? mapDef.magnets : [];
      liveTimeFreezes = Array.isArray(mapDef.timeFreezes) ? mapDef.timeFreezes : [];
      livePoisons = Array.isArray(mapDef.poisons) ? mapDef.poisons : [];
      liveGhosts = Array.isArray(mapDef.ghosts) ? mapDef.ghosts : [];
      liveTraps = Array.isArray(mapDef.traps) ? mapDef.traps : [];
      liveRams = Array.isArray(mapDef.rams) ? mapDef.rams : [];
      liveShields = Array.isArray(mapDef.shields) ? mapDef.shields : [];
      liveSpinners = Array.isArray(mapDef.spinners) ? mapDef.spinners : [];
      liveLightnings = Array.isArray(mapDef.lightnings) ? mapDef.lightnings : [];
      liveTornados = Array.isArray(mapDef.tornados) ? mapDef.tornados : [];
      liveVolcanos = Array.isArray(mapDef.volcanos) ? mapDef.volcanos : [];
      
      // Update window references for RenderModule access
      updateWindowLiveReferences();
    }
  } catch {}

  // Slipstream wake processor: expire wakes and grant draft bonus on contact
  try {
    const nowTs = performance.now();
    const wakes = (Array.isArray(window.liveSlipstreams) ? window.liveSlipstreams : []);
    if (wakes.length) {
      // remove expired
      for (let i = wakes.length - 1; i >= 0; i--) {
        if (nowTs > (wakes[i].until || 0)) wakes.splice(i, 1);
      }
      // grant draft on contact
      for (const wake of wakes) {
        for (const h of horses) {
          if (!h || h.eliminated) continue;
          if (wake.owner != null && h.i === wake.owner) continue;
          const dx = h.x - wake.x, dy = h.y - wake.y;
          const rr = (wake.r || 28) + (h.r || 8);
          if ((dx*dx + dy*dy) <= rr * rr) {
            if (!h.draftUntil || nowTs > h.draftUntil) {
              h.draftMultiplier = (wake.ownerDraftBonus || 1.25);
              h.draftUntil = nowTs + 2000;
              try { floatingTexts.push({ x: h.x, y: h.y - (h.r||8) - 6, t: nowTs, life: 800, text: 'Draft +25%', color: '#80deea' }); } catch {}
            }
          }
        }
      }
    }
  } catch {}

  // Early path: nếu có hàm tổng hợp, vẽ toàn bộ khung hình rồi thoát sớm
  try {
    if (window.RenderModule && typeof RenderModule.drawFrame === 'function') {
      // Set spinner override flags to prevent static spinners in play mode
      if (mode === 'play' || mode === 'race') {
        window._skipStaticSpinners = true;
        window._forceOnlyLiveSpinners = true;
        window._hideStaticSpinners = true;
      } else {
        window._skipStaticSpinners = false;
        window._forceOnlyLiveSpinners = false;
        window._hideStaticSpinners = false;
      }
      
      // RE-ENABLED with power-up fix
      RenderModule.drawFrame(ctx, canvas);
      // Bảo hiểm hiển thị vật phẩm: vẽ lại nhóm dynamic items nếu cần
      try {
        if (typeof RenderModule.drawDynamicItems === 'function') {
          // In play mode, ensure live arrays are populated from mapDef if empty
          if (mode === 'play' || mode === 'race') {
            if (!liveBoosts.length && mapDef.boosts?.length) liveBoosts.push(...mapDef.boosts);
            if (!liveTurbos.length && mapDef.turbos?.length) liveTurbos.push(...mapDef.turbos);
            if (!liveTeleports.length && mapDef.teleports?.length) liveTeleports.push(...mapDef.teleports);
            if (!liveMagnets.length && mapDef.magnets?.length) liveMagnets.push(...mapDef.magnets);
            if (!liveTimeFreezes.length && mapDef.timeFreezes?.length) liveTimeFreezes.push(...mapDef.timeFreezes);
            if (!livePoisons.length && mapDef.poisons?.length) livePoisons.push(...mapDef.poisons);
            if (!liveGhosts.length && mapDef.ghosts?.length) liveGhosts.push(...mapDef.ghosts);
            if (!liveTraps.length && mapDef.traps?.length) liveTraps.push(...mapDef.traps);
            if (!liveRams.length && mapDef.rams?.length) liveRams.push(...mapDef.rams);
            if (!liveShields.length && mapDef.shields?.length) liveShields.push(...mapDef.shields);
            if (!liveWarpzones.length && mapDef.warpzones?.length) liveWarpzones.push(...mapDef.warpzones);
            if (!liveQuantumdashs.length && mapDef.quantumdashs?.length) liveQuantumdashs.push(...mapDef.quantumdashs);
          }
          
          RenderModule.drawDynamicItems(
            ctx,
            (window.App && App.state && App.state.mode) ?? mode,
            (window.App && App.state && App.state.mapDef) ?? mapDef,
            {
              liveBoosts: liveBoosts, // Simplified - use direct reference
              liveTurbos: (window.App && App.state && App.state.liveTurbos) ?? liveTurbos,
              liveTeleports: (window.App && App.state && App.state.liveTeleports) ?? liveTeleports,
              liveMagnets: (window.App && App.state && App.state.liveMagnets) ?? liveMagnets,
              liveTimeFreezes: (window.App && App.state && App.state.liveTimeFreezes) ?? liveTimeFreezes,
              livePoisons: (window.App && App.state && App.state.livePoisons) ?? livePoisons,
              liveGhosts: (window.App && App.state && App.state.liveGhosts) ?? liveGhosts,
              liveTraps: (window.App && App.state && App.state.liveTraps) ?? liveTraps,
              liveRams: (window.App && App.state && App.state.liveRams) ?? liveRams,
              liveShields: liveShields, // Simplified - use direct reference
              liveWarpzones: (window.App && App.state && App.state.liveWarpzones) ?? liveWarpzones,
              liveQuantumdashs: (window.App && App.state && App.state.liveQuantumdashs) ?? liveQuantumdashs,
              liveNebulas: (window.App && App.state && App.state.liveNebulas) ?? liveNebulas,
              // Dynamic hazards
              liveMeteors: (window.App && App.state && App.state.liveMeteors) ?? liveMeteors,
              // Dynamic hazards
              liveTornados: (window.App && App.state && App.state.liveTornados) ?? liveTornados,
              liveVolcanos: (window.App && App.state && App.state.liveVolcanos) ?? liveVolcanos,
              drawGlow, glowAlpha
            }
          );
        }
      } catch {}
      // Note: Continue execution to ensure horses and other critical elements are rendered
    }
  } catch {}

  // Inline fallback for shields - ensure shields are always rendered
  try {
    const shieldsToDraw = (mode === 'play' || mode === 'race')
      ? [ ...(mapDef?.shields || []), ...(liveShields || []) ]
      : [ ...(mapDef?.shields || []), ...(liveShields || []) ];
    
    if (window.RenderModule && typeof RenderModule.drawShields === 'function') {
      // Use RenderModule if available
      RenderModule.drawShields(ctx, mode, liveShields, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering for shields
      for (const s of shieldsToDraw) {
        if (!s) continue;
        
        // Basic shield rendering
        ctx.save();
        
        // Shield body
        ctx.fillStyle = '#03A9F4';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r || 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Shield outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shield icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', s.x, s.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering shields:', error);
  }

  // === LUCK POWER-UP INLINE RENDERING (play mode) ===
  // Force re-render all live arrays to ensure luck-spawned items appear
  if (mode === 'play' || mode === 'race') {
    try {
      if (window.RenderModule) {
        const dg = RenderModule.drawGlow || drawGlow || function(){};
        const ga = RenderModule.glowAlpha || glowAlpha || function(){return 1;};
        // Re-call individual draw functions to ensure luck items are rendered
        if (typeof RenderModule.drawBoosts === 'function') RenderModule.drawBoosts(ctx, mode, window.liveBoosts || liveBoosts, mapDef, dg, ga);
        if (typeof RenderModule.drawGhosts === 'function') RenderModule.drawGhosts(ctx, mode, window.liveGhosts || liveGhosts, mapDef, dg, ga);
        if (typeof RenderModule.drawTraps === 'function') RenderModule.drawTraps(ctx, mode, window.liveTraps || liveTraps, mapDef, dg, ga);
        if (typeof RenderModule.drawShields === 'function') RenderModule.drawShields(ctx, mode, window.liveShields || liveShields, mapDef, dg, ga);
        if (typeof RenderModule.drawRams === 'function') RenderModule.drawRams(ctx, mode, window.liveRams || liveRams, mapDef, dg, ga);
        if (typeof RenderModule.drawTurbos === 'function') RenderModule.drawTurbos(ctx, mode, window.liveTurbos || liveTurbos, mapDef, dg, ga);
        if (typeof RenderModule.drawTeleports === 'function') RenderModule.drawTeleports(ctx, mode, window.liveTeleports || liveTeleports, mapDef, dg, ga);
        if (typeof RenderModule.drawMagnets === 'function') RenderModule.drawMagnets(ctx, mode, window.liveMagnets || liveMagnets, mapDef, dg, ga);
        if (typeof RenderModule.drawTimeFreezes === 'function') RenderModule.drawTimeFreezes(ctx, mode, window.liveTimeFreezes || liveTimeFreezes, mapDef, dg, ga);
        if (typeof RenderModule.drawPoisons === 'function') RenderModule.drawPoisons(ctx, mode, window.livePoisons || livePoisons, mapDef, dg, ga);
      }
    } catch (e) { /* ignore */ }
  }

  // Fallback for nebulas - ensure nebulas are always rendered
  try {
    const nebulasToDraw = (mode === 'play' || mode === 'race')
      ? (mapDef?.nebulas || [])
      : (mapDef?.nebulas || []);
    
    if (window.RenderModule && typeof RenderModule.drawNebulas === 'function') {
      // Use RenderModule if available
      RenderModule.drawNebulas(ctx, mode, liveNebulas, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering for nebulas
      for (const n of nebulasToDraw) {
        if (!n) continue;
        
        // Skip consumed nebulas in play mode
        if ((mode === 'play' || mode === 'race') && n.consumed) {
          continue;
        }
        
        // Basic nebula rendering
        ctx.save();
        
        // Nebula glow
        if (drawGlow) {
          drawGlow(ctx, n.x, n.y, (n.r || 16) * 2, '#4A0E4E', 0.3);
        }
        
        // Nebula body
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r || 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Nebula outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Nebula icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔹', n.x, n.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering nebulas:', error);
  }

  // Fallback for warpzones - ensure warpzones are always rendered
  try {
    const warpzonesToDraw = (mode === 'play' || mode === 'race')
      ? [ ...(mapDef?.warpzones || []), ...(liveWarpzones || []) ]
      : [ ...(mapDef?.warpzones || []), ...(liveWarpzones || []) ];
    
    if (window.RenderModule && typeof RenderModule.drawWarpzones === 'function') {
      // Use RenderModule if available
      RenderModule.drawWarpzones(ctx, mode, liveWarpzones, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering
      for (const item of warpzonesToDraw) {
        if (!item) continue;
        
        // Basic warpzone rendering
        ctx.save();
        
        // Body
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r || 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌌', item.x, item.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering warpzones:', error);
  }

  // Fallback for quantumdashs - ensure quantumdashs are always rendered
  try {
    const quantumdashsToDraw = (mode === 'play' || mode === 'race')
      ? [ ...(mapDef?.quantumdashs || []), ...(liveQuantumdashs || []) ]
      : [ ...(mapDef?.quantumdashs || []), ...(liveQuantumdashs || []) ];
    
    if (window.RenderModule && typeof RenderModule.drawQuantumdashs === 'function') {
      // Use RenderModule if available
      RenderModule.drawQuantumdashs(ctx, mode, liveQuantumdashs, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering
      for (const item of quantumdashsToDraw) {
        if (!item) continue;
        
        // Basic quantumdash rendering
        ctx.save();
        
        // Body
        ctx.fillStyle = '#00BCD4';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r || 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔮', item.x, item.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering quantumdashs:', error);
  }

  // [PU-BEGIN name=yellowheart section=rendering]
  // Yellowheart power-ups rendering
  try {
    const yellowheartsToDraw = (mode === 'play' || mode === 'race')
      ? (mapDef?.yellowhearts || [])
      : (mapDef?.yellowhearts || []);
    
    const currentTime = performance.now();
    
    for (const item of yellowheartsToDraw) {
      if (!item) continue;
      
      // Skip consumed items in play mode
      if ((mode === 'play' || mode === 'race') && item.consumed) {
        continue;
      }
      
      // Animation
      const pulse = Math.sin(currentTime * 0.005) * 0.3 + 0.7;
      const animatedRadius = (item.r || 18) * (1 + pulse * 0.15);
      
      ctx.save();
      
      // Glow effect
      try {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15 * pulse;
      } catch {}
      
      // Main body gradient
      const gradient = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, animatedRadius);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, '#FFD700AA');
      gradient.addColorStop(1, '#FFD700');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(item.x, item.y, animatedRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Icon (always visible)
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💛', item.x, item.y);
      
      ctx.restore();
    }
  } catch (error) {
    console.error('Error rendering yellowhearts:', error);
  }
  // [PU-END name=yellowheart section=rendering]

  // Fallback for tornados - ensure tornados are always rendered
  try {
    const tornadosToDraw = (mode === 'play' || mode === 'race')
      ? (liveTornados || [])
      : [ ...(mapDef?.tornados || []), ...((Array.isArray(liveTornados) ? liveTornados : [])) ];
    
    if (window.RenderModule && typeof RenderModule.drawTornados === 'function') {
      // Use RenderModule if available
      RenderModule.drawTornados(ctx, mode, liveTornados, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering for tornados
      for (const tornado of tornadosToDraw) {
        if (!tornado) continue;
        
        // Skip consumed items in play mode
        if ((mode === 'play' || mode === 'race') && tornado.consumed) {
          continue;
        }
        
        // Basic tornado rendering
        ctx.save();
        
        // Tornado body
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(tornado.x, tornado.y, tornado.r || 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Tornado outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Tornado icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌪️', tornado.x, tornado.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering tornados:', error);
  }

  // Fallback for volcanos - ensure volcanos are always rendered
  try {
    const volcanosToDraw = (mode === 'play' || mode === 'race')
      ? (liveVolcanos || [])
      : [ ...(mapDef?.volcanos || []), ...((Array.isArray(liveVolcanos) ? liveVolcanos : [])) ];
    
    if (window.RenderModule && typeof RenderModule.drawVolcanos === 'function') {
      // Use RenderModule if available
      RenderModule.drawVolcanos(ctx, mode, liveVolcanos, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering for volcanos
      for (const volcano of volcanosToDraw) {
        if (!volcano) continue;
        
        // Skip consumed items in play mode
        if ((mode === 'play' || mode === 'race') && volcano.consumed) {
          continue;
        }
        
        // Basic volcano rendering
        ctx.save();
        
        // Volcano body
        ctx.fillStyle = 'rgba(255,69,0,0.8)';
        ctx.beginPath();
        ctx.arc(volcano.x, volcano.y, volcano.r || 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Volcano outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Volcano icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌋', volcano.x, volcano.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering volcanos:', error);
  }

  // Fallback for rams - ensure rams are always rendered
  try {
    const ramsToDraw = (mode === 'play' || mode === 'race')
      ? (liveRams || [])
      : [ ...(mapDef?.rams || []), ...((Array.isArray(liveRams) ? liveRams : [])) ];
    
    if (window.RenderModule && typeof RenderModule.drawRams === 'function') {
      // Use RenderModule if available
      RenderModule.drawRams(ctx, mode, liveRams, mapDef, drawGlow, glowAlpha);
    } else {
      // Fallback inline rendering for rams
      for (const ram of ramsToDraw) {
        if (!ram) continue;
        
        // Skip consumed items in play mode
        if ((mode === 'play' || mode === 'race') && ram.consumed) {
          continue;
        }
        
        // Basic ram rendering
        ctx.save();
        
        // Ram body
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(ram.x, ram.y, ram.r || 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Ram outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ram icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', ram.x, ram.y);
        
        ctx.restore();
      }
    }
  } catch (error) {
    console.error('Error rendering rams:', error);
  }

  /*
   * ĐÃ RÚT GỌN: Các khối vẽ inline phía dưới đã được thay bằng RenderModule.drawFrame(...)
   * với inline fallback ở trên. Để giảm size và tránh trùng lặp, toàn bộ khối cũ đã được loại bỏ.
   * Nếu cần xem lại logic gốc, hãy mở lịch sử commit trước đó.
   */

  // Enhanced Visual Effect Functions
  if (screenShakeX !== 0 || screenShakeY !== 0) {
    ctx.restore();
    // Decay screen shake
    screenShakeX *= 0.85;
    screenShakeY *= 0.85;
  }
  
  // Enhanced particle system with multiple types
  try {
    // Particles rendering - MOVED TO: scripts/core/visual-effects.js
    if (window.RenderModule && typeof RenderModule.drawParticles === 'function') {
      RenderModule.drawParticles(ctx, (window.App && App.state && App.state.particles) ?? particles);
    } else if (typeof renderParticles === 'function') {
      renderParticles(ctx, particles);
    }
  } catch {}
  
  // Draw lightning effects
  try {
    if (window.RenderModule && typeof RenderModule.drawLightningEffects === 'function') {
      RenderModule.drawLightningEffects(ctx);
    } else {
      drawLightningEffects(ctx);
    }
  } catch { try { drawLightningEffects(ctx); } catch {} }
  
  // Restore screen shake
  if (screenShakeX !== 0 || screenShakeY !== 0) {
    ctx.restore();
    // Decay screen shake
    screenShakeX *= 0.85;
    screenShakeY *= 0.85;
    if (Math.abs(screenShakeX) < 0.1) screenShakeX = 0;
    if (Math.abs(screenShakeY) < 0.1) screenShakeY = 0;
  }

// Enhanced Visual Effect Functions
function drawBackgroundEffects(ctx, canvas) {
  const now = performance.now();
  
  // Animated background particles (floating dust/sparkles)
  if (backgroundParticles.length < 50) {
    if (Math.random() < 0.3) {
      backgroundParticles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.3,
        life: 300 + Math.random() * 200,
        size: 1 + Math.random() * 2,
        color: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }
  
  // Update and draw background particles
  for (let i = backgroundParticles.length - 1; i >= 0; i--) {
    const p = backgroundParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.twinkle += 0.05;
    
    if (p.life <= 0 || p.y < -10) {
      backgroundParticles.splice(i, 1);
    } else {
      const alpha = Math.sin(p.twinkle) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = alpha * (p.life / 500);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawLightningEffects(ctx) {
  // Update and draw lightning effects
  for (let i = lightningEffects.length - 1; i >= 0; i--) {
    const lightning = lightningEffects[i];
    lightning.life--;
    
    if (lightning.life <= 0) {
      lightningEffects.splice(i, 1);
    } else {
      ctx.save();
      ctx.globalAlpha = lightning.life / lightning.maxLife;
      ctx.strokeStyle = lightning.color;
      ctx.lineWidth = lightning.width;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lightning.x1, lightning.y1);
      
      // Draw jagged lightning path
      const segments = lightning.segments || 5;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const x = lightning.x1 + (lightning.x2 - lightning.x1) * t;
        const y = lightning.y1 + (lightning.y2 - lightning.y1) * t;
        const jitter = (Math.random() - 0.5) * lightning.jitter;
        ctx.lineTo(x + jitter, y + jitter);
      }
      
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawStar(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Enhanced screen shake function
function addScreenShake(intensity = 5, duration = 200) {
  screenShakeX = (Math.random() - 0.5) * intensity;
  screenShakeY = (Math.random() - 0.5) * intensity;
}

// Enhanced particle creation functions
function createEnhancedExplosion(x, y, color = '#FF6B35', count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30 + Math.random() * 20,
      size: 2 + Math.random() * 3,
      color: color,
      glow: 5,
      gradient: true,
      drag: 0.95
    });
  }
  
  // Add screen shake
  addScreenShake(8, 300);
}

function createSparkTrail(x, y, vx, vy, color = '#FFD700') {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: vx * 0.3 + (Math.random() - 0.5) * 2,
      vy: vy * 0.3 + (Math.random() - 0.5) * 2,
      life: 15 + Math.random() * 10,
      size: 1 + Math.random() * 2,
      color: color,
      shape: 'star',
      glow: 3
    });
  }
}

function createLightning(x1, y1, x2, y2, color = '#00BFFF', width = 3) {
  lightningEffects.push({
    x1, y1, x2, y2,
    color: color,
    width: width,
    life: 8,
    maxLife: 8,
    jitter: 15,
    segments: 8
  });
}

  // Enhanced Floating Texts - MOVED TO: scripts/core/visual-effects.js
  try {
    if (typeof renderFloatingTexts === 'function') {
      renderFloatingTexts(ctx, floatingTexts);
    }
  } catch {}

  if (mode === "editor") {
    // Draw draft shapes
    if (wallDraft){ const x = Math.min(wallDraft.x0, wallDraft.x1); const y = Math.min(wallDraft.y0, wallDraft.y1); const w = Math.abs(wallDraft.x1 - wallDraft.x0); const h = Math.abs(wallDraft.y1 - wallDraft.y0); ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = "#1976d2"; roundRectPath(x,y,w,h, parseInt(radiusEl.value,10)); ctx.fill(); ctx.restore(); }
    if (beltDraft){ const x = Math.min(beltDraft.x0, beltDraft.x1); const y = Math.min(beltDraft.y0, beltDraft.y1); const w = Math.abs(beltDraft.x1 - beltDraft.x0); const h = Math.abs(beltDraft.y1 - beltDraft.y0); ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = 'rgba(33, 150, 243, 0.35)'; roundRectPath(x,y,w,h, 8); ctx.fill(); ctx.restore(); }
    if (pipeDraft){ ctx.save(); ctx.globalAlpha=.45; ctx.fillStyle = shapeColorEl.value; drawCapsule(pipeDraft.x1, pipeDraft.y1, pipeDraft.x2, pipeDraft.y2, parseInt(thickEl.value,10)/2); ctx.restore(); }
    if (semiDraft){ ctx.save(); ctx.globalAlpha=.45; ctx.fillStyle = shapeColorEl.value; drawSemi(semiDraft.cx, semiDraft.cy, semiDraft.r, semiDraft.angle); ctx.restore(); }
    if (arcDraft){ ctx.save(); ctx.globalAlpha=.45; ctx.fillStyle = shapeColorEl.value; const _span = parseInt(arcSpanEl.value,10) * Math.PI/180; drawArcBand(arcDraft.cx, arcDraft.cy, arcDraft.r, parseInt(thickEl.value,10), arcDraft.angle, _span); ctx.restore(); }
    if (brushDraft){ ctx.save(); ctx.strokeStyle=shapeColorEl.value; drawBrushStroke(brushDraft.points, brushDraft.r); ctx.restore(); }
    
    // Draw selection rectangle
    if (selectionRect){
      const { x0, y0, x1, y1 } = selectionRect;
      const x = Math.min(x0, x1);
      const y = Math.min(y0, y1);
      const w = Math.abs(x1 - x0);
      const h = Math.abs(y1 - y0);
      ctx.save();
      ctx.strokeStyle = '#00bcd4';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0, 188, 212, 0.1)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
    
    // Highlight multi-selected objects
    if (selectedObjects.length > 0){
      ctx.save();
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      for (const obj of selectedObjects){
        if (!obj) continue;
        
        if (obj.type === 'wall'){
          const angle = obj.angle || 0;
          ctx.save();
          const cx = obj.x + obj.w/2;
          const cy = obj.y + obj.h/2;
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.strokeRect(-obj.w/2 - 3, -obj.h/2 - 3, obj.w + 6, obj.h + 6);
          ctx.restore();
        } else if (obj.type === 'brush'){
          // Brush objects - highlight the stroke path
          ctx.save();
          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = (obj.r || 10) * 2 + 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Check if merged text with segments
          if (obj.segments && Array.isArray(obj.segments)){
            // Draw each segment separately
            for (const segmentPoints of obj.segments){
              if (!segmentPoints || segmentPoints.length < 2) continue;
              ctx.beginPath();
              ctx.moveTo(segmentPoints[0].x, segmentPoints[0].y);
              for (let i = 1; i < segmentPoints.length; i++){
                ctx.lineTo(segmentPoints[i].x, segmentPoints[i].y);
              }
              ctx.stroke();
            }
          } else if (obj.points && obj.points.length > 0){
            // Normal brush - single path
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++){
              ctx.lineTo(obj.points[i].x, obj.points[i].y);
            }
            ctx.stroke();
          }
          ctx.restore();
        } else if (obj.x !== undefined && obj.y !== undefined){
          // Circular objects
          const r = obj.r || 18;
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, r + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      ctx.restore();
      
      // Draw selection count
      if (selectedObjects.length > 1){
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvas.height - 40, 200, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Selected: ${selectedObjects.length} objects`, 20, canvas.height - 25);
        ctx.restore();
      }
    }

    // Draw Spawns in editor mode only
    ctx.save();
    ctx.fillStyle = "rgba(255, 204, 0, 0.5)";
    ctx.strokeStyle = "#ffc107";
    ctx.lineWidth = 2;
    for (let i = 0; i < mapDef.spawnPoints.length; i++) {
      const s = mapDef.spawnPoints[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw the spawn number
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i + 1, s.x, s.y);
      ctx.restore();
    }
    ctx.restore();
    
    // Draw selection outline
    if (selected) {
      ctx.save();
      ctx.strokeStyle = "#f57f17"; ctx.lineWidth = 2;
      if (selected.type === 'wall') { const {x,y,w,h,r} = selected; roundRectPath(x,y,w,h,r); }
      if (selected.type === 'pipe') { const {x1,y1,x2,y2,r} = selected; drawCapsule(x1,y1,x2,y2,r,true); }
      if (selected.type === 'semi') { const {x,y,r,angle} = selected; drawSemi(x,y,r,angle,true); }
      if (selected.type === 'arc') { const {x,y,r,thick,angle,span} = selected; drawArcBand(x,y,r,thick,angle,span,true); }
      if (selected.type === 'brush') { drawBrushStroke(selected.points, selected.r, true, selected); }
      if (selected.type === 'spawn') { ctx.beginPath(); ctx.arc(selected.x, selected.y, 12, 0, Math.PI*2); }
      if (selected.type === 'carrot') { ctx.beginPath(); ctx.arc(selected.x, selected.y, selected.r, 0, Math.PI*2); }
      if (selected.type === 'startline') { const {x,y,w,h} = selected; ctx.strokeRect(x,y,w,h); }
      if (selected.type === 'gatebar') { const {x,y,w,h} = selected; ctx.strokeRect(x,y,w,h); }
      if (selected.type === 'waitingroom') { const {x,y,w,h,r} = selected; roundRectPath(x,y,w,h,r); }
      if (selected.type === 'belt') {
        const {x,y,w,h} = selected;
        const angle = selected.angle || 0;
        const cx = x + w/2, cy = y + h/2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        roundRectPath(-w/2, -h/2, w, h, 8);
        ctx.restore();
        // draw rotation handle
        const handleDist = (w/2) + 12;
        const hx = cx + handleDist * Math.cos(angle);
        const hy = cy + handleDist * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(hx, hy, 6, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.stroke();
      ctx.restore();
    }
    // Vẽ lại nhóm vật phẩm động trong editor để đảm bảo vật phẩm mới tạo hiển thị ngay
    try {
      if (window.RenderModule && typeof RenderModule.drawDynamicItems === 'function') {
        // In play mode, ensure live arrays are populated from mapDef if empty
        if (mode === 'play' || mode === 'race') {
          if (!liveBoosts.length && mapDef.boosts?.length) liveBoosts.push(...mapDef.boosts);
          if (!liveTurbos.length && mapDef.turbos?.length) liveTurbos.push(...mapDef.turbos);
          if (!liveTeleports.length && mapDef.teleports?.length) liveTeleports.push(...mapDef.teleports);
          if (!liveMagnets.length && mapDef.magnets?.length) liveMagnets.push(...mapDef.magnets);
          if (!liveTimeFreezes.length && mapDef.timeFreezes?.length) liveTimeFreezes.push(...mapDef.timeFreezes);
          if (!livePoisons.length && mapDef.poisons?.length) livePoisons.push(...mapDef.poisons);
          if (!liveGhosts.length && mapDef.ghosts?.length) liveGhosts.push(...mapDef.ghosts);
          if (!liveTraps.length && mapDef.traps?.length) liveTraps.push(...mapDef.traps);
          if (!liveRams.length && mapDef.rams?.length) liveRams.push(...mapDef.rams);
          if (!liveShields.length && mapDef.shields?.length) liveShields.push(...mapDef.shields);
          if (!liveWarpzones.length && mapDef.warpzones?.length) liveWarpzones.push(...mapDef.warpzones);
          if (!liveQuantumdashs.length && mapDef.quantumdashs?.length) liveQuantumdashs.push(...mapDef.quantumdashs);
        }
        
        RenderModule.drawDynamicItems(
          ctx,
          (window.App && App.state && App.state.mode) ?? mode,
          (window.App && App.state && App.state.mapDef) ?? mapDef,
          {
            liveBoosts: (window.App && App.state && App.state.liveBoosts) ?? liveBoosts,
            liveTurbos: (window.App && App.state && App.state.liveTurbos) ?? liveTurbos,
            liveTeleports: (window.App && App.state && App.state.liveTeleports) ?? liveTeleports,
            liveMagnets: (window.App && App.state && App.state.liveMagnets) ?? liveMagnets,
            liveTimeFreezes: (window.App && App.state && App.state.liveTimeFreezes) ?? liveTimeFreezes,
            livePoisons: (window.App && App.state && App.state.livePoisons) ?? livePoisons,
            liveGhosts: (window.App && App.state && App.state.liveGhosts) ?? liveGhosts,
            liveTraps: (window.App && App.state && App.state.liveTraps) ?? liveTraps,
            liveRams: (window.App && App.state && App.state.liveRams) ?? liveRams,
            liveShields: (window.App && App.state && App.state.liveShields) ?? liveShields,
            liveWarpzones: (window.App && App.state && App.state.liveWarpzones) ?? liveWarpzones,
            liveQuantumdashs: (window.App && App.state && App.state.liveQuantumdashs) ?? liveQuantumdashs,
            liveNebulas: (window.App && App.state && App.state.liveNebulas) ?? liveNebulas,
              // Dynamic hazards
              liveMeteors: (window.App && App.state && App.state.liveMeteors) ?? liveMeteors,
            // Dynamic hazards
            liveTornados: (window.App && App.state && App.state.liveTornados) ?? liveTornados,
            liveVolcanos: (window.App && App.state && App.state.liveVolcanos) ?? liveVolcanos,
            drawGlow, glowAlpha
          }
        );
        // Vẽ thêm Carrots và Spinners để thấy ngay trong editor
        try {
          if (typeof RenderModule.drawCarrots === 'function') {
            RenderModule.drawCarrots(ctx, (window.App && App.state && App.state.mapDef) ?? mapDef, carrotSpriteImg, drawVectorCarrot, drawGlow, glowAlpha);
          }
        } catch {}
        try {
          if (typeof RenderModule.drawSpinners === 'function') {
            RenderModule.drawSpinners(ctx, (window.App && App.state && App.state.mode) ?? mode, (window.App && App.state && App.state.mapDef) ?? mapDef, (window.App && App.state && App.state.liveSpinners) ?? liveSpinners);
          }
        } catch {}
      }
    } catch {}
    // Hiển thị power-ups trong EDITOR: sử dụng RenderModule cho tất cả power-ups
    try {
      if (typeof RenderModule !== 'undefined') {
        try {
          RenderModule.drawBoosts(ctx, mode, liveBoosts, mapDef, drawGlow, glowAlpha);
          RenderModule.drawTurbos(ctx, mode, liveTurbos, mapDef, drawGlow, glowAlpha);
          RenderModule.drawTeleports(ctx, mode, liveTeleports, mapDef, drawGlow, glowAlpha);
          RenderModule.drawMagnets(ctx, mode, liveMagnets, mapDef, drawGlow, glowAlpha);
          RenderModule.drawTimeFreezes(ctx, mode, liveTimeFreezes, mapDef, drawGlow, glowAlpha);
          RenderModule.drawGhosts(ctx, mode, liveGhosts, mapDef, drawGlow, glowAlpha);
          RenderModule.drawTraps(ctx, mode, liveTraps, mapDef, drawGlow, glowAlpha);
          RenderModule.drawRams(ctx, mode, liveRams, mapDef, drawGlow, glowAlpha);
          RenderModule.drawShields(ctx, mode, liveShields, mapDef, drawGlow, glowAlpha);
          RenderModule.drawLightnings(ctx, mode, liveLightnings, mapDef, drawGlow, glowAlpha);
          RenderModule.drawTornados(ctx, mode, liveTornados, mapDef, drawGlow, glowAlpha);
          RenderModule.drawVolcanos(ctx, mode, liveVolcanos, mapDef, drawGlow, glowAlpha);
          
          // Render volcano particles after volcanos
          if (window.volcanoParticles && window.volcanoParticles.length > 0) {
            // Rendering volcano particles
            ctx.save();
            for (const particle of window.volcanoParticles) {
              const lifeRatio = particle.life / particle.maxLife;
              const alpha = Math.min(1.0, lifeRatio * 2); // Fade out as life decreases
              
              // Particle glow effect
              const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
              );
              gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`); // Bright yellow center
              gradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.8})`); // Orange-red
              gradient.addColorStop(1, `rgba(139, 0, 0, ${alpha * 0.3})`); // Dark red edge
              
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
              ctx.fill();
              
              // Particle core (bright center)
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        } catch {}
      }
    } catch {}
  }
  
  // Rams rendering for PLAY mode only (editor mode handled above)
  if (mode === 'play' || mode === 'race') {
    try {
      
      if (typeof RenderModule !== 'undefined' && RenderModule.drawRams) {
        try {
          RenderModule.drawRams(ctx, mode, liveRams, mapDef, drawGlow, glowAlpha);
        } catch (error) {
          // Fallback Ram rendering - fix for editor mode
          const ramsToDraw = (mode === 'play' || mode === 'race') 
            ? (liveRams || []) 
            : [ ...(mapDef?.rams || []), ...((Array.isArray(liveRams) ? liveRams : [])) ];
          for (const r of ramsToDraw) {
            try {
              drawGlow(ctx, r.x, r.y, r.r, 'rgb(244,67,54)', glowAlpha(0.35, 1.1, 0.3));
            } catch {}
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.28)';
            ctx.lineWidth = 1.5;
            try {
              ctx.stroke();
            } catch {}
            ctx.font = `bold ${Math.max(12, Math.round(r.r))}px ${EMOJI_FONT}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            const rGlyph = (mode === 'editor' && !mapDef?.editorEmojiEnabled) ? 'R' : '💥';
            ctx.fillText(rGlyph, r.x, r.y);
          }
        }
      }
    } catch {}
    
    // Lightning rendering for PLAY mode (ensure visibility)
    try {
      if (typeof RenderModule !== 'undefined' && RenderModule.drawLightnings) {
        try {
          RenderModule.drawLightnings(ctx, mode, liveLightnings, mapDef, drawGlow, glowAlpha);
        } catch (error) {
          // Fallback Lightning rendering for play mode
          const lightningsToDraw = (mode === 'play' || mode === 'race') ? (liveLightnings || []) : (mapDef.lightnings || []);
          for (const lightning of lightningsToDraw) {
            const x = lightning.x;
            const y = lightning.y;
            const r = lightning.r || 18;
            
            // Bright glow
            try {
              drawGlow(ctx, x, y, r + 12, '#FFD700', glowAlpha(0.6, 1.5, 1.0));
            } catch {}
            
            ctx.save();
            
            // Bright gradient
            const gradient = ctx.createRadialGradient(x - r*0.2, y - r*0.2, 0, x, y, r);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.9)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0.7)');
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            
            // Star rays
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI) / 4;
              const x1 = x + Math.cos(angle) * (r * 0.3);
              const y1 = y + Math.sin(angle) * (r * 0.3);
              const x2 = x + Math.cos(angle) * (r * 1.2);
              const y2 = y + Math.sin(angle) * (r * 1.2);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
            
            // Star icon
            ctx.font = `bold ${Math.max(16, Math.round(r * 0.8))}px ${EMOJI_FONT}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillText('⭐', x + 1, y + 1); // Shadow
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
            ctx.fillText('⭐', x, y); // Main star
            
            ctx.restore();
          }
        }
      }
    } catch {}
    
    // Tornado rendering for PLAY mode (ensure visibility)
    try {
      if (typeof RenderModule !== 'undefined' && RenderModule.drawTornados) {
        try {
          RenderModule.drawTornados(ctx, mode, liveTornados, mapDef, drawGlow, glowAlpha);
        } catch (error) {
          // Fallback Tornado rendering - fix for editor mode
          const tornadosToDraw = (mode === 'play' || mode === 'race') 
            ? (liveTornados || []) 
            : [ ...(mapDef?.tornados || []), ...((Array.isArray(liveTornados) ? liveTornados : [])) ];
          for (const tornado of tornadosToDraw) {
            const x = tornado.x;
            const y = tornado.y;
            const r = tornado.r || 18;
            
            ctx.save();
            
            // Simple tornado rendering
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            
            // Tornado icon
            ctx.font = `bold ${Math.max(16, Math.round(r * 0.8))}px "${EMOJI_FONT}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillText('🌪️', x + 1, y + 1);
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
            ctx.fillText('🌪️', x, y);
            
            ctx.restore();
          }
        }
      }
    } catch {}

    // Volcano rendering for PLAY mode (ensure visibility)
    try {
      if (typeof RenderModule !== 'undefined' && RenderModule.drawVolcanos) {
        try {
          // Using RenderModule.drawVolcanos
          RenderModule.drawVolcanos(ctx, mode, liveVolcanos, mapDef, drawGlow, glowAlpha);
        } catch (error) {
          // RenderModule.drawVolcanos failed, using fallback
          // Fallback Volcano rendering - fix for editor mode
          const volcanosToDraw = (mode === 'play' || mode === 'race') 
            ? (liveVolcanos || []) 
            : [ ...(mapDef?.volcanos || []), ...((Array.isArray(liveVolcanos) ? liveVolcanos : [])) ];
          for (const volcano of volcanosToDraw) {
            const x = volcano.x;
            const y = volcano.y;
            const r = volcano.r || 18;
            
            ctx.save();
            
            // Simple volcano rendering
            ctx.fillStyle = 'rgba(255,69,0,0.8)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            
            // Volcano icon
            ctx.font = `bold ${Math.max(16, Math.round(r * 0.8))}px "${EMOJI_FONT}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillText('🌋', x + 1, y + 1);
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
            ctx.fillText('🌋', x, y);
            
            ctx.restore();
          }
          
          // Render volcano particles
          if (window.volcanoParticles && window.volcanoParticles.length > 0) {
            // Rendering volcano particles in fallback
            ctx.save();
            for (const particle of window.volcanoParticles) {
              const lifeRatio = particle.life / particle.maxLife;
              const alpha = Math.min(1.0, lifeRatio * 2); // Fade out as life decreases
              
              // Particle glow effect
              const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
              );
              gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`); // Bright yellow center
              gradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.8})`); // Orange-red
              gradient.addColorStop(1, `rgba(139, 0, 0, ${alpha * 0.3})`); // Dark red edge
              
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
              ctx.fill();
              
              // Particle core (bright center)
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        }
      }
    } catch {}
  }

  if (mode === "play") {
    for (const h of horses) {
      if (h.eliminated) continue;

      // Soft drop shadow under horse (disabled by default)
      if (window.horseShadowEnabled) {
        try {
          ctx.save();
          const rx = Math.max(6, h.r * 0.9);
          const ry = Math.max(3, h.r * 0.45);
          const oy = Math.max(2, h.r * 0.35);
          ctx.fillStyle = 'rgba(0,0,0,0.32)';
          ctx.beginPath();
          ctx.ellipse(h.x, h.y + oy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } catch {}
      }

      const now = performance.now();

      // Speed lines when recently boosted (disabled during Turbo to avoid bright streaks)
      if (h.speedLineUntil && now < h.speedLineUntil && !(h.turboUntil && now < h.turboUntil && h.turboMultiplier > 1)) {
        const life = (h.speedLineUntil - now) / 600; // 0..1
        const dir = Math.atan2(h.vy||0, h.vx||0);
        const len = 18 + 24 * life;
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `rgba(255,140,0,${0.22*life})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i=0;i<5;i++){
          const off = (i-2)*3;
          const ax = h.x + Math.cos(dir)* (h.r + off);
          const ay = h.y + Math.sin(dir)* (h.r + off);
          const bx = ax - Math.cos(dir)* len;
          const by = ay - Math.sin(dir)* len;
          ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
        }
        ctx.restore();
      }

      // Ghost ripple (expanding ring) upon pickup
      if (h.ghostRippleStart){
        const t = (now - h.ghostRippleStart) / 600; // 0..1
        if (t < 1){
          ctx.save();
          const r0 = h.r + 6 + t * 26;
          ctx.lineWidth = 3;
          ctx.strokeStyle = `rgba(255,140,0,${0.6*(1-t)})`;
          ctx.beginPath(); ctx.arc(h.x, h.y, r0, 0, Math.PI*2); ctx.stroke();
          // second faint ring
          ctx.lineWidth = 2;
          ctx.strokeStyle = `rgba(255,120,0,${0.35*(1-t)})`;
          ctx.beginPath(); ctx.arc(h.x, h.y, r0+8, 0, Math.PI*2); ctx.stroke();
          ctx.restore();
        } else {
          h.ghostRippleStart = 0;
        }
      }

      // Ghost double-image while ghosted
      if (h.doubleImageUntil && now < h.doubleImageUntil){
        ctx.save();
        const dir = Math.atan2(h.vy||0, h.vx||1e-6);
        const back = 4; // trail offset
        ctx.globalAlpha = 0.35;
        ctx.translate(-Math.cos(dir)*back, -Math.sin(dir)*back);
        h.draw(ctx);
        ctx.restore();
      }

      // Spinner impact visual flash (no camera shake)
      if (h.spinnerImpactUntil && now < h.spinnerImpactUntil){
        const remain = h.spinnerImpactUntil - now; // 0..200ms
        const t = 1 - (remain / 200);
        const strength = Math.max(0.2, Math.min(1, h.spinnerImpactStrength || 0.6));
        const r = h.r + 4 + t * (10 + 8*strength);
        const a1 = 0.55 * (1 - t);
        const a2 = 0.35 * (1 - t);
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        // Outer halo (orange-tinted)
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(255,160,0,${a1})`;
        ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, Math.PI*2); ctx.stroke();
        // Rim
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255,120,0,${a2})`;
        ctx.beginPath(); ctx.arc(h.x, h.y, r+4, 0, Math.PI*2); ctx.stroke();
        // Short streaks along the last collision normal
        const nx = h._lastSpinnerNormalX || 0, ny = h._lastSpinnerNormalY || 0;
        if (nx || ny){
          const len = 10 + 10*strength;
          const sx = h.x + nx * (h.r + 2);
          const sy = h.y + ny * (h.r + 2);
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(255,140,0,${0.42*(1-t)})`;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + nx*len, sy + ny*len); ctx.stroke();
          // tangential mini-streaks
          const tx = -ny, ty = nx;
          ctx.lineWidth = 2;
          ctx.strokeStyle = `rgba(255,200,120,${0.5*(1-t)})`;
          ctx.beginPath();
          ctx.moveTo(sx + tx*3, sy + ty*3); ctx.lineTo(sx + tx*3 + nx*(len*0.6), sy + ty*3 + ny*(len*0.6));
          ctx.moveTo(sx - tx*3, sy - ty*3); ctx.lineTo(sx - tx*3 + nx*(len*0.6), sy - ty*3 + ny*(len*0.6));
          ctx.stroke();
        }
        ctx.restore();
      }

      // Render Gravity Well Aura
      if (h.skillState && h.skillState.name === 'gravity_well' && h.skillState.status === 'active') {
        ctx.save();
        const radius = h.skillState.radius;
        const wave = Math.sin(now / 150) * 5; // Pulsating effect
        const gradient = ctx.createRadialGradient(h.x, h.y, radius * 0.2, h.x, h.y, radius + wave);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
        gradient.addColorStop(0.7, 'rgba(138, 43, 226, 0.3)');
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, radius + wave, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Chill Guy Aura
      if (h.skillState && h.skillState.name === 'chill_guy') {
        ctx.save();
        const radius = h.r + 8; // Aura radius
        const wave = Math.sin(performance.now() / 200) * 2; // Gentle pulse
        const gradient = ctx.createRadialGradient(h.x, h.y, h.r, h.x, h.y, radius + wave);
        gradient.addColorStop(0, 'rgba(255, 193, 7, 0.0)');
        gradient.addColorStop(0.6, 'rgba(255, 165, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, radius + wave, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Oguri Fat Flame Aura (Super Saiyan style)
      if (h.oguriFatAuraUntil && now < h.oguriFatAuraUntil) {
        ctx.save();
        
        // Flame parameters
        const flameCount = 8; // Number of flame tongues
        const baseHeight = h.r * 2.5; // Base flame height
        const timeOffset = now / 50; // Animation speed
        
        // Draw multiple flame layers (back to front)
        for (let layer = 2; layer >= 0; layer--) {
          const layerAlpha = 0.3 + layer * 0.25;
          const layerScale = 1 + layer * 0.15;
          
          for (let i = 0; i < flameCount; i++) {
            const angle = (i / flameCount) * Math.PI * 2 - Math.PI / 2; // Start from top
            const flickerSpeed = 3 + i * 0.5;
            const flicker = Math.sin(timeOffset * flickerSpeed + i * 1.7) * 0.3 + 0.7;
            const flicker2 = Math.sin(timeOffset * flickerSpeed * 1.3 + i * 2.1) * 0.2;
            
            // Flame base position (around the horse)
            const baseX = h.x + Math.cos(angle) * (h.r + 2);
            const baseY = h.y + Math.sin(angle) * (h.r + 2);
            
            // Flame tip position (pointing outward and upward)
            const flameHeight = baseHeight * flicker * layerScale;
            const outwardAngle = angle * 0.3 - Math.PI / 2; // Mostly upward, slightly outward
            const tipX = baseX + Math.cos(outwardAngle) * flameHeight * 0.3 + Math.sin(timeOffset + i) * 3;
            const tipY = baseY - flameHeight + Math.sin(timeOffset * 2 + i * 0.8) * 4; // Upward with wave
            
            // Control points for bezier curve (flame shape)
            const cp1x = baseX + (tipX - baseX) * 0.3 + Math.sin(timeOffset * 4 + i) * 5 * flicker2;
            const cp1y = baseY + (tipY - baseY) * 0.4;
            const cp2x = baseX + (tipX - baseX) * 0.6 - Math.sin(timeOffset * 3 + i) * 4 * flicker2;
            const cp2y = baseY + (tipY - baseY) * 0.7;
            
            // Flame width at base
            const flameWidth = (h.r * 0.6 + Math.sin(timeOffset * 2 + i * 0.5) * 2) * layerScale;
            
            // Create gradient for this flame
            const gradient = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
            if (layer === 0) {
              // Inner layer - white/yellow core
              gradient.addColorStop(0, `rgba(255, 255, 220, ${layerAlpha})`);
              gradient.addColorStop(0.3, `rgba(255, 240, 100, ${layerAlpha * 0.9})`);
              gradient.addColorStop(0.7, `rgba(255, 180, 0, ${layerAlpha * 0.6})`);
              gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            } else if (layer === 1) {
              // Middle layer - orange
              gradient.addColorStop(0, `rgba(255, 200, 50, ${layerAlpha})`);
              gradient.addColorStop(0.4, `rgba(255, 150, 0, ${layerAlpha * 0.8})`);
              gradient.addColorStop(1, `rgba(255, 80, 0, 0)`);
            } else {
              // Outer layer - red/orange glow
              gradient.addColorStop(0, `rgba(255, 120, 0, ${layerAlpha * 0.7})`);
              gradient.addColorStop(0.5, `rgba(255, 60, 0, ${layerAlpha * 0.4})`);
              gradient.addColorStop(1, `rgba(200, 30, 0, 0)`);
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            // Draw flame shape using bezier curves
            const perpX = Math.cos(angle + Math.PI / 2) * flameWidth;
            const perpY = Math.sin(angle + Math.PI / 2) * flameWidth;
            
            ctx.moveTo(baseX - perpX, baseY - perpY);
            ctx.quadraticCurveTo(cp1x - perpX * 0.5, cp1y - perpY * 0.5, tipX, tipY);
            ctx.quadraticCurveTo(cp2x + perpX * 0.5, cp2y + perpY * 0.5, baseX + perpX, baseY + perpY);
            ctx.closePath();
            ctx.fill();
          }
        }
        
        // Inner bright core glow
        const coreGradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r + 6);
        coreGradient.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
        coreGradient.addColorStop(0.4, 'rgba(255, 220, 100, 0.6)');
        coreGradient.addColorStop(0.7, 'rgba(255, 180, 50, 0.3)');
        coreGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r + 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Spark particles rising from flames
        if (Math.random() < 0.5) {
          try {
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = h.r + Math.random() * 8;
            particles.push({
              x: h.x + Math.cos(spawnAngle) * spawnDist,
              y: h.y + Math.sin(spawnAngle) * spawnDist,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -2 - Math.random() * 2, // Rising upward fast
              life: 15 + Math.random() * 20,
              color: Math.random() > 0.3 ? '#FFDD00' : (Math.random() > 0.5 ? '#FF8800' : '#FFFFFF'),
              alpha: 0.9,
              size: 1.5 + Math.random() * 2.5
            });
          } catch {}
        }
        
        ctx.restore();
      }

      // Render Supersonic Speed Aura (Cyan/Yellow speed aura with motion trails)
      if (h.supersonicAuraUntil && now < h.supersonicAuraUntil) {
        ctx.save();
        
        // Speed lines and motion blur effect
        const speedPhase = now / 30;
        const numLines = 12;
        
        // Outer speed ring - pulsating cyan
        const pulseSize = h.r + 15 + Math.sin(speedPhase * 0.5) * 5;
        const outerGradient = ctx.createRadialGradient(h.x, h.y, h.r, h.x, h.y, pulseSize);
        outerGradient.addColorStop(0, 'rgba(0, 255, 255, 0.0)');
        outerGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
        outerGradient.addColorStop(0.8, 'rgba(255, 255, 0, 0.2)');
        outerGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Speed lines radiating outward
        for (let i = 0; i < numLines; i++) {
          const angle = (i / numLines) * Math.PI * 2 + speedPhase * 0.1;
          const lineLength = 20 + Math.sin(speedPhase + i * 0.8) * 10;
          const lineAlpha = 0.4 + Math.sin(speedPhase * 2 + i) * 0.2;
          
          const startX = h.x + Math.cos(angle) * (h.r + 5);
          const startY = h.y + Math.sin(angle) * (h.r + 5);
          const endX = h.x + Math.cos(angle) * (h.r + 5 + lineLength);
          const endY = h.y + Math.sin(angle) * (h.r + 5 + lineLength);
          
          ctx.strokeStyle = `rgba(0, 255, 255, ${lineAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        // Inner bright core
        const coreGradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r + 4);
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        coreGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
        coreGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r + 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Spawn speed particles behind horse (motion trail)
        if (Math.random() < 0.6) {
          try {
            const trailX = h.x - (h.vx || 0) * 3;
            const trailY = h.y - (h.vy || 0) * 3;
            particles.push({
              x: trailX + (Math.random() - 0.5) * h.r,
              y: trailY + (Math.random() - 0.5) * h.r,
              vx: -(h.vx || 0) * 0.3 + (Math.random() - 0.5) * 0.5,
              vy: -(h.vy || 0) * 0.3 + (Math.random() - 0.5) * 0.5,
              life: 12 + Math.random() * 10,
              color: Math.random() > 0.5 ? '#00FFFF' : '#FFFF00',
              alpha: 0.8,
              size: 2 + Math.random() * 2
            });
          } catch {}
        }
        
        ctx.restore();
      }

      // Render Silence Shizuka Healing Aura (Green serene aura)
      if (h.shizukaAuraUntil && now < h.shizukaAuraUntil) {
        ctx.save();
        
        // Pulsating healing aura
        const pulseSpeed = now / 400;
        const pulse = Math.sin(pulseSpeed) * 0.15 + 0.85;
        const pulse2 = Math.sin(pulseSpeed * 1.5 + 1) * 0.1 + 0.9;
        
        // Outer glow ring
        const outerRadius = (h.r + 12) * pulse;
        const outerGradient = ctx.createRadialGradient(h.x, h.y, h.r, h.x, h.y, outerRadius);
        outerGradient.addColorStop(0, 'rgba(0, 128, 0, 0.0)');
        outerGradient.addColorStop(0.4, 'rgba(50, 205, 50, 0.2)');
        outerGradient.addColorStop(0.7, 'rgba(144, 238, 144, 0.45)');
        outerGradient.addColorStop(1, 'rgba(152, 251, 152, 0)');
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        const coreRadius = (h.r + 6) * pulse2;
        const coreGradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, coreRadius);
        coreGradient.addColorStop(0, 'rgba(240, 255, 240, 0.85)');
        coreGradient.addColorStop(0.3, 'rgba(144, 238, 144, 0.6)');
        coreGradient.addColorStop(0.6, 'rgba(50, 205, 50, 0.4)');
        coreGradient.addColorStop(1, 'rgba(34, 139, 34, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(h.x, h.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Healing sparkles rising upward
        if (Math.random() < 0.4) {
          try {
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = h.r * 0.5 + Math.random() * h.r * 0.8;
            particles.push({
              x: h.x + Math.cos(spawnAngle) * spawnDist,
              y: h.y + Math.sin(spawnAngle) * spawnDist,
              vx: (Math.random() - 0.5) * 0.3,
              vy: -0.8 - Math.random() * 1.2, // Rising upward gently
              life: 20 + Math.random() * 25,
              color: Math.random() > 0.5 ? '#32CD32' : (Math.random() > 0.5 ? '#7CFC00' : '#ADFF2F'),
              alpha: 0.8,
              size: 1.5 + Math.random() * 2
            });
          } catch {}
        }
        
        // Floating plus signs (healing indicator)
        const numPluses = 3;
        for (let i = 0; i < numPluses; i++) {
          const plusAngle = (now / 1500 + i * (Math.PI * 2 / numPluses)) % (Math.PI * 2);
          const plusDist = h.r + 8 + Math.sin(now / 300 + i) * 3;
          const plusX = h.x + Math.cos(plusAngle) * plusDist;
          const plusY = h.y + Math.sin(plusAngle) * plusDist - Math.sin(now / 200 + i * 2) * 4;
          const plusAlpha = 0.5 + Math.sin(now / 150 + i) * 0.3;
          
          ctx.save();
          ctx.globalAlpha = plusAlpha;
          ctx.fillStyle = '#00FF7F';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', plusX, plusY);
          ctx.restore();
        }
        
        ctx.restore();
      }

      // Render Fireball orbiting fireballs
      if (h.fireballsUntil && now < h.fireballsUntil) {
        ctx.save();
        
        const fireballCount = h.skillState?.fireballCount || 3;
        const orbitRadius = h.skillState?.orbitRadius || 35;
        const fireballRadius = 8;
        const baseAngle = h.fireballStartAngle || 0;
        
        for (let i = 0; i < fireballCount; i++) {
          const angle = baseAngle + (i * Math.PI * 2 / fireballCount);
          const fbX = h.x + Math.cos(angle) * orbitRadius;
          const fbY = h.y + Math.sin(angle) * orbitRadius;
          
          // Fireball glow
          const glowGradient = ctx.createRadialGradient(fbX, fbY, 0, fbX, fbY, fireballRadius * 2);
          glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
          glowGradient.addColorStop(0.4, 'rgba(255, 69, 0, 0.5)');
          glowGradient.addColorStop(0.7, 'rgba(255, 140, 0, 0.2)');
          glowGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(fbX, fbY, fireballRadius * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Fireball core
          const coreGradient = ctx.createRadialGradient(fbX, fbY, 0, fbX, fbY, fireballRadius);
          coreGradient.addColorStop(0, '#FFFFFF');
          coreGradient.addColorStop(0.3, '#FFFF00');
          coreGradient.addColorStop(0.6, '#FF8C00');
          coreGradient.addColorStop(1, '#FF4500');
          ctx.fillStyle = coreGradient;
          ctx.beginPath();
          ctx.arc(fbX, fbY, fireballRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Fire trail particles
          if (Math.random() < 0.6) {
            try {
              const trailAngle = angle + Math.PI; // Behind the fireball
              particles.push({
                x: fbX + Math.cos(trailAngle) * 4,
                y: fbY + Math.sin(trailAngle) * 4,
                vx: Math.cos(trailAngle) * 0.5 + (Math.random() - 0.5) * 0.5,
                vy: Math.sin(trailAngle) * 0.5 + (Math.random() - 0.5) * 0.5 - 0.3,
                life: 12 + Math.random() * 8,
                color: Math.random() > 0.5 ? '#FF4500' : (Math.random() > 0.5 ? '#FF8C00' : '#FFD700'),
                alpha: 0.9,
                size: 2 + Math.random() * 2
              });
            } catch {}
          }
        }
        
        ctx.restore();
      }

      // Render Energy Ball projectile
      if (h.energyBall) {
        ctx.save();
        const ball = h.energyBall;
        const ballR = ball.radius || 25;
        
        // Outer glow (pulsating)
        const pulse = 1 + Math.sin(now / 100) * 0.15;
        const outerGlow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ballR * 2.5 * pulse);
        outerGlow.addColorStop(0, 'rgba(0, 191, 255, 0.6)');
        outerGlow.addColorStop(0.3, 'rgba(0, 191, 255, 0.3)');
        outerGlow.addColorStop(0.6, 'rgba(135, 206, 235, 0.15)');
        outerGlow.addColorStop(1, 'rgba(135, 206, 235, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballR * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Main ball body
        const coreGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ballR);
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.2, '#E0FFFF');
        coreGradient.addColorStop(0.5, '#00BFFF');
        coreGradient.addColorStop(0.8, '#1E90FF');
        coreGradient.addColorStop(1, '#0000CD');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballR, 0, Math.PI * 2);
        ctx.fill();
        
        // Electric arcs inside
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const startAngle = (now / 50 + i * Math.PI * 2 / 3) % (Math.PI * 2);
          const endAngle = startAngle + Math.PI * 0.6;
          const innerR = ballR * 0.3;
          const outerR = ballR * 0.8;
          ctx.beginPath();
          ctx.moveTo(ball.x + Math.cos(startAngle) * innerR, ball.y + Math.sin(startAngle) * innerR);
          const midAngle = (startAngle + endAngle) / 2;
          const jitter = (Math.random() - 0.5) * 6;
          ctx.quadraticCurveTo(
            ball.x + Math.cos(midAngle) * outerR + jitter,
            ball.y + Math.sin(midAngle) * outerR + jitter,
            ball.x + Math.cos(endAngle) * innerR,
            ball.y + Math.sin(endAngle) * innerR
          );
          ctx.stroke();
        }
        
        // Energy trail particles
        if (Math.random() < 0.7) {
          try {
            const trailX = ball.x - ball.vx * 5 + (Math.random() - 0.5) * ballR;
            const trailY = ball.y - ball.vy * 5 + (Math.random() - 0.5) * ballR;
            particles.push({
              x: trailX,
              y: trailY,
              vx: -ball.vx * 0.3 + (Math.random() - 0.5) * 0.5,
              vy: -ball.vy * 0.3 + (Math.random() - 0.5) * 0.5,
              life: 15 + Math.random() * 10,
              color: Math.random() > 0.5 ? '#00BFFF' : '#87CEEB',
              alpha: 0.8,
              size: 3 + Math.random() * 3
            });
          } catch {}
        }
        
        ctx.restore();
      }

      if (h.frozenUntil && now < h.frozenUntil) {
        ctx.save();
        const blink = Math.floor(now / 150) % 2 === 0;
        ctx.globalAlpha = blink ? 0.3 : 0.6;
        ctx.fillStyle = '#00FFFF'; // Cyan
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Shield aura short glow on pickup
      if ((h.shieldGlowUntil && now < h.shieldGlowUntil) || h.hasShield){
        ctx.save();
        
        // Divine Guardian has special golden shield visual
        const isGuardian = h.guardianShieldActive && h.skillState?.name === 'guardian';
        
        if (isGuardian) {
          // Golden Divine Guardian shield - pulsating
          const pulse = Math.sin(now / 200) * 0.15 + 0.85; // 0.7 to 1.0
          const k = 0.5 * pulse;
          const radius = h.r + 12;
          const grad = ctx.createRadialGradient(h.x,h.y,h.r*0.2, h.x,h.y, radius);
          grad.addColorStop(0, `rgba(255,215,0,${0.0})`); // Gold
          grad.addColorStop(0.5, `rgba(255,215,0,${0.6*k})`);
          grad.addColorStop(0.8, `rgba(255,193,7,${0.4*k})`); // Amber
          grad.addColorStop(1, 'rgba(255,193,7,0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(h.x,h.y, radius, 0, Math.PI*2); ctx.fill();
          
          // Add golden ring
          ctx.strokeStyle = `rgba(255,215,0,${0.6*pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 8, 0, Math.PI*2); ctx.stroke();
        } else {
          // Normal shield (blue)
          const k = h.hasShield ? 0.35 : Math.max(0, (h.shieldGlowUntil - now)/600);
          const radius = h.r + 10;
          const grad = ctx.createRadialGradient(h.x,h.y,h.r*0.2, h.x,h.y, radius);
          grad.addColorStop(0, `rgba(3,169,244,${0.0})`);
          grad.addColorStop(0.7, `rgba(3,169,244,${0.35*k+0.15})`);
          grad.addColorStop(1, 'rgba(3,169,244,0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(h.x,h.y, radius, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();
      }

      // Tornado vortex slowdown effect (visual indicator)
      if (h.tornadoSpeedPenaltyUntil && now < h.tornadoSpeedPenaltyUntil) {
        ctx.save();
        const penaltyAlpha = 0.4;
        ctx.strokeStyle = `rgba(135, 206, 235, ${penaltyAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Vortex effect on pulled horses
      if (h.vortexEffectUntil && now < h.vortexEffectUntil) {
        ctx.save();
        const vortexAlpha = Math.sin((now - (h.vortexEffectUntil - 800)) * 0.015) * 0.4 + 0.3;
        ctx.strokeStyle = `rgba(135, 206, 235, ${vortexAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Movement dust trail using existing global particles system (always-on while moving fast)
      try {
        if (window.horseMotionTrailEnabled) {
          const vx = h.vx || 0, vy = h.vy || 0;
          const sp = Math.hypot(vx, vy);
          const minSpeed = (window.horseTrailMinSpeed ?? 0.6);
          // Only emit when effective speed > 100% base speed
          const turboMult = (typeof h.turboMultiplier === 'number' && isFinite(h.turboMultiplier)) ? h.turboMultiplier : 1.0;
          const quantumMult = (typeof h.quantumDashMultiplier === 'number' && isFinite(h.quantumDashMultiplier)) ? h.quantumDashMultiplier : 1.0;
          const baseFactor = (typeof h.baseSpeedFactor === 'number' && isFinite(h.baseSpeedFactor)) ? h.baseSpeedFactor : 1.0;
          const speedMod = (typeof h.speedMod === 'number' && isFinite(h.speedMod)) ? h.speedMod : 1.0;
          const gwMod = (typeof h.gravityWellSpeedModifier === 'number' && isFinite(h.gravityWellSpeedModifier)) ? h.gravityWellSpeedModifier : 1.0;
          const gwBoost = (typeof h.gravityWellSpeedBoost === 'number' && isFinite(h.gravityWellSpeedBoost)) ? h.gravityWellSpeedBoost : (h.gravityWellSpeedBoost || 1.0);
          const finalModifier = baseFactor * speedMod * gwMod * gwBoost * turboMult * quantumMult;
          // Throttle spawn per horse to avoid overdraw
          h._lastDustTrailTs = h._lastDustTrailTs || 0;
          const nowMs = (typeof now === 'number') ? now : performance.now();
          const intervalMs = 36; // ~28 Hz per horse
          const particlesCap = (typeof window.trailParticlesCap === 'number' && isFinite(window.trailParticlesCap)) ? window.trailParticlesCap : 1500;
          if (sp > minSpeed && finalModifier > 1.0001 && (nowMs - h._lastDustTrailTs) >= intervalMs && particles && particles.length < particlesCap){
            h._lastDustTrailTs = nowMs;
            const dir = Math.atan2(vy, vx);
            // spawn just behind the horse, close to the sprite edge
            const x0 = h.x - Math.cos(dir) * (h.r * 0.45);
            const y0 = h.y - Math.sin(dir) * (h.r * 0.45);
            const intensity = Math.max(0, Math.min(1.6, window.horseTrailIntensity || 1.0));
            const base = (1.2 + sp * 0.22) * (0.9 + 0.2*intensity); // slight boost with intensity
            let count = Math.min(10, Math.round((3 + Math.floor(sp*0.35)) * (0.6 + 0.4*intensity)));

            // Per-horse token bucket to cap emission rate (particles/sec)
            const nowSec = nowMs * 0.001;
            const rate = 20 + Math.round(25 * intensity);   // target tokens per second
            const bucketMax = rate * 1.2;                   // max burst
            h._trailTokens = (typeof h._trailTokens === 'number') ? h._trailTokens : bucketMax;
            h._trailLastRefill = (typeof h._trailLastRefill === 'number') ? h._trailLastRefill : nowSec;
            const dt = Math.max(0, nowSec - h._trailLastRefill);
            if (dt > 0){
              h._trailTokens = Math.min(bucketMax, h._trailTokens + rate * dt);
              h._trailLastRefill = nowSec;
            }
            const allowed = Math.min(count, Math.floor(h._trailTokens));
            if (allowed <= 0) { continue; }
            h._trailTokens -= allowed;
            count = allowed;
            // Optional VFX: brighter trail during turbo/winner
            const isTurbo = (h.turboMultiplier && h.turboMultiplier > 1.05) || (h.turboUntil && (nowMs < h.turboUntil));
            const isWinner = !!(winner && h === winner);
            const boostVFX = isTurbo || isWinner;
            const cA0 = window.horseTrailColorA || 'rgba(80,80,80,0.75)';
            const cB0 = window.horseTrailColorB || 'rgba(120,120,120,0.65)';
            function brighten(c, gain=1.18, aAdd=0.08){
              try{
                const m = c.match(/rgba\((\d+),(\d+),(\d+),(\d*\.?\d+)\)/);
                if (!m) return c;
                let r=Math.min(255, Math.round(parseInt(m[1])*gain+12));
                let g=Math.min(255, Math.round(parseInt(m[2])*gain+12));
                let b=Math.min(255, Math.round(parseInt(m[3])*gain+12));
                let a=Math.max(0, Math.min(1, parseFloat(m[4])+aAdd));
                return `rgba(${r},${g},${b},${a})`;
              } catch { return c; }
            }
            const cA = boostVFX ? brighten(cA0) : cA0;
            const cB = boostVFX ? brighten(cB0, 1.12, 0.06) : cB0;
            for (let k=0;k<count && particles.length < particlesCap; k++){
              const ang = dir + Math.PI + (Math.random()-0.5)*0.9; // back with spread
              const spd = (Math.random()*base + base*0.5);
              particles.push({
                x: x0 + Math.cos(ang) * (h.r*0.15),
                y: y0 + Math.sin(ang) * (h.r*0.15),
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: Math.round((34 + Math.random()*20) * (0.8 + 0.4*intensity)),
                color: (Math.random()<0.5? cA : cB)
              });
            }
          }
        }
      } catch {}

      // Main horse draw with local jitter during impact (render-only)
      let hasImpact = false;
      let ox = 0, oy = 0;
      
      // Spinner impact jitter
      if (h.spinnerImpactUntil && now < h.spinnerImpactUntil){
        const remain = h.spinnerImpactUntil - now; // 0..200ms
        const fade = Math.max(0, Math.min(1, remain / 200)); // 1 -> 0
        const strength = Math.max(0.2, Math.min(1, h.spinnerImpactStrength || 0.6));
        const amp = (0.6 + 1.4 * strength) * fade; // up to ~2px, then fade out
        ox = (Math.random()*2-1) * amp;
        oy = (Math.random()*2-1) * amp;
        hasImpact = true;
      }
      
      // Damage impact jitter (HP system)
      if (mapDef.hpSystemEnabled && h.damageImpactUntil && now < h.damageImpactUntil){
        const remain = h.damageImpactUntil - now; // 0..200ms
        const fade = Math.max(0, Math.min(1, remain / 200)); // 1 -> 0
        const strength = Math.max(0.2, Math.min(1, h.damageImpactStrength || 0.6));
        const amp = (0.4 + 1.0 * strength) * fade; // slightly less intense than spinner
        ox += (Math.random()*2-1) * amp;
        oy += (Math.random()*2-1) * amp;
        hasImpact = true;
      }
      
      if (hasImpact) {
        ctx.save(); ctx.translate(ox, oy); h.draw(); ctx.restore();
      } else {
        h.draw();
      }
      // Per-horse skill cooldown clock (only while cooling down)
      try {
        const st = h.skillState;
        if (st && st.status === 'cooldown' && typeof st.cooldownUntil === 'number'){
          const cdTotal = Math.max(500, (st.cooldown || 60000));
          const remain = Math.max(0, st.cooldownUntil - now);
          if (remain > 0){
            const frac = Math.max(0, Math.min(1, remain / cdTotal));
            // Icon: nhích lên 1 chút và cách tên ra thêm 1 chút
            const cx = h.x + (h.r||10) + 24; // was +22
            const cy = h.y - (h.r||10) - 8;  // was -6
            const R = 8;
            ctx.save();
            // background
            ctx.fillStyle = 'rgba(30,30,35,0.65)';
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();
            // rim
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(220,230,255,0.85)';
            ctx.beginPath(); ctx.arc(cx, cy, R-1, 0, Math.PI*2); ctx.stroke();
            // pie (clockwise from 12 o'clock)
            ctx.fillStyle = 'rgba(3,169,244,0.9)';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            const ang = -Math.PI/2; // start at top
            ctx.arc(cx, cy, R-2, ang, ang + (-Math.PI*2*frac), true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      } catch {}
    }
    if (winner){
      // Winner spotlight glow under banner
      try { drawWinnerSpotlight(ctx); } catch {}
      ctx.save();
      const msg = `${winner.name} WIN!`;
      ctx.font = "bold 56px system-ui, Arial";
      const w = ctx.measureText(msg).width + 40;
      const h = 70;
      const cx = canvas.width/2, cy = 90;
      const x = cx - w/2, y = cy - h/2;
      // glass-like pill
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      const r = 16;
      ctx.beginPath();
      roundRectPath(x, y, w, h, r);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // title text
      ctx.textAlign = "center";
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      try { ctx.strokeText(msg, cx, cy); } catch {}
      ctx.fillStyle = "#ffca28";
      ctx.fillText(msg, cx, cy);
      ctx.restore();
    }
    updateTimer();
  } else if (mode === "race") {
    for (const h of horses) {
      if (h.spinnerImpactUntil && now < h.spinnerImpactUntil){
        const remain = h.spinnerImpactUntil - now;
        const fade = Math.max(0, Math.min(1, remain / 200));
        const strength = Math.max(0.2, Math.min(1, h.spinnerImpactStrength || 0.6));
        const amp = (0.6 + 1.4 * strength) * fade;
        const ox = (Math.random()*2-1) * amp;
        const oy = (Math.random()*2-1) * amp;
        ctx.save(); ctx.translate(ox, oy); h.draw(ctx); ctx.restore();
      } else {
        h.draw(ctx);
      }
      // Per-horse skill cooldown clock (race mode)
      try {
        const st = h.skillState;
        if (st && st.status === 'cooldown' && typeof st.cooldownUntil === 'number'){
          const cdTotal = Math.max(500, (st.cooldown || 60000));
          const remain = Math.max(0, st.cooldownUntil - now);
          if (remain > 0){
            const frac = Math.max(0, Math.min(1, remain / cdTotal));
            // Icon (race): nhích lên 1 chút và cách tên ra thêm 1 chút
            const cx = h.x + (h.r||10) + 24; // was +22
            const cy = h.y - (h.r||10) - 8;  // was -10
            const R = 8;
            ctx.save();
            ctx.fillStyle = 'rgba(30,30,35,0.65)';
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(220,230,255,0.85)';
            ctx.beginPath(); ctx.arc(cx, cy, R-1, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = 'rgba(3,169,244,0.9)';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            const ang = -Math.PI/2;
            ctx.arc(cx, cy, R-2, ang, ang + (-Math.PI*2*frac), true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      } catch {}
    }
    if (winner){
      ctx.save();
      const msg = `${winner.name} WIN!`;
      ctx.font = "bold 56px system-ui, Arial";
      const w = ctx.measureText(msg).width + 40;
      const h = 70;
      const cx = canvas.width/2, cy = 90;
      const x = cx - w/2, y = cy - h/2;
      // glass-like pill
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      const r = 16;
      ctx.beginPath();
      roundRectPath(x, y, w, h, r);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // title text
      ctx.textAlign = "center";
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      try { ctx.strokeText(msg, cx, cy); } catch {}
      ctx.fillStyle = "#ffca28";
      ctx.fillText(msg, cx, cy);
      ctx.restore();
    }
  }
  if (needTransform){
    // Undo combined transform
    ctx.restore();
    // Vignette overlay (screen-space)
    if (mode === 'play' || usePhoto){
      ctx.save();
      const w = canvas.width, h = canvas.height, cx = w/2, cy = h/2;
      const vg = ctx.createRadialGradient(cx, cy, Math.min(w,h)*0.30, cx, cy, Math.max(w,h)*0.78);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = vg;
      ctx.fillRect(0,0,w,h);
      ctx.restore();
    }
    // GO! overlay with bounce + glow
    if (goFxUntil && performance.now() < goFxUntil){
      const now = performance.now();
      const t = Math.max(0, Math.min(1, (now - goFxStart) / (goFxUntil - goFxStart)));
      // Ease-out bounce-like scale
      const scale = 0.8 + 0.4 * (1 - Math.pow(1 - t, 3));
      const alpha = 1 - t;
      ctx.save();
      ctx.translate(canvas.width/2, canvas.height*0.28);
      ctx.scale(scale, scale);
      // Outer glow
      ctx.save();
      const rg = ctx.createRadialGradient(0,0,12, 0,0,120);
      rg.addColorStop(0, `rgba(255,200,0,${0.35*alpha})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0,0,120,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // Text with soft stroke
      ctx.font = 'bold 100px system-ui, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 10; ctx.strokeStyle = `rgba(0,0,0,${0.5*alpha})`;
      try { ctx.strokeText('GO!', 0, 0); } catch {}
      ctx.fillStyle = `rgba(255,220,100,${Math.max(0, Math.min(1, 0.9*alpha))})`;
      try { ctx.fillText('GO!', 0, 0); } catch {}
      ctx.restore();
    }
    
    // Draw editor hover tooltip
    if (mode === "editor" && editorHoveredItem && !dragging && !selectionRect && typeof editorMouseX !== 'undefined') {
      const type = editorHoveredItem.type;
      const desc = EDITOR_ITEM_DESCRIPTIONS[type];
      if (desc) {
        const x = editorMouseX;
        const y = editorMouseY;
        
        ctx.save();
        ctx.font = "13px system-ui, sans-serif";
        const tm = ctx.measureText(desc);
        const padding = 8;
        const tw = tm.width + padding * 2;
        const th = 28;
        const offset = 16;
        
        // Keep within canvas bounds
        let tx = x + offset;
        let ty = y + offset;
        if (tx + tw > canvas.width) tx = x - tw - offset;
        if (ty + th > canvas.height) ty = y - th - offset;
        
        // Background pill
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = "rgba(20, 20, 25, 0.92)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        // Manual round rect path for compatibility
        const r = 6;
        ctx.moveTo(tx + r, ty);
        ctx.lineTo(tx + tw - r, ty);
        ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + r);
        ctx.lineTo(tx + tw, ty + th - r);
        ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - r, ty + th);
        ctx.lineTo(tx + r, ty + th);
        ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - r);
        ctx.lineTo(tx, ty + r);
        ctx.quadraticCurveTo(tx, ty, tx + r, ty);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(desc, tx + padding, ty + th/2 + 1);
        
        ctx.restore();
      }
    }
  }
}

let last = performance.now();
// Guarded RAF control to ensure only ONE main loop runs
let _rafActive = false;
let _rafHandle = 0;

// Per-frame animated airflow overlay for fans (visual only)
function drawFanAirflowOverlay(){
  try {
    const arr = mapDef.fans || [];
    if (!arr.length) return;
    const t = performance.now() / 1000;
    ctx.save();
    // Slight additive blending for glow
    const oldGCO = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    for (const f of arr){
      const x = f.x, y = f.y;
      const r = Math.max(10, f.r || 120);
      const ang = f.angle || 0;
      const spread = Math.max(1e-3, f.spread || (Math.PI/3));
      const flowSpeed = (typeof f.flowSpeed === 'number' && isFinite(f.flowSpeed)) ? f.flowSpeed : 140; // px/s
      const lineCount = Math.max(6, Math.min(24, (typeof f.flowLines === 'number' ? f.flowLines : 10)));
      const lineLen = Math.max(12, Math.min(r * 0.25, 28));
      ctx.strokeStyle = 'rgba(120, 180, 255, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < lineCount; i++){
        // Stable pseudo-random offset within cone
        const h = (Math.sin(i * 12.9898) * 43758.5453);
        const rand = h - Math.floor(h);
        const aOff = (rand - 0.5) * (spread * 0.85);
        const a = ang + aOff;
        // Advance along radius over time
        const phase = (i * (r / lineCount)) + (t * flowSpeed);
        const baseS = (phase % (r * 0.95));
        const s1 = Math.max(6, baseS);
        const s2 = Math.min(r * 0.98, s1 + lineLen);
        // Gentle waviness perpendicular to flow
        const wob = Math.sin(t * 2.0 + i * 0.7) * Math.max(0.0, 0.02 * r);
        const nx = Math.cos(a + Math.PI/2), ny = Math.sin(a + Math.PI/2);
        const x1 = x + Math.cos(a) * s1 + nx * wob;
        const y1 = y + Math.sin(a) * s1 + ny * wob;
        const x2 = x + Math.cos(a) * s2 + nx * wob;
        const y2 = y + Math.sin(a) * s2 + ny * wob;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = oldGCO;
    ctx.restore();
  } catch {}
}
function startMainLoop(){
  if (_rafActive) return;
  _rafActive = true;
  _rafHandle = requestAnimationFrame(loop);
}
function stopMainLoop(){
  if (!_rafActive) return;
  cancelAnimationFrame(_rafHandle);
  _rafActive = false;
}

// Expose functions for external modules (e.g., text-walls.js)
window.invalidateStaticLayer = invalidateStaticLayer;
window.drawMap = drawMap;
window.startMainLoop = startMainLoop;
window.stopMainLoop = stopMainLoop;

function loop(now){
  updateFPS(); // Track FPS
  if (paused) { _rafHandle = requestAnimationFrame(loop); return; }
  const raw = now - last;
  last = now;
  // Cap dt to ~33ms to avoid simulation bursts when tab lags
  let dt = Math.min(raw, 1000/30) / 16.6667;
  dt *= runtimeSpeed;

  const t0 = performance.now();
  // Only run step() in play mode when race is actually running
  if (mode === 'play' && running) {
    step(dt);
  }
  render();
  // Draw animated fan airflow on top each frame so it moves even when static layer is cached
  try { drawFanAirflowOverlay(); } catch {}

// Update FPS in HUD (~5 Hz)
if (typeof fpsHudEl !== 'undefined' && fpsHudEl) {
  // Use actual frame duration from RAF timestamp (raw)
  fpsAccum += raw;
  fpsCount++;
  const nowTs = now;
  if (!fpsStamp) fpsStamp = nowTs;
  if (nowTs - fpsStamp >= 200) {
    const avgFrameMs = fpsAccum / Math.max(1, fpsCount);
    const fpsNow = Math.max(1, Math.round(1000 / avgFrameMs));
    fpsAccum = 0; fpsCount = 0; fpsStamp = nowTs;
    try {
      fpsHudEl.textContent = `${fpsNow} fps`;
    } catch {}
  }
}
  _rafHandle = requestAnimationFrame(loop);
}

// ===== Editor interactions =====
let dragging = null, selected = null;
let selectedObjects = []; // Multi-selection array
let selectionRect = null; // { x0, y0, x1, y1 } for area selection

// Nebula Context Settings - Auto-generated v6.0

// Initialize Nebula settings
if (!mapDef.nebulaSettings) {
  mapDef.nebulaSettings = {
    speedMultiplier: 2.5,
    durationMs: 4000,
    damage: 20,
    radius: 16,
    particleEnabled: true,
    glowEnabled: true,
    intensity: 1
  };
}

// Update Nebula setting
function updateNebulaSetting(key, value) {
  if (!mapDef.nebulaSettings) {
    mapDef.nebulaSettings = {};
  }
  
  // Convert string values to appropriate types
  if (typeof value === 'string' && !isNaN(value)) {
    value = parseFloat(value);
  }
  
  mapDef.nebulaSettings[key] = value;
  
  // Update display value for range inputs
  const displayElement = document.getElementById('nebula' + key + 'Value');
  if (displayElement) {
    displayElement.textContent = value;
  }
  
  // Real-time preview update
  try {
    invalidateStaticLayer();
    drawMap();
  } catch (error) {
    console.warn('Could not update preview:', error);
  }
  
  console.log(`[Nebula] Updated ${key} to ${value}`);
}

// Apply Nebula settings
function applyNebulaSettings() {
  try {
    // Force redraw
    invalidateStaticLayer();
    drawMap();
    
    // Update existing power-ups with new settings
    if (mapDef.nebulas) {
      mapDef.nebulas.forEach(item => {
        Object.assign(item, mapDef.nebulaSettings);
      });
    }
    
    console.log(`[Nebula] Settings applied successfully`);
    showToast('Nebula settings applied!', 'success');
  } catch (error) {
    console.error('Failed to apply settings:', error);
    showToast('Failed to apply settings!', 'error');
  }
}

// Reset Nebula settings to defaults
function resetNebulaSettings() {
  const defaults = {
    speedMultiplier: 2.5,
    durationMs: 4000,
    damage: 20,
    radius: 16,
    particleEnabled: true,
    glowEnabled: true,
    intensity: 1
  };
  
  mapDef.nebulaSettings = { ...defaults };
  
  // Update UI controls
  const speedMultiplierInput = document.getElementById('nebulaspeedMultiplier');
  const speedMultiplierDisplay = document.getElementById('nebulaspeedMultiplierValue');
  if (speedMultiplierInput) speedMultiplierInput.value = 2.5;
  if (speedMultiplierDisplay) speedMultiplierDisplay.textContent = 2.5;
  const durationMsInput = document.getElementById('nebuladurationMs');
  const durationMsDisplay = document.getElementById('nebuladurationMsValue');
  if (durationMsInput) durationMsInput.value = 4000;
  if (durationMsDisplay) durationMsDisplay.textContent = 4000;
  const damageInput = document.getElementById('nebuladamage');
  const damageDisplay = document.getElementById('nebuladamageValue');
  if (damageInput) damageInput.value = 20;
  if (damageDisplay) damageDisplay.textContent = 20;
  const radiusInput = document.getElementById('nebularadius');
  const radiusDisplay = document.getElementById('nebularadiusValue');
  if (radiusInput) radiusInput.value = 16;
  if (radiusDisplay) radiusDisplay.textContent = 16;
  const particleEnabledInput = document.getElementById('nebulaparticleEnabled');
  if (particleEnabledInput) particleEnabledInput.checked = true;
  const glowEnabledInput = document.getElementById('nebulaglowEnabled');
  if (glowEnabledInput) glowEnabledInput.checked = true;
  const intensityInput = document.getElementById('nebulaintensity');
  const intensityDisplay = document.getElementById('nebulaintensityValue');
  if (intensityInput) intensityInput.value = 1;
  if (intensityDisplay) intensityDisplay.textContent = 1;
  
  // Apply reset settings
  applyNebulaSettings();
  
  console.log(`[Nebula] Settings reset to defaults`);
  showToast('Nebula settings reset!', 'info');
}

// Export Nebula settings
function exportNebulaSettings() {
  const settings = JSON.stringify(mapDef.nebulaSettings, null, 2);
  
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(settings).then(() => {
      showToast('Settings copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy settings!', 'error');
    });
  } else {
    // Fallback: show in alert
    alert('Nebula Settings:\n\n' + settings);
  }
  
  console.log(`[Nebula] Exported settings:`, mapDef.nebulaSettings);
}

// Load Nebula preset
function loadNebulaPreset(presetName) {
  const presets = {
  "weak": {
    "speedMultiplier": 1.3,
    "durationMs": 2000,
    "damage": 10,
    "radius": 12,
    "particleEnabled": false,
    "glowEnabled": false,
    "intensity": 0.5
  },
  "normal": {
    "speedMultiplier": 2.5,
    "durationMs": 4000,
    "damage": 20,
    "radius": 16,
    "particleEnabled": true,
    "glowEnabled": true,
    "intensity": 1
  },
  "strong": {
    "speedMultiplier": 4.0,
    "durationMs": 6000,
    "damage": 40,
    "radius": 24,
    "particleEnabled": true,
    "glowEnabled": true,
    "intensity": 2
  },
  "extreme": {
    "speedMultiplier": 5.0,
    "durationMs": 8000,
    "damage": 60,
    "radius": 32,
    "particleEnabled": true,
    "glowEnabled": true,
    "intensity": 3
  }
};
  
  if (presets[presetName]) {
    mapDef.nebulaSettings = { ...presets[presetName] };
    
    // Update UI
    const speedMultiplierInput = document.getElementById('nebulaspeedMultiplier');
    const speedMultiplierDisplay = document.getElementById('nebulaspeedMultiplierValue');
    if (speedMultiplierInput && presets[presetName].speedMultiplier !== undefined) {
      speedMultiplierInput.value = presets[presetName].speedMultiplier;
      if (speedMultiplierDisplay) speedMultiplierDisplay.textContent = presets[presetName].speedMultiplier;
    }
    const durationMsInput = document.getElementById('nebuladurationMs');
    const durationMsDisplay = document.getElementById('nebuladurationMsValue');
    if (durationMsInput && presets[presetName].durationMs !== undefined) {
      durationMsInput.value = presets[presetName].durationMs;
      if (durationMsDisplay) durationMsDisplay.textContent = presets[presetName].durationMs;
    }
    const damageInput = document.getElementById('nebuladamage');
    const damageDisplay = document.getElementById('nebuladamageValue');
    if (damageInput && presets[presetName].damage !== undefined) {
      damageInput.value = presets[presetName].damage;
      if (damageDisplay) damageDisplay.textContent = presets[presetName].damage;
    }
    const radiusInput = document.getElementById('nebularadius');
    const radiusDisplay = document.getElementById('nebularadiusValue');
    if (radiusInput && presets[presetName].radius !== undefined) {
      radiusInput.value = presets[presetName].radius;
      if (radiusDisplay) radiusDisplay.textContent = presets[presetName].radius;
    }
    const particleEnabledInput = document.getElementById('nebulaparticleEnabled');
    if (particleEnabledInput && presets[presetName].particleEnabled !== undefined) {
      particleEnabledInput.checked = presets[presetName].particleEnabled;
    }
    const glowEnabledInput = document.getElementById('nebulaglowEnabled');
    if (glowEnabledInput && presets[presetName].glowEnabled !== undefined) {
      glowEnabledInput.checked = presets[presetName].glowEnabled;
    }
    const intensityInput = document.getElementById('nebulaintensity');
    const intensityDisplay = document.getElementById('nebulaintensityValue');
    if (intensityInput && presets[presetName].intensity !== undefined) {
      intensityInput.value = presets[presetName].intensity;
      if (intensityDisplay) intensityDisplay.textContent = presets[presetName].intensity;
    }
    
    // Apply preset
    applyNebulaSettings();
    
    console.log(`[Nebula] Loaded preset: ${presetName}`);
    showToast(`Loaded ${presetName} preset!`, 'info');
  } else {
    console.warn(`[Nebula] Preset not found: ${presetName}`);
    showToast('Preset not found!', 'error');
  }
}

// Show context panel for Nebula
function showNebulaContextPanel() {
  const panel = document.getElementById('nebulaContextPanel');
  if (panel) {
    panel.style.display = 'block';
    
    // Update UI with current values
    const speedMultiplierInput = document.getElementById('nebulaspeedMultiplier');
    const speedMultiplierDisplay = document.getElementById('nebulaspeedMultiplierValue');
    const speedMultiplierValue = mapDef.nebulaSettings?.speedMultiplier || 2.5;
    if (speedMultiplierInput) speedMultiplierInput.value = speedMultiplierValue;
    if (speedMultiplierDisplay) speedMultiplierDisplay.textContent = speedMultiplierValue;
    const durationMsInput = document.getElementById('nebuladurationMs');
    const durationMsDisplay = document.getElementById('nebuladurationMsValue');
    const durationMsValue = mapDef.nebulaSettings?.durationMs || 4000;
    if (durationMsInput) durationMsInput.value = durationMsValue;
    if (durationMsDisplay) durationMsDisplay.textContent = durationMsValue;
    const damageInput = document.getElementById('nebuladamage');
    const damageDisplay = document.getElementById('nebuladamageValue');
    const damageValue = mapDef.nebulaSettings?.damage || 20;
    if (damageInput) damageInput.value = damageValue;
    if (damageDisplay) damageDisplay.textContent = damageValue;
    const radiusInput = document.getElementById('nebularadius');
    const radiusDisplay = document.getElementById('nebularadiusValue');
    const radiusValue = mapDef.nebulaSettings?.radius || 16;
    if (radiusInput) radiusInput.value = radiusValue;
    if (radiusDisplay) radiusDisplay.textContent = radiusValue;
    const particleEnabledInput = document.getElementById('nebulaparticleEnabled');
    const particleEnabledValue = mapDef.nebulaSettings?.particleEnabled;
    if (particleEnabledInput) particleEnabledInput.checked = particleEnabledValue !== undefined ? particleEnabledValue : true;
    const glowEnabledInput = document.getElementById('nebulaglowEnabled');
    const glowEnabledValue = mapDef.nebulaSettings?.glowEnabled;
    if (glowEnabledInput) glowEnabledInput.checked = glowEnabledValue !== undefined ? glowEnabledValue : true;
    const intensityInput = document.getElementById('nebulaintensity');
    const intensityDisplay = document.getElementById('nebulaintensityValue');
    const intensityValue = mapDef.nebulaSettings?.intensity || 1;
    if (intensityInput) intensityInput.value = intensityValue;
    if (intensityDisplay) intensityDisplay.textContent = intensityValue;
  }
}

// Hide context panel
function hideContextPanel() {
  const panels = document.querySelectorAll('.context-panel');
  panels.forEach(panel => panel.style.display = 'none');
}

// Toast notification system
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;
  
  switch (type) {
    case 'success': toast.style.background = '#38a169'; break;
    case 'error': toast.style.background = '#e53e3e'; break;
    case 'info': toast.style.background = '#3182ce'; break;
    default: toast.style.background = '#4a5568';
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add CSS for toast animations
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

const toolButtons = document.querySelectorAll('.tool-selector .tool');
toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Angle UI will be controlled based on selected object, not tool button
    toolButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Use the global `tool` variable everywhere
    tool = btn.dataset.tool;
    
    // Set selected for power-up tools to enable context menu
    if (['warpzone', 'quantumdash', 'yellowheart',    'nebula', 'magnet', 'turbo', 'shield', 'timefreeze', 'teleport', 'boost', 'ghost', 'poison', 'tornado', 'volcano'].includes(tool)) {
      selected = { type: tool };
    } else {
      // Clear selected for non-power-up tools
      if (selected && ['warpzone', 'quantumdash', 'nebula', 'magnet', 'turbo', 'shield', 'timefreeze', 'teleport', 'boost', 'ghost', 'poison', 'tornado', 'volcano'].includes(selected.type)) {
        selected = null;
      }
    }
    
    // Reset drafts when switching tools
    wallDraft = pipeDraft = semiDraft = arcDraft = brushDraft = beltDraft = onewayDraft = padDraft = null;
    ebrushDraft = null;
    // Toggle contextual inspectors
    if (typeof showBumperInspector === 'function') showBumperInspector(tool==='bumper' || (selected && selected.type==='bumper'));
    if (typeof showFanInspector === 'function') showFanInspector(tool==='fan' || (selected && selected.type==='fan'));
  });
});
let wallDraft = null, pipeDraft = null, semiDraft = null, arcDraft = null, beltDraft = null;
let onewayDraft = null, padDraft = null;
let brushDraft = null;
let ebrushDraft = null;
function snapVal(v){ const g = parseInt(gridEl?.value || 20, 10); return Math.round(v/g)*g; }
function nearGhost(mx,my){
  for (let i=0; i<(mapDef.ghosts||[]).length; i++){
    const g = mapDef.ghosts[i];
    if (Math.hypot(mx-g.x, my-g.y) < g.r) return i;
  }
  return -1;
}

// Power-up collision detection functions - MOVED TO: scripts/editor/powerup-collision.js
// Access via: window.PowerupCollision or window.nearBoost(), nearTurbo(), nearShield(), etc. for compatibility

function nearCarrot(mx,my){
  for (let i=0; i<(mapDef.carrots||[]).length; i++){
    const c = mapDef.carrots[i];
    const r = (typeof c.r === 'number' && isFinite(c.r)) ? c.r : 18;
    if (Math.hypot(mx-c.x, my-c.y) < r + 8) return i;
  }
  return -1;
}

function nearSpinner(mx,my){
  for (let i=0; i<(mapDef.spinners||[]).length; i++){
    const s = mapDef.spinners[i];
    const w = s.w || 80, h = s.h || 20;
    // Check if mouse is within spinner bounding box
    const dx = Math.abs(mx - s.x);
    const dy = Math.abs(my - s.y);
    if (dx < w/2 + 10 && dy < h/2 + 10) return i;
  }
  return -1;
}

// nearLightning, nearVolcano, nearTornado, nearShield - MOVED TO: scripts/editor/powerup-collision.js

function nearBelt(mx, my){
  const belts = mapDef.belts || [];
  for (let i = belts.length - 1; i >= 0; i--){
    const b = belts[i];
    const {x,y,w,h} = b;
    const cx = x + w/2, cy = y + h/2;
    const dx = mx - cx, dy = my - cy;
    const hw = w/2 + 6, hh = h/2 + 6; // small margin
    if (Math.abs(dx) <= hw && Math.abs(dy) <= hh) return i;
  }
  return -1;
}

function nearTrap(mx,my){
  for (let i=0; i<(mapDef.traps||[]).length; i++){
    const t = mapDef.traps[i];
    if (Math.hypot(mx-t.x, my-t.y) < (t.r || 15)) return i;
  }
  return -1;
}

// Missing near functions for complete selection support
function nearShield(mx,my){
  for (let i=0; i<(mapDef.shields||[]).length; i++){
    const s = mapDef.shields[i];
    if (Math.hypot(mx-s.x, my-s.y) < (s.r || 15)) return i;
  }
  return -1;
}

function nearRam(mx,my){
  for (let i=0; i<(mapDef.rams||[]).length; i++){
    const r = mapDef.rams[i];
    if (Math.hypot(mx-r.x, my-r.y) < (r.r || 15)) return i;
  }
  return -1;
}

function nearMud(mx,my){
  for (let i=0; i<(mapDef.mudPatches||[]).length; i++){
    const m = mapDef.mudPatches[i];
    if (Math.hypot(mx-m.x, my-m.y) < (m.r || 30)) return i;
  }
  return -1;
}

function nearBoost(mx,my){
  for (let i=0; i<(mapDef.boosts||[]).length; i++){
    const b = mapDef.boosts[i];
    if (Math.hypot(mx-b.x, my-b.y) < (b.r || 15)) return i;
  }
  return -1;
}

function nearTurbo(mx,my){
  for (let i=0; i<(mapDef.turbos||[]).length; i++){
    const t = mapDef.turbos[i];
    if (Math.hypot(mx-t.x, my-t.y) < (t.r || 15)) return i;
  }
  return -1;
}

function nearPoison(mx,my){
  for (let i=0; i<(mapDef.poisons||[]).length; i++){
    const p = mapDef.poisons[i];
    if (Math.hypot(mx-p.x, my-p.y) < (p.r || 15)) return i;
  }
  return -1;
}

function nearTornado(mx,my){
  for (let i=0; i<(mapDef.tornados||[]).length; i++){
    const t = mapDef.tornados[i];
    if (Math.hypot(mx-t.x, my-t.y) < (t.r || 40)) return i;
  }
  return -1;
}

function nearVolcano(mx,my){
  for (let i=0; i<(mapDef.volcanos||[]).length; i++){
    const v = mapDef.volcanos[i];
    if (Math.hypot(mx-v.x, my-v.y) < (v.r || 40)) return i;
  }
  return -1;
}

function nearWarpzone(mx,my){
  for (let i=0; i<(mapDef.warpzones||[]).length; i++){
    const w = mapDef.warpzones[i];
    if (Math.hypot(mx-w.x, my-w.y) < (w.r || 20)) return i;
  }
  return -1;
}

function nearQuantumdash(mx,my){
  for (let i=0; i<(mapDef.quantumdashs||[]).length; i++){
    const q = mapDef.quantumdashs[i];
    if (Math.hypot(mx-q.x, my-q.y) < (q.r || 15)) return i;
  }
  return -1;
}

function nearYellowheart(mx,my){
  for (let i=0; i<(mapDef.yellowhearts||[]).length; i++){
    const y = mapDef.yellowhearts[i];
    if (Math.hypot(mx-y.x, my-y.y) < (y.r || 15)) return i;
  }
  return -1;
}

function nearLightning(mx,my){
  for (let i=0; i<(mapDef.lightnings||[]).length; i++){
    const l = mapDef.lightnings[i];
    if (Math.hypot(mx-l.x, my-l.y) < (l.r || 15)) return i;
  }
  return -1;
}

function nearTeleport(mx,my){
  for (let i=0; i<(mapDef.teleports||[]).length; i++){
    const t = mapDef.teleports[i];
    if (Math.hypot(mx-t.x, my-t.y) < (t.r || 20)) return i;
  }
  return -1;
}

function nearMagnet(mx,my){
  for (let i=0; i<(mapDef.magnets||[]).length; i++){
    const m = mapDef.magnets[i];
    if (Math.hypot(mx-m.x, my-m.y) < (m.r || 15)) return i;
  }
  return -1;
}

function nearTimeFreeze(mx,my){
  for (let i=0; i<(mapDef.timeFreezes||[]).length; i++){
    const t = mapDef.timeFreezes[i];
    if (Math.hypot(mx-t.x, my-t.y) < (t.r || 15)) return i;
  }
  return -1;
}

function nearMagnetpush(mx,my){
  for (let i=0; i<(mapDef.magnetpushs||[]).length; i++){
    const m = mapDef.magnetpushs[i];
    if (Math.hypot(mx-m.x, my-m.y) < (m.r || 15)) return i;
  }
  return -1;
}

function nearMagnetpull(mx,my){
  for (let i=0; i<(mapDef.magnetpulls||[]).length; i++){
    const m = mapDef.magnetpulls[i];
    if (Math.hypot(mx-m.x, my-m.y) < (m.r || 15)) return i;
  }
  return -1;
}

function nearSpawn(mx,my){ const R=14; for (let i=mapDef.spawnPoints.length-1;i>=0;i--){ const s=mapDef.spawnPoints[i]; if (Math.hypot(mx-s.x,my-s.y)<=R) return i; } return -1; }
function pickPipeIndex(mx,my){ for (let i=mapDef.pipes.length-1;i>=0;i--){ const p=mapDef.pipes[i]; const {d}=pointSegDist(mx,my,p.x1,p.y1,p.x2,p.y2); if (d<=p.r+6) return i; } return -1; }
function pickSemiIndex(mx,my){ for (let i=mapDef.semis.length-1;i>=0;i--){ const s=mapDef.semis[i]; if (Math.hypot(mx-s.x,my-s.y)<=s.r+8) return i; } return -1; }
function pickArcIndex(mx,my){ for (let i=mapDef.arcs.length-1;i>=0;i--){ const a=mapDef.arcs[i]; const d=Math.hypot(mx-a.x,my-a.y); if (Math.abs(d-a.r) <= (a.thick/2 + 10)) return i; } return -1; }
function pickBrushIndex(mx,my){ 
  for (let bi=mapDef.brushes.length-1; bi>=0; bi--){ 
    const b=mapDef.brushes[bi]; 
    const r=b.r || 10;
    
    // Check if merged text with segments
    if (b.segments && Array.isArray(b.segments)) {
      // Check all segments
      for (const pts of b.segments) {
        if (!pts || pts.length < 2) continue;
        for (let i=0;i<pts.length-1;i++){ 
          const {d}=pointSegDist(mx,my, pts[i].x,pts[i].y, pts[i+1].x,pts[i+1].y); 
          if (d<=r+8) return bi; 
        }
      }
    } else {
      // Normal brush - check main points array
      const pts=b.points;
      if (!pts || pts.length < 2) continue;
      
      // Text brushes and regular brushes both use line segment detection
      for (let i=0;i<pts.length-1;i++){ 
        const {d}=pointSegDist(mx,my, pts[i].x,pts[i].y, pts[i+1].x,pts[i+1].y); 
        if (d<=r+8) return bi; 
      }
    }
  } 
  return -1; 
}
function addBrushPoint(points, x, y, step){ const last = points[points.length-1]; if (!last || Math.hypot(x-last.x, y-last.y) >= step) points.push({x,y}); }

// --- Partial erase for Brush Walls --- //
function cutBrushAtCircle(bi, cx, cy, rr){
  const b = mapDef.brushes[bi]; 
  if (!b) return false;
  
  const br = b.r;
  
  // Handle merged text with segments
  if (b.segments && Array.isArray(b.segments) && b.segments.length > 0) {
    const newSegments = [];
    let anyHit = false;
    
    for (const pts of b.segments) {
      if (!pts || pts.length < 2) continue;
      
      const n = pts.length;
      const cut = new Array(n-1).fill(false);
      
      // Check which segments are hit
      for (let i=0;i<n-1;i++){
        const p1 = pts[i], p2 = pts[i+1];
        const {d} = pointSegDist(cx,cy, p1.x,p1.y, p2.x,p2.y);
        if (d <= rr + br) {
          cut[i] = true;
          anyHit = true;
        }
      }
      
      // Split this segment if hit
      if (cut.some(v=>v)) {
        let cur = [pts[0]];
        for (let i=0;i<n-1;i++){
          if (cut[i]){
            if (cur.length>=2) newSegments.push(cur.slice());
            cur = [pts[i+1]];
          } else {
            cur.push(pts[i+1]);
          }
        }
        if (cur.length>=2) newSegments.push(cur.slice());
      } else {
        // Keep segment unchanged
        newSegments.push(pts);
      }
    }
    
    if (!anyHit) return false;
    
    // Update brush with new segments
    if (newSegments.length === 0) {
      // All segments erased - delete brush
      mapDef.brushes.splice(bi, 1);
    } else {
      b.segments = newSegments;
      b._bbox = null;
      b._cachedPath2D = null;
    }
    return true;
  }
  
  // Normal brush - original logic
  if (!b.points || b.points.length<2) return false;
  const pts = b.points;
  const n = pts.length;
  const cut = new Array(n-1).fill(false);
  for (let i=0;i<n-1;i++){
    const p1 = pts[i], p2 = pts[i+1];
    const {d} = pointSegDist(cx,cy, p1.x,p1.y, p2.x,p2.y);
    if (d <= rr + br) cut[i] = true;
  }
  if (!cut.some(v=>v)) return false;
  const newStrokes = [];
  let cur = [pts[0]];
  for (let i=0;i<n-1;i++){
    if (cut[i]){
      if (cur.length>=2) newStrokes.push({r:br, points:cur.slice()});
      cur = [pts[i+1]];
    } else {
      cur.push(pts[i+1]);
    }
  }
  if (cur.length>=2) newStrokes.push({r:br, points:cur.slice()});

  // Preserve metadata from original stroke for all fragments
  const withMeta = newStrokes.map(s => {
    const frag = { r: s.r, points: s.points, color: b.color };
    if (b.type === 'break'){
      frag.type = 'break';
      frag.hp = (typeof b.hp==='number') ? b.hp : parseInt(b.hp||'8',10) || 8;
      frag.onBreak = b.onBreak || 'shards';
    } else if (b.type === 'soft'){
      frag.type = 'soft';
      frag.stiffness = (typeof b.stiffness==='number') ? b.stiffness : 0.25;
      frag.maxDeform = (typeof b.maxDeform==='number') ? b.maxDeform : 18;
      frag.recover = (typeof b.recover==='number') ? b.recover : 24;
      // original snapshot will be lazily created during collision step
    }
    return frag;
  });

  // Replace original by first, insert rest (or delete if none)
  mapDef.brushes.splice(bi,1, ...withMeta);
  return true;
}

function applyEraserStroke(stroke){
  if (!stroke || !stroke.points || stroke.points.length<1) return;
  try { pushHistory('eraser'); } catch {}
  const r = stroke.r;
  function anyPoint(fn){ for(const p of stroke.points){ if (fn(p)) return true; } return false; }

  // Rect walls (delete whole)
  for (let i=mapDef.walls.length-1; i>=0; i--){
    const w = mapDef.walls[i];
    const hit = anyPoint(p => circleRectCollide(p.x,p.y,r, w.x,w.y,w.w,w.h,w.r||12).hit);
    if (hit) mapDef.walls.splice(i,1);
  }
  // Pipes (delete whole)
  for (let i=mapDef.pipes.length-1; i>=0; i--){
    const p0 = mapDef.pipes[i];
    const hit = anyPoint(p => circleCapsuleCollide(p.x,p.y,r, p0.x1,p0.y1,p0.x2,p0.y2,p0.r).hit);
    if (hit) mapDef.pipes.splice(i,1);
  }
  // Semis
  for (let i=mapDef.semis.length-1; i>=0; i--){
    const s = mapDef.semis[i];
    const hit = anyPoint(p => circleSemiCollide(p.x,p.y,r, s.x,s.y,s.r,s.angle||0).hit);
    if (hit) mapDef.semis.splice(i,1);
  }
  // Arcs
  for (let i=mapDef.arcs.length-1; i>=0; i--){
    const a = mapDef.arcs[i];
    const hit = anyPoint(p => circleArcCollide(p.x,p.y,r, a.x,a.y,a.r,a.thick,a.angle||0,a.span||Math.PI).hit);
    if (hit) mapDef.arcs.splice(i,1);
  }
  // Boosts (delete whole)
  for (let i = mapDef.boosts.length - 1; i >= 0; i--) {
    const b = mapDef.boosts[i];
    const hit = anyPoint(p => Math.hypot(p.x - b.x, p.y - b.y) < r + b.r);
    if (hit) mapDef.boosts.splice(i, 1);
  }

  // Turbos (delete whole)
  if (Array.isArray(mapDef.turbos)){
    for (let i = mapDef.turbos.length - 1; i >= 0; i--) {
      const t = mapDef.turbos[i];
      const hit = anyPoint(p => Math.hypot(p.x - t.x, p.y - t.y) < r + t.r);
      if (hit) mapDef.turbos.splice(i, 1);
    }
  }

  // Ghosts (delete whole)
  for (let i = mapDef.ghosts.length - 1; i >= 0; i--) {
    const g = mapDef.ghosts[i];
    const hit = anyPoint(p => Math.hypot(p.x - g.x, p.y - g.y) < r + g.r);
    if (hit) mapDef.ghosts.splice(i, 1);
  }

  // Rams (delete whole)
  for (let i = mapDef.rams.length - 1; i >= 0; i--) {
    const r = mapDef.rams[i];
    const hit = anyPoint(p => Math.hypot(p.x - r.x, p.y - r.y) < r.r);
    if (hit) mapDef.rams.splice(i, 1);
  }

  // Shields (delete whole)
  for (let i = mapDef.shields.length - 1; i >= 0; i--) {
    const s = mapDef.shields[i];
    const hit = anyPoint(p => Math.hypot(p.x - s.x, p.y - s.y) < r + s.r);
    if (hit) mapDef.shields.splice(i, 1);
  }

  // Bumpers (delete whole)
  for (let i = (mapDef.bumpers||[]).length - 1; i >= 0; i--) {
    const b = mapDef.bumpers[i];
    const br = Math.max(6, b.r || 22);
    const hit = anyPoint(p => Math.hypot(p.x - b.x, p.y - b.y) < r + br);
    if (hit) mapDef.bumpers.splice(i, 1);
  }

  // Belts (delete whole) - consider rotation
  if (Array.isArray(mapDef.belts)){
    for (let i = mapDef.belts.length - 1; i >= 0; i--) {
      const b = mapDef.belts[i];
      const hit = anyPoint(p => rectPointDist(p.x, p.y, b.x, b.y, b.w, b.h, b.angle || 0) < r);
      if (hit) mapDef.belts.splice(i, 1);
    }
  }

function rectPointDist(px, py, rx, ry, w, h, angle) {
  const cx = rx + w / 2;
  const cy = ry + h / 2;
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const rotX = dx * cos - dy * sin;
  const rotY = dx * sin + dy * cos;
  const halfW = w / 2;
  const halfH = h / 2;
  const clampedX = Math.max(-halfW, Math.min(halfW, rotX));
  const clampedY = Math.max(-halfH, Math.min(halfH, rotY));
  const closestX = rotX - clampedX;
  const closestY = rotY - clampedY;
  return Math.hypot(closestX, closestY);
}

  // Spinners (delete whole)
  for (let i = mapDef.spinners.length - 1; i >= 0; i--) {
    const s = mapDef.spinners[i];
    const hit = anyPoint(p => rectPointDist(p.x, p.y, s.x, s.y, s.w, s.h, s.angle) < r);
    if (hit) mapDef.spinners.splice(i, 1);
  }

  // Fans (delete whole)
  if (Array.isArray(mapDef.fans)){
    for (let i = mapDef.fans.length - 1; i >= 0; i--){
      const f = mapDef.fans[i];
      const rr = Math.max(10, f.r || 120);
      const hit = anyPoint(p => Math.hypot(p.x - f.x, p.y - f.y) <= rr + r);
      if (hit) mapDef.fans.splice(i, 1);
    }
  }

  // Brush strokes: partial erase by splitting
  for (const p of stroke.points){
    // we iterate backwards because array mutates
    for (let bi=mapDef.brushes.length-1; bi>=0; bi--){
      cutBrushAtCircle(bi, p.x, p.y, r);
    }
  }

  // Redraw after eraser modifications
  try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{}
}

canvas.addEventListener('mousedown', (e)=>{
  if (mode!=="editor") return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX-rect.left)*(canvas.width/rect.width);
  const my = (e.clientY-rect.top)*(canvas.height/rect.height);

if (tool === 'text' && e.button === 0) {
  // Show text walls dialog
  if (typeof window.showTextWallsDialog === 'function') {
    window.showTextWallsDialog(mx, my);
  }
  return;
}

if (tool === 'nebula' && e.button === 0) {
  if (nearNebula(mx, my) === -1) {
    try { pushHistory('add_nebula'); } catch {}
    if (!Array.isArray(mapDef.nebulas)) mapDef.nebulas = [];
    const settings = mapDef.nebulaSettings || {};
    mapDef.nebulas.push({ 
      x: snapVal(mx), 
      y: snapVal(my), 
      r: settings.radius || 16,
      speedMultiplier: settings.speedMultiplier || 2.5,
      duration: settings.durationMs || 4000,
      damage: settings.damage || 20,
      particleEnabled: settings.particleEnabled !== false,
      glowEnabled: settings.glowEnabled !== false,
      intensity: settings.intensity || 1,
      consumable: settings.consumable || false
    });
    try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
  }
  return;
}

if (tool === 'firetrap' && e.button === 0) {
  if (nearFiretrap(mx, my) === -1) {
    try { pushHistory('add_firetrap'); } catch {}
    const savedRadius = parseInt(localStorage.getItem('firetrap_radius')) || 50;
    const savedDamage = parseInt(localStorage.getItem('firetrap_damage')) || 10;
    mapDef.firetrap.push({ x: snapVal(mx), y: snapVal(my), r: savedRadius, damage: savedDamage });
  }
  invalidateStaticLayer();
  drawMap();
  return;
}

  if (tool==="wall"){ wallDraft = { x0: snapVal(mx), y0: snapVal(my), x1: snapVal(mx), y1: snapVal(my) }; return; }
  if (tool==="belt"){ beltDraft = { x0: snapVal(mx), y0: snapVal(my), x1: snapVal(mx), y1: snapVal(my) }; return; }
if (tool === 'healingzone' && e.button === 0) {
  if (nearHealingzone(mx, my) === -1) {
    try { pushHistory('add_healingzone'); } catch {}
    const savedRadius = parseInt(localStorage.getItem('healingzone_radius')) || 40;
    const savedHealAmount = parseInt(localStorage.getItem('healingzone_healamount')) || 10;
    mapDef.healingzones.push({ x: snapVal(mx), y: snapVal(my), r: savedRadius, healAmount: savedHealAmount });
  }
  invalidateStaticLayer();
  drawMap();
  return;
}

if (tool === 'fireaura' && e.button === 0) {
  if (nearFireaura(mx, my) === -1) {
    try { pushHistory('add_fireaura'); } catch {}
    const savedRadius = parseInt(localStorage.getItem('fireaura_radius')) || 20;
    const savedDamage = parseInt(localStorage.getItem('fireaura_damage')) || 5;
    const savedRange = parseInt(localStorage.getItem('fireaura_range')) || 60;
    const savedDuration = parseInt(localStorage.getItem('fireaura_duration')) || 8000;
    mapDef.fireaura.push({ x: snapVal(mx), y: snapVal(my), r: savedRadius, damage: savedDamage, range: savedRange, duration: savedDuration });
  }
  invalidateStaticLayer();
  drawMap();
  return;
}

  if (tool==="oneway"){ onewayDraft = { x0: snapVal(mx), y0: snapVal(my), x1: snapVal(mx), y1: snapVal(my) }; return; }
  if (tool==="pad"){ padDraft = { x0: snapVal(mx), y0: snapVal(my), x1: snapVal(mx), y1: snapVal(my) }; return; }
  if (tool==="diag"){ pipeDraft = { x1: snapVal(mx), y1: snapVal(my), x2: snapVal(mx), y2: snapVal(my) }; return; }
  if (tool==="semi"){ semiDraft = { cx: snapVal(mx), cy: snapVal(my), r: 0, angle: 0 }; return; }
  if (tool==="arc"){ arcDraft = { cx: snapVal(mx), cy: snapVal(my), r: 0, angle: 0 }; return; }
  if (tool === 'boost' && e.button === 0) {
    if (nearBoost(mx, my) === -1) {
      try { pushHistory('add_boost'); } catch {}
      mapDef.boosts.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }
  
  if (tool === 'teleport' && e.button === 0) {
    if (nearTeleport(mx, my) === -1) {
      try { pushHistory('add_teleport'); } catch {}
      mapDef.teleports.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }
  
  if (tool === 'magnet' && e.button === 0) {
    if (nearMagnet(mx, my) === -1) {
      try { pushHistory('add_magnet'); } catch {}
      mapDef.magnets.push({ x: snapVal(mx), y: snapVal(my), r: 20 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }
  
  if (tool === 'timefreeze' && e.button === 0) {
    if ((window.nearTimeFreeze && window.nearTimeFreeze(mx, my) === -1) || !window.nearTimeFreeze) {
      try { pushHistory('add_timefreeze'); } catch {}
      mapDef.timeFreezes.push({ x: snapVal(mx), y: snapVal(my), r: 16 });
      startMainLoop();
    }
    return;
  }

  if (tool === 'icefreezer' && e.button === 0) {
    if ((window.nearIceFreezer && window.nearIceFreezer(mx, my) === -1) || !window.nearIceFreezer) {
      try { pushHistory('add_icefreezer'); } catch {}
      mapDef.icefreezers.push({ x: snapVal(mx), y: snapVal(my), r: 15 });
      startMainLoop();
    }
    return;
  }
  if (tool === 'testpower' && e.button === 0) {
    if (!mapDef.testpowers) mapDef.testpowers = [];
    // Check if there's already a testpower at this position
    let tooClose = false;
    for (const item of mapDef.testpowers) {
      if (Math.hypot(mx - item.x, my - item.y) < 15) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      try { pushHistory('add_testpower'); } catch {}
      mapDef.testpowers.push({ x: snapVal(mx), y: snapVal(my), r: 15 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }
if (tool === 'poison' && e.button === 0) {
    if (nearPoison(mx, my) === -1) {
      try { pushHistory('add_poison'); } catch {}
      mapDef.poisons.push({ x: snapVal(mx), y: snapVal(my), r: 15 });
      startMainLoop();
    }
    return;
  }

  if (tool === 'shield' && e.button === 0) {
    if (nearShield(mx, my) === -1) {
      try { pushHistory('add_shield'); } catch {}
      if (!Array.isArray(mapDef.shields)) mapDef.shields = [];
      mapDef.shields.push({ x: snapVal(mx), y: snapVal(my), r: 16 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'warpzone' && e.button === 0) {
    if (nearWarpzone(mx, my) === -1) {
      try { pushHistory('add_warpzone'); } catch {}
      if (!Array.isArray(mapDef.warpzones)) mapDef.warpzones = [];
      mapDef.warpzones.push({ x: snapVal(mx), y: snapVal(my), r: 16 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'quantumdash' && e.button === 0) {
    if (nearQuantumdash(mx, my) === -1) {
      try { pushHistory('add_quantumdash'); } catch {}
      if (!Array.isArray(mapDef.quantumdashs)) mapDef.quantumdashs = [];
      mapDef.quantumdashs.push({ x: snapVal(mx), y: snapVal(my), r: 16 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  // [PU-BEGIN name=yellowheart section=editor-click]
  if (tool === 'yellowheart' && e.button === 0) {
    if (nearYellowheart(mx, my) === -1) {
      try { pushHistory('add_yellowheart'); } catch {}
      if (!Array.isArray(mapDef.yellowhearts)) mapDef.yellowhearts = [];
      const settings = mapDef.yellowheartSettings || {};
      mapDef.yellowhearts.push({ 
        x: snapVal(mx), 
        y: snapVal(my), 
        r: settings.radius || 18,
        damage: settings.damage || 25,
        duration: settings.duration || 3000,
        effectType: settings.effectType || 'damage',
        consumable: settings.consumable !== false
      });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }
  // [PU-END name=yellowheart section=editor-click]

  if (tool === 'nebula' && e.button === 0) {
    if (nearNebula(mx, my) === -1) {
      try { pushHistory('add_nebula'); } catch {}
      if (!Array.isArray(mapDef.nebulas)) mapDef.nebulas = [];
      const settings = mapDef.nebulaSettings || {};
      mapDef.nebulas.push({ 
        x: snapVal(mx), 
        y: snapVal(my), 
        r: settings.radius || 16,
        speedMultiplier: settings.speedMultiplier || 2.5,
        duration: settings.durationMs || 4000,
        damage: settings.damage || 20,
        particleEnabled: settings.particleEnabled !== false,
        glowEnabled: settings.glowEnabled !== false,
        intensity: settings.intensity || 1
      });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'nebula' && e.button === 2) {
    // Right-click to open context menu
    e.preventDefault();
    showNebulaContextPanel();
    return;
  }

  if (tool === 'lightning' && e.button === 0) {
    if (nearLightning(mx, my) === -1) {
      try { pushHistory('add_lightning'); } catch {}
      mapDef.lightnings.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'volcano' && e.button === 0) {
    if (nearVolcano(mx, my) === -1) {
      try { pushHistory('add_volcano'); } catch {}
      mapDef.volcanos.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'tornado' && e.button === 0) {
    if (nearTornado(mx, my) === -1) {
      try { pushHistory('add_tornado'); } catch {}
      mapDef.tornados.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'turbo' && e.button === 0) {
    if (!Array.isArray(mapDef.turbos)) mapDef.turbos = [];
    if (nearTurbo(mx, my) === -1) {
      try { pushHistory('add_turbo'); } catch {}
      mapDef.turbos.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'fan' && e.button === 0) {
    if (!Array.isArray(mapDef.fans)) mapDef.fans = [];
    if (nearFan(mx, my) === -1) {
      try { pushHistory('add_fan'); } catch {}
      const fanRadiusEl = document.getElementById('fanRadius');
      const fanAngleEl = document.getElementById('fanAngle');
      const fanSpreadEl = document.getElementById('fanSpread');
      const fanStrengthEl = document.getElementById('fanStrength');
      const r = Math.max(10, parseInt(fanRadiusEl && fanRadiusEl.value, 10) || 120);
      const angDeg = parseInt(fanAngleEl && fanAngleEl.value, 10) || 0;
      const sprDeg = Math.max(1, parseInt(fanSpreadEl && fanSpreadEl.value, 10) || 60);
      const strength = parseFloat(fanStrengthEl && fanStrengthEl.value) || 0.08;
      const angle = (angDeg % 360) * Math.PI / 180;
      const spread = sprDeg * Math.PI / 180;
      mapDef.fans.push({ x: snapVal(mx), y: snapVal(my), r, angle, spread, strength });
      try { render(); startMainLoop(); } catch {}
      return; // only return if we added a new fan
    }
    // If clicking on an existing fan, fall through to selection/rotation logic below
  }

  if (tool === 'ghost' && e.button === 0) {
    if (nearGhost(mx, my) === -1) {
      try { pushHistory('add_ghost'); } catch {}
      mapDef.ghosts.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'trap' && e.button === 0) {
    if (nearTrap(mx, my) === -1) {
      try { pushHistory('add_trap'); } catch {}
      mapDef.traps.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'ram' && e.button === 0) {
    if (nearRam(mx, my) !== -1) {
      try { pushHistory('erase_ram'); } catch {}
      mapDef.rams.splice(nearRam(mx, my), 1);
      drawMap();
      return;
    }

    if (nearRotBarrier(mx, my) !== -1) {
      try { pushHistory('erase_rotbarrier'); } catch {}
      mapDef.rotatingBarriers.splice(nearRotBarrier(mx, my), 1);
      invalidateStaticLayer();
      drawMap();
      return;
    }

    if (nearMagnetpull(mx, my) !== -1) {
      try { pushHistory('erase_magnetpull'); } catch {}
      mapDef.magnetpulls.splice(nearMagnetpull(mx, my), 1);
      invalidateStaticLayer();
      drawMap();
      return;
    }

    if (nearMagnetpush(mx, my) !== -1) {
      try { pushHistory('erase_magnetpush'); } catch {}
      mapDef.magnetpushs.splice(nearMagnetpush(mx, my), 1);
      invalidateStaticLayer();
      drawMap();
      return;
    }

    if (nearRam(mx, my) === -1) {
      try { pushHistory('add_ram'); } catch {}
      mapDef.rams.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
    }
    drawMap();
    return;
  }

  if (tool === 'rotbarrier' && e.button === 0) {
    if (nearRotBarrier(mx, my) === -1) {
      try { pushHistory('add_rotbarrier'); } catch {}
      // Get settings from localStorage or defaults
      const savedSpeed = parseFloat(localStorage.getItem('pendulumSpeed')) || 1.2;
      const savedRange = parseInt(localStorage.getItem('pendulumRange')) || 72;
      const savedLength = parseInt(localStorage.getItem('pendulumLength')) || 150;
      
      mapDef.rotatingBarriers.push({ 
        x: snapVal(mx), 
        y: snapVal(my), 
        length: savedLength, 
        width: 8, 
        angle: 0, 
        swingSpeed: savedSpeed,
        swingRange: savedRange * Math.PI / 180, // Convert degrees to radians
        color: '#4A4A4A', // dark gray
        type: 'pendulum_barrier'
      });
    }
    invalidateStaticLayer();
    drawMap();
    return;
  }

  if (tool === 'magnetpull' && e.button === 0) {
    if (nearMagnetpull(mx, my) === -1) {
      try { pushHistory('add_magnetpull'); } catch {}
      // Get settings from localStorage or defaults
      const savedRadius = parseInt(localStorage.getItem('magnetpull_radius')) || 80;
      const savedStrength = parseFloat(localStorage.getItem('magnetpull_strength')) || 2.0;
      
      mapDef.magnetpulls.push({ 
        x: snapVal(mx), 
        y: snapVal(my),
        radius: savedRadius,
        strength: savedStrength
      });
    }
    invalidateStaticLayer();
    drawMap();
    return;
  }

  if (tool === 'magnetpush' && e.button === 0) {
    if (nearMagnetpush(mx, my) === -1) {
      try { pushHistory('add_magnetpush'); } catch {}
      // Get settings from localStorage or defaults
      const savedRadius = parseInt(localStorage.getItem('magnetpush_radius')) || 80;
      const savedStrength = parseFloat(localStorage.getItem('magnetpush_strength')) || 2.0;
      
      mapDef.magnetpushs.push({ 
        x: snapVal(mx), 
        y: snapVal(my),
        radius: savedRadius,
        strength: savedStrength
      });
    }
    invalidateStaticLayer();
    drawMap();
    return;
  }

  // Remove old mud circle tool - now using brush system

    if (tool === 'spinner' && e.button === 0) {
    if (nearSpinner(mx, my) === -1) { 
    const initialAngle = parseInt(spinnerAngleEl.value, 10) * Math.PI / 180;
    try { pushHistory('add_spinner'); } catch {}
    const initW = spinnerLengthEl ? (parseInt(spinnerLengthEl.value, 10) || 80) : 80;
    mapDef.spinners.push({ x: snapVal(mx), y: snapVal(my), w: initW, h: 20, angle: initialAngle, speed: parseFloat(spinnerSpeedEl.value), color: (shapeColorEl ? shapeColorEl.value : '#9E9E9E') });
    try { render(); startMainLoop(); } catch {}
  }
  return;
  }

  if (tool === 'shield' && e.button === 0) {
    if (nearShield(mx, my) === -1) {
      try { pushHistory('add_shield'); } catch {}
      mapDef.shields.push({ x: snapVal(mx), y: snapVal(my), r: 18 });
      try { render(); startMainLoop(); } catch {}
    }
    return;
  }

  if (tool === 'bumper' && e.button === 0) {
    if (nearBumper(mx, my) === -1) {
      try { pushHistory('add_bumper'); } catch {}
      const r = Math.max(6, parseInt(bumperRadiusEl?.value, 10) || 22);
      const eMul = parseFloat(bumperElasticityEl?.value) || 1.15;
      const n = parseFloat(bumperNoiseEl?.value) || 0.15;
i = nearFiretrap(mx,my); 
if (i !== -1) { 
  const item = mapDef.firetrap[i];
  try { pushHistory('move_firetrap'); } catch {}
  dragging = {type:'firetrap', idx:i, dx:mx-item.x, dy:my-item.y}; 
  selected = item;
  selected.type = 'firetrap';
  return;
}

      const c = bumperColorEl ? bumperColorEl.value : '#7cf1ff';
      if (!Array.isArray(mapDef.bumpers)) mapDef.bumpers = [];
      mapDef.bumpers.push({ x: snapVal(mx), y: snapVal(my), r, e: eMul, noise: n, color: c });
      try { invalidateStaticLayer(); drawMap(); startMainLoop(); } catch {}
    }
    return;
  }
// This code block was causing fireaura to disappear - REMOVED
  if (tool==="brush" || tool==="breakwall" || tool==="softwall" || tool==="mud" || tool==="healingpatch"){ 
    if (tool === "healingpatch") {
      const savedRadius = parseInt(localStorage.getItem('healingpatch_radius')) || 15;
      const savedHealRate = parseInt(localStorage.getItem('healingpatch_healrate')) || 5;
      const savedCooldown = parseInt(localStorage.getItem('healingpatch_cooldown')) || 1000;
      brushDraft = { 
        r: savedRadius, 
        points: [], 
        strokeType: tool, 
        type: 'healingpatch',
        healRate: savedHealRate, 
        cooldown: savedCooldown 
      };
    } else {
      brushDraft = { r: parseInt(thickEl.value,10)/2, points: [], strokeType: tool };
    }
    addBrushPoint(brushDraft.points, mx, my, 1);
    return;
  }
  if (tool==="ebrush" || tool==="fraser_brush"){ ebrushDraft = { r: parseInt(thickEl.value,10)/2, points: [] }; addBrushPoint(ebrushDraft.points, mx, my, 1); applyEraserStroke(ebrushDraft); return; }
  if (tool==="spawn"){ const i = nearSpawn(mx,my); if (i>=0){ const s=mapDef.spawnPoints[i]; try { pushHistory('move_spawn'); } catch {} dragging = {type:'spawn', idx:i, dx:mx-s.x, dy:my-s.y}; } else { try { pushHistory('add_spawn'); } catch {} mapDef.spawnPoints.push({x:snapVal(mx), y:snapVal(my), angle:0}); } return; }
  if (tool==="erase" || tool==="fraser_click"){ // Fraser (click) is an alias for erase
    try { pushHistory('erase_click'); } catch {}
    let i = mapDef.walls.findIndex(w => pointInRotRect(mx,my, w.x,w.y,w.w,w.h, w.angle||0)); if (i>=0){ mapDef.walls.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    
    i = pickArcIndex(mx,my); if (i>=0){ mapDef.arcs.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    i = pickBrushIndex(mx,my); if (i>=0){ mapDef.brushes.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    i = nearSpawn(mx,my); if (i>=0){ mapDef.spawnPoints.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const carrot_i = nearCarrot(mx,my); if(carrot_i!==-1){ mapDef.carrots.splice(carrot_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const boost_i = nearBoost(mx,my); if(boost_i!==-1){ mapDef.boosts.splice(boost_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const turbo_i = nearTurbo(mx,my); if(turbo_i!==-1){ mapDef.turbos.splice(turbo_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const ghost_i = nearGhost(mx,my); if(ghost_i!==-1){ mapDef.ghosts.splice(ghost_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const trap_i = nearTrap(mx,my); if(trap_i!==-1){ mapDef.traps.splice(trap_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const teleport_i = nearTeleport(mx,my); if(teleport_i!==-1){ mapDef.teleports.splice(teleport_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const magnet_i = nearMagnet(mx,my); if(magnet_i!==-1){ mapDef.magnets.splice(magnet_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const timefreeze_i = window.nearTimeFreeze ? window.nearTimeFreeze(mx,my) : -1; if(timefreeze_i!==-1){ mapDef.timeFreezes.splice(timefreeze_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const icefreezer_i = window.nearIceFreezer ? window.nearIceFreezer(mx,my) : -1; if(icefreezer_i!==-1){ mapDef.icefreezers.splice(icefreezer_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const ram_i = nearRam(mx,my); if(ram_i!==-1){ mapDef.rams.splice(ram_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const mud_i = nearMud(mx,my); if(mud_i!==-1){ mapDef.mudPatches.splice(mud_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    // healingpatch deletion now handled by brush system
    const rotbarrier_i = nearRotBarrier(mx,my); if(rotbarrier_i!==-1){ mapDef.rotatingBarriers.splice(rotbarrier_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const magnetpull_i = nearMagnetpull(mx,my); if(magnetpull_i!==-1){ mapDef.magnetpulls.splice(magnetpull_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const magnetpush_i = nearMagnetpush(mx,my); if(magnetpush_i!==-1){ mapDef.magnetpushs.splice(magnetpush_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const shield_i = nearShield(mx,my); if(shield_i!==-1){ mapDef.shields.splice(shield_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const warpzone_i = nearWarpzone(mx,my); if(warpzone_i!==-1){ mapDef.warpzones.splice(warpzone_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const nebula_i = nearNebula(mx,my); if(nebula_i!==-1){ mapDef.nebulas.splice(nebula_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const quantumdash_i = nearQuantumdash(mx,my); if(quantumdash_i!==-1){ mapDef.quantumdashs.splice(quantumdash_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    // [PU-BEGIN name=yellowheart section=editor-delete]
    const yellowheart_i = nearYellowheart(mx,my); if(yellowheart_i!==-1){ mapDef.yellowhearts.splice(yellowheart_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    // [PU-END name=yellowheart section=editor-delete]
    const spinner_i = nearSpinner(mx,my); if(spinner_i!==-1){ mapDef.spinners.splice(spinner_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const bumper_i = nearBumper(mx,my); if(bumper_i!==-1){ mapDef.bumpers.splice(bumper_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const fan_i = nearFan(mx,my); if(fan_i!==-1){ mapDef.fans.splice(fan_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const belt_i = nearBelt(mx,my); if (belt_i !== -1){ mapDef.belts.splice(belt_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const poison_i = nearPoison(mx,my); if(poison_i!==-1){ mapDef.poisons.splice(poison_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    // Delete testpower
    if (mapDef.testpowers) {
      for (let i = 0; i < mapDef.testpowers.length; i++) {
        if (Math.hypot(mx - mapDef.testpowers[i].x, my - mapDef.testpowers[i].y) < 15) {
          mapDef.testpowers.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return;
        }
      }
    }
const lightning_i = nearLightning(mx,my); if(lightning_i!==-1){ mapDef.lightnings.splice(lightning_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const volcano_i = nearVolcano(mx,my); if(volcano_i!==-1){ mapDef.volcanos.splice(volcano_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const tornado_i = nearTornado(mx,my); if(tornado_i!==-1){ mapDef.tornados.splice(tornado_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const healingzone_i = nearHealingzone(mx,my); if(healingzone_i!==-1){ mapDef.healingzones.splice(healingzone_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const fireaura_i = nearFireaura(mx,my); if(fireaura_i!==-1){ mapDef.fireaura.splice(fireaura_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    const firetrap_i = nearFiretrap(mx,my); if(firetrap_i!==-1){ mapDef.firetrap.splice(firetrap_i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    
    // Check pipes, semis, arcs
    i = pickPipeIndex(mx,my); if (i>=0){ mapDef.pipes.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    i = pickSemiIndex(mx,my); if (i>=0){ mapDef.semis.splice(i,1); try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} return; }
    
    return;
  }
  if (tool==="carrotA"){ try { pushHistory('move_carrotA'); } catch {} mapDef.carrots[0].x = snapVal(mx); mapDef.carrots[0].y = snapVal(my); return; }
  if (tool==="carrotB"){ try { pushHistory('move_carrotB'); } catch {} mapDef.carrots[1].x = snapVal(mx); mapDef.carrots[1].y = snapVal(my); return; }
  if (tool==="room"){ try { pushHistory('move_room'); } catch {} mapDef.waitingRoom.x = snapVal(mx) - mapDef.waitingRoom.w/2; mapDef.waitingRoom.y = snapVal(my) - mapDef.waitingRoom.h/2; return; }
  if (tool==="start"){ try { pushHistory('move_start'); } catch {} mapDef.startLine.x = snapVal(mx); mapDef.startLine.y = snapVal(my); return; }
  // Gate tool disabled intentionally
  // if (tool==="gate"){ mapDef.gateBar.x = snapVal(mx); mapDef.gateBar.y = snapVal(my); return; }

  if (tool==="select"){
    // Handle rotation and resize for selected spinner
    if (selected && selected.type === 'spinner') {
      const s = selected;
      const w = s.w || 80;
      const h = s.h || 20;
      const angle = s.angle || 0;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      
      // Left resize handle (west edge)
      const leftX = s.x - (w/2) * cos + (h/8) * sin;
      const leftY = s.y - (w/2) * sin - (h/8) * cos;
      if (Math.hypot(mx - leftX, my - leftY) <= 8) {
        try { pushHistory('resize_spinner'); } catch {}
        dragging = { type: 'spinner_resize', idx: mapDef.spinners.indexOf(s), side: 'left', cx: s.x, cy: s.y, angle: angle };
        return;
      }
      
      // Right resize handle (east edge)
      const rightX = s.x + (w/2) * cos + (h/8) * sin;
      const rightY = s.y + (w/2) * sin - (h/8) * cos;
      if (Math.hypot(mx - rightX, my - rightY) <= 8) {
        try { pushHistory('resize_spinner'); } catch {}
        dragging = { type: 'spinner_resize', idx: mapDef.spinners.indexOf(s), side: 'right', cx: s.x, cy: s.y, angle: angle };
        return;
      }
      
      // Rotation handle (at the end, slightly further out)
      const handleRadius = 8;
      const handleDist = w / 2 + 18;
      const handleWorldX = s.x + handleDist * cos;
      const handleWorldY = s.y + handleDist * sin;
      const dist = Math.hypot(mx - handleWorldX, my - handleWorldY);
      if (dist <= handleRadius) {
        try { pushHistory('rotate_spinner'); } catch {}
        dragging = { type: 'spinner_rotate', idx: mapDef.spinners.indexOf(s) };
        return; // Prioritize rotation drag
      }
    }

    // Handle rotation for selected belt
    if (selected && selected.type === 'belt') {
      const b = selected;
      const angle = b.angle || 0;
      const handleRadius = 8;
      const handleDist = (b.w / 2) + 12;
      const cx = b.x + b.w/2, cy = b.y + b.h/2;
      const handleWorldX = cx + handleDist * Math.cos(angle);
      const handleWorldY = cy + handleDist * Math.sin(angle);
      const dist = Math.hypot(mx - handleWorldX, my - handleWorldY);
      if (dist <= handleRadius) {
        try { pushHistory('rotate_belt'); } catch {}
        dragging = { type: 'belt_rotate', idx: (mapDef.belts||[]).indexOf(b) };
        return; // Prioritize rotation drag
      }
    }

    // Alt+Drag: generic rotation for selected rotatable objects
    if (e.altKey && selected && ['spinner','belt','semi','arc','pipe','wall'].includes(selected.type||'')){
      if (!dragging || (dragging.type!=='spinner_rotate' && dragging.type!=='belt_rotate' && dragging.type!=='rotate')){
        if (selected.type==='spinner') {
          try { pushHistory('rotate_spinner'); } catch {}
          dragging = { type:'spinner_rotate', idx: (mapDef.spinners||[]).indexOf(selected) };
        } else if (selected.type==='belt') {
          try { pushHistory('rotate_belt'); } catch {}
          dragging = { type:'belt_rotate', idx: (mapDef.belts||[]).indexOf(selected) };
        } else {
          try { pushHistory('rotate_generic'); } catch {}
          dragging = { type:'rotate', kind: selected.type, idx: getSelectedIndex(selected) };
        }
      }
      return; // keep current selection and start rotation drag
    }

// Helper function to check if object should trigger multi-drag
const shouldMultiDrag = (obj) => {
  return selectedObjects.length > 1 && selectedObjects.includes(obj);
};

// Universal function to handle selection with multi-drag support
const handleObjectSelection = (obj, typeName, arrayName, idx, event) => {
  if (!obj) return false;
  obj.type = typeName;
  
  // Alt key - deselect object
  if (event && event.altKey) {
    const objIdx = selectedObjects.indexOf(obj);
    if (objIdx !== -1) {
      selectedObjects.splice(objIdx, 1);
      if (selected === obj) selected = null;
      try { drawMap(); } catch {}
    }
    return true;
  }
  
  if (shouldMultiDrag(obj)) {
    try { pushHistory('move_multi'); } catch {}
    dragging = {type:'multi', dx:mx, dy:my};
  } else {
    try { pushHistory('move_' + typeName); } catch {}
    dragging = {type:typeName, idx:idx, dx:mx-obj.x, dy:my-obj.y};
    selected = obj;
    selectedObjects = [];
  }
  return true;
};

selected = null;
if (tool !== 'spinner') spinnerAngleControl.style.display = 'none';
let i;
// Check dynamic items first, as they might be on top
  i = nearHealingzone(mx,my); 
  if (i !== -1) { 
    const hz = mapDef.healingzones[i]; 
    try { pushHistory('move_healingzone'); } catch {} 
    dragging = {type:'healingzone', idx:i, dx:mx-hz.x, dy:my-hz.y}; 
    selected = mapDef.healingzones[i];
    selected.type = 'healingzone';
    return; 
  }

  i = nearSpinner(mx,my); 
  if (i !== -1) { 
    const s = mapDef.spinners[i]; 
    try { pushHistory('move_spinner'); } catch {} 
    dragging = {type:'spinner', idx:i, dx:mx-s.x, dy:my-s.y}; 
    selected = mapDef.spinners[i];
    selected.type = 'spinner';
    shapeColorEl.value = s.color || '#9E9E9E';
    spinnerAngleControl.style.display = 'flex';
    const currentAngle = Math.round((s.angle || 0) * 180 / Math.PI) % 360;
    spinnerAngleEl.value = currentAngle;
    spinnerAngleVal.textContent = currentAngle + '°';
    // Sync spinner speed UI
    const spd = (typeof s.speed === 'number' && isFinite(s.speed)) ? s.speed : 1.0;
    if (spinnerSpeedEl) spinnerSpeedEl.value = String(spd.toFixed(1));
    if (spinnerSpeedVal) spinnerSpeedVal.textContent = spd.toFixed(1);
    // Sync spinner length UI
    const len = (typeof s.w === 'number' && isFinite(s.w)) ? s.w : 80;
    if (spinnerLengthEl) spinnerLengthEl.value = String(len);
    if (spinnerLengthVal) spinnerLengthVal.textContent = len + 'px';
    return; 
  }
  i = nearRotBarrier(mx,my); 
  if (i !== -1) { 
    const b = mapDef.rotatingBarriers[i];
    try { pushHistory('move_rotbarrier'); } catch {}
    dragging = {type:'rotbarrier', idx:i, dx:mx-b.x, dy:my-b.y}; 
    selected = mapDef.rotatingBarriers[i]; // Reference to actual object in array
    selected.type = 'rotbarrier';
    shapeColorEl.value = b.color || '#4A4A4A';
    return;
  }
  i = nearMagnetpull(mx,my); 
  if (i !== -1) { 
    const m = mapDef.magnetpulls[i];
    try { pushHistory('move_magnetpull'); } catch {}
    dragging = {type:'magnetpull', idx:i, dx:mx-m.x, dy:my-m.y}; 
    selected = mapDef.magnetpulls[i]; // Reference to actual object in array
    selected.type = 'magnetpull';
    return;
  }
  i = nearMagnetpush(mx,my); 
  if (i !== -1) { 
    const m = mapDef.magnetpushs[i];
    try { pushHistory('move_magnetpush'); } catch {}
    dragging = {type:'magnetpush', idx:i, dx:mx-m.x, dy:my-m.y}; 
    selected = mapDef.magnetpushs[i]; // Reference to actual object in array
    selected.type = 'magnetpush';
    return;
  }
  i = nearShield(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.shields[i], 'shield', 'shields', i, e)) return; }
  i = nearBumper(mx,my); if (i !== -1) { 
  const spd = (typeof s.speed === 'number' && isFinite(s.speed)) ? s.speed : 1.0;
  if (spinnerSpeedEl) spinnerSpeedEl.value = String(spd.toFixed(1));
  if (spinnerSpeedVal) spinnerSpeedVal.textContent = spd.toFixed(1);
  // Sync spinner length UI
  const len = (typeof s.w === 'number' && isFinite(s.w)) ? s.w : 80;
  if (spinnerLengthEl) spinnerLengthEl.value = String(len);
  if (spinnerLengthVal) spinnerLengthVal.textContent = len + 'px';
  return; 
}
i = nearRotBarrier(mx,my); 
if (i !== -1) { 
  const b = mapDef.rotatingBarriers[i];
  try { pushHistory('move_rotbarrier'); } catch {}
  dragging = {type:'rotbarrier', idx:i, dx:mx-b.x, dy:my-b.y}; 
  selected = mapDef.rotatingBarriers[i]; // Reference to actual object in array
  selected.type = 'rotbarrier';
  shapeColorEl.value = b.color || '#4A4A4A';
  return;
}
i = nearMagnetpull(mx,my); 
if (i !== -1) { 
  const m = mapDef.magnetpulls[i];
  try { pushHistory('move_magnetpull'); } catch {}
  dragging = {type:'magnetpull', idx:i, dx:mx-m.x, dy:my-m.y}; 
  selected = mapDef.magnetpulls[i]; // Reference to actual object in array
  selected.type = 'magnetpull';
  return;
}
i = nearMagnetpush(mx,my); 
if (i !== -1) { 
  const m = mapDef.magnetpushs[i];
  try { pushHistory('move_magnetpush'); } catch {}
  dragging = {type:'magnetpush', idx:i, dx:mx-m.x, dy:my-m.y}; 
  selected = mapDef.magnetpushs[i]; // Reference to actual object in array
  selected.type = 'magnetpush';
  return;
}
// Missing objects selection - add all for complete tool support (spinner already handled above)
i = nearLightning(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.lightnings[i], 'lightning', 'lightnings', i, e)) return; }
i = nearTeleport(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.teleports[i], 'teleport', 'teleports', i, e)) return; }
i = nearMagnet(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.magnets[i], 'magnet', 'magnets', i, e)) return; }
i = nearTimeFreeze(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.timeFreezes[i], 'timefreeze', 'timeFreezes', i, e)) return; }
i = nearBumper(mx,my); if (i !== -1) { 
    const b = mapDef.bumpers[i]; 
    const br = Math.max(6, b.r || 22);
    const d = Math.hypot(mx - b.x, my - b.y);
    const onEdge = Math.abs(d - br) <= 10;
    // Also treat click on the east handle as resize
    const hs = 7; // handle half-size
    const hx = b.x + br, hy = b.y;
    const onHandle = (mx >= hx - hs && mx <= hx + hs && my >= hy - hs && my <= hy + hs);
    if (onEdge || onHandle) {
      try { pushHistory('resize_bumper'); } catch {}
      dragging = { type: 'bumper_resize', idx: i, cx: b.x, cy: b.y };
      selected = b; selected.type = 'bumper'; showBumperInspector(true); syncBumperInspectorFrom(b);
      return;
    }
    try { pushHistory('move_bumper'); } catch {}
    dragging = {type:'bumper', idx:i, dx:mx-b.x, dy:my-b.y}; selected = b; selected.type = 'bumper'; showBumperInspector(true); syncBumperInspectorFrom(b); return; 
  }
i = nearBelt(mx,my); if (i !== -1) { const b = mapDef.belts[i]; try { pushHistory('move_belt'); } catch {} dragging = {type:'belt', idx:i, dx:mx-b.x, dy:my-b.y}; selected = b; selected.type = 'belt'; if (spinnerAngleControl) spinnerAngleControl.style.display = 'flex'; const angle = (b.angle||0); const deg = Math.round(angle*180/Math.PI)%360; if (spinnerAngleEl) spinnerAngleEl.value=String(deg); if (spinnerAngleVal) spinnerAngleVal.textContent = deg+'°'; return; }
i = nearRam(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.rams[i], 'ram', 'rams', i, e)) return; }
i = nearMud(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.mudPatches[i], 'mud', 'mudPatches', i, e)) return; }
// healingpatch dragging now handled by brush system
i = nearTrap(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.traps[i], 'trap', 'traps', i, e)) return; }
i = nearGhost(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.ghosts[i], 'ghost', 'ghosts', i, e)) return; }
i = nearBoost(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.boosts[i], 'boost', 'boosts', i, e)) return; }
i = nearTurbo(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.turbos[i], 'turbo', 'turbos', i, e)) return; }
i = nearPoison(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.poisons[i], 'poison', 'poisons', i, e)) return; }
i = nearTornado(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.tornados[i], 'tornado', 'tornados', i, e)) return; }
i = nearVolcano(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.volcanos[i], 'volcano', 'volcanos', i, e)) return; }
i = nearFireaura(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.fireaura[i], 'fireaura', 'fireaura', i, e)) return; }
i = nearFiretrap(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.firetrap[i], 'firetrap', 'firetrap', i, e)) return; }
i = nearWarpzone(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.warpzones[i], 'warpzone', 'warpzones', i, e)) return; }
i = nearQuantumdash(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.quantumdashs[i], 'quantumdash', 'quantumdashs', i, e)) return; }
i = nearNebula(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.nebulas[i], 'nebula', 'nebulas', i, e)) return; }
// [PU-BEGIN name=yellowheart section=editor-drag]
i = nearYellowheart(mx,my); if (i !== -1) { if (handleObjectSelection(mapDef.yellowhearts[i], 'yellowheart', 'yellowhearts', i, e)) return; }
// [PU-END name=yellowheart section=editor-drag]

    if (mapDef.carrots && mapDef.carrots[0]){
      const dx = mx - mapDef.carrots[0].x, dy = my - mapDef.carrots[0].y;
      if (Math.hypot(dx,dy) <= mapDef.carrots[0].r+6) { try { pushHistory('move_carrotA'); } catch {} dragging = {type:'carrotA', dx:dx, dy:dy}; selected = mapDef.carrots[0]; return; }
    }
    if (mapDef.carrots && mapDef.carrots[1]){
      const dx2 = mx - mapDef.carrots[1].x, dy2 = my - mapDef.carrots[1].y;
      if (Math.hypot(dx2,dy2) <= mapDef.carrots[1].r+6) { try { pushHistory('move_carrotB'); } catch {} dragging = {type:'carrotB', dx:dx2, dy:dy2}; selected = mapDef.carrots[1]; return; }
    }
    const s = mapDef.startLine;
    if (mx>=s.x && mx<=s.x+s.w && my>=s.y && my<=s.y+s.h){ try { pushHistory('move_start'); } catch {} dragging = {type:'start', dx:mx-s.x, dy:my-s.y}; selected = s; return; }
    const r = mapDef.waitingRoom;
    if (mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h){ try { pushHistory('move_room'); } catch {} dragging = {type:'room', dx:mx-r.x, dy:my-r.y}; selected = r; return; }
    // Gate selection disabled intentionally
    // const g = mapDef.gateBar;
    // if (mx>=g.x && mx<=g.x+g.w && my>=g.y && my<=g.y+g.h){ dragging = {type:'gate', dx:mx-g.x, dy:my-g.y}; selected = g; return; }
    for (let i=mapDef.walls.length-1;i>=0;i--){ 
      const w = mapDef.walls[i]; 
      if (pointInRotRect(mx,my, w.x,w.y,w.w,w.h, w.angle||0)){ 
        w.type = 'wall';
        
        // Alt key - deselect wall
        if (e.altKey) {
          const objIdx = selectedObjects.indexOf(w);
          if (objIdx !== -1) {
            selectedObjects.splice(objIdx, 1);
            if (selected === w) selected = null;
            try { drawMap(); } catch {}
          }
          return;
        }
        
        // Check if this wall is part of multi-selection
        if (shouldMultiDrag(w)) {
          try { pushHistory('move_multi'); } catch {}
          dragging = {type:'multi', dx:mx, dy:my};
        } else {
          try { pushHistory('move_wall'); } catch {}
          dragging = {type:'wall', idx:i, dx:mx-w.x, dy:my-w.y};
          selected = w;
          selectedObjects = [];
        }
        
        shapeColorEl.value = w.color || WALL; 
        if (spinnerAngleControl) spinnerAngleControl.style.display = 'flex'; 
        const deg=Math.round(((w.angle||0)*180/Math.PI))%360; 
        if (spinnerAngleEl) spinnerAngleEl.value=deg; 
        if (spinnerAngleVal) spinnerAngleVal.textContent=deg+'°'; 
        return; 
      } 
    }
    // Fan rotation handle
    let fiRotate = pickFanRotateHandle(mx, my);
    if (fiRotate !== -1){ try { pushHistory('rotate_fan'); } catch {} dragging = { type:'fan_rotate', idx: fiRotate }; const f = mapDef.fans[fiRotate]; selected = f; selected.type='fan'; showFanInspector(true); syncFanInspectorFrom(f); return; }
    // Fan body selection / move
    let fi = nearFan(mx, my);
    if (fi !== -1){ const f = mapDef.fans[fi]; try { pushHistory('move_fan'); } catch {} dragging = { type:'fan', idx: fi, dx: mx - f.x, dy: my - f.y }; selected = f; selected.type='fan'; showFanInspector(true); syncFanInspectorFrom(f); return; }
    let pi = pickPipeIndex(mx,my); 
    if (pi>=0){ 
      const p = mapDef.pipes[pi];
      p.type = 'pipe';
      
      // Alt key - deselect pipe
      if (e.altKey) {
        const objIdx = selectedObjects.indexOf(p);
        if (objIdx !== -1) {
          selectedObjects.splice(objIdx, 1);
          if (selected === p) selected = null;
          try { drawMap(); } catch {}
        }
        return;
      }
      
      if (shouldMultiDrag(p)) {
        try { pushHistory('move_multi'); } catch {}
        dragging = {type:'multi', dx:mx, dy:my};
      } else {
        try { pushHistory('move_pipe'); } catch {}
        dragging = {type:'pipe', idx:pi, dx:mx, dy:my};
        selected = p;
        selectedObjects = [];
      }
      shapeColorEl.value = p.color || WALL;
      if (spinnerAngleControl) spinnerAngleControl.style.display = 'flex';
      const ang = Math.atan2(p.y2-p.y1, p.x2-p.x1);
      syncAngleUI(ang);
      return;
    }
    let si = pickSemiIndex(mx,my);
    if (si>=0){
      const s2=mapDef.semis[si];
      s2.type = 'semi';
      
      // Alt key - deselect semi
      if (e.altKey) {
        const objIdx = selectedObjects.indexOf(s2);
        if (objIdx !== -1) {
          selectedObjects.splice(objIdx, 1);
          if (selected === s2) selected = null;
          try { drawMap(); } catch {}
        }
        return;
      }
      
      if (shouldMultiDrag(s2)) {
        try { pushHistory('move_multi'); } catch {}
        dragging = {type:'multi', dx:mx, dy:my};
      } else {
        try { pushHistory('move_semi'); } catch {}
        dragging = {type:'semi', idx:si, dx:mx-s2.x, dy:my-s2.y};
        selected = s2;
        selectedObjects = [];
      }
      shapeColorEl.value = s2.color || WALL;
      if (spinnerAngleControl) spinnerAngleControl.style.display = 'flex';
      const deg=Math.round((s2.angle||0)*180/Math.PI)%360;
      if (spinnerAngleEl) spinnerAngleEl.value=deg;
      if (spinnerAngleVal) spinnerAngleVal.textContent=deg+'°';
      return;
    }
    let ai = pickArcIndex(mx,my);
    if (ai>=0){
      const a=mapDef.arcs[ai];
      a.type = 'arc';
      
      // Alt key - deselect arc
      if (e.altKey) {
        const objIdx = selectedObjects.indexOf(a);
        if (objIdx !== -1) {
          selectedObjects.splice(objIdx, 1);
          if (selected === a) selected = null;
          try { drawMap(); } catch {}
        }
        return;
      }
      
      if (shouldMultiDrag(a)) {
        try { pushHistory('move_multi'); } catch {}
        dragging = {type:'multi', dx:mx, dy:my};
      } else {
        try { pushHistory('move_arc'); } catch {}
        dragging = {type:'arc', idx:ai, dx:mx-a.x, dy:my-a.y};
        selected = a;
        selectedObjects = [];
      }
      shapeColorEl.value = a.color || WALL;
      if (spinnerAngleControl) spinnerAngleControl.style.display = 'flex';
      const deg=Math.round((a.angle||0)*180/Math.PI)%360;
      if (spinnerAngleEl) spinnerAngleEl.value=deg;
      if (spinnerAngleVal) spinnerAngleVal.textContent=deg+'°';
      return;
    }
    let bi = pickBrushIndex(mx,my); 
    if (bi>=0){ 
      const b=mapDef.brushes[bi]; 
      b.type = 'brush';
      
      // Alt key - deselect brush
      if (e.altKey) {
        const objIdx = selectedObjects.indexOf(b);
        if (objIdx !== -1) {
          selectedObjects.splice(objIdx, 1);
          if (selected === b) selected = null;
          try { drawMap(); } catch {}
        }
        return;
      }
      
      // Check if this brush is part of multi-selection
      if (selectedObjects.length > 1 && selectedObjects.includes(b)) {
        // Drag all selected objects
        try { pushHistory('move_multi'); } catch {}
        dragging = {type:'multi', dx:mx, dy:my};
      } else {
        // Drag single brush
        try { pushHistory('move_brush'); } catch {}
        dragging = {type:'brush', idx:bi, dx:mx, dy:my};
        selected = b;
        selectedObjects = []; // Clear multi-selection
      }
      shapeColorEl.value = b.color || WALL;
      return;
    }
    const spi = nearSpawn(mx,my); if (spi>=0){ const spn=mapDef.spawnPoints[spi]; dragging = {type:'spawn', idx:spi, dx:mx-spn.x, dy:my-spn.y}; return; }
    
    // No object clicked - start rectangle selection
    // Clear selection unless Ctrl/Shift key is held
    if (!e.ctrlKey && !e.shiftKey) {
      selectedObjects = [];
      selected = null;
    }
    selectionRect = { x0: mx, y0: my, x1: mx, y1: my };
  }

  
});

canvas.addEventListener('mousemove', (e)=>{
  if (mode!=="editor") return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX-rect.left)*(canvas.width/rect.width);
  const my = (e.clientY-rect.top)*(canvas.height/rect.height);
  
  // Track mouse for tooltip
  editorMouseX = mx;
  editorMouseY = my;

  // Update hover tooltip
  if (!dragging && !selectionRect) {
    const newItem = findHoveredItem(mx, my);
    const oldItem = editorHoveredItem;
    
    // Check if item changed (simplistic check by reference or type)
    let changed = false;
    if (!newItem && oldItem) changed = true;
    else if (newItem && !oldItem) changed = true;
    else if (newItem && oldItem && newItem.item !== oldItem.item) changed = true;
    
    if (changed) {
      editorHoveredItem = newItem;
      try { drawMap(); } catch {}
    }
  } else if (editorHoveredItem) {
    // Clear tooltip when dragging
    editorHoveredItem = null;
    try { drawMap(); } catch {}
  }

  // Update rectangle selection during drag
  if (selectionRect && tool === 'select') {
    selectionRect.x1 = mx;
    selectionRect.y1 = my;
    try { drawMap(); } catch {}
    return;
  }

  // Hover feedback: show resize cursor near bumper/spinner edge/handle when using Select tool
  if (!dragging && tool === 'select'){
    let hoverResize = false;
    
    // Check bumper resize handles
    const bumpers = mapDef.bumpers || [];
    for (let i = bumpers.length - 1; i >= 0; i--){
      const b = bumpers[i];
      const r = Math.max(6, b.r || 22);
      const d = Math.hypot(mx - b.x, my - b.y);
      const onEdge = Math.abs(d - r) <= 10;
      const hs = 7; const hx = b.x + r, hy = b.y;
      const onHandle = (mx >= hx - hs && mx <= hx + hs && my >= hy - hs && my <= hy + hs);
      if (onEdge || onHandle){ hoverResize = true; break; }
    }
    
    // Check spinner resize handles
    if (!hoverResize && selected && selected.type === 'spinner') {
      const s = selected;
      const w = s.w || 80;
      const h = s.h || 20;
      const angle = s.angle || 0;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      
      // Left resize handle
      const leftX = s.x - (w/2) * cos + (h/8) * sin;
      const leftY = s.y - (w/2) * sin - (h/8) * cos;
      if (Math.hypot(mx - leftX, my - leftY) <= 8) {
        hoverResize = true;
      }
      
      // Right resize handle
      if (!hoverResize) {
        const rightX = s.x + (w/2) * cos + (h/8) * sin;
        const rightY = s.y + (w/2) * sin - (h/8) * cos;
        if (Math.hypot(mx - rightX, my - rightY) <= 8) {
          hoverResize = true;
        }
      }
    }
    
    canvas.style.cursor = hoverResize ? 'ew-resize' : 'default';
  }

  if (dragging && dragging.type === 'spinner_rotate') {
    const s = mapDef.spinners[dragging.idx];
    if (s) {
      const dx = mx - s.x;
      const dy = my - s.y;
      const newAngle = Math.atan2(dy, dx);
      s.angle = newAngle;

      // Update UI
      let angleDegrees = Math.round(newAngle * 180 / Math.PI);
      spinnerAngleEl.value = angleDegrees;
      spinnerAngleVal.textContent = angleDegrees + '°';
    }
    return;
  }

  if (wallDraft){ wallDraft.x1 = snapVal(mx); wallDraft.y1 = snapVal(my); }
  if (beltDraft){ beltDraft.x1 = snapVal(mx); beltDraft.y1 = snapVal(my); }
  if (onewayDraft){ onewayDraft.x1 = snapVal(mx); onewayDraft.y1 = snapVal(my); }
  if (padDraft){ padDraft.x1 = snapVal(mx); padDraft.y1 = snapVal(my); }
  if (pipeDraft){ pipeDraft.x2 = snapVal(mx); pipeDraft.y2 = snapVal(my); }
  if (semiDraft){ semiDraft.r = Math.max(6, Math.hypot(snapVal(mx)-semiDraft.cx, snapVal(my)-semiDraft.cy)); semiDraft.angle = Math.atan2(snapVal(my)-semiDraft.cy, snapVal(mx)-semiDraft.cx); }
  if (arcDraft){ const sx=snapVal(mx), sy=snapVal(my); arcDraft.r = Math.max(6, Math.hypot(sx-arcDraft.cx, sy-arcDraft.cy)); arcDraft.angle = Math.atan2(sy-arcDraft.cy, sx-arcDraft.cx); }
  
  if (brushDraft){ addBrushPoint(brushDraft.points, mx, my, parseInt(brushStepEl.value,10)); if(brushDraft.points.length>4000) brushDraft.points.shift(); }
  if (ebrushDraft){ addBrushPoint(ebrushDraft.points, mx, my, parseInt(brushStepEl.value,10)); if(ebrushDraft.points.length>2000) ebrushDraft.points.shift(); applyEraserStroke(ebrushDraft); }
  if (dragging){
    if (dragging.type==='carrotA'){ mapDef.carrots[0].x = snapVal(mx - dragging.dx); mapDef.carrots[0].y = snapVal(my - dragging.dy); }
    else if (dragging.type==='carrotB'){ mapDef.carrots[1].x = snapVal(mx - dragging.dx); mapDef.carrots[1].y = snapVal(my - dragging.dy); }
    else if (dragging.type==='start'){ mapDef.startLine.x = snapVal(mx - dragging.dx); mapDef.startLine.y = snapVal(my - dragging.dy); }
    else if (dragging.type==='room'){ mapDef.waitingRoom.x = snapVal(mx - dragging.dx); mapDef.waitingRoom.y = snapVal(my - dragging.dy); }
    // else if (dragging.type==='gate'){ mapDef.gateBar.x = snapVal(mx - dragging.dx); mapDef.gateBar.y = snapVal(my - dragging.dy); }
    else if (dragging.type==='wall'){ const w = mapDef.walls[dragging.idx]; w.x = snapVal(mx - dragging.dx); w.y = snapVal(my - dragging.dy); }
    else if (dragging.type==='belt'){ const b = mapDef.belts[dragging.idx]; if (b){ b.x = snapVal(mx - dragging.dx); b.y = snapVal(my - dragging.dy); } }
    else if (dragging.type==='belt_rotate'){
      const b = mapDef.belts[dragging.idx];
      if (b){
        const cx = b.x + b.w/2, cy = b.y + b.h/2;
        b.angle = Math.atan2(my - cy, mx - cx);
        if (selected === b) selected.angle = b.angle;
      }
    }
    else if (dragging.type==='bumper_resize'){
      const b = mapDef.bumpers && mapDef.bumpers[dragging.idx];
      if (b){
        const nr = Math.max(6, Math.round(Math.hypot(mx - dragging.cx, my - dragging.cy)));
        b.r = nr;
        if (selected === b) { try { syncBumperInspectorFrom(b); } catch {} }
      }
    }
    else if (dragging.type==='spinner_resize'){
      const s = mapDef.spinners && mapDef.spinners[dragging.idx];
      if (s){
        const cx = dragging.cx, cy = dragging.cy;
        const angle = dragging.angle;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        
        // Project mouse position onto spinner's local x-axis
        const localX = (mx - cx) * cos + (my - cy) * sin;
        
        if (dragging.side === 'left') {
          // Dragging left edge - resize from left
          const newHalfWidth = Math.max(10, Math.abs(localX));
          s.w = Math.round(newHalfWidth * 2);
        } else if (dragging.side === 'right') {
          // Dragging right edge - resize from right  
          const newHalfWidth = Math.max(10, Math.abs(localX));
          s.w = Math.round(newHalfWidth * 2);
        }
        
        // Update UI in real-time
        if (selected === s && spinnerLengthEl && spinnerLengthVal) {
          spinnerLengthEl.value = String(s.w);
          spinnerLengthVal.textContent = s.w + 'px';
        }
      }
    }
    else if (dragging.type==='fan'){
      const f = (mapDef.fans||[])[dragging.idx];
      if (f){
        f.x = snapVal(mx - dragging.dx);
        f.y = snapVal(my - dragging.dy);
        if (selected === f) { try { syncFanInspectorFrom(f); } catch {} }
      }
    }
    else if (dragging.type==='fan_rotate'){
      const f = (mapDef.fans||[])[dragging.idx];
      if (f){
        const ang = Math.atan2(my - f.y, mx - f.x);
        f.angle = ang;
        // Update angle UI live
        const deg = Math.round((ang * 180 / Math.PI) % 360);
        const fanAngleEl = document.getElementById('fanAngle');
        const fanAngleVal = document.getElementById('fanAngleVal');
        if (fanAngleEl) fanAngleEl.value = String(deg);
        if (fanAngleVal) fanAngleVal.textContent = deg + '°';
      }
    }
    else if (['boost', 'turbo', 'ghost', 'trap', 'ram', 'mud', 'shield', 'spinner', 'bumper', 'oneway', 'pad', 'fireaura', 'firetrap', 'magnetpull', 'magnetpush', 'rotbarrier', 'tornado', 'volcano', 'poison', 'warpzone', 'quantumdash', 'nebula', 'yellowheart'].includes(dragging.type)) {
      let arrayName;
      if (dragging.type === 'mud') arrayName = 'mudPatches';
      else if (dragging.type === 'magnetpull') arrayName = 'magnetpulls';
      else if (dragging.type === 'magnetpush') arrayName = 'magnetpushs';
      else if (dragging.type === 'rotbarrier') arrayName = 'rotatingBarriers';
      else if (dragging.type === 'fireaura') arrayName = 'fireaura';
      else if (dragging.type === 'firetrap') arrayName = 'firetrap';
      else if (dragging.type === 'quantumdash') arrayName = 'quantumdashs';
      else arrayName = dragging.type + 's';
      
      const item = mapDef[arrayName][dragging.idx];
      if (item) {
        item.x = snapVal(mx - dragging.dx);
        item.y = snapVal(my - dragging.dy);
      }
    }
    else if (dragging.type==='pipe'){ const p = mapDef.pipes[dragging.idx]; const offx = snapVal(mx) - dragging.dx; const offy = snapVal(my) - dragging.dy; p.x1 += offx; p.y1 += offy; p.x2 += offx; p.y2 += offy; dragging.dx = snapVal(mx); dragging.dy = snapVal(my); }
    else if (dragging.type==='semi'){ const s = mapDef.semis[dragging.idx]; s.x = snapVal(mx - dragging.dx); s.y = snapVal(my - dragging.dy); }
    else if (dragging.type==='arc'){ const a = mapDef.arcs[dragging.idx]; a.x = snapVal(mx - dragging.dx); a.y = snapVal(my - dragging.dy); }
    else if (dragging.type==='brush'){ 
      const b = mapDef.brushes[dragging.idx]; 
      const dx=mx-dragging.dx, dy=my-dragging.dy; 
      
      // For merged text with segments, only move segments
      if(b.segments && Array.isArray(b.segments) && b.segments.length > 0){ 
        for(const seg of b.segments){ 
          for(const p of seg){ 
            p.x += dx; p.y += dy; 
          } 
        } 
      } else {
        // For normal brush, move main points array
        for(const p of b.points){ 
          p.x += dx; p.y += dy; 
        } 
      }
      
      b._bbox = null; 
      b._cachedPath2D = null; 
      dragging.dx=mx; 
      dragging.dy=my; 
    }
    else if (dragging.type==='multi'){ 
      // Move all selected objects together
      const dx = mx - dragging.dx;
      const dy = my - dragging.dy;
      
      for (const obj of selectedObjects) {
        if (!obj || !obj.type) continue;
        
        if (obj.type === 'brush') {
          // For merged text with segments, only move segments
          if (obj.segments && Array.isArray(obj.segments) && obj.segments.length > 0) {
            for (const segment of obj.segments) {
              for (const p of segment) {
                p.x += dx;
                p.y += dy;
              }
            }
          } else {
            // For normal brush, move main points array
            for (const p of obj.points) {
              p.x += dx;
              p.y += dy;
            }
          }
          // Invalidate caches
          obj._bbox = null;
          obj._cachedPath2D = null;
        } else if (obj.type === 'wall' || obj.type === 'belt') {
          // Move rectangular objects
          obj.x += dx;
          obj.y += dy;
        } else if (obj.type === 'pipe') {
          // Move pipe endpoints
          obj.x1 += dx;
          obj.y1 += dy;
          obj.x2 += dx;
          obj.y2 += dy;
        } else if (obj.x !== undefined && obj.y !== undefined) {
          // Move circular objects (boosts, spinners, etc)
          obj.x += dx;
          obj.y += dy;
        }
      }
      
      dragging.dx = mx;
      dragging.dy = my;
    }
    else if (dragging.type==='spawn'){ const spn = mapDef.spawnPoints[dragging.idx]; const pos=insideRoomClamp(mx-dragging.dx, my-dragging.dy); spn.x = snapVal(pos.x); spn.y = snapVal(pos.y); }
    else if (dragging.type==='rotate'){
      // Generic rotate for semi, arc, pipe
      const kind = dragging.kind;
      if (kind==='semi'){
        const s = mapDef.semis[dragging.idx]; if (s){ s.angle = Math.atan2(my - s.y, mx - s.x); syncAngleUI(s.angle); }
      } else if (kind==='arc'){
        const a = mapDef.arcs[dragging.idx]; if (a){ a.angle = Math.atan2(my - a.y, mx - a.x); syncAngleUI(a.angle); }
      } else if (kind==='wall'){
        const w = mapDef.walls[dragging.idx]; if (w){ const cx = w.x + w.w/2, cy = w.y + w.h/2; w.angle = Math.atan2(my - cy, mx - cx); syncAngleUI(w.angle); }
      } else if (kind==='pipe'){
        const p = mapDef.pipes[dragging.idx]; if (p){
          const cx = (p.x1 + p.x2)/2, cy = (p.y1 + p.y2)/2;
          const ang = Math.atan2(my - cy, mx - cx);
          const len = Math.hypot(p.x2-p.x1, p.y2-p.y1)/2;
          p.x1 = snapVal(cx - Math.cos(ang)*len); p.y1 = snapVal(cy - Math.sin(ang)*len);
          p.x2 = snapVal(cx + Math.cos(ang)*len); p.y2 = snapVal(cy + Math.sin(ang)*len);
          syncAngleUI(ang);
        }
      } else if (kind==='oneway'){
        const g = mapDef.oneways[dragging.idx]; if (g){ const cx=g.x+g.w/2, cy=g.y+g.h/2; g.angle = Math.atan2(my - cy, mx - cx); }
      } else if (kind==='pad'){
        const pd = mapDef.pads[dragging.idx]; if (pd){ const cx=pd.x+pd.w/2, cy=pd.y+pd.h/2; pd.angle = Math.atan2(my - cy, mx - cx); }
      }
    }
    // Force redraw during dragging in editor so movement is visible
    try { invalidateStaticLayer(); drawMap(); } catch {}
  }
});

// Handle mouseup events globally to ensure dragging state is properly reset
window.addEventListener('mouseup', (e)=>{
  if (mode!=="editor") return;
  
  // Handle draft completion
  if (wallDraft){ const r = parseInt(radiusEl.value,10); const x = Math.min(wallDraft.x0, wallDraft.x1); const y = Math.min(wallDraft.y0, wallDraft.y1); const w = Math.abs(wallDraft.x1 - wallDraft.x0); const h = Math.abs(wallDraft.y1 - wallDraft.y0); if (w>6 && h>6) { try { pushHistory('commit_wall'); } catch {} mapDef.walls.push({x,y,w,h,r, color: shapeColorEl.value}); } wallDraft = null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (beltDraft){ const x = Math.min(beltDraft.x0, beltDraft.x1); const y = Math.min(beltDraft.y0, beltDraft.y1); const w = Math.abs(beltDraft.x1 - beltDraft.x0); const h = Math.abs(beltDraft.y1 - beltDraft.y0); if (!Array.isArray(mapDef.belts)) mapDef.belts = []; if (w>6 && h>6) { try { pushHistory('commit_belt'); } catch {} mapDef.belts.push({x,y,w,h, dir:'E', speed:0.12, r:16}); } beltDraft = null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (onewayDraft){ const x = Math.min(onewayDraft.x0, onewayDraft.x1); const y = Math.min(onewayDraft.y0, onewayDraft.y1); const w = Math.abs(onewayDraft.x1 - onewayDraft.x0); const h = Math.abs(onewayDraft.y1 - onewayDraft.y0); if (!Array.isArray(mapDef.oneways)) mapDef.oneways = []; if (w>6 && h>6){ try { pushHistory('commit_oneway'); } catch {} mapDef.oneways.push({x,y,w,h, angle:0, dir:'E', reflect:true}); } onewayDraft=null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (padDraft){ const x = Math.min(padDraft.x0, padDraft.x1); const y = Math.min(padDraft.y0, padDraft.y1); const w = Math.abs(padDraft.x1 - padDraft.x0); const h = Math.abs(padDraft.y1 - padDraft.y0); if (!Array.isArray(mapDef.pads)) mapDef.pads = []; if (w>6 && h>6){ try { pushHistory('commit_pad'); } catch {} mapDef.pads.push({x,y,w,h, angle:0, boost:1.2, addVx:0, addVy:0, color:'#2196f3'}); } padDraft=null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (pipeDraft){ const r = Math.max(4, parseInt(thickEl.value,10)/2); if (Math.hypot(pipeDraft.x2-pipeDraft.x1, pipeDraft.y2-pipeDraft.y1) > 8){ try { pushHistory('commit_pipe'); } catch {} mapDef.pipes.push({x1:pipeDraft.x1,y1:pipeDraft.y1,x2:pipeDraft.x2,y2:pipeDraft.y2,r, color: shapeColorEl.value}); } pipeDraft=null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (semiDraft){ if (semiDraft.r>6) { try { pushHistory('commit_semi'); } catch {} mapDef.semis.push({x:semiDraft.cx, y:semiDraft.cy, r:semiDraft.r, angle: semiDraft.angle||0, color: shapeColorEl.value}); } semiDraft=null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (arcDraft){ if (arcDraft.r>6){ const span = parseInt(arcSpanEl.value,10) * Math.PI/180; try { pushHistory('commit_arc'); } catch {} mapDef.arcs.push({x:arcDraft.cx, y:arcDraft.cy, r:arcDraft.r, thick: parseInt(thickEl.value,10), angle: arcDraft.angle||0, span, color: shapeColorEl.value}); } arcDraft=null; try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{} }
  if (brushDraft){
    if (brushDraft.points.length>=2){
      brushDraft.color = shapeColorEl.value;
      // Attach metadata for new brush types
      if (brushDraft.strokeType === 'breakwall'){
        brushDraft.type = 'break';
        const cfg = window.breakwallConfig || {};
        brushDraft.maxHits = parseInt((mhEl && mhEl.value) || cfg.maxHits || 3, 10);
        brushDraft.currentHits = 0;
        brushDraft.maxDeform = parseInt((mdEl && mdEl.value) || cfg.maxDeform || 18, 10);
        brushDraft.recover = parseInt((rcEl && rcEl.value) || cfg.recover || 24, 10);
        // Keep original points for recovery
        try { brushDraft.original = brushDraft.points.map(p => ({ x: p.x, y: p.y })); } catch {}
      } else if (brushDraft.strokeType === 'softwall'){
        brushDraft.type = 'soft';
        const cfg = window.softwallConfig || {};
        brushDraft.maxHits = parseInt((mhEl && mhEl.value) || cfg.maxHits || 3, 10);
        brushDraft.currentHits = 0;
        brushDraft.maxDeform = parseInt((mdEl && mdEl.value) || cfg.maxDeform || 18, 10);
        brushDraft.recover = parseInt((rcEl && rcEl.value) || cfg.recover || 24, 10);
        // Keep original points for recovery
        try { brushDraft.original = brushDraft.points.map(p => ({ x: p.x, y: p.y })); } catch {}
      } else if (brushDraft.strokeType === 'mud'){
        brushDraft.type = 'mud';
        brushDraft.color = '#8B4513'; // Brown color for mud
      }
      try { pushHistory('commit_brush'); } catch {}
      if (!mapDef.brushes) mapDef.brushes = [];
      mapDef.brushes.push(brushDraft);
    }
    brushDraft=null;
    try{ invalidateStaticLayer(); drawMap(); startMainLoop(); }catch{}
  }
  if (ebrushDraft){ /* realtime applied already */ ebrushDraft=null; }
  
  // Reset dragging state for all mouse buttons (including middle button)
  dragging = null;
  
  // Reset cursor style if it was changed during dragging
  canvas.style.cursor = 'default';
});

// Additional mouseup handler specifically for canvas to handle edge cases
canvas.addEventListener('mouseup', (e)=>{
  if (mode!=="editor") return;
  
  // Complete rectangle selection
  if (selectionRect && tool === 'select') {
    const { x0, y0, x1, y1 } = selectionRect;
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    
    // Function to check if point is in rectangle
    const inRect = (x, y) => x >= minX && x <= maxX && y >= minY && y <= maxY;
    
    // Select all objects within rectangle
    const newSelection = [];
    
    // Check walls
    for (const w of mapDef.walls) {
      const cx = w.x + w.w/2;
      const cy = w.y + w.h/2;
      if (inRect(cx, cy)) {
        w.type = 'wall';
        newSelection.push(w);
      }
    }
    
    // Check circular objects
    const checkCircular = (array, typeName) => {
      for (const obj of array) {
        if (inRect(obj.x, obj.y)) {
          obj.type = typeName;
          newSelection.push(obj);
        }
      }
    };
    
    checkCircular(mapDef.boosts, 'boost');
    checkCircular(mapDef.turbos || [], 'turbo');
    checkCircular(mapDef.ghosts, 'ghost');
    checkCircular(mapDef.traps, 'trap');
    checkCircular(mapDef.rams, 'ram');
    checkCircular(mapDef.mudPatches, 'mud');
    checkCircular(mapDef.magnets, 'magnet');
    checkCircular(mapDef.teleports, 'teleport');
    checkCircular(mapDef.timeFreezes, 'timefreeze');
    checkCircular(mapDef.shields || [], 'shield');
    checkCircular(mapDef.poisons || [], 'poison');
    checkCircular(mapDef.lightnings || [], 'lightning');
    checkCircular(mapDef.volcanos || [], 'volcano');
    checkCircular(mapDef.tornados || [], 'tornado');
    checkCircular(mapDef.warpzones || [], 'warpzone');
    checkCircular(mapDef.quantumdashs || [], 'quantumdash');
    checkCircular(mapDef.nebulas || [], 'nebula');
    checkCircular(mapDef.yellowhearts || [], 'yellowheart');
    checkCircular(mapDef.spinners, 'spinner');
    checkCircular(mapDef.bumpers || [], 'bumper');
    checkCircular(mapDef.fans || [], 'fan');
    checkCircular(mapDef.rotatingBarriers || [], 'rotbarrier');
    checkCircular(mapDef.magnetpulls || [], 'magnetpull');
    checkCircular(mapDef.magnetpushs || [], 'magnetpush');
    checkCircular(mapDef.healingzones || [], 'healingzone');
    checkCircular(mapDef.fireaura || [], 'fireaura');
    checkCircular(mapDef.firetrap || [], 'firetrap');
    checkCircular(mapDef.icefreezers || [], 'icefreezer');
    
    // Check belts
    for (const b of mapDef.belts || []) {
      const cx = b.x + b.w/2;
      const cy = b.y + b.h/2;
      if (inRect(cx, cy)) {
        b.type = 'belt';
        newSelection.push(b);
      }
    }
    
    // Check pipes
    for (const p of mapDef.pipes) {
      const cx = (p.x1 + p.x2) / 2;
      const cy = (p.y1 + p.y2) / 2;
      if (inRect(cx, cy)) {
        p.type = 'pipe';
        newSelection.push(p);
      }
    }
    
    // Check semis and arcs
    checkCircular(mapDef.semis, 'semi');
    checkCircular(mapDef.arcs, 'arc');
    
    // Check brushes (check any point in brush)
    for (const b of mapDef.brushes) {
      let found = false;
      
      // Check segments if merged text
      if (b.segments && Array.isArray(b.segments)) {
        for (const segment of b.segments) {
          for (const pt of segment) {
            if (inRect(pt.x, pt.y)) {
              b.type = 'brush';
              newSelection.push(b);
              found = true;
              break;
            }
          }
          if (found) break;
        }
      } else if (b.points && b.points.length > 0) {
        // Check normal brush points
        for (const pt of b.points) {
          if (inRect(pt.x, pt.y)) {
            b.type = 'brush';
            newSelection.push(b);
            break;
          }
        }
      }
    }
    
    // Add to selection, replace, or remove based on modifier keys
    if (e.altKey) {
      // Alt key - remove selected objects from current selection
      for (const obj of newSelection) {
        const idx = selectedObjects.indexOf(obj);
        if (idx !== -1) {
          selectedObjects.splice(idx, 1);
          if (selected === obj) selected = null;
        }
      }
    } else if (e.ctrlKey || e.shiftKey) {
      // Ctrl/Shift - add to existing selection
      selectedObjects = [...selectedObjects, ...newSelection];
    } else {
      // No modifier - replace selection
      selectedObjects = newSelection;
    }
    
    // Set selected to first item if any
    if (selectedObjects.length > 0) {
      selected = selectedObjects[0];
    } else {
      selected = null;
    }
    
    selectionRect = null;
    try { drawMap(); } catch {}
    
    console.log(`Selected ${selectedObjects.length} objects`);
    return;
  }
  
  // Ensure dragging state is reset regardless of which button was released
  if (dragging) {
    dragging = null;
    canvas.style.cursor = 'default';
  }
});

// Click to select a horse and load its info into the UI
canvas.addEventListener('click', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX-rect.left)*(canvas.width/rect.width);
  const my = (e.clientY-rect.top)*(canvas.height/rect.height);
  if (Array.isArray(horses) && horses.length){
    let sel = -1, bestD = 1e9;
    for (let i=0;i<horses.length;i++){
      const h = horses[i];
      const d = Math.hypot(mx - h.x, my - h.y);
      if (d < bestD && d <= (h.r + 12)) { sel = i; bestD = d; }
    }
    if (sel !== -1){
      // Ensure defaults exist and then load UI for this horse index
      ensureCustomIndex(sel);
      if (horseIdxEl){ horseIdxEl.value = String(sel+1); }
      if (typeof loadHorseToUI === 'function') loadHorseToUI();
      toast(`Đã chọn ngựa #${sel+1}`);
    }
  }
});

// ===== Custom horse logic =====
// getDefaultHorseInfo - MOVED TO: scripts/editor/horse-customization-ui.js
// ensureCustomIndex - MOVED TO: scripts/data/horse-initialization.js
// Access via: window.HorseInitialization or window.ensureCustomIndex() for compatibility
// Horse customization UI functions - MOVED TO: scripts/editor/horse-customization-ui.js
// Access via: window.HorseCustomizationUI or window.getCurrentHorseIndex(), window.loadHorseToUI(), etc.
// Horse editor utilities - MOVED TO: scripts/editor/horse-editor-utils.js
// Access via: window.HorseEditorUtils or window.resetHorseAt(), window.copyAllFrom(), etc. for compatibility

// ===== Horse Editor Button Handlers (restored) =====
horseIdxEl.addEventListener('change', loadHorseToUI);
document.getElementById('applyHorse').addEventListener('click', applyHorseFromUI);
document.getElementById('resetHorse').addEventListener('click', ()=>{ const i = getCurrentHorseIndex(); resetHorseAt(i); loadHorseToUI(); });
document.getElementById('copyAll').addEventListener('click', ()=>{ const i0 = getCurrentHorseIndex(); copyAllFrom(i0); toast(`Đã copy TẤT CẢ từ ngựa #${i0+1} cho tất cả ngựa`); });
loadHorseToUI();

// Game Settings event handlers
const runtimeSpeedSliderEl = document.getElementById('runtimeSpeedSlider');
const runtimeSpeedValEl = document.getElementById('runtimeSpeedVal');
const countdownSliderEl = document.getElementById('countdownSlider');
const collisionSfxEl = document.getElementById('collisionSfx');
const testRaceEl = document.getElementById('testRace');
const hudPlayTestEl = document.getElementById('hudPlayTest');
const testTtsBtn = document.getElementById('testTts');
const focusBtn = document.getElementById('focusBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeResultsBtn = document.getElementById('closeResultsBtn');

// Button tooltips - MOVED TO: scripts/ui/button-tooltips.js
// Access via: window.ButtonTooltips module

// Results overlay buttons - MOVED TO: scripts/ui/results-overlay.js
// Access via: window.ResultsOverlay module

// Focus Mode (fullscreen viewing) - MOVED TO: scripts/ui/focus-mode.js
// Access via: window.FocusMode or window.toggleFocusMode() for compatibility

/**
 * Chuyển chế độ Play/Editor và cập nhật toàn bộ UI + state liên quan
 * @param {'play'|'editor'} next
 */
function setMode(next) {
  const editorBar = document.getElementById('editorBar');
  const hud = document.getElementById('hud');
  const toEditor = document.getElementById('toEditor');
  const openBtn = document.getElementById('openEditorBtn');
  if (next === 'play') {
    mode = 'play';
    focusBtn.style.display = 'flex';
    if (editorBar) editorBar.style.display = 'none';
    if (hud) {
      hud.style.display = 'flex';
      if (toEditor) toEditor.style.display = 'block';
      const pauseBtn = document.getElementById('pauseBtnHUD');
      if (pauseBtn) { pauseBtn.style.display = 'block'; pauseBtn.textContent = paused ? '▶️' : '⏸️'; }
      try { if (typeof applyHudDock === 'function') applyHudDock(); } catch {}
      try { if (typeof positionHudNearStage === 'function') positionHudNearStage(); } catch {}
    }
    if (openBtn) openBtn.style.display = 'inline-block';
    try { applyEventLogDock(); } catch {}
  } else if (next === 'editor') {
    console.log('[Luck] 📍 setMode("editor") called - starting cleanup...');
    mode = 'editor';
    focusBtn.style.display = 'none';
    if (document.body.classList.contains('focus-mode')) {
      toggleFocusMode();
    }    
    // Reset consumed flags for all power-ups when returning to editor
    const powerUpArrays = [
      { array: mapDef.yellowhearts, name: 'yellowheart' },
      { array: mapDef.boosts, name: 'boost' },
      { array: mapDef.turbos, name: 'turbo' },
      { array: mapDef.shields, name: 'shield' },
      { array: mapDef.teleports, name: 'teleport' },
      { array: mapDef.quantumdashs, name: 'quantumdash' },
      { array: mapDef.nebulas, name: 'nebula' },
      { array: mapDef.ghosts, name: 'ghost' },
      { array: mapDef.poisons, name: 'poison' },
      { array: mapDef.rams, name: 'ram' },
      { array: mapDef.magnets, name: 'magnet' },
      { array: mapDef.timeFreezes, name: 'timefreeze' },
      { array: mapDef.tornados, name: 'tornado' },
      { array: mapDef.volcanos, name: 'volcano' },
      { array: mapDef.lightnings, name: 'lightning' },
      { array: mapDef.meteors, name: 'meteor' },
      { array: mapDef.warpzones, name: 'warpzone' }
    ];
    
    for (const { array, name } of powerUpArrays) {
      if (Array.isArray(array)) {
        for (const item of array) {
          if (item && item.consumed) {
            item.consumed = false;
          }
        }
      }
    }
    
    // === CLEANUP LUCK-SPAWNED POWER-UPS ===
    // Remove items created by Luck or Suck system (they have _luckSpawned flag)
    console.log('[Luck] 🔍 Before cleanup - mapDef.boosts:', mapDef.boosts?.length, 'with luck:', mapDef.boosts?.filter(b => b?._luckSpawned)?.length);
    const cleanupLuckItems = (arr, name) => {
      if (!Array.isArray(arr)) return;
      const before = arr.length;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] && arr[i]._luckSpawned) {
          console.log(`[Luck] 🗑️ Removing ${name} at index ${i}:`, arr[i]);
          arr.splice(i, 1);
        }
      }
      if (before !== arr.length) console.log(`[Luck] ${name}: ${before} -> ${arr.length}`);
    };
    // Clean mapDef arrays
    cleanupLuckItems(mapDef.boosts, 'mapDef.boosts');
    cleanupLuckItems(mapDef.ghosts, 'mapDef.ghosts');
    cleanupLuckItems(mapDef.traps, 'mapDef.traps');
    cleanupLuckItems(mapDef.shields, 'mapDef.shields');
    cleanupLuckItems(mapDef.rams, 'mapDef.rams');
    cleanupLuckItems(mapDef.turbos, 'mapDef.turbos');
    cleanupLuckItems(mapDef.teleports, 'mapDef.teleports');
    cleanupLuckItems(mapDef.magnets, 'mapDef.magnets');
    cleanupLuckItems(mapDef.timeFreezes, 'mapDef.timeFreezes');
    cleanupLuckItems(mapDef.poisons, 'mapDef.poisons');
    cleanupLuckItems(mapDef.warpzones, 'mapDef.warpzones');
    cleanupLuckItems(mapDef.quantumdashs, 'mapDef.quantumdashs');
    // Clean live arrays
    cleanupLuckItems(liveBoosts, 'liveBoosts');
    cleanupLuckItems(liveGhosts, 'liveGhosts');
    cleanupLuckItems(liveTraps, 'liveTraps');
    cleanupLuckItems(liveShields, 'liveShields');
    cleanupLuckItems(liveRams, 'liveRams');
    cleanupLuckItems(liveTurbos, 'liveTurbos');
    cleanupLuckItems(liveTeleports, 'liveTeleports');
    cleanupLuckItems(liveMagnets, 'liveMagnets');
    cleanupLuckItems(liveTimeFreezes, 'liveTimeFreezes');
    cleanupLuckItems(livePoisons, 'livePoisons');
    cleanupLuckItems(liveWarpzones, 'liveWarpzones');
    cleanupLuckItems(liveQuantumdashs, 'liveQuantumdashs');
    // Also clean window references
    if (window.liveBoosts) cleanupLuckItems(window.liveBoosts, 'window.liveBoosts');
    if (window.liveGhosts) cleanupLuckItems(window.liveGhosts, 'window.liveGhosts');
    if (window.liveTraps) cleanupLuckItems(window.liveTraps, 'window.liveTraps');
    if (window.liveShields) cleanupLuckItems(window.liveShields, 'window.liveShields');
    console.log('[Luck] 🧹 Cleanup complete');
    
    if (editorBar) {
      editorBar.style.display = 'block';
      if (editorBar.classList.contains('collapsed')) {
        editorBar.classList.remove('collapsed');
        try { localStorage.setItem('rightbarCollapsed','0'); } catch {}
        const cbtn = editorBar.querySelector('.collapse-btn');
        if (cbtn) { cbtn.textContent = '≪'; cbtn.title = 'Collapse panel'; }
      }
      ensureEditorContentVisible();
      try { ensureSpawnPointsForEditor(); } catch {}
    }
    if (hud) hud.style.display = 'flex';
    if (toEditor) toEditor.style.display = 'none';
    if (openBtn) openBtn.style.display = 'none';
  }
}

// Settings slider controls (n, speed, countdown) - MOVED TO: scripts/ui/settings-controls.js
// Access via: window.SettingsControls module

// Game controls & hotkeys (Space/T/+/-/F1/F2/G, play buttons) - MOVED TO: scripts/ui/game-controls.js
// Access via: window.GameControls module
// Initialize mapDef.carrots if not exists
if (!window.mapDef) window.mapDef = {};
if (!mapDef.carrots) mapDef.carrots = [];

// Visibility & editor button controls - MOVED TO: scripts/ui/visibility-controls.js
// Access via: window.VisibilityControls module

// Performance timing variables - MOVED TO: scripts/core/performance-timing.js
// Access via: window.PerformanceTiming or window.fpsAccum, fpsCount, fpsStamp, fpsHudEl for compatibility

// Carrot UI controls (toggle checkboxes, update logic) - MOVED TO: scripts/editor/carrot-ui-controls.js
// Access via: window.CarrotUIControls or window.updateCarrots(), window.initCarrotListeners() for compatibility

// ===== Draggable Map Editor Panel =====
// MOVED TO: scripts/editor/draggable-panel.js
// Access via: window.DraggablePanel or window.setPanelPosition() for compatibility

// Editor keyboard shortcuts (Undo/Redo/Delete) - MOVED TO: scripts/editor/editor-shortcuts.js
// Access via: window.EditorShortcuts module

// ===== App Initialization (restored) =====
// Initialize Game HUB and Notification System
setTimeout(() => {
  // Initialize speed slider for Game HUB
  initializeGameHubSpeedSlider();
}, 1000);

// Initialize editor mode
document.getElementById('editBtn').click();

// Start main game loop
startMainLoop();

});

