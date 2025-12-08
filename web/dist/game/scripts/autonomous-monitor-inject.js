
(function() {
  'use strict';
  
  // 🤖 Autonomous Monitor
  window.AutonomousMonitor = {
    enabled: true,
    data: {
      errors: [],
      warnings: [],
      performance: {},
      stateSnapshots: [],
      anomalies: []
    },
    
    /**
     * 🎬 Initialize monitoring
     */
    init() {
      console.log('🤖 Autonomous Monitor v1.0 - Initialized');
      
      this.setupErrorTracking();
      this.setupPerformanceTracking();
      this.setupStateValidation();
      this.setupAnomalyDetection();
      
      // Report every 5 seconds
      setInterval(() => this.generateReport(), 5000);
    },
    
    /**
     * 🔴 Error tracking
     */
    setupErrorTracking() {
      const originalError = console.error;
      console.error = (...args) => {
        this.data.errors.push({
          timestamp: Date.now(),
          message: args.join(' '),
          stack: new Error().stack
        });
        originalError.apply(console, args);
      };
      
      window.addEventListener('error', (e) => {
        this.data.errors.push({
          timestamp: Date.now(),
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno
        });
      });
    },
    
    /**
     * ⚡ Performance tracking
     */
    setupPerformanceTracking() {
      let frameCount = 0;
      let lastTime = performance.now();
      
      const checkFPS = () => {
        const now = performance.now();
        const delta = now - lastTime;
        
        if (delta >= 1000) {
          const fps = Math.round((frameCount * 1000) / delta);
          
          this.data.performance.fps = fps;
          this.data.performance.timestamp = Date.now();
          
          // Detect FPS drop
          if (fps < 30) {
            this.data.anomalies.push({
              type: 'performance',
              severity: 'warning',
              message: `Low FPS detected: ${fps}`,
              timestamp: Date.now()
            });
          }
          
          frameCount = 0;
          lastTime = now;
        }
        
        frameCount++;
        requestAnimationFrame(checkFPS);
      };
      
      requestAnimationFrame(checkFPS);
      
      // Memory monitoring
      if (performance.memory) {
        setInterval(() => {
          const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
          this.data.performance.memory = memoryMB;
          
          // Detect memory leak
          if (memoryMB > 500) {
            this.data.anomalies.push({
              type: 'memory',
              severity: 'critical',
              message: `High memory usage: ${memoryMB}MB`,
              timestamp: Date.now()
            });
          }
        }, 2000);
      }
    },
    
    /**
     * 🔍 State validation
     */
    setupStateValidation() {
      setInterval(() => {
        try {
          // Validate game state
          if (typeof mapDef === 'undefined') {
            this.data.errors.push({
              timestamp: Date.now(),
              message: 'mapDef is undefined',
              severity: 'critical'
            });
            return;
          }
          
          // Check for orphan power-ups
          const powerUpArrays = [
            'boosts', 'turbos', 'shields', 'magnets', 
            'nebulas', 'stuns', 'yellowhearts', 'redhearts', 'greenhearts'
          ];
          
          powerUpArrays.forEach(arrName => {
            const arr = mapDef[arrName];
            if (arr && Array.isArray(arr)) {
              arr.forEach((item, idx) => {
                // Check for consumed items not being reset
                if (item.consumed && mode === 'editor') {
                  this.data.anomalies.push({
                    type: 'state',
                    severity: 'warning',
                    message: `Consumed ${arrName}[${idx}] not reset in editor mode`,
                    timestamp: Date.now()
                  });
                }
                
                // Check for invalid positions
                if (item.x === undefined || item.y === undefined) {
                  this.data.errors.push({
                    timestamp: Date.now(),
                    message: `Invalid position in ${arrName}[${idx}]`,
                    severity: 'critical'
                  });
                }
              });
            }
          });
          
          // Take state snapshot
          this.data.stateSnapshots.push({
            timestamp: Date.now(),
            mode: typeof mode !== 'undefined' ? mode : 'unknown',
            powerUpCounts: powerUpArrays.reduce((acc, name) => {
              acc[name] = mapDef[name] ? mapDef[name].length : 0;
              return acc;
            }, {})
          });
          
          // Keep only last 10 snapshots
          if (this.data.stateSnapshots.length > 10) {
            this.data.stateSnapshots.shift();
          }
          
        } catch (error) {
          this.data.errors.push({
            timestamp: Date.now(),
            message: 'State validation error: ' + error.message,
            severity: 'critical'
          });
        }
      }, 3000);
    },
    
    /**
     * 🚨 Anomaly detection
     */
    setupAnomalyDetection() {
      let lastPowerUpCounts = {};
      
      setInterval(() => {
        try {
          if (typeof mapDef === 'undefined') return;
          
          // Detect sudden power-up disappearance
          const powerUpArrays = ['boosts', 'turbos', 'shields', 'magnets', 'nebulas'];
          
          powerUpArrays.forEach(arrName => {
            const currentCount = mapDef[arrName] ? mapDef[arrName].length : 0;
            const lastCount = lastPowerUpCounts[arrName] || 0;
            
            // If count dropped significantly in editor mode
            if (mode === 'editor' && currentCount < lastCount - 3) {
              this.data.anomalies.push({
                type: 'disappearance',
                severity: 'critical',
                message: `${arrName} count dropped from ${lastCount} to ${currentCount} in editor mode`,
                timestamp: Date.now()
              });
            }
            
            lastPowerUpCounts[arrName] = currentCount;
          });
          
        } catch (error) {
          // Ignore
        }
      }, 2000);
    },
    
    /**
     * 📊 Generate report
     */
    generateReport() {
      if (!this.enabled) return;
      
      const report = {
        timestamp: Date.now(),
        health: 'good',
        errors: this.data.errors.filter(e => e.timestamp > Date.now() - 5000),
        warnings: this.data.warnings.filter(w => w.timestamp > Date.now() - 5000),
        anomalies: this.data.anomalies.filter(a => a.timestamp > Date.now() - 5000),
        performance: this.data.performance,
        latestState: this.data.stateSnapshots[this.data.stateSnapshots.length - 1]
      };
      
      // Determine health
      if (report.errors.length > 0) report.health = 'critical';
      else if (report.anomalies.length > 0) report.health = 'warning';
      
      // Store report
      window._autonomousReport = report;
      
      // Log if issues found
      if (report.health !== 'good') {
        console.log('🤖 Autonomous Monitor Report:', report);
      }
      
      // Clear old data
      this.data.errors = this.data.errors.filter(e => e.timestamp > Date.now() - 60000);
      this.data.anomalies = this.data.anomalies.filter(a => a.timestamp > Date.now() - 60000);
    },
    
    /**
     * 📤 Export report for AI analysis
     */
    exportReport() {
      const fullReport = {
        timestamp: Date.now(),
        totalErrors: this.data.errors.length,
        totalAnomalies: this.data.anomalies.length,
        currentPerformance: this.data.performance,
        recentErrors: this.data.errors.slice(-10),
        recentAnomalies: this.data.anomalies.slice(-10),
        stateHistory: this.data.stateSnapshots
      };
      
      console.log('📤 Full Autonomous Report:');
      console.log(JSON.stringify(fullReport, null, 2));
      
      return fullReport;
    }
  };
  
  // Auto-initialize
  window.AutonomousMonitor.init();
  
  // Expose helper function
  window.getAIReport = () => window.AutonomousMonitor.exportReport();
  
})();
