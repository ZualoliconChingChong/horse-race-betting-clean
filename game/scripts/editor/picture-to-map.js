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
  function detectEdges(imageData, threshold = 50) {
    const { width, height, data } = imageData;
    const edges = new Uint8ClampedArray(width * height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    let edgeCount = 0;
    let maxMagnitude = 0;
    
    // Convert to grayscale and apply Sobel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply 3x3 kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            // Include alpha channel in grayscale calculation
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            const gray = (r + g + b) / 3 * (a / 255); // Account for transparency
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        maxMagnitude = Math.max(maxMagnitude, magnitude);
        const edgeIdx = y * width + x;
        edges[edgeIdx] = magnitude > threshold ? 255 : 0;
        if (edges[edgeIdx] === 255) edgeCount++;
      }
    }
    
    console.log(`[Picture-to-Map] Edge detection: ${edgeCount} edge pixels, max magnitude: ${maxMagnitude.toFixed(2)}, threshold: ${threshold}`);
    
    return edges;
  }

  /**
   * Trace edges and convert to wall segments
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
    const visited = new Uint8Array(width * height);
    
    // Dilate edges to make them thicker (more visible as walls)
    const dilatedEdges = new Uint8ClampedArray(width * height);
    for (let i = 0; i < edges.length; i++) {
      if (edges[i] === 255) {
        dilatedEdges[i] = 255;
        // Dilate: mark neighbors too
        const y = Math.floor(i / width);
        const x = i % width;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              dilatedEdges[ny * width + nx] = 255;
            }
          }
        }
      }
    }
    
    // Convert edge pixels to rectangular walls
    const wallThickness = Math.max(4, Math.min(scaleX, scaleY) * 0.5);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (dilatedEdges[idx] === 255 && !visited[idx]) {
          visited[idx] = 1;
          
          // Find extent of this edge region
          let x2 = x;
          while (x2 < width && dilatedEdges[y * width + x2] === 255) {
            visited[y * width + x2] = 1;
            x2++;
          }
          
          let y2 = y;
          while (y2 < height && dilatedEdges[y2 * width + x] === 255) {
            y2++;
          }
          
          const w = (x2 - x) * scaleX;
          const h = (y2 - y) * scaleY;
          
          // Create wall if large enough
          if (w > wallThickness && h > wallThickness) {
            walls.push({
              x: x * scaleX,
              y: y * scaleY,
              w: w,
              h: h,
              r: wallThickness / 2,
              color: '#8B4513' // Brown wall color
            });
          }
        }
      }
    }
    
    console.log(`[Picture-to-Map] Generated ${walls.length} walls from edges`);
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
          
          // Detect edges
          console.log('[Picture-to-Map] Detecting edges...');
          const edges = detectEdges(imageData, 100);
          
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
