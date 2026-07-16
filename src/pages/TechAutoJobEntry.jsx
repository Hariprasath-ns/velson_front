import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Save, X, Search, CheckSquare, Square, RotateCcw, Image as ImageIcon, Upload } from 'lucide-react'
import { useToast } from '../components/Toast'

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

const STORAGE_KEY = 'velson_tech_auto_job'

const MODELS = [
  'V2I', 'V4', 'V4I', 'V7', 'V3i', 'V9', 'VEDC', 'RC', 'V10', 'POWERPACK', 'VELSON',
  'Velson customer requirement', 'GRIPPER', 'GEARBOX', 'SAMP', 'COMMON', 'UNDERGROUND DRILL',
  'Consumables', 'V3 XL', 'COMPRESSOR', 'EQUALIZER BEAM', 'VEM', 'CORE DRILL', 'HDE',
  'GRADE CONTROL MACHINE', 'MICROBLAST', 'MINICORE', 'HD 300', 'AUTO JOB', 'HMD',
]

const PRIORITIES = ['P0', 'P1', 'P2', 'P3', 'P4', 'PE']

// Simulated parts data to appear when a model is selected
const PARTS_DB = [
  { partNo: 'VC-100015', partName: '10" SINGLE ROPE PULLEY 54', qty: 60, uom: 'No', minStock: 30, closingQty: 0.00, createdDate: '11-04-2026 17:00:03', description: '' },
  { partNo: 'VC-100017', partName: '10" SINGLE ROPE PULLEY V10 THREAD ROD P', qty: 40, uom: 'No', minStock: 20, closingQty: 18.00, createdDate: '28-02-2026 15:29:49', description: '' },
  { partNo: 'VC-100041', partName: 'HOUSING 1', qty: 40, uom: 'No', minStock: 20, closingQty: 7.00, createdDate: '16 03 2026 14:35:24', description: '' },
  { partNo: 'VC-100122', partName: 'V1D 1.5" BOTTOM ROLLER', qty: 50, uom: 'No', minStock: 40, closingQty: 23.00, createdDate: '13-01-2026 09:13:26', description: '' },
  { partNo: 'VC-100123', partName: '9MTR MASTER 4-1 CENTER 1.5" CHAIN ROLLE', qty: 20, uom: 'No', minStock: 10, closingQty: 9.00, createdDate: '09-04-2026 16:51:21', description: '' },
  { partNo: 'VC-100234', partName: '1.5" CHAIN SINGLE CLAMP WITH HOLES', qty: 40, uom: 'No', minStock: 20, closingQty: 19.00, createdDate: '23-03-2026 10:55:16', description: '' },
  { partNo: 'VC-103207', partName: 'FOOT CLAMP 180 TILTING JACKEY PIN', qty: 4, uom: 'No', minStock: 2, closingQty: 0.00, createdDate: '14-04-2026 14:59:18', description: '25 X 132' },
  { partNo: 'VC-103514', partName: 'V1D TILTING JACKEY PIN', qty: 10, uom: 'No', minStock: 5, closingQty: 3.00, createdDate: '01-04-2026 12:29:05', description: '40 X 230 MM' },
  { partNo: 'VC-101904', partName: 'TOP MRC ARM PIN 80MM DIA - 340MM', qty: 25, uom: "No's", minStock: 15, closingQty: 14.00, createdDate: '02-04-2026 13:37:20', description: '80 X 340MM' },
  { partNo: 'VC-105387', partName: 'V1.6 6MTR LW MASTER 8" SINGLE ROPE PULL', qty: 10, uom: "No's", minStock: 12, closingQty: 0.00, createdDate: '14 04 2026 16:45:45', description: '' },
  { partNo: 'VC-106260', partName: 'LW MAST CHAIN BOTTOM ROLLER BASE PLATE', qty: 5, uom: 'No', minStock: 3, closingQty: 2.00, createdDate: '15-04-2026 13:56:06', description: '' },
  { partNo: 'VC-106262', partName: 'LW MAST BOTTOM ROLLER THREAD ROD', qty: 5, uom: 'No', minStock: 3, closingQty: 2.00, createdDate: '15-04-2026 13:56:06', description: '' },
  { partNo: 'VC-106271', partName: 'WIRE CLAMP M8 BUSH', qty: 200, uom: 'No', minStock: 100, closingQty: 98.00, createdDate: '15-04-2026 09:58:06', description: '' },
  { partNo: 'VC-106362', partName: 'WATER LINE ADAPTOR 1 1/4" X 1" BSP', qty: 10, uom: 'No', minStock: 5, closingQty: 0.00, createdDate: '01 04 2026 16:02:04', description: '' },
  { partNo: 'VCS-300570', partName: 'V3 CHAIN SPROCKET FOR 705C2K DEVICE', qty: 6, uom: 'No', minStock: 3, closingQty: 2.00, createdDate: '12 01 2026 17:28:53', description: '' },
  { partNo: 'VG-20114', partName: 'XL ROTATION MOTOR OIL PUMP BODY', qty: 20, uom: 'No', minStock: 15, closingQty: 13.00, createdDate: '13-03-2026 14:04:00', description: '' },
  { partNo: 'VG-20141', partName: 'XL INNER SAVAREN TOP OIL SEAL FLANGE', qty: 3, uom: 'No', minStock: 2, closingQty: 0.00, createdDate: '24-01-2026 15:33:06', description: '' },
  { partNo: 'VG-20493', partName: 'M2 HYDRAULIC MOTOR FLANGE 140', qty: 5, uom: 'No', minStock: 10, closingQty: 0.00, createdDate: '07 04 2026 15:25:27', description: '' },
  { partNo: 'VGH-1000452', partName: 'V1D WATER PUMP FLANGE', qty: 40, uom: 'No', minStock: 20, closingQty: 0.00, createdDate: '25-03-2026 16:56:26', description: '' },
  { partNo: 'VGH-1000918', partName: 'V10 CONTROL BOX 4,5,6 BANG PLATE 1', qty: 15, uom: 'No', minStock: 8, closingQty: 0.00, createdDate: '30-03-2026 10:45:07', description: '' },
]

