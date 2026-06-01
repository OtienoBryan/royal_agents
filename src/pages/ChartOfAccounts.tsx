import React, { useState, useEffect, useRef } from 'react'
import { adminApiService, ChartOfAccount, AccountType } from '../services/api'
import {
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  FileText,
  Filter
} from 'lucide-react'

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    account_type: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    account_type: ''
  })

  const limit = 10

  // Load account types once on mount
  useEffect(() => {
    loadAccountTypes()
  }, [])

  // Reload data only when filter changes (not when page changes - frontend pagination)
  useEffect(() => {
    console.log('📊 [ChartOfAccounts] useEffect triggered - filter:', accountTypeFilter)
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountTypeFilter])
  
  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm && page > 1) {
      console.log('📊 [ChartOfAccounts] Search term changed, resetting to page 1')
      setPage(1)
    }
  }, [searchTerm])

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
    try {
      setLoading(true)
      const accountType = accountTypeFilter !== 'all' ? Number(accountTypeFilter) : undefined
      console.log('📊 [ChartOfAccounts] Loading all data (frontend pagination):', { accountType, accountTypeFilter })
      
      // Request all accounts - no pagination params
      const result = await adminApiService.getChartOfAccounts(1, 0, accountType)
      
      console.log('📊 [ChartOfAccounts] Received all accounts:', result?.accounts?.length)
      
      const accountsToSet = result?.accounts || []
      // Total will be calculated from filtered accounts on frontend
      const totalToSet = accountsToSet.length
      
      console.log('📊 [ChartOfAccounts] Setting state - all accounts:', accountsToSet.length)
      setAccounts(accountsToSet)
      setTotal(totalToSet)
    } catch (error) {
      console.error('❌ [ChartOfAccounts] Error loading chart of accounts:', error)
      console.error('❌ [ChartOfAccounts] Error details:', JSON.stringify(error, null, 2))
      setAccounts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // Client-side pagination and filtering
  const filteredAccounts = (accounts || []).filter(account => {
    const matchesSearch = 
      account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  // Apply client-side pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex)
  
  // Reset to page 1 ONLY when account type filter actually changes
  const prevAccountTypeFilterRef = useRef(accountTypeFilter)
  useEffect(() => {
    if (prevAccountTypeFilterRef.current !== accountTypeFilter && page !== 1) {
      console.log('📊 [ChartOfAccounts] Account type filter changed, resetting to page 1')
      setPage(1)
    }
    prevAccountTypeFilterRef.current = accountTypeFilter
  }, [accountTypeFilter])
  
  // Log page changes for debugging
  useEffect(() => {
    console.log('📊 [ChartOfAccounts] Page state changed to:', page, '- this should trigger loadData')
  }, [page])
  
  // Log page changes for debugging
  useEffect(() => {
    console.log('📊 [ChartOfAccounts] Page changed to:', page)
  }, [page])

  // Log filtered accounts for debugging
  useEffect(() => {
    console.log('📊 [ChartOfAccounts] Filtered accounts update:', {
      totalAccounts: accounts.length,
      filteredCount: filteredAccounts.length,
      searchTerm,
      accountTypeFilter
    })
    if (filteredAccounts.length > 0) {
      console.log('📊 [ChartOfAccounts] First filtered account:', filteredAccounts[0])
    }
  }, [accounts.length, filteredAccounts.length, searchTerm, accountTypeFilter])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addForm.name || !addForm.code || !addForm.account_type) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      await adminApiService.createChartOfAccount({
        name: addForm.name.trim(),
        code: addForm.code.trim(),
        account_type: Number(addForm.account_type)
      })
      await loadData()
      setShowAddModal(false)
      setAddForm({
        name: '',
        code: '',
        account_type: ''
      })
      alert('Chart of account created successfully!')
    } catch (error: any) {
      console.error('Error creating chart of account:', error)
      alert(error?.message || 'Failed to create chart of account. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddForm({
      name: '',
      code: '',
      account_type: ''
    })
  }

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account)
    setEditForm({
      name: account.name,
      code: account.code,
      account_type: account.account_type.toString()
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return

    try {
      setSaving(true)
      await adminApiService.updateChartOfAccount(editingAccount.id, {
        name: editForm.name.trim(),
        code: editForm.code.trim(),
        account_type: Number(editForm.account_type)
      })
      await loadData()
      setShowEditModal(false)
      setEditingAccount(null)
      setEditForm({
        name: '',
        code: '',
        account_type: ''
      })
      alert('Chart of account updated successfully!')
    } catch (error: any) {
      console.error('Error updating chart of account:', error)
      alert(error?.message || 'Failed to update chart of account. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingAccount(null)
    setEditForm({
      name: '',
      code: '',
      account_type: ''
    })
  }

  const handleDelete = async (account: ChartOfAccount) => {
    if (!confirm(`Are you sure you want to delete ${account.name}?`)) {
      return
    }

    try {
      await adminApiService.deleteChartOfAccount(account.id)
      await loadData()
      alert('Chart of account deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting chart of account:', error)
      alert(error?.message || 'Failed to delete chart of account. Please try again.')
    }
  }

  const getAccountTypeName = (accountTypeId: number): string => {
    const accountType = (accountTypes || []).find(type => type.id === accountTypeId)
    return accountType ? accountType.name : `Type ${accountTypeId}`
  }

  if (loading && accounts.length === 0) {
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
            Chart of Accounts
          </h1>
          <p className="text-[11px] text-gray-600">Manage chart of accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add Account
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <select
              value={accountTypeFilter}
              onChange={(e) => {
                setAccountTypeFilter(e.target.value)
                setPage(1)
              }}
              className="pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Account Types</option>
              {(accountTypes || []).map(type => (
                <option key={type.id} value={type.id.toString()}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Code</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Account Type</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {loading ? 'Loading...' : filteredAccounts.length === 0 ? 'No accounts found. Add your first account to get started.' : 'No accounts on this page.'}
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-gray-900">{account.name}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600 font-mono">{account.code}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600">{getAccountTypeName(account.account_type)}</span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(account)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-2 py-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} accounts
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  Previous
                </button>
                <span className="text-[11px] text-gray-600 px-2">
                  Page {page} of {Math.ceil(filteredAccounts.length / limit)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= filteredAccounts.length}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(Math.ceil(filteredAccounts.length / limit))}
                  disabled={page * limit >= filteredAccounts.length}
                  className="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  Last
                </button>
              </div>
            </div>
            {/* Page number buttons */}
            {Math.ceil(filteredAccounts.length / limit) > 1 && (
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {Array.from({ length: Math.min(5, Math.ceil(filteredAccounts.length / limit)) }, (_, i) => {
                  let pageNum: number;
                  const totalPages = Math.ceil(filteredAccounts.length / limit);
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-2 py-1 text-[11px] border rounded ${
                        page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-sm font-semibold text-gray-900">Add Chart of Account</h2>
              <button
                onClick={handleAddCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Account Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.code}
                  onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.account_type}
                  onChange={(e) => setAddForm({ ...addForm, account_type: e.target.value })}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map(type => (
                    <option key={type.id} value={type.id.toString()}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-[11px] rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleAddCancel}
                  className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-[11px] rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-sm font-semibold text-gray-900">Edit Chart of Account</h2>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Account Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.account_type}
                  onChange={(e) => setEditForm({ ...editForm, account_type: e.target.value })}
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map(type => (
                    <option key={type.id} value={type.id.toString()}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-[11px] rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-[11px] rounded hover:bg-gray-300"
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

export default ChartOfAccounts
