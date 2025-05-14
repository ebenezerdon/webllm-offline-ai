/**
 * Main Application
 */
import { prebuiltAppConfig } from 'https://esm.run/@mlc-ai/web-llm@0.2.79'
import { MODEL_DATA, MODEL_SIZES, ELEMENT_IDS } from './config.js'
import {
  initLogger,
  logDebug,
  logBrowserInfo,
  logStatus,
} from './utils/logger.js'
import { populateModelSelect } from './utils/ui.js'
import LLMModel from './models/llm-model.js'
import {
  getLastUsedModel,
  saveLastUsedModel,
  clearConversations,
  getLastConversation,
} from './utils/db.js'

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

    // Load conversation history immediately
    await this.loadConversationWithoutModel()

    // Try to auto-load the last used model
    this.tryLoadLastUsedModel()
  }

  /**
   * Try to load the last used model from database
   */
  async tryLoadLastUsedModel() {
    try {
      const lastModel = await getLastUsedModel()
      const modelSelect = this.elements.modelSelect

      if (lastModel && lastModel.modelId) {
        logStatus(
          `Found previously used model: loading ${lastModel.modelId}...`,
          true,
        )
        logDebug(`Auto-loading model: ${lastModel.modelId}`)

        // Set the model dropdown to the last used model
        for (let i = 0; i < modelSelect.options.length; i++) {
          if (modelSelect.options[i].value === lastModel.modelId) {
            modelSelect.selectedIndex = i
            this.updateResourceWarning()
            break
          }
        }

        // Load the model automatically
        await this.loadSelectedModel()
      } else {
        logDebug('No previous model found in database, loading default model')

        // Set Qwen 2.5 1.5B as the default model
        const defaultModelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC'

        // Find and select the default model in dropdown
        for (let i = 0; i < modelSelect.options.length; i++) {
          if (modelSelect.options[i].value === defaultModelId) {
            modelSelect.selectedIndex = i
            this.updateResourceWarning()
            logStatus(
              `Loading default model: ${modelSelect.options[i].textContent}...`,
              true,
            )
            break
          }
        }

        // Load the default model
        await this.loadSelectedModel()
      }
    } catch (error) {
      logDebug(`Error loading model: ${error.message}`)
    }
  }

  /**
   * Load conversation history without requiring a model to be loaded
   */
  async loadConversationWithoutModel() {
    try {
      const conversationHistory = await getLastConversation()

      if (conversationHistory && conversationHistory.length > 0) {
        // Set the conversation in the model
        this.model.conversation = conversationHistory

        // Display conversation without model
        this.model.displayConversation()

        logDebug(
          `Loaded conversation with ${conversationHistory.length} messages`,
        )
        return true
      }
      return false
    } catch (error) {
      logDebug(`Error loading conversation: ${error.message}`)
      return false
    }
  }

  /**
   * Load the last conversation from the database
   */
  async loadLastConversation() {
    if (!this.model.isReady()) {
      logDebug('Cannot load conversation: model not ready')
      return
    }

    try {
      const loaded = await this.model.loadLastConversation()
      if (loaded) {
        // No need to show redundant status message
      }
    } catch (error) {
      logDebug(`Error loading conversation: ${error.message}`)
    }
  }

  /**
   * Handle clear chat button click
   */
  async handleClearChatClick() {
    try {
      // Clear conversation in the model
      this.model.conversation = []
      this.model.displayConversation('Conversation cleared')

      // Clear from database
      await clearConversations()
      logStatus('Conversation history cleared')
      logDebug('All conversations removed from database')
    } catch (error) {
      logDebug(`Error clearing conversations: ${error.message}`)
    }
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
      topStatus: this.elements.topStatus,
    })
  }

  /**
   * Set up model selection UI
   */
  setupModelUI() {
    // Populate model dropdown
    populateModelSelect(this.elements.modelSelect, MODEL_DATA)

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

    // Clear chat button
    if (this.elements.clearChatButton) {
      this.elements.clearChatButton.addEventListener(
        'click',
        this.handleClearChatClick.bind(this),
      )
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async handleFormSubmit(e) {
    e.preventDefault()

    if (!this.model.isReady()) {
      logDebug('No model loaded. Please select a model first.')
      return
    }

    const prompt = this.elements.prompt.value.trim()
    if (!prompt) return

    // Clear the input field
    this.elements.prompt.value = ''

    // Disable inputs during generation
    this.setInputsState(false)

    try {
      // Let the model handle adding the message to chat history and UI updates
      await this.model.generateResponse(prompt)
    } catch (error) {
      logDebug(`Error in handleFormSubmit: ${error.message}`)
    } finally {
      // Re-enable inputs
      this.setInputsState(true)
    }
  }

  /**
   * Handle model selection change
   */
  async handleModelSelectChange() {
    // Update resource warning
    this.updateResourceWarning()

    // Load the selected model
    await this.loadSelectedModel()
  }

  /**
   * Load the currently selected model
   */
  async loadSelectedModel() {
    if (this.isModelLoading) {
      logDebug('Model is already loading')
      return
    }

    const selectedModel = this.elements.modelSelect.value
    if (!selectedModel) {
      logDebug('No model selected')
      return
    }

    this.setLoadingState(true)

    try {
      await this.model.loadModel(selectedModel)

      // Save as last used model
      const selectedOption =
        this.elements.modelSelect.options[
          this.elements.modelSelect.selectedIndex
        ]
      await saveLastUsedModel(selectedModel, {
        name: selectedOption.textContent,
        size: selectedOption.dataset.size,
      })

      // Enable the chat interface
      this.setInputsState(true)
    } catch (error) {
      logDebug(`Error loading model: ${error.message}`)
      this.setInputsState(false)
    } finally {
      this.setLoadingState(false)
    }
  }

  /**
   * Update resource warning based on selected model
   */
  updateResourceWarning() {
    const selectedModel = this.elements.modelSelect.value
    const modelSize = MODEL_SIZES[selectedModel]

    if (modelSize === 'large') {
      this.elements.resourceWarning.style.display = 'block'
    } else {
      this.elements.resourceWarning.style.display = 'none'
    }
  }

  /**
   * Set enabled state of input elements
   * @param {boolean} enabled - Whether inputs should be enabled
   */
  setInputsState(enabled) {
    this.elements.prompt.disabled = !enabled
    this.elements.submitButton.disabled = !enabled
  }

  /**
   * Set loading state of the interface
   * @param {boolean} isLoading - Whether the interface is in a loading state
   */
  setLoadingState(isLoading) {
    this.isModelLoading = isLoading
    this.elements.modelSelect.disabled = isLoading
  }

  /**
   * Log available models for debugging
   */
  logModelAvailability() {
    const dropdownModels = Array.from(this.elements.modelSelect.options).map(
      (opt) => opt.value,
    )
    logDebug(
      `Available models in dropdown: ${dropdownModels
        .filter(Boolean)
        .join(', ')}`,
    )
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
