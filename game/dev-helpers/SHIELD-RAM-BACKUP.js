/**
 * SHIELD & RAM POWER-UP BACKUP
 * 
 * File này chứa toàn bộ visual, effect, collision logic của Shield và Ram
 * để sau này có thể tái sử dụng hoặc tham khảo.
 * 
 * Ngày backup: 2025-10-15
 * Lý do: Refactor để fix visual bug - giữ lại code để tái sử dụng sau
 */

// ============================================================================
// SHIELD POWER-UP
// ============================================================================

/**
 * Shield Settings (Global)
 * Trong mapDef.shieldSettings
 */
const SHIELD_SETTINGS_EXAMPLE = {
  durationMs: 10000,      // Thời gian shield tồn tại (ms)
  consumable: true        // Có biến mất sau khi nhặt không
};

/**
 * Shield Data Structure
 * Trong mapDef.shields[]
 */
const SHIELD_ITEM_EXAMPLE = {
  x: 500,
  y: 300,
  r: 16,
  consumed: false  // Flag đánh dấu đã nhặt
};

/**
 * Shield Visual Rendering (RenderModule style)
 * Từ scripts_render.js / scripts/render.js
 */
function drawShields_BACKUP(ctx, mode, liveShields, mapDef, drawGlow, glowAlpha) {
  try {
    ctx.save();
    const shieldsToDraw = (mode === 'play' || mode === 'race')
      ? (liveShields || [])
      : (mapDef?.shields || []);
    
    const currentTime = performance.now();
    
    for (const s of shieldsToDraw) {
      if (s.consumed && (mode === 'play' || mode === 'race')) continue;
      
      // Animated shield energy field
      const pulseSpeed = 0.004;
      const pulse = Math.sin(currentTime * pulseSpeed) * 0.4 + 0.6;
      
      // Energy field rings
      const ringCount = 4;
      for (let i = 0; i < ringCount; i++) {
        const ringPhase = (currentTime * 0.003 + i * Math.PI / 2) % (Math.PI * 2);
        const ringRadius = s.r + 2 + i * 3 + Math.sin(ringPhase) * 2;
        const ringAlpha = (Math.sin(ringPhase + i) * 0.2 + 0.3) * (1 - i * 0.2);
        
        ctx.strokeStyle = `rgba(3, 169, 244, ${ringAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Enhanced glow
      try {
        drawGlow(ctx, s.x, s.y, s.r * (1 + pulse * 0.15), 'rgb(3,169,244)', glowAlpha(0.4 * pulse, 1.0 * pulse, 0.2));
      } catch {}
      
      // Main shield body with gradient
      const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      gradient.addColorStop(0, '#4fc3f7');
      gradient.addColorStop(0.6, '#03a9f4');
      gradient.addColorStop(1, '#0288d1');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Hexagonal shield pattern
      const hexRadius = s.r * 0.7;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = s.x + Math.cos(angle) * hexRadius;
        const y = s.y + Math.sin(angle) * hexRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      // Energy particles
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + currentTime * 0.002;
        const particleRadius = s.r + 6 + Math.sin(currentTime * 0.006 + i) * 3;
        const particleX = s.x + Math.cos(angle) * particleRadius;
        const particleY = s.y + Math.sin(angle) * particleRadius;
        
        ctx.fillStyle = `rgba(79, 195, 247, ${0.7 * pulse})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Enhanced outline
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      
      // Icon with glow effect
      ctx.font = `bold ${Math.max(12, Math.round(s.r))}px system-ui, "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText('🛡️', s.x, s.y);
    }
  } finally {
    try {
      ctx.restore();
    } catch {}
  }
}

/**
 * Shield Effect on Horse
 * Từ scripts\extracted-inline.js collision logic
 */
function applyShieldEffect_BACKUP(horse, mapDef) {
  const shieldSettings = mapDef.shieldSettings || { durationMs: 10000, consumable: true };
  horse.hasShield = true;
  horse.shieldUntil = performance.now() + shieldSettings.durationMs;
  
  // Visual feedback
  horse.shieldGlowUntil = performance.now() + 600;
  
  // Floating text
  // floatingTexts.push({ 
  //   x: horse.x, 
  //   y: horse.y - horse.r - 6, 
  //   t: performance.now(), 
  //   life: 900, 
  //   text: 'Shield', 
  //   color: '#80cbc4' 
  // });
}

/**
 * Shield Visual Effect on Horse (aura)
 * Từ scripts\rendering\powerup-rendering.js
 */
function drawShieldEffect_BACKUP(ctx, horse) {
  if (!horse.hasShield) return;
  
  try {
    ctx.save();
    ctx.beginPath();
    ctx.arc(horse.x, horse.y, horse.r + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(3, 169, 244, 0.4)'; // Light blue fill
    ctx.strokeStyle = 'rgba(3, 169, 244, 1)';   // Solid blue border
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } catch {}
}

/**
 * Shield Timer Display on Horse
 * Từ scripts_extracted-inline.js
 */
function drawShieldTimer_BACKUP(ctx, horse, mapDef) {
  const currentTime = performance.now();
  if (horse.shieldUntil && currentTime < horse.shieldUntil) {
    const timeLeft = horse.shieldUntil - currentTime;
    const duration = (mapDef.shieldSettings?.durationMs) || 10000;
    const timePercent = Math.max(0, timeLeft / duration);
    
    const timerOffset = 0; // Adjust based on other timers
    ctx.fillStyle = `rgba(128, 203, 196, 0.8)`;
    ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30 * timePercent, 3);
    ctx.strokeStyle = '#80CBC4';
    ctx.lineWidth = 1;
    ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30, 3);
  }
}

/**
 * Shield Collision Detection (Editor)
 * Từ scripts\editor\powerup-collision.js
 */
function nearShield_BACKUP(mx, my, mapDef) {
  for (let i = 0; i < (mapDef.shields || []).length; i++) {
    const s = mapDef.shields[i];
    if (Math.hypot(mx - s.x, my - s.y) < s.r) return i;
  }
  return -1;
}

// ============================================================================
// RAM POWER-UP
// ============================================================================

/**
 * Ram Settings (Global)
 * Trong mapDef.ramSettings
 */
const RAM_SETTINGS_EXAMPLE = {
  durationMs: 4000,       // Thời gian ram aura tồn tại (ms)
  range: 25,              // Phạm vi sát thương
  consumable: true        // Có biến mất sau khi nhặt không
};

/**
 * Ram Data Structure
 * Trong mapDef.rams[]
 */
const RAM_ITEM_EXAMPLE = {
  x: 600,
  y: 400,
  r: 15,
  consumed: false  // Flag đánh dấu đã nhặt
};

/**
 * Ram Visual Rendering (RenderModule style)
 * Từ scripts_render.js / scripts/render.js
 */
function drawRams_BACKUP(ctx, mode, liveRams, mapDef, drawGlow, glowAlpha) {
  try {
    ctx.save();
    
    const ramsToDraw = (mode === 'play' || mode === 'race')
      ? (liveRams || [])
      : (mapDef?.rams || []);
        
    const currentTime = performance.now();
    
    for (const r of ramsToDraw) {
      if (r.consumed && (mode === 'play' || mode === 'race')) continue;
      
      // Dynamic animation variables
      const pulseSpeed = 0.003;
      const sparkRotSpeed = 0.002;
      const glowPulse = 0.7 + 0.3 * Math.sin(currentTime * pulseSpeed);
      const sparkRotation = currentTime * sparkRotSpeed;
      
      // Enhanced explosive ram visual with DYNAMIC effects
      try {
        const glowRadius = r.r + 8 + 4 * Math.sin(currentTime * pulseSpeed * 1.5);
        const glowAlphaValue = glowAlpha(0.3 * glowPulse, 1.5, 0.4);
        drawGlow(ctx, r.x, r.y, glowRadius, 'rgb(255,69,0)', glowAlphaValue);
      } catch {}
      
      ctx.save();
      
      // Animated gradient with shifting colors
      const gradient = ctx.createRadialGradient(r.x - r.r*0.3, r.y - r.r*0.3, 0, r.x, r.y, r.r);
      const intensity = 0.8 + 0.2 * Math.sin(currentTime * pulseSpeed * 2);
      gradient.addColorStop(0, `rgba(255, 255, 100, ${0.9 * intensity})`);
      gradient.addColorStop(0.4, `rgba(255, 140, 0, ${0.8 * intensity})`);
      gradient.addColorStop(0.8, `rgba(220, 20, 60, ${0.8 * intensity})`);
      gradient.addColorStop(1, `rgba(139, 0, 0, ${0.7 * intensity})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fill();
      
      // ANIMATED energy spark effects (rotating)
      ctx.strokeStyle = `rgba(255, 255, 0, ${0.6 + 0.4 * Math.sin(currentTime * pulseSpeed * 3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const baseAngle = (i * Math.PI) / 4;
        const animatedAngle = baseAngle + sparkRotation;
        const sparkLength = r.r * (0.4 + 0.2 * Math.sin(currentTime * pulseSpeed * 4 + i));
        const x1 = r.x + Math.cos(animatedAngle) * (r.r * 0.3);
        const y1 = r.y + Math.sin(animatedAngle) * (r.r * 0.3);
        const x2 = r.x + Math.cos(animatedAngle) * (r.r * 0.3 + sparkLength);
        const y2 = r.y + Math.sin(animatedAngle) * (r.r * 0.3 + sparkLength);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      
      // Animated inner highlight ring (pulsing)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.4 * glowPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const innerRadius = r.r * (0.6 + 0.1 * Math.sin(currentTime * pulseSpeed * 2.5));
      ctx.arc(r.x, r.y, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Animated outer warning ring (pulsing)
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.6 + 0.4 * Math.sin(currentTime * pulseSpeed * 1.8)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r - 1, 0, Math.PI * 2);
      ctx.stroke();
      
      // Icon/emoji
      ctx.font = `bold ${Math.max(16, Math.round(r.r * 0.9))}px system-ui, "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * intensity})`;
      ctx.fillText('💥', r.x, r.y);
      
      ctx.restore();
    }
  } finally {
    try {
      ctx.restore();
    } catch {}
  }
}

/**
 * Ram Effect on Horse
 * Từ scripts\game-logic.js
 */
function applyRamEffect_BACKUP(horse) {
  if (!horse.effects) horse.effects = {};
  
  // Create deadly aura effect for 4 seconds
  horse.effects.ramAura = {
    duration: 4000,           // 4 seconds
    radius: horse.r * 3       // 3 times horse radius
  };
}

/**
 * Ram Aura Collision Detection (Horse vs Horse)
 * Từ scripts\extracted-inline.js
 */
function checkRamAuraCollision_BACKUP(horses, currentTime) {
  // Check ram aura collisions (horse with ram aura damages other horses)
  for (const h of horses) {
    if (h.eliminated || !h.effects?.ramAura) continue;
    
    const auraStartTime = h.effects.ramAura.startTime || currentTime;
    const auraDuration = h.effects.ramAura.duration || 4000;
    const auraRadius = h.effects.ramAura.radius || (h.r * 3);
    
    // Check if aura is still active
    if (currentTime - auraStartTime > auraDuration) {
      delete h.effects.ramAura;
      continue;
    }
    
    // Check collision with other horses
    for (const target of horses) {
      if (target.eliminated || target === h) continue;
      
      const dist = Math.hypot(h.x - target.x, h.y - target.y);
      if (dist < auraRadius + target.r) {
        // Apply damage to target
        const damage = 15; // Ram aura damage
        target.hp = Math.max(0, (target.hp || 100) - damage);
        
        if (target.hp <= 0) {
          target.eliminated = true;
          // Log elimination event
        }
      }
    }
  }
}

/**
 * Ram Timer Display on Horse
 * Từ scripts_extracted-inline.js
 */
function drawRamTimer_BACKUP(ctx, horse, mapDef) {
  const currentTime = performance.now();
  if (horse.ramUntil && currentTime < horse.ramUntil) {
    const timeLeft = horse.ramUntil - currentTime;
    const duration = (mapDef.ramSettings?.durationMs) || 4000;
    const timePercent = Math.max(0, timeLeft / duration);
    
    const timerOffset = 0; // Adjust based on other timers
    ctx.fillStyle = `rgba(244, 67, 54, 0.8)`;
    ctx.fillRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30 * timePercent, 3);
    ctx.strokeStyle = '#F44336';
    ctx.lineWidth = 1;
    ctx.strokeRect(horse.x - 15, horse.y + (horse.r || 8) + timerOffset, 30, 3);
  }
}

/**
 * Ram Collision Detection (Editor)
 * Từ scripts\editor\powerup-collision.js
 */
function nearRam_BACKUP(mx, my, mapDef) {
  for (let i = 0; i < (mapDef.rams || []).length; i++) {
    const r = mapDef.rams[i];
    if (Math.hypot(mx - r.x, my - r.y) < r.r) return i;
  }
  return -1;
}

// ============================================================================
// COLLISION & PICKUP LOGIC
// ============================================================================

/**
 * Shield Pickup Logic
 * Từ scripts\extracted-inline.js
 */
function handleShieldPickup_BACKUP(horse, shield, mapDef, liveShields, index) {
  // Apply shield effect
  const shieldSettings = mapDef.shieldSettings || { durationMs: 10000, consumable: true };
  horse.hasShield = true;
  horse.shieldUntil = performance.now() + shieldSettings.durationMs;
  horse.shieldGlowUntil = performance.now() + 600;
  
  // Mark as consumed if consumable
  const isConsumable = shieldSettings.consumable !== false;
  if (isConsumable) {
    shield.consumed = true;
    liveShields.splice(index, 1);
  }
  
  // Play sound effect
  try { playSfx('shield_on'); } catch {}
  
  // Show floating text
  // floatingTexts.push({ 
  //   x: horse.x, 
  //   y: horse.y - horse.r - 6, 
  //   t: performance.now(), 
  //   life: 900, 
  //   text: 'Shield', 
  //   color: '#80cbc4' 
  // });
}

