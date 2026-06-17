import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { 
  ChevronRight, X, Trash2, Edit, Search, Printer, List, Download, FileSpreadsheet, Filter, Settings
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'


// ── Ultra-compact UI primitives matching the template ──
const Label = ({ children, required }) => (
  <label className="inline-flex items-center text-[12px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
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

const SEED_QUOTATIONS = [
  {
    id: 101,
    quNo: 1,
    quotDate: '2026-04-15',
    quotationAc: 'Service Sales A/c',
    partyName: 'APC DRILLING AND CONSTRUCTION PVT LTD',
    address: 'Plot 24, Industrial Area, Bangalore',
    conPerson: 'Mr. Rajesh Kumar',
    contactNo: '9876543210',
    deliveryPlace: 'Site A, Hosur',
    deliveryTo: 'APC Drilling Site Incharge',
    remarks: 'Urgent delivery required',
    roundOff: '0.20',
    totalBillAmt: 29500.20,
    transport: 'VRL Logistics',
    taxType: 'Local',
    taxRevYes: 'No',
    taxYesNo: 'Yes',
    items: [
      { id: 1, itemName: 'Rig Mast Alignment Kit', qty: '1', netRate: '25000.00', rate: '25000.00', totalAmt: '25000.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', taxable: '25000.00', taxPercent: '18', taxAmt: '4500.00', netAmt: '29500.00' }
    ]
  },
  {
    id: 102,
    quNo: 2,
    quotDate: '2026-04-15',
    quotationAc: 'General Sales A/c',
    partyName: 'SM DRILLING COMPANY',
    address: 'Near Town Hall, Salem',
    conPerson: 'Mr. S. Mani',
    contactNo: '9443212345',
    deliveryPlace: 'Salem Yard',
    deliveryTo: 'SM Drilling Office',
    remarks: 'Seals must be high temperature grade',
    roundOff: '0.00',
    totalBillAmt: 5310.00,
    transport: 'Self Vehicle',
    taxType: 'Local',
    taxRevYes: 'No',
    taxYesNo: 'Yes',
    items: [
      { id: 1, itemName: 'Hydraulic Cylinder Seal Kit', qty: '1', netRate: '4500.00', rate: '4500.00', totalAmt: '4500.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', taxable: '4500.00', taxPercent: '18', taxAmt: '810.00', netAmt: '5310.00' }
    ]
  },
  {
    id: 103,
    quNo: 3,
    quotDate: '2026-04-14',
    quotationAc: 'Service Sales A/c',
    partyName: 'SIVASAKTHI',
    address: 'Bypass Road, Namakkal',
    conPerson: 'Mr. Chinnasamy',
    contactNo: '9842712345',
    deliveryPlace: 'Namakkal Workshop',
    deliveryTo: 'Sivasakthi Workshop',
    remarks: 'Standard labor charges',
    roundOff: '0.00',
    totalBillAmt: 5900.00,
    transport: 'KPN Speed',
    taxType: 'Local',
    taxRevYes: 'No',
    taxYesNo: 'Yes',
    items: [
      { id: 1, itemName: 'Service Labor charges', qty: '1', netRate: '5000.00', rate: '5000.00', totalAmt: '5000.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', taxable: '5000.00', taxPercent: '18', taxAmt: '900.00', netAmt: '5900.00' }
    ]
  }
]

export default function ServiceQuotationDetails() {
  const toast = useToast()
  
  // Search state filters (default date range covers all seeds in April 2026)
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2026-04-30')
  const [godown, setGodown] = useState('Main Godown')
  const [ledger, setLedger] = useState('')
  const [sales, setSales] = useState('')

  // Database list states
  const [dataList, setDataList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [pageLimit, setPageLimit] = useState(1)

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const res = await api.get('/api/service-quotation')
      const parsed = res.data?.data || []
      setDataList(parsed)
      if (parsed.length > 0) {
        setSelectedId(parsed[0].id)
      } else {
        setSelectedId(null)
      }
    } catch (err) {
      console.error('Failed to fetch quotations', err)
      toast.error('Failed to fetch quotation records.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Dynamic reactive filtering: when ANY dropdown or date is modified, the table updates instantly
  useEffect(() => {
    let result = dataList

    if (fromDate) {
      result = result.filter(q => {
        const qDate = new Date(q.quotDate).toISOString().split('T')[0]
        return qDate >= fromDate
      })
    }
    if (toDate) {
      result = result.filter(q => {
        const qDate = new Date(q.quotDate).toISOString().split('T')[0]
        return qDate <= toDate
      })
    }
    if (ledger) {
      result = result.filter(q => q.partyName === ledger)
    }
    if (sales) {
      result = result.filter(q => q.quotationAc === sales)
    }

    setFilteredList(result)
    // Safe selection reset
    if (result.length > 0) {
      // Keep selected if still in list, else pick first
      const exists = result.find(q => q.id === selectedId)
      if (!exists) {
        setSelectedId(result[0].id)
      }
    } else {
      setSelectedId(null)
    }
  }, [dataList, fromDate, toDate, ledger, sales])

  // Explicit filter button trigger showing search status toast
  const handleSearch = () => {
    toast.success(`Search refreshed. Found ${filteredList.length} matching quotation record(s).`)
  }

  const handleDelete = async () => {
    if (!selectedId) {
      toast.warning('Please select a quotation from the table below to delete.')
      return
    }

    if (window.confirm('Are you sure you want to delete this Service Quotation?')) {
      try {
        await api.delete(`/api/service-quotation/${selectedId}`, { loadingMessage: 'Deleting quotation...' })
        
        const updated = dataList.filter(q => q.id !== selectedId)
        setDataList(updated)
        
        // Update filtered list in real-time
        const updatedFiltered = filteredList.filter(q => q.id !== selectedId)
        setFilteredList(updatedFiltered)
        
        setSelectedId(updatedFiltered[0]?.id || null)
        toast.error('Service Quotation deleted successfully.')
      } catch (err) {
        console.error('Failed to delete quotation', err)
        toast.error('Failed to delete quotation record.')
      }
    }
  }

  const handleEdit = () => {
    if (!selectedId) {
      toast.warning('Please select a quotation from the table below to edit.')
      return
    }
    // Set editing id in local storage and navigate back to ServiceQuotation entry page!
    localStorage.setItem('velson_edit_service_quotation_id', String(selectedId))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'ServiceQuotation' }))
  }

  const handlePrint = () => {
    if (!selectedId) {
      toast.warning('Please select a quotation to print bill.')
      return
    }
    const activeQuot = dataList.find(q => q.id === selectedId)
    if (!activeQuot) {
      toast.warning('Quotation record not found.')
      return
    }

    const printWindow = window.open('', '_blank', 'width=900,height=750')
    printWindow.document.write(`
      <html>
        <head>
          <title>Service Quotation - Qu. #${activeQuot.quNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #0097A7; font-size: 26px; text-transform: uppercase; font-weight: 800; }
            .company-info p { margin: 4px 0; font-size: 12px; color: #666; }
            .quot-title { text-align: right; }
            .quot-title h2 { margin: 0; color: #475569; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .quot-title p { margin: 4px 0; font-size: 13px; font-weight: bold; color: #0097A7; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px; }
            .meta-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
            .meta-section h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
            .meta-label { font-weight: bold; color: #475569; }
            .meta-val { color: #0f172a; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #0097A7; color: white; font-size: 12px; text-transform: uppercase; font-weight: bold; padding: 10px; border: 1px solid #334155; }
            td { padding: 10px; border: 1px solid #e2e8f0; font-size: 12px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .summary-box { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .summary-table { width: 300px; border-collapse: collapse; }
            .summary-table td { padding: 8px 12px; border: 1px solid #e2e8f0; }
            .summary-label { font-weight: bold; color: #475569; font-size: 12px; }
            .summary-val { font-weight: 800; color: #0097A7; font-size: 13px; }
            .remarks-box { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 6px; font-size: 12px; }
            .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>Velson</h1>
              <p>Industrial Drilling Rig Service & Parts provider</p>
              <p>Corporate Office: Bangalore Main Road, India</p>
            </div>
            <div class="quot-title">
              <h2>Service Quotation</h2>
              <p>Quotation No: Qu. #${activeQuot.quNo}</p>
              <p style="color: #64748b; font-weight: normal; font-size: 12px;">Date: ${activeQuot.quotDate}</p>
            </div>
          </div>
          <div class="meta-grid">
            <div class="meta-section">
              <h3>Party Details</h3>
              <div class="meta-row"><span class="meta-label">Party Name:</span><span class="meta-val" style="font-weight: bold;">${activeQuot.partyName || '—'}</span></div>
              <div class="meta-row"><span class="meta-label">Address:</span><span class="meta-val">${activeQuot.address || '—'}</span></div>
              <div class="meta-row"><span class="meta-label">Contact Person:</span><span class="meta-val">${activeQuot.conPerson || '—'}</span></div>
              <div class="meta-row"><span class="meta-label">Contact No:</span><span class="meta-val">${activeQuot.contactNo || '—'}</span></div>
            </div>
            <div class="meta-section">
              <h3>Shipping & Delivery</h3>
              <div class="meta-row"><span class="meta-label">Sales A/c:</span><span class="meta-val">${activeQuot.quotationAc}</span></div>
              <div class="meta-row"><span class="meta-label">Delivery Place:</span><span class="meta-val">${activeQuot.deliveryPlace || '—'}</span></div>
              <div class="meta-row"><span class="meta-label">Delivery To:</span><span class="meta-val">${activeQuot.deliveryTo || '—'}</span></div>
              <div class="meta-row"><span class="meta-label">Transport Agency:</span><span class="meta-val">${activeQuot.transport || '—'}</span></div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                <th style="width: 40%">Item Name</th>
                <th style="width: 8%">Qty</th>
                <th style="width: 12%">Rate</th>
                <th style="width: 15%">Total</th>
                <th style="width: 10%">Tax %</th>
                <th style="width: 10%">Tax Amt</th>
                <th style="width: 15%">Net Amt</th>
              </tr>
            </thead>
            <tbody>
              \${(activeQuot.items || []).map((item, idx) => \`
                <tr>
                  <td class="text-center">\${idx + 1}</td>
                  <td>\${item.itemName}</td>
                  <td class="text-center">\${item.qty}</td>
                  <td class="text-right">\${Number(item.rate).toFixed(2)}</td>
                  <td class="text-right">\${Number(item.totalAmt).toFixed(2)}</td>
                  <td class="text-center">\${item.taxPercent}%</td>
                  <td class="text-right">\${Number(item.taxAmt).toFixed(2)}</td>
                  <td class="text-right" style="font-weight: bold; color: #0097A7;">\${Number(item.netAmt).toFixed(2)}</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
          <div class="summary-box">
            <table class="summary-table">
              <tr>
                <td class="summary-label">Sub Total:</td>
                <td class="text-right" style="font-weight: bold;">\${(activeQuot.items || []).reduce((s, i) => s + Number(i.taxable), 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="summary-label">Tax Total:</td>
                <td class="text-right" style="font-weight: bold;">\${(activeQuot.items || []).reduce((s, i) => s + Number(i.taxAmt), 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="summary-label">Round Off:</td>
                <td class="text-right">\${Number(activeQuot.roundOff).toFixed(2)}</td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td class="summary-label" style="font-size: 13px; color: #0f172a;">Grand Total:</td>
                <td class="text-right summary-val">\${Number(activeQuot.totalBillAmt).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div class="remarks-box">
            <span class="meta-label">Remarks:</span>
            <div style="margin-top: 5px;">\${activeQuot.remarks || 'No remarks.'}</div>
          </div>
          <div class="footer">
            VELSON ERP - System Generated Quotation - Generated on \${new Date().toLocaleString()}
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
    toast.success(`Triggered quotation print flow for Qu. #${activeQuot.quNo}`)
  }

  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      toast.warning('No quotation data available to export.')
      return
    }
    
    const data = filteredList.map((q, idx) => {
      const taxable = q.items?.reduce((s, i) => s + (Number(i.taxable) || 0), 0) || 0
      const taxAmt = q.items?.reduce((s, i) => s + (Number(i.taxAmt) || 0), 0) || 0
      return {
        'S.No': idx + 1,
        'ID': q.id,
        'Quotation No': `Qu. #${q.quNo}`,
        'Quotation Date': q.quotDate,
        'Dc No': `DC-${q.quNo + 100}`,
        'Supplier/Party Name': q.partyName,
        'Liability/Sales A/c': q.quotationAc,
        'Taxable Amt': taxable,
        'Tax Amt': taxAmt,
        'Grand Bill Amt': Number(q.totalBillAmt),
        'L.R. No': `LR-${q.quNo + 230}`,
        'L.R. Date': q.quotDate,
        'Delivery Place': q.deliveryPlace || 'Local Delivery'
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotations')
    
    // Download as a real binary Excel spreadsheet
    XLSX.writeFile(workbook, `service_quotations_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Successfully downloaded Service Quotations Excel spreadsheet!')
  }

  const handleExportPdf = () => {
    if (filteredList.length === 0) {
      toast.warning('No quotations data available to export.')
      return
    }
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    // Header banner
    doc.setFillColor(0, 151, 167) // Teal
    doc.rect(0, 0, 297, 25, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('VELSON ERP - SERVICE QUOTATIONS REGISTRY', 15, 16)
    
    doc.setTextColor(100, 116, 139)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Total Records: ${filteredList.length}`, 240, 32)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 32)
    
    // Table Headers
    let startY = 38
    doc.setFillColor(44, 62, 80) // Slate
    doc.rect(15, startY, 267, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('ID', 17, startY + 5.5)
    doc.text('Quot No', 28, startY + 5.5)
    doc.text('Quot Date', 48, startY + 5.5)
    doc.text('Supplier / Party Name', 72, startY + 5.5)
    doc.text('Liability A/c', 145, startY + 5.5)
    doc.text('Taxable', 188, startY + 5.5)
    doc.text('Tax Amt', 212, startY + 5.5)
    doc.text('Bill Amt', 236, startY + 5.5)
    doc.text('Delivery Place', 256, startY + 5.5)
    
    let currentY = startY + 8
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    
    filteredList.forEach((q, idx) => {
      // Alternating rows
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, currentY, 267, 7, 'F')
      }
      
      const rowTaxable = q.items?.reduce((s, i) => s + (Number(i.taxable) || 0), 0) || 0
      const rowTaxAmt = q.items?.reduce((s, i) => s + (Number(i.taxAmt) || 0), 0) || 0
      
      doc.setTextColor(51, 65, 85)
      doc.text(String(q.id), 17, currentY + 4.5)
      
      doc.setTextColor(0, 151, 167)
      doc.setFont('Helvetica', 'bold')
      doc.text(`Qu. #${q.quNo}`, 28, currentY + 4.5)
      
      doc.setTextColor(100, 116, 139)
      doc.setFont('Helvetica', 'normal')
      doc.text(q.quotDate, 48, currentY + 4.5)
      
      doc.setTextColor(15, 23, 42)
      doc.setFont('Helvetica', 'bold')
      const truncatedSupplier = q.partyName.length > 30 ? q.partyName.substring(0, 30) + '...' : q.partyName
      doc.text(truncatedSupplier, 72, currentY + 4.5)
      
      doc.setTextColor(51, 65, 85)
      doc.setFont('Helvetica', 'normal')
      doc.text(q.quotationAc, 145, currentY + 4.5)
      doc.text(rowTaxable.toFixed(2), 188, currentY + 4.5)
      doc.text(rowTaxAmt.toFixed(2), 212, currentY + 4.5)
      
      doc.setTextColor(0, 151, 167)
      doc.setFont('Helvetica', 'bold')
      doc.text(Number(q.totalBillAmt).toFixed(2), 236, currentY + 4.5)
      
      doc.setTextColor(100, 116, 139)
      doc.setFont('Helvetica', 'normal')
      doc.text(q.deliveryPlace || 'Local Delivery', 256, currentY + 4.5)
      
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
        doc.text('Quot No', 28, 15.5)
        doc.text('Quot Date', 48, 15.5)
        doc.text('Supplier / Party Name', 72, 15.5)
        doc.text('Liability A/c', 145, 15.5)
        doc.text('Taxable', 188, 15.5)
        doc.text('Tax Amt', 212, 15.5)
        doc.text('Bill Amt', 236, 15.5)
        doc.text('Delivery Place', 256, 15.5)
        currentY = 18
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(8)
      }
    })
    
    doc.save(`service_quotations_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Successfully downloaded Service Quotations PDF registry!')
  }

  // Auto summation values
  const totalTaxable = filteredList.reduce((sum, item) => {
    const rowTaxable = item.items?.reduce((s, i) => s + (Number(i.taxable) || 0), 0) || 0
    return sum + rowTaxable
  }, 0)

  const totalTaxAmt = filteredList.reduce((sum, item) => {
    const rowTax = item.items?.reduce((s, i) => s + (Number(i.taxAmt) || 0), 0) || 0
    return sum + rowTax
  }, 0)

  const totalBillAmt = filteredList.reduce((sum, item) => sum + (Number(item.totalBillAmt) || 0), 0)

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden bg-[#f4f6f8] min-h-full pb-6">
      {/* Breadcrumb matching Vehicle Master (No Dashboard >) */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span className="hover:text-[#0097A7] cursor-pointer">Service</span>
        <ChevronRight className="w-3 h-3 text-slate-400"/>
        <span className="text-[#0097A7] font-semibold">Service Quotation Details</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Solid teal banner header matching legacy screenshots */}
        <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
          <span className="font-bold text-[13px] uppercase tracking-wider">Service Quotation Details</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleEdit} 
              className="bg-[#27ae60] hover:bg-[#229954] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1 h-[28px]"
            >
              <Edit size={12} /> Edit
            </button>
            <button 
              onClick={handleDelete} 
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
          {/* Highly compact double-row search toolbar matching the legacy layout */}
          <div className="grid grid-cols-12 gap-x-8 gap-y-2.5 mb-4 max-w-7xl mx-auto items-center">
            
            {/* Left filter options */}
            <div className="col-span-8 grid grid-cols-12 gap-x-4 gap-y-2.5 items-center">
              {/* Row 1: From Date, To Date & Godown */}
              <div className="col-span-2 text-right pr-0.5">
                <Label>From Date :</Label>
              </div>
              <div className="col-span-2">
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              
              <div className="col-span-1.5 text-right pr-0.5">
                <Label>To Date :</Label>
              </div>
              <div className="col-span-2">
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>

              <div className="col-span-1.5 text-right pr-0.5">
                <Label>Godown :</Label>
              </div>
              <div className="col-span-3">
                <Select 
                  options={['Main Godown', 'Store Godown', 'Service Bay']} 
                  placeholder="Select Godown..." 
                  value={godown} 
                  onChange={e => setGodown(e.target.value)} 
                />
              </div>

              {/* Row 2: Ledger & Sales */}
              <div className="col-span-2 text-right pr-0.5">
                <Label>Ledger :</Label>
              </div>
              <div className="col-span-4">
                <Select 
                  options={['APC DRILLING AND CONSTRUCTION PVT LTD', 'SM DRILLING COMPANY', 'SIVASAKTHI', 'VKS Mining Services']} 
                  placeholder="Search Ledger Name..." 
                  value={ledger} 
                  onChange={e => setLedger(e.target.value)} 
                />
              </div>

              <div className="col-span-2 text-right pr-0.5">
                <Label>Sales :</Label>
              </div>
              <div className="col-span-4">
                <Select 
                  options={['Service Sales A/c', 'General Sales A/c', 'Contract Service A/c']} 
                  placeholder="Select Sales..." 
                  value={sales} 
                  onChange={e => setSales(e.target.value)} 
                />
              </div>
            </div>

            {/* Right side aligned search & print actions */}
            <div className="col-span-4 flex flex-wrap gap-1.5 pl-6 justify-center max-w-[280px]">
              <button 
                onClick={handleSearch}
                className="flex items-center justify-center gap-1.5 h-[28px] px-3.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap animate-pulse-subtle"
              >
                <Search size={13} /> Search
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 h-[28px] px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <Printer size={13} className="text-[#0097A7]" /> Print Bill
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto bg-[#0097A7] text-white px-4 py-1.5 rounded-t-lg font-bold text-xs uppercase tracking-wider shadow-sm">
            Service Quotations List
          </div>

          {/* Table Section with compact elements */}
          <div className="max-w-7xl mx-auto border border-slate-200 rounded-b-lg overflow-hidden shadow-sm bg-white mb-3">
            
            <div className="flex items-center justify-end py-1 bg-slate-50/50 px-3 border-b border-slate-100">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">LS</span>
                <input
                  type="number"
                  value={pageLimit}
                  onChange={e => setPageLimit(e.target.value)}
                  className="w-10 text-center py-[2px] border border-slate-200 rounded text-[13px] font-bold text-slate-700 bg-white h-[26px] focus:outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                />
              </div>
              <div className="flex items-center gap-1">
                {[
                  { icon: <Printer size={12} />, l: 'Dos' },
                  { icon: <FileSpreadsheet size={12} className="text-green-600" />, l: 'Excel' },
                  { icon: <Download size={12} className="text-red-500" />, l: 'Pdf' },
                  { icon: <Filter size={12} className="text-[#0097A7]" />, l: 'Filter' },
                  { icon: <Settings size={12} className="text-slate-500" />, l: 'Setting' },
                ].map(tool => (
                  <button 
                    key={tool.l} 
                    onClick={() => {
                      if (tool.l === 'Dos') handlePrint();
                      else if (tool.l === 'Excel') handleExportExcel();
                      else if (tool.l === 'Pdf') handleExportPdf();
                      else toast.success(`${tool.l} tool activated.`);
                    }}
                    className="flex items-center gap-0.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold uppercase rounded shadow-sm transition-all active:scale-95"
                  >
                    {tool.icon} {tool.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead className="bg-slate-50 text-[12px] uppercase text-slate-400 font-bold border-b border-slate-200">
                  <tr className="h-8">
                    <th className="px-3 py-1 border-r border-slate-100 w-16 text-center">ID</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-32 text-center">Quotation No</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-36 text-center">Quotation Date</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-28">Dc_No</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-[260px]">Supplier</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-40">Liability</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-44">Shop</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-28 text-right">Taxable</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-28 text-right">Tax Amt</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-32 text-right">Bill Amt</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-28">L.R.No</th>
                    <th className="px-3 py-1 border-r border-slate-100 w-32">L.R.Date</th>
                    <th className="px-3 py-1">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-16 text-center text-slate-300 italic">
                        No Quotation records found.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((row) => {
                      const rowTaxable = row.items?.reduce((s, i) => s + (Number(i.taxable) || 0), 0) || 0
                      const rowTaxAmt = row.items?.reduce((s, i) => s + (Number(i.taxAmt) || 0), 0) || 0
                      
                      return (
                        <tr 
                          key={row.id} 
                          onClick={() => setSelectedId(row.id)}
                          className={`hover:bg-[#0097A7]/5 cursor-pointer transition-colors h-9 ${selectedId === row.id ? 'bg-[#0097A7]/10 font-semibold' : ''}`}
                        >
                          <td className="px-3 py-1 border-r border-slate-50 text-center text-slate-500 font-bold bg-slate-50/50">{row.id}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-[#0097A7]">Qu. #{row.quNo}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-500">{row.quotDate}</td>
                          <td className="px-3 py-1 border-r border-slate-50 font-medium text-slate-600">DC-{row.quNo + 100}</td>
                          <td className="px-3 py-1 border-r border-slate-50 font-bold text-slate-700">{row.partyName}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-slate-600 font-medium">{row.quotationAc}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-slate-600">Velson Bay Workshop</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-right font-bold text-slate-600 bg-slate-50/20">{rowTaxable.toFixed(2)}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-right font-bold text-slate-600 bg-slate-50/20">{rowTaxAmt.toFixed(2)}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-right font-black text-[#0097A7] bg-slate-50/30">{Number(row.totalBillAmt).toFixed(2)}</td>
                          <td className="px-3 py-1 border-r border-slate-50 font-mono text-slate-600">LR-{row.quNo + 230}</td>
                          <td className="px-3 py-1 border-r border-slate-50 text-slate-500">{row.quotDate}</td>
                          <td className="px-3 py-1 text-slate-600">{row.deliveryPlace || 'Local Delivery'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summation Total Summary Row underneath the main list exactly mirroring the screenshot */}
          <div className="max-w-7xl mx-auto bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-[12px] text-slate-500 font-bold uppercase tracking-wider shadow-sm mb-2">
            <div className="flex items-center gap-6">
              <span>Row Total : {filteredList.length}</span>
              <span>Godown : {godown || '—'}</span>
            </div>
            <div className="flex items-center gap-8 pl-4">
              <span className="flex items-center gap-1.5">
                Taxable Total: <span className="text-[12px] font-black text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded shadow-sm">{totalTaxable.toFixed(2)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                Tax Total: <span className="text-[12px] font-black text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded shadow-sm">{totalTaxAmt.toFixed(2)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                Grand Bill Total: <span className="text-[12px] font-black text-[#0097A7] bg-white border border-slate-200 px-2.5.5 py-0.5 rounded shadow-sm">{totalBillAmt.toFixed(2)}</span>
              </span>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}