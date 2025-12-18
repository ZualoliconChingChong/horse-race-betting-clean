// @ts-check
// Picture-to-Map Converter
// Converts uploaded images to map: edges → walls, colors → visual background

(function() {
  if (typeof window === 'undefined') return;

  /**
   * Sobel edge detection
   * @param {ImageData} imageData 
   * @param {number} threshold - Edge strength threshold (0-255)
   * @returns {Uint8ClampedArray} Binary edge map (255 = edge, 0 = no edge)
   */
  function detectEdges(imageData, threshold = 100) {
    const { width, height, data } = imageData;
    const edges = new Uint8ClampedArray(width * height);
    
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
        const edgeIdx = y * width + x;
        edges[edgeIdx] = magnitude > threshold ? 255 : 0;
      }
    }
    
    return edges;
  }

  /**
   * Convert edge pixels to wall segments (simple approach)
   * Groups connected edge pixels and creates walls from them
   * @param {Uint8ClampedArray} edges 
   * @param {number} width 
   * @param {number} height 
   * @param {number} canvasWidth - Target canvas width
   * @param {number} canvasHeight - Target canvas height
   * @returns {Array<{x1: number, y1: number, x2: number, y2: number}>}
   */
  function edgesToWalls(edges, width, height, canvasWidth, canvasHeight) {
    const walls = [];
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;
    const visited = new Uint8Array(width * height);
    
    // Sample edge pixels at intervals to reduce computation
    const sampleRate = Math.max(1, Math.floor(Math.min(width, height) / 200));
    
    for (let y = 0; y < height; y += sampleRate) {
      for (let x = 0; x < width; x += sampleRate) {
        const idx = y * width + x;
        if (edges[idx] === 255 && !visited[idx]) {
          // Mark as visited
          visited[idx] = 1;
          
          // Find nearest edge pixel in 8 directions
          let bestDist = Infinity;
          let bestX = x, bestY = y;
          
          for (let dy = -sampleRate; dy <= sampleRate; dy++) {
            for (let dx = -sampleRate; dx <= sampleRate; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = ny * width + nx;
                if (edges[nidx] === 255) {
                  const dist = dx * dx + dy * dy;
                  if (dist < bestDist) {
                    bestDist = dist;
                    bestX = nx;
                    bestY = ny;
                  }
                }
              }
            }
          }
          
          // Create wall segment
          if (bestDist < Infinity) {
            walls.push({
              x1: x * scaleX,
              y1: y * scaleY,
              x2: bestX * scaleX,
              y2: bestY * scaleY
            });
          }
        }
      }
    }
    
    console.log(`[Picture-to-Map] Sampled ${walls.length} edge segments`);
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
          
          // Detect edges (lower threshold to catch black lines)
          console.log('[Picture-to-Map] Detecting edges...');
          const edges = detectEdges(imageData, 50);
          
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
