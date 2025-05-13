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
      const stream = await this.engine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      })

      for await (const chunk of stream) {
        const token = chunk.choices[0].delta.content || ''
        this.elements.output.textContent += token
        this.elements.output.scrollTop = this.elements.output.scrollHeight
      }

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
   * Load a model by ID
   * @param {string} modelId - Model identifier
   * @returns {Promise<void>}
   */
  async loadModel(modelId) {
    try {
      // Reset UI state
      this.elements.output.textContent = 'Initializing...'

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
      this.elements.output.textContent = `Starting model download (${downloadSize}). This may take a while for the first time...`

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

          this.elements.output.textContent = `Loading model... ${percent}%${remainingTime}`
          logStatus(`Download progress: ${percent}%${remainingTime}`)
        },
        useIndexedDBCache: true,
      })

      const loadTime = ((Date.now() - downloadStartTime) / 1000).toFixed(1)

      if (!progressReceived) {
        logDebug('No progress callbacks were received during loading')
      }

      this.elements.output.textContent = `Model ready in ${loadTime}s. Ask me something!`
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
