// @ts-check
// Picture-to-Map Converter
// Converts uploaded images to map: edges → walls, colors → visual background

(function() {
  if (typeof window === 'undefined') return;

  /**
   * Sobel edge detection with adaptive threshold
   * @param {ImageData} imageData 
   * @param {number} threshold - Edge strength threshold (0-255)
   * @returns {Uint8ClampedArray} Binary edge map (255 = edge, 0 = no edge)
   */
  function detectEdges(imageData, threshold = 50) {
    const { width, height, data } = imageData;
    const edges = new Uint8ClampedArray(width * height);
    const magnitudes = [];
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    // Convert to grayscale and apply Sobel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply 3x3 kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        magnitudes.push(magnitude);
        const edgeIdx = y * width + x;
        edges[edgeIdx] = magnitude > threshold ? 255 : 0;
      }
    }
    
    // If no edges found, try adaptive threshold (median of magnitudes)
    let edgeCount = 0;
    for (let i = 0; i < edges.length; i++) {
      if (edges[i] === 255) edgeCount++;
    }
    
    if (edgeCount === 0 && magnitudes.length > 0) {
      console.log('[Picture-to-Map] No edges with threshold ' + threshold + ', trying adaptive threshold...');
      magnitudes.sort((a, b) => a - b);
      const adaptiveThreshold = magnitudes[Math.floor(magnitudes.length * 0.3)]; // 30th percentile
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4;
              const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              gx += gray * sobelX[kernelIdx];
              gy += gray * sobelY[kernelIdx];
            }
          }
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const edgeIdx = y * width + x;
          edges[edgeIdx] = magnitude > adaptiveThreshold ? 255 : 0;
        }
      }
      console.log('[Picture-to-Map] Using adaptive threshold: ' + adaptiveThreshold.toFixed(2));
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
          
          // Detect edges (higher threshold to catch only strong black lines/outline)
          console.log('[Picture-to-Map] Detecting edges...');
          const edges = detectEdges(imageData, 120);
          
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
