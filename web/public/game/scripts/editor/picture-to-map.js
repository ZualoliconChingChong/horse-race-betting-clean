// @ts-check
// Picture-to-Map Converter
// Converts uploaded images to map: edges → walls, colors → visual background

(function() {
  if (typeof window === 'undefined') return;

  /**
   * Detect outline boundaries (black pixels adjacent to light pixels)
   * Only detects actual outlines, not interior shading
   * @param {ImageData} imageData 
   * @param {number} darkThreshold - Darkness threshold (0-255)
   * @returns {Uint8ClampedArray} Binary edge map (255 = outline, 0 = not outline)
   */
  function detectEdges(imageData, darkThreshold = 80) {
    const { width, height, data } = imageData;
    const edges = new Uint8ClampedArray(width * height);
    
    // First pass: identify dark pixels
    const darkPixels = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const pixelIdx = y * width + x;
        darkPixels[pixelIdx] = brightness < darkThreshold ? 1 : 0;
      }
    }
    
    // Second pass: only keep dark pixels at boundaries (adjacent to light pixels)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixelIdx = y * width + x;
        if (darkPixels[pixelIdx] === 1) {
          // Check if adjacent to light pixel (outline boundary)
          let isBoundary = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nidx = (y + dy) * width + (x + dx);
              if (darkPixels[nidx] === 0) {
                isBoundary = true;
                break;
              }
            }
            if (isBoundary) break;
          }
          edges[pixelIdx] = isBoundary ? 255 : 0;
        }
      }
    }
    
    return edges;
  }

  /**
   * Convert edge pixels to brush walls (simplified & merged)
   * Creates rectangular walls from edge pixels with merging
   * @param {Uint8ClampedArray} edges 
   * @param {number} width 
   * @param {number} height 
   * @param {number} canvasWidth - Target canvas width
   * @param {number} canvasHeight - Target canvas height
   * @returns {Array<{x: number, y: number, w: number, h: number, r: number}>}
   */
  function edgesToWalls(edges, width, height, canvasWidth, canvasHeight) {
    const walls = [];
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;
    
    // Wall thickness in pixels (will be scaled)
    const wallThickness = 8;
    
    // Aggressive sampling to reduce walls
    const sampleRate = Math.max(2, Math.floor(Math.min(width, height) / 50));
    
    // Collect all edge pixels (sampled)
    const edgePixels = [];
    for (let y = 0; y < height; y += sampleRate) {
      for (let x = 0; x < width; x += sampleRate) {
        const idx = y * width + x;
        if (edges[idx] === 255) {
          edgePixels.push({ x, y });
        }
      }
    }
    
    console.log(`[Picture-to-Map] Found ${edgePixels.length} sampled edge pixels`);
    
    // Group nearby pixels into wall segments
    const visited = new Set();
    for (let i = 0; i < edgePixels.length; i++) {
      if (visited.has(i)) continue;
      
      const start = edgePixels[i];
      let current = start;
      let end = start;
      let chainLength = 1;
      
      // Trace connected edge pixels
      for (let j = i + 1; j < edgePixels.length && chainLength < 20; j++) {
        if (visited.has(j)) continue;
        
        const p = edgePixels[j];
        const dx = p.x - current.x;
        const dy = p.y - current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // If nearby, add to chain
        if (dist < sampleRate * 2.5) {
          visited.add(j);
          end = p;
          current = p;
          chainLength++;
        }
      }
      
      visited.add(i);
      
      // Create wall from start to end
      if (chainLength > 1) {
        const x1 = start.x * scaleX;
        const y1 = start.y * scaleY;
        const x2 = end.x * scaleX;
        const y2 = end.y * scaleY;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > 10) { // Only keep longer walls
          walls.push({
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            w: len,
            h: wallThickness * scaleX,
            r: (wallThickness / 2) * scaleX,
            angle: Math.atan2(dy, dx)
          });
        }
      }
    }
    
    console.log(`[Picture-to-Map] Created ${walls.length} simplified brush walls`);
    return walls;
  }

  /**
   * Main conversion function
   * @param {File} imageFile 
   * @param {Function} callback - Called with {walls: Array, backgroundImage: string}
   */
  window.convertPictureToMap = function(imageFile, callback) {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        try {
          // Resize image if too large (for performance)
          const maxSize = 800;
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          if (img.width > maxSize || img.height > maxSize) {
            const scale = maxSize / Math.max(img.width, img.height);
            targetWidth = Math.floor(img.width * scale);
            targetHeight = Math.floor(img.height * scale);
          }
          
          // Draw to canvas for processing
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          
          // Detect dark pixels (black outlines) - lower threshold = darker pixels only
          console.log('[Picture-to-Map] Detecting dark pixels (outlines)...');
          const edges = detectEdges(imageData, 100);
          
          // Count edge pixels for debugging
          let edgeCount = 0;
          for (let i = 0; i < edges.length; i++) {
            if (edges[i] === 255) edgeCount++;
          }
          console.log(`[Picture-to-Map] Found ${edgeCount} edge pixels out of ${edges.length}`);
          
          // Debug: show edge map as canvas overlay (optional)
          if (edgeCount === 0) {
            console.warn('[Picture-to-Map] No edges detected! Try adjusting threshold or image contrast.');
          }
          
          // Convert edges to walls
          console.log('[Picture-to-Map] Converting edges to walls...');
          const canvasWidth = window.mapDef?.width || 1200;
          const canvasHeight = window.mapDef?.height || 600;
          const walls = edgesToWalls(edges, targetWidth, targetHeight, canvasWidth, canvasHeight);
          
          console.log(`[Picture-to-Map] Generated ${walls.length} wall segments`);
          
          // Save original image as background (base64)
          const backgroundImage = e.target.result;
          
          callback({ walls, backgroundImage });
        } catch (error) {
          console.error('[Picture-to-Map] Conversion failed:', error);
          alert('Failed to convert image: ' + error.message);
        }
      };
      img.onerror = function() {
        alert('Failed to load image');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  };

  /**
   * Apply converted map to current mapDef
   * @param {{walls: Array, backgroundImage: string}} result 
   */
  window.applyPictureToMap = function(result) {
    if (!window.mapDef) {
      alert('Map definition not found');
      return;
    }
    
    // Clear existing walls (optional - ask user?)
    const clearExisting = confirm('Clear existing walls before applying? (Cancel to keep existing walls)');
    if (clearExisting) {
      window.mapDef.walls = [];
    }
    
    // Add new walls
    result.walls.forEach(w => {
      window.mapDef.walls.push(w);
    });
    
    // Save background image
    window.mapDef.pictureBackground = result.backgroundImage;
    
    // Redraw
    try {
      if (typeof window.invalidateStaticLayer === 'function') {
        window.invalidateStaticLayer();
      }
      if (typeof window.drawMap === 'function') {
        window.drawMap();
      }
    } catch (e) {
      console.warn('[Picture-to-Map] Could not redraw:', e);
    }
    
    console.log('[Picture-to-Map] Applied successfully!');
    alert(`Picture-to-Map applied!\n${result.walls.length} walls created.`);
  };

  console.log('[Picture-to-Map] Module loaded');
})();
