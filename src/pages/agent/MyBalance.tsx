import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { DollarSign, TrendingUp, TrendingDown, Search, Download } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const PAGE_SIZE_OPTIONS: Array<number | 'all'> = [10, 25, 50, 100, 'all']

const csvEscape = (v: any) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const exportLedgerToCSV = (rows: any[], agencyName?: string) => {
  const header = ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']
  const lines = rows.map(e => [
    e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : '',
    e.description || '',
    e.reference || '',
    Number(e.debit || 0),
    Number(e.credit || 0),
    Number(e.balance || 0),
  ].map(csvEscape).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ledger_${(agencyName || 'agency').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const MyBalance: React.FC = () => {
  const { user } = useAuth()
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number | 'all'>(10)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const agencyId = (user as any)?.agency_id

  useEffect(() => {
    if (!agencyId) { setLoading(false); return }
    agentApi.getAgencyLedger(agencyId)
      .then(data => setLedger(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [agencyId])

  useEffect(() => { setPage(1) }, [pageSize, search, dateFrom, dateTo])

  const filteredLedger = ledger.filter(e => {
    if (search) {
      const q = search.toLowerCase()
      const haystack = `${e.description || ''} ${e.reference || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (dateFrom || dateTo) {
      if (!e.transactionDate) return false
      const d = new Date(e.transactionDate).toISOString().slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
    }
    return true
  })

  const total = filteredLedger.length
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / pageSize))
  const pagedLedger = pageSize === 'all' ? filteredLedger : filteredLedger.slice((page - 1) * pageSize, page * pageSize)
  const rangeStart = total === 0 ? 0 : (pageSize === 'all' ? 1 : (page - 1) * pageSize + 1)
  const rangeEnd = pageSize === 'all' ? total : Math.min(page * pageSize, total)

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
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[12px] font-semibold text-gray-800">Transaction History</h2>
          <button
            onClick={() => exportLedgerToCSV(filteredLedger, (user as any)?.agency?.name)}
            disabled={filteredLedger.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3 w-3" />Export to CSV
          </button>
        </div>
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description or reference…"
              className="pl-6 pr-2 py-1 text-[11px] border border-gray-300 rounded w-56"
            />
          </div>
          <label className="flex items-center gap-1 text-[11px] text-gray-600">
            From
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px]" />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-gray-600">
            To
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px]" />
          </label>
          {(search || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
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
              ) : pagedLedger.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-[11px] text-gray-600">{e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-1.5 text-[11px] text-gray-800">{e.description || '—'}</td>
                  <td className="px-3 py-1.5 text-[11px] font-mono text-gray-500">{e.reference || '—'}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] font-medium text-red-700">{Number(e.debit) > 0 ? fmt(Number(e.debit)) : '—'}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] font-medium text-green-700">{Number(e.credit) > 0 ? fmt(Number(e.credit)) : '—'}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] font-bold text-gray-900">{fmt(Number(e.balance || 0))}</td>
                </tr>
              ))}
              {!loading && filteredLedger.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-[11px] text-gray-400">
                  {ledger.length === 0 ? 'No transactions found.' : 'No transactions match your filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 && (
          <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] flex-wrap gap-2">
            <div className="flex items-center gap-2 text-gray-600">
              <span>Showing {rangeStart}–{rangeEnd} of {total}</span>
              <label className="flex items-center gap-1">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] bg-white"
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n === 'all' ? 'View all' : n}</option>)}
                </select>
                <span>per page</span>
              </label>
            </div>
            {pageSize !== 'all' && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Previous
                </button>
                <span className="px-1 text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBalance
