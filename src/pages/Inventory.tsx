import { useState, useEffect } from 'react'
import { adminApiService } from '../services/api'
import { Package, Search, Edit3, Save, X, Store, Box } from 'lucide-react'

interface InventoryItem {
  id: number
  store_id: number
  product_id: number
  quantity: number
  product_name: string
  store_name: string
}

interface Store {
  id: number
  store_name: string
  address?: string
  contact?: string
  is_active: boolean
}

interface Product {
  id: number
  product_name: string
  product_code: string
  category: string
  selling_price: number
  current_stock: number
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [savingItem, setSavingItem] = useState<number | null>(null)

  useEffect(() => {
    fetchInventory()
    fetchStores()
    fetchProducts()
  }, [])

  const fetchInventory = async () => {
    try {
      console.log('🔍 [Inventory] Starting to fetch inventory data...')
      setLoading(true)
      const data = await adminApiService.getInventory()
      console.log('✅ [Inventory] Successfully fetched inventory data:', data)
      // Ensure data is always an array
      const inventoryArray = Array.isArray(data) ? data : []
      console.log('🔍 [Inventory] Sample inventory items:', inventoryArray.slice(0, 3))
      console.log('🔍 [Inventory] Unique store IDs in inventory:', [...new Set(inventoryArray.map(item => item.store_id))])
      setInventory(inventoryArray)
    } catch (error) {
      console.error('❌ [Inventory] Error fetching inventory:', error)
      const err = error as any
      console.error('❌ [Inventory] Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      console.log('🏪 [Inventory] Starting to fetch stores data...')
      const data = await adminApiService.getStores()
      console.log('✅ [Inventory] Successfully fetched stores data:', data)
      // Ensure data is always an array
      const storesArray = Array.isArray(data) ? data : []
      console.log('🏪 [Inventory] Store IDs:', storesArray.map(store => ({ id: store.id, name: store.store_name })))
      setStores(storesArray)
    } catch (error) {
      console.error('❌ [Inventory] Error fetching stores:', error)
      const err = error as any
      console.error('❌ [Inventory] Stores error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      })
    }
  }

  const fetchProducts = async () => {
    try {
      console.log('📦 [Inventory] Starting to fetch products data...')
      const data = await adminApiService.getProducts()
      console.log('✅ [Inventory] Successfully fetched products data:', data)
      // Ensure data is always an array
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Inventory] Error fetching products:', error)
      const err = error as any
      console.error('❌ [Inventory] Products error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      })
      // Set empty array on error to prevent crashes
      setProducts([])
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.quantity)
  }

  const handleSave = async (id: number) => {
    try {
      console.log('💾 [Inventory] Updating inventory quantity:', { id, quantity: editQuantity })
      
      // Validate quantity
      if (editQuantity < 0) {
        alert('Quantity cannot be negative')
        return
      }
      
      // Show saving state for this specific item
      setSavingItem(id)
      
      const result = await adminApiService.updateInventoryQuantity(id, editQuantity)
      console.log('✅ [Inventory] Successfully updated inventory quantity:', result)
      
      // Update local state
      setInventory(prev => 
        prev.map(item => 
          item.id === id ? { ...item, quantity: editQuantity } : item
        )
      )
      
      // Reset editing state
      setEditingItem(null)
      setEditQuantity(0)
      
      // Show success message
      console.log('🎉 [Inventory] Update completed successfully')
      
    } catch (error) {
      console.error('❌ [Inventory] Error updating inventory:', error)
      const err = error as any
      console.error('❌ [Inventory] Update error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      })
      
      // Show error message to user
      alert(`Failed to update inventory: ${err.message || 'Unknown error'}`)
    } finally {
      setSavingItem(null)
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditQuantity(0)
  }

  const filteredInventory = inventory.filter(item => {
    const productName = item.product_name?.toLowerCase() || ''
    const storeName = item.store_name?.toLowerCase() || ''
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = productName.includes(searchLower) || storeName.includes(searchLower)
    const matchesStore = selectedStore === null || item.store_id === selectedStore
    const matchesProduct = selectedProduct === null || item.product_id === selectedProduct
    
    // Debug logging
    if (selectedStore !== null) {
      console.log('🔍 [Inventory] Filtering by store:', {
        selectedStore,
        itemStoreId: item.store_id,
        itemStoreName: item.store_name,
        matchesStore,
        item: item
      })
    }
    
    return matchesSearch && matchesStore && matchesProduct
  })

  const totalItems = filteredInventory.length
  const totalQuantity = filteredInventory.reduce((sum, item) => sum + item.quantity, 0)
  const lowStockItems = filteredInventory.filter(item => item.quantity < 10).length

  // Debug logging for filtering results
  console.log('📊 [Inventory] Filtering summary:', {
    totalInventoryItems: inventory.length,
    filteredItems: filteredInventory.length,
    selectedStore,
    selectedProduct,
    searchTerm,
    storesCount: stores.length,
    productsCount: products.length
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-2">Manage product quantities across all stores</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 hidden">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Box className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Store className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products or stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedStore || ''}
              onChange={(e) => {
                const storeId = e.target.value ? Number(e.target.value) : null
                console.log('🏪 [Inventory] Store selection changed:', {
                  selectedValue: e.target.value,
                  parsedStoreId: storeId,
                  selectedStore: selectedStore
                })
                setSelectedStore(storeId)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Stores</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.store_name}</option>
              ))}
            </select>
            <select
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Products</option>
              {Array.isArray(products) && products.map(product => (
                <option key={product.id} value={product.id}>{product.product_name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedStore(null)
                setSelectedProduct(null)
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.store_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className={`text-sm font-medium ${
                          item.quantity < 10 ? 'text-red-600' : 
                          item.quantity < 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {item.quantity.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.quantity < 10 ? 'bg-red-100 text-red-800' :
                        item.quantity < 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.quantity < 10 ? 'Low Stock' :
                         item.quantity < 50 ? 'Medium Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingItem === item.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(item.id)}
                            disabled={savingItem === item.id}
                            className={`${savingItem === item.id ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'} transition-colors`}
                          >
                            {savingItem === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={savingItem === item.id}
                            className={`${savingItem === item.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'} transition-colors`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
