import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import type { UseTokenWebSocketOptions } from '../api/types'
import { DEFAULT_CURRENCY, WS_URL } from '../utils/constants'
import { useMetricsBatcher } from './websocket/useMetricsBatcher'
import { useTxDeduplication } from './websocket/useTxDeduplication'
import { processMessage } from './websocket/messageHandlers'

function buildChannelMessage(
  type: 'subscribe' | 'unsubscribe',
  channels: string[]
) {
  return {
    type,
    channels,
    accessToken: '',
    _metadata: { initiatedAt: Date.now() },
  }
}

export function useTokenWebSocket({
  tokenAddress,
  poolAddress,
  fallbackCurrency = DEFAULT_CURRENCY,
  fallbackCurrencyLogo,
  onMetricsUpdate,
  onTransactionUpdate,
}: UseTokenWebSocketOptions) {
  const intendedChannels = useRef<Set<string>>(new Set())

  const stateRef = useRef({
    onMetricsUpdate,
    onTransactionUpdate,
    currentToken: tokenAddress,
    currentPool: poolAddress,
    sendJsonMessage: null as ((msg: unknown) => void) | null,
    txDeduplication: null as ReturnType<typeof useTxDeduplication> | null,
    metricsBatcher: null as ReturnType<typeof useMetricsBatcher> | null,
  })

  const txDeduplication = useTxDeduplication()
  const metricsBatcher = useMetricsBatcher((data) => {
    stateRef.current.onMetricsUpdate?.(data)
  })

  useLayoutEffect(() => {
    stateRef.current.onMetricsUpdate = onMetricsUpdate
    stateRef.current.onTransactionUpdate = onTransactionUpdate
    stateRef.current.currentToken = tokenAddress
    stateRef.current.currentPool = poolAddress
    stateRef.current.txDeduplication = txDeduplication
    stateRef.current.metricsBatcher = metricsBatcher
  })

  const wsUrl = tokenAddress ? WS_URL : null

  const handleOpenBase = useCallback(() => {
    if (intendedChannels.current.size > 0 && stateRef.current.sendJsonMessage) {
      stateRef.current.sendJsonMessage(
        buildChannelMessage('subscribe', [...intendedChannels.current])
      )
    }
  }, [])

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onOpen: handleOpenBase,
  })

  useLayoutEffect(() => {
    stateRef.current.sendJsonMessage = sendJsonMessage
  }, [sendJsonMessage])

  useEffect(() => {
    if (!tokenAddress || !poolAddress) {
      return
    }

    stateRef.current.txDeduplication?.clear()
    stateRef.current.metricsBatcher?.reset()

    const channels = [
      `pool:metrics:${poolAddress}`,
      `token:transactions:feed:${tokenAddress}`,
    ]

    channels.forEach((ch) => intendedChannels.current.add(ch))
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage(buildChannelMessage('subscribe', channels))
    }

    return () => {
      channels.forEach((ch) => intendedChannels.current.delete(ch))
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage(buildChannelMessage('unsubscribe', channels))
      }
    }
  }, [tokenAddress, poolAddress, sendJsonMessage, readyState])

  useEffect(() => {
    if (!lastJsonMessage) return

    try {
      processMessage(
        lastJsonMessage,
        {
          currentToken: stateRef.current.currentToken,
          currentPool: stateRef.current.currentPool ?? null,
          fallbackCurrency,
          fallbackCurrencyLogo,
        },
        {
          onMetricsUpdate: (data) =>
            stateRef.current.metricsBatcher?.batchUpdate(data),
          onTransactionUpdate: (data) =>
            stateRef.current.onTransactionUpdate?.(data),
          isDuplicateTx: (hash) =>
            stateRef.current.txDeduplication?.isDuplicate(hash) ?? false,
        }
      )
    } catch (error) {
      console.warn('Failed to process WebSocket message:', error)
    }
  }, [lastJsonMessage, fallbackCurrency, fallbackCurrencyLogo])
}
