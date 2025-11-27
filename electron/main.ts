import { app, BrowserWindow, ipcMain, clipboard, nativeImage, globalShortcut, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// ---- Fix __dirname for ES Modules ----
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let win: BrowserWindow | null = null

interface ClipItem {
  id: number
  text?: string
  image?: string
  createdAt: string
}

let history: ClipItem[] = []
let lastText = ''
let lastImageData = ''

// Disable hardware acceleration BEFORE app is ready
app.disableHardwareAcceleration()

function createWindow(): void {
  console.log('Creating window...')
  
  // Find preload script
  let preloadPath: string | undefined
  
  const possiblePreloadPaths = [
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'preload.mjs'),
    path.join(__dirname, 'preload.cjs'),
  ]
  
  for (const possiblePath of possiblePreloadPaths) {
    if (fs.existsSync(possiblePath)) {
      preloadPath = possiblePath
      console.log('Found preload at:', preloadPath)
      break
    }
  }
  
  if (!preloadPath) {
    console.error('No preload script found!')
    preloadPath = possiblePreloadPaths[0]
  }

  // Create window with aggressive floating capabilities
  win = new BrowserWindow({
    width: 450,
    height: 650,
    show: false,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    transparent: false,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: true,
    movable: true,
    backgroundColor: '#00000000',
    // macOS specific settings for better floating
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hidden',
      vibrancy: 'under-window',
      visualEffectState: 'active',
      type: 'panel',
    } : {
      thickFrame: false,
    }),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      backgroundThrottling: false,
    },
  })

  // Apply aggressive floating settings
  applyFloatingSettings()

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server:', process.env.VITE_DEV_SERVER_URL)
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    const indexHtml = path.join(__dirname, '../dist/index.html')
    console.log('Loading production:', indexHtml)
    win.loadFile(indexHtml)
  }

  // Re-apply floating settings when shown
  win.on('show', () => {
    console.log('Window shown, reapplying floating settings')
    applyFloatingSettings()
    win?.focus()
  })

  // Hide window when it loses focus
  win.on('blur', () => {
    setTimeout(() => {
      if (win && !win.webContents.isDevToolsOpened() && win.isVisible()) {
        console.log('Window lost focus, hiding...')
        win.hide()
      }
    }, 150)
  })

  win.on('ready-to-show', () => {
    console.log('Window is ready to show')
  })

  win.on('focus', () => {
    console.log('Window focused')
  })

  win.on('closed', () => {
    win = null
  })
}

// Function to apply aggressive floating settings
function applyFloatingSettings(): void {
  if (!win) return

  console.log('Applying floating settings...')

  if (process.platform === 'darwin') {
    // macOS: Most aggressive settings for fullscreen floating
    try {
      win.setAlwaysOnTop(true, 'floating', 1)
      win.setVisibleOnAllWorkspaces(true, { 
        visibleOnFullScreen: true,
      })
      win.setFullScreenable(false)
      win.setHasShadow(true)
      win.setFocusable(true)
      console.log('macOS floating settings applied')
    } catch (error) {
      console.log('Error applying macOS floating settings:', error)
      win.setAlwaysOnTop(true)
      win.setVisibleOnAllWorkspaces(true)
    }
  } else if (process.platform === 'win32') {
    // Windows: Aggressive floating settings
    try {
      win.setAlwaysOnTop(true, 'screen-saver')
      win.setVisibleOnAllWorkspaces(true)
      win.setFocusable(true)
      console.log('Windows floating settings applied')
    } catch (error) {
      console.log('Error applying Windows floating settings:', error)
      win.setAlwaysOnTop(true)
    }
  } else {
    // Linux
    try {
      win.setAlwaysOnTop(true)
      win.setVisibleOnAllWorkspaces(true)
      win.setFocusable(true)
      console.log('Linux floating settings applied')
    } catch (error) {
      console.log('Error applying Linux floating settings:', error)
    }
  }
}

// ===== IPC Handlers =====
ipcMain.handle('get-history', (): ClipItem[] => {
  return history
})

ipcMain.handle('copy-text', (_event, text: string): boolean => {
  clipboard.writeText(text)
  lastText = text
  
  const item: ClipItem = {
    id: Date.now(),
    text: text,
    createdAt: new Date().toISOString(),
  }
  history.unshift(item)
  if (history.length > 300) history = history.slice(0, 300)
  win?.webContents.send('history-update', history)
  
  return true
})

ipcMain.handle('copy-image', (_event, base64Data: string): void => {
  const image = nativeImage.createFromDataURL(base64Data)
  clipboard.writeImage(image)
  lastImageData = base64Data
  
  const item: ClipItem = {
    id: Date.now(),
    image: base64Data,
    createdAt: new Date().toISOString(),
  }
  history.unshift(item)
  if (history.length > 300) history = history.slice(0, 300)
  win?.webContents.send('history-update', history)
})

