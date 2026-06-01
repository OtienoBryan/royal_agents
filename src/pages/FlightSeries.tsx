import { useState, useEffect } from 'react'
import { adminApiService, FlightSeries as FlightSeriesType, Aircraft, Destination, Crew } from '../services/api'
import { Calendar, Search, Edit, XCircle, Clock, Plane, Plus, DollarSign, Users, X, History, Download } from 'lucide-react'
import FarePriceModal from '../components/FarePriceModal'

const FLIGHT_TYPES = ['From-To', 'From-Via_To', 'MultiLeg']

interface FlightSeriesModalProps {
  isOpen: boolean
  onClose: () => void
  flightSeries: FlightSeriesType | null
  onSave: (flightSeriesData: Partial<FlightSeriesType>) => Promise<void>
  aircrafts: Aircraft[]
  destinations: Destination[]
}

const FlightSeriesModal: React.FC<FlightSeriesModalProps> = ({ isOpen, onClose, flightSeries, onSave, aircrafts, destinations }) => {
  const [formData, setFormData] = useState<Partial<FlightSeriesType>>({
    flt: '',
    aircraft_id: null,
    flight_type: 'From-To',
    start_date: '',
    end_date: '',
    std: '',
    sta: '',
    number_of_seats: null,
    from_destination_id: null,
    from_terminal: '',
    to_terminal: '',
    via_destination_id: null,
    via_std: '',
    via_sta: '',
    to_destination_id: null
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

  // Helper to format time for input[type="time"]
  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    // If time is in format HH:MM:SS, take only HH:MM
    if (timeString.length > 5) {
      return timeString.substring(0, 5)
    }
    return timeString
  }

  useEffect(() => {
    if (isOpen && flightSeries) {
      
      let aircraftId: number | null = null
      if (flightSeries.aircraft_id !== null && flightSeries.aircraft_id !== undefined) {
        aircraftId = Number(flightSeries.aircraft_id)
      } else if (flightSeries.aircraft?.id) {
        aircraftId = Number(flightSeries.aircraft.id)
      }
      
      console.log('🔍 [FlightSeriesModal] Setting form data for flight series:', {
        flightSeries,
        aircraft_id: flightSeries.aircraft_id,
        aircraft: flightSeries.aircraft,
        resolved_aircraft_id: aircraftId
      })
      
      let fromDestId: number | null = null
      if (flightSeries.from_destination_id !== null && flightSeries.from_destination_id !== undefined) {
        fromDestId = Number(flightSeries.from_destination_id)
      } else if (flightSeries.fromDestination?.id) {
        fromDestId = Number(flightSeries.fromDestination.id)
      }

      let viaDestId: number | null = null
      if (flightSeries.via_destination_id !== null && flightSeries.via_destination_id !== undefined) {
        viaDestId = Number(flightSeries.via_destination_id)
      } else if (flightSeries.viaDestination?.id) {
        viaDestId = Number(flightSeries.viaDestination.id)
      }

      let toDestId: number | null = null
      if (flightSeries.to_destination_id !== null && flightSeries.to_destination_id !== undefined) {
        toDestId = Number(flightSeries.to_destination_id)
      } else if (flightSeries.toDestination?.id) {
        toDestId = Number(flightSeries.toDestination.id)
      }

      setFormData({
        flt: flightSeries.flt || '',
        aircraft_id: aircraftId,
        flight_type: flightSeries.flight_type || 'From-To',
        start_date: formatDate(flightSeries.start_date),
        end_date: formatDate(flightSeries.end_date),
        std: formatTime(flightSeries.std),
        sta: formatTime(flightSeries.sta),
        number_of_seats: flightSeries.number_of_seats ?? null,
        from_destination_id: fromDestId,
        from_terminal: flightSeries.from_terminal || '',
        to_terminal: flightSeries.to_terminal || '',
        via_destination_id: viaDestId,
        via_std: formatTime(flightSeries.via_std),
        via_sta: formatTime(flightSeries.via_sta),
        to_destination_id: toDestId
      })
    } else if (isOpen) {
      setFormData({
        flt: '',
        aircraft_id: null,
        flight_type: 'From-To',
        start_date: '',
        end_date: '',
        std: '',
        sta: '',
        number_of_seats: null,
        from_destination_id: null,
        from_terminal: '',
        to_terminal: '',
        via_destination_id: null,
        via_std: '',
        via_sta: '',
        to_destination_id: null
      })
    }
  }, [isOpen, flightSeries?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      let aircraftId: number | null = null
      if (formData.aircraft_id !== null && formData.aircraft_id !== undefined) {
        aircraftId = Number(formData.aircraft_id)
      }

      let fromDestId: number | null = null
      if (formData.from_destination_id !== null && formData.from_destination_id !== undefined) {
        fromDestId = Number(formData.from_destination_id)
      }

      let viaDestId: number | null = null
      if (formData.via_destination_id !== null && formData.via_destination_id !== undefined) {
        viaDestId = Number(formData.via_destination_id)
      }

      let toDestId: number | null = null
      if (formData.to_destination_id !== null && formData.to_destination_id !== undefined) {
        toDestId = Number(formData.to_destination_id)
      }

      let numberOfSeats: number | null = null
      if (formData.number_of_seats !== null && formData.number_of_seats !== undefined) {
        numberOfSeats = Number(formData.number_of_seats)
      }
      
      const cleanedData: Partial<FlightSeriesType> = {
        ...formData,
        aircraft_id: aircraftId,
        number_of_seats: numberOfSeats,
        from_destination_id: fromDestId,
        via_destination_id: viaDestId,
        to_destination_id: toDestId,
        from_terminal: formData.from_terminal || null,
        to_terminal: formData.to_terminal || null,
        via_std: formData.via_std || null,
        via_sta: formData.via_sta || null,
      }
      
      console.log('📤 [FlightSeriesModal] Submitting cleaned data:', JSON.stringify(cleanedData, null, 2))
      console.log('📤 [FlightSeriesModal] Aircraft ID being sent:', cleanedData.aircraft_id, 'Type:', typeof cleanedData.aircraft_id)
      await onSave(cleanedData)
      onClose()
    } catch (error) {
      console.error('Error saving flight series:', error)
      let errorMessage = 'Failed to save flight series'
      const err = error as any
      
      if (err.message) {
        errorMessage = err.message
        if (errorMessage.startsWith('Failed to save flight series: ')) {
          errorMessage = errorMessage.replace('Failed to save flight series: ', '')
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
    
    if (name === 'aircraft_id' || name === 'from_destination_id' || name === 'via_destination_id' || name === 'to_destination_id') {
      newValue = value === '' ? null : parseInt(value, 10)
      
      // Auto-populate number_of_seats when aircraft is selected
      if (name === 'aircraft_id' && value !== '') {
        const selectedAircraft = aircrafts.find(a => a.id === parseInt(value, 10))
        if (selectedAircraft && selectedAircraft.capacity) {
          setFormData(prev => {
            const updated = {
              ...prev,
              aircraft_id: newValue,
              number_of_seats: selectedAircraft.capacity
            }
            console.log('📝 [FlightSeriesModal] Auto-populated seats from aircraft:', selectedAircraft.capacity)
            return updated
          })
          return
        } else {
          // Clear seats if no aircraft selected or aircraft has no capacity
          setFormData(prev => ({
            ...prev,
            aircraft_id: newValue,
            number_of_seats: null
          }))
          return
        }
      }
    }
    
    if (name === 'number_of_seats') {
      newValue = value === '' ? null : parseInt(value, 10)
    }
    
    // If flight type changes, reset conditional fields
    if (name === 'flight_type') {
      setFormData(prev => {
        const updated = {
          ...prev,
          [name]: value,
          // Reset fields that don't apply to the new flight type
          from_destination_id: value === 'From-To' || value === 'From-Via_To' ? prev.from_destination_id : null,
          from_terminal: value === 'From-To' || value === 'From-Via_To' ? prev.from_terminal : '',
          to_terminal: value === 'From-To' || value === 'From-Via_To' ? prev.to_terminal : '',
          to_destination_id: value === 'From-To' || value === 'From-Via_To' ? prev.to_destination_id : null,
          via_destination_id: value === 'From-Via_To' ? prev.via_destination_id : null,
          via_std: value === 'From-Via_To' ? prev.via_std : '',
          via_sta: value === 'From-Via_To' ? prev.via_sta : '',
        }
        console.log('📝 [FlightSeriesModal] Updated formData (flight type changed):', updated)
        return updated
      })
      return
    }
    
    console.log('🔄 [FlightSeriesModal] Handle change:', { name, value, newValue, currentFormData: formData })
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      }
      console.log('📝 [FlightSeriesModal] Updated formData:', updated)
      return updated
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {flightSeries ? 'Edit Flight Series' : 'Add New Flight Series'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">FLT (Flight Number) *</label>
              <input
                type="text"
                name="flt"
                value={formData.flt || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., AA100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Aircraft</label>
              <select
                key={`aircraft-select-${flightSeries?.id || 'new'}-${formData.aircraft_id || 'none'}`}
                name="aircraft_id"
                value={formData.aircraft_id !== null && formData.aircraft_id !== undefined ? String(formData.aircraft_id) : ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an aircraft</option>
                {aircrafts.map(aircraft => (
                  <option key={aircraft.id} value={String(aircraft.id)}>
                    {aircraft.name} ({aircraft.registration})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Number of Seats</label>
              <input
                type="number"
                name="number_of_seats"
                value={formData.number_of_seats ?? ''}
                onChange={handleChange}
                min="0"
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Auto-filled from aircraft"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Flight Type *</label>
              <select
                name="flight_type"
                value={formData.flight_type || 'From-To'}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                {FLIGHT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">End Date *</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">STD (Scheduled Time of Departure)</label>
              <input
                type="time"
                name="std"
                value={formData.std || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">STA (Scheduled Time of Arrival)</label>
              <input
                type="time"
                name="sta"
                value={formData.sta || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* From-To Fields */}
          {(formData.flight_type === 'From-To') && (
            <div className="border-t pt-2 mt-2">
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1.5">From-To Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">From Destination</label>
                  <select
                    name="from_destination_id"
                    value={formData.from_destination_id !== null && formData.from_destination_id !== undefined ? String(formData.from_destination_id) : ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>
                        {dest.code} - {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">From Terminal</label>
                  <input
                    type="text"
                    name="from_terminal"
                    value={formData.from_terminal || ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Terminal name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">To Destination</label>
                  <select
                    name="to_destination_id"
                    value={formData.to_destination_id !== null && formData.to_destination_id !== undefined ? String(formData.to_destination_id) : ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>
                        {dest.code} - {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">To Terminal</label>
                  <input
                    type="text"
                    name="to_terminal"
                    value={formData.to_terminal || ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Terminal name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* From-Via_To Fields */}
          {(formData.flight_type === 'From-Via_To') && (
            <div className="border-t pt-2 mt-2">
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1.5">From-Via-To Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">From Destination</label>
                  <select
                    name="from_destination_id"
                    value={formData.from_destination_id !== null && formData.from_destination_id !== undefined ? String(formData.from_destination_id) : ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>
                        {dest.code} - {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">From Terminal</label>
                  <input
                    type="text"
                    name="from_terminal"
                    value={formData.from_terminal || ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Terminal name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Via Destination</label>
                  <select
                    name="via_destination_id"
                    value={formData.via_destination_id !== null && formData.via_destination_id !== undefined ? String(formData.via_destination_id) : ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>
                        {dest.code} - {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Via STD</label>
                  <input
                    type="time"
                    name="via_std"
                    value={formData.via_std || ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Via STA</label>
                  <input
                    type="time"
                    name="via_sta"
                    value={formData.via_sta || ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">To Destination</label>
                  <select
                    name="to_destination_id"
                    value={formData.to_destination_id !== null && formData.to_destination_id !== undefined ? String(formData.to_destination_id) : ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>
                        {dest.code} - {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">To Terminal</label>
                  <input
                    type="text"
                    name="to_terminal"
                    value={formData.to_terminal || ''}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Terminal name"
                  />
                </div>
              </div>
            </div>
          )}

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
              {saving ? 'Saving...' : flightSeries ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const FlightSeries: React.FC = () => {
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType[]>([])
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFlightSeries, setEditingFlightSeries] = useState<FlightSeriesType | null>(null)
  const [isFarePriceModalOpen, setIsFarePriceModalOpen] = useState(false)
  const [selectedFlightSeriesForFare, setSelectedFlightSeriesForFare] = useState<FlightSeriesType | null>(null)
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false)
  const [selectedFlightSeriesForCrew, setSelectedFlightSeriesForCrew] = useState<FlightSeriesType | null>(null)
  const [allCrew, setAllCrew] = useState<Crew[]>([])
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [historyStartDate, setHistoryStartDate] = useState('')
  const [historyEndDate, setHistoryEndDate] = useState('')
  const [activeStartDate, setActiveStartDate] = useState('')
  const [activeEndDate, setActiveEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const limit = 50

  useEffect(() => {
    fetchFlightSeries()
    fetchAircrafts()
    fetchDestinations()
    fetchCrew()
  }, [page])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, showActiveOnly, showHistory, historyStartDate, historyEndDate, activeStartDate, activeEndDate])

  const fetchCrew = async () => {
    try {
      const result = await adminApiService.getCrew(1, 1000)
      setAllCrew(result.crew || [])
    } catch (error) {
      console.error('Error fetching crew:', error)
      setAllCrew([])
    }
  }

  const fetchFlightSeries = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getFlightSeries(page, limit)
      setFlightSeries(result.flightSeries || [])
    } catch (error) {
      console.error('Error fetching flight series:', error)
      setFlightSeries([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAircrafts = async () => {
    try {
      const result = await adminApiService.getAircrafts(1, 1000)
      setAircrafts(result.aircrafts || [])
    } catch (error) {
      console.error('Error fetching aircrafts:', error)
      setAircrafts([])
    }
  }

  const fetchDestinations = async () => {
    try {
      const result = await adminApiService.getDestinations(1, 1000)
      setDestinations(result.destinations || [])
    } catch (error) {
      console.error('Error fetching destinations:', error)
      setDestinations([])
    }
  }

  const filteredFlightSeries = flightSeries.filter(fs => {
    // Text search filter
    const matchesSearch = fs.flt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fs.aircraft?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fs.aircraft?.registration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fs.flight_type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    // If neither filter is active, show all flights
    if (!showActiveOnly && !showHistory) {
      return true
    }
    
    // Active flights filter (flights that haven't happened yet)
    if (showActiveOnly && fs.start_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      const startDate = new Date(fs.start_date)
      startDate.setHours(0, 0, 0, 0)
      if (startDate >= today) {
        return true // This is an active flight
      }
    }
    
    // History filter (flights that have already happened)
    if (showHistory && fs.start_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(fs.start_date)
      startDate.setHours(0, 0, 0, 0)
      
      // Only show flights that have already started (start_date < today)
      if (startDate < today) {
        // Apply date range filter if provided
        if (historyStartDate || historyEndDate) {
          if (historyStartDate) {
            const filterStartDate = new Date(historyStartDate)
            filterStartDate.setHours(0, 0, 0, 0)
            if (startDate < filterStartDate) return false
          }
          if (historyEndDate) {
            const filterEndDate = new Date(historyEndDate)
            filterEndDate.setHours(23, 59, 59, 999) // End of day
            if (startDate > filterEndDate) return false
          }
        }
        return true // This is a history flight
      }
    }
    
    return false
  })

  const handleEdit = (flightSeries: FlightSeriesType) => {
    setEditingFlightSeries(flightSeries)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingFlightSeries(null)
    setIsModalOpen(true)
  }

  const handleSave = async (flightSeriesData: Partial<FlightSeriesType>) => {
    try {
      if (editingFlightSeries) {
        await adminApiService.updateFlightSeries(editingFlightSeries.id, flightSeriesData)
      } else {
        await adminApiService.createFlightSeries(flightSeriesData)
      }
      await fetchFlightSeries()
    } catch (error) {
      console.error('Error saving flight series:', error)
      throw error
    }
  }

  const handleOpenFarePriceModal = (flightSeries: FlightSeriesType) => {
    setSelectedFlightSeriesForFare(flightSeries)
    setIsFarePriceModalOpen(true)
  }

  const handleSaveFarePrices = async (flightSeriesId: number, farePrices: { adult_fare: number | null; child_fare: number | null; infant_fare: number | null }) => {
    try {
      await adminApiService.updateFlightSeries(flightSeriesId, farePrices)
      await fetchFlightSeries()
    } catch (error) {
      console.error('Error saving fare prices:', error)
      throw error
    }
  }

  const handleOpenCrewModal = async (flightSeries: FlightSeriesType) => {
    // Fetch the full flight series with crew assignments
    const fullFlightSeries = await adminApiService.getFlightSeriesById(flightSeries.id)
    setSelectedFlightSeriesForCrew(fullFlightSeries)
    setIsCrewModalOpen(true)
  }

  const handleAssignCrew = async (crewId: number) => {
    if (!selectedFlightSeriesForCrew) return
    try {
      await adminApiService.assignCrewToFlight(selectedFlightSeriesForCrew.id, crewId)
      // Refresh the flight series data
      const updated = await adminApiService.getFlightSeriesById(selectedFlightSeriesForCrew.id)
      setSelectedFlightSeriesForCrew(updated)
      await fetchFlightSeries()
    } catch (error) {
      console.error('Error assigning crew:', error)
      alert('Failed to assign crew. Please try again.')
    }
  }

  const handleRemoveCrew = async (crewId: number) => {
    if (!selectedFlightSeriesForCrew) return
    try {
      await adminApiService.removeCrewFromFlight(selectedFlightSeriesForCrew.id, crewId)
      // Refresh the flight series data
      const updated = await adminApiService.getFlightSeriesById(selectedFlightSeriesForCrew.id)
      setSelectedFlightSeriesForCrew(updated)
      await fetchFlightSeries()
    } catch (error) {
      console.error('Error removing crew:', error)
      alert('Failed to remove crew. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    return timeString.substring(0, 5) // Show HH:MM
  }

  const isHistoricalFlight = (flightSeries: FlightSeriesType) => {
    if (!flightSeries.start_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(flightSeries.start_date)
    startDate.setHours(0, 0, 0, 0)
    return startDate < today
  }

  const exportToCSV = async () => {
    try {
      // Fetch all flight series for export
      let allFlightSeries: FlightSeriesType[] = []
      const pageSize = 100
      let totalRecords = 0
      
      // Fetch first page to get total count
      try {
        const firstResult = await adminApiService.getFlightSeries(1, pageSize)
        if (firstResult && firstResult.flightSeries) {
          allFlightSeries = [...firstResult.flightSeries]
          totalRecords = firstResult.total || 0
          
          // Fetch remaining pages if needed
          const totalPages = Math.ceil(totalRecords / pageSize)
          if (totalPages > 1) {
            const remainingPages = []
            for (let i = 2; i <= totalPages; i++) {
              remainingPages.push(adminApiService.getFlightSeries(i, pageSize))
            }
            
            const remainingResults = await Promise.all(remainingPages)
            remainingResults.forEach(result => {
              if (result && result.flightSeries) {
                allFlightSeries = [...allFlightSeries, ...result.flightSeries]
              }
            })
          }
        }
      } catch (fetchError) {
        console.error('Error fetching flight series for export:', fetchError)
        // Fallback to using currently loaded data
        allFlightSeries = flightSeries
      }
      
      // Apply the same filters to all data
      const allFilteredResults = allFlightSeries.filter(fs => {
        // Text search filter
        const matchesSearch = fs.flt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fs.aircraft?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fs.aircraft?.registration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fs.flight_type?.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (!matchesSearch) return false
        
        // If neither filter is active, show all flights
        if (!showActiveOnly && !showHistory) {
          return true
        }
        
        // Active flights filter (flights that haven't happened yet)
        if (showActiveOnly && fs.start_date) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const startDate = new Date(fs.start_date)
          startDate.setHours(0, 0, 0, 0)
          if (startDate >= today) {
            // Apply date range filter if provided
            if (activeStartDate || activeEndDate) {
              if (activeStartDate) {
                const filterStartDate = new Date(activeStartDate)
                filterStartDate.setHours(0, 0, 0, 0)
                if (startDate < filterStartDate) return false
              }
              if (activeEndDate) {
                const filterEndDate = new Date(activeEndDate)
                filterEndDate.setHours(23, 59, 59, 999)
                if (startDate > filterEndDate) return false
              }
            }
            return true
          }
        }
        
        // History filter (flights that have already happened)
        if (showHistory && fs.start_date) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const startDate = new Date(fs.start_date)
          startDate.setHours(0, 0, 0, 0)
          
          if (startDate < today) {
            // Apply date range filter if provided
            if (historyStartDate || historyEndDate) {
              if (historyStartDate) {
                const filterStartDate = new Date(historyStartDate)
                filterStartDate.setHours(0, 0, 0, 0)
                if (startDate < filterStartDate) return false
              }
              if (historyEndDate) {
                const filterEndDate = new Date(historyEndDate)
                filterEndDate.setHours(23, 59, 59, 999)
                if (startDate > filterEndDate) return false
              }
            }
            return true
          }
        }
        
        return false
      })
      
      if (allFilteredResults.length === 0) {
        alert('No flight series to export')
        return
      }

      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }

      const headers = [
        'FLT',
        'Aircraft',
        'Aircraft Registration',
        'Flight Type',
        'From Destination',
        'Via Destination',
        'To Destination',
        'Start Date',
        'End Date',
        'STD',
        'STA',
        'Number of Seats',
        'Adult Fare',
        'Child Fare',
        'Infant Fare'
      ]

      const rows = allFilteredResults.map(fs => {
        try {
          const adultFare = fs.adult_fare ? (typeof fs.adult_fare === 'string' ? parseFloat(fs.adult_fare) : fs.adult_fare) : null
          const childFare = fs.child_fare ? (typeof fs.child_fare === 'string' ? parseFloat(fs.child_fare) : fs.child_fare) : null
          const infantFare = fs.infant_fare ? (typeof fs.infant_fare === 'string' ? parseFloat(fs.infant_fare) : fs.infant_fare) : null
          
          return [
            fs.flt || '',
            fs.aircraft?.name || '',
            fs.aircraft?.registration || '',
            fs.flight_type || '',
            fs.fromDestination ? `${fs.fromDestination.code || ''} - ${fs.fromDestination.name || ''}` : '',
            fs.viaDestination ? `${fs.viaDestination.code || ''} - ${fs.viaDestination.name || ''}` : '',
            fs.toDestination ? `${fs.toDestination.code || ''} - ${fs.toDestination.name || ''}` : '',
            formatDate(fs.start_date),
            formatDate(fs.end_date),
            formatTime(fs.std) === 'N/A' ? '' : formatTime(fs.std),
            formatTime(fs.sta) === 'N/A' ? '' : formatTime(fs.sta),
            fs.number_of_seats?.toString() || '',
            adultFare ? adultFare.toFixed(2) : '',
            childFare ? childFare.toFixed(2) : '',
            infantFare ? infantFare.toFixed(2) : ''
          ]
        } catch (error) {
          console.error('Error processing flight series row:', fs, error)
          return []
        }
      }).filter(row => row.length > 0)

      // Generate title and filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filterTypeTitle = showActiveOnly ? 'Active Flights' : showHistory ? 'History Flights' : 'All Flights'
      const filterTypeFilename = showActiveOnly ? 'active' : showHistory ? 'history' : 'all'
      const title = `Flight Series - ${filterTypeTitle} - ${dateStr}`
      
      const csvContent = [
        escapeCSV(title),
        '', // Empty row for spacing
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Generate filename
      const filename = `flight-series-${filterTypeFilename}-${dateStr}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`Failed to export flight series: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full">
        <div className="mb-2 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Flight Series
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Schedule and manage flight series</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px]"
              title="Export filtered flight series to CSV"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Add Flight Series
          </button>
          </div>
        </div>

        <div className="bg-white rounded shadow mb-2 p-1.5 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search by FLT, aircraft, or flight type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
            />
          </div>
            <button
              onClick={() => {
                if (showActiveOnly) {
                  setShowActiveOnly(false)
                  setActiveStartDate('')
                  setActiveEndDate('')
                } else {
                  setShowActiveOnly(true)
                  setShowHistory(false)
                }
              }}
              className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1 ${
                showActiveOnly
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Show only flights that haven't started yet"
            >
              <Clock className="h-3 w-3" />
              Active Flights
            </button>
            <button
              onClick={() => {
                if (showHistory) {
                  setShowHistory(false)
                  setHistoryStartDate('')
                  setHistoryEndDate('')
                } else {
                  setShowHistory(true)
                  setShowActiveOnly(false)
                }
              }}
              className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1 ${
                showHistory
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Show historical flights"
            >
              <History className="h-3 w-3" />
              History
            </button>
          </div>
          {showActiveOnly && (
            <div className="flex gap-2 items-center pt-1 border-t border-gray-200">
              <label className="text-[11px] font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
              <input
                type="date"
                value={activeStartDate}
                onChange={(e) => setActiveStartDate(e.target.value)}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <span className="text-[11px] text-gray-500">to</span>
              <input
                type="date"
                value={activeEndDate}
                onChange={(e) => setActiveEndDate(e.target.value)}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="End Date"
              />
              {(activeStartDate || activeEndDate) && (
                <button
                  onClick={() => {
                    setActiveStartDate('')
                    setActiveEndDate('')
                  }}
                  className="px-2 py-0.5 text-[11px] text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Clear date range"
                >
                  Clear
                </button>
              )}
            </div>
          )}
          {showHistory && (
            <div className="flex gap-2 items-center pt-1 border-t border-gray-200">
              <label className="text-[11px] font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <span className="text-[11px] text-gray-500">to</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="End Date"
              />
              {(historyStartDate || historyEndDate) && (
                <button
                  onClick={() => {
                    setHistoryStartDate('')
                    setHistoryEndDate('')
                  }}
                  className="px-2 py-0.5 text-[11px] text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Clear date range"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">FLT</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Aircraft</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Flight Type</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Destinations</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">STD</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">STA</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Calculate pagination for filtered results
                  const startIndex = (currentPage - 1) * recordsPerPage
                  const endIndex = startIndex + recordsPerPage
                  const paginatedFlights = filteredFlightSeries.slice(startIndex, endIndex)
                  
                  return paginatedFlights.map((fs) => (
                  <tr key={fs.id} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{fs.flt || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {fs.aircraft ? (
                        <div className="flex items-center gap-0.5">
                          <Plane className="h-2.5 w-2.5 text-gray-400" />
                          <span>{fs.aircraft.name} ({fs.aircraft.registration})</span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{fs.flight_type || 'N/A'}</td>
                    <td className="px-1.5 py-1 text-[11px] text-gray-900">
                      {fs.flight_type === 'From-Via_To' ? (
                        <div>
                          {fs.fromDestination && (
                            <div>
                              <span className="font-medium">{fs.fromDestination.code}</span>
                              <span className="text-[10px] text-gray-500 ml-1">({fs.fromDestination.name})</span>
                            </div>
                          )}
                          {fs.viaDestination && (
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              → via <span className="font-medium">{fs.viaDestination.code}</span>
                              <span className="text-gray-500 ml-1">({fs.viaDestination.name})</span>
                            </div>
                          )}
                          {fs.toDestination && (
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              → <span className="font-medium">{fs.toDestination.code}</span>
                              <span className="text-gray-500 ml-1">({fs.toDestination.name})</span>
                            </div>
                          )}
                          {!fs.fromDestination && !fs.viaDestination && !fs.toDestination && 'N/A'}
                        </div>
                      ) : fs.fromDestination && fs.toDestination ? (
                        <div>
                          <div>
                            <span className="font-medium">{fs.fromDestination.code}</span>
                            <span className="text-[10px] text-gray-500 ml-1">({fs.fromDestination.name})</span>
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            → <span className="font-medium">{fs.toDestination.code}</span>
                            <span className="text-gray-500 ml-1">({fs.toDestination.name})</span>
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{formatDate(fs.start_date)}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{formatDate(fs.end_date)}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5 text-gray-400" />
                        {formatTime(fs.std)}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5 text-gray-400" />
                        {formatTime(fs.sta)}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(fs)} 
                          disabled={isHistoricalFlight(fs)}
                          className={`flex items-center gap-0.5 ${
                            isHistoricalFlight(fs)
                              ? 'text-gray-400 cursor-not-allowed opacity-50'
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                          title={isHistoricalFlight(fs) ? 'Cannot edit historical flights' : 'Edit flight series'}
                        >
                          <Edit className="h-2.5 w-2.5" />Edit
                        </button>
                        <button 
                          onClick={() => handleOpenFarePriceModal(fs)} 
                          disabled={isHistoricalFlight(fs)}
                          className={`flex items-center gap-0.5 ${
                            isHistoricalFlight(fs)
                              ? 'text-gray-400 cursor-not-allowed opacity-50'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={isHistoricalFlight(fs) ? 'Cannot edit fare prices for historical flights' : 'Manage fare prices'}
                        >
                          <DollarSign className="h-2.5 w-2.5" />Fares
                        </button>
                        <button 
                          onClick={() => handleOpenCrewModal(fs)} 
                          disabled={isHistoricalFlight(fs)}
                          className={`flex items-center gap-0.5 ${
                            isHistoricalFlight(fs)
                              ? 'text-gray-400 cursor-not-allowed opacity-50'
                              : 'text-purple-600 hover:text-purple-900'
                          }`}
                          title={isHistoricalFlight(fs) ? 'Cannot edit crew for historical flights' : 'Assign crew'}
                        >
                          <Users className="h-2.5 w-2.5" />Crew
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
          {filteredFlightSeries.length === 0 && !loading && (
            <div className="text-center py-4">
              <Calendar className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No flight series found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : flightSeries.length === 0 ? 'No flight series in database. Get started by creating a new flight series.' : 'No flight series match your search criteria.'}
              </p>
              {flightSeries.length === 0 && (
                <button onClick={handleCreate} className="mt-2 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]">
                  Create First Flight Series
                </button>
              )}
            </div>
          )}
        </div>

        {filteredFlightSeries.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
            <div className="text-gray-700">
                Showing {Math.min((currentPage - 1) * recordsPerPage + 1, filteredFlightSeries.length)} to {Math.min(currentPage * recordsPerPage, filteredFlightSeries.length)} of {filteredFlightSeries.length} flight series
            </div>
              <div className="flex items-center gap-1">
                <label className="text-gray-700">Records per page:</label>
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when changing records per page
                  }}
                  className="px-1.5 py-0.5 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            {Math.ceil(filteredFlightSeries.length / recordsPerPage) > 1 && (
            <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1} 
                  className="px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                Previous
              </button>
                <span className="px-1.5 py-0.5 text-gray-700">
                  Page {currentPage} of {Math.ceil(filteredFlightSeries.length / recordsPerPage)}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredFlightSeries.length / recordsPerPage), prev + 1))} 
                  disabled={currentPage >= Math.ceil(filteredFlightSeries.length / recordsPerPage)} 
                  className="px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                Next
              </button>
            </div>
            )}
          </div>
        )}

        <FlightSeriesModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingFlightSeries(null); }}
          flightSeries={editingFlightSeries}
          onSave={handleSave}
          aircrafts={aircrafts}
          destinations={destinations}
        />

        {selectedFlightSeriesForFare && (
          <FarePriceModal
            isOpen={isFarePriceModalOpen}
            onClose={() => { setIsFarePriceModalOpen(false); setSelectedFlightSeriesForFare(null); }}
            flightSeriesId={selectedFlightSeriesForFare.id}
            flightNumber={selectedFlightSeriesForFare.flt}
            onSave={handleSaveFarePrices}
            initialFarePrices={{
              adult_fare: selectedFlightSeriesForFare.adult_fare,
              child_fare: selectedFlightSeriesForFare.child_fare,
              infant_fare: selectedFlightSeriesForFare.infant_fare
            }}
          />
        )}

        {/* Crew Assignment Modal */}
        {isCrewModalOpen && selectedFlightSeriesForCrew && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-1.5">
                <h2 className="text-sm font-semibold">
                  Assign Crew - {selectedFlightSeriesForCrew.flt}
                </h2>
                <button onClick={() => { setIsCrewModalOpen(false); setSelectedFlightSeriesForCrew(null); }} className="text-gray-500 hover:text-gray-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Assigned Crew */}
              <div className="mb-2">
                <h3 className="text-[11px] font-medium text-gray-700 mb-1">Assigned Crew</h3>
                {selectedFlightSeriesForCrew.flightCrew && selectedFlightSeriesForCrew.flightCrew.length > 0 ? (
                  <div className="space-y-1">
                    {selectedFlightSeriesForCrew.flightCrew.map((fc) => (
                      <div key={fc.id} className="flex items-center justify-between p-1 bg-gray-50 rounded text-[11px]">
                        <div>
                          <span className="font-medium">{fc.crew?.name || 'Unknown'}</span>
                          <span className="text-gray-600 ml-1">({fc.crew?.role || 'N/A'})</span>
                        </div>
                        <button
                          onClick={() => handleRemoveCrew(fc.crew_id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove crew"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500">No crew assigned</p>
                )}
              </div>

              {/* Available Crew */}
              <div className="border-t pt-2">
                <h3 className="text-[11px] font-medium text-gray-700 mb-1">Available Crew</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {allCrew
                    .filter(crew => {
                      // Filter out already assigned crew
                      if (!selectedFlightSeriesForCrew.flightCrew) return true
                      return !selectedFlightSeriesForCrew.flightCrew.some(fc => fc.crew_id === crew.id)
                    })
                    .map((crew) => (
                      <div key={crew.id} className="flex items-center justify-between p-1 border rounded text-[11px] hover:bg-gray-50">
                        <div>
                          <span className="font-medium">{crew.name}</span>
                          <span className="text-gray-600 ml-1">({crew.role})</span>
                          {crew.contact && (
                            <span className="text-gray-500 ml-1">• {crew.contact}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssignCrew(crew.id)}
                          className="text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded"
                          title="Assign crew"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  {allCrew.filter(crew => {
                    if (!selectedFlightSeriesForCrew.flightCrew) return true
                    return !selectedFlightSeriesForCrew.flightCrew.some(fc => fc.crew_id === crew.id)
                  }).length === 0 && (
                    <p className="text-[11px] text-gray-500">All crew members are assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlightSeries

