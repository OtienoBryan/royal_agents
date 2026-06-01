import React, { useState, useEffect } from 'react'
import { adminApiService, Category } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  XCircle,
  Folder
} from 'lucide-react'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: Category | null
  onSave: (categoryData: Partial<Category>) => Promise<void>
  isEditing: boolean
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, onSave, isEditing }) => {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (isEditing && category) {
        setFormData({
          name: category.name || '',
          description: category.description || ''
        })
      } else {
        setFormData({
          name: '',
          description: ''
        })
      }
    }
  }, [isOpen, isEditing, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      alert(`Failed to save category: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category description"
            />
          </div>


          <div className="flex justify-end gap-1 pt-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<number | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      console.log('📁 [Categories] Fetching categories...')
      setLoading(true)
      const data = await adminApiService.getCategories()
      console.log('✅ [Categories] Categories fetched:', data)
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Categories] Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleSave = async (categoryData: Partial<Category>) => {
    try {
      if (editingCategory) {
        await adminApiService.updateCategory(editingCategory.id, categoryData)
      } else {
        await adminApiService.createCategory(categoryData as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>)
      }
      await fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingCategory(id)
      await adminApiService.deleteCategory(id)
      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(`Failed to delete category: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingCategory(null)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <Folder className="h-3.5 w-3.5 text-blue-600" />
              Categories
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Manage product categories</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Category
          </button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-1.5 mb-2">
          <div className="bg-white rounded shadow p-1.5">
            <div className="flex items-center">
              <div className="p-0.5 bg-blue-100 rounded">
                <Folder className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <div className="ml-1.5">
                <p className="text-[11px] font-medium text-gray-600">Total Categories</p>
                <p className="text-sm font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded shadow mb-2 p-1.5">
          <div className="relative">
            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
            <input
              type="text"
              placeholder="Search categories by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded shadow p-4 text-center">
            <Folder className="mx-auto h-5 w-5 text-gray-400" />
            <h3 className="mt-1 text-[11px] font-medium text-gray-900">No categories found</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded shadow overflow-hidden hover:shadow-lg transition-shadow p-2">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-0.5 bg-blue-100 rounded">
                      <Folder className="h-2.5 w-2.5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                    </div>
                  </div>
                </div>
                {category.description && (
                  <p className="text-[11px] text-gray-600 mb-1.5">{category.description}</p>
                )}
                {category.subcategories && category.subcategories.length > 0 && (
                  <p className="text-[10px] text-gray-500 mb-1.5">
                    {category.subcategories.length} subcategor{category.subcategories.length !== 1 ? 'ies' : 'y'}
                  </p>
                )}
                <div className="flex justify-end gap-1 mt-1.5">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit category"
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deletingCategory === category.id}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete category"
                  >
                    {deletingCategory === category.id ? (
                      <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-2.5 w-2.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCategory(null)
          }}
          category={editingCategory}
          onSave={handleSave}
          isEditing={!!editingCategory}
        />
      </div>
    </div>
  )
}

export default Categories

