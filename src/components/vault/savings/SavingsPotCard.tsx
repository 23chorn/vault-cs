import { useState } from 'react'
import { Card } from '../../shared/Card.tsx'
import { CurrencyDisplay } from '../../shared/CurrencyDisplay.tsx'
import { ProgressBar } from '../../shared/ProgressBar.tsx'
import { ConfirmDialog } from '../../shared/ConfirmDialog.tsx'
import { formatCurrency, type FxRates } from '../../../utils/currency.ts'
import { calcMonthsToTarget } from '../../../utils/calculations.ts'
import type { SavingsPot, Goal, VaultData } from '../../../types/vault.ts'

interface SavingsPotCardProps {
  pot: SavingsPot
  goals: Goal[]
  people: VaultData['people']
  fxRates: FxRates
  onEdit: () => void
  onDelete: () => void
}

export function SavingsPotCard({ pot, goals, people, fxRates, onEdit, onDelete }: SavingsPotCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const linkedGoal = pot.linkedGoalId ? goals.find((g) => g.id === pot.linkedGoalId) : null

  const monthlyInflow = [people.person1, people.person2].reduce((sum, person) => {
    return sum + person.monthlyContributions
      .filter((c) => c.potId === pot.id)
      .reduce((s, c) => s + c.amount, 0)
  }, 0)

  const remaining = pot.targetBalance - pot.currentBalance
  const months = calcMonthsToTarget(remaining, monthlyInflow)

  return (
    <>
      <Card>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-stone-100">{pot.label}</h3>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-sm text-amber-400 hover:text-amber-300">Edit</button>
            <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
          </div>
        </div>

        <CurrencyDisplay amount={pot.currentBalance} currency={pot.currency} fxRates={fxRates} size="md" />

        {pot.targetBalance > 0 && (
          <div className="mt-3">
            <ProgressBar current={pot.currentBalance} target={pot.targetBalance} color="bg-emerald-500" />
            <div className="flex justify-between text-xs text-stone-500 mt-1">
              <span className="font-mono">{formatCurrency(pot.currentBalance, pot.currency)} / {formatCurrency(pot.targetBalance, pot.currency)}</span>
              <span>{((pot.currentBalance / pot.targetBalance) * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-1 text-sm text-stone-400">
          {monthlyInflow > 0 && (
            <div className="font-mono">Inflow: {formatCurrency(monthlyInflow, pot.currency)}/mo</div>
          )}
          {months !== null && months > 0 && (
            <div>~{months} months to target</div>
          )}
          {linkedGoal && (
            <div className="text-amber-400 text-xs">Linked: {linkedGoal.label}</div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title="Delete Savings Pot"
        message={`Delete "${pot.label}"? This will also remove any contributions to this pot.`}
      />
    </>
  )
}
