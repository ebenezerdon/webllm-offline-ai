/**
 * Main entry point for the WebLLM Chat application
 */
import app from './app.js'
import { initpcUI } from './utils/pc-ui.js'

// Initialize the app and pc UI
document.addEventListener('DOMContentLoaded', () => {
  console.log('WebLLM Chat application - pc Edition Initializing...')
  // app.init() is already called within app.js upon DOMContentLoaded
  // initpcUI(); // This will be called by its own DOMContentLoaded listener
})
