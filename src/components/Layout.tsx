import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Ticket, Calendar, Users, DollarSign,
  Search, LogOut, Menu, ChevronRight, BarChart3
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/flights',      label: 'Flight Search',  icon: Search },
  { href: '/bookings',     label: 'My Bookings',    icon: Ticket },
  { href: '/reservations', label: 'Reservations',   icon: Calendar },
  { href: '/passengers',   label: 'Passengers',     icon: Users },
  { href: '/balance',      label: 'My Account',     icon: DollarSign },
  { href: '/revenue',      label: 'Revenue Report', icon: BarChart3 },
]

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-white/10">
        <img src="/royal.png" alt="Royal Air" className="h-10 w-auto rounded-xl object-contain" />
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
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location.pathname === href
          return (
            <Link key={href} to={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
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
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-56 admin-sidebar fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-56 h-full admin-sidebar flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
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
