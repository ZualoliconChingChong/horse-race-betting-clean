// Sync canvas overlay elements with original HUD data
// @ts-check
/**
 * Đồng bộ các phần tử overlay canvas với HUD gốc. Không thay đổi hành vi.
 */
function syncCanvasElements() {
  // Sync horse count
  const horsesCount = document.getElementById('horsesCount');
  const horsesCountCanvas = document.getElementById('horsesCountCanvas');
  if (horsesCount && horsesCountCanvas) {
    horsesCountCanvas.textContent = horsesCount.textContent;
  }

  // Sync carrot active
  const carrotActive = document.getElementById('carrotActive');
  const carrotActiveCanvas = document.getElementById('carrotActiveCanvas');
  if (carrotActive && carrotActiveCanvas) {
    carrotActiveCanvas.textContent = carrotActive.textContent;
  }

  // Sync timer
  const timer = document.getElementById('timer');
  const timerCanvas = document.getElementById('timerCanvas');
  if (timer && timerCanvas) {
    timerCanvas.textContent = timer.textContent;
  }

  // Sync FPS
  const fpsHud = document.getElementById('fpsHud');
  const fpsHudCanvas = document.getElementById('fpsHudCanvas');
  if (fpsHud && fpsHudCanvas) {
    fpsHudCanvas.textContent = fpsHud.textContent;
  }

  // Sync speed slider value and position
  const speedLiveVal = document.getElementById('speedLiveVal');
  const speedLiveValCanvas = document.getElementById('speedLiveValCanvas');
  if (speedLiveVal && speedLiveValCanvas) {
    speedLiveValCanvas.textContent = speedLiveVal.textContent;
  }

  // Sync speed slider visual position
  const speedVal = document.getElementById('speedVal');
  const speedValCanvas = document.getElementById('speedValCanvas');
  const speedThumb = document.getElementById('speedThumb');
  const speedThumbCanvas = document.getElementById('speedThumbCanvas');

  if (speedVal && speedValCanvas) {
    speedValCanvas.style.width = speedVal.style.width || '50%';
  }

  if (speedThumb && speedThumbCanvas) {
    speedThumbCanvas.style.left = speedThumb.style.left || '50%';
  }

  // Sync notification
  const notificationText = document.getElementById('notificationText');
  const notificationTextCanvas = document.getElementById('notificationTextCanvas');
  if (notificationText && notificationTextCanvas) {
    notificationTextCanvas.textContent = notificationText.textContent;
  }

  // Sync button visibility
  const openEditorBtn = document.getElementById('openEditorBtn');
  const openEditorBtnCanvas = document.getElementById('openEditorBtnCanvas');
  if (openEditorBtn && openEditorBtnCanvas) {
    openEditorBtnCanvas.style.display = openEditorBtn.style.display;
  }

  const pauseBtnHUD = document.getElementById('pauseBtnHUD');
  const pauseBtnHUDCanvas = document.getElementById('pauseBtnHUDCanvas');
  if (pauseBtnHUD && pauseBtnHUDCanvas) {
    pauseBtnHUDCanvas.style.display = pauseBtnHUD.style.display;
  }

  const toEditor = document.getElementById('toEditor');
  const toEditorCanvas = document.getElementById('toEditorCanvas');
  if (toEditor && toEditorCanvas) {
    toEditorCanvas.style.display = toEditor.style.display;
  }
}

// Setup canvas overlay button functionality and speed slider
function setupCanvasButtons() {
  const hudPlayTestCanvas = document.getElementById('hudPlayTestCanvas');
  const pauseBtnHUDCanvas = document.getElementById('pauseBtnHUDCanvas');
  const toEditorCanvas = document.getElementById('toEditorCanvas');
  const openEditorBtnCanvas = document.getElementById('openEditorBtnCanvas');
  const speedSliderCanvas = document.getElementById('speedSliderCanvas');

  const originalPlayBtn = document.getElementById('hudPlayTest');
  const originalPauseBtn = document.getElementById('pauseBtnHUD');
  const originalToEditor = document.getElementById('toEditor');
  const originalOpenEditor = document.getElementById('openEditorBtn');
  const originalSpeedSlider = document.getElementById('speedSlider');

  if (hudPlayTestCanvas && originalPlayBtn) {
    hudPlayTestCanvas.addEventListener('click', () => originalPlayBtn.click());
  }

  if (pauseBtnHUDCanvas && originalPauseBtn) {
    pauseBtnHUDCanvas.addEventListener('click', () => originalPauseBtn.click());
  }

  if (toEditorCanvas && originalToEditor) {
    toEditorCanvas.addEventListener('click', () => originalToEditor.click());
  }

  if (openEditorBtnCanvas && originalOpenEditor) {
    openEditorBtnCanvas.addEventListener('click', () => originalOpenEditor.click());
  }

  // Setup speed slider interaction
  if (speedSliderCanvas && originalSpeedSlider) {
    speedSliderCanvas.addEventListener('mousedown', (e) => {
      // Forward mouse events to original slider
      const rect = originalSpeedSlider.getBoundingClientRect();
      const canvasRect = speedSliderCanvas.getBoundingClientRect();
      const x = ((e.clientX - canvasRect.left) / canvasRect.width) * rect.width + rect.left;

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: x,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
      });
      originalSpeedSlider.dispatchEvent(mouseEvent);
    });

    speedSliderCanvas.addEventListener('click', (e) => {
      const rect = originalSpeedSlider.getBoundingClientRect();
      const canvasRect = speedSliderCanvas.getBoundingClientRect();
      const x = ((e.clientX - canvasRect.left) / canvasRect.width) * rect.width + rect.left;

      const mouseEvent = new MouseEvent('click', {
        clientX: x,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
      });
      originalSpeedSlider.dispatchEvent(mouseEvent);
    });
  }
}

// Initialize canvas overlay functionality
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    setupCanvasButtons();
    // Sync data every 100ms
    setInterval(syncCanvasElements, 100);
  }, 1000);
});
