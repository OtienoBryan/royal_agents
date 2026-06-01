import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteBrandModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  brandName: string
}

const DeleteBrandModal: React.FC<DeleteBrandModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  brandName
}) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error deleting brand:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Delete Brand</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Are you sure you want to delete this brand?
              </h3>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              This action will permanently delete the brand <strong>"{brandName}"</strong> and cannot be undone.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Any products associated with this brand will have their brand reference removed.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Brand'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteBrandModal
