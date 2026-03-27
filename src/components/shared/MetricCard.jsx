export default function MetricCard({ label, value, subValue, positive, className = '' }) {
  const colorClass = positive === true
    ? 'text-accent-green'
    : positive === false
      ? 'text-accent-red'
      : 'text-text-primary'

  return (
    <div className={`bg-bg-surface border border-border rounded-xl p-3 sm:p-5 ${className}`}>
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1 sm:mb-2">{label}</p>
      <p className={`text-lg sm:text-2xl font-mono font-medium ${colorClass}`}>{value}</p>
      {subValue && (
        <p className="text-xs text-text-secondary mt-1">{subValue}</p>
      )}
    </div>
  )
}
