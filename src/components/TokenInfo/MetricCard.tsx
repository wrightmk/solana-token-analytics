import type { MetricCardProps } from '../../api/types'

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  )
}
