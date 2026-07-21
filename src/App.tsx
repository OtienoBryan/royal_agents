import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'

// Route-level code splitting — each page ships as its own chunk, fetched
// only when visited, instead of one bundle containing every page up front.
const Dashboard = lazy(() => import('./pages/agent/Dashboard'))
const MyBookings = lazy(() => import('./pages/agent/MyBookings'))
const MyReservations = lazy(() => import('./pages/agent/MyReservations'))
const MyPassengers = lazy(() => import('./pages/agent/MyPassengers'))
const MyBalance = lazy(() => import('./pages/agent/MyBalance'))
const FlightSearch = lazy(() => import('./pages/agent/FlightSearch'))
const BookFlight = lazy(() => import('./pages/agent/BookFlight'))
const RevenueReport = lazy(() => import('./pages/agent/RevenueReport'))
const Settings = lazy(() => import('./pages/agent/Settings'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
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
                  <Suspense fallback={<RouteFallback />}>
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
                      <Route path="/settings"     element={<Settings />} />
                      <Route path="*"             element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
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
