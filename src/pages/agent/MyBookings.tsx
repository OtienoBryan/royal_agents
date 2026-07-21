import { useState, useEffect, useRef } from 'react'
import { agentApi } from '../../services/agentApi'
import { Ticket, Search, X, User, ChevronDown, ChevronUp, ArrowRight, RotateCcw, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
// jspdf/html2canvas (~600KB combined) are only needed when a ticket is
// actually downloaded — dynamically imported inside handleDownloadPDF instead
// of at module load, so visiting this page doesn't pay for them up front.

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'

// Compact date format used inside the e-ticket itself (matches the admin portal's
// TicketModal) — distinct from fmtDate above, which is used by the bookings table.
const fmtTicketDate = (d: string | null | undefined) =>
  d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'

const PAX_COLORS: Record<string, string> = {
  adult:  'bg-[#1c2e61]/10 text-[#1c2e61] border border-[#1c2e61]/20',
  child:  'bg-purple-50 text-purple-700 border border-purple-200',
  infant: 'bg-pink-50 text-pink-700 border border-pink-200',
}

const TICKET_STATUS_COLOR: Record<string, string> = {
  'OPEN':     'bg-blue-100 text-blue-800',
  'USED':     'bg-green-100 text-green-800',
  'VOID':     'bg-red-100 text-red-800',
  'REFUNDED': 'bg-yellow-100 text-yellow-800',
}

// ─── E-Ticket / Itinerary Receipt ──────────────────────────────────────────────
// Ported from the admin portal's TicketModal (same component the "E-Ticket /
// Itinerary Receipt" name comes from) so agents see the identical document —
// full A4 itinerary layout rather than a small boarding-pass stub.
const TICKET_NAVY = '#1A3A8F'
const TICKET_RED  = '#C0392B'

// Builds the plain-text payload encoded into the ticket's QR code — a real,
// scannable QR (via qrcode.react) rather than a decorative pseudo-random grid.
// Kept as newline-separated plain text (not JSON/a URL) so it's readable by any
// generic QR scanner without needing a companion app to parse it.
const buildTicketQrValue = (opts: {
  bookingRef?: string
  ticketNumber: string
  pax: any
  flight: any
  date: string | null
  bp: any
}) => {
  const { bookingRef, ticketNumber, pax, flight, date, bp } = opts
  const from = flight?.fromDestination?.code || '—'
  const to = flight?.toDestination?.code || '—'
  return [
    'ROYAL AIR E-TICKET',
    `PNR: ${bookingRef || '—'}`,
    `Ticket No: ${ticketNumber}`,
    `Passenger: ${pax?.title ? pax.title + ' ' : ''}${pax?.name || '—'}`,
    `Flight: ${flight?.flt || '—'}`,
    `Route: ${from} - ${to}`,
    `Date: ${fmtTicketDate(date)}`,
    `Seat: ${bp?.seat_number || 'N/A'}`,
  ].join('\n')
}

// Helper sub-component for label/value rows
const Row: React.FC<{ label: string; value: string; bold?: boolean; small?: boolean; inline?: boolean }> = ({ label, value, bold, small, inline }) => (
  <div style={inline ? { display: 'flex', alignItems: 'center', gap: 5 } : {}}>
    {!inline && <div style={{ fontSize: small ? 7 : 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>}
    {inline && <span style={{ fontSize: 10 }}>{label}</span>}
    <div style={{ fontSize: small ? 9 : 11, fontWeight: bold ? 700 : 500, color: '#222' }}>{value}</div>
  </div>
)

const ETicket: React.FC<{
  leg: 'outbound' | 'return'
  flight: any
  date: string | null
  pax: any
  bp: any
  bookingRef?: string
  bookingDate?: string | null
  paymentMethod?: string
}> = ({ flight, date, pax, bp, bookingRef, bookingDate, paymentMethod }) => {
  const from = flight?.fromDestination
  const to   = flight?.toDestination
  const totalAmt = Number(bp?.fare_amount || 0)
  const ticketNumber = bp?.ticket_number
    || `${(bookingRef || '').replace(/-/g, '').substring(0, 6).toUpperCase()}${String(pax?.id || 0).padStart(4, '0')}`

  return (
    <div className="e-ticket" style={{ width: '660px', fontFamily: 'Arial, sans-serif', background: '#fff', border: '1px solid #ddd', position: 'relative' }}>

      {/* ① HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '3px solid #F0B429', position: 'relative', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <div style={{ width: 38, height: 38, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
            <img src="/royal.png" alt="Royal Air" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: TICKET_NAVY, letterSpacing: 1, position: 'relative' }}>ROYAL AIR</div>
            <div style={{ fontSize: 8, color: '#555', marginTop: 1, position: 'relative' }}>Takes You Always Further</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: TICKET_NAVY, letterSpacing: 0.5, position: 'relative' }}>E-TICKET / ITINERARY RECEIPT</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#F0B429', marginTop: 1, position: 'relative' }}>THIS IS NOT A BOARDING PASS</div>
        </div>
        <div style={{ width: 38, height: 38, background: TICKET_NAVY, borderRadius: '50%', position: 'relative', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
          </svg>
        </div>
      </div>

      {/* ② REF / PNR / DATE / QR row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, background: '#f0f4f8', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={TICKET_NAVY}><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.06 15.95 0 13.5 0c-1.38 0-2.6.64-3.5 1.64C9.1.64 7.88 0 6.5 0 4.05 0 2 2.06 2 4.64c0 .48.1.92.18 1.36H0v2h24V6h-4zM6.5 2C7.88 2 9 3.12 9 4.64c0 .48-.15.88-.36 1.36H4.36C4.15 5.52 4 5.12 4 4.64 4 3.12 5.12 2 6.5 2zm7 0C14.88 2 16 3.12 16 4.64c0 .48-.15.88-.36 1.36h-4.28C11.15 5.52 11 5.12 11 4.64 11 3.12 12.12 2 13.5 2zM2 8v14h8v-5h4v5h8V8H2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ticket Number</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TICKET_NAVY, letterSpacing: 0.5 }}>{ticketNumber}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, background: '#f0f4f8', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={TICKET_NAVY}><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Booking Reference (PNR)</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: TICKET_NAVY, letterSpacing: 1 }}>{bookingRef || '—'}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, background: '#f0f4f8', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={TICKET_NAVY}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1zM7 10h5v5H7z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date of Issue</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TICKET_NAVY }}>{fmtTicketDate(bookingDate)}</div>
            </div>
          </div>
        </div>
        <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ border: '1px solid #ddd', padding: 3, borderRadius: 4, lineHeight: 0 }}>
            <QRCodeSVG value={buildTicketQrValue({ bookingRef, ticketNumber, pax, flight, date, bp })} size={52} level="M" />
          </div>
          <div style={{ fontSize: 6, color: '#888', marginTop: 1, textAlign: 'center' }}>SCAN FOR DETAILS</div>
        </div>
      </div>

      {/* Notice */}
      <div style={{ padding: '4px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 8, color: '#555', lineHeight: 1.4 }}>
          Please present this e-ticket along with valid identification at check-in. This document is your receipt and proof of purchase.
        </p>
      </div>

      {/* ③ PASSENGER INFORMATION */}
      <div>
        <div style={{ background: TICKET_NAVY, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#fff', position: 'relative' }}>PASSENGER INFORMATION</span>
        </div>
        <div style={{ padding: '6px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <Row label="PASSENGER NAME" value={`${pax?.title ? pax.title + ' ' : ''}${(pax?.name || '—').toUpperCase()}`} bold />
          <Row label="DATE OF BIRTH" value="—" />
          <Row label="PASSENGER TYPE" value={(bp?.passenger_type || 'adult').replace(/^\w/, (c: string) => c.toUpperCase())} />
          <Row label="FREQUENT FLYER NO." value={pax?.pnr || '—'} />
          <Row label="NATIONALITY" value={pax?.nationality || '—'} />
          <Row label="ISSUING AIRLINE" value="Royal Air" />
          <Row label="PASSPORT / ID NUMBER" value={pax?.identification || '—'} />
          <Row label="CONTACT" value={pax?.contact || pax?.email || '—'} />
        </div>
      </div>

      {/* ④ FLIGHT DETAILS */}
      <div>
        <div style={{ background: TICKET_NAVY, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#fff', position: 'relative' }}>FLIGHT DETAILS</span>
        </div>
        <div style={{ background: TICKET_RED, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ minWidth: 72, position: 'relative' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', position: 'relative' }}>{flight?.flt || '—'}</div>
            <div style={{ display: 'inline-block', background: '#00C853', borderRadius: 3, padding: '2px 7px', marginTop: 3, position: 'relative' }}>
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 800, position: 'relative' }}>&#10003; CONFIRMED</span>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', position: 'relative' }}>FROM</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', position: 'relative' }}>{from?.code || '—'}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', position: 'relative' }}>{from?.name || ''}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, position: 'relative' }}>&#8594;</span>
              </div>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', position: 'relative' }}>TO</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', position: 'relative' }}>{to?.code || '—'}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', position: 'relative' }}>{to?.name || ''}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
            {[
              { label: 'DATE',      val: fmtTicketDate(date) },
              { label: 'DEPARTURE', val: flight?.std?.substring(0, 5) || '—' },
              { label: 'ARRIVAL',   val: flight?.sta?.substring(0, 5) || '—' },
              { label: 'SEAT',      val: bp?.seat_number || '—' },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', position: 'relative' }}>{label}</div>
                <div style={{ fontSize: label === 'DATE' ? 11 : 13, fontWeight: 800, color: '#fff', position: 'relative' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {[
            { label: 'Check-in opens', value: '3 hrs before departure' },
            { label: 'Boarding closes', value: '30 min before departure' },
            { label: 'Gate closes', value: '15 min before departure' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '4px 12px', borderRight: i < 2 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: 8, color: '#888' }}>{item.label}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#333' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ⑤ FARE + BAGGAGE */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb' }}>
          <div style={{ background: TICKET_NAVY, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: '#fff', position: 'relative' }}>FARE BREAKDOWN</span>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#555' }}>Base Fare</span>
              <span style={{ fontSize: 11, color: '#333', fontWeight: 500 }}>USD {totalAmt.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: TICKET_NAVY }}>TOTAL FARE</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: TICKET_RED }}>USD {totalAmt.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, background: '#FFF5F5', position: 'relative' }}>
          <div style={{ background: TICKET_RED, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M20 6h-2.18C17.6 5.56 17.5 5.12 17.5 4.6 17.5 3.16 16.34 2 14.9 2h-5.8C7.66 2 6.5 3.16 6.5 4.6c0 .52.1.96.18 1.4H4.5C3.4 6 2.5 6.9 2.5 8v12c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-9-2.4h2v.8h-2v-.8zm-1.4 0c0-.44.36-.8.8-.8h5.2c.44 0 .8.36.8.8v1.8H9.6V3.6z"/></svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: '#fff', position: 'relative' }}>BAGGAGE ALLOWANCE</span>
          </div>
          <div style={{ padding: '6px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { label: 'Checked Baggage', value: '23 KG', sub: '(1 piece)' },
              { label: 'Cabin Baggage', value: '7 KG', sub: '(1 piece)' },
              { label: 'Special Baggage', value: 'Subject to airline conditions', sub: '' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 9, color: '#555' }}>{label}</div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TICKET_NAVY }}>{value}</span>
                  {sub && <span style={{ fontSize: 9, color: '#666', marginLeft: 3 }}>{sub}</span>}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 7, color: '#777', marginTop: 2, lineHeight: 1.4 }}>
              Excess baggage will be subject to applicable charges. For full details, refer to the airline's baggage policy.
            </p>
          </div>
        </div>
      </div>

      {/* ⑥ PAYMENT / AIRLINE CONTACT / EMERGENCY CONTACT */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb' }}>
          <div style={{ background: TICKET_NAVY, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#fff', position: 'relative' }}>PAYMENT INFORMATION</span>
          </div>
          <div style={{ padding: '5px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row label="FORM OF PAYMENT" value={(paymentMethod || 'N/A').replace(/_/g, ' ').toUpperCase()} small />
            <Row label="DATE OF ISSUE" value={fmtTicketDate(bookingDate)} small />
            <Row label="PLACE OF ISSUE" value="Royal Air Office" small />
            <Row label="ISSUING AGENT" value="AGENT PORTAL" small />
          </div>
        </div>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb' }}>
          <div style={{ background: TICKET_NAVY, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#fff', position: 'relative' }}>AIRLINE CONTACT</span>
          </div>
          <div style={{ padding: '5px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, overflow: 'hidden', background: '#f0f4f8', flexShrink: 0 }}>
                <img src="/royal.png" alt="Royal Air" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: TICKET_NAVY }}>ROYAL AIR</div>
            </div>
            <Row label="📞" value="+255 724 758 368" small inline />
            <Row label="✉️" value="contact@royalairsarl.com" small inline />
            <Row label="🌐" value="www.royalairsarl.com" small inline />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: TICKET_NAVY, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#fff', position: 'relative' }}>EMERGENCY CONTACT <span style={{ fontSize: 7, opacity: 0.7 }}>(OPTIONAL)</span></span>
          </div>
          <div style={{ padding: '5px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row label="NAME" value="—" small />
            <Row label="PHONE" value="—" small />
            <Row label="RELATIONSHIP" value="—" small />
          </div>
        </div>
      </div>

      {/* ⑦ IMPORTANT INFORMATION */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, padding: '6px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#F0B429', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>i</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: TICKET_NAVY, letterSpacing: 0.5 }}>IMPORTANT INFORMATION</span>
          </div>
          {[
            'Present a valid passport or ID at check-in.',
            'Retain this receipt as proof of travel and payment.',
            'Check-in opens 3 hours before departure.',
            'Change/refund conditions are subject to fare rules.',
            'Carriage is subject to the carrier\'s conditions of carriage.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill={TICKET_NAVY} style={{ marginTop: 2, flexShrink: 0 }}><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
              <span style={{ fontSize: 8, color: '#555', lineHeight: 1.3 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ width: 150, background: 'linear-gradient(135deg, #C0392B 0%, #1A3A8F 100%)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: 8 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
            {[20,40,30,60,35,50,25,45].map((h, i) => (
              <div key={i} style={{ position: 'absolute', bottom: 0, left: `${i * 18 + 3}px`, width: 12, height: `${h}px`, background: '#fff', borderRadius: '2px 2px 0 0' }} />
            ))}
          </div>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>
              {from?.name?.toUpperCase() || 'DESTINATION'}
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
              {from?.code || ''}
            </div>
          </div>
        </div>
      </div>

      {/* ⑧ FOOTER */}
      <div style={{ background: TICKET_NAVY, padding: '5px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', position: 'relative' }}>Safe Travels!</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#e74c3c" style={{ position: 'relative' }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#fff', position: 'relative' }}>THANK YOU FOR FLYING WITH US!</span>
        </div>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', position: 'relative' }}>{ticketNumber}</span>
      </div>

    </div>
  )
}

// ─── Booking Details Modal ────────────────────────────────────────────────────
const BookingDetailsModal: React.FC<{ bookingId: number; onClose: () => void }> = ({ bookingId, onClose }) => {
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tickets' | 'details'>('tickets')
  const [expandedPax, setExpandedPax] = useState<number | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const ticketsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    agentApi.getBooking(bookingId)
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bookingId])

  const passengers: any[] = booking?.bookingPassengers || []
  const isReturn = booking?.is_return_trip

  const handleDownloadPDF = async () => {
    const elements = ticketsRef.current?.querySelectorAll('.e-ticket')
    if (!elements?.length || !booking) return
    setGeneratingPDF(true)

    // html2canvas unconditionally reads getComputedStyle(document.documentElement)
    // and getComputedStyle(document.body).backgroundColor before rendering anything,
    // regardless of the backgroundColor option passed below. Some browser/OS setups
    // (forced-colors mode, a dark-mode extension, etc.) make those two specific
    // reads return an oklch() string, which html2canvas's color parser doesn't
    // understand — it throws "unsupported color function" before ever reaching our
    // own white background override.
    //
    // Proxying getComputedStyle's return value was tried and reverted — wrapping a
    // native CSSStyleDeclaration in a Proxy trips browsers' internal brand checks on
    // some of its methods ("Illegal invocation"), even with functions rebound to the
    // real target. Forcing a plain `!important` inline background instead needs no
    // proxying: it's a normal native API call, and inline `!important` outranks any
    // stylesheet (including one an extension injected) in the CSS cascade, so
    // whatever was making the computed value resolve to oklch no longer applies for
    // the moment of capture. Restored via finally either way.
    const prevHtmlBg = document.documentElement.style.getPropertyValue('background-color')
    const prevBodyBg = document.body.style.getPropertyValue('background-color')
    document.documentElement.style.setProperty('background-color', '#ffffff', 'important')
    document.body.style.setProperty('background-color', '#ffffff', 'important')

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 8; const maxW = 210 - margin * 2; const maxH = 297 - margin * 2
      const px2mm = 0.264583
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement
        // foreignObjectRendering was tried earlier to dodge the oklch parsing crash,
        // but didn't actually fix it (the real fix is the inline !important background
        // above) and is a known cause of blank/empty captures in html2canvas — it
        // renders via SVG <foreignObject>, which has much stricter same-origin/tainting
        // behavior than the default per-property canvas drawing path. Left off.
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
        if (!canvas.width || !canvas.height) {
          throw new Error(`Ticket ${i + 1} rendered with zero size — the page may still be loading, try again in a moment.`)
        }
        const imgData = canvas.toDataURL('image/png', 1.0)
        const iw = (canvas.width / 2) * px2mm
        const ih = (canvas.height / 2) * px2mm
        const sc = Math.min(maxW / iw, maxH / ih)
        const fw = iw * sc; const fh = ih * sc
        if (i > 0) pdf.addPage('a4', 'portrait')
        pdf.addImage(imgData, 'PNG', margin + (maxW - fw) / 2, margin, fw, fh)
      }
      const fs = booking.flightSeries
      const name = fs ? `${fs.flt}_${fs.fromDestination?.code}_${fs.toDestination?.code}` : 'etickets'
      pdf.save(`etickets_${name}_${booking.booking_reference}.pdf`)
    } catch (e) {
      console.error(e)
      alert(`Failed to generate PDF. ${e instanceof Error ? e.message : 'Please try again.'}`)
    } finally {
      if (prevHtmlBg) document.documentElement.style.setProperty('background-color', prevHtmlBg)
      else document.documentElement.style.removeProperty('background-color')
      if (prevBodyBg) document.body.style.setProperty('background-color', prevBodyBg)
      else document.body.style.removeProperty('background-color')
      setGeneratingPDF(false)
    }
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body * { visibility: hidden; }
          .eticket-print-area, .eticket-print-area * { visibility: visible; }
          .eticket-print-area { position: fixed; left: 0; top: 0; width: 100%; }
          .e-ticket { width: 100%; max-width: none; page-break-after: always; break-after: page; }
          .e-ticket:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ background: '#1c2e61' }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-white">Booking Details</h2>
              {isReturn && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  <RotateCcw className="h-3 w-3" />Return Trip
                </span>
              )}
            </div>
            {booking && <p className="text-[12px] text-white/60 mt-0.5 font-mono">{booking.booking_reference}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          {(['tickets', 'details'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[12px] font-semibold capitalize transition-colors ${
                tab === t ? 'border-b-2 text-[#1c2e61]' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={tab === t ? { borderColor: '#1c2e61' } : undefined}>
              {t === 'tickets' ? `🎫 Tickets (${passengers.length})` : '📋 Booking Info'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1c2e61' }} />
            </div>
          ) : !booking ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">Failed to load booking.</div>
          ) : tab === 'tickets' ? (
            /* ─── Tickets tab ─── */
            <div className="px-5 py-4 space-y-6">
              {/* PDF action */}
              {passengers.length > 0 && (
                <div className="flex items-center justify-end gap-2 no-print">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {generatingPDF ? 'Generating…' : 'Download PDF'}
                  </button>
                </div>
              )}
              {passengers.length === 0 ? (
                <p className="text-center text-[13px] text-gray-400 py-8">No passenger records found.</p>
              ) : (
                <div ref={ticketsRef} className="eticket-print-area space-y-6 overflow-x-auto pb-2">
                {passengers.map((bp: any, idx: number) => {
                  const pax = bp.passenger || {}
                  return (
                    <div key={bp.id}>
                      {/* Passenger label */}
                      <div className="flex items-center gap-2 mb-2 no-print">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ background: '#1c2e61' }}>
                          {idx + 1}
                        </div>
                        <span className="text-[13px] font-bold text-gray-800">{pax.title ? `${pax.title} ` : ''}{pax.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${PAX_COLORS[bp.passenger_type] || 'bg-gray-100 text-gray-600'}`}>
                          {bp.passenger_type}
                        </span>
                      </div>

                      {/* Outbound e-ticket */}
                      <div className="flex justify-center">
                        <ETicket
                          leg="outbound"
                          flight={booking.flightSeries}
                          date={String(booking.booking_date)}
                          pax={pax}
                          bp={bp}
                          bookingRef={booking.booking_reference}
                          bookingDate={booking.booking_date}
                          paymentMethod={booking.payment_method}
                        />
                      </div>

                      {/* Return e-ticket */}
                      {isReturn && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <RotateCcw className="h-3 w-3 text-indigo-500" />
                            <span className="text-[11px] font-semibold text-indigo-600">Return journey</span>
                          </div>
                          <div className="flex justify-center">
                            <ETicket
                              leg="return"
                              flight={booking.returnFlightSeries || {
                                flt: booking.flightSeries?.flt,
                                fromDestination: booking.flightSeries?.toDestination,
                                toDestination: booking.flightSeries?.fromDestination,
                                std: booking.flightSeries?.sta,
                                sta: booking.flightSeries?.std,
                              }}
                              date={booking.return_date}
                              pax={pax}
                              bp={bp}
                              bookingRef={booking.booking_reference}
                              bookingDate={booking.booking_date}
                              paymentMethod={booking.payment_method}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          ) : (
            /* ─── Details tab ─── */
            <div>
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Flight */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Outbound Flight</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-0.5">{booking.flightSeries?.flt || '—'}</p>
                    {booking.flightSeries && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        {booking.flightSeries.fromDestination?.code}
                        <ArrowRight className="h-3 w-3" />
                        {booking.flightSeries.toDestination?.code}
                      </p>
                    )}
                  </div>
                  {/* Return flight */}
                  {isReturn && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Return Flight</p>
                      <p className="text-[14px] font-bold text-gray-900 mt-0.5">
                        {booking.returnFlightSeries?.flt || booking.flightSeries?.flt || '—'}
                      </p>
                      {(booking.returnFlightSeries || booking.flightSeries) && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          {(booking.returnFlightSeries?.fromDestination || booking.flightSeries?.toDestination)?.code}
                          <ArrowRight className="h-3 w-3" />
                          {(booking.returnFlightSeries?.toDestination || booking.flightSeries?.fromDestination)?.code}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Travel date */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Travel Date</p>
                    <p className="text-[13px] font-semibold text-gray-800 mt-0.5">{fmtDate(booking.booking_date)}</p>
                  </div>
                  {/* Return date */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Return Date</p>
                    {isReturn ? (
                      <p className="text-[13px] font-semibold text-gray-800 mt-0.5">
                        {booking.return_date ? fmtDate(booking.return_date) : <span className="text-gray-400">Not recorded</span>}
                      </p>
                    ) : (
                      <p className="text-[12px] text-gray-400 mt-0.5">One-way</p>
                    )}
                  </div>
                  {/* Amount */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Total Amount</p>
                    <p className="text-[15px] font-bold text-gray-900 mt-0.5">{fmt(Number(booking.total_amount || 0))}</p>
                  </div>
                  {/* Payment */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Payment</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      booking.payment_status === 'paid'   ? 'bg-green-100 text-green-800' :
                      booking.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.payment_status || 'pending'}
                    </span>
                  </div>
                  {/* Trip type */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Trip Type</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${isReturn ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>
                      {isReturn ? '↩ Return' : '→ One-way'}
                    </span>
                  </div>
                  {/* Passengers */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Passengers</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-0.5">{passengers.length}</p>
                  </div>
                </div>
              </div>

              {/* Passenger details list */}
              <div className="px-6 py-4">
                <h3 className="text-[13px] font-bold mb-3 flex items-center gap-2" style={{ color: '#1c2e61' }}>
                  <User className="h-4 w-4" />Passenger Details
                </h3>
                <div className="space-y-2">
                  {passengers.map((bp: any, idx: number) => {
                    const pax = bp.passenger || {}
                    const isExpanded = expandedPax === bp.id
                    const ticketStatus = bp.ticket_status || null
                    return (
                      <div key={bp.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button type="button"
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          onClick={() => setExpandedPax(isExpanded ? null : bp.id)}>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                              style={{ background: '#1c2e61' }}>{idx + 1}</div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold text-gray-900">{pax.title ? `${pax.title} ` : ''}{pax.name || '—'}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${PAX_COLORS[bp.passenger_type] || 'bg-gray-100 text-gray-600'}`}>
                                  {bp.passenger_type}
                                </span>
                                {ticketStatus && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TICKET_STATUS_COLOR[ticketStatus] || 'bg-gray-100 text-gray-600'}`}>
                                    {ticketStatus}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                PNR: <span className="font-mono font-semibold text-gray-700">{pax.pnr || '—'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[12px] font-bold text-gray-800">{fmt(Number(bp.fare_amount || 0))}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                              {pax.email && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Email</p><p className="text-[12px] text-gray-700 mt-0.5 break-all">{pax.email}</p></div>}
                              {pax.contact && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Contact</p><p className="text-[12px] text-gray-700 mt-0.5">{pax.contact}</p></div>}
                              {pax.nationality && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Nationality</p><p className="text-[12px] text-gray-700 mt-0.5">{pax.nationality}</p></div>}
                              {pax.id_type && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">ID Type</p><p className="text-[12px] text-gray-700 mt-0.5 capitalize">{pax.id_type.replace('_', ' ')}</p></div>}
                              {pax.identification && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">ID Number</p><p className="text-[12px] font-mono text-gray-700 mt-0.5">{pax.identification}</p></div>}
                              {pax.age != null && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Age</p><p className="text-[12px] text-gray-700 mt-0.5">{pax.age}</p></div>}
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Ticket Status</p>
                                {ticketStatus
                                  ? <span className={`inline-flex mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${TICKET_STATUS_COLOR[ticketStatus] || 'bg-gray-100 text-gray-600'}`}>{ticketStatus}</span>
                                  : <p className="text-[12px] text-gray-400 mt-0.5">—</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button onClick={onClose}
            className="px-5 py-2 text-[12px] font-semibold rounded-lg text-white transition-colors"
            style={{ background: '#1c2e61' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#162450')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1c2e61')}>
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
// Same outbound-travel-date derivation used for the row rendering below — kept as
// one function so the date-range filter and the displayed "Travel Date" column
// can never disagree about which date a booking falls under.
const getOutboundDate = (b: any): string | null => {
  const bps: any[] = b.bookingPassengers || []
  const outboundBp = bps.find((bp: any) => bp.leg === 'outbound') ?? bps[0] ?? null
  return outboundBp?.travel_date ?? b.booking_date ?? null
}

const PAGE_SIZE = 10

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    agentApi.getMyBookings(1, 1000)
      .then(r => setBookings(r.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    if (q && !b.booking_reference?.toLowerCase().includes(q) && !b.passenger_name?.toLowerCase().includes(q)) {
      return false
    }
    const travelDate = getOutboundDate(b)
    const travelDay = travelDate ? String(travelDate).slice(0, 10) : null
    if (fromDate && (!travelDay || travelDay < fromDate)) return false
    if (toDate && (!travelDay || travelDay > toDate)) return false
    return true
  }).sort((a, b) => {
    // Most recent travel date first — the date-range filter is scoped to travel
    // date, so sort on the same field to keep the two consistent.
    const dateA = getOutboundDate(a) || ''
    const dateB = getOutboundDate(b) || ''
    return dateB.localeCompare(dateA)
  })

  const total = filtered.reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0)
  const hasFilters = !!(search || fromDate || toDate)

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 whenever the filters narrow/widen the result set — otherwise
  // e.g. clearing a filter could leave the view stranded on a now out-of-range page.
  useEffect(() => { setPage(1) }, [search, fromDate, toDate])

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Ticket className="h-4 w-4" style={{ color: '#1c2e61' }} />My Bookings
        </h1>
        <span className="text-[11px] text-gray-500">{filtered.length} bookings · {fmt(total)}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input type="text" placeholder="Search by reference or passenger…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-gray-500 font-medium">Travel date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            max={toDate || undefined}
            className="px-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1" />
          <span className="text-[11px] text-gray-400">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            min={fromDate || undefined}
            className="px-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1" />
        </div>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFromDate(''); setToDate('') }}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-gray-200 text-red-500 hover:bg-red-50 transition-colors">
            Clear
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Date Booked</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Passenger</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Flight / Route</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Travel Date</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Ticket Status</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Pax</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#1c2e61' }} />
                  </td>
                </tr>
              ) : paged.flatMap((b: any) => {
                const bps: any[] = b.bookingPassengers || []
                const returnBp   = bps.find((bp: any) => bp.leg === 'return')   ?? null
                // Travel dates sourced from booking_passengers per leg (outbound uses the
                // same derivation as the date-range filter above, so they can't disagree)
                const outboundBp = bps.find((bp: any) => bp.leg === 'outbound') ?? bps[0] ?? null
                const outboundDate = getOutboundDate(b)
                const returnDate   = returnBp?.travel_date   ?? b.return_date   ?? null

                // Flight series from booking_passengers — cross-check with flightSeries relation
                const outboundFs = outboundBp?.flightSeries ?? b.flightSeries ?? null
                const returnFs   = returnBp?.flightSeries   ?? b.returnFlightSeries ?? null

                // Ticket statuses from booking_passengers.ticket_status per leg
                const outboundStatuses = [...new Set(
                  bps.filter((bp: any) => bp.leg === 'outbound' || (!bp.leg && bps.indexOf(bp) === 0))
                    .map((bp: any) => bp.ticket_status).filter(Boolean)
                )]
                const returnStatuses = [...new Set(
                  bps.filter((bp: any) => bp.leg === 'return')
                    .map((bp: any) => bp.ticket_status).filter(Boolean)
                )]

                const statusBadge = (
                  <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                    b.payment_status === 'paid'   ? 'bg-green-100 text-green-800' :
                    b.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {b.payment_status || 'pending'}
                  </span>
                )

                const viewBtn = (
                  <button
                    onClick={() => setSelectedId(b.id)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-md text-white transition-colors"
                    style={{ background: '#1c2e61' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#162450')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1c2e61')}
                  >
                    View
                  </button>
                )

                const rows = [
                  /* Outbound row */
                  <tr key={`${b.id}-out`} className={`hover:bg-gray-50/60 transition-colors ${b.is_return_trip ? 'border-l-2' : ''}`}
                    style={b.is_return_trip ? { borderLeftColor: '#1c2e61' } : undefined}>
                    <td className="px-3 py-2 text-[11px] font-mono font-bold text-gray-900">
                      {b.booking_reference}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">
                      {b.created_at
                        ? new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-800">{b.passenger_name}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1c2e61]/10 text-[#1c2e61]">
                          ↑ OUT
                        </span>
                        <span className="text-[11px] font-semibold text-gray-800">
                          {outboundFs?.flt || b.flightSeries?.flt || '—'}
                        </span>
                        {(outboundFs?.fromDestination ?? b.flightSeries?.fromDestination) && (
                          <span className="text-[10px] text-gray-400">
                            {(outboundFs?.fromDestination ?? b.flightSeries?.fromDestination)?.code}→{(outboundFs?.toDestination ?? b.flightSeries?.toDestination)?.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-700 whitespace-nowrap">
                      {outboundDate ? fmtDate(outboundDate) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {outboundStatuses.length > 0
                        ? <div className="flex flex-wrap gap-0.5 justify-center">
                            {outboundStatuses.map((s: string) => (
                              <span key={s} className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${TICKET_STATUS_COLOR[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
                            ))}
                          </div>
                        : <span className="text-[10px] text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-center text-[11px] text-gray-700">{b.number_of_passengers}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-semibold text-gray-900">{fmt(Number(b.total_amount || 0))}</td>
                    <td className="px-3 py-2 text-center">{statusBadge}</td>
                    <td className="px-3 py-2 text-center">{viewBtn}</td>
                  </tr>,
                ]

                if (b.is_return_trip) {
                  const retFrom = returnFs?.fromDestination ?? b.flightSeries?.toDestination
                  const retTo   = returnFs?.toDestination   ?? b.flightSeries?.fromDestination
                  const retFlt  = returnFs?.flt             ?? b.flightSeries?.flt

                  rows.push(
                    <tr key={`${b.id}-ret`} className="hover:bg-indigo-50/40 transition-colors border-l-2 bg-indigo-50/20"
                      style={{ borderLeftColor: '#3730a3' }}>
                      <td className="px-3 py-2 text-[11px] font-mono text-gray-400">{b.booking_reference}</td>
                      <td className="px-3 py-2 text-[11px] text-gray-400">—</td>
                      <td className="px-3 py-2 text-[11px] text-gray-500 italic">{b.passenger_name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            ↓ RET
                          </span>
                          <span className="text-[11px] font-semibold text-gray-700">{retFlt || '—'}</span>
                          {retFrom && (
                            <span className="text-[10px] text-gray-400">
                              {retFrom.code}→{retTo?.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-700 whitespace-nowrap">
                        {returnDate ? fmtDate(returnDate) : <span className="text-gray-400 italic">No date</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {returnStatuses.length > 0
                          ? <div className="flex flex-wrap gap-0.5 justify-center">
                              {returnStatuses.map((s: string) => (
                                <span key={s} className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${TICKET_STATUS_COLOR[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
                              ))}
                            </div>
                          : <span className="text-[10px] text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-center text-[11px] text-gray-500">{b.number_of_passengers}</td>
                      <td className="px-3 py-2 text-right text-[11px] text-gray-500">—</td>
                      <td className="px-3 py-2 text-center">{statusBadge}</td>
                      <td className="px-3 py-2 text-center">{viewBtn}</td>
                    </tr>
                  )
                }

                return rows
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-[11px] text-gray-400">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="px-2 py-1 text-[11px] font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Prev
              </button>
              <span className="px-2 text-[11px] text-gray-500">Page {safePage} of {pageCount}</span>
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}
                className="px-2 py-1 text-[11px] font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedId !== null && (
        <BookingDetailsModal bookingId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

export default MyBookings
