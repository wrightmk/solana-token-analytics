import { formatDistanceToNowStrict, type Locale } from 'date-fns'

const shortLocale = {
  formatDistance: (token: string, count: number) => {
    const units: Record<string, string> = {
      xSeconds: `${count}s`,
      xMinutes: `${count}m`,
      xHours: `${count}h`,
      xDays: `${count}d`,
      xMonths: `${count}mo`,
      xYears: `${count}y`,
    }
    return units[token] || `${count}`
  },
}

export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(decimals)}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`
  }
  return num.toFixed(decimals)
}

export function formatCurrency(num: number): string {
  return `$${formatNumber(num)}`
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatTimeAgo(timestamp: number): string {
  return formatDistanceToNowStrict(timestamp, { locale: shortLocale as Locale })
}
