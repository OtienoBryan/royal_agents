import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminApiService, OrderItem } from '../services/api'
import { 
  BarChart3, 
  Calendar,
  Search,
  Download,
  RefreshCw,
  Users,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Eye,
  ArrowLeft,
  X,
  Package,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

interface Client {
  id: number
  name: string
  email?: string
  contact: string
  address?: string
  region: string
  regionId: number
  routeName?: string
  routeId?: number
  balance?: number
  latitude?: number
  longitude?: number
}

interface ClientSalesData {
  clientId: number
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany?: string
  clientStatus: string
  monthlyData: Array<{
    month: string
    year: number
    monthNumber: number
    totalOrders: number
    totalAmount: number
    orders: any[]
  }>
  totalOrders: number
  totalAmount: number
  averageOrderValue: number
}

const MasterSales: React.FC = () => {
  const { } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSalesData, setClientSalesData] = useState<ClientSalesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [salesLoading, setSalesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [view, setView] = useState<'list' | 'sales'>('list')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Performance optimization state
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [cachedClients, setCachedClients] = useState<Client[]>([])
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Order items modal state
  const [showOrderItemsModal, setShowOrderItemsModal] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number>(0)
  const [loadingOrderItems, setLoadingOrderItems] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Load clients list with caching and optimization (memoized)
  const loadClients = useCallback(async (forceRefresh = false) => {
    // Check cache first (5 minute cache)
    const now = Date.now()
    const cacheValid = now - lastFetchTime < 5 * 60 * 1000 // 5 minutes
    
    if (!forceRefresh && cacheValid && cachedClients.length > 0) {
      console.log('📦 Using cached clients data')
      setClients(cachedClients)
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Loading clients from API...')
      console.log('API Base URL:', '/api')
      console.log('Endpoint: /admin/sales/clients-list')
      
      const data = await adminApiService.getAllClients()
      console.log('✅ Clients loaded successfully:', data)
      console.log('Number of clients:', data.length)
      
      // Cache the data
      setCachedClients(data)
      setLastFetchTime(now)
      setClients(data)
    } catch (error) {
      console.error('❌ Error loading clients:', error)
      console.error('Error details:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        response: (error as any)?.response,
        stack: (error as any)?.stack
      })
      // If database fails, show a message to the user
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [cachedClients, lastFetchTime])

  // Load sales data for selected client
  const loadClientSalesData = async (client: Client) => {
    setSalesLoading(true)
    try {
      const data = await adminApiService.getClientSalesData(client.id, selectedYear)
      if (data) {
        // Transform the data to match ClientSalesData interface
        const transformedData: ClientSalesData = {
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email || '',
          clientPhone: client.contact,
          clientStatus: 'active',
          monthlyData: (data.monthlyData || []).map((item: any) => ({
            ...item,
            year: selectedYear
          })),
          totalOrders: data.totalOrders || 0,
          totalAmount: data.totalAmount || 0,
          averageOrderValue: data.averageOrderValue || 0
        }
        setClientSalesData(transformedData)
        setSelectedClient(client)
        setView('sales')
      } else {
        console.log('No sales data found for client:', client.name)
      }
    } catch (error) {
      console.error('Error loading client sales data:', error)
    } finally {
      setSalesLoading(false)
    }
  }

  // Load order items for a specific client and month
  const loadOrderItems = useCallback(async (client: Client, month: number) => {
    console.log(`🔍 [MasterSales loadOrderItems] Starting to load order items for client:`, client)
    console.log(`🔍 [MasterSales loadOrderItems] Client ID: ${client.id}, Year: ${selectedYear}, Month: ${month}`)
    
    setLoadingOrderItems(true)
    setSelectedMonth(month)
    setShowOrderItemsModal(true)
    
    try {
      console.log(`📡 [MasterSales loadOrderItems] Calling API service...`)
      const items = await adminApiService.getClientOrderItems(client.id, selectedYear, month)
      console.log(`✅ [MasterSales loadOrderItems] API response received:`, items)
      console.log(`📊 [MasterSales loadOrderItems] Items count:`, items.length)
      setOrderItems(items)
    } catch (error: any) {
      console.error('❌ [MasterSales loadOrderItems] Error loading order items:', error)
      console.error('❌ [MasterSales loadOrderItems] Error details:', {
        message: error.message,
        clientId: client.id,
        year: selectedYear,
        month: month
      })
      setOrderItems([])
    } finally {
      setLoadingOrderItems(false)
    }
  }, [selectedYear])

  useEffect(() => {
    loadClients()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const formatCurrency = (amount: number | string) => {
    // Handle undefined, null, or non-numeric values
    if (amount === undefined || amount === null) {
      return '0.00';
    }
    
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
      return '0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount)
  }

  const getMonthColumns = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      monthNumber: i
    }))
  }

  const getClientMonthlyData = (clientData: ClientSalesData, monthNumber: number) => {
    return clientData.monthlyData.find(m => m.monthNumber === monthNumber) || {
      month: '',
      year: selectedYear,
      monthNumber,
      totalOrders: 0,
      totalAmount: 0,
      orders: []
    }
  }

  const exportToCSV = () => {
    if (!clientSalesData) return

    const csvData = [
      {
        'Client Name': clientSalesData.clientName,
        'Email': clientSalesData.clientEmail,
        'Phone': clientSalesData.clientPhone,
        'Total Amount': clientSalesData.totalAmount,
        ...getMonthColumns().reduce((acc, { month, monthNumber }) => {
          const monthlyData = getClientMonthlyData(clientSalesData, monthNumber)
          acc[`${month} Amount`] = monthlyData.totalAmount
          return acc
        }, {} as Record<string, number>)
      }
    ]

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `client-sales-${clientSalesData.clientName.replace(/\s+/g, '-')}-${selectedYear}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Debounced search function
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      console.log('🔍 Performing debounced search for:', value)
    }, 300) // 300ms delay
    
    setSearchTimeout(timeout)
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const newDirection = sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'
    
    if (sortField === field) {
      setSortDirection(newDirection)
    } else {
      setSortField(field)
      setSortDirection(newDirection)
    }
  }

  // Filter and sort clients (optimized with useMemo)
  const filteredClients = React.useMemo(() => {
    let filtered = clients
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.region.toLowerCase().includes(searchLower) ||
        client.contact.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any
        let bValue: any
        
        switch (sortField) {
          case 'balance':
            aValue = Number(a.balance) || 0
            bValue = Number(b.balance) || 0
            break
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'region':
            aValue = a.region.toLowerCase()
            bValue = b.region.toLowerCase()
            break
          case 'contact':
            aValue = a.contact.toLowerCase()
            bValue = b.contact.toLowerCase()
            break
          default:
            return 0
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    
    return filtered
  }, [clients, searchTerm, sortField, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  if (view === 'sales' && selectedClient && clientSalesData) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Clients</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Analysis</h1>
              <p className="text-sm text-gray-600">{selectedClient.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Client Name</p>
                <p className="text-lg font-semibold text-gray-900">{selectedClient.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{selectedClient.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="text-lg font-semibold text-gray-900">{selectedClient.contact}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Region</p>
                <p className="text-lg font-semibold text-gray-900">{selectedClient.region}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedClient.balance || 0)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(clientSalesData.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Client
                  </th>
                  {getMonthColumns().map(({ month }) => (
                    <th key={month} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      {month}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {clientSalesData.clientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-medium text-gray-900">
                          {clientSalesData.clientName}
                        </div>
                        <div className="text-xs text-gray-500">{clientSalesData.clientEmail}</div>
                      </div>
                    </div>
                  </td>
                  {getMonthColumns().map(({ month, monthNumber }) => {
                    const monthlyData = getClientMonthlyData(clientSalesData, monthNumber)
                    return (
                      <td key={month} className="px-2 py-2 text-center">
                        <div className="text-xs font-medium text-gray-900">
                          {monthlyData.totalAmount > 0 ? (
                            <button
                              onClick={() => loadOrderItems(selectedClient!, monthNumber)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              title={`Click to view order items for ${month} ${selectedYear}`}
                            >
                              {formatCurrency(monthlyData.totalAmount)}
                            </button>
                          ) : (
                            formatCurrency(monthlyData.totalAmount)
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <span className="text-xs font-medium text-gray-900">
                      {formatCurrency(clientSalesData.totalAmount)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">Client Management & Sales Analysis</p>
        </div>
        <div className="flex items-center space-x-4">
        <button
          onClick={() => loadClients(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Database Setup Guide */}
      {clients.length === 0 && !loading && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg hidden">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Ready to Fetch from Clients Table</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>The page is configured to fetch data from the Clients table. To get real data:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li><strong>Start MySQL:</strong> <code className="bg-blue-100 px-1 rounded">net start mysql</code></li>
                  <li><strong>Setup database:</strong> <code className="bg-blue-100 px-1 rounded">node scripts/quick-db-setup.js</code></li>
                  <li><strong>Start backend:</strong> <code className="bg-blue-100 px-1 rounded">npm run start:dev</code></li>
                  <li><strong>Refresh page</strong> to see real client data</li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">
                  Currently showing mock data. Switch to real data by following the steps above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Clients List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-6">
            {/* Loading skeleton */}
            {Array.from({ length: itemsPerPage }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      sortField === 'name' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      sortField === 'contact' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('contact')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Contact</span>
                      {sortField === 'contact' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      sortField === 'region' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Region</span>
                      {sortField === 'region' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      sortField === 'balance' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('balance')}
                    title="Click to sort by balance amount"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Balance</span>
                      {sortField === 'balance' && (
                        <div className="flex items-center space-x-1">
                          {sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          }
                          <span className="text-xs text-blue-600">
                            {sortDirection === 'asc' ? 'Low to High' : 'High to Low'}
                          </span>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.contact}</div>
                        <div className="text-sm text-gray-500">{client.address || 'No address'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {client.region}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.routeName || 'No route'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono">
                          {formatCurrency(Number(client.balance) || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => loadClientSalesData(client)}
                          disabled={salesLoading}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {salesLoading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          View Sales
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredClients.length > itemsPerPage && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredClients.length)}</span> of{' '}
                <span className="font-medium">{filteredClients.length}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Items Modal */}
      {showOrderItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Items - {selectedClient?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {getMonthColumns().find(m => m.monthNumber === selectedMonth)?.month} {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setShowOrderItemsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingOrderItems ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading order items...</p>
                </div>
              ) : orderItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{item.productName}</span>
                          </div>
                          <span className="text-sm text-gray-500">#{item.soNumber}</span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unit Price:</span>
                            <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Price:</span>
                            <span className="font-medium text-green-600">{formatCurrency(item.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Order Date:</span>
                            <span className="font-medium">{new Date(item.orderDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Items:</span>
                      <span className="font-bold text-lg text-gray-900">{orderItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-medium text-gray-900">Total Value:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(orderItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No order items found for this month</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MasterSales    