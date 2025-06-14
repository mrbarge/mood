// Base Melody Instrument class
class BaseMelodyInstrument {
    constructor(name, config = {}) {
        this.name = name;
        this.config = {
            volume: -5,
            reverbAmount: 0.5,
            ...config
        };
        this.synth = null;
        this.effects = [];
        this.isActive = false;
        this.timeout = null;
        this.instrumentType = name.toLowerCase().replace(/\s+/g, '-');
    }

    async initialize(masterVolume, globalReverb) {
        this.masterVolume = masterVolume;
        this.globalReverb = globalReverb;
    }

    start(scale, melodicPattern) {
        if (this.isActive) return;
        this.isActive = true;
        this.currentScale = scale;
        this.currentPattern = melodicPattern;
        this.startMelodicPhrases();
    }

    stop() {
        this.isActive = false;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        if (this.synth) {
            try {
                if (this.synth.releaseAll) {
                    this.synth.releaseAll();
                } else if (this.synth.triggerRelease) {
                    this.synth.triggerRelease();
                }
            } catch (error) {
                console.debug("Error releasing synth:", error);
            }
        }
    }

    dispose() {
        this.stop();
        setTimeout(() => {
            if (this.synth) {
                try {
                    this.synth.dispose();
                } catch (error) {
                    console.debug("Error disposing synth:", error);
                }
            }
            this.effects.forEach(effect => {
                if (effect && effect.dispose) {
                    try {
                        effect.dispose();
                    } catch (error) {
                        console.debug("Error disposing effect:", error);
                    }
                }
            });
            this.synth = null;
            this.effects = [];
        }, 500);
    }

    startMelodicPhrases() {
        const playMelody = () => {
            if (!this.isActive) return;

            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            const phraseLength = Math.floor(Math.random() * 5) + 3;
            const startNote = this.currentPattern[Math.floor(Math.random() * this.currentPattern.length)];
            const startIndex = this.currentScale.indexOf(startNote);

            if (startIndex !== -1) {
                const melody = [];
                let currentIndex = startIndex;
                melody.push(this.currentScale[currentIndex]);

                for (let i = 1; i < phraseLength; i++) {
                    const step = Math.floor(Math.random() * 5) - 2;
                    currentIndex = Math.min(Math.max(0, currentIndex + step), this.currentScale.length - 1);
                    melody.push(this.currentScale[currentIndex]);
                }

                this.playMelodicSequence(melody);
            }

            // Get frequency slider value (global reference)
            const frequency = typeof melodicFrequencySlider !== 'undefined' ?
                parseInt(melodicFrequencySlider.value) : 5;
            const baseTime = (11 - frequency) * 6;
            const randomFactor = Math.random() * 10;
            const nextPhraseTime = (baseTime + randomFactor) * 1000;

            if (this.isActive) {
                this.timeout = setTimeout(playMelody, nextPhraseTime);
            }
        };

        if (this.isActive) {
            this.timeout = setTimeout(playMelody, Math.random() * 5000 + 10000);
        }
    }

    playMelodicSequence(melody) {
        throw new Error('playMelodicSequence() must be implemented by subclass');
    }

    updateReverbAmount(amount) {
        this.config.reverbAmount = amount;
        if (this.reverbNode) {
            this.reverbNode.wet.value = amount;
        }
    }

    setVolume(volume) {
        if (this.synth && this.synth.volume) {
            this.synth.volume.value = volume;
        }
    }
}

// ===============================================
// PIANO INSTRUMENT
// ===============================================

class PianoInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Piano');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
        });

        // Simple reverb connection
        const pingPongDelay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.3,
            wet: 0.25
        });

        this.reverbNode = new Tone.Reverb({
            decay: 10,
            wet: this.config.reverbAmount,
            preDelay: 0.03
        });

        this.synth.connect(pingPongDelay);
        pingPongDelay.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(pingPongDelay, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 1.5;
        const noteSpacing = 0.8;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.2 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                // Track active notes for visualization
                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'melodic' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Note playback error:", error.message);
                }

                // Clean up note tracking
                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }
}

// ===============================================
// Glitch ELECTRONIC INSTRUMENT
// ===============================================

// ===============================================
// GLITCH ELECTRONIC INSTRUMENT
// ===============================================

class GlitchElectronicInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Glitch Electronic');
        this.glitchVariants = [
            'stutterChop', 'granularCrush', 'ringModChaos', 'filterGlitch',
            'timeStretch', 'pitchShift', 'spectralFold', 'digitalArtifact'
        ];
        this.currentVariant = null;
        this.variantTimeout = null;
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        // Create multiple synths for different glitch textures
        this.synths = {
            fm: new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 2.1,
                modulationIndex: 8,
                oscillator: { type: "sawtooth" },
                envelope: { attack: 0.001, decay: 0.3, sustain: 0.4, release: 2 },
                modulation: { type: "square" },
                modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.5 },
                volume: -5
            }),
            metal: new Tone.PolySynth(Tone.MetalSynth, {
                harmonicity: 12,
                resonance: 800,
                modulationIndex: 25,
                envelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 1.2 },
                volume: -15
            }),
            am: new Tone.PolySynth(Tone.AMSynth, {
                harmonicity: 3.5,
                oscillator: { type: "square" },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1 },
                modulation: { type: "sawtooth" },
                modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.8 },
                volume: -8
            })
        };

        // Create multiple effect chains for variety
        this.effectChains = this.createGlitchEffectChains(masterVolume);

        // Start with a random variant
        this.selectRandomVariant();

        // Schedule periodic variant changes
        this.scheduleVariantChanges();
    }

    createGlitchEffectChains(masterVolume) {
        const chains = {};

        // Stutter Chop Chain - Rhythmic chopping
        chains.stutterChop = {
            bitCrusher: new Tone.BitCrusher({ bits: 4, wet: 0.6 }),
            chopDelay: new Tone.PingPongDelay({ delayTime: "32n", feedback: 0.8, wet: 0.7 }),
            gate: new Tone.Gate({ threshold: -20, attack: 0.001, release: 0.01 }),
            tremolo: new Tone.Tremolo({ frequency: 16, depth: 0.8, wet: 0.5 }).start(),
            compressor: new Tone.Compressor({ threshold: -12, ratio: 8 })
        };

        // Granular Crush Chain - Texture destruction
        chains.granularCrush = {
            bitCrusher: new Tone.BitCrusher({ bits: 3, wet: 0.8 }),
            distortion: new Tone.Distortion({ distortion: 0.8, wet: 0.6 }),
            autoFilter: new Tone.AutoFilter({ frequency: 8, baseFrequency: 200, octaves: 4, wet: 0.7 }).start(),
            freqShift: new Tone.FrequencyShifter({ frequency: 120, wet: 0.4 }),
            limiter: new Tone.Limiter(-3)
        };

        // Ring Mod Chaos Chain - Metallic harmonics
        chains.ringModChaos = {
            ringMod1: new Tone.FrequencyShifter({ frequency: 89, wet: 0.6 }),
            ringMod2: new Tone.FrequencyShifter({ frequency: 157, wet: 0.4 }),
            phaser: new Tone.Phaser({ frequency: 2.3, depth: 0.9, baseFrequency: 350, wet: 0.8 }),
            delay: new Tone.FeedbackDelay({ delayTime: "16n.", feedback: 0.7, wet: 0.5 }),
            filter: new Tone.Filter({ frequency: 1500, type: "bandpass", Q: 12 })
        };

        // Filter Glitch Chain - Sweeping artifacts
        chains.filterGlitch = {
            filter1: new Tone.Filter({ frequency: 800, type: "lowpass", Q: 15 }),
            filter2: new Tone.Filter({ frequency: 2000, type: "highpass", Q: 8 }),
            lfo1: new Tone.LFO({ frequency: 7.3, min: 300, max: 3000, type: "square" }),
            lfo2: new Tone.LFO({ frequency: 0.37, min: 500, max: 5000, type: "sawtooth" }),
            chorus: new Tone.Chorus({ frequency: 3.2, delayTime: 1.5, depth: 0.7, wet: 0.6 }).start(),
            gain: new Tone.Gain(0.8)
        };

        // Time Stretch Chain - Pitch/time manipulation
        chains.timeStretch = {
            pitchShift1: new Tone.PitchShift({ pitch: 7, wet: 0.3 }),
            pitchShift2: new Tone.PitchShift({ pitch: -12, wet: 0.2 }),
            delay: new Tone.PingPongDelay({ delayTime: "8n.", feedback: 0.6, wet: 0.4 }),
            vibrato: new Tone.Vibrato({ frequency: 6.4, depth: 0.4, wet: 0.5 }),
            reverb: new Tone.Reverb({ decay: 4, wet: 0.3 })
        };

        // Pitch Shift Chain - Harmonic chaos
        chains.pitchShift = {
            shift1: new Tone.PitchShift({ pitch: 19, wet: 0.4 }),
            shift2: new Tone.PitchShift({ pitch: -7, wet: 0.3 }),
            shift3: new Tone.PitchShift({ pitch: 24, wet: 0.2 }),
            chebyshev: new Tone.Chebyshev({ order: 50, wet: 0.3 }),
            autoWah: new Tone.AutoWah({ baseFrequency: 100, octaves: 6, sensitivity: -10, wet: 0.6 })
        };

        // Spectral Fold Chain - Frequency folding
        chains.spectralFold = {
            chebyshev1: new Tone.Chebyshev({ order: 30, wet: 0.5 }),
            chebyshev2: new Tone.Chebyshev({ order: 80, wet: 0.3 }),
            filter: new Tone.Filter({ frequency: 1200, type: "bandpass", Q: 20 }),
            lfo: new Tone.LFO({ frequency: 0.23, min: 400, max: 4000, type: "triangle" }),
            feedback: new Tone.FeedbackDelay({ delayTime: "32n", feedback: 0.9, wet: 0.3 })
        };

        // Digital Artifact Chain - Lo-fi digital errors
        chains.digitalArtifact = {
            bitCrusher: new Tone.BitCrusher({ bits: 6, wet: 0.5 }),
            jcreverb: new Tone.JCReverb({ roomSize: 0.2, wet: 0.4 }),
            autoFilter: new Tone.AutoFilter({ frequency: 12, baseFrequency: 800, octaves: 3, wet: 0.6 }).start(),
            tremolo: new Tone.Tremolo({ frequency: 23, depth: 0.6, wet: 0.4 }).start(),
            compressor: new Tone.Compressor({ threshold: -18, ratio: 6 })
        };

        // Connect LFOs and start them
        if (chains.filterGlitch.lfo1) {
            chains.filterGlitch.lfo1.connect(chains.filterGlitch.filter1.frequency);
            chains.filterGlitch.lfo1.start();
        }
        if (chains.filterGlitch.lfo2) {
            chains.filterGlitch.lfo2.connect(chains.filterGlitch.filter2.frequency);
            chains.filterGlitch.lfo2.start();
        }
        if (chains.spectralFold.lfo) {
            chains.spectralFold.lfo.connect(chains.spectralFold.filter.frequency);
            chains.spectralFold.lfo.start();
        }

        // Add reverb node
        this.reverbNode = new Tone.Reverb({
            decay: 6,
            wet: this.config.reverbAmount * 0.7,
            preDelay: 0.02,
            roomSize: 0.6
        });

        // Connect chains to reverb and master volume
        Object.values(chains).forEach(chain => {
            const effects = Object.values(chain);
            const lastEffect = effects[effects.length - 1];
            lastEffect.connect(this.reverbNode);
        });
        this.reverbNode.connect(masterVolume);

        // Store all effects for cleanup
        Object.values(chains).forEach(chain => {
            this.effects.push(...Object.values(chain));
        });
        this.effects.push(this.reverbNode);

        return chains;
    }

    selectRandomVariant() {
        const oldVariant = this.currentVariant;
        do {
            this.currentVariant = this.glitchVariants[Math.floor(Math.random() * this.glitchVariants.length)];
        } while (this.currentVariant === oldVariant && this.glitchVariants.length > 1);

        console.debug(`Glitch variant changed to: ${this.currentVariant}`);
        this.connectCurrentVariant();
    }

    connectCurrentVariant() {
        // Disconnect all synths first
        Object.values(this.synths).forEach(synth => {
            try { synth.disconnect(); } catch (e) {}
        });

        // Select synth based on variant
        let selectedSynth;
        switch (this.currentVariant) {
            case 'stutterChop':
            case 'granularCrush':
            case 'digitalArtifact':
                selectedSynth = this.synths.fm;
                break;
            case 'ringModChaos':
            case 'spectralFold':
                selectedSynth = this.synths.metal;
                break;
            default:
                selectedSynth = this.synths.am;
        }

        this.synth = selectedSynth; // Set current synth reference

        // Connect to the appropriate effect chain
        const chain = this.effectChains[this.currentVariant];
        if (chain) {
            this.connectEffectChain(selectedSynth, chain);
        }
    }

    connectEffectChain(synth, chain) {
        // Handle special cases for different chain types
        switch (this.currentVariant) {
            case 'filterGlitch':
                this.connectFilterGlitchChain(synth, chain);
                break;
            case 'spectralFold':
                this.connectSpectralFoldChain(synth, chain);
                break;
            default:
                this.connectStandardChain(synth, chain);
        }
    }

    connectStandardChain(synth, chain) {
        const effects = Object.values(chain).filter(effect =>
            effect && typeof effect.connect === 'function'
        );

        if (effects.length === 0) return;

        // Connect synth to first effect
        synth.connect(effects[0]);

        // Chain effects together
        for (let i = 0; i < effects.length - 1; i++) {
            try {
                effects[i].connect(effects[i + 1]);
            } catch (e) {
                console.debug("Effect connection error:", e);
            }
        }
    }

    connectFilterGlitchChain(synth, chain) {
        // Special handling for filter glitch with LFOs
        const { filter1, filter2, lfo1, lfo2, chorus, gain } = chain;

        // Connect audio path: synth -> filter1 -> filter2 -> chorus -> gain
        synth.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(chorus);
        chorus.connect(gain);

        // LFOs are already connected in createGlitchEffectChains
    }

    connectSpectralFoldChain(synth, chain) {
        // Special handling for spectral fold with LFO
        const { chebyshev1, chebyshev2, filter, lfo, feedback } = chain;

        // Connect audio path: synth -> chebyshev1 -> chebyshev2 -> filter -> feedback
        synth.connect(chebyshev1);
        chebyshev1.connect(chebyshev2);
        chebyshev2.connect(filter);
        filter.connect(feedback);

        // LFO is already connected in createGlitchEffectChains
    }

    scheduleVariantChanges() {
        if (this.variantTimeout) {
            clearTimeout(this.variantTimeout);
        }

        // Change variant every 15-45 seconds
        const changeInterval = (15 + Math.random() * 30) * 1000;

        this.variantTimeout = setTimeout(() => {
            if (this.isActive) {
                this.selectRandomVariant();
                this.scheduleVariantChanges();
            }
        }, changeInterval);
    }

    playMelodicSequence(melody) {
        const baseNoteDuration = 0.6;
        const baseNoteSpacing = 0.7;

        // Apply variant-specific modifications to melody
        const modifiedMelody = this.applyVariantModifications(melody);

        modifiedMelody.forEach((noteData, index) => {
            let timing = index * baseNoteSpacing * 1000;

            // Add variant-specific timing chaos
            const timingChaos = this.getVariantTimingChaos();
            timing += (Math.random() - 0.5) * timingChaos * 1000;
            timing = Math.max(0, timing);

            setTimeout(() => {
                if (!this.isActive) return;

                const { note, duration, velocity } = noteData;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'glitch' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    // Some variants might trigger multiple notes or effects
                    this.triggerVariantNote(note, duration, velocity);
                } catch (error) {
                    console.debug("Glitch note playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, duration * 1000 + 500);
            }, timing);
        });
    }

    applyVariantModifications(melody) {
        return melody.map(note => {
            let modifiedNote = note;
            let duration = 0.6;
            let velocity = 1;

            switch (this.currentVariant) {
                case 'stutterChop':
                    // Randomly repeat notes
                    duration = Math.random() < 0.4 ? 0.2 : 0.8;
                    break;

                case 'granularCrush':
                    // Random octave jumps and micro-durations
                    if (Math.random() < 0.3) {
                        const noteBase = note.slice(0, -1);
                        const octave = parseInt(note.slice(-1));
                        const newOctave = Math.max(1, Math.min(7, octave + (Math.random() < 0.5 ? -2 : 2)));
                        modifiedNote = noteBase + newOctave;
                    }
                    duration = 0.3 + Math.random() * 0.6;
                    break;

                case 'ringModChaos':
                    // Slight detuning effect through note choice
                    duration = 1.2 + Math.random() * 0.8;
                    break;

                case 'timeStretch':
                    // Longer, stretched notes
                    duration = 1.5 + Math.random() * 1.5;
                    break;

                case 'pitchShift':
                    // Harmonically shifted notes
                    if (Math.random() < 0.5) {
                        const noteBase = note.slice(0, -1);
                        const octave = parseInt(note.slice(-1));
                        const shift = Math.random() < 0.5 ? 1 : -1;
                        const newOctave = Math.max(1, Math.min(7, octave + shift));
                        modifiedNote = noteBase + newOctave;
                    }
                    duration = 0.8 + Math.random() * 0.8;
                    break;

                case 'spectralFold':
                    // Emphasis on harmonic content
                    duration = 1.0 + Math.random() * 1.0;
                    velocity = 0.7 + Math.random() * 0.6;
                    break;

                case 'digitalArtifact':
                    // Short, clipped notes
                    duration = 0.4 + Math.random() * 0.4;
                    break;

                default:
                    duration = 0.6 + Math.random() * 0.6;
            }

            return { note: modifiedNote, duration, velocity };
        });
    }

    getVariantTimingChaos() {
        switch (this.currentVariant) {
            case 'stutterChop': return 0.8;
            case 'granularCrush': return 1.2;
            case 'digitalArtifact': return 0.6;
            default: return 0.4;
        }
    }

    triggerVariantNote(note, duration, velocity) {
        switch (this.currentVariant) {
            case 'stutterChop':
                // Sometimes trigger rapid-fire stutters
                if (Math.random() < 0.3) {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            if (this.isActive) {
                                this.synth.triggerAttackRelease(note, 0.1, undefined, velocity);
                            }
                        }, i * 100);
                    }
                } else {
                    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
                }
                break;

            case 'granularCrush':
                // Trigger with micro-delays for granular effect
                const grains = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < grains; i++) {
                    setTimeout(() => {
                        if (this.isActive) {
                            this.synth.triggerAttackRelease(note, duration / grains, undefined, velocity * (0.5 + Math.random() * 0.5));
                        }
                    }, i * (duration * 1000 / grains / 2));
                }
                break;

            default:
                this.synth.triggerAttackRelease(note, duration, undefined, velocity);
        }
    }

    stop() {
        super.stop();
        if (this.variantTimeout) {
            clearTimeout(this.variantTimeout);
            this.variantTimeout = null;
        }
    }

    dispose() {
        if (this.variantTimeout) {
            clearTimeout(this.variantTimeout);
            this.variantTimeout = null;
        }

        // Dispose all synths
        Object.values(this.synths).forEach(synth => {
            if (synth && synth.dispose) {
                try {
                    synth.dispose();
                } catch (error) {
                    console.debug("Error disposing glitch synth:", error);
                }
            }
        });

        super.dispose();
    }
}

