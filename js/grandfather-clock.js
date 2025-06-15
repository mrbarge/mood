// ===============================================
// GRANDFATHER CLOCK SYSTEM MODULE - DEBUG VERSION
// grandfather-clock.js
// ===============================================

class GrandfatherClockSystem {
    constructor() {
        this.isActive = false;
        this.tickInterval = null;
        this.currentBeat = 0;
        this.currentTempo = 60; // BPM

        // Audio components
        this.masterGain = null;
        this.reverb = null;
        this.noiseSource = null;
        this.woodOsc = null;
        this.tickOsc = null;
        this.noiseEnv = null;
        this.woodEnv = null;
        this.tickEnv = null;
        this.brightnessFilter = null;
        this.resonantFilter = null;
        this.mechanicalFilter = null;
        this.mixer = null;
    }

    async init() {
        console.log('🕰️ Initializing grandfather clock system...');

        try {
            // Ensure Tone.js is started
            if (Tone.context.state !== 'running') {
                console.log('🕰️ Starting Tone.js context...');
                await Tone.start();
            }

            // Get slider values from DOM elements
            const tempoSlider = document.getElementById("clock-tempo");
            const volumeSlider = document.getElementById("clock-volume");
            const brightnessSlider = document.getElementById("clock-brightness");
            const resonanceSlider = document.getElementById("clock-resonance");
            const reverbSlider = document.getElementById("clock-reverb");
            const decaySlider = document.getElementById("clock-decay");

            this.currentTempo = tempoSlider ? parseInt(tempoSlider.value) : 60;
            const volumeDb = volumeSlider ? parseInt(volumeSlider.value) : -6;

            console.log(`🕰️ Clock settings: Tempo=${this.currentTempo}, Volume=${volumeDb}dB`);

            // Create master gain for the clock system
            this.masterGain = new Tone.Gain(Tone.dbToGain(volumeDb));
            console.log('🕰️ Created master gain:', Tone.dbToGain(volumeDb));

            // Massive reverb for ambient space
            const reverbDecay = decaySlider ? parseInt(decaySlider.value) : 25;
            const reverbWet = reverbSlider ? parseFloat(reverbSlider.value) : 0.8;

            this.reverb = new Tone.Reverb({
                decay: reverbDecay,
                wet: reverbWet,
                preDelay: 0.1
            });
            console.log(`🕰️ Created reverb: decay=${reverbDecay}s, wet=${reverbWet}`);

            // Realistic clock tick synthesis components
            // Component 1: Sharp mechanical click (noise burst)
            this.noiseSource = new Tone.Noise("white");
            const noiseGain = new Tone.Gain(0.8);
            this.noiseEnv = new Tone.AmplitudeEnvelope({
                attack: 0.001,
                decay: 0.02,
                sustain: 0,
                release: 0.01
            });

            // Component 2: Wood resonance (filtered oscillator)
            this.woodOsc = new Tone.Oscillator(150, "triangle");
            const woodGain = new Tone.Gain(0.3);
            this.woodEnv = new Tone.AmplitudeEnvelope({
                attack: 0.001,
                decay: 0.1,
                sustain: 0,
                release: 0.05
            });

            // Component 3: High-frequency tick (sharp transient)
            this.tickOsc = new Tone.Oscillator(2000, "square");
            const tickGain = new Tone.Gain(0.4);
            this.tickEnv = new Tone.AmplitudeEnvelope({
                attack: 0.001,
                decay: 0.01,
                sustain: 0,
                release: 0.01
            });

            console.log('🕰️ Created sound sources');

            // Filters for realistic shaping
            this.brightnessFilter = new Tone.Filter({
                frequency: brightnessSlider ? parseInt(brightnessSlider.value) : 2000,
                type: "lowpass",
                Q: 2
            });

            this.resonantFilter = new Tone.Filter({
                frequency: 300,
                type: "bandpass",
                Q: resonanceSlider ? parseFloat(resonanceSlider.value) : 8
            });

            this.mechanicalFilter = new Tone.Filter({
                frequency: 1200,
                type: "highpass",
                Q: 1
            });

            console.log('🕰️ Created filters');

            // Connect noise component
            this.noiseSource.connect(noiseGain);
            noiseGain.connect(this.noiseEnv);
            this.noiseEnv.connect(this.mechanicalFilter);

            // Connect wood resonance
            this.woodOsc.connect(woodGain);
            woodGain.connect(this.woodEnv);
            this.woodEnv.connect(this.resonantFilter);

            // Connect tick component
            this.tickOsc.connect(tickGain);
            tickGain.connect(this.tickEnv);
            this.tickEnv.connect(this.brightnessFilter);

            // Mix all components
            this.mixer = new Tone.Gain(1);
            this.mechanicalFilter.connect(this.mixer);
            this.resonantFilter.connect(this.mixer);
            this.brightnessFilter.connect(this.mixer);

            console.log('🕰️ Connected signal chain');

            // Final processing chain - try multiple connection strategies
            this.mixer.connect(this.masterGain);
            this.masterGain.connect(this.reverb);

            // Try to connect to global masterVolume if it exists, otherwise connect to destination
            if (typeof masterVolume !== 'undefined' && masterVolume) {
                console.log('🕰️ Connecting to global masterVolume');
                this.reverb.connect(masterVolume);
            } else {
                console.log('🕰️ Connecting directly to destination');
                this.reverb.toDestination();
            }

            // Start oscillators
            this.noiseSource.start();
            this.woodOsc.start();
            this.tickOsc.start();

            console.log('🕰️ Started oscillators - clock system ready!');

        } catch (error) {
            console.error('🕰️ Error initializing clock system:', error);
            throw error;
        }
    }

    start() {
        console.log('🕰️ Starting clock ticking...');
        if (this.isActive) {
            console.log('🕰️ Clock already active');
            return;
        }

        this.isActive = true;
        this.startTicking();
    }

    stop() {
        console.log('🕰️ Stopping clock...');
        if (!this.isActive) return;

        this.isActive = false;

        if (this.tickInterval) {
            clearTimeout(this.tickInterval);
            this.tickInterval = null;
        }
    }

    dispose() {
        console.log('🕰️ Disposing clock system...');
        this.stop();

        // Stop and dispose all audio nodes
        if (this.noiseSource) {
            this.noiseSource.stop();
            this.noiseSource.dispose();
        }
        if (this.woodOsc) {
            this.woodOsc.stop();
            this.woodOsc.dispose();
        }
        if (this.tickOsc) {
            this.tickOsc.stop();
            this.tickOsc.dispose();
        }

        // Dispose other nodes
        [this.noiseEnv, this.woodEnv, this.tickEnv, this.brightnessFilter,
            this.resonantFilter, this.mechanicalFilter, this.mixer,
            this.masterGain, this.reverb].forEach(node => {
            if (node && node.dispose) {
                try {
                    node.dispose();
                } catch (error) {
                    console.debug("Error disposing clock node:", error);
                }
            }
        });
    }

    startTicking() {
        if (!this.isActive) return;

        const tick = () => {
            if (!this.isActive) return;

            console.log('🕰️ TICK'); // Debug: log each tick

            // Trigger the tick sound
            this.triggerTick();

            // Update beat counter for UI feedback
            this.currentBeat++;

            // Calculate interval from tempo
            const interval = (60 / this.currentTempo) * 1000;

            // Schedule next tick
            if (this.isActive) {
                this.tickInterval = setTimeout(tick, interval);
            }
        };

        // Start first tick after a short delay
        setTimeout(tick, 100);
    }

