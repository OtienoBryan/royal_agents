import { useState, useEffect, useRef } from 'react'
import { X, Printer, Download, Plane } from 'lucide-react'
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
}

interface BoardingPassModalProps {
  isOpen: boolean
  onClose: () => void
  flightSeriesId: number
  passengerId: number
}

const BoardingPassModal: React.FC<BoardingPassModalProps> = ({
  isOpen,
  onClose,
  flightSeriesId,
  passengerId
}) => {
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null)
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const boardingPassRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && flightSeriesId && passengerId) {
      fetchBoardingPassData()
    }
  }, [isOpen, flightSeriesId, passengerId])

  const fetchBoardingPassData = async () => {
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
                booking_date: booking.booking_date
              }
              break
            }
          }
          if (foundPassenger) break
        }
      }
      
      setPassengerData(foundPassenger)
    } catch (error) {
      console.error('Error fetching boarding pass data:', error)
      setPassengerData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!boardingPassRef.current || !passengerData) return

    try {
      setGeneratingPDF(true)
      
      // Create a new PDF document with custom landscape dimensions (203mm x 82.5mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [203, 82.5]
      })

      const pdfWidth = 203
      const pdfHeight = 82.5
      
      // Ensure element is visible for capture
      const originalDisplay = boardingPassRef.current.style.display
      boardingPassRef.current.style.display = 'block'
      
      // Convert the element to canvas with high quality
      const canvas = await html2canvas(boardingPassRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: boardingPassRef.current.scrollWidth,
        height: boardingPassRef.current.scrollHeight,
        windowWidth: boardingPassRef.current.scrollWidth,
        windowHeight: boardingPassRef.current.scrollHeight
      })

      // Restore original display
      boardingPassRef.current.style.display = originalDisplay

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate dimensions to fit the PDF page exactly
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
        : 'boarding_pass'
      const filename = `boarding_pass_${flightInfo}_${passengerData.passenger.pnr}_${new Date().toISOString().split('T')[0]}.pdf`

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
            size: 203mm 82.5mm landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .boarding-pass-print,
          .boarding-pass-print * {
            visibility: visible;
          }
          .boarding-pass-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 no-print">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Boarding Pass</h2>
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
                <Plane className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Passenger not found</h3>
                <p className="mt-1 text-xs text-gray-500">
                  The specified passenger could not be found for this flight.
                </p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div 
                  ref={boardingPassRef}
                  className="boarding-pass-print bg-white rounded-lg shadow-lg overflow-hidden"
                  style={{ 
                    width: '203mm',
                    maxWidth: '100%',
                    minHeight: '82.5mm'
                  }}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-1.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-base font-bold">ROYAL AIR</h2>
                        <p className="text-[9px] opacity-90">Boarding Pass</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] opacity-75">Flight</p>
                        <p className="text-sm font-bold">{flightSeries?.flt || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Left Column - Passenger Info */}
                      <div className="space-y-1">
                        <div>
                          <p className="text-[8px] text-gray-500 mb-0.5">PASSENGER NAME</p>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {passengerData.passenger.title ? `${passengerData.passenger.title} ` : ''}
                            {passengerData.passenger.name.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 mb-0.5">PNR</p>
                          <p className="text-[10px] font-bold text-gray-900">{passengerData.passenger.pnr}</p>
                          <p className="text-[8px] text-gray-600">{passengerData.booking_reference}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-[8px] text-gray-500 mb-0.5">TYPE</p>
                            <span className="inline-flex px-1 py-0.5 text-[8px] font-semibold rounded bg-blue-100 text-blue-800 capitalize">
                              {passengerData.passenger_type}
                            </span>
                          </div>
                          {passengerData.passenger.nationality && (
                            <div>
                              <p className="text-[8px] text-gray-500 mb-0.5">NATIONALITY</p>
                              <p className="text-[9px] font-semibold text-gray-900">
                                {passengerData.passenger.nationality}
                              </p>
                            </div>
                          )}
                        </div>
                        {passengerData.passenger.identification && (
                          <div>
                            <p className="text-[8px] text-gray-500 mb-0.5">ID/PASSPORT</p>
                            <p className="text-[9px] font-semibold text-gray-900">
                              {passengerData.passenger.identification}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Middle Column - Route */}
                      <div className="space-y-1 border-l border-r border-gray-200 px-2">
                        <div>
                          <p className="text-[8px] text-gray-500 mb-1">ROUTE</p>
                          <div className="flex items-center justify-between">
                            <div className="text-center flex-1">
                              <p className="text-base font-bold text-gray-900">
                                {flightSeries?.fromDestination?.code || 'N/A'}
                              </p>
                              <p className="text-[8px] text-gray-600 mt-0.5">
                                {flightSeries?.fromDestination?.name || 'Departure'}
                              </p>
                            </div>
                            <div className="flex-1 mx-1">
                              <div className="border-t border-dashed border-gray-300 relative">
                                <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 text-blue-600 bg-white px-0.5" />
                              </div>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-base font-bold text-gray-900">
                                {flightSeries?.toDestination?.code || 'N/A'}
                              </p>
                              <p className="text-[8px] text-gray-600 mt-0.5">
                                {flightSeries?.toDestination?.name || 'Arrival'}
                              </p>
                            </div>
                          </div>
                          {flightSeries?.viaDestination && (
                            <p className="text-[8px] text-center text-gray-500 mt-0.5">
                              Via {flightSeries.viaDestination.code}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-200">
                          <div>
                            <p className="text-[8px] text-gray-500 mb-0.5">DATE</p>
                            <p className="text-[9px] font-semibold text-gray-900">
                              {formatDate(flightSeries?.start_date || '')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] text-gray-500 mb-0.5">TIME</p>
                            <p className="text-[9px] font-semibold text-gray-900">
                              {formatTime(flightSeries?.start_date || '')}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 mb-0.5">FLIGHT TYPE</p>
                          <p className="text-[9px] font-semibold text-gray-900 capitalize">
                            {flightSeries?.flight_type || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Right Column - Barcode */}
                      <div className="space-y-1">
                        <div>
                          <p className="text-[8px] text-gray-500 mb-0.5">STATUS</p>
                          <span className={`inline-flex px-1 py-0.5 text-[8px] font-semibold rounded ${
                            passengerData.passenger.booking_status === 'Boarded' 
                              ? 'bg-green-100 text-green-800' 
                              : passengerData.passenger.booking_status === 'CHECK IN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {passengerData.passenger.booking_status === 'Boarded' ? '✓ BOARDED' : 
                             passengerData.passenger.booking_status === 'CHECK IN' ? '✓ CHECK IN' :
                             passengerData.passenger.booking_status || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 mb-0.5">BOOKING DATE</p>
                          <p className="text-[9px] font-medium text-gray-900">
                            {formatDate(passengerData.booking_date)}
                          </p>
                        </div>
                        <div className="pt-1">
                          <div className="bg-gray-50 h-10 rounded flex items-center justify-center p-1">
                            <div className="text-center w-full">
                              <div className="flex items-center justify-center space-x-0.5 mb-0.5">
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className="w-0.5 bg-gray-800"
                                    style={{ height: `${12 + Math.random() * 12}px` }}
                                  />
                                ))}
                              </div>
                              <p className="text-[7px] text-gray-600 font-mono">
                                {passengerData.booking_reference}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tear Line */}
                  <div className="border-t border-dashed border-gray-300 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
                  </div>

                  {/* Bottom Stub */}
                  <div className="bg-gray-50 p-1">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-[7px] text-gray-500">PASSENGER</p>
                        <p className="text-[9px] font-bold text-gray-900 leading-tight">
                          {passengerData.passenger.title ? `${passengerData.passenger.title} ` : ''}
                          {passengerData.passenger.name.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-center mx-1">
                        <p className="text-[7px] text-gray-500">FROM</p>
                        <p className="text-xs font-bold text-gray-900">
                          {flightSeries?.fromDestination?.code || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center mx-1">
                        <Plane className="h-2.5 w-2.5 text-gray-400 mx-auto" />
                      </div>
                      <div className="text-center mx-1">
                        <p className="text-[7px] text-gray-500">TO</p>
                        <p className="text-xs font-bold text-gray-900">
                          {flightSeries?.toDestination?.code || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-[7px] text-gray-500">FLIGHT</p>
                        <p className="text-[10px] font-bold text-gray-900">{flightSeries?.flt || 'N/A'}</p>
                      </div>
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

export default BoardingPassModal

