import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Save, Trash2, Plus,
  FileText, ClipboardCheck, LayoutGrid, Truck
} from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children, required, className = "" }) => (
  <label className={`block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 whitespace-nowrap ${className}`}>
    {required && <span className="text-red-500 font-bold mr-1">*</span>}
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "", readOnly = false }) => (
  <input
    type={type}
    value={value || ''}
    onChange={onChange}
    readOnly={readOnly || !onChange}
    placeholder={placeholder}
    className={`px-2.5 py-1 text-[11px] h-[32px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 shadow-sm ${readOnly || !onChange ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ value, onChange, options = [], className = "", placeholder = "-- Select --" }) => (
  <div className={`relative w-full ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2.5 py-1 pr-6 text-[11px] h-[32px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

export default function QuotationSales() {
  const toast = useToast()

  // Form State
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0])
  const [customers, setCustomers] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [address, setAddress] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [quotationNo, setQuotationNo] = useState('001')
  const [quotationAc, setQuotationAc] = useState('General Sales A/c')
  const [contactPerson, setContactPerson] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [deliveryPlace, setDeliveryPlace] = useState('')
  const [deliveryTo, setDeliveryTo] = useState('')
  const [transport, setTransport] = useState('')
  const [remarks, setRemarks] = useState('')

  // Item Masters & Grid Rows State
  const [itemMasters, setItemMasters] = useState([])
  const [gridRows, setGridRows] = useState([
    { id: 1, itemId: '', partNo: '', itemName: '', spec: '', brand: '', uom: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', netAmt: '0.00' }
  ])
  const [selectedRowId, setSelectedRowId] = useState(1)

  // Loaded quotations lists
  const [quotations, setQuotations] = useState([])
  const [editingId, setEditingId] = useState(null)

  const fetchNextQuotationNo = async () => {
    try {
      const res = await api.get('/api/quotation-master/next-no')
      if (res.data?.success && res.data?.quotationNo) {
        setQuotationNo(res.data.quotationNo)
      } else {
        setQuotationNo('001')
      }
    } catch (err) {
      setQuotationNo('001')
    }
  }

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/api/quotation-master')
      if (res.data?.success) {
        setQuotations(res.data.data || [])
      }
    } catch (err) {
      console.error("Failed to load quotations:", err)
    }
  }

  const fetchItemMasters = async () => {
    try {
      const res = await api.get('/api/item-master?limit=1000')
      if (res.data?.success) {
        setItemMasters(res.data.data || [])
      }
    } catch (err) {
      console.error("Failed to load item master list:", err)
    }
  }

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/api/customer-master', { skipGlobalLoader: true })
        if (res.data?.success) {
          setCustomers(res.data.data || [])
        }
      } catch (err) {
        console.error("Failed to load customer list:", err)
      }
    }
    fetchCustomers()
    fetchQuotations()
    fetchItemMasters()
    fetchNextQuotationNo()
  }, [])

  const handleCustomerInputChange = (val) => {
    setCustomerName(val)
    if (!val) {
      setSuggestions(customers)
      return
    }
    const filtered = customers.filter(c =>
      c.customerName?.toLowerCase().includes(val.toLowerCase())
    )
    setSuggestions(filtered)
    setShowSuggestions(true)
  }

  const handleSelectCustomer = (c) => {
    setCustomerName(c.customerName || '')
    setCustomerId(c.id)
    const addrParts = [c.address, c.address2, c.address3, c.address4, c.city, c.state, c.pinCode]
      .filter(Boolean)
    setAddress(addrParts.join(', '))
    setContactPerson(c.contactPerson || '')
    setContactNo(c.mobile || c.phone || '')
    setShowSuggestions(false)
  }

  // Row Amount calculation
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

    const netAmt = totalAmt - discAmt - (Number(row.discAmt2) || 0)

    return {
      ...row,
      netRate: rate.toFixed(2),
      totalAmt: totalAmt.toFixed(2),
      discAmt: discAmt.toFixed(2),
      netAmt: netAmt.toFixed(2)
    }
  }

  const handleRowChange = (id, key, val) => {
    const updated = gridRows.map(row => {
      if (row.id === id) {
        let updatedRow = { ...row, [key]: val }

        if (key === 'itemId') {
          const item = itemMasters.find(i => String(i.id) === String(val))
          if (item) {
            updatedRow.itemId = item.id
            updatedRow.partNo = item.partNo || ''
            updatedRow.itemName = item.partName || ''
            updatedRow.spec = item.description || ''
            updatedRow.brand = item.brand || ''
            updatedRow.uom = item.uom || ''
            updatedRow.rate = String(item.rate || item.purchaseRate || '0.00')
            updatedRow.netRate = String(item.rate || item.purchaseRate || '0.00')
          } else {
            updatedRow.itemId = ''
            updatedRow.partNo = ''
            updatedRow.itemName = ''
            updatedRow.spec = ''
            updatedRow.brand = ''
            updatedRow.uom = ''
            updatedRow.rate = '0.00'
            updatedRow.netRate = '0.00'
          }
        }

        return calculateRow(updatedRow)
      }
      return row
    })

    const lastRow = gridRows[gridRows.length - 1]
    if (lastRow.id === id && key === 'itemId' && val !== '') {
      const newId = Math.max(...updated.map(r => r.id)) + 1
      const newRow = { id: newId, itemId: '', partNo: '', itemName: '', spec: '', brand: '', uom: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', netAmt: '0.00' }
      setGridRows([...updated, newRow])
      setSelectedRowId(newId)
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

  const totalBillAmt = gridRows.reduce((sum, row) => sum + (Number(row.netAmt) || 0), 0)

  const handleSave = async () => {
    if (!quotationNo) {
      toast.warning('Quotation Number is required')
      return
    }
    if (!customerName) {
      toast.warning('Customer Name is required')
      return
    }

    let activeCustomerId = customerId
    if (!activeCustomerId) {
      const match = customers.find(c => c.customerName === customerName)
      if (match) {
        activeCustomerId = match.id
      }
    }
    if (!activeCustomerId) {
      toast.warning('Please select a valid customer from the suggestions list')
      return
    }

    const savedItems = gridRows.filter(r => r.itemId !== '')
    if (savedItems.length === 0) {
      toast.warning('Please select at least one item')
      return
    }

    const payload = {
      quotationNo,
      financialYear: '26-27',
      customerId: activeCustomerId,
      quotationType: quotationAc,
      quotationDate: billDate,
      taxType: 'Exempted',
      address,
      contactPerson,
      contactNo,
      deliveryPlace,
      deliveryTo,
      transport,
      remarks,
      subTotal: totalBillAmt,
      taxAmount: 0,
      totalAmount: totalBillAmt,
      items: savedItems.map((r, i) => ({
        itemId: r.itemId,
        partNo: r.partNo,
        itemName: r.itemName,
        description: r.spec,
        uom: r.uom,
        qty: Number(r.qty) || 1,
        unitPrice: Number(r.rate) || 0,
        amount: Number(r.netAmt) || 0,
        slNo: i + 1
      }))
    }

    try {
      if (editingId) {
        await api.put(`/api/quotation-master/${editingId}`, payload)
        toast.success('Quotation updated successfully')
      } else {
        await api.post('/api/quotation-master', payload)
        toast.success('Quotation created successfully')
      }
      handleCancel()
      fetchQuotations()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save quotation: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleCancel = () => {
    setQuotationAc('General Sales A/c')
    fetchNextQuotationNo()
    setBillDate(new Date().toISOString().split('T')[0])
    setCustomerName('')
    setCustomerId(null)
    setAddress('')
    setContactPerson('')
    setContactNo('')
    setDeliveryPlace('')
    setDeliveryTo('')
    setTransport('')
    setRemarks('')
    setEditingId(null)
    setGridRows([
      { id: 1, itemId: '', partNo: '', itemName: '', spec: '', brand: '', uom: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', netAmt: '0.00' }
    ])
    setSelectedRowId(1)
  }

  const handleDelete = async () => {
    if (!editingId) {
      toast.warning('No quotation selected for deletion')
      return
    }
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return
    }
    try {
      await api.delete(`/api/quotation-master/${editingId}`)
      toast.success('Quotation deleted successfully')
      handleCancel()
      fetchQuotations()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete quotation: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRowClick = (row) => {
    setEditingId(row.id)
    setQuotationAc(row.quotationType || 'General Sales A/c')
    setQuotationNo(row.quotationNo || '')
    setBillDate(row.quotationDate ? new Date(row.quotationDate).toISOString().split('T')[0] : '')
    setCustomerName(row.customer?.customerName || row.customerName || '')
    setCustomerId(row.customerId || null)
    setAddress(row.address || '')
    setContactPerson(row.contactPerson || '')
    setContactNo(row.contactNo || '')
    setDeliveryPlace(row.deliveryPlace || '')
    setDeliveryTo(row.deliveryTo || '')
    setTransport(row.transport || '')
    setRemarks(row.remarks || '')

    if (row.details && row.details.length > 0) {
      setGridRows(row.details.map((d, i) => ({
        id: d.id || i + 1,
        itemId: d.itemId || '',
        partNo: d.partNo || '',
        itemName: d.itemName || '',
        spec: d.description || '',
        brand: d.brand || '',
        uom: d.uom || '',
        qty: String(d.qty || 1),
        rate: String(d.unitPrice || 0),
        netRate: String(d.unitPrice || 0),
        totalAmt: String((d.qty * d.unitPrice).toFixed(2)),
        dType: '%',
        discPercent: '0',
        discAmt: '0.00',
        discAmt2: '0.00',
        netAmt: String(d.amount || 0)
      })))
      setSelectedRowId(row.details[0]?.id || 1)
    } else {
      setGridRows([
        { id: 1, itemId: '', partNo: '', itemName: '', spec: '', brand: '', uom: '', qty: '1', netRate: '0.00', rate: '0.00', totalAmt: '0.00', dType: '%', discPercent: '0', discAmt: '0.00', discAmt2: '0.00', netAmt: '0.00' }
      ])
      setSelectedRowId(1)
    }
    toast.info(`Loaded quotation ${row.quotationNo} for editing`)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3.5 uppercase font-bold tracking-wider">
          <span className="hover:text-[#0097A7] cursor-pointer">Sales</span> <ChevronRight size={11} /> <span className="text-[#0097A7]">Quotation Sales</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
            <span className="font-bold text-[13px] uppercase tracking-wider">Create - Quotation Sales</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Form layout */}
            <div className="grid grid-cols-12 gap-x-8 gap-y-2.5 mb-5 max-w-7xl mx-auto">
              
              {/* Column 1 (Left) */}
              <div className="col-span-6 space-y-2.5">
                {/* Quotation A/c */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label required>Quotation A/c :</Label>
                  </div>
                  <div className="col-span-8">
                    <Select
                      options={['General Sales A/c', 'Direct Sales A/c', 'Contract Sales A/c']}
                      placeholder="Select Sales A/c..."
                      value={quotationAc}
                      onChange={e => setQuotationAc(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quotation No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label required>Qu. No :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="!font-bold text-[#0097A7] w-full" />
                  </div>
                </div>

                {/* Quot Date */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label required>Quot. Date :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full" />
                  </div>
                </div>

                {/* Party Name Autocomplete */}
                <div className="grid grid-cols-12 gap-2 items-center relative z-50">
                  <div className="col-span-4 text-right pr-1">
                    <Label required>Party Name :</Label>
                  </div>
                  <div className="col-span-8 relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => handleCustomerInputChange(e.target.value)}
                      onFocus={() => {
                        setSuggestions(customers)
                        setShowSuggestions(true)
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full px-2.5 py-1 pr-6 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all shadow-sm"
                      placeholder="Select / Type Party"
                    />
                    <button
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault()
                        setSuggestions(customers)
                        setShowSuggestions(!showSuggestions)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[8px]"
                    >
                      ▼
                    </button>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                        {suggestions.map((c, i) => (
                          <div
                            key={i}
                            onMouseDown={() => handleSelectCustomer(c)}
                            className="px-3 py-2 text-[12.5px] hover:bg-[#0097A7] hover:text-white cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            {c.customerName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4 text-right pr-1 pt-1">
                    <Label>Address :</Label>
                  </div>
                  <div className="col-span-8">
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter address details..."
                      rows={2}
                      className="w-full px-2.5 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 resize-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Con. Person */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Con. Person :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Contact Person Name" className="w-full" />
                  </div>
                </div>

                {/* Contact No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-right pr-1">
                    <Label>Contact No :</Label>
                  </div>
                  <div className="col-span-8">
                    <Input value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="Contact Number" className="w-full" />
                  </div>
                </div>
              </div>

              {/* Column 2 (Right) */}
              <div className="col-span-6 space-y-2.5 border-l border-slate-100 pl-8">
                {/* Delivery Place */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-right pr-1">
                    <Label>Delivery Pl :</Label>
                  </div>
                  <div className="col-span-9">
                    <Input value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} placeholder="Delivery Destination" className="w-full" />
                  </div>
                </div>

                {/* Delivery To */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-3 text-right pr-1 pt-1">
                    <Label>Delivery To :</Label>
                  </div>
                  <div className="col-span-9">
                    <textarea
                      value={deliveryTo}
                      onChange={e => setDeliveryTo(e.target.value)}
                      placeholder="Receiver Details / Site Address..."
                      rows={2}
                      className="w-full px-2.5 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 resize-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-3 text-right pr-1 pt-1">
                    <Label>Remark's :</Label>
                  </div>
                  <div className="col-span-9">
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Enter remarks..."
                      rows={2}
                      className="w-full px-2.5 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all hover:border-slate-400 resize-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Transport */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-right pr-1">
                    <Label>Transport :</Label>
                  </div>
                  <div className="col-span-9">
                    <Input value={transport} onChange={e => setTransport(e.target.value)} placeholder="Vehicle / Agency" className="w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Panel above Items grid */}
            <div className="max-w-7xl mx-auto flex items-center justify-end border-t border-slate-100 pt-3.5 mb-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 uppercase tracking-wider h-[30px]"
                >
                  <Save size={13} /> {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={handleDeleteRow}
                  className="flex items-center gap-1 px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 uppercase tracking-wide h-[30px]"
                  title="Delete Selected Grid Row"
                >
                  <Trash2 size={12} /> Delete Selected Item Row
                </button>
              </div>
            </div>

            {/* Items Header */}
            <div className="max-w-7xl mx-auto bg-[#0097A7] text-white px-4 py-1.5 rounded-t-lg font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-between">
              <span>Items (Quotation Details)</span>
              <span className="text-[10px] font-normal lowercase italic text-cyan-100">Pick item from Item Master dropdown to auto-fill details</span>
            </div>

            {/* Items Grid */}
            <div className="max-w-7xl mx-auto border border-slate-200 rounded-b-lg overflow-hidden shadow-sm bg-white mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 h-8">
                      <th className="px-2.5 py-1 border-r border-slate-100 w-12 text-center">S.No</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-44">Part Number / Item</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-52">Item Name</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-52">Specification</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-28">Brand</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-20 text-center">UOM</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-16 text-center">Qty</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Rate</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Total Amt</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-18 text-center">D.Type</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-20 text-center">Disc% / Amt</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Disc Amt</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-24 text-right">Disc Amt2</th>
                      <th className="px-2.5 py-1 text-right w-28">Net Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px]">
                    {gridRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id)}
                        className={`hover:bg-[#0097A7]/5 cursor-pointer h-9 transition-colors ${selectedRowId === row.id ? 'bg-[#0097A7]/10 font-semibold' : ''}`}
                      >
                        <td className="px-2.5 py-1 border-r border-slate-50 text-center text-slate-500 font-bold bg-slate-50/50">
                          {idx + 1}
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <select
                            value={row.itemId}
                            onChange={e => handleRowChange(row.id, 'itemId', e.target.value)}
                            className="w-full h-[30px] px-1 py-0 text-[12px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white text-slate-700 hover:border-slate-300"
                          >
                            <option value="">-- Pick Item --</option>
                            {itemMasters.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.partNo} {item.partName ? `- ${item.partName}` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input
                            type="text"
                            value={row.itemName}
                            readOnly
                            className="w-full h-[30px] px-2 text-[12px] border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input
                            type="text"
                            value={row.spec}
                            readOnly
                            className="w-full h-[30px] px-2 text-[12px] border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input
                            type="text"
                            value={row.brand}
                            readOnly
                            className="w-full h-[30px] px-2 text-[12px] border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-center">
                          <input
                            type="text"
                            value={row.uom}
                            readOnly
                            className="w-full h-[30px] px-1 text-[12px] text-center border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-center">
                          <input
                            type="number"
                            value={row.qty}
                            onChange={e => handleRowChange(row.id, 'qty', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12px] text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input
                            type="number"
                            value={row.rate}
                            onChange={e => handleRowChange(row.id, 'rate', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12px] text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] outline-none font-medium"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right font-bold text-slate-600 bg-slate-50/20">{row.totalAmt}</td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <select
                            value={row.dType}
                            onChange={e => handleRowChange(row.id, 'dType', e.target.value)}
                            className="w-full h-[30px] px-1 py-0 text-[12px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white text-slate-700"
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
                            className="w-full h-[30px] px-1 text-[12px] text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-50 text-right text-slate-500 font-semibold bg-slate-50/20">{row.discAmt}</td>
                        <td className="px-2.5 py-1 border-r border-slate-50">
                          <input
                            type="number"
                            value={row.discAmt2}
                            onChange={e => handleRowChange(row.id, 'discAmt2', e.target.value)}
                            className="w-full h-[30px] px-1 text-[12px] text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0097A7] outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1 text-right font-black text-[#0097A7] bg-slate-50/40">{row.netAmt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* List of Saved Quotations Table */}
            <div className="max-w-7xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Saved Sales Quotations</h3>
              <div className="border border-slate-200 rounded-lg overflow-auto bg-white max-h-[300px]">
                <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                  <thead className="bg-slate-50 text-[9px] uppercase text-slate-600 font-extrabold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-1 py-1 border-r border-slate-200 w-[4%] text-center">S.No</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[10%]">Quotation A/C</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[10%]">Qu. No</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[10%]">Quot. Date</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[18%]">Party Name</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[20%]">Address</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[12%]">Contact Person</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[12%]">Contact No</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[12%]">Total Amount</th>
                      <th className="px-1 py-1 border-r border-slate-200 w-[15%]">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10.5px]">
                    {quotations.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-6 text-slate-400 italic">No quotations entered yet.</td>
                      </tr>
                    ) : (
                      quotations.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-[#f0f9fa]/30 transition-colors group cursor-pointer" onClick={() => handleRowClick(row)}>
                          <td className="px-1 py-1 border-r border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.quotationType || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate font-bold text-[#0097A7]">{row.quotationNo || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.quotationDate ? new Date(row.quotationDate).toLocaleDateString() : '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate font-bold text-slate-700">{row.customer?.customerName || row.customerName || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.address || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.contactPerson || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.contactNo || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 text-right font-bold text-[#0097A7]">{Number(row.totalAmount || 0).toFixed(2)}</td>
                          <td className="border-r border-slate-100 last:border-r-0 px-1 py-1 truncate">{row.remarks || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="max-w-7xl mx-auto flex items-center justify-between border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-1.5 opacity-35 group hover:opacity-100 transition-opacity cursor-default">
                <ClipboardCheck size={13} className="text-[#0097A7]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Quotation Sales Console</span>
              </div>
              <div className="flex items-center gap-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Total Items: <span className="text-[#0097A7]">{gridRows.filter(r => r.itemId).length}</span>
                <span className="w-px h-3 bg-slate-200" />
                Grand Total Amt: <span className="text-[#0097A7]">{totalBillAmt.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}