// ===============================================
// SAMPLED PIANO INSTRUMENT
// ===============================================

class SampledPianoInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Sampled Piano');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.Sampler({
            urls: {
                "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", "A4": "A4.mp3",
                "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", "A5": "A5.mp3",
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            volume: 0
        });

        // Sampled piano effect chain
        const pianoChorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3.5, depth: 0.3, wet: 0.4 }).start();
        const pianoStereoDelay = new Tone.PingPongDelay({ delayTime: "16n", feedback: 0.1, wet: 0.3 });
        const pianoAmbientDelay = new Tone.FeedbackDelay({ delayTime: "4n.", feedback: 0.3, wet: 0.25 });
        const pianoFilter = new Tone.Filter({ frequency: 4000, type: "lowpass", rolloff: -12 });
        const pianoCompressor = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.003, release: 0.1 });

        this.reverbNode = new Tone.Reverb({
            decay: 12,
            wet: this.config.reverbAmount,
            preDelay: 0.05,
            roomSize: 0.9
        });

        const pianoTremolo = new Tone.Tremolo({ frequency: 0.3, depth: 0.1, wet: 0.6 }).start();

        this.synth.connect(pianoChorus);
        pianoChorus.connect(pianoStereoDelay);
        pianoStereoDelay.connect(pianoAmbientDelay);
        pianoAmbientDelay.connect(pianoFilter);
        pianoFilter.connect(pianoCompressor);
        pianoCompressor.connect(pianoTremolo);
        pianoTremolo.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(pianoChorus, pianoStereoDelay, pianoAmbientDelay,
            pianoFilter, pianoCompressor, pianoTremolo, this.reverbNode);

        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 2.0;
        const noteSpacing = 1.0;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.2 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'melodic' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    if (this.synth.loaded) {
                        this.synth.triggerAttackRelease(note, noteDuration);
                    } else {
                        this.synth.loaded.then(() => {
                            if (this.isActive) {
                                this.synth.triggerAttackRelease(note, noteDuration);
                            }
                        });
                    }
                } catch (error) {
                    console.debug("Note playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }
}

// ===============================================
// MARIMBA INSTRUMENT
// ===============================================

class MarimbaInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Marimba');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 }
        });

        const pingPongDelay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.3,
            wet: 0.25
        });

        this.reverbNode = new Tone.Reverb({
            decay: 10,
            wet: this.config.reverbAmount,
            preDelay: 0.03
        });

        this.synth.connect(pingPongDelay);
        pingPongDelay.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(pingPongDelay, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 0.5;
        const noteSpacing = 0.6;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.2 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'melodic' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Note playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }
}

