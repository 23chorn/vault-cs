import { useState } from 'react'
import SectionHeader from '../shared/SectionHeader'
import MetricCard from '../shared/MetricCard'
import { formatCurrency } from '../../utils/format'
import { buildProjection } from '../../utils/finance'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, CartesianGrid, Legend,
  ComposedChart, Line,
} from 'recharts'

export default function ProjectionModel({ property }) {
  const [includeEPC, setIncludeEPC] = useState(true)
  const { projections } = property

  const projection = buildProjection(
    includeEPC
      ? property
      : {
          ...property,
          costs: { ...property.costs, epcUpgradeCost: 0 },
        }
  )

  const phase1Data = projection.filter((y) => y.phase === 1)
  const phase2Data = projection.filter((y) => y.phase === 2)
  const phase1Cumulative = phase1Data.length > 0 ? phase1Data[phase1Data.length - 1].cumulativeCashflow : 0
  const phase2Cumulative = phase2Data.length > 0
    ? phase2Data[phase2Data.length - 1].cumulativeCashflow - phase1Cumulative
    : 0
  const finalYear = projection[projection.length - 1]

  const chartData = projection.map((y) => ({
    year: `Yr ${y.year}`,
    yearNum: y.year,
    cumulativeCashflow: Math.round(y.cumulativeCashflow),
    propertyValue: Math.round(y.propertyValue),
    equity: Math.round(y.equity),
    monthlyNet: Math.round(y.monthlyNet),
    phase: y.phase,
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-text-primary font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="20-Year Projection"
        subtitle={`Phase 1: ${projections.mortgageClearYear} years with mortgage | Phase 2: ${projections.phase2Years} years post-mortgage`}
        action={
          <button
            onClick={() => setIncludeEPC(!includeEPC)}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
              includeEPC
                ? 'border-accent-amber/30 text-accent-amber bg-accent-amber/10'
                : 'border-border text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            {includeEPC ? 'EPC cost included' : 'EPC cost excluded'}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Phase 1 Cumulative"
          value={formatCurrency(phase1Cumulative)}
          subValue={`${projections.mortgageClearYear} years`}
          positive={phase1Cumulative >= 0}
        />
        <MetricCard
          label="Phase 2 Cumulative"
          value={formatCurrency(phase2Cumulative)}
          subValue={`${projections.phase2Years} years`}
          positive={phase2Cumulative >= 0}
        />
        <MetricCard
          label="Property Value (End)"
          value={formatCurrency(finalYear?.propertyValue)}
          subValue={`From ${formatCurrency(property.meta.currentEstimatedValue)}`}
          positive={true}
        />
        <MetricCard
          label="Total Return"
          value={formatCurrency(finalYear?.cumulativeCashflow)}
          subValue="All years combined"
          positive={finalYear?.cumulativeCashflow >= 0}
        />
      </div>

      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Value & Equity Trajectory</h3>
        <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: '#8b8fa7', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#8b8fa7', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} width={45} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b8fa7' }} />
            <ReferenceLine x={`Yr ${projections.mortgageClearYear}`} stroke="#a78bfa" strokeDasharray="3 3" label={{ value: 'Phase 2', fill: '#a78bfa', fontSize: 10, position: 'top' }} />
            <Area type="monotone" dataKey="propertyValue" name="Property Value" fill="#3ea8ff" fillOpacity={0.1} stroke="#3ea8ff" strokeWidth={2} activeDot={{ stroke: '#eef0f6', strokeWidth: 1.5, r: 5 }} />
            <Area type="monotone" dataKey="equity" name="Equity" fill="#00e59b" fillOpacity={0.1} stroke="#00e59b" strokeWidth={2} activeDot={{ stroke: '#eef0f6', strokeWidth: 1.5, r: 5 }} />
            <Line type="monotone" dataKey="cumulativeCashflow" name="Cumulative Cashflow" stroke="#ffb224" strokeWidth={2} dot={false} activeDot={{ stroke: '#eef0f6', strokeWidth: 1.5, r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Monthly Net Cashflow by Year</h3>
        <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fill: '#8b8fa7', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#8b8fa7', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} width={45} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <ReferenceLine y={0} stroke="#4e5266" />
            <ReferenceLine x={`Yr ${projections.mortgageClearYear}`} stroke="#a78bfa" strokeDasharray="3 3" />
            <Bar dataKey="monthlyNet" name="Monthly Net" radius={[3, 3, 0, 0]} activeBar={{ stroke: '#eef0f6', strokeWidth: 1.5 }}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.monthlyNet >= 0 ? '#00e59b' : '#ff4d6a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Year-by-Year Breakdown</h3>
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted">Year</th>
              <th className="text-right py-2 text-text-muted">Rent/mo</th>
              <th className="text-right py-2 text-text-muted">Annual Rent</th>
              <th className="text-right py-2 text-text-muted">Costs</th>
              <th className="text-right py-2 text-text-muted">Mortgage</th>
              <th className="text-right py-2 text-text-muted">Tax</th>
              <th className="text-right py-2 text-text-muted">Net/mo</th>
              <th className="text-right py-2 text-text-muted">Cumulative</th>
              <th className="text-right py-2 text-text-muted">Value</th>
              <th className="text-right py-2 text-text-muted">LTV</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((y) => (
              <tr key={y.year} className={`border-b border-border/30 ${y.phase === 2 ? 'bg-accent-purple/5' : y.year % 2 === 0 ? 'bg-bg-elevated/30' : ''}`}>
                <td className="py-2 text-text-secondary">{y.year}</td>
                <td className="py-2 text-right font-mono text-text-primary">{formatCurrency(y.monthlyRent)}</td>
                <td className="py-2 text-right font-mono text-text-primary">{formatCurrency(y.annualRent)}</td>
                <td className="py-2 text-right font-mono text-accent-red">{formatCurrency(y.totalCosts)}</td>
                <td className="py-2 text-right font-mono text-text-primary">{formatCurrency(y.mortgagePayment)}</td>
                <td className="py-2 text-right font-mono text-accent-red">{formatCurrency(y.tax)}</td>
                <td className={`py-2 text-right font-mono ${y.monthlyNet >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatCurrency(y.monthlyNet)}</td>
                <td className={`py-2 text-right font-mono ${y.cumulativeCashflow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatCurrency(y.cumulativeCashflow)}</td>
                <td className="py-2 text-right font-mono text-text-primary">{formatCurrency(y.propertyValue)}</td>
                <td className="py-2 text-right font-mono text-text-secondary">{y.phase === 2 ? '-' : `${y.ltv.toFixed(1)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
