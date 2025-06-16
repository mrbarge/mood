// ===============================================
// MULTI-MELODY INSTRUMENT SYSTEM
// Enhanced MelodyManager for multiple simultaneous instruments
// ===============================================

class MultiMelodyManager {
    constructor() {
        this.registry = new MelodyInstrumentRegistry();
        this.melodySlots = []; // Array of melody slot objects
        this.isEnabled = false;
        this.globalRandomInterval = null;
        this.maxSlots = 3; // Configurable maximum
        this.currentSlotCount = 1; // How many slots are currently active
    }

    // ===============================================
    // SLOT MANAGEMENT
    // ===============================================

    initializeSlots(count = 1) {
        console.debug(`Initializing ${count} melody slots`);

        // Clear existing slots
        this.disposeAllSlots();
        this.melodySlots = [];

        // Create new slots
        for (let i = 0; i < count; i++) {
            this.melodySlots.push(this.createMelodySlot(i));
        }

        this.currentSlotCount = count;
    }

    createMelodySlot(slotIndex) {
        return {
            id: slotIndex,
            instrument: null,
            isActive: false,
            config: {
                instrumentType: 'piano',
                volume: -8 - (slotIndex * 2), // Each slot gets quieter
                reverbAmount: 0.6 + (slotIndex * 0.1), // Each slot gets more reverb
                frequency: 3 - slotIndex, // Different timing for each slot
                scale: null,
                pattern: null,
                randomness: {
                    timing: 0.3 + (slotIndex * 0.2), // More timing variation per slot
                    noteChoice: 0.1 + (slotIndex * 0.1), // More note variation per slot
                    octaveShift: slotIndex > 1 ? 0.2 : 0 // Higher slots can shift octaves
                }
            },
            timeout: null,
            randomCycleTimeout: null
        };
    }

    setSlotCount(count) {
        if (count < 1) count = 1;
        if (count > this.maxSlots) count = this.maxSlots;

        const wasEnabled = this.isEnabled;
        const wasSingleSlot = this.isSingleSlotMode();
        const currentScale = this.melodySlots[0]?.config.scale;
        const currentPattern = this.melodySlots[0]?.config.pattern;

        // Stop current setup
        this.stop();

        // Reinitialize with new count
        this.initializeSlots(count);

        // If transitioning to/from single slot mode, restart appropriately
        if (wasEnabled && currentScale && currentPattern) {
            this.setEnabled(true);
            this.setScaleAndPattern(currentScale, currentPattern);
        }

        console.debug(`Melody slot count changed to: ${count} (single-slot mode: ${this.isSingleSlotMode()})`);
    }

    // ===============================================
    // INSTRUMENT ASSIGNMENT
    // ===============================================

    async setSlotInstrument(slotIndex, instrumentKey, config = {}) {
        if (slotIndex >= this.melodySlots.length) return;

        const slot = this.melodySlots[slotIndex];
        const wasActive = slot.isActive; // Remember if it was playing

        // If slot was active, stop it properly
        if (wasActive) {
            slot.isActive = false;
            if (slot.timeout) {
                clearTimeout(slot.timeout);
                slot.timeout = null;
            }
            if (slot.instrument) {
                slot.instrument.stop();
            }
        }

        // Dispose existing instrument
        if (slot.instrument) {
            slot.instrument.dispose();
        }

        // Create new instrument
        const finalConfig = {
            ...slot.config,
            ...config
        };

        slot.instrument = this.registry.create(instrumentKey, config);
        slot.config.instrumentType = instrumentKey;

        // Initialize instrument
        if (typeof masterVolume !== 'undefined' && typeof reverb !== 'undefined') {
            await slot.instrument.initialize(masterVolume, reverb);
        }

        console.debug(`Slot ${slotIndex} instrument set to: ${instrumentKey}`);
        return slot.instrument;
    }

    async setAllSlotsToInstrument(instrumentKey, config = {}) {
        console.debug(`Setting all ${this.melodySlots.length} slots to instrument: ${instrumentKey}`);

        for (let i = 0; i < this.melodySlots.length; i++) {
            await this.setSlotInstrument(i, instrumentKey, config);
        }

        console.debug(`All slots set to ${instrumentKey}, active slots:`,
            this.melodySlots.filter(slot => slot.isActive).length);
    }

    async randomizeSlotInstruments() {
        const availableInstruments = this.registry.getAvailableInstruments();

        for (let i = 0; i < this.melodySlots.length; i++) {
            const randomInstrument = availableInstruments[
                Math.floor(Math.random() * availableInstruments.length)
                ];
            await this.setSlotInstrument(i, randomInstrument);
        }

        console.debug("Randomized all slot instruments");
    }

