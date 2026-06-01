import React, { useState, useEffect } from 'react'
import { adminApiService, Staff, Department } from '../services/api'
import {
  Search,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react'

// Avatar component for staff without images
const StaffAvatar: React.FC<{ name: string; className?: string }> = ({ name, className = "h-10 w-10" }) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold`}>
      {initials}
    </div>
  )
}

const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [editForm, setEditForm] = useState<Partial<Staff>>({})
  const [addForm, setAddForm] = useState({
    name: '',
    empl_no: '',
    id_no: '',
    department: '',
    department_id: 0,
    employment_type: 'Contract',
    gender: 'Male' as 'Male' | 'Female' | 'Other'
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null)
  const [addImageFile, setAddImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [addingStaff, setAddingStaff] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load staff data
      const staffData = await adminApiService.getStaff()
      setStaff(staffData)
      
      // Try to load departments, but don't fail if it doesn't work
      try {
        const departmentsData = await adminApiService.getDepartments()
        setDepartments(departmentsData)
      } catch (deptError) {
        console.warn('Could not load departments, using fallback:', deptError)
        // Fallback: extract departments from staff data
        const fallbackDepartments = Array.from(new Set(staffData.map(member => member.department).filter(Boolean)))
          .map((deptName, index) => ({
            id: index + 1,
            name: deptName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        setDepartments(fallbackDepartments as Department[])
      }
    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.empl_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter
    const matchesEmploymentType = employmentTypeFilter === 'all' || member.employment_type === employmentTypeFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && member.is_active === 1) ||
      (statusFilter === 'inactive' && member.is_active === 0)

    return matchesSearch && matchesDepartment && matchesEmploymentType && matchesStatus
  })

  const getUniqueValues = (key: keyof Staff) => {
    return Array.from(new Set(staff.map(member => member[key]).filter(Boolean)))
  }


  const getStatusBadge = (isActive: number) => {
    return isActive === 1 ? (
      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
        <UserCheck className="h-2.5 w-2.5 mr-0.5" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
        <UserX className="h-2.5 w-2.5 mr-0.5" />
        Inactive
      </span>
    )
  }


  const handleViewDetails = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setShowDetailsModal(true)
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setEditForm({
      name: staffMember.name,
      empl_no: staffMember.empl_no,
      id_no: staffMember.id_no,
      designation: staffMember.designation,
      phone_number: staffMember.phone_number,
      department: staffMember.department,
      department_id: staffMember.department_id,
      business_email: staffMember.business_email,
      department_email: staffMember.department_email,
      salary: staffMember.salary,
      employment_type: staffMember.employment_type,
      gender: staffMember.gender,
      is_active: staffMember.is_active,
      status: staffMember.status,
      photo_url: staffMember.photo_url,
      avatar_url: staffMember.avatar_url
    })
    setImagePreview(staffMember.photo_url || staffMember.avatar_url || null)
    setImageFile(null)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return

    try {
      setUploadingImage(true)
      let updatedForm = { ...editForm }
      
      // Handle image upload if a new image was selected
      if (imageFile) {
        console.log('📷 Uploading image to Cloudinary...')
        const uploadResult = await adminApiService.uploadStaffImage(imageFile)
        updatedForm.photo_url = uploadResult.url
        updatedForm.avatar_url = uploadResult.url
        console.log('📷 Image uploaded successfully:', uploadResult.url)
      }
      
      await adminApiService.updateStaff(editingStaff.id, updatedForm)
      await loadData()
      setShowEditModal(false)
      setEditingStaff(null)
      setEditForm({})
      setImagePreview(null)
      setImageFile(null)
    } catch (error) {
      console.error('Error updating staff member:', error)
      alert('Failed to update staff member. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingStaff(null)
    setEditForm({})
    setImagePreview(null)
    setImageFile(null)
    setUploadingImage(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, or GIF)')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setEditForm({ ...editForm, photo_url: '', avatar_url: '' })
  }

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, or GIF)')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setAddImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAddImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAddImage = () => {
    setAddImageFile(null)
    setAddImagePreview(null)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addForm.name || !addForm.empl_no || !addForm.id_no || !addForm.department) {
      alert('Please fill in all required fields')
      return
    }

    if (!addForm.employment_type) {
      alert('Please select an employment type')
      return
    }

    try {
      setAddingStaff(true)
      let photoUrl = ''
      
      // Handle image upload if a new image was selected
      if (addImageFile) {
        console.log('📷 Uploading image to Cloudinary...')
        const uploadResult = await adminApiService.uploadStaffImage(addImageFile)
        photoUrl = uploadResult.url
        console.log('📷 Image uploaded successfully:', uploadResult.url)
      }
      
      // Use placeholder if no photo provided (since photo_url is required in DB)
      if (!photoUrl) {
        photoUrl = 'https://via.placeholder.com/150' // Placeholder image
      }

      const selectedDepartment = departments.find(dept => dept.name === addForm.department)
      
      const newStaffData: Omit<Staff, 'id' | 'created_at' | 'updated_at'> = {
        name: addForm.name,
        empl_no: addForm.empl_no,
        id_no: addForm.id_no,
        role: '', // Role field is required but we're not using it
        photo_url: photoUrl,
        avatar_url: photoUrl,
        designation: '',
        phone_number: '',
        password: '$2a$10$me0dzhAfGglEGPhcK/34BuWmhYW3USYy3SeMbe46CQop102Yq./1S', // Default password
        department: addForm.department,
        department_id: selectedDepartment?.id || addForm.department_id,
        business_email: '',
        department_email: '',
        salary: 0,
        employment_type: addForm.employment_type,
        gender: addForm.gender,
        is_active: 1,
        status: 1
      }
      
      await adminApiService.createStaff(newStaffData)
      await loadData()
      setShowAddModal(false)
      setAddForm({
        name: '',
        empl_no: '',
        id_no: '',
        department: '',
        department_id: 0,
        employment_type: 'Contract',
        gender: 'Male'
      })
      setAddImagePreview(null)
      setAddImageFile(null)
    } catch (error) {
      console.error('Error adding staff member:', error)
      alert('Failed to add staff member. Please try again.')
    } finally {
      setAddingStaff(false)
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddForm({
      name: '',
      empl_no: '',
      id_no: '',
      department: '',
      department_id: 0,
      employment_type: 'Contract',
      gender: 'Male'
    })
    setAddImagePreview(null)
    setAddImageFile(null)
    setAddingStaff(false)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await adminApiService.deleteStaff(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting staff member:', error)
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
          <h1 className="text-lg font-bold text-gray-900">Staff Management</h1>
          <p className="text-[11px] text-gray-600">Manage your team members and employee information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Employment Type</label>
            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {getUniqueValues('employment_type').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {statusFilter === 'active' && (
          <div className="bg-green-50 px-2 py-1 border-b border-green-200">
            <div className="flex items-center">
              <UserCheck className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-[11px] font-medium text-green-800">Showing Active Staff Only</span>
              <span className="ml-1 text-[10px] text-green-600">({filteredStaff.length} of {staff.length} total)</span>
            </div>
          </div>
        )}
        {statusFilter === 'inactive' && (
          <div className="bg-red-50 px-2 py-1 border-b border-red-200">
            <div className="flex items-center">
              <UserX className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-[11px] font-medium text-red-800">Showing Inactive Staff Only</span>
              <span className="ml-1 text-[10px] text-red-600">({filteredStaff.length} of {staff.length} total)</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Employment Type
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center">
                      {member.photo_url || member.avatar_url ? (
                        <img
                          src={member.photo_url || member.avatar_url}
                          alt={member.name}
                          className="h-6 w-6 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setEnlargedImage(member.photo_url || member.avatar_url || '')}
                        />
                      ) : (
                        <StaffAvatar name={member.name} className="h-6 w-6" />
                      )}
                      <div className="ml-2">
                        <div className="text-[11px] font-medium text-gray-900">{member.name}</div>
                        <div className="text-[10px] text-gray-500">{member.business_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="text-[11px] text-gray-900">{member.empl_no}</div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="text-[11px] text-gray-900">{member.department || 'N/A'}</div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="text-[11px] text-gray-900">{member.employment_type}</div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {getStatusBadge(member.is_active)}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-[11px] font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewDetails(member)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-900"
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
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-gray-900">Staff Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                {/* Basic Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Name</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.name}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Employee ID</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.empl_no}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">ID Number</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.id_no}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Gender</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Profile Image</h4>
                  <div className="flex justify-center">
                    {selectedStaff.photo_url || selectedStaff.avatar_url ? (
                      <img
                        src={selectedStaff.photo_url || selectedStaff.avatar_url}
                        alt={selectedStaff.name}
                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setEnlargedImage(selectedStaff.photo_url || selectedStaff.avatar_url || '')}
                      />
                    ) : (
                      <StaffAvatar name={selectedStaff.name} className="h-20 w-20 border-2 border-gray-200" />
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Business Email</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.business_email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Department Email</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.department_email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Phone Number</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.phone_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Employment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Designation</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.designation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Department</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Employment Type</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">{selectedStaff.employment_type}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Salary</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">
                        {selectedStaff.salary ? `$${selectedStaff.salary.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Status</label>
                      <p className="mt-0.5">{getStatusBadge(selectedStaff.is_active)}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Created</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">
                        {new Date(selectedStaff.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700">Last Updated</label>
                      <p className="mt-0.5 text-[11px] text-gray-900">
                        {new Date(selectedStaff.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleEdit(selectedStaff)
                  }}
                  className="admin-button px-2 py-1 text-[11px] rounded"
                >
                  Edit Staff Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-gray-900">Edit Staff Member</h3>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-2">
                {/* Basic Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Name *</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee ID *</label>
                      <input
                        type="text"
                        value={editForm.empl_no || ''}
                        onChange={(e) => setEditForm({ ...editForm, empl_no: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">ID Number *</label>
                      <input
                        type="text"
                        value={editForm.id_no || ''}
                        onChange={(e) => setEditForm({ ...editForm, id_no: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Gender *</label>
                      <select
                        value={editForm.gender || ''}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Profile Image</h4>
                  <div className="flex items-start gap-3">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Profile preview"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImage(imagePreview)}
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        editingStaff ? (
                          <StaffAvatar name={editingStaff.name} className="h-16 w-16 border-2 border-gray-300" />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                            <span className="text-gray-400 text-[10px]">No Image</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Upload New Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">JPG, PNG, or GIF. Max size 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Business Email</label>
                      <input
                        type="email"
                        value={editForm.business_email || ''}
                        onChange={(e) => setEditForm({ ...editForm, business_email: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Department Email</label>
                      <input
                        type="email"
                        value={editForm.department_email || ''}
                        onChange={(e) => setEditForm({ ...editForm, department_email: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Phone Number</label>
                      <input
                        type="tel"
                        value={editForm.phone_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Employment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Designation</label>
                      <input
                        type="text"
                        value={editForm.designation || ''}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Department</label>
                      <select
                        value={editForm.department || ''}
                        onChange={(e) => {
                          const selectedDepartment = departments.find(dept => dept.name === e.target.value);
                          setEditForm({ 
                            ...editForm, 
                            department: e.target.value,
                            department_id: selectedDepartment?.id || editForm.department_id
                          });
                        }}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employment Type *</label>
                      <select
                        value={editForm.employment_type || ''}
                        onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Contract">Contract</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Probation">Probation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Status *</label>
                      <select
                        key={`status-${editingStaff?.id}-${editForm.is_active}`}
                        value={editForm.is_active !== undefined ? editForm.is_active : 1}
                        onChange={(e) => {
                          const newStatus = parseInt(e.target.value);
                          setEditForm({ 
                            ...editForm, 
                            is_active: newStatus,
                            status: newStatus 
                          });
                        }}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Salary</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.salary || ''}
                        onChange={(e) => setEditForm({ ...editForm, salary: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className="admin-button px-2 py-1 text-[11px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? 'Uploading Image...' : 'Update Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-gray-900">Add New Staff Member</h3>
                <button
                  onClick={handleAddCancel}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-2">
                {/* Basic Information */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Name *</label>
                      <input
                        type="text"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee ID *</label>
                      <input
                        type="text"
                        value={addForm.empl_no}
                        onChange={(e) => setAddForm({ ...addForm, empl_no: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">ID Number *</label>
                      <input
                        type="text"
                        value={addForm.id_no}
                        onChange={(e) => setAddForm({ ...addForm, id_no: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Department *</label>
                      <select
                        value={addForm.department}
                        onChange={(e) => {
                          const selectedDepartment = departments.find(dept => dept.name === e.target.value)
                          setAddForm({ 
                            ...addForm, 
                            department: e.target.value,
                            department_id: selectedDepartment?.id || 0
                          })
                        }}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employment Type *</label>
                      <select
                        value={addForm.employment_type}
                        onChange={(e) => setAddForm({ ...addForm, employment_type: e.target.value })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Contract">Contract</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Probation">Probation</option>
                        <option value="Permanent">Permanent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Gender *</label>
                      <select
                        value={addForm.gender}
                        onChange={(e) => setAddForm({ ...addForm, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="border-b pb-2">
                  <h4 className="text-[11px] font-medium text-gray-900 mb-1.5">Profile Image (Optional)</h4>
                  <div className="flex items-start gap-3">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      {addImagePreview ? (
                        <div className="relative">
                          <img
                            src={addImagePreview}
                            alt="Profile preview"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImage(addImagePreview)}
                          />
                          <button
                            type="button"
                            onClick={handleRemoveAddImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <span className="text-gray-400 text-[10px]">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddImageChange}
                        className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">JPG, PNG, or GIF. Max size 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleAddCancel}
                    className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingStaff}
                    className="admin-button px-2 py-1 text-[11px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingStaff ? 'Adding...' : 'Add Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl transition-colors"
            >
              ×
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffPage
