// ===============================================
// THUNDER STORM SYSTEM MODULE
// thunder-system.js
// ===============================================

class ThunderStormSystem {
    constructor() {
        this.isActive = false;
        this.autoInterval = null;

        // Audio components
        this.rumbleNoise = null;
        this.rumbleFilter = null;
        this.rumbleEnv = null;
        this.rainNoise = null;
        this.rainFilter = null;
        this.rainGain = null;
        this.thunderReverb = null;
        this.delay = null;
        this.compressor = null;
        this.masterGain = null;
    }

    async init() {
        console.log('⛈️ Initializing thunder storm system...');

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            // Get volume slider value from DOM
            const volumeSlider = document.getElementById("thunder-volume");
            const volumeDb = volumeSlider ? parseInt(volumeSlider.value) : -6;
            this.masterGain = new Tone.Gain(Tone.dbToGain(volumeDb));

            // Create reverb for spatial effect
            this.thunderReverb = new Tone.Reverb({
                decay: 4,
                preDelay: 0.1,
                wet: 0.4
            });

            // Create delay for echo effect
            this.delay = new Tone.FeedbackDelay({
                delayTime: 0.3,
                feedback: 0.2,
                wet: 0.2
            });

            // Compressor to manage dynamics
            this.compressor = new Tone.Compressor({
                threshold: -12,
                ratio: 4,
                attack: 0.003,
                release: 0.1
            });

            // Thunder rumble components
            this.rumbleNoise = null; // Will be created when starting
            this.rumbleFilter = new Tone.Filter({
                type: 'lowpass',
                frequency: 200,
                Q: 2
            });
            this.rumbleEnv = new Tone.AmplitudeEnvelope({
                attack: 0.2,
                decay: 2.5,
                sustain: 0.2,
                release: 4
            });

            // Rain components
            this.rainNoise = null; // Will be created when starting
            this.rainFilter = new Tone.Filter({
                type: 'highpass',
                frequency: 1000,
                Q: 0.5
            });
            this.rainGain = new Tone.Gain(0);

            // Connect audio chain (without noise sources for now)
            this.rumbleFilter.connect(this.rumbleEnv);
            this.rumbleEnv.connect(this.compressor);

            this.rainFilter.connect(this.rainGain);
            this.rainGain.connect(this.compressor);

            this.compressor.connect(this.delay);
            this.delay.connect(this.thunderReverb);
            this.thunderReverb.connect(this.masterGain);

            // Connect to global master volume if available
            if (typeof masterVolume !== 'undefined' && masterVolume) {
                this.masterGain.connect(masterVolume);
            } else {
                this.masterGain.toDestination();
            }

            console.log('⛈️ Thunder storm system ready!');

        } catch (error) {
            console.error('⛈️ Error initializing thunder system:', error);
            throw error;
        }
    }

    start() {
        console.log('⛈️ Starting thunder storm...');
        this.isActive = true;

        // Recreate noise sources to avoid "start time" error
        this.recreateNoiseSources();

        // Automatically start rain when thunder system starts
        this.startRain();

        // Automatically start random thunder
        this.startAutoThunder();
    }

    stop() {
        console.log('⛈️ Stopping thunder storm...');
        this.isActive = false;
        this.stopAutoThunder();
        this.stopRain();

        // Dispose of noise sources to clean up
        this.disposeNoiseSources();
    }

    startAutoThunder() {
        if (this.autoInterval) return; // Already running

        const scheduleNext = () => {
            if (!this.isActive) return;

            const frequencySlider = document.getElementById("thunder-frequency");
            const frequency = frequencySlider ? parseInt(frequencySlider.value) : 8;

            // Random interval between 2 seconds and the frequency setting
            const interval = (Math.random() * frequency + 2) * 1000;

            this.autoInterval = setTimeout(() => {
                if (this.isActive) {
                    this.triggerThunder();
                    scheduleNext();
                }
            }, interval);
        };

        // Start with first thunder after a short delay
        setTimeout(() => {
            if (this.isActive) {
                this.triggerThunder();
                scheduleNext();
            }
        }, 2000 + Math.random() * 3000); // 2-5 second initial delay
    }

    stopAutoThunder() {
        if (this.autoInterval) {
            clearTimeout(this.autoInterval);
            this.autoInterval = null;
        }
    }

    triggerThunder() {
        if (!this.isActive) return;

        const intensitySlider = document.getElementById("thunder-intensity");
        const distanceSlider = document.getElementById("thunder-distance");

        const intensity = intensitySlider ? parseFloat(intensitySlider.value) : 0.7;
        const distance = distanceSlider ? parseFloat(distanceSlider.value) : 0.5;

        this.playThunderSound(intensity, distance);

        // Track for visualization
        if (typeof activeNotes !== 'undefined') {
            const thunderNote = 'THUNDER_RUMBLE';
            if (!activeNotes[thunderNote]) {
                activeNotes[thunderNote] = { count: 1, type: 'thunder' };
            } else {
                activeNotes[thunderNote].count++;
            }

            setTimeout(() => {
                if (typeof activeNotes !== 'undefined' && activeNotes[thunderNote]) {
                    activeNotes[thunderNote].count--;
                    if (activeNotes[thunderNote].count <= 0) {
                        delete activeNotes[thunderNote];
                    }
                }
            }, 3000);
        }
    }

    playThunderSound(intensity, distance) {
        if (!this.rumbleNoise) {
            console.warn('⛈️ Rumble noise not available');
            return;
        }

        const now = Tone.now();

        const rumbleVolume = intensity * (1.0 + distance * 0.6) * 2.5;

        // Update filter based on distance
        this.rumbleFilter.frequency.setValueAtTime(200 - (distance * 120), now);
        this.rumbleEnv.attackLevel = rumbleVolume;

        const duration = 2 + (intensity * 4) + (distance * 2);

        // Create a new rumble noise for this thunder strike
        const thunderRumble = new Tone.Noise('brown');
        thunderRumble.connect(this.rumbleFilter);

        // Trigger rumble
        thunderRumble.start(now);
        this.rumbleEnv.triggerAttackRelease(duration, now);
        thunderRumble.stop(now + duration + 1);

        // Clean up this specific rumble instance after use
        setTimeout(() => {
            try {
                thunderRumble.dispose();
            } catch (error) {
                console.debug('Error disposing thunder rumble:', error);
            }
        }, (duration + 2) * 1000);

        // Adjust reverb based on distance
        this.thunderReverb.decay = 2 + (distance * 5) + (Math.random() * 1);
    }

    startRain() {
        if (!this.rainNoise) {
            console.warn('⛈️ Rain noise not available');
            return;
        }

        const rainVolumeSlider = document.getElementById("thunder-rain-volume");
        const volume = rainVolumeSlider ? parseFloat(rainVolumeSlider.value) : 0.2;

        this.rainGain.gain.rampTo(volume, 2);
        this.rainNoise.start();
        console.log('⛈️ Rain started automatically');
    }

    stopRain() {
        this.rainGain.gain.rampTo(0, 2);
        setTimeout(() => {
            if (!this.isActive && this.rainNoise && this.rainNoise.state === 'started') {
                try {
                    this.rainNoise.stop();
                } catch (error) {
                    console.debug('Error stopping rain noise:', error);
                }
            }
        }, 2000);
        console.log('⛈️ Rain stopped');
    }

    updateVolume() {
        const volumeSlider = document.getElementById("thunder-volume");
        if (this.masterGain && volumeSlider) {
            const dbValue = parseInt(volumeSlider.value);
            const gainValue = Tone.dbToGain(dbValue);
            this.masterGain.gain.rampTo(gainValue, 0.1);
        }
    }

    recreateNoiseSources() {
        console.log('⛈️ Recreating noise sources...');

        // Dispose existing noise sources if they exist
        this.disposeNoiseSources();

        // Create new thunder rumble noise
        this.rumbleNoise = new Tone.Noise('brown');
        this.rumbleNoise.connect(this.rumbleFilter);

        // Create new rain noise
        this.rainNoise = new Tone.Noise('pink');
        this.rainNoise.connect(this.rainFilter);

        console.log('⛈️ Noise sources recreated');
    }

    disposeNoiseSources() {
        if (this.rumbleNoise) {
            try {
                if (this.rumbleNoise.state === 'started') {
                    this.rumbleNoise.stop();
                }
                this.rumbleNoise.dispose();
            } catch (error) {
                console.debug('Error disposing rumble noise:', error);
            }
            this.rumbleNoise = null;
        }

        if (this.rainNoise) {
            try {
                if (this.rainNoise.state === 'started') {
                    this.rainNoise.stop();
                }
                this.rainNoise.dispose();
            } catch (error) {
                console.debug('Error disposing rain noise:', error);
            }
            this.rainNoise = null;
        }
    }

    updateVolume() {
        const volumeSlider = document.getElementById("thunder-volume");
        if (this.masterGain && volumeSlider) {
            const dbValue = parseInt(volumeSlider.value);
            const gainValue = Tone.dbToGain(dbValue);
            this.masterGain.gain.rampTo(gainValue, 0.1);
        }
    }

    updateRainVolume() {
        if (this.isActive && this.rainGain) {
            const rainVolumeSlider = document.getElementById("thunder-rain-volume");
            const volume = rainVolumeSlider ? parseFloat(rainVolumeSlider.value) : 0.2;
            this.rainGain.gain.rampTo(volume, 0.5);
        }
    }

    dispose() {
        this.stop();

        // Dispose noise sources
        this.disposeNoiseSources();

        // Dispose other audio components
        [this.rumbleFilter, this.rumbleEnv, this.rainFilter, this.rainGain,
            this.thunderReverb, this.delay, this.compressor, this.masterGain].forEach(node => {
            if (node && node.dispose) {
                try {
                    node.dispose();
                } catch (error) {
                    console.debug("Error disposing thunder node:", error);
                }
            }
        });
    }
}

