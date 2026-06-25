import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight, X, Save, Trash2, Plus, Truck
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

export default function OutsourcePartsRegister() {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Form State
  const [dcNo, setDcNo] = useState('')
  const [dcDate, setDcDate] = useState(new Date().toISOString().slice(0, 10))
  const [partyName, setPartyName] = useState('')
  const [address, setAddress] = useState('')
  const [items, setItems] = useState([{ itemName: '', date: '' }])
  const [isEdit, setIsEdit] = useState(false)

  // Load next DC No or loaded DC for edit
  useEffect(() => {
    const existing = localStorage.getItem('velson_dc_sales')
    let dcs = []
    if (existing) {
      try {
        dcs = JSON.parse(existing)
      } catch (e) {}
    }

    if (location.state && location.state.editDcNo) {
      const targetDate = location.state.editDcDate
      const found = dcs.find(d => d.dcNo === String(location.state.editDcNo) && (!targetDate || d.dcDate === targetDate))
      if (found) {
        setDcNo(found.dcNo)
        setDcDate(found.dcDate || new Date().toISOString().slice(0, 10))
        setPartyName(found.partyName || '')
        setAddress(found.address || '')
        setItems(found.items && found.items.length ? found.items : [{ itemName: '', date: '' }])
        setIsEdit(true)
        return
      }
    }

    // Auto generate next DC No
    if (dcs.length > 0) {
      const maxNo = dcs.reduce((max, curr) => {
        const num = parseInt(curr.dcNo, 10)
        return !isNaN(num) && num > max ? num : max
      }, 0)
      setDcNo(String(maxNo + 1))
    } else {
      setDcNo('1')
    }
  }, [location.state])

  // Helper to load record based on DC No and Date
  const loadRecord = (targetNo, targetDate) => {
    const trimmedNo = String(targetNo).trim()
    if (!trimmedNo) return

    const existing = localStorage.getItem('velson_dc_sales')
    if (existing) {
      try {
        const dcs = JSON.parse(existing)
        // Find exact match for both DC No and DC Date
        const foundToday = dcs.find(d => d.dcNo === trimmedNo && d.dcDate === targetDate)
        if (foundToday) {
          setPartyName(foundToday.partyName || '')
          setAddress(foundToday.address || '')
          setItems(foundToday.items && foundToday.items.length ? foundToday.items : [{ itemName: '', date: '' }])
          setIsEdit(true)
          toast.info(`DC #${trimmedNo} for date ${targetDate} loaded for editing`)
        } else {
          // Check if this DC exists on any other date to auto-fill customer details
          const otherDayFound = dcs.find(d => d.dcNo === trimmedNo)
          if (otherDayFound) {
            setPartyName(otherDayFound.partyName || '')
            setAddress(otherDayFound.address || '')
            toast.info(`Auto-filled customer details from DC #${trimmedNo}`)
          } else {
            setPartyName('')
            setAddress('')
          }
          setItems([{ itemName: '', date: '' }])
          setIsEdit(false)
        }
      } catch (e) {}
    }
  }

  // Monitor DC No input to load existing record if typed
  const handleDcNoChange = (val) => {
    setDcNo(val)
    loadRecord(val, dcDate)
  }

  const handleDcDateChange = (val) => {
    setDcDate(val)
    loadRecord(dcNo, val)
  }

  const handleItemChange = (index, value) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index].itemName = value
      // Assign the entry date if not already set
      if (!copy[index].date) {
        copy[index].date = dcDate
      }
      return copy
    })
  }

  const handleAddRow = () => {
    setItems(prev => [...prev, { itemName: '', date: '' }])
  }

  const handleDeleteRow = (index) => {
    setItems(prev => {
      const copy = prev.filter((_, i) => i !== index)
      if (copy.length === 0) {
        return [{ itemName: '', date: '' }]
      }
      return copy
    })
  }

  const handleSave = () => {
    if (!dcNo.trim()) {
      toast.error('DC No is required!')
      return
    }
    if (!partyName.trim()) {
      toast.error('Customer Name is required!')
      return
    }

    // Filter empty rows
    const validItems = items
      .filter(it => it.itemName.trim() !== '')
      .map((it, idx) => ({
        sNo: idx + 1,
        itemName: it.itemName.trim(),
        date: it.date || dcDate
      }))

    if (validItems.length === 0) {
      toast.error('Please enter at least one item!')
      return
    }

    const dcRecord = {
      dcNo: dcNo.trim(),
      dcDate,
      partyName: partyName.trim(),
      address: address.trim(),
      items: validItems
    }

    const existing = localStorage.getItem('velson_dc_sales')
    let dcs = []
    if (existing) {
      try {
        dcs = JSON.parse(existing)
      } catch (e) {}
    }

    const index = dcs.findIndex(d => d.dcNo === dcRecord.dcNo && d.dcDate === dcRecord.dcDate)
    if (index !== -1) {
      dcs[index] = dcRecord
      toast.success('DC Sales updated successfully!')
    } else {
      dcs.push(dcRecord)
      toast.success('DC Sales saved successfully!')
    }

    localStorage.setItem('velson_dc_sales', JSON.stringify(dcs))

    setTimeout(() => {
      navigate('/sales/dc-details')
    }, 1000)
  }

  const handleClear = () => {
    setPartyName('')
    setAddress('')
    setItems([{ itemName: '', date: '' }])
    setIsEdit(false)
    
    // Auto generate next No again
    const existing = localStorage.getItem('velson_dc_sales')
    if (existing) {
      try {
        const dcs = JSON.parse(existing)
        const maxNo = dcs.reduce((max, curr) => {
          const num = parseInt(curr.dcNo, 10)
          return !isNaN(num) && num > max ? num : max
        }, 0)
        setDcNo(String(maxNo + 1))
      } catch (e) {}
    } else {
      setDcNo('1')
    }
    toast.success('Fields cleared!')
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">DC Sales</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Outsource Parts Register</h2>
            </div>
            <button 
              onClick={() => navigate('/sales/dc-details')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm active:scale-95"
            >
              <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" strokeWidth={3} />
              </div>
              Close / Details
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {/* Form Section */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left Side: Core Metadata */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label required>DC No</Label>
                      <Input value={dcNo} onChange={e => handleDcNoChange(e.target.value)} className="w-full font-bold text-[#0097A7]" />
                    </div>
                    <div>
                      <Label>DC Date</Label>
                      <Input type="date" value={dcDate} onChange={e => handleDcDateChange(e.target.value)} className="w-full" readOnly/>
                    </div>
                  </div>
                  <div>
                    <Label required>Customer Name</Label>
                    <Input value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="Enter Customer Name" className="w-full" />
                  </div>
                </div>

                {/* Right Side: Address & Controls */}
                <div className="space-y-4">
                  <div>
                    <Label>Address</Label>
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter full customer address"
                      rows={3}
                      className="w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-2 justify-end">
                    <button 
                      onClick={handleSave}
                      className="flex items-center justify-center gap-1.5 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded-lg transition-all shadow-md active:scale-95 min-w-[130px]"
                    >
                      <Save size={16} /> {isEdit ? 'Update' : 'Save'}
                    </button>
                    <button 
                      onClick={handleClear}
                      className="flex items-center justify-center gap-1.5 px-6 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[13px] font-semibold rounded-lg transition-all shadow-sm active:scale-95 min-w-[130px]"
                    >
                      <Trash2 size={16} /> Clear Form
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 w-12">*</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 w-16">S.No</th>
                      <th className="px-3 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200">Item Name</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f0f9fa]/20 transition-colors group">
                        <td className="px-2 py-2 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                          <Plus size={10} className="text-[#0097A7] fill-[#0097A7]" />
                        </td>
                        <td className="px-2 py-2 border-r border-slate-200 text-center font-bold text-slate-600 italic">
                          {index + 1}
                        </td>
                        <td className="p-0 border-r border-slate-200">
                          <input 
                            value={item.itemName} 
                            onChange={e => handleItemChange(index, e.target.value)} 
                            placeholder="Type Item Name here..."
                            className="w-full bg-transparent border-0 px-3 py-2 text-[13px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0097A7] rounded" 
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button 
                            onClick={() => handleDeleteRow(index)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors"
                            title="Delete this row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Row Button Row */}
              <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex justify-start">
                <button 
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded shadow-sm transition-colors active:scale-95"
                >
                  <Plus size={14} /> Add Item Row
                </button>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                {/* <Truck size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Sales Delivery Challan Entry</span> */}
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Items: <span className="text-[#0097A7]">{items.filter(it => it.itemName.trim() !== '').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
