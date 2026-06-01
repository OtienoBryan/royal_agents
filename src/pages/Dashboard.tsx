import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService } from '../services/api'
import {
  DollarSign,
  Plane,
  Users,
  ArrowRight,
  CalendarDays,
  BarChart2,
  Wallet,
  Route,
  Package,
  Receipt,
  Fuel,
  Building2,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useAuth } from '../contexts/AuthContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear] = useState(new Date().getFullYear())
  const [totalPassengers, setTotalPassengers] = useState(0)
  const [seatReservationsTotal, setSeatReservationsTotal] = useState<number | null>(null)

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)
  }

  useEffect(() => {
    fetchSalesData()
    fetchPassengers()
    fetchSeatReservationsTotal()
  }, [selectedYear])

  const fetchPassengers = async () => {
    try {
      const result = await adminApiService.getPassengers(1, 1)
      setTotalPassengers(result.total)
    } catch {
      setTotalPassengers(0)
    }
  }

  const fetchSeatReservationsTotal = async () => {
    try {
      // Count only reservations for today/future flights (fallback to reservation_date if flightSeries is missing)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const result = await adminApiService.getSeatReservations(1, 10000)
      const reservations = result.reservations || []

      const upcomingCount = reservations.filter(r => {
        const d = r?.flightSeries?.start_date || r?.reservation_date
        if (!d) return false
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return false
        return dt >= today
      }).length

      setSeatReservationsTotal(upcomingCount)
    } catch {
      setSeatReservationsTotal(null)
    }
  }

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      const [bookingsResult, flightSeriesResult, expensesResult] = await Promise.all([
        adminApiService.getBookings(1, 10000),
        adminApiService.getFlightSeries(1, 10000),
        adminApiService.getExpenses(1, 10000),
      ])
      const allBookingPassengers: Array<{ fare_amount: number; created_at: string }> = []
      bookingsResult.bookings.forEach(booking => {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          booking.bookingPassengers.forEach(bp => {
            allBookingPassengers.push({ fare_amount: Number(bp.fare_amount) || 0, created_at: bp.created_at })
          })
        }
      })

      const yearFilteredPassengers = allBookingPassengers.filter(bp => new Date(bp.created_at).getFullYear() === selectedYear)
      const yearFilteredFlights = flightSeriesResult.flightSeries.filter(f => new Date(f.start_date).getFullYear() === selectedYear)

      const monthlyDataMap: { [key: number]: { revenue: number; flights: number; expenses: number } } = {}
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      yearFilteredPassengers.forEach(bp => {
        const month = new Date(bp.created_at).getMonth()
        if (!monthlyDataMap[month]) monthlyDataMap[month] = { revenue: 0, flights: 0, expenses: 0 }
        monthlyDataMap[month].revenue += bp.fare_amount
      })

      yearFilteredFlights.forEach(flight => {
        const month = new Date(flight.start_date).getMonth()
        if (!monthlyDataMap[month]) monthlyDataMap[month] = { revenue: 0, flights: 0, expenses: 0 }
        monthlyDataMap[month].flights += 1
      })

      const totalRevenue = yearFilteredPassengers.reduce((s, bp) => s + bp.fare_amount, 0)
      const totalFlights = yearFilteredFlights.length
      const averageOrderValue = yearFilteredPassengers.length > 0 ? totalRevenue / yearFilteredPassengers.length : 0

      const cm = new Date().getMonth()
      const isCurrentYear = selectedYear === new Date().getFullYear()

      // Expenses: sum original expense amounts (amount_paid + balance) using journal entry date when present.
      const allExpenses = expensesResult.expenses || []
      const yearFilteredExpenses = allExpenses.filter((e: any) => {
        const d = e?.journal_entry?.entry_date || e?.created_at
        if (!d) return false
        return new Date(d).getFullYear() === selectedYear
      })
      const monthFilteredExpenses = yearFilteredExpenses.filter((e: any) => {
        const d = e?.journal_entry?.entry_date || e?.created_at
        if (!d) return false
        return new Date(d).getMonth() === cm
      })
      const sumExpenseAmount = (arr: any[]) =>
        arr.reduce((s, e) => s + (Number(e?.amount_paid) || 0) + (Number(e?.balance) || 0), 0)

      // Bucket expenses by month
      yearFilteredExpenses.forEach((e: any) => {
        const d = e?.journal_entry?.entry_date || e?.created_at
        if (!d) return
        const month = new Date(d).getMonth()
        if (!monthlyDataMap[month]) monthlyDataMap[month] = { revenue: 0, flights: 0, expenses: 0 }
        monthlyDataMap[month].expenses += (Number(e?.amount_paid) || 0) + (Number(e?.balance) || 0)
      })

      const monthlyData = monthNames.map((month, index) => ({
        month,
        revenue: monthlyDataMap[index]?.revenue || 0,
        flights: monthlyDataMap[index]?.flights || 0,
        expenses: monthlyDataMap[index]?.expenses || 0,
      }))
      const currentMonthData = monthlyData[cm]

      const totalExpenses = sumExpenseAmount(yearFilteredExpenses)
      const currentMonthExpenses = sumExpenseAmount(monthFilteredExpenses)

      setSalesData({
        totalRevenue: isCurrentYear && currentMonthData ? currentMonthData.revenue : totalRevenue,
        totalFlights: isCurrentYear && currentMonthData ? currentMonthData.flights : totalFlights,
        averageOrderValue: isCurrentYear && currentMonthData && yearFilteredPassengers.length > 0
          ? currentMonthData.revenue / yearFilteredPassengers.length
          : averageOrderValue,
        totalExpenses: isCurrentYear ? currentMonthExpenses : totalExpenses,
        totalBookings: bookingsResult.total,
        monthlyData,
      })
    } catch {
      setSalesData({
        totalRevenue: 0, totalFlights: 0, averageOrderValue: 0, totalExpenses: 0, totalBookings: 0,
        monthlyData: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ month: m, revenue: 0, flights: 0, expenses: 0 })),
      })
    } finally {
      setLoading(false)
    }
  }

  // ─── Chart configs ────────────────────────────────────────────────────────
  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.92)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
    },
  }

  const revenueChartData = {
    labels: salesData?.monthlyData.map((d: any) => d.month) || [],
    datasets: [
      {
        label: 'Revenue',
        data: salesData?.monthlyData.map((d: any) => d.revenue) || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
      {
        label: 'Expenses',
        data: salesData?.monthlyData.map((d: any) => d.expenses) || [],
        borderColor: '#e11d48',
        backgroundColor: 'rgba(225,29,72,0.06)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.45,
        borderDash: [5, 4],
        pointBackgroundColor: '#e11d48',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  }

  const flightsChartData = {
    labels: salesData?.monthlyData.map((d: any) => d.month) || [],
    datasets: [{
      label: 'Flights',
      data: salesData?.monthlyData.map((d: any) => d.flights) || [],
      backgroundColor: 'rgba(220,38,38,0.75)',
      borderColor: 'rgba(220,38,38,0.9)',
      borderWidth: 0,
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const revenueOptions: any = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 2,
          padding: 16,
          color: '#6b7280',
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 16,
        },
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: any) =>
            `${ctx.dataset.label}: ${formatCurrency(Number(ctx.parsed.y) || 0)}`,
        },
      },
    },
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        ticks: { ...baseOptions.scales.y.ticks, callback: (v: any) => `${(v / 1000).toFixed(0)}k` },
      },
    },
  }

  const flightsOptions: any = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: { label: (ctx: any) => `Flights: ${ctx.parsed.y}` },
      },
    },
  }

  // ─── Stat cards ───────────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Revenue',
      sublabel: selectedYear === new Date().getFullYear() ? 'Current month' : `Year ${selectedYear}`,
      value: salesData?.totalRevenue != null
        ? formatCurrency(salesData.totalRevenue)
        : '—',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-400',
      href: '/bookings',
    },
    {
      label: 'Total Flights',
      sublabel: selectedYear === new Date().getFullYear() ? 'Current month' : `Year ${selectedYear}`,
      value: salesData?.totalFlights != null ? salesData.totalFlights.toLocaleString() : '—',
      icon: Plane,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      href: '/flight-series',
    },
    {
      label: 'Total Expenses',
      sublabel: selectedYear === new Date().getFullYear() ? 'Current month' : `Year ${selectedYear}`,
      value: salesData?.totalExpenses != null
        ? formatCurrency(salesData.totalExpenses)
        : '—',
      icon: Wallet,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-400',
      href: '/expenses',
    },
    {
      label: 'Total Passengers',
      sublabel: 'All time',
      value: totalPassengers.toLocaleString(),
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-400',
      href: '/passengers',
    },
  ]

  // ─── Quick access cards ───────────────────────────────────────────────────
  const quickLinks = [
    { label: 'New Booking',       href: '/bookings',          icon: Plane,       color: 'text-blue-600',    bg: 'bg-blue-50',    desc: 'Manage passenger bookings' },
    { label: 'Flight Series',     href: '/flight-series',     icon: Route,       color: 'text-indigo-600',  bg: 'bg-indigo-50',  desc: 'View & schedule flights' },
    { label: 'Cargo',             href: '/cargo-bookings',    icon: Package,     color: 'text-orange-600',  bg: 'bg-orange-50',  desc: 'Track cargo shipments' },
    { label: 'Expenses',          href: '/expenses',          icon: Receipt,     color: 'text-rose-600',    bg: 'bg-rose-50',    desc: 'Record & review expenses' },
    { label: 'Fueling',           href: '/fueling',           icon: Fuel,        color: 'text-yellow-600',  bg: 'bg-yellow-50',  desc: 'Log fuel transactions' },
    { label: 'Agencies',          href: '/agencies',          icon: Building2,   color: 'text-teal-600',    bg: 'bg-teal-50',    desc: 'Manage travel agencies' },
    { label: 'Seat Reservations', href: '/seat-reservations', icon: BarChart2,   color: 'text-purple-600',  bg: 'bg-purple-50',  desc: 'Seat reservations', badge: seatReservationsTotal },
    { label: 'Flight Calendar',   href: '/flight-calendar',   icon: CalendarDays,color: 'text-sky-600',     bg: 'bg-sky-50',     desc: 'Monthly flight schedule' },
  ]

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-gray-400 font-medium">{dateStr}</p>
        <h1 className="text-xl font-bold text-gray-800 mt-0.5">
          {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.href)}
              className="group relative text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all p-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-2xl opacity-[0.06] ${card.bg}`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold truncate">
                      {card.label}
                    </p>
                    {loading ? (
                      <div className="mt-2 h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                      <p className="mt-1.5 text-2xl font-bold text-gray-900 truncate leading-none">{card.value}</p>
                    )}
                    <p className="mt-2 text-[11px] text-gray-400 truncate">{card.sublabel}</p>
                  </div>

                  <div className={`p-2.5 rounded-2xl ${card.bg} flex-shrink-0 ring-1 ring-black/5`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${card.bg} ${card.color}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 inline-block" />
                    Summary
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-gray-400 group-hover:text-blue-600 transition-colors">
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Quick Access ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Access</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          {quickLinks.map(q => {
            const Icon = q.icon
            return (
              <button
                key={q.label}
                onClick={() => navigate(q.href)}
                className="group relative flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-3 text-center"
              >
                {typeof (q as any).badge === 'number' && (
                  <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-900 text-white text-[10px] font-semibold">
                    {(q as any).badge.toLocaleString()}
                  </span>
                )}
                <div className={`p-2.5 rounded-xl ${q.bg} group-hover:scale-105 transition-transform`}>
                  <Icon className={`h-5 w-5 ${q.color}`} />
                </div>
                <span className="text-[11px] font-medium text-gray-700 leading-tight">{q.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Monthly Revenue</h3>
              <p className="text-[11px] text-gray-400">{selectedYear}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                Revenue
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                Expenses
              </span>
            </div>
          </div>
          <div className="h-56">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600" />
              </div>
            ) : (
              <Line data={revenueChartData} options={revenueOptions} />
            )}
          </div>
        </div>

        {/* Flights chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Monthly Flights</h3>
              <p className="text-[11px] text-gray-400">{selectedYear}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
              Flights
            </span>
          </div>
          <div className="h-56">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-200 border-t-red-600" />
              </div>
            ) : (
              <Bar data={flightsChartData} options={flightsOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
