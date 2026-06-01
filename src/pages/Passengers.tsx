import { useState, useEffect } from 'react'
import { adminApiService, Passenger } from '../services/api'
import { Users, Search, Edit, XCircle, Plus, Mail, Phone, CheckCircle, Trash2, AlertCircle } from 'lucide-react'

const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Prof.', 'Rev.']

interface PassengerModalProps {
  isOpen: boolean
  onClose: () => void
  passenger: Passenger | null
  onSave: (passengerData: Partial<Passenger>) => Promise<void>
}

const PassengerModal: React.FC<PassengerModalProps> = ({ isOpen, onClose, passenger, onSave }) => {
  const [formData, setFormData] = useState<Partial<Passenger & { booking_status?: string }>>({
    name: '',
    email: '',
    contact: '',
    nationality: '',
    identification: '',
    age: null,
    title: '',
    booking_status: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && passenger) {
      setFormData({
        name: passenger.name || '',
        email: passenger.email || '',
        contact: passenger.contact || '',
        nationality: passenger.nationality || '',
        identification: passenger.identification || '',
        age: passenger.age || null,
        title: passenger.title || '',
        booking_status: (passenger as any).booking_status || ''
      })
    } else if (isOpen) {
      setFormData({
        name: '',
        email: '',
        contact: '',
        nationality: '',
        identification: '',
        age: null,
        title: '',
        booking_status: ''
      })
    }
  }, [isOpen, passenger?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

      const cleanedData: Partial<Passenger> = {
        ...formData,
        email: formData.email || null,
        contact: formData.contact || null,
        nationality: formData.nationality || null,
        identification: formData.identification || null,
        age: formData.age ? Number(formData.age) : null,
        title: formData.title || null,
        booking_status: formData.booking_status || null,
      }

      console.log('📤 [PassengerModal] Submitting cleaned data:', cleanedData)
      await onSave(cleanedData)
      onClose()
    } catch (error) {
      console.error('Error saving passenger:', error)
      let errorMessage = 'Failed to save passenger'
      const err = error as any

      if (err.message) {
        errorMessage = err.message
        if (errorMessage.startsWith('Failed to save passenger: ')) {
          errorMessage = errorMessage.replace('Failed to save passenger: ', '')
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let newValue: any = value

    if (name === 'age') {
      newValue = value === '' ? null : parseInt(value, 10)
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {passenger ? 'Edit Passenger' : 'Add New Passenger'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Title</label>
              <select
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select title</option>
                {TITLE_OPTIONS.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Contact</label>
              <input
                type="text"
                name="contact"
                value={formData.contact || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Nationality</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Identification</label>
              <input
                type="text"
                name="identification"
                value={formData.identification || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="ID/Passport number"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age !== null && formData.age !== undefined ? formData.age : ''}
                onChange={handleChange}
                min="0"
                max="150"
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Booking Status</label>
              <select
                name="booking_status"
                value={formData.booking_status || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select status</option>
                <option value="Boarded">Boarded</option>
                <option value="CHECK IN">CHECK IN</option>
                <option value="No Show">No Show</option>
              </select>
            </div>
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
              {saving ? 'Saving...' : passenger ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CheckInModalProps {
  isOpen: boolean
  onClose: () => void
  passenger: Passenger | null
  onSave: (passengerData: Partial<Passenger>, luggages: Array<{ id?: number; tag_number?: string | null; weight?: number | null }>) => Promise<void>
}

const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, passenger, onSave }) => {
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
      
      // Update passenger booking status to CHECK IN
      const passengerData: Partial<Passenger> = {
        booking_status: 'CHECK IN'
      }

      // Save luggages
      const luggagesToSave = luggages.map(l => ({
        id: l.id,
        tag_number: l.tag_number?.trim() || null,
        weight: l.weight || null
      }))

      await onSave(passengerData, luggagesToSave)
      onClose()
    } catch (error) {
      console.error('Error during check-in:', error)
      let errorMessage = 'Failed to check in passenger'
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
            Check In Passenger: {passenger.name}
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
              className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5"
            >
              <CheckCircle className="h-2.5 w-2.5" />
              {saving ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Passengers: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null)
  const [checkingInPassenger, setCheckingInPassenger] = useState<Passenger | null>(null)
  const limit = 50

  useEffect(() => {
    fetchPassengers()
  }, [page])

  const fetchPassengers = async () => {
    try {
      console.log('👤 [Passengers] Starting to fetch passengers data...')
      setLoading(true)
      const result = await adminApiService.getPassengers(page, limit)
      console.log('✅ [Passengers] Successfully fetched passengers data:', result)

      let passengersArray: Passenger[] = []
      let totalCount = 0

      if (result) {
        if (Array.isArray(result)) {
          passengersArray = result
          totalCount = result.length
        } else {
          passengersArray = result.passengers || []
          totalCount = result.total || 0
        }
      }

      setPassengers(passengersArray)
      setTotal(totalCount)
    } catch (error) {
      console.error('❌ [Passengers] Error fetching passengers:', error)
      setPassengers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const filteredPassengers = passengers.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.identification?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (p: Passenger) => {
    setEditingPassenger(p)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingPassenger(null)
    setIsModalOpen(true)
  }

  const handleSave = async (passengerData: Partial<Passenger>) => {
    try {
      if (editingPassenger) {
        await adminApiService.updatePassenger(editingPassenger.id, passengerData)
      } else {
        await adminApiService.createPassenger(passengerData)
      }
      await fetchPassengers()
    } catch (error) {
      console.error('Error saving passenger:', error)
      throw error
    }
  }

  const handleCheckIn = (p: Passenger) => {
    setCheckingInPassenger(p)
    setIsCheckInModalOpen(true)
  }

  const handleCheckInSave = async (passengerData: Partial<Passenger>, luggages: Array<{ id?: number; tag_number?: string | null; weight?: number | null }>) => {
    if (!checkingInPassenger) return

    try {
      // Update passenger booking status
      await adminApiService.updatePassenger(checkingInPassenger.id, passengerData)

      // Get existing luggages
      const existingLuggages = await adminApiService.getLuggageByPassenger(checkingInPassenger.id)
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
          // Create new luggage
          await adminApiService.createLuggage({
            passenger_id: checkingInPassenger.id,
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

      await fetchPassengers()
    } catch (error) {
      console.error('Error during check-in:', error)
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
              <Users className="h-3.5 w-3.5 text-blue-600" />
              Passengers
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Manage passenger information</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Add Passenger
          </button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-1.5 mb-2">
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 rounded">
                <Users className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Total Passengers</p>
                <p className="text-sm font-bold text-gray-900">{filteredPassengers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search by name, PNR, email, contact, or identification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
            />
          </div>
        </div>

        {/* Passengers Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">PNR</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Identification</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{p.pnr || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {p.title && <span className="text-gray-500">{p.title} </span>}
                      {p.name || 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      <div className="flex flex-col">
                        {p.email && (
                          <div className="flex items-center gap-0.5">
                            <Mail className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px]">{p.email}</span>
                          </div>
                        )}
                        {p.contact && (
                          <div className="flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px]">{p.contact}</span>
                          </div>
                        )}
                        {!p.email && !p.contact && <span className="text-[10px]">N/A</span>}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{p.nationality || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{p.identification || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{p.age !== null && p.age !== undefined ? p.age : 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      {((p as any).booking_status) ? (
                        <span className={`inline-flex px-1 py-0.5 text-[10px] font-semibold rounded ${
                          (p as any).booking_status === 'Boarded' ? 'bg-green-100 text-green-800' :
                          (p as any).booking_status === 'CHECK IN' ? 'bg-blue-100 text-blue-800' :
                          (p as any).booking_status === 'No Show' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(p as any).booking_status}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5" title="Edit passenger">
                          <Edit className="h-2.5 w-2.5" />Edit
                        </button>
                        <button 
                          onClick={() => handleCheckIn(p)} 
                          className="text-green-600 hover:text-green-900 flex items-center gap-0.5" 
                          title="Check in passenger"
                        >
                          <CheckCircle className="h-2.5 w-2.5" />Check In
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
                {searchTerm ? 'Try adjusting your search criteria.' : passengers.length === 0 ? 'No passengers in database. Get started by creating a new passenger.' : 'No passengers match your search criteria.'}
              </p>
              {passengers.length === 0 && (
                <button onClick={handleCreate} className="mt-2 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]">
                  Create First Passenger
                </button>
              )}
            </div>
          )}
        </div>
        {total > limit && (
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="text-gray-700">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} passengers
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
        <PassengerModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingPassenger(null); }}
          passenger={editingPassenger}
          onSave={handleSave}
        />
        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => { setIsCheckInModalOpen(false); setCheckingInPassenger(null); }}
          passenger={checkingInPassenger}
          onSave={handleCheckInSave}
        />
      </div>
    </div>
  )
}

export default Passengers

