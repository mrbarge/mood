class PresetManager {
    constructor() {
        this.presets = this.initializePresets();
        this.currentPreset = null;
        this.setupEventListeners();
    }

    initializePresets() {
        return {
            'classic': {
                name: 'Classic',
                description: 'The original prototype sound',
                settings: {
                    // Mood settings
                    mood: 'calm',
                    soundEngine: 'standard',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: false,
                    noise: false,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'piano',
                    noteFrequency: 6,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            },

            'minimal-drift': {
                name: 'Minimal Drift',
                description: 'Sparse, contemplative',
                settings: {
                    // Mood settings
                    mood: 'nostalgic',
                    soundEngine: 'ethereal-rhubarb',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: true,
                    noise: false,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'marimba',
                    noteFrequency: 7,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    melodySlotCount: 2,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            },

            'puzzle': {
                name: 'puzzle',
                description: '',
                settings: {
                    // Mood settings
                    mood: 'hopeful',
                    soundEngine: 'aurora-field',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: false,
                    noise: false,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'algorithmic-melody',
                    noteFrequency: 6,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            },

            'forest': {
                name: 'Forest Depths',
                description: 'Natural, organic textures',
                settings: {
                    // Mood settings
                    mood: 'melancholic',
                    soundEngine: 'dark-matter',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: false,
                    noise: false,
                    thunder: true,
                    // Instruments
                    melodicInstrument: 'vintage-celesta',
                    noteFrequency: 9,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            },

            'evolving': {
                name: 'Ever evolving',
                description: '',
                settings: {
                    // Mood settings
                    mood: 'random',
                    soundEngine: 'random',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: false,
                    noise: false,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'random',
                    noteFrequency: 7,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            },
            'jewel': {
                name: 'Shining Jewel',
                description: '',
                settings: {
                    // Mood settings
                    mood: 'serene',
                    soundEngine: 'glacial-ethereal',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: false,
                    noise: true,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'rhythmic-piano',
                    noteFrequency: 8,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            },
            'frost': {
                name: 'Frost',
                description: '',
                settings: {
                    // Mood settings
                    mood: 'hopeful',
                    soundEngine: 'nebula-drift',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: true,
                    noise: false,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'crystal-bells',
                    noteFrequency: 8,
                    melodicReverb: 0.8,
                    layerRandomness: 0.5,
                    // Wave
                    waveVolume: -6,
                    waveNoiseType: 'pink',
                    // Clock
                    clockTempo: 60,
                }
            }
        };
    }

    setupEventListeners() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const presetKey = button.getAttribute('data-preset');
                this.applyPreset(presetKey);
            });
        });
    }

    applyPreset(presetKey) {
        const preset = this.presets[presetKey];
        if (!preset) {
            console.warn(`Preset '${presetKey}' not found`);
            return;
        }

        console.log(`Applying preset: ${preset.name}`);

        // Add loading state
        const button = document.querySelector(`[data-preset="${presetKey}"]`);
        if (button) {
            this.setActivePreset(button);
            button.classList.add('loading');
        }

        // Apply settings with a slight delay for visual feedback
        setTimeout(() => {
            this.applyPresetSettings(preset.settings);

            if (button) {
                button.classList.remove('loading');
            }

            this.currentPreset = presetKey;
            console.log(`Preset '${preset.name}' applied successfully`);
        }, 300);
    }

    applyPresetSettings(settings) {
        const moodSelect = document.getElementById('mood');
        if (moodSelect) {
            moodSelect.value = settings.mood;
        }
        if (settings.soundEngine !== undefined) {
            this.setSelectValue('sound-engine', settings.soundEngine);
        }
        if (settings.melodicInstrument !== undefined) {
            this.setSelectValue('melodic-instrument', settings.melodicInstrument);
        }
        const soundEngineSelect = document.getElementById('sound-engine');
        if (soundEngineSelect) {
            soundEngineSelect.value = settings.soundEngine;
        }
        const melodicInstrumentSelect = document.getElementById('melodic-instrument');
        if (melodicInstrumentSelect) {
            melodicInstrumentSelect.value = settings.melodicInstrument;
        }

        if (settings.melody !== undefined) {
            this.setToggleButton('melody-toggle', settings.melody);
        }
        if (settings.clock !== undefined) {
            this.setToggleButton('clock-toggle', settings.clock);
        }
        if (settings.noise !== undefined) {
            this.setToggleButton('noise-toggle', settings.noise);
        }
        if (settings.thunder !== undefined) {
            this.setToggleButton('thunder-toggle', settings.thunder);
        }

        if (settings.reverb !== undefined) {
            this.setSliderValue('reverb', settings.masterVolume);
        }
        if (settings.noteDensity !== undefined) {
            this.setSliderValue('density', settings.noteDensity);
        }

        if (settings.noteFrequency !== undefined) {
            this.setSliderValue('melodic-frequency', settings.noteFrequency);
        }
        if (settings.melodicReverb !== undefined) {
            this.setSliderValue('melodic-reverb', settings.melodicReverb);
        }
        if (settings.melodySlotCount !== undefined) {
            this.setSliderValue('melody-slot-count', settings.melodySlotCount);
        }
        // Apply effects
        if (settings.layerRandomness !== undefined) {
            this.setSliderValue('layer-randomness', settings.layerRandomness);
        }
        if (settings.waveVolume !== undefined) {
            this.setSliderValue('noise-volume', settings.waveVolume);
        }
        if (settings.waveNoiseType !== undefined) {
            this.setSliderValue('noise-type', settings.waveNoiseType);
        }

        // Apply instrument selections
        if (settings.clockTempo !== undefined) {
            this.setSliderValue('clock-tempo', settings.clockTempo);
        }
    }

    setSliderValue(elementId, value) {
        const slider = document.getElementById(elementId);
        if (slider) {
            slider.value = value;
            // Trigger change event to update any associated displays/logic
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    setSelectValue(elementId, value) {
        const select = document.getElementById(elementId);
        if (select) {
            select.value = value;
            // Trigger change event
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    setToggleButton(elementId, enabled) {
        // Try multiple possible ID variations
        const possibleIds = [
            elementId,
            elementId.replace('-toggle', '-btn'),
            elementId.replace('-toggle', ''),
            `toggle-${elementId.replace('-toggle', '')}`,
            `btn-${elementId.replace('-toggle', '')}`
        ];

        let toggle = null;
        let foundId = null;

        for (const id of possibleIds) {
            toggle = document.getElementById(id);
            if (toggle) {
                foundId = id;
                break;
            }
        }

        if (!toggle) {
            console.warn(`Toggle button not found for any of these IDs:`, possibleIds);
            return;
        }

        console.debug(`Found toggle with ID: ${foundId}, setting to: ${enabled}`);

        // Get current state
        const isCurrentlyActive = toggle.classList.contains('active') ||
            toggle.classList.contains('enabled') ||
            toggle.checked === true;

        console.debug(`Current state: ${isCurrentlyActive}, target state: ${enabled}`);

        // Only change if needed
        if (isCurrentlyActive === enabled) {
            console.debug('Toggle already in correct state');
            return;
        }

        // Handle different types of toggle implementations
        if (toggle.type === 'checkbox') {
            toggle.checked = enabled;
            toggle.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (toggle.tagName === 'BUTTON' || toggle.classList.contains('btn')) {
            // Most likely a button-based toggle - just click it
            console.debug('Clicking button toggle');
            toggle.click();
        } else if (toggle.classList.contains('toggle')) {
            // Custom toggle class
            if (enabled) {
                toggle.classList.add('active');
                toggle.classList.add('enabled');
            } else {
                toggle.classList.remove('active');
                toggle.classList.remove('enabled');
            }
            toggle.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            // Default: try clicking
            console.debug('Fallback: clicking toggle');
            toggle.click();
        }

        // Verify the change worked
        setTimeout(() => {
            const newState = toggle.classList.contains('active') ||
                toggle.classList.contains('enabled') ||
                toggle.checked === true;
            console.debug(`Toggle state after change: ${newState}`);
        }, 100);
    }

    setActivePreset(activeButton) {
        // Remove active class from all preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    addPreset(key, presetData) {
        this.presets[key] = presetData;
        console.log(`Preset '${key}' added`);
    }

    getCurrentPreset() {
        return this.currentPreset;
    }

    getPresetData(presetKey) {
        return this.presets[presetKey];
    }
}
