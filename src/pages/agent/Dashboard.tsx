import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { Ticket, Calendar, DollarSign, TrendingUp, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react'
import FlightSearch from './FlightSearch'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [bookings, setBookings]     = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [agency, setAgency]         = useState<any>(null)

  const agencyId = (user as any)?.agency_id ?? null

  useEffect(() => {
    const calls: Promise<any>[] = [
      agentApi.getMyBookings(1, 1000),
      agentApi.getMyReservations(1, 1000),
    ]
    if (agencyId) calls.push(agentApi.getAgency(agencyId))

    Promise.all(calls).then(([b, r, a]) => {
      setBookings(b.bookings || [])
      setReservations(r.reservations || [])
      if (a) setAgency(a)
    }).catch(console.error)
  }, [agencyId])

  const confirmedBookings = bookings.filter((b: any) => b.payment_status === 'paid').length
  const balance      = Number(agency?.balance      ?? (user as any)?.agency?.balance      ?? 0)
  const bookingLimit = agency?.booking_limit != null ? Number(agency.booking_limit) : null

  // Colour-coded balance status
  const balanceBelowLimit = bookingLimit !== null && balance < bookingLimit
  const balanceClose      = bookingLimit !== null && !balanceBelowLimit && (balance - bookingLimit) < bookingLimit * 0.2
  // "close" = within 20% above the limit

  const balanceStatus: 'danger' | 'warning' | 'ok' =
    balanceBelowLimit ? 'danger' : balanceClose ? 'warning' : 'ok'

  const balanceColors = {
    danger:  { border: '#ef4444', bg: 'rgba(239,68,68,0.08)',   text: '#dc2626', label: 'bg-red-100 text-red-700'    },
    warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  text: '#d97706', label: 'bg-yellow-100 text-yellow-800' },
    ok:      { border: '#22c55e', bg: 'rgba(34,197,94,0.08)',   text: '#16a34a', label: 'bg-green-100 text-green-800'  },
  }[balanceStatus]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3">
        <div className="mb-3">
          <h1 className="text-base font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">{(user as any)?.agency?.name || agency?.name || 'Agent Portal'}</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          {/* Total Bookings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase">Total Bookings</span>
              <div className="p-1 rounded" style={{ background: 'rgba(28,46,97,0.08)' }}>
                <Ticket className="h-4 w-4" style={{ color: '#1c2e61' }} />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{bookings.length}</p>
          </div>

          {/* Confirmed / Paid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase">Confirmed</span>
              <div className="p-1 rounded" style={{ background: 'rgba(22,163,74,0.1)' }}>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{confirmedBookings}</p>
          </div>

          {/* Reservations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase">Reservations</span>
              <div className="p-1 rounded" style={{ background: 'rgba(147,51,234,0.1)' }}>
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{reservations.filter((r: any) => r.status === 'reserved').length}</p>
          </div>

          {/* Agency Balance — colour-coded */}
          <div className="bg-white rounded-lg shadow-sm border-2 p-2.5 transition-colors"
            style={{ borderColor: balanceColors.border, background: balanceColors.bg }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase">Balance</span>
              <div className="p-1 rounded" style={{ background: 'rgba(202,138,4,0.1)' }}>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-lg font-bold" style={{ color: balanceColors.text }}>{fmt(balance)}</p>
            {balanceBelowLimit && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 mt-1">
                <AlertTriangle className="h-2.5 w-2.5" />Below limit
              </span>
            )}
            {balanceClose && !balanceBelowLimit && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 mt-1">
                <AlertTriangle className="h-2.5 w-2.5" />Near limit
              </span>
            )}
          </div>

          {/* Booking Limit */}
          <div className="bg-white rounded-lg shadow-sm border-2 p-2.5 transition-colors"
            style={{ borderColor: balanceColors.border, background: balanceColors.bg }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-500 uppercase">Booking Limit</span>
              <div className="p-1 rounded" style={{ background: balanceBelowLimit ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>
                {balanceBelowLimit
                  ? <ShieldAlert className="h-4 w-4 text-red-500" />
                  : <ShieldCheck className="h-4 w-4 text-green-600" />}
              </div>
            </div>
            <p className="text-lg font-bold" style={{ color: balanceColors.text }}>
              {bookingLimit !== null ? fmt(bookingLimit) : '—'}
            </p>
            {bookingLimit !== null && (
              <p className="text-[9px] text-gray-400 mt-0.5">
                Margin: <span className="font-semibold" style={{ color: balanceColors.text }}>
                  {fmt(Math.max(0, balance - bookingLimit))}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* ── Limit notification banner ── */}
        {bookingLimit !== null && balanceBelowLimit && (
          <div className="mb-3 px-4 py-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-red-800">Balance below booking limit</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                Your agency balance of <strong>{fmt(balance)}</strong> is below the required booking limit of <strong>{fmt(bookingLimit)}</strong>.
                You cannot confirm new bookings until the balance is topped up.
              </p>
            </div>
          </div>
        )}

        {bookingLimit !== null && balanceClose && !balanceBelowLimit && (
          <div className="mb-3 px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-yellow-800">Balance approaching booking limit</p>
              <p className="text-[11px] text-yellow-700 mt-0.5">
                Your balance of <strong>{fmt(balance)}</strong> is within <strong>{fmt(balance - bookingLimit)}</strong> of the booking limit (<strong>{fmt(bookingLimit)}</strong>).
                Consider topping up soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flight search */}
      <div className="-mt-1">
        <FlightSearch />
      </div>
    </div>
  )
}

export default Dashboard
