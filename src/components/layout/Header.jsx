import SaveStatus from '../shared/SaveStatus'

function Badge({ label, value, variant = 'default' }) {
  const variants = {
    default: 'bg-bg-elevated text-text-secondary',
    warning: 'bg-accent-amber/10 text-accent-amber',
    info: 'bg-accent-blue/10 text-accent-blue',
    success: 'bg-accent-green/10 text-accent-green',
    danger: 'bg-accent-red/10 text-accent-red',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium ${variants[variant]}`}>
      <span className="text-text-muted hidden sm:inline">{label}</span>
      {value}
    </span>
  )
}

export default function Header({ property, saveStatus }) {
  const { meta, mortgage, tax } = property
  const ltv = ((mortgage.balance / meta.currentEstimatedValue) * 100).toFixed(1)
  const ltvVariant = ltv <= 60 ? 'success' : ltv <= 75 ? 'warning' : 'danger'

  return (
    <header className="min-h-[3.5rem] bg-bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 py-2 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 pl-10 lg:pl-0">
        <h2 className="text-sm sm:text-base font-medium text-text-primary truncate">{meta.name}</h2>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Badge label="EPC" value={meta.epcRating} variant={meta.epcRating >= 'D' ? 'warning' : 'success'} />
          <Badge label="LTV" value={`${ltv}%`} variant={ltvVariant} />
          <Badge label="" value={mortgage.type === 'interest-only' ? 'I/O' : 'Repayment'} variant="info" />
          {!tax.nrlsRegistered && (
            <Badge label="" value="NRLS" variant="danger" />
          )}
        </div>
      </div>
      <SaveStatus status={saveStatus} />
    </header>
  )
}
