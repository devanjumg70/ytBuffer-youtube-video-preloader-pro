
# YTBuffer - YouTube Force Buffer Extension

## Overview
YTBuffer is a Chrome extension that forces complete video buffering on YouTube videos and prevents stuck loading issues. It provides a better watching experience by ensuring videos are properly buffered before playback.

## Features
- Forces video buffering to prevent stuttering during playback
- Automatically fixes stuck loading videos
- Configurable buffer percentage before playback
- Debug mode to see detailed logging information
- Automatic pause when buffer runs low
- Works on all YouTube video pages

## Installation
### From Chrome Web Store
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" at the top right
4. Click "Load unpacked"
5. Select the folder containing the extension files

## Usage
Once installed, the extension will automatically work when you visit YouTube video pages. You can:
- Click on the extension icon to open the popup menu
- Enable/disable the extension
- Configure buffering settings
- View buffering progress in real-time

## Settings
- **Enable Extension**: Turn the extension on/off
- **Debug Mode**: View detailed logs in the browser console
- **Buffer Timeout**: Time (in seconds) before considering a video stuck in loading
- **Buffer Percentage**: Minimum percentage of the video to buffer before playback
- **Auto-Pause**: Automatically pause playback when buffer runs low

## Technical Details
The extension consists of:
- **Background Script**: Manages extension state and communication
- **Content Script**: Monitors and controls YouTube's video player
- **Popup Interface**: Provides user controls and status information

## Troubleshooting
If you encounter any issues:
1. Make sure the extension is enabled
2. Try refreshing the YouTube page
3. Check the browser console for debug information (if Debug Mode is enabled)
4. Disable other YouTube-related extensions that might conflict

## License
MIT License

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
