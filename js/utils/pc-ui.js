/**
 * pc 11 UI Interaction Manager
 * Handles window behaviors, animations, and desktop interactions
 */

let appWindow
let titleBar
let minimizeButton
let maximizeButton
let closeButton
let taskbarAppIcon
let taskbarClock
let taskbarDate
let taskbarLogButton
let logWindow = null
let originalDebugParent = null
let debugElement = null
let startButton = null
let startMenu = null
let pcDesktopElement = null // Cache the element

let isDragging = false
let dragOffsetX, dragOffsetY
let isMaximized = false
let windowPosition = { x: 0, y: 0 }
let isStartMenuOpen = false

const setDynamicViewportHeight = () => {
  if (!pcDesktopElement) {
    pcDesktopElement = document.querySelector('.pc-desktop')
  }
  if (pcDesktopElement && window.matchMedia('(max-width: 768px)').matches) {
    // Only apply this on mobile where 100vh is problematic
    const actualVh = window.innerHeight
    pcDesktopElement.style.height = `${actualVh}px`

    // Also set the app window and content height to ensure proper space allocation
    const appWindowEl = document.querySelector('.app-window:not(#logWindow)')
    if (appWindowEl) {
      appWindowEl.style.maxHeight = `${actualVh - 44}px` // Account for taskbar

      // Adjust content area height
      const titlebarHeight =
        appWindowEl.querySelector('.app-window-titlebar')?.offsetHeight || 38
      const contentEl = appWindowEl.querySelector('.app-window-content')
      if (contentEl) {
        contentEl.style.maxHeight = `${actualVh - 44 - titlebarHeight}px`
      }

      // Ensure the output area doesn't take up too much space
      const outputEl = document.getElementById('output')
      const formEl = document.getElementById('chat-form')
      const topStatusEl = document.getElementById('top-status-container')
      const buttonContainerEl = document.querySelector('.button-container')

      if (outputEl && formEl && topStatusEl) {
        const formHeight = formEl.offsetHeight || 56
        const statusHeight = topStatusEl.offsetHeight || 20
        const buttonsHeight = buttonContainerEl?.offsetHeight || 0
        const availableHeight =
          actualVh -
          44 -
          titlebarHeight -
          formHeight -
          statusHeight -
          buttonsHeight -
          30 // Extra padding
        outputEl.style.maxHeight = `${Math.max(50, availableHeight)}px`
      }
    }
  } else if (pcDesktopElement) {
    // On desktop, or if media query doesn't match, revert to CSS controlled height
    pcDesktopElement.style.height = ''

    // Reset any dynamic heights applied to child elements
    const appWindowEl = document.querySelector('.app-window:not(#logWindow)')
    if (appWindowEl) {
      appWindowEl.style.maxHeight = ''

      const contentEl = appWindowEl.querySelector('.app-window-content')
      if (contentEl) {
        contentEl.style.maxHeight = ''
      }

      const outputEl = document.getElementById('output')
      if (outputEl) {
        outputEl.style.maxHeight = ''
      }
    }
  }
}

