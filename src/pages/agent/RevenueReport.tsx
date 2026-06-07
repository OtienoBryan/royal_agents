import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { BarChart3, Download, Users, DollarSign, TrendingUp, Plane, Search } from 'lucide-react'

// Currency formatter — currency resolved at call-time so it updates when agency loads
const makeFmt = (currency: string) => (n: number) => {
  const ccy = currency && currency.length === 3 ? currency : 'USD'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy, minimumFractionDigits: 2 }).format(n)
  } catch {
    return `${ccy} ${Number(n).toFixed(2)}`
  }
}

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

const RevenueReport: React.FC = () => {
  const { user } = useAuth()
  const agencyId = (user as any)?.agency_id ?? null

  const [bookings, setBookings]           = useState<any[]>([])
  const [agency, setAgency]               = useState<any>(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [dateFrom, setDateFrom]           = useState(firstOfMonth)
  const [dateTo, setDateTo]               = useState(today)
  const [tab, setTab]                     = useState<'flight' | 'passengers'>('flight')

  useEffect(() => {
    // Fetch bookings and agency independently so one failure doesn't block the other
    agentApi.getMyBookings(1, 10000)
      .then(b => setBookings(b.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false))

    if (agencyId) {
      agentApi.getAgency(agencyId)
        .then(a => {
          console.log('📊 [RevenueReport] Agency loaded:', a?.name, '| commission_percentage:', a?.commission_percentage)
          setAgency(a)
        })
        .catch(err => console.error('Could not load agency for commission:', err))
    }
  }, [agencyId])

  // commission_percentage and default_currency from agencies table
  const commissionPct = Number(agency?.commission_percentage ?? 0)
  const currency      = (agency?.default_currency as string | null) ?? 'USD'
  const fmt           = makeFmt(currency)

  // Filter bookings by date range + search
  const filtered = useMemo(() => bookings.filter(b => {
    const d = b.booking_date ? String(b.booking_date).slice(0, 10) : null
    if (d && dateFrom && d < dateFrom) return false
    if (d && dateTo   && d > dateTo)   return false
    const q = search.toLowerCase()
    return !q ||
      b.booking_reference?.toLowerCase().includes(q) ||
      b.passenger_name?.toLowerCase().includes(q) ||
      b.flightSeries?.flt?.toLowerCase().includes(q)
  }), [bookings, dateFrom, dateTo, search])

  // Flatten booking_passengers rows — one row per passenger per leg within date range
  const bpRows = useMemo(() => {
    const rows: Array<{
      booking: any; bp: any; pax: any
      flt: string; route: string
      travelDate: string | null
      fareAmount: number; commission: number
    }> = []
    for (const b of filtered) {
      const bps: any[] = b.bookingPassengers || []
      for (const bp of bps) {
        const pax = bp.passenger || {}
        const fare = Number(bp.fare_amount || 0)
        const fs   = bp.flightSeries || b.flightSeries || null
        rows.push({
          booking: b,
          bp,
          pax,
          flt:       fs?.flt || '—',
          route:     fs ? `${fs.fromDestination?.code || '?'} → ${fs.toDestination?.code || '?'}` : '—',
          travelDate: bp.travel_date ? String(bp.travel_date).slice(0, 10) : null,
          fareAmount: fare,
          commission: fare * commissionPct / 100,
        })
      }
    }
    return rows
  }, [filtered, commissionPct])

  // Aggregate totals — revenue and commission sourced from booking_passengers.fare_amount
  const totals = useMemo(() => {
    const revenue   = bpRows.reduce((s, r) => s + r.fareAmount, 0)
    const commission = revenue * commissionPct / 100
    return {
      bookings:   filtered.length,
      passengers: bpRows.filter(r => (r.bp.leg ?? 'outbound') !== 'return').length,
      revenue,
      commission,
    }
  }, [filtered, bpRows, commissionPct])

  // Summary by flight — every flight series in booking_passengers gets its own row.
  // Groups by bp.flightSeries so both outbound and return flights appear separately.
  const byFlight = useMemo(() => {
    type FlightEntry = {
      flt: string; route: string
      bookingIds: Set<number>
      passengers: number
      revenue: number; commission: number
    }
    const map: Record<string, FlightEntry> = {}

    for (const r of bpRows) {
      const key = r.flt || 'Unknown'
      if (!map[key]) map[key] = {
        flt: key,
        route: r.route,
        bookingIds: new Set(),
        passengers: 0,
        revenue: 0,
        commission: 0,
      }
      map[key].bookingIds.add(r.booking.id)
      map[key].passengers++                          // every bp row = one passenger seat
      map[key].revenue    += r.fareAmount
      map[key].commission += r.fareAmount * commissionPct / 100
    }

    return Object.values(map)
      .map(f => ({
        flt:        f.flt,
        route:      f.route,
        bookings:   f.bookingIds.size,
        passengers: f.passengers,
        revenue:    f.revenue,
        commission: f.commission,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [bpRows, commissionPct])

  const handleExportCSV = () => {
    const headers = ['Reference', 'Passenger Name', 'PNR', 'Type', 'Leg', 'Flight', 'Route',
      'Travel Date', 'Booked On', `Fare (${currency})`, `Commission (${currency})`, 'Ticket Status', 'Payment Status']
    const rows = [
      headers,
      ...bpRows.map(r => [
        r.booking.booking_reference,
        r.pax.name || r.booking.passenger_name || '—',
        r.pax.pnr || '—',
        r.bp.passenger_type || '—',
        r.bp.leg || 'outbound',
        r.flt,
        r.route,
        r.travelDate || String(r.booking.booking_date || '').slice(0, 10),
        String(r.booking.booking_date || '').slice(0, 10),
        r.fareAmount.toFixed(2),
        r.commission.toFixed(2),
        r.bp.ticket_status || '—',
        r.booking.payment_status || '—',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${dateFrom}-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" style={{ color: '#1c2e61' }} />Revenue Report
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
            <span>{(user as any)?.agency?.name || agency?.name || 'Agency'}</span>
            {agency && (
              <>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                  {currency}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  commissionPct > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {commissionPct > 0 ? `${commissionPct}% commission` : 'No commission set'}
                </span>
              </>
            )}
          </p>
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors"
          style={{ background: '#1c2e61' }}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[160px]">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input type="text" placeholder="Ref, passenger, flight…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => { setDateFrom(firstOfMonth); setDateTo(today) }}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            This Month
          </button>
          <button onClick={() => { setDateFrom(today); setDateTo(today) }}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            Today
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Bookings',      value: totals.bookings,   formatted: String(totals.bookings),          icon: <Plane className="h-4 w-4 text-white" />,       bg: '#1c2e61' },
          { label: 'Passengers',    value: totals.passengers, formatted: String(totals.passengers),        icon: <Users className="h-4 w-4 text-white" />,        bg: '#7c3aed' },
          { label: 'Total Revenue', value: totals.revenue,   formatted: fmt(totals.revenue),              icon: <DollarSign className="h-4 w-4 text-white" />,   bg: '#059669' },
          { label: 'Commission',    value: totals.commission, formatted: fmt(totals.commission),           icon: <TrendingUp className="h-4 w-4 text-white" />,   bg: '#d97706' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
              {c.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase">{c.label}</p>
              <p className="text-[16px] font-bold text-gray-900 leading-tight">{c.formatted}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-200 p-1 w-fit shadow-sm">
        {([
          { key: 'flight',     label: 'Summary by Flight',  icon: <Plane className="h-3.5 w-3.5" /> },
          { key: 'passengers', label: 'Passenger Details',  icon: <Users className="h-3.5 w-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
              tab === t.key ? 'text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            style={tab === t.key ? { background: '#1c2e61' } : undefined}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1c2e61' }} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Tab: Summary by Flight ── */}
          {tab === 'flight' && byFlight.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 py-12 text-center text-[12px] text-gray-400">
              No bookings in selected date range.
            </div>
          )}
          {tab === 'flight' && byFlight.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Plane className="h-4 w-4" style={{ color: '#1c2e61' }} />
                <h2 className="text-[12px] font-bold text-gray-800">Summary by Flight</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <colgroup>
                    <col className="w-24" />   {/* Flight */}
                    <col className="w-40" />   {/* Route */}
                    <col className="w-24" />   {/* Bookings */}
                    <col className="w-24" />   {/* Passengers */}
                    <col className="w-36" />   {/* Revenue */}
                    {commissionPct > 0 && <col className="w-36" />}  {/* Commission */}
                  </colgroup>
                  <thead>
                    <tr style={{ background: '#1c2e61' }}>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-white/80 uppercase tracking-wide">Flight</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-white/80 uppercase tracking-wide">Route</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-white/80 uppercase tracking-wide">Bookings</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-white/80 uppercase tracking-wide">Passengers</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-white/80 uppercase tracking-wide">Revenue</th>
                      {commissionPct > 0 && (
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-white/80 uppercase tracking-wide">
                          Commission ({commissionPct}%)
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byFlight.map((f, idx) => (
                      <tr key={f.flt} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-4 py-3 text-[12px] font-bold text-gray-900">{f.flt}</td>
                        <td className="px-4 py-3 text-[11px] text-gray-600">{f.route}</td>
                        <td className="px-4 py-3 text-center text-[12px] font-medium text-gray-700">{f.bookings}</td>
                        <td className="px-4 py-3 text-center text-[12px] font-medium text-gray-700">{f.passengers}</td>
                        <td className="px-4 py-3 text-right text-[12px] font-semibold text-gray-900">{fmt(f.revenue)}</td>
                        {commissionPct > 0 && (
                          <td className="px-4 py-3 text-right text-[12px] font-semibold text-amber-700">{fmt(f.commission)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100">
                      <td colSpan={2} className="px-4 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wide">Total</td>
                      <td className="px-4 py-3 text-center text-[13px] font-bold" style={{ color: '#1c2e61' }}>
                        {byFlight.reduce((s, f) => s + f.bookings, 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-[13px] font-bold" style={{ color: '#1c2e61' }}>
                        {byFlight.reduce((s, f) => s + f.passengers, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-green-700">
                        {fmt(byFlight.reduce((s, f) => s + f.revenue, 0))}
                      </td>
                      {commissionPct > 0 && (
                        <td className="px-4 py-3 text-right text-[13px] font-bold text-amber-700">
                          {fmt(byFlight.reduce((s, f) => s + f.commission, 0))}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: Passenger Details ── */}
          {tab === 'passengers' && <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: '#1c2e61' }} />
                <h2 className="text-[12px] font-bold text-gray-800">Passenger Details</h2>
                <span className="text-[10px] text-gray-400 ml-1">from booking_passengers</span>
              </div>
              <span className="text-[11px] text-gray-400">{bpRows.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Reference</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Passenger</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">PNR</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Leg</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Flight</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Travel Date</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Fare</th>
                    {commissionPct > 0 && <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Commission</th>}
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Ticket</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bpRows.length === 0 ? (
                    <tr>
                      <td colSpan={commissionPct > 0 ? 11 : 10} className="px-3 py-8 text-center text-[11px] text-gray-400">
                        No passenger records in selected range.
                      </td>
                    </tr>
                  ) : bpRows.map((r, idx) => (
                    <tr key={`${r.booking.id}-${r.bp.id ?? idx}`} className={`hover:bg-gray-50 transition-colors ${r.bp.leg === 'return' ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-3 py-2 text-[11px] font-mono font-bold text-gray-900">{r.booking.booking_reference}</td>
                      <td className="px-3 py-2 text-[11px] text-gray-800">
                        {r.pax.title ? `${r.pax.title} ` : ''}{r.pax.name || r.booking.passenger_name || '—'}
                      </td>
                      <td className="px-3 py-2 text-[10px] font-mono text-gray-500">{r.pax.pnr || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full capitalize ${
                          r.bp.passenger_type === 'adult'  ? 'bg-[#1c2e61]/10 text-[#1c2e61]' :
                          r.bp.passenger_type === 'child'  ? 'bg-purple-100 text-purple-700' :
                                                             'bg-pink-100 text-pink-700'
                        }`}>{r.bp.passenger_type || '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                          r.bp.leg === 'return' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                        }`}>{r.bp.leg || 'outbound'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[11px] font-semibold text-gray-800">{r.flt}</div>
                        <div className="text-[10px] text-gray-400">{r.route}</div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-600 whitespace-nowrap">
                        {r.travelDate ? fmtDate(r.travelDate) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] font-semibold text-gray-900">{fmt(r.fareAmount)}</td>
                      {commissionPct > 0 && (
                        <td className="px-3 py-2 text-right text-[11px] font-semibold text-amber-700">{fmt(r.commission)}</td>
                      )}
                      <td className="px-3 py-2 text-center">
                        {r.bp.ticket_status ? (
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                            r.bp.ticket_status === 'USED'     ? 'bg-green-100 text-green-800' :
                            r.bp.ticket_status === 'OPEN'     ? 'bg-blue-100 text-blue-800'  :
                            r.bp.ticket_status === 'VOID'     ? 'bg-red-100 text-red-800'    :
                            r.bp.ticket_status === 'REFUNDED' ? 'bg-yellow-100 text-yellow-800' :
                                                                 'bg-gray-100 text-gray-600'
                          }`}>{r.bp.ticket_status}</span>
                        ) : <span className="text-[10px] text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                          r.booking.payment_status === 'paid'   ? 'bg-green-100 text-green-800' :
                          r.booking.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                                   'bg-yellow-100 text-yellow-800'
                        }`}>{r.booking.payment_status || 'pending'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {bpRows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={7} className="px-3 py-2 text-[11px] font-bold text-gray-700 uppercase">Total</td>
                      <td className="px-3 py-2 text-right text-[12px] font-bold text-green-700">
                        {fmt(bpRows.reduce((s, r) => s + r.fareAmount, 0))}
                      </td>
                      {commissionPct > 0 && (
                        <td className="px-3 py-2 text-right text-[12px] font-bold text-amber-700">
                          {fmt(bpRows.reduce((s, r) => s + r.commission, 0))}
                        </td>
                      )}
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>}
        </div>
      )}
    </div>
  )
}

export default RevenueReport
