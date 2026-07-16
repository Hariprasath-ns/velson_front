import { useState, useEffect } from 'react'
import { 
  ChevronRight, X, Trash2, Save
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

const SEED_ITEMS = [
  { name: 'Rig Mast Alignment Kit', rate: 25000 },
  { name: 'Hydraulic Cylinder Seal Kit', rate: 4500 },
  { name: 'Crawler Track Roller Assy', rate: 12000 },
  { name: 'Engine Oil filter 20MM', rate: 1200 },
  { name: 'Rotary Head Swivel Pack', rate: 18500 },
  { name: 'Service Labor charges', rate: 5000 }
]

export default function ServiceQuotation() {
  const toast = useToast()
  
  // Header / Form states
  const [quotationAc, setQuotationAc] = useState('Service Sales A/c')
  const [quNo, setQuNo] = useState(6)
  const [quotDate, setQuotDate] = useState('2026-04-15')
  const [partyName, setPartyName] = useState('')
  const [address, setAddress] = useState('')
  const [conPerson, setConPerson] = useState('')
  const [contactNo, setContactNo] = useState('')

  const [deliveryPlace, setDeliveryPlace] = useState('')
  const [deliveryTo, setDeliveryTo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [roundOff, setRoundOff] = useState('0.00')
  const [transport, setTransport] = useState('')

  const [taxType, setTaxType] = useState('Local')
  const [taxRevYes, setTaxRevYes] = useState('No')
  const [taxYesNo, setTaxYesNo] = useState('Yes')

  // Editable Grid/Table State
  const [gridRows, setGridRows] = useState([
    { id: 1, itemName: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', taxable: '0.00', taxPercent: '18', taxAmt: '0.00', netAmt: '0.00' }
  ])
  const [selectedRowId, setSelectedRowId] = useState(1)
  const [editingId, setEditingId] = useState(null)

  // Load latest Quotations or edit selection on mount
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await api.get('/api/service-quotation')
        const parsed = res.data?.data || []
        const editId = localStorage.getItem('velson_edit_service_quotation_id')

        if (editId && parsed.length > 0) {
          const itemToEdit = parsed.find(q => q.id === Number(editId))
          if (itemToEdit) {
            setEditingId(itemToEdit.id)
            setQuotationAc(itemToEdit.quotationAc)
            setQuNo(itemToEdit.quNo)
            setQuotDate(new Date(itemToEdit.quotDate).toISOString().split('T')[0])
            setPartyName(itemToEdit.partyName)
            setAddress(itemToEdit.address)
            setConPerson(itemToEdit.conPerson)
            setContactNo(itemToEdit.contactNo)
            setDeliveryPlace(itemToEdit.deliveryPlace)
            setDeliveryTo(itemToEdit.deliveryTo)
            setRemarks(itemToEdit.remarks)
            setRoundOff(String(itemToEdit.roundOff))
            setTransport(itemToEdit.transport)
            setTaxType(itemToEdit.taxType)
            setTaxRevYes(itemToEdit.taxRevYes)
            setTaxYesNo(itemToEdit.taxYesNo)
            if (itemToEdit.details && itemToEdit.details.length > 0) {
              setGridRows(itemToEdit.details.map((d, i) => ({ ...d, id: d.id || i + 1, qty: String(d.qty), rate: String(d.rate), netRate: String(d.netRate), discPercent: String(d.discPercent), taxPercent: String(d.taxPercent), totalAmt: String(d.totalAmt), discAmt: String(d.discAmt), discAmt2: String(d.discAmt2), taxable: String(d.taxable), taxAmt: String(d.taxAmt), netAmt: String(d.netAmt) })))
              setSelectedRowId(itemToEdit.details[0]?.id || 1)
            }
            toast.warning(`Loaded Service Quotation Qu. #${itemToEdit.quNo} for editing.`)
          }
          localStorage.removeItem('velson_edit_service_quotation_id') // Clean up
        } else {
          if (parsed.length > 0) {
            const maxQuNo = Math.max(...parsed.map(q => Number(q.quNo) || 0))
            setQuNo(maxQuNo + 1)
          }
        }
      } catch (err) {
        console.error('Failed to fetch quotations', err)
      }
    }
    fetchQuotations()
  }, [])

  // Calculations for total bill amt
  const totalBillAmt = gridRows.reduce((sum, row) => sum + (Number(row.netAmt) || 0), 0) + Number(roundOff)

  // Recalculate row amounts
  const calculateRow = (row) => {
    const qty = Number(row.qty) || 0
    const rate = Number(row.rate) || 0
    const totalAmt = qty * rate
    
    let discAmt = 0
    if (row.dType === '%') {
      discAmt = (totalAmt * (Number(row.discPercent) || 0)) / 100
    } else {
      discAmt = Number(row.discPercent) || 0
    }
    
    const taxable = totalAmt - discAmt - (Number(row.discAmt2) || 0)
    const taxAmt = (taxable * (Number(row.taxPercent) || 0)) / 100
    const netAmt = taxable + taxAmt
    
    return {
      ...row,
      netRate: rate.toFixed(2),
      totalAmt: totalAmt.toFixed(2),
      discAmt: discAmt.toFixed(2),
      taxable: taxable.toFixed(2),
      taxAmt: taxAmt.toFixed(2),
      netAmt: netAmt.toFixed(2)
    }
  }

  const handleRowChange = (id, key, val) => {
    const updated = gridRows.map(row => {
      if (row.id === id) {
        let updatedRow = { ...row, [key]: val }
        
        // If item selected, auto fill standard rate
        if (key === 'itemName') {
          const item = SEED_ITEMS.find(i => i.name === val)
          if (item) {
            updatedRow.rate = String(item.rate)
            updatedRow.netRate = String(item.rate)
          }
        }
        
        return calculateRow(updatedRow)
      }
      return row
    })

    // If item selected on the last row and val is not empty, auto append a new empty row
    const lastRow = gridRows[gridRows.length - 1]
    if (lastRow.id === id && key === 'itemName' && val !== '') {
      const newId = Math.max(...updated.map(r => r.id)) + 1
      const newRow = { id: newId, itemName: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', taxable: '0.00', taxPercent: '18', taxAmt: '0.00', netAmt: '0.00' }
      setGridRows([...updated, newRow])
      setSelectedRowId(newId) // Focus the newly created row
    } else {
      setGridRows(updated)
    }
  }

  const handleDeleteRow = () => {
    if (gridRows.length <= 1) {
      toast.warning('At least one row is required in the quotation.')
      return
    }
    const updated = gridRows.filter(r => r.id !== selectedRowId)
    setGridRows(updated)
    setSelectedRowId(updated[updated.length - 1]?.id || updated[0]?.id || null)
    toast.error('Row deleted successfully.')
  }

  const handleSave = async () => {
    if (!partyName) {
      toast.warning('Please select/enter the Party Name.')
      return
    }
    const invalidRow = gridRows.slice(0, -1).find(r => !r.itemName)
    if (gridRows.length > 1 && !gridRows[0].itemName) {
      toast.warning('Please select an Item Name for the first row.')
      return
    }

    const savedQuotations = gridRows.filter(r => r.itemName !== '')
    if (savedQuotations.length === 0) {
      toast.warning('Please select at least one Item Name.')
      return
    }

    const newQuotation = {
      quotationAc,
      quNo: Number(quNo),
      quotDate,
      partyName,
      address,
      conPerson,
      contactNo,
      deliveryPlace,
      deliveryTo,
      remarks,
      roundOff: Number(roundOff) || 0,
      billAmt: totalBillAmt,
      transport,
      taxType,
      taxRevYes,
      taxYesNo,
      details: savedQuotations.map(r => ({
        itemName: r.itemName,
        qty: Number(r.qty) || 1,
        netRate: Number(r.netRate) || 0,
        rate: Number(r.rate) || 0,
        totalAmt: Number(r.totalAmt) || 0,
        dType: r.dType,
        discPercent: Number(r.discPercent) || 0,
        discAmt: Number(r.discAmt) || 0,
        discAmt2: Number(r.discAmt2) || 0,
        taxable: Number(r.taxable) || 0,
        taxPercent: Number(r.taxPercent) || 0,
        taxAmt: Number(r.taxAmt) || 0,
        netAmt: Number(r.netAmt) || 0
      }))
    }

    try {
      if (editingId !== null) {
        await api.put(`/api/service-quotation/${editingId}`, newQuotation, { loadingMessage: 'Updating quotation...' })
        toast.success(`Service Quotation Qu. #${quNo} Updated Successfully. Total Bill Amt: ${totalBillAmt.toFixed(2)}`)
        setEditingId(null)
      } else {
        await api.post('/api/service-quotation', newQuotation, { loadingMessage: 'Saving quotation...' })
        toast.success(`Service Quotation Qu. #${quNo} Saved Successfully. Total Bill Amt: ${totalBillAmt.toFixed(2)}`)
      }
    } catch (err) {
      console.error('Failed to save quotation', err)
      toast.error('Failed to save quotation. ' + (err.response?.data?.message || err.message))
      return
    }

    // Reset quotation details
    setPartyName('')
    setAddress('')
    setConPerson('')
    setContactNo('')
    setDeliveryPlace('')
    setDeliveryTo('')
    setRemarks('')
    setRoundOff('0.00')
    setTransport('')
    setQuNo(q => q + 1)
    setGridRows([
      { id: 1, itemName: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', taxable: '0.00', taxPercent: '18', taxAmt: '0.00', netAmt: '0.00' }
    ])
    setSelectedRowId(1)
  }

  // Step 3: High-fidelity Invoice Print layout generator
  const handlePrintQuotation = () => {
    const savedQuotations = gridRows.filter(r => r.itemName !== '')
    if (savedQuotations.length === 0) {
      toast.warning('Please enter/select at least one item before printing!')
      return
    }

    const activeQuot = {
      quNo,
      quotDate,
      quotationAc,
      partyName,
      address,
      conPerson,
      contactNo,
      deliveryPlace,
      deliveryTo,
      remarks,
      roundOff,
      totalBillAmt,
      transport,
      items: savedQuotations
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
              ${activeQuot.items.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>${item.itemName}</td>
                  <td class="text-center">${item.qty}</td>
                  <td class="text-right">${Number(item.rate).toFixed(2)}</td>
                  <td class="text-right">${Number(item.totalAmt).toFixed(2)}</td>
                  <td class="text-center">${item.taxPercent}%</td>
                  <td class="text-right">${Number(item.taxAmt).toFixed(2)}</td>
                  <td class="text-right" style="font-weight: bold; color: #0097A7;">${Number(item.netAmt).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary-box">
            <table class="summary-table">
              <tr>
                <td class="summary-label">Sub Total:</td>
                <td class="text-right" style="font-weight: bold;">${activeQuot.items.reduce((s, i) => s + Number(i.taxable), 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="summary-label">Tax Total:</td>
                <td class="text-right" style="font-weight: bold;">${activeQuot.items.reduce((s, i) => s + Number(i.taxAmt), 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="summary-label">Round Off:</td>
                <td class="text-right">${Number(activeQuot.roundOff).toFixed(2)}</td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td class="summary-label" style="font-size: 13px; color: #0f172a;">Grand Total:</td>
                <td class="text-right summary-val">${Number(activeQuot.totalBillAmt).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div class="remarks-box">
            <span class="meta-label">Remarks:</span>
            <div style="margin-top: 5px;">${activeQuot.remarks || 'No remarks.'}</div>
          </div>
          <div class="footer">
            VELSON ERP - System Generated Quotation - Generated on ${new Date().toLocaleString()}
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
    toast.success('Triggering service quotation print flow...')
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-4 py-4">
        {/* Step 1 & 2: Breadcrumb keeps Dashboard chevron arrow REMOVED */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3.5 uppercase font-bold tracking-wider">
          <span className="hover:text-[#0097A7] cursor-pointer">Service</span> <ChevronRight size={11} /> <span className="text-[#0097A7]">Service Quotation</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Step 1 & 2: Revert to solid banner with Close button at the top right inside header */}
          <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
            <span className="font-bold text-[13px] uppercase tracking-wider">Create - Service Quotation</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.history.back()} 
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Highly compact form layout perfectly aligned */}
            <div className="grid grid-cols-12 gap-x-8 gap-y-2.5 mb-5 max-w-7xl mx-auto">
              
              {/* Column 1 (Left) */}
              <div className="col-span-4 space-y-2.5">
                {/* Row 1: Quotation A/c */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>QuotationA/c :</Label>
                  </div>
                  <div className="col-span-8">
                    <Select 
                      options={['Service Sales A/c', 'General Sales A/c', 'Contract Service A/c']} 
                      placeholder="Select Sales A/c..." 
                      value={quotationAc} 
                      onChange={e => setQuotationAc(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Row 2: Quotation No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Qu. No :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={quNo} readOnly className="!font-bold text-[#0097A7]" />
                  </div>
                </div>

                {/* Row 3: Quot Date */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Quot. Date :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input type="date" value={quotDate} onChange={e => setQuotDate(e.target.value)} />
                  </div>
                </div>

                {/* Row 3: Party Name */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Party Name :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="Enter Party Name" />
                  </div>
                </div>

                {/* Row 4: Address */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4 text-right pr-1 pt-1">
                    <Label>Address :</Label>
                  </div>
                  <div className="col-span-8">
                    <textarea 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="Enter address details..."
                      className="w-full h-[50px] px-2.5 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 resize-none"
                    />
                  </div>
                </div>

                {/* Row 5: Con. Person */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Con. Person :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={conPerson} onChange={e => setConPerson(e.target.value)} placeholder="Contact Person Name" />
                  </div>
                </div>

                {/* Row 6: Contact No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Contact No :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="Contact Number" />
                  </div>
                </div>
              </div>

              {/* Column 2 (Middle) - compact styling */}
              <div className="col-span-5 space-y-2.5 border-l border-slate-100 pl-6">
                {/* Row 1: Delivery Place */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-right pr-1">
                    <Label>Delivery Pl :</Label>
                  </div>
                  <div className="col-span-9">
                    <Input value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} placeholder="Delivery Destination" />
                  </div>
                </div>

                {/* Row 2: Delivery To */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-3 text-right pr-1 pt-1">
                    <Label>Delivery To :</Label>
                  </div>
                  <div className="col-span-9">
                    <textarea 
                      value={deliveryTo} 
                      onChange={e => setDeliveryTo(e.target.value)} 
                      placeholder="Receiver Details / Site Address..."
                      className="w-full h-[50px] px-2.5 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 resize-none"
                    />
                  </div>
                </div>

                {/* Row 3: Remarks */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-3 text-right pr-1 pt-1">
                    <Label>Remark's :</Label>
                  </div>
                  <div className="col-span-9">
                    <textarea 
                      value={remarks} 
                      onChange={e => setRemarks(e.target.value)} 
                      placeholder="Enter remarks..."
                      className="w-full h-[32px] px-2.5 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 resize-none"
                    />
                  </div>
                </div>

                {/* Row 4: Round off & Bill Amt */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-right pr-1">
                    <Label>Round off :</Label>
                  </div>
                  <div className="col-span-3">
                    <Input type="number" step="0.01" value={roundOff} onChange={e => setRoundOff(e.target.value)} className="text-right font-bold" />
                  </div>
                  <div className="col-span-2 text-right pr-0.5">
                    <Label>Bill Amt :</Label>
                  </div>
                  <div className="col-span-4">
                    <Input value={totalBillAmt.toFixed(2)} readOnly className="!font-black text-right text-[#0097A7] bg-slate-50" />
                  </div>
                </div>

                {/* Row 5: Transport & Save/Delete Row Buttons placed side-by-side with Transport input */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-right pr-1">
                    <Label>Transport :</Label>
                  </div>
                  <div className="col-span-9">
                    <Input value={transport} onChange={e => setTransport(e.target.value)} placeholder="Vehicle / Agency" />
                  </div>
                </div>
              </div>

              {/* Column 3 (Right) - compact select fields */}
              <div className="col-span-3 space-y-2.5 border-l border-slate-100 pl-6">
                {/* Row 1: Tax Type */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-right pr-1">
                    <Label>Tax Type :</Label>
                  </div>
                  <div className="col-span-7">
                    <Select 
                      options={['Local', 'Central', 'Exempted']} 
                      placeholder="Select Tax Type" 
                      value={taxType} 
                      onChange={e => setTaxType(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Row 2: TaxRev Yes */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-right pr-1">
                    <Label>TaxRev Yes :</Label>
                  </div>
                  <div className="col-span-7">
                    <Select 
                      options={['Yes', 'No']} 
                      placeholder="Select" 
                      value={taxRevYes} 
                      onChange={e => setTaxRevYes(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Row 3: Tax Yes/No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-right pr-1">
                    <Label>Tax Yes/No :</Label>
                  </div>
                  <div className="col-span-7">
                    <Select 
                      options={['Yes', 'No']} 
                      placeholder="Select" 
                      value={taxYesNo} 
                      onChange={e => setTaxYesNo(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save & Delete Row buttons — right-aligned above Items table */}
            <div className="max-w-7xl mx-auto flex items-center justify-end gap-1.5 mb-1.5">
              <button 
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap h-[28px]"
              >
                <Save size={12} /> {editingId !== null ? 'Update' : 'Save'}
              </button>
              <button 
                onClick={handleDeleteRow}
                className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap h-[28px]"
              >
                <Trash2 size={12} /> Delete Row
              </button>
            </div>

            {/* Solid Items Header Banner */}
            <div className="max-w-7xl mx-auto bg-[#0097A7] text-white px-4 py-1.5 rounded-t-lg font-bold text-xs uppercase tracking-wider shadow-sm">
              Items
            </div>

            {/* Editable Items Table Grid with ultra-compact style */}
            <div className="max-w-7xl mx-auto border border-slate-200 rounded-b-lg overflow-hidden shadow-sm bg-white mb-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="bg-slate-50 text-[12px] uppercase text-slate-400 font-bold border-b border-slate-200 h-8">
                      <th className="px-2.5 py-1 border-r border-slate-100 w-12 text-center">S.No</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-64">Item Name</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-16 text-center">Qty</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Net Rate</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Rate</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-28 text-right">Total Amt</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-18 text-center">D.Type</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-18 text-center">Disc %</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Disc Amt</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Disc Amt2</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-28 text-right">Taxable</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-18 text-center">Tax %</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Tax Amt</th>
                      <th className="px-2.5 py-1 text-right w-28">Net Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px]">
                    {gridRows.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        onClick={() => setSelectedRowId(row.id)}
                        className={`hover:bg-[#0097A7]/5 cursor-pointer h-9 transition-colors ${selectedRowId === row.id ? 'bg-[#0097A7]/10 font-semibold' : ''}`}
                      >
                        {/* Asterisk and S.No formatting directly mirroring the screenshot row indicators */}
                        <td className="px-2.5 py-1 border-r border-slate-50 text-center text-slate-500 font-bold bg-slate-50/50">
                          {idx + 1}
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <select 
                            value={row.itemName}
                            onChange={e => handleRowChange(row.id, 'itemName', e.target.value)}
                            className="w-full h-[30px] px-1 py-0 text-[12.5px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white text-slate-700 hover:border-slate-300"
                          >
                            <option value="">-- Pick Item --</option>
                            {SEED_ITEMS.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-center">
                          <input 
                            type="number"
                            value={row.qty}
                            onChange={e => handleRowChange(row.id, 'qty', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12.5px] text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right font-medium text-slate-500 bg-slate-50/20">{row.netRate}</td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input 
                            type="number"
                            value={row.rate}
                            onChange={e => handleRowChange(row.id, 'rate', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12.5px] text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right font-bold text-slate-600 bg-slate-50/20">{row.totalAmt}</td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <select 
                            value={row.dType}
                            onChange={e => handleRowChange(row.id, 'dType', e.target.value)}
                            className="w-full h-[30px] px-1 py-0 text-[12.5px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white text-slate-700"
                          >
                            <option value="%">%</option>
                            <option value="Amt">Amt</option>
                          </select>
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input 
                            type="number"
                            value={row.discPercent}
                            onChange={e => handleRowChange(row.id, 'discPercent', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12.5px] text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right text-slate-500 font-semibold bg-slate-50/20">{row.discAmt}</td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input 
                            type="number"
                            value={row.discAmt2}
                            onChange={e => handleRowChange(row.id, 'discAmt2', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12.5px] text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right font-bold text-slate-600 bg-slate-50/20">{row.taxable}</td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input 
                            type="number"
                            value={row.taxPercent}
                            onChange={e => handleRowChange(row.id, 'taxPercent', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12.5px] text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right text-slate-500 font-semibold bg-slate-50/20">{row.taxAmt}</td>
                        <td className="px-2.5 py-1 text-right font-black text-[#0097A7] bg-slate-50/40">{row.netAmt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>



          </div>
        </div>
      </div>
    </div>
  )
}