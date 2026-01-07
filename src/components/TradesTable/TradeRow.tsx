import { formatTimeAgo, shortenAddress } from '../../utils/format'
import type { TradeRowProps } from '../../api/types'

export function TradeRow({ trade }: TradeRowProps) {
  const isBuy = trade.type === 'buy'

  return (
    <div className="grid grid-cols-[1fr_1fr_80px_1fr_1fr] border-b border-zinc-800 h-full items-center">
      <div className="px-4 py-3 text-sm text-zinc-400">
        {formatTimeAgo(trade.timestamp)}
      </div>
      <div className="px-4 py-3 text-sm font-mono text-zinc-300">
        {shortenAddress(trade.trader)}
      </div>
      <div className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            isBuy
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {trade.type.toUpperCase()}
        </span>
      </div>
      <div className="px-4 py-3 text-right text-sm text-zinc-300 font-mono">
        {trade.currencyAmount.toFixed(4)}
      </div>
      <div className="px-4 py-3 text-right text-sm text-zinc-300 font-mono">
        ${trade.priceUsd?.toFixed(8) ?? '-'}
      </div>
    </div>
  )
}
