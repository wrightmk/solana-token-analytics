import type {
  PoolMetricsUpdate,
  MetricsMessageData,
  MessageContext,
  MessageHandlers,
} from '../../api/types'

export function processMessage(
  message: unknown,
  ctx: MessageContext,
  handlers: MessageHandlers
): void {
  const msg = message as { type?: string; data?: Record<string, unknown> }

  if (msg.type === 'feed-transaction') {
    const tx = msg.data?.tokenInteraction as Record<string, unknown> | undefined
    if (!tx) return

    const txTokenAddress = tx.tokenAddress as string | undefined
    if (txTokenAddress && txTokenAddress !== ctx.currentToken) return

    if (tx.interactionType !== 'buy' && tx.interactionType !== 'sell') return

    const txHash = tx.txHash as string
    if (handlers.isDuplicateTx(txHash)) return

    const currencyToken = tx.currencyToken as
      | { symbol?: string; logoUrl?: string }
      | undefined

    handlers.onTransactionUpdate({
      txHash,
      timestamp: (tx.timestamp as number) ?? Date.now(),
      trader: tx.walletAddress as string,
      type: tx.interactionType as 'buy' | 'sell',
      currencyAmount: (tx.amountCurrency as number) ?? 0,
      currencySymbol: currencyToken?.symbol ?? ctx.fallbackCurrency,
      currencyLogoUrl: currencyToken?.logoUrl ?? ctx.fallbackCurrencyLogo,
      tokenAmount: (tx.amountTokens as number) ?? 0,
      priceUsd: (tx.tokenUsdPrice as number) ?? 0,
    })
    return
  }

  if (msg.type === 'metrics') {
    const metricsData = msg.data as MetricsMessageData

    if (
      metricsData?.address?.pool &&
      metricsData.address.pool !== ctx.currentPool
    ) {
      return
    }

    const priceUsd = metricsData?.price?.usd
    const supply = metricsData?.token?.supply
    const holders = metricsData?.token?.numHolders
    const dayActivity = metricsData?.activity?.['1d']

    const updates: PoolMetricsUpdate = {}

    if (priceUsd !== undefined && supply !== undefined) {
      updates.mcap = priceUsd * supply
    }
    if (priceUsd !== undefined) {
      updates.priceUsd = priceUsd
    }
    if (holders !== undefined) {
      updates.holders = holders
    }
    if (dayActivity) {
      updates.volume24h =
        (dayActivity.volumeBuyUsd ?? 0) + (dayActivity.volumeSellUsd ?? 0)
    }

    if (Object.keys(updates).length > 0) {
      handlers.onMetricsUpdate(updates)
    }
  }
}
