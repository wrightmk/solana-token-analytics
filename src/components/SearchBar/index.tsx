import { useState, useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { selectedTokenAtom, recentSearchesAtom } from '../../store/atoms'

export function SearchBar() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const setSelectedToken = useSetAtom(selectedTokenAtom)
  const [recentSearches, setRecentSearches] = useAtom(recentSearchesAtom)

  const handleSearch = useCallback(() => {
    const trimmed = input.trim()
    if (trimmed.length === 0) {
      setError('Please enter a token address')
    } else if (trimmed.length < 32) {
      setError('Invalid address')
    } else {
      setError('')
      setSelectedToken(trimmed)
      setInput('')
    }
  }, [input, setSelectedToken])

  const handleInputChange = (value: string) => {
    setInput(value)
    if (error) setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRecentClick = (address: string) => {
    setSelectedToken(address)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter token address..."
          className={`flex-1 px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none font-mono text-sm ${
            error ? 'border-red-500' : 'border-zinc-700 focus:border-blue-500'
          }`}
        />
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Search
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {recentSearches.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Recent Searches
            </span>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches
              .filter((item) => item?.address && item?.name)
              .slice(0, 5)
              .map((item) => (
                <button
                  key={item.address}
                  onClick={() => handleRecentClick(item.address)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm text-zinc-300"
                >
                  {item.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
