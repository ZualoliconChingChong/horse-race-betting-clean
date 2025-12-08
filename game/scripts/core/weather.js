/**
 * Weather System
 * Manages weather effects: rain, wind, snow, storm
 * Affects horse movement and renders visual effects
 */

/**
 * Apply weather effects to horse movement
 * @param {object} h - Horse object
 * @param {number} dt - Delta time
 * @param {string} mode - Game mode ('play', 'race', etc.)
 */
function applyWeatherEffects(h, dt, mode) {
  if (!mapDef || !mapDef.weather || !mapDef.weather.enabled) return;
  if (mode !== 'play' && mode !== 'race') return;
  
  const weather = mapDef.weather;
  const intensity = Math.max(0, Math.min(1, weather.intensity || 0.5));
  
  // Initialize weather modifiers if not exists
  if (typeof h.weatherSpeedModifier !== 'number') h.weatherSpeedModifier = 1.0;
  if (typeof h.weatherSlipModifier !== 'number') h.weatherSlipModifier = 1.0;
  
  // Reset weather effects each frame
  h.weatherSpeedModifier = 1.0;
  h.weatherSlipModifier = 1.0;
  
  switch (weather.type) {
    case 'rain':
      // Rain: Reduces speed and increases sliding
      h.weatherSpeedModifier = 1.0 - (intensity * 0.3); // Up to 30% speed reduction
      h.weatherSlipModifier = 1.0 + (intensity * 0.5); // Up to 50% more sliding
      
      // Add random droplet splash effects
      if (Math.random() < intensity * 0.02) {
        try {
          const splashX = h.x + (Math.random() - 0.5) * h.r * 2;
          const splashY = h.y + (Math.random() - 0.5) * h.r * 2;
          if (typeof createExplosion === 'function') {
            createExplosion(splashX, splashY, '#4FC3F7', 3);
          }
        } catch {}
      }
      break;
      
    case 'wind':
      // Wind: Pushes horses in wind direction
      const windForce = intensity * 0.8; // Wind strength
      const windX = Math.cos(weather.windDirection || 0) * windForce;
      const windY = Math.sin(weather.windDirection || 0) * windForce;
      
      h.vx += windX * dt * 60;
      h.vy += windY * dt * 60;
      
      // Slight speed reduction due to resistance
      h.weatherSpeedModifier = 1.0 - (intensity * 0.1);
      break;
      
    case 'snow':
      // Base snow effects
      h.weatherSpeedModifier = 1.0 - (intensity * 0.15); // Base 15% speed reduction
      h.weatherSlipModifier = 1.0 + (intensity * 0.6); // Base 60% more sliding
      
      // Individual snowflake hit effects
      if (typeof h.snowHitTime === 'number' && h.snowHitTime > 0) {
        const timeSinceHit = performance.now() - h.snowHitTime;
        const hitDuration = 2000; // Effect lasts 2 seconds
        
        if (timeSinceHit < hitDuration) {
          // Additional slowdown from snowflake hits (stacks with base effect)
          const hitEffect = Math.max(0, 1 - (timeSinceHit / hitDuration)); // Fade over time
          h.weatherSpeedModifier *= (1.0 - hitEffect * 0.3); // Additional 30% slowdown when hit
          h.weatherSlipModifier *= (1.0 + hitEffect * 0.4); // Additional 40% more sliding when hit
        } else {
          // Clear expired hit effect
          h.snowHitTime = 0;
        }
      }
      
      // Add snowflake particles
      if (Math.random() < intensity * 0.03) {
        try {
          const snowX = h.x + (Math.random() - 0.5) * h.r * 3;
          const snowY = h.y + (Math.random() - 0.5) * h.r * 3;
          if (typeof particles !== 'undefined' && Array.isArray(particles)) {
            particles.push({ 
              x: snowX, y: snowY, 
              vx: (Math.random() - 0.5) * 0.5, 
              vy: Math.random() * 0.5 + 0.2, 
              life: 30 + Math.random() * 20, 
              color: 'rgba(255,255,255,0.8)' 
            });
          }
        } catch {}
      }
      break;
      
    case 'storm':
      // Storm: Combines rain + wind + lightning
      h.weatherSpeedModifier = 1.0 - (intensity * 0.4); // Up to 40% speed reduction
      h.weatherSlipModifier = 1.0 + (intensity * 0.6); // Up to 60% more sliding
      
      // Wind effect
      const stormWindX = Math.cos(weather.windDirection || 0) * intensity * 1.2;
      const stormWindY = Math.sin(weather.windDirection || 0) * intensity * 1.2;
      h.vx += stormWindX * dt * 60;
      h.vy += stormWindY * dt * 60;
      
      // Random lightning flash effects
      if (Math.random() < intensity * 0.001) {
        try {
          if (typeof createExplosion === 'function') {
            createExplosion(h.x, h.y, '#FFEB3B', 15);
          }
          // Screen flash effect
          if (typeof shakeScreen === 'function') {
            shakeScreen(100, 5);
          }
        } catch {}
      }
      break;
  }
}

/**
 * Render weather background overlay (static layer)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function renderWeatherBackground(ctx, canvas) {
  if (!mapDef || !mapDef.weather || !mapDef.weather.enabled) return;
  if (mapDef.weather.type === 'clear') return;
  
  const weather = mapDef.weather;
  const intensity = Math.max(0, Math.min(1, weather.intensity || 0.5));
  
  ctx.save();
  switch (weather.type) {
    case 'rain':
      // Dark overlay for rain
      ctx.fillStyle = `rgba(50, 50, 70, ${intensity * 0.3})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
      
    case 'snow':
      // Winter atmosphere overlay - cooler blue-white tint
      ctx.fillStyle = `rgba(220, 235, 255, ${intensity * 0.5})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Add subtle frost effect
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
      
    case 'storm':
      // Very dark overlay for storm
      ctx.fillStyle = `rgba(30, 30, 40, ${intensity * 0.5})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
  }
  ctx.restore();
}

/**
 * Render weather dynamic effects (particles, animations)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function renderWeatherDynamic(ctx, canvas) {
  if (!mapDef || !mapDef.weather || !mapDef.weather.enabled) return;
  if (mapDef.weather.type === 'clear') return;
  
  const weather = mapDef.weather;
  const intensity = Math.max(0, Math.min(1, weather.intensity || 0.5));
  const now = performance.now();
  
  ctx.save();
  switch (weather.type) {
    case 'rain':
      // Realistic falling raindrops
      ctx.strokeStyle = `rgba(173, 216, 230, ${intensity * 0.8})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < intensity * 120; i++) {
        // Rain falls straight down with slight angle
        const fallSpeed = 2.0 + (i % 3) * 0.5; // Fast falling (2.0-3.0)
        const angle = -0.1; // Slight diagonal angle
        
        const startX = (i * 31) % (canvas.width + 60);
        const x = startX + Math.sin(now * 0.0005 + i) * 5; // Very slight wind sway
        const y = ((now * fallSpeed + i * 50) % (canvas.height + 100)) - 50;
        
        // Only draw visible raindrops
        if (x >= -10 && x <= canvas.width + 10 && y >= -10 && y <= canvas.height + 10) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.sin(angle) * 8, y + Math.cos(angle) * 8);
          ctx.stroke();
        }
      }
      break;
      
    case 'wind':
      // Wind effect lines
      ctx.strokeStyle = `rgba(200, 200, 200, ${intensity * 0.4})`;
      ctx.lineWidth = 1;
      const windAngle = weather.windDirection || 0;
      const windX = Math.cos(windAngle) * 15;
      const windY = Math.sin(windAngle) * 15;
      
      for (let i = 0; i < intensity * 30; i++) {
        const baseX = (now * 0.05 + i * 31) % (canvas.width + 100) - 50;
        const baseY = (i * 37) % canvas.height;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + windX, baseY + windY);
        ctx.stroke();
      }
      break;
      
    case 'snow':
      // Interactive falling snowflakes that affect horses
      const snowCount = Math.floor(intensity * 80);
      for (let i = 0; i < snowCount; i++) {
        // Each snowflake has its own falling speed and horizontal drift
        const fallSpeed = 0.8 + (i % 3) * 0.4; // Different fall speeds (0.8-1.6)
        const drift = Math.sin(now * 0.001 + i * 0.5) * 15; // Gentle side-to-side drift
        
        // Calculate falling position
        const startX = (i * 53) % (canvas.width + 120); // Spread across width
        const x = startX + drift;
        const y = ((now * fallSpeed + i * 150) % (canvas.height + 250)) - 150; // Fall from top
        
        // Snowflake properties
        const size = 2 + (i % 3) * 1; // Varied sizes (2-4px) - more visible
        const alpha = 0.7 + Math.sin(now * 0.002 + i * 0.3) * 0.3; // Twinkling
        
        // Check collision with horses if snowflake is active
        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          // Check collision with all horses
          if (typeof horses !== 'undefined' && horses) {
            let hitHorse = false;
            for (let h of horses) {
              if (h && typeof h.x === 'number' && typeof h.y === 'number') {
                const dx = x - h.x;
                const dy = y - h.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If snowflake hits horse (within horse radius + snowflake size)
                if (distance < (h.r || 8) + size) {
                  // Apply snow effect to horse
                  if (typeof h.snowHitTime !== 'number') h.snowHitTime = 0;
                  h.snowHitTime = now; // Mark when horse was hit by snow
                  
                  // Create small snow burst effect
                  try {
                    if (typeof createExplosion === 'function') {
                      createExplosion(x, y, '#E3F2FD', 5);
                    }
                  } catch {}
                  
                  hitHorse = true;
                  break;
                }
              }
            }
            
            if (hitHorse) continue; // Don't render this snowflake
          }
          
          // Render snowflake if it didn't hit any horse
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * intensity})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add sparkle effect for larger flakes
          if (size > 3 && alpha > 0.8) {
            ctx.fillStyle = `rgba(240, 248, 255, ${alpha * intensity * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
      
    case 'storm':
      // Storm combines rain + wind + lightning flashes
      // Rain
      ctx.strokeStyle = `rgba(100, 150, 200, ${intensity * 0.9})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < intensity * 150; i++) {
        const x = (now * 0.2 + i * 13) % (canvas.width + 50) - 25;
        const y = (now * 3 + i * 37) % (canvas.height + 100) - 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 12);
        ctx.stroke();
      }
      
      // Wind streaks
      ctx.strokeStyle = `rgba(150, 150, 150, ${intensity * 0.6})`;
      ctx.lineWidth = 1;
      const stormWindAngle = weather.windDirection || 0;
      const stormWindX = Math.cos(stormWindAngle) * 20;
      const stormWindY = Math.sin(stormWindAngle) * 20;
      for (let i = 0; i < intensity * 40; i++) {
        const baseX = (now * 0.08 + i * 29) % (canvas.width + 100) - 50;
        const baseY = (i * 31) % canvas.height;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + stormWindX, baseY + stormWindY);
        ctx.stroke();
      }
      
      // Random lightning flashes
      if (Math.random() < intensity * 0.003) {
        ctx.fillStyle = `rgba(255, 255, 200, ${intensity * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      break;
  }
  ctx.restore();
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.WeatherSystem = {
    applyWeatherEffects,
    renderWeatherBackground,
    renderWeatherDynamic
  };
  
  // Backward compatibility
  window.applyWeatherEffects = applyWeatherEffects;
  window.renderWeatherBackground = renderWeatherBackground;
  window.renderWeatherDynamic = renderWeatherDynamic;
}
