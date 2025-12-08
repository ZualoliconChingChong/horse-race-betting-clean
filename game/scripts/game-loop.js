// @ts-check
// scripts/game-loop.js
// Pha 1: Bọc an toàn các hàm game loop hiện có mà không đổi hành vi.
// Sau này có thể di dời logic thật sự sang đây.

(function () {
  if (typeof window === 'undefined') return;

  /**
   * @typedef {((dt:number)=>any) & { __wrappedByGameLoopModule?: boolean }} StepFn
   */
  /**
   * @typedef {(()=>any) & { __wrappedByGameLoopModule?: boolean }} StartMainLoopFn
   */
  /**
   * @typedef {Window & typeof globalThis & { step?: StepFn, startMainLoop?: StartMainLoopFn, GameLoopModule?: { getOriginals?: ()=>{ step: StepFn|null, startMainLoop: StartMainLoopFn|null } } }} WindowWithGameLoop
   */
  /** @type {WindowWithGameLoop} */
  // @ts-ignore
  const w = window;

  // Bọc step(dt)
  const origStep = typeof w.step === 'function' ? w.step : null;
  if (origStep && !origStep.__wrappedByGameLoopModule) {
    /** @type {StepFn} */
    const stepForwarded = function () {
      // @ts-ignore - guard ensures non-null
      const o = origStep;
      // eslint-disable-next-line prefer-rest-params
      return o.apply(this, arguments);
    };
    stepForwarded.__wrappedByGameLoopModule = true;
    Object.defineProperty(w, 'GameLoopModule', {
      value: Object.assign({}, w.GameLoopModule || {}),
      writable: false,
      configurable: false,
    });
    w.step = stepForwarded;
    console.log('[game-loop-module] step() được bọc (không đổi hành vi).');
  } else if (!origStep) {
    console.warn('[game-loop-module] window.step không tồn tại tại thời điểm nạp. Chế độ chờ.');
  }

  // Bọc startMainLoop()
  const origStart = typeof w.startMainLoop === 'function' ? w.startMainLoop : null;
  if (origStart && !origStart.__wrappedByGameLoopModule) {
    /** @type {StartMainLoopFn} */
    const startForwarded = function () {
      // @ts-ignore - guard ensures non-null
      const o = origStart;
      // eslint-disable-next-line prefer-rest-params
      return o.apply(this, arguments);
    };
    startForwarded.__wrappedByGameLoopModule = true;
    // Nối thêm API vào GameLoopModule nếu cần về sau
    const mod = w.GameLoopModule || {};
    mod.getOriginals = function () {
      return { step: origStep, startMainLoop: origStart };
    };
    Object.defineProperty(w, 'GameLoopModule', {
      value: mod,
      writable: false,
      configurable: false,
    });
    w.startMainLoop = startForwarded;
    console.log('[game-loop-module] startMainLoop() được bọc (không đổi hành vi).');
  } else if (!origStart) {
    console.warn(
      '[game-loop-module] window.startMainLoop không tồn tại tại thời điểm nạp. Chế độ chờ.'
    );
  }
})();
