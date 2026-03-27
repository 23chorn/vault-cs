import { Card } from '../../shared/Card.tsx'
import { NumberInput } from '../../shared/NumberInput.tsx'
import { formatCurrency, fromAED, toAED } from '../../../utils/currency.ts'
import { useVault } from '../../../hooks/useVault.ts'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface ProjectionPoint {
  year: number
  portfolio: number
  monthlyContrib: number
  fireTarget: number
}

/** FIRE number = expenses / withdrawal rate, adjusted for inflation at a given year */
function fireNumberAtYear(annualExpenses: number, withdrawalRate: number, inflationRate: number, year: number): number {
  return (annualExpenses / (withdrawalRate / 100)) * Math.pow(1 + inflationRate / 100, year)
}

/**
 * Binary search for the annual contribution growth rate needed
 * to reach the inflation-adjusted FIRE number in targetYears.
 */
function solveGrowthRate(
  currentInvestments: number,
  monthlyContribution: number,
  annualReturn: number,
  annualExpenses: number,
  withdrawalRate: number,
  inflationRate: number,
  targetYears: number,
): number | null {
  if (annualExpenses <= 0 || targetYears <= 0 || monthlyContribution <= 0) return null

  const target = fireNumberAtYear(annualExpenses, withdrawalRate, inflationRate, targetYears)

  const simulate = (growthRate: number) => {
    const monthlyReturn = annualReturn / 100 / 12
    let balance = currentInvestments
    let contrib = monthlyContribution
    for (let y = 0; y < targetYears; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyReturn) + contrib
      }
      contrib *= 1 + growthRate / 100
    }
    return balance
  }

  if (simulate(0) >= target) return 0
  if (simulate(50) < target) return null

  let lo = 0, hi = 50
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (simulate(mid) >= target) hi = mid
    else lo = mid
  }
  return Math.round(hi * 10) / 10
}

function buildFireProjection(
  currentInvestments: number,
  monthlyContribution: number,
  annualReturn: number,
  growthRate: number,
  annualExpenses: number,
  withdrawalRate: number,
  inflationRate: number,
  targetYears: number,
): ProjectionPoint[] {
  const monthlyReturn = annualReturn / 100 / 12
  const points: ProjectionPoint[] = [{
    year: 0,
    portfolio: currentInvestments,
    monthlyContrib: monthlyContribution,
    fireTarget: fireNumberAtYear(annualExpenses, withdrawalRate, inflationRate, 0),
  }]

  let balance = currentInvestments
  let contrib = monthlyContribution

  for (let y = 1; y <= targetYears; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyReturn) + contrib
    }
    points.push({
      year: y,
      portfolio: Math.round(balance),
      monthlyContrib: Math.round(contrib),
      fireTarget: Math.round(fireNumberAtYear(annualExpenses, withdrawalRate, inflationRate, y)),
    })
    contrib *= 1 + growthRate / 100
  }

  return points
}

/**
 * Coast FIRE: the year at which current investments alone
 * (no further contributions) would compound to the inflation-adjusted
 * FIRE number by the target year.
 *
 * At year Y, you need: investments × (1+r)^(targetYears-Y) >= fireTarget(targetYears)
 * So: investments >= fireTarget(targetYears) / (1+r)^(targetYears-Y)
 * We check each projection year to find when portfolio crosses this threshold.
 */
function calcCoastFireYear(
  projection: ProjectionPoint[],
  annualReturn: number,
  annualExpenses: number,
  withdrawalRate: number,
  inflationRate: number,
  targetYears: number,
): number | null {
  if (projection.length === 0 || annualExpenses <= 0) return null

  const finalTarget = fireNumberAtYear(annualExpenses, withdrawalRate, inflationRate, targetYears)
  const annualGrowth = 1 + annualReturn / 100

  for (const p of projection) {
    const yearsRemaining = targetYears - p.year
    if (yearsRemaining <= 0) continue
    const neededNow = finalTarget / Math.pow(annualGrowth, yearsRemaining)
    if (p.portfolio >= neededNow) return p.year
  }
  return null
}

