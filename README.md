
# YTBuffer - YouTube Video Preloader Extension

## 🧠 Overview

**YTBuffer** is a Chrome extension that forces YouTube videos to fully buffer before playing, providing a smoother playback experience—especially on slow or unstable connections. It also includes functionality to fix videos that get stuck on the loading screen, letting you enjoy uninterrupted viewing.

> *"Watch YouTube videos without buffering interruptions, just like the old days."*

---

## 🚀 Features

* **✅ Complete Video Buffering**
  Forces videos to buffer completely for smooth playback without interruptions.

* **🔄 Fixes Stuck Videos**
  Automatically detects and fixes videos that get stuck on the loading screen.

* **⚙️ Customizable Settings**
  Adjust buffer percentage, timeout values, and other parameters to suit your needs.

* **🎛️ Quality Control**
  Set your preferred video quality for preloading.

* **⏸️ Auto-Pause**
  Automatically pauses videos while buffering for optimal loading.

* **🪵 Detailed Logging**
  Optional debug mode with detailed logging for troubleshooting.

---

## 🛠️ How It Works

YTBuffer uses a smart approach to enhance your YouTube viewing experience:

1. **Detection** – Identifies when a YouTube video page is loaded.
2. **Buffer Control** – Forces the video player to buffer beyond YouTube's default limits.
3. **Loading Fix** – Applies techniques to recover videos that get stuck on loading screens.
4. **Real-time Monitoring** – Tracks buffering progress and adapts accordingly.
5. **User Control** – Provides settings to customize the behavior based on your preferences.

---

## 📦 Installation

### From Chrome Web Store

> *Coming Soon!*

### Manual Installation

1. Download or clone this repository:

   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. Navigate to the project folder:

   ```sh
   cd ytbuffer
   ```

3. Open Chrome and go to `chrome://extensions/`.

4. Enable **Developer Mode** (top-right toggle).

5. Click **Load Unpacked** and select the project folder.

6. The YTBuffer extension icon should appear in your browser toolbar.

---

## 🎬 Usage

1. Navigate to any YouTube video.
2. The extension works automatically in the background.
3. Click on the extension icon to access settings and status information.
4. Adjust settings as needed for your connection and preferences.

To monitor detailed activity:
1. Right-click on the page and select **Inspect**, or press `F12`.
2. Go to the **Console** tab.
3. Look for logs prefixed with `[YouTube Force Buffer]`.

---

## ⚙️ Configuration

Click the extension icon to access settings:

- **Enable/Disable**: Toggle the extension on or off.
- **Buffer Percentage**: Set how much of the video to buffer (default: 25%).
- **Buffer Timeout**: Maximum time to spend buffering a video (in seconds).
- **Auto-Pause**: Enable/disable automatic pausing during buffering.
- **Preload Quality**: Select preferred video quality for preloading.
- **Debug Mode**: Enable detailed logging in the console.

---

## 🧩 Technologies Used

* **Vite**
* **TypeScript**
* **React**
* **Tailwind CSS**
* **shadcn/ui**
* **Chrome Extension APIs**

---

## 🌐 Deployment

The extension can be packaged for distribution:

1. Build the extension with `npm run build`.
2. The resulting files can be uploaded to the Chrome Web Store or used directly.

For development purposes, you can open [Lovable](https://lovable.dev/projects/26360616-c553-4938-a8fd-d125185732f7) and click **Share → Publish** to deploy for testing.

---

## 🧪 Troubleshooting

**Extension not working?**

* Ensure the extension is enabled in Chrome.
* Check if debug mode is on and review console logs.
* Try reloading the YouTube page.
* Verify you're on a standard YouTube video page.

**Videos still buffering or getting stuck?**

* Increase the buffer percentage in settings.
* Check your internet connection stability.
* Try toggling the auto-pause setting.
* Some YouTube videos may have restrictions that limit buffering.

**Conflicts with other extensions?**

* Temporarily disable other YouTube-related extensions.
* Try using YTBuffer in an incognito window (enable in extension settings first).

---

## 🤝 Contributing

Contributions are welcome! To contribute:

```sh
# Fork the repository
git checkout -b feature/your-feature-name
git commit -m "Add some feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## ⚠️ Disclaimer

> This extension is intended for personal use only. Use it at your own risk. The developers are not responsible for any issues that may arise, including bandwidth usage or potential conflicts with YouTube's terms of service.

---

## 🙏 Acknowledgments

* Thanks to all contributors and users for their feedback and suggestions.
* This project is not affiliated with or endorsed by YouTube or Google.
* Made for users who value uninterrupted viewing experiences.

---
