import React, { useState, useEffect } from 'react'
import { adminApiService, FlightSeries as FlightSeriesType } from '../services/api'
import { Search, Plane, Calendar, Edit } from 'lucide-react'
import FarePriceModal from '../components/FarePriceModal'

const Fares: React.FC = () => {
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState<string>('') // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>('') // YYYY-MM-DD
  const [page, setPage] = useState(1)
  const [isFareModalOpen, setIsFareModalOpen] = useState(false)
  const [selectedFlightSeries, setSelectedFlightSeries] = useState<FlightSeriesType | null>(null)
  const [limit, setLimit] = useState(15)

  useEffect(() => {
    fetchFlightSeries()
    // We paginate client-side (based on filters), so keep server fetch independent
  }, [])

  const fetchFlightSeries = async () => {
    try {
      setLoading(true)
      // Fetch a large page and paginate client-side so search/date filters are accurate.
      const result = await adminApiService.getFlightSeries(1, 10000)
      setFlightSeries(result.flightSeries || [])
    } catch (error) {
      console.error('Error fetching flight series:', error)
      setFlightSeries([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDestinationRoute = (fs: FlightSeriesType) => {
    if (fs.flight_type === 'From-Via_To') {
      const from = fs.fromDestination ? fs.fromDestination.code : 'N/A'
      const via = fs.viaDestination ? fs.viaDestination.code : 'N/A'
      const to = fs.toDestination ? fs.toDestination.code : 'N/A'
      return `${from} → via ${via} → ${to}`
    } else if (fs.fromDestination && fs.toDestination) {
      return `${fs.fromDestination.code} → ${fs.toDestination.code}`
    }
    return 'N/A'
  }

  const handleEditFare = (fs: FlightSeriesType) => {
    setSelectedFlightSeries(fs)
    setIsFareModalOpen(true)
  }

  const handleSaveFare = async (flightSeriesId: number, farePrices: { adult_fare: number | null; child_fare: number | null; infant_fare: number | null }) => {
    try {
      await adminApiService.updateFlightSeries(flightSeriesId, farePrices)
      await fetchFlightSeries()
      setIsFareModalOpen(false)
      setSelectedFlightSeries(null)
    } catch (error) {
      console.error('Error updating fare prices:', error)
      throw error
    }
  }

  const filteredFlightSeries = flightSeries.filter(fs => {
    const searchLower = searchTerm.toLowerCase()
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null
    const fsStart = fs.start_date ? new Date(fs.start_date) : null
    const fsEnd = fs.end_date ? new Date(fs.end_date) : null

    // Date range filter: include flights that overlap the selected range.
    // If only one bound is provided, filter on that bound.
    const matchesDateRange = (() => {
      if (!start && !end) return true
      if (!fsStart && !fsEnd) return false

      const aStart = fsStart || fsEnd!
      const aEnd = fsEnd || fsStart!

      if (start && end) return aStart <= end && aEnd >= start
      if (start) return aEnd >= start
      if (end) return aStart <= end
      return true
    })()

    return (
      matchesDateRange &&
      (
        fs.flt.toLowerCase().includes(searchLower) ||
        fs.flight_type.toLowerCase().includes(searchLower) ||
        (fs.aircraft?.name && fs.aircraft.name.toLowerCase().includes(searchLower)) ||
        (fs.fromDestination?.name && fs.fromDestination.name.toLowerCase().includes(searchLower)) ||
        (fs.toDestination?.name && fs.toDestination.name.toLowerCase().includes(searchLower))
      )
    )
  })

  // Client-side pagination over filtered results
  const filteredTotal = filteredFlightSeries.length
  const paginatedFlightSeries = filteredFlightSeries.slice((page - 1) * limit, page * limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[11px] text-gray-600">Loading fares...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Fares</h1>
          <p className="text-[11px] text-gray-600">Flight series and their assigned fare prices</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded shadow mb-2 p-1.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search by flight number, type, aircraft, or destination..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-700 whitespace-nowrap">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-700 whitespace-nowrap">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Fares Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Flight</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Route</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Aircraft</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date Range</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Adult Fare</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Child Fare</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Infant Fare</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFlightSeries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {flightSeries.length === 0 ? 'No flight series found. Add your first flight series to get started.' : 'No flight series match your search criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedFlightSeries.map((fs) => (
                  <tr key={fs.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Plane className="h-2.5 w-2.5 text-gray-400" />
                        <span className="text-[11px] font-medium text-gray-900">{fs.flt}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{fs.flight_type}</div>
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-gray-900">
                      {formatDestinationRoute(fs)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">
                      {fs.aircraft ? `${fs.aircraft.name} (${fs.aircraft.registration})` : 'N/A'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 text-gray-400" />
                        <span>{formatDate(fs.start_date)} - {formatDate(fs.end_date)}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-medium text-gray-900">
                      {formatCurrency(fs.adult_fare)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-medium text-gray-900">
                      {formatCurrency(fs.child_fare)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-medium text-gray-900">
                      {formatCurrency(fs.infant_fare)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEditFare(fs)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5 text-[11px]"
                        title="Edit fares"
                      >
                        <Edit className="h-2.5 w-2.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-2 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="text-gray-700">
              {filteredTotal === 0 ? (
                'No records'
              ) : (
                <>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredTotal)} of {filteredTotal} flight series</>
              )}
            </div>
            <div className="flex items-center gap-1">
              <label className="text-gray-700">Records per page:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-0.5 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {filteredTotal > limit && (
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= filteredTotal}
                className="px-2 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fare Price Modal */}
      {selectedFlightSeries && (
        <FarePriceModal
          isOpen={isFareModalOpen}
          onClose={() => {
            setIsFareModalOpen(false)
            setSelectedFlightSeries(null)
          }}
          flightSeriesId={selectedFlightSeries.id}
          flightNumber={selectedFlightSeries.flt}
          onSave={handleSaveFare}
          initialFarePrices={{
            adult_fare: selectedFlightSeries.adult_fare,
            child_fare: selectedFlightSeries.child_fare,
            infant_fare: selectedFlightSeries.infant_fare
          }}
        />
      )}
    </div>
  )
}

export default Fares

