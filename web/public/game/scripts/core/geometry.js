/**
 * Geometry Helpers & Collision Detection
 * Math utilities and shape drawing/collision functions
 */

/**
 * Clamp value between min and max
 * @param {number} v - Value
 * @param {number} a - Min
 * @param {number} b - Max
 * @returns {number}
 */
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

/**
 * Draw rounded rectangle path on canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {number} r - Corner radius
 */
function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw capsule shape (rounded line segment)
 */
function drawCapsule(x1, y1, x2, y2, r) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);
  const L = Math.hypot(x2 - x1, y2 - y1);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(L, -r);
  ctx.arc(L, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, r);
  ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draw semicircle shape
 */
function drawSemi(x, y, r, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draw brush stroke (line with thickness)
 * Supports merged text brushes with segments array
 * OPTIMIZED: Uses Path2D for better performance
 */
function drawBrushStroke(points, r, isOutline, brushObj) {
  // Check if this is a merged text with multiple segments
  if (brushObj && brushObj.segments && Array.isArray(brushObj.segments)) {
    // PERFORMANCE OPTIMIZATION: Use cached Path2D if available
    if (!brushObj._cachedPath2D || !(brushObj._cachedPath2D instanceof Path2D)) {
      // Create Path2D once and cache it
      const path = new Path2D();
      let hasValidSegments = false;
      for (const segmentPoints of brushObj.segments) {
        if (!segmentPoints || segmentPoints.length < 2) continue;
        path.moveTo(segmentPoints[0].x, segmentPoints[0].y);
        for (let i = 1; i < segmentPoints.length; i++) {
          path.lineTo(segmentPoints[i].x, segmentPoints[i].y);
        }
        hasValidSegments = true;
      }
      if (!hasValidSegments) return; // No valid segments, skip drawing
      brushObj._cachedPath2D = path;
    }
    
    // Draw all segments in ONE stroke call using cached path
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = r * 2;
    ctx.stroke(brushObj._cachedPath2D);
    return;
  }
  
  // Normal brush stroke rendering
  if (!points || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = r * 2;
  ctx.stroke();
}

/**
 * Draw arc band (thick arc)
 */
function drawArcBand(x, y, r, thick, ang, span) {
  const r1 = Math.max(2, r - thick / 2);
  const r2 = r + thick / 2;
  const a0 = ang - span / 2;
  const a1 = ang + span / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r2, a0, a1, false);
  ctx.arc(x, y, r1, a1, a0, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Calculate distance from point to line segment
 */
function pointSegDist(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy || 1;
  let t = ((px - x1) * vx + (py - y1) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * vx;
  const qy = y1 + t * vy;
  const dx = px - qx;
  const dy = py - qy;
  return { d: Math.hypot(dx, dy), qx, qy, t };
}

/**
 * Circle vs rounded rectangle collision
 */
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh, rr = 12) {
  const coreX = clamp(cx, rx + rr, rx + rw - rr);
  const coreY = clamp(cy, ry + rr, ry + rh - rr);
  const dx = cx - coreX;
  const dy = cy - coreY;
  if (dx * dx + dy * dy <= cr * cr) {
    return { hit: true, nx: dx, ny: dy, overlap: cr - Math.hypot(dx, dy) };
  }
  let nx = clamp(cx, rx, rx + rw);
  let ny = clamp(cy, ry, ry + rh);
  let ddx = cx - nx;
  let ddy = cy - ny;
  if (ddx * ddx + ddy * ddy <= cr * cr) {
    return { hit: true, nx: ddx, ny: ddy, overlap: cr - Math.hypot(ddx, ddy) };
  }
  return { hit: false };
}

/**
 * Circle vs rotated rounded rectangle (OBB) collision
 */
function circleOBBCollide(cx, cy, cr, rx, ry, rw, rh, rr = 12, ang = 0) {
  if (!ang) return circleRectCollide(cx, cy, cr, rx, ry, rw, rh, rr);
  const cxr = rx + rw / 2;
  const cyr = ry + rh / 2;
  const ca = Math.cos(-ang);
  const sa = Math.sin(-ang);
  // Transform circle center into rect local coordinates
  const lx = ca * (cx - cxr) - sa * (cy - cyr);
  const ly = sa * (cx - cxr) + ca * (cy - cyr);
  // Now rect is axis-aligned, shift to top-left for circleRectCollide
  const loc = circleRectCollide(lx + rw / 2, ly + rh / 2, cr, 0, 0, rw, rh, rr);
  if (!loc.hit) return loc;
  // Rotate normal back to world space
  const c2 = Math.cos(ang);
  const s2 = Math.sin(ang);
  const wx = loc.nx * c2 - loc.ny * s2;
  const wy = loc.nx * s2 + loc.ny * c2;
  return { hit: true, nx: wx, ny: wy, overlap: loc.overlap };
}

/**
 * Check if point is inside rotated rectangle
 */
function pointInRotRect(px, py, rx, ry, rw, rh, ang = 0) {
  if (!ang) {
    return (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh);
  }
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const ca = Math.cos(-ang);
  const sa = Math.sin(-ang);
  const lx = ca * (px - cx) - sa * (py - cy);
  const ly = sa * (px - cx) + ca * (py - cy);
  return (Math.abs(lx) <= rw / 2) && (Math.abs(ly) <= rh / 2);
}

/**
 * Circle vs capsule collision
 */
function circleCapsuleCollide(cx, cy, cr, x1, y1, x2, y2, rr) {
  const { d, qx, qy } = pointSegDist(cx, cy, x1, y1, x2, y2);
  const R = rr + cr;
  if (d <= R) {
    let nx = cx - qx;
    let ny = cy - qy;
    let len = Math.hypot(nx, ny) || 1;
    if (len === 0) {
      const vx = x2 - x1;
      const vy = y2 - y1;
      nx = -vy;
      ny = vx;
      len = Math.hypot(nx, ny);
    }
    return { hit: true, nx, ny, overlap: (R - len) };
  }
  return { hit: false };
}

/**
 * Circle vs semicircle collision
 */
function circleSemiCollide(cx, cy, cr, sx, sy, sr, ang) {
  const nx = Math.cos(ang);
  const ny = Math.sin(ang);
  const tx = -ny;
  const ty = nx;
  const vx = cx - sx;
  const vy = cy - sy;
  const s = vx * nx + vy * ny;
  if (s >= 0) {
    const dist = Math.hypot(vx, vy);
    const R = sr + cr;
    if (dist <= R) return { hit: true, nx: vx, ny: vy, overlap: R - dist };
    return { hit: false };
  } else {
    const x1 = sx + tx * (-sr);
    const y1 = sy + ty * (-sr);
    const x2 = sx + tx * (sr);
    const y2 = sy + ty * (sr);
    return circleCapsuleCollide(cx, cy, cr, x1, y1, x2, y2, 0);
  }
}

/**
 * Circle vs arc band collision
 */
function circleArcCollide(cx, cy, cr, ax, ay, r, thick, ang, span) {
  const r1 = Math.max(1, r - thick / 2);
  const r2 = r + thick / 2;
  const vx = cx - ax;
  const vy = cy - ay;
  const rr = Math.hypot(vx, vy);
  let a = Math.atan2(vy, vx) - ang;
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  const half = span / 2;
  if (Math.abs(a) > half) return { hit: false };
  if (rr > r2) {
    const pen = r2 + cr - rr;
    if (pen > 0) return { hit: true, nx: vx, ny: vy, overlap: pen };
    return { hit: false };
  } else if (rr < r1) {
    const pen = (r1 - rr) - cr;
    if (pen < 0) return { hit: true, nx: -vx, ny: -vy, overlap: -pen };
    return { hit: false };
  } else {
    const toOuter = r2 - rr;
    const toInner = rr - r1;
    if (toOuter < toInner) return { hit: true, nx: vx, ny: vy, overlap: toOuter + cr * 0.6 };
    else return { hit: true, nx: -vx, ny: -vy, overlap: toInner + cr * 0.6 };
  }
}

/**
 * Reflect horse velocity off surface
 */
function reflect(h, nx, ny) {
  // Check if collision speed change prevention is enabled
  const preventSpeedChange = (window.config && window.config.physics && window.config.physics.collision && window.config.physics.collision.preventSpeedChange) || false;
  
  // Normalize collision normal
  const len = Math.hypot(nx, ny) || 1;
  const nxu = nx / len;
  const nyu = ny / len;
  const dot = h.vx * nxu + h.vy * nyu;
  
  if (!preventSpeedChange) {
    // Normal velocity reflection with energy loss
    h.vx = h.vx - 2 * dot * nxu;
    h.vy = h.vy - 2 * nyu * dot;

    // Apply weather slip effects
    if (typeof h.weatherSlipModifier === 'number' && h.weatherSlipModifier > 1.0) {
      // Reduce reflection damping for slippery conditions
      const slipFactor = Math.min(2.0, h.weatherSlipModifier);
      h.vx *= (0.7 + 0.3 * slipFactor); // Less energy loss in slippery conditions
      h.vy *= (0.7 + 0.3 * slipFactor);
    }
  } else {
    // Preserve speed mode: Reflect direction but maintain speed magnitude
    const currentSpeed = Math.hypot(h.vx, h.vy);
    
    // Reflect velocity vector
    h.vx = h.vx - 2 * dot * nxu;
    h.vy = h.vy - 2 * nyu * dot;
    
    // Restore original speed magnitude
    const newSpeed = Math.hypot(h.vx, h.vy);
    if (newSpeed > 0.001) {
      const speedRatio = currentSpeed / newSpeed;
      h.vx *= speedRatio;
      h.vy *= speedRatio;
    }
  }
}

/**
 * Push horse out along collision normal
 */
function pushOutAlong(h, nx, ny, overlap) {
  const len = Math.hypot(nx, ny) || 1;
  h.x += (nx / len) * (overlap + 0.1);
  h.y += (ny / len) * (overlap + 0.1);
}

/**
 * Clamp position inside waiting room
 */
function insideRoomClamp(x, y) {
  if (typeof mapDef === 'undefined' || !mapDef.waitingRoom) {
    return { x, y };
  }
  const rm = mapDef.waitingRoom;
  const m = 16;
  x = clamp(x, rm.x + m, rm.x + rm.w - m);
  y = clamp(y, rm.y + m, rm.y + rm.h - m);
  return { x, y };
}

/**
 * Generate spawn points based on preset
 */
function makeSpawnsPreset(n, preset) {
  if (typeof mapDef === 'undefined' || !mapDef.waitingRoom) {
    // Silently return if map not ready yet (called during init)
    return [];
  }
  
  const rm = mapDef.waitingRoom;
  const gap = 28;
  const pts = [];
  
  if (preset === 'line') {
    const x = rm.x + rm.w * 0.3;
    const top = rm.y + 24;
    for (let i = 0; i < n; i++) pts.push(insideRoomClamp(x, top + i * gap));
  } else if (preset === 'grid2') {
    const left = rm.x + rm.w * 0.28;
    const right = rm.x + rm.w * 0.52;
    const top = rm.y + 24;
    for (let i = 0; i < n; i++) {
      const col = (i % 2 === 0) ? left : right;
      const row = top + Math.floor(i / 2) * gap;
      pts.push(insideRoomClamp(col, row));
    }
  } else if (preset === 'fan') {
    const cx = rm.x + rm.w * 0.35;
    const cy = rm.y + rm.h * 0.5;
    const r = Math.min(rm.w, rm.h) * 0.32;
    const a0 = -Math.PI * 0.4;
    const a1 = Math.PI * 0.4;
    for (let i = 0; i < n; i++) {
      const t = (n === 1) ? 0.5 : i / (n - 1);
      const a = a0 + t * (a1 - a0);
      pts.push(insideRoomClamp(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  } else if (preset === 'scatter') {
    for (let i = 0; i < n; i++) {
      const x = rm.x + 20 + Math.random() * (rm.w - 40);
      const y = rm.y + 20 + Math.random() * (rm.h - 40);
      pts.push({ x, y });
    }
  } else { // auto grid based on room size
    const cols = Math.max(2, Math.floor(rm.w / 40));
    const rows = Math.max(2, Math.ceil(n / cols));
    const sx = rm.x + 20;
    const sy = rm.y + 20;
    const cw = (rm.w - 40) / (cols - 1 || 1);
    const ch = (rm.h - 40) / (rows - 1 || 1);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      pts.push({ x: sx + c * cw, y: sy + r * ch });
    }
  }
  
  mapDef.spawnPoints = pts.slice(0, n);
  return mapDef.spawnPoints;
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.GeometryUtils = {
    clamp,
    roundRectPath,
    drawCapsule,
    drawSemi,
    drawBrushStroke,
    drawArcBand,
    pointSegDist,
    circleRectCollide,
    circleOBBCollide,
    pointInRotRect,
    circleCapsuleCollide,
    circleSemiCollide,
    circleArcCollide,
    reflect,
    pushOutAlong,
    insideRoomClamp,
    makeSpawnsPreset
  };
  
  // Backward compatibility
  window.clamp = clamp;
  window.roundRectPath = roundRectPath;
  window.drawCapsule = drawCapsule;
  window.drawSemi = drawSemi;
  window.drawBrushStroke = drawBrushStroke;
  window.drawArcBand = drawArcBand;
  window.pointSegDist = pointSegDist;
  window.circleRectCollide = circleRectCollide;
  window.circleOBBCollide = circleOBBCollide;
  window.pointInRotRect = pointInRotRect;
  window.circleCapsuleCollide = circleCapsuleCollide;
  window.circleSemiCollide = circleSemiCollide;
  window.circleArcCollide = circleArcCollide;
  window.reflect = reflect;
  window.pushOutAlong = pushOutAlong;
  window.insideRoomClamp = insideRoomClamp;
  window.makeSpawnsPreset = makeSpawnsPreset;
}
