import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, Booking, BookingPassenger } from '../services/api'
import { ArrowLeft, Calendar, FileText, DollarSign } from 'lucide-react'

const InvoiceDetailsPage: React.FC = () => {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const [bookingPassengers, setBookingPassengers] = useState<BookingPassenger[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (date) {
      loadData()
    }
  }, [date])

  const loadData = async () => {
    if (!date) return

    try {
      setLoading(true)
      
      // Fetch all bookings with bookingPassengers
      const result = await adminApiService.getBookings(1, 10000)
      setAllBookings(result.bookings)
      
      // Extract all booking passengers
      const allBookingPassengers: BookingPassenger[] = []
      result.bookings.forEach(booking => {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          booking.bookingPassengers.forEach(bp => {
            allBookingPassengers.push(bp)
          })
        }
      })
      
      // Filter by date
      const dateKey = date // date is already in YYYY-MM-DD format from URL
      const filtered = allBookingPassengers.filter(bp => {
        const bpDate = new Date(bp.created_at)
        const bpDateKey = bpDate.toISOString().split('T')[0]
        return bpDateKey === dateKey
      })
      
      setBookingPassengers(filtered)
    } catch (error) {
      console.error('Error loading invoice details:', error)
      setBookingPassengers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBookingForPassenger = (bookingId: number): Booking | undefined => {
    return allBookings.find(b => b.id === bookingId)
  }

  const totalAmount = bookingPassengers.reduce((sum, bp) => sum + Number(bp.fare_amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/invoices')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Back to Invoices"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Invoice Details
            </h1>
            {date && (
              <div className="mt-0.5">
                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDate(date)}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {bookingPassengers.length} passenger{bookingPassengers.length !== 1 ? 's' : ''} • Total: <span className="font-medium text-green-600">{formatCurrency(totalAmount)}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {bookingPassengers.length > 0 && (
          <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-blue-100 rounded">
                  <FileText className="h-2.5 w-2.5 text-blue-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Passengers</p>
                  <p className="text-sm font-bold text-gray-900">{bookingPassengers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-green-100 rounded">
                  <DollarSign className="h-2.5 w-2.5 text-green-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Total Amount</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-1.5">
              <div className="flex items-center">
                <div className="p-1 bg-purple-100 rounded">
                  <DollarSign className="h-2.5 w-2.5 text-purple-600" />
                </div>
                <div className="ml-1.5">
                  <p className="text-[11px] font-medium text-gray-600">Average per Passenger</p>
                  <p className="text-sm font-bold text-gray-900">
                    {bookingPassengers.length > 0 ? formatCurrency(totalAmount / bookingPassengers.length) : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {bookingPassengers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-1 text-[11px] font-medium text-gray-900">No records found</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                No booking passengers found for this date.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                      Passenger Name
                    </th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                      Booking Ref
                    </th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                      Fare Amount
                    </th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookingPassengers.map((bp) => {
                    const booking = getBookingForPassenger(bp.booking_id)
                    const passengerName = bp.passenger?.name || 'N/A'
                    
                    return (
                      <tr key={bp.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="text-[11px] text-gray-900">{passengerName}</span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            bp.passenger_type === 'adult' 
                              ? 'bg-blue-100 text-blue-800'
                              : bp.passenger_type === 'child'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {bp.passenger_type}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="text-[11px] text-gray-600">
                            {booking?.booking_reference || `#${bp.booking_id}`}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-right">
                          <span className="text-[11px] font-medium text-gray-900">
                            {formatCurrency(Number(bp.fare_amount || 0))}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="text-[11px] text-gray-600">
                            {formatDateTime(bp.created_at)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {bookingPassengers.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-2 py-1.5 text-[11px] font-bold text-gray-900">
                        Total ({bookingPassengers.length} records)
                      </td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-bold text-gray-900">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetailsPage

