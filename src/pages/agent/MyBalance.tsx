import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { DollarSign, TrendingUp, TrendingDown, Search, Download } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const PAGE_SIZE_OPTIONS: Array<number | 'all'> = [10, 25, 50, 100, 'all']

// jsPDF/jspdf-autotable are only needed when a PDF is actually requested —
// dynamically imported here instead of at module load so this page doesn't pay
// for them (a few hundred KB combined) just by being visited.

const NAVY = [28, 46, 97] as const // #1c2e61

// jsPDF has no native "clip image to circle" — the reliable way is to pre-render
// the logo onto an offscreen canvas, clip it to a circular path there, and hand
// jsPDF the resulting (now genuinely circular, transparent-outside-the-circle)
// PNG data URL. Without this, addImage would just place a plain square image —
// the white plate behind it wouldn't make the logo itself circular, only the
// background around it.
const loadCircularLogo = (src: string, diameterPx = 200): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = diameterPx
    canvas.height = diameterPx
    const ctx = canvas.getContext('2d')
    if (!ctx) { reject(new Error('Canvas not supported')); return }
    const r = diameterPx / 2
    ctx.beginPath()
    ctx.arc(r, r, r, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    // Fill the whole circle white first — with a contain-fit (below), the logo
    // won't reach every edge of the circle, so without this the gaps would be
    // transparent and show the navy header band through them instead of a
    // clean white background.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, diameterPx, diameterPx)
    // Contain-fit (scale down to fit entirely inside, no cropping) with extra
    // shrink so the logo sits with clear white margin instead of touching the
    // circle's edge — a cover-fit here was cropping the logo's edges/corners.
    const scale = Math.min(diameterPx / img.width, diameterPx / img.height) * 0.78
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (diameterPx - w) / 2, (diameterPx - h) / 2, w, h)
    resolve(canvas.toDataURL('image/png'))
  }
  img.onerror = reject
  img.src = src
})

const exportLedgerToPDF = async (rows: any[], agencyName: string | undefined, currentBalance: number) => {
  const [{ default: jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadCircularLogo('/royal.png').catch(() => null),
  ])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 30, 'F')

  if (logo) {
    // White plate behind the logo so it reads cleanly against the navy band,
    // matching the circular logo badge used on the e-ticket/boarding pass.
    doc.setFillColor(255, 255, 255)
    doc.circle(20, 15, 8.5, 'F')
    doc.addImage(logo, 'PNG', 13, 8, 14, 14)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('ROYAL AIR', 34, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Agency Ledger Statement', 34, 19)

  doc.setFontSize(7)
  doc.setTextColor(220, 225, 240)
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - 14, 26, { align: 'right' })

  // ── Agency / balance summary panel ──────────────────────────────────────
  doc.setFillColor(245, 247, 250)
  doc.rect(0, 30, pageWidth, 18, 'F')
  doc.setDrawColor(225, 228, 235)
  doc.line(0, 48, pageWidth, 48)

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(agencyName || 'Agency', 14, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text('Current Balance', pageWidth - 14, 37, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...NAVY)
  doc.text(fmt(currentBalance), pageWidth - 14, 43, { align: 'right' })

  autoTable(doc, {
    startY: 54,
    head: [['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']],
    body: rows.map(e => [
      e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : '—',
      e.description || '—',
      e.reference || '—',
      Number(e.debit)  > 0 ? fmt(Number(e.debit))  : '—',
      Number(e.credit) > 0 ? fmt(Number(e.credit)) : '—',
      fmt(Number(e.balance || 0)),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [...NAVY], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { bottom: 16 },
  })

  // Footer with correct "Page X of Y" — done as a pass over all pages after the
  // table finishes, since the total page count isn't known until then (a
  // didDrawPage hook only sees pages rendered so far, not the eventual total).
  const totalPages = doc.getNumberOfPages()
  const pageHeight = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('Royal Air', 14, pageHeight - 8)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }

  doc.save(`ledger_${(agencyName || 'agency').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
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
  const [exportingPDF, setExportingPDF] = useState(false)

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

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      await exportLedgerToPDF(filteredLedger, (user as any)?.agency?.name, balance)
    } catch (e) {
      console.error(e)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExportingPDF(false)
    }
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={filteredLedger.length === 0 || exportingPDF}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3 w-3" />{exportingPDF ? 'Generating…' : 'Export to PDF'}
            </button>
          </div>
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
