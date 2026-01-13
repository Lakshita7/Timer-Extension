let overlayContainer = null;
let dragHandle = null;
let timerIframe = null;

// Check for existing timer when content script loads
checkForExistingTimer();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.action === 'showTimerOverlay') {
    showTimerOverlay();
    sendResponse({ success: true });
  } else if (message.action === 'hideTimerOverlay') {
    hideTimerOverlay();
    sendResponse({ success: true });
  }
  return true;
});

async function checkForExistingTimer() {
  try {
    const result = await chrome.storage.local.get(['timerOverlayVisible']);
    if (result.timerOverlayVisible) {
      showTimerOverlay();
    }
  } catch (error) {
    console.error('Error checking for existing overlay:', error);
  }
}

async function showTimerOverlay() {
  // Remove existing overlay if any
  const existing = document.getElementById('timer-extension-overlay-container');
  if (existing) {
    existing.remove();
  }

  // Get saved position or use default
  let savedPosition = { x: null, y: null };
  try {
    const result = await chrome.storage.local.get(['timerOverlayPosition']);
    if (result.timerOverlayPosition) {
      savedPosition = result.timerOverlayPosition;
    }
  } catch (error) {
    console.error('Error loading overlay position:', error);
  }

  // Calculate default position (top-right corner)
  const defaultX = savedPosition.x !== null ? savedPosition.x : window.innerWidth - 340; // 320px width + 20px margin
  const defaultY = savedPosition.y !== null ? savedPosition.y : 20;

  // Create container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'timer-extension-overlay-container';
  overlayContainer.style.left = defaultX + 'px';
  overlayContainer.style.top = defaultY + 'px';

  // Create drag handle
  dragHandle = document.createElement('div');
  dragHandle.id = 'timer-extension-drag-handle';
  dragHandle.textContent = '⏱️ Drag to move';

  // Create iframe
  timerIframe = document.createElement('iframe');
  timerIframe.id = 'timer-extension-iframe';
  timerIframe.src = chrome.runtime.getURL('src/popup/popup.html');

  overlayContainer.appendChild(dragHandle);
  overlayContainer.appendChild(timerIframe);
  
  if (document.body) {
    document.body.appendChild(overlayContainer);
    makeDraggable(overlayContainer, dragHandle);
    
    // Mark overlay as visible
    chrome.storage.local.set({ timerOverlayVisible: true });
  }
}

function hideTimerOverlay() {
  const overlay = document.getElementById('timer-extension-overlay-container');
  if (overlay) {
    overlay.remove();
    overlayContainer = null;
    dragHandle = null;
    timerIframe = null;
  }
  chrome.storage.local.set({ timerOverlayVisible: false });
}

function makeDraggable(element, handle) {
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // Get initial position from element
  const rect = element.getBoundingClientRect();
  xOffset = rect.left;
  yOffset = rect.top;

  const dragStart = (e) => {
    if (e.target === handle || handle.contains(e.target)) {
      isDragging = true;
      
      if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }
      
      handle.style.cursor = 'grabbing';
    }
  };

  const dragEnd = () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'move';
      
      // Save position to storage
      chrome.storage.local.set({
        timerOverlayPosition: { x: xOffset, y: yOffset }
      });
    }
  };

  const drag = (e) => {
    if (isDragging) {
      e.preventDefault();
      
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      
      currentX = clientX - initialX;
      currentY = clientY - initialY;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Get element dimensions
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;
      
      // Constrain within viewport boundaries
      const minX = 0;
      const minY = 0;
      const maxX = viewportWidth - elementWidth;
      const maxY = viewportHeight - elementHeight;
      
      // Apply constraints
      currentX = Math.max(minX, Math.min(maxX, currentX));
      currentY = Math.max(minY, Math.min(maxY, currentY));

      xOffset = currentX;
      yOffset = currentY;

      // Update position
      element.style.left = currentX + 'px';
      element.style.top = currentY + 'px';
      element.style.right = 'auto';
    }
  };

  handle.addEventListener('mousedown', dragStart);
  handle.addEventListener('touchstart', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);
  
  handle.addEventListener('selectstart', (e) => e.preventDefault());
}
