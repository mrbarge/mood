// ===============================================
// AUDIO CHAIN SYSTEM - STANDALONE FILE
// audio-chain-system.js
// ===============================================

// ===============================================
// AUDIO CONSTANTS & PRESETS
// ===============================================

const ENVELOPE_PRESETS = {
    SLOW_ETHEREAL: { attack: 8, decay: 2, sustain: 0.8, release: 12 },
    VERY_SLOW_ETHEREAL: { attack: 10, decay: 3, sustain: 0.9, release: 15 },
    ULTRA_SLOW_ETHEREAL: { attack: 12, decay: 3, sustain: 0.95, release: 20 },
    FAST_TRANSIENT: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 },
    MEDIUM_SUSTAIN: { attack: 2, decay: 1, sustain: 0.5, release: 4 },
    LONG_SUSTAIN: { attack: 3, decay: 2, sustain: 0.8, release: 8 },
    CATHEDRAL: { attack: 8, decay: 3, sustain: 0.9, release: 18 },
    GLACIAL: { attack: 12, decay: 3, sustain: 0.95, release: 20 },
    ORCHESTRAL: { attack: 10, decay: 4, sustain: 0.8, release: 15 },
    CONTINUOUS_DRONE: { attack: 8, decay: 0, sustain: 1, release: 12 }
};

const FILTER_PRESETS = {
    WARM_LOWPASS: { frequency: 1200, type: "lowpass", Q: 2 },
    BRIGHT_LOWPASS: { frequency: 2000, type: "lowpass", Q: 3 },
    SOFT_LOWPASS: { frequency: 1500, type: "lowpass", Q: 1 },
    CATHEDRAL_LOWPASS: { frequency: 1500, type: "lowpass", Q: 1 },
    GLACIAL_LOWPASS: { frequency: 900, type: "lowpass", Q: 1.5 },
    DEEP_LOWPASS: { frequency: 400, type: "lowpass", Q: 8 },
    RESONANT_BANDPASS: { frequency: 1200, type: "bandpass", Q: 8 },
    BRIGHT_BANDPASS: { frequency: 1500, type: "bandpass", Q: 5 },
    GLASS_HIGHPASS: { frequency: 2500, type: "highpass", Q: 4 },
    ORCHESTRAL_LOWPASS: { frequency: 2000, type: "lowpass", Q: 3 }
};

const REVERB_PRESETS = {
    STANDARD: { decay: 10, roomSize: 0.7, preDelay: 0.01 },
    CATHEDRAL: { decay: 30, roomSize: 0.99, preDelay: 0.05 },
    GLACIAL: { decay: 25, roomSize: 0.97, preDelay: 0.08 },
    DEEP_SPACE: { decay: 15, roomSize: 0.9, preDelay: 0.02 },
    INTIMATE: { decay: 6, roomSize: 0.7, preDelay: 0.02 },
    LARGE_HALL: { decay: 18, roomSize: 0.9, preDelay: 0.03 },
    CAVERNOUS: { decay: 22, roomSize: 0.95, preDelay: 0.04 }
};

const LFO_PRESETS = {
    SLOW_FILTER_SWEEP: { frequency: 0.15, type: "sine" },
    VERY_SLOW_SWEEP: { frequency: 0.05, type: "triangle" },
    PRAYER_BREATHING: { frequency: 0.04, type: "sine" },
    GLACIAL_MOVEMENT: { frequency: 0.03, type: "sine" },
    GENTLE_SWELL: { frequency: 0.12, type: "triangle" },
    GOLDEN_RATIO: { frequency: 0.618, type: "sine" }
};

// ===============================================
// EFFECT FACTORY SYSTEM
// ===============================================

class EffectFactory {
    static createReverb(preset = 'STANDARD', wetAmount = 0.5) {
        const config = REVERB_PRESETS[preset];
        return new Tone.Reverb({
            decay: config.decay,
            wet: wetAmount,
            roomSize: config.roomSize,
            preDelay: config.preDelay
        });
    }

    static createFilter(preset = 'WARM_LOWPASS') {
        const config = FILTER_PRESETS[preset];
        return new Tone.Filter({
            frequency: config.frequency,
            type: config.type,
            Q: config.Q
        });
    }

