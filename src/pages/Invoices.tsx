import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiService, BookingPassenger } from '../services/api';
import { 
  Search, 
  Download, 
  RefreshCw, 
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';

interface InvoiceByDate {
  date: string;
  totalAmount: number;
  passengerCount: number;
  bookingPassengers: BookingPassenger[];
}

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoicesByDate, setInvoicesByDate] = useState<InvoiceByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings with bookingPassengers
      const result = await adminApiService.getBookings(1, 10000);
      
      // Extract all booking passengers
      const allBookingPassengers: BookingPassenger[] = [];
      result.bookings.forEach(booking => {
        if (booking.bookingPassengers && booking.bookingPassengers.length > 0) {
          booking.bookingPassengers.forEach(bp => {
            allBookingPassengers.push(bp);
          });
        }
      });
      
      // Group by the passenger's actual travel date (not when the booking was made) —
      // falls back to the flight's flight_date, then created_at, for older rows that
      // predate the travel_date column.
      const dateMap: { [key: string]: BookingPassenger[] } = {};

      allBookingPassengers.forEach(bp => {
        const dateKey = bp.travel_date
          ? String(bp.travel_date).slice(0, 10)
          : bp.flight?.flight_date
          ? String(bp.flight.flight_date).slice(0, 10)
          : new Date(bp.created_at).toISOString().split('T')[0];

        if (!dateMap[dateKey]) {
          dateMap[dateKey] = [];
        }

        dateMap[dateKey].push(bp);
      });
      
      // Convert to array and calculate totals
      const invoices: InvoiceByDate[] = Object.keys(dateMap)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort by date descending
        .map(date => {
          const passengers = dateMap[date];
          const total = passengers.reduce((sum, bp) => sum + Number(bp.fare_amount || 0), 0);
          
          return {
            date,
            totalAmount: total,
            passengerCount: passengers.length,
            bookingPassengers: passengers
          };
        });
      
      // Calculate grand totals
      const grandTotal = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const grandTotalPassengers = invoices.reduce((sum, inv) => sum + inv.passengerCount, 0);
      
      setInvoicesByDate(invoices);
      setTotalAmount(grandTotal);
      setTotalPassengers(grandTotalPassengers);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoicesByDate([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const filteredInvoices = invoicesByDate.filter(invoice => {
    const dateStr = formatDate(invoice.date).toLowerCase();
    return dateStr.includes(searchTerm.toLowerCase());
  });

  const handleDateClick = (invoice: InvoiceByDate) => {
    navigate(`/invoices/${invoice.date}`)
  };


  const exportToCSV = () => {
    const headers = ['Date', 'Total Amount', 'Passenger Count'];
    const csvData = filteredInvoices.map(invoice => [
      formatDate(invoice.date),
      invoice.totalAmount.toFixed(2),
      invoice.passengerCount.toString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-[11px] text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Invoices</h1>
          <p className="text-[11px] text-gray-600">Revenue grouped by date from booking passengers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px]"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="admin-card rounded shadow-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-600">Total Revenue</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="p-1 bg-green-100 rounded-full">
              <DollarSign className="h-3 w-3 text-green-600" />
              </div>
            </div>
          </div>
          
        <div className="admin-card rounded shadow-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-600">Total Passengers</p>
              <p className="text-sm font-bold text-gray-900">
                {totalPassengers.toLocaleString()}
              </p>
            </div>
            <div className="p-1 bg-blue-100 rounded-full">
              <Users className="h-3 w-3 text-blue-600" />
              </div>
            </div>
          </div>
          
        <div className="admin-card rounded shadow-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-600">Total Days</p>
              <p className="text-sm font-bold text-gray-900">
                {invoicesByDate.length.toLocaleString()}
              </p>
            </div>
            <div className="p-1 bg-purple-100 rounded-full">
              <Calendar className="h-3 w-3 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
            <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
            placeholder="Search by date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                  Passengers
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                  Avg per Passenger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-[11px] text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.date} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleDateClick(invoice)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <Calendar className="h-3 w-3" />
                        <span className="text-[11px] font-medium">{formatDate(invoice.date)}</span>
                      </button>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-600">
                        {invoice.passengerCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-gray-600">
                        {invoice.passengerCount > 0 
                          ? formatCurrency(invoice.totalAmount / invoice.passengerCount)
                          : formatCurrency(0)
                        }
                      </span>
                  </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-2 py-1.5 text-[11px] font-bold text-gray-900">
                    Grand Total
                  </td>
                  <td className="px-2 py-1.5 text-right text-[11px] font-bold text-gray-900">
                    {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0))}
                  </td>
                  <td className="px-2 py-1.5 text-right text-[11px] font-bold text-gray-900">
                    {filteredInvoices.reduce((sum, inv) => sum + inv.passengerCount, 0).toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-right text-[11px] font-bold text-gray-900">
                    {(() => {
                      const totalPass = filteredInvoices.reduce((sum, inv) => sum + inv.passengerCount, 0);
                      const totalAmt = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                      return totalPass > 0 ? formatCurrency(totalAmt / totalPass) : formatCurrency(0);
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};

export default Invoices;
