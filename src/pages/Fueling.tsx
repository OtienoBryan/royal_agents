import React, { useState, useEffect } from 'react'
import { adminApiService } from '../services/api'
import {
  Search,
  Fuel,
  Calendar,
  FileText,
  Plus,
  X,
  DollarSign,
  MapPin,
  Truck,
  Plane,
  Info,
  Receipt,
  Filter
} from 'lucide-react'

interface FlightSeries {
  id: number
  flt: string
  aircraft?: {
    id: number
    name: string
    registration: string
  } | null
  fromDestination?: {
    code: string
    name: string
  } | null
  toDestination?: {
    code: string
    name: string
  } | null
}

interface Supplier {
  id: number
  supplier_code: string
  company_name: string
}

interface ChartOfAccount {
  id: number
  name: string
  code: string
  account_type: number
}

interface JournalEntryLine {
  id: number
  account_id: number
  debit_amount: number
  credit_amount: number
  description: string | null
  account?: ChartOfAccount
}

interface JournalEntry {
  id: number
  entry_number: string
  entry_date: string
  reference: string | null
  description: string | null
  total_debit: number
  total_credit: number
  status: string
  lines?: JournalEntryLine[]
}

interface Fueling {
  id: number
  flight_series_id: number
  supplier_id: number
  fuel_quantity: number | string
  fuel_slip_number: string
  price_per_liter: number | string
  location: string
  additional_fees: number | string
  additional_fees_explanation?: string | null
  tax: number | string
  total_amount: number | string
  fueling_date: string
  flightSeries?: FlightSeries
  supplier?: Supplier
  journal_entry?: JournalEntry
  created_at: string
}

