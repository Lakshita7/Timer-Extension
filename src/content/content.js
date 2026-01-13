let timerFrame = null;
let dragHandle = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    startTimer(message.minutes);
  } else if (message.action === 'stopTimer') {
    stopTimer();
  }
});

function startTimer(minutes) {
  // Remove existing timer if any
  if (timerFrame) {
    timerFrame.remove();
    timerFrame = null;
  }

  // Create container for the timer
  const container = document.createElement('div');
  container.id = 'timer-extension-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 250px;
    height: 180px;
    z-index: 999999;
    pointer-events: auto;
  `;

  // Create drag handle (header bar)
  dragHandle = document.createElement('div');
  dragHandle.id = 'timer-drag-handle';
  dragHandle.style.cssText = `
    width: 100%;
    height: 30px;
    background: #4CAF50;
    cursor: move;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
    user-select: none;
  `;
  dragHandle.textContent = '⏱️ Drag to move';

  // Create iframe for the timer
  timerFrame = document.createElement('iframe');
  timerFrame.id = 'timer-extension-overlay';
  timerFrame.src = chrome.runtime.getURL('src/timer/timer.html');
  timerFrame.style.cssText = `
    width: 100%;
    height: calc(100% - 30px);
    border: none;
    border-radius: 0 0 8px 8px;
    background: transparent;
    display: block;
  `;

  container.appendChild(dragHandle);
  container.appendChild(timerFrame);
  document.body.appendChild(container);

  // Wait for iframe to load, then send timer data
  timerFrame.onload = () => {
    timerFrame.contentWindow.postMessage({
      action: 'initTimer',
      minutes: minutes
    }, '*');
  };

  // Make it draggable
  makeDraggable(container, dragHandle);
}

function stopTimer() {
  const container = document.getElementById('timer-extension-container');
  if (container) {
    container.remove();
    timerFrame = null;
    dragHandle = null;
  }
}

function makeDraggable(element, handle) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const dragStart = (e) => {
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === handle || handle.contains(e.target)) {
      isDragging = true;
    }
  };

  const dragEnd = () => {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  };

  const drag = (e) => {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, element);
    }
  };

  const setTranslate = (xPos, yPos, el) => {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  };

  handle.addEventListener('mousedown', dragStart);
  handle.addEventListener('touchstart', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);
}