const initpcUI = () => {
  appWindow = document.getElementById('webLlmAppWindow')
  titleBar = document.getElementById('appWindowTitlebar')
  minimizeButton = appWindow.querySelector('.minimize-button')
  maximizeButton = appWindow.querySelector('.maximize-button')
  closeButton = appWindow.querySelector('.close-button')
  taskbarAppIcon = document.getElementById('taskbarWebLlmApp')
  taskbarClock = document.getElementById('taskbarClock')
  taskbarDate = document.getElementById('taskbarDate')
  taskbarLogButton = document.getElementById('taskbarLogButton')
  debugElement = document.getElementById('debug')
  startButton = document.querySelector('.taskbar-start-button')
  startMenu = document.getElementById('startMenu')
  pcDesktopElement = document.querySelector('.pc-desktop') // Initialize cached element

  if (debugElement) {
    originalDebugParent = debugElement.parentNode
  }

  if (
    !appWindow ||
    !titleBar ||
    !minimizeButton ||
    !maximizeButton ||
    !closeButton ||
    !taskbarAppIcon ||
    !taskbarClock ||
    !pcDesktopElement || // Check for pcDesktopElement
    !taskbarLogButton ||
    !startButton ||
    !startMenu
  ) {
    console.error('pc UI elements not found. Aborting UI initialization.')
    return
  }

  setDynamicViewportHeight() // Call on init
  window.addEventListener('resize', setDynamicViewportHeight)
  window.addEventListener('orientationchange', () => {
    // On orientation change, delay the viewport adjustment slightly to ensure accurate measurements
    setTimeout(setDynamicViewportHeight, 100)
  })

  // Add a specific handler for when virtual keyboards appear on mobile
  if ('visualViewport' in window) {
    window.visualViewport.addEventListener('resize', () => {
      // If this is likely a virtual keyboard (height change but not width)
      if (
        window.innerWidth === window.visualViewport.width &&
        window.innerHeight > window.visualViewport.height
      ) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height

        // Adjust the form position to be visible above the keyboard
        const formEl = document.getElementById('chat-form')
        if (formEl && keyboardHeight > 50) {
          // Only adjust if keyboard is likely present
          formEl.style.position = 'fixed'
          formEl.style.bottom = `${keyboardHeight}px`

          // Also adjust the output area to make room
          const outputEl = document.getElementById('output')
          if (outputEl) {
            outputEl.style.marginBottom = `${keyboardHeight + 20}px`
          }
        }
      } else {
        // Reset when keyboard is hidden
        const formEl = document.getElementById('chat-form')
        if (formEl) {
          formEl.style.position = 'sticky'
          formEl.style.bottom = '0'

          const outputEl = document.getElementById('output')
          if (outputEl) {
            outputEl.style.marginBottom = '8px'
          }
        }
      }
    })
  }

  setupWindowDragging()
  setupWindowControls()
  setupTaskbar()
  setupLogWindowInteractions()
  setupStartMenu()
  updateClock()

  // Update clock every minute
  setInterval(updateClock, 60000)

  // Automatically maximize window on mobile devices
  if (window.matchMedia('(max-width: 768px)').matches) {
    // Use a slight delay to ensure all elements are properly initialized
    setTimeout(() => {
      if (!isMaximized) {
        toggleMaximize()
      }
    }, 100)
  } else {
    // Center window initially if not maximized and not on mobile
    if (!isMaximized) {
      centerWindow()
    }
  }

  // Add snap behavior when window is dragged to top edge
  setupSnapBehavior()

  // Add window animations
  applyWindowAnimations()
}

const centerWindow = () => {
  if (appWindow && !isMaximized) {
    const desktop = document.querySelector('.pc-desktop')
    if (desktop) {
      const left = (desktop.offsetWidth - appWindow.offsetWidth) / 2
      const top = (desktop.offsetHeight - appWindow.offsetHeight) / 2

      appWindow.style.left = `${left}px`
      appWindow.style.top = `${top}px`

      // Store position for restore
      windowPosition = { x: left, y: top }
    }
  }
}

const setupWindowDragging = () => {
  titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.app-window-controls')) return

    appWindow.style.transition = 'none' // Disable transitions during drag prep

    if (isMaximized) {
      toggleMaximize() // Restore to normal size and position first

      // Calculate initial position for the restored window so cursor is within title bar
      // Estimate original non-maximized width if not available, or use a sensible default
      const restoredWidth =
        parseInt(windowPosition.width) || appWindow.offsetWidth
      const newLeft = e.clientX - restoredWidth / 3 // Place cursor about 1/3 into the title bar
      appWindow.style.left = `${newLeft}px`
      appWindow.style.top = '15px' // Start near top of screen

      // Offsets are now relative to this newly restored position
      dragOffsetX = e.clientX - appWindow.offsetLeft
      dragOffsetY = e.clientY - appWindow.offsetTop
    } else {
      dragOffsetX = e.clientX - appWindow.offsetLeft
      dragOffsetY = e.clientY - appWindow.offsetTop
    }

    isDragging = true
    document.body.style.userSelect = 'none'
    appWindow.classList.add('dragging')
  })

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      let newX = e.clientX - dragOffsetX
      let newY = e.clientY - dragOffsetY

      const desktop = document.querySelector('.pc-desktop')
      if (desktop) {
        const maxX = desktop.offsetWidth - 100
        const maxY = desktop.offsetHeight - 40
        newX = Math.max(-appWindow.offsetWidth + 100, Math.min(newX, maxX))
        newY = Math.max(0, Math.min(newY, maxY))
      }

      appWindow.style.left = `${newX}px`
      appWindow.style.top = `${newY}px`

      // Update windowPosition continuously for potential restoration later
      // if not maximizing again
      windowPosition = {
        width: appWindow.offsetWidth + 'px',
        height: appWindow.offsetHeight + 'px',
        x: newX,
        y: newY,
      }
    }
  })

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false
      appWindow.style.transition = 'all 0.2s ease-out' // Restore transitions
      document.body.style.userSelect = 'auto'
      appWindow.classList.remove('dragging')
    }
  })
}

