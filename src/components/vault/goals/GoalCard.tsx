import { useState } from 'react'
import { Card } from '../../shared/Card.tsx'
import { ProgressBar } from '../../shared/ProgressBar.tsx'
import { ConfirmDialog } from '../../shared/ConfirmDialog.tsx'
import { formatCurrency, formatInDisplayCurrency, toAED, type FxRates } from '../../../utils/currency.ts'
import { useVault } from '../../../hooks/useVault.ts'
import {
  calcGoalProgress,
  calcGoalMonthlyInflow,
  calcMonthsToTarget,
  calcProjectedDate,
  formatDate,
} from '../../../utils/calculations.ts'
import type { Goal, SavingsPot, VaultData } from '../../../types/vault.ts'

interface GoalCardProps {
  goal: Goal
  pots: SavingsPot[]
  people: VaultData['people']
  fxRates: FxRates
  onEdit: () => void
  onDelete: () => void
}

export function GoalCard({ goal, pots, people, fxRates, onEdit, onDelete }: GoalCardProps) {
  const { state } = useVault()
  const dc = state.meta.displayCurrency
  const fmt = (aed: number) => formatInDisplayCurrency(aed, dc, fxRates)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { currentAmount, percentage } = calcGoalProgress(goal, pots, fxRates)
  const targetInAED = toAED(goal.targetAmount, goal.currency, fxRates)
  const monthlyInflow = calcGoalMonthlyInflow(goal, people.person1, people.person2, fxRates, dc)
  const remaining = targetInAED - currentAmount
  const months = calcMonthsToTarget(remaining, monthlyInflow)
  const projectedDateStr = calcProjectedDate(months)

  const isLate = projectedDateStr && new Date(projectedDateStr) > new Date(goal.targetDate)

  return (
    <>
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-stone-100">{goal.label}</h3>
            <div className="text-xs text-stone-500"><span className="font-mono">{fmt(targetInAED)}</span> by {formatDate(goal.targetDate)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-sm text-amber-400 hover:text-amber-300">Edit</button>
            <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
          </div>
        </div>

        <ProgressBar
          current={currentAmount}
          target={targetInAED}
          color={percentage >= 100 ? 'bg-emerald-500' : 'bg-rose-500'}
        />

        <div className="flex justify-between text-xs mt-1">
          <span className="text-stone-400 font-mono">{fmt(currentAmount)} saved</span>
          <span className="text-stone-400 font-mono">{percentage.toFixed(0)}%</span>
        </div>

        <div className="mt-3 space-y-1 text-sm">
          {monthlyInflow > 0 && (
            <div className="text-stone-400 font-mono">
              Inflow: {fmt(monthlyInflow)}/mo
            </div>
          )}
          {months !== null && months > 0 && (
            <div className={isLate ? 'text-amber-400' : 'text-stone-400'}>
              {isLate && '⚠ '}Projected: {projectedDateStr ? formatDate(projectedDateStr) : '—'}
              {isLate && ' (after target)'}
            </div>
          )}
          {remaining <= 0 && (
            <div className="text-emerald-400 font-medium">Goal reached!</div>
          )}
        </div>

        {goal.notes && (
          <div className="mt-3 text-xs text-stone-500 border-t border-stone-700 pt-2">
            {goal.notes}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title="Delete Goal"
        message={`Delete "${goal.label}"? Linked pots will be unlinked.`}
      />
    </>
  )
}