// ===============================================
// HARP INSTRUMENT
// ===============================================

class HarpInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Harp');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 1.5,
            modulationIndex: 10,
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.7, sustain: 0.1, release: 1 },
            modulation: { type: "triangle" },
            modulationEnvelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 0.5 },
            volume: -5
        });

        const pingPongDelay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.3,
            wet: 0.25
        });

        this.reverbNode = new Tone.Reverb({
            decay: 10,
            wet: this.config.reverbAmount,
            preDelay: 0.03
        });

        this.synth.connect(pingPongDelay);
        pingPongDelay.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(pingPongDelay, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 1.0;
        const noteSpacing = 0.7;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.2 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'melodic' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Note playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }
}

// ===============================================
// MUSIC BOX INSTRUMENT
// ===============================================

class MusicBoxInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Music Box');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.MetalSynth, {
            harmonicity: 3.1,
            resonance: 1000,
            modulationIndex: 12,
            envelope: { attack: 0.001, decay: 1, sustain: 0, release: 0.5 },
            volume: -25
        });

        const pingPongDelay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.3,
            wet: 0.25
        });

        this.reverbNode = new Tone.Reverb({
            decay: 10,
            wet: this.config.reverbAmount,
            preDelay: 0.03
        });

        this.synth.connect(pingPongDelay);
        pingPongDelay.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(pingPongDelay, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 0.3;
        const noteSpacing = 0.4;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.2 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'melodic' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Note playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }
}

