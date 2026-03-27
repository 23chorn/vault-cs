import { useState } from 'react'
import SliderInput from '../shared/SliderInput'
import SectionHeader from '../shared/SectionHeader'
import { formatCurrency } from '../../utils/format'

function ConfigSection({ title, children, onReset }) {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{title}</h3>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-text-muted hover:text-accent-red transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export default function PropertyConfig({ property, updateField, resetSection }) {
  const { meta, mortgage, rental, costs, tax, projections } = property
  const [newCostLabel, setNewCostLabel] = useState('')
  const [newCostAmount, setNewCostAmount] = useState('')
  const [newCostYear, setNewCostYear] = useState(2024)

  const addAdditionalCost = () => {
    if (!newCostLabel || !newCostAmount) return
    const updated = [...costs.additionalCosts, { label: newCostLabel, amount: parseFloat(newCostAmount), year: newCostYear }]
    updateField('costs', 'additionalCosts', updated)
    setNewCostLabel('')
    setNewCostAmount('')
  }

  const removeAdditionalCost = (index) => {
    const updated = costs.additionalCosts.filter((_, i) => i !== index)
    updateField('costs', 'additionalCosts', updated)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader title="Property Configuration" subtitle="Edit all property inputs — changes update calculations in real time" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Property Details */}
        <ConfigSection title="Property Details" onReset={() => resetSection('meta')}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-secondary">Property Name</label>
              <input
                type="text"
                value={meta.name}
                onChange={(e) => updateField('meta', 'name', e.target.value)}
                className="w-full mt-1 bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Address</label>
              <input
                type="text"
                value={meta.address}
                onChange={(e) => updateField('meta', 'address', e.target.value)}
                className="w-full mt-1 bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-text-secondary">Type</label>
                <select
                  value={meta.type}
                  onChange={(e) => updateField('meta', 'type', e.target.value)}
                  className="w-full mt-1 bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                >
                  <option value="detached">Detached</option>
                  <option value="semi-detached">Semi-detached</option>
                  <option value="mid-terrace">Mid-terrace</option>
                  <option value="end-terrace">End-terrace</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-text-secondary">EPC Rating</label>
                <select
                  value={meta.epcRating}
                  onChange={(e) => updateField('meta', 'epcRating', e.target.value)}
                  className="w-full mt-1 bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <SliderInput label="Bedrooms" value={meta.bedrooms} onChange={(v) => updateField('meta', 'bedrooms', v)} min={1} max={6} step={1} />
            <SliderInput label="Size (sqm)" value={meta.sqm} onChange={(v) => updateField('meta', 'sqm', v)} min={20} max={300} step={1} suffix="sqm" />
            <SliderInput label="Purchase Price" value={meta.purchasePrice} onChange={(v) => updateField('meta', 'purchasePrice', v)} min={50000} max={1000000} step={5000} prefix="£" />
            <SliderInput label="Current Estimated Value" value={meta.currentEstimatedValue} onChange={(v) => updateField('meta', 'currentEstimatedValue', v)} min={50000} max={1000000} step={5000} prefix="£" />
          </div>
        </ConfigSection>

        {/* Mortgage */}
        <ConfigSection title="Mortgage" onReset={() => resetSection('mortgage')}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-secondary">Mortgage Type</label>
              <select
                value={mortgage.type}
                onChange={(e) => updateField('mortgage', 'type', e.target.value)}
                className="w-full mt-1 bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
              >
                <option value="interest-only">Interest Only</option>
                <option value="repayment">Repayment</option>
              </select>
            </div>
            <SliderInput label="Balance" value={mortgage.balance} onChange={(v) => updateField('mortgage', 'balance', v)} min={0} max={500000} step={1000} prefix="£" />
            <SliderInput label="Interest Rate" value={mortgage.currentRate} onChange={(v) => updateField('mortgage', 'currentRate', v)} min={1} max={10} step={0.1} suffix="%" decimals={1} />
            <SliderInput label="Renewal Year" value={mortgage.renewalYear} onChange={(v) => updateField('mortgage', 'renewalYear', v)} min={2024} max={2040} step={1} />
          </div>
        </ConfigSection>

        {/* Rental Income */}
        <ConfigSection title="Rental Income" onReset={() => resetSection('rental')}>
          <SliderInput label="Monthly Rent" value={rental.monthlyRent} onChange={(v) => updateField('rental', 'monthlyRent', v)} min={300} max={5000} step={25} prefix="£" />
          <SliderInput label="Target Rent" value={rental.targetRent} onChange={(v) => updateField('rental', 'targetRent', v)} min={300} max={5000} step={25} prefix="£" />
          <SliderInput label="Rent Growth Rate" value={rental.rentGrowthRate} onChange={(v) => updateField('rental', 'rentGrowthRate', v)} min={0} max={10} step={0.5} suffix="%" decimals={1} />
          <SliderInput label="Void Months / Year" value={rental.voidMonthsPerYear} onChange={(v) => updateField('rental', 'voidMonthsPerYear', v)} min={0} max={6} step={0.5} decimals={1} />
        </ConfigSection>

        {/* Running Costs */}
        <ConfigSection title="Running Costs" onReset={() => resetSection('costs')}>
          <SliderInput label="Management Fee" value={costs.managementFeePercent} onChange={(v) => updateField('costs', 'managementFeePercent', v)} min={0} max={20} step={0.5} suffix="%" decimals={1} />
          <SliderInput label="Tenant Find Fee (annualised)" value={costs.tenantFindFeeAnnualised} onChange={(v) => updateField('costs', 'tenantFindFeeAnnualised', v)} min={0} max={2000} step={25} prefix="£" />
          <SliderInput label="Compliance (annual)" value={costs.complianceAnnual} onChange={(v) => updateField('costs', 'complianceAnnual', v)} min={0} max={2000} step={50} prefix="£" />
          <SliderInput label="Insurance (annual)" value={costs.insuranceAnnual} onChange={(v) => updateField('costs', 'insuranceAnnual', v)} min={0} max={3000} step={25} prefix="£" />
          <SliderInput label="Maintenance (% of value)" value={costs.maintenancePercent} onChange={(v) => updateField('costs', 'maintenancePercent', v)} min={0} max={5} step={0.1} suffix="%" decimals={1} />
          <SliderInput label="EPC Upgrade Cost" value={costs.epcUpgradeCost} onChange={(v) => updateField('costs', 'epcUpgradeCost', v)} min={0} max={30000} step={500} prefix="£" />
          <SliderInput label="EPC Upgrade Year" value={costs.epcUpgradeYear} onChange={(v) => updateField('costs', 'epcUpgradeYear', v)} min={1} max={20} step={1} />

          {/* Additional costs table */}
          <div className="mt-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Additional Costs</p>
            {costs.additionalCosts.map((cost, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-sm text-text-secondary truncate">{cost.label}</span>
                <span className="font-mono text-sm text-text-primary">{formatCurrency(cost.amount)}</span>
                <span className="text-xs text-text-muted">{cost.year}</span>
                <button onClick={() => removeAdditionalCost(i)} className="text-accent-red text-xs hover:text-accent-red/80">x</button>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mt-3">
              <input
                type="text"
                placeholder="Label"
                value={newCostLabel}
                onChange={(e) => setNewCostLabel(e.target.value)}
                className="flex-1 bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newCostAmount}
                  onChange={(e) => setNewCostAmount(e.target.value)}
                  className="w-24 bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={newCostYear}
                  onChange={(e) => setNewCostYear(parseInt(e.target.value))}
                  className="w-20 bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                />
                <button onClick={addAdditionalCost} className="text-xs bg-accent-blue/10 text-accent-blue px-3 py-1.5 rounded hover:bg-accent-blue/20 transition-colors whitespace-nowrap">
                  Add
                </button>
              </div>
            </div>
          </div>
        </ConfigSection>

        {/* Tax Position */}
        <ConfigSection title="Tax Position" onReset={() => resetSection('tax')}>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-text-secondary">UK Citizen</label>
            <button
              onClick={() => updateField('tax', 'ownerIsUKCitizen', !tax.ownerIsUKCitizen)}
              className={`w-10 h-5 rounded-full transition-colors ${tax.ownerIsUKCitizen ? 'bg-accent-green' : 'bg-bg-elevated'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${tax.ownerIsUKCitizen ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-text-secondary">Claims Personal Allowance</label>
            <button
              onClick={() => updateField('tax', 'claimsPersonalAllowance', !tax.claimsPersonalAllowance)}
              className={`w-10 h-5 rounded-full transition-colors ${tax.claimsPersonalAllowance ? 'bg-accent-green' : 'bg-bg-elevated'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${tax.claimsPersonalAllowance ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-text-secondary">NRLS Registered</label>
            <button
              onClick={() => updateField('tax', 'nrlsRegistered', !tax.nrlsRegistered)}
              className={`w-10 h-5 rounded-full transition-colors ${tax.nrlsRegistered ? 'bg-accent-green' : 'bg-bg-elevated'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${tax.nrlsRegistered ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <label className="text-sm text-text-secondary">Residence Country</label>
            <input
              type="text"
              value={tax.residenceCountry}
              onChange={(e) => updateField('tax', 'residenceCountry', e.target.value)}
              className="w-full mt-1 bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>
          <SliderInput label="Personal Allowance" value={tax.personalAllowance} onChange={(v) => updateField('tax', 'personalAllowance', v)} min={0} max={20000} step={100} prefix="£" />
          <SliderInput label="Tax Rate" value={tax.taxRate} onChange={(v) => updateField('tax', 'taxRate', v)} min={0} max={45} step={1} suffix="%" />
        </ConfigSection>

        {/* Projections */}
        <ConfigSection title="Projections" onReset={() => resetSection('projections')}>
          <SliderInput label="House Price Growth" value={projections.houseGrowthRate} onChange={(v) => updateField('projections', 'houseGrowthRate', v)} min={0} max={10} step={0.1} suffix="%" decimals={1} />
          <SliderInput label="Mortgage Clear Year" value={projections.mortgageClearYear} onChange={(v) => updateField('projections', 'mortgageClearYear', v)} min={5} max={35} step={1} />
          <SliderInput label="Phase 2 Years (post-mortgage)" value={projections.phase2Years} onChange={(v) => updateField('projections', 'phase2Years', v)} min={0} max={20} step={1} />
          <SliderInput label="CGT Rate" value={projections.cgtRate} onChange={(v) => updateField('projections', 'cgtRate', v)} min={0} max={40} step={1} suffix="%" />
        </ConfigSection>
      </div>
    </div>
  )
}
