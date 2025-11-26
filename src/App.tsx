import { useEffect, useState } from 'react'

function App() {
  const [history, setHistory] = useState<ClipItem[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.api.getHistory().then(setHistory)
    window.api.onUpdate(setHistory)
  }, [])

  const filtered = history.filter((item) =>
    (item.text || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 bg-slate-900 text-slate-100 h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Clipboard History</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-1 rounded bg-slate-700 border border-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => window.api.clearHistory()}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3 overflow-auto h-[80vh] pr-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800 p-3 rounded-lg hover:bg-slate-700"
          >
            {item.text && <p className="text-sm mb-2">{item.text}</p>}
            {item.image && (
              <img src={item.image} className="mb-2 max-h-48 rounded" />
            )}
            <div className="flex gap-2">
              {item.text && (
                <button
                  onClick={() => window.api.copyText(item.text!)}
                  className="px-2 py-1 bg-blue-600 text-xs rounded hover:bg-blue-700"
                >
                  Copy Text
                </button>
              )}
              {item.image && (
                <button
                  onClick={() => window.api.copyImage(item.image!)}
                  className="px-2 py-1 bg-green-600 text-xs rounded hover:bg-green-700"
                >
                  Copy Image
                </button>
              )}
              <button
                onClick={() => window.api.pasteItem(item)}
                className="px-2 py-1 bg-purple-600 text-xs rounded hover:bg-purple-700"
              >
                Paste
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
