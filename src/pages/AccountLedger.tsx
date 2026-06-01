import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, Account, AccountLedger as AccountLedgerType } from '../services/api'
import { ArrowLeft, FileText, Wallet, DollarSign, Calendar, Filter } from 'lucide-react'

const AccountLedgerPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [ledgerData, setLedgerData] = useState<AccountLedgerType[]>([])
  const [filteredLedgerData, setFilteredLedgerData] = useState<AccountLedgerType[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    if (accountId) {
      loadData()
    }
  }, [accountId])

  const loadData = async () => {
    if (!accountId) return

    try {
      setLoading(true)
      const [accountData, ledger] = await Promise.all([
        adminApiService.getAccountById(parseInt(accountId, 10)),
        adminApiService.getAccountLedger(parseInt(accountId, 10))
      ])
      setAccount(accountData)
      setLedgerData(ledger)
      setFilteredLedgerData(ledger)
    } catch (error) {
      console.error('Error loading account ledger data:', error)
      setLedgerData([])
      setFilteredLedgerData([])
    } finally {
      setLoading(false)
    }
  }

  // Filter ledger data based on date range
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredLedgerData(ledgerData)
      return
    }

    const filtered = ledgerData.filter(entry => {
      const entryDate = new Date(entry.transactionDate)
      entryDate.setHours(0, 0, 0, 0)
      
      if (startDate && endDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        return entryDate >= start && entryDate <= end
      } else if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        return entryDate >= start
      } else if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        return entryDate <= end
      }
      return true
    })

    setFilteredLedgerData(filtered)
  }, [startDate, endDate, ledgerData])

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const formatCurrency = (amount: number | null, currencyCode: string | null = null) => {
    if (amount === null || amount === undefined) return 'N/A'
    const currency = currencyCode || account?.currency || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const currentBalance = filteredLedgerData.length > 0 ? Number(filteredLedgerData[0].balance) : (account ? Number(account.balance) : 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/accounts')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Back to Accounts"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Account Ledger
            </h1>
            {account && (
              <div className="mt-0.5">
                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                  <Wallet className="h-2.5 w-2.5" />
                  {account.name} ({account.code})
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Currency: {account.currency || 'USD'} | 
                  Current Balance: <span className={`font-medium ${currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(currentBalance, account.currency)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date Filters */}
        <div className="mb-2 bg-white rounded shadow p-1.5">
          <div className="flex items-center gap-1 mb-1">
            <Filter className="h-3 w-3 text-gray-600" />
            <span className="text-[11px] font-medium text-gray-700">Date Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-7 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-7 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          {(startDate || endDate) && (
            <p className="text-[10px] text-gray-500 mt-1">
              Showing {filteredLedgerData.length} of {ledgerData.length} transactions
            </p>
          )}
        </div>

        {/* Summary Stats */}
        {filteredLedgerData.length > 0 && (
          <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-blue-100 rounded">
                  <FileText className="h-2.5 w-2.5 text-blue-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Transactions</p>
                  <p className="text-sm font-bold text-gray-900">{filteredLedgerData.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-red-100 rounded">
                  <DollarSign className="h-2.5 w-2.5 text-red-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Debit</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(filteredLedgerData.reduce((sum, entry) => sum + Number(entry.debit), 0), account?.currency || null)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-green-100 rounded">
                  <DollarSign className="h-2.5 w-2.5 text-green-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Credit</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(filteredLedgerData.reduce((sum, entry) => sum + Number(entry.credit), 0), account?.currency || null)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {filteredLedgerData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No ledger entries found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                No transaction history available for this account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Payment Method</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Debit</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Credit</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLedgerData.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-900">
                        {new Date(entry.transactionDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-2 py-1.5 text-[11px] text-gray-900">
                        {entry.description || 'N/A'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">
                        {entry.reference || 'N/A'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-600">
                        {entry.payment_method ? entry.payment_method.charAt(0).toUpperCase() + entry.payment_method.slice(1).replace('_', ' ') : 'N/A'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-900">
                        {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit), account?.currency || null) : '-'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-900">
                        {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit), account?.currency || null) : '-'}
                      </td>
                      <td className={`px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-medium ${Number(entry.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Number(entry.balance), account?.currency || null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccountLedgerPage

