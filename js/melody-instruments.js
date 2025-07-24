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
        // Clean up any existing state first
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
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

        // MAIN VOICE - More aggressive and audible
        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 0.5,
            modulationIndex: 8,        // More modulation for presence
            oscillator: { type: "sine" },
            envelope: {
                attack: 3,             // Shorter attack for more presence
                decay: 2,
                sustain: 0.8,
                release: 8
            },
            modulation: { type: "triangle" },
            modulationEnvelope: {
                attack: 2,
                decay: 1.5,
                sustain: 0.7,
                release: 6
            },
            volume: -3
        });

        // FORMANT VOICE - Human-like vowel sounds
        this.formantVoice = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 1.5,
            oscillator: { type: "sawtooth" },
            envelope: { attack: 4, decay: 1, sustain: 0.9, release: 10 },
            modulation: { type: "square" },
            modulationEnvelope: { attack: 3, decay: 2, sustain: 0.6, release: 8 },
            volume: -3              // Much louder (was -8)
        });

        // WHISPER VOICE - Breathy texture
        this.whisperVoice = new Tone.Noise("pink");
        this.whisperEnv = new Tone.AmplitudeEnvelope({
            attack: 6,
            decay: 3,
            sustain: 0.4,
            release: 12
        });
        this.whisperGain = new Tone.Gain(0.3);  // Much louder whispers (was 0.15)

        // DRONE VOICE - Sustained low harmonics
        this.droneVoice = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 10, decay: 5, sustain: 0.9, release: 20 },
            volume: -6              // Much louder drone (was -12)
        });

        // EXPERIMENTAL PROCESSING CHAIN

        // Vowel formant filter with LFO modulation
        const formantFilter = new Tone.Filter({
            frequency: 800,
            type: "bandpass",
            Q: 8
        });

        const formantLFO = new Tone.LFO({
            frequency: 0.1,
            min: 400,
            max: 1600,
            type: "sine"
        });
        formantLFO.connect(formantFilter.frequency);
        formantLFO.start();

        // Breathing movement - more dramatic
        const breathingFilter = new Tone.Filter({
            frequency: 2000,
            type: "lowpass",
            Q: 2
        });

        const breathingLFO = new Tone.LFO({
            frequency: 0.08,    // Faster breathing
            min: 800,
            max: 3200,
            type: "sine"
        });
        breathingLFO.connect(breathingFilter.frequency);
        breathingLFO.start();

        // Experimental chorus with randomization
        const choirChorus = new Tone.Chorus({
            frequency: 0.15,
            delayTime: 8,
            depth: 0.8,
            wet: 0.9
        }).start();

        // Pitch shifter for ethereal harmonies
        const pitchShift = new Tone.PitchShift({
            pitch: 7,  // Perfect fifth up
            wet: 0.3
        });

        // Granular-style delay for texture
        const granularDelay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.6,
            wet: 0.4
        });

        // Subtle distortion for character
        const voiceDistortion = new Tone.Distortion({
            distortion: 0.15,
            wet: 0.25
        });

        // Auto-wah for movement
        const autoWah = new Tone.AutoWah({
            baseFrequency: 100,
            octaves: 4,
            sensitivity: -10,
            Q: 2,
            wet: 0.3
        });

        // Enhanced reverb
        this.reverbNode = new Tone.Reverb({
            decay: 30,
            wet: this.config.reverbAmount * 1.3,
            preDelay: 0.2
        });

        // COMPLEX SIGNAL ROUTING

        // Main voice path - full processing
        this.synth.connect(formantFilter);
        formantFilter.connect(voiceDistortion);
        voiceDistortion.connect(autoWah);
        autoWah.connect(pitchShift);
        pitchShift.connect(choirChorus);

        // Formant voice path - formant emphasis
        this.formantVoice.connect(breathingFilter);
        breathingFilter.connect(granularDelay);
        granularDelay.connect(choirChorus);

        // Whisper voice path - filtered noise
        this.whisperVoice.connect(this.whisperEnv);
        this.whisperEnv.connect(this.whisperGain);
        this.whisperGain.connect(breathingFilter);

        // Drone voice path - minimal processing
        this.droneVoice.connect(this.reverbNode);

        // Final mix
        choirChorus.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        // Start continuous elements
        this.whisperVoice.start();

        this.effects.push(
            this.formantVoice, this.whisperVoice, this.whisperEnv, this.whisperGain,
            this.droneVoice, formantFilter, formantLFO, breathingFilter, breathingLFO,
            choirChorus, pitchShift, granularDelay, voiceDistortion, autoWah, this.reverbNode
        );

        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 6.0;
        const noteSpacing = 3.0;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 1.5 * 1000);

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
                    // Always play main voice
                    this.synth.triggerAttackRelease(note, noteDuration);

                    // Randomly add different voice layers for variety
                    const voiceChoice = Math.random();

                    if (voiceChoice < 0.4) {
                        // Formant voice (40% chance)
                        setTimeout(() => {
                            if (this.isActive) {
                                this.formantVoice.triggerAttackRelease(note, noteDuration * 0.7);
                            }
                        }, 500 + Math.random() * 1000);
                    }

                    if (voiceChoice < 0.6) {
                        // Whisper envelope trigger (60% chance total, 20% additional)
                        setTimeout(() => {
                            if (this.isActive) {
                                this.whisperEnv.triggerAttackRelease(noteDuration * 0.5);
                            }
                        }, Math.random() * 2000);
                    }

                    if (voiceChoice < 0.25) {
                        // Drone voice for bass notes (25% chance)
                        const noteName = note.slice(0, -1);
                        const octave = parseInt(note.slice(-1));
                        if (octave >= 3) {
                            const droneNote = noteName + (octave - 2); // Two octaves lower
                            setTimeout(() => {
                                if (this.isActive) {
                                    this.droneVoice.triggerAttackRelease(droneNote, noteDuration * 1.5);
                                }
                            }, 2000 + Math.random() * 3000);
                        }
                    }

                } catch (error) {
                    console.debug("Experimental choir playback error:", error.message);
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

    stop() {
        super.stop();
        // Stop the whisper noise
        if (this.whisperVoice) {
            this.whisperVoice.stop();
        }
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
            volume: 0               // MUCH louder (was -12)
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
            volume: -6
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

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        // MAIN VOICE - More aggressive and audible
        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 0.5,
            modulationIndex: 8,        // More modulation for presence
            oscillator: { type: "sine" },
            envelope: {
                attack: 3,             // Shorter attack for more presence
                decay: 2,
                sustain: 0.8,
                release: 8
            },
            modulation: { type: "triangle" },
            modulationEnvelope: {
                attack: 2,
                decay: 1.5,
                sustain: 0.7,
                release: 6
            },
            volume: -3
        });

        // FORMANT VOICE - Human-like vowel sounds
        this.formantVoice = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 1.5,
            oscillator: { type: "sawtooth" },
            envelope: { attack: 4, decay: 1, sustain: 0.9, release: 10 },
            modulation: { type: "square" },
            modulationEnvelope: { attack: 3, decay: 2, sustain: 0.6, release: 8 },
            volume: -4              // Much louder (was -8)
        });

        // WHISPER VOICE - Breathy texture
        this.whisperVoice = new Tone.Noise("pink");
        this.whisperEnv = new Tone.AmplitudeEnvelope({
            attack: 6,
            decay: 3,
            sustain: 0.4,
            release: 12
        });
        this.whisperGain = new Tone.Gain(0.3);  // Much louder whispers (was 0.15)

        // DRONE VOICE - Sustained low harmonics
        this.droneVoice = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 10, decay: 5, sustain: 0.9, release: 20 },
            volume: -4              // Much louder drone (was -12)
        });

        // EXPERIMENTAL PROCESSING CHAIN

        // Vowel formant filter with LFO modulation
        const formantFilter = new Tone.Filter({
            frequency: 800,
            type: "bandpass",
            Q: 8
        });

        const formantLFO = new Tone.LFO({
            frequency: 0.1,
            min: 400,
            max: 1600,
            type: "sine"
        });
        formantLFO.connect(formantFilter.frequency);
        formantLFO.start();

        // Breathing movement - more dramatic
        const breathingFilter = new Tone.Filter({
            frequency: 2000,
            type: "lowpass",
            Q: 2
        });

        const breathingLFO = new Tone.LFO({
            frequency: 0.08,    // Faster breathing
            min: 800,
            max: 3200,
            type: "sine"
        });
        breathingLFO.connect(breathingFilter.frequency);
        breathingLFO.start();

        // Experimental chorus with randomization
        const choirChorus = new Tone.Chorus({
            frequency: 0.15,
            delayTime: 8,
            depth: 0.8,
            wet: 0.9
        }).start();

        // Pitch shifter for ethereal harmonies
        const pitchShift = new Tone.PitchShift({
            pitch: 7,  // Perfect fifth up
            wet: 0.3
        });

        // Granular-style delay for texture
        const granularDelay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.6,
            wet: 0.4
        });

        // Subtle distortion for character
        const voiceDistortion = new Tone.Distortion({
            distortion: 0.15,
            wet: 0.25
        });

        // Auto-wah for movement
        const autoWah = new Tone.AutoWah({
            baseFrequency: 100,
            octaves: 4,
            sensitivity: -10,
            Q: 2,
            wet: 0.3
        });

        // Enhanced reverb
        this.reverbNode = new Tone.Reverb({
            decay: 30,
            wet: this.config.reverbAmount * 1.3,
            preDelay: 0.2
        });

        // COMPLEX SIGNAL ROUTING

        // Main voice path - full processing
        this.synth.connect(formantFilter);
        formantFilter.connect(voiceDistortion);
        voiceDistortion.connect(autoWah);
        autoWah.connect(pitchShift);
        pitchShift.connect(choirChorus);

        // Formant voice path - formant emphasis
        this.formantVoice.connect(breathingFilter);
        breathingFilter.connect(granularDelay);
        granularDelay.connect(choirChorus);

        // Whisper voice path - filtered noise
        this.whisperVoice.connect(this.whisperEnv);
        this.whisperEnv.connect(this.whisperGain);
        this.whisperGain.connect(breathingFilter);

        // Drone voice path - minimal processing
        this.droneVoice.connect(this.reverbNode);

        // Final mix
        choirChorus.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        // Start continuous elements
        this.whisperVoice.start();

        this.effects.push(
            this.formantVoice, this.whisperVoice, this.whisperEnv, this.whisperGain,
            this.droneVoice, formantFilter, formantLFO, breathingFilter, breathingLFO,
            choirChorus, pitchShift, granularDelay, voiceDistortion, autoWah, this.reverbNode
        );

        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 6.0;
        const noteSpacing = 3.0;

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 1.5 * 1000);

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
                    // Always play main voice
                    this.synth.triggerAttackRelease(note, noteDuration);

                    // Randomly add different voice layers for variety
                    const voiceChoice = Math.random();

                    if (voiceChoice < 0.4) {
                        // Formant voice (40% chance)
                        setTimeout(() => {
                            if (this.isActive) {
                                this.formantVoice.triggerAttackRelease(note, noteDuration * 0.7);
                            }
                        }, 500 + Math.random() * 1000);
                    }

                    if (voiceChoice < 0.6) {
                        // Whisper envelope trigger (60% chance total, 20% additional)
                        setTimeout(() => {
                            if (this.isActive) {
                                this.whisperEnv.triggerAttackRelease(noteDuration * 0.5);
                            }
                        }, Math.random() * 2000);
                    }

                    if (voiceChoice < 0.25) {
                        // Drone voice for bass notes (25% chance)
                        const noteName = note.slice(0, -1);
                        const octave = parseInt(note.slice(-1));
                        if (octave >= 3) {
                            const droneNote = noteName + (octave - 2); // Two octaves lower
                            setTimeout(() => {
                                if (this.isActive) {
                                    this.droneVoice.triggerAttackRelease(droneNote, noteDuration * 1.5);
                                }
                            }, 2000 + Math.random() * 3000);
                        }
                    }

                } catch (error) {
                    console.debug("Experimental choir playback error:", error.message);
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

    stop() {
        super.stop();
        // Stop the whisper noise
        if (this.whisperVoice) {
            this.whisperVoice.stop();
        }
    }
}

