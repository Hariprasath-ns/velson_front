import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight, X, Save, Trash2, Plus, 
  Wrench, ClipboardList, LayoutGrid, FileText, Eye, Printer
} from 'lucide-react'
import { useToast } from '../components/Toast'
import logo from '../assets/logo.png'
import api from '../services/api'

// Helper to format date as DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

// Helper to format numbers with commas and decimals
const formatNumber = (num, decimals = 2) => {
  const parsed = Number(num)
  if (isNaN(parsed)) return '0.00'
  return parsed.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// ── Shared UI primitives ──
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
    value={value || ''}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ options = [], placeholder = '-- Select --', value, onChange, className = "", children }) => (
  <div className={`relative ${className}`}>
    <select
      value={value || ''}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {children ? children : options.map(o => (
        <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>
          {typeof o === 'object' ? o.label : o}
        </option>
      ))}
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
  const location = useLocation()
  
  // Edit mode from router state
  const editId = location.state?.id || location.state?.editId || null

  // Master Data State
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [serviceSpares, setServiceSpares] = useState([])
  const [itemMaster, setItemMaster] = useState([])
  const [bookingEntries, setBookingEntries] = useState([])
  const [materialIssues, setMaterialIssues] = useState([])
  const [existingBills, setExistingBills] = useState([])

  // Form Header State
  const [form, setForm] = useState({
    refNo: '',
    billDate: new Date().toISOString().split('T')[0], // DATE -> today
    serviceNo: '',
    partyName: '',
    cusCode: '',
    address: '',
    taxType: '',
    serviceJobNo: '',
    serialNo: '',
    vehicleCount: '1',
    vehicleNo: '',
    vehicleModelNo: '',
    modelSubType: '',
    vehicleName: '',
    servicePartNo: '',
  })

  // Table Rows State (Multiple rows support)
  const [rows, setRows] = useState([
    {
      slNo: 1,
      itemName: '',
      barcode: '',
      uom: 'NOS',
      qty: '0',
      rate: '0.00',
      labourCharge: '0.00',
      issueNo: '',
      jobNo: '',
      receiver: '',
      miRe: 'NO',
      bookingCode: '',
      vehicleType: '',
      serviceM: '',
      mItemNa: '',
      printOrderNo: ''
    }
  ])


  // Preview Modal Toggle
  const [showPreview, setShowPreview] = useState(false)

  // Fetch Master Data and check Edit ID
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [custRes, vehRes, spareRes, beRes, itemRes, issueRes, billsRes] = await Promise.all([
          api.get('/api/customer-master'),
          api.get('/api/vehicle-master'),
          api.get('/api/service-spare'),
          api.get('/api/service-booking'),
          api.get('/api/item-master?limit=10000', { loadingMessage: 'Loading items...' }),
          api.get('/api/material-issue'),
          api.get('/api/service-bill').catch(() => ({ data: { data: [] } }))
        ])

        if (custRes.data?.success) setCustomers(custRes.data.data || [])
        if (vehRes.data?.success) setVehicles(vehRes.data.data || [])
        if (spareRes.data?.success) setServiceSpares(spareRes.data.data || [])
        if (itemRes.data?.success) setItemMaster(itemRes.data.data || [])
        if (beRes.data?.success) setBookingEntries(beRes.data.data || [])
        if (issueRes.data?.success) setMaterialIssues(issueRes.data.data || [])
        if (billsRes?.data?.success) setExistingBills(billsRes.data.data || [])

        if (editId) {
          // Fetch existing service bill for editing
          const billRes = await api.get(`/api/service-bill/${editId}`)
          if (billRes.data?.success && billRes.data.data) {
            const bill = billRes.data.data
            const veh = vehRes.data.data
            const bok = beRes.data.data
            setForm({
              refNo: bill.refNo || '',
              billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : '',
              serviceNo: bill.serviceNo || '',
              partyName: bill.partyName || '',
              cusCode: bill.cusCode || '',
              address: bill.address || '',
              taxType: bill.taxType || '',
              serviceJobNo: bill.serviceJobNo || '',
              serialNo: bill.serialNo || '',
              vehicleCount: String(bill.vehicleCount || '1'),
              vehicleNo: bill.vehicleNo || '',
              vehicleModelNo: bill.vehicleModelNo || '',
              modelSubType: bill.modelSubType || '',
              vehicleName: bill.vehicleName || '',
              servicePartNo: bill.servicePartNo || '',
            })
            if (bill.items && bill.items.length > 0) {
              setRows(bill.items.map(item => ({
                slNo: item.slNo,
                itemName: item.itemName || '',
                barcode: item.barcode || '',
                uom: item.uom || 'NOS',
                qty: String(item.qty || '0'),
                rate: String(item.rate || '0.00'),
                labourCharge: String(item.labourCharge || '0.00'),
                issueNo: item.issueNo || '',
                jobNo: item.jobNo || '',
                receiver: item.receiver || '',
                miRe: item.miRe || '',
                bookingCode: bok.bookingId || '',
                vehicleType: item.vehicleType || '',
                serviceM: item.serviceM || '',
                mItemNa: item.mItemNa || '',
                printOrderNo: item.printOrderNo || ''
              })))
            } else {
              setRows([])
            }
          }
        } else {
          // Fetch next ref no for new bill entry
          const refRes = await api.get('/api/service-bill/next-ref', { skipGlobalLoader: true })
          if (refRes.data?.success && refRes.data.data?.refNo) {
            setForm(prev => ({ ...prev, refNo: refRes.data.data.refNo }))
          }
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load form data')
      }
    }

    loadMasterData()
  }, [editId])

  const handleInputChange = (field, val) => {
    setForm(prev => {
      const updated = { ...prev, [field]: val }
      
      // Auto-populate when Customer changes
      if (field === 'partyName') {
        const custMatch = customers.find(c => c.customerName === val)
        if (custMatch) {
          updated.cusCode = custMatch.cCode || ''
          updated.address = [custMatch.address, custMatch.address2, custMatch.address3, custMatch.city].filter(Boolean).join(', ')
          
          // Fetch associated vehicles and auto select the first one if only one exists
          const clientVehicles = vehicles.filter(v => v.customerId === custMatch.id)
          if (clientVehicles.length === 1) {
            const v = clientVehicles[0]
            updated.vehicleNo = v.vehicleNumber || ''
            updated.vehicleName = v.vehicleName || ''
            updated.vehicleCount = String(v.vehicleCount || '1')
            updated.vehicleModelNo = v.modelName || ''
            updated.modelSubType = v.modelSubType || ''
            updated.serialNo = v.serialNumber || ''
          } else {
            updated.vehicleNo = ''
            updated.vehicleName = ''
            updated.vehicleCount = '1'
            updated.vehicleModelNo = ''
            updated.modelSubType = ''
            updated.serialNo = ''
          }
        }
      }

      // Auto-populate when Vehicle Number changes
      if (field === 'vehicleNo') {
        const vehMatch = vehicles.find(v => v.vehicleNumber === val)
        if (vehMatch) {
          updated.vehicleName = vehMatch.vehicleName || ''
          updated.vehicleCount = String(vehMatch.vehicleCount || '1')
          updated.vehicleModelNo = vehMatch.modelName || ''
          updated.modelSubType = vehMatch.modelSubType || ''
          updated.serialNo = vehMatch.serialNumber || ''
          if (vehMatch.address && !updated.address) {
            updated.address = vehMatch.address
          }
        }
      }

      // Auto-populate when Service Spare changes
      if (field === 'serviceJobNo') {
        const spareMatch = serviceSpares.find(s => s.serviceJobNo === val)
        if (spareMatch) {
          updated.serviceNo = spareMatch.serviceJobNo || ''
          updated.partyName = spareMatch.customerName || ''
          updated.cusCode = spareMatch.customerCode || ''
          updated.vehicleNo = spareMatch.vehicleNo || ''
          updated.vehicleModelNo = spareMatch.vehicleModelNo || ''
          updated.modelSubType = spareMatch.modelSubType || ''
          updated.vehicleName = spareMatch.vehicleName || ''
          updated.serialNo = spareMatch.serialNo || ''
          updated.servicePartNo = spareMatch.servicePartNo || ''
          
          const custMatch = customers.find(c => c.customerName === spareMatch.customerName || c.cCode === spareMatch.customerCode)
          if (custMatch) {
            updated.address = [custMatch.address, custMatch.address2, custMatch.address3, custMatch.city].filter(Boolean).join(', ')
          } else {
            updated.address = ''
          }

          // Populate items from service spare parts list and lookup item master details
          if (spareMatch.items && spareMatch.items.length > 0) {
            const matchedBooking = bookingEntries.find(b => b.serviceJobNo === spareMatch.serviceJobNo)
            const bCode = matchedBooking ? String(matchedBooking.bookingId) : (spareMatch.bookingCustomerCode || '')
            
            const loadedRows = spareMatch.items.map((item, idx) => {
              const matchedItem = itemMaster.find(im => im.partName?.toLowerCase() === item.partName?.toLowerCase())
              const pNo = matchedItem?.partNo || ''
              
              // Find issueNo from materialIssues matching customer and item
              const matchedIssue = materialIssues.find(issue => {
                const isSameCustomer = 
                  (issue.customerCode && issue.customerCode === spareMatch.customerCode) ||
                  (issue.customerName && issue.customerName?.toLowerCase() === spareMatch.customerName?.toLowerCase());
                if (!isSameCustomer) return false;
                return issue.items.some(i => 
                  (pNo && i.partNo?.toLowerCase() === pNo.toLowerCase()) ||
                  (item.partName && i.partName?.toLowerCase() === item.partName?.toLowerCase())
                );
              });
              const issueNoVal = matchedIssue ? matchedIssue.issueNo : '';

              return {
                slNo: idx + 1,
                itemName: item.partName || '',
                barcode: matchedItem?.partNo || '',
                uom: matchedItem?.uom || matchedItem?.unit?.name || item.uom || 'NOS',
                qty: String(item.requiredQty || '0'),
                rate: String(matchedItem?.rate || matchedItem?.purchaseRate || '0.00'),
                labourCharge: String(matchedItem?.labourCharge || '0.00'),
                issueNo: issueNoVal,
                jobNo: spareMatch.serviceJobNo || '',
                receiver: '',
                miRe: 'NO',
                bookingCode: bCode,
                vehicleType: '',
                serviceM: '',
                mItemNa: '',
                printOrderNo: ''
              }
            })
            setRows(loadedRows)
          }
        }
      }

      return updated
    })
  }

  const handleRowChange = (index, field, val) => {
    setRows(prev => prev.map((row, idx) => {
      if (idx === index) {
        const updatedRow = { ...row, [field]: val }
        if (field === 'itemName') {
          const matchedItem = itemMaster.find(im => im.partName?.toLowerCase() === val?.toLowerCase())
          if (matchedItem) {
            updatedRow.barcode = matchedItem.partNo || ''
            updatedRow.uom = matchedItem.uom || matchedItem.unit?.name || 'NOS'
            updatedRow.rate = String(matchedItem.rate || matchedItem.purchaseRate || '0.00')
            updatedRow.labourCharge = String(matchedItem.labourCharge || '0.00')

            // Lookup issueNo from materialIssues matching customer and item
            const matchedIssue = materialIssues.find(issue => {
              const isSameCustomer = 
                (issue.customerCode && issue.customerCode === form.cusCode) ||
                (issue.customerName && issue.customerName?.toLowerCase() === form.partyName?.toLowerCase());
              if (!isSameCustomer) return false;
              return issue.items.some(i => 
                (matchedItem.partNo && i.partNo?.toLowerCase() === matchedItem.partNo.toLowerCase()) ||
                (val && i.partName?.toLowerCase() === val.toLowerCase())
              );
            });
            updatedRow.issueNo = matchedIssue ? matchedIssue.issueNo : '';
          }
        }
        return updatedRow
      }
      return row
    }))
  }

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        slNo: prev.length + 1,
        itemName: '',
        barcode: '',
        uom: 'NOS',
        qty: '0',
        rate: '0.00',
        labourCharge: '0.00',
        issueNo: '',
        jobNo: form.serviceJobNo || '',
        receiver: '',
        miRe: 'NO',
        bookingCode: '',
        vehicleType: '',
        serviceM: '',
        mItemNa: '',
        printOrderNo: ''
      }
    ])
  }

  const handleDeleteRowIndex = (index) => {
    if (rows.length === 1) {
      toast.error('At least one item row is required!')
      return
    }
    setRows(prev => prev.filter((_, idx) => idx !== index).map((row, newIdx) => ({ ...row, slNo: newIdx + 1 })))
    toast.success('Row deleted successfully')
  }

  const handleDeleteRow = () => {
    setRows([
      {
        slNo: 1,
        itemName: '',
        barcode: '',
        uom: 'NOS',
        qty: '0',
        rate: '0.00',
        labourCharge: '0.00',
        issueNo: '',
        jobNo: '',
        receiver: '',
        miRe: 'NO',
        bookingCode: '',
        vehicleType: '',
        serviceM: '',
        mItemNa: '',
        printOrderNo: ''
      }
    ])
    toast.success('All item rows cleared!')
  }

  // Calculate dynamic totals for all rows
  const computedTotals = rows.reduce((acc, row) => {
    const qty = Number(row.qty) || 0
    const rate = Number(row.rate) || 0
    const labour = Number(row.labourCharge) || 0
    const rowAmt = (qty * rate) + labour
    
    acc.materialCost += (qty * rate)
    acc.labourCharge += labour
    acc.totalAmt += rowAmt
    return acc
  }, { materialCost: 0, labourCharge: 0, totalAmt: 0 })

  const serviceTotal = computedTotals.totalAmt
  const gstAmt = serviceTotal * 0.18
  const grandTotal = serviceTotal + gstAmt

  // Save Button Logic
  const handleSave = async () => {
    if (!form.partyName.trim()) {
      toast.error('CustomerName is required!')
      return
    }
    if (!form.serviceNo.trim()) {
      toast.error('Service No is required!')
      return
    }

    const payload = {
      refNo: form.refNo,
      billDate: new Date(form.billDate).toISOString(),
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
      materialCost: computedTotals.materialCost,
      labourCharge: computedTotals.labourCharge,
      gstPer: 18,
      gstAmt: gstAmt,
      billAmt: grandTotal,
      items: rows.map(r => ({
        slNo: r.slNo,
        itemName: r.itemName,
        barcode: r.barcode || null,
        uom: r.uom || null,
        qty: Number(r.qty) || 0,
        rate: Number(r.rate) || 0,
        labourCharge: Number(r.labourCharge) || 0,
        totalAmt: (Number(r.qty) || 0) * (Number(r.rate) || 0) + (Number(r.labourCharge) || 0),
        issueNo: r.issueNo || null,
        jobNo: r.jobNo || null,
        receiver: r.receiver || null,
        miRe: r.miRe || null,
        bookingCode: r.bookingCode || null,
        vehicleType: r.vehicleType || null,
        serviceM: r.serviceM || null,
        mItemNa: r.mItemNa || null,
        printOrderNo: r.printOrderNo || null,
      }))
    }

    try {
      if (editId) {
        await api.put(`/api/service-bill/${editId}`, payload)
        toast.success('Service Bill updated successfully!')
      } else {
        await api.post('/api/service-bill', payload)
        toast.success('Service Bill saved successfully!')
      }
      setTimeout(() => {
        navigate('/sales/service-bill-details')
      }, 1000)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to save Service Bill')
    }
  }

  // Print Action
  const handlePrint = () => {
    window.print()
  }

  // Filter vehicles by selected customer
  const selectedCustomerRecord = customers.find(c => c.customerName === form.partyName)
  const filteredVehicles = selectedCustomerRecord 
    ? vehicles.filter(v => v.customerId === selectedCustomerRecord.id)
    : vehicles

  // Filter out serviceJobNo options that already have active service bills (excluding current editId)
  const filteredServiceSpares = serviceSpares.filter(spare => {
    const hasActiveBill = existingBills.some(b => 
      b.serviceJobNo === spare.serviceJobNo && 
      b.status !== 'Cancelled' && 
      (!editId || b.id !== Number(editId))
    );
    return !hasActiveBill;
  });

  return (
    <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 1. Static Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sales</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Service Bill Entry</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales/service-bill-details')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded text-[12px] transition-colors shadow-sm"
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* 2. Scrollable Middle Content Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <div className="w-1.5 h-3.5 bg-red-700 rounded-sm" />
            <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Service Bill Details</h3>
          </div>

          {/* Form Section (3 Columns) */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200">
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
                    <Input type="date" value={form.billDate} onChange={e => handleInputChange('billDate', e.target.value)} className="w-full" readOnly />
                  </div>
                </div>
                <div>
                  <Label required>Service No</Label>
                  <Input value={form.serviceNo} onChange={e => handleInputChange('serviceNo', e.target.value)} className="w-full bg-slate-50/50 font-bold text-[#0097A7]" />
                </div>
                <div>
                  <Label required>Customer Name</Label>
                  <Select 
                    placeholder="-- Select Customer --"
                    options={customers.map(c => ({ value: c.customerName, label: c.customerName }))}
                    value={form.partyName}
                    onChange={e => handleInputChange('partyName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cus.Code</Label>
                  <Input value={form.cusCode} readOnly className="w-full bg-slate-50/50" />
                </div>
                <div>
                  <Label>Tax Type</Label>
                  <Select className="w-full" options={['Local', 'INTER']} value={form.taxType} onChange={e => handleInputChange('taxType', e.target.value)} />
                </div>
              </div>

              {/* Column 2: Address & Key Details */}
              <div className="space-y-2">
                <div>
                  <Label>Address</Label>
                  <textarea
                    value={form.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Customer address"
                    rows={2}
                    className="w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm resize-none"
                  />
                </div>
                <div>
                  <Label>Service Job .No</Label>
                  <Select 
                    placeholder="-- Select Service Job --"
                    options={filteredServiceSpares.map(s => ({ value: s.serviceJobNo, label: s.serviceJobNo }))}
                    value={form.serviceJobNo}
                    onChange={e => handleInputChange('serviceJobNo', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Serial No</Label>
                  <Input value={form.serialNo} onChange={e => handleInputChange('serialNo', e.target.value)} className="w-full" />
                </div>
                <div>
                  <Label>Service Part No</Label>
                  <Input value={form.servicePartNo} onChange={e => handleInputChange('servicePartNo', e.target.value)} className="w-full" />
                </div>
              </div>

              {/* Column 3: Vehicle Information */}
              <div className="space-y-2">
                <div>
                  <Label>Vehicle No</Label>
                  <Select 
                    placeholder="-- Select Vehicle No --"
                    options={filteredVehicles.map(v => ({ value: v.vehicleNumber, label: v.vehicleNumber }))}
                    value={form.vehicleNo}
                    onChange={e => handleInputChange('vehicleNo', e.target.value)}
                  />
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
          </div>

          {/* Table Section */}
          <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[2800px] bg-white">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    { label: 'Action', w: 'w-16' },
                    { label: 'S.No', w: 'w-12' },
                    { label: 'Item Name', w: 'w-80' },
                    { label: 'Barcode', w: 'w-40' },
                    { label: 'UOM', w: 'w-20' },
                    { label: 'Qty', w: 'w-20' },
                    { label: 'Rate', w: 'w-24' },
                    { label: 'Labour Charge', w: 'w-24' },
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
                    <th key={i} className={`${h.label === 'Item Name' ? 'text-left pl-3' : 'text-center'} px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 whitespace-nowrap ${h.w}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {rows.map((row, index) => {
                  const qtyVal = Number(row.qty) || 0
                  const rateVal = Number(row.rate) || 0
                  const labourVal = Number(row.labourCharge) || 0
                  const rowTotal = (qtyVal * rateVal) + labourVal

                  return (
                    <tr key={index} className="hover:bg-[#f0f9fa]/40 transition-colors group">
                      {/* Action */}
                      <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                        <button 
                          onClick={() => handleDeleteRowIndex(index)}
                          className="text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                      
                      {/* S.No */}
                      <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">{row.slNo}</td>
                      
                      {/* Item Name */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.itemName} 
                          onChange={e => handleRowChange(index, 'itemName', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                        />
                      </td>
                      
                      {/* Barcode */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.barcode} 
                          onChange={e => handleRowChange(index, 'barcode', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* UOM */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.uom} 
                          onChange={e => handleRowChange(index, 'uom', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Qty */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          type="number" 
                          value={row.qty} 
                          onChange={e => handleRowChange(index, 'qty', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center font-semibold" 
                        />
                      </td>
                      
                      {/* Rate */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          type="number" 
                          value={row.rate} 
                          onChange={e => handleRowChange(index, 'rate', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center font-semibold" 
                        />
                      </td>
                      
                      {/* Labour Charge */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          type="number" 
                          value={row.labourCharge} 
                          onChange={e => handleRowChange(index, 'labourCharge', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center font-semibold text-[#0097A7]" 
                        />
                      </td>
                      
                      {/* Total Amt (Calculated) */}
                      <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold text-slate-700">
                        {rowTotal.toFixed(2)}
                      </td>
                      
                      {/* Issue No */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.issueNo} 
                          onChange={e => handleRowChange(index, 'issueNo', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Job No */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.jobNo} 
                          onChange={e => handleRowChange(index, 'jobNo', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Receiver */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.receiver} 
                          onChange={e => handleRowChange(index, 'receiver', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* MI_Re */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.miRe} 
                          onChange={e => handleRowChange(index, 'miRe', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Booking Code */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.bookingCode} 
                          onChange={e => handleRowChange(index, 'bookingCode', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Vehicle Type */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.vehicleType} 
                          onChange={e => handleRowChange(index, 'vehicleType', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Service_M */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.serviceM} 
                          onChange={e => handleRowChange(index, 'serviceM', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* M.Item_Na */}
                      <td className="p-0 border-r border-slate-200">
                        <input 
                          value={row.mItemNa} 
                          onChange={e => handleRowChange(index, 'mItemNa', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                      
                      {/* Print OrderNo */}
                      <td className="p-0">
                        <input 
                          value={row.printOrderNo} 
                          onChange={e => handleRowChange(index, 'printOrderNo', e.target.value)} 
                          className="w-full bg-transparent border-0 px-2 py-1 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded text-center" 
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Summary / Info label */}
          <div className="mt-2 flex items-center justify-between px-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 opacity-60">
              {/* <FileText size={14} className="text-[#0097A7]" /> */}
              {/* <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Maintenance Service & Labor Billing Console</span> */}
            </div>
            {/* <button 
              onClick={handleAddRow}
              className="flex items-center gap-1 px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded shadow transition-all"
            >
              <Plus size={12} /> Add Item Row
            </button> */}
          </div>
        </div>
      </div>

      {/* 3. Fixed Bottom Action Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] z-10">
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded shadow transition-all active:scale-95"
          >
            <Save size={15} /> Save Bill
          </button>
          <button 
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold rounded transition-colors shadow-sm active:scale-95"
          >
            <Eye size={15} /> Preview Bill
          </button>
          <button 
            onClick={handleDeleteRow}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[13px] font-bold rounded transition-colors shadow-sm active:scale-95"
          >
            <Trash2 size={15} /> Clear All Rows
          </button>
        </div>
        
        <div className="flex gap-6 text-[12px] font-bold text-slate-700 uppercase bg-slate-50 px-5 py-2 rounded-lg border border-slate-200">
          <div className="border-slate-200 flex items-center gap-2">
            <span>Net Amt:</span>
            <span className="text-emerald-600 font-bold text-[19px] tabular-nums font-mono">₹{formatNumber(grandTotal, 2)}</span>
          </div>
        </div>
      </div>

      {/* ── Bill Preview Modal overlay ── */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print-backdrop">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-invoice, #printable-invoice * {
                visibility: visible;
              }
              #printable-invoice {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                border: none !important;
                box-shadow: none !important;
                padding: 15mm !important;
                margin: 0 !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                box-sizing: border-box !important;
              }
              .print-spacer {
                height: 380px !important;
              }
              .no-print-backdrop, 
              .no-print-container, 
              .no-print-content-wrapper {
                position: static !important;
                display: block !important;
                background: transparent !important;
                backdrop-filter: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                width: auto !important;
                border: none !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>
          
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col no-print-container">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-400 w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Service Bill Invoice Preview</span>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Canvas */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-700 flex justify-center items-start no-print-content-wrapper">
              {/* White A4 Sheet */}
              <div 
                id="printable-invoice" 
                className="bg-white text-black p-8 shadow-2xl border border-black w-full max-w-[794px] min-h-[1123px] font-sans flex flex-col justify-between"
                style={{ boxSizing: 'border-box' }}
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    
                    {/* Header Branding Box */}
                    <div className="border border-black p-4 flex items-center">
                      <div className="flex-grow text-center">
                        <img src={logo} alt="VELSON Logo" className="h-24 w-auto object-contain mx-auto" />
                        <div className="text-[11px] font-bold mt-1 uppercase tracking-wider">SP No 98/3A, Velson Valley</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider">Sankari RS, Nagichettypatti(P.O),</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider">Sankari (TK), Salem-637302. Tamilnadu.</div>
                        <div className="text-[11px] font-bold">Ph: 8489339933</div>
                      </div>
                    </div>

                    {/* Customer & Quotation Info Box */}
                    <div className="border border-black p-4 flex justify-between items-center text-[12px] leading-relaxed">
                      <div className="w-1/3">
                        <div className="font-extrabold text-[12px] uppercase">Customer</div>
                        <div className="font-bold text-[12px] mt-0.5 uppercase">{form.partyName || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 mt-1 uppercase whitespace-pre-line">{form.address || ''}</div>
                      </div>
                      <div className="w-1/3 text-center">
                        <div className="text-md font-black tracking-widest uppercase">SERVICE INVOICE</div>
                      </div>
                      <div className="w-1/3 text-right font-bold space-y-1">
                        <div>
                          INVOICE No: <span className="font-normal">{form.refNo || 'N/A'}</span>
                        </div>
                        <div>
                          SERVICE No: <span className="font-normal">{form.serviceNo || 'N/A'}</span>
                        </div>
                        <div>
                          DATE: <span className="font-normal">{formatDate(form.billDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items Grid Table */}
                    <table className="w-full text-left border-collapse border border-black text-[12px]">
                      <thead>
                        <tr className="border-b border-black font-bold align-middle" style={{ height: '30px', left: '0'}}>
                          <th className="border-r border-black px-2 py-1 text-center w-[6%]">S.No</th>
                          <th className="border-r border-black px-3 py-1 text-center w-[38%]">Description of Goods</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[8%]">Qty</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[8%]">UOM</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[12%]">Rate</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[14%]">Labour Charge</th>
                          <th className="px-2 py-1 text-center w-[14%]">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => {
                          const rQty = Number(row.qty) || 0
                          const rRate = Number(row.rate) || 0
                          const rLabour = Number(row.labourCharge) || 0
                          const rTotal = (rQty * rRate) + rLabour
                          return (
                            <tr key={index} className="border-b border-black align-middle font-semibold" style={{ height: '35px' }}>
                              <td className="border-r border-black px-2 py-1 text-center">{row.slNo}</td>
                              <td className="border-r border-black px-3 py-1 text-center uppercase">{row.itemName}</td>
                              <td className="border-r border-black px-2 py-1 text-center">{formatNumber(rQty, 2)}</td>
                              <td className="border-r border-black px-2 py-1 text-center uppercase">{row.uom || 'Nos'}</td>
                              <td className="border-r border-black px-2 py-1 text-right pr-4">{formatNumber(rRate, 2)}</td>
                              <td className="border-r border-black px-2 py-1 text-right pr-4">{formatNumber(rLabour, 2)}</td>
                              <td className="px-2 py-1 text-right pr-4 font-bold">{formatNumber(rTotal, 2)}</td>
                            </tr>
                          )
                        })}

                        {/* Continuous Vertical Lines Spacer Row */}
                        <tr style={{ height: '380px' }} className="align-top print-spacer">
                          <td className="border-r border-black px-2 py-2 w-[6%]"></td>
                          <td className="border-r border-black px-3 py-2 w-[38%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[8%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[8%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[12%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[14%]"></td>
                          <td className="px-2 py-2 w-[14%]"></td>
                        </tr>

                        {/* Totals Block */}
                        <tr className="border-t border-black font-bold">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            Taxable Amount :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold">
                            {formatNumber(serviceTotal, 2)}
                          </td>
                        </tr>
                        <tr className="border-t border-black font-bold">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            CGST(9.00) % :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold">
                            {formatNumber(serviceTotal * 0.09, 2)}
                          </td>
                        </tr>
                        <tr className="border-t border-black font-bold">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            SGST(9.00) % :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold">
                            {formatNumber(serviceTotal * 0.09, 2)}
                          </td>
                        </tr>
                        <tr className="border-t border-black font-bold bg-slate-50">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            Grand Total :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold text-[14px]">
                            {formatNumber(grandTotal, 2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-900 text-white no-print">
              <span className="text-[11px] text-slate-400 font-semibold">
                Use Ctrl+P or the Print button to print this page.
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold rounded-lg transition-colors shadow-md active:scale-95"
                >
                  <Printer size={15} /> Print Invoice
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[12px] font-bold rounded-lg transition-colors active:scale-95"
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
