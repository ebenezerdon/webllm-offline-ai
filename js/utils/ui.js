/**
 * Utility functions for UI manipulation (pc Theme)
 */

/**
 * Update progress bar
 * @param {HTMLElement} fillEl - Progress fill element
 * @param {HTMLElement} textEl - Progress text element
 * @param {HTMLElement} containerEl - Progress container element
 * @param {number} percent - Progress percentage (0-100)
 */
export const updateProgress = (fillEl, textEl, containerEl, percent) => {
  if (!fillEl || !containerEl) return

  containerEl.style.display = 'block'
  fillEl.style.width = `${percent}%`

  // Update text element for accessibility but hide it visually
  // since the percentage is already shown in the status message
  if (textEl) {
    textEl.textContent = `${percent}%` // Keep for screen readers
    textEl.style.display = 'none' // Hide visually
  }
}

/**
 * Calculate and format remaining download time
 * @param {number} elapsedMs - Elapsed milliseconds
 * @param {number} percent - Current progress percentage
 * @returns {string} - Formatted remaining time string
 */
export const calculateRemainingTime = (elapsedMs, percent) => {
  let remainingTime = ''

  if (percent > 0 && percent < 100) {
    const totalEstimatedMs = (elapsedMs / percent) * 100
    const remainingMs = totalEstimatedMs - elapsedMs

    if (percent >= 5 && remainingMs > 0) {
      if (remainingMs < 60000) {
        remainingTime = ` (~${Math.ceil(remainingMs / 1000)}s left)`
      } else {
        remainingTime = ` (~${Math.ceil(remainingMs / 60000)} min left)`
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
      'WebGPU not supported. Please use a WebGPU-enabled browser (e.g., Chrome, Edge, Firefox Nightly with flags).',
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
  selectEl.innerHTML = '' // Clear existing options

  modelGroups.forEach((group) => {
    const optgroup = document.createElement('optgroup')
    optgroup.label = group.group
    group.models.forEach((model) => {
      const option = document.createElement('option')
      option.value = model.id
      option.textContent = model.name // e.g., "Qwen2.5 0.5B (1.1 GB)"
      option.dataset.size = model.size // e.g., "1.1 GB"

      // Attempt to parse parameters and VRAM more directly if possible
      // For now, we'll rely on the name and basic calculation in app.js or llm-model.js for display
      optgroup.appendChild(option)
    })
    selectEl.appendChild(optgroup)
  })

  // Add event listener to update model info panel when selection changes
  selectEl.addEventListener('change', updateModelInfoPanel)
  // Initial call to display info for the default selected model (if any)
  updateModelInfoPanel({ target: selectEl })
}

/**
 * Update the model information panel based on the selected model.
 * This function will be called by an event listener on the model select dropdown.
 */
const updateModelInfoPanel = (event) => {
  const selectEl = event.target
  const selectedOption = selectEl.options[selectEl.selectedIndex]
  const modelInfoEl = document.getElementById('model-info')
  const downloadSizeEl = document.getElementById('model-download-size')
  const vramEl = document.getElementById('model-vram')
  const paramsEl = document.getElementById('model-params')

  if (
    !selectedOption ||
    !modelInfoEl ||
    !downloadSizeEl ||
    !vramEl ||
    !paramsEl
  ) {
    if (modelInfoEl) modelInfoEl.style.display = 'none'
    return
  }

  modelInfoEl.style.display = 'block'
  downloadSizeEl.textContent = selectedOption.dataset.size || 'N/A'

  // VRAM and Parameters are often part of the name or require specific knowledge.
  // Here, we attempt to parse from name, which is a common convention.
  const modelName = selectedOption.textContent
  let vramEstimate = 'N/A'
  let paramsCount = 'N/A'

  // Try to parse VRAM (example: if size is like "X.Y GB")
  const sizeMatch = (selectedOption.dataset.size || '').match(
    /(\d+\.?\d*)\s*GB/i,
  )
  if (sizeMatch && sizeMatch[1]) {
    const gb = parseFloat(sizeMatch[1])
    // Rough VRAM estimation: usually model size + some overhead
    vramEstimate = `~${(gb + Math.max(1, gb * 0.2)).toFixed(1)} GB`
  }

  // Try to parse parameters (example: "7B", "0.5B", "1.5B" from name)
  const paramsMatch =
    modelName.match(/(\d+\.?\d*\s*[BM]) Params/i) ||
    modelName.match(/(\d+\.?\d*\s*[BM])/) // More general match for B or M
  if (paramsMatch && paramsMatch[1]) {
    paramsCount = paramsMatch[1].replace(/\s*Params/i, '')
  }

  vramEl.textContent = vramEstimate
  paramsEl.textContent = paramsCount
}
