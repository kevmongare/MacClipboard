import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

console.log('Preload script loading...')

export interface ClipItem {
  id: number
  text?: string
  image?: string
  createdAt: string
}

const api = {
  getHistory: (): Promise<ClipItem[]> => ipcRenderer.invoke('get-history'),
  copyText: (text: string): Promise<void> => ipcRenderer.invoke('copy-text', text),
  copyImage: (data: string): Promise<void> => ipcRenderer.invoke('copy-image', data),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('clear-history'),
  pasteItem: (item: ClipItem): Promise<void> => ipcRenderer.invoke('paste-item', item),
  onUpdate: (callback: (data: ClipItem[]) => void) => {
    const subscription = (_event: IpcRendererEvent, data: ClipItem[]) => callback(data)
    ipcRenderer.on('history-update', subscription)
    
    return () => {
      ipcRenderer.removeListener('history-update', subscription)
    }
  },
}

// Expose the API
try {
  contextBridge.exposeInMainWorld('api', api)
  console.log('✅ API exposed successfully')
} catch (error) {
  console.error('❌ Failed to expose API:', error)
}

console.log('Preload script loaded')