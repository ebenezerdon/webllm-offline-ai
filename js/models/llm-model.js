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
import {
  saveConversation,
  getLastConversation,
  isModelDownloaded,
  markModelDownloaded,
} from '../utils/db.js'

export default class LLMModel {
  constructor() {
    this.engine = null
    this.elements = {}
    this.conversation = [] // Store conversation history
    this.systemPrompt = `You are a helpful AI assistant running directly in the user's browser using WebGPU technology. You aim to be accurate, informative, and engaging while keeping responses concise and relevant. If you're unsure about something, you'll admit it rather than making assumptions. You'll maintain a friendly, professional tone throughout the conversation.

Key points about your capabilities:
- Your name is "Milo"
- You run locally in the browser, not on a remote server
- Your responses should be focused and to-the-point
- You'll help users understand complex topics through clear explanations`
  }

  /**
   * Set UI elements for the model to interact with
   * @param {Object} elements - UI elements
   */
  setElements(elements) {
    this.elements = elements
  }

  /**
   * Load the last conversation from the database
   * @returns {Promise<boolean>} Whether a conversation was loaded
   */
  async loadLastConversation() {
    try {
      const conversationHistory = await getLastConversation()

      if (conversationHistory && conversationHistory.length > 0) {
        this.conversation = conversationHistory
        this.displayConversation()
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
   * Create and show the typing indicator
   * @private
   */
  showTypingIndicator() {
    const outputEl = this.elements.output

    // Create assistant message container if not already present
    let assistantMessageEl = outputEl.querySelector(
      '.assistant-message:last-child',
    )
    if (!assistantMessageEl) {
      assistantMessageEl = document.createElement('div')
      assistantMessageEl.className = 'assistant-message'

      const roleLabel = document.createElement('div')
      roleLabel.className = 'role-label'
      roleLabel.textContent = 'Assistant:'
      assistantMessageEl.appendChild(roleLabel)

      outputEl.appendChild(assistantMessageEl)
    }

    // Check if typing indicator already exists
    if (assistantMessageEl.querySelector('.typing-indicator')) {
      return
    }

    // Create typing indicator
    const indicatorEl = document.createElement('div')
    indicatorEl.className = 'typing-indicator'

    // Create three dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div')
      dot.className = 'typing-dot'
      indicatorEl.appendChild(dot)
    }

    // Add to assistant message
    assistantMessageEl.appendChild(indicatorEl)
    outputEl.scrollTop = outputEl.scrollHeight
  }

  /**
   * Remove the typing indicator
   * @private
   */
  hideTypingIndicator() {
    const outputEl = this.elements.output
    const indicator = outputEl.querySelector('.typing-indicator')
    if (indicator) {
      indicator.remove()
    }
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
      // Create messages array with system prompt
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversation,
        { role: 'user', content: prompt },
      ]

      // Display full conversation history (excluding system prompt)
      this.conversation.push({ role: 'user', content: prompt })
      this.displayConversation()

      // Show typing indicator before starting generation
      this.showTypingIndicator()

      // Create chat completion using messages including system prompt
      const stream = await this.engine.chat.completions.create({
        messages,
        stream: true,
      })

      let assistantResponse = ''
      let firstChunk = true

      for await (const chunk of stream) {
        const token = chunk.choices[0].delta.content || ''
        assistantResponse += token

        // On first token, hide the typing indicator and create the response element
        if (firstChunk) {
          this.hideTypingIndicator()
          firstChunk = false
        }

        // Update just the assistant's current response
        const outputEl = this.elements.output
        const assistantMessageEl = outputEl.querySelector(
          '.assistant-message:last-child',
        )

        if (assistantMessageEl) {
          // Find existing response element or create one
          let responseEl =
            assistantMessageEl.querySelector('.assistant-content')
          if (!responseEl) {
            responseEl = document.createElement('div')
            responseEl.className = 'assistant-content'
            assistantMessageEl.appendChild(responseEl)
          }
          responseEl.textContent = assistantResponse
        }

        this.elements.output.scrollTop = this.elements.output.scrollHeight
      }

      // Add assistant message to conversation history
      this.conversation.push({ role: 'assistant', content: assistantResponse })

      // Save conversation to the database
      try {
        await saveConversation(this.conversation)
        logDebug('Conversation saved to database')
      } catch (err) {
        logDebug('Failed to save conversation: ' + err.message)
      }

      return true
    } catch (error) {
      // Hide typing indicator if there's an error
      this.hideTypingIndicator()

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
   * @param {boolean} appendSystemMessage - Whether to append system message without clearing the conversation
   */
  displayConversation(
    systemMessage = null,
    isError = false,
    appendSystemMessage = false,
  ) {
    const outputEl = this.elements.output

    // Only clear output if we're not appending
    if (!appendSystemMessage) {
      outputEl.innerHTML = ''
    }

    // Show conversation history if not appending or if the output is empty
    if (!appendSystemMessage || outputEl.innerHTML === '') {
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
    }

    // Show system message if provided and we're not already showing the same message
    if (systemMessage) {
      // Check if we already have this system message displayed (to avoid duplicates)
      const existingSystemMessages = outputEl.querySelectorAll(
        '.system-message, .error-message',
      )
      let isDuplicate = false

      existingSystemMessages.forEach((el) => {
        if (el.textContent === systemMessage) {
          isDuplicate = true
        }
      })

      // Only add if not a duplicate
      if (!isDuplicate) {
        const systemEl = document.createElement('div')
        systemEl.className = isError ? 'error-message' : 'system-message'
        systemEl.textContent = systemMessage

        // If we're appending and there's already a system message, replace it
        if (appendSystemMessage && existingSystemMessages.length > 0) {
          existingSystemMessages[existingSystemMessages.length - 1].replaceWith(
            systemEl,
          )
        } else {
          outputEl.appendChild(systemEl)
        }
      }
    }

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

      placeholderEl.appendChild(roleLabel)
      outputEl.appendChild(placeholderEl)
    }

    // Scroll to bottom
    outputEl.scrollTop = outputEl.scrollHeight
  }

  /**
   * Load a model by ID
   * @param {string} modelId - Model identifier
   * @returns {Promise<void>}
   */
  async loadModel(modelId) {
    try {
      // Store current conversation
      const currentConversation = [...this.conversation]

      // Don't modify the chat display during loading, just use the status area
      logStatus('Initializing...', true)

      logStatus('Checking browser compatibility...', true)
      checkWebGPUSupport()

      const selectedOption = Array.from(this.elements.modelSelect.options).find(
        (opt) => opt.value === modelId,
      )
      const downloadSize = selectedOption ? selectedOption.dataset.size : '?'

      // Check if model has been downloaded before
      const isDownloaded = await isModelDownloaded(modelId)

      if (isDownloaded) {
        logStatus('Loading model from cache...', true)
      } else {
        logStatus(
          `Downloading model (${downloadSize}). This may take a while...`,
          true,
        )
      }

      let progressReceived = false
      let downloadStartTime = Date.now()

      // Show the progress container
      this.elements.progressContainer.style.display = 'block'

      // Enable indeterminate progress animation
      this.elements.progressFill.className = 'progress-fill indeterminate'

      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          progressReceived = true

          // Log the raw progress for debugging
          logDebug(`Raw progress value: ${JSON.stringify(progress)}`)

          let percent = 0

          // Parse progress and calculate percentage
          if (progress && typeof progress === 'object' && progress.text) {
            if ('progress' in progress) {
              percent = Math.floor(progress.progress * 100)
            } else {
              const percentMatch = progress.text.match(/(\d+)% completed/)
              if (percentMatch && percentMatch.length >= 2) {
                percent = parseInt(percentMatch[1])
              }
            }
          } else if (typeof progress === 'number' && !isNaN(progress)) {
            percent = Math.floor(progress * 100)
          }

          // Ensure percent is valid
          percent = Math.max(0, Math.min(100, percent))

          // Calculate estimated time remaining
          const elapsedMs = Date.now() - downloadStartTime
          const remainingTime = calculateRemainingTime(elapsedMs, percent)

          // Reset indeterminate styling when we have real progress
          this.elements.progressFill.className = 'progress-fill'
          this.elements.progressFill.style.marginLeft = '0'

          // Update progress bar and status
          updateProgress(
            this.elements.progressFill,
            this.elements.progressText,
            this.elements.progressContainer,
            percent,
          )

          // Use downloaded status to determine message
          const messagePrefix = isDownloaded
            ? 'Loading from cache'
            : 'Downloading model'
          logStatus(`${messagePrefix}... ${percent}%${remainingTime}`, true)
        },
        useIndexedDBCache: true,
      })

      // Reset progress bar styling and show complete
      this.elements.progressFill.className = 'progress-fill'
      this.elements.progressFill.style.marginLeft = '0'
      this.elements.progressFill.style.width = '100%'
      this.elements.progressText.textContent = '100%'

      // Short delay before hiding progress to show completion
      setTimeout(() => {
        this.elements.progressContainer.style.display = 'none'
      }, 500)

      const loadTime = ((Date.now() - downloadStartTime) / 1000).toFixed(1)

      // If this was a new download, mark it as downloaded for next time
      if (!isDownloaded) {
        await markModelDownloaded(modelId)
        logStatus(`Model downloaded and loaded in ${loadTime}s`, true)
      } else {
        logStatus(`Model loaded from cache in ${loadTime}s`, true)
      }

      // Clear any existing system messages before adding model ready message
      const outputEl = this.elements.output
      const systemMessages = outputEl.querySelectorAll(
        '.system-message, .error-message',
      )
      systemMessages.forEach((el) => el.remove())

      // Add a small indicator that the model is ready if there's chat history
      if (this.conversation.length > 0) {
        const systemEl = document.createElement('div')
        systemEl.className = 'system-message'
        systemEl.textContent = 'Model ready. Ask me something!'
        outputEl.appendChild(systemEl)
        outputEl.scrollTop = outputEl.scrollHeight
      } else {
        // If no chat history, display a welcome message
        this.displayConversation('Model ready. Ask me something!')
      }

      return true
    } catch (error) {
      logError(`Failed to load model: ${error.message}`, true)
      logDebug(
        `Detailed error: ${JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        )}`,
      )

      // Use the status area for error messages
      logStatus('Check debug log for more details', false)

      // Clear any existing system messages before adding error message
      const outputEl = this.elements.output
      const systemMessages = outputEl.querySelectorAll(
        '.system-message, .error-message',
      )
      systemMessages.forEach((el) => el.remove())

      // Add error indicator to the chat
      const systemEl = document.createElement('div')
      systemEl.className = 'error-message'
      systemEl.textContent = 'Error loading model. Please try again.'
      outputEl.appendChild(systemEl)
      outputEl.scrollTop = outputEl.scrollHeight

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
