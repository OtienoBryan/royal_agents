import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, AccountType } from '../services/api'
import {
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type PLCategory =
  | 'revenue'
  | 'cost_of_sales'
  | 'operating_expense'
  | 'other_income'
  | 'other_expense'
  | 'tax'
  | 'balance_sheet'

interface PLAccount {
  account_id: number
  account_code: string
  account_name: string
  category: string
  /** period_balance = debit − credit (from trial balance) */
  period_balance: number
  /** normalised P&L amount — always positive means "income earned" or "expense incurred" */
  amount: number
  plCategory: PLCategory
}

interface PLSection {
  key: PLCategory
  label: string
  accounts: PLAccount[]
  total: number
  /** true → amounts increase net income; false → they reduce it */
  isIncome: boolean
}

// ─── Classification logic ────────────────────────────────────────────────────

function classifyAccountType(typeName: string): PLCategory {
  const n = typeName.toLowerCase()

  // Balance-sheet accounts that should be excluded from P&L
  if (
    /\b(asset|liabilit|equity|capital|retained|payable|receivable|cash|bank|deposit|prepaid|inventory|loan|debt|reserve|note|mortgage|dividend)\b/.test(n)
  ) return 'balance_sheet'

  // Tax
  if (/\b(tax)\b/.test(n) && /\b(expense|provision|payable|income)\b/.test(n)) return 'tax'

  // Cost of Sales / Direct costs
  if (
    /\b(cost\s+of\s+(sales|revenue|goods|service)|cogs|direct\s+cost|direct\s+expense)\b/.test(n)
  ) return 'cost_of_sales'

  // Other income / other revenue
  if (/\b(other\s+income|other\s+revenue|miscellaneous\s+income|interest\s+income|gain)\b/.test(n))
    return 'other_income'

  // Other expense
  if (/\b(other\s+expense|interest\s+expense|miscellaneous\s+expense|loss)\b/.test(n))
    return 'other_expense'

  // Revenue / Income (credit-normal)
  if (
    /\b(revenue|income|sales|fare|ticket|charter|freight|baggage|cargo|service\s+revenue)\b/.test(n)
  ) return 'revenue'

  // Expense (debit-normal)
  if (
    /\b(expense|cost|payroll|salary|wage|fuel|maintenance|depreciation|amortisation|amortization|insurance|rent|lease|utilities|marketing|advertising|commission|administrative|admin|overhead|management|operation)\b/.test(n)
  ) return 'operating_expense'

  // Default: treat unknown non-balance-sheet types as operating expense so they surface
  return 'balance_sheet'
}

/** Normalise to "how much income / expense did this account contribute this period?" */
function normaliseAmount(account: PLAccount): number {
  const cat = account.plCategory
  if (cat === 'revenue' || cat === 'other_income') {
    // Credit-normal: income = credit − debit = −period_balance
    return -account.period_balance
  }
  // Debit-normal: expense = debit − credit = period_balance
  return account.period_balance
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTION_CONFIG: {
  key: PLCategory
  label: string
  isIncome: boolean
  order: number
}[] = [
  { key: 'revenue', label: 'Revenue', isIncome: true, order: 1 },
  { key: 'cost_of_sales', label: 'Cost of Sales', isIncome: false, order: 2 },
  { key: 'operating_expense', label: 'Operating Expenses', isIncome: false, order: 4 },
  { key: 'other_income', label: 'Other Income', isIncome: true, order: 5 },
  { key: 'other_expense', label: 'Other Expenses', isIncome: false, order: 6 },
  { key: 'tax', label: 'Tax Expense', isIncome: false, order: 7 },
]

// ─── Component ───────────────────────────────────────────────────────────────

const ProfitLoss: React.FC = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [sections, setSections] = useState<PLSection[]>([])
  const [uncategorised, setUncategorised] = useState<PLAccount[]>([])
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const [periodFilter, setPeriodFilter] = useState('current-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Derived subtotals
  const totalRevenue =
    sections.find(s => s.key === 'revenue')?.total ?? 0
  const totalCoS =
    sections.find(s => s.key === 'cost_of_sales')?.total ?? 0
  const grossProfit = totalRevenue - totalCoS
  const totalOpEx =
    sections.find(s => s.key === 'operating_expense')?.total ?? 0
  const operatingIncome = grossProfit - totalOpEx
  const otherIncome =
    sections.find(s => s.key === 'other_income')?.total ?? 0
  const otherExpense =
    sections.find(s => s.key === 'other_expense')?.total ?? 0
  const taxExpense =
    sections.find(s => s.key === 'tax')?.total ?? 0
  const netIncomeBeforeTax = operatingIncome + otherIncome - otherExpense
  const netIncome = netIncomeBeforeTax - taxExpense

  // ── Date helpers ────────────────────────────────────────────────────────────

  const initializeDates = useCallback(() => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(first.toISOString().split('T')[0])
    setEndDate(last.toISOString().split('T')[0])
  }, [])

  const handlePeriodChange = (period: string) => {
    setPeriodFilter(period)
    if (period === 'custom') return
    const now = new Date()
    let first: Date, last: Date
    switch (period) {
      case 'last-month':
        first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        last = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'current-year':
        first = new Date(now.getFullYear(), 0, 1)
        last = new Date(now.getFullYear(), 11, 31)
        break
      case 'last-year':
        first = new Date(now.getFullYear() - 1, 0, 1)
        last = new Date(now.getFullYear() - 1, 11, 31)
        break
      default: // current-month
        first = new Date(now.getFullYear(), now.getMonth(), 1)
        last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }
    setStartDate(first.toISOString().split('T')[0])
    setEndDate(last.toISOString().split('T')[0])
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!startDate || !endDate) return
    try {
      setLoading(true)
      const [typesResult, tbResult] = await Promise.all([
        adminApiService.getAccountTypes(),
        adminApiService.getTrialBalance(startDate, endDate),
      ])
      setAccountTypes(typesResult || [])

      const raw: PLAccount[] = tbResult.accounts.map(acc => {
        const plCategory = classifyAccountType(acc.category)
        const base: PLAccount = {
          account_id: acc.account_id,
          account_code: acc.account_code,
          account_name: acc.account_name,
          category: acc.category,
          period_balance: acc.period_balance,
          amount: 0,
          plCategory,
        }
        base.amount = normaliseAmount(base)
        return base
      })

      // Build sections from config
      const builtSections: PLSection[] = SECTION_CONFIG.map(cfg => {
        const accounts = raw
          .filter(a => a.plCategory === cfg.key && a.amount !== 0)
          .sort((a, b) => a.account_code.localeCompare(b.account_code))
        const total = accounts.reduce((s, a) => s + a.amount, 0)
        return { key: cfg.key, label: cfg.label, accounts, total, isIncome: cfg.isIncome }
      })

      // Accounts that weren't classified for P&L
      const unc = raw.filter(a => a.plCategory === 'balance_sheet' && a.period_balance !== 0)

      setSections(builtSections)
      setUncategorised(unc)
    } catch (err) {
      console.error('Error loading P&L:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { initializeDates() }, [initializeDates])
  useEffect(() => { if (startDate && endDate) loadData() }, [startDate, endDate, loadData])

  // ── UI helpers ───────────────────────────────────────────────────────────────

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''

  const toggleSection = (key: string) =>
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const openJournalEntries = (accountId: number) => {
    const params = new URLSearchParams({ account_id: accountId.toString(), start_date: startDate, end_date: endDate })
    navigate(`/journal-entries?${params}`)
  }

  // ── CSV Export ───────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const rows: string[] = [
      `"Profit & Loss Statement"`,
      `"Period: ${fmtDate(startDate)} to ${fmtDate(endDate)}"`,
      '',
      '"Section","Account Code","Account Name","Amount"',
    ]
    sections.forEach(section => {
      if (section.accounts.length === 0) return
      section.accounts.forEach(a =>
        rows.push(`"${section.label}","${a.account_code}","${a.account_name}","${a.amount.toFixed(2)}"`)
      )
      rows.push(`"${section.label} — Total","","","${section.total.toFixed(2)}"`)
      rows.push('')
    })
    rows.push(`"GROSS PROFIT","","","${grossProfit.toFixed(2)}"`)
    rows.push(`"OPERATING INCOME","","","${operatingIncome.toFixed(2)}"`)
    rows.push(`"NET INCOME BEFORE TAX","","","${netIncomeBeforeTax.toFixed(2)}"`)
    rows.push(`"NET INCOME","","","${netIncome.toFixed(2)}"`)

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `profit-loss-${startDate}-to-${endDate}.csv`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  const netIncomeColor =
    netIncome > 0 ? 'text-green-700' : netIncome < 0 ? 'text-red-700' : 'text-gray-700'
  const netIncomeBg =
    netIncome > 0 ? 'bg-green-50 border-green-300' : netIncome < 0 ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'

  const SubtotalRow = ({
    label,
    value,
    className = '',
  }: {
    label: string
    value: number
    className?: string
  }) => (
    <div className={`flex justify-between items-center px-3 py-1.5 rounded text-[11px] font-semibold ${className}`}>
      <span>{label}</span>
      <span className={value >= 0 ? 'text-green-700' : 'text-red-700'}>{fmt(value)}</span>
    </div>
  )

  const SectionBlock = ({ section }: { section: PLSection }) => {
    if (section.accounts.length === 0 && section.total === 0) return null
    const collapsed = collapsedSections[section.key]

    const sectionHeaderBg: Record<PLCategory, string> = {
      revenue: 'bg-green-700',
      cost_of_sales: 'bg-orange-600',
      operating_expense: 'bg-red-700',
      other_income: 'bg-teal-700',
      other_expense: 'bg-rose-700',
      tax: 'bg-gray-700',
      balance_sheet: 'bg-gray-500',
    }

    return (
      <div className="bg-white rounded-lg border overflow-hidden mb-2">
        {/* Section header */}
        <button
          onClick={() => toggleSection(section.key)}
          className={`w-full flex justify-between items-center px-3 py-2 ${sectionHeaderBg[section.key]} text-white text-[11px] font-semibold`}
        >
          <div className="flex items-center gap-1.5">
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {section.label.toUpperCase()}
          </div>
          <span className="font-mono">{fmt(section.total)}</span>
        </button>

        {/* Accounts */}
        {!collapsed && (
          <div className="divide-y divide-gray-100">
            {section.accounts.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-gray-400 italic">No activity this period</div>
            ) : (
              section.accounts.map(acc => (
                <button
                  key={acc.account_id}
                  onClick={() => openJournalEntries(acc.account_id)}
                  title="Click to view journal entries"
                  className="w-full flex justify-between items-center px-3 py-1.5 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-gray-500 shrink-0">{acc.account_code}</span>
                    <span className="text-[11px] text-gray-800 truncate group-hover:text-blue-700">{acc.account_name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">({acc.category})</span>
                  </div>
                  <span className={`text-[11px] font-mono shrink-0 ml-4 ${acc.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {fmt(acc.amount)}
                  </span>
                </button>
              ))
            )}
            {/* Section subtotal row */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50 border-t text-[11px] font-semibold text-gray-700">
              <span>Total {section.label}</span>
              <span className={section.total >= 0 ? 'text-gray-900' : 'text-red-700'}>{fmt(section.total)}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading && sections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Profit & Loss Statement</h1>
          <p className="text-[11px] text-gray-600">
            Period: {startDate && endDate ? `${fmtDate(startDate)} to ${fmtDate(endDate)}` : 'Select period'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-[11px] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-[11px] transition-colors"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Period filter */}
      <div className="bg-white rounded-lg shadow-sm border p-2 flex flex-wrap gap-2 items-center">
        <Filter className="h-3 w-3 text-gray-400" />
        <select
          value={periodFilter}
          onChange={e => handlePeriodChange(e.target.value)}
          className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        >
          <option value="current-month">Current Month</option>
          <option value="last-month">Last Month</option>
          <option value="current-year">Current Year</option>
          <option value="last-year">Last Year</option>
          <option value="custom">Custom</option>
        </select>

        {periodFilter === 'custom' && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
          </>
        )}

        {loading && <span className="text-[10px] text-gray-400 ml-2">Refreshing…</span>}
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Total Revenue', value: totalRevenue, icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Gross Profit', value: grossProfit, icon: grossProfit >= 0 ? TrendingUp : TrendingDown, color: grossProfit >= 0 ? 'text-blue-700' : 'text-red-700', bg: grossProfit >= 0 ? 'bg-blue-50' : 'bg-red-50' },
          { label: 'Operating Income', value: operatingIncome, icon: operatingIncome >= 0 ? TrendingUp : TrendingDown, color: operatingIncome >= 0 ? 'text-indigo-700' : 'text-red-700', bg: operatingIncome >= 0 ? 'bg-indigo-50' : 'bg-red-50' },
          { label: 'Net Income', value: netIncome, icon: netIncome >= 0 ? TrendingUp : TrendingDown, color: netIncome >= 0 ? 'text-emerald-700' : 'text-red-700', bg: netIncome >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`rounded-lg border p-3 ${card.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                <span className="text-[10px] text-gray-600 uppercase font-medium">{card.label}</span>
              </div>
              <div className={`text-base font-bold ${card.color}`}>{fmt(card.value)}</div>
            </div>
          )
        })}
      </div>

      {/* Main P&L body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: income statement sections */}
        <div className="lg:col-span-2 space-y-0">
          {SECTION_CONFIG.sort((a, b) => a.order - b.order).map(cfg => {
            const section = sections.find(s => s.key === cfg.key)
            if (!section) return null
            return <SectionBlock key={cfg.key} section={section} />
          })}
        </div>

        {/* Right: summary panel */}
        <div className="space-y-2">
          <div className="bg-white rounded-lg border p-3 space-y-1 text-[11px]">
            <h3 className="font-bold text-gray-900 text-sm mb-2 border-b pb-1">Income Statement Summary</h3>

            <div className="flex justify-between text-gray-700 py-0.5">
              <span>Total Revenue</span><span className="font-semibold">{fmt(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-gray-600 py-0.5">
              <span className="pl-3">Less: Cost of Sales</span><span>({fmt(totalCoS)})</span>
            </div>
            <SubtotalRow label="Gross Profit" value={grossProfit} className="bg-blue-50 border border-blue-200 mt-1" />

            <div className="flex justify-between text-gray-600 py-0.5 mt-1">
              <span className="pl-3">Less: Operating Expenses</span><span>({fmt(totalOpEx)})</span>
            </div>
            <SubtotalRow label="Operating Income" value={operatingIncome} className="bg-indigo-50 border border-indigo-200" />

            {otherIncome !== 0 && (
              <div className="flex justify-between text-gray-600 py-0.5 mt-1">
                <span className="pl-3">Add: Other Income</span><span>{fmt(otherIncome)}</span>
              </div>
            )}
            {otherExpense !== 0 && (
              <div className="flex justify-between text-gray-600 py-0.5">
                <span className="pl-3">Less: Other Expenses</span><span>({fmt(otherExpense)})</span>
              </div>
            )}
            {(otherIncome !== 0 || otherExpense !== 0) && (
              <SubtotalRow label="Net Income Before Tax" value={netIncomeBeforeTax} className="bg-yellow-50 border border-yellow-200" />
            )}

            {taxExpense !== 0 && (
              <div className="flex justify-between text-gray-600 py-0.5 mt-1">
                <span className="pl-3">Less: Tax Expense</span><span>({fmt(taxExpense)})</span>
              </div>
            )}

            <div className={`flex justify-between items-center px-3 py-2 rounded border mt-2 font-bold text-sm ${netIncomeBg} ${netIncomeColor}`}>
              <span>Net Income / (Loss)</span>
              <span className="font-mono">{fmt(netIncome)}</span>
            </div>

            {/* Ratios */}
            {totalRevenue !== 0 && (
              <div className="border-t pt-2 mt-2 space-y-1 text-[10px] text-gray-600">
                <div className="font-semibold text-gray-700 mb-1">Ratios</div>
                <div className="flex justify-between">
                  <span>Gross Profit Margin</span>
                  <span className={grossProfit / totalRevenue >= 0 ? 'text-blue-700' : 'text-red-700'}>
                    {((grossProfit / totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Margin</span>
                  <span className={operatingIncome / totalRevenue >= 0 ? 'text-indigo-700' : 'text-red-700'}>
                    {((operatingIncome / totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Net Profit Margin</span>
                  <span className={netIncome / totalRevenue >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                    {((netIncome / totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Account types legend */}
          {accountTypes.length > 0 && (
            <div className="bg-white rounded-lg border p-3">
              <h3 className="font-semibold text-gray-700 text-[11px] mb-2 border-b pb-1">Account Type Classification</h3>
              <div className="space-y-1">
                {accountTypes.map(at => {
                  const cat = classifyAccountType(at.name)
                  const badge: Record<PLCategory, string> = {
                    revenue: 'bg-green-100 text-green-800',
                    cost_of_sales: 'bg-orange-100 text-orange-800',
                    operating_expense: 'bg-red-100 text-red-800',
                    other_income: 'bg-teal-100 text-teal-800',
                    other_expense: 'bg-rose-100 text-rose-800',
                    tax: 'bg-gray-200 text-gray-700',
                    balance_sheet: 'bg-gray-100 text-gray-500',
                  }
                  const labels: Record<PLCategory, string> = {
                    revenue: 'Revenue',
                    cost_of_sales: 'Cost of Sales',
                    operating_expense: 'Op. Expense',
                    other_income: 'Other Income',
                    other_expense: 'Other Expense',
                    tax: 'Tax',
                    balance_sheet: 'Balance Sheet',
                  }
                  return (
                    <div key={at.id} className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-700 truncate mr-2">{at.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${badge[cat]}`}>
                        {labels[cat]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uncategorised accounts with period activity (balance-sheet accounts that moved) */}
      {uncategorised.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <button
            onClick={() => toggleSection('balance_sheet')}
            className="w-full flex justify-between items-center px-3 py-2 bg-gray-500 text-white text-[11px] font-semibold"
          >
            <div className="flex items-center gap-1.5">
              {collapsedSections['balance_sheet'] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              BALANCE SHEET ACCOUNTS (excluded from P&L)
            </div>
            <span className="font-mono text-[10px]">{uncategorised.length} accounts</span>
          </button>
          {!collapsedSections['balance_sheet'] && (
            <div className="divide-y divide-gray-100">
              {uncategorised.map(acc => (
                <button
                  key={acc.account_id}
                  onClick={() => openJournalEntries(acc.account_id)}
                  className="w-full flex justify-between items-center px-3 py-1.5 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-gray-500">{acc.account_code}</span>
                    <span className="text-[11px] text-gray-700">{acc.account_name}</span>
                    <span className="text-[10px] text-gray-400">({acc.category})</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-600">{fmt(acc.period_balance)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <p className="text-[10px] text-gray-400 text-center">
        Click any account row to view its journal entries for the selected period.
        Account type classifications are derived automatically from account type names.
      </p>
    </div>
  )
}

export default ProfitLoss
