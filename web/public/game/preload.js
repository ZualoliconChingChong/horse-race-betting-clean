// Preload script: runs in isolated, sandboxed context before renderer loads
// Keep minimal and safe. Use contextBridge to expose APIs if needed later.
// This file intentionally does not change any behavior of the game.

// const { contextBridge } = require('electron'); // uncomment when exposing APIs

// Example placeholder (commented out):
// contextBridge.exposeInMainWorld('app', {
//   version: '1.0.0'
// });

// No-op to confirm preload executed without side effects
console.log('[preload] loaded');
