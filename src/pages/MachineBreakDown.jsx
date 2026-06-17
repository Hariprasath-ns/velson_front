import { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, Save, X, Search, Edit, Trash2, Eraser,
  FileSpreadsheet, ChevronUp, Wrench, AlertTriangle, User, Calendar,
  RotateCcw, Plus, Activity, RefreshCw
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import * as XLSX from 'xlsx'

// ── Shared UI primitives ──
const Label = ({ children, required, className = "" }) => (
  <label className={`block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider ${className}`}>
    {required && <span className="text-red-500 mr-1">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-2 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} shadow-sm ${className}`}
    {...props}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2 py-1 pr-6 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer shadow-sm font-bold"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const TextArea = ({ placeholder, value, onChange, className = "", rows = 2 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-2 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 hover:border-slate-300 resize-none shadow-sm ${className}`}
  />
)

const ActionButton = ({ onClick, children, className = "", color = "slate" }) => {
  const styles = {
    amber: "text-[#f57c00]",
    emerald: "text-[#2e7d32]",
    rose: "text-[#c62828]",
    slate: "text-slate-600",
    blue: "text-blue-600"
  }
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 flex items-center gap-1 text-[11px] font-black uppercase transition-all active:scale-95 hover:bg-slate-50 rounded ${styles[color] || styles.slate} ${className}`}
    >
      {children}
    </button>
  )
}

const formatLiveDate = (d) => {
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()

  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const hoursStr = String(hours).padStart(2, '0')

  return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`
}

