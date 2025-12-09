// Race Save Injector - Auto-inject save functionality for race editor mode
(function() {
    'use strict';
    
    const urlParams = new URLSearchParams(window.location.search);
    const isEditorMode = urlParams.get('editor') === 'true';
    const raceId = urlParams.get('raceId');
    
    if (!isEditorMode || !raceId) {
        console.log('[Race Save] Not in race editor mode');
        return;
    }
    
    console.log('[Race Save] Injecting save functionality for race', raceId);
    
    const API_BASE = window.location.origin + '/api';
    let raceData = null;
    
    // Create floating save button
    const saveBtn = document.createElement('button');
    saveBtn.id = 'raceSaveBtn';
    saveBtn.innerHTML = '💾 Save';
    saveBtn.style.cssText = `
        position: fixed;
        top: 15px;
        right: 15px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(74, 222, 128, 0.4);
        transition: all 0.2s ease;
        font-family: system-ui;
    `;
    
    saveBtn.addEventListener('click', async () => {
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '⏳ Saving...';
            saveBtn.style.background = '#666';
            
            await saveConfig();
            
            saveBtn.innerHTML = '✅ Saved!';
            saveBtn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
            setTimeout(() => {
                saveBtn.innerHTML = '💾 Save';
                saveBtn.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('[Race Save] Save failed:', error);
            saveBtn.innerHTML = '❌ Failed: ' + error.message;
            saveBtn.style.background = '#ef4444';
            setTimeout(() => {
                saveBtn.innerHTML = '💾 Save';
                saveBtn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
                saveBtn.disabled = false;
            }, 3000);
        }
    });
    
    document.body.appendChild(saveBtn);
    
    // Helper to get auth token
    function getAuthToken() {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                return parsed.state?.token || parsed.token;
            } catch (e) {
                console.error('[Race Save] Failed to parse auth-storage:', e);
            }
        }
        return null;
    }
    
    // Helper to capture canvas screenshot
    function captureMapPreview() {
        try {
            const canvas = document.getElementById('cv') || document.getElementById('canvas');
            if (!canvas) return null;
            
            const maxWidth = 1200;
            const maxHeight = 900;
            const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height, 1);
            
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = canvas.width * scale;
            previewCanvas.height = canvas.height * scale;
            
            const ctx = previewCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
            
            return previewCanvas.toDataURL('image/jpeg', 0.92);
        } catch (error) {
            console.error('[Race Save] Failed to capture preview:', error);
            return null;
        }
    }
    
    // Save config to server
    async function saveConfig() {
        const mapDef = window.mapDef;
        if (!mapDef) throw new Error('Map definition not found');
        
        const config = {
            // Map elements
            walls: mapDef.walls || [],
            brushes: mapDef.brushes || [],
            pipes: mapDef.pipes || [],
            semis: mapDef.semis || [],
            arcs: mapDef.arcs || [],
            textWalls: mapDef.textWalls || [],
            
            // Race elements
            spawns: mapDef.spawnPoints || [],
            carrotA: mapDef.carrotA || null,
            carrotB: mapDef.carrotB || null,
            room: mapDef.room || null,
            startGate: mapDef.startGate || null,
            
            // Power-ups (ALL types)
            boosts: mapDef.boosts || [],
            shields: mapDef.shields || [],
            turbos: mapDef.turbos || [],
            ghosts: mapDef.ghosts || [],
            rams: mapDef.rams || [],
            teleports: mapDef.teleports || [],
            magnets: mapDef.magnets || [],
            timeFreezes: mapDef.timeFreezes || [],
            icefreezers: mapDef.icefreezers || [],
            poisons: mapDef.poisons || [],
            tornados: mapDef.tornados || [],
            spinners: mapDef.spinners || [],
            
            // Obstacles
            traps: mapDef.traps || [],
            muds: mapDef.muds || [],
            ices: mapDef.ices || [],
            
            // Power-up settings
            magnetSettings: mapDef.magnetSettings || null,
            turboSettings: mapDef.turboSettings || null,
            shieldSettings: mapDef.shieldSettings || null,
            poisonSettings: mapDef.poisonSettings || null,
            timeFreezeSettings: mapDef.timeFreezeSettings || null,
            teleportSettings: mapDef.teleportSettings || null,
            warpzoneSettings: mapDef.warpzoneSettings || null,
            quantumdashSettings: mapDef.quantumdashSettings || null,
            
            // Physics settings
            horseRadius: mapDef.horseRadius,
            carrotRadius: mapDef.carrotRadius,
            maxVel: mapDef.maxVel,
            minCruise: mapDef.minCruise,
            horseHitScale: mapDef.horseHitScale,
            horseHitInset: mapDef.horseHitInset,
            
            // Weather
            weather: mapDef.weather || null,
            lastHorseWins: mapDef.lastHorseWins,
            hpSystemEnabled: mapDef.hpSystemEnabled,
            horseMaxHP: mapDef.horseMaxHP,
            showHPNumbers: mapDef.showHPNumbers,
            wallDamageEnabled: mapDef.wallDamageEnabled,
            wallDamageAmount: mapDef.wallDamageAmount,
            borderDamageEnabled: mapDef.borderDamageEnabled,
            borderDamageAmount: mapDef.borderDamageAmount,
            brushDamageEnabled: mapDef.brushDamageEnabled,
            brushDamageAmount: mapDef.brushDamageAmount,
            showHorseSpeed: mapDef.showHorseSpeed,
            autoRotateHorseSprite: mapDef.autoRotateHorseSprite,
            trailEnabled: mapDef.trailEnabled,
            trailColor: mapDef.trailColor,
            trailIntensity: mapDef.trailIntensity,
            hideHorseNames: window.hideHorseNames,
            nameFontScale: window.nameFontScale,
            luckEnabled: window.luckEnabled,
            luckInterval: window.luckIntervalSec,
            collisionSfx: window.collisionSfxEnabled,
            preventCollisionSpeedChange: window.preventCollisionSpeedChange,
            countdown: window.countdown
        };
        
        const preview = captureMapPreview();
        const token = getAuthToken();
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_BASE}/race/${raceId}/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mapData: config, previewImage: preview })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to save config');
        }
        
        return await response.json();
    }
    
    // Load race data from API
    async function loadRaceData() {
        try {
            const token = getAuthToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${API_BASE}/race/${raceId}/game-data`, { headers });
            if (!response.ok) throw new Error('Failed to load race data');
            
            raceData = await response.json();
            console.log('[Race Save] Loaded race data:', raceData);
            console.log('[Race Save] Participants:', raceData.horseCustoms?.length || 0);
            
            // Wait for mapDef to be available
            const waitForMapDef = setInterval(() => {
                if (window.mapDef) {
                    clearInterval(waitForMapDef);
                    loadSavedMapConfig();
                    injectHorses();
                    setupHorseCountSlider();
                    overridePlayButton();
                }
            }, 100);
            
        } catch (error) {
            console.error('[Race Save] Failed to load race data:', error);
        }
    }
    
    // Load saved map config
    function loadSavedMapConfig() {
        if (!raceData?.race?.map_data) {
            console.log('[Race Save] No saved map config');
            return;
        }
        
        try {
            const mapData = typeof raceData.race.map_data === 'string' 
                ? JSON.parse(raceData.race.map_data) 
                : raceData.race.map_data;
            
            console.log('[Race Save] Loading saved map config...');
            
            // Apply map elements
            if (mapData.walls) window.mapDef.walls = mapData.walls;
            if (mapData.brushes) window.mapDef.brushes = mapData.brushes;
            if (mapData.pipes) window.mapDef.pipes = mapData.pipes;
            if (mapData.semis) window.mapDef.semis = mapData.semis;
            if (mapData.arcs) window.mapDef.arcs = mapData.arcs;
            if (mapData.textWalls) window.mapDef.textWalls = mapData.textWalls;
            
            // Race elements
            if (mapData.spawns) window.mapDef.spawnPoints = mapData.spawns;
            if (mapData.carrotA) window.mapDef.carrotA = mapData.carrotA;
            if (mapData.carrotB) window.mapDef.carrotB = mapData.carrotB;
            if (mapData.room) window.mapDef.room = mapData.room;
            if (mapData.startGate) window.mapDef.startGate = mapData.startGate;
            
            // Power-ups (ALL types)
            if (mapData.boosts) window.mapDef.boosts = mapData.boosts;
            if (mapData.shields) window.mapDef.shields = mapData.shields;
            if (mapData.turbos) window.mapDef.turbos = mapData.turbos;
            if (mapData.ghosts) window.mapDef.ghosts = mapData.ghosts;
            if (mapData.rams) window.mapDef.rams = mapData.rams;
            if (mapData.teleports) window.mapDef.teleports = mapData.teleports;
            if (mapData.magnets) window.mapDef.magnets = mapData.magnets;
            if (mapData.timeFreezes) window.mapDef.timeFreezes = mapData.timeFreezes;
            if (mapData.icefreezers) window.mapDef.icefreezers = mapData.icefreezers;
            if (mapData.poisons) window.mapDef.poisons = mapData.poisons;
            if (mapData.tornados) window.mapDef.tornados = mapData.tornados;
            if (mapData.spinners) window.mapDef.spinners = mapData.spinners;
            
            // Obstacles
            if (mapData.traps) window.mapDef.traps = mapData.traps;
            if (mapData.muds) window.mapDef.muds = mapData.muds;
            if (mapData.ices) window.mapDef.ices = mapData.ices;
            
            // Power-up settings
            if (mapData.magnetSettings) window.mapDef.magnetSettings = mapData.magnetSettings;
            if (mapData.turboSettings) window.mapDef.turboSettings = mapData.turboSettings;
            if (mapData.shieldSettings) window.mapDef.shieldSettings = mapData.shieldSettings;
            if (mapData.poisonSettings) window.mapDef.poisonSettings = mapData.poisonSettings;
            if (mapData.timeFreezeSettings) window.mapDef.timeFreezeSettings = mapData.timeFreezeSettings;
            if (mapData.teleportSettings) window.mapDef.teleportSettings = mapData.teleportSettings;
            if (mapData.warpzoneSettings) window.mapDef.warpzoneSettings = mapData.warpzoneSettings;
            if (mapData.quantumdashSettings) window.mapDef.quantumdashSettings = mapData.quantumdashSettings;
            
            // Physics settings
            if (mapData.horseRadius !== undefined) window.mapDef.horseRadius = mapData.horseRadius;
            if (mapData.carrotRadius !== undefined) window.mapDef.carrotRadius = mapData.carrotRadius;
            if (mapData.maxVel !== undefined) window.mapDef.maxVel = mapData.maxVel;
            if (mapData.minCruise !== undefined) window.mapDef.minCruise = mapData.minCruise;
            if (mapData.horseHitScale !== undefined) window.mapDef.horseHitScale = mapData.horseHitScale;
            if (mapData.horseHitInset !== undefined) window.mapDef.horseHitInset = mapData.horseHitInset;
            
            // Weather
            if (mapData.weather) window.mapDef.weather = mapData.weather;
            
            // Apply settings
            if (mapData.lastHorseWins !== undefined) window.mapDef.lastHorseWins = mapData.lastHorseWins;
            if (mapData.hpSystemEnabled !== undefined) window.mapDef.hpSystemEnabled = mapData.hpSystemEnabled;
            if (mapData.horseMaxHP !== undefined) window.mapDef.horseMaxHP = mapData.horseMaxHP;
            if (mapData.wallDamageEnabled !== undefined) window.mapDef.wallDamageEnabled = mapData.wallDamageEnabled;
            if (mapData.wallDamageAmount !== undefined) window.mapDef.wallDamageAmount = mapData.wallDamageAmount;
            if (mapData.borderDamageEnabled !== undefined) window.mapDef.borderDamageEnabled = mapData.borderDamageEnabled;
            if (mapData.borderDamageAmount !== undefined) window.mapDef.borderDamageAmount = mapData.borderDamageAmount;
            
            // Redraw map
            if (typeof window.invalidateStaticLayer === 'function') window.invalidateStaticLayer();
            if (typeof window.drawMap === 'function') window.drawMap();
            
            console.log('[Race Save] ✅ Loaded saved map config');
        } catch (error) {
            console.error('[Race Save] Failed to load saved config:', error);
        }
    }
    
    // Inject horses - slider controls total count, participants fill first slots
    function injectHorses() {
        const nEl = document.getElementById('n');
        const sliderCount = parseInt(nEl?.value) || 8;
        const participants = raceData?.horseCustoms || [];
        
        console.log('[Race Save] Slider count:', sliderCount, 'Participants:', participants.length);
        
        // Default colors matching game's getDefaultHorseInfo()
        const defaultBodies = [
            '#42a5f5', '#ef5350', '#66bb6a', '#ffa726', '#ab47bc',
            '#26a69a', '#ec407a', '#7e57c2', '#29b6f6', '#ff7043',
            '#26c6da', '#9ccc65', '#ffca28', '#8d6e63', '#5c6bc0',
            '#26a69a', '#42a5f5', '#ef5350', '#66bb6a', '#ffa726'
        ];
        const defaultLabels = [
            '#1e88e5', '#c62828', '#2e7d32', '#fb8c00', '#8e24aa',
            '#00897b', '#ad1457', '#5e35b1', '#0288d1', '#f4511e',
            '#00acc1', '#7cb342', '#f9a825', '#6d4c41', '#3949ab',
            '#00897b', '#1e88e5', '#c62828', '#2e7d32', '#fb8c00'
        ];
        
        window.mapDef.horseCustoms = [];
        
        for (let i = 0; i < sliderCount; i++) {
            const idx = i % 20;
            
            if (i < participants.length) {
                const horse = participants[i];
                let spritePath = null;
                if (horse.sprite && horse.sprite.key) {
                    spritePath = `assets/horses/${horse.sprite.key.replace('.png', '')}.png`;
                }
                
                window.mapDef.horseCustoms[i] = {
                    name: horse.name,
                    sprite: spritePath,
                    body: horse.body || defaultBodies[idx],
                    label: horse.label_color || horse.label || defaultLabels[idx],
                    skill: horse.skill || 'none',
                    customSpeed: horse.customSpeed || 1.0,
                    customHP: horse.customHP || 100,
                    luck: horse.luck || 0,
                    luckInterval: horse.luckInterval || 1.0,
                    userId: horse.userId,
                    userHorseId: horse.userHorseId,
                    username: horse.username,
                    _init: true
                };
                console.log(`[Race Save] Horse ${i}: "${horse.name}" (participant)`);
            } else {
                // Use game's default naming and colors
                window.mapDef.horseCustoms[i] = {
                    name: `Ngựa ${i + 1}`,
                    sprite: null,
                    body: defaultBodies[idx],
                    label: defaultLabels[idx],
                    skill: 'none',
                    customSpeed: 1.0,
                    customHP: 100,
                    luck: 0,
                    luckInterval: 1.0,
                    scale: '1',
                    outline: 'off',
                    outlineColor: '#000000',
                    outlineWidth: '2',
                    userId: null,
                    username: null,
                    _init: true
                };
                console.log(`[Race Save] Horse ${i}: Ngựa ${i + 1} (test)`);
            }
        }
        
        const nValEl = document.getElementById('nVal');
        if (nValEl) nValEl.textContent = sliderCount.toString();
        
        console.log('[Race Save] ✅ Created', sliderCount, 'horses (' + participants.length + ' participants + ' + Math.max(0, sliderCount - participants.length) + ' test horses)');
    }
    
    // Setup horse count slider
    function setupHorseCountSlider() {
        const nEl = document.getElementById('n');
        const nValEl = document.getElementById('nVal');
        
        if (!nEl) return;
        
        nEl.addEventListener('input', () => {
            const newCount = parseInt(nEl.value) || 8;
            if (nValEl) nValEl.textContent = newCount.toString();
            console.log('[Race Save] Slider changed to:', newCount);
            injectHorses();
        });
        
        console.log('[Race Save] ✅ Horse count slider enabled');
    }
    
    // Override play button
    function overridePlayButton() {
        const originalStartRace = window.startRace;
        
        window.startRace = async function() {
            console.log('[Race Save] Starting race with', window.mapDef.horseCustoms?.length, 'horses');
            
            // Ensure horse count matches
            const horseCount = window.mapDef.horseCustoms?.length || 0;
            const nEl = document.getElementById('n');
            if (nEl) nEl.value = horseCount.toString();
            
            // Rebuild sprites if needed
            if (typeof window.rebuildSpriteCaches === 'function') {
                window.rebuildSpriteCaches();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            if (originalStartRace) {
                originalStartRace.call(window);
            }
        };
        
        console.log('[Race Save] ✅ Overrode startRace function');
    }
    
    // Start loading
    loadRaceData();
    
})();
