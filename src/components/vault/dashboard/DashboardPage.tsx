import { useVault } from '../../../hooks/useVault.ts'
import { Card } from '../../shared/Card.tsx'
import { CurrencyDisplay } from '../../shared/CurrencyDisplay.tsx'
import { ProgressBar } from '../../shared/ProgressBar.tsx'
import {
  calcNetWorth,
  calcPersonMonthlySurplus,
  calcPersonMonthlyOutgoings,
  calcGoalProgress,
  calcGoalMonthlyInflow,
  calcMonthsToTarget,
  calcPropertyMonthlyCashflow,
  calcPropertyEquity,
  formatDate,
} from '../../../utils/calculations.ts'
import { toAED, formatInDisplayCurrency } from '../../../utils/currency.ts'

export function DashboardPage() {
  const { state } = useVault()
  const rates = state.meta.fxRates
  const dc = state.meta.displayCurrency
  const fmt = (aed: number) => formatInDisplayCurrency(aed, dc, rates)
  const { netWorth } = calcNetWorth(state)

  const p1 = state.people.person1
  const p2 = state.people.person2
  const p1Surplus = calcPersonMonthlySurplus(p1)
  const p2Surplus = calcPersonMonthlySurplus(p2)
  const combinedSurplus =
    toAED(p1Surplus, dc, rates) + toAED(p2Surplus, dc, rates)

  const totalPropertyCashflow = state.property.reduce(
    (sum, p) => sum + toAED(calcPropertyMonthlyCashflow(p), p.currency, rates),
    0,
  )

  const totalIncome =
    toAED(p1.monthlySalaryNet, dc, rates) +
    toAED(p2.monthlySalaryNet, dc, rates) +
    state.property.reduce((sum, p) => sum + toAED(p.monthlyRentalIncome, p.currency, rates), 0)

  const totalOutgoings =
    toAED(calcPersonMonthlyOutgoings(p1), dc, rates) +
    toAED(calcPersonMonthlyOutgoings(p2), dc, rates) +
    state.property.reduce(
      (sum, p) =>
        sum +
        toAED(p.monthlyMortgagePayment + p.annualMaintenanceCost / 12, p.currency, rates),
      0,
    )

  const lastSnapshot = state.netWorthSnapshots[state.netWorthSnapshots.length - 1]
  const delta = lastSnapshot ? netWorth - lastSnapshot.netWorthAED : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-mono font-mono">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-stone-400 mb-1">Net Worth</div>
          <CurrencyDisplay amount={netWorth} currency="AED" fxRates={rates} displayCurrency={dc} size="lg" />
          {delta !== null && (
            <div className={`text-sm font-mono mt-2 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {delta >= 0 ? '+' : ''}{fmt(delta)} vs last snapshot
            </div>
          )}
        </Card>

        <Card>
          <div className="text-sm text-stone-400 mb-1">Monthly Cash Flow</div>
          <div className="text-2xl font-bold font-mono font-mono">
            <span className={combinedSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {fmt(combinedSurplus)}
            </span>
          </div>
          <div className="text-xs text-stone-500 font-mono mt-1">
            Income: {fmt(totalIncome)} &middot; Out: {fmt(totalOutgoings)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-stone-400 mb-1">Property</div>
          <div className="text-lg font-semibold">
            {state.property.length} {state.property.length === 1 ? 'property' : 'properties'}
          </div>
          <div className="text-sm text-stone-400 font-mono mt-1">
            Equity: {fmt(state.property.reduce((s, p) => s + toAED(calcPropertyEquity(p), p.currency, rates), 0))}
          </div>
          <div className={`text-sm font-mono ${totalPropertyCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Cashflow: {fmt(totalPropertyCashflow)}/mo
          </div>
        </Card>
      </div>

      {state.goals.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Goals Progress</h2>
          <div className="space-y-4">
            {state.goals.map((goal) => {
              const { currentAmount, percentage } = calcGoalProgress(goal, state.savingsPots, rates)
              const targetInAED = toAED(goal.targetAmount, goal.currency, rates)
              const monthlyInflow = calcGoalMonthlyInflow(goal, p1, p2, rates, dc)
              const remaining = targetInAED - currentAmount
              const months = calcMonthsToTarget(remaining, monthlyInflow)

              return (
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{goal.label}</span>
                    <span className="text-sm text-stone-400 font-mono">
                      {percentage.toFixed(0)}% &middot; {fmt(remaining)} remaining
                    </span>
                  </div>
                  <ProgressBar current={currentAmount} target={targetInAED} color="bg-emerald-500" />
                  <div className="flex justify-between mt-1 text-xs text-stone-500">
                    <span>Target: {formatDate(goal.targetDate)}</span>
                    <span>{months !== null ? `~${months} months to go` : 'No inflow'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {state.savingsPots.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Savings Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.savingsPots.map((pot) => (
              <div key={pot.id} className="bg-stone-700/50 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">{pot.label}</div>
                <CurrencyDisplay amount={pot.currentBalance} currency={pot.currency} fxRates={rates} displayCurrency={dc} size="sm" />
                {pot.targetBalance > 0 && (
                  <div className="mt-2">
                    <ProgressBar current={pot.currentBalance} target={pot.targetBalance} />
                    <div className="text-xs text-stone-500 font-mono mt-1">
                      Target: {formatInDisplayCurrency(toAED(pot.targetBalance, pot.currency, rates), dc, rates)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {state.goals.length === 0 && state.savingsPots.length === 0 && state.property.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-stone-400 text-lg mb-2">Welcome to Vault</p>
          <p className="text-stone-500 text-sm">
            Start by adding your financial details in the Finances section.
          </p>
        </Card>
      )}
    </div>
  )
}
