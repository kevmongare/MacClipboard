import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getHistory: (): Promise<ClipItem[]> => ipcRenderer.invoke('get-history'),
  copyText: (text: string): Promise<void> => ipcRenderer.invoke('copy-text', text),
  copyImage: (data: string): Promise<void> => ipcRenderer.invoke('copy-image', data),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('clear-history'),
  pasteItem: (item: ClipItem): Promise<void> => ipcRenderer.invoke('paste-item', item),
  onUpdate: (callback: (data: ClipItem[]) => void) =>
    ipcRenderer.on('history-update', (_, data) => callback(data)),
})
