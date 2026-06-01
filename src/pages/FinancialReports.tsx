import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Users,
  Receipt,
  Wallet,
  Fuel,
  BarChart3,
  TrendingUp
} from 'lucide-react'

interface ReportLink {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const FinancialReports: React.FC = () => {
  const navigate = useNavigate()

  const reports: ReportLink[] = [
    {
      name: 'Chart of Accounts',
      href: '/chart-of-accounts',
      icon: FileText,
      description: 'View and manage all accounts in the chart of accounts'
    },
    {
      name: 'Trial Balance',
      href: '/trial-balance',
      icon: BarChart3,
      description: 'View trial balance report for all accounts'
    },
    {
      name: 'Profit & Loss',
      href: '/profit-loss',
      icon: TrendingUp,
      description: 'Income statement showing revenue, expenses and net income'
    },
    {
      name: 'Journal Entries',
      href: '/journal-entries',
      icon: FileText,
      description: 'View and manage journal entries'
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: Receipt,
      description: 'View customer invoices and billing reports'
    },
    {
      name: 'Payables',
      href: '/payables',
      icon: Wallet,
      description: 'View accounts payable and supplier invoices'
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      description: 'View and manage expense reports'
    },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: Users,
      description: 'View payroll reports and employee payments'
    },
    {
      name: 'Fueling',
      href: '/fueling',
      icon: Fuel,
      description: 'View fueling expenses and reports'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-1 text-xs text-gray-500">
            Access all financial reports and accounting information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.href}
              onClick={() => navigate(report.href)}
              className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {report.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FinancialReports
