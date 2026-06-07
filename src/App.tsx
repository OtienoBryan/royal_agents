import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/agent/Dashboard'
import MyBookings from './pages/agent/MyBookings'
import MyReservations from './pages/agent/MyReservations'
import MyPassengers from './pages/agent/MyPassengers'
import MyBalance from './pages/agent/MyBalance'
import FlightSearch from './pages/agent/FlightSearch'
import BookFlight from './pages/agent/BookFlight'
import RevenueReport from './pages/agent/RevenueReport'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard"    element={<Dashboard />} />
                    <Route path="/bookings"     element={<MyBookings />} />
                    <Route path="/reservations" element={<MyReservations />} />
                    <Route path="/passengers"   element={<MyPassengers />} />
                    <Route path="/balance"      element={<MyBalance />} />
                    <Route path="/flights"      element={<FlightSearch />} />
                    <Route path="/book"         element={<BookFlight />} />
                    <Route path="/revenue"      element={<RevenueReport />} />
                    <Route path="*"             element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
