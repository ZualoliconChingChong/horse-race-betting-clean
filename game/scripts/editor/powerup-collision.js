/**
 * Power-up Collision Detection
 * Helper functions to detect if mouse is near power-ups in editor
 * 
 * Public API:
 * - window.PowerupCollision (module object)
 * - window.nearBoost(), nearTurbo(), nearShield(), etc. (for compatibility)
 * 
 * Dependencies:
 * - window.mapDef
 */

(function() {
  'use strict';

  // ===== Power-up Collision Detection Functions =====

  function nearBoost(mx, my) {
    for (let i = 0; i < (window.mapDef.boosts || []).length; i++) {
      const b = window.mapDef.boosts[i];
      if (Math.hypot(mx - b.x, my - b.y) < b.r) return i;
    }
    return -1;
  }

  function nearTeleport(mx, my) {
    for (let i = 0; i < (window.mapDef.teleports || []).length; i++) {
      const t = window.mapDef.teleports[i];
      if (Math.hypot(mx - t.x, my - t.y) < t.r) return i;
    }
    return -1;
  }

  function nearMagnet(mx, my) {
    for (let i = 0; i < (window.mapDef.magnets || []).length; i++) {
      const m = window.mapDef.magnets[i];
      if (Math.hypot(mx - m.x, my - m.y) < m.r) return i;
    }
    return -1;
  }

  function nearPoison(mx, my) {
    for (let i = 0; i < (window.mapDef.poisons || []).length; i++) {
      const p = window.mapDef.poisons[i];
      if (Math.hypot(mx - p.x, my - p.y) < p.r) return i;
    }
    return -1;
  }

  function nearWarpzone(mx, my) {
    for (let i = 0; i < (window.mapDef.warpzones || []).length; i++) {
      const w = window.mapDef.warpzones[i];
      if (Math.hypot(mx - w.x, my - w.y) < w.r) return i;
    }
    return -1;
  }

  function nearQuantumdash(mx, my) {
    for (let i = 0; i < (window.mapDef.quantumdashs || []).length; i++) {
      const q = window.mapDef.quantumdashs[i];
      if (Math.hypot(mx - q.x, my - q.y) < q.r) return i;
    }
    return -1;
  }

  function nearYellowheart(mx, my) {
    for (let i = 0; i < (window.mapDef.yellowhearts || []).length; i++) {
      const item = window.mapDef.yellowhearts[i];
      const radius = item.r || 18;
      if (Math.hypot(mx - item.x, my - item.y) < radius) return i;
    }
    return -1;
  }

  function nearNebula(mx, my) {
    for (let i = 0; i < (window.mapDef.nebulas || []).length; i++) {
      const n = window.mapDef.nebulas[i];
      if (Math.hypot(mx - n.x, my - n.y) < (n.r || 16)) return i;
    }
    return -1;
  }

  function nearShield(mx, my) {
    for (let i = 0; i < (window.mapDef.shields || []).length; i++) {
      const s = window.mapDef.shields[i];
      if (Math.hypot(mx - s.x, my - s.y) < s.r) return i;
    }
    return -1;
  }

  function nearTimeFreeze(mx, my) {
    for (let i = 0; i < (window.mapDef.timeFreezes || []).length; i++) {
      const tf = window.mapDef.timeFreezes[i];
      if (Math.hypot(mx - tf.x, my - tf.y) < tf.r) return i;
    }
    return -1;
  }

  function nearIceFreezer(mx, my) {
    for (let i = 0; i < (window.mapDef.icefreezers || []).length; i++) {
      const ice = window.mapDef.icefreezers[i];
      if (Math.hypot(mx - ice.x, my - ice.y) < ice.r) return i;
    }
    return -1;
  }

  function nearTurbo(mx, my) {
    for (let i = 0; i < (window.mapDef.turbos || []).length; i++) {
      const t = window.mapDef.turbos[i];
      if (Math.hypot(mx - t.x, my - t.y) < t.r) return i;
    }
    return -1;
  }

  function nearRam(mx, my) {
    for (let i = 0; i < (window.mapDef.rams || []).length; i++) {
      const r = window.mapDef.rams[i];
      if (Math.hypot(mx - r.x, my - r.y) < r.r) return i;
    }
    return -1;
  }

  function nearMud(mx, my) {
    for (let i = 0; i < (window.mapDef.mudPatches || []).length; i++) {
      const mud = window.mapDef.mudPatches[i];
      if (Math.hypot(mx - mud.x, my - mud.y) < mud.r) return i;
    }
    return -1;
  }

  function nearRotBarrier(mx, my) {
    for (let i = 0; i < (window.mapDef.rotatingBarriers || []).length; i++) {
      const barrier = window.mapDef.rotatingBarriers[i];
      if (Math.hypot(mx - barrier.x, my - barrier.y) < barrier.length / 2 + 10) return i;
    }
    return -1;
  }

  function nearMagnetpull(mx, my) {
    for (let i = 0; i < (window.mapDef.magnetpulls || []).length; i++) {
      const item = window.mapDef.magnetpulls[i];
      if (Math.hypot(mx - item.x, my - item.y) < 15) return i;
    }
    return -1;
  }

  function nearMagnetpush(mx, my) {
    for (let i = 0; i < (window.mapDef.magnetpushs || []).length; i++) {
      const item = window.mapDef.magnetpushs[i];
      if (Math.hypot(mx - item.x, my - item.y) < 15) return i;
    }
    return -1;
  }

  function nearLightning(mx, my) {
    for (let i = 0; i < (window.mapDef.lightnings || []).length; i++) {
      const item = window.mapDef.lightnings[i];
      if (Math.hypot(mx - item.x, my - item.y) < (item.r || 18)) return i;
    }
    return -1;
  }

  function nearVolcano(mx, my) {
    for (let i = 0; i < (window.mapDef.volcanos || []).length; i++) {
      const item = window.mapDef.volcanos[i];
      if (Math.hypot(mx - item.x, my - item.y) < (item.r || 18)) return i;
    }
    return -1;
  }

  function nearTornado(mx, my) {
    for (let i = 0; i < (window.mapDef.tornados || []).length; i++) {
      const item = window.mapDef.tornados[i];
      if (Math.hypot(mx - item.x, my - item.y) < (item.r || 18)) return i;
    }
    return -1;
  }

  // ===== Public API =====
  const PowerupCollision = {
    nearBoost,
    nearTeleport,
    nearMagnet,
    nearPoison,
    nearWarpzone,
    nearQuantumdash,
    nearYellowheart,
    nearNebula,
    nearShield,
    nearTimeFreeze,
    nearIceFreezer,
    nearTurbo,
    nearRam,
    nearMud,
    nearRotBarrier,
    nearMagnetpull,
    nearMagnetpush,
    nearLightning,
    nearVolcano,
    nearTornado
  };

  if (typeof window !== 'undefined') {
    window.PowerupCollision = Object.freeze(PowerupCollision);
    
    // Backward compatibility - expose all functions to window
    window.nearBoost = nearBoost;
    window.nearTeleport = nearTeleport;
    window.nearMagnet = nearMagnet;
    window.nearPoison = nearPoison;
    window.nearWarpzone = nearWarpzone;
    window.nearQuantumdash = nearQuantumdash;
    window.nearYellowheart = nearYellowheart;
    window.nearNebula = nearNebula;
    window.nearShield = nearShield;
    window.nearTimeFreeze = nearTimeFreeze;
    window.nearIceFreezer = nearIceFreezer;
    window.nearTurbo = nearTurbo;
    window.nearRam = nearRam;
    window.nearMud = nearMud;
    window.nearRotBarrier = nearRotBarrier;
    window.nearMagnetpull = nearMagnetpull;
    window.nearMagnetpush = nearMagnetpush;
    window.nearLightning = nearLightning;
    window.nearVolcano = nearVolcano;
    window.nearTornado = nearTornado;
  }

  try {
    console.log('[PowerupCollision] Loaded successfully');
  } catch {}
})();
