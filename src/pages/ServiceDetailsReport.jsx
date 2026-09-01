import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import {
  ChevronRight, ChevronDown, Search, Printer, FileSpreadsheet, FileDown, RotateCcw, Box, Layers
} from 'lucide-react'
import { openExcelPreview } from '../utils/excelPreview'
import { useToast } from '../components/Toast'
import api from '../services/api'

// ── UI Primitives ──
const Label = ({ children }) => (
  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">{children}</label>
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

// Seed baseline demo rows
const SEED_REPORT_ROWS = [
  {
    id: 1,
    bookingDate: '2026-08-01',
    customerName: 'Golden Borewell Company',
    vehicleCount: '5',
    serviceJobNo: '26-27/S000101',
    modelNo: 'V7',
    vehicleSerialNo: 'V7/012600029',
    assemblyItem: 'VC-100081-V2-1 CENTER SLIDER 2-1 12D',
    childParts: [
      { childPart: 'P-1001', childPartName: 'Center Slider Plate', qty: 2, uom: 'Nos', createdBy: 'Admin', createdDate: '2026-08-01 10:30:00', systemName: 'VELSON-ERP' },
      { childPart: 'P-1002', childPartName: 'Bush Fastener 12D', qty: 4, uom: 'Nos', createdBy: 'Admin', createdDate: '2026-08-01 10:30:00', systemName: 'VELSON-ERP' }
    ]
  },
  {
    id: 2,
    bookingDate: '2026-08-02',
    customerName: 'Golden Borewell Company',
    vehicleCount: '5',
    serviceJobNo: '26-27/S000101',
    modelNo: 'V7',
    vehicleSerialNo: 'V7/012600029',
    assemblyItem: 'VC-100086-V2-1 ROPE TENSION PULLEY-10"',
    childParts: [
      { childPart: 'P-1005', childPartName: 'Tension Pulley 10 Inch', qty: 1, uom: 'Nos', createdBy: 'Admin', createdDate: '2026-08-02 11:15:00', systemName: 'VELSON-ERP' },
      { childPart: 'P-1006', childPartName: 'Bearing Pin 25mm', qty: 2, uom: 'Nos', createdBy: 'Admin', createdDate: '2026-08-02 11:15:00', systemName: 'VELSON-ERP' }
    ]
  },
  {
    id: 3,
    bookingDate: '2026-08-05',
    customerName: 'S.R EXPORTS',
    vehicleCount: '7',
    serviceJobNo: '25-26/S000448',
    modelNo: 'V7',
    vehicleSerialNo: 'V7/012600035',
    assemblyItem: 'VC-100582-V7 800 H-PLATE XL GEAR BOX',
    childParts: [
      { childPart: 'P-2001', childPartName: 'H-Plate Mounting Frame', qty: 1, uom: 'Nos', createdBy: 'Admin', createdDate: '2026-08-05 14:20:00', systemName: 'VELSON-ERP' },
      { childPart: 'P-2002', childPartName: 'XL Gear Pinion 35T', qty: 1, uom: 'Nos', createdBy: 'Admin', createdDate: '2026-08-05 14:20:00', systemName: 'VELSON-ERP' }
    ]
  }
]

export default function ServiceDetailsReport() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]

  // Filters
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState(today)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedAssembly, setSelectedAssembly] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Raw data from server & state
  const [allEntries, setAllEntries] = useState([])
  const [bomList, setBomList] = useState([])
  const [expandedRows, setExpandedRows] = useState({})
  const [selectedRowId, setSelectedRowId] = useState(null)

  // Load backend data on mount
  useEffect(() => {
    const fetchData = async () => {
      let combined = [...SEED_REPORT_ROWS]
      try {
        const [detailsRes, bomsRes, bookingsRes] = await Promise.all([
          api.get('/api/service-detail').catch(() => ({ data: { data: [] } })),
          api.get('/api/bom-creation').catch(() => ({ data: { data: [] } })),
          api.get('/api/service-booking').catch(() => ({ data: { data: [] } }))
        ])

        const details = detailsRes.data?.data || []
        const boms = bomsRes.data?.data || []
        const bookings = bookingsRes.data?.data || []
        setBomList(boms)

        let nextId = 100
        details.forEach(d => {
          if (d.status === 'Inactive') return
          const matchedBooking = bookings.find(b => b.serviceJobNo === d.serviceJobNo)
          const assemblies = Array.isArray(d.checkedAssemblies) && d.checkedAssemblies.length > 0
            ? d.checkedAssemblies
            : (d.servicePartNo ? [d.servicePartNo] : ['General Service'])

          assemblies.forEach(ass => {
            const matchedBom = boms.find(b =>
              (b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === String(ass).trim().toLowerCase()) ||
              (b.bomNo && b.bomNo.trim().toLowerCase() === String(ass).trim().toLowerCase())
            )

            let childParts = []
            if (matchedBom && Array.isArray(matchedBom.excelRows)) {
              childParts = matchedBom.excelRows.map((er, idx) => {
                const keys = Object.keys(er)
                const pNoKey = keys.find(k => k.toLowerCase().includes('part no') || k.toLowerCase().includes('part number'))
                const pNameKey = keys.find(k => k.toLowerCase().includes('part name') || k.toLowerCase().includes('name') || k.toLowerCase().includes('desc'))
                const qtyKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity'))
                return {
                  childPart: er[pNoKey] || `CP-${idx + 1}`,
                  childPartName: er[pNameKey] || 'Component Spare',
                  qty: Number(er[qtyKey]) || 1,
                  uom: er.UOM || er.uom || 'Nos',
                  createdBy: d.createdBy || 'Admin',
                  createdDate: d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : (d.createdDateTime || '—'),
                  systemName: 'VELSON-ERP'
                }
              })
            } else {
              childParts = [
                {
                  childPart: ass,
                  childPartName: matchedBom?.groupName || d.vehicleName || 'Standard Service Assembly',
                  qty: 1,
                  uom: 'Nos',
                  createdBy: d.createdBy || 'Admin',
                  createdDate: d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : (d.createdDateTime || '—'),
                  systemName: 'VELSON-ERP'
                }
              ]
            }

            combined.push({
              id: nextId++,
              bookingDate: d.bookingDate || (matchedBooking ? matchedBooking.bookingDate : '2026-04-15'),
              customerName: d.customerName || (matchedBooking ? matchedBooking.customerName : '—'),
              vehicleCount: String(d.vehicleCount || (matchedBooking ? matchedBooking.count : '1')),
              serviceJobNo: d.serviceJobNo || '—',
              modelNo: d.vehicleModelNo || (matchedBooking ? matchedBooking.vehicleModelNo : '—'),
              vehicleSerialNo: d.serialNo || (matchedBooking ? matchedBooking.vehicleSerialNo : '—'),
              assemblyItem: ass,
              childParts
            })
          })
        })
      } catch (err) {
        console.error('Failed to load live service detail report data', err)
      }
      setAllEntries(combined)
    }

    fetchData()
  }, [])

  // 1. Search Workflow: Unique Companies List
  const companyOptions = useMemo(() => {
    const list = allEntries.map(e => e.customerName).filter(Boolean)
    return Array.from(new Set(list)).sort()
  }, [allEntries])

  // 2. Search Workflow: Selecting a company lists all its Assembly Numbers
  const assemblyOptions = useMemo(() => {
    const relevant = selectedCompany
      ? allEntries.filter(e => e.customerName === selectedCompany)
      : allEntries
    const assemblies = relevant.map(e => e.assemblyItem).filter(Boolean)
    return Array.from(new Set(assemblies)).sort()
  }, [allEntries, selectedCompany])

  // Reset assembly filter if company changes and current assembly does not belong
  useEffect(() => {
    if (selectedAssembly && !assemblyOptions.includes(selectedAssembly)) {
      setSelectedAssembly('')
    }
  }, [selectedCompany, assemblyOptions, selectedAssembly])

  // 3. Filtered rows calculation
  const filteredRows = useMemo(() => {
    return allEntries.filter(r => {
      if (selectedCompany && r.customerName !== selectedCompany) return false
      if (selectedAssembly && r.assemblyItem !== selectedAssembly) return false
      if (fromDate && r.bookingDate && r.bookingDate < fromDate) return false
      if (toDate && r.bookingDate && r.bookingDate > toDate) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.serviceJobNo && r.serviceJobNo.toLowerCase().includes(q)) ||
          (r.assemblyItem && r.assemblyItem.toLowerCase().includes(q)) ||
          (r.vehicleSerialNo && r.vehicleSerialNo.toLowerCase().includes(q)) ||
          (r.modelNo && r.modelNo.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  }, [allEntries, selectedCompany, selectedAssembly, fromDate, toDate, searchQuery])

  // Toggle child accordion row
  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Excel export
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.warning('No data to export.')
      return
    }
    const data = filteredRows.map((r, i) => ({
      'S.No': i + 1,
      'Booking Date': r.bookingDate,
      'Customer Name': r.customerName,
      'Chosen Count / Vehicle Count': r.vehicleCount,
      'Service Job No': r.serviceJobNo,
      'Model No': r.modelNo,
      'Vehicle Serial No': r.vehicleSerialNo,
      'Assembly Item': r.assemblyItem,
      'Child Parts Count': (r.childParts || []).length
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ServiceEntryReport')
    const workbookBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const workbookBlob = new Blob([workbookBuffer], { type: 'application/octet-stream' })
    openExcelPreview(data, workbookBlob, `service_entry_report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Service Entry Report Preview')
    toast.success('Excel downloaded successfully!')
  }

  // PDF Export
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      toast.warning('No data to export.')
      return
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const mx = 8
    const colW = [12, 28, 50, 24, 34, 22, 34, 65]
    const hdrs = ['S.No', 'Booking Date', 'Customer Name', 'Veh. Count', 'Service Job No', 'Model No', 'Vehicle Serial No', 'Assembly Item']
    const rowH = 7
    const hdrH = 8
    const tableW = colW.reduce((a, b) => a + b, 0)

    doc.setFillColor(0, 151, 167)
    doc.rect(0, 0, pageW, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICE ENTRY REPORT', pageW / 2, 11, { align: 'center' })
    doc.setFontSize(8)
    doc.setTextColor(200, 240, 245)
    doc.text(`Company: ${selectedCompany || 'All Companies'}   |   Generated: ${new Date().toLocaleDateString('en-IN')}`, pageW / 2, 16, { align: 'center' })

    let curY = 22

    const drawHeader = (y) => {
      doc.setFillColor(0, 122, 135)
      doc.rect(mx, y, tableW, hdrH, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
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
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      const cells = [String(idx + 1), r.bookingDate, r.customerName, r.vehicleCount, r.serviceJobNo, r.modelNo, r.vehicleSerialNo, r.assemblyItem]
      let x = mx
      cells.forEach((c, i) => { doc.text(String(c || '—'), x + 1.5, curY + 4.5, { maxWidth: colW[i] - 2 }); x += colW[i] })
      doc.setDrawColor(220, 220, 220)
      doc.line(mx, curY + rowH, mx + tableW, curY + rowH)
      curY += rowH
    })

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`Total Entries: ${filteredRows.length}`, mx, curY + 8)
    doc.save(`service_entry_report_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF report downloaded!')
  }

  // Print view
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-4 py-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3.5 uppercase font-bold tracking-wider">
          <span className="hover:text-[#0097A7] cursor-pointer">Service</span>
          <ChevronRight size={11} />
          <span className="text-[#0097A7]">Service Entry Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Teal Header Banner */}
          <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-sm"></span>
              <span className="font-bold text-[13px] uppercase tracking-wider">Service Entry Report</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1 h-[28px]"
              >
                <FileSpreadsheet size={12} className="text-green-300" /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1 h-[28px]"
              >
                <FileDown size={12} className="text-amber-300" /> PDF
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

            {/* ── Search & Filter Workflow Section ── */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="grid grid-cols-12 gap-4 items-center">

                {/* Company Selection Dropdown */}
                <div className="col-span-12 md:col-span-4">
                  <Label>1. Select Company / Customer :</Label>
                  <Select
                    options={companyOptions}
                    placeholder="-- All Companies / Customers --"
                    value={selectedCompany}
                    onChange={e => setSelectedCompany(e.target.value)}
                    className="mt-1 font-semibold text-[#0097A7]"
                  />
                </div>

                {/* Assembly Numbers filtered by Selected Company */}
                <div className="col-span-12 md:col-span-4">
                  <Label>2. Select Assembly Item :</Label>
                  <Select
                    options={assemblyOptions}
                    placeholder={selectedCompany ? `-- All Assemblies (${assemblyOptions.length}) --` : '-- Select Company First --'}
                    value={selectedAssembly}
                    onChange={e => setSelectedAssembly(e.target.value)}
                    className="mt-1 font-semibold"
                  />
                </div>

                {/* Date range filters */}
                <div className="col-span-12 md:col-span-2">
                  <Label>From Date :</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 w-full" />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <Label>To Date :</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 w-full" />
                </div>

              </div>

              {/* Reset filter bar */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Keyword Search..."
                      className="pl-8 pr-2 py-1 text-[12px] h-[30px] border border-slate-300 rounded w-64 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                    />
                    <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  </div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-[#0097A7] font-bold">
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#0097A7]">
                    Found: {filteredRows.length} Service Entries
                  </span>
                  {(selectedCompany || selectedAssembly || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCompany('')
                        setSelectedAssembly('')
                        setSearchQuery('')
                        setFromDate('2026-04-01')
                        setToDate(today)
                      }}
                      className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-bold uppercase text-[11px]"
                    >
                      <RotateCcw size={12} /> Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Main Details Table ── */}
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white mb-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="bg-slate-50 text-[12px] uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr className="h-9">
                      <th className="px-3 py-1 border-r border-slate-200 w-12 text-center"></th>
                      <th className="px-3 py-1 border-r border-slate-200 w-14 text-center">S.No</th>
                      <th className="px-3 py-1 border-r border-slate-200 w-28 text-center">Booking Date</th>
                      <th className="px-3 py-1 border-r border-slate-200 w-60">Customer Name</th>
                      <th className="px-3 py-1 border-r border-slate-200 w-32 text-center">Vehicle Count</th>
                      <th className="px-3 py-1 border-r border-slate-200 w-36 text-center">Service Job No</th>
                      <th className="px-3 py-1 border-r border-slate-200 w-24 text-center">Model No</th>
                      <th className="px-3 py-1 border-r border-slate-200 w-36">Vehicle Serial No</th>
                      <th className="px-3 py-1">Assembly Item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px] text-slate-700">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                          No service entries match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, idx) => {
                        const isExpanded = !!expandedRows[row.id]
                        const isSelected = selectedRowId === row.id
                        return (
                          <>
                            <tr
                              key={row.id}
                              onClick={() => setSelectedRowId(row.id)}
                              className={`hover:bg-[#0097A7]/5 cursor-pointer h-10 transition-colors ${isSelected ? 'bg-[#0097A7]/10 font-semibold' : ''}`}
                            >
                              <td className="px-3 py-1 border-r border-slate-100 text-center" onClick={(e) => { e.stopPropagation(); toggleRow(row.id) }}>
                                <button className="p-1 rounded bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-all flex items-center justify-center mx-auto">
                                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </button>
                              </td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center font-mono text-[11.5px] text-slate-600">{row.bookingDate || '—'}</td>
                              <td className="px-3 py-1 border-r border-slate-100 font-bold text-slate-800">{row.customerName}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-[#0097A7]">{row.vehicleCount}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-[#0097A7]">{row.serviceJobNo}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center font-semibold text-slate-700">{row.modelNo}</td>
                              <td className="px-3 py-1 border-r border-slate-100 font-mono text-[11.5px] text-slate-600">{row.vehicleSerialNo}</td>
                              <td className="px-3 py-1 font-bold text-slate-800">
                                <span className="bg-[#0097A7]/10 text-[#0097A7] px-2 py-0.5 rounded text-[12px] inline-block">
                                  {row.assemblyItem}
                                </span>
                              </td>
                            </tr>

                            {/* ── Child Part Breakdown Accordion View ── */}
                            {isExpanded && (
                              <tr key={`child-${row.id}`} className="bg-slate-50/80">
                                <td colSpan={9} className="px-6 py-3 border-b border-slate-200">
                                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 overflow-x-auto">
                                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                                      <Layers size={14} className="text-[#0097A7]" />
                                      <span className="text-[12px] font-bold text-[#0097A7] uppercase tracking-wider">
                                        Child Part Breakdown for Assembly: {row.assemblyItem}
                                      </span>
                                    </div>

                                    <table className="w-full text-left border-collapse text-[12px]">
                                      <thead className="bg-slate-100 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                                        <tr>
                                          <th className="px-3 py-1.5 border-r border-slate-200">Assembly Item</th>
                                          <th className="px-3 py-1.5 border-r border-slate-200 w-36">Child Part</th>
                                          <th className="px-3 py-1.5 border-r border-slate-200">Child Part Name</th>
                                          <th className="px-3 py-1.5 border-r border-slate-200 w-20 text-center">Qty</th>
                                          <th className="px-3 py-1.5 border-r border-slate-200 w-20 text-center">UOM</th>
                                          <th className="px-3 py-1.5 border-r border-slate-200 w-28 text-center">Created By</th>
                                          <th className="px-3 py-1.5 border-r border-slate-200 w-40 text-center">Created Date</th>
                                          <th className="px-3 py-1.5 w-32 text-center">System Name</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                                        {(!row.childParts || row.childParts.length === 0) ? (
                                          <tr>
                                            <td colSpan={8} className="px-3 py-4 text-center text-slate-400 italic">
                                              No child parts breakdown recorded.
                                            </td>
                                          </tr>
                                        ) : (
                                          row.childParts.map((cp, cIdx) => (
                                            <tr key={cIdx} className="hover:bg-slate-50 transition-colors">
                                              <td className="px-3 py-1.5 border-r border-slate-100 font-semibold text-slate-700">{row.assemblyItem}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-100 font-mono font-bold text-[#0097A7]">{cp.childPart}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-100 font-medium text-slate-800">{cp.childPartName}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-100 text-center font-bold text-slate-700">{cp.qty}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-600">{cp.uom || 'Nos'}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-600 font-medium">{cp.createdBy || 'Admin'}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-100 text-center font-mono text-[11px] text-slate-600">{cp.createdDate || '—'}</td>
                                              <td className="px-3 py-1.5 text-center text-slate-500 font-mono text-[11px]">{cp.systemName || 'VELSON-ERP'}</td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
              <span>Total Records: {filteredRows.length}</span>
              <span>Showing Company: {selectedCompany || 'All Companies'}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
