import React, { useState, useEffect } from 'react'
import { adminApiService, Agent, Agency, Country } from '../services/api'
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  User,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react'

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editForm, setEditForm] = useState<Partial<Agent>>({})
  const [countries, setCountries] = useState<Country[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    country: '',
    contact: '',
    agency_id: '',
    use_deposit: false
  })

  useEffect(() => {
    loadData()
    loadCountries()
    loadAgencies()
  }, [])

  const loadCountries = async () => {
    try {
      const countriesList = await adminApiService.getCountries()
      setCountries(countriesList)
    } catch (error) {
      console.error('Error loading countries:', error)
    }
  }

  const loadAgencies = async () => {
    try {
      const result = await adminApiService.getAgencies(1, 1000)
      setAgencies(result.agencies)
    } catch (error) {
      console.error('Error loading agencies:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getAgents(1, 1000)
      setAgents(result.agents)
    } catch (error) {
      console.error('Error loading agents data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agent.contact && agent.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agent.country && agent.country.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowDetailsModal(true)
  }

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setEditForm({
      name: agent.name,
      email: agent.email || '',
      country: agent.country || '',
      contact: agent.contact || '',
      agency_id: agent.agency_id || null,
      use_deposit: agent.use_deposit
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAgent) return

    try {
      const updateData: Partial<Agent> = {
        name: editForm.name?.trim(),
        email: editForm.email && editForm.email.trim() ? editForm.email.trim() : null,
        country: editForm.country && editForm.country.trim() ? editForm.country.trim() : null,
        contact: editForm.contact && editForm.contact.trim() ? editForm.contact.trim() : null,
        agency_id: editForm.agency_id || null,
        use_deposit: editForm.use_deposit
      }
      
      await adminApiService.updateAgent(editingAgent.id, updateData)
      await loadData()
      setShowEditModal(false)
      setEditingAgent(null)
      setEditForm({})
    } catch (error: any) {
      console.error('Error updating agent:', error)
      const errorMessage = error?.serverMessage || error?.message || 'Failed to update agent. Please try again.'
      alert(`Failed to update agent: ${errorMessage}`)
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingAgent(null)
    setEditForm({})
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addForm.name) {
      alert('Please fill in the agent name')
      return
    }

    try {
      const newAgentData: Omit<Agent, 'id' | 'created_at' | 'updated_at'> = {
        name: addForm.name.trim(),
        email: addForm.email && addForm.email.trim() ? addForm.email.trim() : null,
        country: addForm.country && addForm.country.trim() ? addForm.country.trim() : null,
        contact: addForm.contact && addForm.contact.trim() ? addForm.contact.trim() : null,
        agency_id: addForm.agency_id ? Number(addForm.agency_id) : null,
        use_deposit: addForm.use_deposit
      }
      
      console.log('Creating agent with data:', newAgentData)
      await adminApiService.createAgent(newAgentData)
      await loadData()
      setShowAddModal(false)
      setAddForm({
        name: '',
        email: '',
        country: '',
        contact: '',
        agency_id: '',
        use_deposit: false
      })
    } catch (error: any) {
      console.error('Error adding agent:', error)
      const errorMessage = error?.serverMessage || error?.message || 'Failed to add agent. Please try again.'
      alert(`Failed to add agent: ${errorMessage}`)
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddForm({
      name: '',
      email: '',
      country: '',
      contact: '',
      agency_id: '',
      use_deposit: false
    })
  }

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete ${agent.name}?`)) {
      return
    }

    try {
      await adminApiService.deleteAgent(agent.id)
      await loadData()
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert('Failed to delete agent. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1">
            <User className="h-4 w-4 text-blue-600" />
            Agents
          </h1>
          <p className="text-[11px] text-gray-600">Manage travel agents</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add Agent
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, contact, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Country</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Agency</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider">Use Deposit</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {agents.length === 0 ? 'No agents found. Add your first agent to get started.' : 'No agents match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-gray-900">{agent.name}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agent.email || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agent.contact || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agent.country || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agent.agency?.name || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-center">
                      {agent.use_deposit ? (
                        <CheckCircle className="h-3 w-3 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(agent)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View details"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleEdit(agent)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Agent Details</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">{selectedAgent.name}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-blue-600" />
                    Agent Details
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Name</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">{selectedAgent.name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Email</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgent.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Contact</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgent.contact || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-green-600" />
                    Location & Agency
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Country</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgent.country || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Agency</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgent.agency?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Use Deposit</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">
                        {selectedAgent.use_deposit ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            No
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-3 py-1.5 text-[11px] bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Edit Agent</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">{editingAgent.name}</p>
                </div>
                <button onClick={handleEditCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <User className="h-3 w-3 text-blue-600" />
                      Agent Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          required
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Contact</label>
                        <input
                          type="text"
                          value={editForm.contact || ''}
                          onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-green-600" />
                      Location & Agency
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={editForm.country || ''}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select a country</option>
                          {countries.map(country => (
                            <option key={country.id} value={country.name}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Agency</label>
                        <select
                          value={editForm.agency_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, agency_id: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select an agency</option>
                          {agencies.map(agency => (
                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={editForm.use_deposit || false}
                            onChange={(e) => setEditForm({ ...editForm, use_deposit: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Use Deposit
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="px-3 py-1.5 text-[11px] border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-[11px] bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Add New Agent</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">Create a new travel agent profile</p>
                </div>
                <button onClick={handleAddCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <User className="h-3 w-3 text-blue-600" />
                      Agent Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={addForm.name}
                          onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                          required
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter agent name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={addForm.email}
                          onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Contact</label>
                        <input
                          type="text"
                          value={addForm.contact}
                          onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter contact number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-green-600" />
                      Location & Agency
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={addForm.country}
                          onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select a country</option>
                          {countries.map(country => (
                            <option key={country.id} value={country.name}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Agency</label>
                        <select
                          value={addForm.agency_id}
                          onChange={(e) => setAddForm({ ...addForm, agency_id: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select an agency</option>
                          {agencies.map(agency => (
                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={addForm.use_deposit}
                            onChange={(e) => setAddForm({ ...addForm, use_deposit: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Use Deposit
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddCancel}
                    className="px-3 py-1.5 text-[11px] border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-[11px] bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Agents

