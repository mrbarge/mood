// Base Sound Engine class
class BaseSoundEngine {
    constructor(name, config = {}) {
        this.name = name;
        this.config = {
            density: 5,
            reverbAmount: 0.5,
            ...config
        };
        this.synths = [];
        this.effects = [];
        this.isActive = false;
        this.scheduledCallbacks = [];
        this.currentScale = [];
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        this.masterVolume = masterVolume;
        this.globalReverb = globalReverb;
        this.globalDelay = globalDelay;
        this.globalFilter = globalFilter;
    }

    setScale(scale) {
        this.currentScale = scale;
        if (this.isActive) {
            this.onScaleChange(scale);
        }
    }

    onScaleChange(newScale) {
        // Default: do nothing, subclasses can override
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.startGenerativePattern();
    }

    stop() {
        this.isActive = false;
        this.scheduledCallbacks.forEach(callback => clearTimeout(callback));
        this.scheduledCallbacks = [];

        this.synths.forEach(synth => {
            if (synth.timeout) {
                clearTimeout(synth.timeout);
                synth.timeout = null;
            }
            if (synth.releaseAll) synth.releaseAll();
            if (synth.triggerRelease) synth.triggerRelease();
        });

        setTimeout(() => {
            this.dispose();
        }, 1000);
    }

    dispose() {
        [...this.synths, ...this.effects].forEach(node => {
            if (node && node.dispose) node.dispose();
        });
        this.synths = [];
        this.effects = [];
    }

    startGenerativePattern() {
        throw new Error('startGenerativePattern() must be implemented by subclass');
    }

    getRandomNote() {
        if (this.currentScale.length === 0) return "C4";
        return this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
    }

    getRandomChord(size = 3) {
        const chord = [];
        for (let i = 0; i < size; i++) {
            chord.push(this.getRandomNote());
        }
        return chord;
    }

    scheduleNext(callback, minTime, maxTime) {
        if (!this.isActive) return;

        const delay = Math.random() * (maxTime - minTime) + minTime;
        const timeoutId = setTimeout(() => {
            if (this.isActive) {
                callback();
                this.scheduledCallbacks = this.scheduledCallbacks.filter(id => id !== timeoutId);
            }
        }, delay);

        this.scheduledCallbacks.push(timeoutId);
        return timeoutId;
    }

    updateDensity(value) {
        this.config.density = value;
    }

    updateReverb(value) {
        this.config.reverbAmount = value;
        this.effects.forEach(effect => {
            if (effect.wet) effect.wet.value = value;
        });
    }
}

// Cosmic Drift Sound Engine
class CosmicDriftEngine extends BaseSoundEngine {
    constructor() {
        super('Cosmic Drift');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Main cosmic pad with heavy detuning
        this.cosmicPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth",
                detune: 15 // Heavy detuning for cosmic character
            },
            envelope: {
                attack: 8,
                decay: 2,
                sustain: 0.7,
                release: 12
            }
        });

        // Chorus for width and cosmic movement
        this.cosmicChorus = new Tone.Chorus(0.2, 4, 0.8).start();

        // Deep space reverb
        this.spaceReverb = new Tone.Reverb({
            decay: 15,
            wet: this.config.reverbAmount,
            roomSize: 0.9
        });

        // Sub bass drone for depth
        this.subBass = new Tone.MonoSynth({
            oscillator: { type: "sine" },
            envelope: { attack: 5, decay: 0, sustain: 1, release: 8 }
        });

        // Connect audio chain
        this.cosmicPad.connect(this.cosmicChorus);
        this.cosmicChorus.connect(this.spaceReverb);
        this.spaceReverb.connect(this.masterVolume);

        this.subBass.connect(this.spaceReverb);

        this.synths.push(this.cosmicPad, this.subBass);
        this.effects.push(this.cosmicChorus, this.spaceReverb);
    }

    startGenerativePattern() {
        const playCosmicPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.cosmicPad.triggerAttackRelease(chord, Math.random() * 8 + 6);

            // Occasional sub bass
            if (Math.random() < 0.3) {
                const bassNote = this.currentScale[Math.floor(Math.random() * 3)]; // Lower notes
                this.subBass.triggerAttackRelease(bassNote, Math.random() * 12 + 8);
            }

            this.scheduleNext(playCosmicPattern, 4000, 8000);
        };

        playCosmicPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.spaceReverb) {
            this.spaceReverb.wet.value = value;
        }
    }
}

// Underwater Palace Sound Engine
class UnderwaterPalaceEngine extends BaseSoundEngine {
    constructor() {
        super('Underwater Palace');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Heavily filtered pad for underwater feel
        this.underwaterPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 6, decay: 2, sustain: 0.8, release: 8 }
        });

        // Heavy low-pass filter for underwater effect
        this.depthFilter = new Tone.Filter({
            frequency: 400,
            type: "lowpass",
            Q: 8
        });

        // Liquid LFO for swimming modulation
        this.liquidLFO = new Tone.LFO({
            frequency: 0.15,
            min: 200,
            max: 600,
            type: "sine"
        }).start();

        // Aquatic reverb
        this.aquaticReverb = new Tone.Reverb({
            decay: 12,
            wet: this.config.reverbAmount,
            roomSize: 0.85
        });

        // Connect audio chain
        this.underwaterPad.connect(this.depthFilter);
        this.depthFilter.connect(this.aquaticReverb);
        this.aquaticReverb.connect(this.masterVolume);

        this.liquidLFO.connect(this.depthFilter.frequency);

        this.synths.push(this.underwaterPad);
        this.effects.push(this.depthFilter, this.liquidLFO, this.aquaticReverb);
    }

    startGenerativePattern() {
        const playUnderwaterPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.underwaterPad.triggerAttackRelease(chord, Math.random() * 10 + 6);

            this.scheduleNext(playUnderwaterPattern, 4000, 7000);
        };

        playUnderwaterPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.aquaticReverb) {
            this.aquaticReverb.wet.value = value;
        }
    }
}

// Neon Nocturne Sound Engine
class NeonNocturneEngine extends BaseSoundEngine {
    constructor() {
        super('Neon Nocturne');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Vintage-style synth with synthwave character
        this.neonSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 2, decay: 1, sustain: 0.5, release: 4 }
        });

        // Vintage chorus for width
        this.vintageChorus = new Tone.Chorus(0.5, 2.5, 0.5).start();

        // Tape-style saturation using distortion
        this.tapeSaturation = new Tone.Distortion(0.4);

        // 80s-style reverb
        this.retroReverb = new Tone.Reverb({
            decay: 6,
            wet: this.config.reverbAmount,
            roomSize: 0.7
        });

        // Connect audio chain
        this.neonSynth.connect(this.tapeSaturation);
        this.tapeSaturation.connect(this.vintageChorus);
        this.vintageChorus.connect(this.retroReverb);
        this.retroReverb.connect(this.masterVolume);

        this.synths.push(this.neonSynth);
        this.effects.push(this.vintageChorus, this.tapeSaturation, this.retroReverb);
    }

    startGenerativePattern() {
        const playNeonPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.neonSynth.triggerAttackRelease(chord, Math.random() * 4 + 3);

            this.scheduleNext(playNeonPattern, 3000, 5000);
        };

        playNeonPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.retroReverb) {
            this.retroReverb.wet.value = value;
        }
    }
}

// Atmospheric Temple Sound Engine (Wind Temple without the wind)
class AtmosphericTempleEngine extends BaseSoundEngine {
    constructor() {
        super('Atmospheric Temple');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Airy, atmospheric pad without wind noise
        this.templePad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 4, decay: 2, sustain: 0.7, release: 6 }
        });

        // Atmospheric filter with gentle movement
        this.atmosphereFilter = new Tone.Filter({
            frequency: 1500,
            type: "lowpass",
            Q: 2
        });

        // Movement LFO for gentle flow
        this.movementLFO = new Tone.LFO({
            frequency: 0.08,
            min: 1000,
            max: 2000,
            type: "triangle"
        }).start();

        // Spatial reverb for temple acoustics
        this.spatialReverb = new Tone.Reverb({
            decay: 12,
            wet: this.config.reverbAmount,
            roomSize: 0.85
        });

        // Connect audio chain
        this.templePad.connect(this.atmosphereFilter);
        this.atmosphereFilter.connect(this.spatialReverb);
        this.spatialReverb.connect(this.masterVolume);

        this.movementLFO.connect(this.atmosphereFilter.frequency);

        this.synths.push(this.templePad);
        this.effects.push(this.atmosphereFilter, this.movementLFO, this.spatialReverb);
    }

    startGenerativePattern() {
        const playTemplePattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(2);
            this.templePad.triggerAttackRelease(chord, Math.random() * 8 + 4);

            this.scheduleNext(playTemplePattern, 3000, 6000);
        };

        playTemplePattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.spatialReverb) {
            this.spatialReverb.wet.value = value;
        }
    }
}

// Standard Sound Engine
class StandardSoundEngine extends BaseSoundEngine {
    constructor() {
        super('Standard Ambient');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.pad1 = this.createPad();
        this.pad2 = this.createPad();
        this.chimes = this.createChimes();
        this.bass = this.createBass();

        this.pad1.volume.value = -8;
        this.pad2.volume.value = -10;
        this.chimes.volume.value = -15;
        this.bass.volume.value = -5;

        this.synths.push(this.pad1, this.pad2, this.chimes, this.bass);
    }

