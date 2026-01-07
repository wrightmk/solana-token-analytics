import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Trade, PoolMetricsUpdate, RecentSearch } from '../api/types'
import { DEFAULT_CURRENCY } from '../utils/constants'

export const selectedTokenAtom = atom<string | null>(null)

export const recentSearchesAtom = atomWithStorage<RecentSearch[]>(
  'token-recent-searches',
  []
)

export const liveMetricsAtom = atom<PoolMetricsUpdate | null>(null)

export const pendingTradesAtom = atom<Trade[]>([])

export const isAtTopOfTradesAtom = atom<boolean>(true)

export const primaryCurrencyAtom = atom<string>(DEFAULT_CURRENCY)

export const primaryCurrencyLogoAtom = atom<string | undefined>(undefined)
