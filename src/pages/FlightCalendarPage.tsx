import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FlightCalendar from '../components/FlightCalendar'
import { adminApiService, FlightSeries as FlightSeriesType } from '../services/api'

const FlightCalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchFlightSeries()
  }, [])

  const fetchFlightSeries = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getFlightSeries(1, 10000)
      setFlightSeries(result.flightSeries || [])
    } catch {
      setFlightSeries([])
    } finally {
      setLoading(false)
    }
  }

  const q = query.trim().toLowerCase()
  const filteredFlightSeries =
    q.length === 0
      ? flightSeries
      : flightSeries.filter(fs => {
          const flt = (fs.flt || '').toLowerCase()
          const from = (fs.fromDestination?.code || '').toLowerCase()
          const to = (fs.toDestination?.code || '').toLowerCase()
          const via = (fs.viaDestination?.code || '').toLowerCase()
          const route = `${from}-${via}-${to}`
          return flt.includes(q) || from.includes(q) || to.includes(q) || via.includes(q) || route.includes(q)
        })

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Flight Calendar</h1>
          <p className="text-xs text-gray-400">Click a flight to view bookings</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
              else setCurrentMonth(m => m - 1)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
              else setCurrentMonth(m => m + 1)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => { const n = new Date(); setCurrentMonth(n.getMonth()); setCurrentYear(n.getFullYear()) }}
            className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search flight</label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. RA101, HRE, HRE-JNB"
              className="w-full max-w-xl px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filteredFlightSeries.length.toLocaleString()}</span> flights
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600" />
          </div>
        ) : (
          <FlightCalendar
            month={currentMonth}
            year={currentYear}
            flightSeries={filteredFlightSeries}
            onFlightClick={id => navigate(`/bookings/flight/${id}/passengers`)}
          />
        )}
      </div>
    </div>
  )
}

export default FlightCalendarPage
