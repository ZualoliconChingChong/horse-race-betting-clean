// Epic Loading Screen Controller
class LoadingScreen {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.progressFill = document.getElementById('progressFill');
    this.loadingText = document.getElementById('loadingText');
    this.loadingPercentage = document.getElementById('loadingPercentage');
    this.tipText = document.getElementById('tipText');
    
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.isLoading = true;
    
    // Audio context for sound effects
    this.audioContext = null;
    this.initAudio();
    
    this.tips = [
      "💡 Tip: Use RAM power-up to eliminate opponents!",
      "🚀 Tip: Turbo gives you massive speed boost!",
      "🛡️ Tip: Shield protects you from RAM attacks!",
      "❄️ Tip: Time Freeze stops all other horses!",
      "🌀 Tip: Teleport to escape tight situations!",
      "🧲 Tip: Magnet attracts nearby power-ups!",
      "🔄 Tip: Spinners can block or redirect horses!",
      "💥 Tip: Bumpers add chaos to the race!",
      "🎯 Tip: Right-click tools for quick settings!",
      "⚡ Tip: Adjust game speed during races!"
    ];
    
    this.loadingSteps = [
      { text: "Initializing game engine...", duration: 300 },
      { text: "Loading horse sprites...", duration: 250 },
      { text: "Preparing power-ups...", duration: 200 },
      { text: "Setting up physics...", duration: 300 },
      { text: "Loading sound effects...", duration: 150 },
      { text: "Initializing editor tools...", duration: 250 },
      { text: "Preparing race tracks...", duration: 200 },
      { text: "Finalizing setup...", duration: 150 }
    ];
    
