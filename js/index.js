/**
 * Main entry point for the WebLLM Chat application
 */
import { applyStyles } from './styles.js'
import app from './app.js'

// Apply styles programmatically
applyStyles()

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('WebLLM Chat application initialized')
})
