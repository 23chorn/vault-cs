import { useVault } from '../../../hooks/useVault.ts'
import { Card } from '../../shared/Card.tsx'
import { NetWorthChart } from './NetWorthChart.tsx'
import { calcNetWorth, formatDate } from '../../../utils/calculations.ts'
import { formatInDisplayCurrency, fromAED } from '../../../utils/currency.ts'

export function NetWorthPage() {
  const { state, dispatch } = useVault()
  const rates = state.meta.fxRates
  const dc = state.meta.displayCurrency
  const fmt = (aed: number) => formatInDisplayCurrency(aed, dc, rates)

  const handleSnapshot = () => {
    const { totalAssets, totalLiabilities, netWorth } = calcNetWorth(state)
    const today = new Date().toISOString().slice(0, 10)

    if (state.netWorthSnapshots.some((s) => s.date.startsWith(today))) {
      return
    }

    dispatch({
      type: 'ADD_SNAPSHOT',
      payload: {
        date: new Date().toISOString(),
        totalAssetsAED: totalAssets,
        totalLiabilitiesAED: totalLiabilities,
        netWorthAED: netWorth,
      },
    })
  }

  const snapshots = [...state.netWorthSnapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const chartData = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    assets: fromAED(s.totalAssetsAED, dc, rates),
    liabilities: fromAED(s.totalLiabilitiesAED, dc, rates),
    netWorth: fromAED(s.netWorthAED, dc, rates),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono">Net Worth History</h1>
        <button
          onClick={handleSnapshot}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-sm text-white font-medium"
        >
          Take Snapshot
        </button>
      </div>

      {chartData.length > 1 && (
        <Card>
          <NetWorthChart data={chartData} displayCurrency={dc} />
        </Card>
      )}

      {snapshots.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg mb-1">No snapshots yet</p>
          <p className="text-sm">Take your first snapshot to start tracking net worth over time.</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-stone-400 border-b border-stone-700">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-right py-2 px-3">Assets</th>
                  <th className="text-right py-2 px-3">Liabilities</th>
                  <th className="text-right py-2 px-3">Net Worth</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s) => (
                  <tr key={s.date} className="border-b border-stone-700/50 hover:bg-stone-700/30">
                    <td className="py-2 px-3">{formatDate(s.date)}</td>
                    <td className="text-right py-2 px-3 text-emerald-400 font-mono">{fmt(s.totalAssetsAED)}</td>
                    <td className="text-right py-2 px-3 text-rose-400 font-mono">{fmt(s.totalLiabilitiesAED)}</td>
                    <td className="text-right py-2 px-3 font-medium font-mono">{fmt(s.netWorthAED)}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => dispatch({ type: 'DELETE_SNAPSHOT', payload: s.date })}
                        className="text-stone-500 hover:text-rose-400 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
