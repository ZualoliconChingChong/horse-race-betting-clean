// @ts-check
// Picture-to-Map Converter
// Converts uploaded images to map: edges → walls, colors → visual background

(function() {
  if (typeof window === 'undefined') return;


  /**
   * Set map background image
   * @param {File} imageFile 
   * @param {Function} callback - Called with {backgroundImage: string}
   */
  window.convertPictureToMap = function(imageFile, callback) {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const backgroundImage = e.target.result;
        console.log('[Picture-to-Map] Background image loaded');
        callback({ backgroundImage });
      } catch (error) {
        console.error('[Picture-to-Map] Error:', error);
        alert('Error processing image');
      }
    };
    reader.readAsDataURL(imageFile);
  };

  /**
   * Apply background image to current mapDef
   * @param {{backgroundImage: string}} result 
   */
  window.applyPictureToMap = function(result) {
    if (!window.mapDef) {
      alert('Map definition not found');
      return;
    }
    
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
    alert('Background image applied!');
  };

  console.log('[Picture-to-Map] Module loaded');
})();