// ===============================================
// THUNDER STORM MANAGER
// ===============================================

class ThunderStormManager {
    constructor() {
        this.thunderSystem = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.thunderSystem = new ThunderStormSystem();
            await this.thunderSystem.init();
            this.isInitialized = true;
            this.setupEventListeners();
            console.log('⛈️ Thunder manager initialized');
        } catch (error) {
            console.error('⛈️ Failed to initialize thunder manager:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const volumeSlider = document.getElementById("thunder-volume");
        const rainVolumeSlider = document.getElementById("thunder-rain-volume");

        if (volumeSlider) {
            volumeSlider.addEventListener("input", () => this.updateVolume());
        }

        if (rainVolumeSlider) {
            rainVolumeSlider.addEventListener("input", () => this.updateRainVolume());
        }
    }

    async toggle() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const thunderToggle = document.querySelector('.ambient-toggle[data-sound="thunder"]');
        if (thunderToggle) {
            if (thunderToggle.classList.contains('active')) {
                // Button is active, start the thunder
                if (!this.thunderSystem.isActive) {
                    console.log('⛈️ Starting thunder...');
                    this.thunderSystem.start();
                }
            } else {
                // Button is not active, stop the thunder
                if (this.thunderSystem.isActive) {
                    console.log('⛈️ Stopping thunder...');
                    this.thunderSystem.stop();
                }
            }
        }

        this.updateStatus();
    }

    updateVolume() {
        if (this.thunderSystem) {
            this.thunderSystem.updateVolume();
        }
    }

    updateRainVolume() {
        if (this.thunderSystem) {
            this.thunderSystem.updateRainVolume();
        }
    }

    updateStatus() {
    }

    isActive() {
        return this.thunderSystem ? this.thunderSystem.isActive : false;
    }

    dispose() {
        if (this.thunderSystem) {
            this.thunderSystem.dispose();
            this.thunderSystem = null;
        }
        this.isInitialized = false;
    }
}