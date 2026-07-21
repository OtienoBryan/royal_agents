// Admin API service for backend communication

// Get API base URL from environment variable
const envApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
const API_BASE_URL = envApiUrl || '/api'

// Debug: Log the API base URL being used (visible in console)
console.log('🔧 [API] ==========================================')
console.log('🔧 [API] API_BASE_URL:', API_BASE_URL)
console.log('🔧 [API] VITE_API_BASE_URL env:', envApiUrl || '(not set - using default /api)')
console.log('🔧 [API] All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
console.log('🔧 [API] ==========================================')

// Show alert if env var is not set in production (for debugging)
if (import.meta.env.PROD && !envApiUrl) {
  console.warn('⚠️ [API] VITE_API_BASE_URL is not set! Using Vercel proxy (/api)')
}

export interface SubCategory {
  id: number
  name: string
  description: string
  isActive: boolean
  categoryId: number
  category: Category
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id?: number
  name: string
  description?: string
  logo?: string
  website?: string
  country?: string
  foundedYear?: number
  categoryId?: number
  category?: Category
  productCount?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: number
  name: string
  description: string
  subcategories?: SubCategory[]
}

export interface Task {
  id: number
  title: string
  description: string
  createdAt: string
  completedAt?: string | null
  isCompleted: boolean
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  salesRepId?: string // JSON string of sales rep IDs
  assignedById?: number
  date: string
  salesReps?: SalesRep[] // Array of sales reps
  assignedBy?: SalesRep
}

export interface CreateTaskDto {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  salesRepId?: string // JSON string of sales rep IDs
  assignedById?: number
  date: string
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  salesRepId?: string // JSON string of sales rep IDs
  assignedById?: number
  date?: string
  isCompleted?: boolean
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
  inProgress: number
  cancelled: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  stock: number
  image: string
  images?: string[]
  brand: string
  brandId?: number
  alcoholContent: string
  volume: string
  origin: string
  tags: string[]
  rating: number
  reviewCount: number
  isActive: boolean
  isFeatured: boolean
  requiresAgeVerification: boolean
  category: Category
  categoryId: number
  createdAt: string
  updatedAt: string
}

export interface DatabaseProduct {
  id: number
  product_name: string
  product_code: string
  description: string
  category: string
  unit_of_measure: string
  cost_price: number
  selling_price: number
  tax_type: string
  reorder_level: number
  current_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
  image_url: string | null
}

export interface Aircraft {
  id: number
  name: string
  registration: string
  capacity: number | null
  max_cargo_weight: number | null
  category_id: number | null
  category?: Category | null
  created_by: number | null
  createdByStaff?: {
    id: number
    name: string
  } | null
  status: string
  calendar_color: string | null
  created_at: string
  updated_at: string
}

export interface Destination {
  id: number
  code: string
  name: string
  country_id: number | null
  country?: {
    id: number
    name: string
  } | null
  longitude: number | null
  latitude: number | null
  timezone: string | null
  status: string
  father_code: string | null
  destination: string | null
  destination_type: string
  created_at: string
  updated_at: string
}

export interface IataCode {
  id: number
  code: string
  icao: string | null
  airport: string
  city: string | null
  country_code: string
  region_name: string | null
  latitude: number | null
  longitude: number | null
  status: string
  created_at: string
  updated_at: string
}


export interface FlightSeries {
  id: number
  flt: string
  aircraft_id: number | null
  aircraft?: {
    id: number
    name: string
    registration: string
    calendar_color: string | null
  } | null
  flight_type: string
  start_date: string
  end_date: string
  std: string | null
  sta: string | null
  number_of_seats: number | null
  from_destination_id: number | null
  fromDestination?: {
    id: number
    code: string
    name: string
  } | null
  from_terminal: string | null
  to_terminal: string | null
  via_destination_id: number | null
  viaDestination?: {
    id: number
    code: string
    name: string
  } | null
  via_std: string | null
  via_sta: string | null
  to_destination_id: number | null
  toDestination?: {
    id: number
    code: string
    name: string
  } | null
  adult_fare: number | null
  child_fare: number | null
  infant_fare: number | null
  flightCrew?: {
    id: number
    flight_series_id: number
    crew_id: number
    crew?: Crew | null
  }[]
  created_at: string
  updated_at: string
}

export interface SeatReservation {
  id: number
  flight_series_id: number
  passenger_id?: number | null
  agent_id?: number | null
  agent?: {
    id: number
    name: string
    agency_id?: number | null
    agency?: {
      id: number
      name: string
    } | null
  } | null
  flightSeries?: {
    id: number
    flt: string
    flight_type: string
    start_date: string
    fromDestination?: {
      id: number
      code: string
      name: string
    } | null
    toDestination?: {
      id: number
      code: string
      name: string
    } | null
    viaDestination?: {
      id: number
      code: string
      name: string
    } | null
  } | null
  passenger?: {
    id: number
    pnr: string
    name: string
    email: string | null
    contact: string | null
  } | null
  number_of_seats: number
  passenger_name: string
  passenger_email: string | null
  passenger_phone: string | null
  booking_reference: string
  status: string
  reservation_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BookingPassenger {
  id: number
  booking_id: number
  passenger_id: number
  passenger?: Passenger | null
  passenger_type: string
  fare_amount: number
  travel_date: string | null
  flight?: { id: number; flight_date: string | null } | null
  created_at: string
}

export interface Booking {
  id: number
  booking_reference: string
  flight_series_id: number
  flightSeries?: FlightSeries | null
  passenger_id: number | null
  passenger?: Passenger | null
  bookingPassengers?: BookingPassenger[] | null
  passenger_name: string
  passenger_email: string | null
  passenger_phone: string | null
  passenger_type: string
  number_of_passengers: number
  fare_per_passenger: number
  total_amount: number
  payment_method: string
  payment_status: string
  booking_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CargoBooking {
  id: number
  awb_number: string
  flight_series_id: number | null
  flightSeries?: FlightSeries | null
  origin: string
  destination: string
  shipper_name: string
  shipper_contact: string | null
  shipper_phone: string | null
  shipper_address: string | null
  consignee_name: string
  consignee_contact: string | null
  consignee_phone: string | null
  consignee_address: string | null
  commodity_type: string
  special_handling_codes: string | null
  pieces: number
  gross_weight_kg: number
  chargeable_weight_kg: number
  volume_cbm: number | null
  currency: string
  payment_term: 'PREPAID' | 'COLLECT'
  rate_per_kg: number | null
  total_charges: number
  booking_date: string
  status: 'booked' | 'accepted' | 'manifested' | 'flown' | 'delivered' | 'cancelled'
  remarks: string | null
  created_at: string
  updated_at: string
}

export interface Passenger {
  id: number
  pnr: string
  name: string
  email: string | null
  contact: string | null
  nationality: string | null
  identification: string | null
  age: number | null
  title: string | null
  booking_status: string | null
  created_at: string
  updated_at: string
}

export interface Luggage {
  id: number
  passenger_id: number
  tag_number: string | null
  weight: number | null
  created_at: string
  updated_at: string
}

export interface Country {
  id: number
  name: string
  // Optional ISO/country code (used when matching against IATA country_code)
  code?: string
  status?: number | undefined
}

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface SalesOrder {
  id: number
  soNumber: string
  clientId: number
  orderDate: string
  expectedDeliveryDate?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  netPrice: number
  notes?: string
  createdBy?: string
  salesrep?: number
  createdAt: string
  updatedAt: string
  riderId?: number
  assignedAt?: string
  recipientsName?: string
  recipientsContact?: string
  dispatchedBy?: number
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'in payment' | 'paid'
  myStatus: number
  receivedIntoStock: boolean
  deliveredAt?: string
  deliveryNotes: string
  receivedBy: number
  receivedAt?: string
  deliveryImage?: string
  returnedAt?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}

export interface OrderItem {
  id: number
  salesOrderId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  orderDate: string
  soNumber: string
}

export interface ProductPerformanceData {
  productId: number
  productName: string
  totalQuantitySold: number
  totalRevenue: number
  averagePrice: number
  orderCount: number
  lastSoldDate: string
  monthlyData: {
    month: string
    monthNumber: number
    quantity: number
    revenue: number
    orderCount: number
  }[]
}

export interface ProductPerformanceSummary {
  totalProducts: number
  totalRevenue: number
  totalQuantitySold: number
  averageOrderValue: number
  topPerformingProduct: {
    productName: string
    revenue: number
  }
}

export interface ReceivableAgingData {
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalOutstanding: number;
  current: number; // 0-30 days
  days31to60: number; // 31-60 days
  days61to90: number; // 61-90 days
  days91to120: number; // 91-120 days
  over120Days: number; // Over 120 days
  lastPaymentDate: Date | null;
  lastPaymentAmount: number;
}

export interface ReceivableAgingSummary {
  totalOutstanding: number;
  totalClients: number;
  currentTotal: number;
  days31to60Total: number;
  days61to90Total: number;
  days91to120Total: number;
  over120DaysTotal: number;
}

export interface InvoiceData {
  id: number;
  soNumber: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  orderDate: Date;
  expectedDeliveryDate: Date | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  netPrice: number;
  notes: string | null;
  createdBy: string | null;
  salesrep: number | null;
  createdAt: Date;
  updatedAt: Date;
  riderId: number | null;
  assignedAt: Date | null;
  recipientsName: string | null;
  recipientsContact: string | null;
  dispatchedBy: number | null;
  status: string;
  myStatus: number;
  receivedIntoStock: boolean;
  deliveredAt: Date | null;
  deliveryNotes: string | null;
  receivedBy: number | null;
  receivedAt: Date | null;
  deliveryImage: string | null;
  returnedAt: Date | null;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  totalSubtotal: number;
  totalTax: number;
  statusCounts: {
    draft: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    inPayment: number;
    paid: number;
  };
  myStatusCounts: {
    status1: number;
    status2: number;
    status3: number;
    status4: number;
    status5: number;
  };
}

export interface Order {
  id: number
  orderNumber: string
  userId: number
  user: User
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'assigned' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' // Updated to include 'assigned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: string
  billingAddress?: string
  notes?: string
  riderId?: number
  rider?: Rider
  assignedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Rider {
  id: number
  name: string
  contact: string
  cashLimit: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalOrders: number
  totalUsers: number
  recentOrders: Order[]
}

// Country interface already defined above

export interface Notice {
  id: number
  title: string
  content: string
  countryId: number
  country?: Country
  createdAt: string
  status: number
}

export interface NoticeStats {
  total: number
  active: number
  inactive: number
}

export interface SalesRep {
  id: number
  name: string
  email: string
  phoneNumber: string
  password?: string // Exclude from display
  photoUrl?: string // Profile photo URL
  countryId: number
  country: string
  region_id: number
  region: string
  route_id: number
  route: string
  route_id_update: number
  route_name_update: string
  visits_targets: number
  new_clients: number
  vapes_targets: number
  pouches_targets: number
  role: string
  manager_type: number
  status: number
  createdAt: string
}

export interface SalesRepStats {
  total: number
  active: number
  inactive: number
  byCountry: Record<string, number>
  byRegion: Record<string, number>
}

export interface AttendanceRecord {
  id: number
  userId: number
  salesRepName: string
  salesRepEmail: string
  timezone: string
  duration: number
  status: number
  sessionStart: string
  sessionEnd: string
  country: string
  region: string
  route: string
}

export interface AttendanceStats {
  totalSessions: number
  totalDuration: number
  averageSessionDuration: number
  activeSalesReps: number
  byStatus: Record<number, number>
  byCountry: Record<string, number>
  byRegion: Record<string, number>
}

export interface Region {
  id: number
  name: string
  countryId: number
  status: number
}

export interface Route {
  id: number
  name: string
  region: number
  region_name: string
  country_id: number
  country_name: string
  sales_rep_id: number
  sales_rep_name: string
  leader_id: number
  leader_name: string
  status: number
}

export interface Staff {
  id: number
  name: string
  photo_url: string
  empl_no: string
  id_no: string
  role: string
  designation: string
  phone_number: string
  password: string
  department: string
  department_id: number
  business_email: string
  department_email: string
  salary: number
  employment_type: string
  gender: 'Male' | 'Female' | 'Other'
  created_at: string
  updated_at: string
  is_active: number
  avatar_url: string
  status: number
}

export interface StaffStats {
  total: number
  active: number
  inactive: number
  byDepartment: Record<string, number>
  byRole: Record<string, number>
  byGender: Record<string, number>
  byEmploymentType: Record<string, number>
}

export interface Department {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Crew {
  id: number
  name: string
  contact: string | null
  role: string
  nationality: string | null
  id_number: string | null
  license_number: string | null
  license_issue_date: string | null
  medical_class: string | null
  medical_date: string | null
  fixed_wing_training_date: string | null
  rotorcraft_asel: string | null
  rotorcraft_amel: string | null
  rotorcraft_ases: string | null
  rotorcraft_ames: string | null
  created_at: string
  updated_at: string
}

export interface Agency {
  id: number
  name: string
  contact: string | null
  city: string | null
  country: string | null
  booking_limit: number | null
  credit_limit: number | null
  max_pax_per_booking: number | null
  default_currency: string | null
  credit_days: number | null
  payment_limit: number | null
  balance: number
  created_at: string
  updated_at: string
  current_balance?: number
}

export interface AgencyLedger {
  id: number
  agencyId: number
  transactionDate: string
  description: string | null
  debit: number
  credit: number
  balance: number
  reference: string | null
  createdAt: string
  updatedAt: string
}

export interface AgencyDeposit {
  id: number
  agencyId: number
  accountId: number
  amount: number
  datePaid: string
  description: string
  paymentMethod: string
  reference: string
  createdAt: string
  updatedAt: string
  agency?: Agency
  account?: Account
}

export interface Agent {
  id: number
  name: string
  email: string | null
  country: string | null
  contact: string | null
  agency_id: number | null
  agency?: Agency | null
  use_deposit: boolean
  created_at: string
  updated_at: string
}

export interface Account {
  id: number
  name: string
  code: string
  currency: string | null
  balance: number
  status: string
  created_at: string
  updated_at: string
}

export interface AccountLedger {
  id: number
  account_id: number
  transactionDate: string
  description: string | null
  debit: number
  credit: number
  balance: number
  reference: string | null
  payment_method: string | null
  createdAt: string
}

export interface AccountType {
  id: number
  name: string
  created_at: string
}

export interface ChartOfAccount {
  id: number
  name: string
  code: string
  account_type: number
  accountType?: AccountType
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: number
  supplier_code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  payment_terms: number
  credit_limit: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface SupplierStats {
  total: number
  active: number
  inactive: number
  totalCreditLimit: number
}

export interface PurchaseOrder {
  id: number
  po_number: string
  invoice_number: string
  supplier_id: number
  order_date: string
  expected_delivery_date?: string
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  subtotal: number
  tax_amount: number
  total_amount: number
  amount_paid: number
  balance: number
  notes?: string
  created_by: number
  created_at?: string
  updated_at?: string
  supplier?: Supplier
  creator?: {
    id: number
    name: string
    business_email: string
  }
}

export interface PurchaseOrderStats {
  total: number
  draft: number
  sent: number
  received: number
  cancelled: number
  totalAmount: number
  totalPaid: number
  totalBalance: number
  totalValue: number
  recentOrders: PurchaseOrder[]
}

export interface SupplierInvoiceStats {
  totalOrders: number
  totalAmount: number
  totalPaid: number
  totalBalance: number
  recentOrders: PurchaseOrder[]
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  received_quantity?: number
  tax_amount?: number
  tax_type?: string
  product?: {
    id: number
    product_name: string
    product_code: string
    description?: string
    category?: string
    unit_of_measure?: string
    cost_price?: number
    selling_price?: number
    tax_type?: string
  }
}

class AdminApiService {
  private authToken: string | null = null

  constructor() {
    this.authToken = localStorage.getItem('adminToken')
    console.log('🔐 [API] Initialized with token:', this.authToken ? 'Present' : 'Missing')
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure endpoint starts with / if API_BASE_URL doesn't end with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    // Remove trailing slash from API_BASE_URL if present, to avoid double slashes
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const url = `${baseUrl}${normalizedEndpoint}`

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData

    const config: RequestInit = {
      headers: {
        // Only set Content-Type for non-FormData requests
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    }

    console.log('🔧 [API] Making request to:', url)
    console.log('🔧 [API] Base URL:', API_BASE_URL)
    console.log('🔧 [API] Endpoint:', endpoint)
    console.log('🔧 [API] Headers:', config.headers)
    console.log('🔧 [API] Method:', config.method || 'GET')

    try {
      console.log(`🌍 Making admin API request to: ${url}`)
      console.log(`🌍 Headers:`, config.headers)
      console.log(`🌍 Method:`, config.method)
      if (config.body) {
        console.log(`🌍 Request body (raw):`, config.body)
        if (typeof config.body === 'string') {
          try {
            const parsed = JSON.parse(config.body)
            console.log(`🌍 Request body (parsed):`, parsed)
            console.log(`🌍 Request body country_id:`, parsed.country_id, 'Type:', typeof parsed.country_id)
          } catch (e) {
            console.log(`🌍 Request body is not JSON`)
          }
        }
      }
      const response = await fetch(url, config)

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        let serverMessage: string | string[] | null = null

        try {
          const errorText = await response.text()
          console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`)

          // Try to parse as JSON for structured error messages
          try {
            const errorData = JSON.parse(errorText)

            // Handle validation errors (array of messages)
            if (Array.isArray(errorData.message)) {
              serverMessage = errorData.message
              errorMessage = errorData.message.join(', ')
            }
            // Handle single error message
            else if (errorData.message) {
              serverMessage = errorData.message
              errorMessage = errorData.message
            }
            // Handle error array (alternative format)
            else if (Array.isArray(errorData)) {
              serverMessage = errorData
              errorMessage = errorData.join(', ')
            }
          } catch {
            // If JSON parsing fails, use the raw text
            if (errorText) {
              serverMessage = errorText
              errorMessage = errorText.length > 200 ? `${errorText.substring(0, 200)}...` : errorText
            }
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse error response:`, parseError)
        }

        // Only use generic messages if we didn't get a specific error message from the server
        if (!serverMessage) {
          switch (response.status) {
            case 401:
              errorMessage = 'Invalid credentials. Please check your email and password.'
              break
            case 403:
              errorMessage = 'Access denied. You do not have permission to access this resource.'
              break
            case 404:
              errorMessage = 'Service not found. Please contact support.'
              break
            case 500:
              errorMessage = 'Server error. Please try again later or contact support.'
              break
            case 503:
              errorMessage = 'Service temporarily unavailable. Please try again later.'
              break
          }
        }

        const error = new Error(errorMessage) as any
        error.status = response.status
        error.serverMessage = serverMessage
        throw error
      }

      const data = await response.json()
      console.log('✅ Admin API response:', data)
      console.log('✅ Admin API response type:', typeof data)
      console.log('✅ Admin API response is array:', Array.isArray(data))
      if (data && typeof data === 'object') {
        console.log('✅ Admin API response keys:', Object.keys(data))
      }
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      const err = error as any

      if (err.name === 'AbortError') {
        console.error(`❌ Request timeout for ${endpoint}`)
        throw new Error('Request timeout. Please check your internet connection and try again.')
      }

      if (err.message && err.message.includes('Failed to fetch')) {
        console.error(`❌ Network error for ${endpoint}`)
        throw new Error('Network error. Please check your internet connection and try again.')
      }

      console.error(`❌ Admin API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Authentication
  async login(email: string, password: string, retryCount: number = 0): Promise<{ token: string; user: User }> {
    const maxRetries = 2

    try {
      // Basic input validation
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      if (!email.includes('@') || email.length < 5) {
        throw new Error('Please enter a valid email address')
      }

      if (password.length < 3) {
        throw new Error('Password must be at least 3 characters long')
      }

      console.log('🔐 [Login] Attempting login for:', email)

      const response = await this.request<{ token: string; user: User }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (response.token) {
        this.authToken = response.token
        localStorage.setItem('adminToken', response.token)
        console.log('✅ [Login] Login successful for:', email)
      }

      return response
    } catch (error) {
      console.error(`❌ [Login] Attempt ${retryCount + 1} failed:`, error)

      // Retry logic for network errors
      if (retryCount < maxRetries &&
        ((error as any).message?.includes('Network error') ||
          (error as any).message?.includes('Request timeout') ||
          (error as any).message?.includes('Server error'))) {
        console.log(`🔄 [Login] Retrying login attempt ${retryCount + 2}/${maxRetries + 1}`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
        return this.login(email, password, retryCount + 1)
      }

      throw error
    }
  }

  logout(): void {
    this.authToken = null
    localStorage.removeItem('adminToken')
  }

  // Categories Management
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/admin/categories')
  }

  async getCategoryById(id: number): Promise<Category> {
    return this.request<Category>(`/admin/categories/${id}`)
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    return this.request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  async updateCategory(id: number, categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
    return this.request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // SubCategories Management
  async getSubCategories(categoryId?: number): Promise<SubCategory[]> {
    const url = categoryId ? `/subcategories?categoryId=${categoryId}` : '/subcategories'
    console.log('Admin API: Getting subcategories for categoryId:', categoryId, 'URL:', url)
    const result = await this.request<SubCategory[]>(url)
    console.log('Admin API: Received subcategories:', result)
    return result
  }

  async getSubCategoryById(id: number): Promise<SubCategory> {
    return this.request<SubCategory>(`/subcategories/${id}`)
  }

  async createSubCategory(subCategoryData: Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<SubCategory> {
    return this.request<SubCategory>('/subcategories', {
      method: 'POST',
      body: JSON.stringify(subCategoryData),
    })
  }

  async updateSubCategory(id: number, subCategoryData: Partial<Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<SubCategory> {
    return this.request<SubCategory>(`/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subCategoryData),
    })
  }

  async deleteSubCategory(id: number): Promise<void> {
    return this.request<void>(`/subcategories/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleSubCategoryStatus(id: number): Promise<SubCategory> {
    return this.request<SubCategory>(`/subcategories/${id}/toggle-active`, {
      method: 'PUT',
    })
  }

  // Products Management
  async getProducts(page: number = 1, limit: number = 10): Promise<{ products: DatabaseProduct[], total: number }> {
    console.log('📦 [API] Making real API call for products')
    try {
      const result = await this.request<{ products: DatabaseProduct[], total: number }>(`/admin/products?page=${page}&limit=${limit}`)
      console.log('📦 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📦 [API] Real API call failed:', error)
      throw error
    }
  }

  async getProductById(id: number): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`)
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Product> {
    return this.request<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/admin/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Orders Management
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/admin/orders')
  }

  async getOrderById(id: number): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}`)
  }

  async updateOrderStatus(id: number, status: Order['status'], paymentStatus: Order['paymentStatus']): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, paymentStatus }),
    })
  }

  async assignRider(orderId: number, riderId: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/assign-rider`, {
      method: 'PUT',
      body: JSON.stringify({ riderId }),
    })
  }

  async unassignRider(orderId: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/unassign-rider`, {
      method: 'PUT',
    })
  }

  async deleteOrder(id: number): Promise<void> {
    return this.request<void>(`/admin/orders/${id}`, {
      method: 'DELETE',
    })
  }

  // Users/Clients Management
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/admin/users')
  }

  async getUserById(id: number): Promise<User> {
    return this.request<User>(`/admin/users/${id}`)
  }

  async updateUser(id: number, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    return this.request<User>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleUserStatus(id: number): Promise<User> {
    return this.request<User>(`/admin/users/${id}/toggle-status`, {
      method: 'PUT',
    })
  }

  // Riders Management
  async getRiders(): Promise<Rider[]> {
    return this.request<Rider[]>('/riders')
  }

  async getRiderById(id: number): Promise<Rider> {
    return this.request<Rider>(`/riders/${id}`)
  }

  async createRider(riderData: Omit<Rider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rider> {
    return this.request<Rider>('/riders', {
      method: 'POST',
      body: JSON.stringify(riderData),
    })
  }

  async updateRider(id: number, riderData: Partial<Omit<Rider, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Rider> {
    return this.request<Rider>(`/riders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(riderData),
    })
  }

  async deleteRider(id: number): Promise<void> {
    return this.request<void>(`/riders/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleRiderStatus(id: number): Promise<Rider> {
    return this.request<Rider>(`/riders/${id}/toggle-active`, {
      method: 'PUT',
    })
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard')
  }

  // Brands Management
  async getBrands(): Promise<Brand[]> {
    console.log('🏷️ [API] getBrands called')
    console.log('  Making API request to /admin/brands')
    const result = await this.request<Brand[]>('/admin/brands')
    console.log('  Brands API result:', result)
    return result
  }

  async getBrandById(id: number): Promise<Brand> {
    return this.request<Brand>(`/admin/brands/${id}`)
  }

  async createBrand(brandData: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brand> {
    return this.request<Brand>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    })
  }

  async updateBrand(id: number, brandData: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Brand> {
    return this.request<Brand>(`/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brandData),
    })
  }

  async deleteBrand(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/admin/brands/${id}`, {
      method: 'DELETE',
    })
  }

  // Notices Management
  async getNotices(countryId?: number, status?: number, limit?: number, offset?: number): Promise<Notice[]> {
    console.log('📋 [API] getNotices called', { countryId, status, limit, offset })
    const params = new URLSearchParams()
    if (countryId) params.append('countryId', countryId.toString())
    if (status !== undefined) params.append('status', status.toString())
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    const url = `/notices${params.toString() ? `?${params.toString()}` : ''}`
    return this.request<Notice[]>(url)
  }

  async getActiveNotices(countryId?: number, limit?: number): Promise<Notice[]> {
    console.log('📋 [API] getActiveNotices called', { countryId, limit })
    const params = new URLSearchParams()
    if (countryId) params.append('countryId', countryId.toString())
    if (limit) params.append('limit', limit.toString())

    const url = `/notices/active${params.toString() ? `?${params.toString()}` : ''}`
    return this.request<Notice[]>(url)
  }

  async getNoticeById(id: number): Promise<Notice> {
    return this.request<Notice>(`/notices/${id}`)
  }

  async createNotice(noticeData: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> {
    return this.request<Notice>('/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData),
    })
  }

  async updateNotice(id: number, noticeData: Partial<Omit<Notice, 'id' | 'createdAt'>>): Promise<Notice> {
    return this.request<Notice>(`/notices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(noticeData),
    })
  }

  async deleteNotice(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notices/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleNoticeStatus(id: number): Promise<Notice> {
    return this.request<Notice>(`/notices/${id}/toggle-status`, {
      method: 'PATCH',
    })
  }

  async getNoticeStats(): Promise<NoticeStats> {
    return this.request<NoticeStats>('/notices/stats')
  }

  // Countries Management
  async getCountries(): Promise<Country[]> {
    console.log('🌍 [API] getCountries called')
    console.log('🌍 [API] Auth token:', this.authToken ? 'Present' : 'Missing')
    console.log('🌍 [API] Making real API call to /countries')
    try {
      const result = await this.request<Country[]>('/countries')
      console.log('🌍 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🌍 [API] Real API call failed:', error)
      // Fallback to mock data if API fails
      console.log('🌍 [API] Falling back to mock data due to API failure')
      return [
        { id: 1, name: 'United States', status: 1 },
        { id: 2, name: 'Canada', status: 1 },
        { id: 3, name: 'United Kingdom', status: 1 },
        { id: 4, name: 'Germany', status: 1 },
        { id: 5, name: 'France', status: 1 },
        { id: 6, name: 'Japan', status: 1 },
        { id: 7, name: 'Australia', status: 1 },
        { id: 8, name: 'Brazil', status: 1 },
        { id: 9, name: 'India', status: 1 },
        { id: 10, name: 'China', status: 1 }
      ]
    }
  }

  async getCountryById(id: number): Promise<Country> {
    return this.request<Country>(`/countries/${id}`)
  }

  async getCountryByName(name: string): Promise<Country> {
    return this.request<Country>(`/countries/name/${name}`)
  }

  // Sales Analytics
  async getSalesAnalytics(year?: number): Promise<{
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    monthlyData: Array<{
      month: string
      revenue: number
      orders: number
    }>
    topClients: Array<{
      client: User
      totalOrders: number
      totalRevenue: number
    }>
  }> {
    return this.request<{
      totalRevenue: number
      totalOrders: number
      averageOrderValue: number
      monthlyData: Array<{
        month: string
        revenue: number
        orders: number
      }>
      topClients: Array<{
        client: User
        totalOrders: number
        totalRevenue: number
      }>
    }>(`/admin/sales/analytics${year ? `?year=${year}` : ''}`)
  }


  // Sales Orders API (using sales_orders table)
  async getSalesOrders(year?: number, limit?: number, offset?: number): Promise<SalesOrder[]> {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    const url = `/admin/sales/orders${params.toString() ? `?${params.toString()}` : ''}`
    return this.request<SalesOrder[]>(url)
  }

  // Get all clients from Clients table
  async getAllClients(): Promise<Array<{
    id: number
    name: string
    email?: string
    contact: string
    address?: string
    region: string
    regionId: number
    routeName?: string
    routeId?: number
    balance?: number
    latitude?: number
    longitude?: number
  }>> {
    const url = '/admin/sales/clients-list'
    return this.request<Array<{
      id: number
      name: string
      email?: string
      contact: string
      address?: string
      region: string
      regionId: number
      routeName?: string
      routeId?: number
      balance?: number
      latitude?: number
      longitude?: number
    }>>(url)
  }

  // Get sales data for a specific client
  async getClientSalesData(clientId: number, year?: number): Promise<{
    clientId: number
    clientName: string
    clientEmail: string
    clientPhone: string
    clientCompany?: string
    clientStatus: string
    monthlyData: Array<{
      month: string
      year: number
      monthNumber: number
      totalOrders: number
      totalAmount: number
      orders: SalesOrder[]
    }>
    totalOrders: number
    totalAmount: number
    averageOrderValue: number
  } | null> {
    const url = `/admin/sales/client/${clientId}/sales${year ? `?year=${year}` : ''}`
    return this.request<{
      clientId: number
      clientName: string
      clientEmail: string
      clientPhone: string
      clientCompany?: string
      clientStatus: string
      monthlyData: Array<{
        month: string
        year: number
        monthNumber: number
        totalOrders: number
        totalAmount: number
        orders: SalesOrder[]
      }>
      totalOrders: number
      totalAmount: number
      averageOrderValue: number
    } | null>(url)
  }

  // Get order items for a specific client and month
  async getClientOrderItems(clientId: number, year: number, month: number): Promise<OrderItem[]> {
    console.log(`🔍 [API getClientOrderItems] Called with clientId: ${clientId}, year: ${year}, month: ${month}`)
    const url = `/admin/sales/client/${clientId}/order-items?year=${year}&month=${month}`
    console.log(`🌐 [API getClientOrderItems] Making API request to: ${url}`)

    try {
      const result = await this.request<OrderItem[]>(url)
      console.log(`✅ [API getClientOrderItems] API request successful:`, result)
      return result
    } catch (error) {
      console.error(`❌ [API getClientOrderItems] API request failed:`, error)
      throw error
    }
  }

  // Get sales data for multiple clients at once (optimized)
  async getBulkClientSalesData(clientIds: number[], year?: number): Promise<Array<{
    clientId: number
    clientName: string
    clientEmail: string
    clientPhone: string
    clientCompany?: string
    clientStatus: string
    monthlyData: Array<{
      month: string
      year: number
      monthNumber: number
      totalOrders: number
      totalAmount: number
      orders: SalesOrder[]
    }>
    totalOrders: number
    totalAmount: number
    averageOrderValue: number
  }>> {
    const url = `/admin/sales/bulk-sales-data`
    return this.request<Array<{
      clientId: number
      clientName: string
      clientEmail: string
      clientPhone: string
      clientCompany?: string
      clientStatus: string
      monthlyData: Array<{
        month: string
        year: number
        monthNumber: number
        totalOrders: number
        totalAmount: number
        orders: SalesOrder[]
      }>
      totalOrders: number
      totalAmount: number
      averageOrderValue: number
    }>>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientIds, year })
    })
  }

  // Get product performance data
  async getProductPerformance(year?: number): Promise<ProductPerformanceData[]> {
    console.log(`🔍 [API getProductPerformance] Called with year: ${year}`)
    const url = `/admin/sales/products/performance${year ? `?year=${year}` : ''}`
    console.log(`🌐 [API getProductPerformance] Making API request to: ${url}`)

    try {
      const result = await this.request<ProductPerformanceData[]>(url)
      console.log(`✅ [API getProductPerformance] API request successful:`, result)
      return result
    } catch (error) {
      console.error(`❌ [API getProductPerformance] API request failed:`, error)
      throw error
    }
  }

  // Get product performance summary
  async getProductPerformanceSummary(year?: number): Promise<ProductPerformanceSummary> {
    console.log(`🔍 [API getProductPerformanceSummary] Called with year: ${year}`)
    const url = `/admin/sales/products/performance/summary${year ? `?year=${year}` : ''}`
    console.log(`🌐 [API getProductPerformanceSummary] Making API request to: ${url}`)

    try {
      const result = await this.request<ProductPerformanceSummary>(url)
      console.log(`✅ [API getProductPerformanceSummary] API request successful:`, result)
      return result
    } catch (error) {
      console.error(`❌ [API getProductPerformanceSummary] API request failed:`, error)
      throw error
    }
  }

  async getAllClientSalesData(year?: number): Promise<Array<{
    clientId: number
    clientName: string
    clientEmail: string
    clientPhone: string
    clientCompany?: string
    clientStatus: string
    monthlyData: Array<{
      month: string
      year: number
      monthNumber: number
      totalOrders: number
      totalAmount: number
      orders: SalesOrder[]
    }>
    totalOrders: number
    totalAmount: number
    averageOrderValue: number
  }>> {
    const url = `/admin/sales/clients${year ? `?year=${year}` : ''}`
    return this.request<Array<{
      clientId: number
      clientName: string
      clientEmail: string
      clientPhone: string
      clientCompany?: string
      clientStatus: string
      monthlyData: Array<{
        month: string
        year: number
        monthNumber: number
        totalOrders: number
        totalAmount: number
        orders: SalesOrder[]
      }>
      totalOrders: number
      totalAmount: number
      averageOrderValue: number
    }>>(url)
  }

  // Receivable Aging API methods
  async getReceivableAging(): Promise<ReceivableAgingData[]> {
    const url = '/admin/receivable-aging';
    console.log(`🔍 [API] Fetching receivable aging from: ${url}`);

    return this.request<ReceivableAgingData[]>(url);
  }

  async getReceivableAgingSummary(): Promise<ReceivableAgingSummary> {
    const url = '/admin/receivable-aging/summary';
    console.log(`🔍 [API] Fetching receivable aging summary from: ${url}`);

    return this.request<ReceivableAgingSummary>(url);
  }

  // Invoices API methods
  async getInvoices(page: number = 1, limit: number = 10, search?: string, status?: string, myStatus?: number): Promise<{ invoices: InvoiceData[], total: number }> {
    console.log('🔍 [getInvoices] Starting invoice fetch...', { page, limit, search, status, myStatus });
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (myStatus !== undefined) params.append('myStatus', myStatus.toString());

    const url = `/admin/invoices?${params.toString()}`;
    console.log(`🌐 [getInvoices] Making API request to: ${url}`);

    try {
      const response = await this.request<{ invoices: InvoiceData[], total: number }>(url);
      console.log('✅ [getInvoices] API request successful:', response?.invoices?.length || 0, 'invoices, total:', response?.total || 0);
      console.log('📊 [getInvoices] Sample data:', response?.invoices?.slice(0, 2));
      return response;
    } catch (error) {
      console.error('❌ [getInvoices] API request failed:', error);
      console.error('❌ [getInvoices] Error details:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        response: (error as any)?.response
      });
      throw error;
    }
  }

  async getInvoiceSummary(): Promise<InvoiceSummary> {
    const url = '/admin/invoices/summary';
    console.log(`🔍 [API] Fetching invoice summary from: ${url}`);

    return this.request<InvoiceSummary>(url);
  }

  async getInvoiceById(id: number): Promise<InvoiceData | null> {
    const url = `/admin/invoices/${id}`;
    console.log(`🔍 [API] Fetching invoice ${id} from: ${url}`);

    return this.request<InvoiceData | null>(url);
  }

  async getInvoiceOrderItems(id: number): Promise<any[]> {
    const url = `/admin/invoices/${id}/order-items`;
    console.log(`🔍 [API] Fetching order items for invoice ${id} from: ${url}`);

    return this.request<any[]>(url);
  }

  // Sales Representatives Management
  async getSalesReps(): Promise<SalesRep[]> {
    console.log('👥 [API] getSalesReps called')
    return this.request<SalesRep[]>('/sales-reps')
  }

  async getSalesRepById(id: number): Promise<SalesRep> {
    return this.request<SalesRep>(`/sales-reps/${id}`)
  }

  async createSalesRep(salesRepData: Omit<SalesRep, 'id' | 'createdAt'>): Promise<SalesRep> {
    return this.request<SalesRep>('/sales-reps', {
      method: 'POST',
      body: JSON.stringify(salesRepData),
    })
  }

  async updateSalesRep(id: number, salesRepData: Partial<Omit<SalesRep, 'id' | 'createdAt'>>): Promise<SalesRep> {
    return this.request<SalesRep>(`/sales-reps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(salesRepData),
    })
  }

  async deleteSalesRep(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/sales-reps/${id}`, {
      method: 'DELETE',
    })
  }

  async getSalesRepStats(): Promise<SalesRepStats> {
    return this.request<SalesRepStats>('/sales-reps/stats')
  }

  async getSalesRepCountries(): Promise<Country[]> {
    console.log('🌍 [API] getSalesRepCountries called')
    console.log('🌍 [API] Making real API call to /sales-reps/countries')
    try {
      const result = await this.request<Country[]>('/sales-reps/countries')
      console.log('🌍 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🌍 [API] Real API call failed:', error)
      throw error
    }
  }

  async getSalesRepRegions(countryId?: number): Promise<Region[]> {
    console.log('🌍 [API] getSalesRepRegions called', { countryId })
    const url = countryId
      ? `/sales-reps/regions?countryId=${countryId}`
      : '/sales-reps/regions'

    console.log('🌍 [API] Making real API call to:', url)
    try {
      const result = await this.request<Region[]>(url)
      console.log('🌍 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🌍 [API] Real API call failed:', error)
      throw error
    }
  }

  async getSalesRepRoutes(regionId?: number): Promise<Route[]> {
    console.log('🛣️ [API] getSalesRepRoutes called', { regionId })
    const url = regionId
      ? `/sales-reps/routes?regionId=${regionId}`
      : '/sales-reps/routes'

    console.log('🛣️ [API] Making real API call to:', url)
    try {
      const result = await this.request<Route[]>(url)
      console.log('🛣️ [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🛣️ [API] Real API call failed:', error)
      throw error
    }
  }

  // Sales Rep Attendance Management
  async getSalesRepAttendanceRecords(
    salesRepId?: number,
    startDate?: string,
    endDate?: string,
    status?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<AttendanceRecord[]> {
    console.log('📊 [API] getSalesRepAttendanceRecords called', {
      salesRepId,
      startDate,
      endDate,
      status,
      limit,
      offset
    })

    console.log('📊 [API] Raw parameters received:', {
      salesRepIdType: typeof salesRepId,
      salesRepIdValue: salesRepId,
      startDateType: typeof startDate,
      startDateValue: startDate,
      endDateType: typeof endDate,
      endDateValue: endDate,
      statusType: typeof status,
      statusValue: status
    })
    const params = new URLSearchParams()
    if (salesRepId) params.append('salesRepId', salesRepId.toString())
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (status !== undefined) params.append('status', status.toString())
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())

    const url = `/sales-reps/attendance/records?${params.toString()}`
    console.log('📊 [API] Making real API call to:', url)
    console.log('📊 [API] URL parameters:', params.toString())

    try {
      const result = await this.request<AttendanceRecord[]>(url)
      console.log('📊 [API] Real API call result:', result.map(r => ({
        id: r.id,
        sessionStart: r.sessionStart,
        sessionEnd: r.sessionEnd,
        duration: r.duration
      })))
      return result
    } catch (error) {
      console.error('📊 [API] Real API call failed:', error)
      throw error
    }
  }

  async getSalesRepAttendanceStats(
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceStats> {
    console.log('📊 [API] getSalesRepAttendanceStats called', { startDate, endDate })
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `/sales-reps/attendance/stats?${params.toString()}`
    console.log('📊 [API] Making real API call to:', url)

    try {
      const result = await this.request<AttendanceStats>(url)
      console.log('📊 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📊 [API] Real API call failed:', error)
      throw error
    }
  }

  // Staff Management
  async getStaff(): Promise<Staff[]> {
    console.log('👥 [API] getStaff called')
    console.log('👥 [API] Making real API call')
    try {
      const result = await this.request<Staff[]>('/staff')
      console.log('👥 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('👥 [API] Real API call failed:', error)
      throw error
    }
  }

  async getStaffById(id: number): Promise<Staff> {
    return this.request<Staff>(`/staff/${id}`)
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'created_at' | 'updated_at'>): Promise<Staff> {
    return this.request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    })
  }

  async updateStaff(id: number, staffData: Partial<Omit<Staff, 'id' | 'created_at' | 'updated_at'>>): Promise<Staff> {
    return this.request<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    })
  }

  async deleteStaff(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/staff/${id}`, {
      method: 'DELETE',
    })
  }

  async getStaffStats(): Promise<StaffStats> {
    return this.request<StaffStats>('/staff/stats')
  }

  async searchStaff(searchTerm: string): Promise<Staff[]> {
    return this.request<Staff[]>(`/staff/search?q=${encodeURIComponent(searchTerm)}`)
  }

  // Image Upload
  async uploadStaffImage(imageFile: File): Promise<{ url: string; public_id: string }> {
    console.log('📷 [API] uploadStaffImage called')

    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      const result = await this.request<{ url: string; public_id: string }>('/staff/upload-image', {
        method: 'POST',
        body: formData
        // Don't pass headers - request method will handle FormData correctly
      })
      console.log('📷 [API] Image upload result:', result)
      return result
    } catch (error) {
      console.error('📷 [API] Image upload failed:', error)
      throw error
    }
  }

  async uploadStaffImageBase64(base64Data: string): Promise<{ url: string; public_id: string }> {
    console.log('📷 [API] uploadStaffImageBase64 called')

    try {
      const result = await this.request<{ url: string; public_id: string }>('/staff/upload-image-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Data })
      })
      console.log('📷 [API] Base64 image upload result:', result)
      return result
    } catch (error) {
      console.error('📷 [API] Base64 image upload failed:', error)
      throw error
    }
  }

  // Crew Management
  async getCrew(page: number = 1, limit: number = 50): Promise<{ crew: Crew[], total: number }> {
    console.log('👨‍✈️ [API] getCrew called', { page, limit })
    return this.request<{ crew: Crew[], total: number }>(`/admin/crew?page=${page}&limit=${limit}`)
  }

  async getCrewById(id: number): Promise<Crew> {
    return this.request<Crew>(`/admin/crew/${id}`)
  }

  async createCrew(crewData: Omit<Crew, 'id' | 'created_at' | 'updated_at'>): Promise<Crew> {
    return this.request<Crew>('/admin/crew', {
      method: 'POST',
      body: JSON.stringify(crewData),
    })
  }

  async updateCrew(id: number, crewData: Partial<Omit<Crew, 'id' | 'created_at' | 'updated_at'>>): Promise<Crew> {
    return this.request<Crew>(`/admin/crew/${id}`, {
      method: 'PUT',
      body: JSON.stringify(crewData),
    })
  }

  async deleteCrew(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/crew/${id}`, {
      method: 'DELETE',
    })
  }

  // Agency Management
  async getAgencies(page: number = 1, limit: number = 50): Promise<{ agencies: Agency[], total: number }> {
    console.log('🏢 [API] getAgencies called', { page, limit })
    return this.request<{ agencies: Agency[], total: number }>(`/admin/agencies?page=${page}&limit=${limit}`)
  }

  async getAgenciesWithBalance(): Promise<Agency[]> {
    console.log('🏢 [API] getAgenciesWithBalance called')
    return this.request<Agency[]>(`/admin/agencies/all/with-balance`)
  }

  async getAgencyById(id: number): Promise<Agency> {
    return this.request<Agency>(`/admin/agencies/${id}`)
  }

  async getAgencyBalance(id: number): Promise<{ balance: number }> {
    return this.request<{ balance: number }>(`/admin/agencies/${id}/balance`)
  }

  async getAgencyLedger(id: number): Promise<AgencyLedger[]> {
    return this.request<AgencyLedger[]>(`/admin/agencies/${id}/ledger`)
  }

  async createAgency(agencyData: Omit<Agency, 'id' | 'created_at' | 'updated_at'>): Promise<Agency> {
    return this.request<Agency>('/admin/agencies', {
      method: 'POST',
      body: JSON.stringify(agencyData),
    })
  }

  async updateAgency(id: number, agencyData: Partial<Omit<Agency, 'id' | 'created_at' | 'updated_at'>>): Promise<Agency> {
    return this.request<Agency>(`/admin/agencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agencyData),
    })
  }

  async deleteAgency(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/agencies/${id}`, {
      method: 'DELETE',
    })
  }

  async createAgencyDeposit(
    agencyId: number,
    depositData: {
      account_id: number
      amount: number
      date_paid: string
      description: string
      payment_method: string
      reference: string
    }
  ): Promise<{ agency: Agency; account: Account }> {
    return this.request<{ agency: Agency; account: Account }>(`/admin/agencies/${agencyId}/deposit`, {
      method: 'POST',
      body: JSON.stringify(depositData),
    })
  }

  async getAgencyDeposits(page: number = 1, limit: number = 50): Promise<{ deposits: AgencyDeposit[], total: number }> {
    console.log('💰 [API] getAgencyDeposits called', { page, limit })
    return this.request<{ deposits: AgencyDeposit[], total: number }>(`/admin/agencies/deposits/all?page=${page}&limit=${limit}`)
  }

  // Agents API methods
  async getAgents(page: number = 1, limit: number = 50): Promise<{ agents: Agent[], total: number }> {
    console.log('👤 [API] getAgents called', { page, limit })
    return this.request<{ agents: Agent[], total: number }>(`/admin/agents?page=${page}&limit=${limit}`)
  }

  async getAgentById(id: number): Promise<Agent> {
    console.log('👤 [API] getAgentById called', { id })
    return this.request<Agent>(`/admin/agents/${id}`)
  }

  async createAgent(agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
    return this.request<Agent>('/admin/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    })
  }

  async updateAgent(id: number, agentData: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>): Promise<Agent> {
    return this.request<Agent>(`/admin/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    })
  }

  async deleteAgent(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/agents/${id}`, {
      method: 'DELETE',
    })
  }

  // Accounts API methods
  async getAccounts(page: number = 1, limit: number = 50): Promise<{ accounts: Account[], total: number }> {
    console.log('💰 [API] getAccounts called', { page, limit })
    return this.request<{ accounts: Account[], total: number }>(`/admin/accounts?page=${page}&limit=${limit}`)
  }

  async getAccountById(id: number): Promise<Account> {
    console.log('💰 [API] getAccountById called', { id })
    return this.request<Account>(`/admin/accounts/${id}`)
  }

  async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    return this.request<Account>('/admin/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    })
  }

  async updateAccount(id: number, accountData: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>): Promise<Account> {
    return this.request<Account>(`/admin/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    })
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/accounts/${id}`, {
      method: 'DELETE',
    })
  }

  async getAccountLedger(accountId: number): Promise<AccountLedger[]> {
    console.log('📋 [API] getAccountLedger called', { accountId })
    return this.request<AccountLedger[]>(`/admin/accounts/${accountId}/ledger`)
  }

  // Chart of Accounts API methods
  async getChartOfAccounts(_page: number = 1, _limit: number = 50, accountType?: number): Promise<{ accounts: ChartOfAccount[], total: number }> {
    console.log('📊 [API] getChartOfAccounts called (frontend pagination)', { accountType })
    // Backend no longer uses page/limit - returns all accounts
    const url = accountType !== undefined
      ? `/admin/chart-of-accounts?account_type=${accountType}`
      : `/admin/chart-of-accounts`
    console.log('📊 [API] Request URL:', url)
    
    try {
      const result = await this.request<any>(url)
      console.log('📊 [API] getChartOfAccounts raw response:', result)
      console.log('📊 [API] Response type:', typeof result)
      console.log('📊 [API] Is array:', Array.isArray(result))
      if (result && typeof result === 'object') {
        console.log('📊 [API] Response keys:', Object.keys(result))
      }
      
      // Handle different response structures
      let accounts: ChartOfAccount[] = []
      let total: number = 0
      
      if (Array.isArray(result)) {
        // If response is directly an array
        console.log('📊 [API] Response is array, using as accounts')
        accounts = result
        total = result.length
      } else if (result && result.accounts) {
        // If response has accounts property
        console.log('📊 [API] Response has accounts property')
        accounts = result.accounts
        total = result.total || result.accounts.length
      } else if (result && result.data) {
        // If response is wrapped in data property
        console.log('📊 [API] Response has data property')
        if (Array.isArray(result.data)) {
          accounts = result.data
          total = result.data.length
        } else if (result.data.accounts) {
          accounts = result.data.accounts
          total = result.data.total || result.data.accounts.length
        }
      }
      
      console.log('📊 [API] Parsed - accounts:', accounts)
      console.log('📊 [API] Parsed - accounts length:', accounts.length)
      console.log('📊 [API] Parsed - total:', total)
      if (accounts.length > 0) {
        console.log('📊 [API] Parsed - first account:', accounts[0])
      }
      console.log('📊 [API] ==========================================')
      return { accounts, total }
    } catch (error) {
      console.error('❌ [API] getChartOfAccounts error:', error)
      console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
      console.log('📊 [API] ==========================================')
      throw error
    }
  }

  async getChartOfAccountById(id: number): Promise<ChartOfAccount> {
    console.log('📊 [API] getChartOfAccountById called', { id })
    return this.request<ChartOfAccount>(`/admin/chart-of-accounts/${id}`)
  }

  async createChartOfAccount(accountData: { name: string; code: string; account_type: number }): Promise<ChartOfAccount> {
    console.log('📊 [API] createChartOfAccount called', accountData)
    return this.request<ChartOfAccount>('/admin/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    })
  }

  async updateChartOfAccount(id: number, accountData: Partial<{ name: string; code: string; account_type: number }>): Promise<ChartOfAccount> {
    console.log('📊 [API] updateChartOfAccount called', { id, accountData })
    return this.request<ChartOfAccount>(`/admin/chart-of-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(accountData),
    })
  }

  async deleteChartOfAccount(id: number): Promise<{ message: string }> {
    console.log('📊 [API] deleteChartOfAccount called', { id })
    return this.request<{ message: string }>(`/admin/chart-of-accounts/${id}`, {
      method: 'DELETE',
    })
  }

  async getAccountTypes(): Promise<AccountType[]> {
    console.log('📊 [API] getAccountTypes called')
    return this.request<AccountType[]>('/admin/chart-of-accounts/account-types')
  }

  async getChartOfAccountsByType(accountType: number): Promise<Array<{ id: number; name: string; code: string; account_type: number }>> {
    console.log('📊 [API] getChartOfAccountsByType called', { accountType })
    return this.request<Array<{ id: number; name: string; code: string; account_type: number }>>(`/admin/chart-of-accounts?account_type=${accountType}`)
  }

  async getTrialBalance(
    startDate: string,
    endDate: string,
    accountType?: number
  ): Promise<{
    accounts: Array<{
      account_id: number
      account_code: string
      account_name: string
      category: string
      opening_balance: number
      debit: number
      credit: number
      period_balance: number
      closing_balance: number
    }>
    totals: {
      total_debit: number
      total_credit: number
      total_period_balance: number
      total_opening_balance: number
      total_closing_balance: number
    }
  }> {
    console.log('📊 [API] getTrialBalance called', { startDate, endDate, accountType })
    const url = accountType !== undefined
      ? `/admin/chart-of-accounts/trial-balance?start_date=${startDate}&end_date=${endDate}&account_type=${accountType}`
      : `/admin/chart-of-accounts/trial-balance?start_date=${startDate}&end_date=${endDate}`
    return this.request<{
      accounts: Array<{
        account_id: number
        account_code: string
        account_name: string
        category: string
        opening_balance: number
        debit: number
        credit: number
        period_balance: number
        closing_balance: number
      }>
      totals: {
        total_debit: number
        total_credit: number
        total_period_balance: number
        total_opening_balance: number
        total_closing_balance: number
      }
    }>(url)
  }

  // Journal Entries API methods
  async getJournalEntries(
    page: number = 1,
    limit: number = 15,
    startDate?: string,
    endDate?: string,
    accountId?: number,
    reference?: string,
    description?: string
  ): Promise<{
    entries: Array<{
      id: number
      entry_id: number
      date: string
      entry_number: string
      reference: string | null
      account_code: string
      account_name: string
      account_id: number
      description: string
      debit: number
      credit: number
      status: string
    }>
    total: number
  }> {
    console.log('📝 [API] getJournalEntries called', { page, limit, startDate, endDate, accountId, reference, description })
    let url = `/admin/journal-entries?page=${page}&limit=${limit}`
    if (startDate) url += `&start_date=${startDate}`
    if (endDate) url += `&end_date=${endDate}`
    if (accountId) url += `&account_id=${accountId}`
    if (reference) url += `&reference=${encodeURIComponent(reference)}`
    if (description) url += `&description=${encodeURIComponent(description)}`
    return this.request<{
      entries: Array<{
        id: number
        entry_id: number
        date: string
        entry_number: string
        reference: string | null
        account_code: string
        account_name: string
        account_id: number
        description: string
        debit: number
        credit: number
        status: string
      }>
      total: number
    }>(url)
  }

  // Expenses API methods
  async getExpenses(page: number = 1, limit: number = 50): Promise<{ expenses: any[], total: number }> {
    console.log('💰 [API] getExpenses called', { page, limit })
    return this.request<{ expenses: any[], total: number }>(`/admin/expenses?page=${page}&limit=${limit}`)
  }

  async createExpense(expenseData: {
    expense_account_id: number
    amount: number
    expense_date: string
    description: string
    payment_method: string
    reference: string
    is_paid?: boolean
  }): Promise<any> {
    console.log('💰 [API] createExpense called', expenseData)
    return this.request<any>('/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    })
  }

  async updateExpensePayment(expenseId: number, paymentMethod: string, amount: number): Promise<any> {
    console.log('💰 [API] updateExpensePayment called', { expenseId, paymentMethod, amount, amountType: typeof amount })
    // Ensure amount is a number, not a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    console.log('💰 [API] Sending amount:', numericAmount, 'Type:', typeof numericAmount)
    return this.request<any>(`/admin/expenses/${expenseId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_method: paymentMethod, amount: numericAmount }),
    })
  }

  async getExpensePaymentHistory(expenseId: number): Promise<any[]> {
    console.log('💰 [API] getExpensePaymentHistory called', { expenseId })
    return this.request<any[]>(`/admin/expenses/${expenseId}/payment-history`)
  }

  // Payroll API methods
  async getPayroll(page: number = 1, limit: number = 50): Promise<{ payroll: any[], total: number }> {
    console.log('💼 [API] getPayroll called', { page, limit })
    return this.request<{ payroll: any[], total: number }>(`/admin/payroll?page=${page}&limit=${limit}`)
  }

  async createPayroll(payrollData: {
    staff_id: number
    payroll_account_id: number
    amount: number
    payroll_date: string
    description: string
    reference: string
    payment_method?: string
    is_paid?: boolean
  }): Promise<any> {
    console.log('💼 [API] createPayroll called', payrollData)
    return this.request<any>('/admin/payroll', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    })
  }

  // Department Management
  async getDepartments(): Promise<Department[]> {
    console.log('🏢 [API] getDepartments called')
    console.log('🏢 [API] Making real API call')
    try {
      const result = await this.request<Department[]>('/staff/departments')
      console.log('🏢 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🏢 [API] Real API call failed:', error)
      throw error
    }
  }

  async getDepartmentById(id: number): Promise<Department> {
    return this.request<Department>(`/staff/departments/${id}`)
  }

  async createDepartment(departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    return this.request<Department>('/staff/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    })
  }

  async updateDepartment(id: number, departmentData: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at'>>): Promise<Department> {
    return this.request<Department>(`/staff/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    })
  }

  async deleteDepartment(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/staff/departments/${id}`, {
      method: 'DELETE',
    })
  }

  // Suppliers API methods
  async getSuppliers(page: number = 1, limit: number = 10, search?: string, status?: string): Promise<{ suppliers: Supplier[], total: number }> {
    console.log('🏢 [API] Making real API call for suppliers')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status })
      })

      const result = await this.request<{ suppliers: Supplier[], total: number }>(`/admin/suppliers?${params}`)
      console.log('🏢 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🏢 [API] Real API call failed:', error)
      throw error
    }
  }

  async getSupplierStats(): Promise<SupplierStats> {
    console.log('🏢 [API] Making real API call for supplier stats')
    try {
      const result = await this.request<SupplierStats>('/admin/suppliers/stats')
      console.log('🏢 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('🏢 [API] Real API call failed:', error)
      throw error
    }
  }

  async getPayablesAging(): Promise<{
    items: Array<{
      supplier_id: number
      supplier_code: string
      company_name: string
      current: number
      days31_60: number
      days61_90: number
      days91_120: number
      days120_plus: number
      total: number
    }>
    totals: {
      current: number
      days31_60: number
      days61_90: number
      days91_120: number
      days120_plus: number
      total: number
    }
  }> {
    console.log('💰 [API] Making API call for payables aging')
    try {
      const result = await this.request<{
        items: Array<{
          supplier_id: number
          supplier_code: string
          company_name: string
          current: number
          days31_60: number
          days61_90: number
          days91_120: number
          days120_plus: number
          total: number
        }>
        totals: {
          current: number
          days31_60: number
          days61_90: number
          days91_120: number
          days120_plus: number
          total: number
        }
      }>('/admin/suppliers/payables/aging')
      console.log('💰 [API] Payables aging result:', result)
      return result
    } catch (error) {
      console.error('💰 [API] Payables aging call failed:', error)
      throw error
    }
  }

  async getSupplierInvoicesByAging(
    supplierId: number,
    agingPeriod: 'current' | 'days31_60' | 'days61_90' | 'days91_120' | 'days120_plus'
  ): Promise<Array<{
    id: number
    supplierId: number
    date: string
    description: string | null
    referenceType: string | null
    referenceId: number | null
    debit: number
    credit: number
    runningBalance: number
    createdAt: string
  }>> {
    console.log(`💰 [API] Getting invoices for supplier ${supplierId}, aging: ${agingPeriod}`)
    try {
      const result = await this.request<Array<{
        id: number
        supplierId: number
        date: string
        description: string | null
        referenceType: string | null
        referenceId: number | null
        debit: number
        credit: number
        runningBalance: number
        createdAt: string
      }>>(`/admin/suppliers/payables/${supplierId}/invoices/${agingPeriod}`)
      console.log(`💰 [API] Found ${result.length} invoices`)
      return result
    } catch (error) {
      console.error('💰 [API] Get supplier invoices failed:', error)
      throw error
    }
  }

  async getSupplierById(id: number): Promise<Supplier> {
    return this.request<Supplier>(`/admin/suppliers/${id}`)
  }

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    return this.request<Supplier>('/admin/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    })
  }

  async updateSupplier(id: number, supplierData: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>): Promise<Supplier> {
    return this.request<Supplier>(`/admin/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    })
  }

  async deleteSupplier(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/suppliers/${id}`, {
      method: 'DELETE',
    })
  }

  // Purchase Orders API methods
  async getPurchaseOrders(page: number = 1, limit: number = 10, search?: string, status?: string, supplierId?: number): Promise<{ purchaseOrders: PurchaseOrder[], total: number }> {
    console.log('📋 [API] Making real API call for purchase orders')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(supplierId && { supplierId: supplierId.toString() })
      })

      const result = await this.request<{ purchaseOrders: PurchaseOrder[], total: number }>(`/admin/purchase-orders?${params}`)
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  async getSupplierInvoices(supplierId: number): Promise<PurchaseOrder[]> {
    console.log('📋 [API] Making real API call for supplier invoices')
    try {
      const result = await this.request<PurchaseOrder[]>(`/admin/purchase-orders/supplier/${supplierId}`)
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  async getSupplierInvoiceStats(supplierId: number): Promise<SupplierInvoiceStats> {
    console.log('📋 [API] Making real API call for supplier invoice stats')
    try {
      const result = await this.request<SupplierInvoiceStats>(`/admin/purchase-orders/supplier/${supplierId}/stats`)
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  async getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    console.log('📋 [API] Making real API call for purchase order items')
    try {
      const result = await this.request<PurchaseOrderItem[]>(`/admin/purchase-orders/${purchaseOrderId}/items`)
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  async createPurchaseOrderWithItems(data: {
    po_number: string;
    invoice_number: string;
    supplier_id: number;
    order_date: string;
    expected_delivery_date?: string;
    notes?: string;
    created_by: number;
    items: {
      product_id: number;
      quantity: number;
      unit_price: number;
      tax_amount?: number;
      tax_type?: string;
    }[];
  }): Promise<PurchaseOrder> {
    console.log('📋 [API] Creating purchase order with items:', data)
    try {
      const result = await this.request<PurchaseOrder>('/admin/purchase-orders/create-with-items', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  async getPurchaseOrdersV2(page: number = 1, limit: number = 10, search?: string, status?: string): Promise<{ purchaseOrders: PurchaseOrder[], total: number }> {
    console.log('📋 [API] Getting purchase orders:', { page, limit, search, status })
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status })
      })

      const result = await this.request<{ purchaseOrders: PurchaseOrder[], total: number }>(`/admin/purchase-orders?${params}`)
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  async getPurchaseOrderStats(): Promise<PurchaseOrderStats> {
    console.log('📋 [API] Getting purchase order stats')
    try {
      const result = await this.request<PurchaseOrderStats>('/admin/purchase-orders/stats')
      console.log('📋 [API] Real API call result:', result)
      return result
    } catch (error) {
      console.error('📋 [API] Real API call failed:', error)
      throw error
    }
  }

  // Task Management
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/admin/tasks')
  }

  async getTask(id: number): Promise<Task> {
    return this.request<Task>(`/admin/tasks/${id}`)
  }

  async createTask(taskData: CreateTaskDto): Promise<Task> {
    return this.request<Task>('/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    })
  }

  async updateTask(id: number, taskData: UpdateTaskDto): Promise<Task> {
    console.log('🔧 [API] Updating task:', id, taskData)
    console.log('🔧 [API] Auth token present:', !!this.authToken)
    console.log('🔧 [API] isCompleted type:', typeof taskData.isCompleted, 'value:', taskData.isCompleted)

    // Ensure isCompleted is properly converted to boolean
    const processedData = {
      ...taskData,
      isCompleted: taskData.isCompleted !== undefined ? Boolean(taskData.isCompleted) : undefined
    }

    console.log('🔧 [API] Processed data:', processedData)

    const result = await this.request<Task>(`/admin/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(processedData)
    })
    console.log('✅ [API] Task update response:', result)
    return result
  }

  async deleteTask(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/tasks/${id}`, {
      method: 'DELETE'
    })
  }

  async getTaskStats(): Promise<TaskStats> {
    return this.request<TaskStats>('/admin/tasks/stats')
  }

  async getTasksBySalesRep(salesRepId: number): Promise<Task[]> {
    return this.request<Task[]>(`/admin/tasks/sales-rep/${salesRepId}`)
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return this.request<Task[]>(`/admin/tasks/status/${status}`)
  }

  async getTasksByPriority(priority: string): Promise<Task[]> {
    return this.request<Task[]>(`/admin/tasks/priority/${priority}`)
  }

  // Inventory Management
  async getInventory(): Promise<any[]> {
    console.log('🔍 [API] Calling getInventory endpoint...')
    try {
      const result = await this.request<any[]>('/admin/inventory')
      console.log('✅ [API] getInventory success:', result)
      console.log('📊 [API] Inventory data details:', {
        totalItems: result.length,
        storeIds: [...new Set(result.map(item => item.store_id))],
        sampleItems: result.slice(0, 3)
      })
      return result
    } catch (error: any) {
      console.error('❌ [API] getInventory error:', error)
      console.error('❌ [API] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    }
  }

  async getStores(): Promise<any[]> {
    console.log('🏪 [API] Calling getStores endpoint...')
    try {
      const result = await this.request<any[]>('/admin/inventory/stores')
      console.log('✅ [API] getStores success:', result)
      console.log('🏪 [API] Stores data details:', {
        totalStores: result.length,
        storeIds: result.map(store => store.id),
        storeNames: result.map(store => store.store_name)
      })
      return result
    } catch (error: any) {
      console.error('❌ [API] getStores error:', error)
      console.error('❌ [API] Stores error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    }
  }

  async getInventoryProducts(): Promise<any[]> {
    console.log('📦 [API] Calling getInventoryProducts endpoint...')
    try {
      const result = await this.request<any[]>('/admin/inventory/products')
      console.log('✅ [API] getInventoryProducts success:', result)
      return result
    } catch (error: any) {
      console.error('❌ [API] getInventoryProducts error:', error)
      throw error
    }
  }

  async getInventoryByStore(storeId: number): Promise<any[]> {
    return this.request<any[]>(`/admin/inventory/store/${storeId}`)
  }

  async getInventoryByProduct(productId: number): Promise<any[]> {
    return this.request<any[]>(`/admin/inventory/product/${productId}`)
  }

  async updateInventoryQuantity(id: number, quantity: number): Promise<any> {
    console.log(`🌐 [API] updateInventoryQuantity called with id=${id}, quantity=${quantity}`);

    try {
      const result = await this.request<any>(`/admin/inventory/${id}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity })
      });

      console.log(`✅ [API] updateInventoryQuantity successful:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [API] updateInventoryQuantity failed:`, error);
      throw error;
    }
  }

  // Aircrafts Management
  async getAircrafts(page: number = 1, limit: number = 50): Promise<{ aircrafts: Aircraft[], total: number }> {
    console.log('✈️ [API] Getting aircrafts', { page, limit });
    return this.request<{ aircrafts: Aircraft[], total: number }>(`/admin/aircrafts?page=${page}&limit=${limit}`);
  }

  async getAircraftById(id: number): Promise<Aircraft> {
    return this.request<Aircraft>(`/admin/aircrafts/${id}`);
  }

  async createAircraft(aircraftData: Partial<Aircraft>): Promise<Aircraft> {
    return this.request<Aircraft>('/admin/aircrafts', {
      method: 'POST',
      body: JSON.stringify(aircraftData),
    });
  }

  async updateAircraft(id: number, aircraftData: Partial<Aircraft>): Promise<Aircraft> {
    return this.request<Aircraft>(`/admin/aircrafts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(aircraftData),
    });
  }

  async deleteAircraft(id: number): Promise<void> {
    return this.request<void>(`/admin/aircrafts/${id}`, {
      method: 'DELETE',
    });
  }

  // Destinations Management
  async getDestinations(page: number = 1, limit: number = 50): Promise<{ destinations: Destination[], total: number }> {
    console.log('🌍 [API] Getting destinations', { page, limit });
    return this.request<{ destinations: Destination[], total: number }>(`/admin/destinations?page=${page}&limit=${limit}`);
  }

  async getDestinationById(id: number): Promise<Destination> {
    console.log('🌐 [API] getDestinationById called for ID:', id)
    const response = await this.request<Destination>(`/admin/destinations/${id}`)
    console.log('🌐 [API] getDestinationById response:', JSON.stringify(response, null, 2))
    console.log('🌐 [API] Response country_id:', response.country_id)
    console.log('🌐 [API] Response country relation:', response.country)
    return response
  }

  async createDestination(destinationData: Partial<Destination>): Promise<Destination> {
    return this.request<Destination>('/admin/destinations', {
      method: 'POST',
      body: JSON.stringify(destinationData),
    });
  }

  async updateDestination(id: number, destinationData: Partial<Destination>): Promise<Destination> {
    console.log('🌐 [API] updateDestination called')
    console.log('🌐 [API] Destination ID:', id)
    console.log('🌐 [API] Destination data object:', destinationData)
    console.log('🌐 [API] Destination data to send:', JSON.stringify(destinationData, null, 2))
    console.log('🌐 [API] country_id in data:', destinationData.country_id, 'Type:', typeof destinationData.country_id)
    console.log('🌐 [API] Has country_id property:', 'country_id' in destinationData)
    console.log('🌐 [API] Object keys:', Object.keys(destinationData))

    const requestBody = JSON.stringify(destinationData)
    console.log('🌐 [API] Request body string:', requestBody)
    console.log('🌐 [API] Request body parsed back:', JSON.parse(requestBody))

    const response = await this.request<Destination>(`/admin/destinations/${id}`, {
      method: 'PUT',
      body: requestBody,
    });

    console.log('🌐 [API] updateDestination response received:', JSON.stringify(response, null, 2))
    console.log('🌐 [API] Response country_id:', response.country_id)
    console.log('🌐 [API] Response country relation:', response.country)

    return response
  }

  // IATA Codes Management
  async getIataCodes(page: number = 1, limit: number = 50, search?: string): Promise<{ iataCodes: IataCode[], total: number }> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return this.request<{ iataCodes: IataCode[], total: number }>(`/admin/iata-codes?page=${page}&limit=${limit}${searchParam}`);
  }

  async getIataCodeById(id: number): Promise<IataCode> {
    return this.request<IataCode>(`/admin/iata-codes/${id}`);
  }

  async getIataCodeByCode(code: string): Promise<IataCode> {
    return this.request<IataCode>(`/admin/iata-codes/code/${code}`);
  }

  async createIataCode(iataCodeData: Partial<IataCode>): Promise<IataCode> {
    return this.request<IataCode>('/admin/iata-codes', {
      method: 'POST',
      body: JSON.stringify(iataCodeData),
    });
  }

  async updateIataCode(id: number, iataCodeData: Partial<IataCode>): Promise<IataCode> {
    return this.request<IataCode>(`/admin/iata-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(iataCodeData),
    });
  }

  async deleteIataCode(id: number): Promise<void> {
    return this.request<void>(`/admin/iata-codes/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkInsertIataCodes(iataCodes: Partial<IataCode>[]): Promise<{ inserted: number, skipped: number }> {
    return this.request<{ inserted: number, skipped: number }>('/admin/iata-codes/bulk', {
      method: 'POST',
      body: JSON.stringify(iataCodes),
    });
  }

  async fetchIataCodesFromInternet(): Promise<{ inserted: number, skipped: number, total: number }> {
    return this.request<{ inserted: number, skipped: number, total: number }>('/admin/iata-codes/fetch-from-internet', {
      method: 'POST',
    });
  }


  async deleteDestination(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/destinations/${id}`, {
      method: 'DELETE',
    });
  }

  // Flight Series Management
  async getFlightSeries(page: number = 1, limit: number = 50): Promise<{ flightSeries: FlightSeries[], total: number }> {
    console.log('✈️ [API] Getting flight series', { page, limit });
    return this.request<{ flightSeries: FlightSeries[], total: number }>(`/admin/flight-series?page=${page}&limit=${limit}`);
  }

  async getFlightSeriesById(id: number): Promise<FlightSeries> {
    return this.request<FlightSeries>(`/admin/flight-series/${id}`);
  }

  async createFlightSeries(flightSeriesData: Partial<FlightSeries>): Promise<FlightSeries> {
    return this.request<FlightSeries>('/admin/flight-series', {
      method: 'POST',
      body: JSON.stringify(flightSeriesData),
    });
  }

  async updateFlightSeries(id: number, flightSeriesData: Partial<FlightSeries>): Promise<FlightSeries> {
    return this.request<FlightSeries>(`/admin/flight-series/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flightSeriesData),
    });
  }

  // Crew Assignment for Flight Series
  async assignCrewToFlight(flightSeriesId: number, crewId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/flight-series/${flightSeriesId}/crew/${crewId}`, {
      method: 'POST',
    });
  }

  async removeCrewFromFlight(flightSeriesId: number, crewId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/flight-series/${flightSeriesId}/crew/${crewId}`, {
      method: 'DELETE',
    });
  }

  async getFlightCrewAssignments(flightSeriesId: number): Promise<any[]> {
    return this.request<any[]>(`/admin/flight-series/${flightSeriesId}/crew`);
  }

  async deleteFlightSeries(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/flight-series/${id}`, {
      method: 'DELETE',
    });
  }

  // Seat Reservations Management
  async getSeatReservations(page: number = 1, limit: number = 50, flightSeriesId?: number): Promise<{ reservations: SeatReservation[], total: number }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (flightSeriesId) {
      queryParams.append('flightSeriesId', flightSeriesId.toString());
    }
    return this.request<{ reservations: SeatReservation[], total: number }>(`/admin/seat-reservations?${queryParams}`);
  }

  async getSeatReservationsByFlightSeries(flightSeriesId: number): Promise<SeatReservation[]> {
    return this.request<SeatReservation[]>(`/admin/seat-reservations/flight-series/${flightSeriesId}`);
  }

  async getSeatReservationById(id: number): Promise<SeatReservation> {
    return this.request<SeatReservation>(`/admin/seat-reservations/${id}`);
  }

  async createSeatReservation(reservationData: Partial<SeatReservation>): Promise<SeatReservation> {
    return this.request<SeatReservation>('/admin/seat-reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  async updateSeatReservation(id: number, reservationData: Partial<SeatReservation>): Promise<SeatReservation> {
    return this.request<SeatReservation>(`/admin/seat-reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservationData),
    });
  }

  async deleteSeatReservation(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/seat-reservations/${id}`, {
      method: 'DELETE',
    });
  }

  // Bookings Management
  async createBooking(bookingData: {
    flight_series_id: number
    seat_reservation_id?: number
    passengers: Array<{
      name: string
      email?: string
      contact?: string
      nationality?: string
      identification?: string
      age?: string
      title?: string
      passenger_type: 'adult' | 'child' | 'infant'
    }>
    payment_method: string
    payment_status?: string
    booking_date: string
    notes?: string
  }): Promise<Booking> {
    return this.request<Booking>('/admin/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookings(page: number = 1, limit: number = 50): Promise<{ bookings: Booking[], total: number }> {
    return this.request<{ bookings: Booking[], total: number }>(`/admin/bookings?page=${page}&limit=${limit}`);
  }

  async getBookingById(id: number): Promise<Booking> {
    return this.request<Booking>(`/admin/bookings/${id}`);
  }

  // Cargo Bookings API methods
  async getCargoBookings(page: number = 1, limit: number = 50, flightSeriesId?: number): Promise<{ cargoBookings: CargoBooking[], total: number }> {
    const fsParam = flightSeriesId ? `&flight_series_id=${flightSeriesId}` : ''
    return this.request<{ cargoBookings: CargoBooking[], total: number }>(`/admin/cargo-bookings?page=${page}&limit=${limit}${fsParam}`)
  }

  async createCargoBooking(cargoData: {
    awb_number: string
    flight_series_id?: number | null
    origin: string
    destination: string
    shipper_name: string
    shipper_contact?: string
    shipper_phone?: string
    shipper_address?: string
    consignee_name: string
    consignee_contact?: string
    consignee_phone?: string
    consignee_address?: string
    commodity: string
    special_handling_codes?: string
    pieces: number
    gross_weight_kg: number
    chargeable_weight_kg: number
    volume_cbm?: number
    currency?: string
    payment_term?: 'PREPAID' | 'COLLECT'
    rate_per_kg?: number
    total_charges?: number
    booking_date: string
    status?: 'booked' | 'accepted' | 'manifested' | 'flown' | 'delivered' | 'cancelled'
    remarks?: string
  }): Promise<CargoBooking> {
    return this.request<CargoBooking>('/admin/cargo-bookings', {
      method: 'POST',
      body: JSON.stringify(cargoData),
    })
  }

  async assignCargoBookingFlight(id: number, flightSeriesId: number | null): Promise<CargoBooking> {
    return this.request<CargoBooking>(`/admin/cargo-bookings/${id}/assign-flight`, {
      method: 'PATCH',
      body: JSON.stringify({ flight_series_id: flightSeriesId }),
    })
  }

  // Passengers API methods
  async getPassengers(page: number = 1, limit: number = 50): Promise<{ passengers: Passenger[], total: number }> {
    return this.request<{ passengers: Passenger[], total: number }>(`/admin/passengers?page=${page}&limit=${limit}`);
  }

  async getPassengerById(id: number): Promise<Passenger> {
    return this.request<Passenger>(`/admin/passengers/${id}`);
  }

  async createPassenger(passengerData: Partial<Passenger>): Promise<Passenger> {
    return this.request<Passenger>('/admin/passengers', {
      method: 'POST',
      body: JSON.stringify(passengerData),
    });
  }

  async updatePassenger(id: number, passengerData: Partial<Passenger>): Promise<Passenger> {
    return this.request<Passenger>(`/admin/passengers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(passengerData),
    });
  }

  async deletePassenger(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/passengers/${id}`, {
      method: 'DELETE',
    });
  }

  // Luggage API methods
  async getLuggageByPassenger(passengerId: number): Promise<Luggage[]> {
    return this.request<Luggage[]>(`/admin/luggage/passenger/${passengerId}`);
  }

  async createLuggage(luggageData: { passenger_id: number; flight_series_id?: number | null; booking_id?: number | null; tag_number?: string | null; weight?: number | null }): Promise<Luggage> {
    return this.request<Luggage>('/admin/luggage', {
      method: 'POST',
      body: JSON.stringify(luggageData),
    });
  }

  async updateLuggage(id: number, luggageData: { tag_number?: string | null; weight?: number | null }): Promise<Luggage> {
    return this.request<Luggage>(`/admin/luggage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(luggageData),
    });
  }

  async deleteLuggage(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/luggage/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllLuggages(flightSeriesId?: number): Promise<Luggage[]> {
    const url = flightSeriesId
      ? `/admin/luggage/all?flightSeriesId=${flightSeriesId}`
      : '/admin/luggage/all';
    return this.request<Luggage[]>(url);
  }

  // Fueling API methods
  async getFuelings(page: number = 1, limit: number = 50): Promise<{ fuelings: any[], total: number }> {
    return this.request<{ fuelings: any[], total: number }>(`/admin/fueling?page=${page}&limit=${limit}`);
  }

  async getFuelingById(id: number): Promise<any> {
    return this.request<any>(`/admin/fueling/${id}`);
  }

  async createFueling(fuelingData: {
    flight_series_id: number
    supplier_id: number
    fuel_quantity: number
    fuel_slip_number: string
    price_per_liter: number
    location: string
    additional_fees?: number
    fueling_date: string
  }): Promise<any> {
    return this.request<any>('/admin/fueling', {
      method: 'POST',
      body: JSON.stringify(fuelingData),
    });
  }

  // Currency API methods
  async getCurrencies(): Promise<Currency[]> {
    return this.request<Currency[]>('/admin/currencies');
  }

  async getCurrencyById(id: number): Promise<Currency> {
    return this.request<Currency>(`/admin/currencies/${id}`);
  }

  async createCurrency(data: Partial<Currency>): Promise<Currency> {
    return this.request<Currency>('/admin/currencies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCurrency(id: number, data: Partial<Currency>): Promise<Currency> {
    return this.request<Currency>(`/admin/currencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async setDefaultCurrency(id: number): Promise<Currency> {
    return this.request<Currency>(`/admin/currencies/${id}/set-default`, {
      method: 'PUT',
    });
  }

  async deleteCurrency(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/currencies/${id}`, {
      method: 'DELETE',
    });
  }
}

export interface Currency {
  id: number
  name: string
  country: string
  symbol: string
  code: string | null
  status: string
  is_default: number
  created_at: string
  updated_at: string
}

export const adminApiService = new AdminApiService()
export default adminApiService
