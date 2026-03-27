import { useState } from 'react'
import SectionHeader from '../shared/SectionHeader'
import { formatCurrency } from '../../utils/format'
import { calcMonthlyMortgage, calcAnnualCosts, calcSection24Tax } from '../../utils/finance'

function Row({ label, monthly, annual, indent = false, bold = false, color }) {
  const textClass = color === 'green' ? 'text-accent-green' : color === 'red' ? 'text-accent-red' : 'text-text-primary'
  const labelClass = indent ? 'pl-2 sm:pl-4 text-text-secondary' : bold ? 'font-semibold text-text-primary' : 'text-text-secondary'

  return (
    <tr className="border-b border-border/50">
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
                ? 'border-accent-purple/30 text-accent-purple bg-accent-purple/10'
                : 'border-border text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            {showS24 ? 'S24 Tax View' : 'Cash P&L View'}
          </button>
        }
      />

      {!tax.nrlsRegistered && (
        <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-4">
          <p className="text-sm font-medium text-accent-red">NRLS Warning</p>
          <p className="text-xs text-text-secondary mt-1">
            Without NRLS registration, your letting agent must withhold basic rate tax (20%) from rent before paying you.
          </p>
        </div>
      )}

      <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-text-muted uppercase tracking-wider py-2">Item</th>
              <th className="text-right text-xs text-text-muted uppercase tracking-wider py-2">Monthly</th>
              <th className="text-right text-xs text-text-muted uppercase tracking-wider py-2">Annual</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Gross Rental Income" monthly={rental.monthlyRent} annual={rental.monthlyRent * 12} bold color="green" />
            <Row label={`Void periods (${rental.voidMonthsPerYear} month${rental.voidMonthsPerYear !== 1 ? 's' : ''}/yr)`} monthly={-(rental.monthlyRent * rental.voidMonthsPerYear) / 12} annual={-(rental.monthlyRent * rental.voidMonthsPerYear)} indent />
            <Row label="Net Rental Income" monthly={annualRent / 12} annual={annualRent} bold />

            <tr><td colSpan={3} className="pt-4 pb-1 text-xs text-text-muted uppercase tracking-wider">Deductions</td></tr>
            <Row label={`Management (${costs.managementFeePercent}%)`} monthly={-managementFee / 12} annual={-managementFee} indent />
            <Row label="Tenant Find Fee" monthly={-tenantFindFee / 12} annual={-tenantFindFee} indent />
            <Row label="Compliance" monthly={-compliance / 12} annual={-compliance} indent />
            <Row label="Insurance" monthly={-insurance / 12} annual={-insurance} indent />
            <Row label={`Maintenance (${costs.maintenancePercent}%)`} monthly={-maintenance / 12} annual={-maintenance} indent />
            <Row label="Total Operating Costs" monthly={-totalCosts / 12} annual={-totalCosts} bold color="red" />

            <tr><td colSpan={3} className="pt-4 pb-1 text-xs text-text-muted uppercase tracking-wider">Mortgage</td></tr>
            <Row label={`${mortgage.type === 'interest-only' ? 'Interest Only' : 'Repayment'} @ ${mortgage.currentRate}%`} monthly={-monthlyMortgage} annual={-annualMortgage} indent />

            <tr className="border-t-2 border-border">
              <td colSpan={3} className="pt-3" />
            </tr>
            <Row label="Pre-Tax Net Cashflow" monthly={preTaxProfit / 12} annual={preTaxProfit} bold color={preTaxProfit >= 0 ? 'green' : 'red'} />

            {showS24 && (
              <>
                <tr><td colSpan={3} className="pt-4 pb-1 text-xs text-text-muted uppercase tracking-wider">Section 24 Tax Calculation</td></tr>
                <Row label="Taxable Profit (S24)" monthly={s24.taxableProfit / 12} annual={s24.taxableProfit} indent />
                <Row label={`Gross Tax (${tax.taxRate}%)`} monthly={-s24.grossTax / 12} annual={-s24.grossTax} indent color="red" />
                <Row label="Mortgage Interest Tax Credit (20%)" monthly={s24.taxCredit / 12} annual={s24.taxCredit} indent color="green" />
                <Row label="Net Tax Liability" monthly={-s24.netTax / 12} annual={-s24.netTax} bold color="red" />
              </>
            )}

            <tr className="border-t-2 border-accent-blue/30">
              <td colSpan={3} className="pt-3" />
            </tr>
            <Row label="After-Tax Net Cashflow" monthly={afterTaxProfit / 12} annual={afterTaxProfit} bold color={afterTaxProfit >= 0 ? 'green' : 'red'} />
          </tbody>
        </table>
      </div>

      {showS24 && (
        <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Section 24 Walkthrough</h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-text-secondary">1. Total rental income</span>
              <span className="font-mono text-text-primary shrink-0">{formatCurrency(annualRent)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-secondary">2. Less allowable expenses (NOT mortgage interest)</span>
              <span className="font-mono text-text-primary shrink-0">{formatCurrency(-totalCosts)}</span>
            </div>
            {tax.claimsPersonalAllowance && (
              <div className="flex justify-between gap-2">
                <span className="text-text-secondary">3. Less personal allowance</span>
                <span className="font-mono text-text-primary shrink-0">{formatCurrency(-tax.personalAllowance)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-border pt-2">
              <span className="text-text-primary font-medium">= Taxable profit</span>
              <span className="font-mono text-text-primary shrink-0">{formatCurrency(s24.taxableProfit)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-secondary">4. Tax at {tax.taxRate}%</span>
              <span className="font-mono text-accent-red shrink-0">{formatCurrency(s24.grossTax)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-secondary">5. Less 20% tax credit on mortgage interest ({formatCurrency(mortgageInterest)})</span>
              <span className="font-mono text-accent-green shrink-0">{formatCurrency(-s24.taxCredit)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-2">
              <span className="text-text-primary font-medium">= Net tax payable</span>
              <span className="font-mono text-accent-red shrink-0">{formatCurrency(s24.netTax)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
