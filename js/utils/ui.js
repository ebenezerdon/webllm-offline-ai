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
 * Update model info display
 * @param {HTMLElement} modelInfoEl - Model info container element
 * @param {HTMLElement} sizeEl - Size display element
 * @param {HTMLElement} vramEl - VRAM display element
 * @param {HTMLElement} paramsEl - Parameters display element
 * @param {HTMLOptionElement} selectedOption - Selected option from dropdown
 */
export const updateModelInfo = (
  modelInfoEl,
  sizeEl,
  vramEl,
  paramsEl,
  selectedOption,
) => {
  if (!modelInfoEl || !sizeEl || !vramEl || !paramsEl) return

  if (selectedOption) {
    const downloadSize = selectedOption.dataset.size || '--'
    const vramRequired = selectedOption.dataset.vram || '--'
    const params = selectedOption.dataset.params || '--'

    sizeEl.textContent = downloadSize
    vramEl.textContent = vramRequired
    paramsEl.textContent = params

    // Only update display style if not on mobile or if we haven't loaded a model yet
    const isMobile = window.innerWidth <= 1024
    const modelLoaded =
      document.getElementById('prompt') &&
      !document.getElementById('prompt').disabled

    if (!isMobile || !modelLoaded) {
      modelInfoEl.style.display = 'block'
    }
  } else {
    modelInfoEl.style.display = 'none'
  }
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
      option.dataset.vram = model.vram
      option.dataset.params = model.params

      optgroup.appendChild(option)
    })

    selectEl.appendChild(optgroup)
  })
}
