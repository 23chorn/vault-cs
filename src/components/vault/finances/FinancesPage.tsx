import { useState } from 'react'
import { useVault } from '../../../hooks/useVault.ts'
import { Card } from '../../shared/Card.tsx'
import { formatCurrency, toAED, fromAED, formatInDisplayCurrency } from '../../../utils/currency.ts'
import { calcPersonMonthlySurplus, calcPersonMonthlyOutgoings, calcPersonMonthlySpending } from '../../../utils/calculations.ts'
import { PersonHeader, PersonIncome, PersonExpenses, PersonVariableSpend } from './PersonColumn.tsx'
import { NumberInput } from '../../shared/NumberInput.tsx'
import { fetchLiveRates } from '../../../utils/fetchRates.ts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Person, SavingsPot, PotContribution, Currency } from '../../../types/vault.ts'
import type { FxRates } from '../../../utils/currency.ts'

function ContributionsColumn({ person, savingsPots, onChange, displayCurrency, rates }: { person: Person; savingsPots: SavingsPot[]; onChange: (p: Person) => void; displayCurrency: Currency; rates: FxRates }) {
  const update = (partial: Partial<Person>) => onChange({ ...person, ...partial })
  const toDisplay = (aed: number) => fromAED(aed, displayCurrency, rates)
  const toStore = (display: number) => toAED(display, displayCurrency, rates)

  const updateContribution = (index: number, contrib: PotContribution) => {
    const updated = [...person.monthlyContributions]
    updated[index] = contrib
    update({ monthlyContributions: updated })
  }

  const addContribution = () => {
    const firstPot = savingsPots[0]
    if (!firstPot) return
    update({ monthlyContributions: [...person.monthlyContributions, { potId: firstPot.id, amount: 0 }] })
  }

  const removeContribution = (index: number) => {
    update({ monthlyContributions: person.monthlyContributions.filter((_, i) => i !== index) })
  }

  const total = person.monthlyContributions.reduce((s, c) => s + c.amount, 0)

  if (savingsPots.length === 0) {
    return <p className="text-stone-500 text-sm">Create savings pots first</p>
  }

  return (
    <div>
      <div className="space-y-2">
        {person.monthlyContributions.map((contrib, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              className="flex-1"
              value={contrib.potId}
              onChange={(e) => updateContribution(i, { ...contrib, potId: e.target.value })}
            >
              {savingsPots.map((pot) => (
                <option key={pot.id} value={pot.id}>{pot.label}</option>
              ))}
            </select>
            <NumberInput
              className="w-24"
              value={toDisplay(contrib.amount)}
              onChange={(v) => updateContribution(i, { ...contrib, amount: toStore(v) })}
            />
            <button onClick={() => removeContribution(i)} className="text-stone-500 hover:text-rose-400 px-1">
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <button onClick={addContribution} className="text-sm text-amber-400 hover:text-amber-300">+ Add</button>
        {total > 0 && <span className="text-sm text-stone-400 font-mono">{formatCurrency(toDisplay(total), displayCurrency)}</span>}
      </div>
    </div>
  )
}

export function FinancesPage() {
  const { state, dispatch } = useVault()
  const rates = state.meta.fxRates
  const dc = state.meta.displayCurrency
  const fmt = (aed: number) => formatInDisplayCurrency(aed, dc, rates)
  const [refreshing, setRefreshing] = useState(false)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const p1 = state.people.person1
  const p2 = state.people.person2

  const updatePerson = (key: 'person1' | 'person2') => (person: Person) =>
    dispatch({ type: 'UPDATE_PERSON', payload: { key, person } })

  const refreshRates = async () => {
    setRefreshing(true)
    try {
      const newRates = await fetchLiveRates()
      dispatch({ type: 'UPDATE_META', payload: { fxRates: newRates } })
    } catch {
      // keep existing rates
    }
    setRefreshing(false)
  }

  const updateRate = (key: 'AED_GBP' | 'AED_USD', value: string) => {
    dispatch({
      type: 'UPDATE_META',
      payload: { fxRates: { ...state.meta.fxRates, [key]: parseFloat(value) || 0 } },
    })
  }

  const p1Surplus = calcPersonMonthlySurplus(p1)
  const p2Surplus = calcPersonMonthlySurplus(p2)
  const totalIncome = p1.monthlySalaryNet + p2.monthlySalaryNet
  const totalOutgoings = calcPersonMonthlyOutgoings(p1) + calcPersonMonthlyOutgoings(p2)
  const totalSpending = calcPersonMonthlySpending(p1) + calcPersonMonthlySpending(p2)
  const totalSurplus = p1Surplus + p2Surplus

  const toDisplay = (aed: number) => fromAED(aed, dc, rates)

  // Breakdown for stacked bar
  const variableSpend = p1.monthlyVariableSpend + p2.monthlyVariableSpend
  const contributions = p1.monthlyContributions.reduce((s, c) => s + c.amount, 0) +
    p2.monthlyContributions.reduce((s, c) => s + c.amount, 0)

  // Merge fixed expenses by label across both people
  const expenseMap = new Map<string, number>()
  for (const e of [...p1.monthlyFixedExpenses, ...p2.monthlyFixedExpenses]) {
    if (e.amount > 0) {
      expenseMap.set(e.label || 'Other', (expenseMap.get(e.label || 'Other') ?? 0) + e.amount)
    }
  }
  const expenseLabels = Array.from(expenseMap.keys())

  // Build chart data as percentages so both bars are same length
  const incomeTotal = p1.monthlySalaryNet + p2.monthlySalaryNet
  const outgoingsTotal = totalOutgoings
  const pctOf = (amount: number, total: number) => total > 0 ? Math.round((amount / total) * 1000) / 10 : 0

  const spendTotal = outgoingsTotal - contributions
  const incomeRow: Record<string, any> = { category: 'Income', income1: pctOf(p1.monthlySalaryNet, incomeTotal), income2: pctOf(p2.monthlySalaryNet, incomeTotal), variable: 0, _income1: Math.round(toDisplay(p1.monthlySalaryNet)), _income2: Math.round(toDisplay(p2.monthlySalaryNet)) }
  const outgoingsRow: Record<string, any> = { category: 'Spending', income1: 0, income2: 0, variable: pctOf(variableSpend, spendTotal), _variable: Math.round(toDisplay(variableSpend)) }
  for (const label of expenseLabels) {
    const key = `exp_${label}`
    const amount = expenseMap.get(label)!
    incomeRow[key] = 0
    outgoingsRow[key] = pctOf(amount, spendTotal)
    outgoingsRow[`_${key}`] = Math.round(toDisplay(amount))
    incomeRow[`_${key}`] = 0
  }
  // Surplus breakdown: contributions per pot + unallocated
  const surplusTotal = Math.max(0, totalIncome - totalSpending)
  const potContribMap = new Map<string, number>()
  for (const person of [p1, p2]) {
    for (const c of person.monthlyContributions) {
      if (c.amount > 0) {
        const pot = state.savingsPots.find((p) => p.id === c.potId)
        const label = pot?.label || 'Unknown'
        potContribMap.set(label, (potContribMap.get(label) ?? 0) + c.amount)
      }
    }
  }
  const potLabels = Array.from(potContribMap.keys())
  const unallocated = surplusTotal - contributions

  const surplusRow: Record<string, any> = { category: 'Surplus', income1: 0, income2: 0, variable: 0 }
  // Zero out expense keys
  for (const label of expenseLabels) {
    surplusRow[`exp_${label}`] = 0
  }
  for (const label of potLabels) {
    const key = `pot_${label}`
    surplusRow[key] = pctOf(potContribMap.get(label)!, surplusTotal)
    surplusRow[`_${key}`] = Math.round(toDisplay(potContribMap.get(label)!))
    incomeRow[key] = 0
    outgoingsRow[key] = 0
  }
  surplusRow.unallocated = pctOf(Math.max(0, unallocated), surplusTotal)
  surplusRow._unallocated = Math.round(toDisplay(Math.max(0, unallocated)))
  incomeRow.unallocated = 0
  outgoingsRow.unallocated = 0
  for (const label of potLabels) {
    incomeRow[`pot_${label}`] = 0
    outgoingsRow[`pot_${label}`] = 0
  }

  const breakdownData = surplusTotal > 0 ? [incomeRow, outgoingsRow, surplusRow] : [incomeRow, outgoingsRow]

  // Colours for expense segments
  const expenseColours = ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#fca5a5', '#fb7185']
  const potColours = ['#38bdf8', '#7dd3fc', '#0ea5e9', '#0284c7', '#0369a1']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold font-mono">Finances</h1>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="text-stone-500 font-mono">1 AED = {rates.AED_GBP.toFixed(4)} GBP</span>
          <span className="text-stone-500 font-mono">1 AED = {rates.AED_USD.toFixed(4)} USD</span>
          <button
            onClick={refreshRates}
            disabled={refreshing}
            className="text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-wait"
            title="Refresh FX rates"
          >
            {refreshing ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Person details */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PersonHeader person={p1} onChange={updatePerson('person1')} />
          <PersonHeader person={p2} onChange={updatePerson('person2')} />
        </div>
      </Card>

      {/* Income */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Monthly Income</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">{p1.name}</div>
            <PersonIncome person={p1} onChange={updatePerson('person1')} />
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">{p2.name}</div>
            <PersonIncome person={p2} onChange={updatePerson('person2')} />
          </div>
        </div>
      </Card>

      {/* Fixed Expenses */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Fixed Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">{p1.name}</div>
            <PersonExpenses person={p1} onChange={updatePerson('person1')} displayCurrency={dc} rates={rates} />
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">{p2.name}</div>
            <PersonExpenses person={p2} onChange={updatePerson('person2')} displayCurrency={dc} rates={rates} />
          </div>
        </div>
      </Card>

      {/* Variable Spend */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Monthly Variable Spend</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">{p1.name}</div>
            <PersonVariableSpend person={p1} onChange={updatePerson('person1')} />
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">{p2.name}</div>
            <PersonVariableSpend person={p2} onChange={updatePerson('person2')} />
          </div>
        </div>
      </Card>

      {/* Pot Contributions */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Pot Contributions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">{p1.name}</div>
            <ContributionsColumn person={p1} savingsPots={state.savingsPots} onChange={updatePerson('person1')} displayCurrency={dc} rates={rates} />
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">{p2.name}</div>
            <ContributionsColumn person={p2} savingsPots={state.savingsPots} onChange={updatePerson('person2')} displayCurrency={dc} rates={rates} />
          </div>
        </div>
      </Card>

      {/* Surplus */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Monthly Surplus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
          <div>
            <div className="text-sm text-stone-500">{p1.name}</div>
            <div className={`text-lg font-bold font-mono ${p1Surplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(p1Surplus)}
            </div>
          </div>
          <div>
            <div className="text-sm text-stone-500">{p2.name}</div>
            <div className={`text-lg font-bold font-mono ${p2Surplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(p2Surplus)}
            </div>
          </div>
        </div>
        <div className="border-t border-stone-700 pt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-stone-400">Income</div>
            <div className="text-lg font-semibold font-mono">{fmt(totalIncome)}</div>
          </div>
          <div>
            <div className="text-sm text-stone-400">Spending</div>
            <div className="text-lg font-semibold font-mono text-rose-400">{fmt(totalSpending)}</div>
          </div>
          <div>
            <div className="text-sm text-stone-400">Savings</div>
            <div className="text-lg font-semibold font-mono text-sky-400">{fmt(contributions)}</div>
          </div>
          <div>
            <div className="text-sm text-stone-400">Surplus</div>
            <div className={`text-lg font-semibold font-mono ${totalSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(totalSurplus)}
            </div>
          </div>
        </div>

        {totalIncome > 0 && (
          <div className="border-t border-stone-700 pt-4 mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical" barSize={28}>
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: '#a8a29e', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length || !hoveredSegment) return null
                    const item = payload.find((p: any) => p.dataKey === hoveredSegment)
                    if (!item || item.value === 0) return null
                    const name = item.dataKey as string
                    const pct = item.value as number
                    const raw = item.payload[`_${name}`]
                    const amount = raw !== undefined ? formatCurrency(raw, dc) : ''
                    const labelMap: Record<string, string> = { income1: p1.name, income2: p2.name, variable: 'Variable Spend', unallocated: 'Unallocated' }
                    const label = name.startsWith('exp_') ? name.slice(4) : name.startsWith('pot_') ? name.slice(4) : (labelMap[name] || name)
                    return (
                      <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm">
                        <div className="text-stone-400">{label}</div>
                        <div className="font-mono text-stone-100">{amount} <span className="text-stone-500">({pct}%)</span></div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="income1" stackId="a" fill="#34d399" name="income1" onMouseMove={() => setHoveredSegment('income1')} onMouseLeave={() => setHoveredSegment(null)} />
                <Bar dataKey="income2" stackId="a" fill="#6ee7b7" name="income2" onMouseMove={() => setHoveredSegment('income2')} onMouseLeave={() => setHoveredSegment(null)} />
                {expenseLabels.map((label, i) => (
                  <Bar key={label} dataKey={`exp_${label}`} stackId="a" fill={expenseColours[i % expenseColours.length]} name={`exp_${label}`} onMouseMove={() => setHoveredSegment(`exp_${label}`)} onMouseLeave={() => setHoveredSegment(null)} />
                ))}
                <Bar dataKey="variable" stackId="a" fill="#fb923c" name="variable" onMouseMove={() => setHoveredSegment('variable')} onMouseLeave={() => setHoveredSegment(null)} />
                {potLabels.map((label, i) => (
                  <Bar key={`pot_${label}`} dataKey={`pot_${label}`} stackId="a" fill={potColours[i % potColours.length]} name={`pot_${label}`} onMouseMove={() => setHoveredSegment(`pot_${label}`)} onMouseLeave={() => setHoveredSegment(null)} />
                ))}
                <Bar dataKey="unallocated" stackId="a" fill="#a8a29e" name="unallocated" onMouseMove={() => setHoveredSegment('unallocated')} onMouseLeave={() => setHoveredSegment(null)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
