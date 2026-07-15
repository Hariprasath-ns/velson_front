import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  ChevronRight, X, Trash2, Printer, 
  FileBarChart, Loader2, AlertTriangle, FileSpreadsheet
} from 'lucide-react'
import { useToast } from '../components/Toast'
import { SpinnerLoader } from '../components/LocalLoader'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const generatePDF = async (quotation) => {
  const doc = new jsPDF()
  
  // Page setup
  const margin = 15
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  // Helper to load image
  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  const logoImg = await loadImage('/logo.png')

  // Add Logo if loaded successfully
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', margin, 12, 18, 18)
  }

  const headerTextX = logoImg ? margin + 22 : margin

  // Header Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(0, 151, 167) // Teal brand color
  doc.text("VELSON ENTERPRISES", headerTextX, 22)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text("SF NO 98/3A, Velson valley Nagichettypatti, Sankari, Tamil Nadu 637302", headerTextX, 28)
  doc.text("Contact: +91 84893 39933", headerTextX, 33)

  // Divider Line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, 38, pageWidth - margin, 38)

  // Meta Info
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)
  
  // Left side metadata
  doc.setFont("helvetica", "bold")
  doc.text("QUOTATION DETAILS", margin, 46)
  doc.setFont("helvetica", "normal")
  doc.text(`Quotation No: ${quotation.quotationNo}`, margin, 52)
  doc.text(`Quotation Date: ${quotation.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString('en-GB') : ''}`, margin, 57)
  doc.text(`Quotation Type: ${quotation.quotationType || 'N/A'}`, margin, 62)

  // Right side metadata
  doc.setFont("helvetica", "bold")
  doc.text("DELIVERY & TRANSPORT", pageWidth - margin - 75, 46)
  doc.setFont("helvetica", "normal")
  doc.text(`Delivery Place: ${quotation.deliveryPlace || 'N/A'}`, pageWidth - margin - 75, 52)
  doc.text(`Delivery To: ${quotation.deliveryTo || 'N/A'}`, pageWidth - margin - 75, 57)
  doc.text(`Contact Person: ${quotation.contactPerson || 'N/A'}`, pageWidth - margin - 75, 62)
  doc.text(`Contact Number: ${quotation.contactNo || 'N/A'}`, pageWidth - margin - 75, 67)

  // Divider
  doc.line(margin, 72, pageWidth - margin, 72)

  // Party info
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO (PARTY):", margin, 79)
  doc.setFont("helvetica", "normal")
  doc.text(quotation.customer?.customerName || quotation.customerName || quotation.partyName || 'N/A', margin, 85)
  
  const addressLines = doc.splitTextToSize(quotation.address || 'N/A', 100)
  doc.text(addressLines, margin, 90)

  // Table
  const tableHeaders = [
    ["S.No", "Description of Goods", "Part Number", "Qty", "UOM", "Rate (INR)", "Amount (INR)"]
  ]

  const tableRows = (quotation.details || []).map((row, idx) => [
    String(idx + 1),
    row.itemName || '',
    row.partNo || '',
    row.qty || '0',
    row.uom || 'PCS',
    Number(row.unitPrice || 0).toFixed(2),
    Number(row.amount || 0).toFixed(2)
  ])

  autoTable(doc, {
    startY: 110,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 151, 167],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 25 }
    },
    margin: { left: margin, right: margin }
  })

  let finalY = doc.lastAutoTable.finalY + 10
  if (finalY + 70 > pageHeight) {
    doc.addPage()
    finalY = 20
  }

  const summaryStartX = pageWidth - margin - 85
  doc.setDrawColor(220, 220, 220)
  doc.setFillColor(250, 250, 250)
  doc.rect(summaryStartX, finalY, 85, 52, 'F')

  doc.setFontSize(8.5)
  doc.setTextColor(70, 70, 70)

  const rowH = 5
  let currentY = finalY + 5

  const details = quotation.details || []
  const totalQty = details.reduce((sum, d) => sum + (d.qty || 0), 0)
  const grossAmt = details.reduce((sum, d) => sum + ((d.qty || 0) * (d.unitPrice || 0)), 0)
  const taxableAmt = quotation.subTotal || details.reduce((sum, d) => sum + (d.amount || 0), 0)
  const discAmt = grossAmt - taxableAmt
  const totalTax = quotation.taxAmount || 0
  const netAmt = quotation.totalAmount || 0

  const addRow = (label, val, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal")
    if (isBold) doc.setTextColor(0, 151, 167)
    else doc.setTextColor(70, 70, 70)
    doc.text(label, summaryStartX + 4, currentY)
    doc.text(`INR ${val}`, pageWidth - margin - 4, currentY, { align: 'right' })
    currentY += rowH
  }

  addRow("Gross Amount:", Number(grossAmt).toFixed(2))
  addRow("Discount:", Number(discAmt).toFixed(2))
  addRow("Taxable Amount:", Number(taxableAmt).toFixed(2))
  
  const isTamilNadu = (quotation.customer?.state || quotation.address || '').toLowerCase().includes('tamil nadu') || (quotation.customer?.stateCode === '33')
  if (isTamilNadu) {
    addRow("CGST:", Number(totalTax / 2).toFixed(2))
    addRow("SGST:", Number(totalTax / 2).toFixed(2))
  } else {
    addRow("IGST:", Number(totalTax).toFixed(2))
  }
  
  doc.setDrawColor(200, 200, 200)
  doc.line(summaryStartX + 2, currentY - 1, pageWidth - margin - 2, currentY - 1)
  currentY += 2

  addRow("Grand Total (Net):", Number(netAmt).toFixed(2), true)

  // Total Quantity & Remarks
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  doc.text(`Total Quantity: ${totalQty} PCS`, margin, finalY + 5)
  
  doc.setFont("helvetica", "normal")
  doc.text("Remarks:", margin, finalY + 12)
  doc.setFontSize(8)
  const remarksLines = doc.splitTextToSize(quotation.remarks || 'No remarks.', summaryStartX - margin - 10)
  doc.text(remarksLines, margin, finalY + 17)

  // Footer
  let footerY = pageHeight - 35
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text("Terms & Conditions:", margin, footerY + 5)
  doc.text("1. Quotation valid for 30 days.", margin, footerY + 9)
  doc.text("2. Interest @ 18% will be charged if payment is not made within due date.", margin, footerY + 13)

  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  doc.setFont("helvetica", "bold")
  doc.text("For VELSON ENTERPRISES", pageWidth - margin - 50, footerY + 5)
  doc.setFont("helvetica", "italic")
  doc.text("Authorised Signatory", pageWidth - margin - 45, footerY + 22)

  // Open PDF print dialog
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}

