import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Booking, FlightSeries as FlightSeriesType } from '../services/api'
import { Calendar, Search, Users, Plane, Eye } from 'lucide-react'

interface FlightWithBookings {
  flightSeries: FlightSeriesType
  bookings: Booking[]
  totalPassengers: number
  totalRevenue: number
}

const Bookings: React.FC = () => {
  const navigate = useNavigate()

  // Get current month's start and end dates
  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    }
  }

  const currentMonth = getCurrentMonthDates()

  const [flightsWithBookings, setFlightsWithBookings] = useState<FlightWithBookings[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState(currentMonth.start)
  const [endDate, setEndDate] = useState(currentMonth.end)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getBookings(1, 10000) // Get all bookings to group by flight

      // Group bookings by flight_series_id
      const flightMap = new Map<number, FlightWithBookings>()

      result.bookings.forEach(booking => {
        if (!booking.flightSeries) return

        const flightId = booking.flight_series_id
        if (!flightMap.has(flightId)) {
          flightMap.set(flightId, {
            flightSeries: booking.flightSeries,
            bookings: [],
            totalPassengers: 0,
            totalRevenue: 0
          })
        }

        const flightData = flightMap.get(flightId)!
        flightData.bookings.push(booking)
        flightData.totalPassengers += booking.number_of_passengers
        flightData.totalRevenue += Number(booking.total_amount) || 0
      })

      // Convert map to array and sort by flight date
      const flightsArray = Array.from(flightMap.values()).sort((a, b) => {
        const dateA = new Date(a.flightSeries.start_date).getTime()
        const dateB = new Date(b.flightSeries.start_date).getTime()
        return dateB - dateA // Most recent first
      })

      setFlightsWithBookings(flightsArray)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setFlightsWithBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewPassengers = (flightId: number) => {
    navigate(`/bookings/flight/${flightId}/passengers`)
  }

  const filteredFlights = flightsWithBookings.filter(flight => {
    // Text search filter
    const matchesSearch = flight.flightSeries.flt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.flightSeries.flight_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flight.flightSeries.fromDestination?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flight.flightSeries.toDestination?.name?.toLowerCase().includes(searchTerm.toLowerCase()))

    // Date range filter
    const flightDate = new Date(flight.flightSeries.start_date)
    const matchesDateRange = (!startDate || flightDate >= new Date(startDate)) &&
      (!endDate || flightDate <= new Date(endDate))

    return matchesSearch && matchesDateRange
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }


  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        <div className="mb-2 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Bookings
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">View all scheduled flights and their passengers</p>
          </div>
        </div>

        <div className="bg-white rounded shadow mb-2 p-2">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <input
                type="text"
                placeholder="Search by flight number, type, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
                  placeholder="Start Date"
                />
              </div>
              <span className="text-[11px] text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
                placeholder="End Date"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="px-1.5 py-1 text-[11px] text-gray-600 hover:text-gray-900 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {filteredFlights.map((flightData) => (
            <div key={flightData.flightSeries.id} className="bg-white rounded shadow overflow-hidden">
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Plane className="h-3.5 w-3.5 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-gray-900">
                        {flightData.flightSeries.flt} - {flightData.flightSeries.flight_type}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {flightData.flightSeries.fromDestination?.code || 'N/A'} → {flightData.flightSeries.toDestination?.code || 'N/A'}
                        {flightData.flightSeries.viaDestination && ` (via ${flightData.flightSeries.viaDestination.code})`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-600">
                    <div className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      <span>{flightData.totalPassengers} passengers</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span>{formatCurrency(flightData.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>{formatDate(flightData.flightSeries.start_date)}</span>
                    </div>
                    <button
                      onClick={() => handleViewPassengers(flightData.flightSeries.id)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
                    >
                      <Eye className="h-2.5 w-2.5" />
                      View Passengers
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFlights.length === 0 && !loading && (
          <div className="bg-white rounded shadow p-4 text-center">
            <Calendar className="mx-auto h-5 w-5 text-gray-400" />
            <h3 className="mt-1 text-[11px] font-medium text-gray-900">No flights with bookings found</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No bookings have been created yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Bookings

