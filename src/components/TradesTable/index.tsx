import { useRef, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTrades } from '../../hooks/useTrades'
import {
  selectedTokenAtom,
  pendingTradesAtom,
  isAtTopOfTradesAtom,
} from '../../store/atoms'
import { TradeRow } from './TradeRow'
import { DEFAULT_CURRENCY, TRADES_ROW_HEIGHT } from '../../utils/constants'
import type { TradesTableProps } from '../../api/types'

export function TradesTable({
  poolAddresses,
  currencySymbol = DEFAULT_CURRENCY,
}: TradesTableProps) {
  const [tokenAddress] = useAtom(selectedTokenAtom)
  const [pendingTrades, setPendingTrades] = useAtom(pendingTradesAtom)
  const [isAtTop, setIsAtTop] = useAtom(isAtTopOfTradesAtom)
  const parentRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useTrades(tokenAddress, poolAddresses)

  const allTrades = data?.pages.flatMap((page) => page.transactions) ?? []

  const displayTrades = isAtTop ? [...pendingTrades, ...allTrades] : allTrades

  const rowVirtualizer = useVirtualizer({
    count: displayTrades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TRADES_ROW_HEIGHT,
    overscan: 25,
  })

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    setIsAtTop(scrollTop < 50)

    const nearBottom = scrollTop + clientHeight >= scrollHeight - 200
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [setIsAtTop, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    setPendingTrades([])
    setIsAtTop(true)
    parentRef.current?.scrollTo({ top: 0 })
  }, [tokenAddress, setIsAtTop, setPendingTrades])

  useEffect(() => {
    if (isAtTop) setPendingTrades([])
  }, [isAtTop, setPendingTrades])

  const flushPendingTrades = useCallback(() => {
    setPendingTrades([])
    parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPendingTrades])

  if (!tokenAddress) {
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
        </div>
        <div className="p-4 text-center text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 text-center text-red-400">
        Error loading trades: {error.message}
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
        {pendingTrades.length > 0 && !isAtTop && (
          <button
            onClick={flushPendingTrades}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors"
          >
            {pendingTrades.length} new trade
            {pendingTrades.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="max-h-150 overflow-y-auto"
      >
        <div className="sticky top-0 bg-zinc-900 z-10 grid grid-cols-[1fr_1fr_80px_1fr_1fr] text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
          <div className="px-4 py-3">Time</div>
          <div className="px-4 py-3">Trader</div>
          <div className="px-4 py-3">Type</div>
          <div className="px-4 py-3 text-right">{currencySymbol}</div>
          <div className="px-4 py-3 text-right">Price</div>
        </div>

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const trade = displayTrades[virtualRow.index]
            return (
              <div
                key={`${trade.txHash}-${virtualRow.index}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TradeRow trade={trade} />
              </div>
            )
          })}
        </div>

        {isFetchingNextPage && (
          <div className="p-4 text-center text-zinc-500">
            Loading more trades...
          </div>
        )}
      </div>
    </div>
  )
}
