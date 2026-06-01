import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, FlightSeries as FlightSeriesType } from '../services/api'
import { ArrowLeft, Users, Mail, Phone, DollarSign, Plane, Search, Printer, Ticket, FileText, Luggage as LuggageIcon, XCircle, Plus, Trash2, AlertCircle } from 'lucide-react'
import BoardingPassModal from '../components/BoardingPassModal'
import TicketModal from '../components/TicketModal'

interface PassengerData {
  passenger: {
    id: number
    pnr: string
    name: string
    email: string | null
    contact: string | null
    nationality: string | null
    identification: string | null
    age: number | null
    title: string | null
    booking_status: string | null
  }
  passenger_type: string
  fare_amount: number
  booking_reference: string
  booking_date: string
}

const FlightPassengers: React.FC = () => {
  const { flightSeriesId } = useParams<{ flightSeriesId: string }>()
  const navigate = useNavigate()
  const [passengers, setPassengers] = useState<PassengerData[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [boardingPassModalOpen, setBoardingPassModalOpen] = useState(false)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [luggageModalOpen, setLuggageModalOpen] = useState(false)
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null)
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerData | null>(null)

  useEffect(() => {
    if (flightSeriesId) {
      fetchFlightPassengers(parseInt(flightSeriesId, 10))
    }
  }, [flightSeriesId])

  const fetchFlightPassengers = async (flightId: number) => {
    try {
      setLoading(true)
      const result = await adminApiService.getBookings(1, 10000)
      
      // Filter bookings for this flight and extract passengers
      const flightBookings = result.bookings.filter(
        booking => booking.flight_series_id === flightId
      )
      
      if (flightBookings.length > 0 && flightBookings[0].flightSeries) {
        setFlightSeries(flightBookings[0].flightSeries)
      }
      
      // Collect all passengers from all bookings for this flight
      const allPassengers: PassengerData[] = []
      flightBookings.forEach(booking => {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          booking.bookingPassengers.forEach(bp => {
            if (bp.passenger) {
              allPassengers.push({
                passenger: {
                  ...bp.passenger,
                  booking_status: bp.passenger.booking_status || null
                },
                passenger_type: bp.passenger_type,
                fare_amount: bp.fare_amount,
                booking_reference: booking.booking_reference,
                booking_date: booking.booking_date
              })
            }
          })
        }
      })
      
      setPassengers(allPassengers)
    } catch (error) {
      console.error('Error fetching flight passengers:', error)
      setPassengers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPassengers = passengers.filter(p => {
    const matchesSearch = 
      p.passenger.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passenger.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passenger.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'Boarded' && p.passenger.booking_status === 'Boarded') ||
      (statusFilter === 'CHECK IN' && p.passenger.booking_status === 'CHECK IN') ||
      (statusFilter === 'No Show' && p.passenger.booking_status === 'No Show') ||
      (statusFilter === 'none' && !p.passenger.booking_status)
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleStatusChange = async (passengerId: number, newStatus: string) => {
    try {
      setUpdatingStatus(passengerId)
      console.log('🔄 [FlightPassengers] Updating booking status for passenger:', passengerId, 'to:', newStatus)
      
      const updateData = { booking_status: newStatus || null }
      console.log('🔄 [FlightPassengers] Update data:', updateData)
      
      await adminApiService.updatePassenger(passengerId, updateData)
      
      console.log('✅ [FlightPassengers] Booking status updated successfully')
      
      // Refresh the data to get the latest status
      if (flightSeriesId) {
        await fetchFlightPassengers(parseInt(flightSeriesId, 10))
      }
    } catch (error) {
      console.error('❌ [FlightPassengers] Error updating booking status:', error)
      const errorMessage = (error as any)?.message || (error as any)?.serverMessage || 'Failed to update booking status. Please try again.'
      alert(errorMessage)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleLuggageUpdate = (passengerData: PassengerData) => {
    setSelectedPassenger(passengerData)
    setSelectedPassengerId(passengerData.passenger.id)
    setLuggageModalOpen(true)
  }

  const handleLuggageSave = async (luggages: Array<{ id?: number; tag_number?: string | null; weight?: number | null }>) => {
    if (!selectedPassengerId) return

    try {
      // Get booking_id from selected passenger's booking reference
      let bookingId: number | null = null
      if (selectedPassenger?.booking_reference && flightSeriesId) {
        try {
          const bookings = await adminApiService.getBookings(1, 10000)
          const booking = bookings.bookings.find(
            b => b.booking_reference === selectedPassenger.booking_reference && 
                 b.flight_series_id === parseInt(flightSeriesId, 10)
          )
          if (booking) {
            bookingId = booking.id
          }
        } catch (error) {
          console.error('Error finding booking:', error)
        }
      }

      // Get existing luggages
      const existingLuggages = await adminApiService.getLuggageByPassenger(selectedPassengerId)
      const existingIds = existingLuggages.map(l => l.id)

      // Save or update luggages
      for (const luggage of luggages) {
        if (luggage.id && existingIds.includes(luggage.id)) {
          // Update existing luggage
          await adminApiService.updateLuggage(luggage.id, {
            tag_number: luggage.tag_number,
            weight: luggage.weight
          })
        } else {
          // Create new luggage with flight and booking references
          await adminApiService.createLuggage({
            passenger_id: selectedPassengerId,
            flight_series_id: flightSeriesId ? parseInt(flightSeriesId, 10) : null,
            booking_id: bookingId,
            tag_number: luggage.tag_number,
            weight: luggage.weight
          })
        }
      }

      // Delete luggages that were removed
      const currentIds = luggages.filter(l => l.id).map(l => l.id!)
      const toDelete = existingIds.filter(id => !currentIds.includes(id))
      for (const id of toDelete) {
        await adminApiService.deleteLuggage(id)
      }

      // Refresh the data
      if (flightSeriesId) {
        await fetchFlightPassengers(parseInt(flightSeriesId, 10))
      }
    } catch (error) {
      console.error('Error updating luggage:', error)
      const err = error as any
      // Re-throw with better error message for duplicate tag numbers
      if (err.message?.includes('already exists') || err.message?.includes('Tag number')) {
        throw new Error(err.message)
      } else if (err.response?.data?.message) {
        throw new Error(err.response.data.message)
      }
      throw error
    }
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
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/bookings')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Back to Bookings"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              Flight Passengers
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
                  Date: {formatDate(flightSeries.start_date)} | Total Passengers: {passengers.length}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/bookings/flight/${flightSeriesId}/manifest`)}
              className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-[11px]"
            >
              <FileText className="h-3 w-3" />
              Manifest
            </button>
            <button
              onClick={() => navigate(`/bookings/flight/${flightSeriesId}/luggage`)}
              className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-[11px]"
            >
              <LuggageIcon className="h-3 w-3" />
              Luggage
            </button>
            <button
              onClick={() => navigate(`/bookings/flight/${flightSeriesId}/boarding-pass`)}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px]"
            >
              <Printer className="h-3 w-3" />
              Boarding Passes
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {passengers.length > 0 && (
          <div className="mb-2 grid grid-cols-1 md:grid-cols-4 gap-1.5">
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-blue-100 rounded">
                  <Users className="h-2.5 w-2.5 text-blue-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Passengers</p>
                  <p className="text-sm font-bold text-gray-900">{passengers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-green-100 rounded">
                  <Users className="h-2.5 w-2.5 text-green-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Adults</p>
                  <p className="text-sm font-bold text-gray-900">
                    {passengers.filter(p => p.passenger_type === 'adult').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-yellow-100 rounded">
                  <Users className="h-2.5 w-2.5 text-yellow-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Children</p>
                  <p className="text-sm font-bold text-gray-900">
                    {passengers.filter(p => p.passenger_type === 'child').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-purple-100 rounded">
                  <DollarSign className="h-2.5 w-2.5 text-purple-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Revenue</p>
                  <p className="text-sm font-bold text-gray-900">
                    ${passengers.reduce((sum, p) => sum + Number(p.fare_amount), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <input
                type="text"
                placeholder="Search by name, PNR, email, or booking reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Booking Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Boarded">Boarded</option>
                <option value="CHECK IN">CHECK IN</option>
                <option value="No Show">No Show</option>
                <option value="none">No Status</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">PNR</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Booking Ref</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Fare</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPassengers.map((passengerData, index) => (
                  <tr key={`${passengerData.passenger.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">
                      {passengerData.passenger.pnr}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <div>
                        <div className="font-medium">
                          {passengerData.passenger.title ? `${passengerData.passenger.title} ` : ''}
                          {passengerData.passenger.name}
                        </div>
                        {passengerData.passenger.identification && (
                          <div className="text-[10px] text-gray-500">ID: {passengerData.passenger.identification}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <div className="space-y-0.5">
                        {passengerData.passenger.email && (
                          <div className="flex items-center gap-0.5">
                            <Mail className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px]">{passengerData.passenger.email}</span>
                          </div>
                        )}
                        {passengerData.passenger.contact && (
                          <div className="flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px]">{passengerData.passenger.contact}</span>
                          </div>
                        )}
                        {!passengerData.passenger.email && !passengerData.passenger.contact && (
                          <span className="text-[10px] text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <span className="inline-flex px-1 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-800 capitalize">
                        {passengerData.passenger_type}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {passengerData.passenger.nationality || 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {passengerData.passenger.age || 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">
                      {passengerData.booking_reference}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <select
                        value={passengerData.passenger.booking_status || ''}
                        onChange={(e) => handleStatusChange(passengerData.passenger.id, e.target.value)}
                        disabled={updatingStatus === passengerData.passenger.id}
                        className={`text-[10px] border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                          passengerData.passenger.booking_status === 'Boarded' ? 'bg-green-50 text-green-800 border-green-300' :
                          passengerData.passenger.booking_status === 'CHECK IN' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          passengerData.passenger.booking_status === 'No Show' ? 'bg-red-50 text-red-800 border-red-300' :
                          'bg-gray-50 text-gray-800'
                        } ${updatingStatus === passengerData.passenger.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <option value="">Select Status</option>
                        <option value="Boarded">Boarded</option>
                        <option value="CHECK IN">CHECK IN</option>
                        <option value="No Show">No Show</option>
                      </select>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <div className="flex items-center gap-0.5">
                        <DollarSign className="h-2.5 w-2.5 text-gray-400" />
                        <span className="font-medium">{Number(passengerData.fare_amount).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1">
                        {(passengerData.passenger.booking_status === 'CHECK IN' || passengerData.passenger.booking_status === 'Boarded') ? (
                          <button
                            onClick={() => {
                              setSelectedPassengerId(passengerData.passenger.id)
                              setBoardingPassModalOpen(true)
                            }}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px]"
                            title="View Boarding Pass"
                          >
                            <Printer className="h-2.5 w-2.5" />
                            Pass
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400">N/A</span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPassengerId(passengerData.passenger.id)
                            setTicketModalOpen(true)
                          }}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-[10px]"
                          title="View Ticket"
                        >
                          <Ticket className="h-2.5 w-2.5" />
                          Ticket
                        </button>
                        <button
                          onClick={() => handleLuggageUpdate(passengerData)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-[10px]"
                          title="Update Luggage"
                        >
                          <LuggageIcon className="h-2.5 w-2.5" />
                          Luggage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPassengers.length === 0 && !loading && (
            <div className="text-center py-4">
              <Users className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No passengers found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No passengers booked for this flight.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Boarding Pass Modal */}
      {flightSeriesId && selectedPassengerId && (
        <BoardingPassModal
          isOpen={boardingPassModalOpen}
          onClose={() => {
            setBoardingPassModalOpen(false)
            setSelectedPassengerId(null)
          }}
          flightSeriesId={parseInt(flightSeriesId, 10)}
          passengerId={selectedPassengerId}
        />
      )}

      {/* Ticket Modal */}
      {flightSeriesId && selectedPassengerId && (
        <TicketModal
          isOpen={ticketModalOpen}
          onClose={() => {
            setTicketModalOpen(false)
            setSelectedPassengerId(null)
          }}
          flightSeriesId={parseInt(flightSeriesId, 10)}
          passengerId={selectedPassengerId}
        />
      )}

      {/* Luggage Modal */}
      {selectedPassenger && (
        <LuggageModal
          isOpen={luggageModalOpen}
          onClose={() => {
            setLuggageModalOpen(false)
            setSelectedPassenger(null)
            setSelectedPassengerId(null)
          }}
          passenger={selectedPassenger.passenger}
          onSave={handleLuggageSave}
        />
      )}
    </div>
  )
}

// Luggage Modal Component
interface LuggageModalProps {
  isOpen: boolean
  onClose: () => void
  passenger: {
    id: number
    pnr: string
    name: string
    title: string | null
  }
  onSave: (luggages: Array<{ id?: number; tag_number?: string | null; weight?: number | null }>) => Promise<void>
}

const LuggageModal: React.FC<LuggageModalProps> = ({ isOpen, onClose, passenger, onSave }) => {
  const [luggages, setLuggages] = useState<Array<{ id?: number; tag_number?: string | null; weight?: number | null }>>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && passenger) {
      fetchLuggages()
      setError(null) // Clear error when modal opens
    } else {
      setLuggages([])
      setError(null)
    }
  }, [isOpen, passenger?.id])

  const fetchLuggages = async () => {
    if (!passenger) return
    try {
      setLoading(true)
      const fetchedLuggages = await adminApiService.getLuggageByPassenger(passenger.id)
      setLuggages(fetchedLuggages.map(l => ({ id: l.id, tag_number: l.tag_number, weight: l.weight })))
    } catch (error) {
      console.error('Error fetching luggages:', error)
      setLuggages([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddLuggage = () => {
    setLuggages([...luggages, { tag_number: '', weight: null }])
  }

  const handleRemoveLuggage = (index: number) => {
    setLuggages(luggages.filter((_, i) => i !== index))
  }

  const handleLuggageChange = (index: number, field: 'tag_number' | 'weight', value: string | number | null) => {
    const updated = [...luggages]
    updated[index] = { ...updated[index], [field]: value }
    setLuggages(updated)
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passenger) return

    // Validate for duplicate tag numbers within the form
    const tagNumbers = luggages
      .map(l => l.tag_number?.trim())
      .filter(tag => tag && tag !== '')
    
    const duplicates = tagNumbers.filter((tag, index) => tagNumbers.indexOf(tag) !== index)
    
    if (duplicates.length > 0) {
      setError(`Duplicate tag number found: "${duplicates[0]}". Each tag number must be unique.`)
      return
    }

    try {
      setSaving(true)
      setError(null) // Clear previous errors
      
      const luggagesToSave = luggages.map(l => ({
        id: l.id,
        tag_number: l.tag_number?.trim() || null,
        weight: l.weight || null
      }))

      await onSave(luggagesToSave)
      onClose()
    } catch (error) {
      console.error('Error updating luggage:', error)
      let errorMessage = 'Failed to update luggage'
      const err = error as any
      if (err.message) {
        errorMessage = err.message
        // Check if it's a conflict error (duplicate tag number)
        if (err.message.includes('already exists') || err.message.includes('Tag number')) {
          errorMessage = err.message
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !passenger) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            Update Luggage: {passenger.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="bg-blue-50 border border-blue-200 rounded p-1.5 mb-2">
            <p className="text-[11px] text-blue-800">
              <strong>PNR:</strong> {passenger.pnr} | <strong>Name:</strong> {passenger.title || ''} {passenger.name}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-1.5 py-1 rounded flex items-start space-x-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] font-medium">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="text-[11px] font-semibold text-gray-700">Luggage Details</h3>
              <button
                type="button"
                onClick={handleAddLuggage}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[10px]"
              >
                <Plus className="h-2.5 w-2.5" />
                Add Luggage
              </button>
            </div>

            {loading ? (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : luggages.length === 0 ? (
              <div className="text-center py-2 text-[11px] text-gray-500">
                No luggage added. Click "Add Luggage" to add luggage items.
              </div>
            ) : (
              <div className="space-y-1.5">
                {luggages.map((luggage, index) => (
                  <div key={index} className="border border-gray-200 rounded p-1.5 bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-medium text-gray-600">Luggage #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLuggage(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove luggage"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Tag Number</label>
                        <input
                          type="text"
                          value={luggage.tag_number || ''}
                          onChange={(e) => handleLuggageChange(index, 'tag_number', e.target.value)}
                          className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter tag number"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1000"
                          value={luggage.weight !== null && luggage.weight !== undefined ? luggage.weight : ''}
                          onChange={(e) => handleLuggageChange(index, 'weight', e.target.value === '' ? null : parseFloat(e.target.value))}
                          className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter weight"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-1 pt-1.5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-1.5 py-0.5 text-[11px] bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5"
            >
              <LuggageIcon className="h-2.5 w-2.5" />
              {saving ? 'Saving...' : 'Update Luggage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FlightPassengers

