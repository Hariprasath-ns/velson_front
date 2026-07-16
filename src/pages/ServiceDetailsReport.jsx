import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
// PDF table rendered with raw jsPDF canvas (no autotable needed)
import {
  ChevronRight, Search, Edit, Trash2, Printer, FileSpreadsheet, FileDown, Filter, Settings
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'


// ── UI Primitives ──
const Label = ({ children }) => (
  <label className="text-[12.5px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">{children}</label>
)

const Input = ({ value, onChange, type = 'text', placeholder = '', className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-2.5 py-1 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 ${className}`}
  />
)

const Select = ({ options, value, onChange, placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2.5 py-1 pr-6 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

// Seed report data matching the legacy screenshot
const SEED_REPORT_ROWS = [
  { id: 1, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100081-V2-1 CENTER SLIDER 2-1 12D' },
  { id: 2, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100086-V2-1 ROPE TENSION PULLEY-10"' },
  { id: 3, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100092-V2-1 MYRMAX 10" DOUBLE ROPE T' },
  { id: 4, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100094-V2-1 BOTTOM PULLEY-10" SINGLE' },
  { id: 5, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100096-V2-1 BOTTOM PULLEY-8" SINGLE' },
  { id: 6, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100151-V2-1 2H SIDE ROLLER ASSEMBLE 100' },
  { id: 7, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-100582-V7 800 H-PLATE XL GEAR BOX' },
  { id: 8, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-104461-V2-1 LUB OIL TANK' },
  { id: 9, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-104535-V2-1 VEHICLE PAINT COATING BI' },
  { id: 10, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VC-105079-V2-1 14 INCH BED' },
  { id: 11, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VG-20938-PTO GEAR BOX ASSM 52-35 TEET' },
  { id: 12, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VGH-1000830-V10 GMV 400 ROTATION ASSM' },
  { id: 13, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VGH-1000956-AIR HOSE REEL ASSEMBLE' },
  { id: 14, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VHC-33610-AIR VALVE HYDRAULIC CYLINDE' },
  { id: 15, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VHM-50092-XL INNER SAVARAN MUD GMV GI' },
  { id: 16, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-1200184-V2-1 B56 CENTER GEARBOX MC' },
  { id: 17, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-1200432-V2 PIPELINE LIST ASSM' },
  { id: 18, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200045-V2I CHECK VALVE ADAPTOR LIS' },
  { id: 19, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200130-V2-1 MRC PIN & LOCK ASSM 2-1' },
  { id: 20, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200183-V7 PIPE LINE CLAMP & WELDABL' },
  { id: 21, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200249-V2-1 LADDER ASSEMBLE' },
  { id: 22, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200365-V7 ROD CHANGER WINCH ASSEM' },
  { id: 23, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200417-V21 JACKEY BOX FULL ASSM(RH' },
  { id: 24, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200417-V2 MASTER FABRICATION' },
  { id: 25, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200498-V7 BREAK OUTER EAR PIECE AS' },
  { id: 26, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200552-WATER PUMP BED ASSEMBLE' },
  { id: 27, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200602-V7 HYDRAULIC OIL TANK ASSM' },
  { id: 28, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200636-V7 TOW BAR FULL' },
  { id: 29, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200618-V7 A FRAME ASSEMBLE' },
  { id: 30, bookingId: 1582, bookingNo: '25-26/S000448', serviceJobNo: '25-26/S000448', vehicleCount: 7, date: '2026-08-01', customerName: 'S.R EXPORTS', serialNo: 'V7/012600029', vehicleNo: 'V7', modelNo: 'V7', vehicleName: 'LEYLAND', itemName: 'VM-200636-V7 TOW BAR FULL BODY ASSEMBLE' },
]

// Helper to merge live data into report rows (removed sync version, handled async in component)

export default function ServiceDetailsReport() {
  const toast = useToast()

  const today = new Date().toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Filters
  const [fromDate, setFromDate] = useState('2026-04-15')
  const [toDate, setToDate] = useState(today)
  const [customerFilter, setCustomerFilter] = useState('')
  const [bookingCodeFilter, setBookingCodeFilter] = useState('')

  // Data
  const [allRows, setAllRows] = useState([])
  const [filteredRows, setFilteredRows] = useState([])
  const [selectedRowId, setSelectedRowId] = useState(null)

  // Unique filter options
  const [customerOptions, setCustomerOptions] = useState([])
  const [bookingCodeOptions, setBookingCodeOptions] = useState([])

  // On mount: load and seed data
  useEffect(() => {
    const loadData = async () => {
      let rows = [...SEED_REPORT_ROWS]
      try {
        const res = await api.get('/api/service-booking')
        const bookings = res.data?.data || []
        let nextId = rows.length + 1
        
        bookings.forEach(b => {
          if (b.serviceJobNo) {
            rows.push({
              id: nextId++,
              bookingId: b.bookingId || '—',
              bookingNo: b.serviceJobNo,
              serviceJobNo: b.serviceJobNo,
              vehicleCount: b.customerVehicleCount || 1,
              date: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : '—',
              customerName: b.customerName || '—',
              serialNo: b.vehicleSerialNo || b.serialNo || '—',
              vehicleNo: b.vehicleNo || '—',
              modelNo: b.vehicleModelNo || '—',
              vehicleName: b.vehicleName || '—',
              itemName: '—',
            })
          }
        })
      } catch (err) {
        console.error('Failed to fetch bookings for report', err)
      }
      
      setAllRows(rows)
      setFilteredRows(rows)
      setCustomerOptions([...new Set(rows.map(r => r.customerName).filter(Boolean))])
      setBookingCodeOptions([...new Set(rows.map(r => r.bookingNo).filter(Boolean))])
    }
    loadData()
  }, [])

  // Reactive filtering
  useEffect(() => {
    let result = [...allRows]

    result = result.filter(r => {
      if (!r.date || r.date === '—') return true
      return r.date >= fromDate && r.date <= toDate
    })

    if (customerFilter) {
      result = result.filter(r => r.customerName === customerFilter)
    }

    if (bookingCodeFilter) {
      result = result.filter(r => r.bookingNo === bookingCodeFilter)
    }

    setFilteredRows(result)
  }, [fromDate, toDate, customerFilter, bookingCodeFilter, allRows])

  // Excel export
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.warning('No data to export.')
      return
    }
    const data = filteredRows.map((r, i) => ({
      'S.No': i + 1,
      'Booking Id': r.bookingId,
      'Booking No': r.bookingNo,
      'Service Job No': r.serviceJobNo,
      'Vehicle Count No': r.vehicleCount,
      'Date': r.date,
      'Customer Name': r.customerName,
      'Serial No': r.serialNo,
      'Vehicle No': r.vehicleNo,
      'Model No': r.modelNo,
      'Vehicle Name': r.vehicleName,
      'Item Name': r.itemName,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ServiceDetailsReport')
    const workbookBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const workbookBlob = new Blob([workbookBuffer], { type: 'application/octet-stream' })
    openExcelPreview(reportData, workbookBlob, `service_details_report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Service Details Report Preview')
    toast.success('Excel downloaded!')
  }

  // PDF export (landscape) — manual jsPDF canvas, no external autotable dependency
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      toast.warning('No data to export.')
      return
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const mx = 8
    const colW = [10, 18, 28, 28, 16, 20, 38, 28, 18, 16, 22, 35]
    const hdrs = ['S.No', 'Booking Id', 'Booking No', 'Service Job No', 'Veh.Count', 'Date', 'Customer Name', 'Serial No', 'Vehicle No', 'Model', 'Vehicle Name', 'Item Name']
    const rowH = 6
    const hdrH = 8
    const tableW = colW.reduce((a, b) => a + b, 0)

    // Title banner
    doc.setFillColor(0, 151, 167)
    doc.rect(0, 0, pageW, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICE DETAILS REPORT', pageW / 2, 11, { align: 'center' })
    doc.setFontSize(8)
    doc.setTextColor(200, 240, 245)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}   |   From: ${fromDate}   To: ${toDate}`, pageW / 2, 16, { align: 'center' })

    let curY = 22

    const drawHeader = (y) => {
      doc.setFillColor(0, 122, 135)
      doc.rect(mx, y, tableW, hdrH, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      let x = mx
      hdrs.forEach((h, i) => { doc.text(h, x + 1.5, y + 5.5, { maxWidth: colW[i] - 2 }); x += colW[i] })
      return y + hdrH
    }

    curY = drawHeader(curY)

    filteredRows.forEach((r, idx) => {
      if (curY + rowH > pageH - 14) { doc.addPage(); curY = 10; curY = drawHeader(curY) }
      if (idx % 2 === 0) { doc.setFillColor(245, 250, 251); doc.rect(mx, curY, tableW, rowH, 'F') }
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      const cells = [String(idx + 1), String(r.bookingId), r.bookingNo, r.serviceJobNo, String(r.vehicleCount), r.date, r.customerName, r.serialNo, r.vehicleNo, r.modelNo, r.vehicleName, r.itemName]
      let x = mx
      cells.forEach((c, i) => { doc.text(String(c || '—'), x + 1.5, curY + 4, { maxWidth: colW[i] - 2 }); x += colW[i] })
      doc.setDrawColor(220, 220, 220)
      doc.line(mx, curY + rowH, mx + tableW, curY + rowH)
      curY += rowH
    })

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`Total Rows: ${filteredRows.length}`, mx, curY + 8)
    doc.save(`service_details_report_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF downloaded!')
  }

  // DOS Print
  const handlePrint = () => {
    const printContent = `
      <html><head><title>Service Details Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 16px; }
        h2 { text-align: center; color: #0097A7; margin-bottom: 8px; }
        .meta { text-align: center; font-size: 12px; color: #555; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #0097A7; color: white; padding: 4px 6px; text-align: left; font-size: 12px; }
        td { padding: 3px 6px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f0fafa; }
        .footer { margin-top: 12px; font-size: 9px; color: #888; }
      </style></head><body>
      <h2>SERVICE DETAILS REPORT</h2>
      <div class="meta">From: ${fromDate} &nbsp;|&nbsp; To: ${toDate} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString('en-IN')}</div>
      <table>
        <thead><tr>
          <th>S.No</th><th>Booking Id</th><th>Booking No</th><th>Service Job No</th>
          <th>Veh. Count</th><th>Date</th><th>Customer Name</th><th>Serial No</th>
          <th>Vehicle No</th><th>Model</th><th>Vehicle Name</th><th>Item Name</th>
        </tr></thead>
        <tbody>
          ${filteredRows.map((r, i) => `
            <tr>
              <td>${i + 1}</td><td>${r.bookingId}</td><td>${r.bookingNo}</td>
              <td>${r.serviceJobNo}</td><td>${r.vehicleCount}</td><td>${r.date}</td>
              <td>${r.customerName}</td><td>${r.serialNo}</td><td>${r.vehicleNo}</td>
              <td>${r.modelNo}</td><td>${r.vehicleName}</td><td>${r.itemName}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">Total Rows: ${filteredRows.length}</div>
      </body></html>
    `
    const pw = window.open('', '_blank', 'width=1100,height=700')
    if (pw) {
      pw.document.write(printContent)
      pw.document.close()
      pw.focus()
      pw.print()
    }
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-4 py-4">

        {/* Breadcrumb — Dashboard chevron removed */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3.5 uppercase font-bold tracking-wider">
          <span className="hover:text-[#0097A7] cursor-pointer">Service</span>
          <ChevronRight size={11} />
          <span className="text-[#0097A7]">Service Details Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Teal Header Banner ── */}
          <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-sm flex-shrink-0"></span>
              <span className="font-bold text-[13px] uppercase tracking-wider">Service Entry Details</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!selectedRowId) { toast.warning('Please select a row to edit.'); return }
                  toast.warning('Edit mode: open the booking entry for this record.')
                }}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1 h-[28px]"
              >
                <Edit size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  if (!selectedRowId) { toast.warning('Please select a row to delete.'); return }
                  if (window.confirm('Delete this report entry?')) {
                    setAllRows(prev => prev.filter(r => r.id !== selectedRowId))
                    setSelectedRowId(null)
                    toast.error('Entry removed from report.')
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1 h-[28px]"
              >
                <Trash2 size={12} /> Delete
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider h-[28px]"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4">

            {/* ── Filter Bar ── */}
            <div className="mb-4 bg-slate-50/50 p-4 border border-slate-200 rounded-lg shadow-sm">
              <div className="grid grid-cols-12 gap-x-6 gap-y-3">
                <div className="col-span-8 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>From Date :</Label>
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        className="w-[140px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>To Date :</Label>
                      <Input
                        type="date"
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        className="w-[140px]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-28 text-right pr-2">
                      <Label>Customer Name :</Label>
                    </div>
                    <Select
                      options={customerOptions}
                      value={customerFilter}
                      onChange={e => setCustomerFilter(e.target.value)}
                      placeholder=""
                      className="w-[300px]"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-28 text-right pr-2">
                      <Label>Booking Code:</Label>
                    </div>
                    <Select
                      options={bookingCodeOptions}
                      value={bookingCodeFilter}
                      onChange={e => setBookingCodeFilter(e.target.value)}
                      placeholder=""
                      className="w-[300px]"
                    />
                  </div>
                </div>
                <div className="col-span-4 flex flex-col items-start gap-2 justify-start pt-1">
                  <button
                    onClick={() => {
                      toast.success(`Showing ${filteredRows.length} result(s)`)
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[13px] font-bold rounded shadow-sm w-[120px] transition-all active:scale-95"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div> Search
                  </button>
                  {/* Eliminated Details Button as requested */}
                </div>
              </div>
            </div>

            {/* ── Table Action Controls ── */}
            <div className="flex items-center justify-end gap-2 mb-2">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">LS</span>
                <input
                  type="number"
                  defaultValue={1}
                  className="w-10 text-center py-[2px] border border-slate-200 rounded text-[13px] font-bold text-slate-700 bg-white h-[26px] focus:outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                />
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white text-[12px] font-bold rounded h-[28px] transition-all active:scale-95"
              >
                <Printer size={12} /> Dos
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded h-[28px] transition-all active:scale-95"
              >
                <FileSpreadsheet size={12} /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold rounded h-[28px] transition-all active:scale-95"
              >
                <FileDown size={12} /> Pdf
              </button>
              <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold rounded h-[28px] transition-all">
                <Filter size={12} className="text-[#0097A7]" /> Filter
              </button>
              <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold rounded h-[28px] transition-all">
                <Settings size={12} /> Setting
              </button>
            </div>

            {/* ── Main Registry Table ── */}
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white mb-3">
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1300px]">
                  <thead className="bg-slate-50 text-[12px] uppercase text-slate-400 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr className="h-8">
                      <th className="px-3 py-1 border-r border-slate-100 w-14 text-center">S.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24 text-center">Booking Id</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-36">Booking No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-36">Service job.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28 text-center">Vehicle Count.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24 text-center">Date</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-40">Customer_Name</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-36">Serial_No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24 text-center">Vehicle_No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-20 text-center">Model_No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28">Vehicle_Name</th>
                      <th className="px-3 py-1">Item_Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px]">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-300 italic">
                          No records found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedRowId(row.id)}
                          className={`cursor-pointer h-9 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            } ${selectedRowId === row.id ? '!bg-[#0097A7]/10 font-semibold' : 'hover:bg-[#0097A7]/5'}`}
                        >
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-[#0097A7]">{row.bookingId}</td>
                          <td className="px-3 py-1 border-r border-slate-100 font-medium text-slate-600">{row.bookingNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100 font-bold text-[#0097A7]">{row.serviceJobNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-500">{row.vehicleCount}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center text-slate-500">{row.date}</td>
                          <td className="px-3 py-1 border-r border-slate-100 font-bold text-slate-700">{row.customerName}</td>
                          <td className="px-3 py-1 border-r border-slate-100 font-mono text-[10.5px] text-slate-600">{row.serialNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-500">{row.vehicleNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-500">{row.modelNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-slate-600">{row.vehicleName}</td>
                          <td className="px-3 py-1 text-slate-600 max-w-[320px] truncate" title={row.itemName}>{row.itemName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bottom Row Counter & Aggregates ── */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
              <div className="flex items-center gap-8">
                <span>Row : {filteredRows.length}</span>
                <span className="text-slate-400">|</span>
                <span>Total Vehicle Count: {filteredRows.reduce((acc, cur) => acc + cur.vehicleCount, 0)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}