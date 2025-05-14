/**
 * Utility functions for logging and UI updates
 */

let debugEl
let statusEl
let outputEl
let topStatusEl

/**
 * Initialize the logger with DOM elements
 * @param {Object} elements - DOM elements for logging
 */
export const initLogger = (elements) => {
  debugEl = elements.debug
  statusEl = elements.status
  outputEl = elements.output
  topStatusEl = elements.topStatus
}

/**
 * Log debug message to the UI and console
 * @param {string} message - Message to log
 */
export const logDebug = (message) => {
  if (!debugEl) return

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  debugEl.innerHTML += `[${timestamp}] ${message}<br>`
  debugEl.scrollTop = debugEl.scrollHeight
  console.log(message)
}

/**
 * Update status message in the UI
 * @param {string} message - Status message
 * @param {boolean} isModelStatus - Whether this is a model loading status (to be displayed at the top)
 */
export const logStatus = (message, isModelStatus = false) => {
  if (!statusEl) return

  if (isModelStatus) {
    // Update the top status container in main chat
    if (topStatusEl) {
      topStatusEl.textContent = message
    }

    // Always update the status div in the sidebar for desktop view
    statusEl.textContent = message
  } else {
    statusEl.textContent = message
  }

  logDebug(`Status: ${message}`)
}

/**
 * Log error message to the UI
 * @param {string} message - Error message
 * @param {boolean} isModelError - Whether this is a model loading error (to be displayed at the top)
 */
export const logError = (message, isModelError = false) => {
  if (!outputEl) return

  if (isModelError && topStatusEl) {
    topStatusEl.textContent = message
    topStatusEl.classList.add('error')
  } else {
    outputEl.innerHTML += `<div class="error">${message}</div>`
  }

  logDebug(`ERROR: ${message}`)
  console.error(message)
}

/**
 * Clear the top status message
 */
export const clearTopStatus = () => {
  if (topStatusEl) {
    topStatusEl.textContent = ''
    topStatusEl.classList.remove('error')
  }
}

/**
 * Log browser information for debugging
 */
export const logBrowserInfo = () => {
  logDebug(`Browser: ${navigator.userAgent}`)

  if (navigator.gpu) {
    logDebug('WebGPU is available')
    navigator.gpu
      .requestAdapter()
      .then((adapter) => {
        if (adapter) {
          logDebug(`GPU adapter found: ${adapter.name || 'unknown'}`)
        } else {
          logDebug('No WebGPU adapter found')
        }
      })
      .catch((err) => {
        logDebug(`Error getting GPU adapter: ${err.message}`)
      })
  } else {
    logDebug('WebGPU is NOT available in this browser')
  }
}
