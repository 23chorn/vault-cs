import { formatCurrency } from '../../../utils/currency.ts'
import type { Person, MonthlyExpense, Currency } from '../../../types/vault.ts'

interface PersonColumnProps {
  person: Person
  onChange: (person: Person) => void
  displayCurrency?: Currency
}

export function PersonHeader({ person, onChange }: PersonColumnProps) {
  const update = (partial: Partial<Person>) => onChange({ ...person, ...partial })

  return (
    <div>
      <label>Name</label>
      <input value={person.name} onChange={(e) => update({ name: e.target.value })} />
    </div>
  )
}

export function PersonIncome({ person, onChange }: PersonColumnProps) {
  const update = (partial: Partial<Person>) => onChange({ ...person, ...partial })

  return (
    <div className="space-y-3">
      <div>
        <label>Gross</label>
        <input
          type="number"
          value={person.monthlySalaryGross || ''}
          onChange={(e) => update({ monthlySalaryGross: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div>
        <label>Net</label>
        <input
          type="number"
          value={person.monthlySalaryNet || ''}
          onChange={(e) => update({ monthlySalaryNet: parseFloat(e.target.value) || 0 })}
        />
      </div>
    </div>
  )
}

export function PersonExpenses({ person, onChange, displayCurrency }: PersonColumnProps) {
  const update = (partial: Partial<Person>) => onChange({ ...person, ...partial })

  const updateExpense = (index: number, expense: MonthlyExpense) => {
    const updated = [...person.monthlyFixedExpenses]
    updated[index] = expense
    update({ monthlyFixedExpenses: updated })
  }

  const addExpense = () => {
    update({ monthlyFixedExpenses: [...person.monthlyFixedExpenses, { label: '', amount: 0 }] })
  }

  const removeExpense = (index: number) => {
    update({ monthlyFixedExpenses: person.monthlyFixedExpenses.filter((_, i) => i !== index) })
  }

  const total = person.monthlyFixedExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <div className="space-y-2">
        {person.monthlyFixedExpenses.map((expense, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              className="flex-1"
              value={expense.label}
              onChange={(e) => updateExpense(i, { ...expense, label: e.target.value })}
              placeholder="e.g. Rent"
            />
            <input
              className="w-24"
              type="number"
              value={expense.amount || ''}
              onChange={(e) => updateExpense(i, { ...expense, amount: parseFloat(e.target.value) || 0 })}
            />
            <button onClick={() => removeExpense(i)} className="text-stone-500 hover:text-rose-400 px-1">
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <button onClick={addExpense} className="text-sm text-amber-400 hover:text-amber-300">+ Add</button>
        <span className="text-sm text-stone-400 font-mono">{formatCurrency(total, displayCurrency)}</span>
      </div>
    </div>
  )
}

export function PersonVariableSpend({ person, onChange }: PersonColumnProps) {
  const update = (partial: Partial<Person>) => onChange({ ...person, ...partial })

  return (
    <input
      type="number"
      value={person.monthlyVariableSpend || ''}
      onChange={(e) => update({ monthlyVariableSpend: parseFloat(e.target.value) || 0 })}
    />
  )
}