const Fueling: React.FC = () => {
  const [fuelings, setFuelings] = useState<Fueling[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeries[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedFueling, setSelectedFueling] = useState<Fueling | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterSupplier, setFilterSupplier] = useState<string>('')
  const [filterAircraft, setFilterAircraft] = useState<string>('')
  
  // Get current month's first and last day
  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0]
    }
  }
  
  const currentMonth = getCurrentMonthDates()
  const [filterDateFrom, setFilterDateFrom] = useState<string>(currentMonth.from)
  const [filterDateTo, setFilterDateTo] = useState<string>(currentMonth.to)
  const limit = 50

  const [fuelingForm, setFuelingForm] = useState({
    flight_series_id: '',
    supplier_id: '',
    fuel_quantity: '',
    fuel_slip_number: '',
    price_per_liter: '',
    location: '',
    additional_fees: '',
    additional_fees_explanation: '',
    tax: '',
    fueling_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
    loadFlightSeries()
    loadSuppliers()
  }, [page])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getFuelings(page, limit)
      setFuelings(result.fuelings)
      setTotal(result.total)
    } catch (error) {
      console.error('Error loading fuelings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFlightSeries = async () => {
    try {
      const result = await adminApiService.getFlightSeries(1, 1000)
      setFlightSeries(result.flightSeries)
    } catch (error) {
      console.error('Error loading flight series:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const result = await adminApiService.getSuppliers(1, 1000)
      setSuppliers(result.suppliers)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent double submission
    if (saving) {
      return
    }

    if (!fuelingForm.flight_series_id || !fuelingForm.supplier_id || !fuelingForm.fuel_quantity ||
        !fuelingForm.fuel_slip_number || !fuelingForm.price_per_liter || !fuelingForm.location ||
        !fuelingForm.fueling_date) {
      alert('Please fill in all required fields')
      return
    }

    const fuelQuantity = Number(fuelingForm.fuel_quantity)
    const pricePerLiter = Number(fuelingForm.price_per_liter)
    const additionalFees = Number(fuelingForm.additional_fees) || 0
    const tax = Number(fuelingForm.tax) || 0

    if (isNaN(fuelQuantity) || fuelQuantity <= 0) {
      alert('Please enter a valid fuel quantity')
      return
    }

    if (isNaN(pricePerLiter) || pricePerLiter < 0) {
      alert('Please enter a valid price per liter')
      return
    }

    if (tax < 0) {
      alert('Tax cannot be negative')
      return
    }

    try {
      setSaving(true)
      const fuelingData: any = {
        flight_series_id: Number(fuelingForm.flight_series_id),
        supplier_id: Number(fuelingForm.supplier_id),
        fuel_quantity: fuelQuantity,
        fuel_slip_number: fuelingForm.fuel_slip_number,
        price_per_liter: pricePerLiter,
        location: fuelingForm.location,
        fueling_date: fuelingForm.fueling_date,
      }
      
      if (additionalFees > 0) {
        fuelingData.additional_fees = additionalFees
      }
      
      if (fuelingForm.additional_fees_explanation && fuelingForm.additional_fees_explanation.trim()) {
        fuelingData.additional_fees_explanation = fuelingForm.additional_fees_explanation.trim()
      }
      
      if (tax > 0) {
        fuelingData.tax = tax
      }
      
      const newFueling = await adminApiService.createFueling(fuelingData)
      // Optimistically add to list instead of reloading all data
      setFuelings(prev => [newFueling, ...prev])
      setTotal(prev => prev + 1)
      setShowAddModal(false)
      setFuelingForm({
        flight_series_id: '',
        supplier_id: '',
        fuel_quantity: '',
        fuel_slip_number: '',
        price_per_liter: '',
        location: '',
        additional_fees: '',
        additional_fees_explanation: '',
        tax: '',
        fueling_date: new Date().toISOString().split('T')[0],
      })
      alert('Fueling posted successfully!')
    } catch (error: any) {
      console.error('Error creating fueling:', error)
      alert(error?.message || 'Failed to post fueling. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setFuelingForm({
      flight_series_id: '',
      supplier_id: '',
      fuel_quantity: '',
      fuel_slip_number: '',
      price_per_liter: '',
      location: '',
      additional_fees: '',
      additional_fees_explanation: '',
      tax: '',
      fueling_date: new Date().toISOString().split('T')[0],
    })
  }

  const handleFuelingClick = async (fueling: Fueling) => {
    try {
      setLoadingDetail(true)
      setSelectedFueling(null)
      setShowDetailModal(true)
      const detailedFueling = await adminApiService.getFuelingById(fueling.id)
      setSelectedFueling(detailedFueling)
    } catch (error) {
      console.error('Error loading fueling details:', error)
      alert('Failed to load fueling details. Please try again.')
      setShowDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedFueling(null)
  }

  const filteredFuelings = fuelings.filter(fueling => {
    const searchLower = searchTerm.toLowerCase()
    
    // Text search filter
    const matchesSearch = !searchTerm || (
      fueling.fuel_slip_number?.toLowerCase().includes(searchLower) ||
      fueling.location?.toLowerCase().includes(searchLower) ||
      fueling.flightSeries?.flt?.toLowerCase().includes(searchLower) ||
      fueling.supplier?.company_name?.toLowerCase().includes(searchLower) ||
      fueling.supplier?.supplier_code?.toLowerCase().includes(searchLower)
    )
    
    // Supplier filter
    const matchesSupplier = !filterSupplier || fueling.supplier_id === Number(filterSupplier)
    
    // Aircraft filter
    const matchesAircraft = !filterAircraft || fueling.flightSeries?.aircraft?.id === Number(filterAircraft)
    
    // Date range filter
    let matchesDateRange = true
    if (filterDateFrom || filterDateTo) {
      const fuelingDate = new Date(fueling.fueling_date)
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        if (fuelingDate < fromDate) matchesDateRange = false
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999)
        if (fuelingDate > toDate) matchesDateRange = false
      }
    }
    
    return matchesSearch && matchesSupplier && matchesAircraft && matchesDateRange
  })

  // Calculate summary statistics from filtered data
  const summaryTotalAmount = filteredFuelings.reduce((sum, fueling) => {
    return sum + Number(fueling.total_amount || 0)
  }, 0)

  const summaryTotalQuantity = filteredFuelings.reduce((sum, fueling) => {
    return sum + Number(fueling.fuel_quantity || 0)
  }, 0)

  // Get unique aircrafts from fuelings for filter dropdown
  const uniqueAircrafts = Array.from(
    new Map(
      fuelings
        .filter(f => f.flightSeries?.aircraft?.id)
        .map(f => [f.flightSeries!.aircraft!.id, f.flightSeries!.aircraft!])
    ).values()
  ).sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const totalPages = Math.ceil(total / limit)

  // Calculate total amount for display
  const calculateTotal = () => {
    const fuelQuantity = Number(fuelingForm.fuel_quantity) || 0
    const pricePerLiter = Number(fuelingForm.price_per_liter) || 0
    const additionalFees = Number(fuelingForm.additional_fees) || 0
    const tax = Number(fuelingForm.tax) || 0
    return (fuelQuantity * pricePerLiter) + additionalFees + tax
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
            <Fuel className="h-4 w-4 text-orange-600" />
            Fueling
          </h1>
          <p className="text-[11px] text-gray-600">Post and track aircraft fueling transactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Post Fueling
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white rounded-lg shadow-sm border p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Total Amount</p>
              <p className="text-base font-bold text-orange-600 mt-0.5">
                {formatCurrency(summaryTotalAmount, 'USD')}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-1">
            {filteredFuelings.length} fueling{filteredFuelings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Total Quantity</p>
              <p className="text-base font-bold text-blue-600 mt-0.5">
                {summaryTotalQuantity.toFixed(2)} L
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-2">
              <Fuel className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-1">
            Average: {filteredFuelings.length > 0 ? (summaryTotalQuantity / filteredFuelings.length).toFixed(2) : '0.00'} L per fueling
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3 w-3 text-gray-500" />
          <span className="text-[11px] font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Supplier Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Supplier</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name} ({supplier.supplier_code})
                </option>
              ))}
            </select>
          </div>

          {/* Aircraft Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Aircraft</label>
            <select
              value={filterAircraft}
              onChange={(e) => setFilterAircraft(e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Aircraft</option>
              {uniqueAircrafts.map((aircraft) => (
                <option key={aircraft.id} value={aircraft.id}>
                  {aircraft.name} {aircraft.registration && `(${aircraft.registration})`}
                </option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {(filterSupplier || filterAircraft || filterDateFrom || filterDateTo) && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => {
                setFilterSupplier('')
                setFilterAircraft('')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by slip number, location, flight, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Fuelings Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Flight Series</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Aircraft</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Supplier</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Quantity (L)</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Price/Liter</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Additional Fees</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Total Amount</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Location</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Slip Number</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFuelings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {fuelings.length === 0 ? 'No fuelings found.' : 'No fuelings match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredFuelings.map((fueling) => (
                  <tr 
                    key={fueling.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleFuelingClick(fueling)}
                  >
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] text-gray-900">{formatDate(fueling.fueling_date)}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Plane className="h-3 w-3 text-blue-500" />
                        <span className="text-[11px] text-gray-900 font-medium">{fueling.flightSeries?.flt || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Plane className="h-3 w-3 text-purple-500" />
                        <span className="text-[11px] text-gray-600">
                          {fueling.flightSeries?.aircraft?.name || 'N/A'}
                          {fueling.flightSeries?.aircraft?.registration && (
                            <span className="text-gray-400 ml-1">({fueling.flightSeries.aircraft.registration})</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-green-500" />
                        <span className="text-[11px] text-gray-600">{fueling.supplier?.company_name || 'N/A'}</span>
                        {fueling.supplier?.supplier_code && (
                          <span className="text-[10px] text-gray-400">({fueling.supplier.supplier_code})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] font-medium text-gray-900">
                        {Number(fueling.fuel_quantity).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-600">
                        {formatCurrency(Number(fueling.price_per_liter), 'USD')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-600">
                        {formatCurrency(Number(fueling.additional_fees) || 0, 'USD')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] font-medium text-orange-600">
                        {formatCurrency(Number(fueling.total_amount), 'USD')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] text-gray-600">{fueling.location}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] text-gray-600 font-mono">{fueling.fuel_slip_number}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-500">{formatDate(fueling.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-2 py-2 border-t border-gray-200 flex items-center justify-between">
            <div className="text-[11px] text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} fuelings
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Fueling Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-orange-600" />
                Post Fueling
              </h2>
              <button
                onClick={handleAddCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Flight Series */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Flight Series <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fuelingForm.flight_series_id}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, flight_series_id: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Flight Series</option>
                    {flightSeries.map((fs) => (
                      <option key={fs.id} value={fs.id}>
                        {fs.flt} {fs.fromDestination?.code && fs.toDestination?.code && `(${fs.fromDestination.code} → ${fs.toDestination.code})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fuelingForm.supplier_id}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, supplier_id: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.company_name} ({supplier.supplier_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fuel Quantity */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Fuel Quantity (Liters) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={fuelingForm.fuel_quantity}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, fuel_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Price Per Liter */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Price Per Liter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fuelingForm.price_per_liter}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, price_per_liter: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Fuel Slip Number */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Fuel Slip Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fuelingForm.fuel_slip_number}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, fuel_slip_number: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter slip number"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fuelingForm.location}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, location: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                    required
                  />
                </div>

                {/* Additional Fees */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Additional Fees
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fuelingForm.additional_fees}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, additional_fees: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Additional Fees Explanation */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Additional Fees Explanation
                  </label>
                  <input
                    type="text"
                    value={fuelingForm.additional_fees_explanation}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, additional_fees_explanation: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Explain the additional fees (e.g., handling fee, delivery charge, etc.)"
                    maxLength={500}
                  />
                </div>

                {/* Tax */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Tax
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fuelingForm.tax}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, tax: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Fueling Date */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Fueling Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fuelingForm.fueling_date}
                    onChange={(e) => setFuelingForm({ ...fuelingForm, fueling_date: e.target.value })}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Total Amount Display */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(calculateTotal(), 'USD')}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {(Number(fuelingForm.fuel_quantity) || 0) * (Number(fuelingForm.price_per_liter) || 0)} + {(Number(fuelingForm.additional_fees) || 0)} (fees) + {(Number(fuelingForm.tax) || 0)} (tax)
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAddCancel}
                  className="px-4 py-2 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-[11px] bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Posting...' : 'Post Fueling'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fueling Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-600" />
                Fueling Details
              </h2>
              <button
                onClick={handleCloseDetailModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : selectedFueling ? (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-orange-600" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[11px]">
                      <div>
                        <span className="text-gray-600">Fuel Slip Number:</span>
                        <p className="font-medium text-gray-900">{selectedFueling.fuel_slip_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Fueling Date:</span>
                        <p className="font-medium text-gray-900">{formatDate(selectedFueling.fueling_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <p className="font-medium text-gray-900">{selectedFueling.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Flight Series:</span>
                        <p className="font-medium text-gray-900">{selectedFueling.flightSeries?.flt || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <p className="font-medium text-gray-900">
                          {selectedFueling.supplier?.company_name || 'N/A'}
                          {selectedFueling.supplier?.supplier_code && (
                            <span className="text-gray-500"> ({selectedFueling.supplier.supplier_code})</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created At:</span>
                        <p className="font-medium text-gray-900">{formatDate(selectedFueling.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fueling Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      Fueling Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                      <div>
                        <span className="text-gray-600">Fuel Quantity:</span>
                        <p className="font-medium text-gray-900">{Number(selectedFueling.fuel_quantity).toFixed(2)} L</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Price Per Liter:</span>
                        <p className="font-medium text-gray-900">{formatCurrency(Number(selectedFueling.price_per_liter), 'USD')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Additional Fees:</span>
                        <p className="font-medium text-gray-900">{formatCurrency(Number(selectedFueling.additional_fees) || 0, 'USD')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tax:</span>
                        <p className="font-medium text-gray-900">{formatCurrency(Number(selectedFueling.tax) || 0, 'USD')}</p>
                      </div>
                      {selectedFueling.additional_fees_explanation && (
                        <div className="col-span-2 md:col-span-4">
                          <span className="text-gray-600">Additional Fees Explanation:</span>
                          <p className="font-medium text-gray-900">{selectedFueling.additional_fees_explanation}</p>
                        </div>
                      )}
                      <div className="col-span-2 md:col-span-4 border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-semibold">Total Amount:</span>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(Number(selectedFueling.total_amount), 'USD')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Journal Entry Information */}
                  {selectedFueling.journal_entry && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-orange-600" />
                        Journal Entry Information
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                          <div>
                            <span className="text-gray-600">Entry Number:</span>
                            <p className="font-medium text-gray-900 font-mono">{selectedFueling.journal_entry.entry_number}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Entry Date:</span>
                            <p className="font-medium text-gray-900">{formatDate(selectedFueling.journal_entry.entry_date)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium text-gray-900">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                selectedFueling.journal_entry.status === 'posted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : selectedFueling.journal_entry.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedFueling.journal_entry.status.toUpperCase()}
                              </span>
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Reference:</span>
                            <p className="font-medium text-gray-900">{selectedFueling.journal_entry.reference || 'N/A'}</p>
                          </div>
                          {selectedFueling.journal_entry.description && (
                            <div className="col-span-2 md:col-span-4">
                              <span className="text-gray-600">Description:</span>
                              <p className="font-medium text-gray-900">{selectedFueling.journal_entry.description}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Total Debit:</span>
                            <p className="font-medium text-red-600">{formatCurrency(selectedFueling.journal_entry.total_debit, 'USD')}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Credit:</span>
                            <p className="font-medium text-green-600">{formatCurrency(selectedFueling.journal_entry.total_credit, 'USD')}</p>
                          </div>
                        </div>

                        {/* Journal Entry Lines */}
                        {selectedFueling.journal_entry.lines && selectedFueling.journal_entry.lines.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-[11px] font-semibold text-gray-700 mb-2">Journal Entry Lines:</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-[11px]">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-700">Account</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-700">Description</th>
                                    <th className="px-2 py-1.5 text-right font-medium text-gray-700">Debit</th>
                                    <th className="px-2 py-1.5 text-right font-medium text-gray-700">Credit</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {selectedFueling.journal_entry.lines.map((line) => (
                                    <tr key={line.id} className="hover:bg-gray-50">
                                      <td className="px-2 py-1.5">
                                        <div>
                                          <span className="font-medium text-gray-900">{line.account?.name || 'N/A'}</span>
                                          {line.account?.code && (
                                            <span className="text-gray-500 ml-1">({line.account.code})</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <span className="text-gray-600">{line.description || 'N/A'}</span>
                                      </td>
                                      <td className="px-2 py-1.5 text-right">
                                        {line.debit_amount > 0 && (
                                          <span className="font-medium text-red-600">
                                            {formatCurrency(line.debit_amount, 'USD')}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-2 py-1.5 text-right">
                                        {line.credit_amount > 0 && (
                                          <span className="font-medium text-green-600">
                                            {formatCurrency(line.credit_amount, 'USD')}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCloseDetailModal}
                      className="px-4 py-2 text-[11px] bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[11px] text-gray-500">
                  No details available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fueling
