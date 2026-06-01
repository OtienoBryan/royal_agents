import { useState, useEffect } from 'react'
import { adminApiService, Destination, Country, IataCode } from '../services/api'
import { MapPin, Search, Edit, Trash2, XCircle, Globe, Plus, Plane } from 'lucide-react'

// Common timezones list
const TIMEZONES = [
  'UTC',
  'Africa/Nairobi',
  'Comoros/(GMT +3))',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland'
]

// Common airports and airstrips (can be expanded or fetched from an API)
const AIRPORTS_AIRSTRIPS = [
  'John F. Kennedy International Airport (JFK)',
  'Los Angeles International Airport (LAX)',
  'Chicago O\'Hare International Airport (ORD)',
  'Miami International Airport (MIA)',
  'Dallas/Fort Worth International Airport (DFW)',
  'Denver International Airport (DEN)',
  'San Francisco International Airport (SFO)',
  'Seattle-Tacoma International Airport (SEA)',
  'London Heathrow Airport (LHR)',
  'Paris Charles de Gaulle Airport (CDG)',
  'Frankfurt Airport (FRA)',
  'Amsterdam Schiphol Airport (AMS)',
  'Dubai International Airport (DXB)',
  'Singapore Changi Airport (SIN)',
  'Tokyo Haneda Airport (HND)',
  'Sydney Kingsford Smith Airport (SYD)',
  'Moheli Bandar Es Eslam Airport (NWA)',
  'Private Airstrip',
  'Helipad',
  'Regional Airport',
  'Cargo Airport'
]

interface DestinationModalProps {
  isOpen: boolean
  onClose: () => void
  destination: Destination | null
  onSave: (destinationData: Partial<Destination>) => Promise<void>
  countries: Country[]
  iataCodes: IataCode[]
}