export function FireCalculator() {
  const { state, dispatch } = useVault()
  const dc = state.meta.displayCurrency
  const rates = state.meta.fxRates
  const fire = state.fire
  const toDisplay = (aed: number) => fromAED(aed, dc, rates)
  const toStore = (display: number) => toAED(display, dc, rates)

  const set = (partial: Partial<typeof fire>) =>
    dispatch({ type: 'UPDATE_FIRE', payload: partial })

  const targetYears = fire.targetYears ?? 20
  const inflationRate = fire.inflationRate ?? 3
  const withdrawalRate = 4
  const todayFireNumber = fire.annualExpenses / (withdrawalRate / 100)
  const adjustedFireNumber = fireNumberAtYear(fire.annualExpenses, withdrawalRate, inflationRate, targetYears)

  const requiredGrowth = solveGrowthRate(
    fire.currentInvestments,
    fire.monthlyContribution,
    fire.annualReturn,
    fire.annualExpenses,
    withdrawalRate,
    inflationRate,
    targetYears,
  )

  const projection = requiredGrowth !== null
    ? buildFireProjection(fire.currentInvestments, fire.monthlyContribution, fire.annualReturn, requiredGrowth, fire.annualExpenses, withdrawalRate, inflationRate, targetYears)
    : []

  const coastYear = calcCoastFireYear(projection, fire.annualReturn, fire.annualExpenses, withdrawalRate, inflationRate, targetYears)

  const finalContrib = projection.length > 0 ? projection[projection.length - 1].monthlyContrib : 0

  const projectedDate = new Date(Date.now() + targetYears * 365.25 * 86400000)
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

  const coastDate = coastYear !== null
    ? new Date(Date.now() + coastYear * 365.25 * 86400000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  const hasData = fire.annualExpenses > 0 && fire.monthlyContribution > 0

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">FIRE Calculator</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Annual Expenses ({dc})</label>
          <NumberInput value={toDisplay(fire.annualExpenses)} onChange={(v) => set({ annualExpenses: toStore(v) })} />
        </div>
        <div>
          <label>Current Investments ({dc})</label>
          <NumberInput value={toDisplay(fire.currentInvestments)} onChange={(v) => set({ currentInvestments: toStore(v) })} />
        </div>
        <div>
          <label>Current Monthly Contribution ({dc})</label>
          <NumberInput value={toDisplay(fire.monthlyContribution)} onChange={(v) => set({ monthlyContribution: toStore(v) })} />
        </div>
        <div>
          <label>Target Years</label>
          <NumberInput value={targetYears} onChange={(v) => set({ targetYears: v })} />
        </div>
        <div>
          <label>Expected Return (%/yr)</label>
          <NumberInput value={fire.annualReturn} onChange={(v) => set({ annualReturn: v })} decimals={1} />
        </div>
        <div>
          <label>Inflation (%/yr)</label>
          <NumberInput value={inflationRate} onChange={(v) => set({ inflationRate: v })} decimals={1} />
        </div>
      </div>

      {hasData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-stone-700/50 rounded-lg p-4 mb-4">
            <div>
              <div className="text-sm text-stone-400">FIRE Number</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {formatCurrency(toDisplay(adjustedFireNumber), dc)}
              </div>
              <div className="text-xs text-stone-500">
                today: {formatCurrency(toDisplay(todayFireNumber), dc)} (4% SWR)
              </div>
            </div>
            <div>
              <div className="text-sm text-stone-400">Required Growth</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {requiredGrowth !== null ? `${requiredGrowth}%/yr` : '—'}
              </div>
              <div className="text-xs text-stone-500">contribution increase</div>
            </div>
            <div>
              <div className="text-sm text-stone-400">Final Contribution</div>
              <div className="text-lg font-bold font-mono">
                {requiredGrowth !== null ? `${formatCurrency(toDisplay(finalContrib), dc)}/mo` : '—'}
              </div>
              <div className="text-xs text-stone-500">in year {targetYears} &middot; {projectedDate}</div>
            </div>
            <div>
              <div className="text-sm text-stone-400">Coast FIRE</div>
              <div className="text-lg font-bold font-mono text-sky-400">
                {coastYear !== null ? `Year ${coastYear}` : '—'}
              </div>
              <div className="text-xs text-stone-500">
                {coastDate ? `${coastDate} — stop saving` : 'not reached'}
              </div>
            </div>
          </div>

          {coastYear !== null && (
            <div className="text-xs text-stone-500 mb-4 bg-sky-400/10 border border-sky-400/20 rounded-lg px-3 py-2">
              After year {coastYear}, your portfolio can compound to the target without further contributions.
            </div>
          )}
        </>
      )}

      {hasData && projection.length > 1 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection.map((p) => ({
              year: `Yr ${p.year}`,
              portfolio: Math.round(toDisplay(p.portfolio)),
              fireTarget: Math.round(toDisplay(p.fireTarget)),
            }))}>
              <defs>
                <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fill: '#a8a29e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(projection.length / 8))}
              />
              <YAxis
                tick={{ fill: '#a8a29e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                  return `${(v / 1000).toFixed(0)}k`
                }}
                width={50}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: 8 }}
                labelStyle={{ color: '#a8a29e' }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value, dc),
                  name === 'portfolio' ? 'Portfolio' : 'FIRE Target',
                ]}
              />
              {coastYear !== null && (
                <ReferenceLine
                  x={`Yr ${coastYear}`}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{ value: 'Coast', position: 'top', fill: '#38bdf8', fontSize: 11 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="fireTarget"
                stroke="#f59e0b"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                name="fireTarget"
              />
              <Area
                type="monotone"
                dataKey="portfolio"
                stroke="#34d399"
                fill="url(#fireGrad)"
                strokeWidth={2}
                name="portfolio"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasData && projection.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-stone-400 text-xs border-b border-stone-700">
                <th className="text-left py-2 px-2">Year</th>
                <th className="text-right py-2 px-2">Monthly</th>
                <th className="text-right py-2 px-2">Annual</th>
                <th className="text-right py-2 px-2">Portfolio</th>
                <th className="text-right py-2 px-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {projection.slice(1).map((p) => {
                const isCoast = coastYear !== null && p.year === coastYear
                return (
                  <tr key={p.year} className={`border-b border-stone-700/50 hover:bg-stone-700/30 ${isCoast ? 'bg-sky-400/5' : ''}`}>
                    <td className="py-1.5 px-2 text-stone-400">
                      {p.year}
                      {isCoast && <span className="text-sky-400 text-xs ml-1">coast</span>}
                    </td>
                    <td className="text-right py-1.5 px-2 font-mono">{formatCurrency(toDisplay(p.monthlyContrib), dc)}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{formatCurrency(toDisplay(p.monthlyContrib * 12), dc)}</td>
                    <td className="text-right py-1.5 px-2 font-mono text-emerald-400">{formatCurrency(toDisplay(p.portfolio), dc)}</td>
                    <td className="text-right py-1.5 px-2 font-mono text-amber-400/60">{formatCurrency(toDisplay(p.fireTarget), dc)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
