import type { Currency, VaultData } from '../types/vault.ts'

export type FxRates = VaultData['meta']['fxRates']

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
  return `${currency} ${formatted}`
}

/** Convert any currency to AED using stored rates */
function currencyToAED(amount: number, currency: Currency, rates: FxRates): number {
  if (currency === 'AED') return amount
  if (currency === 'GBP') return amount / rates.AED_GBP
  // USD
  return amount / rates.AED_USD
}

/** Convert AED to any currency using stored rates */
function aedToCurrency(amount: number, currency: Currency, rates: FxRates): number {
  if (currency === 'AED') return amount
  if (currency === 'GBP') return amount * rates.AED_GBP
  // USD
  return amount * rates.AED_USD
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: FxRates,
): number {
  if (from === to) return amount
  const inAED = currencyToAED(amount, from, rates)
  return aedToCurrency(inAED, to, rates)
}

export function toAED(amount: number, currency: Currency, rates: FxRates): number {
  return currencyToAED(amount, currency, rates)
}

export function fromAED(amount: number, currency: Currency, rates: FxRates): number {
  return aedToCurrency(amount, currency, rates)
}

/** Format an AED amount in the given display currency */
export function formatInDisplayCurrency(amountInAED: number, displayCurrency: Currency, rates: FxRates): string {
  const converted = fromAED(amountInAED, displayCurrency, rates)
  return formatCurrency(converted, displayCurrency)
}
