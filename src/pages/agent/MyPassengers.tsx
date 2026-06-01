import { useState, useEffect, useMemo } from 'react'
import { agentApi } from '../../services/agentApi'
import { Users, Search } from 'lucide-react'

const MyPassengers: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading]  = useState(true)
  const [search, setSearch]    = useState('')

  useEffect(() => {
    // Derive passengers from the agent's own bookings → booking_passengers → passenger
    agentApi.getMyBookings(1, 10000)
      .then(r => setBookings(r.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Extract unique passengers from booking_passengers, keyed by passenger.id
  const passengers = useMemo(() => {
    const seen = new Map<number, any>()
    for (const b of bookings) {
      for (const bp of (b.bookingPassengers || [])) {
        const p = bp.passenger
        if (p && !seen.has(p.id)) seen.set(p.id, p)
      }
    }
    return Array.from(seen.values())
  }, [bookings])

  const filtered = passengers.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name?.toLowerCase().includes(q) || p.pnr?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Users className="h-4 w-4" style={{ color: '#1c2e61' }} />Passengers
        </h1>
        <span className="text-[11px] text-gray-500">{filtered.length} records</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input type="text" placeholder="Search by name, PNR or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-200 rounded-md focus:ring-1 focus:outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">PNR</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Nationality</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#1c2e61' }} />
                  </td>
                </tr>
              ) : filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-[11px] font-mono font-bold" style={{ color: '#1c2e61' }}>{p.pnr}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-gray-900">
                    {p.title ? `${p.title} ` : ''}{p.name}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-gray-600">{p.email || '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-600">{p.contact || '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-600">{p.nationality || '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-500">
                    {p.id_type && p.identification
                      ? <span className="font-mono">{p.id_type.replace('_', ' ')}: {p.identification}</span>
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.booking_status ? (
                      <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                        p.booking_status === 'Boarded'  ? 'bg-green-100 text-green-800' :
                        p.booking_status === 'No Show'  ? 'bg-red-100 text-red-800' :
                                                           'bg-blue-100 text-blue-800'
                      }`}>
                        {p.booking_status}
                      </span>
                    ) : <span className="text-gray-300 text-[10px]">—</span>}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[11px] text-gray-400">No passengers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MyPassengers
