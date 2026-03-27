import type { VaultData, Person } from '../types/vault.ts'

function createEmptyPerson(name: string): Person {
  return {
    name,
    monthlySalaryGross: 0,
    monthlySalaryNet: 0,
    monthlyFixedExpenses: [],
    monthlyVariableSpend: 0,
    monthlyContributions: [],
  }
}

export function createEmptyVault(): VaultData {
  return {
    meta: {
      version: "1.0",
      lastSaved: new Date().toISOString(),
      displayCurrency: "AED",
      fxRates: {
        AED_GBP: 0.21,
        AED_USD: 0.27,
      },
    },
    people: {
      person1: createEmptyPerson("Person 1"),
      person2: createEmptyPerson("Person 2"),
    },
    property: [],
    savingsPots: [],
    goals: [],
    netWorthSnapshots: [],
    fire: {
      annualExpenses: 0,
      currentInvestments: 0,
      monthlyContribution: 0,
      annualReturn: 7,
      targetYears: 20,
      inflationRate: 3,
      withdrawalRate: 4,
    },
  }
}
