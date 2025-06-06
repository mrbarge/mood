// ===============================================
// OCEAN WAVE SYSTEM MODULE
// ocean-waves.js
// ===============================================

class OceanWaveSystem {
    constructor() {
        this.isActive = false;
        this.noise = null;
        this.gain = null;
        this.filter = null;
        this.waveTimeout = null;
        this.currentWavePhase = 'waiting';
        this.currentNoiseType = 'pink';
        this.waveStartTime = 0;
        this.waveDuration = 0;
        this.waveReverb = null;
    }

    async init() {
        // Get slider values from DOM elements
        const baseLevelSlider = document.getElementById("base-level");
        const filterFreqSlider = document.getElementById("filter-freq");

        // Create gain node
        this.gain = new Tone.Gain(parseFloat(baseLevelSlider.value));

        // Create filter with user-controlled frequency
        this.filter = new Tone.Filter(parseInt(filterFreqSlider.value), 'lowpass');

        // Create noise source
        this.noise = new Tone.Noise(this.currentNoiseType);

        // Create wave-specific reverb
        this.waveReverb = new Tone.Reverb({
            decay: 3,
            wet: 0.4,
            preDelay: 0.02
        });

        // Connect the audio chain (masterVolume should be available globally)
        this.noise.connect(this.filter);
        this.filter.connect(this.gain);
        this.gain.connect(this.waveReverb);
        this.waveReverb.connect(masterVolume);

        // Set initial volume from slider
        this.updateVolume();
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;
        if (this.noise) {
            this.noise.start();
            this.scheduleNextWave();
        }
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;
        this.currentWavePhase = 'waiting';

        if (this.waveTimeout) {
            clearTimeout(this.waveTimeout);
            this.waveTimeout = null;
        }

        if (this.noise) {
            this.noise.stop();
        }
    }

    dispose() {
        this.stop();
        if (this.noise) this.noise.dispose();
        if (this.gain) this.gain.dispose();
        if (this.filter) this.filter.dispose();
        if (this.waveReverb) this.waveReverb.dispose();
    }

    scheduleNextWave() {
        if (!this.isActive) return;

        // Use pause between setting with random variation
        const pauseBetweenSlider = document.getElementById("pause-between");
        const pauseDuration = parseFloat(pauseBetweenSlider.value);
        const randomPause = pauseDuration + (Math.random() - 0.5) * pauseDuration * 0.5;

        this.currentWavePhase = 'waiting';

        this.waveTimeout = setTimeout(() => {
            if (this.isActive) this.startWave();
        }, randomPause * 1000);
    }

    startWave() {
        if (!this.isActive) return;

        // Get current slider values
        const minDurationSlider = document.getElementById("min-duration");
        const maxDurationSlider = document.getElementById("max-duration");
        const baseLevelSlider = document.getElementById("base-level");
        const peakLevelSlider = document.getElementById("peak-level");
        const buildSpeedSlider = document.getElementById("build-speed");

        const minDur = parseFloat(minDurationSlider.value);
        const maxDur = parseFloat(maxDurationSlider.value);
        const baseLevel = parseFloat(baseLevelSlider.value);
        const peakLevel = parseFloat(peakLevelSlider.value);
        const buildSpeed = parseFloat(buildSpeedSlider.value);

        // Random wave duration within specified range
        this.waveDuration = minDur + Math.random() * (maxDur - minDur);
        this.waveStartTime = Tone.now();

        // Calculate phase durations based on build speed
        const speedFactor = buildSpeed / 2.5; // Normalize around default value of 2.5
        const buildTime = this.waveDuration * (0.15 + Math.random() * 0.25) * (1 / speedFactor); // Faster speed = shorter build
        const sustainTime = this.waveDuration * (0.1 + Math.random() * 0.2); // 10-30% of total
        const recedeTime = this.waveDuration - buildTime - sustainTime; // remainder

        this.currentWavePhase = 'building';

        // Build phase - use peak level with variation
        const peakVariation = peakLevel * (0.8 + Math.random() * 0.4); // ±20% variation
        this.gain.gain.rampTo(peakVariation, buildTime);

        // Schedule sustain phase
        setTimeout(() => {
            if (!this.isActive) return;
            this.currentWavePhase = 'sustaining';

            // Add some subtle variation during sustain
            const sustainVariation = peakVariation * (0.9 + Math.random() * 0.2);
            this.gain.gain.rampTo(sustainVariation, sustainTime * 0.5);

            // Schedule recede phase
            setTimeout(() => {
                if (!this.isActive) return;
                this.currentWavePhase = 'receding';

                // Recede to base level (with slight variation)
                const newBaseLevel = baseLevel * (0.5 + Math.random() * 1);
                this.gain.gain.rampTo(newBaseLevel, recedeTime);

                // Schedule next wave
                setTimeout(() => {
                    if (this.isActive) this.scheduleNextWave();
                }, recedeTime * 1000);

            }, sustainTime * 1000);

        }, buildTime * 1000);
    }

    updateVolume() {
        if (this.gain) {
            // Convert dB slider to linear gain and apply it
            const noiseVolumeSlider = document.getElementById("noise-volume");
            const dbValue = parseInt(noiseVolumeSlider.value);
            // Use gain.gain instead of gain.volume
            this.gain.gain.rampTo(Tone.dbToGain(dbValue), 0.1);
        }
    }

