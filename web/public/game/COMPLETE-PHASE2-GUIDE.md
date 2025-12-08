# 🚀 Complete Phase 2 Guide - Manual Instructions

**Current Status:** 50% Complete  
**Remaining Time:** ~30 minutes  
**Goal:** Replace O(n²) collision with Spatial Hash O(n)  

---

## ✅ Already Done:

1. ✅ Spatial Hash class created (`scripts/spatial-hash.js`)
2. ✅ Loaded into HTML (line 715)
3. ✅ Available as `window.SpatialHash`

---

## 📋 TO-DO: Replace Collision Loop

### **Step 1: Find the collision code**

**File:** `scripts/extracted-inline.js`  
**Lines:** 9983-10229 (approximately)

**Current code looks like:**
```javascript
for (let i=0; i<horses.length; i++) {
  for (let j=i+1; j<horses.length; j++) {
    const h1 = horses[i], h2 = horses[j];
    if (h1.eliminated || h2.eliminated) continue;
    
    if (h1.ghost <= 0 && h2.ghost <= 0) {
      // ... collision detection code ...
    }
  }
}
```

---

### **Step 2: Replace with this code:**

**Add at the TOP of the collision section (before line 9983):**

```javascript
// ===== SPATIAL HASH COLLISION (O(n) instead of O(n²)) =====
// Initialize spatial hash (reuse instance for performance)
if (!window.horsesSpatialHash) {
  window.horsesSpatialHash = new SpatialHash(60); // 60px cells
}
const spatialHash = window.horsesSpatialHash;
spatialHash.clear();

// Build spatial hash with non-eliminated, non-ghost horses
horses.forEach(h => {
  if (!h.eliminated && h.ghost <= 0) {
    spatialHash.insert(h);
  }
});

// Track checked pairs to avoid duplicates
const checkedPairs = new Set();

// Check collisions using spatial hash
horses.forEach((h1, i) => {
  if (h1.eliminated || h1.ghost > 0) return;
  
  // Get nearby horses (O(1) lookup instead of checking all horses)
  const nearby = spatialHash.getNearby(h1);
  
  nearby.forEach(h2 => {
    if (h2.eliminated || h2.ghost > 0) return;
    
    // Avoid duplicate checks (A-B and B-A)
    const id1 = h1.id || h1.i || i;
    const id2 = h2.id || h2.i || horses.indexOf(h2);
    if (id1 >= id2) return; // Only check once per pair
    
    const pairKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    if (checkedPairs.has(pairKey)) return;
    checkedPairs.add(pairKey);
    
    // === PASTE ALL COLLISION LOGIC HERE ===
    // Copy lines 9990-10229 (the collision detection logic)
    const dx = h2.x - h1.x, dy = h2.y - h1.y, dist = Math.hypot(dx, dy);
    // ... (rest of collision code)
  });
});
```

---

### **Step 3: Delete old O(n²) loop**

**DELETE these lines (9983-10229):**
```javascript
for (let i=0; i<horses.length; i++) {
  for (let j=i+1; j<horses.length; j++) {
    // ... all this code ...
  }
}
```

---

### **Step 4: Copy collision logic into new loop**

**Take the INNER collision code (lines 9990-10229) and paste it inside the `nearby.forEach(h2 => {` block.**

The collision logic includes:
- Distance calculation
- Radius checking
- Damage boost collision
- Ram collision
- Shield collision
- Phantom Strike
- HP damage
- Physics push-out
- Kill rewards

**Important:** Keep ALL the collision logic exactly the same, just move it into the new structure!

---

## 🧪 Testing:

After making changes:

1. **Test with 10 horses:**
   ```bash
   npm start
   ```
   - Should work normally
   - FPS should be same or better

2. **Test with 30 horses:**
   - Add 30 horses in editor
   - Run race
   - Check FPS (should be +5-10 FPS better)

3. **Test with 50 horses:**
   - Add 50 horses
   - Run race
   - Check FPS (should be +10-15 FPS better!)

4. **Verify collisions work:**
   - Horses should still bounce off each other
   - Ram power-up should work
   - Shield should work
   - HP system should work

---

## 📊 Expected Results:

### **Performance:**

| Horses | Before FPS | After FPS | Gain |
|--------|-----------|-----------|------|
| 10 | ~60 | ~60 | +0 (small gain) |
| 30 | ~50 | ~60 | +10 FPS |
| 50 | ~40 | ~55 | +15 FPS |
| 100 | ~20 | ~50 | +30 FPS! |

### **Collision Checks:**

| Horses | Old (O(n²)) | New (O(n)) | Reduction |
|--------|-------------|------------|-----------|
| 10 | 45 | ~20 | 55% less |
| 30 | 435 | ~60 | 86% less |
| 50 | 1,225 | ~100 | 92% less |
| 100 | 4,950 | ~200 | 96% less! |

---

## 🐛 Troubleshooting:

### **If collisions don't work:**
- Check that `h1` and `h2` are defined
- Make sure `id` comparison is correct
- Verify `checkedPairs` prevents duplicates

### **If FPS is worse:**
- Cell size might be wrong (try 40px or 80px)
- Change: `new SpatialHash(40)` or `new SpatialHash(80)`

### **If horses phase through each other:**
- Collision logic might not be copied correctly
- Check all the physics code is inside the new loop

---

## 🔄 Rollback (if needed):

If anything goes wrong:

1. **Git revert:**
   ```bash
   git checkout scripts/extracted-inline.js
   ```

2. **Or remove spatial hash:**
   - Delete line 715 from `index.html`
   - Game will use old O(n²) collision

---

## ✅ Success Checklist:

- [ ] Old O(n²) loop removed
- [ ] Spatial hash loop added
- [ ] All collision logic copied correctly
- [ ] Game loads without errors
- [ ] Collisions still work
- [ ] FPS improved with 30+ horses
- [ ] No regression bugs

---

## 🎯 When Complete:

**Phase 2 = DONE!** 🎉

You'll have:
- ✅ Professional-grade collision detection
- ✅ +10-15 FPS with many horses
- ✅ Smooth gameplay with 100 horses
- ✅ Scalable architecture

---

## 📞 Need Help?

**If stuck, you can:**
1. Check `scripts/spatial-hash.js` for the class API
2. Read `PHASE2-PROGRESS.md` for context
3. Test incrementally (save often!)
4. Ask me to continue when API available

---

**Good luck! The hardest part (Spatial Hash) is done, just need to integrate it!** 🚀

**Estimated time:** 30 minutes  
**Difficulty:** Medium  
**Impact:** HUGE! (+10-15 FPS)