    // ===============================================
    // PLAYBACK CONTROL
    // ===============================================

    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    setScaleAndPattern(scale, pattern) {
        this.melodySlots.forEach(slot => {
            slot.config.scale = scale;
            slot.config.pattern = pattern;
        });
    }

    updateReverbAmount(amount) {
        console.debug(`Updating reverb amount to: ${amount} for all melody slots`);

        // Update reverb for all active slots
        for (let i = 0; i < this.melodySlots.length; i++) {
            const slot = this.melodySlots[i];

            // Update slot config
            slot.config.reverbAmount = amount;

            // Update the actual instrument reverb if it exists
            if (slot.instrument && slot.instrument.updateReverbAmount) {
                slot.instrument.updateReverbAmount(amount);
            }
        }
    }

    async start(scale, pattern) {
        if (!this.isEnabled) return;

        console.debug(`Starting ${this.melodySlots.length} melody slots`);

        this.setScaleAndPattern(scale, pattern);

        if (this.isSingleSlotMode()) {
            // Single slot: behave like MelodyManager
            const slot = this.melodySlots[0];
            if (slot.instrument && !slot.isActive) {
                if (!slot.instrument.synth) {
                    await slot.instrument.initialize(masterVolume, reverb);
                }
                this.startSlotPlayback(slot);
            }
        } else {
            // Multi-slot: use staggered timing
            for (let i = 0; i < this.melodySlots.length; i++) {
                const slot = this.melodySlots[i];

                if (slot.instrument && !slot.isActive) {
                    if (!slot.instrument.synth) {
                        await slot.instrument.initialize(masterVolume, reverb);
                    }

                    setTimeout(() => {
                        this.startSlotPlayback(slot);
                    }, i * 2000);
                }
            }
        }
    }

    startSlotPlayback(slot) {
        if (!this.isEnabled || slot.isActive) return;

        slot.isActive = true;
        console.debug(`Starting playback for slot ${slot.id}`);

        if (slot.instrument && slot.config.scale && slot.config.pattern) {
            if (this.isSingleSlotMode()) {
                // Use the instrument's built-in melody system (like MelodyManager)
                slot.instrument.currentScale = slot.config.scale;
                slot.instrument.currentPattern = slot.config.pattern;
                slot.instrument.start(slot.config.scale, slot.config.pattern);
            } else {
                // Use multi-slot custom scheduling
                this.scheduleSlotMelody(slot);
            }
        }
    }

    stop() {
        console.debug("Stopping all melody slots");

        this.melodySlots.forEach(slot => {
            slot.isActive = false;

            // NEW: Different stopping behavior for single vs multi-slot
            if (this.melodySlots.length === 1) {
                // Use instrument's built-in stop (like MelodyManager)
                if (slot.instrument) {
                    slot.instrument.stop();
                }
            } else {
                // Use custom slot management
                if (slot.timeout) {
                    clearTimeout(slot.timeout);
                    slot.timeout = null;
                }

                if (slot.randomCycleTimeout) {
                    clearTimeout(slot.randomCycleTimeout);
                    slot.randomCycleTimeout = null;
                }

                if (slot.instrument) {
                    slot.instrument.stop();
                }
            }
        });

        if (this.globalRandomInterval) {
            clearInterval(this.globalRandomInterval);
            this.globalRandomInterval = null;
        }
    }

    isSingleSlotMode() {
        return this.melodySlots.length === 1;
    }

    // ===============================================
    // ENHANCED MELODY SCHEDULING
    // ===============================================

    scheduleSlotMelody(slot) {
        if (!slot.isActive || !this.isEnabled) return;

        const playMelody = () => {
            if (!slot.isActive || !this.isEnabled) return;

            // Clear existing timeout
            if (slot.timeout) {
                clearTimeout(slot.timeout);
                slot.timeout = null;
            }

            // Generate melody with slot-specific randomness
            const melody = this.generateMelodyForSlot(slot);

            if (melody.length > 0) {
                this.playSlotMelody(slot, melody);
            }

            // Schedule next melody with slot-specific timing
            const baseInterval = this.getSlotInterval(slot);
            const randomVariation = baseInterval * slot.config.randomness.timing;
            const nextInterval = baseInterval + (Math.random() - 0.5) * randomVariation;

            if (slot.isActive) {
                slot.timeout = setTimeout(playMelody, nextInterval);
            }
        };

        // Start with initial delay
        const initialDelay = Math.random() * 3000 + 2000; // 2-5 second delay
        slot.timeout = setTimeout(playMelody, initialDelay);
    }

