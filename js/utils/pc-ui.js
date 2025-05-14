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

let isDragging = false
let dragOffsetX, dragOffsetY
let isMaximized = false
let windowPosition = { x: 0, y: 0 }

const initpcUI = () => {
  appWindow = document.getElementById('webLlmAppWindow')
  titleBar = document.getElementById('appWindowTitlebar')
  minimizeButton = appWindow.querySelector('.minimize-button')
  maximizeButton = appWindow.querySelector('.maximize-button')
  closeButton = appWindow.querySelector('.close-button')
  taskbarAppIcon = document.getElementById('taskbarWebLlmApp')
  taskbarClock = document.getElementById('taskbarClock')
  taskbarDate = document.getElementById('taskbarDate')

  if (
    !appWindow ||
    !titleBar ||
    !minimizeButton ||
    !maximizeButton ||
    !closeButton ||
    !taskbarAppIcon ||
    !taskbarClock
  ) {
    console.error('pc UI elements not found. Aborting UI initialization.')
    return
  }

  setupWindowDragging()
  setupWindowControls()
  setupTaskbar()
  updateClock()

  // Update clock every minute
  setInterval(updateClock, 60000)

  // Center window initially if not maximized
  if (!isMaximized) {
    centerWindow()
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
    // Check if it's not the buttons area
    if (e.target.closest('.app-window-controls')) return

    if (isMaximized) {
      // When dragging from maximized state, restore window first
      // Calculate position so cursor stays at same relative point within titlebar
      const ratio = e.clientX / window.innerWidth
      toggleMaximize()

      // Update drag offset for smooth transition from maximized to normal
      dragOffsetX = Math.floor(appWindow.offsetWidth * ratio)
      dragOffsetY = e.clientY - appWindow.offsetTop
    } else {
      dragOffsetX = e.clientX - appWindow.offsetLeft
      dragOffsetY = e.clientY - appWindow.offsetTop
    }

    isDragging = true
    appWindow.style.transition = 'none'
    document.body.style.userSelect = 'none'

    // Add class for drag styling if desired
    appWindow.classList.add('dragging')
  })

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      let newX = e.clientX - dragOffsetX
      let newY = e.clientY - dragOffsetY

      // Boundary checks for desktop area
      const desktop = document.querySelector('.pc-desktop')
      if (desktop) {
        const maxX = desktop.offsetWidth - 100 // Allow some overflow
        const maxY = desktop.offsetHeight - 40 // Allow some overflow

        // Keep at least part of the window visible
        newX = Math.max(-appWindow.offsetWidth + 100, Math.min(newX, maxX))
        newY = Math.max(0, Math.min(newY, maxY))
      }

      appWindow.style.left = `${newX}px`
      appWindow.style.top = `${newY}px`

      // Store position for restore
      windowPosition = { x: newX, y: newY }
    }
  })

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false
      appWindow.style.transition =
        'transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), width 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), height 0.25s cubic-bezier(0.1, 0.9, 0.2, 1)'
      document.body.style.userSelect = 'auto'

      // Remove drag styling class
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
  isMaximized = !isMaximized
  appWindow.classList.toggle('maximized', isMaximized)

  const iconSpan = maximizeButton.querySelector('.icon')

  if (isMaximized) {
    // Store current position before maximizing
    if (!isDragging) {
      windowPosition = {
        x: appWindow.offsetLeft,
        y: appWindow.offsetTop,
      }
    }

    iconSpan.classList.remove('icon-maximize')
    iconSpan.classList.add('icon-restore')
    maximizeButton.title = 'Restore'
  } else {
    iconSpan.classList.remove('icon-restore')
    iconSpan.classList.add('icon-maximize')
    maximizeButton.title = 'Maximize'

    // Restore to previous position
    if (!isDragging) {
      appWindow.style.left = `${windowPosition.x}px`
      appWindow.style.top = `${windowPosition.y}px`
    }
  }

  // Add animation class
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initpcUI)

export { initpcUI }
