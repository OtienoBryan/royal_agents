import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminApiService, Notice, NoticeStats, Country } from '../services/api'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter,
  Calendar,
  Globe,
  FileText
} from 'lucide-react'

const Notices: React.FC = () => {
  const { user } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [stats, setStats] = useState<NoticeStats>({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [countryFilter, _setCountryFilter] = useState<number | undefined>(undefined)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    countryId: 1,
    status: 1
  })

  useEffect(() => {
    console.log('🌍 [Notices] useEffect triggered, user:', user ? 'authenticated' : 'not authenticated')
    if (user) {
      console.log('🌍 [Notices] User is authenticated, loading data...')
      loadNotices()
      loadStats()
      loadCountries()
    } else {
      console.log('🌍 [Notices] User not authenticated, skipping data load')
    }
  }, [user])

  const loadNotices = async () => {
    try {
      setLoading(true)
      setError(null)
      const noticesData = await adminApiService.getNotices(
        countryFilter,
        statusFilter,
        50,
        0
      )
      setNotices(noticesData)
    } catch (err) {
      console.error('Error loading notices:', err)
      setError('Failed to load notices')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await adminApiService.getNoticeStats()
      setStats(statsData)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const loadCountries = async () => {
    try {
      console.log('🌍 [Notices] Loading countries...')
      const countriesData = await adminApiService.getCountries()
      console.log('🌍 [Notices] Countries loaded:', countriesData)
      console.log('🌍 [Notices] Countries count:', countriesData.length)
      setCountries(countriesData)
      console.log('🌍 [Notices] Countries state updated')
    } catch (err) {
      console.error('❌ [Notices] Error loading countries:', err)
      setError('Failed to load countries')
    }
  }

  const handleCreateNotice = async () => {
    try {
      setLoading(true)
      await adminApiService.createNotice(formData)
      setShowCreateModal(false)
      setFormData({ title: '', content: '', countryId: 1, status: 1 })
      await loadNotices()
      await loadStats()
    } catch (err) {
      console.error('Error creating notice:', err)
      setError('Failed to create notice')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNotice = async () => {
    if (!selectedNotice) return

    try {
      setLoading(true)
      await adminApiService.updateNotice(selectedNotice.id, formData)
      setShowEditModal(false)
      setSelectedNotice(null)
      setFormData({ title: '', content: '', countryId: 1, status: 1 })
      await loadNotices()
      await loadStats()
    } catch (err) {
      console.error('Error updating notice:', err)
      setError('Failed to update notice')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNotice = async () => {
    if (!selectedNotice) return

    try {
      setLoading(true)
      await adminApiService.deleteNotice(selectedNotice.id)
      setShowDeleteModal(false)
      setSelectedNotice(null)
      await loadNotices()
      await loadStats()
    } catch (err) {
      console.error('Error deleting notice:', err)
      setError('Failed to delete notice')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (notice: Notice) => {
    try {
      setLoading(true)
      await adminApiService.toggleNoticeStatus(notice.id)
      await loadNotices()
      await loadStats()
    } catch (err) {
      console.error('Error toggling notice status:', err)
      setError('Failed to toggle notice status')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (notice: Notice) => {
    setSelectedNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      countryId: notice.countryId,
      status: notice.status
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (notice: Notice) => {
    setSelectedNotice(notice)
    setShowDeleteModal(true)
  }

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Notice Management</h1>
          <p className="text-[11px] text-gray-600">Manage and publish notices for your organization</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          <span>Create Notice</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="admin-card rounded shadow-lg p-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-blue-100 rounded-full">
              <FileText className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{stats.total}</h3>
              <p className="text-[10px] text-gray-600">Total Notices</p>
            </div>
          </div>
        </div>

        <div className="admin-card rounded shadow-lg p-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-green-100 rounded-full">
              <Eye className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{stats.active}</h3>
              <p className="text-[10px] text-gray-600">Active Notices</p>
            </div>
          </div>
        </div>

        <div className="admin-card rounded shadow-lg p-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-gray-100 rounded-full">
              <EyeOff className="h-3 w-3 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{stats.inactive}</h3>
              <p className="text-[10px] text-gray-600">Inactive Notices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mb-2 p-2 bg-gray-100 rounded text-[10px]">
        <div>🌍 Countries loaded: {countries.length}</div>
        <div>👤 User authenticated: {user ? 'Yes' : 'No'}</div>
        <div>📋 Countries: {countries.map(c => c.name).join(', ')}</div>
      </div>

      {/* Filters */}
      <div className="admin-card rounded shadow-lg p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <button
              onClick={loadNotices}
              className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-[11px]"
            >
              <Filter className="h-3 w-3" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="admin-card rounded shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-[11px] text-gray-600">Loading notices...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-[11px] text-red-600 mb-2">{error}</p>
            <button
              onClick={loadNotices}
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-[11px]"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="text-[11px] font-medium text-gray-900">
                        {notice.title}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-[11px] text-gray-900 max-w-xs truncate">
                        {notice.content}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center text-[11px] text-gray-900">
                        <Globe className="h-3 w-3 mr-1" />
                        {notice.country ? (
                          <div className="flex items-center">
                            <span>{notice.country.name}</span>
                          </div>
                        ) : (
                          <span>Country ID: {notice.countryId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          notice.status === 1
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notice.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center text-[11px] text-gray-900">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(notice.createdAt)}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleStatus(notice)}
                          className={`p-1 rounded transition-colors ${
                            notice.status === 1
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={notice.status === 1 ? 'Deactivate' : 'Activate'}
                        >
                          {notice.status === 1 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => openEditModal(notice)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(notice)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Create New Notice</h2>
            
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notice title"
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter notice content"
                  rows={6}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.countryId}
                    onChange={(e) => setFormData({ ...formData, countryId: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ title: '', content: '', countryId: 1, status: 1 })
                }}
                className="px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-[11px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotice}
                disabled={!formData.title || !formData.content || loading}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[11px]"
              >
                {loading ? 'Creating...' : 'Create Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showEditModal && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Edit Notice</h2>
            
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notice title"
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter notice content"
                  rows={6}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.countryId}
                    onChange={(e) => setFormData({ ...formData, countryId: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedNotice(null)
                  setFormData({ title: '', content: '', countryId: 1, status: 1 })
                }}
                className="px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-[11px]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNotice}
                disabled={!formData.title || !formData.content || loading}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[11px]"
              >
                {loading ? 'Updating...' : 'Update Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Notice Modal */}
      {showDeleteModal && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-3 w-full max-w-md">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Delete Notice</h2>
            <p className="text-[11px] text-gray-600 mb-3">
              Are you sure you want to delete the notice "{selectedNotice.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedNotice(null)
                }}
                className="px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-[11px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNotice}
                disabled={loading}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[11px]"
              >
                {loading ? 'Deleting...' : 'Delete Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notices
