import React from 'react'
import { 
  ShoppingCart,
  Download,
  X,
  User,
  Phone,
  Mail,
  Package,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import { InvoiceData } from '../services/api'

interface OrderDetailsModalProps {
  isOpen: boolean
  order: InvoiceData | null
  items: any[]
  loadingItems: boolean
  onClose: () => void
  onExportPDF: () => void
  formatDate: (date: Date | string | null) => string
  formatCurrency: (amount: number) => string
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  order,
  items,
  loadingItems,
  onClose,
  onExportPDF,
  formatDate,
  formatCurrency,
}) => {
  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Customer Order Details - {order.soNumber}
              </h2>
              <p className="text-sm text-gray-600">
                {formatDate(order.orderDate)} • {order.clientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close order details"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Customer Order #{order.soNumber}
                  </h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Order Date: {formatDate(order.orderDate)}</div>
                    <div>Status: {order.status}</div>
                    <div>My Status: {order.myStatus}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Customer Details</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-sm text-gray-900">{order.clientName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.clientEmail}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.clientPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax Amount:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(order.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="text-sm font-bold text-gray-900">Total:</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h3>

              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading order items...</span>
                </div>
              ) : items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-bold text-gray-600 text-sm">Product</th>
                        <th className="text-center py-3 px-4 font-bold text-gray-600 text-sm">Qty</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600 text-sm">Unit Price</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600 text-sm">Tax</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600 text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id || index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              {item.taxType && (
                                <div className="text-sm text-gray-500">Tax Type: {item.taxType}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 font-medium">{item.quantity}</td>
                          <td className="py-4 px-4 text-right text-gray-900 font-medium">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-4 px-4 text-right text-gray-900 font-medium">{formatCurrency(item.taxAmount)}</td>
                          <td className="py-4 px-4 text-right font-bold text-gray-900">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No order items found for this order.</p>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Order Totals
                </h3>

                <div className="max-w-md ml-auto">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items Subtotal:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(items.reduce((sum, item) => sum + (item.totalPrice - (item.taxAmount || 0) || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax Total:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(items.reduce((sum, item) => sum + (item.taxAmount || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-3">
                      <span className="text-gray-900">Grand Total:</span>
                      <span className="text-blue-600">
                        {formatCurrency(items.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t-2 border-gray-200 pt-4">
              <div className="text-center text-xs text-gray-500">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsModal


