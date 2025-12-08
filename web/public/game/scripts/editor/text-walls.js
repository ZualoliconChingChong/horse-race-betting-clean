/**
 * Text Walls Generator
 * Converts text to wall shapes using Canvas text rendering
 */

(function() {
  'use strict';

  let textWallsClickPosition = null;

  /**
   * Convert text to brush strokes by tracing outline
   * @param {string} text - Text to render
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontStyle - Font style (e.g., "bold Arial")
   * @param {number} brushRadius - Brush radius for strokes
   * @param {boolean} merge - If true, merge all strokes into single brush
   * @returns {Array} Array of brush objects
   */
  function textToWalls(text, x, y, fontSize, fontStyle, brushRadius, merge = false) {
    console.log(`🔤 [TextWalls] Converting text "${text}" to brush strokes`);
    console.log(`   Font: ${fontStyle} ${fontSize}px, Brush: ${brushRadius}px`);
    
    // Create offscreen canvas for text rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Measure text for canvas size
    ctx.font = `${fontSize}px ${fontStyle}`;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.5);
    
    // Set canvas size with padding
    const padding = brushRadius * 2 + 10;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;
    
    // Draw text on canvas
    ctx.font = `${fontSize}px ${fontStyle}`;
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';
    ctx.fillText(text, padding, padding);
    
    console.log(`   📐 Canvas: ${canvas.width}x${canvas.height}`);
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Find actual text bounding box to avoid sampling empty padding
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const idx = (py * canvas.width + px) * 4;
        if (pixels[idx + 3] > 128) {
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
      }
    }
    
    console.log(`   📦 Text bounds: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
    
    // Sample points from text pixels - scan row by row for proper ordering
    const points = [];
    
    // PERFORMANCE OPTIMIZATION: Adaptive sampling based on font size
    // Gentler scaling to preserve visual quality while improving performance
    const baseSampleStep = Math.max(1, Math.floor(brushRadius * 0.5)); // Denser base sampling
    const fontSizeScale = Math.max(1, fontSize / 80); // Less aggressive scaling (80 instead of 50)
    const scaleFactor = 1 + (Math.sqrt(fontSizeScale) - 1) * 0.5; // 50% gentler scaling
    const sampleStep = Math.max(1, Math.floor(baseSampleStep * scaleFactor));
    
    console.log(`   🎯 Sample step: ${sampleStep}px (base: ${baseSampleStep}, scale: ${scaleFactor.toFixed(2)})`);
    
    // Scan only within text bounds, row by row, left to right (natural reading order)
    for (let py = minY; py <= maxY; py += sampleStep) {
      for (let px = minX; px <= maxX; px += sampleStep) {
        const idx = (py * canvas.width + px) * 4;
        const alpha = pixels[idx + 3];
        
        if (alpha > 128) { // Opaque pixel = part of text
          // Convert canvas coords to world coords
          // Use minX/minY as origin to ensure first point is at correct position
          const worldX = x + (px - minX);
          const worldY = y + (py - minY);
          points.push({ x: worldX, y: worldY });
        }
      }
    }
    
    console.log(`   ✅ Sampled ${points.length} points from text`);
    
    if (points.length === 0) {
      console.warn('   ⚠️ No points generated from text');
      return [];
    }
    
    // Points are already in row-by-row order, just group by Y proximity
    // to create horizontal scan-line strokes
    const brushes = [];
    
    if (points.length === 0) return [];
    
    // PERFORMANCE OPTIMIZATION: Smart stroke simplification
    // Remove redundant points while preserving curves and corners
    const simplifyPoints = (pts) => {
      if (pts.length <= 3) return pts;
      const simplified = [pts[0]];
      const minDist = brushRadius * 0.8; // Less aggressive (was 1.2)
      const angleThreshold = 0.15; // Preserve corners/curves (radians)
      
      for (let i = 1; i < pts.length - 1; i++) {
        const last = simplified[simplified.length - 1];
        const curr = pts[i];
        const next = pts[i + 1];
        
        const dx = curr.x - last.x;
        const dy = curr.y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle change to detect curves
        const dx1 = curr.x - last.x;
        const dy1 = curr.y - last.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;
        const angle1 = Math.atan2(dy1, dx1);
        const angle2 = Math.atan2(dy2, dx2);
        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        // Keep point if it's far enough OR there's a curve/corner
        if (dist >= minDist || angleDiff > angleThreshold) {
          simplified.push(curr);
        }
      }
      
      // Always keep last point
      simplified.push(pts[pts.length - 1]);
      return simplified;
    };
    
    // Group consecutive points that are on same/close Y level
    let currentStroke = [points[0]];
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Continue stroke if points are close (on same scan line)
      // Break stroke if there's a big jump (new letter or next row)
      if (dist < brushRadius * 3) {
        currentStroke.push(curr);
      } else {
        // Save current stroke if it has enough points
        if (currentStroke.length >= 2) {
          const simplified = simplifyPoints(currentStroke);
          brushes.push({
            type: 'brush',
            points: simplified,
            r: brushRadius
          });
        }
        // Start new stroke
        currentStroke = [curr];
      }
    }
    
    // Don't forget last stroke
    if (currentStroke.length >= 2) {
      const simplified = simplifyPoints(currentStroke);
      brushes.push({
        type: 'brush',
        points: simplified,
        r: brushRadius
      });
    }
    
    // Calculate total points for performance monitoring
    const totalPoints = brushes.reduce((sum, b) => sum + b.points.length, 0);
    console.log(`   ✅ Created ${brushes.length} brush strokes with ${totalPoints} total points`);
    console.log(`   ⚡ Performance: ${(totalPoints / points.length * 100).toFixed(1)}% point reduction`);
    
    // If merge is enabled, keep strokes as separate segments in one brush object
    if (merge && brushes.length > 0) {
      // Store multiple stroke segments in a single brush object
      // This allows selection/movement as one unit while preserving individual strokes
      const segments = brushes.map(b => b.points);
      
      console.log(`   🔗 Merging ${brushes.length} strokes into 1 brush with ${segments.length} segments`);
      return [{
        type: 'brush',
        points: [], // Empty array for merged text (use segments instead)
        segments: segments, // All segments stored separately
        r: brushRadius,
        isMergedText: true // Flag to indicate special rendering
      }];
    }
    
    return brushes;
  }

  /**
   * Show text walls dialog
   */
  function showTextWallsDialog(clickX, clickY) {
    textWallsClickPosition = { x: clickX, y: clickY };
    
    const overlay = document.getElementById('textWallsOverlay');
    const input = document.getElementById('textWallsInput');
    
    if (overlay && input) {
      overlay.style.display = 'flex';
      input.value = '';
      input.focus();
    }
  }

  /**
   * Hide text walls dialog
   */
  function hideTextWallsDialog() {
    const overlay = document.getElementById('textWallsOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    textWallsClickPosition = null;
  }

  /**
   * Create walls from text (converts to brush strokes)
   */
  function createTextWalls() {
    const text = document.getElementById('textWallsInput')?.value;
    const fontSize = parseInt(document.getElementById('textWallsFontSize')?.value || '100', 10);
    const fontStyle = document.getElementById('textWallsFontStyle')?.value || 'bold Arial';
    const blockSize = parseInt(document.getElementById('textWallsBlockSize')?.value || '3', 10);
    const merge = document.getElementById('textWallsMerge')?.checked ?? true;
    
    if (!text || !text.trim()) {
      alert('Please enter some text!');
      return;
    }
    
    if (!textWallsClickPosition) {
      alert('Error: No click position recorded');
      return;
    }
    
    try {
      // Convert text to brush strokes
      const brushes = textToWalls(
        text.trim(),
        textWallsClickPosition.x,
        textWallsClickPosition.y,
        fontSize,
        fontStyle,
        blockSize, // Use blockSize as brush radius
        merge // Merge all strokes into one brush if checked
      );
      
      if (brushes.length === 0) {
        alert('Failed to generate brush strokes from text.');
        return;
      }
      
      console.log(`🔤 Generated ${brushes.length} brush strokes from "${text}"`);
      
      // Add to mapDef.brushes array
      if (window.mapDef) {
        // Add history entry
        if (typeof window.pushHistory === 'function') {
          window.pushHistory('add_text_brushes');
        }
        
        // Initialize brushes array if needed
        if (!Array.isArray(window.mapDef.brushes)) {
          window.mapDef.brushes = [];
        }
        
        // Get wall color
        const wallColor = document.getElementById('shapeColor')?.value || '#607d8b';
        
        // Add all brush strokes
        const beforeCount = window.mapDef.brushes.length;
        for (const brush of brushes) {
          brush.color = wallColor;
          window.mapDef.brushes.push(brush);
        }
        console.log(`   📊 mapDef.brushes: ${beforeCount} → ${window.mapDef.brushes.length} (+${brushes.length})`);
        
        // Redraw
        if (typeof window.invalidateStaticLayer === 'function') {
          window.invalidateStaticLayer();
          console.log('   🔄 Static layer invalidated');
        }
        if (typeof window.drawMap === 'function') {
          window.drawMap();
          console.log('   🎨 Map redrawn');
        }
        if (typeof window.startMainLoop === 'function') {
          window.startMainLoop();
          console.log('   ▶️ Main loop started');
        }
        
        // Show notification
        if (typeof window.showNotification === 'function') {
          const message = brushes.length === 1 
            ? `✅ Created merged text as 1 brush object: "${text}"` 
            : `✅ Created text as ${brushes.length} brush strokes: "${text}"`;
          window.showNotification(message, 'success', 3000);
        }
      }
      
      // Close dialog
      hideTextWallsDialog();
      
    } catch (error) {
      console.error('Error creating text walls:', error);
      alert('Error creating text walls. Check console for details.');
    }
  }

  /**
   * Initialize text walls system
   */
  function initTextWalls() {
    // Cancel button
    const cancelBtn = document.getElementById('textWallsCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', hideTextWallsDialog);
    }
    
    // Create button
    const createBtn = document.getElementById('textWallsCreate');
    if (createBtn) {
      createBtn.addEventListener('click', createTextWalls);
    }
    
    // Enter key in input
    const input = document.getElementById('textWallsInput');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          createTextWalls();
        }
      });
    }
    
    // Close on overlay click
    const overlay = document.getElementById('textWallsOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          hideTextWallsDialog();
        }
      });
    }
    
    console.log('[TextWalls] Initialized');
  }

  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.showTextWallsDialog = showTextWallsDialog;
    window.hideTextWallsDialog = hideTextWallsDialog;
    window.createTextWalls = createTextWalls;
    window.textToWalls = textToWalls;
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextWalls);
  } else {
    initTextWalls();
  }

})();
