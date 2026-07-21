import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { Search, Plane, Clock, XCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Main page ────────────────────────────────────────────────────────────────
// ─── All-Flights Calendar View ────────────────────────────────────────────────
const AllFlightsCalendar: React.FC<{
  allFlights: any[]           // individual flight records from the flights table
  onSelect: (fs: any, date: string) => void
  isBalanceBlocked?: boolean
}> = ({ allFlights, onSelect, isBalanceBlocked }) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1)
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1)

  // Safely convert any date representation to "YYYY-MM-DD"
  const toStr = (d: any): string | null => {
    if (!d) return null
    if (d instanceof Date) return d.toISOString().slice(0, 10)
    const s = String(d)
    // ISO full string e.g. "2026-06-02T00:00:00.000Z"
    if (s.includes('T')) return s.slice(0, 10)
    return s.slice(0, 10)
  }

  // Group flights by their explicit flight_date — no computation needed
  const flightsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const f of allFlights) {
      const d = toStr(f.flight_date)
      if (!d) continue
      if (!map[d]) map[d] = []
      map[d].push(f)
    }
    return map
  }, [allFlights])

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (Date | null)[] = Array(startPad).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d, 12))
    return cells
  }, [viewYear, viewMonth])

  const selectedFlights = selectedDate ? (flightsByDate[selectedDate] ?? []) : []

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#1c2e61' }}>
          <button type="button" onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <p className="text-[10px] text-white/60 mt-0.5">Click a date to see available flights</p>
          </div>
          <button type="button" onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center py-1.5 text-[11px] font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="min-h-20 bg-gray-50/40 border-b border-gray-100" />
            const isPast    = date < today
            const dateStr   = date.toISOString().slice(0, 10)
            const flights   = isPast ? [] : (flightsByDate[dateStr] ?? [])
            const isToday   = date.toDateString() === today.toDateString()
            const hasFlights = flights.length > 0
            return (
              <div
                key={i}
                onClick={() => !isPast && setSelectedDate(dateStr)}
                className={`min-h-20 border-b border-gray-100 p-1.5 transition-all ${
                  isPast      ? 'bg-gray-50/60 cursor-not-allowed' :
                  hasFlights  ? 'hover:bg-emerald-50 cursor-pointer' :
                                'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {/* Date number */}
                <div className="flex justify-end mb-1">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                    isPast     ? 'text-gray-300' :
                    hasFlights ? 'text-gray-800' : 'text-gray-400'
                  }`} style={isToday ? { background: '#1c2e61', color: '#fff', boxShadow: '0 1px 4px rgba(28,46,97,0.4)' } : undefined}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Flight pills — available_seats comes directly from the flights table */}
                {!isPast && hasFlights && (
                  <div className="space-y-1">
                    {flights.slice(0, 3).map((f: any) => {
                      const rem    = f.available_seats ?? null
                      const isFull = rem !== null && rem <= 0
                      const isLow  = rem !== null && rem > 0 && rem <= 3
                      return (
                        <div key={f.id}
                          className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold leading-snug ${
                            isFull ? 'bg-red-100 text-red-700' :
                            isLow  ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-emerald-100 text-emerald-800'
                          }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">
                              <span className="font-bold">{f.flight_no}</span>
                              <span className="opacity-70 ml-1 text-[10px]">
                                {f.series?.fromDestination?.code}→{f.series?.toDestination?.code}
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
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200" />
            <span className="text-[10px] text-gray-500">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-md bg-yellow-100 border border-yellow-200" />
            <span className="text-[10px] text-gray-500">Low seats (≤3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-md bg-red-100 border border-red-200" />
            <span className="text-[10px] text-gray-500">Fully booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-md bg-gray-100" />
            <span className="text-[10px] text-gray-500">No flights / Past</span>
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
                  {selectedFlights.map((f: any) => {
                    const fs   = f.series ?? {}          // flight series for fares/route
                    const rem  = f.available_seats ?? null
                    const isFull = rem !== null && rem <= 0
                    const isLow  = rem !== null && rem > 0 && rem <= 3
                    return (
                      <div key={f.id} className={`px-6 py-4 flex items-center justify-between transition-colors ${isFull ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            isFull ? 'bg-red-100' : isLow ? 'bg-yellow-100' : ''
                          }`} style={!isFull && !isLow ? { background: 'rgba(28,46,97,0.1)' } : undefined}>
                            <Plane className={`h-6 w-6 ${isFull ? 'text-red-500' : isLow ? 'text-yellow-600' : ''}`}
                              style={!isFull && !isLow ? { color: '#1c2e61' } : undefined} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[16px] font-bold text-gray-900">{f.flight_no}</span>
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
                            onClick={() => { setSelectedDate(null); onSelect(f.series, f.flight_date) }}
                            disabled={isFull || isBalanceBlocked}
                            title={isBalanceBlocked ? 'Balance below booking limit' : undefined}
                            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border-2 border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Reserve
                          </button>
                          <button
                            onClick={() => { setSelectedDate(null); onSelect(f.series, f.flight_date) }}
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
  const navigate  = useNavigate()
  // flights from the flights table (individual dated records)
  const [allFlights, setAllFlights] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter]     = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [success, setSuccess]       = useState('')
  const [calendarRefresh] = useState(0)
  const [agency, setAgency]         = useState<any>(null)

  const openBooking = (fs: any, prefillDate: string | undefined, mode: 'reserve' | 'book') => {
    navigate('/book', {
      state: {
        fs, mode, prefillDate,
        agencyBalance, bookingLimit, isBalanceBlocked,
      }
    })
  }

  const agencyId = (user as any)?.agency_id ?? null

  const loadFlights = () => {
    setLoading(true)
    agentApi.getAvailableFlights()
      .then(r => setAllFlights(r.flights || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFlights()
    if (agencyId) agentApi.getAgency(agencyId).then(setAgency).catch(() => {})
  }, [agencyId])

  const agencyBalance    = Number(agency?.balance      ?? (user as any)?.agency?.balance ?? 0)
  const bookingLimit     = agency?.booking_limit != null ? Number(agency.booking_limit)  : null
  const isBalanceBlocked = bookingLimit !== null && agencyBalance < bookingLimit

  // Unique origin/destination options derived from loaded flights
  const fromOptions = Array.from(
    new Map(allFlights
      .filter(f => f.series?.fromDestination?.code)
      .map(f => [f.series.fromDestination.code, f.series.fromDestination])
    ).values()
  ).sort((a, b) => a.code.localeCompare(b.code))

  const toOptions = Array.from(
    new Map(allFlights
      .filter(f => f.series?.toDestination?.code)
      .map(f => [f.series.toDestination.code, f.series.toDestination])
    ).values()
  ).sort((a, b) => a.code.localeCompare(b.code))

  // Each element is already a specific dated flight — just apply search/route filters
  const filtered = allFlights.filter(f => {
    const from = f.series?.fromDestination?.code
    const to   = f.series?.toDestination?.code
    if (fromFilter && from !== fromFilter) return false
    if (toFilter   && to   !== toFilter)   return false
    const q = search.toLowerCase()
    return !q ||
      f.flight_no?.toLowerCase().includes(q) ||
      from?.toLowerCase().includes(q) ||
      to?.toLowerCase().includes(q) ||
      f.series?.fromDestination?.name?.toLowerCase().includes(q) ||
      f.series?.toDestination?.name?.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Search className="h-4 w-4" style={{ color: '#1c2e61' }} />Flight Search
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Find and book available flights</p>
        </div>
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
            showFilters ? 'text-white' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
          style={showFilters ? { background: '#1c2e61', borderColor: '#1c2e61' } : undefined}
        >
          <Filter className="h-3 w-3" />Filters
          {(fromFilter || toFilter || search) && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          )}
        </button>
      </div>

      {/* Destination search bar — toggleable */}
      {showFilters && (
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
      )}

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
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <AllFlightsCalendar
          key={calendarRefresh}
          allFlights={filtered}
          isBalanceBlocked={isBalanceBlocked}
          onSelect={(fs, date) => openBooking(fs, date, 'reserve')}
        />
      )}

    </div>
  )
}

export default FlightSearch
