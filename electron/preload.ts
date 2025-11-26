import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  copyText: (text: string) => ipcRenderer.invoke('copy-text', text),
  copyImage: (data: string) => ipcRenderer.invoke('copy-image', data),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  onUpdate: (callback: (data: any) => void) =>
    ipcRenderer.on('history-update', (_, data) => callback(data)),
})
