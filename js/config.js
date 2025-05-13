// Model size categories and metadata
export const MODEL_SIZES = {
  'Qwen2.5-0.5B-Instruct-q4f32_1-MLC': 'small',
  'Qwen2.5-1.5B-Instruct-q4f32_1-MLC': 'small',
  'SmolLM2-360M-Instruct-q4f32_1-MLC': 'small',
  'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC': 'small',
  'phi-1_5-q4f32_1-MLC': 'small',
  'Qwen2.5-3B-Instruct-q4f32_1-MLC': 'medium',
  'Qwen2.5-7B-Instruct-q4f32_1-MLC': 'medium',
  'DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC': 'medium',
  'Llama-3.1-8B-Instruct-q4f32_1-MLC': 'medium',
  'Hermes-3-Llama-3.1-8B-q4f32_1-MLC': 'medium',
  'Qwen2.5-32B-Instruct-q4f32_1-MLC': 'large',
  'Phi-3.5-mini-instruct-q4f32_1-MLC': 'large',
  'gemma-2-9b-it-q4f32_1-MLC': 'large',
}

// Model data for the dropdown
export const MODEL_DATA = [
  {
    group: 'Small Models (Recommended for most devices)',
    models: [
      {
        id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 0.5B (Very Small)',
        size: '1.1 GB',
        vram: '1.1 GB',
        params: '0.5B',
      },
      {
        id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
        name: 'SmolLM2 360M (Very Small)',
        size: '0.6 GB',
        vram: '0.6 GB',
        params: '360M',
      },
      {
        id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 1.5B (Small)',
        size: '1.9 GB',
        vram: '1.9 GB',
        params: '1.5B',
      },
      {
        id: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
        name: 'TinyLlama 1.1B (Small)',
        size: '0.8 GB',
        vram: '0.8 GB',
        params: '1.1B',
      },
      {
        id: 'phi-1_5-q4f32_1-MLC',
        name: 'Phi 1.5 (Small)',
        size: '1.7 GB',
        vram: '1.7 GB',
        params: '1.3B',
      },
    ],
  },
  {
    group: 'Medium Models (Faster GPUs recommended)',
    models: [
      {
        id: 'Qwen2.5-7B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 7B (Medium)',
        size: '5.9 GB',
        vram: '5.9 GB',
        params: '7B',
      },
      {
        id: 'DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC',
        name: 'DeepSeek R1 Llama 8B (Medium)',
        size: '6.1 GB',
        vram: '6.1 GB',
        params: '8B',
      },
      {
        id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
        name: 'Llama 3.1 8B (Medium)',
        size: '6.1 GB',
        vram: '6.1 GB',
        params: '8B',
      },
      {
        id: 'Hermes-3-Llama-3.1-8B-q4f32_1-MLC',
        name: 'Hermes 3 Llama 8B (Medium)',
        size: '5.8 GB',
        vram: '5.8 GB',
        params: '8B',
      },
    ],
  },
  {
    group: 'Large Models (Powerful but requires high-end GPU)',
    models: [
      {
        id: 'Qwen2.5-32B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 32B (Large)',
        size: '32 GB',
        vram: '28 GB',
        params: '32B',
      },
      {
        id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
        name: 'Phi 3.5 Mini (Large)',
        size: '5.5 GB',
        vram: '5.5 GB',
        params: '8B',
      },
      {
        id: 'gemma-2-9b-it-q4f32_1-MLC',
        name: 'Gemma 2 9B (Large)',
        size: '8.4 GB',
        vram: '8.4 GB',
        params: '9B',
      },
    ],
  },
]

// Web-LLM package version
export const WEB_LLM_VERSION = '0.2.79'

// DOM element IDs
export const ELEMENT_IDS = {
  output: 'output',
  status: 'status',
  debug: 'debug',
  form: 'chat-form',
  prompt: 'prompt',
  submitButton: 'submit-button',
  modelSelect: 'model-select',
  loadModelButton: 'load-model',
  clearChatButton: 'clear-chat',
  progressContainer: 'progress-container',
  progressFill: 'progress-fill',
  progressText: 'progress-text',
  resourceWarning: 'resource-warning',
  modelInfo: 'model-info',
  modelDownloadSize: 'model-download-size',
  modelVram: 'model-vram',
  modelParams: 'model-params',
}
