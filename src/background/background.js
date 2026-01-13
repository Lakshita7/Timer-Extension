// Open timer window when extension icon is clicked
chrome.action.onClicked.addListener(async () => {
  try {
    // Check if window already exists
    const windows = await chrome.windows.getAll();
    const existingWindow = windows.find(w => 
      w.type === 'popup' && w.url && w.url.includes('timer-standalone.html')
    );

    if (existingWindow) {
      // Focus existing window
      chrome.windows.update(existingWindow.id, { focused: true });
    } else {
      // Create new timer window
      const savedPosition = await chrome.storage.local.get(['timerWindowPosition']);
      
      chrome.windows.create({
        url: chrome.runtime.getURL('src/timer/timer-standalone.html'),
        type: 'popup',
        width: 300,
        height: 220,
        left: savedPosition.timerWindowPosition?.left || undefined,
        top: savedPosition.timerWindowPosition?.top || undefined,
        focused: true
      });
    }
  } catch (error) {
    console.error('Error opening timer window:', error);
  }
});

