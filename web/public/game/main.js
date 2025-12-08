// Use Electron's module from runtime
const electron = require('electron');
console.log('Using require("electron")');
// Diagnostic log to verify what is exported by 'electron'
// It should be an object with properties like app, BrowserWindow
console.log('Electron module keys:', Object.keys(electron));
console.log('typeof electron:', typeof electron);
console.log('process.versions:', process.versions);
console.log('isElectronRuntime:', !!process.versions.electron);
console.log('ELECTRON_RUN_AS_NODE:', process.env.ELECTRON_RUN_AS_NODE);
console.log('process.type:', process.type);
try {
  console.log('require.resolve("electron"):', require.resolve('electron'));
} catch (e) {
  console.log('resolve electron failed:', e.message);
}
try {
  console.log(
    'builtinModules has electron:',
    require('module').builtinModules.includes('electron')
  );
} catch (e) {
  console.log('check builtinModules failed:', e.message);
}

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
console.log('typeof app:', typeof app, 'typeof BrowserWindow:', typeof BrowserWindow);
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      // Safe preload to expose controlled APIs to renderer if needed later
      preload: path.join(__dirname, 'preload.js'),
      // Disable autoplay policy to allow audio without user interaction
      additionalArguments: ['--autoplay-policy=no-user-gesture-required']
    },
  });
  win.setMenuBarVisibility(false);
  let htmlFile = process.env.HMR_MOD === '1' ? 'index_mod.html' : 'index.html';
  // Fallback gracefully if index_mod.html does not exist
  if (htmlFile === 'index_mod.html' && !fs.existsSync(path.join(__dirname, 'index_mod.html'))) {
    console.warn('[boot] index_mod.html not found, falling back to index.html');
    htmlFile = 'index.html';
  }
  console.log('[boot] Loading', htmlFile, 'HMR_MOD =', process.env.HMR_MOD);
  win.loadFile(htmlFile);
}

if (!app) {
  console.error('Electron app is undefined. This process is not running under Electron.');
  process.exit(1);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
