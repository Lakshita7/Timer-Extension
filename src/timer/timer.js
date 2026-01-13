// Timer overlay script
let currentState = {
  isRunning: false,
  isPaused: false,
  remainingTime: 0
};

let totalTime = null;
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get references to DOM elements
  const timeDisplay = document.getElementById('timeDisplay');
  const statusText = document.getElementById('statusText');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const pauseIcon = document.getElementById('pauseIcon');

  // Pause/Resume button click handler
  pauseBtn.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.state) {
        if (response.state.isPaused) {
          await chrome.runtime.sendMessage({ action: 'resumeTimer' });
        } else {
          await chrome.runtime.sendMessage({ action: 'pauseTimer' });
        }
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  });

  // Reset button click handler
  resetBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'resetTimer' });
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  });

  // Listen for state updates from parent window (content script)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'updateState') {
      updateDisplay(event.data.state);
    }
  });

  // Request initial state from background
  (async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.state) {
        updateDisplay(response.state);
      }
    } catch (error) {
      console.error('Error getting initial state:', error);
    }
  })();

  // Update display every second
  setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.state) {
        updateDisplay(response.state);
      }
    } catch (error) {
      console.error('Error updating display:', error);
    }
  }, 1000);
});

function updateDisplay(state) {
  if (!state) return;

  const timeDisplay = document.getElementById('timeDisplay');
  const statusText = document.getElementById('statusText');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseIcon = document.getElementById('pauseIcon');
  const progressFill = document.getElementById('progressFill');

  // Capture total time once
  if (state.isRunning && totalTime === null) {
    totalTime = state.remainingTime;
  }

  // Timer finished or reset
  if (!state.isRunning || state.remainingTime <= 0) {
    timeDisplay.textContent = '0:00';
    statusText.textContent =
      state.remainingTime === 0 && state.isRunning === false
        ? 'Timer Finished!'
        : 'Ready';

    statusText.classList.add('finished');
    pauseBtn.disabled = false;

    // Fill bar completely
    if (progressFill) progressFill.style.width = '100%';

    totalTime = null;
    return;
  }

  // Time formatting
  const minutes = Math.floor(state.remainingTime / 60);
  const seconds = state.remainingTime % 60;
  timeDisplay.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`;

  // Status
  statusText.classList.remove('finished');

  if (state.isPaused) {
    statusText.textContent = 'Paused';
    pauseIcon.textContent = '▶';
  } else {
    statusText.textContent = 'Running';
    pauseIcon.textContent = '⏸';
  }

  // Progress update
  if (progressFill && totalTime) {
    const progress =
      ((totalTime - state.remainingTime) / totalTime) * 100;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
  }

  pauseBtn.disabled = false;
}
