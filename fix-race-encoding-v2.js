const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'src', 'pages', 'Race.jsx');

console.log('Reading:', filePath);

// Read file
let content = fs.readFileSync(filePath, 'utf8');

// Simple string replace (not regex) to avoid encoding issues
const fixes = {
  // Title
  '✏️ Đổi Tên Lobby': '✏️ Đổi Tên Lobby',
  
  // Input label - find the exact broken text
  'Hãy nhỡ (để trống = tên mặc định)': 'Tên mới (để trống = tên mặc định)',
  'T�n m?i (d? tr?ng = t�n m?c d?nh)': 'Tên mới (để trống = tên mặc định)',
  'Tên m?i (để trống = tên mặc định)': 'Tên mới (để trống = tên mặc định)',
  
  // Buttons
  '? Dang luu...': '⏳ Đang lưu...',
  '?? Luu': '💾 Lưu',
  '🔥 Luu': '💾 Lưu',
  'H?y': 'Hủy',
  
  // Message
  '?? c?p nh?t t?n lobby!': '✅ Đã cập nhật tên lobby!',
  'Kh�ng th? c?p nh?t t�n': 'Không thể cập nhật tên',
  
  // Button in header
  '?? D?i T�n': '✏️ Đổi Tên',
  '✏️ Đ?i Tên': '✏️ Đổi Tên'
};

let changeCount = 0;
for (const [wrong, correct] of Object.entries(fixes)) {
  const before = content;
  content = content.split(wrong).join(correct);
  if (content !== before) {
    changeCount++;
    console.log(`✓ Fixed: "${wrong.substring(0, 20)}..."`);
  }
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Fixed ${changeCount} encoding issues`);
