import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight, X, Save, Trash2, Plus, Truck
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useCustomers } from '../hooks/useMasterData'

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

const Combobox = ({ options, placeholder, value, onChange, readOnly = false, className = '', ...props }) => {
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
    if (!search || search === value) return options
    const s = search.toLowerCase()
    return options.filter(o => o && o.toLowerCase().includes(s))
  }, [options, search, value])

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        readOnly={readOnly}
        onChange={e => {
          setSearch(e.target.value)
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (!readOnly) setIsOpen(true)
        }}
        className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-semibold' : 'hover:border-slate-300'} shadow-sm`}
        {...props}
      />
      {!readOnly && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {isOpen && !readOnly && (
        <div className="absolute z-[10000] w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-72 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 text-sm italic">No results found</div>
          ) : (
            filteredOptions.map(o => (
              <div
                key={o}
                onClick={() => {
                  onChange(o)
                  setSearch(o)
                  setIsOpen(false)
                }}
                className="px-3 py-1.5 text-sm text-slate-700 hover:bg-[#0097A7]/10 hover:text-[#0097A7] cursor-pointer transition-colors"
              >
                {o}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function OutsourcePartsRegister() {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Form State
  const [dcNo, setDcNo] = useState('')
  const [dcDate, setDcDate] = useState(new Date().toISOString().slice(0, 10))
  const [customerId, setCustomerId] = useState(null)
  const [partyName, setPartyName] = useState('')
  const [address, setAddress] = useState('')
  const [items, setItems] = useState([{ itemName: '', entryDate: new Date().toISOString().slice(0, 10) }])
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState(null)

  const { data: customerList = [] } = useCustomers()

  // Master Lists for Comboboxes
  const [dcList, setDcList] = useState([])

  // Load DC lists and Customer list
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dcRes = await api.get('/api/delivery-challan')

        if (dcRes.data && Array.isArray(dcRes.data.data)) {
          setDcList(dcRes.data.data)
        }
      } catch (err) {
        toast.error('Failed to fetch support data')
      }
    }
    fetchData()
  }, [])

  // Load record for edit if editId is passed
  useEffect(() => {
    if (location.state && location.state.editId) {
      const fetchRecord = async () => {
        try {
          const res = await api.get(`/api/outsource-parts/${location.state.editId}`)
          if (res.data && res.data.success && res.data.data) {
            const found = res.data.data
            setEditId(found.id)
            setDcNo(found.dcNo)
            setDcDate(found.dcDate ? found.dcDate.slice(0, 10) : new Date().toISOString().slice(0, 10))
            setCustomerId(found.customerId)
            setPartyName(found.partyName || '')
            setAddress(found.address || '')
            setItems(found.items && found.items.length ? found.items.map(it => ({
              id: it.id,
              itemName: it.itemName,
              entryDate: it.entryDate ? it.entryDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
            })) : [{ itemName: '', entryDate: new Date().toISOString().slice(0, 10) }])
            setIsEdit(true)
          }
        } catch (err) {
          toast.error('Failed to load record for editing')
        }
      }
      fetchRecord()
    }
  }, [location.state])

  // Get DC options for Combobox
  const dcOptions = useMemo(() => {
    return dcList.map(d => d.dcNo)
  }, [dcList])

  // Get Customer options for Combobox
  const customerOptions = useMemo(() => {
    return customerList.map(c => c.customerName)
  }, [customerList])

  // Handle DC Selection
  const handleDcNoChange = (val) => {
    setDcNo(val)
    const matchingDc = dcList.find(d => d.dcNo === val)
    if (matchingDc) {
      setDcDate(matchingDc.date ? matchingDc.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
      const matchingCustomer = customerList.find(c => c.id === matchingDc.customerId)
      setPartyName(matchingCustomer ? matchingCustomer.customerName : (matchingDc.partyName || ''))
      setCustomerId(matchingDc.customerId || null)
      setAddress(matchingDc.address || '')
      toast.info(`Auto-filled details from DC #${val}`)
    }
  }

  // Handle Customer Selection
  const handleCustomerChange = (val) => {
    setPartyName(val)
    const matchingCustomer = customerList.find(c => c.customerName === val)
    if (matchingCustomer) {
      setCustomerId(matchingCustomer.id)
      setAddress(matchingCustomer.address || '')
      toast.info(`Auto-filled address for ${val}`)
    } else {
      setCustomerId(null)
    }
  }

  const handleItemChange = (index, value) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index].itemName = value
      return copy
    })
  }

  const handleAddRow = () => {
    setItems(prev => [...prev, { itemName: '', entryDate: dcDate }])
  }

  const handleDeleteRow = (index) => {
    setItems(prev => {
      const copy = prev.filter((_, i) => i !== index)
      if (copy.length === 0) {
        return [{ itemName: '', entryDate: dcDate }]
      }
      return copy
    })
  }

  const handleSave = async () => {
    if (!dcNo.trim()) {
      toast.error('DC No is required!')
      return
    }
    if (!partyName.trim()) {
      toast.error('Customer Name is required!')
      return
    }

    const validItems = items
      .filter(it => it.itemName.trim() !== '')
      .map((it, idx) => ({
        slNo: idx + 1,
        itemName: it.itemName.trim(),
        entryDate: it.entryDate || dcDate
      }))

    if (validItems.length === 0) {
      toast.error('Please enter at least one item!')
      return
    }

    const payload = {
      dcNo: dcNo.trim(),
      dcDate,
      customerId,
      partyName: partyName.trim(),
      address: address.trim(),
      items: validItems
    }

    try {
      if (isEdit && editId) {
        await api.put(`/api/outsource-parts/${editId}`, payload)
        toast.success('Outsource Parts register updated successfully!')
      } else {
        await api.post('/api/outsource-parts', payload)
        toast.success('Outsource Parts register saved successfully!')
      }
      setTimeout(() => {
        navigate('/sales/outsource-parts-register-details')
      }, 1000)
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to save record'
      toast.error(errMsg)
    }
  }

  const handleClear = () => {
    setDcNo('')
    setCustomerId(null)
    setPartyName('')
    setAddress('')
    setItems([{ itemName: '', entryDate: new Date().toISOString().slice(0, 10) }])
    setIsEdit(false)
    setEditId(null)
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
              onClick={() => navigate('/sales/outsource-parts-register-details')}
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
                      <Combobox 
                        options={dcOptions}
                        placeholder="Search/Enter DC No"
                        value={dcNo}
                        onChange={handleDcNoChange}
                        className="w-full font-bold text-[#0097A7]"
                      />
                    </div>
                    <div>
                      <Label>DC Date</Label>
                      <Input type="date" value={dcDate} onChange={e => setDcDate(e.target.value)} className="w-full" readOnly/>
                    </div>
                  </div>
                  <div>
                    <Label required>Customer Name</Label>
                    <Combobox 
                      options={customerOptions}
                      placeholder="Search/Enter Customer Name"
                      value={partyName}
                      onChange={handleCustomerChange}
                      className="w-full"
                    />
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
                      <th className="text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 w-16">S.No</th>
                      <th className="px-3 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200">Item Name</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f0f9fa]/20 transition-colors group">
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
