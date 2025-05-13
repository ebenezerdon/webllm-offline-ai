/**
 * Utility functions for logging and UI updates
 */

let debugEl
let statusEl
let outputEl

/**
 * Initialize the logger with DOM elements
 * @param {Object} elements - DOM elements for logging
 */
export const initLogger = (elements) => {
  debugEl = elements.debug
  statusEl = elements.status
  outputEl = elements.output
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
 */
export const logStatus = (message) => {
  if (!statusEl) return

  statusEl.textContent = message
  logDebug(`Status: ${message}`)
}

/**
 * Log error message to the UI
 * @param {string} message - Error message
 */
export const logError = (message) => {
  if (!outputEl) return

  outputEl.innerHTML += `<div class="error">${message}</div>`
  logDebug(`ERROR: ${message}`)
  console.error(message)
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
