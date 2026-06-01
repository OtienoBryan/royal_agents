import React, { useState, useEffect } from 'react'
import { adminApiService, Crew } from '../services/api'
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  X
} from 'lucide-react'

const CrewPage: React.FC = () => {
  const [crew, setCrew] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null)
  const [editForm, setEditForm] = useState<Partial<Crew>>({})
  const [addForm, setAddForm] = useState({
    name: '',
    contact: '',
    role: '',
    nationality: '',
    id_number: '',
    license_number: '',
    license_issue_date: '',
    medical_class: '',
    medical_date: '',
    fixed_wing_training_date: '',
    rotorcraft_asel: '',
    rotorcraft_amel: '',
    rotorcraft_ases: '',
    rotorcraft_ames: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getCrew(1, 1000)
      setCrew(result.crew)
    } catch (error) {
      console.error('Error loading crew data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCrew = crew.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.contact && member.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.license_number && member.license_number.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = roleFilter === 'all' || member.role === roleFilter

    return matchesSearch && matchesRole
  })

  const roleOptions = ['Pilot', 'Co-Pilot', 'Engineer']

  const getUniqueRoles = () => {
    const existingRoles = Array.from(new Set(crew.map(member => member.role).filter(Boolean)))
    // Combine predefined roles with any existing roles in the database
    return Array.from(new Set([...roleOptions, ...existingRoles]))
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const handleViewDetails = (crewMember: Crew) => {
    setSelectedCrew(crewMember)
    setShowDetailsModal(true)
  }

  const handleEdit = (crewMember: Crew) => {
    setEditingCrew(crewMember)
    setEditForm({
      name: crewMember.name,
      contact: crewMember.contact || '',
      role: crewMember.role,
      nationality: crewMember.nationality || '',
      id_number: crewMember.id_number || '',
      license_number: crewMember.license_number || '',
      license_issue_date: crewMember.license_issue_date ? crewMember.license_issue_date.split('T')[0] : '',
      medical_class: crewMember.medical_class || '',
      medical_date: crewMember.medical_date ? crewMember.medical_date.split('T')[0] : '',
      fixed_wing_training_date: crewMember.fixed_wing_training_date ? crewMember.fixed_wing_training_date.split('T')[0] : '',
      rotorcraft_asel: crewMember.rotorcraft_asel ? crewMember.rotorcraft_asel.split('T')[0] : '',
      rotorcraft_amel: crewMember.rotorcraft_amel ? crewMember.rotorcraft_amel.split('T')[0] : '',
      rotorcraft_ases: crewMember.rotorcraft_ases ? crewMember.rotorcraft_ases.split('T')[0] : '',
      rotorcraft_ames: crewMember.rotorcraft_ames ? crewMember.rotorcraft_ames.split('T')[0] : ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCrew) return

    try {
      await adminApiService.updateCrew(editingCrew.id, editForm)
      await loadData()
      setShowEditModal(false)
      setEditingCrew(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating crew member:', error)
      alert('Failed to update crew member. Please try again.')
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingCrew(null)
    setEditForm({})
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addForm.name || !addForm.role) {
      alert('Please fill in all required fields (Name and Role)')
      return
    }

    try {
      const newCrewData: Omit<Crew, 'id' | 'created_at' | 'updated_at'> = {
        name: addForm.name,
        contact: addForm.contact || null,
        role: addForm.role,
        nationality: addForm.nationality || null,
        id_number: addForm.id_number || null,
        license_number: addForm.license_number || null,
        license_issue_date: addForm.license_issue_date || null,
        medical_class: addForm.medical_class || null,
        medical_date: addForm.medical_date || null,
        fixed_wing_training_date: addForm.fixed_wing_training_date || null,
        rotorcraft_asel: addForm.rotorcraft_asel || null,
        rotorcraft_amel: addForm.rotorcraft_amel || null,
        rotorcraft_ases: addForm.rotorcraft_ases || null,
        rotorcraft_ames: addForm.rotorcraft_ames || null
      }
      
      await adminApiService.createCrew(newCrewData)
      await loadData()
      setShowAddModal(false)
      setAddForm({
        name: '',
        contact: '',
        role: '',
        nationality: '',
        id_number: '',
        license_number: '',
        license_issue_date: '',
        medical_class: '',
        medical_date: '',
        fixed_wing_training_date: '',
        rotorcraft_asel: '',
        rotorcraft_amel: '',
        rotorcraft_ases: '',
        rotorcraft_ames: ''
      })
    } catch (error) {
      console.error('Error adding crew member:', error)
      alert('Failed to add crew member. Please try again.')
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddForm({
      name: '',
      contact: '',
      role: '',
      nationality: '',
      id_number: '',
      license_number: '',
      license_issue_date: '',
      medical_class: '',
      medical_date: '',
      fixed_wing_training_date: '',
      rotorcraft_asel: '',
      rotorcraft_amel: '',
      rotorcraft_ases: '',
      rotorcraft_ames: ''
    })
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this crew member?')) {
      try {
        await adminApiService.deleteCrew(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting crew member:', error)
        alert('Failed to delete crew member. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Crew Management</h1>
          <p className="text-[11px] text-gray-600">Manage flight crew members and their certifications</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add Crew
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, contact, role, or license..."
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {getUniqueRoles().map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Nationality</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">License #</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Medical Class</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCrew.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    No crew members found
                  </td>
                </tr>
              ) : (
                filteredCrew.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-900">{member.name}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">{member.contact || 'N/A'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">{member.role}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">{member.nationality || 'N/A'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">{member.license_number || 'N/A'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">{member.medical_class || 'N/A'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Details Modal */}
      {showDetailsModal && selectedCrew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Crew Member Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">Name</label>
                  <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.name}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">Contact</label>
                  <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.contact || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">Role</label>
                  <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.role}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">Nationality</label>
                  <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.nationality || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">ID Number</label>
                  <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.id_number || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">License Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">License Number</label>
                    <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.license_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Issue Date</label>
                    <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.license_issue_date)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">Medical Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Medical Class</label>
                    <p className="text-[11px] text-gray-900 mt-1">{selectedCrew.medical_class || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Medical Date</label>
                    <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.medical_date)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">Training Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Fixed Wing Training Date</label>
                    <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.fixed_wing_training_date)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-semibold text-gray-700 mb-2">Rotorcraft Training</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">ASEL</label>
                      <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.rotorcraft_asel)}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">AMEL</label>
                      <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.rotorcraft_amel)}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">ASES</label>
                      <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.rotorcraft_ases)}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">AMES</label>
                      <p className="text-[11px] text-gray-900 mt-1">{formatDate(selectedCrew.rotorcraft_ames)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-[11px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCrew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Edit Crew Member</h2>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    type="text"
                    value={editForm.contact || ''}
                    onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={editForm.role || ''}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Role</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={editForm.nationality || ''}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={editForm.id_number || ''}
                    onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">License Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      value={editForm.license_number || ''}
                      onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={editForm.license_issue_date || ''}
                      onChange={(e) => setEditForm({ ...editForm, license_issue_date: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">Medical Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Medical Class</label>
                    <input
                      type="text"
                      value={editForm.medical_class || ''}
                      onChange={(e) => setEditForm({ ...editForm, medical_class: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Medical Date</label>
                    <input
                      type="date"
                      value={editForm.medical_date || ''}
                      onChange={(e) => setEditForm({ ...editForm, medical_date: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">Training Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Fixed Wing Training Date</label>
                    <input
                      type="date"
                      value={editForm.fixed_wing_training_date || ''}
                      onChange={(e) => setEditForm({ ...editForm, fixed_wing_training_date: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-semibold text-gray-700 mb-2">Rotorcraft Training</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">ASEL</label>
                      <input
                        type="date"
                        value={editForm.rotorcraft_asel || ''}
                        onChange={(e) => setEditForm({ ...editForm, rotorcraft_asel: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">AMEL</label>
                      <input
                        type="date"
                        value={editForm.rotorcraft_amel || ''}
                        onChange={(e) => setEditForm({ ...editForm, rotorcraft_amel: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">ASES</label>
                      <input
                        type="date"
                        value={editForm.rotorcraft_ases || ''}
                        onChange={(e) => setEditForm({ ...editForm, rotorcraft_ases: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">AMES</label>
                      <input
                        type="date"
                        value={editForm.rotorcraft_ames || ''}
                        onChange={(e) => setEditForm({ ...editForm, rotorcraft_ames: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-[11px]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Add Crew Member</h2>
              <button
                onClick={handleAddCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    type="text"
                    value={addForm.contact}
                    onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Role</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={addForm.nationality}
                    onChange={(e) => setAddForm({ ...addForm, nationality: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={addForm.id_number}
                    onChange={(e) => setAddForm({ ...addForm, id_number: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">License Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      value={addForm.license_number}
                      onChange={(e) => setAddForm({ ...addForm, license_number: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={addForm.license_issue_date}
                      onChange={(e) => setAddForm({ ...addForm, license_issue_date: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">Medical Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Medical Class</label>
                    <input
                      type="text"
                      value={addForm.medical_class}
                      onChange={(e) => setAddForm({ ...addForm, medical_class: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Medical Date</label>
                    <input
                      type="date"
                      value={addForm.medical_date}
                      onChange={(e) => setAddForm({ ...addForm, medical_date: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-[12px] font-bold text-gray-900 mb-2">Training Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Fixed Wing Training Date</label>
                    <input
                      type="date"
                      value={addForm.fixed_wing_training_date}
                      onChange={(e) => setAddForm({ ...addForm, fixed_wing_training_date: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-semibold text-gray-700 mb-2">Rotorcraft Training</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">ASEL</label>
                      <input
                        type="date"
                        value={addForm.rotorcraft_asel}
                        onChange={(e) => setAddForm({ ...addForm, rotorcraft_asel: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">AMEL</label>
                      <input
                        type="date"
                        value={addForm.rotorcraft_amel}
                        onChange={(e) => setAddForm({ ...addForm, rotorcraft_amel: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">ASES</label>
                      <input
                        type="date"
                        value={addForm.rotorcraft_ases}
                        onChange={(e) => setAddForm({ ...addForm, rotorcraft_ases: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">AMES</label>
                      <input
                        type="date"
                        value={addForm.rotorcraft_ames}
                        onChange={(e) => setAddForm({ ...addForm, rotorcraft_ames: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleAddCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-[11px]"
                >
                  Add Crew Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrewPage

