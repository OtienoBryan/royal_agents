import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApiService, ChartOfAccount } from '../services/api'
import {
  Download,
  RefreshCw,
  Calendar,
  X
} from 'lucide-react'

interface JournalEntry {
  id: number
  entry_id: number
  date: string
  entry_number: string
  reference: string | null
  account_code: string
  account_name: string
  account_id: number
  description: string
  debit: number
  credit: number
  status: string
}

const JournalEntries: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  
  // Filters
  const [startDate, setStartDate] = useState<string>(() => searchParams.get('start_date') || '')
  const [endDate, setEndDate] = useState<string>(() => searchParams.get('end_date') || '')
  const [accountFilter, setAccountFilter] = useState<string>(() => searchParams.get('account_id') || 'all')
  const [referenceFilter, setReferenceFilter] = useState<string>('')
  const [descriptionFilter, setDescriptionFilter] = useState<string>('')

  // Initialize dates and load accounts on mount
  useEffect(() => {
    loadAccounts()
    // Only initialize dates if not set from URL
    const urlStartDate = searchParams.get('start_date')
    const urlEndDate = searchParams.get('end_date')
    if (!urlStartDate && !urlEndDate) {
      initializeDates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read URL parameters and update filters when searchParams change
  useEffect(() => {
    const urlAccountId = searchParams.get('account_id')
    const urlStartDate = searchParams.get('start_date')
    const urlEndDate = searchParams.get('end_date')
    
    // Apply URL filters first, then reset to page 1 so pagination doesn't mask filtered results.
    if (urlStartDate !== null) setStartDate(urlStartDate)
    if (urlEndDate !== null) setEndDate(urlEndDate)
    setAccountFilter(urlAccountId || 'all')
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [page, limit, startDate, endDate, accountFilter, referenceFilter, descriptionFilter])

  const initializeDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  const loadAccounts = async () => {
    try {
      const result = await adminApiService.getChartOfAccounts(1, 0)
      setAccounts(result.accounts || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
      setAccounts([])
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const accountId = accountFilter && accountFilter !== 'all' ? Number(accountFilter) : undefined
      console.log('📝 [JournalEntries] Loading data with filters:', {
        accountFilter,
        accountId,
        startDate,
        endDate,
        page,
        limit
      })
      const result = await adminApiService.getJournalEntries(
        page,
        limit,
        startDate || undefined,
        endDate || undefined,
        accountId,
        referenceFilter || undefined,
        descriptionFilter || undefined
      )
      console.log('📝 [JournalEntries] Loaded entries:', result.entries.length, 'for account:', accountId)
      setEntries(result.entries || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('Error loading journal entries:', error)
      setEntries([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setAccountFilter('all')
    setReferenceFilter('')
    setDescriptionFilter('')
    initializeDates()
    setPage(1)
  }

  const handleRefresh = () => {
    loadData()
  }

  const formatCurrency = (amount: number): string => {
    if (amount === null || amount === undefined || amount === 0) return '-'
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
      month: 'short',
      day: 'numeric'
    })
  }

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Entry #',
      'Reference',
      'Account',
      'Description',
      'Debit',
      'Credit',
      'Status'
    ]

    const rows = entries.map(entry => [
      formatDate(entry.date),
      entry.entry_number,
      entry.reference || '',
      `${entry.account_code} - ${entry.account_name}`,
      entry.description,
      entry.debit > 0 ? entry.debit.toFixed(2) : '',
      entry.credit > 0 ? entry.credit.toFixed(2) : '',
      entry.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `journal-entries-${startDate}-to-${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  if (loading && entries.length === 0) {
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
          <h1 className="text-lg font-bold text-gray-900">Journal Entries</h1>
          <p className="text-[11px] text-gray-600">View and manage journal entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            disabled={entries.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-[11px]"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Account</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id.toString()}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={referenceFilter}
              onChange={(e) => setReferenceFilter(e.target.value)}
              placeholder="Reference"
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              placeholder="Description"
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-[11px]"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-600">Show:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={15}>15 records per page</option>
            <option value={25}>25 records per page</option>
            <option value={50}>50 records per page</option>
            <option value={100}>100 records per page</option>
          </select>
        </div>
        <div className="text-[11px] text-gray-600">
          Showing {startIndex} to {endIndex} of {total} entries
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Entry #</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Account</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Debit</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Credit</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {loading ? 'Loading...' : 'No journal entries found.'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-900">{formatDate(entry.date)}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] font-mono text-gray-900">{entry.entry_number}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-900">{entry.reference || '-'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-900">
                        {entry.account_code} - {entry.account_name}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[11px] text-gray-600">{entry.description || '-'}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className={`text-[11px] ${entry.debit > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                        {formatCurrency(entry.debit)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className={`text-[11px] ${entry.credit > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {formatCurrency(entry.credit)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded ${
                        entry.status === 'posted' ? 'bg-green-100 text-green-800' :
                        entry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-2 py-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-[11px] text-gray-600 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JournalEntries
