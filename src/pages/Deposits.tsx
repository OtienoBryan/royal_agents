import React, { useState, useEffect } from 'react'
import { adminApiService, AgencyDeposit } from '../services/api'
import {
  Search,
  Wallet,
  Calendar,
  Building2,
  FileText
} from 'lucide-react'

const Deposits: React.FC = () => {
  const [deposits, setDeposits] = useState<AgencyDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getAgencyDeposits(page, limit)
      setDeposits(result.deposits)
      setTotal(result.total)
    } catch (error) {
      console.error('Error loading deposits:', error)
    } finally {
      setLoading(false)
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

  const filteredDeposits = deposits.filter(deposit => {
    const searchLower = searchTerm.toLowerCase()
    return (
      deposit.reference?.toLowerCase().includes(searchLower) ||
      deposit.description?.toLowerCase().includes(searchLower) ||
      deposit.paymentMethod?.toLowerCase().includes(searchLower) ||
      deposit.agency?.name?.toLowerCase().includes(searchLower) ||
      deposit.account?.name?.toLowerCase().includes(searchLower) ||
      deposit.account?.code?.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(total / limit)

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
            <Wallet className="h-4 w-4 text-green-600" />
            Agency Deposits
          </h1>
          <p className="text-[11px] text-gray-600">View all agency deposit records</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference, description, payment method, agency, or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date Paid</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Agency</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Account</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Payment Method</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {deposits.length === 0 ? 'No deposits found.' : 'No deposits match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] text-gray-900">{formatDate(deposit.datePaid)}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-blue-500" />
                        <span className="text-[11px] font-medium text-gray-900">{deposit.agency?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-green-500" />
                        <span className="text-[11px] text-gray-600">{deposit.account?.name || 'N/A'}</span>
                        {deposit.account?.code && (
                          <span className="text-[10px] text-gray-400">({deposit.account.code})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] font-medium text-green-600">
                        {formatCurrency(deposit.amount, deposit.account?.currency || 'USD')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{deposit.paymentMethod || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[11px] text-gray-600 line-clamp-2" title={deposit.description}>
                        {deposit.description || 'N/A'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] text-gray-600 font-mono">{deposit.reference || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-500">{formatDate(deposit.createdAt)}</span>
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
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} deposits
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
    </div>
  )
}

export default Deposits


