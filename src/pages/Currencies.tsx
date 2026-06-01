import { useState, useEffect } from 'react'
import { adminApiService, Currency } from '../services/api'
import { DollarSign, Search, Edit, Trash2, Plus, XCircle, Star } from 'lucide-react'

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
  currency: Currency | null
  onSave: (data: Partial<Currency>) => Promise<void>
}

const CurrencyModal: React.FC<CurrencyModalProps> = ({ isOpen, onClose, currency, onSave }) => {
  const [formData, setFormData] = useState({ name: '', country: '', symbol: '', code: '', status: 'active' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && currency) {
      setFormData({
        name: currency.name || '',
        country: currency.country || '',
        symbol: currency.symbol || '',
        code: currency.code || '',
        status: currency.status || 'active',
      })
    } else if (isOpen) {
      setFormData({ name: '', country: '', symbol: '', code: '', status: 'active' })
    }
  }, [isOpen, currency?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave({ ...formData, code: formData.code || null })
      onClose()
    } catch (error: any) {
      alert(error?.message || 'Failed to save currency')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-3 w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold">{currency ? 'Edit Currency' : 'Add Currency'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Currency Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              required
              placeholder="e.g. Comoros Franc"
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Country *</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))}
              required
              placeholder="e.g. Comoros"
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Symbol *</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData(p => ({ ...p, symbol: e.target.value }))}
                required
                placeholder="e.g. CF"
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                placeholder="e.g. KMF"
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-1 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-2 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : currency ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Currencies: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [settingDefault, setSettingDefault] = useState<number | null>(null)

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getCurrencies()
      setCurrencies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching currencies:', error)
      setCurrencies([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = currencies.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const defaultCurrency = currencies.find(c => c.is_default === 1)

  const handleSave = async (data: Partial<Currency>) => {
    if (editingCurrency) {
      await adminApiService.updateCurrency(editingCurrency.id, data)
    } else {
      await adminApiService.createCurrency(data)
    }
    await fetchCurrencies()
  }

  const handleSetDefault = async (id: number) => {
    try {
      setSettingDefault(id)
      await adminApiService.setDefaultCurrency(id)
      await fetchCurrencies()
    } catch (error: any) {
      alert(error?.message || 'Failed to set default currency')
    } finally {
      setSettingDefault(null)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApiService.deleteCurrency(id)
      setDeleteConfirm(null)
      await fetchCurrencies()
    } catch (error: any) {
      alert(error?.message || 'Failed to delete currency')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full">
        <div className="mb-2 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
              Currencies
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Manage currencies and exchange symbols</p>
          </div>
          <button
            onClick={() => { setEditingCurrency(null); setIsModalOpen(true) }}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Add Currency
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-2">
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 rounded">
                <DollarSign className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Total Currencies</p>
                <p className="text-sm font-bold text-gray-900">{currencies.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 rounded">
                <DollarSign className="h-2.5 w-2.5 text-green-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Active</p>
                <p className="text-sm font-bold text-gray-900">{currencies.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-1 bg-yellow-100 rounded">
                <Star className="h-2.5 w-2.5 text-yellow-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Default</p>
                <p className="text-sm font-bold text-gray-900 truncate max-w-[80px]">
                  {defaultCurrency ? `${defaultCurrency.symbol} ${defaultCurrency.code || defaultCurrency.name}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search by currency name, country, symbol, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
            />
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Currency Name</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Default</th>
                  <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((currency, index) => (
                  <tr key={currency.id} className={`hover:bg-gray-50 ${currency.is_default === 1 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-1.5 py-1 text-[11px] text-gray-500">{index + 1}</td>
                    <td className="px-1.5 py-1 text-[11px] font-medium text-gray-900 flex items-center gap-1">
                      {currency.is_default === 1 && (
                        <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                      {currency.name}
                    </td>
                    <td className="px-1.5 py-1 text-[11px] text-gray-900">{currency.country}</td>
                    <td className="px-1.5 py-1 text-[11px] text-gray-900 font-semibold">{currency.symbol}</td>
                    <td className="px-1.5 py-1 text-[11px] text-gray-900">{currency.code || '—'}</td>
                    <td className="px-1.5 py-1">
                      <span className={`inline-flex px-1 py-0.5 text-[10px] font-semibold rounded ${
                        currency.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currency.status}
                      </span>
                    </td>
                    <td className="px-1.5 py-1">
                      {currency.is_default === 1 ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-semibold rounded bg-yellow-100 text-yellow-800">
                          <Star className="h-2 w-2 fill-yellow-500 text-yellow-500" />
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(currency.id)}
                          disabled={settingDefault === currency.id}
                          className="text-[10px] text-gray-500 hover:text-yellow-600 hover:underline disabled:opacity-50 flex items-center gap-0.5"
                          title="Set as default currency"
                        >
                          <Star className="h-2.5 w-2.5" />
                          {settingDefault === currency.id ? 'Setting...' : 'Set Default'}
                        </button>
                      )}
                    </td>
                    <td className="px-1.5 py-1 text-[11px] font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCurrency(currency); setIsModalOpen(true) }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5"
                        >
                          <Edit className="h-2.5 w-2.5" />Edit
                        </button>
                        {deleteConfirm === currency.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(currency.id)} className="text-red-600 hover:text-red-900 text-[10px]">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 hover:text-gray-700 text-[10px]">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(currency.id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-0.5"
                          >
                            <Trash2 className="h-2.5 w-2.5" />Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-6">
              <DollarSign className="mx-auto h-5 w-5 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No currencies found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {searchTerm ? 'Try adjusting your search.' : 'Get started by adding a currency.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => { setEditingCurrency(null); setIsModalOpen(true) }}
                  className="mt-2 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
                >
                  Add First Currency
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <CurrencyModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCurrency(null) }}
        currency={editingCurrency}
        onSave={handleSave}
      />
    </div>
  )
}

export default Currencies
