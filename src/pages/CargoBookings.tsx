import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, CargoBooking, FlightSeries as FlightSeriesType, IataCode } from '../services/api'
import { Calendar, Search, Package, Plane, RefreshCw, Plus, X, Link2, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const CargoBookings: React.FC = () => {
  const navigate = useNavigate()

  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    return { start: fmt(firstDay), end: fmt(lastDay) }
  }

  const currentMonth = getCurrentMonthDates()

  const [cargoBookings, setCargoBookings] = useState<CargoBooking[]>([])
  const [flightSeries, setFlightSeries] = useState<FlightSeriesType[]>([])
  const [iataCodes, setIataCodes] = useState<IataCode[]>([])
  const [originSearch, setOriginSearch] = useState('')
  const [destinationSearch, setDestinationSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState(currentMonth.start)
  const [endDate, setEndDate] = useState(currentMonth.end)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentTermFilter, setPaymentTermFilter] = useState<string>('all')

  const [showNewModal, setShowNewModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<CargoBooking | null>(null)
  const [selectedQrCargo, setSelectedQrCargo] = useState<CargoBooking | null>(null)
  const [selectedFlightId, setSelectedFlightId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const [form, setForm] = useState({
    awb_number: '',
    booking_date: new Date().toISOString().split('T')[0],
    origin: '',
    destination: '',
    shipper_name: '',
    shipper_phone: '',
    shipper_address: '',
    consignee_name: '',
    consignee_phone: '',
    consignee_address: '',
    commodity: '',
    special_handling_codes: '',
    pieces: '1',
    gross_weight_kg: '',
    chargeable_weight_kg: '',
    volume_cbm: '',
    currency: 'USD',
    payment_term: 'PREPAID',
    rate_per_kg: '',
    total_charges: '',
    status: 'booked',
    remarks: '',
  })

  const fetchIataCodes = async () => {
    try {
      const res = await adminApiService.getIataCodes(1, 10000)
      setIataCodes(res.iataCodes || [])
    } catch (e) {
      console.error('Error fetching IATA codes:', e)
      setIataCodes([])
    }
  }

  const fetchCargoBookings = async () => {
    try {
      setLoading(true)
      const [cargoRes, fsRes] = await Promise.allSettled([
        adminApiService.getCargoBookings(1, 10000),
        adminApiService.getFlightSeries(1, 10000),
      ])

      if (cargoRes.status === 'fulfilled') setCargoBookings(cargoRes.value.cargoBookings || [])
      else setCargoBookings([])

      if (fsRes.status === 'fulfilled') setFlightSeries(fsRes.value.flightSeries || [])
      else setFlightSeries([])
    } catch (err) {
      console.error('Error fetching cargo bookings:', err)
      setCargoBookings([])
      setFlightSeries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCargoBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showNewModal && iataCodes.length === 0) {
      fetchIataCodes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewModal])

  const filtered = useMemo(() => {
    return cargoBookings.filter(b => {
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !term ||
        (b.awb_number || '').toLowerCase().includes(term) ||
        (b.shipper_name || '').toLowerCase().includes(term) ||
        (b.consignee_name || '').toLowerCase().includes(term) ||
        (b.origin || '').toLowerCase().includes(term) ||
        (b.destination || '').toLowerCase().includes(term) ||
        (b.flightSeries?.flt || '').toLowerCase().includes(term) ||
        (b.commodity_type || '').toLowerCase().includes(term) ||
        (b.remarks || '').toLowerCase().includes(term)

      const d = new Date(b.booking_date)
      const matchesDate =
        (!startDate || d >= new Date(startDate)) && (!endDate || d <= new Date(endDate))

      const matchesStatus =
        statusFilter === 'all' || (b.status || '').toLowerCase() === statusFilter

      const matchesPaymentTerm =
        paymentTermFilter === 'all' || (b.payment_term || '').toLowerCase() === paymentTermFilter

      return matchesSearch && matchesDate && matchesStatus && matchesPaymentTerm
    })
  }, [cargoBookings, searchTerm, startDate, endDate, statusFilter, paymentTermFilter])

  const totalAmount = filtered.reduce((s, b) => s + (Number(b.total_charges) || 0), 0)

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const openFlight = (flightSeriesId?: number) => {
    if (!flightSeriesId) return
    navigate(`/cargo-bookings/flight/${flightSeriesId}`)
  }

  const closeModal = () => {
    setShowNewModal(false)
    setErrorMsg('')
    setOriginSearch('')
    setDestinationSearch('')
  }

  const createCargo = async () => {
    try {
      setSaving(true)
      setErrorMsg('')

      const pieces = Number(form.pieces)
      const gross = Number(form.gross_weight_kg)
      const chargeable = Number(form.chargeable_weight_kg || form.gross_weight_kg)
      const volume = form.volume_cbm ? Number(form.volume_cbm) : undefined
      const rate = form.rate_per_kg ? Number(form.rate_per_kg) : undefined
      const totalCharges = form.total_charges ? Number(form.total_charges) : undefined

      await adminApiService.createCargoBooking({
        awb_number: form.awb_number.trim(),
        booking_date: form.booking_date,
        origin: form.origin.trim().toUpperCase(),
        destination: form.destination.trim().toUpperCase(),
        shipper_name: form.shipper_name.trim(),
        shipper_phone: form.shipper_phone.trim() || undefined,
        shipper_address: form.shipper_address.trim() || undefined,
        consignee_name: form.consignee_name.trim(),
        consignee_phone: form.consignee_phone.trim() || undefined,
        consignee_address: form.consignee_address.trim() || undefined,
        commodity: form.commodity.trim(),
        special_handling_codes: form.special_handling_codes.trim() || undefined,
        pieces,
        gross_weight_kg: gross,
        chargeable_weight_kg: chargeable,
        volume_cbm: volume,
        currency: form.currency.trim().toUpperCase(),
        payment_term: form.payment_term as any,
        rate_per_kg: rate,
        total_charges: totalCharges,
        status: form.status as any,
        remarks: form.remarks.trim() || undefined,
      })

      closeModal()
      await fetchCargoBookings()
    } catch (e: any) {
      console.error('Error creating cargo booking:', e)
      setErrorMsg(e?.message || 'Failed to create cargo booking')
    } finally {
      setSaving(false)
    }
  }

  const openAssignModal = (cargo: CargoBooking) => {
    setSelectedCargo(cargo)
    setSelectedFlightId(cargo.flight_series_id ? cargo.flight_series_id.toString() : '')
    setShowAssignModal(true)
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedCargo(null)
    setSelectedFlightId('')
    setErrorMsg('')
  }

  const openQrModal = (cargo: CargoBooking) => {
    setSelectedQrCargo(cargo)
    setShowQrModal(true)
  }

  const closeQrModal = () => {
    setShowQrModal(false)
    setSelectedQrCargo(null)
  }

  const assignFlight = async () => {
    if (!selectedCargo) return
    try {
      setAssigning(true)
      setErrorMsg('')
      const flightId = selectedFlightId ? Number(selectedFlightId) : null
      await adminApiService.assignCargoBookingFlight(selectedCargo.id, flightId)
      closeAssignModal()
      await fetchCargoBookings()
    } catch (e: any) {
      console.error('Error assigning flight:', e)
      setErrorMsg(e?.message || 'Failed to assign flight')
    } finally {
      setAssigning(false)
    }
  }

  if (loading && cargoBookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            Cargo Bookings
          </h1>
          <p className="text-[11px] text-gray-600">
            {startDate && endDate ? `Period: ${formatDate(startDate)} to ${formatDate(endDate)}` : 'Select period'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <Plus className="h-3 w-3" />
            New Cargo
          </button>
          <button
            onClick={fetchCargoBookings}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-[11px]"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Reference, customer, flight, notes..."
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="booked">Booked</option>
              <option value="accepted">Accepted</option>
              <option value="manifested">Manifested</option>
              <option value="flown">Flown</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Term</label>
            <select
              value={paymentTermFilter}
              onChange={(e) => setPaymentTermFilter(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="prepaid">PREPAID</option>
              <option value="collect">COLLECT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-white rounded-lg border p-3">
          <div className="text-[10px] text-gray-600 uppercase mb-1">Cargo Bookings</div>
          <div className="text-lg font-bold text-gray-900">{filtered.length.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-[10px] text-gray-600 uppercase mb-1">Total Amount</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-[10px] text-gray-600 uppercase mb-1">Data Rule</div>
          <div className="text-[11px] text-gray-700">
            Creating cargo uses an AWB-style record (shipper/consignee, routing, weights, charges, handling, status).
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">AWB</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Shipper → Consignee</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Route</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Flight</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Charges</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    {loading ? 'Loading...' : 'No cargo bookings found for the selected filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-700">{formatDate(b.booking_date)}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] font-mono text-gray-900">{b.awb_number}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="text-[11px] text-gray-900">{b.shipper_name} → {b.consignee_name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{b.commodity_type}</div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-800 font-mono">
                      {b.origin}→{b.destination}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-gray-800">
                      {b.flightSeries?.flt || '—'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        (b.status || '').toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                        (b.status || '').toLowerCase() === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-[11px] font-semibold text-gray-900">
                      {b.currency} {formatCurrency(Number(b.total_charges) || 0)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openQrModal(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                          title="Cargo QR sticker"
                        >
                          <QrCode className="h-3 w-3" />
                          QR
                        </button>
                        <button
                          onClick={() => openAssignModal(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                          title="Assign flight"
                        >
                          <Link2 className="h-3 w-3" />
                          Assign
                        </button>
                        <button
                          onClick={() => openFlight(b.flight_series_id || undefined)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          title="View flight bookings"
                        >
                          <Plane className="h-3 w-3" />
                          Flight
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Sticker Modal */}
      {showQrModal && selectedQrCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeQrModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Cargo QR Sticker</h2>
                <p className="text-[11px] text-gray-500">
                  AWB: <span className="font-mono">{selectedQrCargo.awb_number}</span>
                </p>
              </div>
              <button onClick={closeQrModal} className="p-1 rounded hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="p-5">
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Royal Air Cargo</div>
                    <div className="text-[13px] font-bold text-gray-900 font-mono truncate">{selectedQrCargo.awb_number}</div>
                    <div className="mt-1 text-[11px] text-gray-700 font-mono">
                      {selectedQrCargo.origin}→{selectedQrCargo.destination}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Pieces: <span className="text-gray-700">{selectedQrCargo.pieces ?? '—'}</span> · Weight:{" "}
                      <span className="text-gray-700">{(selectedQrCargo.gross_weight_kg ?? '—') as any}</span>kg
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Flight: <span className="text-gray-700">{selectedQrCargo.flightSeries?.flt || '—'}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <QRCodeSVG
                      value={JSON.stringify({
                        type: 'cargo_booking',
                        id: selectedQrCargo.id,
                        awb_number: selectedQrCargo.awb_number,
                        origin: selectedQrCargo.origin,
                        destination: selectedQrCargo.destination,
                      })}
                      size={180}
                      level="M"
                      includeMargin
                    />
                    <div className="text-[9px] text-gray-500 font-mono">ID:{selectedQrCargo.id}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
              <button
                onClick={closeQrModal}
                className="px-3 py-1.5 text-[11px] bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Cargo Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl border max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Post New Cargo (AWB)</h2>
                <p className="text-[11px] text-gray-500">Enter shipment + airline-required details. Fields with * are required.</p>
              </div>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {errorMsg && (
                <div className="mb-3 text-[11px] bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">AWB Number *</label>
                  <input
                    value={form.awb_number}
                    onChange={(e) => setForm(f => ({ ...f, awb_number: e.target.value }))}
                    placeholder="e.g. 123-45678901"
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Booking Date *</label>
                  <input
                    type="date"
                    value={form.booking_date}
                    onChange={(e) => setForm(f => ({ ...f, booking_date: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="booked">booked</option>
                    <option value="accepted">accepted</option>
                    <option value="manifested">manifested</option>
                    <option value="flown">flown</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Origin (IATA) *</label>
                  <div className="space-y-1">
                    <input
                      value={originSearch}
                      onChange={(e) => setOriginSearch(e.target.value)}
                      placeholder="Search airport/city/code…"
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={form.origin}
                      onChange={(e) => setForm(f => ({ ...f, origin: e.target.value }))}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                    >
                      <option value="">Select origin…</option>
                      {iataCodes
                        .filter(i => {
                          const t = originSearch.trim().toLowerCase()
                          if (!t) return true
                          return (
                            (i.code || '').toLowerCase().includes(t) ||
                            (i.airport || '').toLowerCase().includes(t) ||
                            (i.city || '').toLowerCase().includes(t) ||
                            (i.country_code || '').toLowerCase().includes(t)
                          )
                        })
                        .slice(0, 200)
                        .map(i => (
                          <option key={i.id} value={(i.code || '').toUpperCase()}>
                            {(i.code || '').toUpperCase()} — {i.airport}{i.city ? ` (${i.city})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Destination (IATA) *</label>
                  <div className="space-y-1">
                    <input
                      value={destinationSearch}
                      onChange={(e) => setDestinationSearch(e.target.value)}
                      placeholder="Search airport/city/code…"
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={form.destination}
                      onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                    >
                      <option value="">Select destination…</option>
                      {iataCodes
                        .filter(i => {
                          const t = destinationSearch.trim().toLowerCase()
                          if (!t) return true
                          return (
                            (i.code || '').toLowerCase().includes(t) ||
                            (i.airport || '').toLowerCase().includes(t) ||
                            (i.city || '').toLowerCase().includes(t) ||
                            (i.country_code || '').toLowerCase().includes(t)
                          )
                        })
                        .slice(0, 200)
                        .map(i => (
                          <option key={i.id} value={(i.code || '').toUpperCase()}>
                            {(i.code || '').toUpperCase()} — {i.airport}{i.city ? ` (${i.city})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Shipper Name *</label>
                      <input
                        value={form.shipper_name}
                        onChange={(e) => setForm(f => ({ ...f, shipper_name: e.target.value }))}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Consignee Name *</label>
                      <input
                        value={form.consignee_name}
                        onChange={(e) => setForm(f => ({ ...f, consignee_name: e.target.value }))}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Shipper Phone *</label>
                      <input
                        value={form.shipper_phone}
                        onChange={(e) => setForm(f => ({ ...f, shipper_phone: e.target.value }))}
                        placeholder="Phone"
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Consignee Phone *</label>
                      <input
                        value={form.consignee_phone}
                        onChange={(e) => setForm(f => ({ ...f, consignee_phone: e.target.value }))}
                        placeholder="Phone"
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Commodity *</label>
                  <input
                    value={form.commodity}
                    onChange={(e) => setForm(f => ({ ...f, commodity: e.target.value }))}
                    placeholder="e.g. General Cargo"
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Pieces *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.pieces}
                    onChange={(e) => setForm(f => ({ ...f, pieces: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Gross Weight (kg) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.gross_weight_kg}
                    onChange={(e) => setForm(f => ({ ...f, gross_weight_kg: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Chargeable Weight (kg) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.chargeable_weight_kg}
                    onChange={(e) => setForm(f => ({ ...f, chargeable_weight_kg: e.target.value }))}
                    placeholder="optional"
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Volume (CBM)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.volume_cbm}
                    onChange={(e) => setForm(f => ({ ...f, volume_cbm: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">SHC (Special Handling Codes)</label>
                  <input
                    value={form.special_handling_codes}
                    onChange={(e) => setForm(f => ({ ...f, special_handling_codes: e.target.value.toUpperCase() }))}
                    placeholder="e.g. PER, AVI, HUM"
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Term</label>
                  <select
                    value={form.payment_term}
                    onChange={(e) => setForm(f => ({ ...f, payment_term: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PREPAID">PREPAID</option>
                    <option value="COLLECT">COLLECT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    maxLength={3}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Rate / kg</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.rate_per_kg}
                    onChange={(e) => setForm(f => ({ ...f, rate_per_kg: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Total Charges</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.total_charges}
                    onChange={(e) => setForm(f => ({ ...f, total_charges: e.target.value }))}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
                    rows={3}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="px-3 py-1.5 text-[11px] bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={createCargo}
                className="px-3 py-1.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Post Cargo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Flight Modal */}
      {showAssignModal && selectedCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeAssignModal} />
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Assign Flight</h2>
                <p className="text-[11px] text-gray-500">AWB: <span className="font-mono">{selectedCargo.awb_number}</span></p>
              </div>
              <button onClick={closeAssignModal} className="p-1 rounded hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {errorMsg && (
                <div className="text-[11px] bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <label className="block text-[10px] font-medium text-gray-700">Flight (today or future)</label>
              <select
                value={selectedFlightId}
                onChange={(e) => setSelectedFlightId(e.target.value)}
                className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Unassigned —</option>
                {flightSeries
                  .filter(fs => {
                    const sd = (fs.start_date || '').toString().slice(0, 10)
                    if (!sd) return false
                    const today = new Date().toISOString().slice(0, 10)
                    return sd >= today
                  })
                  .map(fs => (
                    <option key={fs.id} value={fs.id.toString()}>
                      {fs.flt} ({(fs.start_date || '').toString().slice(0, 10)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
              <button
                onClick={closeAssignModal}
                className="px-3 py-1.5 text-[11px] bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={assigning}
                onClick={assignFlight}
                className="px-3 py-1.5 text-[11px] bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {assigning ? 'Assigning…' : 'Assign Flight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CargoBookings

