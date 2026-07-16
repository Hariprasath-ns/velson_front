import { useState, useEffect } from 'react'
import {
    ChevronRight, X, Search, FileSpreadsheet, Loader2, Printer
} from 'lucide-react'
import { useToast } from '../components/Toast'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../services/api'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch (e) {
    return dateStr
  }
}

const generatePDF = async (sale) => {
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
  doc.text("VELSON", headerTextX, 22)

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
  doc.text("INVOICE DETAILS", margin, 46)
  doc.setFont("helvetica", "normal")
  doc.text(`Invoice No: ${sale.billNo}`, margin, 52)
  doc.text(`Invoice Date: ${formatDate(sale.billDate)}`, margin, 57)
  doc.text(`DC No: ${sale.dcNo || 'N/A'}`, margin, 62)
  doc.text(`DC Date: ${formatDate(sale.dcDate) || 'N/A'}`, margin, 67)

  // Right side metadata
  doc.setFont("helvetica", "bold")
  doc.text("DELIVERY & TRANSPORT", pageWidth - margin - 75, 46)
  doc.setFont("helvetica", "normal")
  doc.text(`Delivery Place: ${sale.deliveryPlace || 'N/A'}`, pageWidth - margin - 75, 52)
  doc.text(`Delivery To: ${sale.deliveryTo || 'N/A'}`, pageWidth - margin - 75, 57)
  doc.text(`Transport: ${sale.transport || 'N/A'}`, pageWidth - margin - 75, 62)
  doc.text(`Stock Reduce: ${sale.stockReduce || 'No'}`, pageWidth - margin - 75, 67)

  // Divider
  doc.line(margin, 72, pageWidth - margin, 72)

  // Party info
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO (PARTY):", margin, 79)
  doc.setFont("helvetica", "normal")
  doc.text(sale.partyName || 'N/A', margin, 85)
  
  const addressLines = doc.splitTextToSize(sale.address || 'N/A', 100)
  doc.text(addressLines, margin, 90)

  // Table
  const tableHeaders = [
    ["S.No", "Description of Goods", "Part Number", "Qty", "UOM", "Rate (INR)", "Amount (INR)"]
  ]

  const tableRows = (sale.details || []).map((row, idx) => [
    String(idx + 1),
    row.partName || '',
    row.partNo || '',
    row.qty || '0',
    row.uom || 'PCS',
    Number(row.rate || 0).toFixed(2),
    Number(row.grossAmt || 0).toFixed(2)
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

  const addRow = (label, val, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal")
    if (isBold) doc.setTextColor(0, 151, 167)
    else doc.setTextColor(70, 70, 70)
    doc.text(label, summaryStartX + 4, currentY)
    doc.text(`INR ${val}`, pageWidth - margin - 4, currentY, { align: 'right' })
    currentY += rowH
  }

  const totals = sale.totals || sale

  addRow("Gross Amount:", Number(totals.grossAmt || 0).toFixed(2))
  addRow("Discount:", Number(totals.discAmt || 0).toFixed(2))
  addRow("Taxable Amount:", Number(totals.taxableAmt || 0).toFixed(2))
  
  if (sale.taxType === 'Local') {
    addRow("CGST:", Number(totals.cgst || 0).toFixed(2))
    addRow("SGST:", Number(totals.sgst || 0).toFixed(2))
  } else {
    addRow("IGST:", Number(totals.igst || 0).toFixed(2))
  }
  
  doc.setDrawColor(200, 200, 200)
  doc.line(summaryStartX + 2, currentY - 1, pageWidth - margin - 2, currentY - 1)
  currentY += 2

  addRow("Grand Total (Net):", Number(totals.netAmt || 0).toFixed(2), true)

  // Total Quantity & Remarks
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  doc.text(`Total Quantity: ${totals.totalQty || 0} PCS`, margin, finalY + 5)
  
  doc.setFont("helvetica", "normal")
  doc.text("Remarks:", margin, finalY + 12)
  doc.setFontSize(8)
  const remarksLines = doc.splitTextToSize(sale.remarks || 'No remarks.', summaryStartX - margin - 10)
  doc.text(remarksLines, margin, finalY + 17)

  // Footer
  let footerY = pageHeight - 35
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text("Terms & Conditions:", margin, footerY + 5)
  doc.text("1. Goods once sold will not be taken back.", margin, footerY + 9)
  doc.text("2. Interest @ 18% will be charged if payment is not made within due date.", margin, footerY + 13)

  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  doc.setFont("helvetica", "bold")
  doc.text("For VELSON", pageWidth - margin - 50, footerY + 5)
  doc.setFont("helvetica", "italic")
  doc.text("Authorised Signatory", pageWidth - margin - 45, footerY + 22)

  // Open PDF print dialog
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}

// ── Shared UI primitives ──
const Label = ({ children }) => (
    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
        {children}
    </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
    <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
    />
)

export default function SalesDetails() {
    const toast = useToast()
    const [salesList, setSalesList] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Filter states
    const [fromDate, setFromDate] = useState(() => {
        // Set to start of current month as a sensible default
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    })
    const [toDate, setToDate] = useState(() => {
        return new Date().toISOString().split('T')[0]
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRow, setSelectedRow] = useState(null)

    const handlePrint = async (row) => {
        const target = row || selectedRow
        if (!target) {
            toast.warning('Please select a sales invoice row to print')
            return
        }
        try {
            await generatePDF(target)
            toast.success(`Invoice ${target.billNo} PDF generated successfully`)
        } catch (err) {
            console.error(err)
            toast.error('Failed to generate PDF')
        }
    }

    // Fetch invoices on mount
    const fetchSales = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/api/credit-sales')
            if (res.data?.success) {
                setSalesList(res.data.data || [])
            }
        } catch (err) {
            console.error('Failed to load credit sales from backend', err)
            toast.error('Failed to load credit sales list')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSales()
    }, [])

    // Filter list dynamically based on dates and searchTerm
    const filteredList = salesList.filter(row => {
        const bd = row.billDate ? row.billDate.slice(0, 10) : ''
        if (fromDate && bd < fromDate) return false
        if (toDate && bd > toDate) return false

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            const billNo = String(row.billNo || '').toLowerCase()
            const partyName = String(row.partyName || '').toLowerCase()
            const dcNo = String(row.dcNo || '').toLowerCase()
            const remarks = String(row.remarks || '').toLowerCase()
            const transport = String(row.transport || '').toLowerCase()
            const salesAc = String(row.salesAc || '').toLowerCase()

            const match = billNo.includes(q) ||
                partyName.includes(q) ||
                dcNo.includes(q) ||
                remarks.includes(q) ||
                transport.includes(q) ||
                salesAc.includes(q)
            if (!match) return false
        }
        return true
    })

    // Summary calculations
    const totalQtyVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.totalQty) || 0), 0)
    const grossAmtVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.grossAmt) || 0), 0)
    const discAmtVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.discAmt) || 0), 0)
    const taxableAmtVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.taxableAmt) || 0), 0)
    const sgstVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.sgst) || 0), 0)
    const cgstVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.cgst) || 0), 0)
    const igstVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.igst) || 0), 0)
    const tcsAmtVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.tcs) || 0), 0)
    const totalTaxVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.totalTax) || 0), 0)
    const netAmtVal = filteredList.reduce((sum, row) => sum + (Number(row.totals?.netAmt) || 0), 0)

    // Export to Excel / CSV with UTF-8 BOM
    const downloadExcel = () => {
        if (filteredList.length === 0) {
            toast.warning('No records found to download')
            return
        }

        const headers = [
            'Bill Date', 'Bill No', 'Sales A/C', 'Mode', 'Tax Type',
            'DC No', 'DC Date', 'Party Name', 'Address', 'Delivery Place',
            'Delivery To', 'Stock Reduce', 'Transport', 'Remarks',
            'Gross Amount', 'Discount Amount', 'Taxable Amount',
            'SGST', 'CGST', 'IGST', 'Net Amount'
        ]

        const rows = filteredList.map(row => [
            formatDate(row.billDate),
            row.billNo || '',
            row.salesAc || '',
            row.mode || '',
            row.taxType || '',
            row.dcNo || '',
            formatDate(row.dcDate),
            row.partyName || '',
            row.address || '',
            row.deliveryPlace || '',
            row.deliveryTo || '',
            row.stockReduce || '',
            row.transport || '',
            row.remarks || '',
            (row.totals?.grossAmt || 0).toFixed(2),
            (row.totals?.discAmt || 0).toFixed(2),
            (row.totals?.taxableAmt || 0).toFixed(2),
            (row.totals?.sgst || 0).toFixed(2),
            (row.totals?.cgst || 0).toFixed(2),
            (row.totals?.igst || 0).toFixed(2),
            (row.totals?.netAmt || 0).toFixed(2)
        ])

        let csvContent = '\uFEFF' // UTF-8 BOM
        csvContent += headers.join(',') + '\n'
        rows.forEach(row => {
            const escapedRow = row.map(val => {
                const str = String(val).replace(/"/g, '""')
                return `"${str}"`
            })
            csvContent += escapedRow.join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Sales_Details_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Sales Ledger Excel exported successfully')
    }

    return (
        <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-[#f4f6f8] text-slate-800">
            {/* 1. Top Header Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2 text-[12px] text-slate-400 uppercase font-bold tracking-tight">
                    <span>Sales</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Sales Details</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[11px] font-bold rounded-lg transition-all shadow-sm group"
                    >
                        <FileSpreadsheet size={13} className="text-emerald-600 group-hover:scale-110 transition-transform" /> Download Excel
                    </button>
                    <button
                        onClick={() => handlePrint()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-[11px] font-bold rounded-lg transition-all shadow-sm group"
                    >
                        <Printer size={13} className="text-sky-600 group-hover:scale-110 transition-transform" /> Print
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg transition-all shadow-sm"
                    >
                        <div className="w-3.5 h-3.5 bg-slate-400 rounded-full flex items-center justify-center">
                            <X size={8} className="text-white" strokeWidth={3} />
                        </div>
                        Close
                    </button>
                </div>
            </div>

            {/* 2. Main Content Container */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">

                {/* 2.1 Single-Row Filter Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4 shrink-0 flex items-end gap-6">
                    <div className="flex items-center gap-3">
                        <Label>From Date</Label>
                        <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Label>To Date</Label>
                        <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                        <Label>Search</Label>
                        <Input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search by Bill No, Party Name, DC No, Sales A/C..."
                            className="w-full"
                        />
                    </div>
                    <button className="h-[36px] px-6 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-2">
                        <Search size={14} /> Search
                    </button>
                </div>

                {/* 2.2 Table Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-700 rounded-sm" />
                            <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Sales Invoices Ledger</h2>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold">
                            Showing {filteredList.length} of {salesList.length} records
                        </span>
                    </div>

                    {/* Scrollable Table Wrapper */}
                    <div className="flex-1 overflow-auto relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-[#0097A7] animate-spin mb-3" />
                                <span className="text-[#0097A7] font-semibold text-sm tracking-wide">Loading records...</span>
                            </div>
                        )}
                        <table className="w-full text-left border-collapse table-fixed min-w-[3200px]">
                            <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase text-slate-600 font-extrabold border-b border-slate-200 z-10">
                                <tr>
                                    {[
                                        { label: 'Bill Date', w: 'w-[3%]' },
                                        { label: 'Bill No', w: 'w-[3%]' },
                                        { label: 'Sales A/C', w: 'w-[4%]' },
                                        { label: 'Mode', w: 'w-[3%]' },
                                        { label: 'Tax Type', w: 'w-[3%]' },
                                        { label: 'DC No', w: 'w-[4%]' },
                                        { label: 'DC Date', w: 'w-[3%]' },
                                        { label: 'Party Name', w: 'w-[7%]' },
                                        { label: 'Address', w: 'w-[7%]' },
                                        { label: 'Delivery Place', w: 'w-[5%]' },
                                        { label: 'Delivery To', w: 'w-[5%]' },
                                        { label: 'Stock Reduce', w: 'w-[3%]' },
                                        { label: 'Transport', w: 'w-[5%]' },
                                        { label: 'Remarks', w: 'w-[6%]' },
                                        { label: 'Total Qty', w: 'w-[3%]' },
                                        { label: 'Gross Amount', w: 'w-[5%]' },
                                        { label: 'Discount Amount', w: 'w-[5%]' },
                                        { label: 'Taxable Amount', w: 'w-[5%]' },
                                        { label: 'SGST', w: 'w-[4%]' },
                                        { label: 'CGST', w: 'w-[4%]' },
                                        { label: 'IGST', w: 'w-[4%]' },
                                        { label: 'Total Tax', w: 'w-[4%]' },
                                        { label: 'Net Amount', w: 'w-[5%]' },
                                        { label: 'Print', w: 'w-[2%]' }
                                    ].map((h, i) => (
                                        <th
                                            key={i}
                                            className={`px-3 py-3 border-r border-slate-200 whitespace-normal break-words leading-tight bg-slate-100/80 ${h.w}`}
                                        >
                                            {h.label}
                                        </th>
                                    ))}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 text-[11px] bg-white">
                                 {filteredList.length === 0 ? (
                                     <tr>
                                         <td colSpan={24} className="text-center py-12 text-slate-400 font-medium italic">
                                             No sales invoice records found matching your filters.
                                         </td>
                                     </tr>
                                 ) : (
                                     filteredList.map((row, idx) => (
                                         <tr
                                             key={row.id || idx}
                                             onClick={() => setSelectedRow(row)}
                                             className={`hover:bg-[#f0f9fa]/20 transition-colors cursor-pointer ${
                                                 (selectedRow?.id === row.id || selectedRow?.billNo === row.billNo)
                                                     ? 'bg-blue-50 hover:bg-blue-100 font-semibold text-slate-900'
                                                     : ''
                                             }`}
                                         >
                                             <td className="px-3 py-2.5 border-r border-slate-100 text-slate-500">{formatDate(row.billDate) || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-bold text-[#0097A7]">{row.billNo || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 truncate">{row.salesAc || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-semibold">{row.mode || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100">{row.taxType || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100">{row.dcNo || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100">{formatDate(row.dcDate) || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-bold text-slate-700 truncate">{row.partyName || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 truncate">{row.address || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 truncate">{row.deliveryPlace || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 truncate">{row.deliveryTo || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 text-center">{row.stockReduce || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 truncate">{row.transport || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 truncate">{row.remarks || '—'}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-semibold tabular-nums text-right">{(row.totals?.totalQty || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 tabular-nums text-right">₹{(row.totals?.grossAmt || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 tabular-nums text-right">₹{(row.totals?.discAmt || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-semibold tabular-nums text-right">₹{(row.totals?.taxableAmt || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 tabular-nums text-right">₹{(row.totals?.sgst || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 tabular-nums text-right">₹{(row.totals?.cgst || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 tabular-nums text-right">₹{(row.totals?.igst || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-semibold tabular-nums text-right">₹{(row.totals?.totalTax || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 font-black text-emerald-600 tabular-nums text-right">₹{(row.totals?.netAmt || 0).toFixed(2)}</td>
                                             <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                 <button
                                                     onClick={(e) => {
                                                         e.stopPropagation()
                                                         setSelectedRow(row)
                                                         handlePrint(row)
                                                     }}
                                                     title="Print PDF Invoice"
                                                     className="p-1 hover:bg-[#0097A7]/20 rounded text-[#0097A7] hover:text-[#007f8c] transition-all hover:scale-110 active:scale-95 inline-flex items-center justify-center"
                                                 >
                                                     <Printer size={13} />
                                                 </button>
                                             </td>
                                         </tr>
                                     ))
                                 )}
                             </tbody>
                        </table>
                    </div>
                </div>

            </div>

        </div>
    )
}