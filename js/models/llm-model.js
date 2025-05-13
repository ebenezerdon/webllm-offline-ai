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
import { saveConversation, getLastConversation } from '../utils/db.js'

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
      this.displayConversation(`Loading model: ${modelId} (${downloadSize})...`)

      let progressReceived = false
      let downloadStartTime = Date.now()

      // Setup cache loading indicator with indeterminate progress
      let cacheLoadingInterval = null
      let cacheLoadingDots = 0
      let cacheLoadingElapsed = 0

      // Show the progress container
      this.elements.progressContainer.style.display = 'block'

      // Enable indeterminate progress animation
      this.elements.progressFill.className = 'progress-fill indeterminate'

      const updateCacheLoadingIndicator = () => {
        if (!progressReceived) {
          cacheLoadingDots = (cacheLoadingDots % 3) + 1
          cacheLoadingElapsed = Math.floor(
            (Date.now() - downloadStartTime) / 1000,
          )
          const dots = '.'.repeat(cacheLoadingDots)
          const spaces = ' '.repeat(3 - cacheLoadingDots)

          // Try to simulate progress based on elapsed time for a smoother experience
          // Most cache loads complete within 5-15 seconds
          const simulatedProgress = Math.min(
            90,
            Math.floor(cacheLoadingElapsed / 0.15),
          )

          // Update text status
          this.displayConversation(
            `Loading from cache${dots}${spaces} (${cacheLoadingElapsed}s elapsed)`,
          )

          // Update progress text
          this.elements.progressText.textContent = `Loading... (${cacheLoadingElapsed}s)`

          // If no real progress received but significant time elapsed, show simulated progress
          if (cacheLoadingElapsed > 2) {
            this.elements.progressFill.className = 'progress-fill'
            this.elements.progressFill.style.marginLeft = '0'
            this.elements.progressFill.style.width = `${simulatedProgress}%`
          }
        }
      }

      // Start cache loading indicator
      cacheLoadingInterval = setInterval(updateCacheLoadingIndicator, 500)

      // Initial call to show immediately
      updateCacheLoadingIndicator()

      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          progressReceived = true

          // Log the raw progress for debugging
          logDebug(`Raw progress value: ${JSON.stringify(progress)}`)
          logDebug(`Progress type: ${typeof progress}`)

          let percent = 0
          let isCache = false

          // First check if it's a cache loading operation
          if (progress && typeof progress === 'object' && progress.text) {
            const cacheMatch = progress.text.match(/cache\[(\d+)\/(\d+)\]/)
            if (cacheMatch && cacheMatch.length >= 3) {
              isCache = true
              const [_, current, total] = cacheMatch
              percent = Math.floor((parseInt(current) / parseInt(total)) * 100)
              logDebug(
                `Cache loading progress: ${current}/${total} = ${percent}%`,
              )
            }
            // If not cache loading, check for regular progress
            else if ('progress' in progress) {
              percent = Math.floor(progress.progress * 100)
              logDebug(
                `Regular progress: ${percent}% (progress.progress = ${progress.progress})`,
              )
            }
            // Try to extract percentage from text as fallback
            else {
              const percentMatch = progress.text.match(/(\d+)% completed/)
              if (percentMatch && percentMatch.length >= 2) {
                percent = parseInt(percentMatch[1])
                logDebug(
                  `Progress from text: ${percent}% (matched from: ${progress.text})`,
                )
              }
            }
          }
          // Handle direct number progress
          else if (typeof progress === 'number' && !isNaN(progress)) {
            percent = Math.floor(progress * 100)
            logDebug(`Progress from number: ${percent}% (raw = ${progress})`)
          }

          // Ensure percent is valid
          percent = Math.max(0, Math.min(100, percent))
          logDebug(`Final calculated progress: ${percent}%`)

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

          // Update loading message
          const messagePrefix = isCache ? 'Loading from cache' : 'Loading model'
          this.displayConversation(
            `${messagePrefix}... ${percent}%${remainingTime}`,
          )
          logStatus(
            `${
              isCache ? 'Cache' : 'Download'
            } progress: ${percent}%${remainingTime}`,
          )
        },
        useIndexedDBCache: true,
      })

      // Stop cache loading indicator
      clearInterval(cacheLoadingInterval)

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

      if (!progressReceived) {
        logDebug(
          'No progress callbacks were received - likely loaded from cache',
        )
        logStatus(`Model loaded from cache in ${loadTime}s`)
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
