export type Currency = "AED" | "GBP" | "USD"

export type GoalCategory =
  | "home_purchase"
  | "wedding"
  | "emergency_fund"
  | "big_purchase"
  | "retirement_fire"

export interface MonthlyExpense {
  label: string
  amount: number
}

export interface PotContribution {
  potId: string
  amount: number
}

export interface Person {
  name: string
  monthlySalaryGross: number
  monthlySalaryNet: number
  monthlyFixedExpenses: MonthlyExpense[]
  monthlyVariableSpend: number
  monthlyContributions: PotContribution[]
}

export interface Property {
  id: string
  label: string
  currency: Currency
  currentValue: number
  mortgageOutstanding: number
  monthlyRentalIncome: number
  monthlyMortgagePayment: number
  annualMaintenanceCost: number
}

export interface SavingsPot {
  id: string
  label: string
  currency: Currency
  currentBalance: number
  targetBalance: number
  linkedGoalId: string | null
}

export interface Goal {
  id: string
  label: string
  category: GoalCategory
  targetAmount: number
  currency: Currency
  targetDate: string
  linkedPotIds: string[]
  notes: string
}

export interface NetWorthSnapshot {
  date: string
  totalAssetsAED: number
  totalLiabilitiesAED: number
  netWorthAED: number
}

export interface FireInputs {
  annualExpenses: number
  currentInvestments: number
  monthlyContribution: number
  annualReturn: number
  targetYears: number
  inflationRate: number
  withdrawalRate: number
}

export interface VaultData {
  meta: {
    version: string
    lastSaved: string
    displayCurrency: Currency
    fxRates: {
      AED_GBP: number
      AED_USD: number
    }
  }
  people: {
    person1: Person
    person2: Person
  }
  property: Property[]
  savingsPots: SavingsPot[]
  goals: Goal[]
  netWorthSnapshots: NetWorthSnapshot[]
  fire: FireInputs
}
