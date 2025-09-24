class PresetManager {
    constructor() {
        this.presets = this.initializePresets();
        this.currentPreset = null;
        this.favourite = null;
        this.setupEventListeners();
        this.loadFavourite(); // Load favourite from localStorage on init
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
            },
            'star': {
                name: 'Falling Star',
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
                    noise: false,
                    thunder: false,
                    // Instruments
                    melodicInstrument: 'vintage-celesta',
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
            'storm': {
                name: 'Gathering Storm',
                description: '',
                settings: {
                    // Mood settings
                    mood: 'melancholic',
                    soundEngine: 'cathedral-ethereal',
                    noteDensity: 5,
                    reverb: 0.5,
                    // Toggle states
                    melody: true,
                    clock: false,
                    noise: false,
                    thunder: true,
                    // Instruments
                    melodicInstrument: 'music-box',
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
            'crystal-cascade': {
                name: 'Crystal Cascade',
                description: 'Crystalline arpeggiator with cascading patterns',
                settings: {
                    // Standard settings
                    mood: 'ethereal',
                    soundEngine: 'glass-horizon',
                    noteDensity: 3,
                    reverb: 0.7,
                    melody: true,
                    clock: false,
                    noise: false,
                    thunder: false,

                    // Arpeggiator-specific settings
                    melodicInstrument: 'arpeggiator',
                    arpeggiatorConfig: {
                        pattern: 'cascade',
                        synthesis: 'bells',
                        chordProgression: 'floating',
                        speed: 3,
                        octaves: 4,
                        noteLength: 1.2,
                        chordChangeRate: 10,
                        lockSynthesis: true  // Keep it as bells
                    },

                    noteFrequency: 5,
                    melodicReverb: 0.9,
                    layerRandomness: 0.3
                }
            }
        };
    }

    setupEventListeners() {
        const presetButtons = document.querySelectorAll('.preset-pill');
        presetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const presetKey = button.getAttribute('data-preset');
                if (presetKey === 'favourite') {
                    this.applyFavourite();
                } else {
                    this.applyPreset(presetKey);
                }
            });
        });

        // Set up save favourite button
        const saveFavouriteBtn = document.getElementById('save-favourite-btn');
        if (saveFavouriteBtn) {
            saveFavouriteBtn.addEventListener('click', () => {
                this.saveCurrentAsFavourite();
            });
        }
    }

    // Capture the current actual state (resolving random values)
    captureCurrentState() {
        const state = {
            // Get actual current values from managers, not UI dropdowns
            mood: this.getCurrentMood(),
            soundEngine: this.getCurrentSoundEngine(),
            melodicInstrument: this.getCurrentMelodicInstrument(),

            // Get slider values
            noteDensity: this.getSliderValue('density', 5),
            reverb: this.getSliderValue('reverb', 0.5),
            noteFrequency: this.getSliderValue('melodic-frequency', 6),
            melodicReverb: this.getSliderValue('melodic-reverb', 0.8),
            layerRandomness: this.getSliderValue('layer-randomness', 0.5),
            melodySlotCount: this.getSliderValue('melody-slot-count', 1),

            // Get toggle states
            melody: this.getCheckboxValue('melody-toggle', true),

            // Get ambient toggle states
            clock: this.getAmbientToggleState('clock'),
            noise: this.getAmbientToggleState('waves'),
            thunder: this.getAmbientToggleState('thunder'),

            // Get ambient settings
            waveVolume: this.getSliderValue('noise-volume', -6),
            waveNoiseType: this.getSelectValue('noise-type', 'pink'),
            clockTempo: this.getSliderValue('clock-tempo', 60),

            // Add master volume
            masterVolume: this.getSliderValue('volume', -15),

            // Add timestamp for identification
            savedAt: new Date().toISOString(),
            name: `Favourite (${new Date().toLocaleTimeString()})`
        };

        return state;
    }

    // Helper methods to get current actual values
    getCurrentMood() {
        // If mood is set to random, get the actual current mood from the manager
        const moodSelect = document.getElementById('mood');
        if (moodSelect && moodSelect.value !== 'random') {
            return moodSelect.value;
        }

        // Get from global currentActiveMood or musicManager
        if (typeof currentActiveMood !== 'undefined') {
            return currentActiveMood;
        }

        if (typeof musicManager !== 'undefined' && musicManager.currentMood) {
            return musicManager.currentMood;
        }

        return 'calm'; // fallback
    }

    getCurrentSoundEngine() {
        const soundEngineSelect = document.getElementById('sound-engine');
        if (soundEngineSelect && soundEngineSelect.value !== 'random') {
            return soundEngineSelect.value;
        }

        // Get actual current engine from musicManager
        if (typeof musicManager !== 'undefined' && musicManager.currentSoundEngine) {
            return musicManager.getCurrentEngineKey();
        }

        return 'standard'; // fallback
    }

    getCurrentMelodicInstrument() {
        const instrumentSelect = document.getElementById('melodic-instrument');
        if (instrumentSelect && instrumentSelect.value !== 'random') {
            return instrumentSelect.value;
        }

        // Get from melodyManager
        if (typeof melodyManager !== 'undefined' && melodyManager.currentInstrument) {
            return melodyManager.currentInstrument.instrumentType || 'piano';
        }

        return 'piano'; // fallback
    }

    getSliderValue(id, defaultValue) {
        const slider = document.getElementById(id);
        return slider ? parseFloat(slider.value) : defaultValue;
    }

    getSelectValue(id, defaultValue) {
        const select = document.getElementById(id);
        return select ? select.value : defaultValue;
    }

    getCheckboxValue(id, defaultValue) {
        const checkbox = document.getElementById(id);
        return checkbox ? checkbox.checked : defaultValue;
    }

    getAmbientToggleState(soundType) {
        const toggle = document.querySelector(`.ambient-toggle[data-sound="${soundType}"]`);
        return toggle ? toggle.classList.contains('active') : false;
    }

    // Save current state as favourite
    saveCurrentAsFavourite() {
        try {
            this.favourite = this.captureCurrentState();
            this.saveFavouriteToStorage();
            this.updateFavouriteUI();

            // Visual feedback
            this.showSaveConfirmation();

            console.log('Favourite saved:', this.favourite);
        } catch (error) {
            console.error('Error saving favourite:', error);
            this.showSaveError();
        }
    }

    // Apply favourite preset
    applyFavourite() {
        if (!this.favourite) {
            console.warn('No favourite preset saved');
            return;
        }

        console.log('Applying favourite preset:', this.favourite.name);

        // Add loading state to favourite button
        const favouriteButton = document.querySelector('[data-preset="favourite"]');
        if (favouriteButton) {
            this.setActivePreset(favouriteButton);
            favouriteButton.classList.add('loading');
        }

        // Apply settings with a slight delay for visual feedback
        setTimeout(() => {
            this.applyPresetSettings(this.favourite);

            if (favouriteButton) {
                favouriteButton.classList.remove('loading');
            }

            this.currentPreset = 'favourite';
            console.log('Favourite preset applied successfully');
        }, 300);
    }

    // Save to localStorage
    saveFavouriteToStorage() {
        try {
            localStorage.setItem('mood-app-favourite', JSON.stringify(this.favourite));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            // Could fallback to sessionStorage or just keep in memory
            throw error;
        }
    }

    // Load from localStorage
    loadFavourite() {
        try {
            const saved = localStorage.getItem('mood-app-favourite');
            if (saved) {
                this.favourite = JSON.parse(saved);
                this.updateFavouriteUI();
                console.log('Favourite loaded from storage:', this.favourite.name);
            }
        } catch (error) {
            console.error('Error loading favourite from storage:', error);
            // Clear corrupted data
            localStorage.removeItem('mood-app-favourite');
        }
    }

    // Update UI to show favourite status
    updateFavouriteUI() {
        const saveFavouriteBtn = document.getElementById('save-favourite-btn');
        const favouritePresetPill = document.querySelector('[data-preset="favourite"]');

        if (this.favourite) {
            // Show that a favourite exists
            if (saveFavouriteBtn) {
                saveFavouriteBtn.classList.add('has-favourite');
                saveFavouriteBtn.title = `Update favourite (currently: ${this.favourite.name})`;
            }

            if (favouritePresetPill) {
                favouritePresetPill.style.display = 'block';
                favouritePresetPill.setAttribute('title', this.favourite.name);
            }
        } else {
            // No favourite exists
            if (saveFavouriteBtn) {
                saveFavouriteBtn.classList.remove('has-favourite');
                saveFavouriteBtn.title = 'Save current settings as favourite';
            }

            if (favouritePresetPill) {
                favouritePresetPill.style.display = 'none';
            }
        }
    }

    // Visual feedback for save action
    showSaveConfirmation() {
        const saveFavouriteBtn = document.getElementById('save-favourite-btn');
        if (saveFavouriteBtn) {
            const originalText = saveFavouriteBtn.innerHTML;
            saveFavouriteBtn.innerHTML = '💾 Saved!';
            saveFavouriteBtn.classList.add('save-success');

            setTimeout(() => {
                saveFavouriteBtn.innerHTML = originalText;
                saveFavouriteBtn.classList.remove('save-success');
            }, 2000);
        }
    }

    showSaveError() {
        const saveFavouriteBtn = document.getElementById('save-favourite-btn');
        if (saveFavouriteBtn) {
            const originalText = saveFavouriteBtn.innerHTML;
            saveFavouriteBtn.innerHTML = '❌ Error';
            saveFavouriteBtn.classList.add('save-error');

            setTimeout(() => {
                saveFavouriteBtn.innerHTML = originalText;
                saveFavouriteBtn.classList.remove('save-error');
            }, 2000);
        }
    }

    // Clear favourite
    clearFavourite() {
        this.favourite = null;
        localStorage.removeItem('mood-app-favourite');
        this.updateFavouriteUI();
        console.log('Favourite cleared');
    }

    // Get favourite info for display
    getFavouriteInfo() {
        return this.favourite ? {
            name: this.favourite.name,
            savedAt: this.favourite.savedAt,
            settings: Object.keys(this.favourite).filter(key =>
                !['savedAt', 'name'].includes(key)
            ).length
        } : null;
    }

    // ... existing methods (applyPreset, applyPresetSettings, etc.) stay the same ...

    applyPreset(presetKey) {
        const preset = this.presets[presetKey];
        if (!preset) {
            console.warn(`Preset '${presetKey}' not found`);
            return;
        }

        console.log(`Applying preset: ${preset.name}`);

        const button = document.querySelector(`[data-preset="${presetKey}"]`);
        if (button) {
            this.setActivePreset(button);
            button.classList.add('loading');
        }

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
        // Apply mood
        if (settings.mood !== undefined) {
            this.setSelectValue('mood', settings.mood);
        }

        // Apply sound engine
        if (settings.soundEngine !== undefined) {
            this.setSelectValue('sound-engine', settings.soundEngine);
        }

        // Apply instrument
        if (settings.melodicInstrument !== undefined) {
            this.setSelectValue('melodic-instrument', settings.melodicInstrument);
        }

        // Apply toggles
        if (settings.melody !== undefined) {
            this.setToggleButton('melody-toggle', settings.melody);
        }
        if (settings.clock !== undefined) {
            this.setAmbientToggle('clock', settings.clock);
        }
        if (settings.noise !== undefined) {
            this.setAmbientToggle('waves', settings.noise);
        }
        if (settings.thunder !== undefined) {
            this.setAmbientToggle('thunder', settings.thunder);
        }

        // Apply sliders
        if (settings.noteDensity !== undefined) {
            this.setSliderValue('density', settings.noteDensity);
        }
        if (settings.reverb !== undefined) {
            this.setSliderValue('reverb', settings.reverb);
        }
        if (settings.noteFrequency !== undefined) {
            this.setSliderValue('melodic-frequency', settings.noteFrequency);
        }
        if (settings.melodicReverb !== undefined) {
            this.setSliderValue('melodic-reverb', settings.melodicReverb);
        }
        if (settings.layerRandomness !== undefined) {
            this.setSliderValue('layer-randomness', settings.layerRandomness);
        }
        if (settings.melodySlotCount !== undefined) {
            this.setSliderValue('melody-slot-count', settings.melodySlotCount);
        }
        if (settings.masterVolume !== undefined) {
            this.setSliderValue('volume', settings.masterVolume);
        }
        if (settings.waveVolume !== undefined) {
            this.setSliderValue('noise-volume', settings.waveVolume);
        }
        if (settings.clockTempo !== undefined) {
            this.setSliderValue('clock-tempo', settings.clockTempo);
        }
        if (settings.waveNoiseType !== undefined) {
            this.setSelectValue('noise-type', settings.waveNoiseType);
        }
    }

    setSliderValue(elementId, value) {
        const slider = document.getElementById(elementId);
        if (slider) {
            slider.value = value;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    setSelectValue(elementId, value) {
        const select = document.getElementById(elementId);
        if (select) {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    setAmbientToggle(elementId, enabled) {
        const toggle = document.querySelector('.ambient-toggle[data-sound=' + elementId + ']');
        if (!toggle) {
            console.warn(`Ambient toggle not found for: ${elementId}`);
            return;
        }

        const isCurrentlyActive = toggle.classList.contains('active');
        if (enabled !== isCurrentlyActive) {
            console.debug(`Preset: ${enabled ? 'Enabling' : 'Disabling'} ${elementId} ambient sound`);
            toggle.click();
        }
    }

    setToggleButton(elementId, enabled) {
        const toggle = document.getElementById(elementId);
        if (!toggle) {
            console.warn(`Toggle button not found for: ${elementId}`);
            return;
        }

        const isCurrentlyActive = toggle.checked === true;
        if (isCurrentlyActive !== enabled) {
            toggle.checked = enabled;
            toggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    setActivePreset(activeButton) {
        document.querySelectorAll('.preset-pill').forEach(btn => {
            btn.classList.remove('active');
        });

        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    getCurrentPreset() {
        return this.currentPreset;
    }

    getPresetData(presetKey) {
        return this.presets[presetKey];
    }
}