const setupSnapBehavior = () => {
  document.addEventListener('mousemove', (e) => {
    if (isDragging && !isMaximized) {
      // If window is dragged to top of screen, show maximize preview
      if (e.clientY < 10) {
        appWindow.classList.add('snap-preview')
      } else {
        appWindow.classList.remove('snap-preview')
      }
    }
  })

  document.addEventListener('mouseup', (e) => {
    // If released near top edge, maximize
    if (isDragging && !isMaximized && e.clientY < 10) {
      toggleMaximize()
    }
    appWindow.classList.remove('snap-preview')
  })
}

const toggleMaximize = () => {
  const iconSpan = maximizeButton.querySelector('.icon')

  if (!isMaximized) {
    // Store current state BEFORE maximizing
    windowPosition = {
      width: appWindow.offsetWidth + 'px',
      height: appWindow.offsetHeight + 'px',
      x: appWindow.offsetLeft,
      y: appWindow.offsetTop,
    }

    isMaximized = true
    appWindow.classList.add('maximized')

    // Clear inline styles so the .maximized class can take over
    appWindow.style.width = ''
    appWindow.style.height = ''
    appWindow.style.left = ''
    appWindow.style.top = ''
    appWindow.style.transform = '' // Ensure no transform interferes

    iconSpan.classList.remove('icon-maximize')
    iconSpan.classList.add('icon-restore')
    maximizeButton.title = 'Restore'
  } else {
    // Restore state BEFORE removing class
    isMaximized = false
    appWindow.classList.remove('maximized')

    if (windowPosition) {
      appWindow.style.width = windowPosition.width
      appWindow.style.height = windowPosition.height
      appWindow.style.left = `${windowPosition.x}px`
      appWindow.style.top = `${windowPosition.y}px`
    } else {
      // Fallback to centering if no position was stored
      centerWindow()
    }

    iconSpan.classList.remove('icon-restore')
    iconSpan.classList.add('icon-maximize')
    maximizeButton.title = 'Maximize'
  }

  appWindow.classList.add('size-changing')
  setTimeout(() => {
    appWindow.classList.remove('size-changing')
  }, 250)
}

const setupWindowControls = () => {
  minimizeButton.addEventListener('click', () => {
    appWindow.classList.add('minimizing')

    setTimeout(() => {
      appWindow.classList.add('minimized')
      appWindow.classList.remove('minimizing')
      taskbarAppIcon.classList.remove('active')
    }, 200)
  })

  maximizeButton.addEventListener('click', toggleMaximize)

  // Double click title bar to maximize/restore with bounce effect
  titleBar.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.app-window-controls')) {
      appWindow.classList.add('bounce')
      setTimeout(() => {
        toggleMaximize()
        setTimeout(() => {
          appWindow.classList.remove('bounce')
        }, 300)
      }, 100)
    }
  })

  closeButton.addEventListener('click', () => {
    // Animate closing
    appWindow.classList.add('closing')

    setTimeout(() => {
      appWindow.classList.add('minimized')
      appWindow.style.opacity = '0'
      appWindow.style.pointerEvents = 'none'
      taskbarAppIcon.classList.remove('active')

      setTimeout(() => {
        appWindow.classList.remove('closing')
      }, 300)
    }, 150)
  })
}

