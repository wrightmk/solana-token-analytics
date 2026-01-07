import { useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useTokenInfo } from '../../hooks/useTokenInfo'
import { selectedTokenAtom, recentSearchesAtom } from '../../store/atoms'
import { formatCurrency, shortenAddress } from '../../utils/format'
import type { TokenInfoProps } from '../../api/types'
import { MetricCard } from './MetricCard'

export function TokenInfo({ liveMetrics }: TokenInfoProps) {
  const [tokenAddress] = useAtom(selectedTokenAtom)
  const setRecentSearches = useSetAtom(recentSearchesAtom)
  const { data, isLoading, error } = useTokenInfo(tokenAddress)

  useEffect(() => {
    if (data) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.address !== data.address)
        return [{ address: data.address, name: data.name }, ...filtered].slice(0, 10)
      })
    }
  }, [data, setRecentSearches])

  if (!tokenAddress) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Enter a token address to get started
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        Error loading token: {error.message}
      </div>
    )
  }

  if (!data) return null

  const mcap = liveMetrics?.mcap ?? data.mcap
  const ath = liveMetrics?.ath ?? data.ath
  const volume24h = liveMetrics?.volume24h ?? data.volume24h
  const holders = liveMetrics?.holders ?? data.holders

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center gap-4 mb-6">
        {data.image && (
          <img
            src={data.image}
            alt={data.symbol}
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">
            {data.name}{' '}
            <span className="text-zinc-400 font-normal">${data.symbol}</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono text-zinc-500">
              {shortenAddress(data.address, 6)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(data.address)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Market Cap" value={formatCurrency(mcap)} />
        <MetricCard label="ATH" value={formatCurrency(ath)} />
        <MetricCard label="24h Volume" value={formatCurrency(volume24h)} />
        <MetricCard label="Holders" value={String(holders)} />
      </div>
    </div>
  )
}
