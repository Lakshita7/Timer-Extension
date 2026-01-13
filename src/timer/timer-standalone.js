document.addEventListener('DOMContentLoaded', () => {
  const timerStatusContainer = document.getElementById('timerStatus');
  const timerOptionsContainer = document.getElementById('timerOptions');
  const timerDisplay = document.getElementById('timerDisplay');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const closeBtn = document.getElementById('closeBtn');
  const buttons = document.querySelectorAll('.timer-option[data-minutes]');

  let updateInterval = null;

  // Check timer state and update UI
  updateTimerStatus();

  // Timer duration buttons
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const minutes = parseInt(button.getAttribute('data-minutes'));
      startTimer(minutes);
    });
  });

  // Control buttons
  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  stopBtn.addEventListener('click', () => {
    stopTimer();
  });

  // Close button
  closeBtn.addEventListener('click', () => {
    window.close();
  });

  async function updateTimerStatus() {
    try {
      const result = await chrome.storage.local.get([
        'timerActive', 
        'timerTotalSeconds', 
        'timerStartTime',
        'timerPaused',
        'timerPausedTime',
        'timerPausedSeconds'
      ]);

      if (result.timerActive && result.timerTotalSeconds) {
        // Calculate remaining time
        let remainingSeconds;
        if (result.timerPaused && result.timerPausedSeconds !== undefined) {
          // Timer is paused
          remainingSeconds = result.timerPausedSeconds;
        } else {
          // Timer is running
          const elapsed = Math.floor((Date.now() - (result.timerStartTime || Date.now())) / 1000);
          remainingSeconds = Math.max(0, result.timerTotalSeconds - elapsed);
        }

        if (remainingSeconds > 0) {
          showTimerStatus(remainingSeconds, result.timerPaused || false);
          startUpdateInterval(result);
        } else {
          // Timer finished
          showTimerOptions();
          chrome.storage.local.set({ timerActive: false });
        }
      } else {
        showTimerOptions();
      }
    } catch (error) {
      console.error('Error updating timer status:', error);
      showTimerOptions();
    }
  }

  function showTimerStatus(remainingSeconds, isPaused) {
    timerStatusContainer.style.display = 'block';
    timerOptionsContainer.style.display = 'none';
    
    updateDisplay(remainingSeconds);
    
    if (isPaused) {
      pauseBtn.textContent = 'Resume';
      pauseBtn.className = 'control-btn resume-btn';
    } else {
      pauseBtn.textContent = 'Pause';
      pauseBtn.className = 'control-btn pause-btn';
    }
  }

  function showTimerOptions() {
    timerStatusContainer.style.display = 'none';
    timerOptionsContainer.style.display = 'block';
    
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  function updateDisplay(remainingSeconds) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const mins = String(minutes).padStart(2, '0');
    const secs = String(seconds).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }

  function startUpdateInterval(result) {
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    if (!result.timerPaused) {
      // Only update if not paused
      updateInterval = setInterval(async () => {
        const state = await chrome.storage.local.get(['timerActive', 'timerTotalSeconds', 'timerStartTime', 'timerPaused', 'timerPausedSeconds']);
        
        if (state.timerActive && !state.timerPaused) {
          const elapsed = Math.floor((Date.now() - (state.timerStartTime || Date.now())) / 1000);
          const remainingSeconds = Math.max(0, state.timerTotalSeconds - elapsed);
          
          if (remainingSeconds > 0) {
            updateDisplay(remainingSeconds);
          } else {
            showTimerOptions();
            chrome.storage.local.set({ timerActive: false });
            clearInterval(updateInterval);
          }
        }
      }, 1000);
    }
  }

  async function togglePause() {
    try {
      const result = await chrome.storage.local.get(['timerActive', 'timerPaused', 'timerTotalSeconds', 'timerStartTime', 'timerPausedSeconds']);
      
      if (!result.timerActive) return;

      const newPausedState = !result.timerPaused;

      if (newPausedState) {
        // Pausing
        const elapsed = Math.floor((Date.now() - (result.timerStartTime || Date.now())) / 1000);
        const pausedSeconds = Math.max(0, result.timerTotalSeconds - elapsed);
        
        await chrome.storage.local.set({
          timerPaused: true,
          timerPausedTime: Date.now(),
          timerPausedSeconds: pausedSeconds
        });

        pauseBtn.textContent = 'Resume';
        pauseBtn.className = 'control-btn resume-btn';
        
        if (updateInterval) {
          clearInterval(updateInterval);
        }
      } else {
        // Resuming
        const pausedSeconds = result.timerPausedSeconds || result.timerTotalSeconds;
        
        await chrome.storage.local.set({
          timerPaused: false,
          timerStartTime: Date.now(),
          timerTotalSeconds: pausedSeconds,
          timerPausedTime: null,
          timerPausedSeconds: null
        });

        pauseBtn.textContent = 'Pause';
        pauseBtn.className = 'control-btn pause-btn';
        
        startUpdateInterval({ timerPaused: false });
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  }

  async function startTimer(minutes) {
    try {
      // Store timer state
      await chrome.storage.local.set({
        timerActive: true,
        timerMinutes: minutes,
        timerStartTime: Date.now(),
        timerTotalSeconds: minutes * 60,
        timerPaused: false,
        timerPausedTime: null,
        timerPausedSeconds: null
      });

      updateTimerStatus();
    } catch (error) {
      console.error('Error in startTimer:', error);
      alert('Error: ' + error.message);
    }
  }

  async function stopTimer() {
    try {
      // Clear timer state
      await chrome.storage.local.set({
        timerActive: false,
        timerPaused: false
      });

      showTimerOptions();
    } catch (error) {
      console.error('Error in stopTimer:', error);
    }
  }
});

