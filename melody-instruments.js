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

class GlitchElectronicInstrument extends BaseMelodyInstrument {
    constructor() {
        super('Glitch Electronic');
    }

    async initialize(masterVolume, globalReverb) {
        super.initialize(masterVolume, globalReverb);

        this.synth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 2.1,
            modulationIndex: 8,
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.4, release: 2 },
            modulation: { type: "square" },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.5 },
            volume: 5
        });

        // Complex Glitch effect chain
        const glitchBitCrusher = new Tone.BitCrusher({ bits: 6, wet: 0.3 });
        const glitchRingMod = new Tone.FrequencyShifter({ frequency: 47, wet: 0.25 });
        const glitchPhaser = new Tone.Phaser({ frequency: 0.7, depth: 0.8, baseFrequency: 400, wet: 0.6 });
        const glitchChopDelay = new Tone.PingPongDelay({ delayTime: "16n", feedback: 0.6, wet: 0.4 });
        const glitchFilteredDelay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.5, wet: 0.3 });
        const glitchFilter = new Tone.Filter({ frequency: 1200, type: "bandpass", Q: 8, rolloff: -24 });
        const glitchFilterLFO = new Tone.LFO({ frequency: 0.13, min: 400, max: 2400, type: "triangle" });
        const glitchDistortion = new Tone.Distortion({ distortion: 0.4, wet: 0.3 });
        const glitchChorus = new Tone.Chorus({ frequency: 1.2, delayTime: 2, depth: 0.4, wet: 0.35 }).start();
        const glitchCompressor = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.001, release: 0.2 });

        this.reverbNode = new Tone.Reverb({
            decay: 8,
            wet: this.config.reverbAmount * 0.8,
            preDelay: 0.02,
            roomSize: 0.7
        });

        // Connect complex chain
        this.synth.connect(glitchBitCrusher);
        glitchBitCrusher.connect(glitchRingMod);
        glitchRingMod.connect(glitchDistortion);
        glitchDistortion.connect(glitchPhaser);
        glitchPhaser.connect(glitchChopDelay);
        glitchChopDelay.connect(glitchFilteredDelay);
        glitchFilteredDelay.connect(glitchFilter);
        glitchFilter.connect(glitchChorus);
        glitchChorus.connect(glitchCompressor);
        glitchCompressor.connect(this.reverbNode);
        this.reverbNode.connect(masterVolume);

        glitchFilterLFO.connect(glitchFilter.frequency);
        glitchFilterLFO.start();

        this.effects.push(glitchBitCrusher, glitchRingMod, glitchPhaser, glitchChopDelay,
            glitchFilteredDelay, glitchFilter, glitchFilterLFO, glitchDistortion,
            glitchChorus, glitchCompressor, this.reverbNode);

        this.synth.volume.value = this.config.volume;
    }

    playMelodicSequence(melody) {
        const noteDuration = 0.8;
        const noteSpacing = 0.9;

        // Modify melody for Glitch character
        const modifiedMelody = melody.map(note => {
            if (Math.random() < 0.3) {
                const noteBase = note.slice(0, -1);
                const octave = parseInt(note.slice(-1));
                const newOctave = Math.random() < 0.5 ?
                    Math.max(2, octave - 1) :
                    Math.min(6, octave + 1);
                return noteBase + newOctave;
            }
            return note;
        });

        modifiedMelody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() * 0.6 - 0.3) * 1000; // More timing variation
            timing = Math.max(0, timing);

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