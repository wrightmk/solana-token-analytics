import { useRef, useEffect, useCallback, useMemo } from 'react'
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
import type { Trade, TradesTableProps } from '../../api/types'
import { useQueryClient } from '@tanstack/react-query'

function dedupe(trades: Trade[], existing?: Set<string>): Trade[] {
  const seen = existing ?? new Set<string>()
  return trades.filter((t) => {
    if (seen.has(t.txHash)) return false
    seen.add(t.txHash)
    return true
  })
}

export function TradesTable({
  poolAddresses,
  currencySymbol = DEFAULT_CURRENCY,
}: TradesTableProps) {
  const [tokenAddress] = useAtom(selectedTokenAtom)
  const [pendingTrades, setPendingTrades] = useAtom(pendingTradesAtom)
  const queryClient = useQueryClient()

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

  const allTrades = useMemo(
    () => dedupe(data?.pages.flatMap((page) => page.transactions) ?? []),
    [data?.pages]
  )

  const getItemKey = useCallback(
    (index: number) => allTrades[index]?.txHash ?? index,
    [allTrades]
  )

  const rowVirtualizer = useVirtualizer({
    count: allTrades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TRADES_ROW_HEIGHT,
    overscan: 25,
    getItemKey,
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

  const flushPendingTrades = useCallback(
    (scrollToTop: boolean) => {
      queryClient.setQueryData(
        ['trades', tokenAddress, poolAddresses],
        (old: { pages: { transactions: Trade[] }[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page, idx) =>
              idx === 0
                ? {
                    ...page,
                    transactions: [...pendingTrades, ...page.transactions],
                  }
                : page
            ),
          }
        }
      )

      setPendingTrades([])
      if (scrollToTop) {
        parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [pendingTrades, poolAddresses, queryClient, setPendingTrades, tokenAddress]
  )

  useEffect(() => {
    setPendingTrades([])
    setIsAtTop(true)
    parentRef.current?.scrollTo({ top: 0 })
  }, [tokenAddress, setIsAtTop, setPendingTrades])

  useEffect(() => {
    if (isAtTop) {
      flushPendingTrades(false)
    }
  }, [isAtTop, flushPendingTrades])

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
            onClick={() => flushPendingTrades(true)}
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
            const trade = allTrades[virtualRow.index]
            return (
              <div
                key={virtualRow.key}
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
