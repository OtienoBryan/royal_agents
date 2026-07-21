import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Ticket, Calendar, DollarSign,
  Search, LogOut, Menu, X, BarChart3, Settings
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/flights',      label: 'Flight Search',  icon: Search },
  { href: '/bookings',     label: 'My Bookings',    icon: Ticket },
  { href: '/reservations', label: 'Reservations',   icon: Calendar },
  { href: '/balance',      label: 'My Account',     icon: DollarSign },
  { href: '/revenue',      label: 'Revenue Report', icon: BarChart3 },
  { href: '/settings',     label: 'Settings',       icon: Settings },
]

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside
            className="relative w-64 h-full flex flex-col"
            style={{ background: 'linear-gradient(180deg, #16234d 0%, #1c2e61 100%)' }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <img src="/royal.png" alt="Royal Air" className="h-10 w-auto rounded-xl object-contain" />
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-3 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white leading-tight">{user?.name || 'Agent'}</div>
                  {(user as any)?.agency && (
                    <div className="text-[10px] text-white/60 leading-tight">{(user as any).agency.name}</div>
                  )}
                </div>
              </div>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = location.pathname === href
                return (
                  <Link key={href} to={href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                      active ? 'bg-white text-[#1c2e61]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-2 py-3 border-t border-white/10">
              <button onClick={logout}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                <LogOut className="h-3.5 w-3.5" />Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar — icon rail */}
      <div
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-20 z-20"
        style={{ background: 'linear-gradient(180deg, #16234d 0%, #1c2e61 100%)' }}
      >
        <div className="flex flex-1 flex-col items-center overflow-y-auto scrollbar-hide pt-4 pb-3">
          <img src="/royal.png" alt="Royal Air" className="h-[68px] w-[68px] object-contain rounded-2xl" />
          <p className="mt-3 text-[9px] font-semibold uppercase tracking-wider text-white/40">Menu</p>

          <nav className="mt-3 flex-1 w-full flex flex-col items-center gap-1.5 px-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = location.pathname === href
              return (
                <Link
                  key={href}
                  to={href}
                  className={`group w-full flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-colors ${
                    active ? 'bg-white text-[#1c2e61] shadow' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] font-medium leading-none text-center px-0.5">{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="w-full px-2 pt-2 border-t border-white/10 flex flex-col items-center gap-1.5">
            <button
              onClick={logout}
              className="w-full flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[9px] font-medium leading-none">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-20 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-1.5 hover:bg-gray-100 rounded">
            <Menu className="h-4 w-4 text-gray-600" />
          </button>
          <img src="/royal.png" alt="Royal Air" className="h-7 rounded-lg object-contain" />
          <button onClick={logout} className="p-1.5 hover:bg-gray-100 rounded">
            <LogOut className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default Layout
