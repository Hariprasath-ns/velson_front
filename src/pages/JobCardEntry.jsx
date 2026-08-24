import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, Save, Trash2, X, Plus, RotateCcw, Search, Image as ImageIcon, Info, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useReferenceMaster } from '../hooks/useMasterData'
import ItemSearchInput from '../components/ItemSearchInput'
import AuthenticatedImage from '../components/AuthenticatedImage'

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}{children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
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

const getCurrTimeStr = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const emptyLineItem = () => ({
  id: Date.now() + Math.random(),
  partNo: '',
  partName: '',
  description: '',
  qtyV: '',
  planQty: '',
  uom: '',
})

const getStatusBadge = (status) => {
  const st = (status || 'Open').toLowerCase()
  if (st === 'completed' || st === 'close' || st === 'closed') {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 inline-flex"><CheckCircle2 size={11} /> Closed</span>
  }
  if (st === 'in process' || st === 'started' || st === 'in-process') {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 inline-flex"><Clock size={11} /> In Process</span>
  }
  if (st === 'qc pending') {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1 inline-flex"><AlertCircle size={11} /> QC Pending</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 inline-flex">Open</span>
}

export default function JobCardEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobNo: '',
    model: '',
    qtyV: '',
    currentDate: new Date().toISOString().split('T')[0],
    currentTime: getCurrTimeStr(),
    priority: '',
    requiredDate: new Date().toISOString().split('T')[0],
    requiredTime: getCurrTimeStr(),
    note: '',
  })

  const [lineItems, setLineItems] = useState([emptyLineItem()])
  const [savedJobs, setSavedJobs] = useState([])
  const [partImage, setPartImage] = useState(null)
  const [loading, setLoading] = useState(true)

  // Master lists (React Query hooks)
  const { data: vehicleRes = [] } = useReferenceMaster('Vehicle_Type')
  const { data: priorityRes = [] } = useReferenceMaster('Priority')

  const vehicleTypes = useMemo(() => vehicleRes.map(r => r.description).filter(Boolean), [vehicleRes])
  const priorities = useMemo(() => priorityRes.map(r => r.description).filter(Boolean), [priorityRes])
  const [nextJobNo, setNextJobNo] = useState('1')

  const fetchJobCards = async () => {
    try {
      const res = await api.get('/api/job-card', { skipGlobalLoader: true })
      setSavedJobs(res.data?.data || [])
    } catch (err) {
      console.error('Error fetching job cards', err)
    }
  }

  const fetchNextJobNo = async () => {
    try {
      const res = await api.get('/api/job-card/next-no', { skipGlobalLoader: true })
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
        const [jobsRes, nextRes] = await Promise.all([
          api.get('/api/job-card', { skipGlobalLoader: true }).catch(() => ({ data: { data: [] } })),
          api.get('/api/job-card/next-no', { skipGlobalLoader: true }).catch(() => ({ data: { jobNo: '1' } }))
        ])

        setSavedJobs(jobsRes.data?.data || [])
        const nextNo = nextRes.data?.jobNo || '1'
        setNextJobNo(nextNo)
        setForm(f => ({ ...f, jobNo: nextNo, currentTime: getCurrTimeStr(), requiredTime: getCurrTimeStr() }))
      } catch (err) {
        console.error('Error loading page data', err)
        toast.error('Failed to load job card data')
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const addLine = () => setLineItems(prev => [...prev, emptyLineItem()])
  const removeLine = (id) => setLineItems(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  const updateLine = (id, key, val) => setLineItems(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l))

  // Fetch details directly from Item Master when Part No is selected
  const handlePartNoChange = (id, partNoVal, item) => {
    if (item) {
      const hasImg = item.hasImage || !!item.imageMimeType
      if (hasImg) {
        setPartImage(`/api/item-master/${item.id}/download-image`)
      } else if (item.imagePath) {
        setPartImage(item.imagePath.startsWith('http') || item.imagePath.startsWith('/') ? item.imagePath : `/uploads/${item.imagePath}`)
      } else {
        setPartImage(null)
      }
    } else if (lineItems.every(l => l.id === id || !l.partNo)) {
      setPartImage(null)
    }

    setLineItems(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          partNo: partNoVal,
          partName: item ? (item.partName || '') : '',
          description: item ? (item.description || '') : '',
          uom: item ? (item.uom || item.uomName || '') : '',
          qtyV: l.qtyV || form.qtyV || '',
        }
      }
      return l
    }))
  }

  // Selected Part Numbers list for real-time tracking
  const selectedPartNos = useMemo(() => {
    return Array.from(new Set(lineItems.map(l => (l.partNo || '').trim()).filter(Boolean)))
  }, [lineItems])

  // Real-time status and history of jobs matching selected Part Nos (sorted by Part No ascending and date)
  const partJobHistory = useMemo(() => {
    if (selectedPartNos.length === 0) return []
    const history = []
    const seenKeys = new Set()

    savedJobs.forEach(job => {
      const matchingItems = (job.lineItems || []).filter(li => li.partNo && selectedPartNos.includes(li.partNo.trim()))
      if (matchingItems.length > 0) {
        matchingItems.forEach(mi => {
          const uniqueKey = `${job.id}-${mi.partNo}-${mi.id || ''}`
          if (seenKeys.has(uniqueKey)) return
          seenKeys.add(uniqueKey)

          const st = mi.state || mi.status || job.status || 'Open'
          const isClosed = (st || '').toLowerCase() === 'closed' || (st || '').toLowerCase() === 'completed' || (st || '').toLowerCase() === 'close'
          history.push({
            jobId: job.id,
            jobNo: job.jobNo,
            partNo: mi.partNo,
            partName: mi.partName,
            model: job.model || '—',
            qtyV: mi.qtyV != null ? mi.qtyV : (job.qtyV || 0),
            planQty: mi.planQty != null ? mi.planQty : (job.qtyV || 0),
            uom: mi.uom || '—',
            currentDate: job.currentDate,
            priority: job.priority || '—',
            status: isClosed ? 'Closed' : st,
          })
        })
      }
    })
    return history.sort((a, b) => {
      const pCmp = (a.partNo || '').localeCompare(b.partNo || '')
      if (pCmp !== 0) return pCmp
      return new Date(b.currentDate || 0) - new Date(a.currentDate || 0)
    })
  }, [savedJobs, selectedPartNos])

  const handleSave = async () => {
    if (!form.jobNo) {
      toast.warning('Job No is required.')
      return
    }

    const validLines = lineItems.filter(l => l.partNo && l.partNo.trim())
    if (validLines.length === 0) {
      toast.warning('Please select at least one Part No.')
      return
    }

    // Deduplicate valid line items
    const uniqueLines = []
    const seenPartNos = new Set()
    for (const l of validLines) {
      if (!seenPartNos.has(l.partNo.trim().toLowerCase())) {
        seenPartNos.add(l.partNo.trim().toLowerCase())
        uniqueLines.push(l)
      }
    }

    try {
      const payload = {
        ...form,
        partImage,
        lineItems: uniqueLines.map(l => ({
          partNo: l.partNo,
          partName: l.partName,
          description: l.description,
          qtyV: parseFloat(l.qtyV) || parseFloat(form.qtyV) || 0,
          planQty: parseFloat(l.planQty) || 0,
          uom: l.uom,
        })),
        selfStockIn: false,
        selectedCustomers: [],
      }
      const res = await api.post('/api/job-card', payload)
      if (res.data?.success) {
        toast.success('Job Entry Saved Successfully!')
        await fetchJobCards()
        await fetchNextJobNo()
        handleClear()
      } else {
        toast.error(res.data?.message || 'Failed to save Job Entry.')
      }
    } catch (err) {
      console.error('Error saving Job Entry', err)
      toast.error('Error saving Job Entry: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleClear = () => {
    setForm(f => ({
      ...f,
      model: '',
      qtyV: '',
      currentDate: new Date().toISOString().split('T')[0],
      currentTime: getCurrTimeStr(),
      priority: '',
      requiredDate: new Date().toISOString().split('T')[0],
      requiredTime: getCurrTimeStr(),
      note: ''
    }))
    setLineItems([emptyLineItem()])
    setPartImage(null)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Technical</span><ChevronRight size={12} /><span className="text-[#0097A7]">Job Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#0097A7] rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Job Entry</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <RotateCcw size={14} /> Clear
              </button>
              <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-1">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Header Form Layout */}
            <div className="grid grid-cols-12 gap-5 items-stretch">
              {/* Left Side: Form Fields (9 cols) */}
              <div className="col-span-12 lg:col-span-9 space-y-3 flex flex-col justify-between">
                {/* Row 1: Job No, Model, Current Date, Current Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <Label required>Job No</Label>
                    <Input value={form.jobNo} readOnly className="!font-bold text-[#0097A7]" />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Select options={vehicleTypes} value={form.model} onChange={u('model')} placeholder="Select Model..." />
                  </div>
                  <div>
                    <Label>Current Date</Label>
                    <Input type="date" value={form.currentDate} readOnly className="bg-slate-50 text-slate-600 cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>Current Time</Label>
                    <Input value={form.currentTime} readOnly className="bg-slate-50 font-mono text-slate-600" />
                  </div>
                </div>

                {/* Row 2: Priority, Required Date, Required Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <Label>Priority</Label>
                    <Select options={priorities} value={form.priority} onChange={u('priority')} placeholder="Select Priority..." />
                  </div>
                  <div>
                    <Label>Required Date</Label>
                    <Input type="date" value={form.requiredDate} onChange={u('requiredDate')} />
                  </div>
                  <div>
                    <Label>Required Time</Label>
                    <Input type="time" value={form.requiredTime} onChange={u('requiredTime')} />
                  </div>
                </div>

                {/* Row 3: Note (Compact on the left) */}
                <div className="bg-[#e8f5e9] p-2.5 rounded-lg border border-green-200 flex items-center gap-3">
                  <div className="w-12 text-[11px] font-bold text-green-800 uppercase shrink-0">Note</div>
                  <div className="flex-1">
                    <Input value={form.note} onChange={u('note')} placeholder="Enter notes..." className="!py-1.5 !text-xs" />
                  </div>
                </div>
              </div>

              {/* Right Side: Part Image Only (3 cols, extends down to Note) */}
              <div className="col-span-12 lg:col-span-3 flex flex-col self-stretch">
                <Label>Part Image</Label>
                {partImage ? (
                  <div className="flex-1 relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group min-h-[170px] flex items-center justify-center p-2 shadow-inner">
                    <AuthenticatedImage src={partImage} alt="Part" className="w-full h-full object-contain" fallback={<ImageIcon size={32} className="text-slate-400" />} />
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center min-h-[170px] gap-2 text-slate-300 transition-all group">
                    <ImageIcon size={30} strokeWidth={1.5} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Part Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Line Items Table ── */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#0097A7] pl-3">Line Items</h3>
                  <span className="text-[11px] text-slate-400 italic">(Item details fetched from Item Master. Manual entry for QTY/V and Plan Qty.)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addLine} className="flex items-center gap-1.5 px-3 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                    <Plus size={14} /> Add Row
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95">
                    <Save size={14} /> Save
                  </button>
                  <button onClick={handleClear} className="flex items-center gap-1.5 px-4 py-[7px] bg-white hover:bg-red-50 text-red-600 text-[12px] font-bold rounded-lg border border-red-200 transition-all shadow-sm active:scale-95">
                    <Trash2 size={14} /> Clear
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-visible shadow-sm relative z-30">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#e3f2fd] text-[11px] uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-3 border-r border-slate-200 w-10 text-center"></th>
                      <th className="px-2 py-3 border-r border-slate-200 w-12 text-center">S.No</th>
                      <th className="px-2 py-3 border-r border-slate-200 w-36">Part No</th>
                      <th className="px-2 py-3 border-r border-slate-200 w-44">Part Name</th>
                      <th className="px-2 py-3 border-r border-slate-200 w-48">Description</th>
                      <th className="px-2 py-3 border-r border-slate-200 w-24 text-center">QTY / V</th>
                      <th className="px-2 py-3 border-r border-slate-200 w-24 text-center">Plan Qty <span className="text-red-500">*</span></th>
                      <th className="px-2 py-3 w-20 text-center">UOM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((li, idx) => (
                      <tr key={li.id} className="hover:bg-slate-50 transition-colors relative" style={{ zIndex: lineItems.length - idx + 10 }}>
                        <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                          <button onClick={() => removeLine(li.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <X size={13} />
                          </button>
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200 text-center text-slate-400 font-bold text-[12px]">{idx + 1}</td>
                        <td className="px-2 py-1.5 border-r border-slate-200 w-36">
                          <ItemSearchInput
                            value={li.partNo}
                            onChange={(val, item) => handlePartNoChange(li.id, val, item)}
                            displayField="partNo"
                            placeholder="Search Part No..."
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7]"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200 w-44">
                          <input
                            value={li.partName}
                            readOnly
                            placeholder="Auto-populated"
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-slate-50 text-slate-700 font-medium cursor-not-allowed truncate"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200 w-48">
                          <input
                            value={li.description}
                            readOnly
                            placeholder="Auto-populated description..."
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-slate-50 text-slate-700 cursor-not-allowed truncate"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="number"
                            value={li.qtyV}
                            onChange={e => updateLine(li.id, 'qtyV', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] text-center font-bold text-slate-800"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="number"
                            value={li.planQty}
                            onChange={e => updateLine(li.id, 'planQty', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] text-center font-bold text-slate-800"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={li.uom}
                            readOnly
                            placeholder="UOM"
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-slate-50 text-slate-700 text-center cursor-not-allowed font-medium"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Real-time Part Status & History Tracking Panel ── */}
            {selectedPartNos.length > 0 && (
              <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-[#0097A7]" />
                    <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">
                      Selected Part Status & History Real-Time Tracking
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    {selectedPartNos.map(pNo => (
                      <span key={pNo} className="bg-[#0097A7] text-white px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        {pNo}
                      </span>
                    ))}
                  </div>
                </div>

                {partJobHistory.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-[12px] italic">
                    No prior Job Entries found for the selected Part No ({selectedPartNos.join(', ')}). This will be the first Job Entry.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-3 text-[11px] text-slate-600 font-medium">
                      <span>Total Prior Job Entries: <strong className="text-slate-800">{partJobHistory.length}</strong></span>
                      <span>Total Planned Qty: <strong className="text-slate-800">{partJobHistory.reduce((s, h) => s + (parseFloat(h.planQty) || 0), 0)}</strong></span>
                    </div>
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                      <table className="min-w-full text-left text-[12px]">
                        <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Job No</th>
                            <th className="px-3 py-2">Part No</th>
                            <th className="px-3 py-2">Part Name</th>
                            <th className="px-3 py-2">Model</th>
                            <th className="px-3 py-2 text-center">QTY / V</th>
                            <th className="px-3 py-2 text-center">Plan Qty</th>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2 text-center">Live Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {partJobHistory.map((h, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-1.5 font-bold text-[#0097A7]">{h.jobNo}</td>
                              <td className="px-3 py-1.5 font-mono text-[11px] font-semibold">{h.partNo}</td>
                              <td className="px-3 py-1.5 font-medium text-slate-700">{h.partName}</td>
                              <td className="px-3 py-1.5 text-slate-600">{h.model}</td>
                              <td className="px-3 py-1.5 text-center text-slate-700">{h.qtyV}</td>
                              <td className="px-3 py-1.5 text-center font-bold text-slate-800">{h.planQty}</td>
                              <td className="px-3 py-1.5 text-slate-500">{h.currentDate}</td>
                              <td className="px-3 py-1.5 text-center">{getStatusBadge(h.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}