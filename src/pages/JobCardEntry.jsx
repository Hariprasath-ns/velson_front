import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Save, Trash2, X, Plus, RotateCcw, Search, FileText, Image as ImageIcon } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}{children}
  </label>
)
const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white hover:border-slate-300'} ${className}`} />
)
const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>{typeof o === 'object' ? o.label : o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
)

const parseNoteMetadata = (noteStr) => {
  if (!noteStr) return { isSelfStock: false, customersText: '', cleanNote: '' }

  if (noteStr.startsWith('[Self Stock In]')) {
    return {
      isSelfStock: true,
      customersText: '',
      cleanNote: noteStr.replace('[Self Stock In]', '').trim()
    }
  }

  const custMatch = noteStr.match(/^\[Customers:\s*([^\]]+)\]/)
  if (custMatch) {
    return {
      isSelfStock: false,
      customersText: custMatch[1],
      cleanNote: noteStr.replace(custMatch[0], '').trim()
    }
  }

  return { isSelfStock: false, customersText: '', cleanNote: noteStr }
}

export default function JobCardEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobNo: '',
    model: '', qtyV: '', currentDate: new Date().toISOString().split('T')[0],
    priority: '', requiredDate: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [lineItems, setLineItems] = useState([{ id: Date.now(), partNo: '', partName: '', planQty: '', uom: '' }])
  const [savedJobs, setSavedJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [partImage, setPartImage] = useState(null)
  const [loading, setLoading] = useState(true)

  // Customer states
  const [customers, setCustomers] = useState([])
  const [selfStockIn, setSelfStockIn] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [custSearchTerm, setCustSearchTerm] = useState('')
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false)
  const customerDropdownRef = useRef(null)

  // Master lists
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [priorities, setPriorities] = useState([])
  const [uoms, setUoms] = useState([])
  const [itemMasterList, setItemMasterList] = useState([])
  const [nextJobNo, setNextJobNo] = useState('1')

  const fetchJobCards = async () => {
    try {
      const res = await api.get('/api/job-card')
      setSavedJobs(res.data?.data || [])
    } catch (err) {
      console.error('Error fetching job cards', err)
    }
  }

  const fetchNextJobNo = async () => {
    try {
      const res = await api.get('/api/job-card/next-no')
      const nextNo = res.data?.jobNo || '1'
      setNextJobNo(nextNo)
      setForm(f => ({ ...f, jobNo: nextNo }))
    } catch (err) {
      console.error('Error fetching next job number', err)
    }
  }

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      try {
        const [jobsRes, nextRes, vehicleRes, priorityRes, uomsRes, itemsRes, custRes] = await Promise.all([
          api.get('/api/job-card').catch(() => ({ data: { data: [] } })),
          api.get('/api/job-card/next-no').catch(() => ({ data: { jobNo: '1' } })),
          api.get('/api/reference-master/Vehicle_Type').catch(() => ({ data: { data: [] } })),
          api.get('/api/reference-master/Priority').catch(() => ({ data: { data: [] } })),
          api.get('/api/reference-master/UOM').catch(() => ({ data: { data: [] } })),
          api.get('/api/item-master?limit=10000').catch(() => ({ data: { data: [] } })),
          api.get('/api/customer-master').catch(() => ({ data: { data: [] } }))
        ])

        setSavedJobs(jobsRes.data?.data || [])
        const nextNo = nextRes.data?.jobNo || '1'
        setNextJobNo(nextNo)
        setForm(f => ({ ...f, jobNo: nextNo }))
        setVehicleTypes((vehicleRes.data?.data || []).map(r => r.description).filter(Boolean))
        setPriorities((priorityRes.data?.data || []).map(r => r.description).filter(Boolean))
        setUoms((uomsRes.data?.data || []).map(r => r.description).filter(Boolean))
        setItemMasterList(itemsRes.data?.data || [])
        setCustomers(custRes.data?.data || [])
      } catch (err) {
        console.error('Error loading page data', err)
        toast.error('Failed to load job card data')
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleMouseDown = (e) => {
    const el = e.currentTarget
    el.isDown = true
    el.startX = e.pageX - el.offsetLeft
    el.scrollLeftVal = el.scrollLeft
  }
  const handleMouseLeave = (e) => {
    e.currentTarget.isDown = false
  }
  const handleMouseUp = (e) => {
    e.currentTarget.isDown = false
  }
  const handleMouseMove = (e) => {
    const el = e.currentTarget
    if (!el.isDown) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - el.startX) * 1.5
    el.scrollLeft = el.scrollLeftVal - walk
  }

  const addLine = () => setLineItems(prev => [...prev, { id: Date.now(), partNo: '', partName: '', planQty: '', uom: '' }])
  const removeLine = (id) => setLineItems(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  const updateLine = (id, key, val) => setLineItems(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l))

  const handlePartNoChange = (id, partNoVal) => {
    const item = itemMasterList.find(it => it.partNo === partNoVal)
    if (item) {
      const hasImg = item.hasImage || !!item.imageMimeType
      if (hasImg) {
        setPartImage(`/api/item-master/${item.id}/download-image`)
      } else if (item.imagePath) {
        setPartImage(item.imagePath.startsWith('http') || item.imagePath.startsWith('/') ? item.imagePath : `/uploads/${item.imagePath}`)
      } else {
        setPartImage(null)
      }
    } else {
      setPartImage(null)
    }

    setLineItems(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          partNo: partNoVal,
          partName: item ? item.partName : '',
          uom: item ? (item.uom || item.uomName || '') : '',
        }
      }
      return l
    }))
  }

  const handlePartNameChange = (id, partNameVal) => {
    const item = itemMasterList.find(it => it.partName === partNameVal)
    if (item) {
      const hasImg = item.hasImage || !!item.imageMimeType
      if (hasImg) {
        setPartImage(`/api/item-master/${item.id}/download-image`)
      } else if (item.imagePath) {
        setPartImage(item.imagePath.startsWith('http') || item.imagePath.startsWith('/') ? item.imagePath : `/uploads/${item.imagePath}`)
      } else {
        setPartImage(null)
      }
    } else {
      setPartImage(null)
    }

    setLineItems(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          partName: partNameVal,
          partNo: item ? item.partNo : '',
          uom: item ? (item.uom || item.uomName || '') : '',
        }
      }
      return l
    }))
  }

  const handleSave = async () => {
    if (!form.jobNo) {
      toast.warning('Job No is required.')
      return
    }

    if (!selfStockIn && selectedCustomers.length === 0) {
      toast.warning('Please select at least one customer or check "Self Stock In".')
      return
    }

    try {
      const payload = {
        ...form,
        partImage,
        lineItems: lineItems.filter(l => l.partNo),
        selfStockIn,
        selectedCustomers,
      }
      const res = await api.post('/api/job-card', payload)
      if (res.data?.success) {
        toast.success('Job Card Saved Successfully!')
        await fetchJobCards()
        await fetchNextJobNo()
        handleClear()
      } else {
        toast.error(res.data?.message || 'Failed to save Job Card.')
      }
    } catch (err) {
      console.error('Error saving Job Card', err)
      toast.error('Error saving Job Card: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this job card?')) return
    try {
      const res = await api.delete(`/api/job-card/${id}`)
      if (res.data?.success) {
        toast.success('Job Card Deleted Successfully!')
        await fetchJobCards()
        await fetchNextJobNo()
      } else {
        toast.error(res.data?.message || 'Failed to delete Job Card.')
      }
    } catch (err) {
      console.error('Error deleting Job Card', err)
      toast.error('Error deleting Job Card: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleClear = () => {
    setForm(f => ({
      ...f,
      model: '', qtyV: '',
      currentDate: new Date().toISOString().split('T')[0],
      priority: '',
      requiredDate: new Date().toISOString().split('T')[0],
      note: ''
    }))
    setLineItems([{ id: Date.now(), partNo: '', partName: '', planQty: '', uom: '' }])
    setPartImage(null)
    setSelfStockIn(false)
    setSelectedCustomers([])
    setCustSearchTerm('')
    setIsCustDropdownOpen(false)
  }

  const filtered = savedJobs.filter(j => {
    // Filter by selected Part No / Part Name in the entry form
    const selectedPartNos = lineItems.map(l => l.partNo).filter(Boolean)
    const selectedPartNames = lineItems.map(l => l.partName).filter(Boolean)

    let matchesParts = true
    if (selectedPartNos.length > 0 || selectedPartNames.length > 0) {
      matchesParts = j.lineItems?.some(li => 
        (li.partNo && selectedPartNos.includes(li.partNo)) ||
        (li.partName && selectedPartNames.includes(li.partName))
      ) || false
    }

    if (!matchesParts) return false

    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return j.jobNo?.toLowerCase().includes(q) || j.model?.toLowerCase().includes(q)
  })

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <style>{`
        .custom-horizontal-scroll::-webkit-scrollbar {
          display: block !important;
          height: 4px !important;
        }
        .custom-horizontal-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 2px !important;
        }
        .custom-horizontal-scroll::-webkit-scrollbar-track {
          background: transparent !important;
        }
      `}</style>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Technical</span><ChevronRight size={12} /><span className="text-[#0097A7]">Job Card Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Job Entry</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm"><RotateCcw size={14} /> Clear</button>
              <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-1"><X size={20} strokeWidth={2.5} /></button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-2">
                <Label required>Job No</Label>
                <Input value={form.jobNo} readOnly className="!font-bold text-[#0097A7]" />
              </div>
              <div className="col-span-3">
                <Label>Model</Label>
                <Select options={vehicleTypes} value={form.model} onChange={u('model')} placeholder="Select Model..." />
              </div>
              <div className="col-span-2">
                <Label>Qty / V</Label>
                <Input type="number" value={form.qtyV} onChange={u('qtyV')} placeholder="0" />
              </div>
              <div className="col-span-2">
                <Label>Current Date</Label>
                <Input type="date" value={form.currentDate} onChange={u('currentDate')} />
              </div>

              {/* Part Image spans 3 rows on the right */}
              <div className="col-span-3 row-span-3">
                <Label>Part Image</Label>
                {partImage ? (
                  <div className="relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group">
                    <img src={partImage} alt="Part" className="w-full h-[200px] object-contain p-2" />
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center h-[200px] gap-2 text-slate-300 transition-all group">
                    <ImageIcon size={22} strokeWidth={1.5} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Part Image</span>
                  </div>
                )}
              </div>

              <div className="col-span-3">
                <Label>Priority</Label>
                <Select options={priorities} value={form.priority} onChange={u('priority')} placeholder="Select..." />
              </div>
              <div className="col-span-3">
                <Label>Required Date</Label>
                <Input type="date" value={form.requiredDate} onChange={u('requiredDate')} />
              </div>
              <div className="col-span-3 flex items-center pt-5 mt-3 pl-2">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={selfStockIn}
                    onChange={e => setSelfStockIn(e.target.checked)}
                    className="w-3.5 h-4.5 accent-[#0097A7] rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]/20 transition-all duration-200 cursor-pointer group-hover:scale-105"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">Self Stock In</span>
                </label>
              </div>

              {/* Customer Select Component */}
              {!selfStockIn && (
                <div ref={customerDropdownRef} className="col-span-9 bg-slate-50 p-4 border border-slate-200 rounded-xl relative transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Select Customer(s) <span className="text-red-500">*</span>
                    </span>
                    {selectedCustomers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCustomers([])}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider transition-colors"
                      >
                        Clear All ({selectedCustomers.length})
                      </button>
                    )}
                  </div>

                  {/* Suggestion input box */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={custSearchTerm}
                      onChange={e => {
                        setCustSearchTerm(e.target.value)
                        setIsCustDropdownOpen(true)
                      }}
                      onFocus={() => setIsCustDropdownOpen(true)}
                      placeholder="Search and select customers from master table..."
                      className="w-full pl-10 pr-10 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustDropdownOpen(!isCustDropdownOpen)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <svg className={`w-4 h-4 transition-transform duration-200 ${isCustDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Checklist Dropdown */}
                    {isCustDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                        {customers.filter(c => {
                          const q = custSearchTerm.toLowerCase().trim()
                          if (!q) return true
                          return (
                            c.customerName?.toLowerCase().includes(q) ||
                            c.cCode?.toLowerCase().includes(q)
                          )
                        }).length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                            No customers found matching "{custSearchTerm}"
                          </div>
                        ) : (
                          customers
                            .filter(c => {
                              const q = custSearchTerm.toLowerCase().trim()
                              if (!q) return true
                              return (
                                c.customerName?.toLowerCase().includes(q) ||
                                c.cCode?.toLowerCase().includes(q)
                              )
                            })
                            .map(c => {
                              const isSelected = selectedCustomers.some(sc => sc.id === c.id)
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedCustomers(selectedCustomers.filter(sc => sc.id !== c.id))
                                    } else {
                                      setSelectedCustomers([...selectedCustomers, c])
                                    }
                                  }}
                                  className={`flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-[#0097A7]/10 hover:text-slate-800 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? 'bg-slate-50' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => { }} // Controlled by onClick on parent container
                                    className="w-4 h-4 accent-[#0097A7] rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]/20 transition cursor-pointer"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800 text-[13px]">{c.customerName}</span>
                                    {c.cCode && <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{c.cCode}</span>}
                                  </div>
                                </div>
                              )
                            })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Chips */}
                  {selectedCustomers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedCustomers.map(c => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] rounded-full text-[11px] font-bold transition-all border border-[#0097A7]/20 group animate-fadeIn"
                        >
                          <span>{c.customerName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCustomers(selectedCustomers.filter(sc => sc.id !== c.id))
                            }}
                            className="p-0.5 rounded-full hover:bg-[#0097A7]/20 text-[#0097A7] transition-all"
                          >
                            <X size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="col-span-9 bg-[#e8f5e9] p-3 rounded-lg border border-green-200 flex items-center gap-4">
                <div className="w-16 text-[11px] font-bold text-green-800 uppercase shrink-0">Note</div>
                <div className="flex-1">
                  <Input value={form.note} onChange={u('note')} placeholder="Enter notes..." />
                </div>
              </div>
            </div>

            {/* ── Line Items Table ── */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#0097A7] pl-3">Line Items</h3>
                <div className="flex items-center gap-2">
                  <button onClick={addLine} className="flex items-center gap-1.5 px-3 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95"><Plus size={14} /> Add Row</button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95"><Save size={14} /> Save</button>
                  <button onClick={handleClear} className="flex items-center gap-1.5 px-4 py-[7px] bg-white hover:bg-red-50 text-red-600 text-[12px] font-bold rounded-lg border border-red-200 transition-all shadow-sm active:scale-95"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#e3f2fd] text-[11px] uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3 border-r border-slate-200 w-10 text-center"></th>
                      <th className="px-3 py-3 border-r border-slate-200 w-12 text-center">S.No</th>
                      <th className="px-3 py-3 border-r border-slate-200">Part No</th>
                      <th className="px-3 py-3 border-r border-slate-200">Part Name</th>
                      <th className="px-3 py-3 border-r border-slate-200 w-24">Plan Qty</th>
                      <th className="px-3 py-3 w-24">UOM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((li, idx) => (
                      <tr key={li.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                          <button onClick={() => removeLine(li.id)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={13} /></button>
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-400 font-bold text-[12px]">{idx + 1}</td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <select value={li.partNo} onChange={e => handlePartNoChange(li.id, e.target.value)}
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7]">
                            <option value="">Select Part No</option>
                            {itemMasterList.map(it => (
                              <option key={it.id} value={it.partNo}>{it.partNo}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <select value={li.partName} onChange={e => handlePartNameChange(li.id, e.target.value)}
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7]">
                            <option value="">Select Part Name</option>
                            {itemMasterList.map(it => (
                              <option key={it.id} value={it.partName}>{it.partName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input type="number" value={li.planQty} onChange={e => updateLine(li.id, 'planQty', e.target.value)} placeholder="0"
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7] text-center" />
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={li.uom} onChange={e => updateLine(li.id, 'uom', e.target.value)}
                            className="w-full px-1 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7]">
                            <option value="">--</option>
                            {uoms.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Saved Job Cards Table ── */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#0097A7] pl-3">Saved Job Cards</h3>
                  <span className="bg-[#0097A7]/10 text-[#0097A7] px-2 py-0.5 rounded text-[10px] font-bold">{filtered.length} Records</span>
                  {lineItems.some(l => l.partNo || l.partName) && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Filtered by Selected Part(s)
                    </span>
                  )}
                </div>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search jobs..."
                    className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7]" />
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">

                    {/* Header */}
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b bg-slate-50">
                        <th className="px-4 py-3 font-semibold">Job No</th>
                        <th className="px-4 py-3 font-semibold">Model</th>
                        <th className="px-4 py-3 font-semibold">Customer/Stock-In</th>
                        <th className="px-4 py-3 font-semibold text-center">Qty</th>
                        <th className="px-4 py-3 font-semibold">Priority</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold text-center">Parts</th>
                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-slate-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-14 text-center text-slate-400 italic">
                            No job cards found
                          </td>
                        </tr>
                      ) : (
                        filtered.map((job) => (
                          <tr
                            key={job.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-semibold text-[#0097A7]">
                              {job.jobNo}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {job.model || "—"}
                            </td>

                            <td className="px-4 py-3 text-slate-600 w-[450px] max-w-[450px]">
                              {job.selfStockIn ? (
                                <span className="text-xs font-semibold text-yellow-600 px-2 py-1 rounded-full">
                                  Self Stock In
                                </span>
                              ) : (
                                (() => {
                                  let list = [];

                                  try {
                                    list =
                                      typeof job.selectedCustomers === "string"
                                        ? JSON.parse(job.selectedCustomers)
                                        : job.selectedCustomers || [];
                                  } catch {
                                    list = [];
                                  }

                                  if (!list.length) return <span className="text-slate-400">—</span>;

                                  // const colors = [
                                  //   "bg-blue-100 text-blue-700",
                                  //   "bg-emerald-100 text-emerald-700",
                                  //   "bg-amber-100 text-amber-700",
                                  //   "bg-purple-100 text-purple-700",
                                  //   "bg-pink-100 text-pink-700",
                                  // ];

                                  const colors = [
                                    "text-blue-700",
                                    "text-emerald-700",
                                    "text-amber-700",
                                    "text-purple-700",
                                    "text-pink-700",
                                  ];
                                  // Partition the list into 3 rows
                                  const rows = [[], [], []];
                                  list.forEach((c, i) => {
                                    rows[i % 3].push({ data: c, originalIndex: i });
                                  });

                                  return (
                                    <div
                                      onMouseDown={handleMouseDown}
                                      onMouseLeave={handleMouseLeave}
                                      onMouseUp={handleMouseUp}
                                      onMouseMove={handleMouseMove}
                                      className="flex flex-col gap-1 overflow-x-auto overflow-y-hidden max-w-[450px] pb-1 cursor-grab active:cursor-grabbing select-none custom-horizontal-scroll"
                                    >
                                      {rows.map((rowItems, rowIndex) => {
                                        if (rowItems.length === 0) return null;
                                        return (
                                          <div key={rowIndex} className="flex gap-1 shrink-0">
                                            {rowItems.map(({ data: c, originalIndex: i }) => (
                                              <span
                                                key={c.id || i}
                                                className={`
                                                inline-flex
                                                items-center
                                                rounded-full
                                                px-1
                                                font-semibold
                                                text-[11px]
                                                shrink-0
                                                ${colors[i % colors.length]}
                                                `}
                                                whitespace-nowrap
                                                title={c.customerName}
                                              >
                                                {c.customerName}
                                                {c.cCode && (
                                                  <span className="ml-1 text-[10px] opacity-70">
                                                    ({c.cCode})
                                                  </span>
                                                )}
                                              </span>
                                            ))}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()
                              )}
                            </td>

                            <td className="px-4 py-3 text-center text-slate-600">
                              {job.qtyV || "—"}
                            </td>

                            <td className="px-4 py-3">
                              {job.priority ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                  {job.priority}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="px-4 py-3 text-slate-500">
                              {job.currentDate}
                            </td>

                            <td className="px-4 py-3 text-center text-slate-600">
                              {job.lineItems?.length || 0}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDelete(job.id)}
                                className="text-slate-400 hover:text-red-600 transition"
                              >
                                <Trash2 size={16} />
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

            {/* <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ready</p>
              <p className="text-[10px] text-red-500 font-bold">* Are Mandatory</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}