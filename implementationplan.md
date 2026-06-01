I’ll create a detailed, page-by-page, feature-by-feature implementation plan for the Agent Portal, following your documented scope and emphasizing a dense, compact UI. This plan will break down each page, its features, and the recommended implementation order, so you can proceed methodically.

Here’s the plan:

---

## Agent Portal Implementation Plan

### 1. Core Setup (Initial)
- Install all required dependencies: Next.js, Tailwind CSS, DaisyUI, React Query, React Hook Form, Zod, Axios, Zustand, date-fns, etc.
- Set up project structure as per docs (app/, components/, lib/, types/, etc.).
- Configure Tailwind, DaisyUI, and global styles.
- Set up Axios instance with JWT interceptor.
- Set up Zustand store for auth/session state.
- Add environment variable support.

---

### 2. Authentication

#### 2.1 Login Page (`/login`)
- Dense, single-card login form (email, password).
- Form validation with React Hook Form + Zod.
- On submit: call `/auth/agent/login`, handle errors, show toast.
- Store access token in memory, refresh token in httpOnly cookie.
- Redirect to dashboard on success.
- Show error for locked accounts (after 5 failed attempts).

#### 2.2 Auth Middleware
- Protect all portal routes (except `/login`).
- Redirect unauthenticated users to `/login`.
- Auto-refresh token on 401 using `/auth/agent/refresh`.

---

### 3. Portal Shell

#### 3.1 Layout
- Sidebar navigation (compact, icon-based).
- Topbar with notification bell (unread count), profile dropdown.
- Responsive, dense layout (minimal whitespace, high info density).
- Dark mode toggle.

---

### 4. Dashboard (`/dashboard`)
- Live float balance (large, prominent).
- Low float warning banner if below threshold.
- Today’s booking count and value.
- Recent bookings (last 5, status badges).
- Held bookings with countdown timers (highlight if <30min).
- Unread notification badge.
- “New Booking” CTA (disabled if float too low, with inline message).

---

### 5. Search & Book (`/search`)
#### 5.1 Step 1: Flight Search
- Form: origin, destination, date, trip type, passenger counts.
- Fetch destinations/cabin classes for dropdowns.
- Results: dense table of flights (number, times, seats, fares, cabin options).
- Only show flights with available seats and correct status.

#### 5.2 Step 2: Fare Selection
- Select flight and cabin class.
- Summary panel: per-passenger fare, total, float to be deducted.

#### 5.3 Step 3: Passenger Assignment
- For each slot: select saved profile or enter new details.
- Option to save new passenger to profile directory.
- Validation: at least one contact email, passport expiry, infant/adult association.

#### 5.4 Step 4: Validation (silent, backend)
- On “Next”, call backend to validate seats, float, flight status.
- Show error and return to search if validation fails.

#### 5.5 Step 5: Hold or Confirm
- Option to hold (creates held booking, reserves seat, no float deduction).
- Option to confirm (proceeds to ticket issuance).

#### 5.6 Step 6: Ticket Issuance
- Show loading/progress.
- On success: show confirmation, allow PDF download, resend email, etc.
- On failure: show error, float untouched.

---

### 6. Bookings (`/bookings`)
- Dense, filterable table: Reference, PNR, Passenger(s), Route, Flight, Date, Status, Amount, Booked On.
- Filters: status, date range, route, free-text search.
- Per-booking actions: view detail, download PDF, resend email, cancel (if eligible), request amendment.

#### 6.1 Booking Detail (`/bookings/[id]`)
- All flight and passenger details.
- Fare breakdown (base, markup, total, float deducted).
- Ticket numbers/status per passenger.
- Status history timeline.
- Active amendment requests and status.

---

### 7. Passengers (`/passengers`)
- List all active saved profiles (dense table).
- Search by name or ID.
- Create, edit, deactivate profile (soft delete).
- Show which bookings used a profile.

---

### 8. Wallet (`/wallet`)
- Current balance, reserved float, month-to-date spend.
- Transaction history (paginated, dense table).
- Top-up request form (amount, method, reference, note, proof upload).
- Statement download (PDF/Excel).

---

### 9. Notifications (`/notifications`)
- Paginated list, newest first.
- Unread count on bell icon.
- Click to navigate to related record and mark as read.
- “Mark all as read” action.

---

### 10. Settings (`/settings`)
- Profile: name, email, phone, country, profile photo.
- Security: change password, login history, active sessions (revoke).
- Preferences: default currency, email notification opt-ins.

---

## Implementation Order Recommendation

1. Core setup & authentication (login, middleware, store).
2. Portal shell (layout, navigation, notification bell).
3. Dashboard.
4. Search & Book (multi-step flow).
5. Bookings (list, detail, actions).
6. Passengers.
7. Wallet.
8. Notifications.
9. Settings.

---

Let me know if you want this as a markdown file in your repo, or if you want to start with the first step (core setup & login page) right away!