const fs = require('fs');

const filePath = 'E:\\CascadeProjects\\horse-race-betting-clean\\web\\src\\pages\\Race.jsx';

// Read file as buffer first, then convert to string
const buffer = fs.readFileSync(filePath);
let content = buffer.toString('utf8');

// Replace all variations of broken encodings
const replacements = [
  // Modal title
  { pattern: /\?\?.*D.*i.*T.*n.*Lobby/g, replacement: '✏️ Đổi Tên Lobby' },
  { pattern: /��.*D.*i.*T.*n.*Lobby/g, replacement: '✏️ Đổi Tên Lobby' },
  
  // Label text
  { pattern: /T.*n.*m.*i.*\(.*d.*\?.*tr.*ng.*=.*t.*n.*m.*c.*d.*nh.*\)/g, replacement: 'Tên mới (để trống = tên mặc định)' },
  { pattern: /T�n.*m\?i.*\(d\?.*tr\?ng.*=.*t�n.*m\?c.*d\?nh\)/g, replacement: 'Tên mới (để trống = tên mặc định)' },
  
  // Buttons
  { pattern: /\?.*Dang.*luu\.\.\./g, replacement: '⏳ Đang lưu...' },
  { pattern: /\?\?.*Luu/g, replacement: '💾 Lưu' },
  { pattern: /H\?y/g, replacement: 'Hủy' },
  { pattern: /��.*Lưu/g, replacement: '💾 Lưu' },
  
  // Button text in header  
  { pattern: /\?\?.*D.*i.*T.*n(?!.*Lobby)/g, replacement: '✏️ Đổi Tên' }
];

for (const { pattern, replacement } of replacements) {
  content = content.replace(pattern, replacement);
}

// Write back with UTF-8 (no BOM)
fs.writeFileSync(filePath, content, { encoding: 'utf8' });

console.log('✅ Fixed all encoding issues in Race.jsx');
