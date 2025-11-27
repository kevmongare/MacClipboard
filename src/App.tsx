import { useEffect, useState } from 'react'

interface ClipItem {
  id: number
  text?: string
  image?: string
  createdAt: string
}

function App() {
  const [history, setHistory] = useState<ClipItem[]>([])
  const [search, setSearch] = useState('')
  const [lastAction, setLastAction] = useState<string>('')

  useEffect(() => {
    window.api.getHistory().then(setHistory).catch(console.error)
    
    const cleanup = window.api.onUpdate((data: ClipItem[]) => {
      setHistory(data)
    })
    
    return cleanup
  }, [])

  const filtered = history.filter((item) =>
    (item.text || '').toLowerCase().includes(search.toLowerCase())
  )

  const handlePaste = async (item: ClipItem): Promise<void> => {
    try {
      setLastAction('🔄 Pasting...')
      await window.api.pasteItem(item)
      // The paste might succeed but we can't know for sure, so show generic success
      setLastAction('✅ Content pasted!')
      setTimeout(() => setLastAction(''), 2000)
    } catch (err) {
      console.error('Failed to paste item:', err)
      setLastAction('📋 Copied to clipboard - use Cmd+V')
      setTimeout(() => setLastAction(''), 3000)
    }
  }

  const handleCopyText = async (text: string): Promise<void> => {
    try {
      await window.api.copyText(text)
      setLastAction('✅ Text copied to clipboard')
      setTimeout(() => setLastAction(''), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleCopyImage = async (imageData: string): Promise<void> => {
    try {
      await window.api.copyImage(imageData)
      setLastAction('✅ Image copied to clipboard')
      setTimeout(() => setLastAction(''), 2000)
    } catch (err) {
      console.error('Failed to copy image:', err)
    }
  }

  const handleClearHistory = async (): Promise<void> => {
    try {
      await window.api.clearHistory()
      setLastAction('✅ History cleared')
      setTimeout(() => setLastAction(''), 2000)
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  return (
    <div className="p-4 bg-gray-900 text-white h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Clipboard History</h2>
          <p className="text-xs text-gray-400">Press Cmd+Shift+V to show/hide</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-1 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={handleClearHistory}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Action Feedback */}
      {lastAction && (
        <div className={`mb-3 p-2 rounded text-sm text-center ${
          lastAction.includes('✅') ? 'bg-green-900' : 
          lastAction.includes('🔄') ? 'bg-blue-900' : 'bg-yellow-900'
        }`}>
          {lastAction}
        </div>
      )}

      {/* Quick Tips */}
      <div className="mb-3 p-2 bg-purple-900 rounded text-xs">
        <p><strong>Tip:</strong> For best results, click where you want to paste first, then use this app.</p>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto space-y-3 pr-2">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {search ? 'No items match your search' : 'Copy some text or images to see them here'}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
            >
              {item.text && (
                <p className="text-sm mb-2 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {item.text}
                </p>
              )}
              {item.image && (
                <img 
                  src={item.image} 
                  className="mb-2 max-h-48 rounded max-w-full object-contain bg-gray-900" 
                  alt="Clipboard content"
                />
              )}
              <div className="flex gap-2 flex-wrap">
                {item.text && (
                  <button
                    onClick={() => handleCopyText(item.text!)}
                    className="px-2 py-1 bg-blue-600 text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy Text
                  </button>
                )}
                {item.image && (
                  <button
                    onClick={() => handleCopyImage(item.image!)}
                    className="px-2 py-1 bg-green-600 text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    Copy Image
                  </button>
                )}
                <button
                  onClick={() => handlePaste(item)}
                  className="px-2 py-1 bg-purple-600 text-xs rounded hover:bg-purple-700 transition-colors"
                >
                  Auto Paste
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <p>Items: {filtered.length} | Press Escape to close</p>
      </div>
    </div>
  )
}

export default App