/**
 * Ram Pickup Logic
 * Từ scripts\extracted-inline.js
 */
function handleRamPickup_BACKUP(horse, ram, mapDef, liveRams, index) {
  // Apply ram effect
  if (!horse.effects) horse.effects = {};
  horse.effects.ramAura = {
    duration: 4000,
    radius: horse.r * 3,
    startTime: performance.now()
  };
  
  // Mark as consumed if consumable
  const ramSettings = mapDef.ramSettings || { durationMs: 4000, consumable: true };
  const isConsumable = ramSettings.consumable !== false;
  if (isConsumable) {
    ram.consumed = true;
    liveRams.splice(index, 1);
  }
  
  // Play sound effect
  try { playSfx('ram_on'); } catch {}
  
  // Show floating text
  // floatingTexts.push({ 
  //   x: horse.x, 
  //   y: horse.y - horse.r - 6, 
  //   t: performance.now(), 
  //   life: 900, 
  //   text: 'Ram!', 
  //   color: '#ff5722' 
  // });
}

// ============================================================================
// EDITOR CONTEXT MENU
// ============================================================================

/**
 * Shield Context Menu (Editor)
 * Từ scripts_extracted-inline.js
 */
const SHIELD_CONTEXT_MENU_HTML = `
<div style="font-weight:600; margin:4px 0 8px 0;">🛡️ Shield (Global)</div>
<div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
  <label style="min-width:84px;">Duration</label>
  <input id="ctxShieldDuration" type="range" min="500" max="60000" step="500" value="10000" />
  <span id="ctxShieldDurationVal">10000ms</span>
</div>
<div class="row compact" style="gap:8px; align-items:center;">
  <label style="min-width:84px;">Consumable</label>
  <input id="ctxShieldConsumable" type="checkbox" checked />
</div>
`;

