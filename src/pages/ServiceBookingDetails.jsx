import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import {
  ChevronRight, X, Trash2, Edit, Search, Printer, List, Download, FileSpreadsheet, Filter, Settings
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'


// ── Ultra-compact, premium UI primitives ──
const Label = ({ children, required }) => (
  <label className="inline-flex items-center text-[12.5px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 font-bold mr-1">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-2.5 py-1 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold' : 'hover:border-slate-400'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative w-full ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2.5 py-1 pr-6 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 hover:border-slate-400 cursor-pointer"
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

const LEGACY_SEED_BOOKINGS = [
  {
    id: 1811,
    bookingId: 1811,
    bookingDate: '2026-04-15',
    customerName: 'MANJUNATHA ROCK DRILLS',
    customerCode: 'LM191',
    vehicleSerialNo: 'V3/042600009',
    serialNo: 'V3/042600009',
    vehicleNo: 'KA-01-A-1111',
    serviceJobNo: '26-27/S000027',
    vehicleModelNo: 'V3',
    modelSubType: 'VELSON TYPE',
    vehicleName: 'NEW FABRICATION',
    remarks: '',
    customerVehicleCount: 17,
    financialYear: '26-27',
    createdDate: '15-04-2026'
  },
  {
    id: 1812,
    bookingId: 1812,
    bookingDate: '2026-04-15',
    customerName: 'AJANTHA MINING PRIVATE LIMITED',
    customerCode: 'LM964',
    vehicleSerialNo: 'V10/102400035',
    serialNo: 'V10/102400035',
    vehicleNo: 'KA-02-B-2222',
    serviceJobNo: '26-27/S000028',
    vehicleModelNo: 'V10',
    modelSubType: 'GH600LC',
    vehicleName: 'KOBELCO',
    remarks: 'SPARES',
    customerVehicleCount: 1,
    financialYear: '26-27',
    createdDate: '15-04-2026'
  }
]

export default function ServiceBookingDetails() {
  const toast = useToast()

  // Search state filters (covers both seeds in April 2026)
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2026-04-30')
  const [customer, setCustomer] = useState('')
  const [withoutDate, setWithoutDate] = useState(false)

  // Advanced panel toggle state
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filterModel, setFilterModel] = useState('')

  // Database lists
  const [bookingsList, setBookingsList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [pageLimit, setPageLimit] = useState(1)

  // Load from backend
  const fetchData = async () => {
    try {
      const res = await api.get('/api/service-booking')
      const parsed = res.data?.data || []
      
      const formattedParsed = parsed.map(b => ({
        id: b.id || b.bookingId,
        bookingId: b.bookingId,
        bookingDate: b.bookingDate,
        customerName: b.customerName,
        customerCode: b.customerCode || '—',
        vehicleSerialNo: b.vehicleSerialNo || b.serialNo || '—',
        serialNo: b.vehicleSerialNo || b.serialNo || '—',
        vehicleNo: b.vehicleNo || '—',
        serviceJobNo: b.serviceJobNo || '—',
        vehicleModelNo: b.vehicleModelNo || '—',
        modelSubType: b.modelSubType || '—',
        vehicleName: b.vehicleName || '—',
        remarks: b.remarks || '',
        customerVehicleCount: Number(b.customerVehicleCount) || 1,
        financialYear: b.serviceJobNo ? b.serviceJobNo.split('/')[0] : '26-27',
        createdDate: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0].split('-').reverse().join('-') : '15-04-2026'
      }))

      setBookingsList(formattedParsed)
      if (formattedParsed.length > 0) {
        setSelectedId(formattedParsed[0].id)
      } else {
        setSelectedId(null)
      }
    } catch (err) {
      console.error('Failed to fetch bookings', err)
      toast.error('Failed to load booking records.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Dynamic reactive filtering watching all search triggers and date checks
  useEffect(() => {
    let result = bookingsList

    // 1. Casing / Date filter checks
    if (!withoutDate) {
      if (fromDate) {
        result = result.filter(b => {
          const bDate = new Date(b.bookingDate).toISOString().split('T')[0]
          return bDate >= fromDate
        })
      }
      if (toDate) {
        result = result.filter(b => {
          const bDate = new Date(b.bookingDate).toISOString().split('T')[0]
          return bDate <= toDate
        })
      }
    }

    // 2. Customer dropdown search
    if (customer) {
      result = result.filter(b => b.customerName === customer)
    }

    // 3. Model selector (advanced panel)
    if (filterModel) {
      result = result.filter(b => b.vehicleModelNo === filterModel)
    }

    setFilteredList(result)
    // Keep selection safe
    if (result.length > 0) {
      const exists = result.find(r => r.id === selectedId)
      if (!exists) {
        setSelectedId(result[0].id)
      }
    } else {
      setSelectedId(null)
    }
  }, [bookingsList, fromDate, toDate, customer, withoutDate, filterModel])

  const handleSearch = () => {
    toast.success(`Registry refreshed. Found ${filteredList.length} booking record(s).`)
  }

  const handleDelete = async () => {
    if (!selectedId) {
      toast.warning('Please select a booking from the table below to delete.')
      return
    }

    if (window.confirm('Are you sure you want to delete this Service Booking?')) {
      try {
        await api.delete(`/api/service-booking/${selectedId}`, { loadingMessage: 'Deleting booking...' })
        
        const updated = bookingsList.filter(b => b.id !== selectedId)
        setBookingsList(updated)
        
        const updatedFiltered = filteredList.filter(b => b.id !== selectedId)
        setFilteredList(updatedFiltered)
        
        setSelectedId(updatedFiltered[0]?.id || null)
        toast.error('Service Booking deleted successfully.')
      } catch (err) {
        console.error('Failed to delete booking', err)
        toast.error('Failed to delete booking.')
      }
    }
  }

  // Double-check list of customer options for Select dropdown
  const uniqueCustomers = Array.from(new Set(bookingsList.map(b => b.customerName)))
  const uniqueModels = Array.from(new Set(bookingsList.map(b => b.vehicleModelNo)))

  // ── Excel Spreadsheets binary downloads (.xlsx) ──
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      toast.warning('No bookings data available to export.')
      return
    }

    const data = filteredList.map((b, idx) => ({
      'S.No': idx + 1,
      'ID': b.bookingId,
      'Booking Date': b.bookingDate,
      'Customer Name': b.customerName,
      'Customer Code': b.customerCode,
      'Serial No': b.serialNo,
      'Vehicle No': b.vehicleNo,
      'Service Job No': b.serviceJobNo,
      'Model No': b.vehicleModelNo,
      'Sub Model': b.modelSubType,
      'Vehicle Name': b.vehicleName,
      'Remarks': b.remarks,
      'Vehicle Count': b.customerVehicleCount,
      'Financial Year': b.financialYear,
      'Created Date': b.createdDate
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BookingDetails')

    XLSX.writeFile(workbook, `bookings_details_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Successfully downloaded Bookings Excel spreadsheet!')
  }

  // ── Direct PDF Generation Downloads (.pdf) ──
  const handleExportPdf = () => {
    if (filteredList.length === 0) {
      toast.warning('No bookings details available to export.')
      return
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Header theme block
    doc.setFillColor(0, 151, 167)
    doc.rect(0, 0, 297, 24, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('VELSON ERP - SERVICE BOOKING REGISTRY DETAILS', 15, 15)

    doc.setTextColor(100, 116, 139)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Total Records: ${filteredList.length}`, 240, 31)
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 20, 31)

    // Table Headers
    let startY = 36
    doc.setFillColor(44, 62, 80)
    doc.rect(15, startY, 267, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('ID', 17, startY + 5.5)
    doc.text('Booking Date', 28, startY + 5.5)
    doc.text('Customer Name', 52, startY + 5.5)
    doc.text('Serial No', 115, startY + 5.5)
    doc.text('Vehicle No', 142, startY + 5.5)
    doc.text('Job No', 165, startY + 5.5)
    doc.text('Model No', 195, startY + 5.5)
    doc.text('Sub Model / Name', 215, startY + 5.5)
    doc.text('Count', 260, startY + 5.5)
    doc.text('F.Year', 272, startY + 5.5)

    let currentY = startY + 8
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7.5)

    filteredList.forEach((b, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, currentY, 267, 7, 'F')
      }

      doc.setTextColor(51, 65, 85)
      doc.text(String(b.bookingId), 17, currentY + 4.5)
      doc.text(b.bookingDate, 28, currentY + 4.5)

      doc.setTextColor(15, 23, 42)
      doc.setFont('Helvetica', 'bold')
      const truncatedCustomer = b.customerName.length > 28 ? b.customerName.substring(0, 28) + '...' : b.customerName
      doc.text(truncatedCustomer, 52, currentY + 4.5)

      doc.setTextColor(51, 65, 85)
      doc.setFont('Helvetica', 'normal')
      doc.text(b.serialNo || '—', 115, currentY + 4.5)
      doc.text(b.vehicleNo || '—', 142, currentY + 4.5)

      doc.setTextColor(0, 151, 167)
      doc.setFont('Helvetica', 'bold')
      doc.text(b.serviceJobNo, 165, currentY + 4.5)

      doc.setTextColor(51, 65, 85)
      doc.setFont('Helvetica', 'normal')
      doc.text(b.vehicleModelNo, 195, currentY + 4.5)

      const submodelText = `${b.modelSubType} / ${b.vehicleName}`
      const truncatedSub = submodelText.length > 22 ? submodelText.substring(0, 22) + '...' : submodelText
      doc.text(truncatedSub, 215, currentY + 4.5)

      doc.setFont('Helvetica', 'bold')
      doc.text(String(b.customerVehicleCount), 260, currentY + 4.5)
      doc.setFont('Helvetica', 'normal')
      doc.text(b.financialYear, 272, currentY + 4.5)

      doc.setDrawColor(241, 245, 249)
      doc.line(15, currentY + 7, 282, currentY + 7)

      currentY += 7

      if (currentY > 185) {
        doc.addPage()
        doc.setFillColor(44, 62, 80)
        doc.rect(15, 10, 267, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('Helvetica', 'bold')
        doc.text('ID', 17, 15.5)
        doc.text('Booking Date', 28, 15.5)
        doc.text('Customer Name', 52, 15.5)
        doc.text('Serial No', 115, 15.5)
        doc.text('Vehicle No', 142, 15.5)
        doc.text('Job No', 165, 15.5)
        doc.text('Model No', 195, 15.5)
        doc.text('Sub Model / Name', 215, 15.5)
        doc.text('Count', 260, 15.5)
        doc.text('F.Year', 272, 15.5)
        currentY = 18
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(7.5)
      }
    })

    doc.save(`bookings_details_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Successfully downloaded Booking details PDF!')
  }

  // ── Dos Print layouts preview ──
  const handlePrintBookingRegistry = () => {
    if (filteredList.length === 0) {
      toast.warning('No bookings details list to print.')
      return
    }

    const printWindow = window.open('', '_blank', 'width=950,height=750')
    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Entry Details Registry</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #0097A7; font-size: 24px; text-transform: uppercase; font-weight: 800; }
            p { margin: 3px 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0097A7; color: white; font-size: 12px; text-transform: uppercase; font-weight: bold; padding: 8px; border: 1px solid #334155; }
            td { padding: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Velson ERP</h1>
              <p>Booking Entry Details Registry Report</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin:0; font-size:16px; color:#475569;">Bookings Detailed Registry</h2>
              <p>Total Records: ${filteredList.length}</p>
              <p>Printed: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>S.No</th>
                <th>Booking Date</th>
                <th>Customer Name</th>
                <th>Customer Code</th>
                <th>Serial No</th>
                <th>Vehicle No</th>
                <th>Job No</th>
                <th>Model No</th>
                <th>Sub Model</th>
                <th>Vehicle Name</th>
                <th>Count</th>
                <th>F.Year</th>
              </tr>
            </thead>
            <tbody>
              ${filteredList.map((b, idx) => `
                <tr>
                  <td class="text-center">${b.bookingId}</td>
                  <td class="text-center">${idx + 1}</td>
                  <td class="text-center">${b.bookingDate}</td>
                  <td><b>${b.customerName}</b></td>
                  <td class="text-center">${b.customerCode}</td>
                  <td>${b.serialNo}</td>
                  <td class="text-center font-mono">${b.vehicleNo}</td>
                  <td class="text-center"><b>${b.serviceJobNo}</b></td>
                  <td class="text-center">${b.vehicleModelNo}</td>
                  <td>${b.modelSubType}</td>
                  <td>${b.vehicleName}</td>
                  <td class="text-center font-bold">${b.customerVehicleCount}</td>
                  <td class="text-center">${b.financialYear}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            VELSON ERP - System Generated Detailed Booking Report
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Dynamic aggregates
  const totalVehicleCount = filteredList.reduce((sum, item) => sum + (Number(item.customerVehicleCount) || 0), 0)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-4 py-4">

        {/* Breadcrumb keeps Dashboard chevron arrow REMOVED */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3.5 uppercase font-bold tracking-wider">
          <span className="hover:text-[#0097A7] cursor-pointer">Service</span>
          <ChevronRight size={11} />
          <span className="text-[#0097A7]">Service Booking Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Card header styled with teal banner and Close button inside header */}
          <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-sm"></span>
              <span className="font-bold text-[13px] uppercase tracking-wider">Booking Entry Details</span>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
              className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider h-[28px]"
            >
              Close
            </button>
          </div>

          <div className="p-4">
            {/* Horizontal Aligned Filters Row matching the screenshot */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-200 shadow-sm max-w-7xl mx-auto">

              <div className="flex items-center gap-2">
                <Label>From Date :</Label>
                <input
                  type="date"
                  value={fromDate}
                  disabled={withoutDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="px-2.5 py-1 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label>To Date :</Label>
                <input
                  type="date"
                  value={toDate}
                  disabled={withoutDate}
                  onChange={e => setToDate(e.target.value)}
                  className="px-2.5 py-1 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                />
              </div>

              <div className="flex items-center gap-2 min-w-[260px]">
                <Label>Customer Name :</Label>
                <Select
                  options={uniqueCustomers}
                  placeholder="Select Customer..."
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="withoutDate"
                  checked={withoutDate}
                  onChange={e => setWithoutDate(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#0097A7] border-slate-300 rounded focus:ring-[#0097A7] cursor-pointer"
                />
                <label htmlFor="withoutDate" className="text-[12.5px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                  Without Date
                </label>
              </div>

              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-1 h-[28px] px-4 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap ml-auto"
              >
                <Search size={12} /> Search
              </button>
            </div>

            {/* List Utilities Toolbar Aligned Exactly on the Right above Headers */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 max-w-7xl mx-auto">
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-wider">Bookings Registry Detail View</span>

              <div className="flex items-center gap-1">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">LS</span>
                  <input
                    type="number"
                    value={pageLimit}
                    onChange={e => setPageLimit(e.target.value)}
                    className="w-10 text-center py-[2px] border border-slate-200 rounded text-[13px] font-bold text-slate-700 bg-white h-[26px] focus:outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                  />
                </div>

                {[
                  { icon: <Printer size={12} />, l: 'Dos' },
                  { icon: <FileSpreadsheet size={12} className="text-green-600" />, l: 'Excel' },
                  { icon: <Download size={12} className="text-red-500" />, l: 'Pdf' },
                  { icon: <Filter size={12} className="text-[#0097A7]" />, l: 'Filter' },
                  { icon: <Settings size={12} className="text-slate-500" />, l: 'Setting' }
                ].map(tool => (
                  <button
                    key={tool.l}
                    onClick={() => {
                      if (tool.l === 'Dos') handlePrintBookingRegistry()
                      else if (tool.l === 'Excel') handleExportExcel()
                      else if (tool.l === 'Pdf') handleExportPdf()
                      else if (tool.l === 'Filter') setShowFilterPanel(!showFilterPanel)
                      else toast.success(`${tool.l} tool activated.`)
                    }}
                    className="flex items-center gap-0.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold uppercase rounded shadow-sm transition-all active:scale-95 h-[30px]"
                  >
                    {tool.icon} {tool.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Down Advanced Filter Panel */}
            {showFilterPanel && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 max-w-7xl mx-auto grid grid-cols-12 gap-4 items-center animate-fade-in shadow-inner">
                <div className="col-span-4 flex items-center gap-2">
                  <Label>Filter Model No:</Label>
                  <Select
                    options={uniqueModels}
                    placeholder="All Models"
                    value={filterModel}
                    onChange={e => setFilterModel(e.target.value)}
                  />
                </div>
                <div className="col-span-8 flex justify-end gap-2">
                  <button
                    onClick={() => { setFilterModel(''); setWithoutDate(false); setCustomer(''); }}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-[12px] font-bold uppercase rounded"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* main database table grid */}
            <div className="max-w-7xl mx-auto border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white mb-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1700px]">
                  <thead className="bg-slate-50 text-[12px] uppercase text-slate-400 font-bold border-b border-slate-200">
                    <tr className="h-8">
                      <th className="px-3 py-1 border-r border-slate-100 w-16 text-center">ID</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-16 text-center">S.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28 text-center">Booking Date</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-[240px]">Customer Name</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28 text-center">Customer Code</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-32">Serial No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28 text-center">Vehicle No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-36 text-center">Service Job.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24 text-center">Model No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-32">Sub Model</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-36">Vehicle Name</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-[200px]">Remarks</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28 text-center">Vehicle Count.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24 text-center">Financial Year</th>
                      <th className="px-3 py-1 text-center w-28">Created_D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px]">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="py-16 text-center text-slate-300 italic">
                          No booking detailed records found.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((row, idx) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`hover:bg-[#0097A7]/5 cursor-pointer transition-colors h-9 ${selectedId === row.id ? 'bg-[#0097A7]/10 font-semibold' : ''}`}
                        >
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-500 bg-slate-50/50">{row.bookingId}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-500">{row.bookingDate}</td>
                          <td className="px-3 py-1 border-r border-slate-50 font-bold text-slate-700">{row.customerName}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center text-slate-500 font-semibold">{row.customerCode}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-slate-600">{row.serialNo}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-mono text-slate-700">{row.vehicleNo}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-[#0097A7]">{row.serviceJobNo}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-500">{row.vehicleModelNo}</td>
                          <td className="px-3 py-1 border-r border-slate-50 font-medium text-slate-600">{row.modelSubType}</td>
                          <td className="px-3 py-1 border-r border-slate-50 font-bold text-slate-600">{row.vehicleName}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-slate-500 italic max-w-[200px] truncate">{row.remarks || '—'}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-black text-slate-600 bg-slate-50/30">{row.customerVehicleCount}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-medium text-slate-500">{row.financialYear}</td>
                          <td className="px-3 py-1 text-center font-semibold text-slate-500">{row.createdDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aggregated Total summary bar row mirroring the visual spec layout details */}
            <div className="max-w-7xl mx-auto bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between text-[12px] text-slate-500 font-bold uppercase tracking-wider shadow-sm mb-1">
              <div className="flex items-center gap-6">
                <span>Row : {filteredList.length}</span>
              </div>
              <div className="flex items-center gap-8 pl-4 pr-12">
                <span className="flex items-center gap-1.5">
                  Summed Vehicle Count: <span className="text-[12px] font-black text-[#0097A7] bg-white border border-slate-200 px-2.5.5 py-0.5 rounded shadow-sm">{totalVehicleCount}</span>
                </span>
              </div>
            </div>

            {/* footer specification labels removed */}

          </div>
        </div>
      </div>
    </div>
  )
}