// ===============================================
// CRYSTAL BELLS INSTRUMENT
// Shimmering metallic tones with long resonance
// ===============================================

class CrystalBellsInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Crystal Bells');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.MetalSynth, {
            harmonicity: 2.1,
            resonance: 2400,
            modulationIndex: 15,
            envelope: { attack: 0.001, decay: 1.5, sustain: 0.2, release: 3 },
            volume: -20
        });

        // Crystal-like effect chain
        const crystallineDelay = new Tone.PingPongDelay({
            delayTime: "16n",
            feedback: 0.4,
            wet: 0.35
        });

        const shimmerChorus = new Tone.Chorus({
            frequency: 0.3,
            delayTime: 4,
            depth: 0.6,
            wet: 0.5
        }).start();

        const brightFilter = new Tone.Filter({
            frequency: 3000,
            type: "highpass",
            Q: 2
        });

        this.reverbNode = new Tone.Reverb({
            decay: 15,
            wet: this.config.reverbAmount,
            preDelay: 0.03,
            roomSize: 0.8
        });

        this.synth.connect(brightFilter);
        brightFilter.connect(crystallineDelay);
        crystallineDelay.connect(shimmerChorus);
        shimmerChorus.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(crystallineDelay, shimmerChorus, brightFilter, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 2.5;
        const noteSpacing = 1.2;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.3 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'crystal' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Crystal bells playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 1000);
            }, timing);
        });
    }
}

// ===============================================
// WARM STRINGS INSTRUMENT
// Soft string ensemble with rich harmonics
// ===============================================

class WarmStringsInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Warm Strings');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "fatsawtooth",
                detune: 5
            },
            envelope: { attack: 1.2, decay: 0.8, sustain: 0.7, release: 2.5 },
            volume: -8
        });

        // String-like processing
        const stringFilter = new Tone.Filter({
            frequency: 2200,
            type: "lowpass",
            Q: 2
        });

        const warmth = new Tone.Filter({
            frequency: 800,
            type: "lowpass",
            Q: 0.8
        });

        const stringChorus = new Tone.Chorus({
            frequency: 0.2,
            delayTime: 6,
            depth: 0.3,
            wet: 0.4
        }).start();

        const stringsTremolo = new Tone.Tremolo({
            frequency: 0.1,
            depth: 0.15,
            wet: 0.6
        }).start();

        this.reverbNode = new Tone.Reverb({
            decay: 12,
            wet: this.config.reverbAmount,
            preDelay: 0.05,
            roomSize: 0.9
        });

        this.synth.connect(stringFilter);
        stringFilter.connect(warmth);
        warmth.connect(stringChorus);
        stringChorus.connect(stringsTremolo);
        stringsTremolo.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(stringFilter, warmth, stringChorus, stringsTremolo, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 4.0;
        const noteSpacing = 1.8;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.4 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'strings' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Warm strings playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }
}

// ===============================================
// ETHEREAL CHOIR INSTRUMENT
// Floating vocal-like textures
// ===============================================

class EtherealChoirInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Ethereal Choir');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 0.5,
            modulationIndex: 4,
            oscillator: { type: "sine" },
            envelope: {
                attack: 8,      // Much longer attack (was 2)
                decay: 4,       // Longer decay (was 1)
                sustain: 0.95,  // Higher sustain (was 0.8)
                release: 15     // Much longer release (was 4)
            },
            modulation: { type: "triangle" },
            modulationEnvelope: {
                attack: 6,      // Longer mod attack (was 1.5)
                decay: 3,       // Longer mod decay (was 1)
                sustain: 0.8,   // Higher mod sustain (was 0.6)
                release: 12     // Much longer mod release (was 3)
            },
            volume: -12
        });

        // Additional voice for richer choir texture
        this.harmonyVoice = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 0.75,
            modulationIndex: 3,
            oscillator: { type: "sine", detune: 7 },
            envelope: {
                attack: 9,      // Slightly staggered timing
                decay: 4.5,
                sustain: 0.9,
                release: 16
            },
            modulation: { type: "triangle" },
            modulationEnvelope: {
                attack: 6.5,
                decay: 3.2,
                sustain: 0.75,
                release: 13
            },
            volume: -15
        });

        // Choir-like processing with slow breathing movement
        const voiceFilter = new Tone.Filter({
            frequency: 1800,
            type: "lowpass",
            Q: 1.5
        });

        const breathingLFO = new Tone.LFO({
            frequency: 0.03,  // Very slow breathing (was 0.15)
            min: 1200,
            max: 2400,
            type: "sine"
        });
        breathingLFO.connect(voiceFilter.frequency);
        breathingLFO.start();

        const choirChorus = new Tone.Chorus({
            frequency: 0.08,  // Slower chorus movement
            delayTime: 12,    // Longer delay time
            depth: 0.9,       // Deeper modulation
            wet: 0.8          // More wet signal
        }).start();

        const breathiness = new Tone.Filter({
            frequency: 3000,
            type: "highpass",
            Q: 0.5
        });

        const breathGain = new Tone.Gain(0.08);  // Slightly more breath

        // Enhanced reverb for cathedral-like space
        this.reverbNode = new Tone.Reverb({
            decay: 25,        // Much longer decay (was 18)
            wet: this.config.reverbAmount * 1.2,  // More reverb
            preDelay: 0.15,   // Longer pre-delay (was 0.08)
            roomSize: 0.98    // Larger room (was 0.95)
        });

        // Main signal path
        this.synth.connect(voiceFilter);
        this.harmonyVoice.connect(voiceFilter);
        voiceFilter.connect(choirChorus);
        choirChorus.connect(this.reverbNode);

        // Subtle breathiness layer
        this.synth.connect(breathiness);
        breathiness.connect(breathGain);
        breathGain.connect(this.reverbNode);

        this.reverbNode.connect(masterVolume);

        this.effects.push(this.harmonyVoice, voiceFilter, choirChorus, breathiness, breathGain, this.reverbNode, breathingLFO);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 8.0;    // Much longer notes (was 5.0)
        const noteSpacing = 4.0;     // More space between notes (was 2.5)

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 1.0 * 1000);  // More timing variation

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'choir' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    // Play main note
                    this.synth.triggerAttackRelease(note, noteDuration);

                    // Sometimes add harmony note
                    if (Math.random() < 0.6) {
                        setTimeout(() => {
                            if (this.isActive) {
                                this.harmonyVoice.triggerAttackRelease(note, noteDuration * 0.8);
                            }
                        }, 1000 + Math.random() * 2000);
                    }
                } catch (error) {
                    console.debug("Ethereal choir playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 2000);
            }, timing);
        });
    }
}


