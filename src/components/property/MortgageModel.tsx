import SectionHeader from '../shared/SectionHeader'
import MetricCard from '../shared/MetricCard'
import { formatCurrency, formatPercent } from '../../utils/format'
import { calcMonthlyMortgage, calcLTV, calcFutureValue, calcNetEquity, calcRepaymentVehiclePMT } from '../../utils/finance'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

function getLTVColor(ltv) {
  if (ltv <= 60) return '#34d399'
  if (ltv <= 65) return '#f43f5e'
  if (ltv <= 75) return '#fbbf24'
  return '#fb7185'
}

export default function MortgageModel({ property }) {
  const { mortgage, meta, projections } = property
  const monthlyPayment = calcMonthlyMortgage(property)
  const currentLTV = (mortgage.balance / meta.currentEstimatedValue) * 100

  const ltvData = [0, 5, 10, 15, 20].map((year) => {
    const ltv = calcLTV(mortgage.balance, meta.currentEstimatedValue, projections.houseGrowthRate, year)
    return { year: `Yr ${year}`, ltv: parseFloat(ltv.toFixed(1)), fill: getLTVColor(ltv) }
  })

  const sellNowEquity = calcNetEquity(
    meta.currentEstimatedValue, mortgage.balance, meta.purchasePrice,
    projections.cgtRate, 1.5, 2000, 3000
  )

  const futureValue20 = calcFutureValue(meta.currentEstimatedValue, projections.houseGrowthRate, 20)
  const sellYear20Equity = calcNetEquity(
    futureValue20, mortgage.balance, meta.purchasePrice,
    projections.cgtRate, 1.5, 2000, 3000
  )

  const repaymentPMT = calcRepaymentVehiclePMT(mortgage.balance, 5, projections.mortgageClearYear)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-stone-700 border border-stone-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-stone-100 font-mono">{formatPercent(payload[0].value)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader title="Mortgage Model" subtitle="LTV trajectory, payments, and exit strategies" action={undefined} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Monthly Payment"
          value={formatCurrency(monthlyPayment)}
          subValue={`${mortgage.type === 'interest-only' ? 'Interest only' : 'Repayment'} @ ${formatPercent(mortgage.currentRate)}`} positive={undefined}        />
        <MetricCard
          label="Current LTV"
          value={formatPercent(currentLTV)}
          subValue={`${formatCurrency(mortgage.balance)} / ${formatCurrency(meta.currentEstimatedValue)}`}
          positive={currentLTV <= 75}
        />
        <MetricCard
          label="LTV at Year 20"
          value={formatPercent(ltvData[4].ltv)}
          subValue={`Property value: ${formatCurrency(futureValue20)}`}
          positive={true}
        />
      </div>

      <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">LTV Trajectory</h3>
        <p className="text-xs text-stone-400 mb-4">
          Based on {formatPercent(projections.houseGrowthRate)} annual growth from {formatCurrency(meta.currentEstimatedValue)}
        </p>
        <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
          <BarChart data={ltvData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fill: '#8b8fa7', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8fa7', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={40} />
            <Tooltip content={<CustomTooltip active={undefined} payload={undefined} />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <ReferenceLine y={75} stroke="#fb7185" strokeDasharray="3 3" label={{ value: '75%', fill: '#fb7185', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={60} stroke="#34d399" strokeDasharray="3 3" label={{ value: '60%', fill: '#34d399', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="ltv" radius={[4, 4, 0, 0]} activeBar={{ stroke: '#f5f5f4', strokeWidth: 1.5 }}>
              {ltvData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
          <h4 className="text-xs text-stone-500 uppercase tracking-wider mb-3">Sell Now</h4>
          <p className="text-xl sm:text-2xl font-mono text-emerald-400 mb-2">{formatCurrency(sellNowEquity)}</p>
          <div className="space-y-1 text-xs text-stone-400">
            <p>Market value: {formatCurrency(meta.currentEstimatedValue)}</p>
            <p>Less mortgage: {formatCurrency(mortgage.balance)}</p>
            <p>Less CGT + fees</p>
          </div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
          <h4 className="text-xs text-stone-500 uppercase tracking-wider mb-3">Sell at Year 20</h4>
          <p className="text-xl sm:text-2xl font-mono text-emerald-400 mb-2">{formatCurrency(sellYear20Equity)}</p>
          <div className="space-y-1 text-xs text-stone-400">
            <p>Future value: {formatCurrency(futureValue20)}</p>
            <p>At {formatPercent(projections.houseGrowthRate)} growth p.a.</p>
            <p>Less CGT @ {projections.cgtRate}%</p>
          </div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
          <h4 className="text-xs text-stone-500 uppercase tracking-wider mb-3">Repayment Vehicle</h4>
          <p className="text-xl sm:text-2xl font-mono text-rose-400 mb-2">{formatCurrency(repaymentPMT)}<span className="text-sm text-stone-500">/mo</span></p>
          <div className="space-y-1 text-xs text-stone-400">
            <p>To accumulate {formatCurrency(mortgage.balance)}</p>
            <p>Over {projections.mortgageClearYear} years</p>
            <p>At 5% annual return</p>
          </div>
        </div>
      </div>
    </div>
  )
}
