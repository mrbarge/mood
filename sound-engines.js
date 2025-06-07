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
        this.lfos = [];
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
        // Dispose LFOs first
        this.lfos.forEach(lfo => {
            if (lfo && lfo.dispose) {
                try {
                    lfo.dispose();
                } catch (error) {
                    console.debug("Error disposing LFO:", error);
                }
            }
        });
        this.lfos = [];

        // Then dispose other effects and synths
        [...this.synths, ...this.effects].forEach(node => {
            if (node && node.dispose) {
                try {
                    node.dispose();
                } catch (error) {
                    console.debug("Error disposing audio node:", error);
                }
            }
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
            if (effect.wet && (effect.decay !== undefined || effect.roomSize !== undefined)) {
                effect.wet.value = value;
            }
        });
    }
}

// ===============================================
// 1. STANDARD AMBIENT ENGINE
// ===============================================

class StandardSoundEngine extends BaseSoundEngine {
    constructor() {
        super('Standard Ambient');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        // Create four distinct synths
        this.pad1 = SynthFactory.createPad("sine", 'SLOW_ETHEREAL', -8);
        this.pad2 = SynthFactory.createPad("sine", 'SLOW_ETHEREAL', -10);
        this.chimes = SynthFactory.createFMSynth(8, 2, 'FAST_TRANSIENT', -15);
        this.bass = SynthFactory.createMonoSynth("sine", 'LONG_SUSTAIN', -5);

        // Simple routing to global filter
        [this.pad1, this.pad2, this.chimes, this.bass].forEach(synth => {
            synth.connect(this.globalFilter);
            synth.timeout = null;
        });

        this.synths.push(this.pad1, this.pad2, this.chimes, this.bass);
    }

    startGenerativePattern() {
        this.schedulePadNotes(this.pad1);
        setTimeout(() => {
            if (this.isActive) this.schedulePadNotes(this.pad2);
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
                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'pad' };
                    } else {
                        activeNotes[note].count++;
                    }
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

                    if (typeof activeNotes !== 'undefined') {
                        if (!activeNotes[note]) {
                            activeNotes[note] = { count: 1, type: 'chime' };
                        } else {
                            activeNotes[note].count++;
                        }
                    }

                    synth.triggerAttackRelease(note, "16n");

                    setTimeout(() => {
                        if (typeof isPlaying !== 'undefined' && isPlaying &&
                            typeof activeNotes !== 'undefined' && activeNotes[note]) {
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

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'bass' };
                    } else {
                        activeNotes[note].count++;
                    }
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

// ===============================================
// 2. CATHEDRAL ETHEREAL ENGINE
// ===============================================

class CathedralEtherealEngine extends BaseSoundEngine {
    constructor() {
        super('Cathedral Ethereal');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.cathedralPad = SynthFactory.createPad("sine", 'CATHEDRAL');

        const audioChain = new AudioChainBuilder(this.cathedralPad)
            .addCathedralChain()
            .addReverb('CATHEDRAL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.cathedralPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(4);
            this.cathedralPad.triggerAttackRelease(chord, Math.random() * 6 + 12);

            this.scheduleNext(playPattern, 10000, 15000);
        };

        playPattern();
    }
}

// ===============================================
// 3. GLACIAL ETHEREAL ENGINE
// ===============================================

class GlacialEtherealEngine extends BaseSoundEngine {
    constructor() {
        super('Glacial Ethereal');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.glacialPad = SynthFactory.createPad("triangle", 'GLACIAL');

        const audioChain = new AudioChainBuilder(this.glacialPad)
            .addGlacialChain()
            .addReverb('GLACIAL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.glacialPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(2);
            this.glacialPad.triggerAttackRelease(chord, Math.random() * 8 + 18);

            this.scheduleNext(playPattern, 12000, 18000);
        };

        playPattern();
    }
}

// ===============================================
// 4. DARK MATTER ENGINE
// ===============================================

class DarkMatterEngine extends BaseSoundEngine {
    constructor() {
        super('Dark Matter');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.darkDrone = SynthFactory.createMonoSynth("sawtooth", 'CONTINUOUS_DRONE');
        this.harmonicLayer = SynthFactory.createPad("sine", 'LONG_SUSTAIN');

        const droneChain = new AudioChainBuilder(this.darkDrone)
            .addFilter('DEEP_LOWPASS')
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        const harmonicChain = new AudioChainBuilder(this.harmonicLayer)
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.darkDrone, this.harmonicLayer);
        this.effects.push(...droneChain.effects, ...harmonicChain.effects);
        this.lfos = [...(droneChain.lfos || []), ...(harmonicChain.lfos || [])];
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
}

// ===============================================
// 5. AURORA FIELD ENGINE
// ===============================================

class AuroraFieldEngine extends BaseSoundEngine {
    constructor() {
        super('Aurora Field');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.auroraPad = SynthFactory.createPad("triangle", 'LONG_SUSTAIN');

        const audioChain = new AudioChainBuilder(this.auroraPad)
            .addAuroraChain()
            .addReverb('LARGE_HALL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.auroraPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 6. GLASS HORIZON ENGINE
// ===============================================

class GlassHorizonEngine extends BaseSoundEngine {
    constructor() {
        super('Glass Horizon');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.glassPad = SynthFactory.createPad("triangle", 'VERY_SLOW_ETHEREAL');

        const audioChain = new AudioChainBuilder(this.glassPad)
            .addGlassChain()
            .addReverb('LARGE_HALL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.glassPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 7. NEBULA DRIFT ENGINE
// ===============================================

class NebulaDriftEngine extends BaseSoundEngine {
    constructor() {
        super('Nebula Drift');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.nebulaPad = SynthFactory.createPad("sine", 'ULTRA_SLOW_ETHEREAL');

        const audioChain = new AudioChainBuilder(this.nebulaPad)
            .addNebulaChain()
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.nebulaPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 8. THERMAL LAYERS ENGINE
// ===============================================

class ThermalLayersEngine extends BaseSoundEngine {
    constructor() {
        super('Thermal Layers');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.thermalPad = SynthFactory.createPad("sawtooth", 'LONG_SUSTAIN');

        const audioChain = new AudioChainBuilder(this.thermalPad)
            .addThermalChain()
            .addReverb('STANDARD', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.thermalPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 9. DEEP RESONANCE ENGINE
// ===============================================

class DeepResonanceEngine extends BaseSoundEngine {
    constructor() {
        super('Deep Resonance');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.resonantCore = SynthFactory.createMonoSynth("sawtooth", 'CONTINUOUS_DRONE');
        this.harmonicSynth = SynthFactory.createPad("sine", 'LONG_SUSTAIN');

        const coreChain = new AudioChainBuilder(this.resonantCore)
            .addFilter('RESONANT_BANDPASS')
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        const harmonicChain = new AudioChainBuilder(this.harmonicSynth)
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.resonantCore, this.harmonicSynth);
        this.effects.push(...coreChain.effects, ...harmonicChain.effects);
        this.lfos = [...(coreChain.lfos || []), ...(harmonicChain.lfos || [])];
    }

    startGenerativePattern() {
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
        if (this.resonantCore) {
            this.resonantCore.triggerRelease();
        }
        super.stop();
    }
}

// ===============================================
// 10. COSMIC DRIFT ENGINE
// ===============================================

class CosmicDriftEngine extends BaseSoundEngine {
    constructor() {
        super('Cosmic Drift');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.cosmicPad = SynthFactory.createPad("sawtooth", 'SLOW_ETHEREAL');
        this.cosmicPad.set({ oscillator: { detune: 15 } });

        this.subBass = SynthFactory.createMonoSynth("sine", 'CONTINUOUS_DRONE');

        const padChain = new AudioChainBuilder(this.cosmicPad)
            .addCosmicChain()
            .addReverb('DEEP_SPACE', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        const bassChain = new AudioChainBuilder(this.subBass)
            .addReverb('DEEP_SPACE', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.cosmicPad, this.subBass);
        this.effects.push(...padChain.effects, ...bassChain.effects);
        this.lfos = [...(padChain.lfos || []), ...(bassChain.lfos || [])];
    }

    startGenerativePattern() {
        const playCosmicPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.cosmicPad.triggerAttackRelease(chord, Math.random() * 8 + 6);

            if (Math.random() < 0.3) {
                const bassNote = this.currentScale[Math.floor(Math.random() * 3)];
                this.subBass.triggerAttackRelease(bassNote, Math.random() * 12 + 8);
            }

            this.scheduleNext(playCosmicPattern, 4000, 8000);
        };

        playCosmicPattern();
    }
}

// ===============================================
// 11. UNDERWATER PALACE ENGINE
// ===============================================

class UnderwaterPalaceEngine extends BaseSoundEngine {
    constructor() {
        super('Underwater Palace');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.underwaterPad = SynthFactory.createPad("sine", 'LONG_SUSTAIN');

        const audioChain = new AudioChainBuilder(this.underwaterPad)
            .addUnderwaterChain()
            .addReverb('LARGE_HALL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.underwaterPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 12. NEON NOCTURNE ENGINE
// ===============================================

class NeonNocturneEngine extends BaseSoundEngine {
    constructor() {
        super('Neon Nocturne');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.neonSynth = SynthFactory.createPad("sawtooth", 'MEDIUM_SUSTAIN');

        const audioChain = new AudioChainBuilder(this.neonSynth)
            .addNeonChain()
            .addReverb('INTIMATE', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.neonSynth);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 13. ATMOSPHERIC TEMPLE ENGINE
// ===============================================

class AtmosphericTempleEngine extends BaseSoundEngine {
    constructor() {
        super('Atmospheric Temple');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.templePad = SynthFactory.createPad("triangle", 'LONG_SUSTAIN');

        const audioChain = new AudioChainBuilder(this.templePad)
            .addAtmosphericChain()
            .addReverb('LARGE_HALL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.templePad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 14. STONE IN FOCUS ENGINE
// ===============================================

class StoneFocusEngine extends BaseSoundEngine {
    constructor() {
        super('Stone in Focus');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.abstractPad = SynthFactory.createPad("square", 'MEDIUM_SUSTAIN');
        this.abstractPad.set({ oscillator: { detune: 12 } });

        const audioChain = new AudioChainBuilder(this.abstractPad)
            .addDistortion(0.2)
            .addFilterWithLFO('BRIGHT_BANDPASS', 'SLOW_FILTER_SWEEP', 600, 1800)
            .addReverb('STANDARD', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.abstractPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 15. STRING THEORY ENGINE
// ===============================================

class StringTheoryEngine extends BaseSoundEngine {
    constructor() {
        super('String Theory');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.stringEnsemble = SynthFactory.createPad("sawtooth", 'ORCHESTRAL');

        const audioChain = new AudioChainBuilder(this.stringEnsemble)
            .addStringChain()
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.stringEnsemble);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(4);
            this.stringEnsemble.triggerAttackRelease(chord, Math.random() * 15 + 12);

            this.scheduleNext(playPattern, 8000, 10000);
        };

        playPattern();
    }
}

// ===============================================
// 16. HEXAGON SUN ENGINE
// ===============================================

class HexagonSunEngine extends BaseSoundEngine {
    constructor() {
        super('Hexagon Sun');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.geometricPad = SynthFactory.createPad("sine", 'MEDIUM_SUSTAIN');

        const audioChain = new AudioChainBuilder(this.geometricPad)
            .addHexagonChain()
            .addReverb('STANDARD', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.geometricPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(3);
            this.geometricPad.triggerAttackRelease(chord, Math.random() * 6 + 5);

            this.scheduleNext(playPattern, 3000, 5000);
        };

        playPattern();
    }
}

// ===============================================
// 17. PARALLEL DIMENSION ENGINE
// ===============================================

class ParallelDimensionEngine extends BaseSoundEngine {
    constructor() {
        super('Parallel Dimension');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.dimensionalPad = SynthFactory.createPad("triangle", 'LONG_SUSTAIN');
        this.dimensionalPad.set({ oscillator: { detune: 20 } });

        const audioChain = new AudioChainBuilder(this.dimensionalPad)
            .addParallelDimensionChain()
            .addReverb('LARGE_HALL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.dimensionalPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
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
}

// ===============================================
// 18. GENTLE RHUBARB ENGINE
// ===============================================

class GentleRhubarbEngine extends BaseSoundEngine {
    constructor() {
        super('Gentle Rhubarb');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.hybridPad = SynthFactory.createPad("sawtooth", 'SLOW_ETHEREAL');
        this.hybridPad.set({ oscillator: { detune: 8 } });

        const audioChain = new AudioChainBuilder(this.hybridPad)
            .addGentleRhubarbChain()
            .addReverb('LARGE_HALL', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.hybridPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const chord = this.getRandomChord(2);
            this.hybridPad.triggerAttackRelease(chord, Math.random() * 10 + 6);

            this.scheduleNext(playPattern, 5000, 8000);
        };

        playPattern();
    }
}

// ===============================================
// 19. ETHEREAL RHUBARB ENGINE
// ===============================================

class EtherealRhubarbEngine extends BaseSoundEngine {
    constructor() {
        super('Ethereal Rhubarb');
    }

    async initialize(masterVolume, globalReverb, globalDelay, globalFilter) {
        super.initialize(masterVolume, globalReverb, globalDelay, globalFilter);

        this.etherealPad = SynthFactory.createPad("sawtooth", 'VERY_SLOW_ETHEREAL');
        this.etherealPad.set({ oscillator: { detune: 12 } });

        const audioChain = new AudioChainBuilder(this.etherealPad)
            .addEtherealRhubarbChain()
            .addReverb('CAVERNOUS', this.config.reverbAmount)
            .connectTo(this.masterVolume);

        this.synths.push(this.etherealPad);
        this.effects.push(...audioChain.effects);
        this.lfos = audioChain.lfos;
    }

    startGenerativePattern() {
        const playPattern = () => {
            if (!this.isActive) return;

            const noteCount = Math.random() < 0.3 ? 1 : 2;
            const chord = this.getRandomChord(noteCount);
            this.etherealPad.triggerAttackRelease(chord, Math.random() * 12 + 8);

            this.scheduleNext(playPattern, 7000, 12000);
        };

        playPattern();
    }
}

class SoundEngineRegistry {
    constructor() {
        this.engines = new Map();
        this.registerDefaultEngines();
    }

    registerDefaultEngines() {
        this.register('standard', StandardSoundEngine);
        this.register('cathedral-ethereal', CathedralEtherealEngine);
        this.register('glacial-ethereal', GlacialEtherealEngine);
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
        this.randomEngineInterval = null; // For engine randomization
    }

    async setSoundEngine(engineKey, config = {}) {
        console.debug("Setting sound engine to:", engineKey);

        if (this.currentSoundEngine) {
            this.currentSoundEngine.stop();
        }

        this.currentSoundEngine = this.soundEngineRegistry.create(engineKey, config);

        // Initialize with global audio nodes
        await this.currentSoundEngine.initialize(
            typeof masterVolume !== 'undefined' ? masterVolume : null,
            typeof reverb !== 'undefined' ? reverb : null,
            typeof delay !== 'undefined' ? delay : null,
            typeof filter !== 'undefined' ? filter : null
        );

        // Set the current scale
        if (typeof scales !== 'undefined' && this.currentMood && scales[this.currentMood]) {
            this.currentSoundEngine.setScale(scales[this.currentMood]);
        }

        if (this.isPlaying) {
            this.currentSoundEngine.start();
        }

        return this.currentSoundEngine;
    }

    setMood(moodKey) {
        console.debug("Setting mood to:", moodKey);
        this.currentMood = moodKey;

        if (this.currentSoundEngine && typeof scales !== 'undefined' && scales[moodKey]) {
            this.currentSoundEngine.setScale(scales[moodKey]);
        }
    }

    async start() {
        if (!this.currentSoundEngine) {
            throw new Error('No sound engine selected');
        }

        console.debug("Starting music manager");
        this.isPlaying = true;
        this.currentSoundEngine.start();
    }

    stop() {
        console.debug("Stopping music manager");
        this.isPlaying = false;

        if (this.currentSoundEngine) {
            this.currentSoundEngine.stop();
        }

        // Stop all random intervals
        if (this.randomMoodInterval) {
            clearInterval(this.randomMoodInterval);
            this.randomMoodInterval = null;
        }
        if (this.randomEngineInterval) {
            clearInterval(this.randomEngineInterval);
            this.randomEngineInterval = null;
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
        return typeof scales !== 'undefined' ? Object.keys(scales) : [];
    }

    // ===============================================
    // MOOD RANDOMIZATION (EXISTING)
    // ===============================================

    startRandomMoodCycle() {
        console.debug("Starting random mood cycle");

        if (this.randomMoodInterval) {
            clearInterval(this.randomMoodInterval);
        }

        const minutesValue = typeof randomIntervalSlider !== 'undefined' ?
            parseInt(randomIntervalSlider.value) : 10;
        const milliseconds = minutesValue * 60 * 1000;

        this.randomMoodInterval = setInterval(() => {
            if (this.isPlaying && typeof moodSelect !== 'undefined' && moodSelect.value === "random") {
                this.changeToRandomMood();
            } else {
                clearInterval(this.randomMoodInterval);
                this.randomMoodInterval = null;
            }
        }, milliseconds);
    }

    changeToRandomMood() {
        const availableMoods = this.getAvailableMoods();
        if (availableMoods.length === 0) return;

        let newMood;
        do {
            const randomIndex = Math.floor(Math.random() * availableMoods.length);
            newMood = availableMoods[randomIndex];
        } while (newMood === this.currentMood && availableMoods.length > 1);

        console.debug("Random mood change to:", newMood);

        this.setMood(newMood);
        if (typeof currentActiveMood !== 'undefined') {
            currentActiveMood = newMood;
        }
    }

    // ===============================================
    // SOUND ENGINE RANDOMIZATION (NEW)
    // ===============================================

    startRandomEngineCycle() {
        console.debug("Starting random engine cycle");

        if (this.randomEngineInterval) {
            clearInterval(this.randomEngineInterval);
        }

        const minutesValue = typeof randomIntervalSlider !== 'undefined' ?
            parseInt(randomIntervalSlider.value) : 10;
        const milliseconds = minutesValue * 60 * 1000;

        this.randomEngineInterval = setInterval(() => {
            if (this.isPlaying && typeof soundEngineSelect !== 'undefined' && soundEngineSelect.value === "random") {
                this.changeToRandomEngine();
            } else {
                clearInterval(this.randomEngineInterval);
                this.randomEngineInterval = null;
            }
        }, milliseconds);
    }

    async changeToRandomEngine() {
        console.debug("Changing to random engine");

        const availableEngines = this.soundEngineRegistry.getAvailableEngines();
        if (availableEngines.length === 0) return;

        // Get current engine to avoid repeating
        let currentEngine = "";
        if (this.currentSoundEngine) {
            currentEngine = this.getCurrentEngineKey();
        }

        // Pick a different engine
        let newEngine;
        do {
            const randomIndex = Math.floor(Math.random() * availableEngines.length);
            newEngine = availableEngines[randomIndex];
        } while (newEngine === currentEngine && availableEngines.length > 1);

        console.debug(`Random engine change: ${currentEngine} → ${newEngine}`);

        try {
            // Set new engine with current configuration
            await this.setSoundEngine(newEngine, {
                density: typeof densitySlider !== 'undefined' ? parseInt(densitySlider.value) : 5,
                reverbAmount: typeof reverbSlider !== 'undefined' ? parseFloat(reverbSlider.value) : 0.5
            });

            // Update UI to show the current engine (but keep "Random" selected)
            this.updateEngineStatusDisplay(newEngine);

        } catch (error) {
            console.error("Error during random engine change:", error);
        }
    }

    getCurrentEngineKey() {
        if (!this.currentSoundEngine) return "";

        // Find the engine key by matching the class name
        const availableEngines = this.soundEngineRegistry.getAvailableEngines();
        for (const engineKey of availableEngines) {
            const engineInfo = this.soundEngineRegistry.getEngineInfo(engineKey);
            if (engineInfo && this.currentSoundEngine.name === engineInfo.name) {
                return engineKey;
            }
        }
        return "";
    }

    updateEngineStatusDisplay(engineKey) {
        // Update the status display to show current engine while keeping "Random" selected
        const engineInfo = this.soundEngineRegistry.getEngineInfo(engineKey);
        if (engineInfo && typeof updateSoundEngineStatus === 'function') {
            updateSoundEngineStatus(engineInfo.name);
        }
    }

    // ===============================================
    // ENHANCED RANDOM CYCLE MANAGEMENT
    // ===============================================

    startRandomCycles() {
        console.debug("Starting all random cycles");

        // Start mood randomization if mood is set to random
        if (typeof moodSelect !== 'undefined' && moodSelect.value === "random") {
            this.startRandomMoodCycle();
        }

        // Start engine randomization if engine is set to random
        if (typeof soundEngineSelect !== 'undefined' && soundEngineSelect.value === "random") {
            this.startRandomEngineCycle();
        }
    }

    stopRandomCycles() {
        console.debug("Stopping all random cycles");

        if (this.randomMoodInterval) {
            clearInterval(this.randomMoodInterval);
            this.randomMoodInterval = null;
        }
        if (this.randomEngineInterval) {
            clearInterval(this.randomEngineInterval);
            this.randomEngineInterval = null;
        }
    }

    // Check if any randomization is active
    isRandomizationActive() {
        return this.randomMoodInterval !== null || this.randomEngineInterval !== null;
    }

    // Restart random cycles with new interval
    restartRandomCycles() {
        console.debug("Restarting random cycles with new interval");
        this.stopRandomCycles();
        setTimeout(() => {
            this.startRandomCycles();
        }, 100);
    }
}

// Make sure the class is available globally
if (typeof window !== 'undefined') {
    window.AmbientMusicManager = AmbientMusicManager;
}

console.log("✅ AmbientMusicManager class loaded with randomization support");
