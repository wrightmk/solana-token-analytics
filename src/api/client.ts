import type {
  ApiResponse,
  TokenApiResponse,
  TransactionApiResponse,
  TokenInfo,
  Trade,
  FetchTradesParams,
} from './types'
import { API_BASE, API_KEY, DEFAULT_CURRENCY } from '../utils/constants'

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
}

function normalizeTokenInfo(data: TokenApiResponse): TokenInfo {
  const primaryPool = data.pools?.[0]

  return {
    address: data.address,
    symbol: data.symbol,
    name: data.name,
    image: data.logoUrl,
    decimals: data.decimals,
    mcap: primaryPool?.fdvUsd ?? 0,
    ath: (primaryPool?.athUsd ?? 0) * data.supply,
    volume24h: primaryPool?.volume24h ?? 0,
    holders: data.numHolders,
    pools:
      data.pools?.map((p) => ({
        poolAddress: p.address,
        dex: p.dex,
        liquidity: p.liquidityUsd,
        currencySymbol: p.currencyToken?.symbol ?? DEFAULT_CURRENCY,
        currencyLogoUrl: p.currencyToken?.logoUrl,
      })) ?? [],
  }
}

function normalizeTrade(tx: TransactionApiResponse): Trade {
  return {
    txHash: tx.transactionHash,
    timestamp: new Date(tx.createdAt).getTime(),
    trader: tx.walletAddress,
    type: tx.type,
    currencyAmount: tx.amountCurrency,
    currencySymbol: tx.currencyToken?.symbol ?? DEFAULT_CURRENCY,
    currencyLogoUrl: tx.currencyToken?.logoUrl,
    tokenAmount: tx.amountTokens,
    priceUsd: tx.tokenUsdPrice,
  }
}

export async function fetchTokenInfo(tokenAddress: string): Promise<TokenInfo> {
  const response = await fetch(
    `${API_BASE}/tokens/${tokenAddress}?chain=solana`,
    { headers }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch token info: ${response.statusText}`)
  }
  const json: ApiResponse<TokenApiResponse> = await response.json()
  return normalizeTokenInfo(json.data)
}

export async function fetchTrades({
  tokenAddress,
  poolAddresses,
  limit = 500,
  from,
}: FetchTradesParams): Promise<{
  transactions: Trade[]
  lastTimestamp?: number
  hasMore: boolean
}> {
  const payload: Record<string, unknown> = {
    chain: 'solana',
    limit,
    order: 'desc',
    tokenAddress,
    type: ['buy', 'sell'],
  }

  if (from) {
    payload.from = from
  }

  if (poolAddresses && poolAddresses.length > 0) {
    payload.poolAddress = poolAddresses
  }

  const response = await fetch(`${API_BASE}/tokens/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`)
  }

  const json = await response.json()
  const data: TransactionApiResponse[] = json.data || []
  const transactions = data.map(normalizeTrade)

  const lastTrade = transactions.at(-1)

  return {
    transactions,
    lastTimestamp: lastTrade?.timestamp,
    hasMore: data.length === limit,
  }
}
