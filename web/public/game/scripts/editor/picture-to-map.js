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
   * Trace contours from edge map and convert to wall segments
   * Uses Moore-Neighbor contour tracing
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
    
    // Find all contours
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (edges[idx] === 255 && !visited[idx]) {
          // Start new contour
          const contour = traceContour(edges, width, height, x, y, visited);
          
          if (contour.length > 5) { // Minimum contour length
            // Convert contour points to wall segments
            for (let i = 0; i < contour.length - 1; i++) {
              const p1 = contour[i];
              const p2 = contour[i + 1];
              walls.push({
                x1: p1.x * scaleX,
                y1: p1.y * scaleY,
                x2: p2.x * scaleX,
                y2: p2.y * scaleY
              });
            }
            // Close contour
            const p1 = contour[contour.length - 1];
            const p2 = contour[0];
            walls.push({
              x1: p1.x * scaleX,
              y1: p1.y * scaleY,
              x2: p2.x * scaleX,
              y2: p2.y * scaleY
            });
          }
        }
      }
    }
    
    return walls;
  }

  /**
   * Moore-Neighbor contour tracing
   * @param {Uint8ClampedArray} edges 
   * @param {number} width 
   * @param {number} height 
   * @param {number} startX 
   * @param {number} startY 
   * @param {Uint8Array} visited 
   * @returns {Array<{x: number, y: number}>}
   */
  function traceContour(edges, width, height, startX, startY, visited) {
    const contour = [];
    let x = startX, y = startY;
    let prevX = x, prevY = y - 1; // Start direction (up)
    
    // 8-neighbor directions (clockwise from up)
    const dirs = [
      [0, -1], [1, -1], [1, 0], [1, 1],
      [0, 1], [-1, 1], [-1, 0], [-1, -1]
    ];
    
    let dirIdx = 0;
    let steps = 0;
    const maxSteps = width * height * 2; // Prevent infinite loops
    
    do {
      contour.push({ x, y });
      visited[y * width + x] = 1;
      
      // Find next edge pixel
      let found = false;
      for (let i = 0; i < 8; i++) {
        const newDirIdx = (dirIdx + i) % 8;
        const [dx, dy] = dirs[newDirIdx];
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (edges[nidx] === 255) {
            x = nx;
            y = ny;
            dirIdx = newDirIdx;
            found = true;
            break;
          }
        }
      }
      
      if (!found) break;
      steps++;
    } while ((x !== startX || y !== startY) && steps < maxSteps);
    
    return contour;
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
