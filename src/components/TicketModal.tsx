import { useState, useEffect, useRef } from 'react'
import { X, Printer, Download, Plane, Ticket } from 'lucide-react'
import { adminApiService, FlightSeries as FlightSeriesType } from '../services/api'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface PassengerData {
  passenger: {
    id: number
    pnr: string
    name: string
    email: string | null
    contact: string | null
    nationality: string | null
    identification: string | null
    age: number | null
    title: string | null
    booking_status: string | null
  }
  passenger_type: string
  fare_amount: number
  booking_reference: string
  booking_date: string
  payment_method: string
  total_amount: number
  fare_per_passenger: number
}

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  flightSeriesId: number
  passengerId: number
}

const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  flightSeriesId,
  passengerId
}) => {
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null)
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && flightSeriesId && passengerId) {
      fetchTicketData()
    }
  }, [isOpen, flightSeriesId, passengerId])

  const fetchTicketData = async () => {
    try {
      setLoading(true)
      const result = await adminApiService.getBookings(1, 10000)
      
      // Filter bookings for this flight and find the passenger
      const flightBookings = result.bookings.filter(
        booking => booking.flight_series_id === flightSeriesId
      )
      
      if (flightBookings.length > 0 && flightBookings[0].flightSeries) {
        setFlightSeries(flightBookings[0].flightSeries)
      }
      
      // Find the specific passenger
      let foundPassenger: PassengerData | null = null
      for (const booking of flightBookings) {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          for (const bp of booking.bookingPassengers) {
            if (bp.passenger && bp.passenger.id === passengerId) {
              foundPassenger = {
                passenger: {
                  ...bp.passenger,
                  booking_status: bp.passenger.booking_status || null
                },
                passenger_type: bp.passenger_type,
                fare_amount: bp.fare_amount,
                booking_reference: booking.booking_reference,
                booking_date: booking.booking_date,
                payment_method: booking.payment_method || 'N/A',
                total_amount: booking.total_amount || bp.fare_amount,
                fare_per_passenger: booking.fare_per_passenger || bp.fare_amount
              }
              break
            }
          }
          if (foundPassenger) break
        }
      }
      
      setPassengerData(foundPassenger)
    } catch (error) {
      console.error('Error fetching ticket data:', error)
      setPassengerData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Generate 13-digit ticket number (airline code + serial)
  const generateTicketNumber = (bookingRef: string, passengerId: number): string => {
    // Use "MC" as airline code for Airlogix + 11 digit serial
    const airlineCode = 'RA'
    // Generate serial from booking reference and passenger ID
    const serial = `${bookingRef.replace(/-/g, '').substring(0, 6)}${String(passengerId).padStart(5, '0')}`
    return `${airlineCode}${serial.substring(0, 11)}`
  }

  // Calculate fare breakdown (base fare + taxes)
  const calculateFareBreakdown = (totalAmount: number | string | null | undefined) => {
    // Convert to number and ensure it's valid
    const total = typeof totalAmount === 'number' ? totalAmount : Number(totalAmount) || 0
    // Assume 15% taxes and surcharges
    const taxes = total * 0.15
    const baseFare = total - taxes
    return { 
      baseFare, 
      taxes, 
      total
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !passengerData) return

    try {
      setGeneratingPDF(true)
      
      // Create a new PDF document with custom portrait dimensions (82.5mm x 203mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [82.5, 203] // 82.5mm x 203mm
      })

      const pdfWidth = 82.5
      const pdfHeight = 203
      
      // Ensure element is visible for capture
      const originalDisplay = ticketRef.current.style.display
      ticketRef.current.style.display = 'block'
      
      // Convert the element to canvas with high quality
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: ticketRef.current.scrollWidth,
        height: ticketRef.current.scrollHeight,
        windowWidth: ticketRef.current.scrollWidth,
        windowHeight: ticketRef.current.scrollHeight
      })

      // Restore original display
      ticketRef.current.style.display = originalDisplay

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate dimensions to fit the PDF page
      const canvasAspectRatio = canvas.width / canvas.height
      const pdfAspectRatio = pdfWidth / pdfHeight
      
      let finalWidth: number
      let finalHeight: number
      let xOffset = 0
      let yOffset = 0
      
      if (canvasAspectRatio > pdfAspectRatio) {
        finalWidth = pdfWidth
        finalHeight = pdfWidth / canvasAspectRatio
        yOffset = (pdfHeight - finalHeight) / 2
      } else {
        finalHeight = pdfHeight
        finalWidth = pdfHeight * canvasAspectRatio
        xOffset = (pdfWidth - finalWidth) / 2
      }
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)

      // Generate filename
      const flightInfo = flightSeries 
        ? `${flightSeries.flt}_${flightSeries.fromDestination?.code || 'N/A'}_${flightSeries.toDestination?.code || 'N/A'}`
        : 'ticket'
      const filename = `ticket_${flightInfo}_${passengerData.passenger.pnr}_${new Date().toISOString().split('T')[0]}.pdf`

      // Save the PDF
      pdf.save(filename)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 82.5mm 203mm portrait;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .ticket-print,
          .ticket-print * {
            visibility: visible;
          }
          .ticket-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .ticket-print {
            width: 82.5mm;
            height: 203mm;
            page-break-after: always;
            break-after: page;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 no-print">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Flight Ticket</h2>
              {passengerData && (
                <span className="text-sm text-gray-600">
                  - {passengerData.passenger.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF || !passengerData}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {generatingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={handlePrint}
                disabled={!passengerData}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !passengerData ? (
              <div className="text-center py-8">
                <Ticket className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Passenger not found</h3>
                <p className="mt-1 text-xs text-gray-500">
                  The specified passenger could not be found for this flight.
                </p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div 
                  ref={ticketRef}
                  className="ticket-print bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden"
                  style={{ 
                    width: '82.5mm',
                    maxWidth: '82.5mm',
                    minHeight: '203mm'
                  }}
                >
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-0.5">
                    <div className="text-center">
                      <h1 className="text-xs font-bold">ROYAL AIR</h1>
                      <p className="text-[6px] opacity-90">Electronic Flight Ticket</p>
                      <p className="text-[6px] opacity-75 mt-0.5">Ticket: {generateTicketNumber(passengerData.booking_reference, passengerData.passenger.id)}</p>
                    </div>
                  </div>

                  {/* Main Ticket Content */}
                  <div className="p-1">
                    {(() => {
                      // Ensure values are numbers
                      const totalAmount = Number(passengerData.total_amount || passengerData.fare_amount || 0)
                      const fareBreakdown = calculateFareBreakdown(totalAmount)
                      const ticketNumber = generateTicketNumber(passengerData.booking_reference, passengerData.passenger.id)
                      const flightClass = flightSeries?.flight_type?.toUpperCase().substring(0, 1) || 'Y'
                      
                      return (
                        <div className="space-y-0.5">
                          {/* Passenger Information Section */}
                          <div className="border-b border-gray-200 pb-0.5">
                            <p className="text-[6px] font-bold text-gray-700 mb-0.5">PASSENGER INFORMATION</p>
                            <div className="space-y-0.5 text-[7px]">
                              <div>
                                <p className="text-[6px] text-gray-500">Passenger Name</p>
                                <p className="text-[8px] font-bold text-gray-900 leading-tight">
                                  {passengerData.passenger.title ? `${passengerData.passenger.title} ` : ''}
                                  {passengerData.passenger.name.toUpperCase()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[6px] text-gray-500">Booking Reference (PNR)</p>
                                <p className="text-[8px] font-bold text-gray-900">{passengerData.passenger.pnr}</p>
                              </div>
                              <div>
                                <p className="text-[6px] text-gray-500">Frequent Flyer</p>
                                <p className="text-[8px] text-gray-600">-</p>
                              </div>
                            </div>
                          </div>

                          {/* Flight Details Section */}
                          <div className="border-b border-gray-200 pb-0.5">
                            <p className="text-[6px] font-bold text-gray-700 mb-0.5">FLIGHT DETAILS</p>
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <div className="text-center flex-1">
                                  <p className="text-[6px] text-gray-500">Departure</p>
                                  <p className="text-sm font-bold text-gray-900">
                                    {flightSeries?.fromDestination?.code || 'N/A'}
                                  </p>
                                  <p className="text-[6px] text-gray-600 leading-tight">{flightSeries?.fromDestination?.name || ''}</p>
                                </div>
                                <div className="flex-1 mx-0.5">
                                  <div className="border-t border-dashed border-gray-300 relative">
                                    <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 text-blue-600 bg-white px-0.5" />
                                  </div>
                                </div>
                                <div className="text-center flex-1">
                                  <p className="text-[6px] text-gray-500">Arrival</p>
                                  <p className="text-sm font-bold text-gray-900">
                                    {flightSeries?.toDestination?.code || 'N/A'}
                                  </p>
                                  <p className="text-[6px] text-gray-600 leading-tight">{flightSeries?.toDestination?.name || ''}</p>
                                </div>
                              </div>
                              <div className="space-y-0.5 text-[7px] pt-0.5">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-[6px] text-gray-500">Airline</p>
                                    <p className="text-[8px] font-semibold text-gray-900">ROYAL AIR</p>
                                  </div>
                                  <div>
                                    <p className="text-[6px] text-gray-500">Flight</p>
                                    <p className="text-[8px] font-semibold text-gray-900">{flightSeries?.flt || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-[6px] text-gray-500">Date & Time</p>
                                    <p className="text-[8px] font-semibold text-gray-900 leading-tight">
                                      {formatShortDate(flightSeries?.start_date || '')} {formatTime(flightSeries?.start_date || '')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[6px] text-gray-500">Class</p>
                                    <p className="text-[8px] font-semibold text-gray-900">{flightClass}</p>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-[6px] text-gray-500">Terminal/Gate</p>
                                    <p className="text-[8px] text-gray-600">-</p>
                                  </div>
                                  <div>
                                    <p className="text-[6px] text-gray-500">Baggage</p>
                                    <p className="text-[8px] font-semibold text-gray-900">1pc, 23kg</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Fare Information Section */}
                          <div className="border-b border-gray-200 pb-0.5">
                            <p className="text-[6px] font-bold text-gray-700 mb-0.5">FARE INFORMATION</p>
                            <div className="space-y-0.5 text-[7px]">
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-[6px] text-gray-500">Base Fare</p>
                                  <p className="text-[8px] font-semibold text-gray-900">${Number(fareBreakdown.baseFare).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-[6px] text-gray-500">Taxes & Surcharges</p>
                                  <p className="text-[8px] font-semibold text-gray-900">${Number(fareBreakdown.taxes).toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-[6px] text-gray-500">Total Fare</p>
                                  <p className="text-[9px] font-bold text-blue-600">${Number(fareBreakdown.total).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-[6px] text-gray-500">Payment</p>
                                  <p className="text-[8px] font-semibold text-gray-900 capitalize">
                                    {passengerData.payment_method?.replace('_', ' ') || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Travel Conditions Section */}
                          <div className="border-b border-gray-200 pb-0.5">
                            <p className="text-[6px] font-bold text-gray-700 mb-0.5">TRAVEL CONDITIONS</p>
                            <div className="text-[6px] text-gray-600 space-y-0.5 leading-tight">
                              <p>• Non-refundable ticket. Change fees apply.</p>
                              <p>• Baggage: 1pc, 23kg included. Excess charges apply.</p>
                              <p>• Check-in: 2hrs before departure. Valid ID required.</p>
                            </div>
                          </div>

                          {/* Barcode Section */}
                          <div className="pt-0.5">
                            <div className="bg-gray-50 h-6 rounded flex items-center justify-center p-0.5">
                              <div className="text-center w-full">
                                <div className="flex items-center justify-center space-x-0.5 mb-0.5">
                                  {Array.from({ length: 20 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className="w-0.5 bg-gray-800"
                                      style={{ height: `${8 + Math.random() * 8}px` }}
                                    />
                                  ))}
                                </div>
                                <p className="text-[5px] text-gray-600 font-mono">{ticketNumber}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Tear Line */}
                  <div className="border-t border-dashed border-gray-300 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
                  </div>

                  {/* Bottom Stub */}
                  <div className="bg-gray-50 p-0.5">
                    <div className="text-center text-[6px] text-gray-600 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-900 text-[7px]">{passengerData.passenger.name.toUpperCase()}</p>
                        <p className="font-semibold text-[7px]">{flightSeries?.flt || 'N/A'}</p>
                      </div>
                      <div className="flex justify-center items-center gap-1">
                        <p className="font-semibold text-[7px]">{flightSeries?.fromDestination?.code || 'N/A'}</p>
                        <Plane className="h-1.5 w-1.5 text-gray-400" />
                        <p className="font-semibold text-[7px]">{flightSeries?.toDestination?.code || 'N/A'}</p>
                      </div>
                      <p className="text-[6px]">{formatShortDate(flightSeries?.start_date || '')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default TicketModal

