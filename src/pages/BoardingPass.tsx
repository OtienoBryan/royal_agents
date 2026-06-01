import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, FlightSeries as FlightSeriesType } from '../services/api'
import { ArrowLeft, Plane, Printer, Download } from 'lucide-react'
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

const BoardingPass: React.FC = () => {
  const { flightSeriesId, passengerId } = useParams<{ flightSeriesId: string; passengerId?: string }>()
  const navigate = useNavigate()
  const [passengers, setPassengers] = useState<PassengerData[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const boardingPassContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (flightSeriesId) {
      fetchBoardedPassengers(parseInt(flightSeriesId, 10))
    }
  }, [flightSeriesId])

  const fetchBoardedPassengers = async (flightId: number) => {
    try {
      setLoading(true)
      const result = await adminApiService.getBookings(1, 10000)
      
      // Filter bookings for this flight and extract boarded passengers
      const flightBookings = result.bookings.filter(
        booking => booking.flight_series_id === flightId
      )
      
      if (flightBookings.length > 0 && flightBookings[0].flightSeries) {
        setFlightSeries(flightBookings[0].flightSeries)
      }
      
      // Collect passengers - if passengerId is specified, show only that passenger regardless of status
      // Otherwise, show passengers with "CHECK IN" or "Boarded" status
      const filteredPassengers: PassengerData[] = []
      flightBookings.forEach(booking => {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          booking.bookingPassengers.forEach(bp => {
            if (bp.passenger) {
              // If passengerId is specified, show only that passenger regardless of status
              // Otherwise, show only passengers with "CHECK IN" or "Boarded" status
              const shouldInclude = passengerId 
                ? bp.passenger.id === parseInt(passengerId, 10)
                : bp.passenger.booking_status === 'Boarded' || bp.passenger.booking_status === 'CHECK IN'
              
              if (shouldInclude) {
                filteredPassengers.push({
                  passenger: {
                    ...bp.passenger,
                    booking_status: bp.passenger.booking_status || null
                  },
                  passenger_type: bp.passenger_type,
                  fare_amount: bp.fare_amount,
                  booking_reference: booking.booking_reference,
                  booking_date: booking.booking_date
                })
              }
            }
          })
        }
      })
      
      setPassengers(filteredPassengers)
    } catch (error) {
      console.error('Error fetching boarded passengers:', error)
      setPassengers([])
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
    if (!boardingPassContainerRef.current || passengers.length === 0) return

    try {
      setGeneratingPDF(true)
      
      // Get all boarding pass elements
      const boardingPassElements = boardingPassContainerRef.current.querySelectorAll('.boarding-pass')
      
      if (boardingPassElements.length === 0) return

      // Create a new PDF document with custom landscape dimensions (203mm x 82.5mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [203, 82.5] // 203mm x 82.5mm
      })

      const pdfWidth = 203
      const pdfHeight = 82.5
      
      for (let i = 0; i < boardingPassElements.length; i++) {
        const element = boardingPassElements[i] as HTMLElement
        
        // Ensure element is visible for capture
        const originalDisplay = element.style.display
        element.style.display = 'block'
        
        // Convert the element to canvas with high quality
        const canvas = await html2canvas(element, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        })

        // Restore original display
        element.style.display = originalDisplay

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png', 1.0)
        
        // Calculate dimensions to fit the PDF page exactly
        // Convert pixels to mm (assuming 96 DPI: 1 inch = 25.4mm, 96px = 25.4mm, so 1px ≈ 0.264mm)
        // But we'll use the actual canvas dimensions and scale to fit
        const canvasAspectRatio = canvas.width / canvas.height
        const pdfAspectRatio = pdfWidth / pdfHeight
        
        let finalWidth: number
        let finalHeight: number
        let xOffset = 0
        let yOffset = 0
        
        if (canvasAspectRatio > pdfAspectRatio) {
          // Canvas is wider - fit to width
          finalWidth = pdfWidth
          finalHeight = pdfWidth / canvasAspectRatio
          yOffset = (pdfHeight - finalHeight) / 2
        } else {
          // Canvas is taller - fit to height
          finalHeight = pdfHeight
          finalWidth = pdfHeight * canvasAspectRatio
          xOffset = (pdfWidth - finalWidth) / 2
        }
        
        // Add new page for each boarding pass (except the first one)
        if (i > 0) {
          pdf.addPage([203, 82.5], 'landscape')
        }
        
        // Add image to PDF, centered
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)
      }

      // Generate filename
      const flightInfo = flightSeries 
        ? `${flightSeries.flt}_${flightSeries.fromDestination?.code || 'N/A'}_${flightSeries.toDestination?.code || 'N/A'}`
        : 'boarding_passes'
      const filename = `boarding_passes_${flightInfo}_${new Date().toISOString().split('T')[0]}.pdf`

      // Save the PDF
      pdf.save(filename)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

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
          .boarding-pass-container,
          .boarding-pass-container * {
            visibility: visible;
          }
          .boarding-pass-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .boarding-pass {
            width: 203mm;
            height: 82.5mm;
            page-break-after: always;
            break-after: page;
            margin: 0;
            padding: 0;
          }
          .boarding-pass:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          {/* Header - Hidden on print */}
          <div className="mb-4 flex items-center gap-2 no-print">
            <button
              onClick={() => {
                if (passengerId) {
                  navigate(`/bookings/flight/${flightSeriesId}/passengers`)
                } else {
                  navigate(`/bookings/flight/${flightSeriesId}/passengers`)
                }
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Back to Passengers"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                <Plane className="h-3.5 w-3.5 text-blue-600" />
                Boarding Passes
              </h1>
              {flightSeries && (
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {flightSeries.flt} - {flightSeries.fromDestination?.code || 'N/A'} → {flightSeries.toDestination?.code || 'N/A'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF || passengers.length === 0}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-3 w-3" />
                {generatingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
              >
                <Printer className="h-3 w-3" />
                Print
              </button>
            </div>
          </div>

          {passengers.length === 0 && !loading && (
            <div className="text-center py-8 no-print">
              <Plane className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {passengerId ? 'Passenger not found' : 'No eligible passengers'}
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">
                {passengerId 
                  ? 'The specified passenger could not be found for this flight.'
                  : 'No passengers with "CHECK IN" or "Boarded" status found for this flight.'}
              </p>
            </div>
          )}

          {/* Boarding Passes */}
          <div ref={boardingPassContainerRef} className="boarding-pass-container space-y-4">
            {passengers.map((passengerData, index) => (
              <div 
                key={`${passengerData.passenger.id}-${index}`} 
                className="boarding-pass bg-white rounded-lg shadow-lg overflow-hidden mx-auto"
                style={{ 
                  pageBreakAfter: index < passengers.length - 1 ? 'always' : 'auto',
                  width: '203mm',
                  maxWidth: '203mm',
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
            ))}
          </div>

          {/* Footer Info - Hidden on print */}
          {passengers.length > 0 && (
            <div className="mt-4 text-center text-[11px] text-gray-500 no-print">
              <p>Total Eligible Passengers (CHECK IN / Boarded): {passengers.length}</p>
              <p className="mt-1">Click "Download PDF" to save as PDF or "Print" to print directly</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default BoardingPass