// ===============================================
// SOFT FLUTE INSTRUMENT
// Breathy woodwind with organic character
// ===============================================

class SoftFluteInstrument extends BaseMelodyInstrument {
    constructor() {
        console.log('🎵 Creating Soft Flute instrument...');
        super('Soft Flute');
        console.log('🎵 Soft Flute constructor complete');
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

        // ENHANCED: Multiple echo/delay layers with variation
        const shortEcho = new Tone.PingPongDelay({
            delayTime: "16n",     // Fast echo
            feedback: 0.3,
            wet: 0.25
        });

        const mediumEcho = new Tone.FeedbackDelay({
            delayTime: "8n.",     // Medium echo
            feedback: 0.4,
            wet: 0.3
        });

        const longEcho = new Tone.FeedbackDelay({
            delayTime: "4n",      // Long echo
            feedback: 0.25,
            wet: 0.2
        });

        // Variable echo with LFO modulation
        const variableEcho = new Tone.PingPongDelay({
            delayTime: 0.25,      // Start with quarter note equivalent
            feedback: 0.35,
            wet: 0.3
        });

        const echoLFO = new Tone.LFO({
            frequency: 0.2,
            min: 0.0625,          // 16th note equivalent (1/16 second at 60 BPM)
            max: 0.5,             // Quarter note equivalent (1/2 second at 120 BPM)
            type: "sine"
        });
        echoLFO.connect(variableEcho.delayTime);
        echoLFO.start();

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

        // Main flute signal with cascading echoes
        this.synth.connect(fluteFilter);
        fluteFilter.connect(vibrato);
        vibrato.connect(flutter);
        flutter.connect(shortEcho);
        shortEcho.connect(mediumEcho);
        mediumEcho.connect(longEcho);
        longEcho.connect(variableEcho);
        variableEcho.connect(this.reverbNode);

        // Subtle breath noise layer
        breathNoise.connect(breathFilter);
        breathFilter.connect(breathGain);
        breathGain.connect(this.reverbNode);

        this.reverbNode.connect(masterVolume);

        // Start breath noise at very low level
        breathNoise.start();

        this.effects.push(breathNoise, breathGain, breathFilter, fluteFilter, vibrato, flutter,
            shortEcho, mediumEcho, longEcho, variableEcho, echoLFO, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        console.log('🎵 Soft Flute playMelodicSequence called with melody:', melody);
        console.log('🎵 Soft Flute isActive:', this.isActive);

        if (!this.isActive) {
            console.log('🎵 Soft Flute not active, skipping playback');
            return;
        }

        // ENHANCED: Randomly choose echo behavior for this sequence
        const echoChoice = Math.random();

        // Get references to the echo effects
        const shortEcho = this.effects.find(effect => effect instanceof Tone.PingPongDelay && effect.delayTime.value < 0.1);
        const mediumEcho = this.effects.find(effect => effect instanceof Tone.FeedbackDelay && effect.delayTime.value < 0.3);
        const longEcho = this.effects.find(effect => effect instanceof Tone.FeedbackDelay && effect.delayTime.value > 0.3);
        const variableEcho = this.effects.find(effect => effect instanceof Tone.PingPongDelay && effect.delayTime.value > 0.1);

        if (echoChoice < 0.3) {
            // 30% chance: Simple delay echo mode
            console.log('🎵 Flute: Simple delay echo mode');
            if (shortEcho) shortEcho.wet.value = 0.1;
            if (mediumEcho) mediumEcho.wet.value = 0.6;  // Boost medium echo
            if (longEcho) longEcho.wet.value = 0.4;      // Boost long echo
            if (variableEcho) variableEcho.wet.value = 0.1;
        } else if (echoChoice < 0.5) {
            // 20% chance: Ping-pong emphasis mode
            console.log('🎵 Flute: Ping-pong emphasis mode');
            if (shortEcho) shortEcho.wet.value = 0.5;    // Boost ping-pong
            if (mediumEcho) mediumEcho.wet.value = 0.1;
            if (longEcho) longEcho.wet.value = 0.1;
            if (variableEcho) variableEcho.wet.value = 0.6; // Boost variable ping-pong
        } else if (echoChoice < 0.7) {
            // 20% chance: Long ambient echo mode
            console.log('🎵 Flute: Long ambient echo mode');
            if (shortEcho) shortEcho.wet.value = 0.1;
            if (mediumEcho) mediumEcho.wet.value = 0.2;
            if (longEcho) longEcho.wet.value = 0.7;      // Heavy long echo
            if (variableEcho) variableEcho.wet.value = 0.3;
        } else {
            // 30% chance: Complex layered mode (original)
            console.log('🎵 Flute: Complex layered echo mode');
            if (shortEcho) shortEcho.wet.value = 0.25;
            if (mediumEcho) mediumEcho.wet.value = 0.3;
            if (longEcho) longEcho.wet.value = 0.2;
            if (variableEcho) variableEcho.wet.value = 0.3;
        }

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

                // Start breath noise when first note plays
                if (index === 0) {
                    const breathNoise = this.effects.find(effect => effect instanceof Tone.Noise);
                    if (breathNoise && breathNoise.state !== 'started') {
                        breathNoise.start();
                        console.log('🎵 Soft Flute: Started breath noise for sequence');

                        // Stop breath noise after sequence ends
                        setTimeout(() => {
                            if (breathNoise.state === 'started') {
                                breathNoise.stop();
                                console.log('🎵 Soft Flute: Stopped breath noise');
                            }
                        }, (melody.length * baseSpacing + baseDuration + 2) * 1000);
                    }
                }

                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[playNote]) {
                        activeNotes[playNote] = { count: 1, type: 'flute' };
                    } else {
                        activeNotes[playNote].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(playNote, baseDuration);
                    console.log(`🎵 Soft Flute: Playing note ${playNote}`);
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

    start(scale, melodicPattern) {
        console.log('🎵 Soft Flute start() called');
        super.start(scale, melodicPattern);
        console.log('🎵 Soft Flute isActive after start:', this.isActive);
    }

    stop() {
        console.log('🎵 Soft Flute stop() called');
        super.stop();
        // Stop the breath noise
        const breathNoise = this.effects.find(effect => effect instanceof Tone.Noise);
        if (breathNoise && breathNoise.state === 'started') {
            breathNoise.stop();
            console.log('🎵 Soft Flute: Stopped breath noise on stop()');
        }
        console.log('🎵 Soft Flute stopped');
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

class RhythmicPianoInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Rhythmic Piano');

        // Rhythmic patterns
        // 1 = on beat, 0 = rest, 0.5 = offbeat (8th), 0.25 = early 16th, 0.75 = late 16th
        // This creates complex polyrhythmic patterns with double offbeats and fine subdivisions
        this.rhythmicPatterns = [
            [1, 0, 1, 0],           // Basic on-beat pattern
            [1, 0, 0.5, 0],         // Beat 1 + offbeat
            [0, 1, 1, 0],           // Skip first beat
            [1, 0.5, 0, 1],         // Syncopated
            [1, 0, 1, 0.5],         // Beat + offbeat ending
            [0.5, 0, 1, 0],         // Offbeat start
            [1, 1, 0, 0],           // Two quick notes
            [1, 0, 0, 1],           // Sparse pattern
            [0, 0.5, 1, 0.5],       // All offbeats
            [1, 0.5, 1, 0.5],       // Dense syncopated
            [1, 0.25, 0.5, 0],      // Beat + early 16th + offbeat
            [0.5, 0.75, 1, 0],      // Offbeat + late 16th + beat
            [1, 0.25, 0.75, 0],     // Beat + both 16th subdivisions
            [0, 0.25, 0.5, 0.75],   // All subdivisions except beat
            [1, 0.5, 0.75, 0],      // Beat + offbeat + late 16th
            [0.25, 0.5, 1, 0.75],   // Complex syncopated pattern
            [1, 0.25, 1, 0.25],     // Beats + early 16ths
            [0.5, 0.75, 0.5, 0.75], // Double offbeats pattern
            [1, 0, 0.25, 0.75],     // Beat + double 16th subdivision
            [0.25, 0.75, 0.25, 0.75], // All double offbeats
        ];

        // Current musical state
        this.currentBeat = 0;
        this.currentPattern = [];
        this.currentPatternIndex = 0;
        this.beatsPerPattern = 4;
        this.beatInterval = null;
        this.tempo = 100; // BPM

        // Note selection
        this.recentNotes = [];
        this.maxRecentNotes = 4;
        this.currentScale = [];
        this.preferredRange = []; // Notes in preferred octave range

        // Phrase structure
        this.phraseBeat = 0;
        this.phraseLength = 16; // beats per phrase
        this.shouldChangePattern = false;
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        // Create a clean piano-style synth
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle",
                partials: [1, 0.5, 0.25] // Add some harmonics for richness
            },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.2,
                release: 0.8
            },
            volume: -2
        });

        // Clean, modern piano processing
        const rhythmChorus = new Tone.Chorus({
            frequency: 0.3,
            delayTime: 2,
            depth: 0.2,
            wet: 0.3
        }).start();

        // const rhythmDelay = new Tone.PingPongDelay({
        //     delayTime: "8n",
        //     feedback: 0.2,
        //     wet: 0.15
        // });

        const rhythmDelay = new Tone.PingPongDelay({
            delayTime: "4n",     // Quarter note - slower echoes
            feedback: 0.3,       // Fewer repeats
            wet: 0.5             // Very present
        });
        const rhythmCompressor = new Tone.Compressor({
            threshold: -18,
            ratio: 3,
            attack: 0.003,
            release: 0.1
        });

        this.reverbNode = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount,
            preDelay: 0.02,
            roomSize: 0.6
        });

        // Signal chain
        this.synth.connect(rhythmChorus);
        rhythmChorus.connect(rhythmDelay);
        rhythmDelay.connect(rhythmCompressor);
        rhythmCompressor.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.effects.push(rhythmChorus, rhythmDelay, rhythmCompressor, this.reverbNode);
        this.synth.volume.value = this.config.volume;
    }

    start(scale, melodicPattern) {
        super.start(scale, melodicPattern);

        this.currentScale = scale;
        this.setupPreferredRange();
        this.selectNewPattern();
        this.startRhythmicPlayback();
    }

    setupPreferredRange() {
        // Focus on a comfortable melodic range (octaves 3-5)
        this.preferredRange = this.currentScale.filter(note => {
            const octave = parseInt(note.slice(-1));
            return octave >= 3 && octave <= 5;
        });

        // Fallback to full scale if preferred range is too small
        if (this.preferredRange.length < 5) {
            this.preferredRange = this.currentScale;
        }
    }

    selectNewPattern() {
        // Choose a new rhythmic pattern
        const oldPattern = this.currentPattern;
        do {
            const randomIndex = Math.floor(Math.random() * this.rhythmicPatterns.length);
            this.currentPattern = [...this.rhythmicPatterns[randomIndex]];
        } while (this.rhythmicPatterns.length > 1 &&
        JSON.stringify(this.currentPattern) === JSON.stringify(oldPattern));

        this.currentPatternIndex = 0;
        console.debug(`Rhythmic Piano: New pattern selected: ${this.currentPattern}`);
    }

    startRhythmicPlayback() {
        if (!this.isActive) return;

        // Calculate beat duration from tempo
        const beatDuration = (60 / this.tempo) * 1000; // milliseconds per beat

        const playBeat = () => {
            if (!this.isActive) return;

            // Get current rhythm value
            const rhythmValue = this.currentPattern[this.currentPatternIndex];

            if (rhythmValue > 0) {
                // Determine timing offset for different subdivisions
                let timing = 0;
                if (rhythmValue === 0.5) {
                    timing = beatDuration * 0.5; // Offbeat (8th note)
                } else if (rhythmValue === 0.25) {
                    timing = beatDuration * 0.25; // Early 16th note
                } else if (rhythmValue === 0.75) {
                    timing = beatDuration * 0.75; // Late 16th note
                }
                // rhythmValue === 1 means on-beat (timing = 0)

                setTimeout(() => {
                    if (this.isActive) {
                        this.playRhythmicNote(rhythmValue);
                    }
                }, timing);
            }

            // Advance pattern and beat counters
            this.currentPatternIndex = (this.currentPatternIndex + 1) % this.currentPattern.length;
            this.currentBeat++;
            this.phraseBeat++;

            // Pattern change logic - change every 1-2 patterns
            if (this.currentPatternIndex === 0) {
                const patternsCompleted = Math.floor(this.phraseBeat / this.beatsPerPattern);
                if (patternsCompleted > 0 && patternsCompleted % (1 + Math.floor(Math.random() * 2)) === 0) {
                    this.selectNewPattern();
                }
            }

            // Phrase structure - reset every 16 beats
            if (this.phraseBeat >= this.phraseLength) {
                this.phraseBeat = 0;
                this.currentBeat = 0;

                // Occasionally change tempo slightly
                if (Math.random() < 0.3) {
                    this.adjustTempo();
                }
            }

            // Schedule next beat
            if (this.isActive) {
                this.beatInterval = setTimeout(playBeat, beatDuration);
            }
        };

        // Start after a short delay
        this.beatInterval = setTimeout(playBeat, 500);
    }

    playRhythmicNote(rhythmValue = 1) {
        const note = this.selectNextNote();
        if (!note) return;

        // Add to recent notes for variety
        this.recentNotes.push(note);
        if (this.recentNotes.length > this.maxRecentNotes) {
            this.recentNotes.shift();
        }

        // Track for visualization
        if (typeof activeNotes !== 'undefined') {
            if (!activeNotes[note]) {
                activeNotes[note] = { count: 1, type: 'rhythmic' };
            } else {
                activeNotes[note].count++;
            }
        }

        try {
            // Vary note duration and velocity based on rhythm timing
            let noteDuration = 0.15 + Math.random() * 0.2; // Base: 0.15-0.35 seconds
            let velocity = 0.7 + Math.random() * 0.3; // Base: 0.7-1.0

            if (rhythmValue === 1) {
                // On-beat: longer, stronger
                noteDuration *= 1.8;
                velocity *= 1.0;
            } else if (rhythmValue === 0.5) {
                // Offbeat: medium length, slightly softer
                noteDuration *= 1.3;
                velocity *= 0.85;
            } else if (rhythmValue === 0.25 || rhythmValue === 0.75) {
                // 16th subdivisions: shorter, lighter
                noteDuration *= 0.9;
                velocity *= 0.7;
            }

            this.synth.triggerAttackRelease(note, noteDuration, undefined, velocity);

        } catch (error) {
            console.debug("Rhythmic piano playback error:", error.message);
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
        }, 1000);
    }

    selectNextNote() {
        if (this.preferredRange.length === 0) return null;

        // Create pool of available notes (excluding recent ones)
        const availableNotes = this.preferredRange.filter(note =>
            !this.recentNotes.includes(note)
        );

        // If we've used too many notes, allow some recent ones back
        let notePool = availableNotes.length > 2 ? availableNotes : this.preferredRange;

        // Prefer notes that create good melodic movement
        if (this.recentNotes.length > 0) {
            const lastNote = this.recentNotes[this.recentNotes.length - 1];
            const lastNoteIndex = this.preferredRange.indexOf(lastNote);

            if (lastNoteIndex !== -1) {
                // Prefer notes that are 2-4 steps away for good melodic motion
                const preferredNotes = notePool.filter(note => {
                    const noteIndex = this.preferredRange.indexOf(note);
                    const distance = Math.abs(noteIndex - lastNoteIndex);
                    return distance >= 2 && distance <= 4;
                });

                if (preferredNotes.length > 0) {
                    notePool = preferredNotes;
                }
            }
        }

        // Select random note from the filtered pool
        return notePool[Math.floor(Math.random() * notePool.length)];
    }

    adjustTempo() {
        // Slightly adjust tempo for musical interest
        const tempoVariation = 5; // ±5 BPM
        const oldTempo = this.tempo;
        this.tempo = Math.max(80, Math.min(120,
            this.tempo + (Math.random() - 0.5) * tempoVariation * 2
        ));

        if (Math.abs(this.tempo - oldTempo) > 1) {
            console.debug(`Rhythmic Piano: Tempo adjusted from ${oldTempo} to ${this.tempo} BPM`);
        }
    }

    stop() {
        super.stop();

        if (this.beatInterval) {
            clearTimeout(this.beatInterval);
            this.beatInterval = null;
        }

        // Reset state
        this.currentBeat = 0;
        this.phraseBeat = 0;
        this.currentPatternIndex = 0;
        this.recentNotes = [];

        console.debug("Rhythmic Piano stopped");
    }

    // Override the parent's melody system since we use our own rhythmic system
    startMelodicPhrases() {
        // Don't use the parent's random phrase system
        // Our rhythmic system handles all timing
    }

    playMelodicSequence(melody) {
        // Don't use the parent's sequence system
        // Our rhythmic system handles note playback
    }

    dispose() {
        this.stop();
        super.dispose();
    }
}

class AlgorithmicMelodyInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Algorithmic Melody');

        // Pattern systems
        this.patterns = {};
        this.sequencers = [];
        this.currentScale = [];
        this.scaleNotes = [];

        // Algorithmic parameters
        this.complexity = 0.6;
        this.polyrhythmAmount = 0.4;
        this.glitchAmount = 0.3;
        this.evolutionRate = 0.2;

        // Pattern lengths for polyrhythm
        this.patternLengths = [16, 12, 9]; // Creates interesting polyrhythmic interactions

        // Evolution timing
        this.evolutionTimeout = null;
        this.evolutionInterval = 15000; // Evolve every 15 seconds

        // Tone.js sequences
        this.toneSequences = [];
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        // Primary FM synth for melodic content
        this.fmSynth = new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 12,
            detune: 0,
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
            modulation: { type: "square" },
            modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.6, release: 0.5 },
            volume: -8
        });

        // Secondary synth for polyrhythmic texture
        this.polySynth = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.4 },
            volume: -12
        });

        // Glitch/percussion synth for algorithmic hits
        this.glitchSynth = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6,
            oscillator: { type: "sine" },
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.8 },
            volume: -15
        });

        // Effects chain inspired by the original
        const algorithmicFilter = new Tone.Filter({
            frequency: 2000,
            type: "lowpass",
            rolloff: -12,
            Q: 2
        });

        const algorithmicDelay = new Tone.PingPongDelay({
            delayTime: "8n.",
            feedback: 0.4,
            wet: 0.3
        });

        const subtleDistortion = new Tone.Distortion({
            distortion: 0.15,
            wet: 0.2
        });

        const chorus = new Tone.Chorus({
            frequency: 0.3,
            delayTime: 3,
            depth: 0.4,
            wet: 0.3
        }).start();

        this.reverbNode = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount,
            preDelay: 0.03,
            roomSize: 0.7
        });

        // Connect signal chain
        this.fmSynth.connect(subtleDistortion);
        this.polySynth.connect(algorithmicFilter);
        this.glitchSynth.connect(algorithmicDelay);

        subtleDistortion.connect(chorus);
        algorithmicFilter.connect(chorus);
        algorithmicDelay.connect(chorus);

        chorus.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        this.synth = this.fmSynth; // Main synth reference for parent class compatibility

        this.effects.push(
            this.polySynth, this.glitchSynth, algorithmicFilter,
            algorithmicDelay, subtleDistortion, chorus, this.reverbNode
        );
    }

    start(scale, melodicPattern) {
        super.start(scale, melodicPattern);

        this.currentScale = scale;
        this.extractScaleNotes();
        this.generateAlgorithmicPatterns();
        this.startSequencers();
        this.scheduleEvolution();
    }

    extractScaleNotes() {
        // Extract just the note names and octaves for algorithmic use
        this.scaleNotes = this.currentScale.map(note => ({
            name: note.slice(0, -1),
            octave: parseInt(note.slice(-1)),
            fullNote: note
        }));
    }

    generateAlgorithmicPatterns() {
        this.patterns = {
            primary: this.generateMelodicPattern(this.patternLengths[0], this.complexity),
            secondary: this.generatePolyrhythmicPattern(this.patternLengths[1], this.complexity * 0.7),
            tertiary: this.generatePolyrhythmicPattern(this.patternLengths[2], this.complexity * 0.5),
            glitch: this.generateGlitchPattern(32, this.glitchAmount)
        };

        console.debug('Algorithmic patterns generated:', {
            primaryLength: this.patterns.primary.length,
            secondaryLength: this.patterns.secondary.length,
            tertiaryLength: this.patterns.tertiary.length
        });
    }

    generateMelodicPattern(length, density) {
        const pattern = [];
        let lastNoteIndex = Math.floor(this.scaleNotes.length / 2);

        for (let i = 0; i < length; i++) {
            const shouldTrigger = Math.random() < density;

            if (shouldTrigger && this.scaleNotes.length > 0) {
                // Algorithmic note selection with melodic movement
                const movement = Math.floor(Math.random() * 7) - 3; // -3 to +3 scale steps
                let noteIndex = Math.max(0, Math.min(this.scaleNotes.length - 1, lastNoteIndex + movement));

                // Occasional octave shifts for interest
                let octave = this.scaleNotes[noteIndex].octave;
                if (Math.random() < 0.2) {
                    octave += Math.random() < 0.5 ? -1 : 1;
                    octave = Math.max(2, Math.min(6, octave));
                }

                pattern.push({
                    trigger: true,
                    note: this.scaleNotes[noteIndex].name + octave,
                    velocity: 0.4 + Math.random() * 0.5,
                    duration: this.getAlgorithmicDuration(),
                    probability: 0.6 + Math.random() * 0.3
                });

                lastNoteIndex = noteIndex;
            } else {
                pattern.push({
                    trigger: false,
                    note: null,
                    velocity: 0,
                    duration: 0,
                    probability: 0
                });
            }
        }

        return pattern;
    }

    generatePolyrhythmicPattern(length, density) {
        const pattern = [];

        for (let i = 0; i < length; i++) {
            if (Math.random() < density && this.scaleNotes.length > 0) {
                const randomNote = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];
                let octave = randomNote.octave;

                // Polyrhythmic patterns tend to use higher octaves
                if (Math.random() < 0.4) {
                    octave = Math.min(6, octave + 1);
                }

                pattern.push({
                    trigger: true,
                    note: randomNote.name + octave,
                    velocity: 0.2 + Math.random() * 0.4,
                    duration: "16n",
                    probability: 0.5 + Math.random() * 0.4
                });
            } else {
                pattern.push({
                    trigger: false,
                    note: null,
                    velocity: 0,
                    duration: 0,
                    probability: 0
                });
            }
        }

        return pattern;
    }

    generateGlitchPattern(length, density) {
        const pattern = [];

        for (let i = 0; i < length; i++) {
            if (Math.random() < density) {
                // Generate glitch frequencies that relate to our scale
                const baseFreq = 220; // A3
                const glitchFreq = baseFreq * Math.pow(2, Math.random() * 3); // Up to 3 octaves higher

                pattern.push({
                    trigger: true,
                    frequency: glitchFreq,
                    velocity: 0.3 + Math.random() * 0.4,
                    duration: 0.05 + Math.random() * 0.1,
                    probability: 0.4 + Math.random() * 0.5
                });
            } else {
                pattern.push({
                    trigger: false,
                    frequency: 0,
                    velocity: 0,
                    duration: 0,
                    probability: 0
                });
            }
        }

        return pattern;
    }

    getAlgorithmicDuration() {
        const durations = ["32n", "16n", "16n.", "8n", "8n.", "4n"];
        const weights = [0.1, 0.3, 0.2, 0.2, 0.15, 0.05]; // Favor shorter notes

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return durations[i];
            }
        }

        return "16n"; // Fallback
    }

    startSequencers() {
        if (!this.isActive) return;

        // Primary melodic sequencer
        const primarySequence = new Tone.Sequence((time, step) => {
            const pattern = this.patterns.primary[step % this.patterns.primary.length];
            if (pattern.trigger && Math.random() < pattern.probability) {
                this.triggerMelodicNote(this.fmSynth, pattern, time);
            }
        }, Array.from({length: this.patterns.primary.length}, (_, i) => i), "8n");

        // Secondary polyrhythmic sequencer
        const secondarySequence = new Tone.Sequence((time, step) => {
            const pattern = this.patterns.secondary[step % this.patterns.secondary.length];
            if (pattern.trigger && Math.random() < pattern.probability) {
                this.triggerMelodicNote(this.polySynth, pattern, time);
            }
        }, Array.from({length: this.patterns.secondary.length}, (_, i) => i), "16n");

        // Tertiary polyrhythmic sequencer
        const tertiarySequence = new Tone.Sequence((time, step) => {
            const pattern = this.patterns.tertiary[step % this.patterns.tertiary.length];
            if (pattern.trigger && Math.random() < pattern.probability) {
                this.triggerMelodicNote(this.polySynth, pattern, time);
            }
        }, Array.from({length: this.patterns.tertiary.length}, (_, i) => i), "8n.");

        // Glitch sequencer
        const glitchSequence = new Tone.Sequence((time, step) => {
            const pattern = this.patterns.glitch[step % this.patterns.glitch.length];
            if (pattern.trigger && Math.random() < pattern.probability) {
                this.glitchSynth.triggerAttackRelease(pattern.frequency, pattern.duration, time, pattern.velocity);
            }
        }, Array.from({length: this.patterns.glitch.length}, (_, i) => i), "32n");

        // Store sequences and start them
        this.toneSequences = [primarySequence, secondarySequence, tertiarySequence, glitchSequence];
        this.toneSequences.forEach(seq => {
            seq.start();
        });

        console.debug('Algorithmic sequencers started');
    }

    triggerMelodicNote(synth, pattern, time) {
        if (!pattern.note) return;

        // Track for visualization
        if (typeof activeNotes !== 'undefined') {
            if (!activeNotes[pattern.note]) {
                activeNotes[pattern.note] = { count: 1, type: 'algorithmic' };
            } else {
                activeNotes[pattern.note].count++;
            }
        }

        try {
            synth.triggerAttackRelease(pattern.note, pattern.duration, time, pattern.velocity);
        } catch (error) {
            console.debug("Algorithmic note playback error:", error.message);
        }

        // Clean up note tracking
        setTimeout(() => {
            if (typeof isPlaying !== 'undefined' && isPlaying &&
                typeof activeNotes !== 'undefined' && activeNotes[pattern.note]) {
                activeNotes[pattern.note].count--;
                if (activeNotes[pattern.note].count <= 0) {
                    delete activeNotes[pattern.note];
                }
            }
        }, 1000);
    }

    scheduleEvolution() {
        if (!this.isActive) return;

        this.evolutionTimeout = setTimeout(() => {
            if (this.isActive) {
                this.evolvePatterns();
                this.scheduleEvolution(); // Schedule next evolution
            }
        }, this.evolutionInterval);
    }

    evolvePatterns() {
        console.debug('Evolving algorithmic patterns...');

        // Evolve primary pattern
        for (let i = 0; i < this.patterns.primary.length; i++) {
            if (Math.random() < this.evolutionRate) {
                if (Math.random() < 0.7) {
                    // Modify existing note
                    if (this.patterns.primary[i].trigger) {
                        const currentNote = this.patterns.primary[i];
                        const noteIndex = this.scaleNotes.findIndex(n => n.fullNote === currentNote.note);
                        if (noteIndex !== -1) {
                            const movement = Math.floor(Math.random() * 5) - 2; // -2 to +2
                            const newIndex = Math.max(0, Math.min(this.scaleNotes.length - 1, noteIndex + movement));
                            currentNote.note = this.scaleNotes[newIndex].fullNote;
                        }
                    }
                } else {
                    // Toggle trigger state
                    this.patterns.primary[i].trigger = !this.patterns.primary[i].trigger;
                    if (this.patterns.primary[i].trigger) {
                        const randomNote = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];
                        this.patterns.primary[i].note = randomNote.fullNote;
                        this.patterns.primary[i].velocity = 0.4 + Math.random() * 0.5;
                        this.patterns.primary[i].duration = this.getAlgorithmicDuration();
                        this.patterns.primary[i].probability = 0.6 + Math.random() * 0.3;
                    }
                }
            }
        }

        // Evolve glitch pattern more frequently
        this.patterns.glitch = this.generateGlitchPattern(32, this.glitchAmount);

        console.debug('Pattern evolution complete');
    }

    stop() {
        super.stop();

        // Stop and dispose Tone.js sequences
        this.toneSequences.forEach(seq => {
            if (seq) {
                seq.stop();
                seq.dispose();
            }
        });
        this.toneSequences = [];

        // Clear evolution timeout
        if (this.evolutionTimeout) {
            clearTimeout(this.evolutionTimeout);
            this.evolutionTimeout = null;
        }

        console.debug('Algorithmic melody stopped');
    }

    // Override parent methods since we use our own system
    startMelodicPhrases() {
        // Don't use parent's phrase system - we have our own sequencers
    }

    playMelodicSequence(melody) {
        // Don't use parent's sequence system - we have algorithmic patterns
    }

    dispose() {
        this.stop();
        super.dispose();
    }

    // Public methods for adjusting algorithmic parameters
    setComplexity(value) {
        this.complexity = Math.max(0.1, Math.min(1.0, value));
        console.debug(`Algorithmic complexity set to: ${this.complexity}`);
    }

    setPolyrhythmAmount(value) {
        this.polyrhythmAmount = Math.max(0.0, Math.min(1.0, value));
        console.debug(`Polyrhythm amount set to: ${this.polyrhythmAmount}`);
    }

    setGlitchAmount(value) {
        this.glitchAmount = Math.max(0.0, Math.min(1.0, value));
        console.debug(`Glitch amount set to: ${this.glitchAmount}`);
    }

    setEvolutionRate(value) {
        this.evolutionRate = Math.max(0.0, Math.min(1.0, value));
        console.debug(`Evolution rate set to: ${this.evolutionRate}`);
    }

    // Trigger immediate evolution
    triggerEvolution() {
        if (this.isActive) {
            this.evolvePatterns();
        }
    }
}

class DeepBassMelodicInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Deep Bass Melodic');
        this.bassVariants = [
            'subBass', 'resonantBass', 'fmBass', 'uprightBass', 'synthBass'
        ];
        this.currentVariant = 'subBass';
        this.variantChangeInterval = null;
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        // Create multiple bass synthesis approaches
        this.createBassSynths();

        // Deep bass processing chain
        this.createBassEffectsChain(masterVolume);

        // Start with sub-bass variant
        this.selectBassVariant('subBass');

        // Schedule variant changes for variety
        this.scheduleVariantChanges();
    }

    createBassSynths() {
        // 1. SUB-BASS: Pure sine wave bass
        this.subBassSynth = new Tone.MonoSynth({
            oscillator: {
                type: "sine",
                detune: 0
            },
            filter: {
                type: "lowpass",
                frequency: 150,
                Q: 1
            },
            envelope: {
                attack: 0.3,
                decay: 1.5,
                sustain: 0.8,
                release: 2.5
            },
            volume: 5  // Boost for deep bass
        });

        // 2. RESONANT BASS: Filtered sawtooth with resonance
        this.resonantBassSynth = new Tone.MonoSynth({
            oscillator: {
                type: "sawtooth",
                detune: -5
            },
            filter: {
                type: "lowpass",
                frequency: 200,
                Q: 8  // High resonance
            },
            envelope: {
                attack: 0.1,
                decay: 0.8,
                sustain: 0.6,
                release: 1.8
            },
            volume: 2
        });

        // 3. FM BASS: Rich harmonic content
        this.fmBassSynth = new Tone.FMSynth({
            harmonicity: 0.5,  // Lower harmonic for deeper sound
            modulationIndex: 15, // High modulation for richness
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.2,
                decay: 1.2,
                sustain: 0.7,
                release: 2.0
            },
            modulation: { type: "triangle" },
            modulationEnvelope: {
                attack: 0.1,
                decay: 0.8,
                sustain: 0.4,
                release: 1.5
            },
            volume: 0
        });

        // 4. UPRIGHT BASS: Plucked string simulation
        this.uprightBassSynth = new Tone.PluckSynth({
            attackNoise: 2,     // More attack noise for pluck character
            dampening: 2000,    // Lower dampening for longer sustain
            resonance: 0.9,     // High resonance for woody character
            volume: 8
        });

        // 5. SYNTH BASS: Modern electronic bass
        this.synthBassSynth = new Tone.MonoSynth({
            oscillator: {
                type: "triangle",
                detune: 3
            },
            filter: {
                type: "lowpass",
                frequency: 300,
                Q: 4
            },
            envelope: {
                attack: 0.05,
                decay: 0.3,
                sustain: 0.9,
                release: 1.0
            },
            volume: 3
        });

        this.bassSynths = {
            subBass: this.subBassSynth,
            resonantBass: this.resonantBassSynth,
            fmBass: this.fmBassSynth,
            uprightBass: this.uprightBassSynth,
            synthBass: this.synthBassSynth
        };
    }

    createBassEffectsChain(masterVolume) {
        // Sub-harmonic generator for extra depth
        this.subHarmonic = new Tone.Gain(0.3);

        // Tube-style saturation for warmth
        this.bassDistortion = new Tone.Distortion({
            distortion: 0.1,
            wet: 0.4
        });

        // Multi-stage filtering for sculpting
        this.bassFilter1 = new Tone.Filter({
            type: "highpass",
            frequency: 30,  // Remove sub-sonic rumble
            Q: 0.5
        });

        this.bassFilter2 = new Tone.Filter({
            type: "lowpass",
            frequency: 400, // Keep it bassy
            Q: 2
        });

        // Compressor for punch and consistency
        this.bassCompressor = new Tone.Compressor({
            threshold: -15,
            ratio: 6,
            attack: 0.005,
            release: 0.1
        });

        // Chorus for width and movement
        this.bassChorus = new Tone.Chorus({
            frequency: 0.3,
            delayTime: 4,
            depth: 0.2,
            wet: 0.25
        }).start();

        // Deep reverb for space
        this.bassReverb = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount || 0.4,
            preDelay: 0.05,
            roomSize: 0.8
        });

        // Connect the effects chain
        // (Individual synths connect to this chain in selectBassVariant)
        this.bassFilter1.connect(this.bassDistortion);
        this.bassDistortion.connect(this.bassFilter2);
        this.bassFilter2.connect(this.bassCompressor);
        this.bassCompressor.connect(this.bassChorus);
        this.bassChorus.connect(this.bassReverb);
        this.bassReverb.connect(masterVolume);

        this.effects.push(
            this.bassDistortion, this.bassFilter1, this.bassFilter2,
            this.bassCompressor, this.bassChorus, this.bassReverb
        );
    }

    selectBassVariant(variantName) {
        console.debug(`Switching to bass variant: ${variantName}`);

        // Disconnect all synths first
        Object.values(this.bassSynths).forEach(synth => {
            try {
                synth.disconnect();
            } catch (e) {}
        });

        // Connect the selected variant
        const selectedSynth = this.bassSynths[variantName];
        if (selectedSynth) {
            selectedSynth.connect(this.bassFilter1);
            this.synth = selectedSynth; // Set for parent class compatibility
            this.currentVariant = variantName;

            // Apply variant-specific filter settings
            this.applyVariantSettings(variantName);
        }
    }

    applyVariantSettings(variantName) {
        switch (variantName) {
            case 'subBass':
                this.bassFilter2.frequency.value = 120;
                this.bassFilter2.Q.value = 1;
                this.bassDistortion.wet.value = 0.2;
                break;

            case 'resonantBass':
                this.bassFilter2.frequency.value = 250;
                this.bassFilter2.Q.value = 6;
                this.bassDistortion.wet.value = 0.4;
                break;

            case 'fmBass':
                this.bassFilter2.frequency.value = 300;
                this.bassFilter2.Q.value = 3;
                this.bassDistortion.wet.value = 0.3;
                break;

            case 'uprightBass':
                this.bassFilter2.frequency.value = 400;
                this.bassFilter2.Q.value = 2;
                this.bassDistortion.wet.value = 0.5; // More character
                break;

            case 'synthBass':
                this.bassFilter2.frequency.value = 350;
                this.bassFilter2.Q.value = 4;
                this.bassDistortion.wet.value = 0.35;
                break;
        }
    }

    scheduleVariantChanges() {
        if (this.variantChangeInterval) {
            clearTimeout(this.variantChangeInterval);
        }

        // Change variant every 20-40 seconds for variety
        const changeInterval = (20 + Math.random() * 20) * 1000;

        this.variantChangeInterval = setTimeout(() => {
            if (this.isActive) {
                const currentIndex = this.bassVariants.indexOf(this.currentVariant);
                let nextVariant;

                // Pick a different variant
                do {
                    nextVariant = this.bassVariants[Math.floor(Math.random() * this.bassVariants.length)];
                } while (nextVariant === this.currentVariant && this.bassVariants.length > 1);

                this.selectBassVariant(nextVariant);
                this.scheduleVariantChanges(); // Schedule next change
            }
        }, changeInterval);
    }

    playMelodicSequence(melody) {
        // Focus on lower octaves for bass melodies
        const bassNoteDuration = 2.5 + Math.random() * 1.5; // Longer notes for bass
        const bassNoteSpacing = 1.8 + Math.random() * 0.8;  // Slower pacing

        // Transform melody to bass register and add some bass-specific variations
        const bassifiedMelody = this.createBassifiedMelody(melody);

        bassifiedMelody.forEach((noteData, index) => {
            let timing = index * bassNoteSpacing * 1000;
            timing += (Math.random() - 0.5) * 500; // Less timing chaos for bass

            setTimeout(() => {
                if (!this.isActive) return;

                const { note, duration, velocity } = noteData;

                // Track for visualization
                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'bass' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    // Different triggering for different bass types
                    this.triggerBassByVariant(note, duration, velocity);

                } catch (error) {
                    console.debug("Deep bass playback error:", error.message);
                }

                // Cleanup note tracking
                setTimeout(() => {
                    if (typeof isPlaying !== 'undefined' && isPlaying &&
                        typeof activeNotes !== 'undefined' && activeNotes[note]) {
                        activeNotes[note].count--;
                        if (activeNotes[note].count <= 0) {
                            delete activeNotes[note];
                        }
                    }
                }, duration * 1000 + 1000);
            }, timing);
        });
    }

    createBassifiedMelody(melody) {
        return melody.map(note => {
            // Convert to lower octaves (1-3 range primarily)
            const noteName = note.slice(0, -1);
            const originalOctave = parseInt(note.slice(-1));

            // Map to bass range
            let bassOctave;
            if (originalOctave >= 5) {
                bassOctave = 2; // High notes become deep bass
            } else if (originalOctave >= 4) {
                bassOctave = Math.random() < 0.7 ? 2 : 3; // Mid notes mostly bass
            } else {
                bassOctave = originalOctave <= 3 ? originalOctave : 3; // Keep bass notes
            }

            const bassNote = noteName + bassOctave;

            // Vary duration and velocity based on bass variant
            let duration = 2.5;
            let velocity = 0.8;

            switch (this.currentVariant) {
                case 'subBass':
                    duration = 3.5 + Math.random() * 2; // Very long sustains
                    velocity = 0.9 + Math.random() * 0.1;
                    break;

                case 'uprightBass':
                    duration = 1.5 + Math.random() * 1; // Shorter, more percussive
                    velocity = 0.7 + Math.random() * 0.3;
                    break;

                case 'resonantBass':
                    duration = 2 + Math.random() * 1.5;
                    velocity = 0.8 + Math.random() * 0.2;
                    break;

                case 'fmBass':
                    duration = 2.5 + Math.random() * 1.5;
                    velocity = 0.75 + Math.random() * 0.25;
                    break;

                case 'synthBass':
                    duration = 1.8 + Math.random() * 1.2;
                    velocity = 0.8 + Math.random() * 0.2;
                    break;
            }

            return { note: bassNote, duration, velocity };
        });
    }

    triggerBassByVariant(note, duration, velocity) {
        switch (this.currentVariant) {
            case 'uprightBass':
                // Pluck synth doesn't take duration parameter
                this.synth.triggerAttackRelease(note, "4n", undefined, velocity);
                break;

            default:
                // Standard triggering for other bass types
                this.synth.triggerAttackRelease(note, duration, undefined, velocity);
                break;
        }
    }

    stop() {
        super.stop();

        if (this.variantChangeInterval) {
            clearTimeout(this.variantChangeInterval);
            this.variantChangeInterval = null;
        }
    }

    dispose() {
        if (this.variantChangeInterval) {
            clearTimeout(this.variantChangeInterval);
            this.variantChangeInterval = null;
        }

        // Dispose all bass synths
        Object.values(this.bassSynths).forEach(synth => {
            if (synth && synth.dispose) {
                try {
                    synth.dispose();
                } catch (error) {
                    console.debug("Error disposing bass synth:", error);
                }
            }
        });

        super.dispose();
    }

    // Public method to manually change variant (for UI control if desired)
    changeBassVariant(variantName) {
        if (this.bassVariants.includes(variantName)) {
            this.selectBassVariant(variantName);
        }
    }

    getCurrentVariant() {
        return this.currentVariant;
    }

    getAvailableVariants() {
        return this.bassVariants.slice(); // Return a copy
    }
}

class ArpeggiatorInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Arpeggiator');

        // Arpeggiator-specific properties
        this.sequence = null;
        this.chordChangeTimeout = null;
        this.currentChordIndex = 0;
        this.delay = null;

        // Randomizable settings
        this.settings = {
            pattern: 'upDown',
            speed: 4, // 1-7 scale
            octaves: 2,
            chordProgression: 'simple',
            synthesis: 'piano',
            noteLength: 0.8,
            chordChangeRate: 8, // seconds
            arpeggioVolume: -8
        };

        // Available options for randomization
        this.patterns = ['up', 'down', 'upDown', 'downUp', 'random', 'cascade', 'bounce'];
        this.chordProgressions = ['simple', 'jazzy', 'mysterious', 'floating', 'epic'];
        this.synthesisTypes = ['piano', 'harp', 'pad', 'pluck'];
        this.speeds = ['2n', '4n', '4n.', '8n', '8n.', '16n', '16n.'];

        // Evolution system
        this.evolutionTimeout = null;
        this.evolutionInterval = 1000 * 150; // Change settings every 2.5 minutes

        console.log('🎹 Arpeggiator instrument created');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        console.log('🎹 Initializing arpeggiator instrument...');

        // Create delay effect for arpeggiator-specific character
        this.delay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.2,
            wet: 0.15
        });

        // Create reverb specific to arpeggiator
        this.reverbNode = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount,
            preDelay: 0.03
        });

        // Connect effects chain: delay -> reverb -> master
        this.delay.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        // Create initial synth
        this.createArpeggiatorSynth();

        // Randomize initial settings
        this.randomizeSettings();

        this.effects.push(this.delay, this.reverbNode);

        console.log('🎹 Arpeggiator initialized with random settings');
    }

    createArpeggiatorSynth() {
        if (this.synth) {
            this.synth.dispose();
        }

        try {
            switch (this.settings.synthesis) {
                case 'piano':
                    this.synth = new Tone.PolySynth(Tone.Synth, {
                        oscillator: { type: "triangle" },
                        envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 1 },
                        volume: this.settings.arpeggioVolume
                    });
                    break;

                case 'bells':
                    // MetalSynth works better as a single instance with manual polyphony
                    this.synth = new Tone.MetalSynth({
                        harmonicity: 2.1,
                        resonance: 2400,
                        modulationIndex: 15,
                        envelope: { attack: 0.001, decay: 1.5, sustain: 0.2, release: 3 },
                        volume: this.settings.arpeggioVolume - 15
                    });
                    break;

                case 'harp':
                    this.synth = new Tone.PolySynth(Tone.FMSynth, {
                        harmonicity: 1.5,
                        modulationIndex: 10,
                        oscillator: { type: "sine" },
                        envelope: { attack: 0.01, decay: 0.7, sustain: 0.1, release: 1 },
                        volume: this.settings.arpeggioVolume
                    });
                    break;

                case 'pad':
                    this.synth = new Tone.PolySynth(Tone.Synth, {
                        oscillator: { type: "sine" },
                        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 },
                        volume: this.settings.arpeggioVolume
                    });
                    break;

                case 'pluck':
                    // PluckSynth is monophonic, so we use it directly
                    this.synth = new Tone.PluckSynth({
                        attackNoise: 1,
                        dampening: 4000,
                        resonance: 0.7,
                        volume: this.settings.arpeggioVolume + 5
                    });
                    break;

                default:
                    // Fallback to piano if unknown synthesis type
                    console.warn(`🎹 Unknown synthesis type: ${this.settings.synthesis}, falling back to piano`);
                    this.settings.synthesis = 'piano';
                    this.synth = new Tone.PolySynth(Tone.Synth, {
                        oscillator: { type: "triangle" },
                        envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 1 },
                        volume: this.settings.arpeggioVolume
                    });
                    break;
            }

            // Connect to effects chain
            if (this.synth && this.delay) {
                this.synth.connect(this.delay);
            }

        } catch (error) {
            console.error('🎹 Error creating arpeggiator synth:', error);
            // Fallback to a simple synth
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 1 },
                volume: this.settings.arpeggioVolume
            });
            if (this.synth && this.delay) {
                this.synth.connect(this.delay);
            }
        }
    }

    randomizeSettings() {
        this.settings.pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
        this.settings.chordProgression = this.chordProgressions[Math.floor(Math.random() * this.chordProgressions.length)];
        this.settings.synthesis = this.synthesisTypes[Math.floor(Math.random() * this.synthesisTypes.length)];
        this.settings.speed = Math.floor(Math.random() * 7) + 1; // 1-7
        this.settings.octaves = Math.floor(Math.random() * 3) + 1; // 1-3 octaves
        this.settings.noteLength = 0.4 + Math.random() * 1.2; // 0.4-1.6 seconds
        this.settings.chordChangeRate = 6 + Math.random() * 8; // 6-14 seconds

        console.log('🎹 Randomized arpeggiator settings:', this.settings);
    }

    getChordProgressions() {
        // Convert your app's current scale to chord progressions
        if (!this.currentScale || this.currentScale.length === 0) {
            // Fallback chord progressions
            return {
                simple: [["C4", "E4", "G4"], ["G4", "B4", "D5"], ["A4", "C5", "E5"], ["F4", "A4", "C5"]],
                jazzy: [["D4", "F4", "A4"], ["G4", "B4", "D5"], ["C4", "E4", "G4"], ["A4", "C5", "E5"]],
                mysterious: [["C4", "Eb4", "G4"], ["Bb3", "D4", "F4"], ["Ab3", "C4", "Eb4"], ["Bb3", "D4", "F4"]],
                floating: [["C4", "E4", "G4"], ["D4", "F4", "A4"], ["E4", "G4", "B4"], ["D4", "F4", "A4"]],
                epic: [["A4", "C5", "E5"], ["F4", "A4", "C5"], ["C4", "E4", "G4"], ["G4", "B4", "D5"]]
            };
        }

        // Build chord progressions from the current scale
        const scale = this.currentScale;
        const chords = this.buildChordsFromScale(scale);

        return {
            simple: [chords[0], chords[4], chords[5], chords[3]], // I-V-vi-IV
            jazzy: [chords[1], chords[4], chords[0], chords[5]], // ii-V-I-vi
            mysterious: [chords[0], chords[6], chords[5], chords[6]], // i-VII-vi-VII
            floating: [chords[0], chords[1], chords[2], chords[1]], // I-ii-iii-ii
            epic: [chords[5], chords[3], chords[0], chords[4]] // vi-IV-I-V
        };
    }

    buildChordsFromScale(scale) {
        // Build triads from scale degrees
        const chords = [];
        const scaleNotes = scale.slice(0, 7); // Take first 7 notes for chord building

        for (let i = 0; i < 7; i++) {
            const root = scaleNotes[i];
            const third = scaleNotes[(i + 2) % 7];
            const fifth = scaleNotes[(i + 4) % 7];
            chords.push([root, third, fifth]);
        }

        return chords;
    }

    generateArpeggioPattern(chord) {
        let notes = [...chord];

        // Extend across octaves
        for (let oct = 1; oct < this.settings.octaves; oct++) {
            chord.forEach(note => {
                const noteName = note.slice(0, -1);
                const octave = parseInt(note.slice(-1)) + oct;
                if (octave <= 6) {
                    notes.push(noteName + octave);
                }
            });
        }

        // Apply pattern
        switch (this.settings.pattern) {
            case 'up':
                return notes.sort((a, b) => this.noteToMidi(a) - this.noteToMidi(b));

            case 'down':
                return notes.sort((a, b) => this.noteToMidi(b) - this.noteToMidi(a));

            case 'upDown':
                const up = notes.sort((a, b) => this.noteToMidi(a) - this.noteToMidi(b));
                const down = [...up].reverse().slice(1, -1);
                return [...up, ...down];

            case 'downUp':
                const down2 = notes.sort((a, b) => this.noteToMidi(b) - this.noteToMidi(a));
                const up2 = [...down2].reverse().slice(1, -1);
                return [...down2, ...up2];

            case 'random':
                return this.shuffleArray([...notes]);

            case 'cascade':
                // Play each octave in sequence
                const octaveGroups = {};
                notes.forEach(note => {
                    const oct = parseInt(note.slice(-1));
                    if (!octaveGroups[oct]) octaveGroups[oct] = [];
                    octaveGroups[oct].push(note);
                });
                let cascade = [];
                Object.keys(octaveGroups).sort().forEach(oct => {
                    cascade.push(...octaveGroups[oct].sort((a, b) => this.noteToMidi(a) - this.noteToMidi(b)));
                });
                return cascade;

            case 'bounce':
                // Bounce between high and low
                const sorted = notes.sort((a, b) => this.noteToMidi(a) - this.noteToMidi(b));
                let bounce = [];
                for (let i = 0; i < sorted.length; i++) {
                    if (i % 2 === 0) {
                        bounce.push(sorted[Math.floor(i / 2)]);
                    } else {
                        bounce.push(sorted[sorted.length - 1 - Math.floor(i / 2)]);
                    }
                }
                return bounce;

            default:
                return notes;
        }
    }

    noteToMidi(note) {
        const noteMap = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };
        const octave = parseInt(note.slice(-1));
        const noteName = note.slice(0, -1);
        return (octave + 1) * 12 + noteMap[noteName];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    start(scale, melodicPattern) {
        super.start(scale, melodicPattern);

        console.log('🎹 Starting arpeggiator with scale:', scale);

        // Start transport if needed
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }

        this.startArpeggiatorSequence();
        this.scheduleChordChanges();
        this.scheduleEvolution();
    }

    startArpeggiatorSequence() {
        if (!this.isActive) return;

        const progressions = this.getChordProgressions();
        const currentProgression = progressions[this.settings.chordProgression];
        const currentChord = currentProgression[this.currentChordIndex];
        const pattern = this.generateArpeggioPattern(currentChord);

        console.log(`🎹 Starting arpeggio sequence: ${this.settings.pattern} pattern with ${pattern.length} notes`);

        // Clean up existing sequence
        if (this.sequence) {
            this.sequence.stop();
            this.sequence.dispose();
        }

        this.sequence = new Tone.Sequence((time, note) => {
            if (this.isActive && note && this.synth) {
                // Track active notes for visualization
                if (typeof activeNotes !== 'undefined') {
                    if (!activeNotes[note]) {
                        activeNotes[note] = { count: 1, type: 'arpeggio' };
                    } else {
                        activeNotes[note].count++;
                    }
                }

                try {
                    this.synth.triggerAttackRelease(note, this.settings.noteLength, time);
                } catch (error) {
                    console.warn('🎹 Arpeggiator note trigger error:', error.message);
                    // Continue playing, just skip this note
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
                }, this.settings.noteLength * 1000 + 500);
            }
        }, pattern, this.speeds[this.settings.speed - 1]);

        this.sequence.loop = true;
        this.sequence.start(0);
    }

    scheduleChordChanges() {
        if (this.chordChangeTimeout) {
            clearTimeout(this.chordChangeTimeout);
        }

        this.chordChangeTimeout = setTimeout(() => {
            if (this.isActive) {
                const progressions = this.getChordProgressions();
                const currentProgression = progressions[this.settings.chordProgression];
                this.currentChordIndex = (this.currentChordIndex + 1) % currentProgression.length;

                console.log(`🎹 Chord change to index ${this.currentChordIndex}`);
                this.startArpeggiatorSequence();
                this.scheduleChordChanges();
            }
        }, this.settings.chordChangeRate * 1000);
    }

    scheduleEvolution() {
        if (this.evolutionTimeout) {
            clearTimeout(this.evolutionTimeout);
        }

        this.evolutionTimeout = setTimeout(() => {
            if (this.isActive) {
                console.log('🎹 Evolving arpeggiator settings...');
                this.evolveSettings();
                this.scheduleEvolution();
            }
        }, this.evolutionInterval);
    }

    evolveSettings() {
        // Randomly change 1-2 settings
        const settingsToChange = Math.floor(Math.random() * 2) + 1;
        const changableSettings = ['pattern', 'speed', 'octaves', 'noteLength'];

        for (let i = 0; i < settingsToChange; i++) {
            const settingToChange = changableSettings[Math.floor(Math.random() * changableSettings.length)];

            switch (settingToChange) {
                case 'pattern':
                    const oldPattern = this.settings.pattern;
                    do {
                        this.settings.pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
                    } while (this.settings.pattern === oldPattern);
                    break;

                case 'speed':
                    this.settings.speed = Math.max(1, Math.min(7, this.settings.speed + (Math.random() < 0.5 ? -1 : 1)));
                    break;

                case 'octaves':
                    this.settings.octaves = Math.max(1, Math.min(3, this.settings.octaves + (Math.random() < 0.5 ? -1 : 1)));
                    break;

                case 'noteLength':
                    this.settings.noteLength = Math.max(0.2, Math.min(2.0, this.settings.noteLength + (Math.random() - 0.5) * 0.4));
                    break;
            }
        }

        // Occasionally change synthesis type (less frequent)
        if (Math.random() < 0.3) {
            const oldSynthesis = this.settings.synthesis;
            do {
                this.settings.synthesis = this.synthesisTypes[Math.floor(Math.random() * this.synthesisTypes.length)];
            } while (this.settings.synthesis === oldSynthesis);

            try {
                this.createArpeggiatorSynth();
                console.log(`🎹 Synthesis evolved to: ${this.settings.synthesis}`);
            } catch (error) {
                console.warn(`🎹 Failed to evolve to ${this.settings.synthesis}, reverting to ${oldSynthesis}:`, error.message);
                this.settings.synthesis = oldSynthesis;
                this.createArpeggiatorSynth();
            }
        }

        // Restart sequence with new settings
        try {
            this.startArpeggiatorSequence();
            console.log('🎹 Settings evolved:', this.settings);
        } catch (error) {
            console.error('🎹 Error restarting sequence after evolution:', error);
        }
    }

    stop() {
        super.stop();

        console.log('🎹 Stopping arpeggiator...');

        if (this.sequence) {
            this.sequence.stop();
            this.sequence.dispose();
            this.sequence = null;
        }

        if (this.chordChangeTimeout) {
            clearTimeout(this.chordChangeTimeout);
            this.chordChangeTimeout = null;
        }

        if (this.evolutionTimeout) {
            clearTimeout(this.evolutionTimeout);
            this.evolutionTimeout = null;
        }

        this.currentChordIndex = 0;
    }

    dispose() {
        this.stop();

        // Dispose arpeggiator-specific effects
        if (this.delay) {
            this.delay.dispose();
        }

        super.dispose();
    }

    // Override parent's melody system since we use our own sequencer
    startMelodicPhrases() {
        // Don't use parent's phrase system - we have our own arpeggiator
    }

    playMelodicSequence(melody) {
        // Don't use parent's sequence system - we have arpeggiator patterns
    }

    // Get current settings for debugging/display
    getCurrentSettings() {
        return {
            pattern: this.settings.pattern,
            synthesis: this.settings.synthesis,
            chordProgression: this.settings.chordProgression,
            speed: this.speeds[this.settings.speed - 1],
            octaves: this.settings.octaves,
            noteLength: this.settings.noteLength.toFixed(1) + 's',
            chordChangeRate: this.settings.chordChangeRate.toFixed(1) + 's'
        };
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
        this.register('rhythmic-piano', RhythmicPianoInstrument);
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

        this.register('algorithmic-melody', AlgorithmicMelodyInstrument);
        this.register('deep-bass-melodic', DeepBassMelodicInstrument);

        this.register('arpeggiator', ArpeggiatorInstrument);
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
