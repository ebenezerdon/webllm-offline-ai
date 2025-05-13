/**
 * Main Application
 */
import { prebuiltAppConfig } from 'https://esm.run/@mlc-ai/web-llm@0.2.79'
import { MODEL_DATA, MODEL_SIZES, ELEMENT_IDS } from './config.js'
import { initLogger, logDebug, logBrowserInfo } from './utils/logger.js'
import { populateModelSelect, updateModelInfo } from './utils/ui.js'
import LLMModel from './models/llm-model.js'

class App {
  constructor() {
    this.elements = {}
    this.model = new LLMModel()
    this.isModelLoading = false
  }

  /**
   * Initialize the application
   */
  async init() {
    this.initDomElements()
    this.attachEventListeners()
    this.initLogger()
    this.setupModelUI()
    this.logSystemInfo()
  }

  /**
   * Initialize DOM elements
   */
  initDomElements() {
    // Get references to all DOM elements
    Object.keys(ELEMENT_IDS).forEach((key) => {
      this.elements[key] = document.getElementById(ELEMENT_IDS[key])
    })

    // Simple validation
    if (!this.elements.form || !this.elements.modelSelect) {
      console.error('Required DOM elements not found')
      return
    }

    // Pass elements to model manager
    this.model.setElements(this.elements)
  }

  /**
   * Initialize logger
   */
  initLogger() {
    initLogger({
      debug: this.elements.debug,
      status: this.elements.status,
      output: this.elements.output,
    })
  }

  /**
   * Set up model selection UI
   */
  setupModelUI() {
    // Populate model dropdown
    populateModelSelect(this.elements.modelSelect, MODEL_DATA)

    // Initialize model info display
    this.updateModelInfoDisplay()

    // Log available models for debugging
    this.logModelAvailability()
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    // Form submission
    this.elements.form.addEventListener(
      'submit',
      this.handleFormSubmit.bind(this),
    )

    // Model select change
    this.elements.modelSelect.addEventListener(
      'change',
      this.handleModelSelectChange.bind(this),
    )

    // Load model button
    this.elements.loadModelButton.addEventListener(
      'click',
      this.handleLoadModelClick.bind(this),
    )
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async handleFormSubmit(e) {
    e.preventDefault()

    if (!this.model.isReady()) {
      logDebug('No model loaded. Please load a model first.')
      return
    }

    const prompt = this.elements.prompt.value.trim()
    if (!prompt) return

    this.elements.output.textContent = `You: ${prompt}\n\nAssistant: `
    this.elements.prompt.value = ''

    // Disable inputs during generation
    this.setInputsState(false)

    try {
      await this.model.generateResponse(prompt)
    } catch (error) {
      logDebug(`Error in handleFormSubmit: ${error.message}`)
    } finally {
      // Re-enable inputs
      this.setInputsState(true)
      this.elements.prompt.focus()
    }
  }

  /**
   * Handle model select change
   */
  handleModelSelectChange() {
    this.updateModelInfoDisplay()
    this.updateResourceWarning()
  }

  /**
   * Handle load model button click
   */
  async handleLoadModelClick() {
    if (this.isModelLoading) return

    const selectedModel = this.elements.modelSelect.value
    logDebug(`User selected model: ${selectedModel}`)

    // Disable inputs during loading
    this.isModelLoading = true
    this.setLoadingState(true)

    try {
      await this.model.loadModel(selectedModel)
      this.setInputsState(true)
    } catch (error) {
      logDebug(`Error in handleLoadModelClick: ${error.message}`)
    } finally {
      this.isModelLoading = false
      this.setLoadingState(false)
    }
  }

  /**
   * Update model info display
   */
  updateModelInfoDisplay() {
    const selectedOption =
      this.elements.modelSelect.options[this.elements.modelSelect.selectedIndex]

    updateModelInfo(
      this.elements.modelInfo,
      this.elements.modelDownloadSize,
      this.elements.modelVram,
      this.elements.modelParams,
      selectedOption,
    )
  }

  /**
   * Update resource warning display
   */
  updateResourceWarning() {
    const selectedModel = this.elements.modelSelect.value
    const modelSize = MODEL_SIZES[selectedModel] || 'medium'

    if (modelSize === 'large') {
      this.elements.resourceWarning.style.display = 'block'
    } else {
      this.elements.resourceWarning.style.display = 'none'
    }
  }

  /**
   * Set input elements state
   * @param {boolean} enabled - Whether inputs should be enabled
   */
  setInputsState(enabled) {
    this.elements.prompt.disabled = !enabled
    if (this.elements.form.querySelector('button[type="submit"]')) {
      this.elements.form.querySelector('button[type="submit"]').disabled =
        !enabled
    }
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Whether the model is loading
   */
  setLoadingState(isLoading) {
    this.elements.loadModelButton.disabled = isLoading
    this.elements.progressContainer.style.display = isLoading ? 'block' : 'none'
  }

  /**
   * Log model availability for debugging
   */
  logModelAvailability() {
    const availableModels = prebuiltAppConfig.model_list.map((m) => m.model_id)
    logDebug(`Available models: ${availableModels.slice(0, 10).join(', ')}...`)
    logDebug(`Total available models: ${availableModels.length}`)

    // Check if our dropdown models are in the available list
    const dropdownModels = Array.from(this.elements.modelSelect.options).map(
      (opt) => opt.value,
    )
    dropdownModels.forEach((model) => {
      const isAvailable = availableModels.includes(model)
      logDebug(
        `Model ${model} is ${
          isAvailable ? 'available' : 'NOT available'
        } in prebuiltAppConfig`,
      )
    })
  }

  /**
   * Log system information
   */
  logSystemInfo() {
    logBrowserInfo()
  }
}

// Initialize and export app instance
const app = new App()
document.addEventListener('DOMContentLoaded', () => app.init())

export default app
