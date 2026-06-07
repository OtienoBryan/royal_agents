import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Agency, Country, Account } from '../services/api'
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Building2,
  DollarSign,
  FileText,
  Wallet
} from 'lucide-react'

const Agencies: React.FC = () => {
  const navigate = useNavigate()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositingAgency, setDepositingAgency] = useState<Agency | null>(null)
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null)
  const [editForm, setEditForm] = useState<Partial<Agency>>({})
  const [countries, setCountries] = useState<Country[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [depositForm, setDepositForm] = useState({
    account_id: '',
    amount: '',
    date_paid: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    payment_method: '',
    reference: ''
  })
  const [addForm, setAddForm] = useState({
    name: '',
    contact: '',
    city: '',
    country: '',
    booking_limit: '',
    credit_limit: '',
    max_pax_per_booking: '',
    default_currency: '',
    credit_days: '',
    payment_limit: '',
    balance: '0'
  })

  const currencies = [
    { code: 'USD', name: 'US Dollar (USD)' },
    { code: 'EUR', name: 'Euro (EUR)' },
    { code: 'GBP', name: 'British Pound (GBP)' },
    { code: 'KES', name: 'Kenyan Shilling (KES)' },
    { code: 'KMF', name: 'Comorian Franc (KMF)' }
  ]

  useEffect(() => {
    loadData()
    loadCountries()
    loadAccounts()
  }, [])

  const loadCountries = async () => {
    try {
      const countriesList = await adminApiService.getCountries()
      setCountries(countriesList)
    } catch (error) {
      console.error('Error loading countries:', error)
    }
  }

  const loadAccounts = async () => {
    try {
      const result = await adminApiService.getAccounts(1, 1000)
      setAccounts(result.accounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const agenciesWithBalance = await adminApiService.getAgenciesWithBalance()
      setAgencies(agenciesWithBalance)
    } catch (error) {
      console.error('Error loading agencies data:', error)
      // Fallback to regular getAgencies if the new endpoint fails
      try {
        const result = await adminApiService.getAgencies(1, 1000)
        setAgencies(result.agencies)
      } catch (fallbackError) {
        console.error('Error loading agencies (fallback):', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewLedger = (agency: Agency) => {
    navigate(`/agencies/${agency.id}/ledger`)
  }

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = 
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agency.contact && agency.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agency.city && agency.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agency.country && agency.country.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCountry = countryFilter === 'all' || agency.country === countryFilter

    return matchesSearch && matchesCountry
  })

  const formatCurrency = (amount: number | null, currencyCode: string = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleViewDetails = (agency: Agency) => {
    setSelectedAgency(agency)
    setShowDetailsModal(true)
  }

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency)
    setEditForm({
      name: agency.name,
      contact: agency.contact || '',
      city: agency.city || '',
      country: agency.country || '',
      booking_limit: agency.booking_limit,
      credit_limit: agency.credit_limit,
      max_pax_per_booking: agency.max_pax_per_booking,
      default_currency: agency.default_currency || '',
      credit_days: agency.credit_days,
      payment_limit: agency.payment_limit,
      balance: agency.balance || 0
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAgency) return

    try {
      const updateData: Partial<Agency> = {
        name: editForm.name,
        contact: editForm.contact || null,
        city: editForm.city || null,
        country: editForm.country || null,
        booking_limit: editForm.booking_limit !== undefined && editForm.booking_limit !== null && String(editForm.booking_limit) !== '' 
          ? Number(editForm.booking_limit) 
          : null,
        credit_limit: editForm.credit_limit !== undefined && editForm.credit_limit !== null && String(editForm.credit_limit) !== '' 
          ? Number(editForm.credit_limit) 
          : null,
        max_pax_per_booking: editForm.max_pax_per_booking !== undefined && editForm.max_pax_per_booking !== null && String(editForm.max_pax_per_booking) !== '' 
          ? Number(editForm.max_pax_per_booking) 
          : null,
        default_currency: editForm.default_currency && editForm.default_currency.trim() !== '' ? editForm.default_currency.trim() : null,
        credit_days: editForm.credit_days !== undefined && editForm.credit_days !== null && String(editForm.credit_days) !== '' 
          ? Number(editForm.credit_days) 
          : null,
        payment_limit: editForm.payment_limit !== undefined && editForm.payment_limit !== null && String(editForm.payment_limit) !== '' 
          ? Number(editForm.payment_limit) 
          : null,
        balance: editForm.balance !== undefined ? (editForm.balance || 0) : undefined
      }
      
      await adminApiService.updateAgency(editingAgency.id, updateData)
      await loadData()
      setShowEditModal(false)
      setEditingAgency(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating agency:', error)
      alert('Failed to update agency. Please try again.')
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingAgency(null)
    setEditForm({})
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addForm.name) {
      alert('Please fill in the agency name')
      return
    }

    try {
      const newAgencyData: Omit<Agency, 'id' | 'created_at' | 'updated_at'> = {
        name: addForm.name,
        contact: addForm.contact || null,
        city: addForm.city || null,
        country: addForm.country || null,
        booking_limit: addForm.booking_limit ? Number(addForm.booking_limit) : null,
        credit_limit: addForm.credit_limit ? Number(addForm.credit_limit) : null,
        max_pax_per_booking: addForm.max_pax_per_booking ? Number(addForm.max_pax_per_booking) : null,
        default_currency: addForm.default_currency && addForm.default_currency.trim() !== '' ? addForm.default_currency.trim() : null,
        credit_days: addForm.credit_days ? Number(addForm.credit_days) : null,
        payment_limit: addForm.payment_limit ? Number(addForm.payment_limit) : null,
        balance: addForm.balance ? Number(addForm.balance) : 0
      }
      
      await adminApiService.createAgency(newAgencyData)
      await loadData()
      setShowAddModal(false)
      setAddForm({
        name: '',
        contact: '',
        city: '',
        country: '',
        booking_limit: '',
        credit_limit: '',
        max_pax_per_booking: '',
        default_currency: '',
        credit_days: '',
        payment_limit: '',
        balance: '0'
      })
    } catch (error) {
      console.error('Error adding agency:', error)
      alert('Failed to add agency. Please try again.')
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddForm({
      name: '',
      contact: '',
      city: '',
      country: '',
      booking_limit: '',
      credit_limit: '',
      max_pax_per_booking: '',
      default_currency: '',
      credit_days: '',
      payment_limit: '',
      balance: '0'
    })
  }

  const handleDelete = async (agency: Agency) => {
    if (!confirm(`Are you sure you want to delete ${agency.name}?`)) {
      return
    }

    try {
      await adminApiService.deleteAgency(agency.id)
      await loadData()
    } catch (error) {
      console.error('Error deleting agency:', error)
      alert('Failed to delete agency. Please try again.')
    }
  }

  const handleDeposit = (agency: Agency) => {
    setDepositingAgency(agency)
    setDepositForm({
      account_id: '',
      amount: '',
      date_paid: new Date().toISOString().split('T')[0], // Default to today
      description: '',
      payment_method: '',
      reference: ''
    })
    setShowDepositModal(true)
  }

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositingAgency) return

    if (!depositForm.account_id || !depositForm.amount || !depositForm.date_paid || 
        !depositForm.description || !depositForm.payment_method || !depositForm.reference) {
      alert('Please fill in all required fields')
      return
    }

    const amount = Number(depositForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      await adminApiService.createAgencyDeposit(depositingAgency.id, {
        account_id: Number(depositForm.account_id),
        amount: amount,
        date_paid: depositForm.date_paid,
        description: depositForm.description,
        payment_method: depositForm.payment_method,
        reference: depositForm.reference
      })
      await loadData()
      setShowDepositModal(false)
      setDepositingAgency(null)
      setDepositForm({
        account_id: '',
        amount: '',
        date_paid: new Date().toISOString().split('T')[0],
        description: '',
        payment_method: '',
        reference: ''
      })
      alert('Deposit created successfully!')
    } catch (error: any) {
      console.error('Error creating deposit:', error)
      alert(error?.message || 'Failed to create deposit. Please try again.')
    }
  }

  const handleDepositCancel = () => {
    setShowDepositModal(false)
    setDepositingAgency(null)
    setDepositForm({
      account_id: '',
      amount: '',
      date_paid: new Date().toISOString().split('T')[0],
      description: '',
      payment_method: '',
      reference: ''
    })
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
            <Building2 className="h-4 w-4 text-blue-600" />
            Agencies
          </h1>
          <p className="text-[11px] text-gray-600">Manage travel agencies</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact, city, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.name}>{country.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agencies Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">City</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Country</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Booking Limit</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Credit Limit</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Max PAX/Booking</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Currency</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Credit Days</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Payment Limit</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Current Balance</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgencies.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {agencies.length === 0 ? 'No agencies found. Add your first agency to get started.' : 'No agencies match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredAgencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-gray-900">{agency.name}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agency.contact || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agency.city || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{agency.country || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-900">
                        {agency.booking_limit !== null ? agency.booking_limit.toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-900">{formatCurrency(agency.credit_limit, agency.default_currency || 'USD')}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-900">
                        {agency.max_pax_per_booking !== null ? agency.max_pax_per_booking.toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600 font-medium">{agency.default_currency || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-900">
                        {agency.credit_days !== null ? agency.credit_days : 'N/A'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-900">{formatCurrency(agency.payment_limit, agency.default_currency || 'USD')}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className={`text-[11px] font-medium ${(agency.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(agency.balance || 0, agency.default_currency || 'USD')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(agency)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View details"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleViewLedger(agency)}
                          className="text-purple-600 hover:text-purple-800"
                          title="View ledger"
                        >
                          <FileText className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeposit(agency)}
                          className="text-green-600 hover:text-green-800"
                          title="Make deposit"
                        >
                          <Wallet className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleEdit(agency)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(agency)}
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
      {showDetailsModal && selectedAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Agency Details</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">{selectedAgency.name}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agency Details Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-blue-600" />
                    Agency Details
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Name</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">{selectedAgency.name}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-green-600" />
                    Contact Details
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Contact</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgency.contact || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-purple-600" />
                    Address
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">City</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgency.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Country</label>
                      <p className="text-[11px] text-gray-900 mt-0.5">{selectedAgency.country || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-orange-600" />
                    Terms and Conditions
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Booking Limit</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">
                        {selectedAgency.booking_limit !== null ? selectedAgency.booking_limit.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Credit Limit</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium text-blue-600">{formatCurrency(selectedAgency.credit_limit, selectedAgency.default_currency || 'USD')}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Maximum PAX per Booking</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">
                        {selectedAgency.max_pax_per_booking !== null ? selectedAgency.max_pax_per_booking.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Default Currency</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">{selectedAgency.default_currency || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Credit Days</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium">
                        {selectedAgency.credit_days !== null ? selectedAgency.credit_days : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Payment Limit</label>
                      <p className="text-[11px] text-gray-900 mt-0.5 font-medium text-blue-600">{formatCurrency(selectedAgency.payment_limit, selectedAgency.default_currency || 'USD')}</p>
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
      {showEditModal && editingAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Edit Agency</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">{editingAgency.name}</p>
                </div>
                <button onClick={handleEditCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Agency Details Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-blue-600" />
                      Agency Details
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
                    </div>
                  </div>

                  {/* Contact Details Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Search className="h-3 w-3 text-green-600" />
                      Contact Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Contact</label>
                        <input
                          type="text"
                          value={editForm.contact || ''}
                          onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                          placeholder="Phone or Email"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-purple-600" />
                      Address
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={editForm.country || ''}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">Select a country</option>
                          {countries.map(country => (
                            <option key={country.id} value={country.name}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-orange-600" />
                      Terms and Conditions
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Booking Limit</label>
                        <input
                          type="number"
                          value={editForm.booking_limit ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, booking_limit: e.target.value ? Number(e.target.value) : null })}
                          min="0"
                          placeholder="Maximum number of bookings"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">
                          Credit Limit {editForm.default_currency && `(${editForm.default_currency})`}
                        </label>
                        <div className="relative">
                          {editForm.default_currency && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                              {editForm.default_currency}
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.credit_limit ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, credit_limit: e.target.value ? Number(e.target.value) : null })}
                            min="0"
                            placeholder="Maximum credit amount"
                            className={`w-full ${editForm.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Maximum PAX per Booking</label>
                        <input
                          type="number"
                          value={editForm.max_pax_per_booking ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, max_pax_per_booking: e.target.value ? Number(e.target.value) : null })}
                          min="0"
                          placeholder="Maximum passengers per booking"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Default Currency</label>
                        <select
                          value={editForm.default_currency || ''}
                          onChange={(e) => setEditForm({ ...editForm, default_currency: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        >
                          <option value="">Select currency</option>
                          {currencies.map(currency => (
                            <option key={currency.code} value={currency.code}>{currency.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Credit Days</label>
                        <input
                          type="number"
                          value={editForm.credit_days ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, credit_days: e.target.value ? Number(e.target.value) : null })}
                          min="0"
                          placeholder="Number of credit days"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">
                          Payment Limit {editForm.default_currency && `(${editForm.default_currency})`}
                        </label>
                        <div className="relative">
                          {editForm.default_currency && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                              {editForm.default_currency}
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.payment_limit ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, payment_limit: e.target.value ? Number(e.target.value) : null })}
                            min="0"
                            placeholder="Maximum payment amount"
                            className={`w-full ${editForm.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">
                          Balance {editForm.default_currency && `(${editForm.default_currency})`}
                        </label>
                        <div className="relative">
                          {editForm.default_currency && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                              {editForm.default_currency}
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.balance ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, balance: e.target.value ? Number(e.target.value) : 0 })}
                            placeholder="Initial balance amount"
                            className={`w-full ${editForm.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 mt-0.5">Enter the initial balance amount for this agency</p>
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
                    Update Agency
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
                  <h2 className="text-base font-bold text-gray-900">Add New Agency</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">Create a new travel agency profile</p>
                </div>
                <button onClick={handleAddCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Agency Details Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-blue-600" />
                      Agency Details
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
                          placeholder="Enter agency name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Details Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Search className="h-3 w-3 text-green-600" />
                      Contact Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Contact</label>
                        <input
                          type="text"
                          value={addForm.contact}
                          onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                          placeholder="Phone or Email"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-purple-600" />
                      Address
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={addForm.city}
                          onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                          placeholder="Enter city name"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={addForm.country}
                          onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">Select a country</option>
                          {countries.map(country => (
                            <option key={country.id} value={country.name}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-orange-600" />
                      Terms and Conditions
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Booking Limit</label>
                        <input
                          type="number"
                          value={addForm.booking_limit}
                          onChange={(e) => setAddForm({ ...addForm, booking_limit: e.target.value })}
                          min="0"
                          placeholder="Maximum number of bookings"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">
                          Credit Limit {addForm.default_currency && `(${addForm.default_currency})`}
                        </label>
                        <div className="relative">
                          {addForm.default_currency && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                              {addForm.default_currency}
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={addForm.credit_limit}
                            onChange={(e) => setAddForm({ ...addForm, credit_limit: e.target.value })}
                            min="0"
                            placeholder="Maximum credit amount"
                            className={`w-full ${addForm.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Maximum PAX per Booking</label>
                        <input
                          type="number"
                          value={addForm.max_pax_per_booking}
                          onChange={(e) => setAddForm({ ...addForm, max_pax_per_booking: e.target.value })}
                          min="0"
                          placeholder="Maximum passengers per booking"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Default Currency</label>
                        <select
                          value={addForm.default_currency}
                          onChange={(e) => setAddForm({ ...addForm, default_currency: e.target.value })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        >
                          <option value="">Select currency</option>
                          {currencies.map(currency => (
                            <option key={currency.code} value={currency.code}>{currency.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Credit Days</label>
                        <input
                          type="number"
                          value={addForm.credit_days}
                          onChange={(e) => setAddForm({ ...addForm, credit_days: e.target.value })}
                          min="0"
                          placeholder="Number of credit days"
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">
                          Payment Limit {addForm.default_currency && `(${addForm.default_currency})`}
                        </label>
                        <div className="relative">
                          {addForm.default_currency && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                              {addForm.default_currency}
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={addForm.payment_limit}
                            onChange={(e) => setAddForm({ ...addForm, payment_limit: e.target.value })}
                            min="0"
                            placeholder="Maximum payment amount"
                            className={`w-full ${addForm.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-1">
                          Initial Balance {addForm.default_currency && `(${addForm.default_currency})`}
                        </label>
                        <div className="relative">
                          {addForm.default_currency && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                              {addForm.default_currency}
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={addForm.balance}
                            onChange={(e) => setAddForm({ ...addForm, balance: e.target.value })}
                            placeholder="Initial balance amount"
                            className={`w-full ${addForm.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 mt-0.5">Enter the initial balance amount for this agency</p>
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
                    Create Agency
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && depositingAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    Make Deposit
                  </h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">Deposit funds to {depositingAgency.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Current Balance: {formatCurrency(depositingAgency.balance || 0, depositingAgency.default_currency || 'USD')}
                  </p>
                </div>
                <button onClick={handleDepositCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-[11px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    Deposit Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">
                        Account * {depositingAgency.default_currency && `(${depositingAgency.default_currency})`}
                      </label>
                      <select
                        value={depositForm.account_id}
                        onChange={(e) => setDepositForm({ ...depositForm, account_id: e.target.value })}
                        required
                        className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Select an account</option>
                        {accounts
                          .filter(account => 
                            !depositingAgency.default_currency || 
                            !account.currency || 
                            account.currency === depositingAgency.default_currency
                          )
                          .map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.code}) - {formatCurrency(account.balance, account.currency || 'USD')}
                            </option>
                          ))}
                      </select>
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        Only accounts matching the agency's currency are shown
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">
                        Amount * {depositingAgency.default_currency && `(${depositingAgency.default_currency})`}
                      </label>
                      <div className="relative">
                        {depositingAgency.default_currency && (
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500 font-medium">
                            {depositingAgency.default_currency}
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={depositForm.amount}
                          onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                          required
                          placeholder="Enter deposit amount"
                          className={`w-full ${depositingAgency.default_currency ? 'pl-16' : 'pl-2'} pr-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Date Paid *</label>
                      <input
                        type="date"
                        value={depositForm.date_paid}
                        onChange={(e) => setDepositForm({ ...depositForm, date_paid: e.target.value })}
                        required
                        className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Method *</label>
                      <select
                        value={depositForm.payment_method}
                        onChange={(e) => setDepositForm({ ...depositForm, payment_method: e.target.value })}
                        required
                        className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Select payment method</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Check">Check</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Description *</label>
                      <textarea
                        value={depositForm.description}
                        onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                        placeholder="Enter description for this deposit"
                        required
                        rows={3}
                        className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Reference *</label>
                      <input
                        type="text"
                        value={depositForm.reference}
                        onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                        placeholder="Enter reference number (e.g., receipt number)"
                        required
                        maxLength={100}
                        className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleDepositCancel}
                    className="px-3 py-1.5 text-[11px] border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-[11px] bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Create Deposit
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

export default Agencies

