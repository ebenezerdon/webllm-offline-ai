/**
 * Utility functions for UI manipulation
 */

/**
 * Update progress bar
 * @param {HTMLElement} fillEl - Progress fill element
 * @param {HTMLElement} textEl - Progress text element
 * @param {HTMLElement} containerEl - Progress container element
 * @param {number} percent - Progress percentage (0-100)
 */
export const updateProgress = (fillEl, textEl, containerEl, percent) => {
  if (!fillEl || !textEl || !containerEl) return

  containerEl.style.display = 'block'
  fillEl.style.width = `${percent}%`

  // Hide the progress text since it's redundant with the status message
  textEl.style.display = 'none'

  // Still update the text content in case it's needed elsewhere
  textEl.textContent = `${percent}%`
}

/**
 * Calculate and format remaining download time
 * @param {number} elapsedMs - Elapsed milliseconds
 * @param {number} percent - Current progress percentage
 * @returns {string} - Formatted remaining time string
 */
export const calculateRemainingTime = (elapsedMs, percent) => {
  let remainingTime = ''

  if (percent > 0) {
    const totalEstimatedMs = (elapsedMs / percent) * 100
    const remainingMs = totalEstimatedMs - elapsedMs

    // Only show time estimate if we have at least 5% progress
    if (percent >= 5 && remainingMs > 0) {
      if (remainingMs < 60000) {
        remainingTime = ` (${Math.ceil(remainingMs / 1000)}s remaining)`
      } else {
        remainingTime = ` (${Math.ceil(remainingMs / 60000)}m remaining)`
      }
    }
  }

  return remainingTime
}

/**
 * Check if WebGPU is supported in the current browser
 * @returns {boolean} - True if WebGPU is supported
 * @throws {Error} - If WebGPU is not supported
 */
export const checkWebGPUSupport = () => {
  if (!navigator.gpu) {
    throw new Error(
      'WebGPU not supported in this browser. Please use Chrome 113+, Edge 113+, or Firefox 118+ with WebGPU enabled.',
    )
  }

  return true
}

/**
 * Populate model select dropdown from model data
 * @param {HTMLSelectElement} selectEl - Select element to populate
 * @param {Array} modelGroups - Array of model group objects
 */
export const populateModelSelect = (selectEl, modelGroups) => {
  if (!selectEl || !modelGroups) return

  // Clear existing options
  selectEl.innerHTML = ''

  // Add options from model data
  modelGroups.forEach((group) => {
    const optgroup = document.createElement('optgroup')
    optgroup.label = group.group

    group.models.forEach((model) => {
      const option = document.createElement('option')
      option.value = model.id
      option.textContent = model.name
      option.dataset.size = model.size
      optgroup.appendChild(option)
    })

    selectEl.appendChild(optgroup)
  })
}