const setupTaskbar = () => {
  taskbarAppIcon.addEventListener('click', () => {
    const isMinimized = appWindow.classList.contains('minimized')
    const isHidden = appWindow.style.opacity === '0'

    if (isMinimized || isHidden) {
      // Show animation
      appWindow.classList.add('restoring')

      // Make visible first
      appWindow.style.opacity = '1'
      appWindow.style.pointerEvents = 'auto'

      // Slightly delay removing minimized class for animation
      setTimeout(() => {
        appWindow.classList.remove('minimized')
        taskbarAppIcon.classList.add('active')

        setTimeout(() => {
          appWindow.classList.remove('restoring')
        }, 250)
      }, 50)
    } else {
      // Minimize with animation
      appWindow.classList.add('minimizing')

      setTimeout(() => {
        appWindow.classList.add('minimized')
        appWindow.classList.remove('minimizing')
        taskbarAppIcon.classList.remove('active')
      }, 200)
    }
  })

  // Add bounce effect to taskbar icon when clicked
  taskbarAppIcon.addEventListener('mousedown', () => {
    taskbarAppIcon.classList.add('pulse')
    setTimeout(() => {
      taskbarAppIcon.classList.remove('pulse')
    }, 300)
  })
}

const updateClock = () => {
  const now = new Date()

  // Format time (12-hour with leading zeros)
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes

  // Format date
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const dayName = days[now.getDay()]
  const monthName = months[now.getMonth()]
  const date = now.getDate()

  taskbarClock.textContent = `${formattedHours}:${formattedMinutes} ${ampm}`

  if (taskbarDate) {
    taskbarDate.textContent = `${dayName}, ${monthName} ${date}`
  }
}

const applyWindowAnimations = () => {
  // Add classes for initial load animation
  document.body.classList.add('init-load')
  appWindow.classList.add('init-appear')

  // Remove animation classes after animation completes
  setTimeout(() => {
    document.body.classList.remove('init-load')
    appWindow.classList.remove('init-appear')
  }, 500)

  // Mark taskbar app as active initially
  taskbarAppIcon.classList.add('active')
}

const createLogWindowHTML = () => {
  return `
    <div class="app-window-titlebar" id="logWindowTitlebar">
      <div class="app-window-titlebar-title">
        <span class="icon icon-debug"></span>
        <span>Debug Log</span>
      </div>
      <div class="app-window-controls">
        <button class="close-button" id="logWindowCloseButtonDynamic" title="Close Log">
          <span class="icon icon-close"></span>
        </button>
      </div>
    </div>
    <div class="app-window-content" id="logWindowMainContentDynamic">
      <!-- Debug content will be moved here -->
    </div>
  `
}

const toggleLogWindow = () => {
  if (!taskbarLogButton || !debugElement || !originalDebugParent) {
    console.warn('Log window elements not found, cannot toggle.')
    return
  }

  const desktopElement = document.querySelector('.pc-desktop')
  if (!desktopElement) {
    console.error('PC Desktop element not found.')
    return
  }

  if (!logWindow) {
    // Create window if it doesn't exist
    logWindow = document.createElement('div')
    logWindow.className = 'app-window' // Use existing app-window styles
    logWindow.id = 'logWindow' // Specific ID for styling
    logWindow.style.display = 'none' // Start hidden, will show with animation
    logWindow.innerHTML = createLogWindowHTML()
    desktopElement.appendChild(logWindow)

    // Attach event listener to its close button
    const closeButton = logWindow.querySelector('#logWindowCloseButtonDynamic')
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault() // Prevent any default behavior
        e.stopPropagation() // Stop event propagation

        // Apply disappearing animation
        logWindow.classList.add('disappearing')
        taskbarLogButton.classList.remove('active')

        // Wait for animation to complete before hiding and moving content back
        setTimeout(() => {
          logWindow.style.display = 'none'
          logWindow.classList.remove('disappearing')

          // Move #debug back to its original parent
          if (
            originalDebugParent &&
            debugElement.parentNode !== originalDebugParent
          ) {
            originalDebugParent.appendChild(debugElement)
          }
        }, 180) // Match animation duration from CSS
      })
    }
  }

  // Toggle visibility with animation
  const isHidden =
    logWindow.style.display === 'none' || logWindow.style.display === ''

  if (isHidden) {
    // First move #debug into the log window before showing it
    const logContentArea = logWindow.querySelector(
      '#logWindowMainContentDynamic',
    )
    if (logContentArea && debugElement.parentNode !== logContentArea) {
      logContentArea.appendChild(debugElement)
    }

    // Then show with animation
    requestAnimationFrame(() => {
      logWindow.style.display = 'flex'

      // Force a reflow to ensure the browser recognizes the display change before adding animation
      logWindow.offsetHeight

      logWindow.classList.add('appearing')
      taskbarLogButton.classList.add('active')

      // Remove animation class after it completes
      setTimeout(() => {
        logWindow.classList.remove('appearing')
      }, 230) // Match animation duration from CSS
    })
  } else {
    // Apply disappearing animation
    logWindow.classList.add('disappearing')
    taskbarLogButton.classList.remove('active')

    // Wait for animation to complete before hiding and moving content back
    setTimeout(() => {
      logWindow.style.display = 'none'
      logWindow.classList.remove('disappearing')

      // Move #debug back to its original parent
      if (
        originalDebugParent &&
        debugElement.parentNode !== originalDebugParent
      ) {
        originalDebugParent.appendChild(debugElement)
      }
    }, 180) // Match animation duration from CSS
  }
}

const setupLogWindowInteractions = () => {
  if (taskbarLogButton) {
    taskbarLogButton.addEventListener('click', toggleLogWindow)

    // Pulse effect for log button too
    taskbarLogButton.addEventListener('mousedown', () => {
      taskbarLogButton.classList.add('pulse')
      setTimeout(() => {
        taskbarLogButton.classList.remove('pulse')
      }, 300)
    })
  }
}

const setupStartMenu = () => {
  // Toggle start menu on click
  startButton.addEventListener('click', toggleStartMenu)

  // Also add touchstart for better mobile responsiveness
  startButton.addEventListener('touchstart', (e) => {
    e.preventDefault() // Prevent default touch behavior
    toggleStartMenu(e)
  })

  // Close start menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      isStartMenuOpen &&
      !startMenu.contains(e.target) &&
      !startButton.contains(e.target)
    ) {
      toggleStartMenu(null, false) // Force close
    }
  })

  // Handle escape key press to close start menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isStartMenuOpen) {
      toggleStartMenu(null, false) // Force close
    }
  })

  // Add bounce effect to start button when clicked
  startButton.addEventListener('mousedown', () => {
    startButton.classList.add('pulse')
    setTimeout(() => {
      startButton.classList.remove('pulse')
    }, 300)
  })

  // Handle power button click
  const powerButton = startMenu.querySelector('.power-button')
  if (powerButton) {
    powerButton.addEventListener('click', () => {
      // Simple implementation - just close the start menu
      toggleStartMenu(null, false)
    })
  }

  // Add hover effect for social media items
  const socialMediaItems = startMenu.querySelectorAll('.social-media-item')
  socialMediaItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-3px)'
      item.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
    })

    item.addEventListener('mouseleave', () => {
      item.style.transform = ''
      item.style.boxShadow = ''
    })

    // Add touch effect for mobile
    item.addEventListener('touchstart', () => {
      item.style.transform = 'translateY(-3px)'
      item.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
    })

    item.addEventListener('touchend', () => {
      setTimeout(() => {
        item.style.transform = ''
        item.style.boxShadow = ''
      }, 150)
    })
  })

  // Add swipe down to close functionality
  let touchStartY = 0
  let touchEndY = 0

  startMenu.addEventListener(
    'touchstart',
    (e) => {
      touchStartY = e.changedTouches[0].screenY
    },
    { passive: true },
  )

  startMenu.addEventListener(
    'touchend',
    (e) => {
      touchEndY = e.changedTouches[0].screenY

      // If swipe down of at least 50px
      if (touchEndY - touchStartY > 50) {
        toggleStartMenu(null, false) // Close the menu
      }
    },
    { passive: true },
  )
}

const toggleStartMenu = (e, forceState) => {
  if (e) e.stopPropagation()

  // If forceState is provided, use it, otherwise toggle
  isStartMenuOpen = forceState !== undefined ? forceState : !isStartMenuOpen

  if (isStartMenuOpen) {
    startMenu.classList.add('active')
    startButton.classList.add('active')
  } else {
    startMenu.classList.remove('active')
    startButton.classList.remove('active')
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initpcUI)

// Make the function accessible outside this module
export { initpcUI }
