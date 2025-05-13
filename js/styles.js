/**
 * Application styles
 */
export const styles = `
  body {
    font-family: sans-serif;
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
  }

  #output {
    background: #f4f4f4;
    padding: 1rem;
    min-height: 200px;
    border: 1px solid #ccc;
    white-space: pre-wrap;
    overflow-y: auto;
    max-height: 400px;
  }

  form {
    margin-top: 1rem;
  }

  input,
  button,
  select {
    font-size: 1rem;
    padding: 0.5rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .error {
    color: red;
    font-weight: bold;
  }

  .status {
    margin-top: 1rem;
    font-style: italic;
    color: #666;
  }

  .debug {
    margin-top: 1rem;
    font-family: monospace;
    font-size: 0.8rem;
    background: #eee;
    padding: 0.5rem;
    border: 1px solid #ddd;
    max-height: 150px;
    overflow-y: auto;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .controls button {
    flex: 1;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 4px;
    margin-top: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #4caf50;
    width: 0%;
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    margin-top: 5px;
    font-size: 0.9rem;
  }

  .model-size {
    display: inline-block;
    font-size: 0.8rem;
    color: #666;
    margin-left: 5px;
  }

  .resource-warning {
    margin-top: 10px;
    font-size: 0.8rem;
    color: #f57c00;
    display: none;
  }

  .model-group {
    border-top: 1px solid #ddd;
    margin-top: 5px;
    padding-top: 3px;
    font-weight: bold;
    color: #666;
  }

  .model-info {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f8f8f8;
    display: none;
  }

  .model-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .model-detail {
    display: flex;
    align-items: center;
  }

  .model-detail-icon {
    margin-right: 5px;
    font-size: 1.2rem;
  }

  .model-detail-label {
    font-size: 0.8rem;
    color: #666;
    margin-right: 5px;
  }

  .model-detail-value {
    font-weight: bold;
    font-size: 0.9rem;
  }
`

/**
 * Apply styles to the document
 */
export const applyStyles = () => {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}