ipcMain.handle('clear-history', (): void => {
  history = []
  lastText = ''
  lastImageData = ''
  win?.webContents.send('history-update', history)
})

ipcMain.handle('paste-item', async (_event, item: ClipItem): Promise<void> => {
  if (item.text) {
    clipboard.writeText(item.text)
    lastText = item.text
    
    console.log('Text copied to clipboard, preparing to paste...')
    
    // Hide the window first
    win?.hide()
    
    // Wait longer for better reliability (increased from 100ms to 300ms)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Enhanced paste with multiple attempts for better reliability
    let pasteAttempted = false
    
    // Method 1: AppleScript (macOS) - most reliable
    if (process.platform === 'darwin') {
      try {
        const { exec } = await import('child_process')
        
        // Use a more robust AppleScript command
        const appleScript = `
          tell application "System Events"
            delay 0.1
            keystroke "v" using command down
          end tell
        `
        
        exec(`osascript -e '${appleScript}'`, (error) => {
          if (error) {
            console.log('AppleScript paste failed:', error)
          } else {
            console.log('✓ AppleScript paste succeeded')
            pasteAttempted = true
          }
        })
        
        // Wait a bit for the command to execute
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        console.log('AppleScript execution failed:', error)
      }
    }
    
    // Method 2: PowerShell (Windows)
    else if (process.platform === 'win32') {
      try {
        const { exec } = await import('child_process')
        exec(`powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`)
        console.log('✓ Windows paste command sent')
        pasteAttempted = true
      } catch (error) {
        console.log('Windows paste failed:', error)
      }
    }
    
    // Method 3: xdotool (Linux)
    else {
      try {
        const { exec } = await import('child_process')
        exec(`xdotool key ctrl+v`)
        console.log('✓ Linux paste command sent')
        pasteAttempted = true
      } catch (error) {
        console.log('Linux paste failed:', error)
      }
    }
    
    if (!pasteAttempted) {
      console.log('Auto-paste not attempted or failed')
    }
  }
  
  if (item.image) {
    clipboard.writeImage(nativeImage.createFromDataURL(item.image))
    lastImageData = item.image
    win?.hide()
    console.log('Image copied to clipboard')
  }
})

// ===== Clipboard Watcher =====
setInterval((): void => {
  if (!win) return

  const currentText = clipboard.readText().trim()
  if (currentText && currentText !== lastText && currentText.length > 0) {
    console.log('New text detected:', currentText.substring(0, 50) + '...')
    const item: ClipItem = {
      id: Date.now(),
      text: currentText,
      createdAt: new Date().toISOString(),
    }
    history.unshift(item)
    lastText = currentText
    if (history.length > 300) history = history.slice(0, 300)
    win.webContents.send('history-update', history)
  }

  const image = clipboard.readImage()
  if (!image.isEmpty()) {
    const imageData = image.toDataURL()
    if (imageData && imageData !== lastImageData) {
      console.log('New image detected')
      const item: ClipItem = {
        id: Date.now(),
        image: imageData,
        createdAt: new Date().toISOString(),
      }
      history.unshift(item)
      lastImageData = imageData
      if (history.length > 300) history = history.slice(0, 300)
      win.webContents.send('history-update', history)
    }
  }
}, 800)

// ===== Global Shortcut Handler =====
const toggleWindow = (): void => {
  if (!win) return
  
  if (win.isVisible()) {
    win.hide()
  } else {
    console.log('Showing window...')
    
    // Apply floating settings before showing
    applyFloatingSettings()
    
    // Show and focus the window
    win.show()
    win.focus()
    
    // Center window on active screen
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const winBounds = win.getBounds()
    const x = Math.round((width - winBounds.width) / 2)
    const y = Math.round((height - winBounds.height) / 2)
    win.setPosition(x, y)
    
    console.log('Window shown and focused')
  }
}

// ===== App Event Handlers =====
app.whenReady().then((): void => {
  console.log('App is ready')
  
  createWindow()

  const shortcut = process.platform === 'darwin' ? 'Command+Shift+V' : 'Ctrl+Shift+V'
  const registered = globalShortcut.register(shortcut, toggleWindow)

  if (!registered) {
    console.error(`Failed to register shortcut: ${shortcut}`)
  } else {
    console.log(`Global shortcut registered: ${shortcut}`)
  }

  // Escape key to hide window
  globalShortcut.register('Escape', () => {
    if (win?.isVisible()) {
      win.hide()
    }
  })
})

app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', (): void => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', (): void => {
  globalShortcut.unregisterAll()
})