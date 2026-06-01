import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { Calendar, Search, Eye, CheckCircle, XCircle, Plane, MapPin, Clock, Users, DollarSign, AlertTriangle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('agentToken')}`, 'Content-Type': 'application/json' })

const statusColor = (s: string) => {
  switch (s) {
    case 'confirmed': return 'bg-green-100 text-green-800'
    case 'booked':    return 'bg-purple-100 text-purple-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default:          return 'bg-yellow-100 text-yellow-800'
  }
}

const fmt = (n: number | null | undefined) => n != null ? `$${Number(n).toFixed(2)}` : '—'
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }) : '—'

// ─── Detail / Confirm Modal ───────────────────────────────────────────────────
const ReservationModal: React.FC<{
  res: any
  agencyId: number | null
  onClose: () => void
  onConfirmed: () => void
}> = ({ res, agencyId, onClose, onConfirmed }) => {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('agency_balance')
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0,10))
  const [showConfirmForm, setShowConfirmForm] = useState(false)
  const [agencyData, setAgencyData] = useState<{ balance: number; booking_limit: number | null } | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const canConfirm = res.status === 'reserved'
  const fs = res.flightSeries

  // Fetch agency balance + booking_limit whenever the confirm section is opened
  useEffect(() => {
    if (!showConfirmForm || !agencyId) return
    setBalanceLoading(true)
    agentApi.getAgency(agencyId)
      .then(a => setAgencyData({ balance: Number(a.balance ?? 0), booking_limit: a.booking_limit != null ? Number(a.booking_limit) : null }))
      .catch(() => setAgencyData(null))
      .finally(() => setBalanceLoading(false))
  }, [showConfirmForm, agencyId])

  const bookingAmount = res.fare_amount ? Number(res.fare_amount) : 0
  const agencyBalance = agencyData?.balance ?? null
  const bookingLimit  = agencyData?.booking_limit ?? null
  // Blocked when balance would fall below the booking_limit after deduction
  const balanceAfter  = agencyBalance !== null ? agencyBalance - bookingAmount : null
  const belowLimit    = bookingLimit !== null && balanceAfter !== null && balanceAfter < bookingLimit
  const insufficientBalance = agencyBalance !== null && agencyBalance < bookingAmount

  const handleConfirm = async () => {
    setError('')
    setConfirming(true)
    try {
      // Create a booking from this reservation
      const passengers = [{
        name: res.passenger_name || 'Passenger',
        email: res.passenger_email || undefined,
        contact: res.passenger_phone || undefined,
        nationality: res.country?.name || undefined,
        passenger_type: 'adult',
      }]
      // If number_of_seats > 1, add placeholder passengers
      for (let i = 1; i < (res.number_of_seats || 1); i++) {
        passengers.push({ name: `Passenger ${i + 1}`, passenger_type: 'adult' } as any)
      }

      const bookingRes = await fetch(`${API_BASE}/admin/bookings`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          flight_series_id: res.flight_series_id,
          seat_reservation_id: res.id,
          passengers,
          payment_method: paymentMethod,
          payment_status: 'paid',
          booking_date: bookingDate,
          travel_date: res.reservation_date ? String(res.reservation_date).slice(0, 10) : bookingDate,
          agency_id: agencyId || undefined,
          override_total_amount: res.fare_amount ? Number(res.fare_amount) : undefined,
          is_return_trip: res.trip_type === 'return',
          return_date: res.return_date ? String(res.return_date).slice(0, 10) : undefined,
          return_flight_series_id: res.return_flight_series_id || undefined,
          notes: res.notes || undefined,
        }),
      })
      if (!bookingRes.ok) {
        const err = await bookingRes.json().catch(() => ({}))
        throw new Error(err.message || `HTTP ${bookingRes.status}`)
      }

      // Update reservation: status → confirmed, payment_status → paid, amount_paid → full fare
      await fetch(`${API_BASE}/admin/seat-reservations/${res.id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({
          status: 'confirmed',
          payment_status: 'paid',
          amount_paid: res.fare_amount ?? 0,
        }),
      })

      onConfirmed()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-[13px] font-bold text-gray-900">Reservation Details</h2>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">{res.booking_reference}</p>
          </div>
          <button onClick={onClose}><XCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-4 space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Status</span>
            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColor(res.status)}`}>
              {res.status?.toUpperCase()}
            </span>
          </div>

          {/* Flight info */}
          {fs && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-blue-900">
                <Plane className="h-3.5 w-3.5" />{fs.flt}
                <span className="text-[9px] font-normal text-blue-600 ml-1">{fs.flight_type}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-800">
                <MapPin className="h-3 w-3" />
                {fs.fromDestination?.code || '—'} → {fs.toDestination?.code || '—'}
              </div>
              {(fs.std || fs.sta) && (
                <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
                  <Clock className="h-3 w-3" />{fs.std} → {fs.sta}
                </div>
              )}
            </div>
          )}

          {/* Reservation details */}
          <div className="space-y-1.5">
            {[
              { label: 'Passenger', value: res.passenger_name, icon: <Users className="h-3 w-3 text-gray-400" /> },
              { label: 'Email',    value: res.passenger_email },
              { label: 'Phone',    value: res.passenger_phone },
              { label: 'Travel Date', value: fmtDate(res.reservation_date), icon: <Calendar className="h-3 w-3 text-gray-400" /> },
              ...(res.trip_type === 'return' ? [{ label: 'Return Date', value: fmtDate(res.return_date) }] : []),
              { label: 'Seats',    value: res.number_of_seats },
              { label: 'Trip',     value: res.trip_type === 'return' ? '⇄ Return' : '→ One Way' },
              { label: 'Fare',     value: fmt(res.fare_amount), icon: <DollarSign className="h-3 w-3 text-gray-400" /> },
              { label: 'Payment',  value: res.payment_status },
              { label: 'Nationality', value: res.country?.name },
              { label: 'Notes',    value: res.notes },
            ].filter(r => r.value).map(({ label, value, icon }) => (
              <div key={label} className="flex items-start justify-between text-[11px] py-0.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 flex items-center gap-1">{icon}{label}</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%]">{String(value)}</span>
              </div>
            ))}
          </div>

          {/* Confirm section */}
          {canConfirm && (
            <div className={`rounded-xl border p-3 space-y-3 ${showConfirmForm ? 'border-[#1c2e61]/20 bg-[#1c2e61]/5' : 'border-gray-200'}`}>
              {!showConfirmForm ? (
                <button
                  onClick={() => setShowConfirmForm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  style={{ background: '#1c2e61' }}
                >
                  <CheckCircle className="h-3.5 w-3.5" />Confirm Booking
                </button>
              ) : (
                <>
                  <p className="text-[11px] font-semibold" style={{ color: '#1c2e61' }}>Confirm this reservation as a booking</p>

                  {/* ── Balance check ── */}
                  {balanceLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#1c2e61' }} />
                      <span className="text-[11px] text-gray-500">Checking agency balance…</span>
                    </div>
                  ) : agencyData ? (
                    <div className={`rounded-lg border px-3 py-2.5 space-y-2 ${belowLimit || insufficientBalance ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                      <div className="flex items-center gap-1.5">
                        {belowLimit || insufficientBalance
                          ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          : <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                        <span className={`text-[11px] font-bold ${belowLimit || insufficientBalance ? 'text-red-700' : 'text-green-700'}`}>
                          {insufficientBalance
                            ? 'Insufficient balance — cannot confirm this booking'
                            : belowLimit
                            ? `Balance will fall below the booking limit — cannot confirm`
                            : 'Balance check passed'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                        <div>
                          <p className="text-gray-500 font-semibold uppercase">Current Balance</p>
                          <p className={`font-bold text-[12px] mt-0.5 ${insufficientBalance ? 'text-red-700' : 'text-gray-900'}`}>{fmt(agencyBalance)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold uppercase">Booking Amount</p>
                          <p className="font-bold text-[12px] mt-0.5 text-gray-900">{fmt(bookingAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold uppercase">Balance After</p>
                          <p className={`font-bold text-[12px] mt-0.5 ${belowLimit ? 'text-red-700' : 'text-gray-900'}`}>{fmt(balanceAfter)}</p>
                        </div>
                      </div>
                      {bookingLimit !== null && (
                        <p className="text-[10px] text-center text-gray-500">
                          Booking limit: <span className={`font-semibold ${belowLimit ? 'text-red-600' : 'text-gray-700'}`}>{fmt(bookingLimit)}</span>
                          {belowLimit ? ' — balance cannot drop below this threshold' : ' ✓ threshold maintained'}
                        </p>
                      )}
                    </div>
                  ) : agencyId ? (
                    <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                      <span className="text-[11px] text-yellow-700">Could not load agency balance. Proceed with caution.</span>
                    </div>
                  ) : null}

                  {/* Payment fields — only shown when balance is OK */}
                  {!insufficientBalance && !belowLimit && (
                    <>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Payment Method</label>
                        <div className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded bg-gray-50 text-gray-700 font-medium">
                          Agency Balance
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Booking Date</label>
                        <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                          className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:outline-none" />
                      </div>
                    </>
                  )}

                  {error && <p className="text-[10px] text-red-600 bg-red-50 px-2 py-1.5 rounded-lg border border-red-200">{error}</p>}

                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => { setShowConfirmForm(false); setError('') }} disabled={confirming}
                      className="flex-1 py-1.5 text-[11px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      Cancel
                    </button>
                    {!insufficientBalance && !belowLimit && (
                      <button type="button" onClick={handleConfirm} disabled={confirming || balanceLoading}
                        className="flex-1 py-1.5 text-[11px] text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                        style={{ background: '#1c2e61' }}>
                        {confirming ? 'Processing…' : '✓ Confirm & Book'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const RESERVATION_TTL_MS = 10 * 60 * 1000 // 10 minutes

const getCountdown = (createdAt: string | null | undefined, now: number) => {
  if (!createdAt) return { mm: 0, ss: 0, expired: true, remaining: 0 }
  const expiresAt = new Date(createdAt).getTime() + RESERVATION_TTL_MS
  const remaining = Math.max(0, expiresAt - now)
  return {
    mm: Math.floor(remaining / 60000),
    ss: Math.floor((remaining % 60000) / 1000),
    expired: remaining === 0,
    remaining,
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyReservations: React.FC = () => {
  const { user } = useAuth()
  const agencyId = (user as any)?.agency_id ?? null
  const today = new Date().toISOString().slice(0, 10)
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo]   = useState(today)
  const [selected, setSelected] = useState<any | null>(null)
  const [success, setSuccess] = useState('')
  const [now, setNow] = useState(Date.now())

  // Tick every second to drive countdown timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = () => {
    setLoading(true)
    agentApi.getMyReservations(1, 1000)
      .then(r => setReservations(r.reservations || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Only show 'reserved' status, filtered by reservation_date range and search
  const filtered = reservations.filter(r => {
    if (r.status !== 'reserved') return false
    if (r.reservation_date) {
      const d = String(r.reservation_date).slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo   && d > dateTo)   return false
    }
    const q = search.toLowerCase()
    return !q || r.passenger_name?.toLowerCase().includes(q) || r.booking_reference?.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Calendar className="h-4 w-4" style={{ color: '#1c2e61' }} />Seat Reservations
        </h1>
        <span className="text-[11px] text-gray-500">{filtered.length} active reservation{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {success && (
        <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-[11px] text-green-800 font-medium flex items-center justify-between">
          ✅ {success}
          <button onClick={() => setSuccess('')} className="text-green-600 ml-2">✕</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5 mb-3 flex flex-wrap gap-2 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input type="text" placeholder="Name or reference…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-md focus:ring-1 focus:outline-none" />
          </div>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-200 rounded-md focus:ring-1 focus:outline-none" />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-200 rounded-md focus:ring-1 focus:outline-none" />
        </div>

        {/* Today shortcut + clear */}
        <div className="flex gap-1.5">
          <button
            onClick={() => { setDateFrom(today); setDateTo(today) }}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
            Today
          </button>
          {(dateFrom !== today || dateTo !== today || search) && (
            <button
              onClick={() => { setDateFrom(today); setDateTo(today); setSearch('') }}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-gray-200 text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Ref</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Passenger</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Flight</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Seats</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Travel Date</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Fare</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Time Remaining</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#1c2e61' }} />
                </td></tr>
              ) : filtered.map((r: any) => {
                const { mm, ss, expired } = getCountdown(r.created_at, now)
                const isUrgent = !expired && mm === 0 && ss <= 60
                return (
                  <tr key={r.id} className={`transition-colors ${expired ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-2 text-[11px] font-mono font-semibold text-gray-900">{r.booking_reference}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-800">{r.passenger_name}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-600">
                      <div className="font-semibold">{r.flightSeries?.flt || '—'}</div>
                      {r.flightSeries && (
                        <div className="text-[10px] text-gray-400">
                          {r.flightSeries.fromDestination?.code} → {r.flightSeries.toDestination?.code}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-[11px] text-gray-700">{r.number_of_seats}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-500">
                      <div>{r.reservation_date ? new Date(r.reservation_date).toLocaleDateString() : '—'}</div>
                      {r.trip_type === 'return' && r.return_date && (
                        <div className="text-[9px] text-green-600 font-medium">↩ {new Date(r.return_date).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] font-medium text-gray-900">{fmt(r.fare_amount)}</td>
                    <td className="px-3 py-2 text-center">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                          <XCircle className="h-3 w-3" />Time passed
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full tabular-nums ${
                          isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : mm < 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelected(r)}
                          className="flex items-center gap-0.5 text-[10px] font-medium hover:opacity-80"
                          style={{ color: '#1c2e61' }}>
                          <Eye className="h-2.5 w-2.5" />View
                        </button>
                        {!expired && (
                          <button onClick={() => setSelected(r)}
                            className="flex items-center gap-0.5 text-[10px] text-green-600 hover:text-green-800 font-medium">
                            <CheckCircle className="h-2.5 w-2.5" />Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-[11px] text-gray-400">No active reservations.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReservationModal
          res={selected}
          agencyId={agencyId}
          onClose={() => setSelected(null)}
          onConfirmed={() => {
            setSuccess(`Reservation ${selected.booking_reference} confirmed as booking!`)
            setSelected(null)
            load()
          }}
        />
      )}
    </div>
  )
}

export default MyReservations
