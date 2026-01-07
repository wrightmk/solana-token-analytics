export interface ApiResponse<T> {
  data: T
}

export interface TokenApiResponse {
  name: string
  symbol: string
  description: string
  address: string
  decimals: number
  logoUrl: string
  supply: number
  numHolders: number
  createdAt: string
  pools: PoolApiResponse[]
}

interface CurrencyToken {
  name: string
  symbol: string
  address: string
  logoUrl?: string
}

export interface PoolApiResponse {
  chain: string
  address: string
  dex: string
  tokenPriceUsd: number
  currencyLiquidityUsd: number
  liquidityUsd: number
  fdvUsd: number
  totalTradeVolumeUsd: number
  volume24h: number
  athUsd: number
  athUsdUpdatedAt: string
  currencyToken?: CurrencyToken
}

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  image: string
  decimals: number
  mcap: number
  ath: number
  volume24h: number
  holders: number
  pools: Pool[]
}

export interface Pool {
  poolAddress: string
  dex: string
  liquidity: number
  currencySymbol: string
  currencyLogoUrl?: string
}

export interface TransactionApiResponse {
  transactionHash: string
  walletAddress: string
  type: 'buy' | 'sell'
  amountTokens: number
  tokenUsdPrice: number
  tokenUsdValue: number
  amountCurrency: number
  currencyToken: {
    symbol: string
    address: string
    logoUrl?: string
  }
  poolAddress: string
  dex: string
  createdAt: string
}

export interface Trade {
  txHash: string
  timestamp: number
  trader: string
  type: 'buy' | 'sell'
  currencyAmount: number
  currencySymbol: string
  currencyLogoUrl?: string
  tokenAmount: number
  priceUsd: number
}

export interface PoolMetricsUpdate {
  poolAddress?: string
  mcap?: number
  ath?: number
  volume24h?: number
  holders?: number
  priceUsd?: number
}

export type TransactionFeedUpdate = Trade

export interface FetchTradesParams {
  tokenAddress: string
  poolAddresses?: string[]
  limit?: number
  from?: number
}

export interface TradesPage {
  transactions: Trade[]
  lastTimestamp?: number
  hasMore: boolean
}

export type RecentSearch = { address: string; name: string }

export interface UseTokenWebSocketOptions {
  tokenAddress: string | null
  poolAddress?: string | null
  fallbackCurrency?: string
  fallbackCurrencyLogo?: string
  onMetricsUpdate?: (data: PoolMetricsUpdate) => void
  onTransactionUpdate?: (data: TransactionFeedUpdate) => void
}

export interface MetricsMessageData {
  address?: { pool?: string }
  price?: { usd?: number }
  token?: { supply?: number; numHolders?: number }
  activity?: { '1d'?: { volumeBuyUsd?: number; volumeSellUsd?: number } }
}

export interface MessageContext {
  currentToken: string | null
  currentPool: string | null
  fallbackCurrency: string
  fallbackCurrencyLogo?: string
}

export interface MessageHandlers {
  onMetricsUpdate: (data: PoolMetricsUpdate) => void
  onTransactionUpdate: (data: TransactionFeedUpdate) => void
  isDuplicateTx: (txHash: string) => boolean
}

export interface MetricCardProps {
  label: string
  value: string
}

export interface TradeRowProps {
  trade: Trade
}

export interface TradesTableProps {
  poolAddresses?: string[]
  currencySymbol?: string
}

export interface TokenInfoProps {
  liveMetrics?: PoolMetricsUpdate | null
}

