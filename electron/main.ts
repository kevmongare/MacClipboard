import { app, BrowserWindow, ipcMain, clipboard, nativeImage, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

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

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 600,
    show: false,               // start hidden
    alwaysOnTop: true,         // float above other apps
    frame: false,              // remove window frame
    skipTaskbar: true,         // hide from taskbar
    transparent: true,         // optional: makes background semi-transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'), // TS preload
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  const indexHtml = path.join(__dirname, '../dist/index.html')

  if (devServerUrl) {
    win.loadURL(devServerUrl)
  } else if (fs.existsSync(indexHtml)) {
    win.loadFile(indexHtml)
  } else {
    console.error('No React app found! Start dev server or build the app.')
  }
}

// ===== IPC Handlers =====
ipcMain.handle('get-history', () => history)

ipcMain.handle('copy-text', (_, text: string) => {
  clipboard.writeText(text)
  lastText = text
  return true
})

ipcMain.handle('copy-image', (_, base64Data: string) => {
  clipboard.writeImage(nativeImage.createFromDataURL(base64Data))
})

ipcMain.handle('clear-history', () => {
  history = []
  win?.webContents.send('history-update', history)
})

ipcMain.handle('paste-item', (_, item: ClipItem) => {
  if (item.text) clipboard.writeText(item.text)
  if (item.image) clipboard.writeImage(nativeImage.createFromDataURL(item.image))
  win?.hide() // auto-hide after paste
})

// ===== Clipboard Watcher =====
setInterval(() => {
  if (!win) return

  const currentText = clipboard.readText()
  if (currentText && currentText !== lastText) {
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
  const imageData = image.toDataURL()
  if (imageData && imageData !== lastImageData) {
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
}, 1000)

// ===== Global Shortcut =====
app.whenReady().then(() => {
  createWindow()

  const shortcut = process.platform === 'darwin' ? 'Command+Shift+V' : 'Ctrl+Shift+V'
  const registered = globalShortcut.register(shortcut, () => {
    if (!win) return
    if (win.isVisible()) win.hide()
    else {
      win.show()
      win.focus()
    }
  })

  if (!registered) console.error(`Failed to register shortcut: ${shortcut}`)
})

// Unregister all shortcuts on exit
app.on('will-quit', () => globalShortcut.unregisterAll())

// ===== App Events =====
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
