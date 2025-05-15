# Browser LLM Chat

An offline AI assistant that runs entirely in your browser using WebLLM and WebGPU.

This application allows you to chat with LLMs directly in your browser without sending data to external servers. All processing happens locally on your device.

## Requirements

- A modern browser with WebGPU support:
  - Chrome 113+
  - Edge 113+
  - Firefox 118+
- A device with sufficient GPU capabilities
- Approximately 1-4GB of storage space (depending on model size)

## How to Use

1. Simply open the `index.html` file in a supported browser
2. Select a model from the dropdown menu
3. Click "Load Model" and wait for the download to complete
4. Start chatting with the AI!

## Technical Details

This app uses:

- WebLLM library to run models in the browser
- WebGPU for hardware acceleration
- Quantized models for efficient performance
- Basic HTML, CSS, and JavaScript (no framework dependencies)

## Models

- **SmolLM2 360M**: A very small model, great for basic tasks
- **Llama 3.1 8B**: Medium-sized model with good capabilities
- **Phi 3.5 Mini**: Larger model with enhanced response quality

## Development

Feel free to modify the app to suit your needs. The entire application is contained in a single HTML file for simplicity.

## License

This project is open source and available under the MIT License.
