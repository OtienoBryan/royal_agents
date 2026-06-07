const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

class AgentApiService {
  private get token() { return localStorage.getItem('agentToken') }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${path}`
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(options.headers || {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `HTTP ${res.status}`)
    }
    return res.json()
  }

  // Agent profile
  getProfile() { return this.request<any>('/admin/agents/me') }

  // Bookings filtered by agent
  getMyBookings(page = 1, limit = 50) {
    return this.request<any>(`/admin/bookings?page=${page}&limit=${limit}&agentFilter=me`)
  }

  // Single booking with passengers
  getBooking(id: number) {
    return this.request<any>(`/admin/bookings/${id}`)
  }

  // Seat reservations filtered by agent
  getMyReservations(page = 1, limit = 1000, agentId?: number, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (agentId) params.set('agentId', String(agentId))
    if (status)  params.set('status', status)
    return this.request<any>(`/admin/seat-reservations?${params}`)
  }

  // Passengers from agent's bookings
  getMyPassengers(page = 1, limit = 100) {
    return this.request<any>(`/admin/passengers?page=${page}&limit=${limit}`)
  }

  searchPassengers(search: string, limit = 10) {
    return this.request<{ passengers: any[]; total: number }>(
      `/admin/passengers?page=1&limit=${limit}&search=${encodeURIComponent(search)}`
    )
  }

  // Flight series (kept for backward compat)
  getFlightSeries(page = 1, limit = 1000) {
    return this.request<any>(`/admin/flight-series?page=${page}&limit=${limit}`)
  }

  // Individual flights from the flights table (scheduled only, from today onwards)
  getAvailableFlights(params: { from?: string; to?: string; search?: string; seriesId?: number } = {}) {
    const today = new Date().toISOString().slice(0, 10)
    const qs = new URLSearchParams({ page: '1', limit: '1000', status: 'scheduled' })
    if (params.from || today) qs.set('from', params.from ?? today)
    if (params.to)   qs.set('to',   params.to)
    if (params.search)   qs.set('search',   params.search)
    if (params.seriesId) qs.set('seriesId', String(params.seriesId))
    return this.request<{ flights: any[]; total: number }>(`/admin/flights?${qs.toString()}`)
  }

  // Full agency record (includes balance + booking_limit)
  getAgency(agencyId: number) {
    return this.request<any>(`/admin/agencies/${agencyId}`)
  }

  // Agency ledger (agent's balance history)
  getAgencyLedger(agencyId: number) {
    return this.request<any>(`/admin/agencies/${agencyId}/ledger`)
  }

  getBookedSeatCounts(flightSeriesId: number) {
    return this.request<Record<string, number>>(`/admin/bookings/seat-counts?flightSeriesId=${flightSeriesId}`)
  }

  // Notices
  getNotices() { return this.request<any>('/notices') }
}

export const agentApi = new AgentApiService()
