import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService } from '../services/api'
import {
  Search,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface PayablesAgingItem {
  supplier_id: number
  supplier_code: string
  company_name: string
  current: number
  days31_60: number
  days61_90: number
  days91_120: number
  days120_plus: number
  total: number
}

interface PayablesAgingSummary {
  items: PayablesAgingItem[]
  totals: {
    current: number
    days31_60: number
    days61_90: number
    days91_120: number
    days120_plus: number
    total: number
  }
}

const Payables: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<PayablesAgingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getPayablesAging()
      setData(result)
    } catch (error) {
      console.error('Error loading payables aging:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | string | null | undefined, currencyCode: string = 'USD') => {
    if (amount === null || amount === undefined) return '$0.00'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount)
  }

  const filteredItems = data?.items.filter(item => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      item.company_name.toLowerCase().includes(searchLower) ||
      item.supplier_code.toLowerCase().includes(searchLower)
    )
  }) || []

  const handleAmountClick = (item: PayablesAgingItem, agingPeriod: string) => {
    const amount = item[agingPeriod as keyof PayablesAgingItem] as number
    if (amount <= 0) return

    navigate(`/payables/${item.supplier_id}/invoices/${agingPeriod}`)
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
            <FileText className="h-4 w-4 text-blue-600" />
            Accounts Payable - Aging Analysis
          </h1>
          <p className="text-[11px] text-gray-600">View outstanding payables by supplier and aging period</p>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">Current (0-30)</p>
                <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(data.totals.current)}</p>
              </div>
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">31-60 Days</p>
                <p className="text-lg font-bold text-yellow-600 mt-1">{formatCurrency(data.totals.days31_60)}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">61-90 Days</p>
                <p className="text-lg font-bold text-orange-600 mt-1">{formatCurrency(data.totals.days61_90)}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">91-120 Days</p>
                <p className="text-lg font-bold text-red-600 mt-1">{formatCurrency(data.totals.days91_120)}</p>
              </div>
              <div className="bg-red-100 rounded-full p-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">120+ Days</p>
                <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(data.totals.days120_plus)}</p>
              </div>
              <div className="bg-red-200 rounded-full p-2">
                <AlertCircle className="h-4 w-4 text-red-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">Total Payable</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(data.totals.total)}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by supplier name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payables Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Supplier</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Current (0-30)</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">31-60 Days</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">61-90 Days</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">91-120 Days</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">120+ Days</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {data?.items.length === 0 ? 'No outstanding payables found.' : 'No suppliers match your search criteria.'}
                  </td>
                </tr>
              ) : (
                <>
                  {filteredItems.map((item) => (
                    <tr key={item.supplier_id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div>
                          <div className="text-[11px] font-medium text-gray-900">{item.company_name}</div>
                          <div className="text-[10px] text-gray-500">{item.supplier_code}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAmountClick(item, 'current')}
                          disabled={item.current <= 0}
                          className={`text-[11px] font-medium ${
                            item.current > 0
                              ? 'text-green-600 hover:text-green-800 hover:underline cursor-pointer'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {formatCurrency(item.current)}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAmountClick(item, 'days31_60')}
                          disabled={item.days31_60 <= 0}
                          className={`text-[11px] font-medium ${
                            item.days31_60 > 0
                              ? 'text-yellow-600 hover:text-yellow-800 hover:underline cursor-pointer'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {formatCurrency(item.days31_60)}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAmountClick(item, 'days61_90')}
                          disabled={item.days61_90 <= 0}
                          className={`text-[11px] font-medium ${
                            item.days61_90 > 0
                              ? 'text-orange-600 hover:text-orange-800 hover:underline cursor-pointer'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {formatCurrency(item.days61_90)}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAmountClick(item, 'days91_120')}
                          disabled={item.days91_120 <= 0}
                          className={`text-[11px] font-medium ${
                            item.days91_120 > 0
                              ? 'text-red-600 hover:text-red-800 hover:underline cursor-pointer'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {formatCurrency(item.days91_120)}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAmountClick(item, 'days120_plus')}
                          disabled={item.days120_plus <= 0}
                          className={`text-[11px] font-medium ${
                            item.days120_plus > 0
                              ? 'text-red-700 hover:text-red-900 hover:underline cursor-pointer'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {formatCurrency(item.days120_plus)}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] font-bold text-gray-900">
                          {formatCurrency(item.total)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  {data && (
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-2 py-1.5 text-[11px] font-bold text-gray-900">TOTAL</td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-green-600">
                        {formatCurrency(data.totals.current)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-yellow-600">
                        {formatCurrency(data.totals.days31_60)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-orange-600">
                        {formatCurrency(data.totals.days61_90)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-red-600">
                        {formatCurrency(data.totals.days91_120)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-red-700">
                        {formatCurrency(data.totals.days120_plus)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-gray-900">
                        {formatCurrency(data.totals.total)}
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

export default Payables
