// extract-inline-code.js
// Script to extract inline CSS and JS from index.html to separate files

const fs = require('fs');
const path = require('path');

function extractInlineCode() {
  const indexPath = 'index.html';
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Find CSS between <style> tags
  const cssRegex = /<style>([\s\S]*?)<\/style>/g;
  let cssContent = '';
  let match;
  
  while ((match = cssRegex.exec(content)) !== null) {
    cssContent += match[1] + '\n';
  }
  
  // Find JS between <script> tags (excluding src attributes)
  const jsRegex = /<script(?![^>]*src=)>([\s\S]*?)<\/script>/g;
  let jsContent = '';
  
  while ((match = jsRegex.exec(content)) !== null) {
    jsContent += match[1] + '\n';
  }
  
  // Append extracted CSS to existing main.css
  if (cssContent.trim()) {
    const existingCSS = fs.readFileSync('styles/main.css', 'utf8');
    const newCSS = existingCSS + '\n\n/* Extracted from index.html */\n' + cssContent;
    fs.writeFileSync('styles/main.css', newCSS);
    console.log('CSS extracted to styles/main.css');
  }
  
  // Write extracted JS to new file
  if (jsContent.trim()) {
    fs.writeFileSync('scripts/extracted-inline.js', jsContent);
    console.log('JavaScript extracted to scripts/extracted-inline.js');
  }
  
  // Create clean index.html without inline styles and scripts
  let cleanContent = content;
  
  // Remove inline CSS
  cleanContent = cleanContent.replace(/<style>[\s\S]*?<\/style>/g, '');
  
  // Remove inline JS (but keep external script tags)
  cleanContent = cleanContent.replace(/<script(?![^>]*src=)>[\s\S]*?<\/script>/g, '');
  
  // Add reference to extracted JS
  const scriptTag = '<script src="scripts/extracted-inline.js"></script>\n';
  cleanContent = cleanContent.replace('<!-- Load new modular scripts -->', 
    '<!-- Load extracted inline code -->\n' + scriptTag + '<!-- Load new modular scripts -->');
  
  // Write clean version
  fs.writeFileSync('index-clean.html', cleanContent);
  
  // Show size comparison
  const originalSize = fs.statSync(indexPath).size;
  const cleanSize = fs.statSync('index-clean.html').size;
  const reduction = ((originalSize - cleanSize) / originalSize * 100).toFixed(1);
  
  console.log(`\nSize comparison:`);
  console.log(`Original: ${(originalSize / 1024).toFixed(1)} KB`);
  console.log(`Clean: ${(cleanSize / 1024).toFixed(1)} KB`);
  console.log(`Reduction: ${reduction}%`);
  
  return {
    originalSize,
    cleanSize,
    reduction,
    cssExtracted: cssContent.trim().length > 0,
    jsExtracted: jsContent.trim().length > 0
  };
}

if (require.main === module) {
  extractInlineCode();
}

module.exports = { extractInlineCode };
