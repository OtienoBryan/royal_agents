import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, CargoBooking, FlightSeries } from '../services/api'
import { ArrowLeft, Package, RefreshCw, Search, Plane } from 'lucide-react'

const CargoForFlight: React.FC = () => {
  const navigate = useNavigate()
  const { flightSeriesId } = useParams()
  const flightId = Number(flightSeriesId)

  const [loading, setLoading] = useState(true)
  const [flight, setFlight] = useState<FlightSeries | null>(null)
  const [cargoBookings, setCargoBookings] = useState<CargoBooking[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const load = async () => {
    if (!flightId || Number.isNaN(flightId)) return
    try {
      setLoading(true)
      const [flightRes, cargoRes] = await Promise.all([
        adminApiService.getFlightSeriesById(flightId),
        adminApiService.getCargoBookings(1, 10000, flightId),
      ])
      setFlight(flightRes)
      // Backend should filter by flight_series_id, but keep a UI-side guard.
      const list = cargoRes.cargoBookings || []
      setCargoBookings(list.filter(c => Number(c.flight_series_id) === flightId))
    } catch (e) {
      console.error('Error loading cargo for flight:', e)
      setFlight(null)
      setCargoBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightSeriesId])

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase()
    if (!t) return cargoBookings
    return cargoBookings.filter(c =>
      (c.awb_number || '').toLowerCase().includes(t) ||
      (c.shipper_name || '').toLowerCase().includes(t) ||
      (c.consignee_name || '').toLowerCase().includes(t) ||
      (c.origin || '').toLowerCase().includes(t) ||
      (c.destination || '').toLowerCase().includes(t) ||
      (c.commodity_type || '').toLowerCase().includes(t)
    )
  }, [cargoBookings, searchTerm])

  const totalPieces = filtered.reduce((s, c) => s + (Number(c.pieces) || 0), 0)
  const totalGross = filtered.reduce((s, c) => s + (Number(c.gross_weight_kg) || 0), 0)
  const totalCharges = filtered.reduce((s, c) => s + (Number(c.total_charges) || 0), 0)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Cargo for Flight
            </h1>
            <p className="text-[11px] text-gray-600 flex items-center gap-1">
              <Plane className="h-3 w-3" />
              {flight?.flt || `Flight #${flightId}`} {flight?.start_date ? `(${flight.start_date.toString().slice(0, 10)})` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-[11px]"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tag number, shipper, consignee, route, commodity…"
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded border px-3 py-2">
            <div className="text-[10px] text-gray-600 uppercase">Pieces</div>
            <div className="text-sm font-bold text-gray-900">{totalPieces.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded border px-3 py-2">
            <div className="text-[10px] text-gray-600 uppercase">Gross (kg)</div>
            <div className="text-sm font-bold text-gray-900">{fmt(totalGross)}</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-500">
          Total charges: <span className="font-semibold">{fmt(totalCharges)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Tag No.</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Route</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Shipper → Consignee</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Commodity</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Pieces</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Gross (kg)</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Charges</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    No cargo bookings found for this flight.
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] font-mono text-gray-900">{c.awb_number}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] font-mono text-gray-700">{c.origin}→{c.destination}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-800">
                      {c.shipper_name} → {c.consignee_name}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-700">{c.commodity_type}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-700">{c.pieces}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-700">{fmt(Number(c.gross_weight_kg) || 0)}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-semibold text-gray-900">
                      {c.currency} {fmt(Number(c.total_charges) || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CargoForFlight

