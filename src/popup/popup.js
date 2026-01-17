// Popup script for timer extension
document.addEventListener('DOMContentLoaded', () => {
  const timerButtons = document.querySelectorAll('.timer-btn[data-duration]');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');
  const timerDisplay = document.getElementById('timerDisplay');

  // Add click handlers for timer buttons
  timerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const duration = parseInt(btn.dataset.duration);
      startTimer(duration);
    });
  });

  // Stop button handler
  stopBtn.addEventListener('click', () => {
    stopTimer();
  });

  // Check current timer state on popup open
  checkTimerState();

  // Update display every second
  setInterval(checkTimerState, 1000);
});

async function startTimer(duration) {
  try {
    // Start the timer in the background - it will show on all tabs automatically
    await chrome.runtime.sendMessage({
      action: 'startTimer',
      duration: duration
    });
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('Extension reloaded, please try again');
      window.close(); // Close popup
    } else {
      console.error('Error starting timer:', error);
    }
  }
}

async function stopTimer() {
  try {
    // Stop timer in background - it will hide on all tabs automatically
    await chrome.runtime.sendMessage({
      action: 'stopTimer'
    });
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('Extension reloaded, please try again');
      window.close(); // Close popup
    } else {
      console.error('Error stopping timer:', error);
    }
  }
}

async function checkTimerState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
    
    if (response && response.state) {
      const state = response.state;
      
      if (state.isRunning && state.remainingTime > 0) {
        status.classList.remove('hidden');
        updateDisplay(state.remainingTime, state.isPaused);
      } else {
        status.classList.add('hidden');
      }
    }
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      // Extension was reloaded, stop checking
      return;
    } else {
      console.error('Error getting timer state:', error);
    }
  }
}

function updateDisplay(seconds, isPaused) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
  
  timerDisplay.textContent = timeStr;
  
  const statusLabel = document.getElementById('statusLabel');
  if (statusLabel) {
    if (isPaused) {
      statusLabel.textContent = 'Timer Paused';
    } else {
      statusLabel.textContent = 'Timer Active';
    }
  }
}