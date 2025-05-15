# 🖥️ 🤖 WebLLM Offline AI Assistant

This is a browser-based LLM chat application that runs AI models directly in your browser using WebGPU technology, presented with a **pc-themed desktop interface**.
All processing happens locally on your device. No server required. ✨

## 🌟 Live URL

🔗 Use the app at [https://chat.ebenezerdon.com](https://chat.ebenezerdon.com)

## ✅ Features

- 🖥️ **PC Desktop Experience**: Interact with the chat app in a simulated pc environment, complete with a taskbar, draggable window, and window controls (minimize, maximize, close).
- 🤖 **Run large language models** directly in your browser.
- 🔄 **Choice of models** with different sizes and capabilities.
- 📊 **Progress tracking** for model downloads and progress bar.
- ℹ️ **Model information** (download size, VRAM requirements, parameters).
- 📱 **Responsive design** that adapts.
- 💬 Clear feedback during download and inference, integrated into the pc UI.
- 🎛️ Taskbar with a start button, app icon, and live clock.

## 🔧 Requirements

- **Browser Support**: Chrome 113+, Edge 113+, or Firefox 118+ with WebGPU enabled.
- **Hardware**: Models work best with a dedicated GPU.
  - 🟢 Small models: ~1GB VRAM (runs on most devices)
  - 🟠 Medium models: ~6GB VRAM (dedicated GPU recommended)
  - 🟣 Large models: 10GB+ VRAM (high-end GPU required)

## 📁 Project Structure

```
webllm-chat/
├── index.html              # Main HTML file with pc desktop structure
├── css/
│   ├── pc-theme.css   # Core CSS for the pc desktop theme and app window
│   └── icons.css           # SVG icons for the pc theme
├── js/
│   ├── index.js            # Main JavaScript entry point
│   ├── app.js              # Core application logic for WebLLM chat
│   ├── config.js           # Model configurations and constants
│   ├── models/
│   │   └── llm-model.js    # Handles LLM operations via WebLLM
│   └── utils/
│       ├── logger.js       # Logging utilities
│       ├── ui.js           # UI helper functions (model select, progress, etc.)
│       ├── db.js           # IndexedDB utilities for caching and preferences
│       └── pc-ui.js   # Manages pc desktop UI interactions (dragging, controls, taskbar)
├── favicon.svg             # pc-themed favicon
└── README.md               # This file
```

## 🚀 Development

To run the application locally:

1. Clone this repository.
2. Open `index.html` in a WebGPU-enabled browser.
3. The chat application will appear as a window on the simulated desktop.
4. Select a model from the dropdown within the app window and click "Load Model" (or allow auto-load).

## ⚙️ How It Works

This application uses [web-llm](https://github.com/mlc-ai/web-llm), a project that compiles LLMs to WebGPU for browser execution. The UI is structured as a pc desktop environment. When you load a model, it downloads the model weights (which may take some time). Subsequent loads use the cached version from IndexedDB.
The `pc-ui.js` script handles the visual aspects of the windowing (dragging, minimize, maximize, close simulation) and the taskbar.

## 🔗 Connect With the Developer

If you find this project useful, please consider:

- ⭐ Giving this repo a star on GitHub
- 📺 Checking out my YouTube channel: [youtube.com/ebenezerdon](https://youtube.com/ebenezerdon)
- 👥 Connecting with me on LinkedIn: [linkedin.com/in/ebenezerdon](https://linkedin.com/in/ebenezerdon)
- 🐦 Following me on X: [x.com/ebenezerDN](https://x.com/ebenezerDN)

Your support helps me continue creating open-source projects like this one! 🙏

## 📝 License

GNU GPL v3
