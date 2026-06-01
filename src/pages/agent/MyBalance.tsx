import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const MyBalance: React.FC = () => {
  const { user } = useAuth()
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const agencyId = (user as any)?.agency_id

  useEffect(() => {
    if (!agencyId) { setLoading(false); return }
    agentApi.getAgencyLedger(agencyId)
      .then(data => setLedger(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [agencyId])

  const balance = Number((user as any)?.agency?.balance || 0)
  const totalDebit  = ledger.reduce((s: number, e: any) => s + Number(e.debit  || 0), 0)
  const totalCredit = ledger.reduce((s: number, e: any) => s + Number(e.credit || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-green-600" />Balance & Ledger
        </h1>
        <p className="text-[11px] text-gray-500 mt-0.5">{(user as any)?.agency?.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Current Balance', value: fmt(balance), color: balance < 0 ? 'text-red-700' : 'text-green-700', bg: balance < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200', icon: <DollarSign className="h-3.5 w-3.5 text-green-600" /> },
          { label: 'Total Debit',     value: fmt(totalDebit),  color: 'text-red-700',   bg: 'bg-red-50 border-red-100',   icon: <TrendingDown className="h-3.5 w-3.5 text-red-600" /> },
          { label: 'Total Credit',   value: fmt(totalCredit), color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-100', icon: <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> },
        ].map(c => (
          <div key={c.label} className={`rounded-lg border p-2.5 ${c.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase">{c.label}</span>
              <div className="p-1 bg-white/60 rounded">{c.icon}</div>
            </div>
            <p className={`text-base font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-100">
          <h2 className="text-[12px] font-semibold text-gray-800">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Reference</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Debit</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Credit</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Balance</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" /></td></tr>
              ) : ledger.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-[11px] text-gray-600">{e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-1.5 text-[11px] text-gray-800">{e.description || '—'}</td>
                  <td className="px-3 py-1.5 text-[11px] font-mono text-gray-500">{e.reference || '—'}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] font-medium text-red-700">{Number(e.debit) > 0 ? fmt(Number(e.debit)) : '—'}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] font-medium text-green-700">{Number(e.credit) > 0 ? fmt(Number(e.credit)) : '—'}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] font-bold text-gray-900">{fmt(Number(e.balance || 0))}</td>
                </tr>
              ))}
              {!loading && ledger.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-[11px] text-gray-400">No transactions found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MyBalance
