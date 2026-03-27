import { useVault } from '../../../hooks/useVault.ts'
import { Card } from '../../shared/Card.tsx'
import { formatCurrency, toAED, formatInDisplayCurrency } from '../../../utils/currency.ts'
import { calcPersonMonthlySurplus, calcPersonMonthlyOutgoings } from '../../../utils/calculations.ts'
import { PersonHeader, PersonIncome, PersonExpenses, PersonVariableSpend } from './PersonColumn.tsx'
import type { Person, SavingsPot, PotContribution, Currency } from '../../../types/vault.ts'

function ContributionsColumn({ person, savingsPots, onChange, displayCurrency }: { person: Person; savingsPots: SavingsPot[]; onChange: (p: Person) => void; displayCurrency: Currency }) {
  const update = (partial: Partial<Person>) => onChange({ ...person, ...partial })

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
            <input
              className="w-24"
              type="number"
              value={contrib.amount || ''}
              onChange={(e) => updateContribution(i, { ...contrib, amount: parseFloat(e.target.value) || 0 })}
            />
            <button onClick={() => removeContribution(i)} className="text-stone-500 hover:text-rose-400 px-1">
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <button onClick={addContribution} className="text-sm text-amber-400 hover:text-amber-300">+ Add</button>
        {total > 0 && <span className="text-sm text-stone-400 font-mono">{formatCurrency(total, displayCurrency)}</span>}
      </div>
    </div>
  )
}

export function FinancesPage() {
  const { state, dispatch } = useVault()
  const rates = state.meta.fxRates
  const dc = state.meta.displayCurrency
  const fmt = (aed: number) => formatInDisplayCurrency(aed, dc, rates)

  const p1 = state.people.person1
  const p2 = state.people.person2

  const updatePerson = (key: 'person1' | 'person2') => (person: Person) =>
    dispatch({ type: 'UPDATE_PERSON', payload: { key, person } })

  const updateRate = (key: 'AED_GBP' | 'AED_USD', value: string) => {
    dispatch({
      type: 'UPDATE_META',
      payload: { fxRates: { ...state.meta.fxRates, [key]: parseFloat(value) || 0 } },
    })
  }

  const p1Surplus = calcPersonMonthlySurplus(p1)
  const p2Surplus = calcPersonMonthlySurplus(p2)
  const totalIncome = toAED(p1.monthlySalaryNet, dc, rates) + toAED(p2.monthlySalaryNet, dc, rates)
  const totalOutgoings = toAED(calcPersonMonthlyOutgoings(p1), dc, rates) + toAED(calcPersonMonthlyOutgoings(p2), dc, rates)
  const totalSurplus = toAED(p1Surplus, dc, rates) + toAED(p2Surplus, dc, rates)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono">Finances</h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <label className="text-stone-400 mb-0">AED/GBP:</label>
            <input type="number" step="0.001" value={Number(state.meta.fxRates.AED_GBP.toFixed(3))} onChange={(e) => updateRate('AED_GBP', e.target.value)} className="w-24 text-sm" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-stone-400 mb-0">AED/USD:</label>
            <input type="number" step="0.001" value={Number(state.meta.fxRates.AED_USD.toFixed(3))} onChange={(e) => updateRate('AED_USD', e.target.value)} className="w-24 text-sm" />
          </div>
        </div>
      </div>

      {/* Person details */}
      <Card>
        <div className="grid grid-cols-2 gap-6">
          <PersonHeader person={p1} onChange={updatePerson('person1')} />
          <PersonHeader person={p2} onChange={updatePerson('person2')} />
        </div>
      </Card>

      {/* Income */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Monthly Income</h2>
        <div className="grid grid-cols-2 gap-6">
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
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">{p1.name}</div>
            <PersonExpenses person={p1} onChange={updatePerson('person1')} displayCurrency={dc} />
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">{p2.name}</div>
            <PersonExpenses person={p2} onChange={updatePerson('person2')} displayCurrency={dc} />
          </div>
        </div>
      </Card>

      {/* Variable Spend */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Monthly Variable Spend</h2>
        <div className="grid grid-cols-2 gap-6">
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
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">{p1.name}</div>
            <ContributionsColumn person={p1} savingsPots={state.savingsPots} onChange={updatePerson('person1')} displayCurrency={dc} />
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">{p2.name}</div>
            <ContributionsColumn person={p2} savingsPots={state.savingsPots} onChange={updatePerson('person2')} displayCurrency={dc} />
          </div>
        </div>
      </Card>

      {/* Surplus */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Monthly Surplus</h2>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <div className="text-sm text-stone-500">{p1.name}</div>
            <div className={`text-lg font-bold font-mono ${p1Surplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(toAED(p1Surplus, dc, rates))}
            </div>
          </div>
          <div>
            <div className="text-sm text-stone-500">{p2.name}</div>
            <div className={`text-lg font-bold font-mono ${p2Surplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(toAED(p2Surplus, dc, rates))}
            </div>
          </div>
        </div>
        <div className="border-t border-stone-700 pt-4 grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-stone-400">Combined Income</div>
            <div className="text-lg font-semibold font-mono">{fmt(totalIncome)}</div>
          </div>
          <div>
            <div className="text-sm text-stone-400">Combined Outgoings</div>
            <div className="text-lg font-semibold font-mono text-rose-400">{fmt(totalOutgoings)}</div>
          </div>
          <div>
            <div className="text-sm text-stone-400">Combined Surplus</div>
            <div className={`text-lg font-semibold font-mono ${totalSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(totalSurplus)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