    generateMelodyForSlot(slot) {
        const scale = slot.config.scale;
        const pattern = slot.config.pattern;
        const randomness = slot.config.randomness;

        if (!scale || !pattern) return [];

        // Phrase length varies by slot
        const basePhraseLength = 3 + slot.id;
        const phraseLength = Math.floor(Math.random() * 3) + basePhraseLength;

        const melody = [];

        // Start with pattern note or random scale note
        let startNote;
        if (Math.random() < randomness.noteChoice) {
            startNote = scale[Math.floor(Math.random() * scale.length)];
        } else {
            startNote = pattern[Math.floor(Math.random() * pattern.length)];
        }

        let startIndex = scale.indexOf(startNote);
        if (startIndex === -1) startIndex = 0;

        let currentIndex = startIndex;
        melody.push(scale[currentIndex]);

        // Generate rest of melody
        for (let i = 1; i < phraseLength; i++) {
            let nextIndex;

            if (Math.random() < randomness.noteChoice) {
                // Random jump
                nextIndex = Math.floor(Math.random() * scale.length);
            } else {
                // Step movement
                const stepSize = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                nextIndex = Math.min(Math.max(0, currentIndex + stepSize), scale.length - 1);
            }

            let note = scale[nextIndex];

            // Octave shifting for higher slots
            if (randomness.octaveShift > 0 && Math.random() < randomness.octaveShift) {
                const noteName = note.slice(0, -1);
                const octave = parseInt(note.slice(-1));
                const newOctave = Math.random() < 0.5 ?
                    Math.max(2, octave - 1) :
                    Math.min(6, octave + 1);
                note = noteName + newOctave;
            }

            melody.push(note);
            currentIndex = nextIndex;
        }

        return melody;
    }

    playSlotMelody(slot, melody) {
        const noteDuration = 1.0 + (slot.id * 0.3); // Longer notes for higher slots
        const noteSpacing = 0.6 + (slot.id * 0.2); // More spaced timing for higher slots

        melody.forEach((note, index) => {
            let timing = index * noteSpacing * 1000;
            timing += (Math.random() - 0.5) * slot.config.randomness.timing * 1000;
            timing = Math.max(0, timing);

            setTimeout(() => {
                if (!slot.isActive || !this.isEnabled) return;

                // Track active notes for visualization
                if (typeof activeNotes !== 'undefined') {
                    const noteKey = `${note}_slot${slot.id}`;
                    if (!activeNotes[noteKey]) {
                        activeNotes[noteKey] = { count: 1, type: 'melodic', slot: slot.id };
                    } else {
                        activeNotes[noteKey].count++;
                    }
                }

                try {
                    if (slot.instrument && slot.instrument.synth) {
                        slot.instrument.synth.triggerAttackRelease(note, noteDuration);
                    }
                } catch (error) {
                    console.debug("Slot melody playback error:", error.message);
                }

                // Clean up note tracking
                setTimeout(() => {
                    if (typeof activeNotes !== 'undefined') {
                        const noteKey = `${note}_slot${slot.id}`;
                        if (activeNotes[noteKey]) {
                            activeNotes[noteKey].count--;
                            if (activeNotes[noteKey].count <= 0) {
                                delete activeNotes[noteKey];
                            }
                        }
                    }
                }, noteDuration * 1000 + 500);
            }, timing);
        });
    }

    getSlotInterval(slot) {
        // Base interval gets longer for higher slots
        const baseTime = (12 - (slot.config.frequency || 4)) + (slot.id * 2);
        return baseTime * 1000;
    }

    // ===============================================
    // RANDOM CYCLING
    // ===============================================

    startRandomCycle() {
        if (this.globalRandomInterval) {
            clearInterval(this.globalRandomInterval);
        }

        const minutesValue = typeof randomIntervalSlider !== 'undefined' ?
            parseInt(randomIntervalSlider.value) : 10;
        const milliseconds = minutesValue * 60 * 1000;

        this.globalRandomInterval = setInterval(() => {
            if (typeof isPlaying !== 'undefined' && isPlaying &&
                typeof melodicInstrumentSelect !== 'undefined' &&
                melodicInstrumentSelect.value === "random") {
                this.changeRandomSlotInstruments();
            } else {
                clearInterval(this.globalRandomInterval);
                this.globalRandomInterval = null;
            }
        }, milliseconds);
    }

