import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, X, Save, Trash2, Plus, 
  Wrench, ClipboardList, LayoutGrid, FileText, Eye, Printer
} from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives (Matching BOMCreation Sizing & Styling) ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}
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
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ options = [], placeholder = '-- Select --', value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

export default function ServiceBillEntry() {
  const toast = useToast()
  const navigate = useNavigate()
  
  // Form State
  const [form, setForm] = useState({
    refNo: '187',
    billDate: '2026-04-15',
    serviceNo: '26-27/SE000004',
    partyName: 'Velson Industry Corp',
    cusCode: 'CUS-0482',
    address: 'Plot 45, Phase-2, Industrial Area, Bangalore, 560058',
    taxType: 'Local',
    serviceJobNo: 'JOB-9842',
    serialNo: 'SL-00812',
    vehicleCount: '1',
    vehicleNo: 'KA-04-MC-8812',
    vehicleModelNo: 'V-MDL-2026',
    modelSubType: 'Standard',
    vehicleName: 'Power Loader',
    servicePartNo: 'PART-9021',
  })

  // Table Row State (Single active editable row for premium feel and functionality)
  const [rowItem, setRowItem] = useState({
    itemName: 'General Maintenance Service & Tuning',
    barcode: '8901030752819',
    uom: 'NOS',
    qty: '1',
    rate: '450.00',
    labourCharge: '150.00',
    issueNo: 'IS-000492',
    jobNo: 'JC-9921',
    receiver: 'Rajesh Kumar',
    miRe: 'NO',
    bookingCode: 'B-0082',
    vehicleType: 'Car',
    serviceM: 'General',
    mItemNa: 'Oil Filter',
    printOrderNo: 'PO-982'
  })

  // Edit ID State
  const [editId, setEditId] = useState(null)

  // Preview Modal Toggle
  const [showPreview, setShowPreview] = useState(false)

  // Check if there is an active item to edit on mount
  useEffect(() => {
    const editData = localStorage.getItem('velson_edit_service_bill')
    if (editData) {
      try {
        const parsed = JSON.parse(editData)
        setForm({
          refNo: parsed.refNo || '187',
          billDate: parsed.billDate || '2026-04-15',
          serviceNo: parsed.serviceNo || '26-27/SE000004',
          partyName: parsed.partyName || '',
          cusCode: parsed.cusCode || '',
          address: parsed.address || '',
          taxType: parsed.taxType || 'Local',
          serviceJobNo: parsed.serviceJobNo || '',
          serialNo: parsed.serialNo || '',
          vehicleCount: parsed.vehicleCount || '1',
          vehicleNo: parsed.vehicleNo || '',
          vehicleModelNo: parsed.vehicleModelNo || '',
          modelSubType: parsed.modelSubType || '',
          vehicleName: parsed.vehicleName || '',
          servicePartNo: parsed.servicePartNo || '',
        })
        setRowItem({
          itemName: parsed.itemName || '',
          barcode: parsed.barcode || '',
          uom: parsed.uom || '',
          qty: String(parsed.qty ?? '0'),
          rate: String(parsed.rate ?? '0.00'),
          labourCharge: String(parsed.labourCharge ?? '0.00'),
          issueNo: parsed.issueNo || '',
          jobNo: parsed.jobNo || '',
          receiver: parsed.receiver || '',
          miRe: parsed.miRe || '',
          bookingCode: parsed.bookingCode || '',
          vehicleType: parsed.vehicleType || '',
          serviceM: parsed.serviceM || '',
          mItemNa: parsed.mItemNa || '',
          printOrderNo: parsed.printOrderNo || ''
        })
        setEditId(parsed.id || null)
      } catch (e) {
        console.error('Error parsing edit data:', e)
      }
      localStorage.removeItem('velson_edit_service_bill')
    }
  }, [])

  const handleInputChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const handleRowChange = (field, val) => {
    setRowItem(prev => ({ ...prev, [field]: val }))
  }

  // Calculate dynamic Total Amt for the active row
  const qtyNum = Number(rowItem.qty) || 0
  const rateNum = Number(rowItem.rate) || 0
  const labourNum = Number(rowItem.labourCharge) || 0
  const totalAmt = (qtyNum * rateNum) + labourNum
  const serviceTotal = totalAmt

  // 1. Save Button Logic
  const handleSave = () => {
    if (!form.partyName.trim()) {
      toast.error('Party Name is required!')
      return
    }
    if (!form.serviceNo.trim()) {
      toast.error('Service No is required!')
      return
    }

    const billRecord = {
      id: editId || Date.now().toString(),
      refNo: form.refNo,
      billDate: form.billDate,
      serviceNo: form.serviceNo,
      partyName: form.partyName,
      cusCode: form.cusCode,
      address: form.address,
      taxType: form.taxType,
      serviceJobNo: form.serviceJobNo,
      serialNo: form.serialNo,
      vehicleCount: form.vehicleCount,
      vehicleNo: form.vehicleNo,
      vehicleModelNo: form.vehicleModelNo,
      modelSubType: form.modelSubType,
      vehicleName: form.vehicleName,
      servicePartNo: form.servicePartNo,
      
      // Row fields
      itemName: rowItem.itemName,
      barcode: rowItem.barcode,
      uom: rowItem.uom,
      qty: qtyNum,
      rate: rateNum,
      labourCharge: labourNum,
      issueNo: rowItem.issueNo,
      jobNo: rowItem.jobNo,
      receiver: rowItem.receiver,
      miRe: rowItem.miRe,
      bookingCode: rowItem.bookingCode,
      vehicleType: rowItem.vehicleType,
      serviceM: rowItem.serviceM,
      mItemNa: rowItem.mItemNa,
      printOrderNo: rowItem.printOrderNo,

      // Calculated fields
      materialCost: qtyNum * rateNum,
      gstPer: 18,
      gstAmt: serviceTotal * 0.18,
      billAmt: serviceTotal * 1.18,
    }

    // Get current bills
    const existing = localStorage.getItem('velson_service_bills')
    let bills = []
    if (existing) {
      try {
        bills = JSON.parse(existing)
      } catch (e) {}
    }

    if (editId) {
      // Update
      bills = bills.map(b => b.id === editId ? billRecord : b)
      toast.success('Service Bill updated successfully!')
    } else {
      // Create new
      bills.push(billRecord)
      toast.success('Service Bill saved successfully!')
    }

    localStorage.setItem('velson_service_bills', JSON.stringify(bills))
    
    // Redirect to details list view
    setTimeout(() => {
      navigate('/sales/service-bill-details')
    }, 1000)
  }

  // 2. Delete Row Logic
  const handleDeleteRow = () => {
    setRowItem({
      itemName: '',
      barcode: '',
      uom: '',
      qty: '0',
      rate: '0.00',
      labourCharge: '0.00',
      issueNo: '',
      jobNo: '',
      receiver: '',
      miRe: '',
      bookingCode: '',
      vehicleType: '',
      serviceM: '',
      mItemNa: '',
      printOrderNo: ''
    })
    toast.success('Active row details cleared!')
  }

  // 3. Print Action
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-2.5 py-1.5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Service Bill Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[12.5px] font-black text-slate-800 uppercase tracking-tight">Service Bill Entry</h2>
            </div>
          </div>

          <div className="p-3 flex-1 flex flex-col">
            {/* Form Section (3 Columns) */}
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 items-start">
                
                {/* Column 1: Billing Core */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Ref .No</Label>
                      <Input value={form.refNo} onChange={e => handleInputChange('refNo', e.target.value)} className="w-full bg-slate-50/50" />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={form.billDate} onChange={e => handleInputChange('billDate', e.target.value)} className="w-full" />
                    </div>
                  </div>
                  <div>
                    <Label required>Service No</Label>
                    <Input value={form.serviceNo} onChange={e => handleInputChange('serviceNo', e.target.value)} className="w-full bg-slate-50/50 font-bold text-[#0097A7]" />
                  </div>
                  <div>
                    <Label required>Party Name</Label>
                    <Input value={form.partyName} onChange={e => handleInputChange('partyName', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Cus.Code</Label>
                    <Input value={form.cusCode} onChange={e => handleInputChange('cusCode', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Tax Type</Label>
                    <Select className="w-full" options={['Local', 'Central']} value={form.taxType} onChange={e => handleInputChange('taxType', e.target.value)} />
                  </div>
                </div>

                {/* Column 2: Address & Key Details */}
                <div className="space-y-2">
                  <div>
                    <Label>Address</Label>
                    <textarea
                      value={form.address}
                      onChange={e => handleInputChange('address', e.target.value)}
                      placeholder="Enter full address"
                      rows={2}
                      className="w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm resize-none"
                    />
                  </div>
                  <div>
                    <Label>Service Job .No</Label>
                    <Input value={form.serviceJobNo} onChange={e => handleInputChange('serviceJobNo', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Serial No</Label>
                    <Input value={form.serialNo} onChange={e => handleInputChange('serialNo', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Service Part No</Label>
                    <Select className="w-full" options={['PART-9021', 'PART-3829', 'PART-1102']} value={form.servicePartNo} onChange={e => handleInputChange('servicePartNo', e.target.value)} />
                  </div>
                </div>

                {/* Column 3: Vehicle Information */}
                <div className="space-y-2">
                  <div>
                    <Label>Vehicle No</Label>
                    <Input value={form.vehicleNo} onChange={e => handleInputChange('vehicleNo', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Vehicle Name</Label>
                    <Input value={form.vehicleName} onChange={e => handleInputChange('vehicleName', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Vehicle Count</Label>
                    <Input value={form.vehicleCount} onChange={e => handleInputChange('vehicleCount', e.target.value)} className="w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Model No</Label>
                      <Input value={form.vehicleModelNo} onChange={e => handleInputChange('vehicleModelNo', e.target.value)} className="w-full" />
                    </div>
                    <div>
                      <Label>Sub Type</Label>
                      <Input value={form.modelSubType} onChange={e => handleInputChange('modelSubType', e.target.value)} className="w-full" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons aligned to the right */}
              <div className="flex gap-2 pt-2 mt-2 border-t border-slate-200/80 justify-end">
                <button 
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm active:scale-95"
                >
                  <Eye size={16} /> Preview Bill
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm active:scale-95"
                >
                  <Save size={16} /> Save
                </button>
                <button 
                  onClick={handleDeleteRow}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[13px] font-semibold rounded transition-colors shadow-sm active:scale-95"
                >
                  <Trash2 size={16} /> Delete Row
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[2800px] bg-white">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide whitespace-nowrap border-r border-slate-200 w-10 text-center">*</th>
                    {[
                      { label: 'S.No', w: 'w-12' },
                      { label: 'Item Name', w: 'w-80' },
                      { label: 'Barcode', w: 'w-40' },
                      { label: 'UOM', w: 'w-20' },
                      { label: 'Qty', w: 'w-20' },
                      { label: 'Rate', w: 'w-24' },
                      { label: 'Labour Charge', w: 'w-24' }, // Inserted Labour Charge column after Rate
                      { label: 'Total Amt', w: 'w-28' },
                      { label: 'Issue No', w: 'w-32' },
                      { label: 'Job.No', w: 'w-32' },
                      { label: 'Receiver', w: 'w-44' },
                      { label: 'MI_Re', w: 'w-20' },
                      { label: 'Booking Code', w: 'w-32' },
                      { label: 'Vehicle Type', w: 'w-36' },
                      { label: 'Service_M', w: 'w-28' },
                      { label: 'M.Item_Na', w: 'w-44' },
                      { label: 'Print OrderNo', w: 'w-36' }
                    ].map((h, i) => (
                      <th key={i} className={`text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {/* First row with bound state controls */}
                  <tr className="hover:bg-[#f0f9fa]/40 transition-colors group">
                    <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                      <Plus size={10} className="text-[#0097A7] fill-[#0097A7]" />
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">1</td>
                    
                    {/* Item Name */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.itemName} 
                        onChange={e => handleRowChange('itemName', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* Barcode */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.barcode} 
                        onChange={e => handleRowChange('barcode', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* UOM */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.uom} 
                        onChange={e => handleRowChange('uom', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                      />
                    </td>
                    
                    {/* Qty */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        type="number" 
                        value={rowItem.qty} 
                        onChange={e => handleRowChange('qty', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-right font-semibold" 
                      />
                    </td>
                    
                    {/* Rate */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        type="number" 
                        value={rowItem.rate} 
                        onChange={e => handleRowChange('rate', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-right font-semibold" 
                      />
                    </td>
                    
                    {/* Labour Charge */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        type="number" 
                        value={rowItem.labourCharge} 
                        onChange={e => handleRowChange('labourCharge', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-right font-semibold text-[#0097A7]" 
                      />
                    </td>
                    
                    {/* Total Amt (Calculated) */}
                    <td className="px-2 py-1.5 border-r border-slate-200 text-right font-bold text-slate-700">
                      {totalAmt.toFixed(2)}
                    </td>
                    
                    {/* Issue No */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.issueNo} 
                        onChange={e => handleRowChange('issueNo', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* Job No */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.jobNo} 
                        onChange={e => handleRowChange('jobNo', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* Receiver */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.receiver} 
                        onChange={e => handleRowChange('receiver', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* MI_Re */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.miRe} 
                        onChange={e => handleRowChange('miRe', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                      />
                    </td>
                    
                    {/* Booking Code */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.bookingCode} 
                        onChange={e => handleRowChange('bookingCode', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* Vehicle Type */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.vehicleType} 
                        onChange={e => handleRowChange('vehicleType', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* Service_M */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.serviceM} 
                        onChange={e => handleRowChange('serviceM', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* M.Item_Na */}
                    <td className="p-0 border-r border-slate-200">
                      <input 
                        value={rowItem.mItemNa} 
                        onChange={e => handleRowChange('mItemNa', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                    
                    {/* Print OrderNo */}
                    <td className="p-0">
                      <input 
                        value={rowItem.printOrderNo} 
                        onChange={e => handleRowChange('printOrderNo', e.target.value)} 
                        className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                      />
                    </td>
                  </tr>

                  {/* Reduced empty rows to preserve table layout structure but prevent screen scrolling */}
                  {[...Array(1)].map((_, i) => (
                    <tr key={i} className="h-6">
                      <td className="border-r border-slate-100 bg-slate-50/10"></td>
                      {[...Array(16)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-2 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                {/* <FileText size={11} className="text-[#0097A7]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Maintenance Service & Labor Billing Console</span> */}
              </div>
              <div className="flex items-center gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {/* Job Cards: <span className="text-[#0097A7]">1</span> */}
                <span className="w-px h-3 bg-slate-200" />
                Service Total: <span className="text-emerald-600">₹{serviceTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bill Preview Modal overlay ── */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-400 w-5 h-5" />
                <span className="text-[14px] font-bold uppercase tracking-wider">Service Bill Invoice Preview</span>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable invoice */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50" id="print-area">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-3xl mx-auto space-y-6">
                
                {/* Invoice Header Branding */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">VELSON</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Industrial Maintenance & Services</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">SERVICE INVOICE</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Ref No: #{form.refNo}</p>
                    <p className="text-xs text-slate-500 font-semibold">Date: {form.billDate}</p>
                  </div>
                </div>

                {/* Billing details split layout */}
                <div className="grid grid-cols-2 gap-8 text-[12px] border-b border-slate-100 pb-6">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</h4>
                    <p className="font-bold text-slate-800 text-[13px]">{form.partyName || 'N/A'}</p>
                    <p className="text-slate-500 mt-1 font-semibold">Code: {form.cusCode || 'N/A'}</p>
                    <p className="text-slate-500 mt-1.5 whitespace-pre-wrap leading-relaxed">{form.address || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-widest mb-2">Service & Vehicle Info</h4>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600 font-semibold">
                      <span>Service No:</span>
                      <span className="text-slate-800 font-bold">{form.serviceNo}</span>
                      
                      <span>Job No:</span>
                      <span className="text-slate-800">{form.serviceJobNo || 'N/A'}</span>

                      <span>Vehicle No:</span>
                      <span className="text-slate-800">{form.vehicleNo || 'N/A'}</span>

                      <span>Model:</span>
                      <span className="text-slate-800">{form.vehicleModelNo} ({form.modelSubType || 'N/A'})</span>

                      <span>Name:</span>
                      <span className="text-slate-800">{form.vehicleName || 'N/A'}</span>

                      <span>Serial No:</span>
                      <span className="text-slate-800">{form.serialNo || 'N/A'}</span>

                      <span>Tax Type:</span>
                      <span className="text-slate-800">{form.taxType}</span>
                    </div>
                  </div>
                </div>

                {/* Items Grid */}
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 w-12 text-center">#</th>
                      <th className="py-2.5">Item Name</th>
                      <th className="py-2.5 text-center">UOM</th>
                      <th className="py-2.5 text-right w-16">Qty</th>
                      <th className="py-2.5 text-right w-24">Rate</th>
                      <th className="py-2.5 text-right w-28">Labour Charge</th>
                      <th className="py-2.5 text-right w-28">Total Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {rowItem.itemName ? (
                      <tr>
                        <td className="py-3 text-center text-slate-400">1</td>
                        <td className="py-3">
                          <div>{rowItem.itemName}</div>
                          {rowItem.barcode && <div className="text-[10px] text-slate-400 mt-0.5">Barcode: {rowItem.barcode}</div>}
                        </td>
                        <td className="py-3 text-center">{rowItem.uom || 'NOS'}</td>
                        <td className="py-3 text-right">{rowItem.qty}</td>
                        <td className="py-3 text-right">₹{Number(rowItem.rate).toFixed(2)}</td>
                        <td className="py-3 text-right text-emerald-600">₹{Number(rowItem.labourCharge).toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-slate-800">₹{totalAmt.toFixed(2)}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400 italic">No billable items entered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Summary Section */}
                <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                  <div className="text-[11px] text-slate-400 font-semibold italic">
                    Thank you for partnering with Velson Services.
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">GRAND TOTAL</span>
                    <span className="text-2xl font-black text-[#0097A7]">₹{serviceTotal.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
              <span className="text-[11px] text-slate-400 font-semibold">
                Use Ctrl+P or the Print button to print this page.
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-colors shadow-md"
                >
                  <Printer size={15} /> Print Invoice
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[12px] font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
