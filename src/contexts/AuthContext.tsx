import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface AgentUser {
  id: number
  name: string
  email: string
  contact: string | null
  agency_id: number | null
  agency?: { id: number; name: string; balance: number } | null
  balance?: number
}

interface AuthContextType {
  user: AgentUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AgentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('agentToken')
    if (token) {
      fetch(`${API_BASE}/admin/agents/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data))
        .catch(() => localStorage.removeItem('agentToken'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/agent/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Login failed')
    }
    const data = await res.json()
    const token = data.access_token || data.token || data.accessToken
    if (!token) throw new Error('No token received')
    localStorage.setItem('agentToken', token)
    // Backend returns { access_token, agent: { id, name, email, agency... } }
    const agentData = data.agent || data.user || data
    setUser(agentData)
  }

  const logout = () => {
    localStorage.removeItem('agentToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
