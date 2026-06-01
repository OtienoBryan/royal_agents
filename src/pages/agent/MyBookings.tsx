import { useState, useEffect } from 'react'
import { agentApi } from '../../services/agentApi'
import { Ticket, Search, X, Plane, User, ChevronDown, ChevronUp, ArrowRight, RotateCcw } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const PAX_COLORS: Record<string, string> = {
  adult:  'bg-[#1c2e61]/10 text-[#1c2e61] border border-[#1c2e61]/20',
  child:  'bg-purple-50 text-purple-700 border border-purple-200',
  infant: 'bg-pink-50 text-pink-700 border border-pink-200',
}

const TICKET_STATUS_COLOR: Record<string, string> = {
  'Boarded':  'bg-green-100 text-green-800',
  'CHECK IN': 'bg-blue-100 text-blue-800',
  'No Show':  'bg-red-100 text-red-800',
}

// ─── Boarding Pass Card ───────────────────────────────────────────────────────
const BoardingPass: React.FC<{
  leg: 'outbound' | 'return'
  flight: any
  date: string | null
  pax: any
  bp: any
}> = ({ leg, flight, date, pax, bp }) => {
  const ticketStatus = bp?.ticket_status || null
  const from = flight?.fromDestination
  const to   = flight?.toDestination

  return (
    <div className={`rounded-xl overflow-hidden border-2 ${leg === 'return' ? 'border-indigo-200' : 'border-[#1c2e61]/20'}`}>
      {/* Ticket header strip */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: leg === 'return' ? '#3730a3' : '#1c2e61' }}
      >
        <div className="flex items-center gap-2">
          <Plane className={`h-3.5 w-3.5 text-white ${leg === 'return' ? 'rotate-180' : ''}`} />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            {leg === 'outbound' ? 'Outbound' : 'Return'} · {flight?.flt || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${PAX_COLORS[bp?.passenger_type] || 'bg-white/20 text-white'}`}
            style={!PAX_COLORS[bp?.passenger_type] ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : undefined}>
            {bp?.passenger_type || 'adult'}
          </span>
          {ticketStatus && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TICKET_STATUS_COLOR[ticketStatus] || 'bg-white/20 text-white'}`}>
              {ticketStatus}
            </span>
          )}
        </div>
      </div>

      {/* Ticket body */}
      <div className="bg-white px-4 py-3">
        {/* Route */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <p className="text-[24px] font-black text-gray-900 leading-none">{from?.code || '—'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{from?.name || ''}</p>
          </div>
          <div className="flex-1 flex flex-col items-center px-2">
            <div className="flex items-center gap-1 w-full">
              <div className="h-px flex-1 bg-gray-200" />
              <Plane className="h-4 w-4 text-gray-300" />
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            {flight?.std && (
              <span className="text-[10px] text-gray-400 mt-0.5">{flight.std}{flight.sta ? ` → ${flight.sta}` : ''}</span>
            )}
          </div>
          <div className="text-center">
            <p className="text-[24px] font-black text-gray-900 leading-none">{to?.code || '—'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{to?.name || ''}</p>
          </div>
        </div>

        {/* Passenger + date row */}
        <div className="flex items-end justify-between border-t border-dashed border-gray-200 pt-3">
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase">Passenger</p>
            <p className="text-[13px] font-bold text-gray-900">{pax?.title ? `${pax.title} ` : ''}{pax?.name || '—'}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">PNR: {pax?.pnr || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold text-gray-400 uppercase">Date</p>
            <p className="text-[12px] font-bold text-gray-900">{fmtDate(date)}</p>
            <p className="text-[11px] font-bold mt-0.5" style={{ color: '#1c2e61' }}>{fmt(Number(bp?.fare_amount || 0))}</p>
          </div>
        </div>
      </div>

      {/* Tear line */}
      <div className="flex items-center px-2 bg-gray-50">
        <div className="w-3 h-3 rounded-full bg-gray-200 -ml-4 shrink-0" />
        <div className="flex-1 border-t border-dashed border-gray-300 mx-1" />
        <div className="w-3 h-3 rounded-full bg-gray-200 -mr-4 shrink-0" />
      </div>

      {/* Barcode stub */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-0.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-0.5 bg-gray-400 opacity-60" style={{ height: i % 3 === 0 ? 16 : i % 2 === 0 ? 12 : 8 }} />
          ))}
        </div>
        <p className="text-[9px] font-mono text-gray-400 ml-3">{pax?.pnr || '--------'}</p>
      </div>
    </div>
  )
}

