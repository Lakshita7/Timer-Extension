# Troubleshooting Guide

## Timer Overlay Not Appearing

If the timer overlay doesn't appear after clicking a timer option, follow these debugging steps:

### Step 1: Check the Browser Console

1. Open the webpage where you're trying to use the timer
2. Press `F12` (or `Cmd+Option+I` on Mac) to open Developer Tools
3. Go to the **Console** tab
4. Look for any error messages
5. Try clicking the timer option again and check for new console messages

### Step 2: Check Extension Errors

1. Go to `chrome://extensions/`
2. Find "Timer Extension"
3. Click "Service worker" or "background page" (if available)
4. Check the console for errors
5. Also check "Errors" button on the extension card

### Step 3: Verify You're on a Valid Page

- The extension **won't work** on:
  - `chrome://` pages (like chrome://extensions/)
  - `chrome-extension://` pages
  - `about:` pages
- The extension **will work** on:
  - Regular websites (http://, https://)
  - Local files (file://)

### Step 4: Reload the Extension

1. Go to `chrome://extensions/`
2. Find "Timer Extension"
3. Click the refresh/reload icon
4. Try using the timer again

### Step 5: Check Content Script Injection

1. Go to any regular website (e.g., google.com)
2. Open Developer Tools (F12)
3. Go to Console tab
4. Type: `chrome.runtime`
5. If it's undefined, the content script might not be loaded
6. Check if you see "Content script received message:" in console when clicking timer

### Common Issues

#### Issue: "Could not establish connection" error
**Solution**: The content script isn't loaded. Try refreshing the page and reloading the extension.

#### Issue: Vue.js errors in console
**Solution**: Vue.js might be blocked by CSP. Check if you see CSP violations in the console.

#### Issue: Timer appears but is blank/white
**Solution**: 
- Check if Vue.js is loading (look for errors in console)
- Check Network tab in DevTools to see if timer.html, timer.css, and timer.js are loading
- Verify the files exist in the correct locations

#### Issue: "Refused to load script" error
**Solution**: This is a Content Security Policy (CSP) issue. Vue.js CDN might be blocked. The extension may need Vue.js to be included locally instead of from CDN.

### Debugging Code Added

The code now includes console.log statements to help debug:
- Content script logs: "Content script received message:" and "Starting timer for X minutes"
- Check browser console for these messages
- If you don't see them, the content script isn't receiving messages

### Still Not Working?

If none of the above works:
1. Check the GitHub issues page (if available)
2. Verify all files are in the correct locations
3. Make sure you're using the latest version
4. Try uninstalling and reinstalling the extension