    createPad() {
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 3, decay: 2, sustain: 0.8, release: 8 }
        }).connect(this.globalFilter);
        synth.timeout = null;
        return synth;
    }

    createChimes() {
        const synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 8,
            modulationIndex: 2,
            oscillator: { type: "sine" },
            envelope: { attack: 0.1, decay: 2, sustain: 0.1, release: 2 },
            modulation: { type: "square" },
            modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.2, release: 2 }
        }).connect(this.globalFilter);
        synth.timeout = null;
        return synth;
    }

    createBass() {
        const synth = new Tone.MonoSynth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.9, release: 5 },
            filterEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 5, baseFrequency: 200, octaves: 2.5 }
        }).connect(this.globalFilter);
        synth.timeout = null;
        return synth;
    }

    startGenerativePattern() {
        this.schedulePadNotes(this.pad1);

        setTimeout(() => {
            if (this.isActive) {
                this.schedulePadNotes(this.pad2);
            }
        }, 5000);

        this.scheduleChimes(this.chimes);
        this.scheduleBassNotes(this.bass);
    }

    schedulePadNotes(synth) {
        const playNote = () => {
            if (!this.isActive) return;

            if (synth.timeout) {
                clearTimeout(synth.timeout);
                synth.timeout = null;
            }

            const numNotes = Math.floor(Math.random() * 3) + 1;
            const notes = [];
            for (let i = 0; i < numNotes; i++) {
                const note = this.getRandomNote();
                notes.push(note);

                // Track for visualization
                if (!activeNotes[note]) {
                    activeNotes[note] = { count: 1, type: 'pad' };
                } else {
                    activeNotes[note].count++;
                }
            }

            if (notes.length > 0) {
                synth.triggerAttackRelease(notes, Math.random() * 10 + 8);
            }

            const baseTime = 11 - this.config.density;
            const randomFactor = Math.random() * 3;
            const nextNoteTime = (baseTime + randomFactor) * 1000;

            if (this.isActive) {
                synth.timeout = setTimeout(playNote, nextNoteTime);
            }
        };
        playNote();
    }

    scheduleChimes(synth) {
        const playChime = () => {
            if (!this.isActive) return;

            if (synth.timeout) {
                clearTimeout(synth.timeout);
                synth.timeout = null;
            }

            if (Math.random() > 0.25) {
                const highNotes = this.currentScale.filter(note => {
                    const octave = parseInt(note.slice(-1));
                    return octave >= 4;
                });

                if (highNotes.length > 0) {
                    const note = highNotes[Math.floor(Math.random() * highNotes.length)];

                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'chime' };
                    } else {
                        activeNotes[note].count++;
                    }

                    synth.triggerAttackRelease(note, "16n");

                    setTimeout(() => {
                        if (isPlaying && activeNotes[note]) {
                            activeNotes[note].count--;
                            if (activeNotes[note].count <= 0) {
                                delete activeNotes[note];
                            }
                        }
                    }, 2000);
                }
            }

            const baseTime = (11 - this.config.density) * 1.5;
            const randomFactor = Math.random() * 4;
            const nextChimeTime = (baseTime + randomFactor) * 1000;

            if (this.isActive) {
                synth.timeout = setTimeout(playChime, nextChimeTime);
            }
        };

        if (this.isActive) {
            synth.timeout = setTimeout(playChime, 8000);
        }
    }

    scheduleBassNotes(synth) {
        const playBass = () => {
            if (!this.isActive) return;

            if (synth.timeout) {
                clearTimeout(synth.timeout);
                synth.timeout = null;
            }

            const bassNotes = this.currentScale.filter(note => {
                const octave = parseInt(note.slice(-1));
                return octave <= 3;
            });

            if (bassNotes.length > 0) {
                const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];

                if (!activeNotes[note]) {
                    activeNotes[note] = { count: 1, type: 'bass' };
                } else {
                    activeNotes[note].count++;
                }

                synth.triggerAttackRelease(note, Math.random() * 6 + 4);
            }

            const nextBassTime = (Math.random() * 10 + 10) * 1000;

            if (this.isActive) {
                synth.timeout = setTimeout(playBass, nextBassTime);
            }
        };

        if (this.isActive) {
            synth.timeout = setTimeout(playBass, 2000);
        }
    }
}

// Glass Horizon Sound Engine
class GlassHorizonEngine extends BaseSoundEngine {
    constructor() {
        super('Glass Horizon');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Glassy, shimmering pad
        this.glassPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 8, decay: 4, sustain: 0.8, release: 12 }
        });

        // Shimmer effect using chorus and modulation
        this.shimmerChorus = new Tone.Chorus(0.3, 3, 0.7).start();

        // Glass-like filter (high-pass for brightness)
        this.glassFilter = new Tone.Filter({
            frequency: 2500,
            type: "highpass",
            Q: 4
        });

        // Horizon reverb
        this.horizonReverb = new Tone.Reverb({
            decay: 18,
            wet: this.config.reverbAmount,
            roomSize: 0.9
        });

        // Connect audio chain
        this.glassPad.connect(this.glassFilter);
        this.glassFilter.connect(this.shimmerChorus);
        this.shimmerChorus.connect(this.horizonReverb);
        this.horizonReverb.connect(this.masterVolume);

        this.synths.push(this.glassPad);
        this.effects.push(this.shimmerChorus, this.glassFilter, this.horizonReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.glassPad.triggerAttackRelease(chord, Math.random() * 10 + 8);

            this.scheduleNext(playPattern, 5000, 8000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.horizonReverb) {
            this.horizonReverb.wet.value = value;
        }
    }
}

// Nebula Drift Sound Engine
class NebulaDriftEngine extends BaseSoundEngine {
    constructor() {
        super('Nebula Drift');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Soft, cloudy pad
        this.nebulaPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 10, decay: 3, sustain: 0.9, release: 15 }
        });

        // Gentle swell modulation
        this.swellLFO = new Tone.LFO({
            frequency: 0.05,
            min: 0.3,
            max: 1,
            type: "triangle"
        }).start();

        // Nebula gain for swell effect
        this.nebulaGain = new Tone.Gain(0.6);

        // Stellar reverb
        this.stellarReverb = new Tone.Reverb({
            decay: 20,
            wet: this.config.reverbAmount,
            roomSize: 0.95
        });

        // Connect audio chain
        this.nebulaPad.connect(this.nebulaGain);
        this.nebulaGain.connect(this.stellarReverb);
        this.stellarReverb.connect(this.masterVolume);

        this.swellLFO.connect(this.nebulaGain.gain);

        this.synths.push(this.nebulaPad);
        this.effects.push(this.nebulaGain, this.swellLFO, this.stellarReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(4);
            this.nebulaPad.triggerAttackRelease(chord, Math.random() * 14 + 10);

            this.scheduleNext(playPattern, 6000, 9000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.stellarReverb) {
            this.stellarReverb.wet.value = value;
        }
    }
}

// Thermal Layers Sound Engine
class ThermalLayersEngine extends BaseSoundEngine {
    constructor() {
        super('Thermal Layers');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Warm, layered pad
        this.thermalPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 6, decay: 2, sustain: 0.8, release: 8 }
        });

        // Layer modulation for thermal effect
        this.layerLFO = new Tone.LFO({
            frequency: 0.12,
            min: 0.4,
            max: 1.2,
            type: "sine"
        }).start();

        // Warm filter
        this.warmFilter = new Tone.Filter({
            frequency: 1200,
            type: "lowpass",
            Q: 3
        });

        // Thermal gain
        this.thermalGain = new Tone.Gain(0.7);

        // Depth reverb
        this.depthReverb = new Tone.Reverb({
            decay: 12,
            wet: this.config.reverbAmount,
            roomSize: 0.8
        });

        // Connect audio chain
        this.thermalPad.connect(this.warmFilter);
        this.warmFilter.connect(this.thermalGain);
        this.thermalGain.connect(this.depthReverb);
        this.depthReverb.connect(this.masterVolume);

        this.layerLFO.connect(this.thermalGain.gain);

        this.synths.push(this.thermalPad);
        this.effects.push(this.layerLFO, this.warmFilter, this.thermalGain, this.depthReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.thermalPad.triggerAttackRelease(chord, Math.random() * 8 + 6);

            this.scheduleNext(playPattern, 4000, 7000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.depthReverb) {
            this.depthReverb.wet.value = value;
        }
    }
}

// Deep Resonance Sound Engine
class DeepResonanceEngine extends BaseSoundEngine {
    constructor() {
        super('Deep Resonance');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Resonant core drone
        this.resonantCore = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 8, decay: 0, sustain: 1, release: 12 }
        });

        // Harmonic overtones
        this.harmonicSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 6, decay: 4, sustain: 0.6, release: 10 }
        });

        // Deep resonant filter
        this.resonantFilter = new Tone.Filter({
            frequency: 400,
            type: "bandpass",
            Q: 12
        });

        // Sonic cavern reverb
        this.cavernReverb = new Tone.Reverb({
            decay: 22,
            wet: this.config.reverbAmount,
            roomSize: 0.95
        });

        // Connect audio chain
        this.resonantCore.connect(this.resonantFilter);
        this.resonantFilter.connect(this.cavernReverb);
        this.harmonicSynth.connect(this.cavernReverb);
        this.cavernReverb.connect(this.masterVolume);

        this.synths.push(this.resonantCore, this.harmonicSynth);
        this.effects.push(this.resonantFilter, this.cavernReverb);
    }

    startGenerativePattern() {
        // Start resonant core
        if (this.currentScale.length > 0) {
            const baseNote = this.currentScale[0];
            this.resonantCore.triggerAttack(baseNote);
        }

        const playResonancePattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.harmonicSynth.triggerAttackRelease(chord, Math.random() * 12 + 8);

            this.scheduleNext(playResonancePattern, 5000, 8000);
        };

        playResonancePattern();
    }

    onScaleChange(newScale) {
        // Restart the resonant core on the new base note
        if (this.resonantCore && this.isActive && newScale.length > 0) {
            this.resonantCore.triggerRelease();
            setTimeout(() => {
                if (this.isActive) {
                    this.resonantCore.triggerAttack(newScale[0]);
                }
            }, 500);
        }
    }

    stop() {
        // Release the continuous drone before stopping
        if (this.resonantCore) {
            this.resonantCore.triggerRelease();
        }
        super.stop();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.cavernReverb) {
            this.cavernReverb.wet.value = value;
        }
    }
}

// Ethereal Void Sound Engine
class EtherealVoidEngine extends BaseSoundEngine {
    constructor() {
        super('Ethereal Void');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.etherealPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 6, decay: 3, sustain: 0.9, release: 10 }
        });

        this.atmosphericFilter = new Tone.Filter({
            frequency: 1200,
            type: "lowpass",
            Q: 2
        });

        this.floatingLFO = new Tone.LFO({
            frequency: 0.08,
            min: 800,
            max: 1600,
            type: "sine"
        }).start();

        this.etherealReverb = new Tone.Reverb({
            decay: 15,
            wet: this.config.reverbAmount,
            roomSize: 0.95
        });

        this.etherealPad.connect(this.atmosphericFilter);
        this.atmosphericFilter.connect(this.etherealReverb);
        this.etherealReverb.connect(this.masterVolume);
        this.floatingLFO.connect(this.atmosphericFilter.frequency);

        this.synths.push(this.etherealPad);
        this.effects.push(this.atmosphericFilter, this.floatingLFO, this.etherealReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(2);
            this.etherealPad.triggerAttackRelease(chord, Math.random() * 12 + 8);

            this.scheduleNext(playPattern, 6000, 10000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.etherealReverb) {
            this.etherealReverb.wet.value = value;
        }
    }
}