// ─── Booking Details Modal ────────────────────────────────────────────────────
const BookingDetailsModal: React.FC<{ bookingId: number; onClose: () => void }> = ({ bookingId, onClose }) => {
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tickets' | 'details'>('tickets')
  const [expandedPax, setExpandedPax] = useState<number | null>(null)

  useEffect(() => {
    agentApi.getBooking(bookingId)
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bookingId])

  const passengers: any[] = booking?.bookingPassengers || []
  const isReturn = booking?.is_return_trip

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ background: '#1c2e61' }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-white">Booking Details</h2>
              {isReturn && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  <RotateCcw className="h-3 w-3" />Return Trip
                </span>
              )}
            </div>
            {booking && <p className="text-[12px] text-white/60 mt-0.5 font-mono">{booking.booking_reference}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          {(['tickets', 'details'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[12px] font-semibold capitalize transition-colors ${
                tab === t ? 'border-b-2 text-[#1c2e61]' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={tab === t ? { borderColor: '#1c2e61' } : undefined}>
              {t === 'tickets' ? `🎫 Tickets (${passengers.length})` : '📋 Booking Info'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1c2e61' }} />
            </div>
          ) : !booking ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">Failed to load booking.</div>
          ) : tab === 'tickets' ? (
            /* ─── Tickets tab ─── */
            <div className="px-5 py-4 space-y-6">
              {passengers.length === 0 ? (
                <p className="text-center text-[13px] text-gray-400 py-8">No passenger records found.</p>
              ) : (
                passengers.map((bp: any, idx: number) => {
                  const pax = bp.passenger || {}
                  return (
                    <div key={bp.id}>
                      {/* Passenger label */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ background: '#1c2e61' }}>
                          {idx + 1}
                        </div>
                        <span className="text-[13px] font-bold text-gray-800">{pax.title ? `${pax.title} ` : ''}{pax.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${PAX_COLORS[bp.passenger_type] || 'bg-gray-100 text-gray-600'}`}>
                          {bp.passenger_type}
                        </span>
                      </div>

                      {/* Outbound ticket */}
                      <BoardingPass
                        leg="outbound"
                        flight={booking.flightSeries}
                        date={String(booking.booking_date)}
                        pax={pax}
                        bp={bp}
                      />

                      {/* Return ticket */}
                      {isReturn && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <RotateCcw className="h-3 w-3 text-indigo-500" />
                            <span className="text-[11px] font-semibold text-indigo-600">Return journey</span>
                          </div>
                          <BoardingPass
                            leg="return"
                            flight={booking.returnFlightSeries || {
                              flt: booking.flightSeries?.flt,
                              fromDestination: booking.flightSeries?.toDestination,
                              toDestination: booking.flightSeries?.fromDestination,
                              std: booking.flightSeries?.sta,
                              sta: booking.flightSeries?.std,
                            }}
                            date={booking.return_date}
                            pax={pax}
                            bp={bp}
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* ─── Details tab ─── */
            <div>
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Flight */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Outbound Flight</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-0.5">{booking.flightSeries?.flt || '—'}</p>
                    {booking.flightSeries && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        {booking.flightSeries.fromDestination?.code}
                        <ArrowRight className="h-3 w-3" />
                        {booking.flightSeries.toDestination?.code}
                      </p>
                    )}
                  </div>
                  {/* Return flight */}
                  {isReturn && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Return Flight</p>
                      <p className="text-[14px] font-bold text-gray-900 mt-0.5">
                        {booking.returnFlightSeries?.flt || booking.flightSeries?.flt || '—'}
                      </p>
                      {(booking.returnFlightSeries || booking.flightSeries) && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          {(booking.returnFlightSeries?.fromDestination || booking.flightSeries?.toDestination)?.code}
                          <ArrowRight className="h-3 w-3" />
                          {(booking.returnFlightSeries?.toDestination || booking.flightSeries?.fromDestination)?.code}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Travel date */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Travel Date</p>
                    <p className="text-[13px] font-semibold text-gray-800 mt-0.5">{fmtDate(booking.booking_date)}</p>
                  </div>
                  {/* Return date */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Return Date</p>
                    {isReturn ? (
                      <p className="text-[13px] font-semibold text-gray-800 mt-0.5">
                        {booking.return_date ? fmtDate(booking.return_date) : <span className="text-gray-400">Not recorded</span>}
                      </p>
                    ) : (
                      <p className="text-[12px] text-gray-400 mt-0.5">One-way</p>
                    )}
                  </div>
                  {/* Amount */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Total Amount</p>
                    <p className="text-[15px] font-bold text-gray-900 mt-0.5">{fmt(Number(booking.total_amount || 0))}</p>
                  </div>
                  {/* Payment */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Payment</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      booking.payment_status === 'paid'   ? 'bg-green-100 text-green-800' :
                      booking.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.payment_status || 'pending'}
                    </span>
                  </div>
                  {/* Trip type */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Trip Type</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${isReturn ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>
                      {isReturn ? '↩ Return' : '→ One-way'}
                    </span>
                  </div>
                  {/* Passengers */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Passengers</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-0.5">{passengers.length}</p>
                  </div>
                </div>
              </div>

              {/* Passenger details list */}
              <div className="px-6 py-4">
                <h3 className="text-[13px] font-bold mb-3 flex items-center gap-2" style={{ color: '#1c2e61' }}>
                  <User className="h-4 w-4" />Passenger Details
                </h3>
                <div className="space-y-2">
                  {passengers.map((bp: any, idx: number) => {
                    const pax = bp.passenger || {}
                    const isExpanded = expandedPax === bp.id
                    const ticketStatus = bp.ticket_status || null
                    return (
                      <div key={bp.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button type="button"
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          onClick={() => setExpandedPax(isExpanded ? null : bp.id)}>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                              style={{ background: '#1c2e61' }}>{idx + 1}</div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold text-gray-900">{pax.title ? `${pax.title} ` : ''}{pax.name || '—'}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${PAX_COLORS[bp.passenger_type] || 'bg-gray-100 text-gray-600'}`}>
                                  {bp.passenger_type}
                                </span>
                                {ticketStatus && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TICKET_STATUS_COLOR[ticketStatus] || 'bg-gray-100 text-gray-600'}`}>
                                    {ticketStatus}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                PNR: <span className="font-mono font-semibold text-gray-700">{pax.pnr || '—'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[12px] font-bold text-gray-800">{fmt(Number(bp.fare_amount || 0))}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                              {pax.email && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Email</p><p className="text-[12px] text-gray-700 mt-0.5 break-all">{pax.email}</p></div>}
                              {pax.contact && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Contact</p><p className="text-[12px] text-gray-700 mt-0.5">{pax.contact}</p></div>}
                              {pax.nationality && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Nationality</p><p className="text-[12px] text-gray-700 mt-0.5">{pax.nationality}</p></div>}
                              {pax.id_type && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">ID Type</p><p className="text-[12px] text-gray-700 mt-0.5 capitalize">{pax.id_type.replace('_', ' ')}</p></div>}
                              {pax.identification && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">ID Number</p><p className="text-[12px] font-mono text-gray-700 mt-0.5">{pax.identification}</p></div>}
                              {pax.age != null && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Age</p><p className="text-[12px] text-gray-700 mt-0.5">{pax.age}</p></div>}
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Ticket Status</p>
                                {ticketStatus
                                  ? <span className={`inline-flex mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${TICKET_STATUS_COLOR[ticketStatus] || 'bg-gray-100 text-gray-600'}`}>{ticketStatus}</span>
                                  : <p className="text-[12px] text-gray-400 mt-0.5">—</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button onClick={onClose}
            className="px-5 py-2 text-[12px] font-semibold rounded-lg text-white transition-colors"
            style={{ background: '#1c2e61' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#162450')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1c2e61')}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    agentApi.getMyBookings(1, 1000)
      .then(r => setBookings(r.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    return !q || b.booking_reference?.toLowerCase().includes(q) || b.passenger_name?.toLowerCase().includes(q)
  })

  const total = filtered.reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Ticket className="h-4 w-4" style={{ color: '#1c2e61' }} />My Bookings
        </h1>
        <span className="text-[11px] text-gray-500">{filtered.length} bookings · {fmt(total)}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input type="text" placeholder="Search by reference or passenger…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Date Booked</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Passenger</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Flight / Route</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Travel Date</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Ticket Status</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Pax</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#1c2e61' }} />
                  </td>
                </tr>
              ) : filtered.flatMap((b: any) => {
                const bps: any[] = b.bookingPassengers || []
                // Travel dates sourced from booking_passengers per leg
                const outboundBp = bps.find((bp: any) => bp.leg === 'outbound') ?? bps[0] ?? null
                const returnBp   = bps.find((bp: any) => bp.leg === 'return')   ?? null
                const outboundDate = outboundBp?.travel_date ?? b.booking_date ?? null
                const returnDate   = returnBp?.travel_date   ?? b.return_date   ?? null

                // Flight series from booking_passengers — cross-check with flightSeries relation
                const outboundFs = outboundBp?.flightSeries ?? b.flightSeries ?? null
                const returnFs   = returnBp?.flightSeries   ?? b.returnFlightSeries ?? null

                // Ticket statuses from booking_passengers.ticket_status per leg
                const outboundStatuses = [...new Set(
                  bps.filter((bp: any) => bp.leg === 'outbound' || (!bp.leg && bps.indexOf(bp) === 0))
                    .map((bp: any) => bp.ticket_status).filter(Boolean)
                )]
                const returnStatuses = [...new Set(
                  bps.filter((bp: any) => bp.leg === 'return')
                    .map((bp: any) => bp.ticket_status).filter(Boolean)
                )]

                const statusBadge = (
                  <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                    b.payment_status === 'paid'   ? 'bg-green-100 text-green-800' :
                    b.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {b.payment_status || 'pending'}
                  </span>
                )

                const viewBtn = (
                  <button
                    onClick={() => setSelectedId(b.id)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-md text-white transition-colors"
                    style={{ background: '#1c2e61' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#162450')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1c2e61')}
                  >
                    View
                  </button>
                )

                const rows = [
                  /* Outbound row */
                  <tr key={`${b.id}-out`} className={`hover:bg-gray-50/60 transition-colors ${b.is_return_trip ? 'border-l-2' : ''}`}
                    style={b.is_return_trip ? { borderLeftColor: '#1c2e61' } : undefined}>
                    <td className="px-3 py-2 text-[11px] font-mono font-bold text-gray-900">
                      {b.booking_reference}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">
                      {b.created_at
                        ? new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-800">{b.passenger_name}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1c2e61]/10 text-[#1c2e61]">
                          ↑ OUT
                        </span>
                        <span className="text-[11px] font-semibold text-gray-800">
                          {outboundFs?.flt || b.flightSeries?.flt || '—'}
                        </span>
                        {(outboundFs?.fromDestination ?? b.flightSeries?.fromDestination) && (
                          <span className="text-[10px] text-gray-400">
                            {(outboundFs?.fromDestination ?? b.flightSeries?.fromDestination)?.code}→{(outboundFs?.toDestination ?? b.flightSeries?.toDestination)?.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-700 whitespace-nowrap">
                      {outboundDate ? fmtDate(outboundDate) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {outboundStatuses.length > 0
                        ? <div className="flex flex-wrap gap-0.5 justify-center">
                            {outboundStatuses.map((s: string) => (
                              <span key={s} className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${TICKET_STATUS_COLOR[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
                            ))}
                          </div>
                        : <span className="text-[10px] text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-center text-[11px] text-gray-700">{b.number_of_passengers}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-semibold text-gray-900">{fmt(Number(b.total_amount || 0))}</td>
                    <td className="px-3 py-2 text-center">{statusBadge}</td>
                    <td className="px-3 py-2 text-center">{viewBtn}</td>
                  </tr>,
                ]

                if (b.is_return_trip) {
                  const retFrom = returnFs?.fromDestination ?? b.flightSeries?.toDestination
                  const retTo   = returnFs?.toDestination   ?? b.flightSeries?.fromDestination
                  const retFlt  = returnFs?.flt             ?? b.flightSeries?.flt

                  rows.push(
                    <tr key={`${b.id}-ret`} className="hover:bg-indigo-50/40 transition-colors border-l-2 bg-indigo-50/20"
                      style={{ borderLeftColor: '#3730a3' }}>
                      <td className="px-3 py-2 text-[11px] font-mono text-gray-400">{b.booking_reference}</td>
                      <td className="px-3 py-2 text-[11px] text-gray-400">—</td>
                      <td className="px-3 py-2 text-[11px] text-gray-500 italic">{b.passenger_name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            ↓ RET
                          </span>
                          <span className="text-[11px] font-semibold text-gray-700">{retFlt || '—'}</span>
                          {retFrom && (
                            <span className="text-[10px] text-gray-400">
                              {retFrom.code}→{retTo?.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-700 whitespace-nowrap">
                        {returnDate ? fmtDate(returnDate) : <span className="text-gray-400 italic">No date</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {returnStatuses.length > 0
                          ? <div className="flex flex-wrap gap-0.5 justify-center">
                              {returnStatuses.map((s: string) => (
                                <span key={s} className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${TICKET_STATUS_COLOR[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
                              ))}
                            </div>
                          : <span className="text-[10px] text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-center text-[11px] text-gray-500">{b.number_of_passengers}</td>
                      <td className="px-3 py-2 text-right text-[11px] text-gray-500">—</td>
                      <td className="px-3 py-2 text-center">{statusBadge}</td>
                      <td className="px-3 py-2 text-center">{viewBtn}</td>
                    </tr>
                  )
                }

                return rows
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-[11px] text-gray-400">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId !== null && (
        <BookingDetailsModal bookingId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

export default MyBookings
