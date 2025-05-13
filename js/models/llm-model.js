/**
 * LLM Model Manager
 */
import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm@0.2.79'
import { logDebug, logError, logStatus } from '../utils/logger.js'
import {
  calculateRemainingTime,
  updateProgress,
  checkWebGPUSupport,
} from '../utils/ui.js'

export default class LLMModel {
  constructor() {
    this.engine = null
    this.elements = {}
    this.conversation = [] // Store conversation history
  }

  /**
   * Set UI elements for the model to interact with
   * @param {Object} elements - UI elements
   */
  setElements(elements) {
    this.elements = elements
  }

  /**
   * Generate chat completion from the model
   * @param {string} prompt - User prompt
   * @returns {Promise<void>}
   */
  async generateResponse(prompt) {
    if (!this.engine) {
      throw new Error('No model loaded. Please load a model first.')
    }

    try {
      // Add user message to conversation history
      this.conversation.push({ role: 'user', content: prompt })

      // Display full conversation history
      this.displayConversation()

      // Create chat completion using full conversation history
      const stream = await this.engine.chat.completions.create({
        messages: this.conversation,
        stream: true,
      })

      let assistantResponse = ''

      for await (const chunk of stream) {
        const token = chunk.choices[0].delta.content || ''
        assistantResponse += token

        // Update just the assistant's current response
        const outputEl = this.elements.output
        const lastChild = outputEl.lastChild

        if (lastChild && lastChild.className === 'assistant-response') {
          lastChild.textContent = assistantResponse
        } else {
          const responseEl = document.createElement('div')
          responseEl.className = 'assistant-response'
          responseEl.textContent = assistantResponse
          outputEl.appendChild(responseEl)
        }

        this.elements.output.scrollTop = this.elements.output.scrollHeight
      }

      // Add assistant message to conversation history
      this.conversation.push({ role: 'assistant', content: assistantResponse })

      return true
    } catch (error) {
      logError(`Error during chat: ${error.message}`)
      logDebug(
        `Chat error details: ${JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        )}`,
      )
      throw error
    }
  }

  /**
   * Display the full conversation history
   * @param {string} systemMessage - Optional system message to display
   * @param {boolean} isError - Whether the system message is an error
   */
  displayConversation(systemMessage = null, isError = false) {
    const outputEl = this.elements.output
    outputEl.innerHTML = ''

    // Show system message if provided
    if (systemMessage) {
      const systemEl = document.createElement('div')
      systemEl.className = isError ? 'error-message' : 'system-message'
      systemEl.textContent = systemMessage
      outputEl.appendChild(systemEl)
    }

    // Show conversation history
    this.conversation.forEach((message) => {
      const messageEl = document.createElement('div')
      messageEl.className = `${message.role}-message`

      const roleLabel = document.createElement('div')
      roleLabel.className = 'role-label'
      roleLabel.textContent = message.role === 'user' ? 'You:' : 'Assistant:'

      const contentEl = document.createElement('div')
      contentEl.className = `${message.role}-content`
      contentEl.textContent = message.content

      messageEl.appendChild(roleLabel)
      messageEl.appendChild(contentEl)
      outputEl.appendChild(messageEl)
    })

    // Add placeholder for incoming assistant response
    if (
      this.conversation.length > 0 &&
      this.conversation[this.conversation.length - 1].role === 'user'
    ) {
      const placeholderEl = document.createElement('div')
      placeholderEl.className = 'assistant-message'

      const roleLabel = document.createElement('div')
      roleLabel.className = 'role-label'
      roleLabel.textContent = 'Assistant:'

      const responseEl = document.createElement('div')
      responseEl.className = 'assistant-response'
      responseEl.textContent = ''

      placeholderEl.appendChild(roleLabel)
      placeholderEl.appendChild(responseEl)
      outputEl.appendChild(placeholderEl)
    }
  }

  /**
   * Load a model by ID
   * @param {string} modelId - Model identifier
   * @returns {Promise<void>}
   */
  async loadModel(modelId) {
    try {
      // Reset UI state and conversation
      this.conversation = []

      // Show initializing message
      this.displayConversation('Initializing...')

      logStatus('Checking browser compatibility...')
      checkWebGPUSupport()

      const selectedOption = Array.from(this.elements.modelSelect.options).find(
        (opt) => opt.value === modelId,
      )
      const downloadSize = selectedOption ? selectedOption.dataset.size : '?'

      logDebug(`Starting to load model: ${modelId} (size: ${downloadSize})`)
      logStatus(
        `Starting model download (${downloadSize}). This may take a while for the first time...`,
      )

      // Update loading message
      this.displayConversation(
        `Starting model download (${downloadSize}). This may take a while for the first time...`,
      )

      let progressReceived = false
      let downloadStartTime = Date.now()

      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          progressReceived = true

          // Log the raw progress for debugging
          logDebug(`Raw progress value: ${JSON.stringify(progress)}`)

          let percent = 0

          // Check if progress is an object with progress property
          if (
            progress &&
            typeof progress === 'object' &&
            'progress' in progress
          ) {
            percent = Math.floor(progress.progress * 100)
            logDebug(`Progress from object: ${percent}%`)
          }
          // Check if progress is a number directly
          else if (typeof progress === 'number' && !isNaN(progress)) {
            percent = Math.floor(progress * 100)
            logDebug(`Progress from number: ${percent}%`)
          }
          // Fall back to task info if available
          else if (progress && typeof progress === 'object' && progress.text) {
            logStatus(`Status: ${progress.text}`)
            if (progress.phase === 'download') {
              // Try to extract a percentage from the text if it exists
              const percentMatch = progress.text.match(/(\d+)%/)
              if (percentMatch) {
                percent = parseInt(percentMatch[1])
                logDebug(`Progress from text: ${percent}%`)
              }
            }
          } else {
            logStatus('Downloading model... (progress unknown)')
            return
          }

          // Calculate estimated time remaining
          const elapsedMs = Date.now() - downloadStartTime
          const remainingTime = calculateRemainingTime(elapsedMs, percent)

          // Update progress bar and status
          updateProgress(
            this.elements.progressFill,
            this.elements.progressText,
            this.elements.progressContainer,
            percent,
          )

          // Update loading message
          this.displayConversation(
            `Loading model... ${percent}%${remainingTime}`,
          )
          logStatus(`Download progress: ${percent}%${remainingTime}`)
        },
        useIndexedDBCache: true,
      })

      const loadTime = ((Date.now() - downloadStartTime) / 1000).toFixed(1)

      if (!progressReceived) {
        logDebug('No progress callbacks were received during loading')
      }

      // Display welcome message
      this.displayConversation(`Model ready in ${loadTime}s. Ask me something!`)

      logStatus(`Model ${modelId} loaded successfully in ${loadTime}s`)

      return true
    } catch (error) {
      logError(`Failed to load model: ${error.message}`)
      logDebug(
        `Detailed error: ${JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        )}`,
      )

      // Display error message as a system message
      this.displayConversation(`Error loading model: ${error.message}`, true)

      logStatus('Check debug log for more details')
      throw error
    }
  }

  /**
   * Check if the model is ready to use
   * @returns {boolean}
   */
  isReady() {
    return this.engine !== null
  }
}
