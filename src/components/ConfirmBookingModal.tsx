import React, { useState, useEffect } from 'react'
import { XCircle, DollarSign, Users } from 'lucide-react'
import { FlightSeries as FlightSeriesType, Passenger, Agency, Account } from '../services/api'

interface PassengerFormData {
  name: string
  email: string
  contact: string
  nationality: string
  identification: string
  age: string
  title: string
  passenger_type: 'adult' | 'child' | 'infant'
}

interface ConfirmBookingModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: {
    id: number
    flight_series_id: number
    flightSeries?: FlightSeriesType | null
    passenger_name: string
    passenger_email?: string | null
    passenger_phone?: string | null
    number_of_seats: number
  } | null
  flightSeries: FlightSeriesType[]
  passengers: Passenger[]
  agencies: Agency[]
  accounts: Account[]
  onConfirm: (bookingData: {
    flight_series_id: number
    seat_reservation_id?: number
    passengers: PassengerFormData[]
    payment_method: string
    booking_date: string
    agency_id?: number | null
    payment_account_id?: number | null
    notes?: string
  }) => Promise<void>
}

const PASSENGER_TYPES = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'infant', label: 'Infant' }
]

const TITLES = [
  { value: '', label: 'Select Title' },
  { value: 'Mr', label: 'Mr.' },
  { value: 'Mrs', label: 'Mrs.' },
  { value: 'Ms', label: 'Ms.' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Dr', label: 'Dr.' },
  { value: 'Prof', label: 'Prof.' }
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online Payment' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'other', label: 'Other' }
]

const ConfirmBookingModal: React.FC<ConfirmBookingModalProps> = ({
  isOpen,
  onClose,
  reservation,
  flightSeries,
  passengers: _passengers,
  agencies,
  accounts,
  onConfirm
}) => {
  const [numberOfPassengers, setNumberOfPassengers] = useState(1)
  const [passengerForms, setPassengerForms] = useState<PassengerFormData[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [bookingDate, setBookingDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedFlightSeries, setSelectedFlightSeries] = useState<FlightSeriesType | null>(null)
  const [selectedAgency, setSelectedAgency] = useState<number | null>(null)
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [agencyBalanceError, setAgencyBalanceError] = useState<string | null>(null)

  // Initialize passenger forms when number of passengers changes
  useEffect(() => {
    if (numberOfPassengers > 0) {
      const newForms: PassengerFormData[] = []
      for (let i = 0; i < numberOfPassengers; i++) {
        if (passengerForms[i]) {
          newForms.push(passengerForms[i])
        } else {
          newForms.push({
            name: i === 0 && reservation ? (reservation.passenger_name || '') : '',
            email: i === 0 && reservation ? (reservation.passenger_email || '') : '',
            contact: i === 0 && reservation ? (reservation.passenger_phone || '') : '',
            nationality: '',
            identification: '',
            age: '',
            title: '',
            passenger_type: 'adult'
          })
        }
      }
      setPassengerForms(newForms.slice(0, numberOfPassengers))
    }
  }, [numberOfPassengers])

  // Helper to format date for input[type="date"]
  const formatDate = (dateInput: Date | string | null) => {
    if (!dateInput) return ''
    const date = new Date(dateInput)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    if (isOpen && reservation) {
      // Find the flight series
      const fs = flightSeries.find(f => f.id === reservation.flight_series_id)
      setSelectedFlightSeries(fs || null)
      setNumberOfPassengers(reservation.number_of_seats || 1)
      setBookingDate(formatDate(new Date()))
    } else if (isOpen) {
      setNumberOfPassengers(1)
      setBookingDate(formatDate(new Date()))
      setSelectedFlightSeries(null)
    }
  }, [isOpen, reservation, flightSeries])

  // Calculate total fare
  const calculateTotalFare = (): number => {
    if (!selectedFlightSeries) return 0
    
    return passengerForms.reduce((total, passenger) => {
      let fare = 0
      switch (passenger.passenger_type) {
        case 'adult':
          fare = Number(selectedFlightSeries.adult_fare) || 0
          break
        case 'child':
          fare = Number(selectedFlightSeries.child_fare) || 0
          break
        case 'infant':
          fare = Number(selectedFlightSeries.infant_fare) || 0
          break
      }
      return total + fare
    }, 0)
  }

  const totalAmount = calculateTotalFare()

  // Check agency balance when agency or total amount changes
  useEffect(() => {
    if (selectedAgency && totalAmount > 0) {
      const agency = agencies.find(a => a.id === selectedAgency)
      if (agency) {
        const agencyBalance = Number(agency.balance) || 0
        if (agencyBalance < totalAmount) {
          const shortfall = totalAmount - agencyBalance
          setAgencyBalanceError(
            `Insufficient balance. Agency "${agency.name}" has ${agencyBalance.toFixed(2)}, but booking requires ${totalAmount.toFixed(2)}. Shortfall: ${shortfall.toFixed(2)}`
          )
        } else {
          setAgencyBalanceError(null)
        }
      }
    } else {
      setAgencyBalanceError(null)
    }
  }, [selectedAgency, totalAmount, agencies])

  const handlePassengerChange = (index: number, field: keyof PassengerFormData, value: string) => {
    const updatedForms = [...passengerForms]
    updatedForms[index] = {
      ...updatedForms[index],
      [field]: value
    }
    setPassengerForms(updatedForms)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      if (!selectedFlightSeries) {
        alert('Please select a flight series')
        return
      }

      // Validate all passengers have names
      const invalidPassengers = passengerForms.filter(p => !p.name.trim())
      if (invalidPassengers.length > 0) {
        alert('Please enter name for all passengers')
        return
      }

      const bookingData = {
        flight_series_id: selectedFlightSeries.id,
        seat_reservation_id: reservation?.id,
        passengers: passengerForms,
        payment_method: paymentMethod,
        booking_date: bookingDate,
        agency_id: selectedAgency || undefined,
        payment_account_id: selectedPaymentAccount || undefined,
        notes: notes || undefined
      }
      
      await onConfirm(bookingData)
      onClose()
    } catch (error) {
      console.error('Error confirming booking:', error)
      let errorMessage = 'Failed to confirm booking'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            Confirm Booking
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          {/* Flight Series Selection */}
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Flight Series *</label>
            <select
              value={selectedFlightSeries?.id || ''}
              onChange={(e) => {
                const fs = flightSeries.find(f => f.id === parseInt(e.target.value, 10))
                setSelectedFlightSeries(fs || null)
              }}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a flight series</option>
              {flightSeries.map(fs => (
                <option key={fs.id} value={String(fs.id)}>
                  {fs.flt} - {fs.flight_type}
                </option>
              ))}
            </select>
          </div>

          {/* Flight Series Info */}
          {selectedFlightSeries && (
            <div className="bg-blue-50 rounded p-1.5 mb-1.5">
              <div className="text-[11px] font-medium text-gray-700 mb-0.5">Flight Information</div>
              <div className="text-[11px] text-gray-900">
                <div><span className="font-medium">Flight:</span> {selectedFlightSeries.flt}</div>
                <div><span className="font-medium">Type:</span> {selectedFlightSeries.flight_type}</div>
                <div className="mt-0.5 text-[10px] text-gray-600">
                  Adult: ${(Number(selectedFlightSeries.adult_fare) || 0).toFixed(2)} | 
                  Child: ${(Number(selectedFlightSeries.child_fare) || 0).toFixed(2)} | 
                  Infant: ${(Number(selectedFlightSeries.infant_fare) || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Number of Passengers */}
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Number of Passengers *</label>
            <input
              type="number"
              value={numberOfPassengers}
              onChange={(e) => {
                const num = Math.max(1, parseInt(e.target.value, 10) || 1)
                setNumberOfPassengers(num)
              }}
              min="1"
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Passenger Forms */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3 w-3 text-gray-600" />
              <span className="text-[11px] font-medium text-gray-700">Passenger Details</span>
            </div>
            {passengerForms.map((passenger, index) => (
              <div key={index} className="border border-gray-200 rounded p-1.5 bg-gray-50">
                <div className="text-[11px] font-semibold text-gray-700 mb-1">Passenger {index + 1}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Title</label>
                    <select
                      value={passenger.title}
                      onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TITLES.map(title => (
                        <option key={title.value} value={title.value}>{title.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Name *</label>
                    <input
                      type="text"
                      value={passenger.name}
                      onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                      required
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Email</label>
                    <input
                      type="email"
                      value={passenger.email}
                      onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Contact</label>
                    <input
                      type="tel"
                      value={passenger.contact}
                      onChange={(e) => handlePassengerChange(index, 'contact', e.target.value)}
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Nationality</label>
                    <input
                      type="text"
                      value={passenger.nationality}
                      onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Identification</label>
                    <input
                      type="text"
                      value={passenger.identification}
                      onChange={(e) => handlePassengerChange(index, 'identification', e.target.value)}
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ID/Passport number"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Age</label>
                    <input
                      type="number"
                      value={passenger.age}
                      onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                      min="0"
                      max="150"
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Passenger Type *</label>
                    <select
                      value={passenger.passenger_type}
                      onChange={(e) => handlePassengerChange(index, 'passenger_type', e.target.value as 'adult' | 'child' | 'infant')}
                      required
                      className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PASSENGER_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          <div className="border-t border-gray-200 pt-1.5 mt-1.5">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-gray-600" />
              <span className="text-[11px] font-medium text-gray-700">Payment Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Booking Date *</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Agency Selection */}
            <div className="mt-1.5">
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Agency (Optional)</label>
              <select
                value={selectedAgency || ''}
                onChange={(e) => {
                  const agencyId = e.target.value ? parseInt(e.target.value, 10) : null
                  setSelectedAgency(agencyId)
                  if (!agencyId) {
                    setAgencyBalanceError(null)
                  }
                }}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an agency (optional)</option>
                {agencies.map(agency => {
                  const balance = Number(agency.balance) || 0
                  return (
                    <option key={agency.id} value={String(agency.id)}>
                      {agency.name} - Balance: {balance.toFixed(2)}
                    </option>
                  )
                })}
              </select>
              {selectedAgency && (
                <div className="mt-1">
                  {(() => {
                    const agency = agencies.find(a => a.id === selectedAgency)
                    if (!agency) return null
                    const balance = Number(agency.balance) || 0
                    const isInsufficient = balance < totalAmount
                    return (
                      <div className={`text-[10px] p-1 rounded ${isInsufficient ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <div className="font-medium">Agency Balance: {balance.toFixed(2)}</div>
                        <div>Booking Amount: {totalAmount.toFixed(2)}</div>
                        {isInsufficient && (
                          <div className="font-semibold mt-0.5">
                            ⚠️ Insufficient Balance! Shortfall: {(totalAmount - balance).toFixed(2)}
                          </div>
                        )}
                        {!isInsufficient && (
                          <div className="mt-0.5">✓ Sufficient balance available</div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
              {agencyBalanceError && (
                <div className="mt-1 text-[10px] text-red-600 bg-red-50 p-1 rounded border border-red-200">
                  {agencyBalanceError}
                </div>
              )}
            </div>

            {/* Payment Account Selection */}
            <div className="mt-1.5">
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Payment Account *</label>
              <select
                value={selectedPaymentAccount || ''}
                onChange={(e) => setSelectedPaymentAccount(e.target.value ? parseInt(e.target.value, 10) : null)}
                required
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select payment account</option>
                {accounts.map(account => (
                  <option key={account.id} value={String(account.id)}>
                    {account.name} ({account.code}) - Balance: {account.currency || 'USD'} {Number(account.balance).toFixed(2)}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-0.5">
                The booking payment amount will be automatically added to the selected account balance and recorded in the account ledger.
              </p>
            </div>
          </div>

          {/* Fare Calculation */}
          <div className="bg-gray-50 rounded p-1.5 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-gray-600" />
              <span className="text-[11px] font-medium text-gray-700">Fare Calculation</span>
            </div>
            <div className="space-y-0.5 text-[11px]">
              {passengerForms.map((passenger, index) => {
                let fare = 0
                if (selectedFlightSeries) {
                  switch (passenger.passenger_type) {
                    case 'adult':
                      fare = Number(selectedFlightSeries.adult_fare) || 0
                      break
                    case 'child':
                      fare = Number(selectedFlightSeries.child_fare) || 0
                      break
                    case 'infant':
                      fare = Number(selectedFlightSeries.infant_fare) || 0
                      break
                  }
                }
                return (
                  <div key={index} className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Passenger {index + 1} ({passenger.passenger_type}):</span>
                    <span className="font-medium">${fare.toFixed(2)}</span>
                  </div>
                )
              })}
              <div className="border-t border-gray-300 pt-0.5 flex justify-between">
                <span className="text-gray-900 font-semibold">Total Amount:</span>
                <span className="text-gray-900 font-bold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
              disabled={saving || !selectedFlightSeries || totalAmount === 0 || !selectedPaymentAccount || (selectedAgency !== null && agencyBalanceError !== null)}
              className="px-1.5 py-0.5 text-[11px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConfirmBookingModal
