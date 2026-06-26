import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ChevronRight, X, Save, Edit2
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useLoading } from '../context/LoadingContext'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  doc.text(`Invoice Date: ${sale.billDate ? new Date(sale.billDate).toLocaleDateString('en-GB') : ''}`, margin, 57)
  doc.text(`DC No: ${sale.dcNo || 'N/A'}`, margin, 62)
  doc.text(`DC Date: ${sale.dcDate ? new Date(sale.dcDate).toLocaleDateString('en-GB') : 'N/A'}`, margin, 67)

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


// ── Shared UI primitives (Matching BOM Creation Interface) ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Combobox = ({ options, placeholder, value, onChange, readOnly = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const containerRef = useRef(null)

  useEffect(() => {
    setSearch(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const s = search.toLowerCase()
    return options.filter(o => o.label && o.label.toLowerCase().includes(s))
  }, [options, search])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        readOnly={readOnly}
        onChange={e => {
          setSearch(e.target.value)
          setIsOpen(true)
          if (onChange) onChange(e.target.value)
        }}
        onFocus={() => {
          if (!readOnly) setIsOpen(true)
        }}
        className={`w-full h-10 px-3 py-2 pr-8 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'hover:border-slate-300'}`}
      />
      {!readOnly && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-[#0097A7] focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {isOpen && !readOnly && (
        <div className="absolute z-[100] min-w-[120%] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 text-[12px] italic">No results found</div>
          ) : (
            filteredOptions.map(o => (
              <div
                key={o.value}
                onClick={() => {
                  onChange(o.value)
                  setSearch(o.label)
                  setIsOpen(false)
                }}
                className="px-3 py-2 text-[12px] text-slate-700 hover:bg-[#0097A7]/10 hover:text-[#0097A7] cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const Input = ({ type = 'text', value, onChange, placeholder, className = "", readOnly = false }) => (
  <input
    type={type}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`w-full h-[36px] px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ value, onChange, options = [], className = "", placeholder = "-- Select --", children }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full h-[36px] px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children ? children : options.map((opt, i) => {
        const val = typeof opt === 'object' ? opt.value : opt
        const label = typeof opt === 'object' ? opt.label : opt
        return <option key={i} value={val}>{label}</option>
      })}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const Textarea = ({ value, onChange, placeholder, className = "", rows = 2 }) => (
  <textarea
    rows={rows}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm resize-none ${className}`}
  />
)

export default function CreditSales() {
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0])
  const [salesAc, setSalesAc] = useState('Sales A/C')
  const [mode, setMode] = useState('CREDIT')
  const [billNo, setBillNo] = useState('001')
  const [taxType, setTaxType] = useState('Local')

  // DC Fetching Logic
  const [dcList, setDcList] = useState([])
  const [selectedDc, setSelectedDc] = useState('')
  const [dcDate, setDcDate] = useState('')
  const [partyName, setPartyName] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryPlace, setDeliveryPlace] = useState('')
  const [deliveryTo, setDeliveryTo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [rowToDelete, setRowToDelete] = useState('')
  const [stockReduce, setStockReduce] = useState('No')
  const [transport, setTransport] = useState('')

  // Item Grid & List State
  const [gridRows, setGridRows] = useState([])
  const [dcItemsList, setDcItemsList] = useState([])
  const [tcsAmt, setTcsAmt] = useState('0.00')

  const [manualGrossAmt, setManualGrossAmt] = useState('0.00')
  const [manualDiscAmt, setManualDiscAmt] = useState('0.00')
  const [manualCgst, setManualCgst] = useState('0.00')
  const [manualSgst, setManualSgst] = useState('0.00')
  const [manualIgst, setManualIgst] = useState('0.00')

  const handleGrossAmtChange = (e) => {
    const val = e.target.value
    if (/^\d*\.?\d*$/.test(val)) {
      setManualGrossAmt(val)
    }
  }

  const handleGrossAmtBlur = () => {
    const parsed = parseFloat(manualGrossAmt)
    setManualGrossAmt(isNaN(parsed) ? '0.00' : parsed.toFixed(2))
  }

  const handleDiscAmtChange = (e) => {
    const val = e.target.value
    if (/^\d*\.?\d*$/.test(val)) {
      setManualDiscAmt(val)
    }
  }

  const handleDiscAmtBlur = () => {
    const parsed = parseFloat(manualDiscAmt)
    setManualDiscAmt(isNaN(parsed) ? '0.00' : parsed.toFixed(2))
  }

  const handleNumericChange = (setter) => (e) => {
    const val = e.target.value
    if (/^\d*\.?\d*$/.test(val)) {
      setter(val)
    }
  }

  const handleNumericBlur = (setter, val) => () => {
    const parsed = parseFloat(val)
    setter(isNaN(parsed) ? '0.00' : parsed.toFixed(2))
  }

  const [salesList, setSalesList] = useState([])
  const [editingId, setEditingId] = useState(null)

  const toast = useToast()
  const { show: showLoader, hide: hideLoader } = useLoading()

  const generateNextBillNo = (list) => {
    if (!list || list.length === 0) return '001'
    const lastBill = list[list.length - 1].billNo
    const seq = parseInt(lastBill, 10)
    if (isNaN(seq)) {
      return String(list.length + 1).padStart(3, '0')
    }
    return String(seq + 1).padStart(3, '0')
  }

  const fetchSales = async () => {
    try {
      const res = await api.get('/api/credit-sales')
      if (res.data?.success) {
        setSalesList(res.data.data || [])
        return res.data.data || []
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load credit sales list")
    }
    setSalesList([])
    return []
  }

  const fetchNextBillNo = async () => {
    try {
      const res = await api.get('/api/credit-sales/next-number', { skipGlobalLoader: true })
      if (res.data?.success && res.data.billNo) {
        setBillNo(res.data.billNo)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const [customers, setCustomers] = useState([])
  const [itemMasterList, setItemMasterList] = useState([])

  useEffect(() => {
    const initialize = async () => {
      const list = await fetchSales()
      await fetchNextBillNo()

      // Check if there is a pending edit request
      const pendingEditId = localStorage.getItem('velson_edit_sales_id')
      if (pendingEditId) {
        const match = list.find(s => String(s.id) === String(pendingEditId))
        if (match) {
          setEditingId(match.id)
          setSalesAc(match.salesAc || 'Sales A/C')
          setMode(match.mode || 'CREDIT')
          setBillNo(match.billNo || '001')
          setBillDate(match.billDate || '')
          setSelectedDc(match.dcNo || '')
          setDcDate(match.dcDate || '')
          setPartyName(match.partyName || '')
          setAddress(match.address || '')
          setTaxType(match.taxType || 'Local')
          setDeliveryPlace(match.deliveryPlace || '')
          setDeliveryTo(match.deliveryTo || '')
          setRemarks(match.remarks || '')
          setStockReduce(match.stockReduce || 'No')
          setTransport(match.transport || '')
          setTcsAmt(match.totals?.tcs != null ? String(match.totals.tcs) : '0.00')
          setManualGrossAmt(match.totals?.grossAmt != null ? String(match.totals.grossAmt) : '0.00')
          setManualDiscAmt(match.totals?.discAmt != null ? String(match.totals.discAmt) : '0.00')
          setManualCgst(match.totals?.cgst != null ? String(match.totals.cgst) : '0.00')
          setManualSgst(match.totals?.sgst != null ? String(match.totals.sgst) : '0.00')
          setManualIgst(match.totals?.igst != null ? String(match.totals.igst) : '0.00')
          setGridRows(match.details || [])
        }
        localStorage.removeItem('velson_edit_sales_id')
      }
    }

    const fetchCustomers = async () => {
      try {
        const res = await api.get('/api/customer-master')
        if (res.data?.success) {
          setCustomers(res.data.data || [])
        }
      } catch (err) {
        console.error("Failed to load customer list:", err)
      }
    }

    const fetchDCs = async () => {
      try {
        const res = await api.get('/api/delivery-challan')
        if (res.data?.success) {
          setDcList(res.data.data || [])
        }
      } catch (err) {
        toast.error("Failed to load DC records from server")
      }
    }

    const fetchItems = async () => {
      try {
        const res = await api.get('/api/item-master?limit=10000')
        setItemMasterList(res.data?.data || [])
      } catch (err) {
        console.error(err)
      }
    }

    initialize()
    fetchCustomers()
    fetchDCs()
    fetchItems()
  }, [])

  // Recalculate row amounts
  const calculateRow = (row, currentTaxType = taxType) => {
    const qty = Number(row.qty) || 0
    const rate = Number(row.rate) || 0
    const grossAmt = qty * rate

    const discAmt = Number(row.discAmt) || 0
    const taxable = Math.max(0, grossAmt - discAmt)
    const taxPercent = Number(row.taxPercent) || 0

    let cgstPercent = 0
    let sgstPercent = 0
    let igstPercent = 0

    if (currentTaxType === 'Local') {
      cgstPercent = taxPercent / 2
      sgstPercent = taxPercent / 2
    } else {
      igstPercent = taxPercent
    }

    const cgstAmt = (taxable * cgstPercent) / 100
    const sgstAmt = (taxable * sgstPercent) / 100
    const igstAmt = (taxable * igstPercent) / 100
    const netAmt = taxable + cgstAmt + sgstAmt + igstAmt

    return {
      ...row,
      grossAmt: grossAmt.toFixed(2),
      discAmt: discAmt.toFixed(2),
      taxable: taxable.toFixed(2),
      cgstPercent,
      sgstPercent,
      igstPercent,
      cgstAmt: cgstAmt.toFixed(2),
      sgstAmt: sgstAmt.toFixed(2),
      igstAmt: igstAmt.toFixed(2),
      netAmt: netAmt.toFixed(2),
      netRate: qty > 0 ? (netAmt / qty).toFixed(2) : '0.00'
    }
  }

  const handleAddRow = () => {
    setGridRows([...gridRows, {
      id: Date.now(),
      barcode: '',
      partNo: '',
      partName: '',
      specification: '',
      brand: '',
      uom: '',
      qty: '',
      rate: '',
      discAmt: '',
      taxPercent: '18',
      isManual: true
    }])
  }

  const handleGridChange = (id, field, val) => {
    const updatedRows = gridRows.map(row => {
      if (row.id === id) {
        let newRow = { ...row, [field]: val }
        
        // Auto-fetch logic
        if ((field === 'partNo' || field === 'partName') && newRow.isManual) {
          const searchVal = String(val || '').toLowerCase().trim()
          const match = itemMasterList.find(i => 
            (field === 'partNo' && String(i.partNo || '').toLowerCase().trim() === searchVal) || 
            (field === 'partName' && String(i.partName || i.itemName || '').toLowerCase().trim() === searchVal)
          )
          if (match) {
            newRow.partNo = match.partNo || newRow.partNo
            newRow.partName = match.partName || match.itemName || newRow.partName
            newRow.barcode = match.barcode || newRow.barcode
            newRow.specification = match.description || match.specification || match.spec || newRow.specification
            newRow.brand = match.brand || newRow.brand
            newRow.uom = match.uom || newRow.uom
            newRow.taxPercent = match.taxPercent || match.taxRate || newRow.taxPercent
            newRow.rate = match.salesRate || match.rate || match.purchaseRate || newRow.rate
          }
        }
        
        // Manual Reverse Calculation
        if (field === 'grossAmt') {
           const gAmt = Number(val) || 0
           const qty = Number(newRow.qty) || 0
           newRow.rate = qty > 0 ? String((gAmt / qty).toFixed(2)) : '0'
        }
        
        return calculateRow(newRow, taxType)
      }
      return row
    })
    setGridRows(updatedRows)
    recalculateSummaries(updatedRows)
  }

  // Handle Tax Type change to update CGST/SGST/IGST of all items
  const handleTaxTypeChange = (e) => {
    const newTaxType = e.target.value
    setTaxType(newTaxType)
    const updatedRows = gridRows.map(row => calculateRow(row, newTaxType))
    setGridRows(updatedRows)

    const computedCgst = updatedRows.reduce((sum, r) => sum + (Number(r.cgstAmt) || 0), 0)
    const computedSgst = updatedRows.reduce((sum, r) => sum + (Number(r.sgstAmt) || 0), 0)
    const computedIgst = updatedRows.reduce((sum, r) => sum + (Number(r.igstAmt) || 0), 0)

    setManualCgst(computedCgst.toFixed(2))
    setManualSgst(computedSgst.toFixed(2))
    setManualIgst(computedIgst.toFixed(2))
  }


  const handleDcChange = (val) => {
    setSelectedDc(val)

    if (!val) {
      setDcDate('')
      setPartyName('')
      setAddress('')
      setDeliveryPlace('')
      setDeliveryTo('')
      setTransport('')
      setRemarks('')
      setGridRows([])
      setDcItemsList([])
      setManualGrossAmt('0.00')
      setManualDiscAmt('0.00')
      setManualCgst('0.00')
      setManualSgst('0.00')
      setManualIgst('0.00')
      return
    }

    const match = dcList.find(d => d.dcNo === val)
    if (match) {
      setDcDate(match.date ? new Date(match.date).toISOString().split('T')[0] : '')

      const customerMatch = customers.find(c => c.id === match.customerId)
      setPartyName(customerMatch ? customerMatch.customerName : (match.partyName || ''))
      setAddress(match.address || '')
      setDeliveryPlace(match.deliveryPlace || '')
      setDeliveryTo(match.deliveryTo || '')
      setTransport(match.transport || '')
      setRemarks(match.remarks || '')

      const sourceItems = match.items || match.details || []
      setDcItemsList(sourceItems)

      // Preserve old gridRows logic temporarily to avoid breaking existing dependencies
      if (sourceItems && sourceItems.length > 0) {
        const loadedRows = sourceItems.map((d, i) => {
          const qty = Number(d.qty) || 0
          const rate = Number(d.rate) || 0
          const totalAmt = qty * rate
          const taxPercent = 18 

          const rowData = {
            id: d.id || Date.now() + i,
            itemName: d.partName || d.itemName || '',
            barcode: d.barcode || '',
            partNo: d.partNo || '',
            partName: d.partName || d.itemName || '',
            specification: d.spec || d.specification || '',
            brand: d.brand || '',
            uom: d.uom || '',
            qty: String(qty),
            rate: String(rate),
            discAmt: '0',
            taxPercent: String(taxPercent),
            isManual: false
          }
          return calculateRow(rowData, taxType)
        })
        setGridRows(loadedRows)

        const computedGross = loadedRows.reduce((sum, r) => sum + (Number(r.grossAmt) || 0), 0)
        const computedDisc = loadedRows.reduce((sum, r) => sum + (Number(r.discAmt) || 0), 0)
        const computedCgst = loadedRows.reduce((sum, r) => sum + (Number(r.cgstAmt) || 0), 0)
        const computedSgst = loadedRows.reduce((sum, r) => sum + (Number(r.sgstAmt) || 0), 0)
        const computedIgst = loadedRows.reduce((sum, r) => sum + (Number(r.igstAmt) || 0), 0)

        setManualGrossAmt(computedGross.toFixed(2))
        setManualDiscAmt(computedDisc.toFixed(2))
        setManualCgst(computedCgst.toFixed(2))
        setManualSgst(computedSgst.toFixed(2))
        setManualIgst(computedIgst.toFixed(2))
      } else {
        setGridRows([])
        setManualGrossAmt('0.00')
        setManualDiscAmt('0.00')
        setManualCgst('0.00')
        setManualSgst('0.00')
        setManualIgst('0.00')
      }
    }
  }

  const handleRemoveItem = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDcItemsList(prev => prev.filter(item => item.id !== id))
  }

  const handleRateChange = (id, newRate) => {
    const updatedRows = gridRows.map(row => {
      if (row.id === id) {
        return calculateRow({ ...row, rate: newRate }, taxType)
      }
      return row
    })
    setGridRows(updatedRows)
    recalculateSummaries(updatedRows)
  }

  const handleDeleteRow = (id) => {
    const updatedRows = gridRows.filter(row => row.id !== id)
    setGridRows(updatedRows)
    recalculateSummaries(updatedRows)
    toast.info('Item row removed from current Sales Entry')
  }

  const handleDeleteSelected = () => {
    if (!rowToDelete) {
      toast.warning('Please select an item to delete')
      return
    }
    
    // Completely remove the item from the fetched list
    setDcItemsList(prev => prev.filter(item => String(item.id) !== String(rowToDelete)))
    // Also remove from gridRows if it exists there
    const updatedRows = gridRows.filter(row => String(row.id) !== String(rowToDelete))
    setGridRows(updatedRows)
    recalculateSummaries(updatedRows)
    
    setRowToDelete('')
    toast.info('Item completely removed from DC list')
  }

  const recalculateSummaries = (rows) => {
    const computedGross = rows.reduce((sum, r) => sum + (Number(r.grossAmt) || 0), 0)
    const computedDisc = rows.reduce((sum, r) => sum + (Number(r.discAmt) || 0), 0)
    const computedCgst = rows.reduce((sum, r) => sum + (Number(r.cgstAmt) || 0), 0)
    const computedSgst = rows.reduce((sum, r) => sum + (Number(r.sgstAmt) || 0), 0)
    const computedIgst = rows.reduce((sum, r) => sum + (Number(r.igstAmt) || 0), 0)

    setManualGrossAmt(computedGross.toFixed(2))
    setManualDiscAmt(computedDisc.toFixed(2))
    setManualCgst(computedCgst.toFixed(2))
    setManualSgst(computedSgst.toFixed(2))
    setManualIgst(computedIgst.toFixed(2))
  }

  // Summary Calculations
  const totalQty = gridRows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
  const grossAmtVal = parseFloat(manualGrossAmt) || 0
  const discAmtVal = parseFloat(manualDiscAmt) || 0
  const sgstVal = parseFloat(manualSgst) || 0
  const cgstVal = parseFloat(manualCgst) || 0
  const igstVal = parseFloat(manualIgst) || 0

  const taxableAmtVal = Math.max(0, grossAmtVal - discAmtVal)
  const netAmtVal = taxableAmtVal + sgstVal + cgstVal + igstVal

  const handleSave = async () => {
    if (!partyName) {
      toast.warning('Party Name is required')
      return
    }
    if (gridRows.length === 0) {
      toast.warning('Please select a DC with items to save')
      return
    }

    showLoader(editingId ? 'Updating Credit Sales...' : 'Saving Credit Sales...')
    try {
      const payload = {
        salesAc,
        mode,
        billNo,
        billDate,
        dcNo: selectedDc,
        dcDate,
        partyName,
        address,
        taxType,
        deliveryPlace,
        deliveryTo,
        remarks,
        stockReduce,
        transport,
        details: gridRows.map((r, i) => ({
          slNo: i + 1,
          barcode: r.barcode || null,
          partNo: r.partNo,
          partName: r.partName,
          specification: r.specification || null,
          brand: r.brand || null,
          uom: r.uom || 'PCS',
          qty: parseFloat(r.qty) || 0,
          rate: parseFloat(r.rate) || 0,
          grossAmt: parseFloat(r.grossAmt) || 0,
          discAmt: parseFloat(r.discAmt) || 0,
          taxable: parseFloat(r.taxable) || 0,
          taxPercent: parseFloat(r.taxPercent) || 18,
          netRate: parseFloat(r.netRate) || 0,
          netAmt: parseFloat(r.netAmt) || 0,
          isManual: !!r.isManual
        })),
        totals: {
          totalQty,
          grossAmt: grossAmtVal,
          discAmt: discAmtVal,
          taxableAmt: taxableAmtVal,
          cgst: cgstVal,
          sgst: sgstVal,
          igst: igstVal,
          totalTax: cgstVal + sgstVal + igstVal,
          netAmt: netAmtVal
        }
      }

      let savedRecord
      if (editingId) {
        const res = await api.put(`/api/credit-sales/${editingId}`, payload)
        savedRecord = res.data.data
        toast.success('Credit Sale updated successfully')
      } else {
        const res = await api.post('/api/credit-sales', payload)
        savedRecord = res.data.data
        toast.success('Credit Sale saved successfully')
      }

      const updatedList = await fetchSales()
      await fetchNextBillNo()

      // Auto-generate and download invoice PDF
      try {
        await generatePDF(savedRecord)
      } catch (pdfErr) {
        console.error("PDF Generation Error:", pdfErr)
        toast.error("Invoice saved successfully, but PDF generation failed.")
      }

      handleCancel(updatedList)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to save credit sale')
    } finally {
      hideLoader()
    }
  }

  const handleCancel = (currentList = salesList) => {
    setEditingId(null)
    setSalesAc('Sales A/C')
    setMode('CREDIT')
    fetchNextBillNo()
    setBillDate(new Date().toISOString().split('T')[0])
    setSelectedDc('')
    setDcDate('')
    setPartyName('')
    setAddress('')
    setTaxType('Local')
    setDeliveryPlace('')
    setDeliveryTo('')
    setRemarks('')
    setStockReduce('No')
    setTransport('')
    setTcsAmt('0.00')
    setGridRows([])
    setManualGrossAmt('0.00')
    setManualDiscAmt('0.00')
    setManualCgst('0.00')
    setManualSgst('0.00')
    setManualIgst('0.00')
  }

  const handleRowClick = (row) => {
    setEditingId(row.id)
    setSalesAc(row.salesAc || 'Sales A/C')
    setMode(row.mode || 'CREDIT')
    setBillNo(row.billNo || '001')
    setBillDate(row.billDate || '')
    setSelectedDc(row.dcNo || '')
    setDcDate(row.dcDate || '')
    setPartyName(row.partyName || '')
    setAddress(row.address || '')
    setTaxType(row.taxType || 'Local')
    setDeliveryPlace(row.deliveryPlace || '')
    setDeliveryTo(row.deliveryTo || '')
    setRemarks(row.remarks || '')
    setStockReduce(row.stockReduce || 'No')
    setTransport(row.transport || '')
    setTcsAmt(row.totals?.tcs != null ? String(row.totals.tcs) : '0.00')
    setManualGrossAmt(row.totals?.grossAmt != null ? String(row.totals.grossAmt) : '0.00')
    setManualDiscAmt(row.totals?.discAmt != null ? String(row.totals.discAmt) : '0.00')
    setManualCgst(row.totals?.cgst != null ? String(row.totals.cgst) : '0.00')
    setManualSgst(row.totals?.sgst != null ? String(row.totals.sgst) : '0.00')
    setManualIgst(row.totals?.igst != null ? String(row.totals.igst) : '0.00')
    setGridRows(row.details || [])
    toast.info(`Loaded Bill No: ${row.billNo} for editing`)
  }

  return (
    <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-[#f4f6f8] text-slate-800">

      {/* 1. Static Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 uppercase font-bold tracking-tight">
          <span>Sales</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Credit Sales</span>
        </div>
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

      {/* 2. Scrollable Middle Content Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col relative z-20">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Credit Sales </h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Column 1 – Invoice Information */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Bill No</Label>
                    <Input value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="Auto" className='font-bold text-[#007F8C]' />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Bill Date</Label>
                    <Input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} readOnly />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Sales A/C</Label>
                    <Select options={['Sales A/C', 'Export Sales']} value={salesAc} onChange={e => setSalesAc(e.target.value)} placeholder={null} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Mode</Label>
                    <Select options={['CREDIT', 'CASH', 'UPI', 'BANK']} value={mode} onChange={e => setMode(e.target.value)} placeholder={null} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>DC NO</Label>
                    <Combobox
                      value={selectedDc}
                      onChange={handleDcChange}
                      options={dcList.map(dc => ({
                        value: dc.dcNo,
                        label: `${dc.dcNo} ${dc.dcDate ? `(${new Date(dc.dcDate).toLocaleDateString('en-GB')})` : ''}`
                      }))}
                      placeholder="-- Search & Select DC --"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>DC Date</Label>
                    <Input type="date" value={dcDate} readOnly className="bg-slate-50 cursor-not-allowed text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Tax Type</Label>
                    <Select options={['Local', 'Inter']} value={taxType} onChange={e => handleTaxTypeChange(e.target.value)} placeholder={null} />
                  </div>
                </div>
              </div>

              {/* Column 2 – Party Information */}
              <div className="flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6">
                <div className="flex flex-col gap-1">
                  <Label>Party Name</Label>
                  <Input value={partyName} readOnly placeholder="Auto-populated from DC" className="!font-bold !text-[#0097A7]" />
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Address</Label>
                  <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Party address details" />
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Delivery Place</Label>
                  <Input value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} placeholder="City / Location" />
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Delivery To</Label>
                  <Input value={deliveryTo} onChange={e => setDeliveryTo(e.target.value)} placeholder="Recipient details" />
                </div>
              </div>

              {/* Column 3 – Additional Information */}
              <div className="flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Stock Reduce</Label>
                    <Select options={['No', 'Yes']} value={stockReduce} onChange={e => setStockReduce(e.target.value)} placeholder={null} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Transport</Label>
                    <Input value={transport} onChange={e => setTransport(e.target.value)} placeholder="Vehicle / Agency" />
                  </div>
                </div>

                {/* Remarks */}
                <div className="flex flex-col gap-1">
                  <Label>Remarks</Label>
                  <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter comments or remarks" />
                </div>

                {/* Restore Delete a Row Dropdown */}
                <div className="flex flex-col gap-1">
                  <Label>Delete a row</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select 
                        value={rowToDelete}
                        onChange={(e) => setRowToDelete(e.target.value)}
                        placeholder="-- Select Item --"
                        options={dcItemsList.map(r => ({
                          value: r.id,
                          label: `${r.partNo || r.barcode || 'Item'} - ${r.partName || ''}`
                        }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="h-[36px] px-3 bg-white border border-rose-300 hover:bg-rose-50 hover:border-rose-400 text-[#e11d48] rounded-lg text-[12px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 uppercase"
                    >
                      <X size={14} /> Delete
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>



        {/* ITEM DETAILS GRID */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mt-4 mx-4 mb-4">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Item Details</h2>
            <button 
              onClick={handleAddRow}
              className="h-8 px-3 bg-[#0097A7] hover:bg-[#007f8c] text-white rounded-md text-[12px] font-bold shadow-sm transition-colors"
            >
              + Add Row
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar pb-[180px]">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="p-2 font-bold w-[40px] text-center">S.No</th>
                  <th className="p-2 font-bold min-w-[160px]">Item Name</th>
                  <th className="p-2 font-bold min-w-[130px]">Part No</th>
                  <th className="p-2 font-bold w-[100px]">Barcode</th>
                  <th className="p-2 font-bold w-[100px]">Spec</th>
                  <th className="p-2 font-bold w-[90px]">Brand</th>
                  <th className="p-2 font-bold w-[70px]">UOM</th>
                  <th className="p-2 font-bold w-[80px]">Qty</th>
                  <th className="p-2 font-bold w-[90px]">Rate</th>
                  <th className="p-2 font-bold w-[100px]">Gross Amt</th>
                  <th className="p-2 font-bold w-[100px]">Disc Amt</th>
                  <th className="p-2 font-bold w-[100px]">Taxable</th>
                  <th className="p-2 font-bold w-[65px]">Tax%</th>
                  <th className="p-2 font-bold w-[95px]">Net Rate</th>
                  <th className="p-2 font-bold w-[100px]">Total Amt</th>
                  <th className="p-2 font-bold w-[40px] text-center">Act</th>
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-[13px] transition-colors">
                    <td className="p-2 text-center font-bold text-slate-400 text-[13px]">{idx + 1}</td>
                    <td className="p-1">
                      <Combobox
                        value={row.partName}
                        onChange={(val) => handleGridChange(row.id, 'partName', val)}
                        options={Array.from(new Set(itemMasterList.map(i => i.partName || i.itemName).filter(Boolean))).map(opt => ({ value: opt, label: opt }))}
                        placeholder="Select Item"
                        readOnly={!row.isManual}
                      />
                    </td>
                    <td className="p-1">
                      <Combobox
                        value={row.partNo}
                        onChange={(val) => handleGridChange(row.id, 'partNo', val)}
                        options={Array.from(new Set(itemMasterList.map(i => i.partNo).filter(Boolean))).map(opt => ({ value: opt, label: opt }))}
                        placeholder="Select Part"
                        readOnly={!row.isManual}
                      />
                    </td>
                    <td className="p-2"><Input value={row.barcode} onChange={e => handleGridChange(row.id, 'barcode', e.target.value)} className="!h-10 !text-[13px]" /></td>
                    <td className="p-2"><Input value={row.specification} onChange={e => handleGridChange(row.id, 'specification', e.target.value)} className="!h-10 !text-[13px]" /></td>
                    <td className="p-2"><Input value={row.brand} onChange={e => handleGridChange(row.id, 'brand', e.target.value)} className="!h-10 !text-[13px]" /></td>
                    <td className="p-2 text-center font-medium text-slate-600 text-[13px]">{row.uom || '-'}</td>
                    <td className="p-2"><Input type="number" value={row.qty} onChange={e => handleGridChange(row.id, 'qty', e.target.value)} className="text-center font-bold !text-[#0097A7] !h-10 !text-[13px]" /></td>
                    <td className="p-2"><Input type="number" value={row.rate} onChange={e => handleGridChange(row.id, 'rate', e.target.value)} className="text-right !h-10 !text-[13px]" /></td>
                    <td className="p-2"><Input type="number" value={row.grossAmt || ''} onChange={e => handleGridChange(row.id, 'grossAmt', e.target.value)} className="text-right font-bold !h-10 !text-[13px]" /></td>
                    <td className="p-2"><Input type="number" value={row.discAmt || ''} onChange={e => handleGridChange(row.id, 'discAmt', e.target.value)} className="text-right !h-10 !text-[13px]" /></td>
                    <td className="p-2 text-right font-bold text-slate-700 text-[13px]">₹{row.taxable || '0.00'}</td>
                    <td className="p-2 text-center font-medium text-slate-500 text-[13px]">{row.taxPercent || '0'}%</td>
                    <td className="p-2 text-right font-bold text-slate-700 text-[13px]">₹{row.netRate || '0.00'}</td>
                    <td className="p-2 text-right font-bold text-emerald-600 bg-emerald-50/30 text-[13px]">₹{row.netAmt || '0.00'}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleDeleteRow(row.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><X size={16} /></button>
                    </td>
                  </tr>
                ))}
                {gridRows.length === 0 && (
                  <tr>
                    <td colSpan="16" className="p-8 text-center text-slate-400 italic text-[13px] bg-slate-50/50">
                      No items added yet. Click <span className="font-bold text-[#0097A7]">"+ Add Row"</span> to start entering items or select a DC Number above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        </div>
      </div>

      {/* 3. Static/Flex Bottom Summary & Action Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center shrink-0 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] z-10">

        {/* Real-time Summary totals - Spanning Full Width */}
        <div className="flex justify-between w-full items-center text-[10px] font-black uppercase text-slate-500 tracking-wider">

          {/* 1. Gross Amt */}
          <div className="flex flex-col items-center justify-center px-2 py-1 bg-white rounded border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] transition-all flex-1 mx-1 max-w-[200px]">
            <span className="text-[8px] text-slate-400">Gross Amt</span>
            <input
              type="text"
              value={manualGrossAmt}
              onChange={handleGrossAmtChange}
              onBlur={handleGrossAmtBlur}
              className="w-full text-center font-bold text-xs text-slate-700 border-none bg-transparent focus:ring-0 focus:outline-none p-0 h-4 mt-0.5 tabular-nums"
            />
          </div>

          {/* 2. Disc Amt */}
          <div className="flex flex-col items-center justify-center px-2 py-1 bg-white rounded border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] transition-all flex-1 mx-1 max-w-[200px]">
            <span className="text-[8px] text-slate-400">Disc Amt</span>
            <input
              type="text"
              value={manualDiscAmt}
              onChange={handleDiscAmtChange}
              onBlur={handleDiscAmtBlur}
              className="w-full text-center font-bold text-xs text-slate-700 border-none bg-transparent focus:ring-0 focus:outline-none p-0 h-4 mt-0.5 tabular-nums"
            />
          </div>

          {/* 3. Taxable */}
          <div className="flex flex-col items-center justify-center px-3 py-1 bg-slate-50 rounded border border-slate-200 shadow-sm flex-1 mx-1 max-w-[200px] h-[38px] justify-between">
            <span className="text-[8px] text-slate-400 text-center w-full">Taxable</span>
            <span className="text-slate-700 text-xs font-bold tabular-nums text-center w-full">₹{taxableAmtVal.toFixed(2)}</span>
          </div>

          {/* 4. SGST */}
          <div className="flex flex-col items-center justify-center px-2 py-1 bg-white rounded border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] transition-all flex-1 mx-1 max-w-[200px]">
            <span className="text-[8px] text-slate-400">SGST</span>
            <input
              type="text"
              value={manualSgst}
              onChange={handleNumericChange(setManualSgst)}
              onBlur={handleNumericBlur(setManualSgst, manualSgst)}
              className="w-full text-center font-bold text-xs text-slate-700 border-none bg-transparent focus:ring-0 focus:outline-none p-0 h-4 mt-0.5 tabular-nums"
            />
          </div>

          {/* 5. CGST */}
          <div className="flex flex-col items-center justify-center px-2 py-1 bg-white rounded border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] transition-all flex-1 mx-1 max-w-[200px]">
            <span className="text-[8px] text-slate-400">CGST</span>
            <input
              type="text"
              value={manualCgst}
              onChange={handleNumericChange(setManualCgst)}
              onBlur={handleNumericBlur(setManualCgst, manualCgst)}
              className="w-full text-center font-bold text-xs text-slate-700 border-none bg-transparent focus:ring-0 focus:outline-none p-0 h-4 mt-0.5 tabular-nums"
            />
          </div>

          {/* 6. IGST */}
          <div className="flex flex-col items-center justify-center px-2 py-1 bg-white rounded border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] transition-all flex-1 mx-1 max-w-[200px]">
            <span className="text-[8px] text-slate-400">IGST</span>
            <input
              type="text"
              value={manualIgst}
              onChange={handleNumericChange(setManualIgst)}
              onBlur={handleNumericBlur(setManualIgst, manualIgst)}
              className="w-full text-center font-bold text-xs text-slate-700 border-none bg-transparent focus:ring-0 focus:outline-none p-0 h-4 mt-0.5 tabular-nums"
            />
          </div>

          {/* 7. Net Amount */}
          <div className="flex flex-col items-center justify-center px-4 py-1 bg-[#0097A7]/10 rounded border border-[#0097A7]/20 shadow-sm flex-1 mx-1 max-w-[200px] h-[38px] justify-between">
            <span className="text-[8px] text-[#0097A7] font-black text-center w-full">Net Amount</span>
            <span className="text-[#0097A7] text-xs font-black tabular-nums text-center w-full">₹{netAmtVal.toFixed(2)}</span>
          </div>

          {/* 8. Save Button */}
          <div className="flex-shrink-0 ml-4 flex items-center">
            <button
              onClick={handleSave}
              className="h-[38px] px-6 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded border border-[#007a87] transition-all shadow-sm active:scale-95 uppercase tracking-wider flex items-center gap-2"
            >
              <Save size={15} /> {editingId ? 'Update' : 'Save Invoice'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}