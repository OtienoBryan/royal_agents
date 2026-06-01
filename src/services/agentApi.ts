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
  getMyReservations(page = 1, limit = 100) {
    return this.request<any>(`/admin/seat-reservations?page=${page}&limit=${limit}`)
  }

  // Passengers from agent's bookings
  getMyPassengers(page = 1, limit = 100) {
    return this.request<any>(`/admin/passengers?page=${page}&limit=${limit}`)
  }

  // Flight series
  getFlightSeries(page = 1, limit = 1000) {
    return this.request<any>(`/admin/flight-series?page=${page}&limit=${limit}`)
  }

  // Full agency record (includes balance + booking_limit)
  getAgency(agencyId: number) {
    return this.request<any>(`/admin/agencies/${agencyId}`)
  }

  // Agency ledger (agent's balance history)
  getAgencyLedger(agencyId: number) {
    return this.request<any>(`/admin/agencies/${agencyId}/ledger`)
  }

  // Notices
  getNotices() { return this.request<any>('/notices') }
}

export const agentApi = new AgentApiService()