/**
 * Ram Context Menu (Editor)
 * Từ scripts_extracted-inline.js
 */
const RAM_CONTEXT_MENU_HTML = `
<div style="font-weight:600; margin:4px 0 8px 0;">💥 Ram (Global)</div>
<div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
  <label style="min-width:84px;">Duration</label>
  <input id="ctxRamDuration" type="range" min="1000" max="10000" step="500" value="4000" />
  <span id="ctxRamDurationVal">4000ms</span>
</div>
<div class="row compact" style="gap:8px; align-items:center; margin-bottom:6px;">
  <label style="min-width:84px;">Range</label>
  <input id="ctxRamRange" type="range" min="10" max="100" step="5" value="25" />
  <span id="ctxRamRangeVal">25px</span>
</div>
<div class="row compact" style="gap:8px; align-items:center;">
  <label style="min-width:84px;">Consumable</label>
  <input id="ctxRamConsumable" type="checkbox" checked />
</div>
`;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize Shield/Ram arrays in mapDef
 */
function initShieldRamArrays_BACKUP(mapDef) {
  if (!mapDef.shields) mapDef.shields = [];
  if (!mapDef.rams) mapDef.rams = [];
  if (!mapDef.shieldSettings) mapDef.shieldSettings = { durationMs: 10000, consumable: true };
  if (!mapDef.ramSettings) mapDef.ramSettings = { durationMs: 4000, range: 25, consumable: true };
}

