import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { adminApiService } from '../services/api'
import {
  Search,
  Wallet,
  Calendar,
  FileText,
  Plus,
  X,
  DollarSign,
  Receipt,
  CreditCard,
  History
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

interface Expense {
  id: number
  journal_entry_id: number
  amount_paid: number
  balance: number
  created_at: string
  journal_entry?: JournalEntry
  supplier?: Supplier
}

interface Supplier {
  id: number
  supplier_code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  payment_terms: number
  credit_limit: number
  is_active: boolean
}

const Expenses: React.FC = () => {
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
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseAccounts, setExpenseAccounts] = useState<ChartOfAccount[]>([])
  const [paymentMethods, setPaymentMethods] = useState<ChartOfAccount[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterExpenseAccount, setFilterExpenseAccount] = useState<string>('')
  const [filterSupplier, setFilterSupplier] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>(currentMonth.from)
  const [filterDateTo, setFilterDateTo] = useState<string>(currentMonth.to)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<JournalEntry[]>([])
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false)
  const [updatePaymentForm, setUpdatePaymentForm] = useState({ payment_method: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const limit = 50

  const [expenseForm, setExpenseForm] = useState({
    expense_account_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    supplier_id: ''
  })

  useEffect(() => {
    loadData()
    loadExpenseAccounts()
    loadPaymentMethods()
    loadSuppliers()
  }, [page])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getExpenses(page, limit)
      setExpenses(result.expenses)
      setTotal(result.total)
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExpenseAccounts = async () => {
    try {
      const accounts = await adminApiService.getChartOfAccountsByType(16)
      setExpenseAccounts(accounts)
    } catch (error) {
      console.error('Error loading expense accounts:', error)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const methods = await adminApiService.getChartOfAccountsByType(9)
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Error loading payment methods:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const result = await adminApiService.getSuppliers(1, 1000, '', 'active')
      setSuppliers(result.suppliers.filter((s: Supplier) => s.is_active))
    } catch (error) {
      console.error('Error loading suppliers:', error)
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

    if (!expenseForm.expense_account_id || !expenseForm.amount || !expenseForm.expense_date ||
        !expenseForm.description || !expenseForm.reference || !expenseForm.supplier_id) {
      alert('Please fill in all required fields')
      return
    }

    const amount = Number(expenseForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setSaving(true)
      const expenseData: any = {
        expense_account_id: Number(expenseForm.expense_account_id),
        amount: amount,
        expense_date: expenseForm.expense_date,
        description: expenseForm.description,
        reference: expenseForm.reference,
        is_paid: false, // All expenses default to not paid
        supplier_id: Number(expenseForm.supplier_id) // Supplier is required
      }
      
      await adminApiService.createExpense(expenseData)
      await loadData()
      setShowAddModal(false)
      setExpenseForm({
        expense_account_id: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        supplier_id: ''
      })
      alert('Expense created successfully!')
    } catch (error: any) {
      console.error('Error creating expense:', error)
      alert(error?.message || 'Failed to create expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setExpenseForm({
      expense_account_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      supplier_id: ''
    })
  }

  const handleUpdatePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedExpense || !updatePaymentForm.payment_method || !updatePaymentForm.amount) {
      alert('Please fill in all required fields')
      return
    }

    const paymentAmount = parseFloat(updatePaymentForm.amount)
    if (isNaN(paymentAmount) || paymentAmount < 0.01) {
      alert('Payment amount must be at least 0.01')
      return
    }

    const currentBalance = selectedExpense.balance || (selectedExpense.journal_entry?.total_debit || 0)
    if (paymentAmount > currentBalance) {
      alert(`Payment amount cannot exceed balance of ${formatCurrency(currentBalance, 'USD')}`)
      return
    }

    try {
      setUpdatingPayment(true)
      await adminApiService.updateExpensePayment(selectedExpense.id, updatePaymentForm.payment_method, paymentAmount)
      await loadData()
      setShowUpdatePaymentModal(false)
      setSelectedExpense(null)
      setUpdatePaymentForm({ payment_method: '', amount: '' })
      alert('Payment updated successfully!')
    } catch (error: any) {
      console.error('Error updating payment:', error)
      alert(error?.message || 'Failed to update payment. Please try again.')
    } finally {
      setUpdatingPayment(false)
    }
  }

  const handleUpdatePaymentCancel = () => {
    setShowUpdatePaymentModal(false)
    setSelectedExpense(null)
    setUpdatePaymentForm({ payment_method: '', amount: '' })
  }

  const handleViewPaymentHistory = async (expense: Expense) => {
    try {
      setSelectedExpense(expense)
      setLoadingPaymentHistory(true)
      setShowPaymentHistoryModal(true)
      const history = await adminApiService.getExpensePaymentHistory(expense.id)
      setPaymentHistory(history || [])
    } catch (error: any) {
      console.error('Error loading payment history:', error)
      alert(error?.message || 'Failed to load payment history. Please try again.')
      setShowPaymentHistoryModal(false)
    } finally {
      setLoadingPaymentHistory(false)
    }
  }

  const handleClosePaymentHistory = () => {
    setShowPaymentHistoryModal(false)
    setSelectedExpense(null)
    setPaymentHistory([])
  }

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchTerm.toLowerCase()
    const journalEntry = expense.journal_entry
    if (!journalEntry) return false
    
    // Find expense account from debit line
    const expenseLine = journalEntry.lines?.find(line => line.debit_amount > 0)
    const expenseAccount = expenseLine?.account
    
    // Find payment method from credit line
    const creditLine = journalEntry.lines?.find(line => line.credit_amount > 0)
    const paymentAccount = creditLine?.account
    
    // Filter by date range using Luxon
    if (filterDateFrom || filterDateTo) {
      const entryDate = DateTime.fromISO(journalEntry.entry_date).startOf('day')
      
      if (filterDateFrom) {
        const fromDate = DateTime.fromISO(filterDateFrom).startOf('day')
        if (entryDate < fromDate) {
          return false
        }
      }
      
      if (filterDateTo) {
        const toDate = DateTime.fromISO(filterDateTo).endOf('day')
        if (entryDate > toDate) {
          return false
        }
      }
    }
    
    // Filter by expense account
    if (filterExpenseAccount && expenseAccount?.id !== Number(filterExpenseAccount)) {
      return false
    }
    
    // Filter by supplier
    if (filterSupplier && expense.supplier?.id !== Number(filterSupplier)) {
      return false
    }
    
    // Search filter
    if (searchTerm) {
      return (
        journalEntry.reference?.toLowerCase().includes(searchLower) ||
        journalEntry.description?.toLowerCase().includes(searchLower) ||
        paymentAccount?.name?.toLowerCase().includes(searchLower) ||
        paymentAccount?.code?.toLowerCase().includes(searchLower) ||
        expenseAccount?.name?.toLowerCase().includes(searchLower) ||
        expenseAccount?.code?.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Calculate summary statistics
  const totalExpenses = filteredExpenses.length
  const totalAmount = filteredExpenses.reduce((sum, expense) => {
    const debit = expense.journal_entry?.total_debit
    const debitValue = typeof debit === 'string' ? parseFloat(debit) : (debit || 0)
    return sum + (isNaN(debitValue) ? 0 : debitValue)
  }, 0)
  const totalAmountRemaining = filteredExpenses.reduce((sum, expense) => {
    const balance = expense.balance
    const debit = expense.journal_entry?.total_debit
    const balanceValue = typeof balance === 'string' ? parseFloat(balance) : (balance || 0)
    const debitValue = typeof debit === 'string' ? parseFloat(debit) : (debit || 0)
    const value = isNaN(balanceValue) ? (isNaN(debitValue) ? 0 : debitValue) : balanceValue
    return sum + value
  }, 0)

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
            <Receipt className="h-4 w-4 text-red-600" />
            Expenses
          </h1>
          <p className="text-[11px] text-gray-600">Manage and track expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{totalExpenses}</p>
            </div>
            <div className="bg-red-100 rounded-full p-2">
              <Receipt className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Total Amount</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalAmount, 'USD')}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Amount Remaining</p>
              <p className="text-lg font-bold text-orange-600 mt-1">{formatCurrency(totalAmountRemaining, 'USD')}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-2">
              <Wallet className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-2 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Date From Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Expense Account Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">
              Filter by Expense Account
            </label>
            <select
              value={filterExpenseAccount}
              onChange={(e) => setFilterExpenseAccount(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Expense Accounts</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.code})
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">
              Filter by Supplier
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name} ({supplier.supplier_code})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filterExpenseAccount || filterSupplier || searchTerm || filterDateFrom !== currentMonth.from || filterDateTo !== currentMonth.to) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFilterExpenseAccount('')
                setFilterSupplier('')
                setSearchTerm('')
                setFilterDateFrom(currentMonth.from)
                setFilterDateTo(currentMonth.to)
              }}
              className="text-[11px] text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Expense Account</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Supplier</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Amount Paid</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Balance</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Created At</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {expenses.length === 0 ? 'No expenses found.' : 'No expenses match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const journalEntry = expense.journal_entry
                  if (!journalEntry) return null
                  
                  // Find expense account from debit line
                  const expenseLine = journalEntry.lines?.find(line => line.debit_amount > 0)
                  const expenseAccount = expenseLine?.account
                  
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-[11px] text-gray-900">{formatDate(journalEntry.entry_date)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3 text-red-500" />
                          <span className="text-[11px] text-gray-600">{expenseAccount?.name || 'N/A'}</span>
                          {expenseAccount?.code && (
                            <span className="text-[10px] text-gray-400">({expenseAccount.code})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {expense.supplier ? (
                          <span className="text-[11px] text-gray-600">
                            {expense.supplier.company_name}
                            {expense.supplier.supplier_code && (
                              <span className="text-[10px] text-gray-400"> ({expense.supplier.supplier_code})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] font-medium text-red-600">
                          {formatCurrency(journalEntry.total_debit, 'USD')}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] font-medium text-blue-600">
                          {formatCurrency(expense.amount_paid || 0, 'USD')}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-right">
                        <span className={`text-[11px] font-medium ${
                          (expense.balance || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(expense.balance || journalEntry.total_debit, 'USD')}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          (expense.balance || journalEntry.total_debit) <= 0
                            ? 'bg-green-100 text-green-800' 
                            : (expense.amount_paid || 0) > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(expense.balance || journalEntry.total_debit) <= 0 ? 'Paid' : (expense.amount_paid || 0) > 0 ? 'Partially Paid' : 'Not Paid'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-[11px] text-gray-600 line-clamp-2" title={journalEntry.description || ''}>
                          {journalEntry.description || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-gray-400" />
                          <span className="text-[11px] text-gray-600 font-mono">{journalEntry.reference || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="text-[11px] text-gray-500">{formatDate(expense.created_at)}</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewPaymentHistory(expense)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="View Payment History"
                          >
                            <History className="h-3 w-3" />
                          </button>
                          {((expense.balance || journalEntry.total_debit) > 0) && (
                            <button
                              onClick={() => {
                                setSelectedExpense(expense)
                                setUpdatePaymentForm({ payment_method: '', amount: '' })
                                setShowUpdatePaymentModal(true)
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Update Payment"
                            >
                              <CreditCard className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                }).filter(Boolean)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-2 py-2 border-t border-gray-200 flex items-center justify-between">
            <div className="text-[11px] text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} expenses
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

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-red-600" />
                Add New Expense
              </h2>
              <button
                onClick={handleAddCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Expense Account *
                  </label>
                  <select
                    value={expenseForm.expense_account_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_account_id: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select expense account</option>
                    {expenseAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      required
                      className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={expenseForm.supplier_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplier_id: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.company_name} ({supplier.supplier_code})
                      </option>
                    ))}
                  </select>
                </div>


                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter expense description..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Reference *
                  </label>
                  <input
                    type="text"
                    value={expenseForm.reference}
                    onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reference number or code"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAddCancel}
                  className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 text-[11px] bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Payment Modal */}
      {showUpdatePaymentModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Update Payment
              </h2>
              <button
                onClick={handleUpdatePaymentCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Expense Details
                </label>
                <div className="bg-gray-50 p-2 rounded text-[11px] space-y-1">
                  {selectedExpense.journal_entry && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-medium">{selectedExpense.journal_entry.reference || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedExpense.journal_entry.total_debit, 'USD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(selectedExpense.amount_paid || 0, 'USD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance:</span>
                        <span className={`font-medium ${
                          (selectedExpense.balance || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(selectedExpense.balance || selectedExpense.journal_entry.total_debit, 'USD')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium">{selectedExpense.journal_entry.description || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedExpense.balance || selectedExpense.journal_entry?.total_debit || 0}
                    value={updatePaymentForm.amount}
                    onChange={(e) => setUpdatePaymentForm({ ...updatePaymentForm, amount: e.target.value })}
                    required
                    className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-500">
                  Maximum: {formatCurrency(selectedExpense.balance || selectedExpense.journal_entry?.total_debit || 0, 'USD')}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={updatePaymentForm.payment_method}
                  onChange={(e) => setUpdatePaymentForm({ ...updatePaymentForm, payment_method: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.code}>
                      {method.name} ({method.code})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-500">
                  This will record a payment against the expense
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleUpdatePaymentCancel}
                  className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayment}
                  className="px-3 py-1.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingPayment ? 'Updating...' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistoryModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                Payment History
              </h2>
              <button
                onClick={handleClosePaymentHistory}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {/* Expense Summary */}
              {selectedExpense.journal_entry && (
                <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-[12px] font-semibold text-gray-700 mb-2">Expense Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-gray-600">Reference:</span>
                      <p className="font-medium">{selectedExpense.journal_entry.reference || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-medium text-red-600">{formatCurrency(selectedExpense.journal_entry.total_debit, 'USD')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount Paid:</span>
                      <p className="font-medium text-blue-600">{formatCurrency(selectedExpense.amount_paid || 0, 'USD')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance:</span>
                      <p className={`font-medium ${
                        (selectedExpense.balance || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(selectedExpense.balance || selectedExpense.journal_entry.total_debit, 'USD')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History Table */}
              {loadingPaymentHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-gray-500">
                  No payment history found for this expense.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Entry Number</th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Payment Method</th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((entry) => {
                        const paymentLine = entry.lines?.find(line => 
                          line.credit_amount > 0 && line.account?.account_type === 9
                        )
                        const paymentMethod = paymentLine?.account
                        
                        return (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-[11px] text-gray-900">{formatDate(entry.entry_date.toString())}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <span className="text-[11px] text-gray-600 font-mono">{entry.entry_number}</span>
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap text-right">
                              <span className="text-[11px] font-medium text-green-600">
                                {formatCurrency(entry.total_credit, 'USD')}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <span className="text-[11px] text-gray-600">{paymentMethod?.name || 'N/A'}</span>
                              {paymentMethod?.code && (
                                <span className="text-[10px] text-gray-400 ml-1">({paymentMethod.code})</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">
                              <span className="text-[11px] text-gray-600 line-clamp-2" title={entry.description || ''}>
                                {entry.description || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-2 py-1.5 text-right text-[11px] font-semibold text-gray-700">
                          Total Paid:
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="text-[11px] font-semibold text-green-600">
                            {formatCurrency(
                              paymentHistory.reduce((sum, entry) => sum + (entry.total_credit || 0), 0),
                              'USD'
                            )}
                          </span>
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleClosePaymentHistory}
                className="px-3 py-1.5 text-[11px] bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
