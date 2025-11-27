/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface ClipItem {
  id: number
  text?: string
  image?: string
  createdAt: string
}

declare global {
  interface Window {
    api: {
      ping?: () => string
      getHistory: () => Promise<ClipItem[]>
      copyText: (text: string) => Promise<void>
      copyImage: (data: string) => Promise<void>
      clearHistory: () => Promise<void>
      pasteItem: (item: ClipItem) => Promise<void>
      onUpdate: (callback: (data: ClipItem[]) => void) => void
    }
  }
}

export {}