    triggerTick() {
        try {
            console.log('🕰️ Triggering tick sound...'); // Debug

            // Trigger all envelope components
            this.noiseEnv.triggerAttackRelease("8n");
            this.woodEnv.triggerAttackRelease("4n");
            this.tickEnv.triggerAttackRelease("32n");

            // Track for visualization
            if (typeof activeNotes !== 'undefined') {
                const tickNote = 'CLOCK_TICK';
                if (!activeNotes[tickNote]) {
                    activeNotes[tickNote] = { count: 1, type: 'clock' };
                } else {
                    activeNotes[tickNote].count++;
                }

                // Clean up after short time
                setTimeout(() => {
                    if (typeof activeNotes !== 'undefined' && activeNotes[tickNote]) {
                        activeNotes[tickNote].count--;
                        if (activeNotes[tickNote].count <= 0) {
                            delete activeNotes[tickNote];
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.error("🕰️ Clock tick error:", error);
        }
    }

    // Update methods for real-time control
    updateTempo(bpm) {
        console.log(`🕰️ Updating tempo to ${bpm} BPM`);
        this.currentTempo = Math.max(30, Math.min(120, bpm));
        // Restart ticking with new tempo if active
        if (this.isActive) {
            this.stop();
            this.start();
        }
    }

    updateVolume() {
        const volumeSlider = document.getElementById("clock-volume");
        if (this.masterGain && volumeSlider) {
            const dbValue = parseInt(volumeSlider.value);
            const gainValue = Tone.dbToGain(dbValue);
            console.log(`🕰️ Updating volume to ${dbValue}dB (gain: ${gainValue})`);
            this.masterGain.gain.rampTo(gainValue, 0.1);
        }
    }

    updateBrightness() {
        const brightnessSlider = document.getElementById("clock-brightness");
        if (this.brightnessFilter && brightnessSlider) {
            const freq = parseInt(brightnessSlider.value);
            console.log(`🕰️ Updating brightness to ${freq}Hz`);
            this.brightnessFilter.frequency.rampTo(freq, 0.5);
        }
    }

    updateResonance() {
        const resonanceSlider = document.getElementById("clock-resonance");
        if (this.resonantFilter && resonanceSlider) {
            const q = parseFloat(resonanceSlider.value);
            console.log(`🕰️ Updating resonance to Q=${q}`);
            this.resonantFilter.Q.rampTo(q, 0.5);
        }
    }

    updateReverb() {
        const reverbSlider = document.getElementById("clock-reverb");
        if (this.reverb && reverbSlider) {
            const wet = parseFloat(reverbSlider.value);
            console.log(`🕰️ Updating reverb to ${wet}`);
            this.reverb.wet.rampTo(wet, 0.5);
        }
    }

    getCurrentTempo() {
        return this.currentTempo;
    }

    getCurrentBeat() {
        return this.currentBeat;
    }

    getTickInfo() {
        if (!this.isActive) return 'Stopped';
        return `Ticking at ${this.currentTempo} BPM`;
    }
}

// ===============================================
// GRANDFATHER CLOCK MANAGER - DEBUG VERSION
// ===============================================

class GrandfatherClockManager {
    constructor() {
        this.clockSystem = null;
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🕰️ Initializing clock manager...');
        if (this.isInitialized) {
            console.log('🕰️ Clock manager already initialized');
            return;
        }

        try {
            this.clockSystem = new GrandfatherClockSystem();
            await this.clockSystem.init();
            this.isInitialized = true;
            console.log('🕰️ Clock manager initialized successfully');

            this.setupEventListeners();
        } catch (error) {
            console.error('🕰️ Failed to initialize clock manager:', error);
            throw error;
        }
    }

    setupEventListeners() {
        console.log('🕰️ Setting up event listeners...');

        // Get UI elements
        const clockToggle = document.getElementById("clock-toggle");
        const tempoSlider = document.getElementById("clock-tempo");
        const volumeSlider = document.getElementById("clock-volume");
        const brightnessSlider = document.getElementById("clock-brightness");
        const resonanceSlider = document.getElementById("clock-resonance");
        const reverbSlider = document.getElementById("clock-reverb");
        const decaySlider = document.getElementById("clock-decay");

        // Set up event listeners
        if (clockToggle) {
            clockToggle.addEventListener("change", () => this.toggle());
            console.log('🕰️ Added toggle listener');
        } else {
            console.warn('🕰️ Clock toggle element not found');
        }

        if (tempoSlider) {
            tempoSlider.addEventListener("input", () => {
                const bpm = parseInt(tempoSlider.value);
                console.log(`🕰️ Tempo slider changed to ${bpm}`);
                if (this.clockSystem) {
                    this.clockSystem.updateTempo(bpm);
                }
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener("input", () => this.updateVolume());
        }

        if (brightnessSlider) {
            brightnessSlider.addEventListener("input", () => this.updateBrightness());
        }

        if (resonanceSlider) {
            resonanceSlider.addEventListener("input", () => this.updateResonance());
        }

        if (reverbSlider) {
            reverbSlider.addEventListener("input", () => this.updateReverb());
        }

        if (decaySlider) {
            decaySlider.addEventListener("input", () => this.updateDecaySettings());
        }
    }

    async toggle() {
        console.log('🕰️ Toggle called...');

        try {
            if (!this.isInitialized) {
                console.log('🕰️ Initializing on first toggle...');
                await this.initialize();
            }

            const clockToggle = document.getElementById("clock-toggle");

            if (clockToggle && clockToggle.checked) {
                console.log('🕰️ Starting clock...');
                this.clockSystem.start();
            } else {
                console.log('🕰️ Stopping clock...');
                if (this.clockSystem) {
                    this.clockSystem.stop();
                }
            }

            this.updateStatus();
        } catch (error) {
            console.error('🕰️ Error in toggle:', error);
        }
    }

    updateVolume() {
        if (this.clockSystem) {
            this.clockSystem.updateVolume();
        }
    }

    updateBrightness() {
        if (this.clockSystem) {
            this.clockSystem.updateBrightness();
        }
    }

    updateResonance() {
        if (this.clockSystem) {
            this.clockSystem.updateResonance();
        }
    }

    updateReverb() {
        if (this.clockSystem) {
            this.clockSystem.updateReverb();
        }
    }

    updateDecaySettings() {
        console.log("🕰️ Clock decay settings updated - will apply on next start");
    }

    updateStatus() {
        const clockToggle = document.getElementById("clock-toggle");
        const status = document.getElementById("clock-status");

        if (status) {
            const isOn = clockToggle && clockToggle.checked;
            status.textContent = isOn ? 'On' : 'Off';
            console.log(`🕰️ Status updated: ${status.textContent}`);
        }
    }

    // Public API methods
    isActive() {
        return this.clockSystem ? this.clockSystem.isActive : false;
    }

    getCurrentTempo() {
        return this.clockSystem ? this.clockSystem.getCurrentTempo() : 60;
    }

    getTickInfo() {
        return this.clockSystem ? this.clockSystem.getTickInfo() : 'Not initialized';
    }

    // Clean shutdown
    dispose() {
        if (this.clockSystem) {
            this.clockSystem.dispose();
            this.clockSystem = null;
        }
        this.isInitialized = false;
    }
}

// ===============================================
// QUICK TEST FUNCTION - REMOVE AFTER DEBUGGING
// ===============================================

// Add this to test the clock independently
window.testClock = async function() {
    console.log('🕰️ Running clock test...');

    try {
        await Tone.start();
        const testClock = new GrandfatherClockSystem();
        await testClock.init();
        testClock.start();

        console.log('🕰️ Test clock started - you should hear ticking');

        // Stop after 10 seconds
        setTimeout(() => {
            testClock.stop();
            testClock.dispose();
            console.log('🕰️ Test clock stopped');
        }, 10000);

    } catch (error) {
        console.error('🕰️ Test failed:', error);
    }
};

console.log('🕰️ Debug version loaded. Run testClock() in console to test independently.');