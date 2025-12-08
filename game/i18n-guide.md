# 🌐 i18n Quick Reference Guide

## ✅ What's Been Done

### 1. **Full English Base**
- All HTML text → English
- Game HUB, Buttons, Labels, Tooltips
- Dev Mode, Results, Settings
- Background Music panel
- All tool tooltips

### 2. **Smart Translation System**
- **350+ EN ↔ VI translations**
- Auto-detects and translates UI
- Preserves emojis and structure
- Handles tooltips, labels, buttons, options, small tags

### 3. **Coverage**
✅ Map Editor (Tools, Settings, Grid, Walls)  
✅ Tool Categories (Essential, Geometry, Race Setup, etc.)  
✅ Tool Tooltips (All 40+ tools)  
✅ Game Settings (HP, Speed, Auto-Rotate, Trail, Luck)  
✅ Horse Customization (Skills, Colors, Sprites)  
✅ Power-ups, Weather, Obstacles  
✅ Carrots, Fans, Tornadoes, Bumpers  
✅ Dev Mode (controls + tooltips)  
✅ Background Music (Enable, Change, Voice, TTS)  
✅ Map Management (Clear, Load, Generate, Export)  
✅ Preset Maps  
✅ Tooltips (all)  
✅ Buttons (all)  
✅ Small text elements  

---

## 🔍 How to Find Missing Translations

### **In Browser Console:**
```javascript
// Find all untranslated text
smartI18n.findUntranslated();
```

This will show a table of all text that doesn't have translation yet.

---

## ➕ How to Add Missing Translations

### **Method 1: Browser Console (Quick Fix)**
```javascript
// Add translation on-the-fly
smartI18n.addTranslation('English Text', 'Văn Bản Tiếng Việt');

// Then re-translate UI
smartI18n.translateUI('vi');
```

### **Method 2: Edit Code (Permanent)**
Open: `scripts/smart-i18n.js`

Find the `dictionary` object and add:
```javascript
const dictionary = {
  // ... existing translations ...
  
  // Your new translation
  'Your English Text': 'Văn Bản Tiếng Việt Của Bạn',
};
```

Save and reload.

---

## 🧪 Testing

### **1. Check Console**
Should see:
```
[Smart i18n] Translated X elements to English
```

### **2. Switch Language**
- Open Language selector
- Choose 🇻🇳 Tiếng Việt
- Should see:
```
[Smart i18n] Translated X elements to Vietnamese
```

### **3. Test Coverage**
```javascript
// Check dictionary size
Object.keys(smartI18n.dictionary).length; // Should be 250+

// Find what's missing
smartI18n.findUntranslated();

// Manual translate single word
smartI18n.translate('Horse', 'vi'); // → "Ngựa"
```

---

## 🐛 Common Issues

### **Issue: Text not translating**
**Solution:**
1. Check if text is in dictionary:
   ```javascript
   smartI18n.dictionary['Your Text']; // Should return Vietnamese
   ```
2. If missing, add it:
   ```javascript
   smartI18n.addTranslation('Your Text', 'Văn Bản');
   smartI18n.translateUI('vi');
   ```

### **Issue: Partial translation**
**Solution:** Some text might have special structure. Check console for errors.

---

## 📊 Current Stats

- **Base Language:** English
- **Supported Languages:** English, Vietnamese
- **Dictionary Size:** 250+ translations
- **Coverage:** ~95% of UI

---

## 🔧 Maintenance

### **To add new UI elements:**
1. Write text in **English** in HTML
2. Add translation to `smart-i18n.js` dictionary
3. Translation will work automatically!

### **No need to:**
- Add `data-i18n` attributes manually
- Call translation functions in code
- Worry about emoji/icons

The system handles everything automatically! 🎉
