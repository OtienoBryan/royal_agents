import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, Agency, AgencyLedger as AgencyLedgerType } from '../services/api'
import { ArrowLeft, FileText, Building2, DollarSign } from 'lucide-react'

const AgencyLedgerPage: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>()
  const navigate = useNavigate()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [ledgerData, setLedgerData] = useState<AgencyLedgerType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (agencyId) {
      loadData()
    }
  }, [agencyId])

  const loadData = async () => {
    if (!agencyId) return

    try {
      setLoading(true)
      const [agencyData, ledger] = await Promise.all([
        adminApiService.getAgencyById(parseInt(agencyId, 10)),
        adminApiService.getAgencyLedger(parseInt(agencyId, 10))
      ])
      setAgency(agencyData)
      setLedgerData(ledger)
    } catch (error) {
      console.error('Error loading agency ledger data:', error)
      setLedgerData([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const currentBalance = ledgerData.length > 0 ? Number(ledgerData[0].balance) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
            onClick={() => navigate('/agencies')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Back to Agencies"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              Agency Ledger
            </h1>
            {agency && (
              <div className="mt-0.5">
                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                  <Building2 className="h-2.5 w-2.5" />
                  {agency.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {agency.city && agency.country ? `${agency.city}, ${agency.country}` : agency.country || agency.city || ''} | 
                  Current Balance: <span className={`font-medium ${currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(currentBalance)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {ledgerData.length > 0 && (
          <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-purple-100 rounded">
                  <FileText className="h-2.5 w-2.5 text-purple-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Transactions</p>
                  <p className="text-sm font-bold text-gray-900">{ledgerData.length}</p>
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
                    {formatCurrency(ledgerData.reduce((sum, entry) => sum + Number(entry.debit), 0))}
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
                    {formatCurrency(ledgerData.reduce((sum, entry) => sum + Number(entry.credit), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {ledgerData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No ledger entries found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                No transaction history available for this agency.
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
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Debit</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Credit</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerData.map((entry) => (
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
                      <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-900">
                        {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : '-'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-900">
                        {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : '-'}
                      </td>
                      <td className={`px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-medium ${Number(entry.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Number(entry.balance))}
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

export default AgencyLedgerPage