    this.currentStep = 0;
    this.currentTip = 0;
  }
  
  initAudio() {
    // Simple HTML5 Audio approach - more reliable
    this.audioEnabled = true;
    console.log('Audio initialized with HTML5 Audio');
  }
  
  // Create silent audio to bypass autoplay policy
  createSilentAudio() {
    if (this.silentAudio) return;
    
    // Create a very short silent audio file
    const sampleRate = 8000;
    const samples = 100; // Very short
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header for silent audio
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate silence (all zeros)
    for (let i = 0; i < samples; i++) {
      view.setInt16(44 + i * 2, 0, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    this.silentAudio = new Audio(url);
    this.silentAudio.loop = true;
    this.silentAudio.volume = 0.01;
  }

  // Simple beep using data URL audio
  playBeep(frequency = 440, duration = 200, type = 'sine', volume = 0.5) {
    if (!this.audioEnabled) return;
    
    try {
      // Create a simple tone using data URL
      const sampleRate = 8000;
      const samples = Math.floor(sampleRate * duration / 1000);
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate sine wave
      for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * volume * 32767;
        view.setInt16(44 + i * 2, sample, true);
      }
      
      // Create and play audio
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = volume;
      
      audio.play().then(() => {
        console.log(`Playing beep: ${frequency}Hz, ${duration}ms`);
        setTimeout(() => URL.revokeObjectURL(url), duration + 100);
      }).catch(e => {
        console.log('Audio play failed:', e);
        setTimeout(() => URL.revokeObjectURL(url), duration + 100);
      });
      
    } catch (e) {
      console.log('Audio generation failed:', e);
    }
  }
  
  // Play startup sound
  playStartupSound() {
    if (!this.audioEnabled) return;
    
    setTimeout(() => this.playBeep(523, 150, 'sine', 0.3), 100);  // C5
    setTimeout(() => this.playBeep(659, 150, 'sine', 0.3), 250);  // E5
    setTimeout(() => this.playBeep(784, 200, 'sine', 0.4), 400);   // G5
  }
  
  // Play progress sound
  playProgressSound() {
    this.playBeep(800 + (this.currentProgress * 5), 80, 'square', 0.3);
  }
  
  // Play completion sound
  playCompletionSound() {
    setTimeout(() => this.playBeep(523, 100, 'sine', 0.15), 0);    // C5
    setTimeout(() => this.playBeep(659, 100, 'sine', 0.15), 100);  // E5
    setTimeout(() => this.playBeep(784, 100, 'sine', 0.15), 200);  // G5
    setTimeout(() => this.playBeep(1047, 200, 'sine', 0.2), 300);  // C6
  }
  
  start() {
    this.showLoadingScreen();
    this.startTipRotation();
    // Play startup sound immediately
    setTimeout(() => this.playStartupSound(), 100);
    this.simulateLoading();
  }
  
  enableAudioOnInteraction() {
    const enableAudio = () => {
      console.log('User interaction detected, playing startup sound');
      this.playStartupSound();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    // Auto-enable audio after a short delay
    setTimeout(() => {
      console.log('Auto-playing startup sound');
      this.playStartupSound();
    }, 500);
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
  }
  
  showLoadingScreen() {
    this.loadingScreen.style.display = 'flex';
    this.loadingScreen.classList.remove('fade-out');
  }
  
  hideLoadingScreen() {
    this.loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
      this.isLoading = false;
    }, 1000);
  }
  
  updateProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(100, progress));
    this.animateProgress();
  }
  
  animateProgress() {
    const step = () => {
      if (this.currentProgress < this.targetProgress) {
        this.currentProgress += 1;
        this.progressFill.style.width = this.currentProgress + '%';
        this.loadingPercentage.textContent = this.currentProgress + '%';
        
        // Play progress sound every 10%
        if (this.currentProgress % 10 === 0) {
          this.playProgressSound();
        }
        
        requestAnimationFrame(step);
      }
    };
    step();
  }
  
  updateText(text) {
    this.loadingText.textContent = text;
  }
  
  startTipRotation() {
    const rotateTip = () => {
      if (!this.isLoading) return;
      
      this.tipText.style.opacity = '0';
      setTimeout(() => {
        if (!this.isLoading) return;
        this.currentTip = (this.currentTip + 1) % this.tips.length;
        this.tipText.textContent = this.tips[this.currentTip];
        this.tipText.style.opacity = '0.7';
      }, 300);
      
      setTimeout(() => {
        if (this.isLoading) rotateTip();
      }, 3000);
    };
    
    setTimeout(rotateTip, 2000);
  }
  
  simulateLoading() {
    let totalProgress = 0;
    const stepProgress = 100 / this.loadingSteps.length;
    
    const executeStep = (stepIndex) => {
      if (stepIndex >= this.loadingSteps.length) {
        this.updateText("Ready to race!");
        this.updateProgress(100);
        this.playCompletionSound();
        setTimeout(() => {
          this.hideLoadingScreen();
          // Trigger game initialization
          if (typeof initializeGame === 'function') {
            initializeGame();
          }
        }, 300);
        return;
      }
      
      const step = this.loadingSteps[stepIndex];
      this.updateText(step.text);
      
      // Simulate gradual progress during this step
      const startProgress = totalProgress;
      const endProgress = totalProgress + stepProgress;
      const progressIncrement = stepProgress / (step.duration / 50);
      
      let currentStepProgress = 0;
      const progressInterval = setInterval(() => {
        currentStepProgress += progressIncrement;
        const actualProgress = Math.min(startProgress + currentStepProgress, endProgress);
        this.updateProgress(actualProgress);
        
        if (currentStepProgress >= stepProgress) {
          clearInterval(progressInterval);
          totalProgress = endProgress;
          setTimeout(() => executeStep(stepIndex + 1), 100);
        }
      }, 50);
    };
    
    // Start loading simulation
    setTimeout(() => executeStep(0), 500);
  }
  
  // Method to be called when actual resources are loaded
  setRealProgress(progress, text) {
    if (text) this.updateText(text);
    this.updateProgress(progress);
  }
  
  // Quick finish for development
  quickFinish() {
    this.updateProgress(100);
    this.updateText("Ready to race!");
    setTimeout(() => this.hideLoadingScreen(), 500);
  }
}

// Initialize loading screen when DOM is ready
let gameLoader;
document.addEventListener('DOMContentLoaded', () => {
  gameLoader = new LoadingScreen();
  gameLoader.start();
});

// Global function to hide loading (can be called from other scripts)
function hideLoadingScreen() {
  if (gameLoader) {
    gameLoader.quickFinish();
  }
}

// Auto-hide after maximum time (fallback)
setTimeout(() => {
  if (gameLoader && gameLoader.isLoading) {
    console.log('Loading screen auto-hide after timeout');
    hideLoadingScreen();
  }
}, 3000);
