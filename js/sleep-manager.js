class SleepModeManager {
    constructor() {
        this.sleepMode = {
            active: false,
            totalMinutes: 0,
            remainingSeconds: 0,
            countdownInterval: null,
            displayUpdateInterval: null
        };

        this.sleepBtn = document.getElementById('sleepBtn');
        this.sleepText = document.getElementById('sleepText');

        this.setupSleepButton();
    }

    setupSleepButton() {
        this.sleepBtn.addEventListener('click', () => this.handleSleepMode());
    }

    handleSleepMode() {
        if (!this.sleepMode.active) {
            this.startSleepMode(5);
        } else {
            this.addSleepTime(5);
        }
    }

    startSleepMode(minutes) {
        this.sleepMode.active = true;
        this.sleepMode.totalMinutes = minutes;
        this.sleepMode.remainingSeconds = minutes * 60;

        this.sleepBtn.classList.add('active');

        this.startCountdown();
        this.updateDisplayEveryMinute();

        console.log(`Sleep mode started: ${minutes} minutes`);
    }

    addSleepTime(minutes) {
        this.sleepMode.totalMinutes += minutes;
        this.sleepMode.remainingSeconds += minutes * 60;

        if (this.sleepMode.totalMinutes > 60) {
            this.disableSleepMode();
            return;
        }

        this.updateSleepDisplay();
        console.log(`Sleep time extended: ${this.sleepMode.totalMinutes} total minutes`);
    }

    disableSleepMode() {
        console.log("Sleep mode disabled");

        if (this.sleepMode.countdownInterval) {
            clearInterval(this.sleepMode.countdownInterval);
        }
        if (this.sleepMode.displayUpdateInterval) {
            clearInterval(this.sleepMode.displayUpdateInterval);
        }

        this.sleepMode = {
            active: false,
            totalMinutes: 0,
            remainingSeconds: 0,
            countdownInterval: null,
            displayUpdateInterval: null
        };

        this.sleepBtn.classList.remove('active');
        this.sleepText.textContent = 'Sleep Mode';
    }

    startCountdown() {
        if (this.sleepMode.countdownInterval) {
            clearInterval(this.sleepMode.countdownInterval);
        }

        this.sleepMode.countdownInterval = setInterval(() => {
            this.sleepMode.remainingSeconds--;

            if (this.sleepMode.remainingSeconds <= 0) {
                this.onSleepTimeout();
            }
        }, 1000);
    }

    updateDisplayEveryMinute() {
        // Update immediately
        this.updateSleepDisplay();

        if (this.sleepMode.displayUpdateInterval) {
            clearInterval(this.sleepMode.displayUpdateInterval);
        }

        // Then update every minute
        this.sleepMode.displayUpdateInterval = setInterval(() => {
            if (this.sleepMode.active) {
                this.updateSleepDisplay();
            }
        }, 60000); // Update every 60 seconds
    }

    updateSleepDisplay() {
        const remainingMinutes = Math.round(this.sleepMode.remainingSeconds / 60);
        this.sleepText.textContent = `Sleep: ${remainingMinutes}m`;
    }

    onSleepTimeout() {
        console.log("Sleep timeout - stopping music");

        // Call your existing stop music function
        stopMusic(); // Replace with your actual stop function name

        this.disableSleepMode();
    }
}