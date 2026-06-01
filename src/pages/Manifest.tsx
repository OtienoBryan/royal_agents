import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, FlightSeries as FlightSeriesType, Luggage, Crew } from '../services/api'
import { ArrowLeft, Users, Printer, Download, FileText } from 'lucide-react'
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
  luggage?: Luggage[]
  bagsCount?: number
  totalWeight?: number
}

const Manifest: React.FC = () => {
  const { flightSeriesId } = useParams<{ flightSeriesId: string }>()
  const navigate = useNavigate()
  const [passengers, setPassengers] = useState<PassengerData[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType | null>(null)
  const [crew, setCrew] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const manifestRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (flightSeriesId) {
      fetchBoardedPassengers(parseInt(flightSeriesId, 10))
    }
  }, [flightSeriesId])

  const fetchBoardedPassengers = async (flightId: number) => {
    try {
      setLoading(true)
      
      // Fetch flight series with crew
      const flightSeriesData = await adminApiService.getFlightSeriesById(flightId)
      setFlightSeries(flightSeriesData)
      
      // Extract crew for this flight
      if (flightSeriesData.flightCrew && flightSeriesData.flightCrew.length > 0) {
        const crewData: Crew[] = []
        for (const fc of flightSeriesData.flightCrew) {
          if (fc.crew) {
            crewData.push(fc.crew)
          } else {
            // If crew data is not included, fetch it
            try {
              const crewMember = await adminApiService.getCrewById(fc.crew_id)
              crewData.push(crewMember)
            } catch (error) {
              console.error('Error fetching crew member:', error)
            }
          }
        }
        setCrew(crewData)
      }
      
      const result = await adminApiService.getBookings(1, 10000)
      
      // Filter bookings for this flight and extract boarded passengers
      const flightBookings = result.bookings.filter(
        booking => booking.flight_series_id === flightId
      )
      
      // Collect only boarded passengers
      const boardedPassengers: PassengerData[] = []
      
      for (const booking of flightBookings) {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          for (const bp of booking.bookingPassengers) {
            if (bp.passenger && bp.passenger.booking_status === 'Boarded') {
              // Fetch luggage for this passenger
              let luggage: Luggage[] = []
              let bagsCount = 0
              let totalWeight = 0
              
              try {
                luggage = await adminApiService.getLuggageByPassenger(bp.passenger.id)
                bagsCount = luggage.length
                totalWeight = luggage.reduce((sum, lug) => sum + (lug.weight || 0), 0)
              } catch (error) {
                console.error('Error fetching luggage:', error)
              }
              
              boardedPassengers.push({
                passenger: {
                  ...bp.passenger,
                  booking_status: bp.passenger.booking_status || null
                },
                passenger_type: bp.passenger_type,
                fare_amount: bp.fare_amount,
                booking_reference: booking.booking_reference,
                booking_date: booking.booking_date,
                luggage,
                bagsCount,
                totalWeight
              })
            }
          }
        }
      }
      
      // Sort by passenger name
      boardedPassengers.sort((a, b) => a.passenger.name.localeCompare(b.passenger.name))
      
      setPassengers(boardedPassengers)
    } catch (error) {
      console.error('Error fetching boarded passengers:', error)
      setPassengers([])
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to determine gender from title
  const getGender = (title: string | null): { isMale: boolean; isFemale: boolean } => {
    if (!title) return { isMale: false, isFemale: false }
    const titleLower = title.toLowerCase()
    if (titleLower.includes('mr') || titleLower.includes('m.') || titleLower.includes('monsieur')) {
      return { isMale: true, isFemale: false }
    }
    if (titleLower.includes('mrs') || titleLower.includes('ms') || titleLower.includes('miss') || 
        titleLower.includes('mme') || titleLower.includes('madame') || titleLower.includes('mlle')) {
      return { isMale: false, isFemale: true }
    }
    return { isMale: false, isFemale: false }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  // Calculate summary totals
  const calculateTotals = () => {
    let totalMales = 0
    let totalFemales = 0
    let totalChildren = 0
    let totalInfants = 0
    let totalBags = 0
    let totalWeight = 0
    
    passengers.forEach(p => {
      const gender = getGender(p.passenger.title)
      if (gender.isMale) totalMales++
      if (gender.isFemale) totalFemales++
      if (p.passenger_type.toLowerCase() === 'child') totalChildren++
      if (p.passenger_type.toLowerCase() === 'infant') totalInfants++
      totalBags += p.bagsCount || 0
      totalWeight += p.totalWeight || 0
    })
    
    return { totalMales, totalFemales, totalChildren, totalInfants, totalBags, totalWeight }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!manifestRef.current || passengers.length === 0) return

    try {
      setGeneratingPDF(true)
      
      // Create a new PDF document (A4 portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 10
      const contentWidth = pdfWidth - (margin * 2)
      
      // Ensure element is visible for capture
      const originalDisplay = manifestRef.current.style.display
      const originalWidth = manifestRef.current.style.width
      manifestRef.current.style.display = 'block'
      manifestRef.current.style.width = `${contentWidth}mm`
      manifestRef.current.style.maxWidth = `${contentWidth}mm`
      
      // Convert the element to canvas with high quality
      const canvas = await html2canvas(manifestRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: manifestRef.current.scrollWidth,
        height: manifestRef.current.scrollHeight
      })

      // Restore original display
      manifestRef.current.style.display = originalDisplay
      manifestRef.current.style.width = originalWidth
      manifestRef.current.style.maxWidth = ''

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate dimensions to fit the PDF page with margins
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const imgAspectRatio = imgWidth / imgHeight
      const contentAspectRatio = contentWidth / (pdfHeight - (margin * 2))
      
      let finalWidth: number
      let finalHeight: number
      
      if (imgAspectRatio > contentAspectRatio) {
        // Image is wider - fit to width
        finalWidth = contentWidth
        finalHeight = contentWidth / imgAspectRatio
      } else {
        // Image is taller - fit to height
        finalHeight = pdfHeight - (margin * 2)
        finalWidth = finalHeight * imgAspectRatio
      }
      
      // Center the image on the page
      const xOffset = margin + (contentWidth - finalWidth) / 2
      const yOffset = margin
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)

      // Generate filename
      const flightInfo = flightSeries 
        ? `${flightSeries.flt}_${flightSeries.fromDestination?.code || 'N/A'}_${flightSeries.toDestination?.code || 'N/A'}`
        : 'manifest'
      const filename = `manifest_${flightInfo}_${new Date().toISOString().split('T')[0]}.pdf`

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
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body * {
            visibility: hidden;
          }
          .manifest-print,
          .manifest-print * {
            visibility: visible;
          }
          .manifest-print {
            position: absolute;
            left: 10mm;
            top: 10mm;
            width: 190mm;
            max-width: 190mm;
            margin: 0;
            padding: 8mm;
            background: white;
            box-shadow: none;
            border-radius: 0;
          }
          .no-print {
            display: none !important;
          }
          .manifest-print table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
          }
          .manifest-print th,
          .manifest-print td {
            padding: 2px 3px;
            font-size: 8px;
            word-wrap: break-word;
            line-height: 1.1;
            border: 1px solid #666;
          }
          .manifest-print h1 {
            font-size: 16px;
            margin-bottom: 8px;
          }
          .manifest-print .text-xs {
            font-size: 9px;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 flex items-center gap-2 no-print">
            <button
              onClick={() => navigate(`/bookings/flight/${flightSeriesId}/passengers`)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Back to Passengers"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                Passenger Manifest
              </h1>
              {flightSeries && (
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {flightSeries.flt} - {flightSeries.fromDestination?.code || 'N/A'} → {flightSeries.toDestination?.code || 'N/A'}
                  {flightSeries.viaDestination && ` (via ${flightSeries.viaDestination.code})`}
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
                disabled={passengers.length === 0}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-3 w-3" />
                Print
              </button>
            </div>
          </div>

          {passengers.length === 0 && !loading && (
            <div className="text-center py-8 no-print">
              <Users className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No boarded passengers</h3>
              <p className="mt-1 text-[11px] text-gray-500">
                No passengers have boarded this flight yet.
              </p>
            </div>
          )}

          {/* Manifest Content */}
          {passengers.length > 0 && (() => {
            const totals = calculateTotals()
            return (
              <div ref={manifestRef} className="manifest-print bg-white rounded-lg shadow-lg p-4" style={{ width: '210mm', maxWidth: '210mm', margin: '0 auto' }}>
                {/* Title with Logo */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900 uppercase">MANIFESTE PASSAGER</h1>
                  </div>
                  <div className="flex-shrink-0">
                    <img src="/royal.png" alt="Royal Air" className="h-12 object-contain" />
                  </div>
                </div>

                {/* Flight Information */}
                <div className="mb-3 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">FLIGHT N°:</span>
                      <span>{flightSeries?.flt || 'N/A'}</span>
                    </div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">DATE OF FLIGHT:</span>
                      <span>{flightSeries ? formatDate(flightSeries.start_date) : 'N/A'}</span>
                    </div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">OWNER OF OPERATION:</span>
                      <span>ROYAL AIR</span>
                    </div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">AIRCRAFT CALL-SIGN:</span>
                      <span></span>
                    </div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">AIRCRAFT REGISTRATION:</span>
                      <span>{flightSeries?.aircraft?.registration || flightSeries?.aircraft?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">DEPARTURE AIRPORT:</span>
                      <span>{flightSeries?.fromDestination?.code || 'N/A'}</span>
                    </div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">ARRIVAL COUNTRY:</span>
                      <span>{flightSeries?.toDestination?.name || 'N/A'}</span>
                    </div>
                    <div className="flex mb-1">
                      <span className="font-semibold w-32">ARRIVAL AIRPORT:</span>
                      <span>{flightSeries?.toDestination?.code || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Crew Information */}
                <div className="mb-3 text-[10px] border-b border-gray-300 pb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex mb-1">
                        <span className="font-semibold w-24">CAPT:</span>
                        <span>{crew.find(c => c.role?.toLowerCase().includes('captain') || c.role?.toLowerCase().includes('pilot'))?.name || ''}</span>
                      </div>
                      <div className="flex mb-1">
                        <span className="font-semibold w-24">CO PILOT:</span>
                        <span>{crew.find(c => c.role?.toLowerCase().includes('copilot') || c.role?.toLowerCase().includes('first officer'))?.name || ''}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex mb-1">
                        <span className="font-semibold w-24">Autres Equipages:</span>
                        <span>{crew.filter(c => !c.role?.toLowerCase().includes('captain') && !c.role?.toLowerCase().includes('pilot') && !c.role?.toLowerCase().includes('copilot') && !c.role?.toLowerCase().includes('engineer')).map(c => c.name).join(', ') || ''}</span>
                      </div>
                      <div className="flex mb-1">
                        <span className="font-semibold w-24">ENG:</span>
                        <span>{crew.find(c => c.role?.toLowerCase().includes('engineer'))?.name || ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passenger Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-400" style={{ tableLayout: 'fixed', fontSize: '9px' }}>
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '24%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-400">
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">CIE</th>
                        <th className="px-1 py-1 text-left font-bold text-gray-700 border-r border-gray-400">PNR</th>
                        <th className="px-1 py-1 text-left font-bold text-gray-700 border-r border-gray-400">Passenger Name</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">Type</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">Seat H</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">Seat F</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">Child</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">Infant</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">BAGS</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">Weight</th>
                        <th className="px-1 py-1 text-center font-bold text-gray-700 border-r border-gray-400">AJN</th>
                        <th className="px-1 py-1 text-left font-bold text-gray-700">Tag Numbers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passengerData, index) => {
                        const gender = getGender(passengerData.passenger.title)
                        const passengerType = passengerData.passenger_type.toLowerCase()
                        const isChild = passengerType === 'child'
                        const isInfant = passengerType === 'infant'
                        const isAdult = passengerType === 'adult'
                        const typeLabel = isAdult ? 'Adult' : isChild ? 'Child' : isInfant ? 'Infant' : 'Adult'
                        const tagNumbers = passengerData.luggage?.map(l => l.tag_number).filter(Boolean).join('. ') || ''
                        
                        return (
                          <tr key={passengerData.passenger.id} className="border-b border-gray-300">
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{index + 1}</td>
                            <td className="px-1 py-0.5 text-gray-900 border-r border-gray-300">{passengerData.passenger.pnr || ''}</td>
                            <td className="px-1 py-0.5 text-gray-900 border-r border-gray-300 uppercase">{passengerData.passenger.name}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300 font-semibold">{typeLabel}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{gender.isMale ? '1' : ''}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{gender.isFemale ? '1' : ''}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{isChild ? '1' : ''}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{isInfant ? '1' : ''}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{passengerData.bagsCount || ''}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">{passengerData.totalWeight ? Math.round(passengerData.totalWeight) : ''}</td>
                            <td className="px-1 py-0.5 text-center text-gray-900 border-r border-gray-300">AJN</td>
                            <td className="px-1 py-0.5 text-gray-900">{tagNumbers}</td>
                          </tr>
                        )
                      })}
                      {/* Empty rows to fill up to 49 rows like in the image */}
                      {Array.from({ length: Math.max(0, 49 - passengers.length) }).map((_, index) => (
                        <tr key={`empty-${index}`} className="border-b border-gray-300">
                          <td className="px-1 py-0.5 text-center text-gray-400 border-r border-gray-300">{passengers.length + index + 1}</td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5 border-r border-gray-300"></td>
                          <td className="px-1 py-0.5"></td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr className="bg-gray-100 border-t-2 border-gray-400 font-semibold">
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">48</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400" colSpan={2}>TOTAL</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400"></td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">{totals.totalMales}</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">{totals.totalFemales}</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">{totals.totalChildren}</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">{totals.totalInfants}</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">{totals.totalBags}</td>
                        <td className="px-1 py-1 text-center text-gray-900 border-r border-gray-400">{Math.round(totals.totalWeight)}</td>
                        <td className="px-1 py-1 border-r border-gray-400"></td>
                        <td className="px-1 py-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

          {/* Footer Info - Hidden on print */}
          {passengers.length > 0 && (
            <div className="mt-4 text-center text-[11px] text-gray-500 no-print">
              <p>Total Boarded Passengers: {passengers.length}</p>
              <p className="mt-1">Click "Download PDF" to save as PDF or "Print" to print directly</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Manifest

