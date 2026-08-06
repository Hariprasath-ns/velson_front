import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronRight, Save, X, Search, CheckSquare, Square, RotateCcw, Image as ImageIcon, Upload } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useReferenceMaster } from '../hooks/useMasterData'

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}{children}
  </label>
)
const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`} />
)
const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
)

const PRIORITIES = ['P0', 'P1', 'P2', 'P3', 'P4', 'PE']

export default function TechAutoJobEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobNo: '', model: '', priority: '', note: '',
    requiredDate: new Date().toISOString().split('T')[0],
  })
  const [parts, setParts] = useState([])
  const [partsLoading, setPartsLoading] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [partImage, setPartImage] = useState(null)
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const imgRef = useRef(null)

  // Load model list from Reference Master (same as JobCardEntry)
  const { data: vehicleRes = [] } = useReferenceMaster('Vehicle_Type')
  const { data: priorityRes = [] } = useReferenceMaster('Priority')

  const vehicleTypes = useMemo(() => vehicleRes.map(r => r.description).filter(Boolean), [vehicleRes])
  const priorities = useMemo(() => priorityRes.map(r => r.description).filter(Boolean).length > 0
    ? priorityRes.map(r => r.description).filter(Boolean)
    : PRIORITIES, [priorityRes])

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Fetch saved job cards from backend ──────────────────────────────────────
  const fetchJobCards = async () => {
    try {
      const res = await api.get('/api/job-card', { skipGlobalLoader: true })
      setSavedJobs(res.data?.data || [])
    } catch (err) {
      console.error('Error fetching job cards', err)
    }
  }

  // ── Fetch next job number from backend ──────────────────────────────────────
  const fetchNextJobNo = async () => {
    try {
      const res = await api.get('/api/job-card/next-no', { skipGlobalLoader: true })
      const nextNo = res.data?.jobNo || '1'
      setForm(f => ({ ...f, jobNo: nextNo }))
    } catch (err) {
      console.error('Error fetching next job number', err)
    }
  }

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchJobCards(), fetchNextJobNo()])
      } catch (err) {
        console.error('Error loading page data', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // ── Fetch parts from item master when model changes ─────────────────────────
  const handleModelChange = async (e) => {
    const model = e.target.value
    setForm(f => ({ ...f, model }))
    setSelectedIds(new Set())
    setSelectAll(false)

    if (!model) {
      setParts([])
      return
    }

    setPartsLoading(true)
    try {
      // Fetch all items (with large limit) so we can filter by model client-side
      const res = await api.get('/api/item-master', {
        params: { limit: 5000, search: '' },
        skipGlobalLoader: true,
      })
      const allItems = res.data?.data || []

      // Filter by matching model name in partName, description, or brand fields
      // Also load all if no model-specific filter is available in the API
      const modelLower = model.toLowerCase().trim()
      const filtered = allItems.filter(item =>
        (item.partName && item.partName.toLowerCase().includes(modelLower)) ||
        (item.description && item.description.toLowerCase().includes(modelLower)) ||
        (item.brand && item.brand.toLowerCase().includes(modelLower))
      )

      // Use filtered if we have results, otherwise show all items for selection
      const displayItems = filtered.length > 0 ? filtered : allItems.slice(0, 50)

      setParts(displayItems.map(item => ({
        id: item.id,
        partNo: item.partNo || '',
        partName: item.partName || '',
        qty: item.reorderLevel || item.minStock || 0,
        uom: item.uomName || item.uom || 'No',
        minStock: item.minStock || 0,
        closingQty: item.closingQty ?? 0,
        createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '',
        description: item.description || item.size || '',
        hasImage: item.hasImage || !!item.imageMimeType,
        imagePath: item.imagePath,
        imageId: item.id,
      })))
    } catch (err) {
      console.error('Error fetching item master', err)
      toast.error('Failed to load parts for selected model.')
      setParts([])
    } finally {
      setPartsLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPartImage(ev.target.result)
      reader.readAsDataURL(file)
    }
  }
  const clearImage = () => { setPartImage(null); if (imgRef.current) imgRef.current.value = '' }

  const toggleSelect = (partNo) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(partNo) ? next.delete(partNo) : next.add(partNo)
      return next
    })
    // Update selectAll state
    setSelectAll(false)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(parts.map(p => p.partNo)))
    }
    setSelectAll(!selectAll)
  }

  // ── Save to backend API ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.model) { toast.warning('Please select a Model.'); return }
    if (selectedIds.size === 0) { toast.warning('Please select at least one part.'); return }

    const selectedParts = parts.filter(p => selectedIds.has(p.partNo))

    const payload = {
      jobNo: form.jobNo,
      model: form.model,
      priority: form.priority || null,
      requiredDate: form.requiredDate || null,
      note: form.note || null,
      partImage: partImage || null,
      selfStockIn: true,          // Auto Job Entries are treated as Self Stock In
      selectedCustomers: null,
      lineItems: selectedParts.map(p => ({
        partNo: p.partNo,
        partName: p.partName,
        planQty: p.qty || 0,
        uom: p.uom || '',
      })),
    }

    try {
      const res = await api.post('/api/job-card', payload)
      if (res.data?.success) {
        toast.success('Auto Job Entry saved successfully!')
        await fetchJobCards()
        await fetchNextJobNo()
        handleClear()
      } else {
        toast.error(res.data?.message || 'Failed to save Auto Job Entry.')
      }
    } catch (err) {
      console.error('Error saving Auto Job Entry', err)
      toast.error('Error saving: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleCreateRouteCard = () => {
    if (selectedIds.size === 0) { toast.warning('Please select parts to create Route Card.'); return }
    toast.success(`Route Card created for ${selectedIds.size} part(s).`)
  }

  const handleClear = () => {
    setForm(f => ({ ...f, model: '', priority: '', note: '', requiredDate: new Date().toISOString().split('T')[0] }))
    setParts([])
    setSelectedIds(new Set())
    setSelectAll(false)
    clearImage()
  }

  // ── Filter saved jobs by search term ────────────────────────────────────────
  const filtered = savedJobs.filter(j => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return j.jobNo?.toLowerCase().includes(q) || j.model?.toLowerCase().includes(q)
  })

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Technical</span><ChevronRight size={12} /><span className="text-[#0097A7]">Auto Job Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Auto Job Entry</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm"><RotateCcw size={14} /> Clear</button>
              <button className="text-slate-400 hover:text-red-600 transition-colors ml-1"><X size={20} strokeWidth={2.5} /></button>
            </div>
          </div>

          <div className="p-5">
            {/* ── Form Section ── */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left form fields */}
              <div className="col-span-9 space-y-3">
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-3">
                    <Label required>Job No</Label>
                    <Input value={form.jobNo} readOnly className="!font-bold text-[#0097A7]" placeholder="Auto-generated" />
                  </div>
                  <div className="col-span-5">
                    <Label required>Model</Label>
                    <Select
                      options={vehicleTypes.length > 0 ? vehicleTypes : [
                        'V2I', 'V4', 'V4I', 'V7', 'V3i', 'V9', 'VEDC', 'RC', 'V10', 'POWERPACK', 'VELSON',
                        'Velson customer requirement', 'GRIPPER', 'GEARBOX', 'SAMP', 'COMMON', 'UNDERGROUND DRILL',
                        'Consumables', 'V3 XL', 'COMPRESSOR', 'EQUALIZER BEAM', 'VEM', 'CORE DRILL', 'HDE',
                        'GRADE CONTROL MACHINE', 'MICROBLAST', 'MINICORE', 'HD 300', 'AUTO JOB', 'HMD',
                      ]}
                      value={form.model}
                      onChange={handleModelChange}
                      placeholder="--- Select Model ---"
                    />
                  </div>
                  <div className="col-span-4 flex gap-2">
                    <div className="flex-1">
                      <Label>Required Date</Label>
                      <Input type="date" value={form.requiredDate} onChange={u('requiredDate')} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-3">
                    <Label>Priority</Label>
                    <Select options={priorities} value={form.priority} onChange={u('priority')} placeholder="--- Select ---" />
                  </div>
                  <div className="col-span-5">
                    <Label>Note</Label>
                    <Input value={form.note} onChange={u('note')} placeholder="Enter notes..." />
                  </div>
                  <div className="col-span-4 flex items-end gap-2">
                    <button onClick={handleCreateRouteCard} className="flex items-center gap-1.5 px-4 py-[7px] bg-slate-50 hover:bg-slate-100 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm active:scale-95">
                      <div className="w-2.5 h-2.5 bg-red-600 rounded-full" /> Created Route Card
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95"><Save size={14} /> Save</button>
                  </div>
                </div>
              </div>

              {/* Right: Part Image */}
              <div className="col-span-3">
                <Label>Part Image</Label>
                <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {partImage ? (
                  <div className="relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <img src={partImage} alt="Part" className="w-full h-[95px] object-contain p-2" />
                    <button onClick={clearImage} className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-red-50 rounded-full p-0.5 text-slate-400 hover:text-red-600 transition-all shadow-sm"><X size={14} /></button>
                    <button onClick={() => imgRef.current?.click()} className="absolute bottom-1.5 right-1.5 bg-white/90 hover:bg-[#0097A7]/10 rounded-full p-1 text-slate-400 hover:text-[#0097A7] transition-all shadow-sm"><Upload size={12} /></button>
                  </div>
                ) : (
                  <div onClick={() => imgRef.current?.click()} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center py-6 text-slate-300 hover:border-[#0097A7] hover:bg-[#0097A7]/5 transition-all cursor-pointer group">
                    <ImageIcon size={28} strokeWidth={1.2} className="group-hover:text-[#0097A7] transition-colors" />
                    <p className="text-[10px] font-black mt-1.5 uppercase tracking-widest text-slate-400 group-hover:text-[#0097A7]">Click to upload</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Select All ── */}
            <div className="flex items-center gap-3 mt-4 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={handleSelectAll}>
                {selectAll ? <CheckSquare size={15} className="text-[#0097A7]" /> : <Square size={15} className="text-slate-400" />}
                <span className="text-[11px] font-bold text-slate-600 uppercase">Select All</span>
              </label>
              {selectedIds.size > 0 && (
                <span className="text-[10px] font-bold text-[#0097A7] bg-[#0097A7]/10 px-2 py-0.5 rounded-full">{selectedIds.size} selected</span>
              )}
            </div>

            {/* ── Parts Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead className="bg-[#e3f2fd] text-[10px] uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-2.5 border-r border-slate-200 w-10 text-center">
                        <button onClick={handleSelectAll}>
                          {selectAll ? <CheckSquare size={14} className="text-[#0097A7]" /> : <Square size={14} className="text-slate-400" />}
                        </button>
                      </th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-8 text-center">#</th>
                      <th className="px-3 py-2.5 border-r border-slate-200">Part No</th>
                      <th className="px-3 py-2.5 border-r border-slate-200">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-16 text-center">Qty</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-16 text-center">UOM</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-20 text-center">Min Stock</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-24 text-center">Closing Qty</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-40">Created Date</th>
                      <th className="px-3 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partsLoading ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-[#0097A7] border-t-transparent rounded-full animate-spin" />
                            <p className="text-[12px] font-bold uppercase tracking-widest">Loading parts...</p>
                          </div>
                        </td>
                      </tr>
                    ) : parts.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-20 text-center text-slate-300">
                          <Search size={40} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
                          <p className="text-[12px] font-bold uppercase tracking-widest">Select a Model to load parts</p>
                        </td>
                      </tr>
                    ) : (
                      parts.map((p, i) => {
                        const isSelected = selectedIds.has(p.partNo)
                        return (
                          <tr
                            key={p.partNo || i}
                            className={`h-9 hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-[#0097A7]/5' : ''}`}
                            onClick={() => toggleSelect(p.partNo)}
                          >
                            <td className="px-2 py-1 border-r border-slate-200 text-center">
                              {isSelected ? <CheckSquare size={14} className="text-[#0097A7]" /> : <Square size={14} className="text-slate-300" />}
                            </td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[11px] text-slate-400 font-bold">{i + 1}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-[12px] font-bold text-[#0097A7]">{p.partNo}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-[12px] text-slate-700 font-semibold">{p.partName}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] font-bold text-slate-600">
                              {typeof p.qty === 'number' ? p.qty.toFixed(2) : p.qty || '0.00'}
                            </td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] text-slate-500">{p.uom}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] text-slate-600">{p.minStock}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] text-slate-500">
                              {typeof p.closingQty === 'number' ? p.closingQty.toFixed(2) : p.closingQty ?? '0.00'}
                            </td>
                            <td className="px-3 py-1 border-r border-slate-200 text-[11px] text-slate-400">{p.createdDate}</td>
                            <td className="px-3 py-1 text-[12px] text-slate-400 italic">{p.description || ''}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer status */}
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {loading ? 'Loading...' : parts.length > 0 ? `${parts.length} parts loaded · ${selectedIds.size} selected` : 'Ready'}
              </p>
              <p className="text-[10px] text-red-500 font-bold">* Are Mandatory</p>
            </div>
          </div>
        </div>

        {/* ── Saved Job Cards Table ── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#0097A7] pl-3">Saved Auto Jobs</h3>
              <span className="bg-[#0097A7]/10 text-[#0097A7] px-2 py-0.5 rounded text-[10px] font-bold">{filtered.length} Records</span>
            </div>
            <div className="relative w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search jobs..."
                className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7]" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b bg-slate-50">
                    <th className="px-4 py-3 font-semibold">Job No</th>
                    <th className="px-4 py-3 font-semibold">Model</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Required Date</th>
                    <th className="px-4 py-3 font-semibold text-center">Parts</th>
                    <th className="px-4 py-3 font-semibold">Note</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 italic text-[12px]">Loading...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 italic text-[12px]">No job cards found</td>
                    </tr>
                  ) : (
                    filtered.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#0097A7] text-[13px]">{job.jobNo}</td>
                        <td className="px-4 py-3 text-slate-600 text-[12px]">{job.model || '—'}</td>
                        <td className="px-4 py-3">
                          {job.priority
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{job.priority}</span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[12px]">{job.requiredDate || '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600 text-[12px] font-bold">{job.lineItems?.length || 0}</td>
                        <td className="px-4 py-3 text-slate-500 text-[12px] italic">{job.note || '—'}</td>
                        <td className="px-4 py-3">
                          {job.status
                            ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${job.status === 'Completed' || job.status === 'Closed' ? 'bg-green-100 text-green-700' : job.status === 'In Process' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{job.status}</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Pending</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
