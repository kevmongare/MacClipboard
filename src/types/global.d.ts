export {}

declare global {
  interface ClipItem {
    id: number
    text?: string
    image?: string
    createdAt: string
  }

  interface Window {
    api: {
      getHistory: () => Promise<ClipItem[]>
      onUpdate: (callback: (data: ClipItem[]) => void) => void
      clearHistory: () => Promise<void>
      copyText: (text: string) => Promise<void>
      copyImage: (data: string) => Promise<void>
      pasteItem: (item: ClipItem) => Promise<void>
    }
  }
}
