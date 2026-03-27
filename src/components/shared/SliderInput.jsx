export default function SliderInput({ label, value, onChange, min = 0, max = 100, step = 1, prefix = '', suffix = '', decimals = 0 }) {
  const displayValue = typeof value === 'number' ? value : 0
  const percent = max !== min ? ((displayValue - min) / (max - min)) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-text-secondary">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-text-muted">{prefix}</span>}
          <input
            type="number"
            value={displayValue}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step={step}
            min={min}
            max={max}
            className="w-20 bg-bg-elevated border border-border rounded px-2 py-1 text-right text-sm text-text-primary font-mono focus:outline-none focus:border-accent-blue"
          />
          {suffix && <span className="text-sm text-text-muted">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        value={displayValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{
          background: `linear-gradient(to right, #3ea8ff ${percent}%, #2a2d3a ${percent}%)`,
        }}
      />
    </div>
  )
}
