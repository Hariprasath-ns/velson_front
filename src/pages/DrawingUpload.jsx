import { useState, useEffect } from 'react'
import { ChevronRight, Upload, Eye, Search, RotateCcw, Save, Pencil, Trash2, X, FileText, FileUp } from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
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

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>{typeof o === 'object' ? o.label : o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const STORAGE_KEY = 'velson_drawing_uploads'

// Demo job cards
const JOB_CARDS = [
  { value: 'JC-2026-001', label: 'JC-2026-001' },
  { value: 'JC-2026-002', label: 'JC-2026-002' },
  { value: 'JC-2026-003', label: 'JC-2026-003' },
  { value: 'JC-2026-004', label: 'JC-2026-004' },
  { value: 'JC-2026-005', label: 'JC-2026-005' },
]

// Demo parts per job card
const PARTS_MAP = {
  'JC-2026-001': [{ value: 'PN-101', label: 'PN-101 — Shaft Assembly' }, { value: 'PN-102', label: 'PN-102 — Bearing Housing' }],
  'JC-2026-002': [{ value: 'PN-201', label: 'PN-201 — Gear Box Cover' }, { value: 'PN-202', label: 'PN-202 — Motor Bracket' }],
  'JC-2026-003': [{ value: 'PN-301', label: 'PN-301 — Flange Plate' }],
  'JC-2026-004': [{ value: 'PN-401', label: 'PN-401 — Coupling Hub' }, { value: 'PN-402', label: 'PN-402 — End Cap' }],
  'JC-2026-005': [{ value: 'PN-501', label: 'PN-501 — Rotor Disc' }],
}

const PART_NAMES = {
  'PN-101': 'Shaft Assembly',
  'PN-102': 'Bearing Housing',
  'PN-201': 'Gear Box Cover',
  'PN-202': 'Motor Bracket',
  'PN-301': 'Flange Plate',
  'PN-401': 'Coupling Hub',
  'PN-402': 'End Cap',
  'PN-501': 'Rotor Disc',
}

export default function DrawingUpload() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobCardNo: '',
    partNo: '',
    drawingName: '',
    drawingNumber: '',
    notes: '',
    revNo: '1',
    date: new Date().toISOString().split('T')[0],
    fileName: '',
  })

  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Load saved records
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setRecords(saved)
  }, [])

  const persist = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setRecords(data)
  }

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setForm(f => ({ ...f, fileName: file.name }))
    }
  }

  const handleSave = () => {
    if (!form.jobCardNo || !form.drawingName || !form.drawingNumber) {
      toast.warning('Please fill all mandatory fields (Job Card No, Drawing Name, Drawing Number).')
      return
    }

    if (editingId) {
      // Update existing
      const updated = records.map(r =>
        r.id === editingId
          ? { ...r, ...form, updatedBy: 'superadmin', drawingIssueDate: new Date().toISOString().split('T')[0] }
          : r
      )
      persist(updated)
      setEditingId(null)
    } else {
      // Create new
      const newRecord = {
        ...form,
        id: Date.now(),
        partName: PART_NAMES[form.partNo] || '',
        updatedBy: 'superadmin',
        drawingIssueDate: form.date,
      }
      const updated = [newRecord, ...records]
      persist(updated)
    }
    handleClear()
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    setForm({
      jobCardNo: record.jobCardNo,
      partNo: record.partNo,
      drawingName: record.drawingName,
      drawingNumber: record.drawingNumber,
      notes: record.notes,
      revNo: record.revNo,
      date: record.date,
      fileName: record.fileName,
    })
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this drawing record?')) return
    const updated = records.filter(r => r.id !== id)
    persist(updated)
  }

  const handleClear = () => {
    setForm({
      jobCardNo: '',
      partNo: '',
      drawingName: '',
      drawingNumber: '',
      notes: '',
      revNo: '1',
      date: new Date().toISOString().split('T')[0],
      fileName: '',
    })
    setEditingId(null)
    setSelectedFile(null)
  }

  const availableParts = PARTS_MAP[form.jobCardNo] || []

  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      r.jobCardNo?.toLowerCase().includes(q) ||
      r.partName?.toLowerCase().includes(q) ||
      r.drawingName?.toLowerCase().includes(q) ||
      r.drawingNumber?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q) ||
      r.fileName?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span> </span> <ChevronRight size={12} />  */}
          <span>Technical</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Drawing Upload</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Drawing Checking List</h2>
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
            <div className="grid grid-cols-12 gap-8">
              {/* ── Left Column: Drawing Details Form ── */}
              <div className="col-span-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Job Card No</Label>
                    <Select
                      options={JOB_CARDS}
                      value={form.jobCardNo}
                      onChange={e => {
                        setForm(f => ({ ...f, jobCardNo: e.target.value, partNo: '' }))
                      }}
                      placeholder="Select Job Card..."
                    />
                  </div>
                  <div>
                    <Label>Part No</Label>
                    <Select
                      options={availableParts}
                      value={form.partNo}
                      onChange={u('partNo')}
                      placeholder={form.jobCardNo ? 'Select Part...' : 'Select Job Card first'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Drawing Name</Label>
                    <Input value={form.drawingName} onChange={u('drawingName')} placeholder="Enter Drawing Name..." />
                  </div>
                  <div>
                    <Label required>Drawing Number</Label>
                    <Input value={form.drawingNumber} onChange={u('drawingNumber')} placeholder="Enter Drawing Number..." />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={u('notes')} placeholder="Additional notes or remarks..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rev No</Label>
                    <Input type="number" value={form.revNo} onChange={u('revNo')} placeholder="1" />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={u('date')} />
                  </div>
                </div>
              </div>

              {/* ── Right Column: File Upload & Actions ── */}
              <div className="col-span-6 space-y-4 border-l border-slate-100 pl-8">
                {/* Upload Document Section */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 border-dashed">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileUp size={14} className="text-[#0097A7]" /> Upload Document
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>File Name</Label>
                      <div className="flex gap-2">
                        <Input value={form.fileName} readOnly placeholder="No file selected..." className="flex-1" />
                        <label className="flex items-center gap-1.5 px-4 py-[7px] bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[12px] font-bold rounded-lg cursor-pointer transition-all shadow-sm active:scale-95 whitespace-nowrap">
                          <Upload size={14} /> Browse
                          <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tif,.tiff" />
                        </label>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <FileText size={18} className="text-[#0097A7]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-slate-700 truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => { setSelectedFile(null); setForm(f => ({ ...f, fileName: '' })) }} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Preview Placeholder */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center py-8 text-slate-300 group hover:border-[#0097A7] hover:bg-[#0097A7]/5 transition-all cursor-pointer">
                  <Eye size={36} strokeWidth={1.2} className="group-hover:text-[#0097A7] transition-colors group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-black mt-2 uppercase tracking-widest text-slate-400 group-hover:text-[#0097A7]">Click to Preview Drawing</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); setRecords(saved) }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    <RotateCcw size={14} /> Refresh
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-all shadow-md active:scale-95"
                  >
                    <Save size={16} /> {editingId ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Search Bar ── */}
            <div className="mt-8 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search drawings..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all hover:border-slate-300"
                />
              </div>
              <span className="bg-[#0097A7]/10 text-[#0097A7] px-2.5 py-1 rounded text-[10px] font-bold">{filteredRecords.length} Records</span>
            </div>

            {/* ── Data Table ── */}
            <div className="mt-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead className="bg-[#fcfdfe] text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 border-r border-slate-200 w-14 text-center">S.No</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Job No</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Part Name</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Drawing Name</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Drawing Number</th>
                        <th className="px-4 py-3.5 border-r border-slate-200 w-16 text-center">Rev No</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Note</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Issue Date</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Updated By</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">File Name</th>
                        <th className="px-4 py-3.5 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-20 text-center text-slate-300 italic text-sm">
                            <FileText size={40} className="mx-auto mb-2 opacity-20" />
                            No drawing records found.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((row, idx) => (
                          <tr key={row.id} className={`hover:bg-slate-50 transition-colors h-12 ${editingId === row.id ? 'bg-amber-50/50 ring-1 ring-amber-200' : ''}`}>
                            <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-400 font-bold text-[12px]">{idx + 1}</td>
                            <td className="px-4 py-2 border-r border-slate-200 font-bold text-[#0097A7] text-[12px]">{row.jobCardNo}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-700 text-[12px]">{row.partName || '—'}</td>
                            <td className="px-4 py-2 border-r border-slate-200 font-semibold text-slate-800 text-[12px]">{row.drawingName}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-600 text-[12px] font-mono">{row.drawingNumber}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600 text-[12px]">{row.revNo}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-500 text-[12px] max-w-[120px] truncate">{row.notes || '—'}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-500 text-[12px]">{row.drawingIssueDate}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-500 text-[12px]">{row.updatedBy}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-[12px]">
                              {row.fileName ? (
                                <span className="inline-flex items-center gap-1 text-[#0097A7] font-semibold">
                                  <FileText size={12} /> {row.fileName}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleEdit(row)}
                                  title="Edit"
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(row.id)}
                                  title="Delete"
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                                >
                                  <Trash2 size={14} />
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

            {/* ── Footer status bar ── */}
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Ready
              </p>
              <p className="text-[10px] text-red-500 font-bold">
                * Are Mandatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
