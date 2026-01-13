// Background service worker for timer extension
let timerState = {
  isRunning: false,
  isPaused: false,
  remainingTime: 0,
  endTime: null,
  selectedDuration: 0
};

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle messages with async functions
  (async () => {
    try {
      if (request.action === 'startTimer') {
        await startTimer(request.duration);
        sendResponse({ success: true });
      } else if (request.action === 'stopTimer') {
        await stopTimer();
        sendResponse({ success: true });
      } else if (request.action === 'pauseTimer') {
        await pauseTimer();
        sendResponse({ success: true });
      } else if (request.action === 'resumeTimer') {
        await resumeTimer();
        sendResponse({ success: true });
      } else if (request.action === 'resetTimer') {
        await resetTimer();
        sendResponse({ success: true });
      } else if (request.action === 'getTimerState') {
        sendResponse({ state: getTimerState() });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate we will send a response asynchronously
  return true;
});

async function startTimer(duration) {
  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.selectedDuration = duration;
  timerState.remainingTime = duration;
  timerState.endTime = Date.now() + (duration * 1000);
  
  // Save state to storage
  await chrome.storage.local.set({ timerState });
  
  // Show timer on all tabs immediately
  await showTimerOnAllTabs();
  
  // Broadcast state update to all tabs
  await broadcastTimerUpdate();
  
  // Set up alarm to tick every second
  await chrome.alarms.create('timerTick', { periodInMinutes: 1/60 });
}

// New function to show timer on all tabs
async function showTimerOnAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showTimer'
          });
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
    }
  } catch (error) {
    console.error('Error showing timer on all tabs:', error);
  }
}

async function stopTimer() {
  timerState.isRunning = false;
  timerState.isPaused = false;
  timerState.remainingTime = 0;
  timerState.endTime = null;
  
  await chrome.alarms.clear('timerTick');
  await chrome.storage.local.set({ timerState });
  
  // Hide timer on all tabs
  await hideTimerOnAllTabs();
  
  await broadcastTimerUpdate();
}

// New function to hide timer on all tabs
async function hideTimerOnAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'hideTimer'
          });
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
    }
  } catch (error) {
    console.error('Error hiding timer on all tabs:', error);
  }
}

async function pauseTimer() {
  if (timerState.isRunning && !timerState.isPaused) {
    timerState.isPaused = true;
    timerState.remainingTime = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
    
    await chrome.alarms.clear('timerTick');
    await chrome.storage.local.set({ timerState });
    
    await broadcastTimerUpdate();
  }
}

async function resumeTimer() {
  if (timerState.isRunning && timerState.isPaused) {
    timerState.isPaused = false;
    timerState.endTime = Date.now() + (timerState.remainingTime * 1000);
    
    await chrome.storage.local.set({ timerState });
    await chrome.alarms.create('timerTick', { periodInMinutes: 1/60 });
    
    await broadcastTimerUpdate();
  }
}

async function resetTimer() {
  if (timerState.isRunning) {
    timerState.isPaused = false;
    timerState.remainingTime = timerState.selectedDuration;
    timerState.endTime = Date.now() + (timerState.selectedDuration * 1000);
    
    await chrome.storage.local.set({ timerState });
    
    await broadcastTimerUpdate();
  }
}

function getTimerState() {
  if (timerState.isRunning && !timerState.isPaused) {
    timerState.remainingTime = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
  }
  return timerState;
}

// Handle timer ticks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timerTick') {
    if (timerState.isRunning && !timerState.isPaused) {
      const remaining = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
      timerState.remainingTime = remaining;
      
      if (remaining <= 0) {
        // Timer finished
        timerState.isRunning = false;
        timerState.isPaused = false;
        await chrome.alarms.clear('timerTick');
        
        // Show notification (try-catch in case icons don't exist)
        try {
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: 'Timer Finished!',
            message: 'Your countdown timer has completed.',
            priority: 2
          });
        } catch (e) {
          console.log('Notification error:', e);
        }
      }
      
      await chrome.storage.local.set({ timerState });
      await broadcastTimerUpdate();
    }
  }
});

// Broadcast timer updates to all tabs
async function broadcastTimerUpdate() {
  try {
    const tabs = await chrome.tabs.query({});
    const state = getTimerState();
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'updateTimer',
            state: state
          });
        } catch (error) {
          // Ignore errors for tabs that don't have content script
        }
      }
    }
  } catch (error) {
    console.error('Error broadcasting update:', error);
  }
}

// Restore timer state on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.local.get(['timerState']);
    if (result.timerState) {
      timerState = result.timerState;
      
      // If timer was running, adjust the end time
      if (timerState.isRunning && !timerState.isPaused) {
        const elapsed = Date.now() - (timerState.endTime - (timerState.remainingTime * 1000));
        timerState.remainingTime = Math.max(0, timerState.remainingTime - Math.floor(elapsed / 1000));
        timerState.endTime = Date.now() + (timerState.remainingTime * 1000);
        
        if (timerState.remainingTime > 0) {
          await chrome.alarms.create('timerTick', { periodInMinutes: 1/60 });
        } else {
          timerState.isRunning = false;
        }
      }
    }
  } catch (error) {
    console.error('Error restoring timer state on startup:', error);
  }
});

// Also restore on install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const result = await chrome.storage.local.get(['timerState']);
    if (result.timerState) {
      timerState = result.timerState;
    }
  } catch (error) {
    console.error('Error restoring timer state on install:', error);
  }
});