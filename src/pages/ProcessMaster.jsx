import { useState, useEffect, Fragment, useRef } from 'react'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, ChevronDown, Search, Settings2, Image as ImageIcon, FileText, Plus, Loader2, AlertTriangle, XCircle } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

const PAGE_SIZES = [4, 10, 25, 50]

const empty = {
  PM_Part_No: '', PM_Part_Name: '', PM_Process_Name: '', PM_Process_Name1: '',
  PM_Process_Order: '1', TeamId: '', Machine_Code: '', Machine_Name: '',
  PM_Days: '', PM_Hours: '', Minutes: '',
  Setting_Time: '', Cycle_Time: '', Handling_Time: '', Idle_Time: '',
}

const today = () => new Date().toISOString().slice(0, 10)

const COLUMN_WIDTHS = {
  'S.No': 'w-[35px]',
  'Process Name': 'w-[19%]',
  'Process Order': 'w-[60px]',
  'Team': 'w-[80px]',
  'Machine Name': 'w-[17%]',
  'Days': 'w-[40px]',
  'Hours': 'w-[40px]',
  'minutes': 'w-[50px]',
  'Setting_Time': 'w-[70px]',
  'Cycle_Time': 'w-[70px]',
  'Handling_Time': 'w-[75px]',
  'Created by': 'w-[80px]',
  'Idel Time': 'w-[65px]',
}

const getHeaderDisplay = (h) => {
  if (h === 'Setting_Time') return 'Setting Time'
  if (h === 'Cycle_Time') return 'Cycle Time'
  if (h === 'Handling_Time') return 'Handling Time'
  if (h === 'Idel Time') return 'Idle Time'
  if (h === 'minutes') return 'Minutes'
  return h
}

export default function ProcessMaster() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ ...empty })
  const [editId, setEditId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(4)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [partItems, setPartItems] = useState([])
  const [partUploads, setPartUploads] = useState([])
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [zoomImage, setZoomImage] = useState(null)
  const [processTypes, setProcessTypes] = useState([])
  const [teams, setTeams] = useState([])
  const [machines, setMachines] = useState([])
  const [isAddMode, setIsAddMode] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [partFilter, setPartFilter] = useState('')
  const [expandedPart, setExpandedPart] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    isDeleteAll: false,
    errorMsg: '',
    isDeleting: false
  })
  const [isPartNoDropdownOpen, setIsPartNoDropdownOpen] = useState(false)
  const [partNoHighlightedIndex, setPartNoHighlightedIndex] = useState(-1)
  const partNoDropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (partNoDropdownRef.current && !partNoDropdownRef.current.contains(e.target)) {
        setIsPartNoDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const filteredPartItems = partItems.filter(item =>
    (item.partNo || '').toLowerCase().includes((form.PM_Part_No || '').toLowerCase())
  )

  const handlePartNoKeyDown = (e) => {
    if (!isPartNoDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsPartNoDropdownOpen(true)
        return
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setPartNoHighlightedIndex(prev =>
        prev < filteredPartItems.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setPartNoHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : filteredPartItems.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (partNoHighlightedIndex >= 0 && partNoHighlightedIndex < filteredPartItems.length) {
        const selected = filteredPartItems[partNoHighlightedIndex]
        sf('PM_Part_No', selected.partNo)
        setIsPartNoDropdownOpen(false)
      } else {
        const matched = partItems.find(item => (item.partNo || '').toLowerCase() === (form.PM_Part_No || '').toLowerCase())
        if (matched) {
          sf('PM_Part_No', matched.partNo)
        }
        setIsPartNoDropdownOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsPartNoDropdownOpen(false)
    }
  }

  const fetchAllProcesses = () => {
    api.get('/api/process-master', { loadingMessage: 'Loading processes...' })
      .then(res => setRows(res.data.data || []))
      .catch(() => { })
  }

  useEffect(() => {
    fetchAllProcesses()

    api.get('/api/item-master?limit=99999', { loadingMessage: 'Loading parts...' })
      .then(res => setPartItems(res.data.data || []))
      .catch(() => { })

    Promise.allSettled([
      api.get(`/api/reference-master/${encodeURIComponent('Process_Type')}`, { loadingMessage: 'Loading references...' })
        .then(res => setProcessTypes((res.data.data || []).map(r => r.description || r.code).filter(Boolean)))
        .catch(() => { }),
      api.get(`/api/reference-master/${encodeURIComponent('Team')}`, { loadingMessage: 'Loading references...' })
        .then(res => setTeams((res.data.data || []).map(r => r.description || r.code).filter(Boolean)))
        .catch(() => { }),
      api.get('/api/machine-master', { loadingMessage: 'Loading machines...' })
        .then(res => setMachines((res.data.data || []).filter(m => m.machineCode)))
        .catch(() => { }),
    ])
  }, [])

  useEffect(() => {
    const item = partItems.find(i => i.partName === form.PM_Part_Name)
    if (!item) {
      setSelectedItem(null)
      setPartUploads([])
      return
    }
    setUploadsLoading(true)

    Promise.allSettled([
      api.get(`/api/item-master/${item.id}`, { loadingMessage: 'Loading item details...' }).then(r => r.data),
      api.get(`/api/item-master/${item.id}/uploads`, { loadingMessage: 'Loading item uploads...' }).then(r => r.data)
    ]).then(([resDetail, resUploads]) => {
      if (resDetail.status === 'fulfilled' && resDetail.value.success) {
        setSelectedItem({ ...item, ...resDetail.value.data })
      } else {
        setSelectedItem(item)
      }
      if (resUploads.status === 'fulfilled' && resUploads.value.success) {
        setPartUploads(resUploads.value.data || [])
      } else {
        setPartUploads([])
      }
    }).catch(() => {
      setSelectedItem(item)
      setPartUploads([])
    }).finally(() => {
      setUploadsLoading(false)
    })
  }, [form.PM_Part_Name, partItems])

  const sf = (k, v) => {
    if (k === 'PM_Part_No') {
      // Auto-populate Part Name from the selected Part No
      const item = partItems.find(i => i.partNo === v)
      const partName = item ? item.partName : ''
      const existing = rows.filter(r => r.PM_Part_Name === partName)
      const nextOrder = existing.length > 0
        ? Math.max(...existing.map(r => Number(r.PM_Process_Order || 0))) + 1
        : 1
      setForm(f => ({
        ...f,
        PM_Part_No: v,
        PM_Part_Name: partName,
        PM_Process_Order: String(nextOrder)
      }))
    } else if (k === 'PM_Part_Name') {
      const existing = rows.filter(r => r.PM_Part_Name === v)
      const nextOrder = existing.length > 0
        ? Math.max(...existing.map(r => Number(r.PM_Process_Order || 0))) + 1
        : 1
      setForm(f => ({
        ...f,
        PM_Part_Name: v,
        PM_Process_Order: String(nextOrder)
      }))
    } else if (k === 'Machine_Code') {
      const m = machines.find(x => x.machineCode === v)
      setForm(f => ({ ...f, Machine_Code: v, Machine_Name: m ? m.machineName : '' }))
    } else {
      setForm(f => ({ ...f, [k]: v }))
    }
  }

  const handleSave = () => {
    if (!form.PM_Part_Name.trim()) { toast.warning('Part Name is required.'); return }
    if (!form.PM_Process_Name) { toast.warning('Process Name is required.'); return }
    setIsSaving(true)

    const promise = (editId !== null && !isAddMode)
      ? api.put(`/api/process-master/${editId}`, form, { loadingMessage: 'Updating process...' })
      : api.post('/api/process-master', form, { loadingMessage: 'Saving process...' })

    promise
      .then(res => {
        toast.success(editId && !isAddMode ? 'Process Updated.' : 'Process Created.')
        api.get('/api/process-master', { loadingMessage: 'Refreshing processes...' })
          .then(listRes => {
            const updatedRows = listRes.data.data || []
            setRows(updatedRows)

            const currentPartName = form.PM_Part_Name
            const currentPartNo = form.PM_Part_No
            const existing = updatedRows.filter(r => r.PM_Part_Name === currentPartName)
            const nextOrder = existing.length > 0
              ? Math.max(...existing.map(r => Number(r.PM_Process_Order || 0))) + 1
              : 1

            setForm({
              ...empty,
              PM_Part_No: currentPartNo,
              PM_Part_Name: currentPartName,
              PM_Process_Order: String(nextOrder)
            })
            setEditId(null)
            setSelectedRowId(null)
            setIsAddMode(true)
            setPage(1)
          })
          .catch(() => { })
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Save failed'
        toast.error(msg)
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleEdit = r => {
    const matchedItem = partItems.find(i => i.partName === r.PM_Part_Name)
    setForm({ ...r, PM_Part_No: matchedItem ? matchedItem.partNo : '' })
    setEditId(r.id)
    setIsAddMode(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleAdd = r => {
    const existing = rows.filter(x => x.PM_Part_Name === r.PM_Part_Name)
    const nextOrder = existing.length > 0
      ? Math.max(...existing.map(x => Number(x.PM_Process_Order || 0))) + 1
      : 1

    setForm({
      ...r,
      PM_Process_Name: '',
      PM_Process_Order: String(nextOrder)
    })
    setEditId(r.id)
    setIsAddMode(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleDelete = id => {
    setDeleteConfirm({
      isOpen: true,
      id,
      isDeleteAll: false,
      errorMsg: '',
      isDeleting: false
    })
  }
  const handleClear = () => {
    setForm({ ...empty })
    setEditId(null)
    setSelectedRowId(null)
    setIsAddMode(false)
    setPartUploads([])
    setSelectedItem(null)
  }

  const handleRowClick = r => {
    setSelectedRowId(selectedRowId === r.id ? null : r.id)
  }

  const sortedRows = [...rows].sort((a, b) => {
    const nameA = (a.PM_Part_Name || '').toLowerCase()
    const nameB = (b.PM_Part_Name || '').toLowerCase()
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    const orderA = Number(a.PM_Process_Order || 0)
    const orderB = Number(b.PM_Process_Order || 0)
    return orderA - orderB
  })

  const filtered = sortedRows.filter(r => {
    const matchesSearch = [r.PM_Part_Name, r.PM_Process_Name, r.PM_Process_Name1, r.TeamId, r.Machine_Name, r.Machine_Code].some(v =>
      String(v || '').toLowerCase().includes(search.toLowerCase())
    )
    const matchesPart = partFilter ? r.PM_Part_Name === partFilter : true
    return matchesSearch && matchesPart
  })

  // Group the filtered rows by PM_Part_Name
  const grouped = filtered.reduce((acc, row) => {
    if (!row.PM_Part_Name) return acc;
    if (!acc[row.PM_Part_Name]) {
      acc[row.PM_Part_Name] = {
        partName: row.PM_Part_Name,
        createdBy: row.CreatedBy || 'Admin',
        processes: []
      }
    }
    acc[row.PM_Part_Name].processes.push(row)
    return acc;
  }, {})

  const mainTableRows = Object.values(grouped)

  const total = Math.max(1, Math.ceil(mainTableRows.length / pageSize))
  const paged = mainTableRows.slice((page - 1) * pageSize, page * pageSize)
  const pNums = () => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const ps = [1]
    if (page > 3) ps.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) ps.push(i)
    if (page < total - 2) ps.push('...')
    ps.push(total)
    return ps
  }

  const inp = (err) =>
    `w-full border rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 transition-all bg-white ${err
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-300 focus:ring-[#0097A7]/30 focus:border-[#0097A7]'
    }`
  const lbl = 'block text-[12px] font-semibold text-slate-600 mb-0.5'
  const isPartNameLocked = false
  const roOthers = false
  const roClass = `${inp(false)} bg-slate-50 cursor-not-allowed text-slate-400`

  const COLS = [
    'S.No', 'Process Name', 'Process Order', 'Team', 'Machine Name',
    'Days', 'Hours', 'minutes', 'Setting_Time', 'Cycle_Time', 'Handling_Time',
    'Created by', 'Idel Time'
  ]

  const latestUploadImage = [...partUploads].reverse().find(u => u.hasImage)
  const latestImage = latestUploadImage
    ? `/api/item-master/upload/${latestUploadImage.id}/download-image`
    : (selectedItem && selectedItem.imageMimeType)
      ? `/api/item-master/${selectedItem.id}/download-image`
      : null

  return (
    <div className="p-4 space-y-4 w-full min-w-0 bg-slate-50 min-h-screen antialiased text-slate-800">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Masters</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-[#0097A7] font-semibold">Process Master</span>
      </div>

      {/* Form Card (Top Section) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(15,23,42,0.03)] overflow-hidden">
        {/* Card Header Bar */}
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3 flex items-center justify-between text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-white" />
            <span className="text-[13px] font-bold text-white uppercase tracking-wider">
              {editId && !isAddMode ? `Edit Process (Part: ${form.PM_Part_Name})` : 'Process Master Details'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-white/90 uppercase tracking-wider">
            <button
              onClick={() => {
                setDeleteConfirm({
                  isOpen: true,
                  id: null,
                  isDeleteAll: true,
                  errorMsg: '',
                  isDeleting: false
                })
              }}
              className="flex items-center gap-1.5 hover:text-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" /> Delete All
            </button>
            <button
              onClick={() => {
                const headers = COLS;
                const csvContent = [
                  headers.join(','),
                  ...rows.map((r, idx) => [
                    idx + 1,
                    r.PM_Process_Name,
                    r.PM_Process_Order,
                    r.TeamId,
                    r.Machine_Name,
                    r.PM_Days,
                    r.PM_Hours,
                    r.Minutes,
                    r.Setting_Time,
                    r.Cycle_Time,
                    r.Handling_Time,
                    r.CreatedBy || 'admin',
                    r.Idle_Time
                  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
                ].join('\r\n');

                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `process-master-${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Exported to Excel successfully!');
              }}
              className="flex items-center gap-1.5 hover:text-emerald-100 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-white" /> Excel
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'Dashboard' } }));
              }}
              className="flex items-center gap-1.5 hover:text-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" /> Close
            </button>
          </div>
        </div>

        {/* Card Body (Side-by-side Fields Grid) */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 items-stretch w-full">

            {/* Column 1 (Left Form Inputs) */}
            <div className="flex-1 min-w-0 lg:pr-6 space-y-3">

              {/* Part No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  <span className="text-rose-500 mr-0.5">*</span>Part No
                </label>
                <div className="relative" ref={partNoDropdownRef}>
                  <input
                    type="text"
                    value={form.PM_Part_No}
                    onChange={e => {
                      sf('PM_Part_No', e.target.value)
                      setIsPartNoDropdownOpen(true)
                      setPartNoHighlightedIndex(-1)
                    }}
                    onFocus={() => {
                      setIsPartNoDropdownOpen(true)
                      setPartNoHighlightedIndex(-1)
                    }}
                    onKeyDown={handlePartNoKeyDown}
                    placeholder="Enter Part No..."
                    className={`${inp(false)} pr-8`}
                  />
                  <div
                    onClick={() => setIsPartNoDropdownOpen(o => !o)}
                    className="absolute inset-y-0 right-2 flex items-center cursor-pointer px-1"
                  >
                    <ChevronDown className={`w-4 h-4 text-slate-400 hover:text-[#0097A7] transition-all duration-200 ${isPartNoDropdownOpen ? 'rotate-180 text-[#0097A7]' : ''}`} />
                  </div>
                  {isPartNoDropdownOpen && filteredPartItems.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPartItems.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            sf('PM_Part_No', item.partNo)
                            setIsPartNoDropdownOpen(false)
                          }}
                          onMouseEnter={() => setPartNoHighlightedIndex(idx)}
                          className={`px-3 py-2 text-[13px] cursor-pointer border-b border-slate-100 last:border-0 text-left transition-colors ${
                            partNoHighlightedIndex === idx
                              ? 'bg-[#0097A7] text-white font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`${partNoHighlightedIndex === idx ? 'text-white' : 'text-slate-800'} font-semibold`}>
                            {item.partNo}
                          </span>
                          {item.partName && (
                            <span className={`${partNoHighlightedIndex === idx ? 'text-white/80' : 'text-slate-400'} text-[11px] ml-2 block lg:inline`}>
                              — {item.partName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isPartNoDropdownOpen && filteredPartItems.length === 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-slate-400 italic text-center">
                      No matching parts.
                    </div>
                  )}
                </div>
              </div>

              {/* Part Name — auto-generated from Part No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  <span className="text-rose-500 mr-0.5">*</span>Part Name
                </label>
                <input
                  value={form.PM_Part_Name}
                  readOnly
                  placeholder="Auto-filled from Part No"
                  className={`${inp(false)} bg-slate-50 cursor-not-allowed text-slate-500`}
                />
              </div>

              {/* Process Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  <span className="text-rose-500 mr-0.5">*</span>Process Name
                </label>
                <select
                  value={form.PM_Process_Name}
                  onChange={e => sf('PM_Process_Name', e.target.value)}
                  className={inp(false)}
                >
                  <option value="">---Select Process Type---</option>
                  {processTypes.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Team */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  <span className="text-rose-500 mr-0.5">*</span>Team
                </label>
                <select
                  value={form.TeamId}
                  onChange={e => sf('TeamId', e.target.value)}
                  disabled={roOthers}
                  className={roOthers ? roClass : inp(false)}
                >
                  <option value="">---Select Team---</option>
                  {teams.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Machine Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Machine Code
                </label>
                <select
                  value={form.Machine_Code}
                  onChange={e => sf('Machine_Code', e.target.value)}
                  disabled={roOthers}
                  className={roOthers ? roClass : inp(false)}
                >
                  <option value="">---Select Machine---</option>
                  {machines.map(m => <option key={m.machineCode} value={m.machineCode}>{m.machineCode}</option>)}
                </select>
              </div>

              {/* Process Order & Machine Name side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    <span className="text-rose-500 mr-0.5">*</span>Machine Name
                  </label>
                  <input
                    value={form.Machine_Name}
                    readOnly
                    className={`${inp(false)} bg-slate-50 cursor-not-allowed text-slate-500`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Process Order
                  </label>
                  <input
                    type="number"
                    value={form.PM_Process_Order}
                    onChange={e => sf('PM_Process_Order', e.target.value)}
                    placeholder="e.g. 1"
                    disabled={roOthers}
                    readOnly={roOthers}
                    className={roOthers ? roClass : inp(false)}
                  />
                </div>
              </div>
            </div>

            {/* Column 2 (Time Inputs — 2-column grid) */}
            <div className="flex-1 min-w-0 lg:px-6 lg:border-l lg:border-slate-200">
              <span className="block text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Time & Duration</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                {/* Days */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Day's</label>
                  <input type="number" value={form.PM_Days} onChange={e => sf('PM_Days', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Hours</label>
                  <input type="number" value={form.PM_Hours} onChange={e => sf('PM_Hours', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                </div>

                {/* Minutes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Minutes</label>
                  <input type="number" value={form.Minutes} onChange={e => sf('Minutes', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                </div>

                {/* Setting Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Setting Time</label>
                  <input type="number" value={form.Setting_Time} onChange={e => sf('Setting_Time', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                </div>

                {/* Cycle Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Cycle Time</label>
                  <input type="number" value={form.Cycle_Time} onChange={e => sf('Cycle_Time', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                </div>

                {/* Handling Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Handling Time</label>
                  <input type="number" value={form.Handling_Time} onChange={e => sf('Handling_Time', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                </div>

                {/* Idle Time — spans full width */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Idle Time</label>
                  <input type="number" value={form.Idle_Time} onChange={e => sf('Idle_Time', e.target.value)}
                    placeholder="0" disabled={roOthers} readOnly={roOthers} className={roOthers ? roClass : inp(false)} />
                  <span className="block text-[10px] font-medium text-slate-400 mt-0.5">Idle Time in minutes</span>
                </div>

              </div>
            </div>

            {/* Column 3 (Right Blueprint Image + Action Buttons) */}
            <div className="flex-1 min-w-0 flex flex-col lg:pl-6 lg:border-l lg:border-slate-200">
              <span className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Image</span>
              <div className="h-[240px] border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-center p-3 relative group overflow-hidden shadow-inner">
                {uploadsLoading ? (
                  <Loader2 className="w-6 h-6 text-[#0097A7] animate-spin" />
                ) : latestImage ? (
                  <img
                    src={latestImage}
                    alt="blueprint"
                    onClick={() => setZoomImage(latestImage)}
                    className="max-h-full max-w-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ImageIcon className="w-8 h-8 stroke-[1.2]" />
                    <span className="text-[10px] font-medium">No Blueprint Image</span>
                  </div>
                )}
              </div>
              {/* Action Buttons below the image */}
              <div className="mt-3 space-y-2 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-[#2ecc71] hover:bg-[#27ae60] text-white text-[11px] font-bold rounded shadow transition-colors active:scale-95 disabled:opacity-60"
                  >
                    <Save className="w-5 h-3.5" /> {editId && !isAddMode ? 'Update' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedRowId) {
                        const r = rows.find(x => x.id === selectedRowId)
                        if (r) handleEdit(r)
                      } else {
                        toast.warning('Please click a row in the table first to select it for editing.')
                      }
                    }}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white text-[11px] font-bold rounded shadow transition-colors active:scale-95"
                  >
                    <Edit className="w-5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (selectedRowId) {
                        handleDelete(selectedRowId)
                        handleClear()
                      } else {
                        toast.warning('Please click a row in the table first to select it for deleting.')
                      }
                    }}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[11px] font-bold rounded shadow transition-colors active:scale-95"
                  >
                    <Trash2 className="w-5 h-3.5" /> Delete
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded shadow transition-colors active:scale-95"
                  >
                    <RotateCcw className="w-5 h-3.5" /> Clear
                  </button>
                </div>
                
                {/* <button
                  onClick={() => {
                    if (selectedRowId) {
                      const r = rows.find(x => x.id === selectedRowId)
                      if (r) handleAdd(r)
                    } else {
                      toast.warning('Please click a row in the table first to select it.')
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded shadow transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Process
                </button> */}
              </div>
            </div>

          </div>
        </div>
      </div>

         {/* Table & Toolbar Section (Bottom Section) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(15,23,42,0.03)] overflow-hidden flex-1 flex flex-col min-h-0">
        
        {/* Table Gradient Card Header */}
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3">
          <h2 className="text-white font-bold text-[13.5px] tracking-wide text-center uppercase">Process Master List</h2>
        </div>

        {/* Table Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Search & Part Filter */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold text-slate-600">Search:</span>
              <div className="relative">
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search..."
                  className="pl-3 pr-8 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-48 bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold text-slate-600">Part Filter:</span>
              <select
                value={partFilter}
                onChange={e => { setPartFilter(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white max-w-[200px]"
              >
                <option value="">All Parts</option>
                {Array.from(new Set(rows.map(r => r.PM_Part_Name).filter(Boolean))).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Save/Edit/Delete/Clear Actions with standard palette colors */}
          {/* <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white text-xs font-bold rounded shadow transition-colors active:scale-95 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={() => {
                if (selectedRowId) {
                  const r = rows.find(x => x.id === selectedRowId)
                  if (r) handleEdit(r)
                } else {
                  toast.warning('Please click a row in the table first to select it for editing.')
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-bold rounded shadow transition-colors active:scale-95"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => {
                if (selectedRowId) {
                  handleDelete(selectedRowId)
                  handleClear()
                } else {
                  toast.warning('Please click a row in the table first to select it for deleting.')
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs font-bold rounded shadow transition-colors active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-xs font-bold rounded shadow transition-colors active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          </div> */}
        </div>

        {/* Table Grid (No Add, Edit, Delete, Details columns) */}
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-12 border-r border-slate-200 bg-slate-50"></th>
                <th className="w-16 text-center px-4 py-3 font-bold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 bg-slate-50">S.No</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-[11px] uppercase tracking-wide border-r border-slate-200 bg-slate-50">Part Name</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-[11px] uppercase tracking-wide bg-slate-50">Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Settings2 className="w-8 h-8 text-slate-200 animate-pulse" />
                      <span>No records found. Select or create processes above.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((group, idx) => {
                  const isExpanded = expandedPart === group.partName
                  return (
                    <Fragment key={group.partName}>
                      <tr
                        onClick={() => setExpandedPart(isExpanded ? null : group.partName)}
                        className={`hover:bg-[#0097A7]/5 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-[#0097A7]/5' : idx % 2 === 1 ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        {/* Expand/Collapse Chevron Indicator */}
                        <td className="px-4 py-3 text-center border-r border-slate-100 text-[#0097A7] font-bold text-xs w-12">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedPart(isExpanded ? null : group.partName)
                            }}
                            className="p-1 rounded bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-all flex items-center justify-center inline-flex"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500 font-medium w-16">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100 font-semibold text-slate-800 text-left">
                          {group.partName}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-medium">
                          {group.createdBy}
                        </td>
                      </tr>

                      {/* Expandable sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                              <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-100">
                                <h4 className="text-[11px] font-black text-[#0097A7] uppercase tracking-widest">
                                  Process sequence for: {group.partName}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const existing = rows.filter(x => x.PM_Part_Name === group.partName)
                                    const nextOrder = existing.length > 0
                                      ? Math.max(...existing.map(x => Number(x.PM_Process_Order || 0))) + 1
                                      : 1
                                    setForm({
                                      ...empty,
                                      PM_Part_Name: group.partName,
                                      PM_Process_Order: String(nextOrder)
                                    })
                                    setEditId(null)
                                    setIsAddMode(true)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-[#0097A7] hover:bg-[#00838F] text-white text-[11px] font-bold rounded shadow transition-all active:scale-95"
                                  title="Add new process for this item"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Process
                                </button>
                              </div>
                              <table className="min-w-full text-[12px] border-collapse text-left">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="w-8 px-2 py-2 text-center text-slate-500 bg-slate-50"></th>
                                    {COLS.map(h => (
                                      <th key={h} className="px-3 py-2 font-bold text-slate-600 text-[10.5px] uppercase tracking-wide border-r border-slate-200 last:border-r-0 whitespace-nowrap text-center bg-slate-50">
                                        {getHeaderDisplay(h)}
                                      </th>
                                    ))}
                                    <th className="px-3 py-2 font-bold text-slate-600 text-[10.5px] uppercase tracking-wide whitespace-nowrap text-center bg-slate-50">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {group.processes.map((r, pIdx) => {
                                    const isSelected = selectedRowId === r.id
                                    return (
                                      <tr
                                        key={r.id}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRowClick(r)
                                        }}
                                        onDoubleClick={() => setDetailRow(r)}
                                        className={`hover:bg-[#0097A7]/5 transition-colors cursor-pointer ${
                                          isSelected ? 'bg-[#0097A7]/10' : pIdx % 2 === 1 ? 'bg-slate-50/30' : ''
                                        }`}
                                      >
                                        <td className="px-2 py-2 text-center border-r border-slate-100 text-[#0097A7] font-bold text-xs">
                                          {isSelected ? '▶' : ''}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-500 font-medium">
                                          {pIdx + 1}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 font-semibold text-[#0097A7]">
                                          {r.PM_Process_Name || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.PM_Process_Order || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.TeamId || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.Machine_Name || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.PM_Days ?? 0}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.PM_Hours ?? 0}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.Minutes ?? 0}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.Setting_Time ?? 0}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.Cycle_Time ?? 0}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.Handling_Time ?? 0}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-500 font-medium">
                                          {r.CreatedBy || 'admin'}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-600">
                                          {r.Idle_Time ?? 0}
                                        </td>
                                        <td className="px-3 py-1.5 text-center text-slate-600 whitespace-nowrap">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(r)
                                              }}
                                              className="p-1 text-[#3498db] hover:bg-[#3498db]/10 rounded-md transition-colors"
                                              title="Edit Process"
                                            >
                                              <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(r.id)
                                              }}
                                              className="p-1 text-[#e74c3c] hover:bg-[#e74c3c]/10 rounded-md transition-colors"
                                              title="Delete Process"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/60">
          <span className="text-[12px] text-slate-500">
            Showing <span className="font-semibold text-slate-700">{mainTableRows.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * pageSize, mainTableRows.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{mainTableRows.length}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors">
              Previous
            </button>
            {pNums().map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="px-1.5 text-slate-400 text-[13px]">…</span>
                : <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 text-[12px] rounded-lg border font-semibold transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7] shadow-sm' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                    {n}
                  </button>
            )}
            <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-bold text-[15px]">Process Details</h2>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-0">
              {[
                ['Part Name', detailRow.PM_Part_Name],
                ['Process Name', detailRow.PM_Process_Name],
                ['Process Name 1', detailRow.PM_Process_Name1],
                ['Process Order', detailRow.PM_Process_Order],
                ['Team', detailRow.TeamId],
                ['Machine Code', detailRow.Machine_Code],
                ['Machine Name', detailRow.Machine_Name],
                ['Days', detailRow.PM_Days],
                ['Hours', detailRow.PM_Hours],
                ['Minutes', detailRow.Minutes],
                ['Setting Time', detailRow.Setting_Time],
                ['Cycle Time', detailRow.Cycle_Time],
                ['Handling Time', detailRow.Handling_Time],
                ['Idle Time', detailRow.Idle_Time],
                ['Created By', detailRow.CreatedBy],
                ['Created Date', detailRow.CreatedDate],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col py-2 border-b border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                  <span className="text-[13px] text-slate-800 font-medium">{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 pt-2">
              <button onClick={() => setDetailRow(null)}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Delete Theme & Error Handling) */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Alert icon and Red theme */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 px-6 py-4 flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Trash2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-[15px] uppercase tracking-wide">
                {deleteConfirm.isDeleteAll ? 'Danger: Delete All Records' : 'Confirm Delete'}
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-50 text-red-500 mt-0.5">
                  <AlertTriangle className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">
                    {deleteConfirm.isDeleteAll ? 'Delete All Process Master Records?' : 'Delete Process Master Record?'}
                  </h4>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1">
                    {deleteConfirm.isDeleteAll
                      ? 'Are you absolutely sure you want to clear the entire process master list? This operation is permanent and cannot be undone.'
                      : 'Are you sure you want to delete this process master entry? This action is permanent and cannot be undone.'}
                  </p>
                </div>
              </div>

              {/* Error Alert Display inside Modal */}
              {deleteConfirm.errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error:</span> {deleteConfirm.errorMsg}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                disabled={deleteConfirm.isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(prev => ({ ...prev, isDeleting: true, errorMsg: '' }))
                  const promise = deleteConfirm.isDeleteAll
                    ? api.delete('/api/process-master/all', { loadingMessage: 'Deleting all processes...' })
                    : api.delete(`/api/process-master/${deleteConfirm.id}`, { loadingMessage: 'Deleting process...' })

                  promise
                    .then(() => {
                      toast.success(deleteConfirm.isDeleteAll ? 'All processes deleted.' : 'Process deleted.')
                      setDeleteConfirm(prev => ({ ...prev, isOpen: false }))
                      if (deleteConfirm.isDeleteAll) {
                        setRows([])
                        handleClear()
                      } else {
                        fetchAllProcesses()
                      }
                    })
                    .catch(err => {
                      const msg = err.response?.data?.message || (deleteConfirm.isDeleteAll ? 'Delete all failed' : 'Delete failed')
                      setDeleteConfirm(prev => ({ ...prev, isDeleting: false, errorMsg: msg }))
                      toast.error(msg)
                    })
                }}
                disabled={deleteConfirm.isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors active:scale-95 disabled:opacity-60"
              >
                {deleteConfirm.isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}