import { useState, useEffect } from 'react'
import { adminApiService, SeatReservation, FlightSeries as FlightSeriesType, Passenger, Agent } from '../services/api'
import { Ticket, Search, Edit, XCircle, Plus, Filter, User, Calendar, Phone, Mail, CheckCircle } from 'lucide-react'
import ConfirmBookingModal from '../components/ConfirmBookingModal'

const STATUS_OPTIONS = ['reserved', 'confirmed', 'cancelled', 'checked_in', 'booked']

interface SeatReservationModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: SeatReservation | null
  onSave: (reservationData: Partial<SeatReservation>) => Promise<void>
  flightSeries: FlightSeriesType[]
  passengers: Passenger[]
  agents: Agent[]
}

const SeatReservationModal: React.FC<SeatReservationModalProps> = ({ isOpen, onClose, reservation, onSave, flightSeries, passengers, agents }) => {
  const [formData, setFormData] = useState<Partial<SeatReservation>>({
    flight_series_id: undefined,
    passenger_id: undefined,
    agent_id: undefined,
    number_of_seats: 1,
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    status: 'reserved',
    reservation_date: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  // Helper to format date for input[type="date"]
  const formatDate = (dateInput: Date | string | null) => {
    if (!dateInput) return ''
    const date = new Date(dateInput)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    if (isOpen && reservation) {
      let flightSeriesId: number | undefined = undefined
      if (reservation.flight_series_id !== null && reservation.flight_series_id !== undefined) {
        flightSeriesId = Number(reservation.flight_series_id)
      } else if (reservation.flightSeries?.id) {
        flightSeriesId = Number(reservation.flightSeries.id)
      }

      let passengerId: number | undefined = undefined
      if (reservation.passenger_id !== null && reservation.passenger_id !== undefined) {
        passengerId = Number(reservation.passenger_id)
      } else if (reservation.passenger?.id) {
        passengerId = Number(reservation.passenger.id)
      }

      let agentId: number | undefined = undefined
      if (reservation.agent_id !== null && reservation.agent_id !== undefined) {
        agentId = Number(reservation.agent_id)
      } else if (reservation.agent?.id) {
        agentId = Number(reservation.agent.id)
      }

      setFormData({
        flight_series_id: flightSeriesId,
        passenger_id: passengerId,
        agent_id: agentId,
        number_of_seats: reservation.number_of_seats || 1,
        passenger_name: reservation.passenger_name || '',
        passenger_email: reservation.passenger_email || '',
        passenger_phone: reservation.passenger_phone || '',
        status: reservation.status || 'reserved',
        reservation_date: formatDate(reservation.reservation_date),
        notes: reservation.notes || ''
      })
    } else if (isOpen) {
      setFormData({
        flight_series_id: undefined,
        passenger_id: undefined,
        agent_id: undefined,
        number_of_seats: 1,
        passenger_name: '',
        passenger_email: '',
        passenger_phone: '',
        status: 'reserved',
        reservation_date: '',
        notes: ''
      })
    }
  }, [isOpen, reservation?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

      let flightSeriesId: number | undefined = undefined
      if (formData.flight_series_id !== null && formData.flight_series_id !== undefined) {
        flightSeriesId = Number(formData.flight_series_id)
      }

      let numberOfSeats: number = 1
      if (formData.number_of_seats !== null && formData.number_of_seats !== undefined) {
        numberOfSeats = Number(formData.number_of_seats)
      }

      let passengerId: number | undefined = undefined
      if (formData.passenger_id !== null && formData.passenger_id !== undefined) {
        passengerId = Number(formData.passenger_id)
      }

      let agentId: number | undefined = undefined
      if (formData.agent_id !== null && formData.agent_id !== undefined) {
        agentId = Number(formData.agent_id)
      }

      const cleanedData: Partial<SeatReservation> = {
        ...formData,
        flight_series_id: flightSeriesId,
        passenger_id: passengerId,
        agent_id: agentId || null,
        number_of_seats: numberOfSeats,
        passenger_email: formData.passenger_email || null,
        passenger_phone: formData.passenger_phone || null,
        notes: formData.notes || null,
      }

      console.log('📤 [SeatReservationModal] Submitting cleaned data:', JSON.stringify(cleanedData, null, 2))
      await onSave(cleanedData)
      onClose()
    } catch (error) {
      console.error('Error saving seat reservation:', error)
      let errorMessage = 'Failed to save seat reservation'
      const err = error as any

      if (err.message) {
        errorMessage = err.message
        if (errorMessage.startsWith('Failed to save seat reservation: ')) {
          errorMessage = errorMessage.replace('Failed to save seat reservation: ', '')
        }
      } else if (err.serverMessage) {
        if (Array.isArray(err.serverMessage)) {
          errorMessage = err.serverMessage.join('\n')
        } else {
          errorMessage = err.serverMessage
        }
      }
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let newValue: any = value
    
    if (name === 'flight_series_id' || name === 'number_of_seats' || name === 'passenger_id' || name === 'agent_id') {
      newValue = value === '' ? undefined : parseInt(value, 10)
      
      // Auto-populate passenger details when passenger is selected
      if (name === 'passenger_id' && value !== '') {
        const selectedPassenger = passengers.find(p => p.id === parseInt(value, 10))
        if (selectedPassenger) {
          setFormData(prev => ({
            ...prev,
            passenger_id: selectedPassenger.id,
            passenger_name: selectedPassenger.name,
            passenger_email: selectedPassenger.email || '',
            passenger_phone: selectedPassenger.contact || ''
          }))
          return
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  if (!isOpen) return null

  // Filter flight series to show only current/future dates, but include current reservation's flight if editing
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const availableFlightSeries = flightSeries.filter(fs => {
    if (!fs.start_date) return false
    const flightDate = new Date(fs.start_date)
    flightDate.setHours(0, 0, 0, 0)
    
    // Include if it's today or future
    if (flightDate >= today) return true
    
    // If editing, include the current reservation's flight even if it's in the past
    if (reservation && formData.flight_series_id === fs.id) return true
    
    return false
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {reservation ? 'Edit Seat Reservation' : 'Add New Seat Reservation'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Flight Series *</label>
              <select
                name="flight_series_id"
                value={formData.flight_series_id !== null && formData.flight_series_id !== undefined ? String(formData.flight_series_id) : ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a flight series</option>
                {availableFlightSeries.map(fs => {
                  let destinationText = ''
                  if (fs.flight_type === 'From-Via_To') {
                    const from = fs.fromDestination ? `${fs.fromDestination.code}` : ''
                    const via = fs.viaDestination ? ` via ${fs.viaDestination.code}` : ''
                    const to = fs.toDestination ? ` → ${fs.toDestination.code}` : ''
                    destinationText = from + via + to
                  } else if (fs.fromDestination && fs.toDestination) {
                    destinationText = `${fs.fromDestination.code} → ${fs.toDestination.code}`
                  }
                  return (
                    <option key={fs.id} value={String(fs.id)}>
                      {fs.flt} - {fs.flight_type}{destinationText ? ` (${destinationText})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Number of Seats *</label>
              <input
                type="number"
                name="number_of_seats"
                value={formData.number_of_seats || 1}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Select Passenger</label>
              <select
                name="passenger_id"
                value={formData.passenger_id !== null && formData.passenger_id !== undefined ? String(formData.passenger_id) : ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a passenger (or enter manually below)</option>
                {passengers.map(passenger => (
                  <option key={passenger.id} value={String(passenger.id)}>
                    {passenger.title ? `${passenger.title} ` : ''}{passenger.name} {passenger.pnr ? `(${passenger.pnr})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Passenger Name *</label>
              <input
                type="text"
                name="passenger_name"
                value={formData.passenger_name || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Passenger Email</label>
              <input
                type="email"
                name="passenger_email"
                value={formData.passenger_email || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Passenger Phone</label>
              <input
                type="tel"
                name="passenger_phone"
                value={formData.passenger_phone || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Status *</label>
              <select
                name="status"
                value={formData.status || 'reserved'}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Reservation Date *</label>
              <input
                type="date"
                name="reservation_date"
                value={formData.reservation_date || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Agent</label>
              <select
                name="agent_id"
                value={formData.agent_id !== null && formData.agent_id !== undefined ? String(formData.agent_id) : ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an agent (optional)</option>
                {agents.map(agent => (
                  <option key={agent.id} value={String(agent.id)}>
                    {agent.name} {agent.agency ? `(${agent.agency.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-1 pt-1.5">
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
              className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : reservation ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SeatReservations: React.FC = () => {
  const [reservations, setReservations] = useState<SeatReservation[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType[]>([])
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [agencies, setAgencies] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [flightFilter, setFlightFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<SeatReservation | null>(null)
  const [isConfirmBookingModalOpen, setIsConfirmBookingModalOpen] = useState(false)
  const [selectedReservationForBooking, setSelectedReservationForBooking] = useState<SeatReservation | null>(null)
  const limit = 50

  useEffect(() => {
    fetchReservations()
    fetchFlightSeries()
    fetchPassengers()
    fetchAgents()
    fetchAgencies()
    fetchAccounts()
  }, [page, flightFilter])

  const fetchReservations = async () => {
    try {
      console.log('🎫 [SeatReservations] Starting to fetch reservations data...')
      setLoading(true)
      const flightSeriesId = flightFilter ? parseInt(flightFilter, 10) : undefined
      const result = await adminApiService.getSeatReservations(page, limit, flightSeriesId)
      console.log('✅ [SeatReservations] Successfully fetched reservations data:', result)

      let reservationsArray: SeatReservation[] = []
      let totalCount = 0

      if (result) {
        if (Array.isArray(result)) {
          reservationsArray = result
          totalCount = result.length
        } else {
          reservationsArray = result.reservations || []
          totalCount = result.total || 0
        }
      }

      setReservations(reservationsArray)
      setTotal(totalCount)
    } catch (error) {
      console.error('❌ [SeatReservations] Error fetching reservations:', error)
      setReservations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlightSeries = async () => {
    try {
      const result = await adminApiService.getFlightSeries(1, 1000)
      setFlightSeries(result.flightSeries || [])
    } catch (error) {
      console.error('Error fetching flight series:', error)
      setFlightSeries([])
    }
  }

  const fetchPassengers = async () => {
    try {
      console.log('👤 [SeatReservations] Fetching passengers...')
      const result = await adminApiService.getPassengers(1, 1000) // Fetch all passengers for dropdown
      const data = result.passengers || []
      console.log('✅ [SeatReservations] Passengers fetched:', data)
      setPassengers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SeatReservations] Error fetching passengers:', error)
      setPassengers([])
    }
  }

  const fetchAgents = async () => {
    try {
      console.log('👤 [SeatReservations] Fetching agents...')
      const result = await adminApiService.getAgents(1, 1000) // Fetch all agents for dropdown
      const data = result.agents || []
      console.log('✅ [SeatReservations] Agents fetched:', data)
      setAgents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SeatReservations] Error fetching agents:', error)
      setAgents([])
    }
  }

  const fetchAgencies = async () => {
    try {
      console.log('🏢 [SeatReservations] Fetching agencies...')
      const result = await adminApiService.getAgencies(1, 1000) // Fetch all agencies for dropdown
      const data = result.agencies || []
      console.log('✅ [SeatReservations] Agencies fetched:', data)
      setAgencies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SeatReservations] Error fetching agencies:', error)
      setAgencies([])
    }
  }

  const fetchAccounts = async () => {
    try {
      console.log('💰 [SeatReservations] Fetching accounts...')
      const result = await adminApiService.getAccounts(1, 1000) // Fetch all accounts for dropdown
      const data = result.accounts || []
      console.log('✅ [SeatReservations] Accounts fetched:', data)
      setAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SeatReservations] Error fetching accounts:', error)
      setAccounts([])
    }
  }

  const filteredReservations = reservations.filter(res => {
    // Filter by search term and status
    const matchesSearch = res.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.flightSeries?.flt?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === '' || res.status === statusFilter
    
    // Only show reservations for active flights (flights that haven't happened yet)
    const isActiveFlight = res.flightSeries?.start_date ? (() => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(res.flightSeries.start_date)
      startDate.setHours(0, 0, 0, 0)
      return startDate >= today
    })() : false
    
    return matchesSearch && matchesStatus && isActiveFlight
  })

  const handleEdit = (reservation: SeatReservation) => {
    setEditingReservation(reservation)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingReservation(null)
    setIsModalOpen(true)
  }

  const handleSave = async (reservationData: Partial<SeatReservation>) => {
    try {
      if (editingReservation) {
        await adminApiService.updateSeatReservation(editingReservation.id, reservationData)
      } else {
        await adminApiService.createSeatReservation(reservationData)
      }
      await fetchReservations()
    } catch (error) {
      console.error('Error saving reservation:', error)
      throw error
    }
  }

  const handleOpenConfirmBooking = (reservation: SeatReservation) => {
    setSelectedReservationForBooking(reservation)
    setIsConfirmBookingModalOpen(true)
  }

  const handleConfirmBooking = async (bookingData: {
    flight_series_id: number
    seat_reservation_id?: number
    passengers: Array<{
      name: string
      email?: string
      contact?: string
      nationality?: string
      identification?: string
      age?: string
      title?: string
      passenger_type: 'adult' | 'child' | 'infant'
    }>
    payment_method: string
    booking_date: string
    notes?: string
  }) => {
    try {
      await adminApiService.createBooking(bookingData)
      await fetchReservations()
    } catch (error) {
      console.error('Error confirming booking:', error)
      throw error
    }
  }

  const formatDate = (dateString: Date | string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'checked_in':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
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
        {/* Header */}
        <div className="mb-2 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5 text-blue-600" />
              Seat Reservations
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Manage passenger seat reservations</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Add Reservation
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 mb-2">
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 rounded">
                <Ticket className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Total Reservations</p>
                <p className="text-sm font-bold text-gray-900">{filteredReservations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 rounded">
                <Calendar className="h-2.5 w-2.5 text-green-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Confirmed</p>
                <p className="text-sm font-bold text-gray-900">{filteredReservations.filter(r => r.status === 'confirmed').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-yellow-100 rounded">
                <Calendar className="h-2.5 w-2.5 text-yellow-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Reserved</p>
                <p className="text-sm font-bold text-gray-900">{filteredReservations.filter(r => r.status === 'reserved').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 rounded">
                <User className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Checked In</p>
                <p className="text-sm font-bold text-gray-900">{filteredReservations.filter(r => r.status === 'checked_in').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <input
                type="text"
                placeholder="Search by name, booking ref, or flight..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <select
                value={flightFilter}
                onChange={(e) => { setFlightFilter(e.target.value); setPage(1); }}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              >
                <option value="">All Flights</option>
                {flightSeries.map(fs => (
                  <option key={fs.id} value={String(fs.id)}>
                    {fs.flt} - {fs.flight_type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Booking Ref</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Flight</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">From Destination</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">To Destination</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Reservation Date</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{res.booking_reference || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{res.flightSeries?.flt || 'N/A'}</td>
                    <td className="px-1.5 py-1 text-[11px] text-gray-900">
                      {res.flightSeries?.fromDestination ? (
                        <div>
                          <div className="font-medium">{res.flightSeries.fromDestination.code}</div>
                          <div className="text-[10px] text-gray-500">{res.flightSeries.fromDestination.name}</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 text-[11px] text-gray-900">
                      {res.flightSeries?.flight_type === 'From-Via_To' ? (
                        <div>
                          {res.flightSeries?.viaDestination && (
                            <div>
                              <div className="font-medium">{res.flightSeries.viaDestination.code}</div>
                              <div className="text-[10px] text-gray-500">via {res.flightSeries.viaDestination.name}</div>
                            </div>
                          )}
                          {res.flightSeries?.toDestination && (
                            <div className="mt-0.5">
                              <div className="font-medium">{res.flightSeries.toDestination.code}</div>
                              <div className="text-[10px] text-gray-500">{res.flightSeries.toDestination.name}</div>
                            </div>
                          )}
                          {!res.flightSeries?.viaDestination && !res.flightSeries?.toDestination && 'N/A'}
                        </div>
                      ) : res.flightSeries?.toDestination ? (
                        <div>
                          <div className="font-medium">{res.flightSeries.toDestination.code}</div>
                          <div className="text-[10px] text-gray-500">{res.flightSeries.toDestination.name}</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{res.number_of_seats || 0}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{res.passenger_name || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <div className="flex flex-col">
                        {res.passenger_email && (
                          <div className="flex items-center gap-0.5">
                            <Mail className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px]">{res.passenger_email}</span>
                          </div>
                        )}
                        {res.passenger_phone && (
                          <div className="flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px]">{res.passenger_phone}</span>
                          </div>
                        )}
                        {!res.passenger_email && !res.passenger_phone && <span className="text-[10px]">N/A</span>}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {res.agent ? (
                        <div>
                          <div className="font-medium">{res.agent.name}</div>
                          {res.agent.agency && (
                            <div className="text-[10px] text-gray-500">{res.agent.agency.name}</div>
                          )}
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{formatDate(res.reservation_date)}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <span className={`inline-flex px-1 py-0.5 text-[10px] font-semibold rounded ${getStatusColor(res.status)}`}>
                        {res.status ? res.status.charAt(0).toUpperCase() + res.status.slice(1).replace('_', ' ') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(res)} className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5" title="Edit reservation">
                          <Edit className="h-2.5 w-2.5" />Edit
                        </button>
                        {res.status === 'reserved' && (
                          <button onClick={() => handleOpenConfirmBooking(res)} className="text-green-600 hover:text-green-900 flex items-center gap-0.5" title="Confirm booking">
                            <CheckCircle className="h-2.5 w-2.5" />Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReservations.length === 0 && !loading && (
            <div className="text-center py-4">
              <Ticket className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No reservations found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm || statusFilter || flightFilter ? 'Try adjusting your search criteria.' : reservations.length === 0 ? 'No reservations in database. Get started by creating a new reservation.' : 'No reservations match your search criteria.'}
              </p>
              {reservations.length === 0 && (
                <button onClick={handleCreate} className="mt-2 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]">
                  Create First Reservation
                </button>
              )}
            </div>
          )}
        </div>
        {total > limit && (
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="text-gray-700">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} reservations
            </div>
            <div className="flex gap-1">
              <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} className="px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                Previous
              </button>
              <button onClick={() => setPage(prev => prev + 1)} disabled={page * limit >= total} className="px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
        <SeatReservationModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingReservation(null); }}
          reservation={editingReservation}
          onSave={handleSave}
          flightSeries={flightSeries}
          passengers={passengers}
          agents={agents}
        />

        {selectedReservationForBooking && (
          <ConfirmBookingModal
            isOpen={isConfirmBookingModalOpen}
            onClose={() => { setIsConfirmBookingModalOpen(false); setSelectedReservationForBooking(null); }}
            reservation={{
              id: selectedReservationForBooking.id,
              flight_series_id: selectedReservationForBooking.flight_series_id,
              flightSeries: selectedReservationForBooking.flightSeries as FlightSeriesType | null,
              passenger_name: selectedReservationForBooking.passenger_name || '',
              passenger_email: selectedReservationForBooking.passenger_email || null,
              passenger_phone: selectedReservationForBooking.passenger_phone || null,
              number_of_seats: selectedReservationForBooking.number_of_seats
            }}
            flightSeries={flightSeries}
            passengers={passengers}
            agencies={agencies}
            accounts={accounts}
            onConfirm={handleConfirmBooking}
          />
        )}
      </div>
    </div>
  )
}

export default SeatReservations