    async changeRandomSlotInstruments() {
        console.debug("Changing random slot instruments");

        // Change 1-2 slots per cycle, not all at once
        const slotsToChange = Math.min(
            Math.floor(Math.random() * 2) + 1,
            this.melodySlots.length
        );

        const slotIndices = [];
        while (slotIndices.length < slotsToChange) {
            const randomIndex = Math.floor(Math.random() * this.melodySlots.length);
            if (!slotIndices.includes(randomIndex)) {
                slotIndices.push(randomIndex);
            }
        }

        const availableInstruments = this.registry.getAvailableInstruments();

        for (const slotIndex of slotIndices) {
            const slot = this.melodySlots[slotIndex];
            const currentInstrument = slot.config.instrumentType;

            let newInstrument;
            do {
                newInstrument = availableInstruments[
                    Math.floor(Math.random() * availableInstruments.length)
                    ];
            } while (newInstrument === currentInstrument && availableInstruments.length > 1);

            console.debug(`Slot ${slotIndex}: ${currentInstrument} → ${newInstrument}`);

            // Stop current slot
            slot.isActive = false;
            if (slot.instrument) {
                slot.instrument.stop();
            }

            // Set new instrument
            await this.setSlotInstrument(slotIndex, newInstrument);

            // Restart slot if we're currently playing
            if (typeof isPlaying !== 'undefined' && isPlaying && this.isEnabled) {
                setTimeout(() => {
                    this.startSlotPlayback(slot);
                }, 1000); // 1 second delay before restarting
            }
        }
    }

    // ===============================================
    // CONFIGURATION UPDATES
    // ===============================================

    updateSlotConfig(slotIndex, config) {
        if (slotIndex >= this.melodySlots.length) return;

        const slot = this.melodySlots[slotIndex];
        slot.config = { ...slot.config, ...config };

        if (slot.instrument) {
            if (config.reverbAmount !== undefined) {
                slot.instrument.updateReverbAmount(config.reverbAmount);
            }
            if (config.volume !== undefined) {
                slot.instrument.setVolume(config.volume);
            }
        }
    }

    updateAllSlotsConfig(config) {
        for (let i = 0; i < this.melodySlots.length; i++) {
            this.updateSlotConfig(i, config);
        }
    }

    async setInstrument(instrumentKey, config = {}) {
        console.debug(`Setting instrument (compatibility mode): ${instrumentKey}`);

        // For backward compatibility, set all slots to the same instrument
        await this.setAllSlotsToInstrument(instrumentKey, config);

        // Return the first slot's instrument for compatibility
        return this.melodySlots[0]?.instrument || null;
    }

    // ===============================================
    // CLEANUP
    // ===============================================

    disposeAllSlots() {
        this.melodySlots.forEach(slot => {
            if (slot.timeout) {
                clearTimeout(slot.timeout);
            }
            if (slot.randomCycleTimeout) {
                clearTimeout(slot.randomCycleTimeout);
            }
            if (slot.instrument) {
                slot.instrument.dispose();
            }
        });
    }

    dispose() {
        this.stop();
        this.disposeAllSlots();
        this.melodySlots = [];
    }

    // ===============================================
    // UTILITY METHODS
    // ===============================================

    getSlotInfo() {
        return this.melodySlots.map(slot => ({
            id: slot.id,
            instrument: slot.config.instrumentType,
            isActive: slot.isActive,
            volume: slot.config.volume,
            frequency: slot.config.frequency,
            randomness: slot.config.randomness
        }));
    }

    getCurrentSlotCount() {
        return this.currentSlotCount;
    }

    getMaxSlots() {
        return this.maxSlots;
    }
}

// Handler for slot count changes
function handleSlotCountChange() {
    const slotCountSlider = document.getElementById('melody-slot-count');
    if (!slotCountSlider || !melodyManager) return;

    const newCount = parseInt(slotCountSlider.value);
    melodyManager.setSlotCount(newCount);

    updateSlotsInfoDisplay();
    updateMelodyStatus();
}

// Update slots info display
function updateSlotsInfoDisplay() {
    const slotsInfo = document.getElementById('melody-slots-info');
    if (!slotsInfo || !melodyManager) return;

    const slotInfos = melodyManager.getSlotInfo();

    slotsInfo.innerHTML = slotInfos.map(slot => {
        const instrumentName = getInstrumentDisplayName(slot.instrument);
        const statusIcon = slot.isActive ? '♪' : '○';
        const statusClass = slot.isActive ? 'playing' : 'stopped';
        const slotClass = slot.isActive ? 'active' : 'inactive';

        return `
            <div class="slot-info ${slotClass}">
                <span class="slot-label">Layer ${slot.id + 1}:</span>
                <span class="slot-instrument">${instrumentName}</span>
                <span class="slot-status ${statusClass}">${statusIcon}</span>
            </div>
        `;
    }).join('');
}

console.log("✅ Multi-Melody System loaded");