    updateNoiseType(type) {
        this.currentNoiseType = type;

        if (this.isActive && this.noise) {
            // Recreate noise with new type
            this.noise.stop();
            this.noise.dispose();
            this.noise = new Tone.Noise(type);
            this.noise.connect(this.filter);
            this.noise.start();
        }
    }

    updateFilter(frequency) {
        if (this.filter) {
            const filterFreqSlider = document.getElementById("filter-freq");
            this.filter.frequency.rampTo(frequency || parseInt(filterFreqSlider.value), 0.5);
        }
    }

    updateBaseLevel() {
        // This affects the next wave cycle, not the current one
        if (this.currentWavePhase === 'waiting' && this.gain) {
            const baseLevelSlider = document.getElementById("base-level");
            const baseLevel = parseFloat(baseLevelSlider.value);
            this.gain.gain.rampTo(baseLevel, 1);
        }
    }

    getCurrentIntensity() {
        return this.gain ? this.gain.gain.value : 0;
    }

    getWaveInfo() {
        if (!this.isActive) return 'Stopped';

        switch(this.currentWavePhase) {
            case 'waiting':
                return 'Waiting for next wave...';
            case 'building':
                return `Building wave (${this.waveDuration.toFixed(1)}s total)`;
            case 'sustaining':
                return 'Wave sustaining...';
            case 'receding':
                return 'Wave receding...';
            default:
                return 'Wave active';
        }
    }
}

// ===============================================
// OCEAN WAVE MANAGER
// ===============================================

class OceanWaveManager {
    constructor() {
        this.waveSystem = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        this.waveSystem = new OceanWaveSystem();
        await this.waveSystem.init();
        this.isInitialized = true;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Get UI elements
        const noiseToggle = document.getElementById("noise-toggle");
        const noiseVolumeSlider = document.getElementById("noise-volume");
        const baseLevelSlider = document.getElementById("base-level");
        const peakLevelSlider = document.getElementById("peak-level");
        const buildSpeedSlider = document.getElementById("build-speed");
        const minDurationSlider = document.getElementById("min-duration");
        const maxDurationSlider = document.getElementById("max-duration");
        const pauseBetweenSlider = document.getElementById("pause-between");
        const noiseTypeSelect = document.getElementById("noise-type");
        const filterFreqSlider = document.getElementById("filter-freq");

        // Set up event listeners
        if (noiseToggle) {
            noiseToggle.addEventListener("change", () => this.toggle());
        }

        if (noiseVolumeSlider) {
            noiseVolumeSlider.addEventListener("input", () => this.updateVolume());
        }

        if (baseLevelSlider) {
            baseLevelSlider.addEventListener("input", () => this.updateBaseLevel());
        }

        if (peakLevelSlider) {
            peakLevelSlider.addEventListener("input", () => this.updateWaveSettings());
        }

        if (buildSpeedSlider) {
            buildSpeedSlider.addEventListener("input", () => this.updateWaveSettings());
        }

        if (minDurationSlider) {
            minDurationSlider.addEventListener("input", () => this.updateWaveSettings());
        }

        if (maxDurationSlider) {
            maxDurationSlider.addEventListener("input", () => this.updateWaveSettings());
        }

        if (pauseBetweenSlider) {
            pauseBetweenSlider.addEventListener("input", () => this.updateWaveSettings());
        }

        if (noiseTypeSelect) {
            noiseTypeSelect.addEventListener("change", () => this.updateNoiseType());
        }

        if (filterFreqSlider) {
            filterFreqSlider.addEventListener("input", () => this.updateFilter());
        }
    }

    async toggle() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const noiseToggle = document.getElementById("noise-toggle");

        if (noiseToggle && noiseToggle.checked) {
            this.waveSystem.start();
        } else {
            if (this.waveSystem) {
                this.waveSystem.stop();
            }
        }

        this.updateStatus();
    }

    updateVolume() {
        if (this.waveSystem) {
            this.waveSystem.updateVolume();
        }
    }

    updateWaveSettings() {
        // Settings like duration, timing, and build speed are applied
        // automatically when the next wave cycle starts.
        console.debug("Wave settings updated - will apply to next wave cycle");
    }

    updateNoiseType() {
        const noiseTypeSelect = document.getElementById("noise-type");
        const selectedType = noiseTypeSelect ? noiseTypeSelect.value : 'pink';

        if (this.waveSystem) {
            this.waveSystem.updateNoiseType(selectedType);
            this.waveSystem.updateFilter(); // Also update filter to match noise type
        }
    }

    updateFilter() {
        if (this.waveSystem) {
            this.waveSystem.updateFilter();
        }
    }

    updateBaseLevel() {
        if (this.waveSystem) {
            this.waveSystem.updateBaseLevel();
        }
    }

    updateStatus() {
        const noiseToggle = document.getElementById("noise-toggle");
        const status = document.getElementById("waves-status");

        if (status) {
            status.textContent = (noiseToggle && noiseToggle.checked) ? 'On' : 'Off';
        }
    }

    // Public API methods
    isActive() {
        return this.waveSystem ? this.waveSystem.isActive : false;
    }

    getCurrentIntensity() {
        return this.waveSystem ? this.waveSystem.getCurrentIntensity() : 0;
    }

    getWaveInfo() {
        return this.waveSystem ? this.waveSystem.getWaveInfo() : 'Not initialized';
    }

    // Clean shutdown
    dispose() {
        if (this.waveSystem) {
            this.waveSystem.dispose();
            this.waveSystem = null;
        }
        this.isInitialized = false;
    }
}