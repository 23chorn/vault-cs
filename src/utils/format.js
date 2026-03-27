export function formatCurrency(value, decimals = 0) {
  if (value == null || isNaN(value)) return '£0'
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return value < 0 ? `(£${formatted})` : `£${formatted}`
}

export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '0'
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