    static createLFO(preset = 'SLOW_FILTER_SWEEP', min = 800, max = 1600) {
        const config = LFO_PRESETS[preset];
        const lfo = new Tone.LFO({
            frequency: config.frequency,
            min: min,
            max: max,
            type: config.type
        });
        lfo.start();
        return lfo;
    }

    static createChorus(rate = 0.5, delayTime = 3.5, depth = 0.5, wet = 0.4) {
        const chorus = new Tone.Chorus({
            frequency: rate,
            delayTime: delayTime,
            depth: depth,
            wet: wet
        });
        chorus.start();
        return chorus;
    }

    static createDelay(type = 'pingpong', delayTime = "8n", feedback = 0.3, wet = 0.25) {
        if (type === 'pingpong') {
            return new Tone.PingPongDelay({
                delayTime: delayTime,
                feedback: feedback,
                wet: wet
            });
        } else {
            return new Tone.FeedbackDelay({
                delayTime: delayTime,
                feedback: feedback,
                wet: wet
            });
        }
    }

    static createDistortion(amount = 0.4, wet = 0.3) {
        return new Tone.Distortion({
            distortion: amount,
            wet: wet
        });
    }

    static createPhaser(frequency = 0.15, depth = 0.8, baseFrequency = 400) {
        return new Tone.Phaser({
            frequency: frequency,
            depth: depth,
            baseFrequency: baseFrequency
        });
    }

    static createFrequencyShifter(frequency = 47, wet = 0.25) {
        return new Tone.FrequencyShifter({
            frequency: frequency,
            wet: wet
        });
    }

    static createBitCrusher(bits = 6, wet = 0.3) {
        return new Tone.BitCrusher({
            bits: bits,
            wet: wet
        });
    }

    static createStereoWidener(width = 0.5) {
        return new Tone.StereoWidener(width);
    }

    static createCompressor(threshold = -18, ratio = 4, attack = 0.001, release = 0.2) {
        return new Tone.Compressor({
            threshold: threshold,
            ratio: ratio,
            attack: attack,
            release: release
        });
    }

    static createGain(gainValue = 0.8) {
        return new Tone.Gain(gainValue);
    }
}

// ===============================================
// SYNTH FACTORY SYSTEM
// ===============================================

class SynthFactory {
    static createPad(oscillatorType = "sine", envelopePreset = 'SLOW_ETHEREAL', volume = -8) {
        const envelope = ENVELOPE_PRESETS[envelopePreset];
        return new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: oscillatorType },
            envelope: envelope,
            volume: volume
        });
    }

    static createMonoSynth(oscillatorType = "sine", envelopePreset = 'CONTINUOUS_DRONE', volume = -5) {
        const envelope = ENVELOPE_PRESETS[envelopePreset];
        return new Tone.MonoSynth({
            oscillator: { type: oscillatorType },
            envelope: envelope,
            volume: volume
        });
    }

    static createFMSynth(harmonicity = 8, modulationIndex = 2, envelopePreset = 'FAST_TRANSIENT', volume = -15) {
        const envelope = ENVELOPE_PRESETS[envelopePreset];
        return new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: harmonicity,
            modulationIndex: modulationIndex,
            oscillator: { type: "sine" },
            envelope: envelope,
            modulation: { type: "square" },
            modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.2, release: 2 },
            volume: volume
        });
    }

    static createMetalSynth(harmonicity = 3.1, resonance = 1000, modulationIndex = 12, volume = -25) {
        return new Tone.PolySynth(Tone.MetalSynth, {
            harmonicity: harmonicity,
            resonance: resonance,
            modulationIndex: modulationIndex,
            envelope: ENVELOPE_PRESETS.FAST_TRANSIENT,
            volume: volume
        });
    }
}

// ===============================================
// AUDIO CHAIN BUILDER
// ===============================================

class AudioChainBuilder {
    constructor(source) {
        this.source = source;
        this.chain = [source];
        this.effects = [];
        this.lfos = [];
    }

    // Basic effects
    addFilter(preset = 'WARM_LOWPASS') {
        const filter = EffectFactory.createFilter(preset);
        this._connectNext(filter);
        return this;
    }

    addFilterWithLFO(filterPreset = 'WARM_LOWPASS', lfoPreset = 'SLOW_FILTER_SWEEP', min = 800, max = 1600) {
        const filter = EffectFactory.createFilter(filterPreset);
        const lfo = EffectFactory.createLFO(lfoPreset, min, max);
        lfo.connect(filter.frequency);

        this._connectNext(filter);
        this.lfos.push(lfo);
        return this;
    }

    addReverb(preset = 'STANDARD', wetAmount = 0.5) {
        const reverb = EffectFactory.createReverb(preset, wetAmount);
        this._connectNext(reverb);
        return this;
    }

    addChorus(rate = 0.5, delayTime = 3.5, depth = 0.5, wet = 0.4) {
        const chorus = EffectFactory.createChorus(rate, delayTime, depth, wet);
        this._connectNext(chorus);
        return this;
    }

    addDelay(type = 'pingpong', delayTime = "8n", feedback = 0.3, wet = 0.25) {
        const delay = EffectFactory.createDelay(type, delayTime, feedback, wet);
        this._connectNext(delay);
        return this;
    }

    addDistortion(amount = 0.4, wet = 0.3) {
        const distortion = EffectFactory.createDistortion(amount, wet);
        this._connectNext(distortion);
        return this;
    }

    addPhaser(frequency = 0.15, depth = 0.8, baseFrequency = 400) {
        const phaser = EffectFactory.createPhaser(frequency, depth, baseFrequency);
        this._connectNext(phaser);
        return this;
    }

    addFrequencyShifter(frequency = 47, wet = 0.25) {
        const shifter = EffectFactory.createFrequencyShifter(frequency, wet);
        this._connectNext(shifter);
        return this;
    }

    addBitCrusher(bits = 6, wet = 0.3) {
        const crusher = EffectFactory.createBitCrusher(bits, wet);
        this._connectNext(crusher);
        return this;
    }

    addStereoWidener(width = 0.5) {
        const widener = EffectFactory.createStereoWidener(width);
        this._connectNext(widener);
        return this;
    }

    addCompressor(threshold = -18, ratio = 4, attack = 0.001, release = 0.2) {
        const compressor = EffectFactory.createCompressor(threshold, ratio, attack, release);
        this._connectNext(compressor);
        return this;
    }

    addGain(gainValue = 0.8) {
        const gain = EffectFactory.createGain(gainValue);
        this._connectNext(gain);
        return this;
    }

    addGainWithLFO(gainValue = 0.8, lfoPreset = 'GENTLE_SWELL', min = 0.3, max = 1.2) {
        const gain = EffectFactory.createGain(gainValue);
        const lfo = EffectFactory.createLFO(lfoPreset, min, max);
        lfo.connect(gain.gain);

        this._connectNext(gain);
        this.lfos.push(lfo);
        return this;
    }

    // Complex effect combinations
    addIDMChain() {
        return this
            .addBitCrusher(6, 0.3)
            .addFrequencyShifter(47, 0.25)
            .addPhaser(0.7, 0.8, 400)
            .addDelay('pingpong', "16n", 0.6, 0.4)
            .addDelay('feedback', "8n.", 0.5, 0.3)
            .addFilter('RESONANT_BANDPASS')
            .addDistortion(0.4, 0.3)
            .addChorus(1.2, 2, 0.4, 0.35)
            .addCompressor(-18, 4, 0.001, 0.2);
    }

    addPianoChain() {
        return this
            .addChorus(0.5, 3.5, 0.3, 0.4)
            .addDelay('pingpong', "16n", 0.1, 0.3)
            .addDelay('feedback', "4n.", 0.3, 0.25)
            .addFilter('BRIGHT_LOWPASS')
            .addCompressor(-20, 3, 0.003, 0.1);
    }

    addHarpChain() {
        return this
            .addDelay('pingpong', "8n", 0.3, 0.25);
    }

    addCosmicChain() {
        return this
            .addChorus(0.2, 4, 0.8);
    }

    addUnderwaterChain() {
        return this
            .addFilterWithLFO('DEEP_LOWPASS', 'SLOW_FILTER_SWEEP', 200, 600);
    }

    addNeonChain() {
        return this
            .addDistortion(0.4)
            .addChorus(0.5, 2.5, 0.5);
    }

    addAtmosphericChain() {
        return this
            .addFilterWithLFO('SOFT_LOWPASS', 'SLOW_FILTER_SWEEP', 1000, 2000);
    }

    addGlassChain() {
        return this
            .addFilter('GLASS_HIGHPASS')
            .addChorus(0.3, 3, 0.7);
    }

