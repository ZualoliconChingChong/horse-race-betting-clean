// DEBUG CUSTOM SPEED - Paste này vào Console (F12)

function debugSpeed() {
  console.log('=== CUSTOM SPEED DEBUG ===');
  
  if (!window.horses || window.horses.length === 0) {
    console.log('❌ No horses found! Start race first.');
    return;
  }
  
  const h = window.horses[0];
  console.log('\n🐎 Horse #0:');
  console.log('  Name:', h.name);
  console.log('  baseSpeed:', h.baseSpeed);
  console.log('  vx:', h.vx?.toFixed(3));
  console.log('  vy:', h.vy?.toFixed(3));
  console.log('  velocity:', Math.hypot(h.vx || 0, h.vy || 0).toFixed(3));
  console.log('  baseSpeedFactor:', h.baseSpeedFactor);
  console.log('  speedMod:', h.speedMod);
  
  // Check mapDef
  const custom = window.mapDef?.horseCustoms?.[0];
  if (custom) {
    console.log('\n📋 MapDef Horse #0:');
    console.log('  customSpeed:', custom.customSpeed);
    console.log('  customHP:', custom.customHP);
  }
  
  // Check if gate is open
  console.log('\n🚪 Gate Status:');
  console.log('  gateOpen:', window.gateOpen);
  console.log('  running:', window.running);
  console.log('  countdown:', window.countdown);
  
  console.log('\n======================');
}

// Quick check all horses
function debugAllSpeeds() {
  if (!window.horses || window.horses.length === 0) {
    console.log('❌ No horses found!');
    return;
  }
  
  console.log('=== ALL HORSES SPEEDS ===');
  window.horses.forEach((h, i) => {
    const vel = Math.hypot(h.vx || 0, h.vy || 0);
    const custom = window.mapDef?.horseCustoms?.[i];
    const customSpeed = custom?.customSpeed;
    console.log(
      `Horse ${i} "${h.name}": baseSpeed=${h.baseSpeed?.toFixed(2)}, ` +
      `velocity=${vel.toFixed(2)}, customSpeed=${customSpeed || 'none'}`
    );
  });
  console.log('========================');
}

// Force apply custom speed to running horses
function forceCustomSpeed() {
  if (!window.horses || window.horses.length === 0) {
    console.log('❌ No horses found!');
    return;
  }
  
  console.log('🔧 FORCING CUSTOM SPEEDS...');
  window.horses.forEach((h, i) => {
    const custom = window.mapDef?.horseCustoms?.[i];
    if (custom?.customSpeed && custom.customSpeed > 0) {
      const oldVel = Math.hypot(h.vx || 0, h.vy || 0);
      
      // Calculate direction
      const dir = Math.atan2(h.vy, h.vx);
      
      // Apply custom speed as velocity magnitude
      h.vx = Math.cos(dir) * custom.customSpeed;
      h.vy = Math.sin(dir) * custom.customSpeed;
      
      const newVel = Math.hypot(h.vx, h.vy);
      console.log(`  Horse ${i} "${h.name}": ${oldVel.toFixed(2)} → ${newVel.toFixed(2)} (custom: ${custom.customSpeed})`);
    }
  });
  console.log('✅ Done!');
}

console.log('📌 Debug commands loaded:');
console.log('  debugSpeed()       - Check horse #0 details');
console.log('  debugAllSpeeds()   - Check all horses');
console.log('  forceCustomSpeed() - Force apply custom speeds NOW');
