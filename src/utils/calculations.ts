import type { Person, Property, Goal, SavingsPot, VaultData } from '../types/vault.ts'
import { toAED, type FxRates } from './currency.ts'

export function calcPersonMonthlyOutgoings(person: Person): number {
  const fixedTotal = person.monthlyFixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const contributionTotal = person.monthlyContributions.reduce((sum, c) => sum + c.amount, 0)
  return fixedTotal + person.monthlyVariableSpend + contributionTotal
}

export function calcPersonMonthlySpending(person: Person): number {
  const fixedTotal = person.monthlyFixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  return fixedTotal + person.monthlyVariableSpend
}

export function calcPersonMonthlySurplus(person: Person): number {
  return person.monthlySalaryNet - calcPersonMonthlyOutgoings(person)
}

export function calcPropertyEquity(property: Property): number {
  return property.currentValue - property.mortgageOutstanding
}

export function calcPropertyGrossYield(property: Property): number {
  if (property.currentValue === 0) return 0
  return ((property.monthlyRentalIncome * 12) / property.currentValue) * 100
}

export function calcPropertyMonthlyCashflow(property: Property): number {
  return (
    property.monthlyRentalIncome -
    property.monthlyMortgagePayment -
    property.annualMaintenanceCost / 12
  )
}

export function calcGoalProgress(
  goal: Goal,
  allPots: SavingsPot[],
  rates: FxRates,
): { currentAmount: number; percentage: number } {
  const linkedPots = allPots.filter((p) => goal.linkedPotIds.includes(p.id))
  const currentAmount = linkedPots.reduce(
    (sum, p) => sum + toAED(p.currentBalance, p.currency, rates),
    0,
  )
  const targetInAED = toAED(goal.targetAmount, goal.currency, rates)
  const percentage = targetInAED > 0 ? Math.min((currentAmount / targetInAED) * 100, 100) : 0
  return { currentAmount, percentage }
}

export function calcGoalMonthlyInflow(
  goal: Goal,
  person1: Person,
  person2: Person,
): number {
  const linkedPotIds = new Set(goal.linkedPotIds)
  let total = 0
  for (const person of [person1, person2]) {
    for (const contrib of person.monthlyContributions) {
      if (linkedPotIds.has(contrib.potId)) {
        total += contrib.amount // already in AED
      }
    }
  }
  return total
}

export function calcMonthsToTarget(remaining: number, monthlyInflow: number): number | null {
  if (monthlyInflow <= 0) return null
  if (remaining <= 0) return 0
  return Math.ceil(remaining / monthlyInflow)
}

export function calcProjectedDate(months: number | null): string | null {
  if (months === null) return null
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

export function calcNetWorth(data: VaultData): {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
} {
  const rates = data.meta.fxRates

  let totalAssets = 0
  let totalLiabilities = 0

  for (const pot of data.savingsPots) {
    totalAssets += toAED(pot.currentBalance, pot.currency, rates)
  }

  for (const prop of data.property) {
    totalAssets += toAED(prop.currentValue, prop.currency, rates)
    totalLiabilities += toAED(prop.mortgageOutstanding, prop.currency, rates)
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  }
}

export function calcFireNumber(annualExpenses: number): number {
  return annualExpenses * 25
}

export function calcYearsToFire(
  currentInvestments: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  fireNumber: number,
): number | null {
  if (currentInvestments >= fireNumber) return 0
  if (monthlyContribution <= 0 && annualReturnPercent <= 0) return null

  const monthlyReturn = annualReturnPercent / 100 / 12
  let balance = currentInvestments
  let months = 0
  const maxMonths = 50 * 12

  while (balance < fireNumber && months < maxMonths) {
    balance = balance * (1 + monthlyReturn) + monthlyContribution
    months++
  }

  if (months >= maxMonths) return null
  return months / 12
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
