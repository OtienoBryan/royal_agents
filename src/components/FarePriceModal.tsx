import React, { useState, useEffect } from 'react'
import { XCircle } from 'lucide-react'

interface FarePriceModalProps {
  isOpen: boolean
  onClose: () => void
  flightSeriesId: number
  flightNumber: string
  onSave: (flightSeriesId: number, farePrices: { adult_fare: number | null; child_fare: number | null; infant_fare: number | null }) => Promise<void>
  initialFarePrices?: {
    adult_fare: number | null
    child_fare: number | null
    infant_fare: number | null
  }
}

const FarePriceModal: React.FC<FarePriceModalProps> = ({
  isOpen,
  onClose,
  flightSeriesId,
  flightNumber,
  onSave,
  initialFarePrices
}) => {
  const [formData, setFormData] = useState({
    adult_fare: '',
    child_fare: '',
    infant_fare: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialFarePrices) {
        // Format numbers to remove unnecessary decimal places
        const formatPrice = (price: number | null | undefined): string => {
          if (price === null || price === undefined) return ''
          // Convert to number and format to 2 decimal places if needed
          const num = typeof price === 'number' ? price : parseFloat(String(price))
          if (isNaN(num)) return ''
          // Remove trailing zeros after decimal point
          return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '')
        }
        
        setFormData({
          adult_fare: formatPrice(initialFarePrices.adult_fare),
          child_fare: formatPrice(initialFarePrices.child_fare),
          infant_fare: formatPrice(initialFarePrices.infant_fare)
        })
      } else {
        setFormData({
          adult_fare: '',
          child_fare: '',
          infant_fare: ''
        })
      }
    }
  }, [isOpen, initialFarePrices])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      const farePrices = {
        adult_fare: formData.adult_fare ? parseFloat(formData.adult_fare) : null,
        child_fare: formData.child_fare ? parseFloat(formData.child_fare) : null,
        infant_fare: formData.infant_fare ? parseFloat(formData.infant_fare) : null
      }
      
      await onSave(flightSeriesId, farePrices)
      onClose()
    } catch (error) {
      console.error('Error saving fare prices:', error)
      let errorMessage = 'Failed to save fare prices'
      const err = error as any
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.serverMessage) {
        if (Array.isArray(err.serverMessage)) {
          errorMessage = err.serverMessage.join('\n')
        } else {
          errorMessage = err.serverMessage
        }
      }
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            Fare Prices - {flightNumber}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="space-y-1.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                Adult Fare
              </label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500">$</span>
                <input
                  type="text"
                  name="adult_fare"
                  value={formData.adult_fare}
                  onChange={handleChange}
                  className="w-full pl-5 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                Child Fare
              </label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500">$</span>
                <input
                  type="text"
                  name="child_fare"
                  value={formData.child_fare}
                  onChange={handleChange}
                  className="w-full pl-5 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                Infant Fare
              </label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-[11px] text-gray-500">$</span>
                <input
                  type="text"
                  name="infant_fare"
                  value={formData.infant_fare}
                  onChange={handleChange}
                  className="w-full pl-5 pr-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </div>
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
              {saving ? 'Saving...' : 'Save Fare Prices'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FarePriceModal

