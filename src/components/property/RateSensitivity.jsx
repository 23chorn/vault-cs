import SectionHeader from '../shared/SectionHeader'
import { formatCurrency, formatPercent } from '../../utils/format'
import { calcMonthlyInterestOnly, calcAnnualCosts, calcSection24Tax, calcAfterTaxMonthly } from '../../utils/finance'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

export default function RateSensitivity({ property }) {
  const { mortgage, rental, tax } = property
  const { annualRent, totalCosts } = calcAnnualCosts(property)

  const rates = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8]

  const data = rates.map((rate) => {
    const monthlyMortgage = calcMonthlyInterestOnly(mortgage.balance, rate)
    const annualMortgage = monthlyMortgage * 12
    const mortgageInterest = annualMortgage
    const s24 = calcSection24Tax(annualRent, totalCosts, mortgageInterest, tax.taxRate, tax.personalAllowance, tax.claimsPersonalAllowance)
    const annualNet = annualRent - totalCosts - annualMortgage
    const monthlyNet = calcAfterTaxMonthly(annualNet, s24.netTax)

    return {
      rate: `${rate}%`,
      rateNum: rate,
      monthlyPL: Math.round(monthlyNet),
      annualPL: Math.round(annualNet - s24.netTax),
      isCurrent: rate === mortgage.currentRate,
    }
  })

  const breakeven = data.find((d, i) => i > 0 && data[i - 1].monthlyPL >= 0 && d.monthlyPL < 0)
  const breakevenRate = breakeven ? breakeven.rateNum : null

  const currentMonthly = calcMonthlyInterestOnly(mortgage.balance, mortgage.currentRate)
  const scenarios = [
    { newRate: mortgage.currentRate - 1, label: '-1%' },
    { newRate: mortgage.currentRate - 0.5, label: '-0.5%' },
    { newRate: mortgage.currentRate, label: 'Same' },
    { newRate: mortgage.currentRate + 0.5, label: '+0.5%' },
    { newRate: mortgage.currentRate + 1, label: '+1%' },
    { newRate: mortgage.currentRate + 2, label: '+2%' },
  ].map((s) => {
    const newMonthly = calcMonthlyInterestOnly(mortgage.balance, s.newRate)
    return {
      ...s,
      newMonthly,
      monthlyChange: newMonthly - currentMonthly,
      annualChange: (newMonthly - currentMonthly) * 12,
    }
  })

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-text-primary font-mono">{formatCurrency(d.monthlyPL)}/mo</p>
        <p className="text-text-secondary">{formatCurrency(d.annualPL)}/yr</p>
        {d.isCurrent && <p className="text-accent-blue">Current rate</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Rate Sensitivity"
        subtitle="Impact of interest rate changes on monthly cashflow"
      />

      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Monthly P&L by Rate
        </h3>
        {breakevenRate && (
          <p className="text-xs text-accent-amber mb-4">
            Breakeven rate: ~{formatPercent(breakevenRate)}
          </p>
        )}
        <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="rate" tick={{ fill: '#8b8fa7', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8fa7', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} width={45} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <ReferenceLine y={0} stroke="#4e5266" />
            <Bar dataKey="monthlyPL" radius={[4, 4, 0, 0]} activeBar={{ stroke: '#eef0f6', strokeWidth: 1.5 }}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isCurrent ? '#3ea8ff' : entry.monthlyPL >= 0 ? '#00e59b' : '#ff4d6a'}
                  stroke={entry.isCurrent ? '#60a5fa' : 'none'}
                  strokeWidth={entry.isCurrent ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Renewal Scenarios
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Current rate: {formatPercent(mortgage.currentRate)} | Monthly payment: {formatCurrency(currentMonthly)}
        </p>
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-text-muted uppercase tracking-wider py-2">Change</th>
              <th className="text-right text-xs text-text-muted uppercase tracking-wider py-2">New Rate</th>
              <th className="text-right text-xs text-text-muted uppercase tracking-wider py-2">Monthly</th>
              <th className="text-right text-xs text-text-muted uppercase tracking-wider py-2">Monthly +/-</th>
              <th className="text-right text-xs text-text-muted uppercase tracking-wider py-2">Annual +/-</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, i) => (
              <tr key={i} className={`border-b border-border/50 ${s.label === 'Same' ? 'bg-accent-blue/5' : i % 2 === 0 ? 'bg-bg-elevated/30' : ''}`}>
                <td className="py-2.5 text-sm text-text-secondary">{s.label}</td>
                <td className="py-2.5 text-sm font-mono text-right text-text-primary">{formatPercent(s.newRate)}</td>
                <td className="py-2.5 text-sm font-mono text-right text-text-primary">{formatCurrency(s.newMonthly)}</td>
                <td className={`py-2.5 text-sm font-mono text-right ${s.monthlyChange <= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {s.monthlyChange === 0 ? '-' : formatCurrency(s.monthlyChange)}
                </td>
                <td className={`py-2.5 text-sm font-mono text-right ${s.annualChange <= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {s.annualChange === 0 ? '-' : formatCurrency(s.annualChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
