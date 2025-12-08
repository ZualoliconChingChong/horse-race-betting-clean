// scripts/app.js
// Non-destructive namespace to help AI/tools discover runtime state in a structured way.
// It only provides getters that proxy to existing globals. No behavior change.
(function(){
  if (typeof window === 'undefined') return;
  if (window.App && window.App.__inited) return;

  const g = window;
  // Bật emoji trong editor mặc định (có thể tắt bằng cách gõ: window.editorEmojiEnabled=false)
  if (typeof g.editorEmojiEnabled === 'undefined') g.editorEmojiEnabled = true;
  // Dùng icon vector trong editor để tránh bị đè chồng (có thể tắt: window.editorVectorIconsOnly=false)
  if (typeof g.editorVectorIconsOnly === 'undefined') g.editorVectorIconsOnly = false;
  const App = { __inited: true };

  // Define state proxy with getters (read-only view)
  const state = {};
  const mapProps = [
    'mode',
    'mapDef',
    'selected',
    'running',
    'gameSpeed',
    'horses',
    'liveBoosts',
    'liveTurbos',
    'liveTeleports',
    'liveMagnets',
    'liveTimeFreezes',
    'liveGhosts',
    'liveTraps',
    'liveRams',
    'liveShields',
    'liveSpinners',
    'liveWarpzones',
    'liveQuantumdashs',
    'liveNebulas',
    'liveSlipstreams',
    'particles',
    'backgroundParticles',
    'lightningEffects',
    'canvas',
    'ctx',
    'screenShakeX',
    'screenShakeY',
  ];
  for (const key of mapProps) {
    Object.defineProperty(state, key, {
      enumerable: true,
      configurable: false,
      get() {
        return g[key];
      },
    });
  }

  // Helpful entry points
  const modules = {};
  Object.defineProperty(modules, 'render', {
    enumerable: true,
    get() {
      return g.RenderModule;
    },
  });
  Object.defineProperty(modules, 'loop', {
    enumerable: true,
    get() {
      return g.GameLoopModule;
    },
  });

  // Attach
  Object.defineProperty(App, 'state', { value: state, writable: false, configurable: false });
  Object.defineProperty(App, 'modules', { value: modules, writable: false, configurable: false });

  // Expose
  Object.defineProperty(g, 'App', { value: App, writable: false, configurable: false });
  try {
    console.log('[App] namespace initialized (read-only state proxy)');
  } catch {}
})();