// ── Shared UI primitives ──
const Label = ({ children, className = "" }) => (
  <label className={`block text-[11px] font-bold text-slate-500 uppercase tracking-wider ${className}`}>
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
  <input
    type={type}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
  />
)

export default function QuotationSalesDetails() {
  const navigate = useNavigate()
  const toast = useToast()

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  
  const [selectedRow, setSelectedRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ── Fetch Quotations ── */
  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const res = await api.get('/api/quotation-sales', { loadingMessage: 'Fetching Quotations...' })
      let data = res.data?.data ?? []

      // Filter logic
      if (fromDate) {
        data = data.filter(r => r.quotationDate && r.quotationDate.slice(0, 10) >= fromDate)
      }
      if (toDate) {
        data = data.filter(r => r.quotationDate && r.quotationDate.slice(0, 10) <= toDate)
      }
      if (customerFilter.trim()) {
        const query = customerFilter.trim().toLowerCase()
        data = data.filter(r => 
          (r.customer?.customerName || '').toLowerCase().includes(query) ||
          (r.customerName || '').toLowerCase().includes(query) ||
          (r.partyName || '').toLowerCase().includes(query)
        )
      }
      setRows(data)
      setSelectedRow(null)
    } catch (err) {
      console.error('[QuotationDetails] fetch error:', err)
      setError('Failed to load quotations.')
    }
  }, [fromDate, toDate, customerFilter])

  useEffect(() => {
    fetchData()
  }, [])

  /* ── Delete Quotation ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.delete(`/api/quotation-sales/${deleteTarget.id}`, { loadingMessage: 'Deleting quotation...' })
      setRows(r => r.filter(x => x.id !== deleteTarget.id))
      toast.success(`Quotation ${deleteTarget.quotationNo} deleted.`)
      setDeleteTarget(null)
      setSelectedRow(null)
    } catch (err) {
      toast.error('Delete failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── Export Quotation data to Excel/CSV ── */
  const handleExcel = () => {
    const dataToExport = rows
    if (dataToExport.length === 0) {
      toast.error('No data available to export to Excel!')
      return
    }

    // Generate CSV content
    // Format Helper
    const formatDate = (dateStr) => {
      if (!dateStr) return '—'
      const d = new Date(dateStr)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`
    }

    const headers = [
      'Quotation A/C', 'Qu. No', 'Quot. Date', 'Party Name', 'Address', 
      'Contact Person', 'Contact No', 'Del. Place', 'Delivery To', 
      'Transport', 'Tax Type', 'Remarks'
    ]
    const csvRows = dataToExport.map(r => {
      const addrParts = [
        r.customer?.address,
        r.customer?.address2,
        r.customer?.city,
        r.customer?.state
      ].filter(Boolean)
      const formattedAddress = r.address || addrParts.join(', ') || '—'
      return [
        r.quotationType || '—',
        r.quotationNo || '',
        formatDate(r.quotationDate),
        r.customerName || r.partyName || r.customer?.customerName || '',
        formattedAddress,
        r.contactPerson || '—',
        r.contactNo ? `\t${r.contactNo}` : '—',
        r.deliveryPlace || '—',
        r.deliveryTo || '—',
        r.transport || '—',
        r.taxType || '—',
        r.remarks || ''
      ]
    })

    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Quotation_Filtered_List_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Excel/CSV export completed successfully!')
  }

  // Format Helper
  const fmt = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <style>{`
        @media print {
          aside, header, nav, button, .no-print, .flex-shrink-0, .mb-5, .border-b, .bg-slate-50\\/50 {
            display: none !important;
          }
          body, html, #root, .bg-[#f4f6f8] {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .bg-white {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .p-5 {
            padding: 0 !important;
          }
          .px-6, .py-6 {
            padding: 0 !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            min-width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            font-size: 8px !important;
            padding: 2px 4px !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Quotation Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[#0097A7] rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Quotation Details</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-md transition-all shadow-sm group"
              >
                <FileSpreadsheet size={14} className="group-hover:scale-110 transition-transform" /> Excel
              </button>
              <button 
                onClick={() => {
                  if (!selectedRow) {
                    toast.warning('Please select a quotation to print')
                    return
                  }
                  generatePDF(selectedRow)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-sky-50 text-sky-600 text-[11px] font-bold rounded-md transition-all shadow-sm group"
              >
                <Printer size={14} className="group-hover:scale-110 transition-transform" /> Print
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm"
              >
                <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" strokeWidth={3} />
                </div>
                Close
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-6 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Label className="mb-0">From Date :</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="mb-0">To Date :</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
              </div>

              <button 
                onClick={fetchData}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 group"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-pulse" />
                Search
              </button>
            </div>

            {/* Table */}
            <div className="flex-grow border border-slate-200 rounded-lg overflow-auto shadow-sm flex flex-col bg-white max-h-[500px]">
              <div className="w-full">
                <table className="w-full text-left border-collapse table-fixed bg-white min-w-[2400px]">
                  <thead className="bg-[#cbd5e1]/30 text-[9px] uppercase text-slate-600 font-bold border-b border-slate-300 sticky top-0 z-10">
                    <tr>
                      {[
                        { label: 'S.No', w: 'w-[45px]' },
                        { label: 'Quotation No', w: 'w-[110px]' },
                        { label: 'Quotation Date', w: 'w-[100px]' },
                        { label: 'Quotation A/C', w: 'w-[120px]' },
                        { label: 'Party Name', w: 'w-[160px]' },
                        { label: 'Address', w: 'w-[200px]' },
                        { label: 'Contact Person', w: 'w-[120px]' },
                        { label: 'Contact Number', w: 'w-[110px]' },
                        { label: 'Delivery Place', w: 'w-[120px]' },
                        { label: 'Delivery To', w: 'w-[180px]' },
                        { label: 'Remarks', w: 'w-[180px]' },
                        { label: 'Total Qty', w: 'w-[80px]' },
                        { label: 'Gross Amount', w: 'w-[110px]' },
                        { label: 'Discount Amount', w: 'w-[120px]' },
                        { label: 'Taxable Amount', w: 'w-[120px]' },
                        { label: 'SGST', w: 'w-[80px]' },
                        { label: 'CGST', w: 'w-[80px]' },
                        { label: 'IGST', w: 'w-[80px]' },
                        { label: 'Total Tax', w: 'w-[100px]' },
                        { label: 'Net Amount', w: 'w-[120px]' },
                        { label: 'Status', w: 'w-[90px]' },
                        { label: 'Actions', w: 'w-[80px]' }
                      ].map((h, i) => (
                        <th key={i} className={`px-2 py-2 border-r border-slate-300 leading-tight whitespace-normal break-words text-center ${h.w}`}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {error ? (
                      <tr>
                        <td colSpan={22} className="text-center py-16 text-red-400 text-[13px]">
                          {error}
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={22} className="text-center py-16 text-slate-400 text-[13px]">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, i) => {
                        const addrParts = [
                          row.customer?.address,
                          row.customer?.address2,
                          row.customer?.city,
                          row.customer?.state
                        ].filter(Boolean)
                        const formattedAddress = row.address || addrParts.join(', ') || '—'

                        const details = row.details || []
                        const totalQty = details.reduce((sum, d) => sum + (d.qty || 0), 0)
                        const grossAmt = details.reduce((sum, d) => sum + ((d.qty || 0) * (d.unitPrice || 0)), 0)
                        const taxableAmt = row.subTotal || details.reduce((sum, d) => sum + (d.amount || 0), 0)
                        const discAmt = grossAmt - taxableAmt
                        const totalTax = row.taxAmount || 0
                        const netAmt = row.totalAmount || 0

                        const isTamilNadu = (row.customer?.state || row.address || '').toLowerCase().includes('tamil nadu') || (row.customer?.stateCode === '33')
                        const cgst = isTamilNadu ? totalTax / 2 : 0
                        const sgst = isTamilNadu ? totalTax / 2 : 0
                        const igst = !isTamilNadu ? totalTax : 0

                        return (
                          <tr 
                            key={row.id} 
                            onClick={() => setSelectedRow(row)}
                            className={`h-9 hover:bg-sky-50 transition-colors cursor-pointer ${
                              selectedRow?.id === row.id ? 'bg-[#e0f2fe] font-bold text-sky-900 border-l-4 border-sky-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]' : i % 2 === 1 ? 'bg-slate-50/40' : ''
                            }`}
                          >
                            <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold text-slate-600">
                              {i + 1}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 font-bold text-[#0097A7] truncate">
                              {row.quotationNo}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate text-center">
                              {fmt(row.quotationDate)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate">
                              {row.quotationType || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 font-bold text-slate-700 truncate">
                              {row.customerName || row.customer?.customerName || row.partyName || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate" title={formattedAddress}>
                              {formattedAddress}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate">
                              {row.contactPerson || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate">
                              {row.contactNo || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate">
                              {row.deliveryPlace || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate" title={row.deliveryTo}>
                              {row.deliveryTo || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 truncate" title={row.remarks}>
                              {row.remarks || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-center font-semibold text-slate-600">
                              {totalQty}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right font-semibold text-slate-600">
                              {Number(grossAmt).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right font-semibold text-slate-600">
                              {Number(discAmt).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right font-semibold text-slate-600">
                              {Number(taxableAmt).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right text-slate-500">
                              {Number(sgst).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right text-slate-500">
                              {Number(cgst).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right text-slate-500">
                              {Number(igst).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right text-slate-600 font-semibold">
                              {Number(totalTax).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-right font-bold text-[#0097A7]">
                              {Number(netAmt).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Saved
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  generatePDF(row)
                                }}
                                className="p-1 hover:bg-[#0097A7]/10 rounded text-[#0097A7] transition-all hover:scale-110"
                                title="Print Quotation Invoice"
                              >
                                <Printer size={14} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                  Quotation Transaction Audit & Compliance Console
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Records: <span className="text-[#0097A7]">{rows.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-[360px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Delete Quotation</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Delete <span className="font-semibold text-slate-700">{deleteTarget.quotationNo}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors"
              >
                {deleteLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}