// Dark Matter Sound Engine
class DarkMatterEngine extends BaseSoundEngine {
    constructor() {
        super('Dark Matter');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.darkDrone = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 10, decay: 0, sustain: 1, release: 15 }
        });

        this.harmonicLayer = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 8, decay: 4, sustain: 0.3, release: 12 }
        });

        this.deepFilter = new Tone.Filter({
            frequency: 300,
            type: "lowpass",
            Q: 6
        });

        this.gravityReverb = new Tone.Reverb({
            decay: 25,
            wet: this.config.reverbAmount,
            roomSize: 0.98
        });

        this.darkDrone.connect(this.deepFilter);
        this.deepFilter.connect(this.gravityReverb);
        this.harmonicLayer.connect(this.gravityReverb);
        this.gravityReverb.connect(this.masterVolume);

        this.synths.push(this.darkDrone, this.harmonicLayer);
        this.effects.push(this.deepFilter, this.gravityReverb);
    }

    startGenerativePattern() {
        if (this.currentScale.length > 0) {
            const baseNote = this.currentScale[0];
            this.darkDrone.triggerAttack(baseNote);
        }

        const playHarmonics = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(2);
            this.harmonicLayer.triggerAttackRelease(chord, Math.random() * 15 + 10);

            this.scheduleNext(playHarmonics, 8000, 12000);
        };

        playHarmonics();
    }

    onScaleChange(newScale) {
        if (this.darkDrone && this.isActive && newScale.length > 0) {
            this.darkDrone.triggerRelease();
            setTimeout(() => {
                if (this.isActive) {
                    this.darkDrone.triggerAttack(newScale[0]);
                }
            }, 500);
        }
    }

    stop() {
        if (this.darkDrone) {
            this.darkDrone.triggerRelease();
        }
        super.stop();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.gravityReverb) {
            this.gravityReverb.wet.value = value;
        }
    }
}

// Aurora Field Sound Engine
class AuroraFieldEngine extends BaseSoundEngine {
    constructor() {
        super('Aurora Field');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.auroraPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 5, decay: 3, sustain: 0.7, release: 8 }
        });

        this.colorLFO1 = new Tone.LFO({
            frequency: 0.15,
            min: 800,
            max: 2000,
            type: "sine"
        }).start();

        this.colorLFO2 = new Tone.LFO({
            frequency: 0.08,
            min: 0.5,
            max: 1.5,
            type: "triangle"
        }).start();

        this.magneticFilter = new Tone.Filter({
            frequency: 1500,
            type: "bandpass",
            Q: 5
        });

        this.auroraGain = new Tone.Gain(0.8);

        this.polarReverb = new Tone.Reverb({
            decay: 16,
            wet: this.config.reverbAmount,
            roomSize: 0.9
        });

        this.auroraPad.connect(this.magneticFilter);
        this.magneticFilter.connect(this.auroraGain);
        this.auroraGain.connect(this.polarReverb);
        this.polarReverb.connect(this.masterVolume);

        this.colorLFO1.connect(this.magneticFilter.frequency);
        this.colorLFO2.connect(this.auroraGain.gain);

        this.synths.push(this.auroraPad);
        this.effects.push(this.colorLFO1, this.colorLFO2, this.magneticFilter, this.auroraGain, this.polarReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.auroraPad.triggerAttackRelease(chord, Math.random() * 9 + 6);

            this.scheduleNext(playPattern, 4000, 6000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.polarReverb) {
            this.polarReverb.wet.value = value;
        }
    }
}

class StoneFocusEngine extends BaseSoundEngine {
    constructor() {
        super('Stone in Focus');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Abstract pad with unconventional processing
        this.abstractPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "square",
                detune: 12 // Slight detuning for character
            },
            envelope: {
                attack: 4,
                decay: 2,
                sustain: 0.6,
                release: 8
            }
        });

        // Mysterious bandpass filter with high Q
        this.mysteriousFilter = new Tone.Filter({
            frequency: 1200,
            type: "bandpass",
            Q: 8
        });

        // Unconventional LFO for filter modulation
        this.unconventionalLFO = new Tone.LFO({
            frequency: 0.37, // Prime number for non-repetitive cycles
            min: 600,
            max: 1800,
            type: "triangle"
        }).start();

        // Beautiful distortion - adds warmth while maintaining clarity
        this.beautifulDistortion = new Tone.Distortion(0.2);

        // Abstract reverb
        this.abstractReverb = new Tone.Reverb({
            decay: 12,
            wet: this.config.reverbAmount,
            roomSize: 0.8
        });

        // Connect audio chain
        this.abstractPad.connect(this.beautifulDistortion);
        this.beautifulDistortion.connect(this.mysteriousFilter);
        this.mysteriousFilter.connect(this.abstractReverb);
        this.abstractReverb.connect(this.masterVolume);

        this.unconventionalLFO.connect(this.mysteriousFilter.frequency);

        this.synths.push(this.abstractPad);
        this.effects.push(this.mysteriousFilter, this.unconventionalLFO, this.beautifulDistortion, this.abstractReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.abstractPad.triggerAttackRelease(chord, Math.random() * 6 + 4);

            this.scheduleNext(playPattern, 3000, 5000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.abstractReverb) {
            this.abstractReverb.wet.value = value;
        }
    }
}

class StringTheoryEngine extends BaseSoundEngine {
    constructor() {
        super('String Theory');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Orchestral string ensemble simulation
        this.stringEnsemble = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth" // Rich harmonics like strings
            },
            envelope: {
                attack: 10,  // Very slow attack like bowed strings
                decay: 4,
                sustain: 0.8,
                release: 15  // Long release for sustained notes
            }
        });

        // Orchestral filter - removes harshness, keeps warmth
        this.orchestralFilter = new Tone.Filter({
            frequency: 2000,
            type: "lowpass",
            Q: 3
        });

        // Emotional chorus for ensemble width
        this.emotionalChorus = new Tone.Chorus(0.1, 2, 0.6).start();

        // Cinematic reverb - large hall sound
        this.cinematicReverb = new Tone.Reverb({
            decay: 20,
            wet: this.config.reverbAmount,
            roomSize: 0.95
        });

        // Connect audio chain
        this.stringEnsemble.connect(this.orchestralFilter);
        this.orchestralFilter.connect(this.emotionalChorus);
        this.emotionalChorus.connect(this.cinematicReverb);
        this.cinematicReverb.connect(this.masterVolume);

        this.synths.push(this.stringEnsemble);
        this.effects.push(this.orchestralFilter, this.emotionalChorus, this.cinematicReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            // Use 4-note chords for rich orchestral harmony
            const chord = this.getRandomChord(4);
            this.stringEnsemble.triggerAttackRelease(chord, Math.random() * 15 + 12);

            // Longer intervals between notes for slow evolution
            this.scheduleNext(playPattern, 8000, 10000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.cinematicReverb) {
            this.cinematicReverb.wet.value = value;
        }
    }
}

class HexagonSunEngine extends BaseSoundEngine {
    constructor() {
        super('Hexagon Sun');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Geometric precision with analog warmth
        this.geometricPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sine" // Pure waveform for mathematical precision
            },
            envelope: {
                attack: 5,
                decay: 2,
                sustain: 0.7,
                release: 8
            }
        });

        // Precision bandpass filter for resonant peaks
        this.precisionFilter = new Tone.Filter({
            frequency: 1800,
            type: "bandpass",
            Q: 6
        });

        // Golden ratio modulation (1.618) for mathematical beauty
        this.goldenRatio = new Tone.LFO({
            frequency: 0.618, // Golden ratio as frequency
            min: 1200,
            max: 2400,
            type: "sine"
        }).start();

        // Sacred geometry reverb
        this.sacredReverb = new Tone.Reverb({
            decay: 10,
            wet: this.config.reverbAmount,
            roomSize: 0.8
        });

        // Connect audio chain
        this.geometricPad.connect(this.precisionFilter);
        this.precisionFilter.connect(this.sacredReverb);
        this.sacredReverb.connect(this.masterVolume);

        this.goldenRatio.connect(this.precisionFilter.frequency);

        this.synths.push(this.geometricPad);
        this.effects.push(this.precisionFilter, this.goldenRatio, this.sacredReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.geometricPad.triggerAttackRelease(chord, Math.random() * 6 + 5);

            // Regular intervals for geometric precision
            this.scheduleNext(playPattern, 3000, 5000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.sacredReverb) {
            this.sacredReverb.wet.value = value;
        }
    }
}

class ParallelDimensionEngine extends BaseSoundEngine {
    constructor() {
        super('Parallel Dimension');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Interdimensional pad with heavy detuning
        this.dimensionalPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle",
                detune: 20 // Heavy detuning for otherworldly character
            },
            envelope: {
                attack: 6,
                decay: 4,
                sustain: 0.8,
                release: 11
            }
        });

        // Dual phase shifters for multi-dimensional effect
        this.phaseShifter1 = new Tone.Phaser({
            frequency: 0.15,
            depth: 0.8,
            baseFrequency: 400
        });

        this.phaseShifter2 = new Tone.Phaser({
            frequency: 0.08, // Different rate for complex interaction
            depth: 0.6,
            baseFrequency: 800
        });

        // Quantum filter for interdimensional filtering
        this.quantumFilter = new Tone.Filter({
            frequency: 1500,
            type: "bandpass",
            Q: 6
        });

        // Multi-dimensional reverb
        this.multiReverb = new Tone.Reverb({
            decay: 16,
            wet: this.config.reverbAmount,
            roomSize: 0.92
        });

        // Connect audio chain
        this.dimensionalPad.connect(this.phaseShifter1);
        this.phaseShifter1.connect(this.phaseShifter2);
        this.phaseShifter2.connect(this.quantumFilter);
        this.quantumFilter.connect(this.multiReverb);
        this.multiReverb.connect(this.masterVolume);

        this.synths.push(this.dimensionalPad);
        this.effects.push(this.phaseShifter1, this.phaseShifter2, this.quantumFilter, this.multiReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.dimensionalPad.triggerAttackRelease(chord, Math.random() * 9 + 7);

            this.scheduleNext(playPattern, 5000, 7000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.multiReverb) {
            this.multiReverb.wet.value = value;
        }
    }
}

