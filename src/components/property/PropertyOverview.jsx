import MetricCard from '../shared/MetricCard'
import SectionHeader from '../shared/SectionHeader'
import { formatCurrency, formatPercent } from '../../utils/format'
import { calcMonthlyMortgage, calcAnnualCosts, calcSection24Tax, calcAfterTaxMonthly } from '../../utils/finance'

export default function PropertyOverview({ property, onNavigate }) {
  const { meta, mortgage, rental, costs, tax } = property
  const monthlyMortgage = calcMonthlyMortgage(property)
  const { annualRent, totalCosts } = calcAnnualCosts(property)
  const mortgageInterest = mortgage.type === 'interest-only'
    ? monthlyMortgage * 12
    : mortgage.balance * (mortgage.currentRate / 100)
  const s24 = calcSection24Tax(annualRent, totalCosts, mortgageInterest, tax.taxRate, tax.personalAllowance, tax.claimsPersonalAllowance)
  const annualNet = annualRent - totalCosts - (monthlyMortgage * 12)
  const monthlyNet = calcAfterTaxMonthly(annualNet, s24.netTax)
  const equity = meta.currentEstimatedValue - mortgage.balance
  const grossYield = (annualRent / meta.currentEstimatedValue) * 100

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Property Overview"
        subtitle={`${meta.address} | ${meta.type} | ${meta.bedrooms} bed | ${meta.sqm} sqm`}
        action={
          <button
            onClick={() => onNavigate('config')}
            className="text-xs text-accent-blue hover:text-accent-blue/80 border border-accent-blue/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            Edit Configuration
          </button>
        }
      />

      {/* Property details */}
      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Purchase Price</p>
            <p className="text-base sm:text-lg font-mono text-text-primary">{formatCurrency(meta.purchasePrice)}</p>
            <p className="text-xs text-text-secondary">{meta.purchaseDate}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Value</p>
            <p className="text-base sm:text-lg font-mono text-text-primary">{formatCurrency(meta.currentEstimatedValue)}</p>
            <p className="text-xs text-accent-green">+{formatCurrency(meta.currentEstimatedValue - meta.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Mortgage Balance</p>
            <p className="text-base sm:text-lg font-mono text-text-primary">{formatCurrency(mortgage.balance)}</p>
            <p className="text-xs text-text-secondary">{formatPercent(mortgage.currentRate)} {mortgage.type === 'interest-only' ? 'I/O' : 'Repayment'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Rent</p>
            <p className="text-base sm:text-lg font-mono text-text-primary">{formatCurrency(rental.monthlyRent)}</p>
            <p className="text-xs text-text-secondary">{rental.voidMonthsPerYear} void month/yr</p>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Monthly P&L (after tax)"
          value={formatCurrency(monthlyNet)}
          subValue={`${formatCurrency(annualNet)} /yr pre-tax`}
          positive={monthlyNet >= 0}
        />
        <MetricCard
          label="Annual Net (after tax)"
          value={formatCurrency(annualNet - s24.netTax)}
          subValue={`Tax: ${formatCurrency(s24.netTax)}`}
          positive={annualNet - s24.netTax >= 0}
        />
        <MetricCard
          label="Estimated Equity"
          value={formatCurrency(equity)}
          subValue={`LTV: ${formatPercent((mortgage.balance / meta.currentEstimatedValue) * 100)}`}
          positive={true}
        />
        <MetricCard
          label="Gross Yield"
          value={formatPercent(grossYield)}
          subValue={`${formatCurrency(annualRent)} gross rent`}
          positive={grossYield >= 5}
        />
      </div>

      {/* Status alerts */}
      {!tax.nrlsRegistered && (
        <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-accent-red text-lg">!</span>
          <div>
            <p className="text-sm font-medium text-accent-red">NRLS Not Registered</p>
            <p className="text-xs text-text-secondary mt-1">
              As a non-resident landlord, you should register with HMRC's Non-Resident Landlord Scheme.
              Without registration, letting agents must deduct basic rate tax from rental income.
            </p>
          </div>
        </div>
      )}

      {meta.epcRating >= 'E' && (
        <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-accent-amber text-lg">!</span>
          <div>
            <p className="text-sm font-medium text-accent-amber">EPC Rating: {meta.epcRating}</p>
            <p className="text-xs text-text-secondary mt-1">
              Minimum EPC rating of E is required for new tenancies. Rating C may be required by 2028.
              Budget {formatCurrency(costs.epcUpgradeCost)} for upgrade in year {costs.epcUpgradeYear}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
