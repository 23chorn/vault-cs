import type { VaultData, Person, SavingsPot, Goal, NetWorthSnapshot, Currency } from '../types/vault.ts'
import { convertCurrency, type FxRates } from '../utils/currency.ts'

export type VaultAction =
  | { type: 'SET_VAULT'; payload: VaultData }
  | { type: 'UPDATE_META'; payload: Partial<VaultData['meta']> }
  | { type: 'UPDATE_PERSON'; payload: { key: 'person1' | 'person2'; person: Person } }
  | { type: 'ADD_POT'; payload: SavingsPot }
  | { type: 'UPDATE_POT'; payload: SavingsPot }
  | { type: 'DELETE_POT'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_SNAPSHOT'; payload: NetWorthSnapshot }
  | { type: 'DELETE_SNAPSHOT'; payload: string }

function convertPerson(person: Person, from: Currency, to: Currency, rates: FxRates): Person {
  if (from === to) return person
  const c = (amount: number) => Math.round(convertCurrency(amount, from, to, rates))
  return {
    ...person,
    monthlySalaryGross: c(person.monthlySalaryGross),
    monthlySalaryNet: c(person.monthlySalaryNet),
    monthlyFixedExpenses: person.monthlyFixedExpenses.map((e) => ({
      ...e,
      amount: c(e.amount),
    })),
    monthlyVariableSpend: c(person.monthlyVariableSpend),
    monthlyContributions: person.monthlyContributions.map((cont) => ({
      ...cont,
      amount: c(cont.amount),
    })),
  }
}

export function vaultReducer(state: VaultData, action: VaultAction): VaultData {
  switch (action.type) {
    case 'SET_VAULT':
      return {
        ...action.payload,
        meta: {
          ...action.payload.meta,
          displayCurrency: action.payload.meta.displayCurrency ?? 'AED',
          fxRates: {
            AED_GBP: action.payload.meta.fxRates?.AED_GBP ?? 0.21,
            AED_USD: action.payload.meta.fxRates?.AED_USD ?? 0.27,
          },
        },
      }

    case 'UPDATE_META': {
      const newMeta = { ...state.meta, ...action.payload }
      const oldCurrency = state.meta.displayCurrency
      const newCurrency = newMeta.displayCurrency

      // If display currency changed, convert both people's values
      if (newCurrency && newCurrency !== oldCurrency) {
        const rates = newMeta.fxRates ?? state.meta.fxRates
        return {
          ...state,
          meta: newMeta,
          people: {
            person1: convertPerson(state.people.person1, oldCurrency, newCurrency, rates),
            person2: convertPerson(state.people.person2, oldCurrency, newCurrency, rates),
          },
        }
      }

      return { ...state, meta: newMeta }
    }

    case 'UPDATE_PERSON':
      return {
        ...state,
        people: {
          ...state.people,
          [action.payload.key]: action.payload.person,
        },
      }

    case 'ADD_POT': {
      const newPot = action.payload
      return {
        ...state,
        savingsPots: [...state.savingsPots, newPot],
        goals: newPot.linkedGoalId
          ? state.goals.map((g) =>
              g.id === newPot.linkedGoalId && !g.linkedPotIds.includes(newPot.id)
                ? { ...g, linkedPotIds: [...g.linkedPotIds, newPot.id] }
                : g,
            )
          : state.goals,
      }
    }

    case 'UPDATE_POT': {
      const pot = action.payload
      const oldPot = state.savingsPots.find((p) => p.id === pot.id)
      const oldGoalId = oldPot?.linkedGoalId
      const newGoalId = pot.linkedGoalId

      let goals = state.goals
      if (oldGoalId !== newGoalId) {
        goals = goals.map((g) => {
          // Remove pot from old goal's linkedPotIds
          if (g.id === oldGoalId && g.linkedPotIds.includes(pot.id)) {
            return { ...g, linkedPotIds: g.linkedPotIds.filter((id) => id !== pot.id) }
          }
          // Add pot to new goal's linkedPotIds
          if (g.id === newGoalId && !g.linkedPotIds.includes(pot.id)) {
            return { ...g, linkedPotIds: [...g.linkedPotIds, pot.id] }
          }
          return g
        })
      }

      return {
        ...state,
        savingsPots: state.savingsPots.map((p) =>
          p.id === pot.id ? pot : p,
        ),
        goals,
      }
    }

    case 'DELETE_POT':
      return {
        ...state,
        savingsPots: state.savingsPots.filter((p) => p.id !== action.payload),
        people: {
          person1: {
            ...state.people.person1,
            monthlyContributions: state.people.person1.monthlyContributions.filter(
              (c) => c.potId !== action.payload,
            ),
          },
          person2: {
            ...state.people.person2,
            monthlyContributions: state.people.person2.monthlyContributions.filter(
              (c) => c.potId !== action.payload,
            ),
          },
        },
      }

    case 'ADD_GOAL': {
      const newGoal = action.payload
      const potIds = new Set(newGoal.linkedPotIds)
      return {
        ...state,
        goals: [...state.goals, newGoal],
        savingsPots: potIds.size > 0
          ? state.savingsPots.map((p) =>
              potIds.has(p.id) ? { ...p, linkedGoalId: newGoal.id } : p,
            )
          : state.savingsPots,
      }
    }

    case 'UPDATE_GOAL': {
      const goal = action.payload
      const oldGoal = state.goals.find((g) => g.id === goal.id)
      const oldPotIds = new Set(oldGoal?.linkedPotIds ?? [])
      const newPotIds = new Set(goal.linkedPotIds)

      // Sync pot.linkedGoalId for added/removed pots
      const savingsPots = state.savingsPots.map((p) => {
        const wasLinked = oldPotIds.has(p.id)
        const nowLinked = newPotIds.has(p.id)
        if (!wasLinked && nowLinked) {
          return { ...p, linkedGoalId: goal.id }
        }
        if (wasLinked && !nowLinked && p.linkedGoalId === goal.id) {
          return { ...p, linkedGoalId: null }
        }
        return p
      })

      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === goal.id ? goal : g,
        ),
        savingsPots,
      }
    }

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
        savingsPots: state.savingsPots.map((p) =>
          p.linkedGoalId === action.payload ? { ...p, linkedGoalId: null } : p,
        ),
      }

    case 'ADD_SNAPSHOT':
      return {
        ...state,
        netWorthSnapshots: [...state.netWorthSnapshots, action.payload],
      }

    case 'DELETE_SNAPSHOT':
      return {
        ...state,
        netWorthSnapshots: state.netWorthSnapshots.filter(
          (s) => s.date !== action.payload,
        ),
      }

    default:
      return state
  }
}
