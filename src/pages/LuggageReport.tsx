import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, FlightSeries as FlightSeriesType } from '../services/api'
import { ArrowLeft, Luggage as LuggageIcon, Plane, Users, Search, FileText, Download } from 'lucide-react'

interface LuggageWithDetails {
  id: number
  passenger_id: number
  tag_number: string | null
  weight: number | null
  created_at: string
  updated_at: string
  passenger?: {
    id: number
    pnr: string
    name: string
    title: string | null
    email: string | null
    contact: string | null
  } | null
  booking_reference: string | null
  flight_series_id: number | null
  flightSeries?: FlightSeriesType | null
}

const LuggageReport: React.FC = () => {
  const { flightSeriesId } = useParams<{ flightSeriesId?: string }>()
  const navigate = useNavigate()
  const [luggages, setLuggages] = useState<LuggageWithDetails[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLuggages()
  }, [flightSeriesId])

  const fetchLuggages = async () => {
    try {
      setLoading(true)
      const flightId = flightSeriesId ? parseInt(flightSeriesId, 10) : undefined
      const data = await adminApiService.getAllLuggages(flightId)
      // Transform Luggage[] to LuggageWithDetails[] by adding required fields
      const luggagesWithDetails: LuggageWithDetails[] = data.map(luggage => ({
        ...luggage,
        booking_reference: null,
        flight_series_id: null,
        flightSeries: null
      }))
      setLuggages(luggagesWithDetails)

      // Get flight series details if available
      if (luggagesWithDetails.length > 0 && luggagesWithDetails[0].flightSeries) {
        setFlightSeries(luggagesWithDetails[0].flightSeries)
      } else if (flightSeriesId) {
        // Try to fetch flight series separately
        try {
          const bookings = await adminApiService.getBookings(1, 1)
          const flightBooking = bookings.bookings.find(b => b.flight_series_id === parseInt(flightSeriesId, 10))
          if (flightBooking?.flightSeries) {
            setFlightSeries(flightBooking.flightSeries)
          }
        } catch (error) {
          console.error('Error fetching flight series:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching luggages:', error)
      setLuggages([])
    } finally {
      setLoading(false)
    }
  }

  const filteredLuggages = luggages.filter(l =>
    l.passenger?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.passenger?.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.flightSeries?.flt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const totalWeight = filteredLuggages.reduce((sum, l) => {
    const weight = l.weight ? Number(l.weight) : 0
    return sum + (isNaN(weight) ? 0 : weight)
  }, 0)
  const totalLuggages = filteredLuggages.length

  const exportToCSV = () => {
    if (filteredLuggages.length === 0) {
      alert('No luggage data to export')
      return
    }

    // Prepare CSV headers
    const headers = [
      'Tag Number',
      'Weight (kg)',
      'Passenger Name',
      'Passenger Title',
      'PNR',
      'Booking Reference',
      'Flight Number',
      'Flight Route',
      'Flight Date',
      'Created Date'
    ]

    // Prepare CSV rows
    const csvRows = filteredLuggages.map(luggage => {
      const weight = luggage.weight ? Number(luggage.weight) : null
      const flightRoute = luggage.flightSeries
        ? `${luggage.flightSeries.fromDestination?.code || 'N/A'} → ${luggage.flightSeries.toDestination?.code || 'N/A'}${luggage.flightSeries.viaDestination ? ` (via ${luggage.flightSeries.viaDestination.code})` : ''}`
        : 'N/A'
      
      return [
        luggage.tag_number || '',
        weight !== null && !isNaN(weight) ? weight.toFixed(2) : '',
        luggage.passenger?.name || '',
        luggage.passenger?.title || '',
        luggage.passenger?.pnr || '',
        luggage.booking_reference || '',
        luggage.flightSeries?.flt || '',
        flightRoute,
        luggage.flightSeries?.start_date ? formatDate(luggage.flightSeries.start_date) : '',
        formatDate(luggage.created_at)
      ]
    })

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string) => {
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...csvRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0]
    const flightInfo = flightSeries ? `-${flightSeries.flt.replace(/\s+/g, '-')}` : ''
    const filename = `luggage-report${flightInfo}-${dateStr}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate(flightSeriesId ? `/bookings/flight/${flightSeriesId}/passengers` : '/bookings')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <LuggageIcon className="h-3.5 w-3.5 text-orange-600" />
              Luggage Report
            </h1>
            {flightSeries && (
              <div className="mt-0.5">
                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                  <Plane className="h-2.5 w-2.5" />
                  {flightSeries.flt} - {flightSeries.flight_type} | 
                  {flightSeries.fromDestination?.code || 'N/A'} → {flightSeries.toDestination?.code || 'N/A'}
                  {flightSeries.viaDestination && ` (via ${flightSeries.viaDestination.code})`}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Date: {formatDate(flightSeries.start_date)} | Total Luggages: {totalLuggages} | Total Weight: {typeof totalWeight === 'number' ? totalWeight.toFixed(2) : '0.00'} kg
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {luggages.length > 0 && (
          <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-orange-100 rounded">
                  <LuggageIcon className="h-2.5 w-2.5 text-orange-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Luggages</p>
                  <p className="text-sm font-bold text-gray-900">{totalLuggages}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-blue-100 rounded">
                  <Users className="h-2.5 w-2.5 text-blue-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Passengers with Luggage</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Set(filteredLuggages.map(l => l.passenger_id)).size}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-green-100 rounded">
                  <FileText className="h-2.5 w-2.5 text-green-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Weight</p>
                  <p className="text-sm font-bold text-gray-900">{typeof totalWeight === 'number' ? totalWeight.toFixed(2) : '0.00'} kg</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Export */}
        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <input
                type="text"
                placeholder="Search by passenger name, PNR, tag number, or booking reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              />
            </div>
            {filteredLuggages.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px] whitespace-nowrap"
                title="Export to CSV"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Luggages Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Tag Number</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">PNR</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Booking Reference</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLuggages.map((luggage) => (
                  <tr key={luggage.id} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">
                      {luggage.tag_number || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {luggage.weight !== null && luggage.weight !== undefined ? (() => {
                        const weight = Number(luggage.weight)
                        return isNaN(weight) ? <span className="text-gray-400">N/A</span> : `${weight.toFixed(2)}`
                      })() : <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {luggage.passenger ? (
                        <div>
                          <div className="font-medium">
                            {luggage.passenger.title ? `${luggage.passenger.title} ` : ''}
                            {luggage.passenger.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {luggage.passenger?.pnr || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">
                      {luggage.booking_reference || <span className="text-gray-400">N/A</span>}
                    </td>
                     
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-500">
                      {formatDate(luggage.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLuggages.length === 0 && !loading && (
            <div className="text-center py-4">
              <LuggageIcon className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No luggage found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No luggage records available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LuggageReport

