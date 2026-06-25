import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Save, Trash2, Plus,
  FileText, ShoppingBag, Truck
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

// ── Shared UI primitives (High-density sizing – matches ServiceBillEntry) ──
const Label = ({ children, className = "" }) => (
  <label className={`block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 whitespace-nowrap ${className}`}>
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "", readOnly = false }) => (
  <input
    type={type}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${readOnly ? 'bg-slate-50 text-slate-400 border-slate-200' : ''} ${className}`}
  />
)

const Select = ({ value, onChange, options = [], className = "", placeholder = "-- Select --", children }) => (
  <select
    value={value}
    onChange={onChange}
    className={`px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[position:right_6px_center] bg-no-repeat pr-6 ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children ? children : options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
  </select>
)

const Textarea = ({ value, onChange, placeholder, className = "", rows = 2 }) => (
  <textarea
    rows={rows}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm resize-none w-full ${className}`}
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
  const [addWords, setAddWords] = useState('')
  const [remarks, setRemarks] = useState('')

  const [salesList, setSalesList] = useState([])
  const [editingId, setEditingId] = useState(null)
  
  const toast = useToast()

  const generateNextBillNo = (list) => {
    if (!list || list.length === 0) return '001'
    const lastBill = list[list.length - 1].billNo
    const seq = parseInt(lastBill, 10)
    if (isNaN(seq)) {
      return String(list.length + 1).padStart(3, '0')
    }
    return String(seq + 1).padStart(3, '0')
  }

  const fetchSales = () => {
    try {
      const existing = localStorage.getItem('velson_credit_sales')
      if (existing) {
        const parsed = JSON.parse(existing)
        setSalesList(parsed || [])
        return parsed || []
      }
    } catch (err) {
      console.error(err)
    }
    setSalesList([])
    return []
  }

  const [customers, setCustomers] = useState([])

  useEffect(() => {
    const list = fetchSales()
    setBillNo(generateNextBillNo(list))

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
        setAddWords(match.addWords || '')
        setRemarks(match.remarks || '')
      }
      localStorage.removeItem('velson_edit_sales_id')
    }

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

    const fetchDCs = async () => {
      try {
        const res = await api.get('/api/delivery-challan', { skipGlobalLoader: true })
        if (res.data?.success) {
          setDcList(res.data.data || [])
        }
      } catch (err) {
        toast.error("Failed to load DC records from server")
      }
    }
    fetchCustomers()
    fetchDCs()
  }, [])

  const handleDcChange = (e) => {
    const val = e.target.value
    setSelectedDc(val)
    if (!val) {
      setDcDate('')
      setPartyName('')
      setAddress('')
      return
    }

    const match = dcList.find(d => d.dcNo === val)
    if (match) {
      // Format DC Date
      setDcDate(match.dcDate ? new Date(match.dcDate).toISOString().split('T')[0] : '')
      
      // Fetch Party Name from Customer Master using match.customerId
      const customerMatch = customers.find(c => c.id === match.customerId)
      setPartyName(customerMatch ? customerMatch.customerName : (match.customerName || ''))
      
      setAddress(match.customerAddress || '')
      toast.success('DC details auto-populated successfully')
    } else {
      setDcDate('')
      setPartyName('')
      setAddress('')
      toast.error('Invalid DC Number selected')
    }
  }

  const handleSave = () => {
    if (!partyName) {
      toast.warning('Party Name is required')
      return
    }

    const newSale = {
      id: editingId || Date.now(),
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
      addWords,
      remarks
    }

    let updatedList = []
    if (editingId) {
      updatedList = salesList.map(s => s.id === editingId ? newSale : s)
      toast.success('Credit Sale updated successfully')
    } else {
      updatedList = [...salesList, newSale]
      toast.success('Credit Sale saved successfully')
    }

    localStorage.setItem('velson_credit_sales', JSON.stringify(updatedList))
    setSalesList(updatedList)
    handleCancel(updatedList)
  }

  const handleCancel = (currentList = salesList) => {
    setEditingId(null)
    setSalesAc('Sales A/C')
    setMode('CREDIT')
    setBillNo(generateNextBillNo(currentList))
    setBillDate(new Date().toISOString().split('T')[0])
    setSelectedDc('')
    setDcDate('')
    setPartyName('')
    setAddress('')
    setTaxType('Local')
    setDeliveryPlace('')
    setDeliveryTo('')
    setAddWords('')
    setRemarks('')
  }

  const handleDeleteRow = () => {
    if (!editingId) {
      toast.warning('Please select a row to delete')
      return
    }
    if (!window.confirm('Are you sure you want to delete this sales record?')) {
      return
    }
    const updatedList = salesList.filter(s => s.id !== editingId)
    localStorage.setItem('velson_credit_sales', JSON.stringify(updatedList))
    setSalesList(updatedList)
    toast.success('Sales record deleted')
    handleCancel(updatedList)
  }

  const handleRowClick = (row) => {
    setEditingId(row.id)
    setSalesAc(row.salesAc || 'Sales A/C')
    setMode(row.mode || 'CREDIT')
    setBillNo(row.billNo || '001')
    setBillDate(row.billDate || '2026-04-15')
    setSelectedDc(row.dcNo || '')
    setDcDate(row.dcDate || '')
    setPartyName(row.partyName || '')
    setAddress(row.address || '')
    setTaxType(row.taxType || 'Local')
    setDeliveryPlace(row.deliveryPlace || '')
    setDeliveryTo(row.deliveryTo || '')
    setAddWords(row.addWords || '')
    setRemarks(row.remarks || '')
    toast.info(`Loaded Bill No: ${row.billNo} for editing`)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-3">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Credit Sales</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[#0097A7] rounded-sm" />
              <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Credit Sales</h2>
            </div>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded transition-all shadow-sm"
            >
              <div className="w-3.5 h-3.5 bg-slate-400 rounded-full flex items-center justify-center">
                <X size={8} className="text-white" strokeWidth={3} />
              </div>
              Close
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-4">

            {/* 3-Container Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">

              {/* Container 1: Sales Information */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
                <h3 className="text-[11px] font-black text-white uppercase tracking-wider bg-[#0097A7] px-3 py-2 rounded-lg -mx-4 -mt-4 mb-1 flex items-center gap-1.5">
                  <ShoppingBag size={13} strokeWidth={2.5} /> Sales Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sales A/C</Label>
                    <Select options={['Sales A/C']} value={salesAc} onChange={e => setSalesAc(e.target.value)} placeholder={null} className="w-full" />
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <Select options={['CREDIT', 'CASH']} value={mode} onChange={e => setMode(e.target.value)} placeholder={null} className="w-full" />
                  </div>
                  <div>
                    <Label>Bill No</Label>
                    <Input value={billNo} readOnly className="font-bold text-[#0097A7] w-full" />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full" />
                  </div>
                  <div className="col-span-2">
                    <Label>DC No</Label>
                    <Select className="w-full" value={selectedDc} onChange={handleDcChange} placeholder="-- Select DC --">
                      {dcList.map(dc => (
                        <option key={dc.dcNo} value={dc.dcNo}>{dc.dcNo}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>DC Date</Label>
                    <Input type="date" value={dcDate} readOnly className="w-full" />
                  </div>
                  <div>
                    <Label>Tax Type</Label>
                    <Select options={['Local', 'Inter-State']} value={taxType} onChange={e => setTaxType(e.target.value)} placeholder={null} className="w-full" />
                  </div>
                </div>
              </div>

              {/* Container 2: Customer & Delivery Information */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
                <h3 className="text-[11px] font-black text-white uppercase tracking-wider bg-[#0097A7] px-3 py-2 rounded-lg -mx-4 -mt-4 mb-1 flex items-center gap-1.5">
                  <Truck size={13} strokeWidth={2.5} /> Customer & Delivery Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Party Name</Label>
                    <Input className="w-full" value={partyName} readOnly placeholder="Party Name" />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
                  </div>
                  <div className="col-span-2">
                    <Label>Delivery Place</Label>
                    <Input className="w-full" value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} placeholder="Delivery Place" />
                  </div>
                  <div className="col-span-2">
                    <Label>Delivery To</Label>
                    <Textarea value={deliveryTo} onChange={e => setDeliveryTo(e.target.value)} placeholder="Delivery To" />
                  </div>
                </div>
              </div>

              {/* Container 3: Additional Info & Actions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-wider bg-[#0097A7] px-3 py-2 rounded-lg -mx-4 -mt-4 mb-1 flex items-center gap-1.5">
                    <FileText size={13} strokeWidth={2.5} /> Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="col-span-2">
                      <Label>Add Words</Label>
                      <Input className="w-full" value={addWords} onChange={e => setAddWords(e.target.value)} placeholder="Add Words" />
                    </div>
                    <div className="col-span-2">
                      <Label>Remarks</Label>
                      <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 mt-2">
                  <button 
                    onClick={handleCancel}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 uppercase tracking-wide"
                  >
                    <X size={12} /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 uppercase tracking-wide"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button 
                    onClick={handleDeleteRow}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 uppercase tracking-wide"
                  >
                    <Trash2 size={12} /> Delete Row
                  </button>
                </div>
              </div>

            </div>

            {/* Table Section */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
              <div className="w-full overflow-hidden">
                <table className="w-full text-left border-collapse table-fixed bg-white">
                  <thead className="bg-slate-50 text-[9px] uppercase text-slate-600 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="px-1 py-1 border-r border-slate-200 w-[3%] text-center">*</th>
                      {[
                        { label: 'SNO', w: 'w-[3%]' },
                        { label: 'Sales A/C', w: 'w-[7%]' },
                        { label: 'Mode', w: 'w-[5%]' },
                        { label: 'Bill No', w: 'w-[5%]' },
                        { label: 'Date', w: 'w-[7%]' },
                        { label: 'DC No', w: 'w-[6%]' },
                        { label: 'DC Date', w: 'w-[7%]' },
                        { label: 'Party Name', w: 'w-[10%]' },
                        { label: 'Address', w: 'w-[10%]' },
                        { label: 'Tax Type', w: 'w-[5%]' },
                        { label: 'Delivery Place', w: 'w-[8%]' },
                        { label: 'Delivery To', w: 'w-[8%]' },
                        { label: 'Add Words', w: 'w-[8%]' },
                        { label: 'Remarks', w: 'w-[8%]' }
                      ].map((h, i) => (
                        <th key={i} className={`px-1 py-1 border-r border-slate-200 last:border-r-0 whitespace-normal break-words leading-tight ${h.w}`}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {salesList.length === 0 ? (
                      <tr className="hover:bg-[#f0f9fa]/20 transition-colors group">
                        <td className="px-1 py-1 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                          <Plus size={8} className="text-[#0097A7]" />
                        </td>
                        <td className="px-1 py-1 border-r border-slate-200 text-center font-bold text-slate-600 italic">1</td>
                        {[...Array(13)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0 px-1 py-1 truncate"></td>)}
                      </tr>
                    ) : (
                      salesList.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-[#f0f9fa]/10 transition-colors group cursor-pointer" onClick={() => handleRowClick(row)}>
                          <td className="px-1 py-1 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                            <Plus size={8} className="text-[#0097A7]" />
                          </td>
                          <td className="px-1 py-1 border-r border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.salesAc || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate font-semibold">{row.mode || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate font-bold text-[#0097A7]">{row.billNo || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.billDate || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.dcNo || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.dcDate || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate font-bold text-slate-700">{row.partyName || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.address || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.taxType || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.deliveryPlace || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.deliveryTo || '—'}</td>
                          <td className="border-r border-slate-100 px-1 py-1 truncate">{row.addWords || '—'}</td>
                          <td className="border-r border-slate-100 last:border-r-0 px-1 py-1 truncate">{row.remarks || '—'}</td>
                        </tr>
                      ))
                    )}
                    {[...Array(Math.max(0, 8 - salesList.length))].map((_, i) => (
                      <tr key={i} className="h-7">
                        <td className="border-r border-slate-100 bg-slate-50/10"></td>
                        <td className="border-r border-slate-100 text-center text-slate-400 font-bold">{salesList.length + i + 1}</td>
                        {[...Array(13)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0 px-1 py-1 truncate"></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-1.5 opacity-35 group hover:opacity-100 transition-opacity cursor-default">
                <FileText size={13} className="text-[#0097A7]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Credit Sales Ledger Console</span>
              </div>
              <div className="flex items-center gap-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Outstanding: <span className="text-rose-600">0.00</span>
                <span className="w-px h-3 bg-slate-200" />
                Total Items: <span className="text-[#0097A7]">{salesList.length}</span>
                <span className="w-px h-3 bg-slate-200" />
                Freight: <span className="text-blue-600">0.00</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}