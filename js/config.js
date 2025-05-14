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
        name: 'Qwen2.5 0.5B (1.1 GB)',
        size: '1.1 GB',
      },
      {
        id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
        name: 'SmolLM2 360M (0.6 GB)',
        size: '0.6 GB',
      },
      {
        id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 1.5B (1.9 GB)',
        size: '1.9 GB',
      },
      {
        id: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
        name: 'TinyLlama 1.1B (0.8 GB)',
        size: '0.8 GB',
      },
      {
        id: 'phi-1_5-q4f32_1-MLC',
        name: 'Phi 1.5 (1.7 GB)',
        size: '1.7 GB',
      },
    ],
  },
  {
    group: 'Medium Models (Faster GPUs recommended)',
    models: [
      {
        id: 'Qwen2.5-7B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 7B (5.9 GB)',
        size: '5.9 GB',
      },
      {
        id: 'DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC',
        name: 'DeepSeek R1 Llama 8B (6.1 GB)',
        size: '6.1 GB',
      },
      {
        id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
        name: 'Llama 3.1 8B (6.1 GB)',
        size: '6.1 GB',
      },
      {
        id: 'Hermes-3-Llama-3.1-8B-q4f32_1-MLC',
        name: 'Hermes 3 Llama 8B (5.8 GB)',
        size: '5.8 GB',
      },
    ],
  },
  {
    group: 'Large Models (Powerful but requires high-end GPU)',
    models: [
      {
        id: 'Qwen2.5-32B-Instruct-q4f32_1-MLC',
        name: 'Qwen2.5 32B (32 GB)',
        size: '32 GB',
      },
      {
        id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
        name: 'Phi 3.5 Mini (5.5 GB)',
        size: '5.5 GB',
      },
      {
        id: 'gemma-2-9b-it-q4f32_1-MLC',
        name: 'Gemma 2 9B (8.4 GB)',
        size: '8.4 GB',
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
  clearChatButton: 'clear-chat',
  progressContainer: 'progress-container',
  progressFill: 'progress-fill',
  progressText: 'progress-text',
  resourceWarning: 'resource-warning',
  topStatus: 'top-status',
  // Status panel progress elements
  statusContainer: 'status-container',
  statusProgressContainer: 'status-progress-container',
  statusProgressFill: 'status-progress-fill',
  statusProgressText: 'status-progress-text',
}
