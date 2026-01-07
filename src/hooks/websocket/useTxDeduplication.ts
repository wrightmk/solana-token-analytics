import { useCallback, useMemo, useRef } from 'react'
import { MAX_CACHED_TX_HASHES } from '../../utils/constants'

export function useTxDeduplication() {
  const recentHashes = useRef<Set<string>>(new Set())

  const isDuplicate = useCallback((txHash: string): boolean => {
    if (recentHashes.current.has(txHash)) {
      return true
    }

    recentHashes.current.add(txHash)

    if (recentHashes.current.size > MAX_CACHED_TX_HASHES) {
      const first = recentHashes.current.values().next().value
      if (first) recentHashes.current.delete(first)
    }

    return false
  }, [])

  const clear = useCallback(() => {
    recentHashes.current.clear()
  }, [])

  return useMemo(
    () => ({
      isDuplicate,
      clear,
    }),
    [isDuplicate, clear]
  )
}
