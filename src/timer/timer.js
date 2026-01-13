let totalSeconds = 0;
let minutes = 0;
let seconds = 0;
let intervalId = null;
let isRunning = false;
let isFinished = false;

// DOM elements
let timerDisplay = null;
let timerLabel = null;
let pauseBtn = null;
let resetBtn = null;
let container = null;

function init() {
  // Get or create the timer container
  const app = document.getElementById('app');
  container = document.querySelector('.timer-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'timer-container';
    if (app) {
      app.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }

  // Create label
  timerLabel = document.createElement('div');
  timerLabel.className = 'timer-label';
  timerLabel.textContent = 'Time Remaining';

  // Create display
  timerDisplay = document.createElement('div');
  timerDisplay.className = 'timer-display';
  timerDisplay.textContent = '00:00';

  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'timer-controls';

  // Create pause button
  pauseBtn = document.createElement('button');
  pauseBtn.className = 'timer-btn';
  pauseBtn.textContent = 'Pause';
  pauseBtn.addEventListener('click', pauseTimer);

  // Create reset button
  resetBtn = document.createElement('button');
  resetBtn.className = 'timer-btn';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', resetTimer);

  controlsContainer.appendChild(pauseBtn);
  controlsContainer.appendChild(resetBtn);

  // Append all elements
  container.appendChild(timerLabel);
  container.appendChild(timerDisplay);
  container.appendChild(controlsContainer);

  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    if (event.data.action === 'initTimer') {
      startTimer(
        event.data.minutes || 0, 
        event.data.seconds || 0, 
        event.data.totalSeconds || null
      );
    } else if (event.data.action === 'pauseTimer') {
      if (isRunning) {
        pauseTimer();
      }
    } else if (event.data.action === 'resumeTimer') {
      if (!isRunning && totalSeconds > 0) {
        pauseTimer(); // toggle to resume
      }
    }
  });
}

function startTimer(minutesInput, secondsInput = 0, totalSecondsInput = null) {
  if (totalSecondsInput !== null) {
    totalSeconds = totalSecondsInput;
    minutes = minutesInput;
    seconds = secondsInput;
  } else {
    totalSeconds = minutesInput * 60;
    minutes = minutesInput;
    seconds = 0;
  }
  
  isRunning = true;
  isFinished = false;

  if (intervalId) {
    clearInterval(intervalId);
  }

  updateDisplay();
  updateLabel('Time Remaining');
  container.classList.remove('timer-finished');

  intervalId = setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
      minutes = Math.floor(totalSeconds / 60);
      seconds = totalSeconds % 60;
      updateDisplay();
    } else {
      finishTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(intervalId);
    isRunning = false;
    pauseBtn.textContent = 'Resume';
  } else {
    intervalId = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;
        updateDisplay();
      } else {
        finishTimer();
      }
    }, 1000);
    isRunning = true;
    pauseBtn.textContent = 'Pause';
  }
}

function resetTimer() {
  clearInterval(intervalId);
  totalSeconds = 0;
  minutes = 0;
  seconds = 0;
  isRunning = false;
  isFinished = false;
  pauseBtn.textContent = 'Pause';
  updateDisplay();
  updateLabel('Time Remaining');
  container.classList.remove('timer-finished');
}

function finishTimer() {
  clearInterval(intervalId);
  isRunning = false;
  isFinished = true;
  pauseBtn.textContent = 'Pause';
  updateLabel('Timer Finished!');
  container.classList.add('timer-finished');
}

function updateDisplay() {
  const mins = String(minutes).padStart(2, '0');
  const secs = String(seconds).padStart(2, '0');
  timerDisplay.textContent = `${mins}:${secs}`;
}

function updateLabel(text) {
  timerLabel.textContent = text;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