export default function TechAutoJobEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobNo: '', model: '', priority: '', note: '',
    requiredDate: new Date().toISOString().split('T')[0],
  })
  const [parts, setParts] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [partImage, setPartImage] = useState(null)
  const [savedJobs, setSavedJobs] = useState([])
  const imgRef = useRef(null)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setSavedJobs(saved)
  }, [])

  // Load parts when model changes
  const handleModelChange = (e) => {
    const model = e.target.value
    setForm(f => ({ ...f, model }))
    if (model) {
      // Simulate fetching parts for this model - randomize a subset
      const count = Math.floor(Math.random() * 8) + 6
      const shuffled = [...PARTS_DB].sort(() => Math.random() - 0.5).slice(0, count)
      setParts(shuffled)
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setParts([])
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
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(parts.map(p => p.partNo)))
    }
    setSelectAll(!selectAll)
  }

  const handleSave = () => {
    if (!form.model) { toast.warning('Please select a Model.'); return }
    if (selectedIds.size === 0) { toast.warning('Please select at least one part.'); return }
    const selectedParts = parts.filter(p => selectedIds.has(p.partNo))
    const job = {
      ...form, parts: selectedParts, partImage,
      id: Date.now(), savedAt: new Date().toISOString(),
    }
    const updated = [job, ...savedJobs]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSavedJobs(updated)
    toast.success('Auto Job Entry saved successfully!')
    handleClear()
  }

  const handleCreateRouteCard = () => {
    if (selectedIds.size === 0) { toast.warning('Please select parts to create Route Card.'); return }
    toast.success(`Route Card created for ${selectedIds.size} part(s).`)
  }

  const handleClear = () => {
    setForm({ jobNo: '', model: '', priority: '', note: '', requiredDate: new Date().toISOString().split('T')[0] })
    setParts([])
    setSelectedIds(new Set())
    setSelectAll(false)
    clearImage()
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
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
                    <Input value={form.jobNo} onChange={u('jobNo')} placeholder="Enter Job No..." />
                  </div>
                  <div className="col-span-5">
                    <Label required>Model</Label>
                    <Select options={MODELS} value={form.model} onChange={handleModelChange} placeholder="--- Select Model ---" />
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
                    <Select options={PRIORITIES} value={form.priority} onChange={u('priority')} placeholder="--- Select ---" />
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
                      <th className="px-3 py-2.5 border-r border-slate-200 w-8 text-center"></th>
                      <th className="px-3 py-2.5 border-r border-slate-200">Part No</th>
                      <th className="px-3 py-2.5 border-r border-slate-200">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-16 text-center">Qty</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-16 text-center">UOM</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-20 text-center">Min_Stock</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-24 text-center">Closing_Qty</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-40">Created_Date</th>
                      <th className="px-3 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parts.length === 0 ? (
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
                            key={p.partNo}
                            className={`h-9 hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-[#0097A7]/5' : ''}`}
                            onClick={() => toggleSelect(p.partNo)}
                          >
                            <td className="px-2 py-1 border-r border-slate-200 text-center">
                              {isSelected ? <CheckSquare size={14} className="text-[#0097A7]" /> : <Square size={14} className="text-slate-300" />}
                            </td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[11px] text-slate-300 font-bold">{i === 0 && isSelected ? '▸' : ''}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-[12px] font-bold text-[#0097A7]">{p.partNo}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-[12px] text-slate-700 font-semibold">{p.partName}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] font-bold text-slate-600">{p.qty.toFixed(2)}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] text-slate-500">{p.uom}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] text-slate-600">{p.minStock}</td>
                            <td className="px-3 py-1 border-r border-slate-200 text-center text-[12px] text-slate-500">{p.closingQty.toFixed(2)}</td>
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
                {parts.length > 0 ? `${parts.length} parts loaded · ${selectedIds.size} selected` : 'Ready'}
              </p>
              <p className="text-[10px] text-red-500 font-bold">* Are Mandatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