class GentleRhubarbEngine extends BaseSoundEngine {
    constructor() {
        super('Gentle Rhubarb');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Gentle hybrid pad with reduced detuning
        this.hybridPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth",
                detune: 8 // Reduced from 15 for gentleness
            },
            envelope: {
                attack: 6,  // Slower attack for smoothness
                decay: 3,
                sustain: 0.7,
                release: 12 // Longer release for flowing character
            }
        });

        // Warm low-pass filter instead of harsh high-pass
        this.gentleFilter = new Tone.Filter({
            frequency: 1200, // Low-pass at 1200Hz
            type: "lowpass",
            Q: 2 // Lower Q for gentle filtering
        });

        // Slower, more organic LFO
        this.organicLFO = new Tone.LFO({
            frequency: 0.15, // Slower modulation
            min: 800,
            max: 1600,
            type: "triangle" // Smoother than square wave
        }).start();

        // Reduced frequency shifting for subtlety
        this.subtleShifter = new Tone.FrequencyShifter({
            frequency: 3, // Much gentler shift
            wet: 0.15    // Less pronounced effect
        });

        // Warm saturation for analog character
        this.warmSaturation = new Tone.Distortion(0.05); // Very subtle

        // Soft high-frequency roll-off
        this.softFilter = new Tone.Filter({
            frequency: 3000,
            type: "lowpass",
            Q: 0.8 // Very gentle slope
        });

        // Smoothing chorus
        this.smoothChorus = new Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.5, // Increased depth for smoothing
            wet: 0.4
        }).start();

        // Warm, enveloping reverb
        this.gentleReverb = new Tone.Reverb({
            decay: 18, // Longer decay
            wet: this.config.reverbAmount,
            roomSize: 0.9
        });

        // Connect gentle audio chain
        this.hybridPad.connect(this.subtleShifter);
        this.subtleShifter.connect(this.gentleFilter);
        this.gentleFilter.connect(this.warmSaturation);
        this.warmSaturation.connect(this.softFilter);
        this.softFilter.connect(this.smoothChorus);
        this.smoothChorus.connect(this.gentleReverb);
        this.gentleReverb.connect(this.masterVolume);

        this.organicLFO.connect(this.gentleFilter.frequency);

        this.synths.push(this.hybridPad);
        this.effects.push(this.gentleFilter, this.organicLFO, this.subtleShifter,
            this.warmSaturation, this.softFilter, this.smoothChorus, this.gentleReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(2);
            this.hybridPad.triggerAttackRelease(chord, Math.random() * 10 + 6); // Longer notes

            // Slightly longer intervals for gentle pacing
            this.scheduleNext(playPattern, 5000, 8000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.gentleReverb) {
            this.gentleReverb.wet.value = value;
        }
    }
}

class EtherealRhubarbEngine extends BaseSoundEngine {
    constructor() {
        super('Ethereal Rhubarb');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Ethereal pad with moderate detuning
        this.etherealPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth",
                detune: 12 // Moderate detuning for character
            },
            envelope: {
                attack: 8,  // Very slow attack for ethereal emergence
                decay: 4,
                sustain: 0.8, // Higher sustain for floating quality
                release: 15 // Very long release for ethereal trails
            }
        });

        // Ethereal bandpass filter for focused resonance
        this.etherealFilter = new Tone.Filter({
            frequency: 1500,
            type: "bandpass",
            Q: 3 // Moderate Q for smooth resonance
        });

        // Very slow LFO for gentle movement
        this.floatingLFO = new Tone.LFO({
            frequency: 0.1, // Very slow modulation
            min: 1200,
            max: 1800,
            type: "sine" // Smoothest modulation
        }).start();

        // Minimal frequency shifting
        this.whisperShifter = new Tone.FrequencyShifter({
            frequency: 2, // Very subtle
            wet: 0.1    // Barely noticeable
        });

        // No saturation for pure ethereal quality

        // Ethereal high-frequency softening
        this.cloudFilter = new Tone.Filter({
            frequency: 4500, // Higher cutoff, gentler slope
            type: "lowpass",
            Q: 0.6 // Very gentle
        });

        // Wide, atmospheric chorus
        this.atmosphericChorus = new Tone.Chorus({
            frequency: 0.8, // Slower chorus rate
            delayTime: 5,   // Longer delay time
            depth: 0.6,     // Deep modulation for width
            wet: 0.5
        }).start();

        // Massive ethereal reverb
        this.celestialReverb = new Tone.Reverb({
            decay: 22, // Very long decay
            wet: this.config.reverbAmount,
            roomSize: 0.95 // Huge space
        });

        // Connect ethereal audio chain
        this.etherealPad.connect(this.whisperShifter);
        this.whisperShifter.connect(this.etherealFilter);
        this.etherealFilter.connect(this.cloudFilter);
        this.cloudFilter.connect(this.atmosphericChorus);
        this.atmosphericChorus.connect(this.celestialReverb);
        this.celestialReverb.connect(this.masterVolume);

        this.floatingLFO.connect(this.etherealFilter.frequency);

        this.synths.push(this.etherealPad);
        this.effects.push(this.etherealFilter, this.floatingLFO, this.whisperShifter,
            this.cloudFilter, this.atmosphericChorus, this.celestialReverb);
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            // Often single notes for ethereal simplicity
            const noteCount = Math.random() < 0.3 ? 1 : 2;
            const chord = this.getRandomChord(noteCount);
            this.etherealPad.triggerAttackRelease(chord, Math.random() * 12 + 8); // Long, floating notes

            // Longer intervals for spacious, ethereal timing
            this.scheduleNext(playPattern, 7000, 12000);
        };

        playPattern();
    }

    updateReverb(value) {
        super.updateReverb(value);
        if (this.celestialReverb) {
            this.celestialReverb.wet.value = value;
        }
    }
}

