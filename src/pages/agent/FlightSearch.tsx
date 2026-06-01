import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { Search, Plane, Clock, XCircle, Plus, Minus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const token = () => localStorage.getItem('agentToken')

const apiGet = async (path: string) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const apiPost = async (path: string, body: any) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

interface PassengerForm { title: string; name: string; email: string; phone: string; nationality: string; id_type: string; id_number: string }
const emptyPax = (): PassengerForm => ({ title: '', name: '', email: '', phone: '', nationality: '', id_type: '', id_number: '' })
const ID_TYPES = [{ v: '', l: '— Select —' }, { v: 'national_id', l: 'National ID' }, { v: 'passport', l: 'Passport' }, { v: 'travel_document', l: 'Travel Document' }]
const TITLES = ['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
const fld = 'w-full px-2.5 py-2 text-[12px] border border-gray-300 rounded-lg focus:ring-2 focus:outline-none bg-white'
const fldStyle = { '--tw-ring-color': '#1c2e61' } as React.CSSProperties

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin',
  'Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia',
  'Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini',
  'Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania',
  'Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay',
  'Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis',
  'Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
  'Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste',
  'Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

const CountrySelect: React.FC<{ value: string; onChange: (v: string) => void; required?: boolean }> = ({ value, onChange, required }) => {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = React.useRef<HTMLDivElement>(null)

  const filtered = q.trim()
    ? COUNTRIES.filter(c => c.toLowerCase().includes(q.toLowerCase()))
    : COUNTRIES

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`${fld} flex items-center justify-between text-left ${!value ? 'text-gray-400' : 'text-gray-900'}`}
        style={fldStyle}>
        <span className="truncate">{value || 'Select country…'}</span>
        <svg className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {/* Hidden input for form required validation */}
      <input tabIndex={-1} required={required} value={value} onChange={() => {}}
        className="absolute opacity-0 w-0 h-0 pointer-events-none" />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input autoFocus type="text" placeholder="Search country…" value={q} onChange={e => setQ(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-[12px] border border-gray-200 rounded-md focus:outline-none" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <li className="px-3 py-2 text-[11px] text-gray-400">No countries found</li>
              : filtered.map(c => (
                <li key={c}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-gray-50 ${c === value ? 'font-semibold' : ''}`}
                  style={c === value ? { color: '#1c2e61', background: 'rgba(28,46,97,0.06)' } : undefined}
                  onMouseDown={() => { onChange(c); setOpen(false); setQ('') }}>
                  {c}
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
const DAY_MAP: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' }
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Flight Calendar ──────────────────────────────────────────────────────────
interface CalendarProps {
  value: string
  onChange: (d: string) => void
  fs: any                            // flight series
  bookedByDate: Record<string, number> // date → booked seats count
  minDate?: string
  label: string
}

const FlightCalendar: React.FC<CalendarProps> = ({ value, onChange, fs, bookedByDate, minDate, label }) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewYear,  setViewYear]  = useState(() => value ? new Date(value+'T12:00:00').getFullYear()  : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value+'T12:00:00').getMonth()     : today.getMonth())

  const fsStart  = fs ? new Date(String(fs.start_date).slice(0,10)+'T12:00:00') : null
  const fsEnd    = fs ? new Date(String(fs.end_date).slice(0,10)+'T12:00:00')   : null
  const allowedDays: string[] = fs?.days_of_week ? fs.days_of_week.split(',').map((d: string) => d.trim()) : []
  const totalSeats = Number(fs?.number_of_seats || 0)

  const getDayStatus = (date: Date): 'unavailable' | 'full' | 'low' | 'available' | 'past' => {
    if (date < today) return 'past'
    if (minDate && date < new Date(minDate+'T12:00:00')) return 'past'
    if (fsStart && date < fsStart) return 'unavailable'
    if (fsEnd   && date > fsEnd)   return 'unavailable'
    if (allowedDays.length > 0) {
      const dayLabel = DAY_MAP[date.getDay()]
      if (!allowedDays.includes(dayLabel)) return 'unavailable'
    }
    const dateStr = date.toISOString().slice(0,10)
    const booked  = bookedByDate[dateStr] || 0
    if (totalSeats > 0) {
      const remaining = totalSeats - booked
      if (remaining <= 0)  return 'full'
      if (remaining <= 3)  return 'low'
    }
    return 'available'
  }

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1 // Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (Date | null)[] = Array(startPad).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d, 12))
    return cells
  }, [viewYear, viewMonth])

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }

  const statusStyle: Record<string, string> = {
    past:        'text-gray-300 cursor-not-allowed',
    unavailable: 'bg-gray-100 text-gray-300 cursor-not-allowed',
    full:        'bg-red-100 text-red-700 cursor-not-allowed',
    low:         'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer font-semibold',
    available:   'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer font-semibold',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="text-[9px] font-semibold text-gray-500 uppercase px-2 pt-1.5">{label}</div>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
        <button type="button" onClick={prev} className="p-0.5 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-3 w-3 text-gray-500" />
        </button>
        <span className="text-[11px] font-semibold text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={next} className="p-0.5 hover:bg-gray-100 rounded">
          <ChevronRight className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 px-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-[9px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5 px-1 pb-1.5">
        {days.map((date, i) => {
          if (!date) return <div key={i} />
          const status = getDayStatus(date)
          const dateStr = date.toISOString().slice(0,10)
          const isSelected = dateStr === value
          const booked = bookedByDate[dateStr] || 0
          const remaining = totalSeats > 0 ? totalSeats - booked : null
          return (
            <button
              key={i}
              type="button"
              title={status === 'full' ? 'Full' : status === 'unavailable' ? 'Not operating' : status === 'past' ? 'Past' : remaining != null ? `${remaining} seats left` : 'Available'}
              disabled={status === 'past' || status === 'unavailable' || status === 'full'}
              onClick={() => onChange(dateStr)}
              className={`relative text-center text-[10px] py-1 rounded transition-colors ${statusStyle[status]} ${isSelected ? '!bg-blue-600 !text-white ring-2 ring-blue-400' : ''}`}
            >
              {date.getDate()}
              {status === 'low' && !isSelected && (
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 px-2 pb-1.5 flex-wrap">
        {[['bg-green-100','Available'],['bg-yellow-100','Low (≤3)'],['bg-red-100','Full'],['bg-gray-100','Not operating']].map(([bg, lbl]) => (
          <div key={lbl} className="flex items-center gap-0.5">
            <div className={`w-2 h-2 rounded ${bg}`} />
            <span className="text-[8px] text-gray-400">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface AvailInfo { total: number; booked: number; remaining: number; dateValid: boolean; reason?: string }

const BookingModal: React.FC<{
  fs: any; mode: 'reserve' | 'book'; agentId: number | undefined; agencyId: number | null
  allFlights: any[]
  isBalanceBlocked?: boolean
  agencyBalance?: number
  bookingLimit?: number | null
  onClose: () => void; onSuccess: (msg: string) => void
}> = ({ fs, mode, agentId, agencyId, allFlights, isBalanceBlocked, agencyBalance, bookingLimit, onClose, onSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pax, setPax] = useState<PassengerForm[]>([emptyPax()])
  const [isReturn, setIsReturn] = useState(false)
  const [returnFsId, setReturnFsId] = useState<number | ''>('')
  const [returnDate, setReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [outboundAvail, setOutboundAvail] = useState<AvailInfo | null>(null)
  const [returnAvail, setReturnAvail] = useState<AvailInfo | null>(null)
  const [checkingAvail, setCheckingAvail] = useState(false)
  const [outboundBookedByDate, setOutboundBookedByDate] = useState<Record<string,number>>({})
  const [returnBookedByDate,   setReturnBookedByDate]   = useState<Record<string,number>>({})

  const totalPax = adults + children + infants
  const returnFs = allFlights.find(f => f.id === Number(returnFsId)) || null

  // Build bookedByDate map for a flight series — uses booking_passengers (paid only)
  const buildBookedMap = async (fsId: number): Promise<Record<string,number>> => {
    try {
      return await apiGet(`/admin/bookings/seat-counts?flightSeriesId=${fsId}`)
    } catch { return {} }
  }

  // Load outbound bookings on mount
  useEffect(() => {
    buildBookedMap(fs.id).then(setOutboundBookedByDate)
  }, [fs.id])

  // Load return bookings when return flight changes
  useEffect(() => {
    if (returnFsId) buildBookedMap(Number(returnFsId)).then(setReturnBookedByDate)
    else setReturnBookedByDate({})
  }, [returnFsId])

  // Check availability for a flight series on a given date
  const checkAvailability = async (fsId: number, checkDate: string): Promise<AvailInfo | null> => {
    try {
      const fsSeries = allFlights.find(f => f.id === fsId)
      if (!fsSeries) return null

      // 1. Check date is within start_date → end_date
      const start = new Date(String(fsSeries.start_date).slice(0, 10) + 'T12:00:00')
      const end   = new Date(String(fsSeries.end_date).slice(0, 10)   + 'T12:00:00')
      const check = new Date(checkDate + 'T12:00:00')

      if (check < start) return { total: 0, booked: 0, remaining: 0, dateValid: false, reason: `Flight starts ${String(fsSeries.start_date).slice(0,10)}` }
      if (check > end)   return { total: 0, booked: 0, remaining: 0, dateValid: false, reason: `Flight ended ${String(fsSeries.end_date).slice(0,10)}` }

      // 2. If recurring, check day of week is in days_of_week
      if (fsSeries.days_of_week) {
        const allowedDays: string[] = fsSeries.days_of_week.split(',').map((d: string) => d.trim())
        const jsDay = check.getDay()
        const dayLabel = DAY_MAP[jsDay]
        if (!allowedDays.includes(dayLabel)) {
          return {
            total: 0, booked: 0, remaining: 0, dateValid: false,
            reason: `Flight operates ${allowedDays.join(', ')} only — ${checkDate} is a ${dayLabel}`,
          }
        }
      }

      // 3. Count existing reservations for this date
      const result = await apiGet(`/admin/seat-reservations?page=1&limit=10000&flightSeriesId=${fsId}`)
      const reservations: any[] = result.reservations || []
      const dayRes = reservations.filter((r: any) => {
        if (r.status === 'cancelled') return false
        return String(r.reservation_date).slice(0, 10) === checkDate
      })
      const booked = dayRes.reduce((s: number, r: any) => s + (Number(r.number_of_seats) || 1), 0)
      const total  = Number(fsSeries.number_of_seats || 0)
      return { total, booked, remaining: Math.max(0, total - booked), dateValid: true }
    } catch { return null }
  }

  // Re-check availability when date or flight changes
  useEffect(() => {
    if (!date) return
    setCheckingAvail(true)
    Promise.all([
      checkAvailability(fs.id, date),
      isReturn && returnFsId && returnDate ? checkAvailability(Number(returnFsId), returnDate) : Promise.resolve(null),
    ]).then(([out, ret]) => {
      setOutboundAvail(out)
      setReturnAvail(ret)
    }).finally(() => setCheckingAvail(false))
  }, [date, isReturn, returnFsId, returnDate])

  // Sync passenger forms to count
  useEffect(() => {
    setPax(prev => {
      const next = [...prev]
      while (next.length < totalPax) next.push(emptyPax())
      return next.slice(0, totalPax)
    })
  }, [totalPax])

  const updatePax = (i: number, field: keyof PassengerForm, val: string) =>
    setPax(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))

  // Fares: use return fares from outbound flight when return trip selected, or the return flight's own fares
  const adultFare  = isReturn
    ? Number(fs.adult_return_fare  ?? returnFs?.adult_fare  ?? fs.adult_fare  ?? 0)
    : Number(fs.adult_fare  ?? 0)
  const childFare  = isReturn
    ? Number(fs.child_return_fare  ?? returnFs?.child_fare  ?? fs.child_fare  ?? 0)
    : Number(fs.child_fare  ?? 0)
  const infantFare = isReturn
    ? Number(fs.infant_return_fare ?? returnFs?.infant_fare ?? fs.infant_fare ?? 0)
    : Number(fs.infant_fare ?? 0)
  const totalFare  = adults * adultFare + children * childFare + infants * infantFare

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Availability check before submitting
    if (outboundAvail && !outboundAvail.dateValid) {
      setError(`Outbound: ${outboundAvail.reason}`)
      return
    }
    if (outboundAvail && outboundAvail.total > 0 && outboundAvail.remaining < totalPax) {
      setError(`Only ${outboundAvail.remaining} seat(s) available on outbound flight for ${date}.`)
      return
    }
    if (isReturn && returnAvail && !returnAvail.dateValid) {
      setError(`Return: ${returnAvail.reason}`)
      return
    }
    if (isReturn && returnAvail && returnAvail.total > 0 && returnAvail.remaining < totalPax) {
      setError(`Only ${returnAvail.remaining} seat(s) available on return flight for ${returnDate}.`)
      return
    }
    if (isReturn && !returnFsId) { setError('Please select a return flight.'); return }
    if (isReturn && !returnDate) { setError('Please enter a return date.'); return }

    setSaving(true)
    try {
      if (mode === 'reserve') {
        // Create seat reservation
        const body: any = {
          flight_series_id: fs.id,
          number_of_seats: totalPax,
          passenger_name: pax[0]?.name || '',
          passenger_email: pax[0]?.email || '',
          passenger_phone: pax[0]?.phone || '',
          reservation_date: date,
          status: 'reserved',
          agent_id: agentId,
          trip_type: isReturn ? 'return' : 'one_way',
          return_flight_series_id: isReturn && returnFsId ? Number(returnFsId) : undefined,
          return_date: isReturn && returnDate ? returnDate : undefined,
          fare_amount: totalFare || undefined,
          payment_status: 'unpaid',
          notes: notes || undefined,
        }
        await apiPost('/admin/seat-reservations', body)
        onSuccess(`Reservation created for ${fs.flt}!`)
      } else {
        // Create booking
        const passengers = pax.map((p, i) => ({
          title: p.title || undefined,
          name: p.name,
          email: p.email || undefined,
          contact: p.phone || undefined,
          nationality: p.nationality || undefined,
          id_type: p.id_type || undefined,
          identification: p.id_number || undefined,
          passenger_type: i < adults ? 'adult' : i < adults + children ? 'child' : 'infant',
        }))
        await apiPost('/admin/bookings', {
          flight_series_id: fs.id,
          passengers,
          payment_method: 'agency_balance',
          booking_date: date,
          travel_date: date,
          agency_id: agencyId || undefined,
          notes: notes || undefined,
          is_return_trip: isReturn,
          return_date: isReturn && returnDate ? returnDate : undefined,
          return_flight_series_id: isReturn && returnFsId ? Number(returnFsId) : undefined,
        })
        onSuccess(`Booking confirmed for ${fs.flt}!`)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const Counter: React.FC<{ label: string; value: number; min?: number; onChange: (n: number) => void; fare: number }> = ({ label, value, min = 0, onChange, fare }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-[11px] font-medium text-gray-800">{label}</div>
        {fare > 0 && <div className="text-[10px] text-green-700 font-semibold">${fare.toFixed(2)} each</div>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
          <Minus className="h-3 w-3 text-gray-600" />
        </button>
        <span className="w-5 text-center text-[12px] font-bold text-gray-900">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
          <Plus className="h-3 w-3 text-gray-600" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 rounded-t-2xl" style={{ background: '#1c2e61' }}>
          <div>
            <h2 className="text-[16px] font-bold text-white">
              {mode === 'reserve' ? 'Make Reservation' : 'Book Flight'} — {fs.flt}
            </h2>
            <p className="text-[12px] text-white/60 mt-0.5">
              {fs.fromDestination?.code} → {fs.toDestination?.code}
              {fs.std ? `  ·  Dep ${fs.std}` : ''}
              {fs.sta ? `  Arr ${fs.sta}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <XCircle className="h-5 w-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── Travel Dates ── */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Travel Dates</h3>
            <div className={`grid gap-4 ${isReturn && returnFsId ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Outbound */}
              <div>
                <FlightCalendar
                  label={`Outbound — ${fs.flt} (${fs.fromDestination?.code || '?'} → ${fs.toDestination?.code || '?'})`}
                  value={date}
                  onChange={setDate}
                  fs={fs}
                  bookedByDate={outboundBookedByDate}
                  minDate={new Date().toISOString().slice(0,10)}
                />
                {date && outboundAvail && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between ${
                    !outboundAvail.dateValid || outboundAvail.remaining === 0 ? 'bg-red-50 text-red-700 border border-red-200' :
                    outboundAvail.remaining <= 3 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                    'bg-green-50 text-green-800 border border-green-200'}`}>
                    <span>{date}</span>
                    <span>
                      {checkingAvail ? 'Checking…' :
                       !outboundAvail.dateValid ? `❌ ${outboundAvail.reason}` :
                       outboundAvail.total === 0 ? 'Seat count not set' :
                       outboundAvail.remaining === 0 ? '🔴 No seats' :
                       outboundAvail.remaining <= 3 ? `⚠️ ${outboundAvail.remaining} left` :
                       `✅ ${outboundAvail.remaining}/${outboundAvail.total} seats`}
                    </span>
                  </div>
                )}
              </div>

              {/* Return */}
              {isReturn && returnFsId && (
                <div>
                  <FlightCalendar
                    label={`Return — ${returnFs?.flt || ''} (${returnFs?.fromDestination?.code || '?'} → ${returnFs?.toDestination?.code || '?'})`}
                    value={returnDate}
                    onChange={setReturnDate}
                    fs={returnFs}
                    bookedByDate={returnBookedByDate}
                    minDate={date}
                  />
                  {returnDate && returnAvail && (
                    <div className={`mt-2 px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between ${
                      !returnAvail.dateValid || returnAvail.remaining === 0 ? 'bg-red-50 text-red-700 border border-red-200' :
                      returnAvail.remaining <= 3 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                      'bg-green-50 text-green-800 border border-green-200'}`}>
                      <span>{returnDate}</span>
                      <span>
                        {checkingAvail ? 'Checking…' :
                         !returnAvail.dateValid ? `❌ ${returnAvail.reason}` :
                         returnAvail.total === 0 ? 'Seat count not set' :
                         returnAvail.remaining === 0 ? '🔴 No seats' :
                         returnAvail.remaining <= 3 ? `⚠️ ${returnAvail.remaining} left` :
                         `✅ ${returnAvail.remaining}/${returnAvail.total} seats`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Return trip toggle + flight selector */}
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isReturn}
                  onChange={e => { setIsReturn(e.target.checked); setReturnFsId(''); setReturnDate(''); setReturnAvail(null) }}
                  className="h-4 w-4 rounded" />
                <span className="text-[13px] font-semibold text-gray-700">Include Return Trip</span>
              </label>
              {isReturn && (
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Return Flight *</label>
                  <select value={returnFsId} onChange={e => setReturnFsId(e.target.value ? Number(e.target.value) : '')}
                    required={isReturn} className={fld} style={fldStyle}>
                    <option value="">Select return flight…</option>
                    {allFlights.filter(f => f.id !== fs.id).map(f => (
                      <option key={f.id} value={f.id}>
                        {f.flt} — {f.fromDestination?.code || '?'} → {f.toDestination?.code || '?'}
                        {f.adult_return_fare != null ? `  ($${Number(f.adult_return_fare).toFixed(2)} return)` : f.adult_fare != null ? `  ($${Number(f.adult_fare).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── Passenger Count ── */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Passengers</h3>
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4">
              <Counter label="Adults"   value={adults}   min={1} onChange={setAdults}   fare={adultFare} />
              <Counter label="Children" value={children} min={0} onChange={setChildren} fare={childFare} />
              <Counter label="Infants"  value={infants}  min={0} onChange={setInfants}  fare={infantFare} />
            </div>
            <div className="mt-2 flex justify-end">
              <span className="text-[13px] font-bold" style={{ color: '#1c2e61' }}>
                Total Fare: <span className="text-green-700">${totalFare.toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* ── Passenger Details ── */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Passenger Details</h3>
            <div className="space-y-4">
              {pax.map((p, i) => {
                const type = i < adults ? 'Adult' : i < adults + children ? 'Child' : 'Infant'
                const typeColor = type === 'Adult' ? 'text-[#1c2e61] bg-[#1c2e61]/10' : type === 'Child' ? 'text-purple-700 bg-purple-50' : 'text-pink-700 bg-pink-50'
                return (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0" style={{ background: '#1c2e61' }}>{i + 1}</div>
                      <span className="text-[13px] font-bold text-gray-800">Passenger {i + 1}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeColor}`}>{type}</span>
                    </div>

                    {/* Row 1: Title + Full Name */}
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      <div className="col-span-1">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Title *</label>
                        <select value={p.title} onChange={e => updatePax(i, 'title', e.target.value)}
                          required className={fld} style={fldStyle}>
                          {TITLES.map(t => <option key={t} value={t}>{t || '— Select —'}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Full Name *</label>
                        <input type="text" value={p.name} onChange={e => updatePax(i, 'name', e.target.value)}
                          required placeholder="As on travel document"
                          className={fld} style={fldStyle} />
                      </div>
                    </div>

                    {/* Row 2: Email + Phone */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email *</label>
                        <input type="email" value={p.email} onChange={e => updatePax(i, 'email', e.target.value)}
                          required placeholder="email@example.com"
                          className={fld} style={fldStyle} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Phone *</label>
                        <input type="tel" value={p.phone} onChange={e => updatePax(i, 'phone', e.target.value)}
                          required placeholder="+1 234 567 890"
                          className={fld} style={fldStyle} />
                      </div>
                    </div>

                    {/* Row 3: Nationality + ID Type + ID Number */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Nationality / Country *</label>
                        <CountrySelect
                          value={p.nationality}
                          onChange={v => updatePax(i, 'nationality', v)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">ID Type *</label>
                        <select value={p.id_type} onChange={e => updatePax(i, 'id_type', e.target.value)}
                          required className={fld} style={fldStyle}>
                          {ID_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          {p.id_type === 'passport' ? 'Passport No.' : 'ID Number'} *
                        </label>
                        <input type="text" value={p.id_number} onChange={e => updatePax(i, 'id_number', e.target.value)}
                          required placeholder="Enter ID number"
                          className={fld} style={fldStyle} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any special requirements…"
              className={fld + ' resize-none'} style={fldStyle} />
          </div>

          {/* Balance blocked notice inside modal */}
          {isBalanceBlocked && (
            <div className="px-4 py-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-red-800">Cannot proceed — balance below limit</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Balance: <strong>${(agencyBalance ?? 0).toFixed(2)}</strong> · Limit: <strong>${(bookingLimit ?? 0).toFixed(2)}</strong>
                </p>
              </div>
            </div>
          )}

          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-700 font-medium">{error}</div>}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1 pb-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 text-[13px] font-semibold border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || isBalanceBlocked}
              className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
              style={{ background: mode === 'reserve' ? '#b45309' : '#1c2e61' }}
              onMouseEnter={e => !saving && !isBalanceBlocked && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              {saving ? 'Processing…' : mode === 'reserve' ? 'Reserve Seats' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
// ─── All-Flights Calendar View ────────────────────────────────────────────────
const AllFlightsCalendar: React.FC<{
  allFlights: any[]
  onSelect: (fs: any, date: string) => void
  isBalanceBlocked?: boolean
}> = ({ allFlights, onSelect, isBalanceBlocked }) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bookedByFs, setBookedByFs] = useState<Record<number, Record<string, number>>>({})

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1)
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1)

  useEffect(() => {
    if (!allFlights.length) return
    Promise.all(
      allFlights.map(async fs => {
        try {
          // booking_passengers is the source of truth — counts only paid bookings per date
          const map: Record<string, number> = await apiGet(`/admin/bookings/seat-counts?flightSeriesId=${fs.id}`)
          return { id: fs.id as number, map }
        } catch { return { id: fs.id as number, map: {} as Record<string, number> } }
      })
    ).then(results => {
      const combined: Record<number, Record<string, number>> = {}
      results.forEach(({ id, map }) => { combined[id] = map })
      setBookedByFs(combined)
    })
  }, [allFlights])

  const remainingSeats = (fs: any, dateStr: string): number | null => {
    const total = Number(fs.number_of_seats || 0)
    if (!total) return null
    const booked = bookedByFs[fs.id]?.[dateStr] || 0
    return Math.max(0, total - booked)
  }

  const flightsOnDate = (date: Date): any[] => {
    return allFlights.filter(fs => {
      if (!fs.start_date || !fs.end_date) return false
      const start = new Date(String(fs.start_date).slice(0,10)+'T12:00:00')
      const end   = new Date(String(fs.end_date).slice(0,10)+'T12:00:00')
      if (date < start || date > end) return false
      if (fs.days_of_week) {
        const allowed = fs.days_of_week.split(',').map((d: string) => d.trim())
        const dayLabel = DAY_MAP[date.getDay()]
        if (!allowed.includes(dayLabel)) return false
      }
      return true
    })
  }

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (Date | null)[] = Array(startPad).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d, 12))
    return cells
  }, [viewYear, viewMonth])

  const selectedFlights = selectedDate ? flightsOnDate(new Date(selectedDate+'T12:00:00')) : []

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: '#1c2e61' }}>
          <button type="button" onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <p className="text-[12px] text-white/60 mt-0.5">Click a date to see available flights</p>
          </div>
          <button type="button" onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center py-3 text-[13px] font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="min-h-32 bg-gray-50/40 border-b border-gray-100" />
            const isPast    = date < today
            const dateStr   = date.toISOString().slice(0, 10)
            const flights   = isPast ? [] : flightsOnDate(date)
            const isToday   = date.toDateString() === today.toDateString()
            const hasFlights = flights.length > 0
            return (
              <div
                key={i}
                onClick={() => !isPast && setSelectedDate(dateStr)}
                className={`min-h-32 border-b border-gray-100 p-2.5 transition-all ${
                  isPast      ? 'bg-gray-50/60 cursor-not-allowed' :
                  hasFlights  ? 'hover:bg-emerald-50 cursor-pointer' :
                                'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {/* Date number */}
                <div className="flex justify-end mb-2">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold ${
                    isPast     ? 'text-gray-300' :
                    hasFlights ? 'text-gray-800' : 'text-gray-400'
                  }`} style={isToday ? { background: '#1c2e61', color: '#fff', boxShadow: '0 1px 4px rgba(28,46,97,0.4)' } : undefined}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Flight pills */}
                {!isPast && hasFlights && (
                  <div className="space-y-1">
                    {flights.slice(0, 3).map((fs: any) => {
                      const rem = remainingSeats(fs, dateStr)
                      const isFull = rem !== null && rem <= 0
                      const isLow  = rem !== null && rem > 0 && rem <= 3
                      return (
                        <div key={fs.id}
                          className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold leading-snug ${
                            isFull ? 'bg-red-100 text-red-700' :
                            isLow  ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-emerald-100 text-emerald-800'
                          }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">
                              <span className="font-bold">{fs.flt}</span>
                              <span className="opacity-70 ml-1 text-[10px]">
                                {fs.fromDestination?.code}→{fs.toDestination?.code}
                              </span>
                            </span>
                            {rem !== null && (
                              <span className={`shrink-0 text-[10px] font-bold ${
                                isFull ? 'text-red-600' : isLow ? 'text-yellow-700' : 'text-emerald-700'
                              }`}>
                                {isFull ? 'Full' : `${rem}s`}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {flights.length > 3 && (
                      <div className="text-[11px] font-semibold pl-0.5" style={{ color: '#1c2e61' }}>
                        +{flights.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {!isPast && !hasFlights && (
                  <p className="text-[11px] text-gray-300 text-center mt-1">—</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 px-6 py-3.5 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-emerald-100 border border-emerald-200" />
            <span className="text-[12px] text-gray-500">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-yellow-100 border border-yellow-200" />
            <span className="text-[12px] text-gray-500">Low seats (≤3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-red-100 border border-red-200" />
            <span className="text-[12px] text-gray-500">Fully booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-gray-100" />
            <span className="text-[12px] text-gray-500">No flights / Past</span>
          </div>
        </div>
      </div>

      {/* Date flights modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between shrink-0"
              style={{ background: '#1c2e61' }}
            >
              <div>
                <h3 className="text-[17px] font-bold text-white">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-[12px] text-white/60 mt-0.5">
                  {selectedFlights.length > 0
                    ? `${selectedFlights.length} flight${selectedFlights.length !== 1 ? 's' : ''} operating`
                    : 'No flights on this date'}
                </p>
              </div>
              <button onClick={() => setSelectedDate(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <XCircle className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              {selectedFlights.length === 0 ? (
                <div className="py-16 text-center">
                  <Plane className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                  <p className="text-[15px] text-gray-400 font-medium">No flights operating on this date</p>
                  <p className="text-[12px] text-gray-300 mt-1">Try selecting another date on the calendar</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {selectedFlights.map((fs: any) => {
                    const rem = remainingSeats(fs, selectedDate)
                    const isFull = rem !== null && rem <= 0
                    const isLow  = rem !== null && rem > 0 && rem <= 3
                    return (
                      <div key={fs.id} className={`px-6 py-4 flex items-center justify-between transition-colors ${isFull ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            isFull ? 'bg-red-100' : isLow ? 'bg-yellow-100' : ''
                          }`} style={!isFull && !isLow ? { background: 'rgba(28,46,97,0.1)' } : undefined}>
                            <Plane className={`h-6 w-6 ${isFull ? 'text-red-500' : isLow ? 'text-yellow-600' : ''}`}
                              style={!isFull && !isLow ? { color: '#1c2e61' } : undefined} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[16px] font-bold text-gray-900">{fs.flt}</span>
                              {rem !== null && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isFull ? 'bg-red-100 text-red-700' :
                                  isLow  ? 'bg-yellow-100 text-yellow-700' :
                                           'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {isFull ? 'Fully booked' : `${rem} seat${rem !== 1 ? 's' : ''} left`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[13px] font-semibold text-gray-700">{fs.fromDestination?.code || '—'}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-[13px] font-semibold text-gray-700">{fs.toDestination?.code || '—'}</span>
                              {fs.fromDestination?.name && (
                                <span className="text-[11px] text-gray-400 hidden sm:inline ml-1">
                                  {fs.fromDestination.name} → {fs.toDestination?.name}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {fs.std && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                  <Clock className="h-3 w-3" />{fs.std}{fs.sta ? ` → ${fs.sta}` : ''}
                                </span>
                              )}
                              {fs.adult_fare != null && (
                                <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  ${Number(fs.adult_fare).toFixed(2)}
                                </span>
                              )}
                              {fs.adult_return_fare != null && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                  style={{ color: '#1c2e61', background: 'rgba(28,46,97,0.08)' }}>
                                  Return ${Number(fs.adult_return_fare).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => { setSelectedDate(null); onSelect(fs, selectedDate) }}
                            disabled={isFull || isBalanceBlocked}
                            title={isBalanceBlocked ? 'Balance below booking limit' : undefined}
                            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border-2 border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Reserve
                          </button>
                          <button
                            onClick={() => { setSelectedDate(null); onSelect(fs, selectedDate) }}
                            disabled={isFull || isBalanceBlocked}
                            title={isBalanceBlocked ? 'Balance below booking limit' : undefined}
                            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: '#1c2e61' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#162450')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#1c2e61')}>
                            Book Now
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const FlightSearch: React.FC = () => {
  const { user } = useAuth()
  const [flightSeries, setFlightSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('calendar')
  const [modal, setModal] = useState<{ fs: any; mode: 'reserve' | 'book'; prefillDate?: string } | null>(null)
  const [success, setSuccess] = useState('')
  const [calendarRefresh, setCalendarRefresh] = useState(0)
  const [agency, setAgency] = useState<any>(null)

  const agencyId = (user as any)?.agency_id ?? null

  useEffect(() => {
    agentApi.getFlightSeries(1, 1000)
      .then(r => setFlightSeries(r.flightSeries || []))
      .catch(console.error)
      .finally(() => setLoading(false))
    if (agencyId) agentApi.getAgency(agencyId).then(setAgency).catch(() => {})
  }, [agencyId])

  const agencyBalance  = Number(agency?.balance      ?? (user as any)?.agency?.balance ?? 0)
  const bookingLimit   = agency?.booking_limit != null ? Number(agency.booking_limit)  : null
  const isBalanceBlocked = bookingLimit !== null && agencyBalance < bookingLimit

  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Unique origin/destination options from loaded flights
  const fromOptions = Array.from(
    new Map(flightSeries
      .filter(fs => fs.fromDestination?.code)
      .map(fs => [fs.fromDestination.code, fs.fromDestination])
    ).values()
  ).sort((a, b) => a.code.localeCompare(b.code))

  const toOptions = Array.from(
    new Map(flightSeries
      .filter(fs => fs.toDestination?.code)
      .map(fs => [fs.toDestination.code, fs.toDestination])
    ).values()
  ).sort((a, b) => a.code.localeCompare(b.code))

  const filtered = flightSeries
    .filter(fs => {
      if (!fs.end_date) return false
      const end = new Date(String(fs.end_date).slice(0, 10) + 'T12:00:00')
      return end >= today
    })
    .filter(fs => {
      if (fromFilter && fs.fromDestination?.code !== fromFilter) return false
      if (toFilter   && fs.toDestination?.code   !== toFilter)   return false
      const q = search.toLowerCase()
      return !q || fs.flt?.toLowerCase().includes(q) ||
        fs.fromDestination?.code?.toLowerCase().includes(q) ||
        fs.toDestination?.code?.toLowerCase().includes(q) ||
        fs.fromDestination?.name?.toLowerCase().includes(q) ||
        fs.toDestination?.name?.toLowerCase().includes(q)
    })

  const fmt = (n: number | null) => n != null ? `$${Number(n).toFixed(2)}` : '—'

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Search className="h-4 w-4" style={{ color: '#1c2e61' }} />Flight Search
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Find and book available flights</p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-medium">
          <button onClick={() => setView('list')}
            className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${view !== 'list' ? 'bg-white text-gray-600 hover:bg-gray-50' : ''}`}
            style={view === 'list' ? { background: '#1c2e61', color: '#fff' } : undefined}>
            <Search className="h-3 w-3" />List
          </button>
          <button onClick={() => setView('calendar')}
            className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${view !== 'calendar' ? 'bg-white text-gray-600 hover:bg-gray-50' : ''}`}
            style={view === 'calendar' ? { background: '#1c2e61', color: '#fff' } : undefined}>
            <Calendar className="h-3 w-3" />Calendar
          </button>
        </div>
      </div>

      {/* Destination search bar — shown in both views */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* From */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 ml-0.5">From</label>
            <div className="relative">
              <Plane className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 rotate-45" />
              <select
                value={fromFilter}
                onChange={e => setFromFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:ring-2 focus:outline-none bg-white appearance-none"
                style={{ '--tw-ring-color': '#1c2e61' } as any}
              >
                <option value="">All origins</option>
                {fromOptions.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name || d.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex items-end pb-0.5 sm:pt-5">
            <button
              type="button"
              onClick={() => { const f = fromFilter; setFromFilter(toFilter); setToFilter(f) }}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Swap origin and destination"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

          {/* To */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 ml-0.5">To</label>
            <div className="relative">
              <Plane className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <select
                value={toFilter}
                onChange={e => setToFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:ring-2 focus:outline-none bg-white appearance-none"
                style={{ '--tw-ring-color': '#1c2e61' } as any}
              >
                <option value="">All destinations</option>
                {toOptions.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name || d.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear */}
          {(fromFilter || toFilter || search) && (
            <div className="flex items-end pb-0.5 sm:pt-5">
              <button
                type="button"
                onClick={() => { setFromFilter(''); setToFilter(''); setSearch('') }}
                className="px-3 py-2 text-[11px] font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Flight number text search */}
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by flight number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1c2e61' } as any}
          />
        </div>

        {filtered.length > 0 && (fromFilter || toFilter || search) && (
          <p className="mt-1.5 text-[11px] text-gray-400">
            {filtered.length} flight{filtered.length !== 1 ? 's' : ''} match your search
          </p>
        )}
      </div>

      {success && (
        <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-[11px] text-green-800 font-medium flex items-center justify-between">
          ✅ {success}
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800 ml-2">✕</button>
        </div>
      )}

      {/* Balance blocked banner */}
      {isBalanceBlocked && (
        <div className="mb-3 px-4 py-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-red-800">Reservations &amp; bookings are disabled</p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Your agency balance (<strong>${agencyBalance.toFixed(2)}</strong>) is below the required booking limit
              (<strong>${bookingLimit!.toFixed(2)}</strong>). Please top up your account to continue booking.
            </p>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && !loading && (
        <AllFlightsCalendar
          key={calendarRefresh}
          allFlights={filtered}
          isBalanceBlocked={isBalanceBlocked}
          onSelect={(fs, date) => setModal({ fs, mode: 'reserve', prefillDate: date })}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map(fs => (
            <div key={fs.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:border-blue-200 transition-colors">
              {/* Flight header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plane className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[13px] font-bold text-gray-900">{fs.flt}</span>
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{fs.flight_type}</span>
              </div>
              <div className="text-[12px] font-semibold text-gray-800 mb-0.5">
                {fs.fromDestination?.code || '—'} → {fs.toDestination?.code || '—'}
              </div>
              <div className="text-[10px] text-gray-400 mb-2">
                {fs.fromDestination?.name}{fs.toDestination?.name ? ` → ${fs.toDestination.name}` : ''}
              </div>
              {(fs.std || fs.sta) && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
                  <Clock className="h-2.5 w-2.5" />{fs.std || '—'} → {fs.sta || '—'}
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mb-2">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase">Adult</div>
                  <div className="text-[12px] font-bold text-green-700">{fmt(fs.adult_fare)}</div>
                </div>
                {fs.adult_return_fare != null && (
                  <div className="text-center">
                    <div className="text-[9px] text-gray-400 uppercase">Return</div>
                    <div className="text-[12px] font-bold text-blue-700">{fmt(fs.adult_return_fare)}</div>
                  </div>
                )}
              </div>
              <div className="text-[9px] text-gray-400 mb-2">
                {String(fs.start_date).slice(0, 10)} → {String(fs.end_date).slice(0, 10)}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-100">
                <button
                  onClick={() => setModal({ fs, mode: 'reserve' })}
                  disabled={isBalanceBlocked}
                  title={isBalanceBlocked ? 'Balance below booking limit' : undefined}
                  className="py-1 text-[11px] font-medium rounded-md border border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reserve
                </button>
                <button
                  onClick={() => setModal({ fs, mode: 'book' })}
                  disabled={isBalanceBlocked}
                  title={isBalanceBlocked ? 'Balance below booking limit' : undefined}
                  className="py-1 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-12 text-center">
              <Plane className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-[12px] text-gray-500">No flights found.</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <BookingModal
          fs={modal.fs}
          mode={modal.mode}
          agentId={(user as any)?.id}
          agencyId={(user as any)?.agency_id ?? null}
          allFlights={flightSeries}
          isBalanceBlocked={isBalanceBlocked}
          agencyBalance={agencyBalance}
          bookingLimit={bookingLimit}
          onClose={() => setModal(null)}
          onSuccess={msg => { setSuccess(msg); setModal(null); setCalendarRefresh(n => n + 1) }}
        />
      )}
    </div>
  )
}

export default FlightSearch
