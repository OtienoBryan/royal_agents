import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminApiService, Aircraft, Category } from '../services/api'
import { Plane, Search, Edit, Trash2, XCircle, User, CheckCircle, Folder } from 'lucide-react'

interface AircraftModalProps {
  isOpen: boolean
  onClose: () => void
  aircraft: Aircraft | null
  onSave: (aircraftData: Partial<Aircraft>) => Promise<void>
  categories: Category[]
  currentUserId?: number
}

const AircraftModal: React.FC<AircraftModalProps> = ({ isOpen, onClose, aircraft, onSave, categories, currentUserId }) => {
  const [formData, setFormData] = useState<Partial<Aircraft>>({
    name: '',
    registration: '',
    capacity: null,
    max_cargo_weight: null,
    category_id: null,
    status: 'active',
    calendar_color: '#3B82F6'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && aircraft) {
      setFormData({
        name: aircraft.name || '',
        registration: aircraft.registration || '',
        capacity: aircraft.capacity || null,
        max_cargo_weight: aircraft.max_cargo_weight || null,
        category_id: aircraft.category_id || null,
        status: aircraft.status || 'active',
        calendar_color: aircraft.calendar_color || '#3B82F6'
      })
    } else if (isOpen) {
      setFormData({
        name: '',
        registration: '',
        capacity: null,
        max_cargo_weight: null,
        category_id: null,
        status: 'active',
        calendar_color: '#3B82F6'
      })
    }
  }, [isOpen, aircraft])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Clean up the form data - convert empty strings to null for optional fields
      const cleanedData: Partial<Aircraft> = {
        name: formData.name,
        registration: formData.registration,
        capacity: formData.capacity === null || formData.capacity === undefined ? null : Number(formData.capacity),
        max_cargo_weight: formData.max_cargo_weight === null || formData.max_cargo_weight === undefined ? null : Number(formData.max_cargo_weight),
        category_id: formData.category_id === null || formData.category_id === undefined ? null : Number(formData.category_id),
        status: formData.status || 'active',
        // Set created_by to current user's ID (only when creating new aircraft)
        created_by: aircraft ? undefined : (currentUserId || null),
      }
      
      // Explicitly include calendar_color if it exists (for updates)
      if (aircraft && formData.calendar_color !== undefined && formData.calendar_color !== null) {
        cleanedData.calendar_color = formData.calendar_color
      }
      
      console.log('📤 [AircraftModal] Submitting cleaned data:', cleanedData)
      console.log('📤 [AircraftModal] Form data calendar_color:', formData.calendar_color)
      console.log('📤 [AircraftModal] Is update mode:', !!aircraft)
      await onSave(cleanedData)
      onClose()
    } catch (error) {
      console.error('Error saving aircraft:', error)
      
      // Extract detailed error message
      let errorMessage = 'Failed to save aircraft'
      const err = error as any
      
      if (err.message) {
        errorMessage = err.message
        // Clean up common error prefixes
        if (errorMessage.startsWith('Failed to save aircraft: ')) {
          errorMessage = errorMessage.replace('Failed to save aircraft: ', '')
        }
        // Handle validation errors with property names
        if (errorMessage.includes('property') && errorMessage.includes('should not exist')) {
          errorMessage = errorMessage.replace(/property\s+(\w+)\s+should not exist/gi, 
            'Field "$1" is not allowed. Please check the form data.')
        }
        if (errorMessage.includes('must be')) {
          errorMessage = errorMessage.replace(/must be a (number|string|integer)/gi, 
            'must be a $1')
        }
      } else if (err.serverMessage) {
        // Handle validation errors (array of messages)
        if (Array.isArray(err.serverMessage)) {
          errorMessage = err.serverMessage
            .map((msg: string) => {
              // Format validation errors nicely
              if (msg.includes('property') && msg.includes('should not exist')) {
                return msg.replace(/property\s+(\w+)\s+should not exist/gi, 
                  'Field "$1" is not allowed')
              }
              return msg
            })
            .join('\n')
        } else {
          errorMessage = err.serverMessage
        }
      } else if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join('\n')
        } else {
          errorMessage = err.response.data.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'max_cargo_weight' 
        ? (value === '' ? null : parseFloat(value))
        : name === 'category_id'
        ? (value === '' ? null : parseInt(value, 10))
        : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {aircraft ? 'Edit Aircraft' : 'Add New Aircraft'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Name *
              </label>
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
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Registration *
              </label>
              <input
                type="text"
                name="registration"
                value={formData.registration || ''}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Max Cargo Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                name="max_cargo_weight"
                value={formData.max_cargo_weight || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Status *
              </label>
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
                <option value="retired">Retired</option>
              </select>
            </div>

            {aircraft && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                  Calendar Color
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    name="calendar_color"
                    value={formData.calendar_color || '#3B82F6'}
                    onChange={handleChange}
                    className="h-6 w-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="calendar_color"
                    value={formData.calendar_color || '#3B82F6'}
                    onChange={handleChange}
                    placeholder="#3B82F6"
                    className="flex-1 px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Color used to display this aircraft in the calendar</p>
              </div>
            )}
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
              {saving ? 'Saving...' : aircraft ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Aircrafts: React.FC = () => {
  const { user } = useAuth()
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const limit = 50

  useEffect(() => {
    fetchAircrafts()
    fetchCategories()
  }, [page])

  const fetchAircrafts = async () => {
    try {
      console.log('✈️ [Aircrafts] Starting to fetch aircrafts data...')
      setLoading(true)
      const result = await adminApiService.getAircrafts(page, limit)
      console.log('✅ [Aircrafts] Successfully fetched aircrafts data:', result)
      console.log('✅ [Aircrafts] Result type:', typeof result)
      console.log('✅ [Aircrafts] Result keys:', result ? Object.keys(result) : 'null')
      console.log('✅ [Aircrafts] Aircrafts array:', result?.aircrafts)
      console.log('✅ [Aircrafts] Total:', result?.total)
      
      // Handle both response formats: { aircrafts: [], total: 0 } or direct array
      let aircraftsArray: Aircraft[] = []
      let totalCount = 0
      
      if (result) {
        if (Array.isArray(result)) {
          // If result is a direct array
          aircraftsArray = result
          totalCount = result.length
        } else if (result.aircrafts && Array.isArray(result.aircrafts)) {
          // If result has aircrafts property
          aircraftsArray = result.aircrafts
          totalCount = result.total || result.aircrafts.length
        }
      }
      
      console.log('✅ [Aircrafts] Final aircrafts array length:', aircraftsArray.length)
      
      // Log sample to verify createdByStaff relation
      if (aircraftsArray.length > 0) {
        const sample = aircraftsArray[0];
        console.log('✅ [Aircrafts] Sample aircraft data:', {
          id: sample.id,
          name: sample.name,
          created_by: sample.created_by,
          createdByStaff: sample.createdByStaff
        });
      }
      
      setAircrafts(aircraftsArray)
      setTotal(totalCount)
    } catch (error) {
      console.error('❌ [Aircrafts] Error fetching aircrafts:', error)
      console.error('❌ [Aircrafts] Error details:', {
        message: (error as any).message,
        stack: (error as any).stack,
        response: (error as any).response
      })
      setAircrafts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('📁 [Aircrafts] Fetching categories...')
      const data = await adminApiService.getCategories()
      console.log('✅ [Aircrafts] Categories fetched:', data)
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Aircrafts] Error fetching categories:', error)
      setCategories([])
    }
  }

  // Filter aircrafts based on search term
  const filteredAircrafts = aircrafts.filter(aircraft =>
    aircraft.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aircraft.registration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aircraft.createdByStaff?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate statistics
  const totalAircrafts = filteredAircrafts.length
  const activeCount = filteredAircrafts.filter(a => a.status === 'active').length

  const handleEdit = (aircraft: Aircraft) => {
    setEditingAircraft(aircraft)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAircraft(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApiService.deleteAircraft(id)
      setDeleteConfirm(null)
      await fetchAircrafts()
    } catch (error: any) {
      alert(error?.message || 'Failed to delete aircraft')
    }
  }

  const handleSave = async (aircraftData: Partial<Aircraft>) => {
    try {
      if (editingAircraft) {
        await adminApiService.updateAircraft(editingAircraft.id, aircraftData)
      } else {
        await adminApiService.createAircraft(aircraftData)
      }
      await fetchAircrafts()
    } catch (error) {
      console.error('Error saving aircraft:', error)
      // Re-throw error to be handled by the modal
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full">
        {/* Header */}
        <div className="mb-2 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <Plane className="h-3.5 w-3.5 text-blue-600" />
              Aircrafts
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Manage aircraft inventory</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plane className="h-3 w-3" />
            Add Aircraft
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-2">
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-0.5 bg-blue-100 rounded">
                <Plane className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Total Aircrafts</p>
                <p className="text-sm font-bold text-gray-900">{totalAircrafts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-0.5 bg-green-100 rounded">
                <CheckCircle className="h-2.5 w-2.5 text-green-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Active Aircrafts</p>
                <p className="text-sm font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="relative">
            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search by name, registration, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Aircrafts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Max Cargo Weight (kg)
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-1.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAircrafts.map((aircraft) => (
                  <tr key={aircraft.id} className="hover:bg-gray-50">
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <div className="text-[11px] font-medium text-gray-900">
                        {aircraft.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <div className="text-[11px] text-gray-900">
                        {aircraft.registration || 'N/A'}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <div className="text-[11px] text-gray-900">
                        {aircraft.capacity?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <div className="text-[11px] text-gray-900">
                        {aircraft.max_cargo_weight ? `${aircraft.max_cargo_weight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <div className="text-[11px] text-gray-900 flex items-center gap-0.5">
                        {aircraft.category ? (
                          <>
                            <Folder className="h-2.5 w-2.5 text-gray-400" />
                            {aircraft.category.name}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap">
                      <div className="text-[11px] text-gray-900 flex items-center gap-0.5">
                        <User className="h-2.5 w-2.5 text-gray-400" />
                        {aircraft.createdByStaff?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1 py-0.5 text-[11px] font-semibold rounded ${
                        aircraft.status === 'active' ? 'bg-green-100 text-green-800' :
                        aircraft.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        aircraft.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {aircraft.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(aircraft)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5"
                          title="Edit aircraft"
                        >
                          <Edit className="h-2.5 w-2.5" />Edit
                        </button>
                        {deleteConfirm === aircraft.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(aircraft.id)} className="text-red-600 hover:text-red-900 text-[10px]">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 hover:text-gray-700 text-[10px]">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(aircraft.id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-0.5"
                            title="Delete aircraft"
                          >
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
          {filteredAircrafts.length === 0 && !loading && (
            <div className="text-center py-4">
              <Plane className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No aircrafts found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : aircrafts.length === 0 
                    ? 'No aircrafts in database. Get started by creating a new aircraft.'
                    : 'No aircrafts match your search criteria.'}
              </p>
              {aircrafts.length === 0 && (
                <button
                  onClick={handleCreate}
                  className="mt-1.5 px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create First Aircraft
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-gray-700">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} aircrafts
            </div>
            <div className="flex gap-0.5">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={page * limit >= total}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <AircraftModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingAircraft(null)
          }}
          aircraft={editingAircraft}
          onSave={handleSave}
          categories={categories}
          currentUserId={user?.id}
        />
      </div>
    </div>
  )
}

export default Aircrafts
