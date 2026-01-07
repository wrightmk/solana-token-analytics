import { useCallback, useEffect, useMemo, useRef } from 'react'
import { throttle } from 'lodash-es'
import type { PoolMetricsUpdate } from '../../api/types'
import { BATCH_INTERVAL_MS } from '../../utils/constants'

export function useMetricsBatcher(onFlush: (data: PoolMetricsUpdate) => void) {
  const pendingUpdate = useRef<PoolMetricsUpdate | null>(null)
  const onFlushRef = useRef(onFlush)
  const throttledFlushRef = useRef<ReturnType<typeof throttle> | null>(null)

  useEffect(() => {
    onFlushRef.current = onFlush
  }, [onFlush])

  const getThrottledFlush = useCallback(() => {
    if (!throttledFlushRef.current) {
      throttledFlushRef.current = throttle(
        () => {
          if (pendingUpdate.current && onFlushRef.current) {
            onFlushRef.current(pendingUpdate.current)
            pendingUpdate.current = null
          }
        },
        BATCH_INTERVAL_MS,
        { leading: false, trailing: true }
      )
    }
    return throttledFlushRef.current
  }, [])

  const batchUpdate = useCallback(
    (update: PoolMetricsUpdate) => {
      pendingUpdate.current = {
        ...pendingUpdate.current,
        ...update,
      }
      getThrottledFlush()()
    },
    [getThrottledFlush]
  )

  const flush = useCallback(() => {
    if (pendingUpdate.current && onFlushRef.current) {
      onFlushRef.current(pendingUpdate.current)
      pendingUpdate.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    getThrottledFlush().cancel()
  }, [getThrottledFlush])

  const reset = useCallback(() => {
    pendingUpdate.current = null
    getThrottledFlush().cancel()
  }, [getThrottledFlush])

  useEffect(() => {
    return () => {
      getThrottledFlush().cancel()
      flush()
    }
  }, [getThrottledFlush, flush])

  return useMemo(
    () => ({
      batchUpdate,
      flush,
      cancel,
      reset,
    }),
    [batchUpdate, flush, cancel, reset]
  )
}
