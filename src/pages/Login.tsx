import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInactivity } from '../hooks/useInactivity'
import Screensaver from './Screensaver'
import { Lock, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isInactive } = useInactivity({ timeout: 600000 }) // 10 minutes

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (error) {
      setError('')
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [error])

  const validateForm = useCallback(() => {
    const { email, password } = formData

    if (!email.trim()) {
      setError('Email is required')
      return false
    }

    if (!email.includes('@') || email.length < 5) {
      setError('Please enter a valid email address')
      return false
    }

    if (!password.trim()) {
      setError('Password is required')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    return true
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) {
      return
    }

    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }

    submitTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError('Login is taking longer than expected. Please try again.')
    }, 30000)

    try {
      await login(formData.email, formData.password)
      setSuccess('Login successful! Redirecting to dashboard...')
      setRetryCount(0)
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)

      if (errorMessage.includes('Network error') || errorMessage.includes('Request timeout')) {
        setRetryCount(prev => prev + 1)
      } else {
        setRetryCount(0)
      }
    } finally {
      setLoading(false)
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [formData, loading, login, validateForm, navigate])

  const handleCleanup = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
  }, [])

  const handleRetry = useCallback(() => {
    if (retryCount > 0 && retryCount < 3) {
      handleSubmit({ preventDefault: () => { } } as React.FormEvent)
    }
  }, [retryCount, handleSubmit])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    return () => {
      handleCleanup()
    }
  }, [handleCleanup])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-300 px-4 py-12 relative overflow-hidden">
      {/* Decorative backdrop elements for premium glassmorphic vibe */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Card Component */}
        <div className="card bg-base-100 shadow-2xl border border-base-200/50 backdrop-blur-md rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mx-auto mb-4 bg-primary/10 p-4 rounded-2xl">
              <img
                src="/royal.png"
                alt="Royal Air Logo"
                className="h-24 w-auto object-contain rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">Agent Portal</h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="alert alert-error text-xs py-2 px-3 flex items-start gap-2 shadow-sm rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold">{error}</span>
                  {retryCount > 0 && retryCount < 3 && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="link link-hover font-bold ml-2 underline block mt-1"
                    >
                      Retry Connection ({retryCount}/3)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="alert alert-success text-xs py-2 px-3 flex items-center gap-2 shadow-sm rounded-lg">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-medium text-xs">Email Address</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={loading}
                  className="input input-bordered w-full pl-10 pr-3 py-2 text-sm focus:input-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-medium text-xs">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  className="input input-bordered w-full pl-10 pr-10 py-2 text-sm focus:input-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/70"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                disabled={loading || !formData.email.trim() || !formData.password.trim()}
                className="btn w-full normal-case text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1A3D9E', border: 'none', boxShadow: 'none' }}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-base-content/40">
          <p>
            Powered by{' '}
            <a
              href="https://www.citlogisticssystems.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary link-hover font-medium"
            >
              CIT Logistics Systems
            </a>
          </p>
        </div>
      </div>

      {/* Screensaver */}
      {isInactive && <Screensaver />}
    </div>
  )
}

export default Login

