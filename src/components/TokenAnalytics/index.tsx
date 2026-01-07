import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { SearchBar } from '../SearchBar'
import { TokenInfo } from '../TokenInfo'
import { TradesTable } from '../TradesTable'
import { useTokenInfo } from '../../hooks/useTokenInfo'
import { useTokenWebSocket } from '../../hooks/useTokenWebSocket'
import {
  selectedTokenAtom,
  liveMetricsAtom,
  pendingTradesAtom,
  isAtTopOfTradesAtom,
  primaryCurrencyAtom,
  primaryCurrencyLogoAtom,
} from '../../store/atoms'
import type {
  PoolMetricsUpdate,
  TransactionFeedUpdate,
  Trade,
} from '../../api/types'
import { DEFAULT_CURRENCY } from '../../utils/constants'

export function TokenAnalytics() {
  const queryClient = useQueryClient()
  const [tokenAddress] = useAtom(selectedTokenAtom)
  const [liveMetrics, setLiveMetrics] = useAtom(liveMetricsAtom)
  const setPendingTrades = useSetAtom(pendingTradesAtom)
  const [isAtTop] = useAtom(isAtTopOfTradesAtom)
  const [primaryCurrency, setPrimaryCurrency] = useAtom(primaryCurrencyAtom)
  const [primaryCurrencyLogo, setPrimaryCurrencyLogo] = useAtom(
    primaryCurrencyLogoAtom
  )

  const {
    data: tokenData,
    error: tokenError,
    isLoading: tokenLoading,
  } = useTokenInfo(tokenAddress)
  const primaryPool = tokenData?.pools?.[0]

  useEffect(() => {
    setLiveMetrics(null)
  }, [tokenAddress, setLiveMetrics])

  useEffect(() => {
    const currency = primaryPool?.currencySymbol ?? DEFAULT_CURRENCY
    const logo = primaryPool?.currencyLogoUrl
    setPrimaryCurrency(currency)
    setPrimaryCurrencyLogo(logo)
  }, [primaryPool, setPrimaryCurrency, setPrimaryCurrencyLogo])

  const handleMetricsUpdate = useCallback(
    (data: PoolMetricsUpdate) => {
      setLiveMetrics((prev) => {
        const currentAth = prev?.ath ?? tokenData?.ath ?? 0
        const incomingMcap = data.mcap
        const newAth =
          incomingMcap !== undefined && incomingMcap > currentAth
            ? incomingMcap
            : currentAth

        return {
          ...prev,
          ...data,
          ath: newAth,
        }
      })
    },
    [setLiveMetrics, tokenData?.ath]
  )

  const handleTransactionUpdate = useCallback(
    (data: TransactionFeedUpdate) => {
      const newTrade: Trade = {
        txHash: data.txHash,
        timestamp: data.timestamp,
        trader: data.trader,
        type: data.type,
        currencyAmount: data.currencyAmount,
        currencySymbol: data.currencySymbol,
        currencyLogoUrl: data.currencyLogoUrl,
        tokenAmount: data.tokenAmount,
        priceUsd: data.priceUsd,
      }

      if (isAtTop) {
        queryClient.setQueryData(
          ['trades', tokenAddress, tokenData?.pools?.map((p) => p.poolAddress)],
          (old: { pages: { transactions: Trade[] }[] } | undefined) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page, idx) =>
                idx === 0
                  ? { ...page, transactions: [newTrade, ...page.transactions] }
                  : page
              ),
            }
          }
        )
      } else {
        setPendingTrades((prev) => [newTrade, ...prev].slice(0, 500))
      }
    },
    [queryClient, tokenAddress, tokenData, isAtTop, setPendingTrades]
  )

  useTokenWebSocket({
    tokenAddress,
    poolAddress: primaryPool?.poolAddress,
    fallbackCurrency: primaryCurrency,
    fallbackCurrencyLogo: primaryCurrencyLogo,
    onMetricsUpdate: handleMetricsUpdate,
    onTransactionUpdate: handleTransactionUpdate,
  })

  const poolAddresses = tokenData?.pools?.map((p) => p.poolAddress)

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white mb-4">Token Analytics</h1>
          <SearchBar />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <TokenInfo liveMetrics={liveMetrics} />
        {tokenData && !tokenError && !tokenLoading && (
          <TradesTable
            poolAddresses={poolAddresses}
            currencySymbol={primaryCurrency}
          />
        )}
      </main>
    </div>
  )
}
