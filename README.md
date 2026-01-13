# Timer Extension for Chrome

A picture-in-picture timer countdown extension for Google Chrome that displays a draggable timer overlay on any webpage.

## Features

- ⏱️ Timer options: 10, 15, 30, 45, or 60 minutes
- 🖱️ Draggable overlay (drag by the green header bar)
- ⏸️ Pause/Resume functionality
- 🔄 Reset timer
- 🎨 Beautiful gradient UI with Vue.js
- 📱 Works on any webpage

## Installation

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to: Menu (☰) → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `TimerApp` folder
   - The extension should now appear in your extensions list

4. **Add Icons (Optional but Recommended)**
   - The extension will work without icons, but Chrome will show a default icon
   - To add custom icons, place PNG files in the `icons` folder:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can use any image editor or online tool to create these icons
   - After adding icons, reload the extension in `chrome://extensions/`

## Usage

1. **Start a Timer**
   - Click the extension icon in the Chrome toolbar
   - Select your desired timer duration (10, 15, 30, 45, or 60 minutes)
   - The timer overlay will appear on the current webpage

2. **Move the Timer**
   - Click and drag the green header bar at the top of the timer
   - Release to place it in your desired location

3. **Control the Timer**
   - **Pause/Resume**: Click the "Pause" button to pause, "Resume" to continue
   - **Reset**: Click "Reset" to stop and reset the timer
   - **Stop Timer**: Click the extension icon again and select "Stop Timer"

4. **Timer Completion**
   - When the timer reaches 0:00, it will display "Timer Finished!" with a pulsing animation

## Project Structure

```
TimerApp/
├── manifest.json           # Extension manifest
├── package.json            # Node.js package file
├── src/
│   ├── popup/
│   │   ├── popup.html      # Extension popup HTML
│   │   └── popup.js        # Popup logic
│   ├── content/
│   │   └── content.js      # Content script for injection
│   └── timer/
│       ├── timer.html      # Timer overlay HTML
│       ├── timer.js        # Vue.js timer component
│       └── timer.css       # Timer styles
├── icons/                  # Extension icons (add your icons here)
└── README.md              # This file
```

## Technologies Used

- **Vue.js 3** - Frontend framework for the timer UI
- **Chrome Extension API** - Manifest V3
- **Vanilla JavaScript** - For extension logic and drag functionality

## Development

The extension uses:
- Manifest V3 (latest Chrome extension format)
- Content Scripts for injecting the timer overlay
- Vue.js CDN (no build process required)
- CSS for styling and animations

## Troubleshooting

- **Timer doesn't appear**: Make sure you're on a webpage (not chrome:// pages)
- **Can't drag the timer**: Click and hold on the green header bar
- **Extension not loading**: Check for errors in `chrome://extensions/` and ensure all files are present
- **Icons not showing**: Icons are optional; the extension works without them

## License

MIT License - Feel free to modify and distribute

