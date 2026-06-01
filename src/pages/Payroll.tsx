import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { adminApiService, Staff } from '../services/api'
import {
  Search,
  FileText,
  Plus,
  X,
  DollarSign,
  Users
} from 'lucide-react'

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

interface Payroll {
  id: number
  journal_entry_id: number
  staff_id: number
  payroll_date: string
  amount: number
  description: string | null
  reference: string | null
  created_at: string
  journal_entry?: JournalEntry
  staff?: Staff
}

const Payroll: React.FC = () => {
  // Get current month's first and last day using Luxon
  const getCurrentMonthDates = () => {
    const now = DateTime.now()
    const firstDay = now.startOf('month')
    const lastDay = now.endOf('month')
    return {
      from: firstDay.toISODate() || '',
      to: lastDay.toISODate() || ''
    }
  }
  
  const currentMonth = getCurrentMonthDates()
  
  const [payroll, setPayroll] = useState<Payroll[]>([])
  const [payrollAccounts, setPayrollAccounts] = useState<ChartOfAccount[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPayrollAccount, setFilterPayrollAccount] = useState<string>('')
  const [filterStaff, setFilterStaff] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>(currentMonth.from)
  const [filterDateTo, setFilterDateTo] = useState<string>(currentMonth.to)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const limit = 50

  const [payrollForm, setPayrollForm] = useState({
    staff_id: '',
    payroll_account_id: '',
    amount: '',
    payroll_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: ''
  })

  useEffect(() => {
    loadData()
    loadPayrollAccounts()
    loadStaff()
  }, [page])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getPayroll(page, limit)
      setPayroll(result.payroll)
      setTotal(result.total)
    } catch (error) {
      console.error('Error loading payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPayrollAccounts = async () => {
    try {
      // Load accounts that can be used for payroll (typically expense accounts, account_type 16)
      const accounts = await adminApiService.getChartOfAccountsByType(16)
      setPayrollAccounts(accounts)
    } catch (error) {
      console.error('Error loading payroll accounts:', error)
    }
  }

  const loadStaff = async () => {
    try {
      const allStaff = await adminApiService.getStaff()
      setStaff(allStaff.filter((s: Staff) => s.is_active === 1))
    } catch (error) {
      console.error('Error loading staff:', error)
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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!payrollForm.staff_id || !payrollForm.payroll_account_id || !payrollForm.amount || 
        !payrollForm.payroll_date || !payrollForm.description || !payrollForm.reference) {
      alert('Please fill in all required fields')
      return
    }

    const amount = Number(payrollForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setSaving(true)
      const payrollData: any = {
        staff_id: Number(payrollForm.staff_id),
        payroll_account_id: Number(payrollForm.payroll_account_id),
        amount: amount,
        payroll_date: payrollForm.payroll_date,
        description: payrollForm.description,
        reference: payrollForm.reference,
        is_paid: false // Default to not paid
      }
      
      await adminApiService.createPayroll(payrollData)
      await loadData()
      setShowAddModal(false)
      setPayrollForm({
        staff_id: '',
        payroll_account_id: '',
        amount: '',
        payroll_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: ''
      })
      alert('Payroll posted successfully!')
    } catch (error: any) {
      console.error('Error creating payroll:', error)
      alert(error?.message || 'Failed to post payroll. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setPayrollForm({
      staff_id: '',
      payroll_account_id: '',
      amount: '',
      payroll_date: new Date().toISOString().split('T')[0],
      description: '',
      reference: ''
    })
  }

  // Filter payroll records
  const filteredPayroll = payroll.filter((p) => {
    const matchesSearch = 
      p.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.journal_entry?.entry_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAccount = !filterPayrollAccount || 
      p.journal_entry?.lines?.some(line => 
        line.account_id === Number(filterPayrollAccount) && line.debit_amount > 0
      )
    
    const matchesStaff = !filterStaff || p.staff_id === Number(filterStaff)
    
    const payrollDate = new Date(p.payroll_date)
    const fromDate = filterDateFrom ? new Date(filterDateFrom) : null
    const toDate = filterDateTo ? new Date(filterDateTo) : null
    const matchesDate = (!fromDate || payrollDate >= fromDate) && (!toDate || payrollDate <= toDate)
    
    return matchesSearch && matchesAccount && matchesStaff && matchesDate
  })

  // Calculate summary statistics
  const totalPayroll = filteredPayroll.length
  const totalAmount = filteredPayroll.reduce((sum, p) => {
    const amount = p.amount
    const amountValue = typeof amount === 'string' ? parseFloat(amount) : (amount || 0)
    return sum + (isNaN(amountValue) ? 0 : amountValue)
  }, 0)

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Payroll</h1>
          <p className="text-sm text-gray-600">Post and manage staff payroll</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          <Plus size={16} />
          Post Payroll
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Payroll Records</p>
              <p className="text-lg font-semibold text-gray-800">{totalPayroll}</p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Amount</p>
              <p className="text-lg font-semibold text-gray-800">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterPayrollAccount}
            onChange={(e) => setFilterPayrollAccount(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Payroll Accounts</option>
            {payrollAccounts.map((account) => (
              <option key={account.id} value={account.id.toString()}>
                {account.name} ({account.code})
              </option>
            ))}
          </select>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.name} ({s.empl_no})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payroll records...</div>
        ) : filteredPayroll.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payroll records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Staff</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Reference</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Journal Entry</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayroll.map((p) => {
                  const journalEntry = p.journal_entry
                  
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {formatDate(p.payroll_date)}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-gray-400" />
                          <span className="font-medium">{p.staff?.name || 'N/A'}</span>
                          {p.staff?.empl_no && (
                            <span className="text-gray-500">({p.staff.empl_no})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-gray-700">{p.description || 'N/A'}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="text-gray-500 font-mono text-[10px]">{p.reference || 'N/A'}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {journalEntry ? (
                          <span className="text-blue-600 font-mono text-[10px]">{journalEntry.entry_number}</span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="font-semibold text-gray-800">{formatCurrency(p.amount)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Payroll Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Post New Payroll</h2>
              <button
                onClick={handleAddCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={payrollForm.staff_id}
                  onChange={(e) => setPayrollForm({ ...payrollForm, staff_id: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select staff member</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.name} ({s.empl_no}) - {s.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payroll Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={payrollForm.payroll_account_id}
                  onChange={(e) => setPayrollForm({ ...payrollForm, payroll_account_id: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payroll account</option>
                  {payrollAccounts.map((account) => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.name} ({account.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={payrollForm.amount}
                    onChange={(e) => setPayrollForm({ ...payrollForm, amount: e.target.value })}
                    required
                    className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payroll Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={payrollForm.payroll_date}
                  onChange={(e) => setPayrollForm({ ...payrollForm, payroll_date: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={payrollForm.description}
                  onChange={(e) => setPayrollForm({ ...payrollForm, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter payroll description..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={payrollForm.reference}
                  onChange={(e) => setPayrollForm({ ...payrollForm, reference: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference number or code"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {saving ? 'Posting...' : 'Post Payroll'}
                </button>
                <button
                  type="button"
                  onClick={handleAddCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payroll
