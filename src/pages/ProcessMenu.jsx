import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Save, Trash2, X, RotateCcw, Search, FileText, CheckSquare, Square, Image as ImageIcon, Upload } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}{children}
  </label>
)
const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "", ...props }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} readOnly={readOnly} {...props}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`} />
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

const SearchableSelect = ({ options, placeholder, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const containerRef = useRef(null)

  useEffect(() => {
    setSearch(value || '')
  }, [value])

  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearch(value || '')
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [value])

  const filtered = options.filter(o => 
    (o.label || o.value || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (val) => {
    onChange({ target: { value: val } })
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
            onChange({ target: { value: e.target.value } })
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 px-2 flex items-center text-slate-400 hover:text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">No matches found</div>
          ) : (
            filtered.map(o => (
              <div
                key={o.value}
                onClick={() => handleSelect(o.value)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#0097A7]/10 transition-colors ${o.value === value ? 'bg-[#0097A7]/5 font-semibold text-[#0097A7]' : 'text-slate-700'}`}
              >
                {o.label || o.value}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const STORAGE_KEY = 'velson_process_menu'



export default function ProcessMenu() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobNo: '', itemName: '',
    planDate: new Date().toISOString().split('T')[0],
  })
  const [processes, setProcesses] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [savedRecords, setSavedRecords] = useState([])
  const [activeTab, setActiveTab] = useState('check')
  const [drawingList, setDrawingList] = useState([])


  const [partImage, setPartImage] = useState(null)
  const imgInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPartImage(ev.target.result)
      reader.readAsDataURL(file)
    }
  }
  const clearImage = () => { setPartImage(null); if (imgInputRef.current) imgInputRef.current.value = '' }

  const [jobCardsList, setJobCardsList] = useState([])
  const [processMasters, setProcessMasters] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setSavedRecords(saved)

    const fetchJobCards = async () => {
      try {
        const res = await api.get('/api/job-card')
        if (res.data?.success && res.data.data) {
          setJobCardsList(res.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch job cards:', err)
      }
    }
    const fetchProcessMasters = async () => {
      try {
        const res = await api.get('/api/process-master')
        if (res.data?.success && res.data.data) {
          setProcessMasters(res.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch process masters:', err)
      }
    }
    fetchJobCards()
    fetchProcessMasters()
  }, [])

  useEffect(() => {
    if (form.jobNo && jobCardsList.length > 0) {
      const matched = jobCardsList.find(jc => jc.jobNo === form.jobNo)
      if (matched) {
        const updates = {}
        if (matched.currentDate) {
          updates.planDate = matched.currentDate
        }
        if (matched.lineItems && matched.lineItems.length > 0) {
          updates.itemName = `${matched.lineItems[0].partNo} — ${matched.lineItems[0].partName}`
        }
        setForm(f => ({ ...f, ...updates }))
      }
    }
  }, [form.jobNo, jobCardsList])

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const loadProcessesForItem = async (itemNameValue) => {
    if (!itemNameValue || !form.jobNo) {
      setProcesses([])
      return
    }
    try {
      const res = await api.get(`/api/job-process-menu?jobNo=${encodeURIComponent(form.jobNo)}`)
      if (res.data?.success && res.data.data) {
        const partName = itemNameValue.includes(' — ')
          ? itemNameValue.split(' — ')[1].trim().toLowerCase()
          : itemNameValue.trim().toLowerCase()

        const matchedList = res.data.data.filter(pm =>
          pm.partName && pm.partName.trim().toLowerCase() === partName
        )

        const sorted = [...matchedList].sort((a, b) => {
          const ordA = parseInt(a.processOrder, 10) || 0
          const ordB = parseInt(b.processOrder, 10) || 0
          return ordA - ordB
        })

        const mapped = sorted.map((pm, i) => ({
          id: pm.id,
          sno: i + 1,
          name: pm.processName,
          processOrder: pm.processOrder || '',
          teamId: pm.teamId || '',
          machineName: pm.machineName || '',
          days: pm.days || '0',
          hours: pm.hours || '0',
          minutes: pm.minutes || '0',
          settingTime: pm.settingTime || '0',
          cycleTime: pm.cycleTime || '0',
          handlingTime: pm.handlingTime || '0',
          createdBy: pm.createdBy || '',
          idleTime: pm.idleTime || '0',
          isActive: pm.isActive
        }))

        setProcesses(mapped)
        const activeIds = new Set(mapped.filter(p => p.isActive).map(p => p.id))
        setSelectedIds(activeIds)
        setSelectAll(activeIds.size === mapped.length && mapped.length > 0)
      } else {
        setProcesses([])
        setSelectedIds(new Set())
        setSelectAll(false)
      }
    } catch (err) {
      console.error('Failed to load job processes:', err)
      setProcesses([])
      setSelectedIds(new Set())
      setSelectAll(false)
    }
  }

  useEffect(() => {
    if (form.itemName && form.jobNo) {
      loadProcessesForItem(form.itemName)
    }
  }, [form.itemName, form.jobNo])

  useEffect(() => {
    const fetchItemMasterFiles = async () => {
      if (!form.itemName) {
        setPartImage(null)
        setDrawingList([])
        return
      }
      const partNo = form.itemName.includes(' — ')
        ? form.itemName.split(' — ')[0].trim()
        : form.itemName.trim()

      if (!partNo) {
        setPartImage(null)
        setDrawingList([])
        return
      }

      try {
        const res = await api.get(`/api/item-master?search=${encodeURIComponent(partNo)}`)
        if (res.data?.success && res.data.data && res.data.data.length > 0) {
          const matched = res.data.data.find(item => item.partNo === partNo)
          if (matched) {
            const detailRes = await api.get(`/api/item-master/${matched.id}`)
            if (detailRes.data?.success && detailRes.data.data) {
              const fullItem = detailRes.data.data

              if (fullItem.hasImage || fullItem.imageMimeType) {
                const imgRes = await api.get(`/api/item-master/${fullItem.id}/download-image`, { responseType: 'blob' })
                const imgBlob = new Blob([imgRes.data], { type: fullItem.imageMimeType || 'image/jpeg' })
                setPartImage(URL.createObjectURL(imgBlob))
              } else {
                setPartImage(null)
              }

              let drawings = []
              if (fullItem.hasPdf || fullItem.pdfMimeType) {
                drawings.push({
                  name: fullItem.pdfPath || `${fullItem.partNo}_Drawing.pdf`,
                  url: `/api/item-master/${fullItem.id}/download-pdf`
                })
              }
              setDrawingList(drawings)
            }
          } else {
            setPartImage(null)
            setDrawingList([])
          }
        } else {
          setPartImage(null)
          setDrawingList([])
        }
      } catch (err) {
        console.error('Failed to load item master details:', err)
        setPartImage(null)
        setDrawingList([])
      }
    }
    fetchItemMasterFiles()
  }, [form.itemName])

  const handleViewDrawing = async (url) => {
    try {
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
    } catch (err) {
      console.error('Failed to open drawing:', err)
      toast.error('Could not open the drawing PDF.')
    }
  }

  // When job number is entered, simulate loading processes
  const handleLoadJob = () => {
    if (!form.jobNo) { toast.warning('Please enter a Job No.'); return }
    const matched = jobCardsList.find(jc => jc.jobNo === form.jobNo)
    if (matched) {
      const updates = {}
      if (matched.currentDate) {
        updates.planDate = matched.currentDate
      }
      if (matched.lineItems && matched.lineItems.length > 0) {
        updates.itemName = `${matched.lineItems[0].partNo} — ${matched.lineItems[0].partName}`
      }
      setForm(f => ({ ...f, ...updates }))
      if (matched.lineItems && matched.lineItems.length > 0) {
        loadProcessesForItem(`${matched.lineItems[0].partNo} — ${matched.lineItems[0].partName}`)
      }
    }
    setSelectedIds(new Set())
    setSelectAll(false)
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processes.map(p => p.id)))
    }
    setSelectAll(!selectAll)
  }

  const handleSave = async () => {
    if (!form.jobNo || !form.itemName) { toast.warning('Please fill Job No and Item Name.'); return }

    const partNo = form.itemName.includes(' — ') ? form.itemName.split(' — ')[0].trim() : '';

    const processesPayload = processes.map(p => ({
      processName: p.name,
      processOrder: p.processOrder,
      isActive: selectedIds.has(p.id)
    }))

    try {
      const res = await api.put('/api/job-process-menu', {
        jobNo: form.jobNo,
        partNo,
        processes: processesPayload
      })

      if (res.data?.success) {
        toast.success('Process Menu saved successfully!')
        loadProcessesForItem(form.itemName)
      } else {
        toast.error(res.data?.message || 'Failed to save process menu.')
      }
    } catch (err) {
      console.error('Failed to save job processes:', err)
      toast.error('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteAll = () => {
    if (selectedIds.size === 0) { toast.warning('Please select processes to deselect.'); return }
    const nextSelected = new Set(selectedIds)
    processes.forEach(p => {
      if (selectedIds.has(p.id)) {
        nextSelected.delete(p.id)
      }
    })
    setSelectedIds(nextSelected)
    setSelectAll(false)
    toast.success(selectedIds.size + ' process(es) deselected. Click Save to record changes.')
  }



  const handleClear = () => {
    setForm({ jobNo: '', itemName: '', planDate: new Date().toISOString().split('T')[0] })
    setProcesses([])
    setSelectedIds(new Set())
    setSelectAll(false)
    setDrawingList([])
    clearImage()
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} /><span className="text-[#0097A7]">Process Menu</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Process Menu</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm"><RotateCcw size={14} /> Clear</button>
              <button className="text-slate-400 hover:text-red-600 transition-colors ml-1"><X size={20} strokeWidth={2.5} /></button>
            </div>
          </div>

          <div className="p-5">
            {/* ── Top Form Row ── */}
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-3">
                <Label required>Job No</Label>
                <div className="flex gap-1 items-center">
                  <SearchableSelect
                    options={jobCardsList.map(jc => ({
                      value: jc.jobNo,
                      label: jc.jobNo
                    }))}
                    value={form.jobNo}
                    onChange={u('jobNo')}
                    placeholder="Enter or select Job No..."
                  />
                  <button onClick={handleLoadJob} className="px-2 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white rounded-lg transition-all active:scale-95 flex-shrink-0" title="Load Job">
                    <Search size={14} />
                  </button>
                </div>
              </div>
              <div className="col-span-3">
                <Label required>Item Name</Label>
                <Select
                  options={
                    (() => {
                      const matched = jobCardsList.find(jc => jc.jobNo === form.jobNo)
                      return matched && matched.lineItems
                        ? matched.lineItems.map(item => `${item.partNo} — ${item.partName}`)
                        : []
                    })()
                  }
                  value={form.itemName}
                  onChange={u('itemName')}
                  placeholder="Select Item..."
                />
              </div>
              <div className="col-span-2">
                <Label>Plan Date</Label>
                <Input type="date" value={form.planDate} onChange={u('planDate')} />
              </div>
              <div className="col-span-4 flex items-end gap-2 justify-end">
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95"><Save size={14} /> Save</button>
                <button onClick={handleSelectAll} className="flex items-center gap-1.5 px-3 py-[7px] bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                  {selectAll ? <CheckSquare size={14} className="text-[#0097A7]" /> : <Square size={14} />} Select All
                </button>
                <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-[7px] bg-white hover:bg-red-50 text-red-600 text-[12px] font-bold rounded-lg border border-red-200 transition-all shadow-sm"><Trash2 size={14} /> Delete</button>
              </div>
            </div>

            {/* ── Main Content Area ── */}
            <div className="grid grid-cols-12 gap-4 mt-5">
              {/* Left: Process Table */}
              <div className="col-span-9">
                {/* Tab */}
                <div className="flex gap-1 mb-0">
                  <button
                    onClick={() => setActiveTab('check')}
                    className={`px-4 py-2 text-[12px] font-bold rounded-t-lg border border-b-0 transition-all ${activeTab === 'check' ? 'bg-white text-[#0097A7] border-slate-200' : 'bg-slate-100 text-slate-400 border-transparent hover:text-slate-600'}`}
                  >Check</button>
                </div>

                <div className="border border-slate-200 rounded-b-xl rounded-tr-xl overflow-hidden shadow-sm min-h-[350px] bg-white">
                  {processes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-slate-300">
                      <FileText size={48} strokeWidth={1} className="mb-3 opacity-30" />
                      <p className="text-[12px] font-bold uppercase tracking-widest">No processes loaded</p>
                      <p className="text-[11px] text-slate-400 mt-1">Enter a Job No and click search to load processes</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <colgroup>
                        <col style={{ width: '3%' }} />   {/* checkbox */}
                        <col style={{ width: '4%' }} />   {/* S.No */}
                        <col style={{ width: '14%' }} />  {/* Process Name */}
                        <col style={{ width: '5%' }} />   {/* Process Order */}
                        <col style={{ width: '6%' }} />   {/* Team */}
                        <col style={{ width: '12%' }} />  {/* Machine Name */}
                        <col style={{ width: '5%' }} />   {/* Days */}
                        <col style={{ width: '5%' }} />   {/* Hours */}
                        <col style={{ width: '5%' }} />   {/* Minutes */}
                        <col style={{ width: '6%' }} />   {/* Setting Time */}
                        <col style={{ width: '6%' }} />   {/* Cycle Time */}
                        <col style={{ width: '7%' }} />   {/* Handling Time */}
                        <col style={{ width: '8%' }} />   {/* Created By */}
                        <col style={{ width: '5%' }} />   {/* Idle Time */}
                      </colgroup>
                      <thead className="bg-[#e3f2fd] border-b border-slate-200">
                        <tr>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-center">
                            <button onClick={handleSelectAll}>
                              {selectAll ? <CheckSquare size={13} className="text-[#0097A7]" /> : <Square size={13} className="text-slate-400" />}
                            </button>
                          </th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">S.No</th>
                          <th className="px-2 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold leading-tight">Process Name</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Order</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Team</th>
                          <th className="px-2 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold leading-tight">Machine Name</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Days</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Hours</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Mins</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Setting<br/>Time</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Cycle<br/>Time</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Handling<br/>Time</th>
                          <th className="px-1 py-2.5 border-r border-slate-200 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Created<br/>By</th>
                          <th className="px-1 py-2.5 text-[9px] uppercase text-slate-600 font-bold text-center leading-tight">Idle<br/>Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processes.map(p => (
                          <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(p.id) ? 'bg-[#0097A7]/5' : ''}`}>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center">
                              <button onClick={() => toggleSelect(p.id)}>
                                {selectedIds.has(p.id) ? <CheckSquare size={13} className="text-[#0097A7]" /> : <Square size={13} className="text-slate-300" />}
                              </button>
                            </td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-500 font-bold">{p.sno}</td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-[11px] font-semibold text-slate-700 truncate">{p.name}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-500">{p.processOrder}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-500">{p.teamId || '—'}</td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-[11px] text-slate-600 truncate">{p.machineName || '—'}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-600">{p.days}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-600">{p.hours}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-600">{p.minutes}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-600">{p.settingTime}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-600">{p.cycleTime}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-600">{p.handlingTime}</td>
                            <td className="px-1 py-1.5 border-r border-slate-200 text-center text-[11px] text-slate-500">{p.createdBy || '—'}</td>
                            <td className="px-1 py-1.5 text-center text-[11px] text-slate-600">{p.idleTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right: Part Image + Drawing List */}
              <div className="col-span-3 space-y-4">
                <div>
                  <Label>Part Image</Label>
                  <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {partImage ? (
                    <div className="relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <img src={partImage} alt="Part" className="w-full h-[140px] object-contain p-2" />
                      <button onClick={clearImage} className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-red-50 rounded-full p-0.5 text-slate-400 hover:text-red-600 transition-all shadow-sm"><X size={14} /></button>
                      <button onClick={() => imgInputRef.current?.click()} className="absolute bottom-1.5 right-1.5 bg-white/90 hover:bg-[#0097A7]/10 rounded-full p-1 text-slate-400 hover:text-[#0097A7] transition-all shadow-sm"><Upload size={12} /></button>
                    </div>
                  ) : (
                    <div onClick={() => imgInputRef.current?.click()} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center py-10 text-slate-300 hover:border-[#0097A7] hover:bg-[#0097A7]/5 transition-all cursor-pointer group">
                      <ImageIcon size={32} strokeWidth={1.2} className="group-hover:text-[#0097A7] transition-colors" />
                      <p className="text-[10px] font-black mt-2 uppercase tracking-widest text-slate-400 group-hover:text-[#0097A7]">Click to upload</p>
                    </div>
                  )}
                </div>

                {/* Drawing List */}
                <div>
                  <Label>Drawing List</Label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[180px]">
                    {drawingList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        <FileText size={24} strokeWidth={1.2} className="opacity-30" />
                        <p className="text-[10px] font-bold mt-1 uppercase tracking-widest text-slate-400">No drawings</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {drawingList.map((d, i) => (
                          <div key={i} onClick={() => handleViewDrawing(d.url)} className="px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer group">
                            <FileText size={14} className="text-[#0097A7] flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-slate-600 group-hover:text-[#0097A7] truncate">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
