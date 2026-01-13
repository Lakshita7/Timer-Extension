document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.timer-option[data-minutes]');
  const stopBtn = document.getElementById('stopTimer');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const minutes = parseInt(button.getAttribute('data-minutes'));
      startTimer(minutes);
    });
  });

  stopBtn.addEventListener('click', () => {
    stopTimer();
  });

  async function startTimer(minutes) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'startTimer',
      minutes: minutes
    });

    window.close();
  }

  async function stopTimer() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'stopTimer'
    });

    window.close();
  }
});

