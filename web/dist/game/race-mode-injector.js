// Race Mode Injector - Handle race mode: load horses, enable editor, submit results
(function() {
    'use strict';
    
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const raceId = urlParams.get('raceId');
    
    if (mode !== 'race' || !raceId) {
        console.log('[Race Mode] Not in race mode');
        return;
    }
    
    console.log('[Race Mode] 🏁 Initializing race', raceId);
    
    const API_BASE = window.location.origin + '/api';
    
    // Wait for game to be ready
    let gameReady = false;
    const checkReady = setInterval(() => {
        if (window.mapDef && document.getElementById('editorBar')) {
            clearInterval(checkReady);
            gameReady = true;
            initRaceMode();
        }
    }, 100);
    
    async function initRaceMode() {
        try {
            console.log('[Race Mode] Game ready, loading race data...');
            
            // Load race data
            const response = await fetch(`${API_BASE}/race/${raceId}/game-data`);
            if (!response.ok) {
                throw new Error('Failed to load race data');
            }
            
            const data = await response.json();
            console.log('[Race Mode] Loaded race data:', data);
            
            // Inject horses
            if (data.horseCustoms && data.horseCustoms.length > 0) {
                window.mapDef.horseCustoms = data.horseCustoms.map(horse => ({
                    name: horse.name,
                    spritePath: horse.sprite?.key ? `assets/horses/${horse.sprite.key.replace('.png', '')}.png` : null,
                    userId: horse.userId
                }));
                
                // Set horse count
                const nEl = document.getElementById('n');
                if (nEl) {
                    nEl.value = data.horseCustoms.length.toString();
                }
                
                console.log('[Race Mode] ✅ Injected', data.horseCustoms.length, 'horses');
            }
            
            // Load saved map config if exists
            if (data.race && data.race.map_data) {
                const mapData = typeof data.race.map_data === 'string' 
                    ? JSON.parse(data.race.map_data) 
                    : data.race.map_data;
                
                if (mapData.walls) window.mapDef.walls = mapData.walls;
                if (mapData.spawns) window.mapDef.spawns = mapData.spawns;
                if (mapData.carrotA) window.mapDef.carrotA = mapData.carrotA;
                if (mapData.carrotB) window.mapDef.carrotB = mapData.carrotB;
                if (mapData.room) window.mapDef.room = mapData.room;
                if (mapData.startGate) window.mapDef.startGate = mapData.startGate;
                if (mapData.boosts) window.mapDef.boosts = mapData.boosts;
                if (mapData.shields) window.mapDef.shields = mapData.shields;
                if (mapData.turbos) window.mapDef.turbos = mapData.turbos;
                if (mapData.traps) window.mapDef.traps = mapData.traps;
                if (mapData.muds) window.mapDef.muds = mapData.muds;
                if (mapData.ices) window.mapDef.ices = mapData.ices;
                
                // Redraw to show loaded map
                if (typeof window.redrawCanvas === 'function') {
                    window.redrawCanvas();
                }
                
                console.log('[Race Mode] ✅ Loaded saved map config');
            }
            
            // Hide loading screen first
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            // Enable editor UI and expand tools panel
            const editorBar = document.getElementById('editorBar');
            if (editorBar) {
                // Show editor bar
                editorBar.style.display = 'flex';
                
                // Remove collapsed class if present
                editorBar.classList.remove('collapsed');
                
                // Find and show editor content
                const editorContent = editorBar.querySelector('.editor-content');
                if (editorContent) {
                    editorContent.style.display = 'block';
                    editorContent.style.visibility = 'visible';
                    editorContent.style.opacity = '1';
                    console.log('[Race Mode] ✅ Expanded editor content');
                }
                
                console.log('[Race Mode] ✅ Enabled editor UI');
            }
            
            // Enter editor mode
            setTimeout(() => {
                const editBtn = document.getElementById('editBtn');
                if (editBtn) {
                    // Click to toggle editor mode
                    editBtn.click();
                    console.log('[Race Mode] ✅ Clicked edit button');
                    
                    // Ensure content stays visible after click
                    setTimeout(() => {
                        if (editorBar) {
                            editorBar.classList.remove('collapsed');
                            const editorContent = editorBar.querySelector('.editor-content');
                            if (editorContent) {
                                editorContent.style.display = 'block !important';
                                editorContent.style.visibility = 'visible';
                            }
                        }
                        
                        // Call ensureEditorContentVisible if available
                        if (typeof window.ensureEditorContentVisible === 'function') {
                            window.ensureEditorContentVisible();
                            console.log('[Race Mode] ✅ Called ensureEditorContentVisible');
                        }
                        
                        console.log('[Race Mode] ✅ Editor mode fully activated');
                    }, 300);
                }
            }, 500);
            
            // Override play button to submit results
            const originalStartRace = window.startRace;
            window.startRace = function() {
                console.log('[Race Mode] 🏁 Starting race...');
                if (originalStartRace) {
                    originalStartRace.call(window);
                }
                
                // Hook race completion
                setupResultSubmission();
            };
            
            console.log('[Race Mode] ✅ Ready! Edit map then press F1 to start race');
            
        } catch (error) {
            console.error('[Race Mode] Initialization error:', error);
            alert('Failed to load race data: ' + error.message);
        }
    }
    
    function setupResultSubmission() {
        const checkInterval = setInterval(async () => {
            if (window.winner && window.horses && !window.running) {
                clearInterval(checkInterval);
                
                console.log('[Race Mode] Race completed! Winner:', window.winner);
                
                try {
                    // Get token
                    let token = null;
                    const authStorage = localStorage.getItem('auth-storage');
                    if (authStorage) {
                        const parsed = JSON.parse(authStorage);
                        token = parsed.state?.token || parsed.token;
                    }
                    
                    if (!token) {
                        console.error('[Race Mode] No auth token');
                        return;
                    }
                    
                    // Prepare results
                    const rankings = window.horses
                        .filter(h => h.finishTime !== null)
                        .sort((a, b) => a.finishTime - b.finishTime)
                        .map((horse, index) => ({
                            userId: horse.userId || horse.customData?.userId,
                            position: index + 1,
                            finishTime: horse.finishTime
                        }));
                    
                    console.log('[Race Mode] Submitting results:', rankings);
                    
                    // Submit to server
                    const response = await fetch(`${API_BASE}/race/${raceId}/complete`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ rankings })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to submit results');
                    }
                    
                    console.log('[Race Mode] ✅ Results submitted successfully!');
                    
                    // Show success message
                    setTimeout(() => {
                        alert('✅ Race completed! Results submitted. You can close this window.');
                    }, 2000);
                    
                } catch (error) {
                    console.error('[Race Mode] Result submission error:', error);
                    alert('❌ Failed to submit results: ' + error.message);
                }
            }
        }, 1000);
    }
    
})();