const DestinationModal: React.FC<DestinationModalProps> = ({ isOpen, onClose, destination, onSave, countries, iataCodes }) => {
  const [formData, setFormData] = useState<Partial<Destination>>({
    code: '',
    name: '',
    country_id: null,
    longitude: null,
    latitude: null,
    timezone: '',
    status: 'active',
    father_code: '',
    destination: '',
    destination_type: 'domestic'
  })
  const [saving, setSaving] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [iataSearchTerm, setIataSearchTerm] = useState('')
  const [selectedIataCode, setSelectedIataCode] = useState<IataCode | null>(null)

  useEffect(() => {
    if (isOpen && destination) {
      // Use country_id directly, or get it from country.id if country relation exists
      let countryId: number | null = null
      if (destination.country_id !== null && destination.country_id !== undefined) {
        countryId = Number(destination.country_id)
        if (isNaN(countryId)) {
          countryId = null
        }
      } else if (destination.country?.id) {
        countryId = Number(destination.country.id)
        if (isNaN(countryId)) {
          countryId = null
        }
      }
      
      console.log('🔍 [DestinationModal] Setting form data for destination:', {
        destination,
        country_id: destination.country_id,
        country: destination.country,
        resolved_country_id: countryId
      })
      
      const newFormData = {
        code: destination.code || '',
        name: destination.name || '',
        country_id: countryId,
        longitude: destination.longitude ? Number(destination.longitude) : null,
        latitude: destination.latitude ? Number(destination.latitude) : null,
        timezone: destination.timezone || '',
        status: destination.status || 'active',
        father_code: destination.father_code || '',
        destination: destination.destination || '',
        destination_type: destination.destination_type || 'domestic'
      }
      
      console.log('🔍 [DestinationModal] New form data:', newFormData)
      setFormData(newFormData)
      setFormKey(prev => prev + 1) // Force re-render of form
      setSelectedIataCode(null)
      setIataSearchTerm('')
    } else if (isOpen) {
      setFormData({
        code: '',
        name: '',
        country_id: null,
        longitude: null,
        latitude: null,
        timezone: '',
        status: 'active',
        father_code: '',
        destination: '',
        destination_type: 'domestic'
      })
      setFormKey(prev => prev + 1) // Force re-render of form
      setSelectedIataCode(null)
      setIataSearchTerm('')
    }
  }, [isOpen, destination?.id, destination?.country_id, destination?.country?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      console.log('📤 [DestinationModal] Form submitted')
      console.log('📤 [DestinationModal] Current formData:', JSON.stringify(formData, null, 2))
      console.log('📤 [DestinationModal] formData.country_id:', formData.country_id, 'Type:', typeof formData.country_id)
      
      // Ensure country_id is explicitly included, even if null
      let countryId: number | null = null
      if (formData.country_id !== null && formData.country_id !== undefined) {
        const parsed = Number(formData.country_id)
        if (!isNaN(parsed)) {
          countryId = parsed
        } else {
          countryId = null
        }
      } else {
        countryId = null
      }
      
      console.log('📤 [DestinationModal] Processed countryId:', countryId, 'Type:', typeof countryId)
      
      const cleanedData: Partial<Destination> = {
        code: formData.code,
        name: formData.name,
        country_id: countryId, // Always include, even if null
        longitude: formData.longitude === null || formData.longitude === undefined ? null : Number(formData.longitude),
        latitude: formData.latitude === null || formData.latitude === undefined ? null : Number(formData.latitude),
        timezone: formData.timezone || null,
        status: formData.status || 'active',
        father_code: formData.father_code || null,
        destination: formData.destination || null,
        destination_type: formData.destination_type || 'domestic',
      }
      
      console.log('📤 [DestinationModal] Cleaned data object:', cleanedData)
      console.log('📤 [DestinationModal] Cleaned data JSON:', JSON.stringify(cleanedData, null, 2))
      console.log('📤 [DestinationModal] Country ID in cleanedData:', cleanedData.country_id, 'Type:', typeof cleanedData.country_id)
      console.log('📤 [DestinationModal] Has country_id property:', 'country_id' in cleanedData)
      console.log('📤 [DestinationModal] Calling onSave...')
      
      await onSave(cleanedData)
      console.log('📤 [DestinationModal] onSave completed, closing modal')
      onClose()
    } catch (error) {
      console.error('❌ [DestinationModal] Error saving destination:', error)
      let errorMessage = 'Failed to save destination'
      const err = error as any
      
      if (err.message) {
        errorMessage = err.message
        if (errorMessage.startsWith('Failed to save destination: ')) {
          errorMessage = errorMessage.replace('Failed to save destination: ', '')
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
    
    if (name === 'country_id') {
      if (value === '' || value === null || value === undefined) {
        newValue = null
      } else {
        const parsed = parseInt(value, 10)
        newValue = isNaN(parsed) ? null : parsed
      }
    } else if (name === 'longitude' || name === 'latitude') {
      if (value === '' || value === null || value === undefined) {
        newValue = null
      } else {
        const parsed = parseFloat(value)
        newValue = isNaN(parsed) ? null : parsed
      }
    }
    
    console.log('🔄 [DestinationModal] Handle change:', { name, value, newValue, currentFormData: formData })
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      }
      console.log('📝 [DestinationModal] Updated formData:', updated)
      console.log('📝 [DestinationModal] Updated country_id:', updated.country_id, 'Type:', typeof updated.country_id)
      return updated
    })
  }

  const handleIataCodeSelect = (iataCode: IataCode) => {
    setSelectedIataCode(iataCode)
    setIataSearchTerm('')
    
    // Find matching country by country_code
    const matchingCountry = countries.find(c => 
      c.code?.toUpperCase() === iataCode.country_code?.toUpperCase()
    )
    
    setFormData(prev => ({
      ...prev,
      code: iataCode.code || prev.code,
      name: iataCode.airport || prev.name,
      country_id: matchingCountry?.id || prev.country_id,
      longitude: iataCode.longitude || prev.longitude,
      latitude: iataCode.latitude || prev.latitude,
      destination: `${iataCode.airport} (${iataCode.code})` || prev.destination
    }))
  }

  const filteredIataCodes = iataCodes.filter(code =>
    code.code?.toLowerCase().includes(iataSearchTerm.toLowerCase()) ||
    code.airport?.toLowerCase().includes(iataSearchTerm.toLowerCase()) ||
    code.city?.toLowerCase().includes(iataSearchTerm.toLowerCase()) ||
    code.country_code?.toLowerCase().includes(iataSearchTerm.toLowerCase())
  ).slice(0, 10) // Limit to 10 results for performance

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {destination ? 'Edit Destination' : 'Add New Destination'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          {/* IATA Code Selection Section */}
          <div className="bg-blue-50 border border-blue-200 rounded p-1.5 mb-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Plane className="h-3 w-3 text-blue-600" />
              <label className="block text-[11px] font-medium text-blue-900">Select IATA Code</label>
            </div>
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
              <input
                type="text"
                placeholder="Search IATA codes by code, airport, city, or country..."
                value={iataSearchTerm}
                onChange={(e) => setIataSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
              />
              {iataSearchTerm && filteredIataCodes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                  {filteredIataCodes.map((code) => (
                    <button
                      key={code.id}
                      type="button"
                      onClick={() => handleIataCodeSelect(code)}
                      className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-[11px] border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{code.code} - {code.airport}</div>
                      <div className="text-gray-500 text-[10px]">
                        {code.city && `${code.city}, `}{code.country_code}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIataCode && (
              <div className="mt-1 p-1 bg-white rounded border border-blue-300 text-[10px]">
                <span className="font-medium text-blue-900">Selected: </span>
                <span className="text-gray-700">{selectedIataCode.code} - {selectedIataCode.airport}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIataCode(null)
                    setIataSearchTerm('')
                  }}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">IATA Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code || ''}
                onChange={handleChange}
                required
                readOnly
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                placeholder="Select IATA code above"
              />
            </div>

            <div>
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
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Country</label>
              <select
                key={`country-select-${destination?.id || 'new'}-${formData.country_id || 'none'}-${isOpen}-${formKey}`}
                name="country_id"
                value={formData.country_id !== null && formData.country_id !== undefined ? String(formData.country_id) : ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.id} value={String(country.id)}>
                    {country.name}
                  </option>
                ))}
              </select>
              {formData.country_id && (
                <p className="text-[9px] text-gray-500 mt-0.5">
                  Selected: {countries.find(c => c.id === formData.country_id)?.name || 'Unknown'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Longitude</label>
              <input
                type="number"
                step="0.0000001"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="-180 to 180"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Latitude</label>
              <input
                type="number"
                step="0.0000001"
                name="latitude"
                value={formData.latitude || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="-90 to 90"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Timezone</label>
              <select
                name="timezone"
                value={formData.timezone || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select timezone</option>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Status *</label>
              <select
                name="status"
                value={formData.status || 'active'}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Destination Type *</label>
              <select
                name="destination_type"
                value={formData.destination_type || 'domestic'}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="domestic">Domestic</option>
                <option value="international">International</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Father Code</label>
              <input
                type="text"
                name="father_code"
                value={formData.father_code || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Destination (Airport/Airstrip)</label>
              <select
                name="destination"
                value={formData.destination || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select airport/airstrip</option>
                {AIRPORTS_AIRSTRIPS.map(airport => (
                  <option key={airport} value={airport}>
                    {airport}
                  </option>
                ))}
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
              {saving ? 'Saving...' : destination ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Destinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [iataCodes, setIataCodes] = useState<IataCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'domestic' | 'international'>('all')
  const limit = 50

  useEffect(() => {
    fetchDestinations()
    fetchCountries()
    fetchIataCodes()
  }, [page])

  const fetchDestinations = async () => {
    try {
      console.log('📥 [Destinations] fetchDestinations called, page:', page, 'limit:', limit)
      setLoading(true)
      const result = await adminApiService.getDestinations(page, limit)
      console.log('📥 [Destinations] Fetched destinations:', result.destinations?.length || 0)
      console.log('📥 [Destinations] Sample destination:', result.destinations?.[0] ? JSON.stringify(result.destinations[0], null, 2) : 'No destinations')
      if (result.destinations?.[0]) {
        console.log('📥 [Destinations] Sample country_id:', result.destinations[0].country_id)
        console.log('📥 [Destinations] Sample country relation:', result.destinations[0].country)
      }
      setDestinations(result.destinations || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('❌ [Destinations] Error fetching destinations:', error)
      setDestinations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      const data = await adminApiService.getCountries()
      setCountries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching countries:', error)
      setCountries([])
    }
  }

  const fetchIataCodes = async () => {
    try {
      // Fetch a larger set of IATA codes for selection (first 500 active codes)
      const result = await adminApiService.getIataCodes(1, 500, '')
      const activeCodes = (result.iataCodes || []).filter(code => code.status === 'active')
      setIataCodes(activeCodes)
    } catch (error) {
      console.error('Error fetching IATA codes:', error)
      setIataCodes([])
    }
  }

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch =
      dest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.country?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || (dest.destination_type || 'domestic') === typeFilter
    return matchesSearch && matchesType
  })

  const domesticCount = destinations.filter(d => (d.destination_type || 'domestic') === 'domestic').length
  const internationalCount = destinations.filter(d => d.destination_type === 'international').length
  const activeCount = filteredDestinations.filter(d => d.status === 'active').length

  const handleEdit = async (destination: Destination) => {
    console.log('✏️ [Destinations] handleEdit called')
    console.log('✏️ [Destinations] Destination from list:', JSON.stringify(destination, null, 2))
    console.log('✏️ [Destinations] Current country_id:', destination.country_id)
    console.log('✏️ [Destinations] Current country relation:', destination.country)
    
    // Fetch fresh destination data to ensure we have the latest country relation
    try {
      console.log('✏️ [Destinations] Fetching fresh destination data for ID:', destination.id)
      const freshDestination = await adminApiService.getDestinationById(destination.id)
      console.log('✏️ [Destinations] Fresh destination fetched:', JSON.stringify(freshDestination, null, 2))
      console.log('✏️ [Destinations] Fresh country_id:', freshDestination.country_id)
      console.log('✏️ [Destinations] Fresh country relation:', freshDestination.country)
      setEditingDestination(freshDestination)
    } catch (error) {
      console.error('❌ [Destinations] Error fetching destination:', error)
      console.error('❌ [Destinations] Falling back to destination from list')
      // Fallback to the destination from the list
      setEditingDestination(destination)
    }
    console.log('✏️ [Destinations] Opening modal')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApiService.deleteDestination(id)
      setDeleteConfirm(null)
      await fetchDestinations()
    } catch (error: any) {
      alert(error?.message || 'Failed to delete destination')
    }
  }

  const handleCreate = () => {
    setEditingDestination(null)
    setIsModalOpen(true)
  }

  const handleSave = async (destinationData: Partial<Destination>) => {
    try {
      console.log('🚀 [Destinations] handleSave called')
      console.log('🚀 [Destinations] destinationData received:', JSON.stringify(destinationData, null, 2))
      console.log('🚀 [Destinations] editingDestination:', editingDestination)
      console.log('🚀 [Destinations] country_id in destinationData:', destinationData.country_id, 'Type:', typeof destinationData.country_id)
      
      let updatedDestination: Destination
      if (editingDestination) {
        console.log('🚀 [Destinations] Updating destination ID:', editingDestination.id)
        console.log('🚀 [Destinations] Current country_id before update:', editingDestination.country_id)
        console.log('🚀 [Destinations] New country_id to set:', destinationData.country_id)
        
        updatedDestination = await adminApiService.updateDestination(editingDestination.id, destinationData)
        console.log('🚀 [Destinations] Update response received:', JSON.stringify(updatedDestination, null, 2))
        console.log('🚀 [Destinations] Updated country_id from response:', updatedDestination.country_id)
        console.log('🚀 [Destinations] Updated country relation:', updatedDestination.country)
        
        // Fetch fresh destination data to ensure we have the latest country relation
        console.log('🚀 [Destinations] Fetching fresh destination data...')
        const freshDestination = await adminApiService.getDestinationById(editingDestination.id)
        console.log('🚀 [Destinations] Fresh destination fetched:', JSON.stringify(freshDestination, null, 2))
        console.log('🚀 [Destinations] Fresh country_id:', freshDestination.country_id)
        console.log('🚀 [Destinations] Fresh country relation:', freshDestination.country)
        setEditingDestination(freshDestination)
      } else {
        console.log('🚀 [Destinations] Creating new destination')
        updatedDestination = await adminApiService.createDestination(destinationData)
        console.log('🚀 [Destinations] Create response:', JSON.stringify(updatedDestination, null, 2))
      }
      
      console.log('🚀 [Destinations] Refreshing destinations list...')
      await fetchDestinations()
      console.log('🚀 [Destinations] Destinations list refreshed')
    } catch (error) {
      console.error('❌ [Destinations] Error saving destination:', error)
      console.error('❌ [Destinations] Error details:', JSON.stringify(error, null, 2))
      throw error
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
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              Destinations
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Manage destination locations</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Add Destination
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-2">
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 rounded">
                <MapPin className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Total</p>
                <p className="text-sm font-bold text-gray-900">{destinations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 rounded">
                <Globe className="h-2.5 w-2.5 text-green-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Active</p>
                <p className="text-sm font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setTypeFilter(typeFilter === 'domestic' ? 'all' : 'domestic')}
            className={`rounded shadow p-1.5 text-left transition-colors ${typeFilter === 'domestic' ? 'bg-orange-500 text-white' : 'bg-white hover:bg-orange-50'}`}
          >
            <div className="flex items-center">
              <div className={`p-1 rounded ${typeFilter === 'domestic' ? 'bg-white/20' : 'bg-orange-100'}`}>
                <MapPin className={`h-2.5 w-2.5 ${typeFilter === 'domestic' ? 'text-white' : 'text-orange-600'}`} />
              </div>
              <div className="ml-1.5">
                <p className={`text-[11px] font-medium ${typeFilter === 'domestic' ? 'text-white/80' : 'text-gray-600'}`}>Domestic</p>
                <p className={`text-sm font-bold ${typeFilter === 'domestic' ? 'text-white' : 'text-gray-900'}`}>{domesticCount}</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === 'international' ? 'all' : 'international')}
            className={`rounded shadow p-1.5 text-left transition-colors ${typeFilter === 'international' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-50'}`}
          >
            <div className="flex items-center">
              <div className={`p-1 rounded ${typeFilter === 'international' ? 'bg-white/20' : 'bg-blue-100'}`}>
                <Globe className={`h-2.5 w-2.5 ${typeFilter === 'international' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className="ml-1.5">
                <p className={`text-[11px] font-medium ${typeFilter === 'international' ? 'text-white/80' : 'text-gray-600'}`}>International</p>
                <p className={`text-sm font-bold ${typeFilter === 'international' ? 'text-white' : 'text-gray-900'}`}>{internationalCount}</p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search by name, code, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
            />
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Timezone</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDestinations.map((dest) => (
                  <tr key={dest.id} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{dest.code || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{dest.name || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{dest.country?.name || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">
                      {dest.latitude && dest.longitude ? `${Number(dest.latitude).toFixed(4)}, ${Number(dest.longitude).toFixed(4)}` : 'N/A'}
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{dest.timezone || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{dest.destination || 'N/A'}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <span className={`inline-flex px-1 py-0.5 text-[10px] font-semibold rounded ${
                        dest.destination_type === 'international' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {dest.destination_type === 'international' ? 'Intl' : 'DOM'}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <span className={`inline-flex px-1 py-0.5 text-[10px] font-semibold rounded ${
                        dest.status === 'active' ? 'bg-green-100 text-green-800' :
                        dest.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dest.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(dest)} className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5" title="Edit destination">
                          <Edit className="h-2.5 w-2.5" />Edit
                        </button>
                        {deleteConfirm === dest.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(dest.id)} className="text-red-600 hover:text-red-900 text-[10px]">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 hover:text-gray-700 text-[10px]">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(dest.id)} className="text-red-500 hover:text-red-700 flex items-center gap-0.5" title="Delete destination">
                            <Trash2 className="h-2.5 w-2.5" />Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDestinations.length === 0 && !loading && (
            <div className="text-center py-4">
              <MapPin className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No destinations found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : destinations.length === 0 ? 'No destinations in database. Get started by creating a new destination.' : 'No destinations match your search criteria.'}
              </p>
              {destinations.length === 0 && (
                <button onClick={handleCreate} className="mt-2 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]">
                  Create First Destination
                </button>
              )}
            </div>
          )}
        </div>

        {total > limit && (
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="text-gray-700">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} destinations
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

        <DestinationModal
          isOpen={isModalOpen}
          onClose={() => { 
            console.log('🚪 [Destinations] Modal closing')
            console.log('🚪 [Destinations] Current editingDestination:', editingDestination)
            setIsModalOpen(false)
            setEditingDestination(null)
          }}
          destination={editingDestination}
          onSave={handleSave}
          countries={countries}
          iataCodes={iataCodes}
        />
      </div>
    </div>
  )
}

export default Destinations