    addNebulaChain() {
        return this
            .addGainWithLFO(0.6, 'VERY_SLOW_SWEEP', 0.3, 1);
    }

    addThermalChain() {
        return this
            .addFilter('WARM_LOWPASS')
            .addGainWithLFO(0.7, 'GENTLE_SWELL', 0.4, 1.2);
    }

    addAuroraChain() {
        return this
            .addFilterWithLFO('BRIGHT_BANDPASS', 'SLOW_FILTER_SWEEP', 800, 2000)
            .addGainWithLFO(0.8, 'GENTLE_SWELL', 0.5, 1.5);
    }

    addCathedralChain() {
        return this
            .addFilterWithLFO('CATHEDRAL_LOWPASS', 'PRAYER_BREATHING', 1250, 1750)
            .addChorus(0.3, 5, 0.15, 0.4)
            .addStereoWidener(0.9);
    }

    addGlacialChain() {
        return this
            .addFilterWithLFO('GLACIAL_LOWPASS', 'GLACIAL_MOVEMENT', 750, 1050)
            .addChorus(0.1, 8, 0.08, 0.3)
            .addStereoWidener(0.4);
    }

    addStringChain() {
        return this
            .addFilter('ORCHESTRAL_LOWPASS')
            .addChorus(0.1, 2, 0.6);
    }

    addHexagonChain() {
        return this
            .addFilterWithLFO('BRIGHT_BANDPASS', 'GOLDEN_RATIO', 1200, 2400);
    }

    addParallelDimensionChain() {
        return this
            .addPhaser(0.15, 0.8, 400)
            .addPhaser(0.08, 0.6, 800)
            .addFilter('BRIGHT_BANDPASS');
    }

    addGentleRhubarbChain() {
        return this
            .addFrequencyShifter(3, 0.15)
            .addFilterWithLFO('WARM_LOWPASS', 'SLOW_FILTER_SWEEP', 800, 1600)
            .addDistortion(0.05, 1.0)
            .addFilter('BRIGHT_LOWPASS')
            .addChorus(1.5, 3.5, 0.5, 0.4);
    }

    addEtherealRhubarbChain() {
        return this
            .addFrequencyShifter(2, 0.1)
            .addFilterWithLFO('BRIGHT_BANDPASS', 'VERY_SLOW_SWEEP', 1200, 1800)
            .addFilter('BRIGHT_LOWPASS')
            .addChorus(0.8, 5, 0.6, 0.5);
    }

    // Connect to destination and return arrays for cleanup
    connectTo(destination) {
        const lastNode = this.chain[this.chain.length - 1];
        lastNode.connect(destination);

        return {
            effects: this.effects.slice(), // Return copy for disposal
            lfos: this.lfos.slice(),       // Return copy for disposal
            chain: this.chain.slice()      // Return copy for reference
        };
    }

    // Internal helper to connect the next effect in chain
    _connectNext(effect) {
        const lastNode = this.chain[this.chain.length - 1];
        lastNode.connect(effect);
        this.chain.push(effect);
        this.effects.push(effect);
        return this;
    }

    // Get the last node in the chain (useful for custom connections)
    getOutput() {
        return this.chain[this.chain.length - 1];
    }

    // Static factory methods for common synth + chain combinations
    static createStandardPad(masterVolume, reverbAmount = 0.5) {
        const pad = SynthFactory.createPad("sine", 'SLOW_ETHEREAL');
        return new AudioChainBuilder(pad)
            .addReverb('STANDARD', reverbAmount)
            .connectTo(masterVolume);
    }

    static createCathedralPad(masterVolume, reverbAmount = 0.5) {
        const pad = SynthFactory.createPad("sine", 'CATHEDRAL');
        return new AudioChainBuilder(pad)
            .addCathedralChain()
            .addReverb('CATHEDRAL', reverbAmount)
            .connectTo(masterVolume);
    }

    static createIDMSynth(masterVolume, reverbAmount = 0.5) {
        const synth = SynthFactory.createFMSynth(2.1, 8, 'MEDIUM_SUSTAIN', 5);
        return new AudioChainBuilder(synth)
            .addIDMChain()
            .addReverb('STANDARD', reverbAmount * 0.8)
            .connectTo(masterVolume);
    }
}