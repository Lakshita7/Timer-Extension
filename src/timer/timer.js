const { createApp } = Vue;

createApp({
  data() {
    return {
      totalSeconds: 0,
      minutes: 0,
      seconds: 0,
      intervalId: null,
      isRunning: false,
      isFinished: false
    };
  },
  mounted() {
    window.addEventListener('message', (event) => {
      if (event.data.action === 'initTimer') {
        this.startTimer(event.data.minutes);
      }
    });
  },
  computed: {
    displayTime() {
      const mins = String(this.minutes).padStart(2, '0');
      const secs = String(this.seconds).padStart(2, '0');
      return `${mins}:${secs}`;
    }
  },
  methods: {
    startTimer(minutes) {
      this.totalSeconds = minutes * 60;
      this.minutes = minutes;
      this.seconds = 0;
      this.isRunning = true;
      this.isFinished = false;

      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.intervalId = setInterval(() => {
        if (this.totalSeconds > 0) {
          this.totalSeconds--;
          this.minutes = Math.floor(this.totalSeconds / 60);
          this.seconds = this.totalSeconds % 60;
        } else {
          this.finishTimer();
        }
      }, 1000);
    },
    pauseTimer() {
      if (this.isRunning) {
        clearInterval(this.intervalId);
        this.isRunning = false;
      } else {
        this.intervalId = setInterval(() => {
          if (this.totalSeconds > 0) {
            this.totalSeconds--;
            this.minutes = Math.floor(this.totalSeconds / 60);
            this.seconds = this.totalSeconds % 60;
          } else {
            this.finishTimer();
          }
        }, 1000);
        this.isRunning = true;
      }
    },
    resetTimer() {
      clearInterval(this.intervalId);
      this.totalSeconds = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.isRunning = false;
      this.isFinished = false;
    },
    finishTimer() {
      clearInterval(this.intervalId);
      this.isRunning = false;
      this.isFinished = true;
      
      // Play notification sound if needed
      // You can add a notification here
    }
  },
  beforeUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
  template: `
    <div class="timer-container" :class="{ 'timer-finished': isFinished }">
      <div class="timer-label">{{ isFinished ? 'Timer Finished!' : 'Time Remaining' }}</div>
      <div class="timer-display">{{ displayTime }}</div>
      <div class="timer-controls">
        <button class="timer-btn" @click="pauseTimer">
          {{ isRunning ? 'Pause' : 'Resume' }}
        </button>
        <button class="timer-btn" @click="resetTimer">Reset</button>
      </div>
    </div>
  `
}).mount('#app');

