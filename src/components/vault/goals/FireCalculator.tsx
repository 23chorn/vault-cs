import { useState } from 'react'
import { Card } from '../../shared/Card.tsx'
import { formatCurrency } from '../../../utils/currency.ts'
import { calcFireNumber, calcYearsToFire } from '../../../utils/calculations.ts'

export function FireCalculator() {
  const [annualExpenses, setAnnualExpenses] = useState(0)
  const [currentInvestments, setCurrentInvestments] = useState(0)
  const [monthlyContribution, setMonthlyContribution] = useState(0)
  const [annualReturn, setAnnualReturn] = useState(7)

  const fireNumber = calcFireNumber(annualExpenses)
  const years = calcYearsToFire(currentInvestments, monthlyContribution, annualReturn, fireNumber)

  const projectedDate = years !== null
    ? new Date(Date.now() + years * 365.25 * 86400000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">FIRE Calculator</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Annual Expenses (AED)</label>
          <input
            type="number"
            value={annualExpenses || ''}
            onChange={(e) => setAnnualExpenses(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label>Current Investments (AED)</label>
          <input
            type="number"
            value={currentInvestments || ''}
            onChange={(e) => setCurrentInvestments(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label>Monthly Contribution (AED)</label>
          <input
            type="number"
            value={monthlyContribution || ''}
            onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label>Expected Annual Return (%)</label>
          <input
            type="number"
            step="0.1"
            value={annualReturn || ''}
            onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-stone-700/50 rounded-lg p-4">
        <div>
          <div className="text-sm text-stone-400">FIRE Number</div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {formatCurrency(fireNumber, 'AED')}
          </div>
          <div className="text-xs text-stone-500">25x annual expenses</div>
        </div>
        <div>
          <div className="text-sm text-stone-400">Years to FIRE</div>
          <div className="text-lg font-bold">
            {years !== null ? `${years.toFixed(1)} years` : '—'}
          </div>
        </div>
        <div>
          <div className="text-sm text-stone-400">Projected Date</div>
          <div className="text-lg font-bold">
            {projectedDate || '—'}
          </div>
        </div>
      </div>
    </Card>
  )
}