/**
 * Initialize live arrays for race
 */
function initLiveShieldRamArrays_BACKUP(mapDef) {
  const liveShields = JSON.parse(JSON.stringify(mapDef.shields || []));
  const liveRams = JSON.parse(JSON.stringify(mapDef.rams || []));
  return { liveShields, liveRams };
}

// ============================================================================
// NOTES
// ============================================================================

/**
 * CÁC VẤN ĐỀ ĐÃ GẶP VÀ CÁCH FIX:
 * 
 * 1. Visual không biến mất sau khi nhặt:
 *    - Nguyên nhân: Nhiều đường render đọc từ mapDef thay vì liveArrays
 *    - Fix: Chỉ render từ live arrays trong play/race, skip consumed items
 * 
 * 2. Duplicate rendering:
 *    - Nguyên nhân: Inline fallback + RenderModule + secondary renderer cùng vẽ
 *    - Fix: Chỉ để RenderModule vẽ trong play/race, disable các path khác
 * 
 * 3. Static layer cache:
 *    - Nguyên nhân: Shield/Ram được cache vào static layer
 *    - Fix: Không vẽ Shield/Ram vào static layer, chỉ vẽ dynamic
 * 
 * CÁCH TÁI SỬ DỤNG:
 * 
 * 1. Copy các function render vào RenderModule
 * 2. Copy collision logic vào game loop
 * 3. Copy effect logic vào horse effect system
 * 4. Đảm bảo chỉ render từ live arrays trong play/race
 * 5. Đảm bảo consumed items được skip
 * 6. Đảm bảo không vẽ vào static layer
 */

module.exports = {
  // Shield
  drawShields_BACKUP,
  applyShieldEffect_BACKUP,
  drawShieldEffect_BACKUP,
  drawShieldTimer_BACKUP,
  nearShield_BACKUP,
  handleShieldPickup_BACKUP,
  
  // Ram
  drawRams_BACKUP,
  applyRamEffect_BACKUP,
  checkRamAuraCollision_BACKUP,
  drawRamTimer_BACKUP,
  nearRam_BACKUP,
  handleRamPickup_BACKUP,
  
  // Init
  initShieldRamArrays_BACKUP,
  initLiveShieldRamArrays_BACKUP
};
