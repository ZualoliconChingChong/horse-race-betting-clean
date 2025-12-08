/**
 * Event Log System
 * Manages game event logging with horse name colorization
 */

/**
 * Helper: Remove diacritics from string for case-insensitive matching
 * @param {string} s 
 * @returns {string}
 */
function deaccent(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Generate deterministic color from name
 * @param {string} name 
 * @returns {string} Hex color
 */
function generateColorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Log game event with colorized horse names
 * @param {string} text - Event text to log
 */
function logEvent(text) {
  const el = (typeof DOMCache !== 'undefined' && DOMCache.get) 
    ? DOMCache.get('eventLog')
    : document.getElementById('eventLog');
    
  if (!el) return;
  
  // Send to top notification bar ONLY (not the floating boxes)
  if (window.showNotification) {
    const displayText = String(text).replace(/^\s*(Ngua|Ngựa)\s+/i, '');
    
    // Determine notification type based on event content
    let type = 'game';
    if (text.includes('tiêu diệt') || text.includes('loại bỏ') || text.includes('hết máu')) {
      type = 'error';
    } else if (text.includes('thắng cuộc') || text.includes('nhặt được') || text.includes('kích hoạt')) {
      type = 'success';
    } else if (text.includes('dính Trap') || text.includes('chặn')) {
      type = 'warning';
    }
    
    showNotification(displayText, type, 4000);
  }
  
  // DISABLE floating white boxes in bottom-right
  return; // Exit here to prevent creating floating notification boxes
  
  // Remove leading "Ngua/Ngựa " so only the name remains at the start of the line
  const displayText = String(text).replace(/^\s*(Ngua|Ngựa)\s+/i, '');
  const row = document.createElement('div');
  row.style.background = 'rgba(255,255,255,0.95)';
  row.style.color = '#333';
  row.style.font = '12px/1.35 system-ui, Arial, sans-serif';
  row.style.padding = '6px 12px';
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.borderRadius = '8px';
  row.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  row.style.pointerEvents = 'none';
  row.style.boxSizing = 'border-box';
  row.style.width = '100%';
  row.style.maxWidth = '100%';
  row.style.whiteSpace = 'nowrap';
  row.style.overflow = 'hidden';
  row.style.textOverflow = 'ellipsis';
  // smooth appear (no vertical shift to avoid clipping during animation)
  row.style.opacity = '0';
  row.style.transform = 'none';
  row.style.transition = 'opacity .18s ease';

  // Try to colorize the horse name if it appears in the message
  let colored = false;
  try {
    const textSoft = deaccent(displayText).toLowerCase();
    const list = (typeof horses !== 'undefined' && Array.isArray(horses)) 
      ? horses 
      : (Array.isArray(window.horses) ? window.horses : []);
      
    if (list.length) {
      for (const h of list) {
        if (!h || !h.name) continue;
        const name = String(h.name);
        // case/diacritic-insensitive search; still derive original slice via index in deaccented text
        const nameSoft = deaccent(name).toLowerCase();
        const idxSoft = textSoft.indexOf(nameSoft);
        const m = idxSoft >= 0 ? { index: idxSoft, 0: displayText.substr(idxSoft, name.length) } : null;
        if (m && typeof m.index === 'number') {
          const idx = m.index;
          const matchedText = m[0];
          // Build: [before] [badge(name with color)] [after]
          const before = document.createTextNode(displayText.slice(0, idx));
          const after = document.createTextNode(displayText.slice(idx + matchedText.length));
          const badge = document.createElement('span');
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '6px';
          badge.style.padding = '1px 8px';
          badge.style.borderRadius = '999px';
          badge.style.background = (h.colorBody || '#666');
          badge.style.color = '#fff';
          badge.style.border = '1px solid rgba(255,255,255,.35)';
          badge.style.fontWeight = '600';
          const dot = document.createElement('span');
          dot.style.display = 'inline-block';
          dot.style.width = '10px';
          dot.style.height = '10px';
          dot.style.borderRadius = '50%';
          dot.style.background = (h.colorLabel || h.colorBody || '#fff');
          dot.style.border = '1px solid rgba(255,255,255,.65)';
          const nm = document.createElement('span');
          nm.textContent = matchedText; // keep original case
          badge.appendChild(dot);
          badge.appendChild(nm);
          row.appendChild(before);
          row.appendChild(badge);
          row.appendChild(after);
          colored = true;
          break;
        }
      }
    }
  } catch(e) {}
  
  if (!colored) {
    // Fallback: color the first token (assumed to be the name) if horses array didn't match
    try {
      const m2 = displayText.match(/^([A-Za-zÀ-ỹ0-9_\-]+)/i);
      if (m2 && typeof m2.index === 'number') {
        const idx2 = 0; // name at start after stripping prefix
        const nameTok = m2[1];
        // Try to find color by matching token to horses list (case-insensitive, prefix allowed)
        let colorBody = '#607d8b', colorLabel = '#ffffff';
        const list = (typeof horses !== 'undefined' && Array.isArray(horses)) 
          ? horses 
          : (Array.isArray(window.horses) ? window.horses : []);
          
        for (const h of list) {
          if (!h || !h.name) continue;
          // compare without diacritics
          const hn = String(h.name);
          if (deaccent(hn).toLowerCase().startsWith(deaccent(nameTok).toLowerCase())) {
            // Support multiple possible field names
            colorBody = h.colorBody || h.bodyColor || h.fill || h.color || colorBody;
            colorLabel = h.colorLabel || h.labelColor || h.stroke || colorBody || colorLabel;
            break;
          }
        }
        // If still default, generate a deterministic color from the name token
        if (colorBody === '#607d8b') {
          colorBody = generateColorFromName(nameTok);
        }
      }
    } catch(e) {
      // Handle any errors in color generation
    }
  }
  
  if (!colored) {
    row.textContent = displayText;
  }
  
  // Speak the raw event text (not truncated) via Web Speech API (if enabled)
  try { 
    if (typeof ttsSpeak === 'function') {
      ttsSpeak(displayText); 
    }
  } catch(e) {}
  
  el.prepend(row);
  
  try { 
    if (typeof applyEventLogDock === 'function') {
      applyEventLogDock(); 
    }
  } catch(e) {}
  
  // Show exactly 2 notifications fully
  const toRemove = Array.from(el.children).slice(2);
  toRemove.forEach(child => child.remove());
  
  requestAnimationFrame(() => {
    row.style.opacity = '1';
    try { 
      if (typeof applyEventLogDock === 'function') {
        applyEventLogDock(); 
      }
    } catch(e) {}
  });
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.EventLog = {
    log: logEvent,
    deaccent,
    generateColorFromName
  };
  
  // Backward compatibility
  window.logEvent = logEvent;
}