// ===============================================
// WIND CHIMES INSTRUMENT
// Gentle metallic chimes with natural randomness
// ===============================================

class WindChimesInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Wind Chimes');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3.1,
            modulationIndex: 8,
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 1.2, sustain: 0.1, release: 2 },
            modulation: { type: "triangle" },
            modulationEnvelope: { attack: 0.05, decay: 0.8, sustain: 0.2, release: 1.5 },
            volume: -12
        });

        // Wind chime effects
        const chimeDelay = new Tone.PingPongDelay({
            delayTime: "8n.",
            feedback: 0.3,
            wet: 0.4
        });

        const airMovement = new Tone.Tremolo({
            frequency: 0.3,
            depth: 0.2,
            wet: 0.5
        }).start();

        const metallicFilter = new Tone.Filter({
            frequency: 2500,
            type: "bandpass",
            Q: 4
        });

        this.reverbNode = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount,
            preDelay: 0.02,
            roomSize: 0.7
        });

        this.synth.connect(metallicFilter);
        metallicFilter.connect(chimeDelay);
        chimeDelay.connect(airMovement);
        airMovement.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(chimeDelay, airMovement, metallicFilter, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        // Wind chimes play with natural clustering and spacing
        const baseSpacing = 0.8;

        melody.forEach((note, index) => {
            // Create natural wind-like clustering
            let timing = 0;
            if (index === 0) {
                timing = Math.random() * 1000;
            } else {
                // Sometimes notes cluster together, sometimes spread apart
                const clusterChance = Math.random();
                if (clusterChance < 0.3) {
                    // Cluster notes closely
                    timing = (index * baseSpacing * 0.3 + Math.random() * 0.5) * 1000;
                } else {
                    // Normal spacing with variation
                    timing = (index * baseSpacing + Math.random() * 1.5) * 1000;
                }
            }

            setTimeout(() => {
                if (!this.isActive) return;

                // Slight pitch variation for natural imperfection
                const noteVariation = Math.random() * 10 - 5; // ±5 cents

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'chimes' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    // Variable note duration for natural feel
                    const duration = 0.8 + Math.random() * 1.5;
                    this.synth.triggerAttackRelease(note, duration);
                } catch (error) {
                    console.debug("Wind chimes playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, 2500);
            }, timing);
        });
    }
}

// ===============================================
// GLASS HARMONICS INSTRUMENT
// Pure harmonic tones with glass-like clarity
// ===============================================

class GlassHarmonicsInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Glass Harmonics');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.5, decay: 2, sustain: 0.3, release: 3 },
            volume: -10
        });

        // Glass-like harmonic processing
        const harmonicFilter = new Tone.Filter({
            frequency: 4000,
            type: "highpass",
            Q: 3
        });

        const glassDelay = new Tone.FeedbackDelay({
            delayTime: "4n.",
            feedback: 0.4,
            wet: 0.3
        });

        const crystallineChorus = new Tone.Chorus({
            frequency: 0.8,
            delayTime: 2,
            depth: 0.4,
            wet: 0.5
        }).start();

        const purity = new Tone.Filter({
            frequency: 8000,
            type: "lowpass",
            Q: 1
        });

        this.reverbNode = new Tone.Reverb({
            decay: 10,
            wet: this.config.reverbAmount,
            preDelay: 0.04,
            roomSize: 0.85
        });

        this.synth.connect(harmonicFilter);
        harmonicFilter.connect(glassDelay);
        glassDelay.connect(crystallineChorus);
        crystallineChorus.connect(purity);
        purity.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(harmonicFilter, glassDelay, crystallineChorus, purity, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 3.0;
        const noteSpacing = 1.5;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.3 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'glass' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Glass harmonics playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 800);
            }, timing);
        });
    }
}

// ===============================================
// SOFT FLUTE INSTRUMENT
// Breathy woodwind with organic character
// ===============================================

class SoftFluteInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Soft Flute');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle",
                detune: 2
            },
            envelope: { attack: 0.3, decay: 0.5, sustain: 0.6, release: 1.5 },
            volume: -8
        });

        // Flute-like breath and tone shaping
        const breathNoise = new Tone.Noise("pink");
        const breathGain = new Tone.Gain(0.03);
        const breathFilter = new Tone.Filter({
            frequency: 2000,
            type: "highpass",
            Q: 0.8
        });

        const fluteFilter = new Tone.Filter({
            frequency: 1800,
            type: "lowpass",
            Q: 2
        });

        const vibrato = new Tone.Vibrato({
            frequency: 5,
            depth: 0.05,
            wet: 0.3
        });

        // ENHANCED: Added flutter tonguing effect for variety
        const flutter = new Tone.Tremolo({
            frequency: 8,
            depth: 0.15,
            wet: 0
        }).start();

        this.reverbNode = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount,
            preDelay: 0.03,
            roomSize: 0.7
        });

        // Main flute signal
        this.synth.connect(fluteFilter);
        fluteFilter.connect(vibrato);
        vibrato.connect(flutter);
        flutter.connect(this.reverbNode);

        // Subtle breath noise layer
        breathNoise.connect(breathFilter);
        breathFilter.connect(breathGain);
        breathGain.connect(this.reverbNode);

        this.reverbNode.connect(masterVolume);

        // Start breath noise at very low level
        breathNoise.start();

        this.effects.push(breathNoise, breathGain, breathFilter, fluteFilter, vibrato, flutter, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        // ENHANCED: Occasionally use faster tempo
        const tempoVariation = Math.random();
        let baseSpacing, baseDuration;

        if (tempoVariation < 0.2) {
            // Fast flute passages (20% chance)
            baseSpacing = 0.4;
            baseDuration = 0.8;
            // Enable flutter effect for fast passages
            const flutter = this.effects.find(effect => effect instanceof Tone.Tremolo);
            if (flutter) flutter.wet.value = 0.3;
        } else {
            // Normal tempo
            baseSpacing = 1.3;
            baseDuration = 2.5;
            // Disable flutter for normal passages
            const flutter = this.effects.find(effect => effect instanceof Tone.Tremolo);
            if (flutter) flutter.wet.value = 0;
        }

        melody.forEach((note, index) => {
            // ENHANCED: Wider octave range - transpose some notes
            let playNote = note;
            const octaveShift = Math.random();

            if (octaveShift < 0.15) {
                // Shift up an octave (15% chance)
                const noteName = note.slice(0, -1);
                const octave = parseInt(note.slice(-1));
                if (octave < 6) {
                    playNote = noteName + (octave + 1);
                }
            } else if (octaveShift < 0.25) {
                // Shift down an octave (10% chance)
                const noteName = note.slice(0, -1);
                const octave = parseInt(note.slice(-1));
                if (octave > 2) {
                    playNote = noteName + (octave - 1);
                }
            }

            let timing = index * baseSpacing * 1000;
            timing += (Math.random() * 0.2 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[playNote]) {
                        activeNotes[playNote] = { count: 1, type: 'flute' };
                    } else {
                        activeNotes[playNote].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(playNote, baseDuration);
                } catch (error) {
                    console.debug("Soft flute playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[playNote]) {
                        activeNotes[playNote].count--;
                        if (activeNotes[playNote].count <= 0) {
                            delete activeNotes[playNote];
                        }
                    }
                }, baseDuration * 1000 + 500);
            }, timing);
        });
    }

    stop() {
        super.stop();
        // Stop the breath noise
        const breathNoise = this.effects.find(effect => effect instanceof Tone.Noise);
        if (breathNoise) {
            breathNoise.stop();
        }
    }
}

// ===============================================
// VINTAGE CELESTA INSTRUMENT
// Music box meets celesta with nostalgic warmth
// ===============================================

class VintageCelestaInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Vintage Celesta');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 2,
            modulationIndex: 6,
            oscillator: { type: "sine" },
            envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.5 },
            modulation: { type: "square" },
            modulationEnvelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 1 },
            volume: -12
        });

        // Vintage processing
        const warmth = new Tone.Filter({
            frequency: 3000,
            type: "lowpass",
            Q: 1.5
        });

        const vintageDistortion = new Tone.Distortion({
            distortion: 0.1,
            wet: 0.3
        });

        // ENHANCED: Multiple echo layers for rich ambient texture
        const shortEcho = new Tone.PingPongDelay({
            delayTime: "8n",      // Faster echo
            feedback: 0.4,        // More feedback
            wet: 0.35             // More prominent
        });

        const mediumEcho = new Tone.FeedbackDelay({
            delayTime: "4n.",     // Medium echo
            feedback: 0.3,
            wet: 0.25
        });

        const longEcho = new Tone.FeedbackDelay({
            delayTime: "2n",      // Long echo
            feedback: 0.2,
            wet: 0.15
        });

        const nostalgicChorus = new Tone.Chorus({
            frequency: 0.4,
            delayTime: 3,
            depth: 0.3,
            wet: 0.4
        }).start();

        // ENHANCED: Much more spacious reverb
        this.reverbNode = new Tone.Reverb({
            decay: 15,           // Much longer decay (was 6)
            wet: this.config.reverbAmount * 1.5,  // More reverb
            preDelay: 0.08,      // Longer pre-delay (was 0.02)
            roomSize: 0.9        // Larger room (was 0.6)
        });

        // Connect the enhanced chain
        this.synth.connect(vintageDistortion);
        vintageDistortion.connect(warmth);
        warmth.connect(shortEcho);
        shortEcho.connect(mediumEcho);
        mediumEcho.connect(longEcho);
        longEcho.connect(nostalgicChorus);
        nostalgicChorus.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(warmth, vintageDistortion, shortEcho, mediumEcho, longEcho, nostalgicChorus, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 1.2;
        const noteSpacing = 0.9;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.15 * 1000);

            setTimeout(() => {
                if (!this.isActive) return;

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'celesta' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, noteDuration);
                } catch (error) {
                    console.debug("Vintage celesta playback error:", error.message);
                }

                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, noteDuration * 1000 + 800);
            }, timing);
        });
    }
}

// ===============================================
// MELODY INSTRUMENT REGISTRY
// ===============================================

class MelodyInstrumentRegistry {
    constructor() {
        this.instruments = new Map();
        this.registerDefaultInstruments();
    }

    registerDefaultInstruments() {
        this.register('piano', PianoInstrument);
        this.register('glitch-electronic', GlitchElectronicInstrument);
        this.register('sampled-piano', SampledPianoInstrument);
        this.register('marimba', MarimbaInstrument);
        this.register('harp', HarpInstrument);
        this.register('music-box', MusicBoxInstrument);

        this.register('crystal-bells', CrystalBellsInstrument);
        this.register('warm-strings', WarmStringsInstrument);
        this.register('ethereal-choir', EtherealChoirInstrument);
        this.register('wind-chimes', WindChimesInstrument);
        this.register('glass-harmonics', GlassHarmonicsInstrument);
        this.register('soft-flute', SoftFluteInstrument);
        this.register('vintage-celesta', VintageCelestaInstrument);
    }

    register(key, InstrumentClass) {
        this.instruments.set(key, InstrumentClass);
    }

    create(key, config = {}) {
        const InstrumentClass = this.instruments.get(key);
        if (!InstrumentClass) {
            throw new Error(`Melody instrument '${key}' not found in registry`);
        }
        return new InstrumentClass(config);
    }

    getAvailableInstruments() {
        return Array.from(this.instruments.keys());
    }

    getInstrumentInfo(key) {
        const InstrumentClass = this.instruments.get(key);
        if (!InstrumentClass) return null;

        const temp = new InstrumentClass();
        return {
            key,
            name: temp.name
        };
    }
}

// ===============================================
// MELODY MANAGER
// ===============================================

class MelodyManager {
    constructor() {
        this.registry = new MelodyInstrumentRegistry();
        this.currentInstrument = null;
        this.isEnabled = false;
        this.randomInterval = null;
    }

    async setInstrument(instrumentKey, config = {}) {
        if (this.currentInstrument) {
            this.currentInstrument.dispose();
        }

        this.currentInstrument = this.registry.create(instrumentKey, config);

        // Note: Initialize will be called with global audio nodes from main app
        return this.currentInstrument;
    }

    async start(scale, melodicPattern) {
        if (!this.currentInstrument || !this.isEnabled) return;

        // Initialize if not already done
        if (!this.currentInstrument.synth) {
            // masterVolume should be available globally
            await this.currentInstrument.initialize(masterVolume, reverb);
        }

        this.currentInstrument.start(scale, melodicPattern);
    }

    stop() {
        if (this.currentInstrument) {
            this.currentInstrument.stop();
        }
        if (this.randomInterval) {
            clearInterval(this.randomInterval);
            this.randomInterval = null;
        }
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    updateReverbAmount(amount) {
        if (this.currentInstrument) {
            this.currentInstrument.updateReverbAmount(amount);
        }
    }

    getAvailableInstruments() {
        return this.registry.getAvailableInstruments().map(key =>
            this.registry.getInstrumentInfo(key)
        );
    }

    startRandomCycle() {
        if (this.randomInterval) {
            clearInterval(this.randomInterval);
        }

        // Get interval from global slider
        const minutesValue = typeof randomIntervalSlider !== 'undefined' ?
            parseInt(randomIntervalSlider.value) : 10;
        const milliseconds = minutesValue * 60 * 1000;

        this.randomInterval = setInterval(() => {
            if (typeof isPlaying !== 'undefined' && isPlaying &&
                typeof melodicInstrumentSelect !== 'undefined' &&
                melodicInstrumentSelect.value === "random") {
                this.changeToRandomInstrument();
            } else {
                clearInterval(this.randomInterval);
                this.randomInterval = null;
            }
        }, milliseconds);
    }

    changeToRandomInstrument() {
        const availableInstruments = this.registry.getAvailableInstruments();

        let currentInstrument = "";
        if (this.currentInstrument) {
            currentInstrument = this.currentInstrument.instrumentType || "";
        }

        let newInstrument;
        do {
            const randomIndex = Math.floor(Math.random() * availableInstruments.length);
            newInstrument = availableInstruments[randomIndex];
        } while (newInstrument === currentInstrument && availableInstruments.length > 1);

        console.debug(`Random instrument change: ${currentInstrument} → ${newInstrument}`);

        // Set new instrument
        this.setInstrument(newInstrument, {
            volume: -5,
            reverbAmount: typeof melodicReverbSlider !== 'undefined' ?
                parseFloat(melodicReverbSlider.value) : 0.5
        });

        // Restart with current scale and pattern if playing
        if (typeof isPlaying !== 'undefined' && isPlaying) {
            const currentMood = typeof moodSelect !== 'undefined' && moodSelect.value === "random" ?
                (typeof currentActiveMood !== 'undefined' ? currentActiveMood : 'calm') :
                (typeof moodSelect !== 'undefined' ? moodSelect.value : 'calm');

            const currentScale = typeof scales !== 'undefined' ? scales[currentMood] : [];
            const melodicPattern = typeof melodicPatterns !== 'undefined' ? melodicPatterns[currentMood] : [];

            this.start(currentScale, melodicPattern);
        }
    }

    dispose() {
        this.stop();
        if (this.currentInstrument) {
            this.currentInstrument.dispose();
            this.currentInstrument = null;
        }
    }
}