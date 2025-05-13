# WebLLM Chat

This is a browser-based LLM chat application that runs AI models directly in your browser using WebGPU technology.
No server required - all processing happens locally on your device.

## Features

- Run large language models directly in your browser
- Choice of models with different sizes and capabilities
- Progress tracking for model downloads
- Detailed model information (download size, VRAM requirements, parameters)
- Responsive design that works on desktop and mobile
- Clear feedback during download and inference

## Requirements

- **Browser Support**: Chrome 113+, Edge 113+, or Firefox 118+ with WebGPU enabled
- **Hardware**: Models work best with a dedicated GPU
  - Small models: ~1GB VRAM (runs on most devices)
  - Medium models: ~6GB VRAM (dedicated GPU recommended)
  - Large models: 10GB+ VRAM (high-end GPU required)

## Project Structure

```
├── index.html          # Main HTML file
├── js/
│   ├── index.js        # Main entry point
│   ├── app.js          # Application controller
│   ├── config.js       # Configuration and constants
│   ├── styles.js       # CSS styles
│   ├── models/
│   │   └── llm-model.js # LLM model operations
│   └── utils/
│       ├── logger.js   # Logging utilities
│       └── ui.js       # UI helper functions
```

## Development

To run the application locally:

1. Clone this repository
2. Open `index.html` in a WebGPU-enabled browser
3. Select a model and click "Load Model"

## How It Works

This application uses [web-llm](https://github.com/mlc-ai/web-llm), a project that compiles LLMs to WebGPU for browser execution. The first time you load a model, it will download the model weights (which may take some time depending on your connection). Subsequent loads will use the cached version from IndexedDB.

## License

MIT
