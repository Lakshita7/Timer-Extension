// Content script that injects the timer overlay
let timerIframe = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let updateInterval = null;

// Listen for messages from background and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showTimer') {
    showTimer();
    sendResponse({ success: true });
  } else if (request.action === 'hideTimer') {
    hideTimer();
    sendResponse({ success: true });
  } else if (request.action === 'updateTimer') {
    updateTimerDisplay(request.state);
    sendResponse({ success: true });
  }
  return true;
});

async function showTimer() {
  if (timerIframe) {
    timerIframe.style.display = 'block';
    startUpdating();
    return;
  }

  // Load saved position or use default
  let savedX = window.innerWidth - 300; // Default: right side with margin
  let savedY = 20; // Default: top with margin
  
  try {
    const result = await chrome.storage.local.get(['timerPosition']);
    if (result.timerPosition) {
      savedX = result.timerPosition.x;
      savedY = result.timerPosition.y;
    }
  } catch (error) {
    console.error('Error loading position:', error);
  }

  // Create iframe for timer
  timerIframe = document.createElement('iframe');
  timerIframe.id = 'timer-extension-iframe';
  timerIframe.src = chrome.runtime.getURL('src/timer/timer.html');
  
  // Styling for the iframe
  Object.assign(timerIframe.style, {
    position: 'fixed',
    left: savedX + 'px',
    top: savedY + 'px',
    width: '280px',
    height: '200px',
    border: 'none',
    borderRadius: '16px',
    zIndex: '2147483647',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    backgroundColor: 'transparent',
    pointerEvents: 'auto',
    cursor: 'default'
  });

  document.body.appendChild(timerIframe);

  // Setup drag after a short delay to ensure iframe is ready
  setTimeout(() => {
    setupDragFunctionality();
  }, 100);

  // Wait for iframe to load
  timerIframe.addEventListener('load', async () => {
    startUpdating();
    
    // Send initial state
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.state) {
        updateTimerDisplay(response.state);
      }
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.log('Extension reloaded during initialization');
        hideTimer();
      } else {
        console.error('Error getting initial state:', error);
      }
    }
  });
}

function hideTimer() {
  if (timerIframe) {
    timerIframe.remove();
    timerIframe = null;
    stopUpdating();
  }
  
  // Also remove drag overlay if it exists
  const overlay = document.getElementById('timer-drag-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function startUpdating() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  updateInterval = setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.state) {
        updateTimerDisplay(response.state);
      }
    } catch (error) {
      // Extension context invalidated - extension was reloaded
      if (error.message.includes('Extension context invalidated')) {
        console.log('Extension reloaded, cleaning up...');
        stopUpdating();
        if (timerIframe) {
          timerIframe.remove();
          timerIframe = null;
        }
        const overlay = document.getElementById('timer-drag-overlay');
        if (overlay) {
          overlay.remove();
        }
      } else {
        console.error('Error getting timer state:', error);
      }
    }
  }, 1000);
}

function stopUpdating() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

function updateTimerDisplay(state) {
  if (timerIframe && timerIframe.contentWindow) {
    try {
      timerIframe.contentWindow.postMessage({
        action: 'updateState',
        state: state
      }, '*');
    } catch (e) {
      console.error('Error posting message to iframe:', e);
    }
  }
}

function setupDragFunctionality() {
  if (!timerIframe) return;

  // Create an invisible overlay div that covers the header area
  const dragOverlay = document.createElement('div');
  dragOverlay.id = 'timer-drag-overlay';
  Object.assign(dragOverlay.style, {
    position: 'fixed',
    left: timerIframe.style.left,
    top: timerIframe.style.top,
    width: '280px',
    height: '50px', // Header height
    zIndex: '2147483648', // Above iframe
    cursor: 'grab',
    backgroundColor: 'transparent'
  });
  
  document.body.appendChild(dragOverlay);

  // Mouse down on drag overlay
  dragOverlay.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragOverlay.style.cursor = 'grabbing';
    
    const iframeRect = timerIframe.getBoundingClientRect();
    dragOffsetX = e.clientX - iframeRect.left;
    dragOffsetY = e.clientY - iframeRect.top;
    
    e.preventDefault();
  });

  // Mouse move on document
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !timerIframe) return;

    e.preventDefault();

    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 280;
    const maxY = window.innerHeight - 200;

    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));

    // Update both iframe and overlay positions
    timerIframe.style.left = boundedX + 'px';
    timerIframe.style.top = boundedY + 'px';
    dragOverlay.style.left = boundedX + 'px';
    dragOverlay.style.top = boundedY + 'px';
  });

  // Mouse up on document
  document.addEventListener('mouseup', async () => {
    if (isDragging) {
      isDragging = false;
      dragOverlay.style.cursor = 'grab';
      
      // Save position
      const rect = timerIframe.getBoundingClientRect();
      try {
        await chrome.storage.local.set({
          timerPosition: { x: rect.left, y: rect.top }
        });
      } catch (error) {
        console.error('Error saving position:', error);
      }
    }
  });
}

// Check if timer should be visible on page load
(async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
    if (response && response.state && response.state.isRunning) {
      showTimer();
    }
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      // Extension was reloaded, do nothing
      console.log('Extension context invalidated on page load');
    } else {
      console.error('Error checking initial timer state:', error);
    }
  }
})();