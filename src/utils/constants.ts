export const API_BASE = '/api'
export const API_KEY = import.meta.env.VITE_API_KEY
export const WS_URL = `${
  window.location.protocol === 'https:' ? 'wss:' : 'ws:'
}//${window.location.host}/ws/v1/rooms`
export const DEFAULT_CURRENCY = 'SOL'
export const BATCH_INTERVAL_MS = 100
export const MAX_CACHED_TX_HASHES = 100
export const TRADES_ROW_HEIGHT = 48
