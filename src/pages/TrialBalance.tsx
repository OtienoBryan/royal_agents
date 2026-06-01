import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, AccountType } from '../services/api'
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface TrialBalanceAccount {
  account_id: number
  account_code: string
  account_name: string
  category: string
  opening_balance: number
  debit: number
  credit: number
  period_balance: number
  closing_balance: number
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[]
  totals: {
    total_debit: number
    total_credit: number
    total_period_balance: number
    total_opening_balance: number
    total_closing_balance: number
  }
}

const TrialBalance: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<TrialBalanceData | null>(null)
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('current-month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const handleAccountClick = (accountId: number) => {
    const params = new URLSearchParams({
      account_id: accountId.toString(),
      start_date: startDate,
      end_date: endDate
    })
    navigate(`/journal-entries?${params.toString()}`)
  }

  useEffect(() => {
    loadAccountTypes()
    initializeDates()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadData()
    }
  }, [startDate, endDate, categoryFilter])

  const initializeDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  const loadAccountTypes = async () => {
    try {
      const types = await adminApiService.getAccountTypes()
      setAccountTypes(types || [])
    } catch (error) {
      console.error('Error loading account types:', error)
      setAccountTypes([])
    }
  }

  const loadData = async () => {
    if (!startDate || !endDate) return

    try {
      setLoading(true)
      const accountType = categoryFilter !== 'all' ? Number(categoryFilter) : undefined
      const result = await adminApiService.getTrialBalance(startDate, endDate, accountType)
      setData(result)
    } catch (error) {
      console.error('Error loading trial balance:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period: string) => {
    setPeriodFilter(period)
    const now = new Date()
    let firstDay: Date
    let lastDay: Date

    switch (period) {
      case 'current-month':
        firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last-month':
        firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'current-year':
        firstDay = new Date(now.getFullYear(), 0, 1)
        lastDay = new Date(now.getFullYear(), 11, 31)
        break
      case 'last-year':
        firstDay = new Date(now.getFullYear() - 1, 0, 1)
        lastDay = new Date(now.getFullYear() - 1, 11, 31)
        break
      case 'custom':
        // Don't change dates, user will set them manually
        return
      default:
        firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  const handleReset = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setPeriodFilter('current-month')
    initializeDates()
  }

  const formatCurrency = (amount: number): string => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const exportToCSV = () => {
    if (!data) return

    const headers = [
      'Account Code',
      'Account Name',
      'Category',
      'Opening Balance',
      'Debit',
      'Credit',
      'Period Balance',
      'Closing Balance'
    ]

    const rows = filteredAccounts.map(account => [
      account.account_code,
      account.account_name,
      account.category,
      account.opening_balance.toFixed(2),
      account.debit.toFixed(2),
      account.credit.toFixed(2),
      account.period_balance.toFixed(2),
      account.closing_balance.toFixed(2)
    ])

    const totalsRow = [
      'TOTAL',
      '',
      '',
      data.totals.total_opening_balance.toFixed(2),
      data.totals.total_debit.toFixed(2),
      data.totals.total_credit.toFixed(2),
      data.totals.total_period_balance.toFixed(2),
      data.totals.total_closing_balance.toFixed(2)
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      totalsRow.join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `trial-balance-${startDate}-to-${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAccounts = (data?.accounts || []).filter(account => {
    const matchesSearch = 
      account.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const difference = data ? Math.abs(data.totals.total_debit - data.totals.total_credit) : 0
  const isBalanced = difference < 0.01

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Trial Balance Report</h1>
          <p className="text-[11px] text-gray-600">
            Period: {startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : 'Select period'}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!data || filteredAccounts.length === 0}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-3 w-3" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-gray-400" />
            <select
              value={periodFilter}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current-month">Period: Current Month</option>
              <option value="last-month">Period: Last Month</option>
              <option value="current-year">Period: Current Year</option>
              <option value="last-year">Period: Last Year</option>
              <option value="custom">Period: Custom</option>
            </select>
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-[11px] text-gray-600">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <button
              onClick={handleReset}
              className="px-2 py-1 text-[11px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by account code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-2 pr-8 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {accountTypes.map(type => (
                <option key={type.id} value={type.id.toString()}>{type.name}</option>
              ))}
            </select>
          </div>
          <div className="text-[11px] text-gray-600 flex items-center">
            Showing {filteredAccounts.length} of {data?.accounts.length || 0} accounts
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="text-[10px] text-gray-600 uppercase mb-1">Total Debit</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totals.total_debit)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="text-[10px] text-gray-600 uppercase mb-1">Total Credit</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totals.total_credit)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="text-[10px] text-gray-600 uppercase mb-1">Period Balance</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totals.total_period_balance)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="text-[10px] text-gray-600 uppercase mb-1">Difference</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(difference)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="text-[10px] text-gray-600 uppercase mb-1">Status</div>
            <div className="flex items-center gap-1">
              {isBalanced ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">Balanced</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-600">Not Balanced</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-2 border-b">
          <h2 className="text-sm font-semibold text-gray-900">
            Trial Balance ({startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : ''}) ({filteredAccounts.length} accounts)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Account Code</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Account Name</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Opening Balance</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Debit</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Credit</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Period Balance</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {loading ? 'Loading...' : 'No accounts found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {filteredAccounts.map((account) => {
                    // Determine row color based on account type/category
                    const getRowColor = () => {
                      const category = account.category.toLowerCase();
                      if (category.includes('asset') || category.includes('current assets')) {
                        return 'bg-blue-50 hover:bg-blue-100';
                      } else if (category.includes('liability') || category.includes('payable')) {
                        return 'bg-orange-50 hover:bg-orange-100';
                      } else if (category.includes('income') || category.includes('revenue')) {
                        return 'bg-green-50 hover:bg-green-100';
                      } else if (category.includes('expense') || category.includes('cost')) {
                        return 'bg-red-50 hover:bg-red-100';
                      }
                      return 'hover:bg-gray-50';
                    };

                    // Color code values
                    const getDebitColor = (value: number) => {
                      return value > 0 ? 'text-blue-700 font-semibold' : 'text-gray-600';
                    };

                    const getCreditColor = (value: number) => {
                      return value > 0 ? 'text-orange-700 font-semibold' : 'text-gray-600';
                    };

                    const getBalanceColor = (value: number) => {
                      if (value > 0) return 'text-green-700 font-semibold';
                      if (value < 0) return 'text-red-700 font-semibold';
                      return 'text-gray-600';
                    };

                    return (
                      <tr 
                        key={account.account_id} 
                        className={`${getRowColor()} cursor-pointer transition-colors`}
                        onClick={() => handleAccountClick(account.account_id)}
                        title="Click to view journal entries for this account"
                      >
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="text-[11px] font-mono text-gray-900 font-semibold hover:text-blue-600">{account.account_code}</span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="text-[11px] text-gray-900 hover:text-blue-600">{account.account_name}</span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="text-[11px] text-gray-600">{account.category}</span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-right">
                          <span className={`text-[11px] ${getBalanceColor(account.opening_balance)}`}>
                            {formatCurrency(account.opening_balance)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-right">
                          <span className={`text-[11px] ${getDebitColor(account.debit)}`}>
                            {formatCurrency(account.debit)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-right">
                          <span className={`text-[11px] ${getCreditColor(account.credit)}`}>
                            {formatCurrency(account.credit)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-right">
                          <span className={`text-[11px] ${getBalanceColor(account.period_balance)}`}>
                            {formatCurrency(account.period_balance)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-right">
                          <span className={`text-[11px] font-medium ${getBalanceColor(account.closing_balance)}`}>
                            {formatCurrency(account.closing_balance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {data && (
                    <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                      <td colSpan={3} className="px-2 py-1.5 text-left">
                        <span className="text-[11px] text-gray-900 uppercase">TOTAL</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className={`text-[11px] ${
                          data.totals.total_opening_balance > 0 ? 'text-green-700' : 
                          data.totals.total_opening_balance < 0 ? 'text-red-700' : 
                          'text-gray-900'
                        }`}>
                          {formatCurrency(data.totals.total_opening_balance)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] text-blue-700">{formatCurrency(data.totals.total_debit)}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] text-orange-700">{formatCurrency(data.totals.total_credit)}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className={`text-[11px] ${
                          data.totals.total_period_balance > 0 ? 'text-green-700' : 
                          data.totals.total_period_balance < 0 ? 'text-red-700' : 
                          'text-gray-900'
                        }`}>
                          {formatCurrency(data.totals.total_period_balance)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className={`text-[11px] ${
                          data.totals.total_closing_balance > 0 ? 'text-green-700' : 
                          data.totals.total_closing_balance < 0 ? 'text-red-700' : 
                          'text-gray-900'
                        }`}>
                          {formatCurrency(data.totals.total_closing_balance)}
                        </span>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TrialBalance