class SoundEngineRegistry {
    constructor() {
        this.engines = new Map();
        this.registerDefaultEngines();
    }

    registerDefaultEngines() {
        this.register('standard', StandardSoundEngine);
        this.register('ethereal-void', EtherealVoidEngine);
        this.register('dark-matter', DarkMatterEngine);
        this.register('aurora-field', AuroraFieldEngine);
        this.register('glass-horizon', GlassHorizonEngine);
        this.register('nebula-drift', NebulaDriftEngine);
        this.register('thermal-layers', ThermalLayersEngine);
        this.register('deep-resonance', DeepResonanceEngine);
        this.register('cosmic-drift', CosmicDriftEngine);
        this.register('underwater-palace', UnderwaterPalaceEngine);
        this.register('neon-nocturne', NeonNocturneEngine);
        this.register('atmospheric-temple', AtmosphericTempleEngine);
        this.register('stone-focus', StoneFocusEngine);
        this.register('string-theory', StringTheoryEngine);
        this.register('hexagon-sun', HexagonSunEngine);
        this.register('parallel-dimension', ParallelDimensionEngine);
        this.register('gentle-rhubarb', GentleRhubarbEngine);
        this.register('ethereal-rhubarb', EtherealRhubarbEngine);
    }

    register(key, EngineClass) {
        this.engines.set(key, EngineClass);
    }

    create(key, config = {}) {
        const EngineClass = this.engines.get(key);
        if (!EngineClass) {
            throw new Error(`Sound engine '${key}' not found in registry`);
        }
        return new EngineClass(config);
    }

    getAvailableEngines() {
        return Array.from(this.engines.keys());
    }

    getEngineInfo(key) {
        const EngineClass = this.engines.get(key);
        if (!EngineClass) return null;

        const temp = new EngineClass();
        return {
            key,
            name: temp.name
        };
    }
}

class AmbientMusicManager {
    constructor() {
        this.soundEngineRegistry = new SoundEngineRegistry();
        this.currentSoundEngine = null;
        this.currentMood = 'calm';
        this.isPlaying = false;
        this.randomMoodInterval = null;
    }

    async setSoundEngine(engineKey, config = {}) {
        if (this.currentSoundEngine) {
            this.currentSoundEngine.stop();
        }

        this.currentSoundEngine = this.soundEngineRegistry.create(engineKey, config);
        await this.currentSoundEngine.initialize(masterVolume, reverb, delay, filter);
        this.currentSoundEngine.setScale(scales[this.currentMood]);

        if (this.isPlaying) {
            this.currentSoundEngine.start();
        }

        return this.currentSoundEngine;
    }

    setMood(moodKey) {
        this.currentMood = moodKey;

        if (this.currentSoundEngine) {
            this.currentSoundEngine.setScale(scales[moodKey]);
        }
    }

    async start() {
        if (!this.currentSoundEngine) {
            throw new Error('No sound engine selected');
        }

        this.isPlaying = true;
        this.currentSoundEngine.start();
    }

    stop() {
        this.isPlaying = false;
        if (this.currentSoundEngine) {
            this.currentSoundEngine.stop();
        }
        if (this.randomMoodInterval) {
            clearInterval(this.randomMoodInterval);
            this.randomMoodInterval = null;
        }
    }

    updateConfig(config) {
        if (!this.currentSoundEngine) return;

        if (config.density !== undefined) {
            this.currentSoundEngine.updateDensity(config.density);
        }
        if (config.reverbAmount !== undefined) {
            this.currentSoundEngine.updateReverb(config.reverbAmount);
        }
    }

    getAvailableSoundEngines() {
        return this.soundEngineRegistry.getAvailableEngines().map(key =>
            this.soundEngineRegistry.getEngineInfo(key)
        );
    }

    getAvailableMoods() {
        return Object.keys(scales);
    }

    startRandomMoodCycle() {
        if (this.randomMoodInterval) {
            clearInterval(this.randomMoodInterval);
        }

        const minutesValue = parseInt(randomIntervalSlider.value);
        const milliseconds = minutesValue * 60 * 1000;

        this.randomMoodInterval = setInterval(() => {
            if (this.isPlaying && moodSelect.value === "random") {
                this.changeToRandomMood();
            } else {
                clearInterval(this.randomMoodInterval);
                this.randomMoodInterval = null;
            }
        }, milliseconds);
    }

    changeToRandomMood() {
        const availableMoods = this.getAvailableMoods();
        const randomIndex = Math.floor(Math.random() * availableMoods.length);
        const newMood = availableMoods[randomIndex];

        this.setMood(newMood);
        currentActiveMood = newMood;
        console.debug("Random mood change to:", newMood);
    }
}