export default function MachineBreakDown() {
  const toast = useToast()
  const [form, setForm] = useState({
    machineName: '',
    jobCardNo: '',
    partNo: '',
    processStage: '',
    location: '',
    date: formatLiveDate(new Date()),
    mwrNo: '4',
    reportedBy: 'admin',
    priority: '',
    problemDescription: '',
    status: 'waiting_clearance'
  })

  const [breakdowns, setBreakdowns] = useState([])
  const [machines, setMachines] = useState([])
  const [priorities, setPriorities] = useState([])
  const [jobCards, setJobCards] = useState([])
  const [processMasters, setProcessMasters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const displayBreakdowns = useMemo(() => {
    if (!searchQuery.trim()) return breakdowns
    const q = searchQuery.toLowerCase()
    return breakdowns.filter(b =>
      String(b.mwrNo || '').toLowerCase().includes(q) ||
      String(b.machineName || '').toLowerCase().includes(q) ||
      String(b.jobCardNo || '').toLowerCase().includes(q) ||
      String(b.partNo || '').toLowerCase().includes(q) ||
      String(b.processStage || '').toLowerCase().includes(q) ||
      String(b.problemDescription || '').toLowerCase().includes(q) ||
      String(b.reportedBy || '').toLowerCase().includes(q)
    )
  }, [breakdowns, searchQuery])

  const handleExportExcel = () => {
    if (displayBreakdowns.length === 0) {
      toast.warning('No records to export.')
      return
    }
    const exportData = displayBreakdowns.map((b, i) => ({
      'S.No': i + 1,
      'MWR No': b.mwrNo || '',
      'Machine Name': b.machineName || '',
      'Job Card No': b.jobCardNo || '',
      'Part No': b.partNo || '',
      'Process Stage': b.processStage || '',
      'Location': b.location || '',
      'Reported By': b.reportedBy || '',
      'Priority': b.priority || 'Standard',
      'Problem Description': b.problemDescription || '',
      'Date': b.date || '',
      'User': 'admin'
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Machine Breakdowns')
    XLSX.writeFile(wb, `machine_breakdowns_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel file exported successfully.')
  }

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRowClick = (b) => {
    setSelectedId(selectedId === b.id ? null : b.id)
  }

  const handleEditSelectedDirectly = (b) => {
    setForm({ ...b })
    setEditId(b.id)
    setSelectedId(b.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteSelectedDirectly = (b) => {
    if (!confirm('Are you sure you want to delete this breakdown ticket?')) return
    api.delete(`/api/machine-breakdown/${b.id}`)
      .then(res => {
        if (res.data?.success) {
          toast.success('Breakdown ticket deleted.')
          fetchBreakdowns()
          if (selectedId === b.id) {
            setSelectedId(null)
            setEditId(null)
            handleReset()
          }
        }
      })
      .catch(err => {
        console.error(err)
        toast.error(err.response?.data?.message || 'Failed to delete ticket.')
      })
  }

  const handleEditSelected = () => {
    if (!selectedId) {
      toast.warning('Please select a breakdown record from the table first.')
      return
    }
    const record = breakdowns.find(b => b.id === selectedId)
    if (record) {
      handleEditSelectedDirectly(record)
    }
  }

  const handleDeleteSelected = () => {
    if (!selectedId) {
      toast.warning('Please select a breakdown record from the table first.')
      return
    }
    const record = breakdowns.find(b => b.id === selectedId)
    if (record) {
      handleDeleteSelectedDirectly(record)
    }
  }

  // Get all unique parts from all job cards
  const allParts = useMemo(() => {
    const parts = new Set()
    jobCards.forEach(jc => {
      jc.lineItems?.forEach(li => {
        if (li.partNo) parts.add(li.partNo)
      })
    })
    return Array.from(parts)
  }, [jobCards])

  const partOptions = useMemo(() => {
    if (form.jobCardNo) {
      const jc = jobCards.find(j => j.jobNo === form.jobCardNo)
      if (jc && jc.lineItems) {
        const parts = jc.lineItems.map(li => li.partNo).filter(Boolean)
        return Array.from(new Set(parts))
      }
    }
    return allParts
  }, [allParts, form.jobCardNo, jobCards])

  const jobCardOptions = useMemo(() => {
    if (form.partNo) {
      return jobCards
        .filter(jc => jc.lineItems?.some(li => li.partNo === form.partNo))
        .map(jc => jc.jobNo)
        .filter(Boolean)
    }
    return jobCards.map(jc => jc.jobNo).filter(Boolean)
  }, [jobCards, form.partNo])

  const currentPartName = useMemo(() => {
    if (!form.partNo) return ''
    for (const jc of jobCards) {
      const found = jc.lineItems?.find(li => li.partNo === form.partNo)
      if (found?.partName) return found.partName
    }
    return ''
  }, [form.partNo, jobCards])

  const processStageOptions = useMemo(() => {
    if (!currentPartName) return []
    const matched = processMasters.filter(pm =>
      pm.PM_Part_Name && pm.PM_Part_Name.trim().toLowerCase() === currentPartName.trim().toLowerCase()
    )
    return Array.from(new Set(matched.map(pm => pm.PM_Process_Name).filter(Boolean)))
  }, [currentPartName, processMasters])

  const handlePartNoChange = (e) => {
    const val = e.target.value
    setForm(f => {
      const nextForm = { ...f, partNo: val }
      if (f.jobCardNo) {
        const jc = jobCards.find(j => j.jobNo === f.jobCardNo)
        const hasPart = jc?.lineItems?.some(li => li.partNo === val)
        if (!hasPart) {
          nextForm.jobCardNo = ''
        }
      }
      let partName = ''
      for (const jc of jobCards) {
        const found = jc.lineItems?.find(li => li.partNo === val)
        if (found?.partName) {
          partName = found.partName
          break
        }
      }
      const matchedStageOpts = partName
        ? processMasters
          .filter(pm => pm.PM_Part_Name && pm.PM_Part_Name.trim().toLowerCase() === partName.trim().toLowerCase())
          .map(pm => pm.PM_Process_Name)
          .filter(Boolean)
        : []
      if (f.processStage && !matchedStageOpts.includes(f.processStage)) {
        nextForm.processStage = ''
      }
      return nextForm
    })
  }

  const handleJobCardNoChange = (e) => {
    const val = e.target.value
    setForm(f => {
      const nextForm = { ...f, jobCardNo: val }
      const jc = jobCards.find(j => j.jobNo === val)
      const parts = jc?.lineItems?.map(li => li.partNo).filter(Boolean) || []

      let nextPart = f.partNo
      if (parts.length === 1) {
        nextPart = parts[0]
        nextForm.partNo = parts[0]
      } else if (f.partNo && !parts.includes(f.partNo)) {
        nextPart = ''
        nextForm.partNo = ''
      }

      let partName = ''
      if (nextPart) {
        for (const j of jobCards) {
          const found = j.lineItems?.find(li => li.partNo === nextPart)
          if (found?.partName) {
            partName = found.partName
            break
          }
        }
      }
      const matchedStageOpts = partName
        ? processMasters
          .filter(pm => pm.PM_Part_Name && pm.PM_Part_Name.trim().toLowerCase() === partName.trim().toLowerCase())
          .map(pm => pm.PM_Process_Name)
          .filter(Boolean)
        : []
      if (f.processStage && !matchedStageOpts.includes(f.processStage)) {
        nextForm.processStage = ''
      }
      return nextForm
    })
  }

  const fetchBreakdowns = () => {
    api.get('/api/machine-breakdown')
      .then(res => {
        if (res.data?.success) {
          setBreakdowns(res.data.data)
        }
      })
      .catch(err => console.error('Failed to fetch breakdowns:', err))
  }

  const fetchNextMwr = () => {
    api.get('/api/machine-breakdown/next-mwr')
      .then(res => {
        if (res.data?.success && res.data.nextMwr) {
          setForm(f => ({ ...f, mwrNo: res.data.nextMwr }))
        }
      })
      .catch(err => console.error('Failed to fetch next MWR no:', err))
  }

  const handleSave = () => {
    if (editId) {
      api.put(`/api/machine-breakdown/${editId}`, form)
        .then(res => {
          if (res.data?.success) {
            toast.success('Breakdown ticket updated.')
            fetchBreakdowns()
            handleReset()
          }
        })
        .catch(err => {
          console.error(err)
          toast.error(err.response?.data?.message || 'Failed to update ticket.')
        })
    } else {
      api.post('/api/machine-breakdown', form)
        .then(res => {
          if (res.data?.success) {
            toast.success('Breakdown ticket registered.')
            fetchBreakdowns()
            handleReset()
          }
        })
        .catch(err => {
          console.error(err)
          toast.error(err.response?.data?.message || 'Failed to register ticket.')
        })
    }
  }

  const handleReset = () => {
    setForm({
      ...form,
      machineName: '',
      jobCardNo: '',
      partNo: '',
      processStage: '',
      problemDescription: '',
      location: '',
      date: formatLiveDate(new Date()),
    })
    fetchNextMwr()
    setEditId(null)
    setSelectedId(null)
  }

  // Live clock for date field in creation mode
  useEffect(() => {
    if (editId) return

    const tick = () => {
      setForm(f => {
        if (editId) return f
        return { ...f, date: formatLiveDate(new Date()) }
      })
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [editId])

  useEffect(() => {
    fetchBreakdowns()
    fetchNextMwr()

    api.get('/api/machine-master')
      .then(res => {
        const list = res.data?.data || []
        setMachines(list.map(m => m.machineName).filter(Boolean))
      })
      .catch(err => console.error('Failed to fetch machines:', err))

    api.get('/api/reference-master/Priority')
      .then(res => {
        const list = res.data?.data || []
        setPriorities(list.map(p => p.description).filter(Boolean))
      })
      .catch(err => console.error('Failed to fetch priorities:', err))

    api.get('/api/job-card')
      .then(res => {
        if (res.data?.success && res.data.data) {
          setJobCards(res.data.data)
        }
      })
      .catch(err => console.error('Failed to fetch job cards:', err))

    api.get('/api/process-master')
      .then(res => {
        if (res.data?.success && res.data.data) {
          setProcessMasters(res.data.data)
        }
      })
      .catch(err => console.error('Failed to fetch process masters:', err))
  }, [])

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-700 rounded-sm" />
          <h1 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">Machine BreakDown</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-0.5 rounded transition-colors"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={() => window.history.back()} className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded transition-colors shadow-sm">
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Entry Section */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-12 gap-x-12 gap-y-4">
            {/* Left Column */}
            <div className="col-span-5 space-y-3">
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label required>Machine Name :</Label></div>
                <div className="col-span-8"><Select options={machines} placeholder="Select Machine" value={form.machineName} onChange={u('machineName')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Job Card No :</Label></div>
                <div className="col-span-8"><Select options={jobCardOptions} placeholder="Select Job Card" value={form.jobCardNo} onChange={handleJobCardNoChange} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label required>Part No :</Label></div>
                <div className="col-span-8"><Select options={partOptions} placeholder="Select Part No" value={form.partNo} onChange={handlePartNoChange} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Process Stage :</Label></div>
                <div className="col-span-8"><Select options={processStageOptions} placeholder="Select Process Stage" value={form.processStage} onChange={u('processStage')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Location :</Label></div>
                <div className="col-span-8"><Input value={form.location} onChange={u('location')} /></div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-7 space-y-3">
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Date :</Label></div>
                <div className="col-span-8 flex items-center gap-4">
                  {/* Unified Date Input Box */}
                  <div className="w-48 shrink-0 flex items-center border border-slate-300 rounded bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] focus-within:border-[#0097A7] hover:border-slate-300 transition-all duration-200">
                    <input
                      type="text"
                      value={form.date}
                      onChange={u('date')}
                      className="w-full min-w-0 pl-2 pr-1 py-1 text-[11px] bg-transparent text-slate-700 font-bold focus:outline-none"
                    />
                    <div className="pr-1.5 pl-0.5 flex items-center justify-center shrink-0">
                      <Calendar size={11} className="text-slate-400" />
                    </div>
                  </div>

                  <Label className="text-[11px] shrink-0">MWR NO :</Label>
                  {/* Unified MWR No Input Box */}
                  <div className="w-12 shrink-0 flex items-center border border-slate-300 rounded bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#0097A7] focus-within:border-[#0097A7] hover:border-slate-300 transition-all duration-200">
                    <input
                      type="text"
                      value={form.mwrNo}
                      onChange={u('mwrNo')}
                      className="w-full text-center py-1 text-[11px] bg-transparent text-[#0097A7] font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Reported By :</Label></div>
                <div className="col-span-8"><Input value={form.reportedBy} onChange={u('reportedBy')} className="font-bold text-slate-500" /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Priority :</Label></div>
                <div className="col-span-8"><Select options={priorities} placeholder="" value={form.priority} onChange={u('priority')} /></div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4 text-right pt-1"><Label>Problem Description :</Label></div>
                <div className="col-span-8"><TextArea value={form.problemDescription} onChange={u('problemDescription')} rows={3} /></div>
              </div>
              <div className="flex items-center justify-end gap-4 pr-2 text-white">
                <ActionButton onClick={handleSave} color="slate" className="bg-[#0097A7] !text-white hover:bg-[#00707c]"><Save size={14} /> Save</ActionButton>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-slate-700 p-2 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 bg-white rounded px-2 py-1 w-[400px]">
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2">
              <div className="w-3 h-2 bg-red-700 rounded-sm relative">
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 border-l-[6px] border-l-red-700 border-y-[4px] border-y-transparent" />
              </div>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Search</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-2 py-0.5 text-[12px] border-none focus:ring-0"
                placeholder="Query MWR / Machine..."
              />
              <Search size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

        </div>

        {/* Results Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[400px]">
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="bg-[#f8fafc] text-[9.5px] uppercase text-slate-500 font-bold border-b border-slate-300">
              <tr className="divide-x divide-slate-300">
                <th className="px-1 py-1.5 w-[3%] text-center whitespace-normal break-words">ID</th>
                <th className="px-1.5 py-1.5 w-[12%] whitespace-normal break-words">MachineName</th>
                <th className="px-1.5 py-1.5 w-[9%] whitespace-normal break-words">Job Card No</th>
                <th className="px-1.5 py-1.5 w-[9%] whitespace-normal break-words">Item Name</th>
                <th className="px-1.5 py-1.5 w-[11%] whitespace-normal break-words">Process Stage</th>
                <th className="px-1.5 py-1.5 w-[5%] whitespace-normal break-words">Location</th>
                {/* <th className="px-1.5 py-1.5 w-[3%] text-center whitespace-normal break-words">Mode</th> */}
                <th className="px-1.5 py-1.5 w-[7%] whitespace-normal break-words">Reported By</th>
                <th className="px-1.5 py-1.5 w-[5%] text-center whitespace-normal break-words">Priority</th>
                <th className="px-1.5 py-1.5 w-[15%] whitespace-normal break-words">Problem Description</th>
                <th className="px-1.5 py-1.5 w-[11%] text-center whitespace-normal break-words">Date</th>
                <th className="px-1.5 py-1.5 w-[5%] text-center whitespace-normal break-words">User</th>
                <th className="px-1.5 py-1.5 w-[5%] text-center whitespace-normal break-words">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[10.5px]">
              {displayBreakdowns.length === 0 ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="h-9 hover:bg-slate-50 divide-x divide-slate-200 text-transparent select-none">
                    <td className="px-1 py-1 text-center text-slate-200 font-bold select-auto">{i + 1}</td>
                    {[...Array(12)].map((_, j) => <td key={j} className="px-1.5 py-1">.</td>)}
                  </tr>
                ))
              ) : (
                displayBreakdowns.map((b, idx) => (
                  <tr
                    key={b.id}
                    onClick={() => handleRowClick(b)}
                    className={`hover:bg-[#f0f9fa]/40 transition-colors text-[10.5px] divide-x divide-slate-200 cursor-pointer group border-b border-slate-200 ${selectedId === b.id ? 'bg-[#0097A7]/10 font-medium' : ''
                      }`}
                  >
                    <td className="px-1 py-1 text-center text-slate-300 font-bold whitespace-normal break-words">{b.mwrNo}</td>
                    <td className="px-1.5 py-1 font-bold text-[#0097A7] uppercase whitespace-normal break-words">{b.machineName}</td>
                    <td className="px-1.5 py-1 whitespace-normal break-words">{b.jobCardNo}</td>
                    <td className="px-1.5 py-1 font-medium whitespace-normal break-words">{b.partNo}</td>
                    <td className="px-1.5 py-1 whitespace-normal break-words">{b.processStage}</td>
                    <td className="px-1.5 py-1 text-slate-400 whitespace-normal break-words">{b.location}</td>
                    {/* <td className="px-1.5 py-1 text-center whitespace-normal break-words">-</td> */}
                    <td className="px-1.5 py-1 whitespace-normal break-words">{b.reportedBy}</td>
                    <td className="px-1.5 py-1 text-center whitespace-normal break-words">
                      <span className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[8.5px] font-black uppercase">
                        {b.priority || 'Standard'}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 text-slate-400 italic whitespace-normal break-words">{b.problemDescription}</td>
                    <td className="px-1.5 py-1 text-center text-slate-400 whitespace-normal break-words">{b.date}</td>
                    <td className="px-1.5 py-1 text-center text-slate-300 whitespace-normal break-words">admin</td>
                    <td className="px-1.5 py-1 text-center whitespace-normal break-words">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditSelectedDirectly(b); }}
                          className="p-0.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSelectedDirectly(b); }}
                          className="p-0.5 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}