import React from 'react'
import { Clock, Plane } from 'lucide-react'
import type { FlightSeries as FlightSeriesType } from '../services/api'

export interface FlightCalendarProps {
  month: number
  year: number
  flightSeries: FlightSeriesType[]
  onFlightClick: (flightSeriesId: number) => void
}

const FlightCalendar: React.FC<FlightCalendarProps> = ({ month, year, flightSeries, onFlightClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getFlightsForDate = (date: Date): FlightSeriesType[] => {
    const check = date.toISOString().split('T')[0]
    return flightSeries.filter(fs => new Date(fs.start_date).toISOString().split('T')[0] === check)
  }

  const formatTime = (time: string | null) => (time ? time.substring(0, 5) : 'N/A')

  const formatRoute = (fs: FlightSeriesType) => {
    if (fs.flight_type === 'From-Via_To') {
      return `${fs.fromDestination?.code || '?'}→${fs.viaDestination?.code || '?'}→${fs.toDestination?.code || '?'}`
    }
    if (fs.fromDestination && fs.toDestination) return `${fs.fromDestination.code}→${fs.toDestination.code}`
    return 'N/A'
  }

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 37, g: 99, b: 235 }
  }

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(new Date(year, month, d))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 mb-1">
          {days.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <div key={`e-${idx}`} className="bg-gray-50 min-h-[110px]" />
            }

            const flights = getFlightsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isPast = date < new Date() && !isToday

            return (
              <div
                key={date.toISOString()}
                className={`min-h-[110px] p-1.5 transition-colors ${
                  isToday ? 'bg-blue-50' : isPast ? 'bg-gray-50/70' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : isPast ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {flights.length > 0 && (
                    <span className="text-[9px] font-medium text-gray-400">{flights.length}✈</span>
                  )}
                </div>

                <div className="space-y-0.5 max-h-[72px] overflow-y-auto">
                  {flights.length === 0 ? (
                    <div className="text-[9px] text-gray-300 text-center pt-2">—</div>
                  ) : (
                    flights.map(fs => {
                      const rgb = hexToRgb((fs.aircraft as any)?.calendar_color || '#2563eb')
                      const bg = `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`
                      const border = `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`
                      const text = `rgb(${Math.max(0, rgb.r - 20)},${Math.max(0, rgb.g - 20)},${Math.max(0, rgb.b - 20)})`

                      return (
                        <div
                          key={fs.id}
                          onClick={e => { e.stopPropagation(); onFlightClick(fs.id) }}
                          className="rounded-md p-1 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                          title={`${fs.flt} – ${fs.aircraft?.name || ''} – click to view bookings`}
                        >
                          <div className="flex items-center gap-0.5 mb-0.5">
                            <Plane className="h-2 w-2 flex-shrink-0" style={{ color: text }} />
                            <span className="text-[9px] font-bold truncate leading-tight" style={{ color: text }}>{fs.flt}</span>
                          </div>
                          <div className="text-[8.5px] truncate leading-tight text-gray-500">{formatRoute(fs)}</div>
                          {fs.std && (
                            <div className="flex items-center gap-0.5 text-[8px] text-gray-400 mt-0.5">
                              <Clock className="h-1.5 w-1.5" />
                              <span>{formatTime(fs.std)}</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FlightCalendar
