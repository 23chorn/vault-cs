import { useState } from 'react'
import SectionHeader from '../shared/SectionHeader'
import SliderInput from '../shared/SliderInput'
import { formatCurrency, formatPercent } from '../../utils/format'
import { calcFutureValue, calcNetEquity, buildProjection } from '../../utils/finance'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

export default function SellVsHold({ property }) {
  const [growthRate, setGrowthRate] = useState(property.projections.houseGrowthRate)
  const [holdYears, setHoldYears] = useState(property.projections.mortgageClearYear)
  const investmentReturn = 5

  const { meta, mortgage, projections } = property

  const sellNowEquity = calcNetEquity(
    meta.currentEstimatedValue, mortgage.balance, meta.purchasePrice,
    projections.cgtRate, 1.5, 2000, 3000
  )
  const sellProcedsCompounded = calcFutureValue(sellNowEquity, investmentReturn, holdYears)

  const modifiedProperty = { ...property, projections: { ...projections, houseGrowthRate: growthRate } }
  const projection = buildProjection(modifiedProperty)
  const holdData = projection.find((y) => y.year === holdYears) || projection[projection.length - 1]
  const futureValue = calcFutureValue(meta.currentEstimatedValue, growthRate, holdYears)
  const holdEquity = calcNetEquity(
    futureValue, mortgage.balance, meta.purchasePrice,
    projections.cgtRate, 1.5, 2000, 3000
  )
  const holdTotal = holdEquity + holdData.cumulativeCashflow

  const holdAdvantage = holdTotal - sellProcedsCompounded

  const growthRates = [2, 2.5, 3, 3.7, 4, 5]
  const sensitivityData = growthRates.map((gr) => {
    const fv = calcFutureValue(meta.currentEstimatedValue, gr, holdYears)
    const eq = calcNetEquity(fv, mortgage.balance, meta.purchasePrice, projections.cgtRate, 1.5, 2000, 3000)
    const modProp = { ...property, projections: { ...projections, houseGrowthRate: gr } }
    const proj = buildProjection(modProp)
    const yearData = proj.find((y) => y.year === holdYears) || proj[proj.length - 1]
    const total = eq + yearData.cumulativeCashflow
    const advantage = total - sellProcedsCompounded
    return {
      growthRate: `${gr}%`,
      sellPath: Math.round(sellProcedsCompounded),
      holdPath: Math.round(total),
      advantage: Math.round(advantage),
    }
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-stone-700 border border-stone-700 rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-stone-100 font-medium">{label}</p>
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
      <SectionHeader title="Sell vs Hold" subtitle="Compare selling now versus continuing to hold" action={undefined} />

      <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <SliderInput
            label="Growth Rate Assumption"
            value={growthRate}
            onChange={setGrowthRate}
            min={0}
            max={10}
            step={0.1}
            suffix="%"
            decimals={1}
          />
          <SliderInput
            label="Hold Period (years)"
            value={holdYears}
            onChange={setHoldYears}
            min={1}
            max={30}
            step={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
          <h3 className="text-xs text-stone-500 uppercase tracking-wider mb-4">Sell Now & Invest</h3>
          <p className="text-2xl sm:text-3xl font-mono text-rose-400 mb-4">{formatCurrency(sellProcedsCompounded)}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">Net sale proceeds today</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(sellNowEquity)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">Compounded at {investmentReturn}% for {holdYears} years</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(sellProcedsCompounded)}</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
          <h3 className="text-xs text-stone-500 uppercase tracking-wider mb-4">Hold for {holdYears} Years</h3>
          <p className="text-2xl sm:text-3xl font-mono text-emerald-400 mb-4">{formatCurrency(holdTotal)}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">Net equity at year {holdYears}</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(holdEquity)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">Cumulative rental net</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(holdData.cumulativeCashflow)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`border rounded-xl p-4 sm:p-6 text-center ${holdAdvantage >= 0 ? 'bg-emerald-500/5 border-emerald-400/20' : 'bg-rose-600/5 border-rose-400/20'}`}>
        <p className="text-sm text-stone-400 mb-1">
          {holdAdvantage >= 0 ? 'Holding is better by' : 'Selling is better by'}
        </p>
        <p className={`text-2xl sm:text-3xl font-mono font-medium ${holdAdvantage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatCurrency(Math.abs(holdAdvantage))}
        </p>
        <p className="text-xs text-stone-500 mt-2">
          At {formatPercent(growthRate)} growth over {holdYears} years
        </p>
      </div>

      <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">
          Sensitivity: Hold Advantage by Growth Rate
        </h3>
        <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
          <BarChart data={sensitivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="growthRate" tick={{ fill: '#8b8fa7', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8fa7', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} width={45} />
            <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="sellPath" name="Sell & Invest" fill="#f43f5e" radius={[4, 4, 0, 0]} activeBar={{ stroke: '#f5f5f4', strokeWidth: 1.5 }} />
            <Bar dataKey="holdPath" name="Hold" fill="#34d399" radius={[4, 4, 0, 0]} activeBar={{ stroke: '#f5f5f4', strokeWidth: 1.5 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">
          Sensitivity Table
        </h3>
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-stone-700">
              <th className="text-left py-2 text-xs text-stone-500 uppercase">Growth Rate</th>
              <th className="text-right py-2 text-xs text-stone-500 uppercase">Sell & Invest</th>
              <th className="text-right py-2 text-xs text-stone-500 uppercase">Hold</th>
              <th className="text-right py-2 text-xs text-stone-500 uppercase">Advantage</th>
            </tr>
          </thead>
          <tbody>
            {sensitivityData.map((row, i) => (
              <tr key={i} className={`border-b border-stone-700/30 ${i % 2 === 0 ? 'bg-stone-700/30' : ''}`}>
                <td className="py-2.5 text-stone-400">{row.growthRate}</td>
                <td className="py-2.5 text-right font-mono text-rose-400">{formatCurrency(row.sellPath)}</td>
                <td className="py-2.5 text-right font-mono text-emerald-400">{formatCurrency(row.holdPath)}</td>
                <td className={`py-2.5 text-right font-mono font-medium ${row.advantage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {row.advantage >= 0 ? '+' : ''}{formatCurrency(row.advantage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
