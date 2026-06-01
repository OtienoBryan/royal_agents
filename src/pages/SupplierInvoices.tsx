import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import { adminApiService } from '../services/api'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2
} from 'lucide-react'

interface SupplierInvoice {
  id: number
  supplierId: number
  date: string
  description: string | null
  referenceType: string | null
  referenceId: number | null
  debit: number
  credit: number
  runningBalance: number
  createdAt: string
}

interface Supplier {
  id: number
  supplier_code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
}

const SupplierInvoices: React.FC = () => {
  const { supplierId, agingPeriod } = useParams<{ supplierId: string; agingPeriod: string }>()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (supplierId && agingPeriod) {
      loadData()
    }
  }, [supplierId, agingPeriod])

  const loadData = async () => {
    if (!supplierId || !agingPeriod) return

    try {
      setLoading(true)
      const [supplierData, invoicesData] = await Promise.all([
        adminApiService.getSupplierById(parseInt(supplierId, 10)),
        adminApiService.getSupplierInvoicesByAging(
          parseInt(supplierId, 10),
          agingPeriod as 'current' | 'days31_60' | 'days61_90' | 'days91_120' | 'days120_plus'
        )
      ])
      setSupplier(supplierData)
      setInvoices(invoicesData)
    } catch (error) {
      console.error('Error loading supplier invoices:', error)
      alert('Failed to load supplier invoices. Please try again.')
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = DateTime.fromISO(dateString)
    return date.toLocaleString(DateTime.DATE_MED)
  }

  const getAgingPeriodLabel = (period: string) => {
    switch (period) {
      case 'current':
        return 'Current (0-30 days)'
      case 'days31_60':
        return '31-60 Days'
      case 'days61_90':
        return '61-90 Days'
      case 'days91_120':
        return '91-120 Days'
      case 'days120_plus':
        return '120+ Days'
      default:
        return period
    }
  }

  const totalAmount = invoices.reduce((sum, inv) => {
    const credit = typeof inv.credit === 'string' ? parseFloat(inv.credit) : inv.credit || 0
    return sum + credit
  }, 0)

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
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/payables')}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Back to Payables"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1">
            <FileText className="h-4 w-4 text-blue-600" />
            Supplier Invoices
          </h1>
          <p className="text-[11px] text-gray-600">
            {supplier?.company_name} ({supplier?.supplier_code}) - {getAgingPeriodLabel(agingPeriod || '')}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Total Amount</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">Number of Invoices</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{invoices.length}</p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    No invoices found for this aging period.
                  </td>
                </tr>
              ) : (
                <>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-[11px] text-gray-900">{formatDate(invoice.date)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-[11px] text-gray-600">{invoice.description || 'N/A'}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="text-[11px] text-gray-500 font-mono">
                          {invoice.referenceType && invoice.referenceId
                            ? `${invoice.referenceType}-${invoice.referenceId}`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] font-medium text-red-600">
                          {formatCurrency(invoice.credit)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] font-medium text-gray-900">
                          {formatCurrency(invoice.runningBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-2 py-1.5 text-[11px] font-bold text-gray-900">TOTAL</td>
                    <td className="px-2 py-1.5 text-right text-[11px] font-bold text-red-600">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-[11px] font-bold text-gray-900">
                      {invoices.length > 0 ? formatCurrency(invoices[0].runningBalance) : '$0.00'}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SupplierInvoices
