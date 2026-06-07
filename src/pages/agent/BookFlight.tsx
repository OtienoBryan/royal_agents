import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import {
  ArrowLeft, Plane, Calendar, Users, CheckCircle,
  Plus, Minus, ChevronRight, AlertTriangle, Search
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const tok = () => localStorage.getItem('agentToken')
const apiPost = async (path: string, body: any) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

const COUNTRY_TZ: Record<string, string> = {
  'Kenya': 'Africa/Nairobi', 'Uganda': 'Africa/Kampala', 'Tanzania': 'Africa/Dar_es_Salaam',
  'Rwanda': 'Africa/Kigali', 'Burundi': 'Africa/Bujumbura', 'Ethiopia': 'Africa/Addis_Ababa',
  'Somalia': 'Africa/Mogadishu', 'South Sudan': 'Africa/Juba', 'Sudan': 'Africa/Khartoum',
  'Djibouti': 'Africa/Djibouti', 'Eritrea': 'Africa/Asmara', 'Egypt': 'Africa/Cairo',
  'South Africa': 'Africa/Johannesburg', 'Nigeria': 'Africa/Lagos', 'Ghana': 'Africa/Accra',
  'Zambia': 'Africa/Lusaka', 'Zimbabwe': 'Africa/Harare', 'Mozambique': 'Africa/Maputo',
  'Malawi': 'Africa/Blantyre', 'Botswana': 'Africa/Gaborone', 'Namibia': 'Africa/Windhoek',
  'United Kingdom': 'Europe/London', 'United States': 'America/New_York',
  'India': 'Asia/Kolkata', 'UAE': 'Asia/Dubai', 'United Arab Emirates': 'Asia/Dubai', 'China': 'Asia/Shanghai',
}
const todayInTz = (tz: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

const ID_TYPES = [{ v: '', l: '— Select —' }, { v: 'national_id', l: 'National ID' }, { v: 'passport', l: 'Passport' }, { v: 'travel_document', l: 'Travel Document' }]
const TITLES   = ['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
const COUNTRIES = ['Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belgium','Bhutan','Bolivia','Botswana','Brazil','Brunei','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Ecuador','Egypt','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Georgia','Germany','Ghana','Greece','Guatemala','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Maldives','Mali','Malta','Mexico','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Nigeria','Norway','Oman','Pakistan','Panama','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe']

interface PaxForm { title: string; name: string; email: string; phone: string; nationality: string; id_type: string; id_number: string }
const emptyPax = (): PaxForm => ({ title: '', name: '', email: '', phone: '', nationality: '', id_type: '', id_number: '' })

// ─── Country dropdown ─────────────────────────────────────────────────────────
const CountrySelect: React.FC<{ value: string; onChange: (v: string) => void; required?: boolean }> = ({ value, onChange, required }) => {
  const [open, setOpen] = useState(false)
  const [q, setQ]       = useState('')
  const ref = React.useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  const filtered = q ? COUNTRIES.filter(c => c.toLowerCase().includes(q.toLowerCase())) : COUNTRIES
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full px-3 py-2.5 text-[13px] border rounded-xl flex items-center justify-between transition-colors ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'} ${!value ? 'text-gray-400' : 'text-gray-900'} bg-white`}>
        <span className="truncate">{value || 'Select nationality…'}</span>
        <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      <input tabIndex={-1} required={required} value={value} onChange={() => {}} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input autoFocus type="text" placeholder="Search country…" value={q} onChange={e => setQ(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <li key={c}
                className={`px-3.5 py-2.5 text-[13px] cursor-pointer transition-colors hover:bg-gray-50 ${c === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800'}`}
                onMouseDown={() => { onChange(c); setOpen(false); setQ('') }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Styled input helpers ─────────────────────────────────────────────────────
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors ${props.className ?? ''}`} />
)
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} className={`w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors appearance-none ${props.className ?? ''}`}>
    {children}
  </select>
)

// ─── Passenger search autofill ────────────────────────────────────────────────
interface PassengerSearchProps { onSelect: (p: any) => void }
const PassengerSearch: React.FC<PassengerSearchProps> = ({ onSelect }) => {
  const [q,       setQ]       = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await agentApi.searchPassengers(q.trim())
        setResults(res.passengers || [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search passenger by name, email, ID…"
          className="w-full pl-9 pr-3 py-2 text-[12px] border border-dashed border-blue-300 rounded-xl bg-blue-50/40 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {results.map(p => (
            <button key={p.id} type="button"
              onMouseDown={() => { onSelect(p); setQ(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-blue-600">{p.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-gray-900 truncate">
                  {p.title ? `${p.title} ` : ''}{p.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {p.email || p.contact || '—'}{p.identification ? ` · ${p.identification}` : ''}
                </p>
              </div>
              {p.nationality && <span className="text-[10px] text-gray-400 shrink-0">{p.nationality}</span>}
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && q.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl px-3 py-3 text-[12px] text-gray-400 text-center">No passengers found</div>
      )}
    </div>
  )
}

// ─── Flight Date Picker ───────────────────────────────────────────────────────
const DAY_MAP: Record<number, string> = { 1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',0:'Sun' }
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface FlightDatePickerProps {
  value: string
  onChange: (d: string) => void
  fs: any
  minDate?: string
  bookedByDate?: Record<string, number>
}

const FlightDatePicker: React.FC<FlightDatePickerProps> = ({ value, onChange, fs, minDate, bookedByDate = {} }) => {
  const today      = new Date(); today.setHours(0, 0, 0, 0)
  const effectiveMin = minDate ? new Date(minDate + 'T12:00:00') : today

  const initDate   = value ? new Date(value + 'T12:00:00') : effectiveMin
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initDate.getMonth())

  const fsStart      = fs?.start_date ? new Date(String(fs.start_date).slice(0, 10) + 'T12:00:00') : null
  const fsEnd        = fs?.end_date   ? new Date(String(fs.end_date).slice(0, 10)   + 'T12:00:00') : null
  const allowedDays: string[] = fs?.days_of_week
    ? fs.days_of_week.split(',').map((d: string) => d.trim())
    : []
  const capacity = Number(fs?.number_of_seats || 0)

  const getStatus = (date: Date): 'past' | 'out-of-range' | 'no-flight' | 'full' | 'low' | 'available' => {
    if (date < effectiveMin) return 'past'
    if (fsStart && date < fsStart) return 'out-of-range'
    if (fsEnd   && date > fsEnd)   return 'out-of-range'
    if (allowedDays.length > 0) {
      if (!allowedDays.includes(DAY_MAP[date.getDay()])) return 'no-flight'
    }
    const key    = date.toISOString().slice(0, 10)
    const booked = bookedByDate[key] || 0
    if (capacity > 0) {
      const rem = capacity - booked
      if (rem <= 0) return 'full'
      if (rem <= 3) return 'low'
    }
    return 'available'
  }

  const cells = React.useMemo(() => {
    const first    = new Date(viewYear, viewMonth, 1)
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
    const total    = new Date(viewYear, viewMonth + 1, 0).getDate()
    const arr: (Date | null)[] = Array(startPad).fill(null)
    for (let d = 1; d <= total; d++) arr.push(new Date(viewYear, viewMonth, d, 12))
    return arr
  }, [viewYear, viewMonth])

  const prev = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)
  const next = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1)

  const cellStyle: Record<string, string> = {
    past:           'text-gray-200 cursor-not-allowed',
    'out-of-range': 'text-gray-200 cursor-not-allowed',
    'no-flight':    'text-gray-300 cursor-not-allowed',
    full:           'bg-red-50 text-red-300 cursor-not-allowed',
    low:            'bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer font-semibold',
    available:      'bg-green-50 text-green-800 hover:bg-green-100 cursor-pointer font-semibold',
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white select-none">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <button type="button" onClick={prev} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-gray-500 rotate-180" />
        </button>
        <span className="text-[12px] font-bold text-gray-700">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={next} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 px-1 pt-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 px-1 pb-2">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const status     = getStatus(date)
          const dateStr    = date.toISOString().slice(0, 10)
          const isSelected = dateStr === value
          const disabled   = status === 'past' || status === 'out-of-range' || status === 'no-flight' || status === 'full'
          const booked     = bookedByDate[dateStr] || 0
          const rem        = capacity > 0 ? capacity - booked : null
          return (
            <button key={i} type="button" disabled={disabled}
              title={disabled ? (status === 'no-flight' ? 'No flight on this day' : status === 'full' ? 'Full' : 'Not available') : rem != null ? `${rem} seats left` : 'Available'}
              onClick={() => !disabled && onChange(dateStr)}
              className={`relative text-center text-[11px] py-1.5 rounded-lg transition-colors ${cellStyle[status]} ${isSelected ? '!bg-blue-600 !text-white ring-2 ring-blue-300' : ''}`}>
              {date.getDate()}
              {status === 'low' && !isSelected && (
                <span className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-amber-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3 px-3 pb-2 pt-1 border-t border-gray-50 flex-wrap">
        {[['bg-green-50 border border-green-200','Available'],['bg-amber-50 border border-amber-200','Low (<4)'],['bg-red-50 border border-red-200','Full'],['bg-gray-100','No flight']].map(([bg, lbl]) => (
          <div key={lbl} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded ${bg}`} />
            <span className="text-[9px] text-gray-400">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const BookFlight: React.FC = () => {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = location.state as { fs: any; mode: 'reserve' | 'book'; prefillDate?: string; agencyBalance?: number; bookingLimit?: number | null; isBalanceBlocked?: boolean } | null

  if (!state?.fs) { navigate('/flights', { replace: true }); return null }
  const { fs, mode, prefillDate, agencyBalance = 0, bookingLimit = null, isBalanceBlocked = false } = state
  const agentId   = (user as any)?.id
  const agencyId  = (user as any)?.agency_id ?? null
  const agentTz   = COUNTRY_TZ[(user as any)?.country ?? ''] ?? 'Africa/Nairobi'
  const todayLocal = todayInTz(agentTz)

  // Steps
  const STEPS = [
    { id: 1, label: 'Trip Details', icon: Calendar },
    { id: 2, label: 'Passengers',   icon: Users },
    { id: 3, label: 'Review',       icon: CheckCircle },
  ]
  const [step, setStep] = useState(1)

  const [date,       setDate]       = useState(prefillDate ?? todayLocal)
  const [adults,     setAdults]     = useState(1)
  const [children,   setChildren]   = useState(0)
  const [infants,    setInfants]    = useState(0)
  const [pax,        setPax]        = useState<PaxForm[]>([emptyPax()])
  const [isReturn,   setIsReturn]   = useState(false)
  const [returnFsId, setReturnFsId] = useState<number | ''>('')
  const [returnDate, setReturnDate] = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [allSeries,          setAllSeries]          = useState<any[]>([])
  const [bookedByDate,       setBookedByDate]       = useState<Record<string, number>>({})
  const [returnBookedByDate, setReturnBookedByDate] = useState<Record<string, number>>({})

  const totalPax = adults + children + infants

  useEffect(() => {
    agentApi.getFlightSeries(1, 1000).then(r => setAllSeries(r.flightSeries || [])).catch(() => {})
    agentApi.getBookedSeatCounts(fs.id).then(setBookedByDate).catch(() => {})
  }, [])

  useEffect(() => {
    if (returnFsId) agentApi.getBookedSeatCounts(Number(returnFsId)).then(setReturnBookedByDate).catch(() => {})
  }, [returnFsId])
  useEffect(() => {
    setPax(prev => {
      const next = [...prev]
      while (next.length < totalPax) next.push(emptyPax())
      return next.slice(0, totalPax)
    })
  }, [totalPax])

  const returnFs   = allSeries.find(f => f.id === Number(returnFsId)) || null
  const adultFare  = isReturn ? Number(fs.adult_return_fare ?? returnFs?.adult_fare ?? fs.adult_fare ?? 0) : Number(fs.adult_fare ?? 0)
  const childFare  = isReturn ? Number(fs.child_return_fare ?? returnFs?.child_fare ?? fs.child_fare ?? 0) : Number(fs.child_fare ?? 0)
  const infantFare = isReturn ? Number(fs.infant_return_fare ?? returnFs?.infant_fare ?? fs.infant_fare ?? 0) : Number(fs.infant_fare ?? 0)
  const totalFare  = adults * adultFare + children * childFare + infants * infantFare

  const updatePax = (i: number, field: keyof PaxForm, val: string) =>
    setPax(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))

  const normaliseTitle = (raw: string | null | undefined): string => {
    if (!raw) return ''
    const map: Record<string, string> = {
      'mr': 'Mr.', 'mr.': 'Mr.',
      'mrs': 'Mrs.', 'mrs.': 'Mrs.',
      'ms': 'Ms.', 'ms.': 'Ms.', 'miss': 'Ms.',
      'dr': 'Dr.', 'dr.': 'Dr.',
      'prof': 'Prof.', 'prof.': 'Prof.',
    }
    return map[raw.toLowerCase().trim()] ?? (TITLES.includes(raw) ? raw : '')
  }

  const updatePaxFromDb = (i: number, p: any) =>
    setPax(prev => prev.map((row, idx) => idx !== i ? row : {
      title:       normaliseTitle(p.title) || row.title,
      name:        p.name           != null && p.name  !== '' ? p.name           : row.name,
      email:       p.email          != null && p.email !== '' ? p.email          : row.email,
      phone:       p.contact        != null && p.contact !== '' ? p.contact      : row.phone,
      nationality: p.nationality    != null && p.nationality !== '' ? p.nationality : row.nationality,
      id_type:     p.id_type        != null && p.id_type !== '' ? p.id_type      : row.id_type,
      id_number:   p.identification != null && p.identification !== '' ? p.identification : row.id_number,
    }))

  const canGoStep2 = date && (!isReturn || (returnFsId && returnDate))
  const canGoStep3 = pax.every(p => p.name && p.email && p.phone && p.nationality && p.id_type && p.id_number && p.title)

  const handleSubmit = async () => {
    if (isBalanceBlocked) return
    setError(''); setSaving(true)
    try {
      if (mode === 'reserve') {
        const p0 = pax[0]
        await apiPost('/admin/seat-reservations', {
          flight_series_id: fs.id, number_of_seats: totalPax,
          passenger_name:  p0?.name  || '',
          passenger_title: p0?.title || undefined,
          passenger_email: p0?.email || '',
          passenger_phone: p0?.phone || '',
          id_type:         p0?.id_type   || undefined,
          id_number:       p0?.id_number || undefined,
          reservation_date: date, status: 'reserved', agent_id: agentId,
          trip_type: isReturn ? 'return' : 'one_way',
          return_flight_series_id: isReturn && returnFsId ? Number(returnFsId) : undefined,
          return_date: isReturn && returnDate ? returnDate : undefined,
          fare_amount: totalFare || undefined, payment_status: 'unpaid', notes: notes || undefined,
        })
      } else {
        const passengers = pax.map((p, i) => ({
          title: p.title || undefined, name: p.name, email: p.email || undefined, contact: p.phone || undefined,
          nationality: p.nationality || undefined, id_type: p.id_type || undefined, identification: p.id_number || undefined,
          passenger_type: i < adults ? 'adult' : i < adults + children ? 'child' : 'infant',
        }))
        await apiPost('/admin/bookings', {
          flight_series_id: fs.id, passengers, payment_method: 'agency_balance',
          booking_date: date, travel_date: date, agency_id: agencyId || undefined,
          notes: notes || undefined, is_return_trip: isReturn,
          return_date: isReturn && returnDate ? returnDate : undefined,
          return_flight_series_id: isReturn && returnFsId ? Number(returnFsId) : undefined,
        })
      }
      navigate(mode === 'reserve' ? '/reservations' : '/bookings', { state: { success: `${mode === 'reserve' ? 'Reservation created' : 'Booking confirmed'} for ${fs.flt}!` } })
    } catch (err: any) { setError(err.message || 'Failed. Please try again.'); setSaving(false) }
  }

  const PAX_COLORS = ['bg-blue-500','bg-purple-500','bg-pink-500','bg-orange-500','bg-teal-500','bg-rose-500']
  const [activePax, setActivePax] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1c2e61' }}>
                  <Plane className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[15px] font-bold text-gray-900">{fs.flt}</span>
                <span className="text-gray-400">·</span>
                <span className="text-[13px] text-gray-600 font-medium">
                  {fs.fromDestination?.code} → {fs.toDestination?.code}
                </span>
                {prefillDate && (
                  <><span className="text-gray-400">·</span>
                  <span className="text-[12px] text-gray-500">{prefillDate}</span></>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 ml-9">
                {mode === 'reserve' ? 'Seat Reservation' : 'Direct Booking'}
                {fs.adult_fare != null && ` · From $${Number(fs.adult_fare).toFixed(2)}/pax`}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {STEPS.map((s, i) => {
              const done    = step > s.id
              const active  = step === s.id
              const Icon    = s.icon
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => {
                      if (done || (s.id === 2 && canGoStep2) || (s.id === 3 && canGoStep2 && canGoStep3)) setStep(s.id)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                      active ? 'text-white shadow-sm' : done ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-50'
                    }`}
                    style={active ? { background: '#1c2e61' } : undefined}>
                    {done ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    {s.label}
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-0 lg:gap-6 p-4 lg:p-6 max-w-7xl mx-auto">

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* STEP 1 — Trip Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: '#1c2e61' }} />Travel Dates
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Departure Date *</label>
                    <FlightDatePicker
                      value={date}
                      onChange={setDate}
                      fs={fs}
                      minDate={todayLocal}
                      bookedByDate={bookedByDate}
                    />
                  </div>
                  {isReturn && returnFsId && (
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Return Date *</label>
                      <FlightDatePicker
                        value={returnDate}
                        onChange={setReturnDate}
                        fs={returnFs}
                        minDate={date || todayLocal}
                        bookedByDate={returnBookedByDate}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button type="button"
                    onClick={() => setIsReturn(r => !r)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border-2 transition-all ${isReturn ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isReturn ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {isReturn && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    Return trip
                  </button>
                  {isReturn && (
                    <Select value={returnFsId}
                      onChange={e => setReturnFsId(e.target.value ? Number(e.target.value) : '')}
                      className="flex-1 max-w-xs">
                      <option value="">Select return flight…</option>
                      {allSeries.filter(f =>
                        f.id !== fs.id &&
                        f.fromDestination?.code === fs.toDestination?.code
                      ).map(f => (
                        <option key={f.id} value={f.id}>
                          {f.flt} — {f.fromDestination?.code || '?'} → {f.toDestination?.code || '?'}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>

              {/* Passenger count */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: '#1c2e61' }} />Passengers
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Adults', sub: '12+ years', value: adults, min: 1, set: setAdults, fare: adultFare },
                    { label: 'Children', sub: '2–11 years', value: children, min: 0, set: setChildren, fare: childFare },
                    { label: 'Infants', sub: 'Under 2', value: infants, min: 0, set: setInfants, fare: infantFare },
                  ].map(({ label, sub, value, min, set, fare }) => (
                    <div key={label} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{label}</p>
                        <p className="text-[11px] text-gray-400">{sub}{fare > 0 ? ` · $${fare.toFixed(2)}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => set(Math.max(min, value - 1))}
                          className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-30"
                          disabled={value <= min}>
                          <Minus className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-[15px] font-bold text-gray-900">{value}</span>
                        <button type="button" onClick={() => set(value + 1)}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                          style={{ borderColor: '#1c2e61', color: '#1c2e61' }}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={!canGoStep2}
                onClick={() => canGoStep2 && setStep(2)}
                className="w-full py-3.5 text-[14px] font-bold text-white rounded-2xl disabled:opacity-40 transition-all shadow-sm"
                style={{ background: '#1c2e61' }}>
                Continue to Passenger Details →
              </button>
            </div>
          )}

          {/* STEP 2 — Passenger details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="h-4 w-4 text-gray-500" />
                </button>
                <h2 className="text-[15px] font-bold text-gray-900">Passenger Details</h2>
                <span className="text-[11px] text-gray-400 ml-1">
                  {pax.filter(p => p.name && p.email && p.phone && p.nationality && p.id_type && p.id_number && p.title).length}/{totalPax} complete
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Passenger tab bar */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                  {pax.map((p, i) => {
                    const done  = !!(p.name && p.email && p.phone && p.nationality && p.id_type && p.id_number && p.title)
                    const type  = i < adults ? 'Adult' : i < adults + children ? 'Child' : 'Infant'
                    const color = PAX_COLORS[i % PAX_COLORS.length]
                    const isActive = activePax === i
                    return (
                      <button key={i} type="button" onClick={() => setActivePax(i)}
                        className={`flex items-center gap-2 px-4 py-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all shrink-0 ${
                          isActive ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}>
                        <div className={`w-5 h-5 rounded-full ${done ? 'bg-green-500' : color} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span>{p.name ? p.name.split(' ')[0] : `Pax ${i + 1}`}</span>
                        <span className="text-[10px] text-gray-400">({type})</span>
                      </button>
                    )
                  })}
                </div>

                {/* Active passenger form */}
                {pax.map((p, i) => i !== activePax ? null : (
                  <div key={i} className="p-5 space-y-4">
                    {/* Autofill from DB */}
                    <PassengerSearch onSelect={selected => updatePaxFromDb(i, selected)} />
                    <div className="flex gap-3">
                      <div className="w-28 shrink-0">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Title *</label>
                        <Select value={p.title} onChange={e => updatePax(i, 'title', e.target.value)} required>
                          {TITLES.map(t => <option key={t} value={t}>{t || '—'}</option>)}
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Full Name *</label>
                        <Input type="text" value={p.name} onChange={e => updatePax(i, 'name', e.target.value)}
                          required placeholder="As shown on ID / passport" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Email *</label>
                        <Input type="email" value={p.email} onChange={e => updatePax(i, 'email', e.target.value)}
                          required placeholder="name@email.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Phone *</label>
                        <Input type="tel" value={p.phone} onChange={e => updatePax(i, 'phone', e.target.value)}
                          required placeholder="+254 700 000 000" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Nationality *</label>
                        <CountrySelect value={p.nationality} onChange={v => updatePax(i, 'nationality', v)} required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">ID Type *</label>
                        <Select value={p.id_type} onChange={e => updatePax(i, 'id_type', e.target.value)} required>
                          {ID_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                          {p.id_type === 'passport' ? 'Passport No.' : 'ID Number'} *
                        </label>
                        <Input type="text" value={p.id_number} onChange={e => updatePax(i, 'id_number', e.target.value)}
                          required placeholder="Enter number" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px]">
                        {p.name && p.email && p.phone && p.nationality && p.id_type && p.id_number && p.title
                          ? <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />Complete</span>
                          : <span className="text-gray-400">Fill all required fields</span>}
                      </span>
                      {activePax < totalPax - 1 && (
                        <button type="button" onClick={() => setActivePax(activePax + 1)}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          Next passenger <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Special Requests</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Wheelchair, meal preference, etc."
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
              </div>

              <button disabled={!canGoStep3} onClick={() => canGoStep3 && setStep(3)}
                className="w-full py-3.5 text-[14px] font-bold text-white rounded-2xl disabled:opacity-40 transition-all shadow-sm"
                style={{ background: '#1c2e61' }}>
                Review & Confirm →
              </button>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep(2)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-4 w-4 text-gray-500" /></button>
                <h2 className="text-[15px] font-bold text-gray-900">Review & Confirm</h2>
              </div>

              {/* Flight summary */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-3">Flight</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(28,46,97,0.1)' }}>
                    <Plane className="h-6 w-6" style={{ color: '#1c2e61' }} />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-gray-900">{fs.flt}</p>
                    <p className="text-[13px] text-gray-600">{fs.fromDestination?.name} → {fs.toDestination?.name}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{date}{isReturn && returnDate ? ` · Return ${returnDate}` : ''} · {totalPax} pax</p>
                  </div>
                </div>
              </div>

              {/* Passenger list */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-3">Passengers</h3>
                <div className="space-y-2">
                  {pax.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${PAX_COLORS[i % PAX_COLORS.length]} flex items-center justify-center text-white text-[11px] font-bold`}>{i + 1}</div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{p.title} {p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.nationality} · {p.id_type?.replace('_', ' ')} {p.id_number}</p>
                        </div>
                      </div>
                      <button onClick={() => setStep(2)} className="text-[11px] text-blue-600 hover:underline">Edit</button>
                    </div>
                  ))}
                </div>
              </div>

              {isBalanceBlocked && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-red-800">Balance below limit</p>
                    <p className="text-[11px] text-red-600">Balance: ${agencyBalance.toFixed(2)} · Limit: ${(bookingLimit ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-[13px] text-red-700 font-medium">{error}</div>}

              <button
                disabled={saving || isBalanceBlocked}
                onClick={handleSubmit}
                className="w-full py-4 text-[15px] font-bold text-white rounded-2xl disabled:opacity-40 transition-all shadow-md"
                style={{ background: mode === 'reserve' ? '#b45309' : '#1c2e61' }}>
                {saving ? 'Processing…' : mode === 'reserve' ? '✓ Confirm Reservation' : '✓ Confirm Booking'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right sidebar — price summary ── */}
        <div className="hidden lg:block w-72 shrink-0 space-y-4 self-start sticky top-24">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-3">Price Summary</h3>
            <div className="space-y-2 text-[13px]">
              {adults > 0 && adultFare > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>{adults} Adult{adults !== 1 ? 's' : ''}</span>
                  <span className="font-semibold">${(adults * adultFare).toFixed(2)}</span>
                </div>
              )}
              {children > 0 && childFare > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>{children} Child{children !== 1 ? 'ren' : ''}</span>
                  <span className="font-semibold">${(children * childFare).toFixed(2)}</span>
                </div>
              )}
              {infants > 0 && infantFare > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>{infants} Infant{infants !== 1 ? 's' : ''}</span>
                  <span className="font-semibold">${(infants * infantFare).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 mt-1 flex justify-between font-bold text-gray-900 text-[15px]">
                <span>Total</span>
                <span style={{ color: '#1c2e61' }}>${totalFare.toFixed(2)}</span>
              </div>
              {isReturn && <p className="text-[10px] text-gray-400 text-center">Round trip · All passengers</p>}
            </div>
          </div>

          {date && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-[12px] text-gray-600 space-y-2">
              <p className="font-bold text-gray-800 text-[13px]">{fs.flt} Summary</p>
              <p>📅 {date}</p>
              <p>✈️ {fs.fromDestination?.code} → {fs.toDestination?.code}</p>
              {fs.std && <p>🕐 Dep {fs.std}{fs.sta ? ` · Arr ${fs.sta}` : ''}</p>}
              {isReturn && returnDate && <p>🔄 Return {returnDate}</p>}
              <p>👥 {totalPax} passenger{totalPax !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookFlight
