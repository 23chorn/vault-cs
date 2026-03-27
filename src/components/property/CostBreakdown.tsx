import { useState } from 'react'
import SectionHeader from '../shared/SectionHeader'
import { formatCurrency } from '../../utils/format'
import { calcMonthlyMortgage, calcAnnualCosts, calcSection24Tax } from '../../utils/finance'

function Row({ label, monthly, annual, indent = false, bold = false, color = null }) {
  const textClass = color === 'green' ? 'text-emerald-400' : color === 'red' ? 'text-rose-400' : 'text-stone-100'
  const labelClass = indent ? 'pl-2 sm:pl-4 text-stone-400' : bold ? 'font-semibold text-stone-100' : 'text-stone-400'

  return (
    <tr className="border-b border-stone-700/50">
      <td className={`py-2 sm:py-2.5 text-xs sm:text-sm ${labelClass}`}>{label}</td>
      <td className={`py-2 sm:py-2.5 text-xs sm:text-sm font-mono text-right pl-2 whitespace-nowrap ${bold ? 'font-medium' : ''} ${textClass}`}>{formatCurrency(monthly)}</td>
      <td className={`py-2 sm:py-2.5 text-xs sm:text-sm font-mono text-right pl-2 whitespace-nowrap ${bold ? 'font-medium' : ''} ${textClass}`}>{formatCurrency(annual)}</td>
    </tr>
  )
}

export default function CostBreakdown({ property }) {
  const [showS24, setShowS24] = useState(false)
  const { mortgage, rental, costs, tax } = property

  const monthlyMortgage = calcMonthlyMortgage(property)
  const { annualRent, managementFee, tenantFindFee, compliance, insurance, maintenance, totalCosts } = calcAnnualCosts(property)

  const annualMortgage = monthlyMortgage * 12
  const mortgageInterest = mortgage.type === 'interest-only'
    ? annualMortgage
    : mortgage.balance * (mortgage.currentRate / 100)

  const s24 = calcSection24Tax(annualRent, totalCosts, mortgageInterest, tax.taxRate, tax.personalAllowance, tax.claimsPersonalAllowance)

  const preTaxProfit = annualRent - totalCosts - annualMortgage
  const afterTaxProfit = preTaxProfit - s24.netTax

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Cost Breakdown"
        subtitle="Annual P&L with all costs itemised"
        action={
          <button
            onClick={() => setShowS24(!showS24)}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
              showS24
                ? 'border-purple-400/30 text-purple-400 bg-purple-400/10'
                : 'border-stone-700 text-stone-400 hover:bg-stone-700'
            }`}
          >
            {showS24 ? 'S24 Tax View' : 'Cash P&L View'}
          </button>
        }
      />

      {!tax.nrlsRegistered && (
        <div className="bg-rose-600/10 border border-rose-400/20 rounded-xl p-4">
          <p className="text-sm font-medium text-rose-400">NRLS Warning</p>
          <p className="text-xs text-stone-400 mt-1">
            Without NRLS registration, your letting agent must withhold basic rate tax (20%) from rent before paying you.
          </p>
        </div>
      )}

      <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-700">
              <th className="text-left text-xs text-stone-500 uppercase tracking-wider py-2">Item</th>
              <th className="text-right text-xs text-stone-500 uppercase tracking-wider py-2">Monthly</th>
              <th className="text-right text-xs text-stone-500 uppercase tracking-wider py-2">Annual</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Gross Rental Income" monthly={rental.monthlyRent} annual={rental.monthlyRent * 12} bold color="green" />
            <Row label={`Void periods (${rental.voidMonthsPerYear} month${rental.voidMonthsPerYear !== 1 ? 's' : ''}/yr)`} monthly={-(rental.monthlyRent * rental.voidMonthsPerYear) / 12} annual={-(rental.monthlyRent * rental.voidMonthsPerYear)} indent />
            <Row label="Net Rental Income" monthly={annualRent / 12} annual={annualRent} bold />

            <tr><td colSpan={3} className="pt-4 pb-1 text-xs text-stone-500 uppercase tracking-wider">Deductions</td></tr>
            <Row label={`Management (${costs.managementFeePercent}%)`} monthly={-managementFee / 12} annual={-managementFee} indent />
            <Row label="Tenant Find Fee" monthly={-tenantFindFee / 12} annual={-tenantFindFee} indent />
            <Row label="Compliance" monthly={-compliance / 12} annual={-compliance} indent />
            <Row label="Insurance" monthly={-insurance / 12} annual={-insurance} indent />
            <Row label={`Maintenance (${costs.maintenancePercent}%)`} monthly={-maintenance / 12} annual={-maintenance} indent />
            <Row label="Total Operating Costs" monthly={-totalCosts / 12} annual={-totalCosts} bold color="red" />

            <tr><td colSpan={3} className="pt-4 pb-1 text-xs text-stone-500 uppercase tracking-wider">Mortgage</td></tr>
            <Row label={`${mortgage.type === 'interest-only' ? 'Interest Only' : 'Repayment'} @ ${mortgage.currentRate}%`} monthly={-monthlyMortgage} annual={-annualMortgage} bold color="red" indent />

            <tr className="border-t-2 border-stone-700">
              <td colSpan={3} className="pt-3" />
            </tr>
            <Row label="Pre-Tax Net Cashflow" monthly={preTaxProfit / 12} annual={preTaxProfit} bold color={preTaxProfit >= 0 ? 'green' : 'red'} />

            {showS24 && (
              <>
                <tr><td colSpan={3} className="pt-4 pb-1 text-xs text-stone-500 uppercase tracking-wider">Section 24 Tax Calculation</td></tr>
                <Row label="Taxable Profit (S24)" monthly={s24.taxableProfit / 12} annual={s24.taxableProfit} indent />
                <Row label={`Gross Tax (${tax.taxRate}%)`} monthly={-s24.grossTax / 12} annual={-s24.grossTax} indent color="red" />
                <Row label="Mortgage Interest Tax Credit (20%)" monthly={s24.taxCredit / 12} annual={s24.taxCredit} indent color="green" />
                <Row label="Net Tax Liability" monthly={-s24.netTax / 12} annual={-s24.netTax} bold color="red" />
              </>
            )}

            <tr className="border-t-2 border-rose-500/30">
              <td colSpan={3} className="pt-3" />
            </tr>
            <Row label="After-Tax Net Cashflow" monthly={afterTaxProfit / 12} annual={afterTaxProfit} bold color={afterTaxProfit >= 0 ? 'green' : 'red'} />
          </tbody>
        </table>
      </div>

      {showS24 && (
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">Section 24 Walkthrough</h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">1. Total rental income</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(annualRent)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">2. Less allowable expenses (NOT mortgage interest)</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(-totalCosts)}</span>
            </div>
            {tax.claimsPersonalAllowance && (
              <div className="flex justify-between gap-2">
                <span className="text-stone-400">3. Less personal allowance</span>
                <span className="font-mono text-stone-100 shrink-0">{formatCurrency(-tax.personalAllowance)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-stone-700 pt-2">
              <span className="text-stone-100 font-medium">= Taxable profit</span>
              <span className="font-mono text-stone-100 shrink-0">{formatCurrency(s24.taxableProfit)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">4. Tax at {tax.taxRate}%</span>
              <span className="font-mono text-rose-400 shrink-0">{formatCurrency(s24.grossTax)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-400">5. Less 20% tax credit on mortgage interest ({formatCurrency(mortgageInterest)})</span>
              <span className="font-mono text-emerald-400 shrink-0">{formatCurrency(-s24.taxCredit)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-stone-700 pt-2">
              <span className="text-stone-100 font-medium">= Net tax payable</span>
              <span className="font-mono text-rose-400 shrink-0">{formatCurrency(s24.netTax)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
