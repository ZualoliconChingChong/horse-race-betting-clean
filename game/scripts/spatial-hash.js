/**
 * Spatial Hash Grid
 * Fast collision detection using spatial partitioning
 * Reduces O(n²) to O(n) for most cases
 */

class SpatialHash {
  /**
   * @param {number} cellSize - Size of each grid cell (should be ~2x max object radius)
   */
  constructor(cellSize = 60) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Get grid key for coordinates
   * @param {number} x 
   * @param {number} y 
   * @returns {string}
   */
  getKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Clear the grid
   */
  clear() {
    this.grid.clear();
  }

  /**
   * Insert object into grid
   * @param {object} obj - Object with x, y, r properties
   */
  insert(obj) {
    if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') return;
    
    const r = obj.r || 12;
    // Calculate which cells this object occupies
    const minCellX = Math.floor((obj.x - r) / this.cellSize);
    const maxCellX = Math.floor((obj.x + r) / this.cellSize);
    const minCellY = Math.floor((obj.y - r) / this.cellSize);
    const maxCellY = Math.floor((obj.y + r) / this.cellSize);

    // Insert into all occupied cells
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push(obj);
      }
    }
  }

  /**
   * Get nearby objects (potential collisions)
   * @param {object} obj - Object to check
   * @returns {Array} - Array of nearby objects
   */
  getNearby(obj) {
    if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') return [];
    
    const r = obj.r || 12;
    const nearby = new Set(); // Use Set to avoid duplicates
    
    // Check all cells this object occupies
    const minCellX = Math.floor((obj.x - r) / this.cellSize);
    const maxCellX = Math.floor((obj.x + r) / this.cellSize);
    const minCellY = Math.floor((obj.y - r) / this.cellSize);
    const maxCellY = Math.floor((obj.y + r) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(other => {
            if (other !== obj) {
              nearby.add(other);
            }
          });
        }
      }
    }

    return Array.from(nearby);
  }

  /**
   * Query objects in a rectangular area
   * @param {number} x 
   * @param {number} y 
   * @param {number} w 
   * @param {number} h 
   * @returns {Array}
   */
  queryRect(x, y, w, h) {
    const objects = new Set();
    
    const minCellX = Math.floor(x / this.cellSize);
    const maxCellX = Math.floor((x + w) / this.cellSize);
    const minCellY = Math.floor(y / this.cellSize);
    const maxCellY = Math.floor((y + h) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(obj => objects.add(obj));
        }
      }
    }

    return Array.from(objects);
  }

  /**
   * Get grid statistics (for debugging)
   */
  getStats() {
    const cellCount = this.grid.size;
    let objectCount = 0;
    let maxObjectsPerCell = 0;
    
    this.grid.forEach(cell => {
      objectCount += cell.length;
      maxObjectsPerCell = Math.max(maxObjectsPerCell, cell.length);
    });

    return {
      cellCount,
      objectCount,
      maxObjectsPerCell,
      avgObjectsPerCell: cellCount > 0 ? (objectCount / cellCount).toFixed(2) : 0
    };
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.SpatialHash = SpatialHash;
}
