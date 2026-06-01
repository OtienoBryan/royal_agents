import React, { useState, useEffect } from 'react';
import { adminApiService, Category, SubCategory } from '../services/api';
import { X, Save, Trash2, Edit, Plus } from 'lucide-react';

interface SubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSubCategoryChange: () => void;
}

const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSubCategoryChange
}) => {
  console.log('SubCategoryModal rendered with props:', { isOpen, category: category?.name, categoryId: category?.id });
  
  const [subcategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen && category) {
      loadSubCategories();
    }
  }, [isOpen, category]);

  const loadSubCategories = async () => {
    if (!category) {
      console.log('No category provided to loadSubCategories');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading subcategories for category:', category.id, category.name);
      const data = await adminApiService.getSubCategories(category.id);
      console.log('Loaded subcategories:', data);
      console.log('Number of subcategories:', data.length);
      setSubCategories(data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      const err = error as any;
      console.error('Error details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    try {
      const subCategoryData = {
        ...formData,
        categoryId: category.id
      };

      if (editingSubCategory) {
        await adminApiService.updateSubCategory(editingSubCategory.id, subCategoryData);
      } else {
        await adminApiService.createSubCategory(subCategoryData);
      }

      resetForm();
      loadSubCategories();
      onSubCategoryChange();
    } catch (error) {
      console.error('Error saving subcategory:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setEditingSubCategory(null);
    setShowForm(false);
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description,
      isActive: subCategory.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this subcategory?')) {
      try {
        await adminApiService.deleteSubCategory(id);
        loadSubCategories();
        onSubCategoryChange();
      } catch (error) {
        console.error('Error deleting subcategory:', error);
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await adminApiService.toggleSubCategoryStatus(id);
      loadSubCategories();
      onSubCategoryChange();
    } catch (error) {
      console.error('Error toggling subcategory status:', error);
    }
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="admin-card rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Subcategories
            </h2>
            <p className="text-gray-600 mt-1">
              Category: <span className="font-semibold">{category.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddForm}
              className="admin-button px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Subcategory
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Subcategories List */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by adding your first subcategory for this category.
                </p>
                <button
                  onClick={openAddForm}
                  className="admin-button px-6 py-3 rounded-lg text-white font-semibold"
                >
                  Add First Subcategory
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {subcategories.map((subCategory) => (
                  <div
                    key={subCategory.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-blue-600 text-lg font-semibold">
                            {subCategory.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{subCategory.name}</h4>
                          <p className="text-sm text-gray-600">
                            {subCategory.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              subCategory.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subCategory.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ID: {subCategory.id}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(subCategory.id)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            subCategory.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {subCategory.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEdit(subCategory)}
                          className="action-button edit"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subCategory.id)}
                          className="action-button delete"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Sidebar */}
          {showForm && (
            <div className="w-96 border-l bg-gray-50 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSubCategory ? 'Edit Subcategory' : 'Add Subcategory'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                    required
                    placeholder="Enter subcategory name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                    placeholder="Enter subcategory description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                    id="isActive"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-button flex-1 px-4 py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingSubCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCategoryModal;
