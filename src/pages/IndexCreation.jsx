import { useState, useEffect } from 'react'
import { ChevronRight, Search, Upload, Download, X, Image as ImageIcon, FileSpreadsheet, RotateCcw, Save, Trash2, Plus } from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
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
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

export default function IndexCreation() {
  const toast = useToast()
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    indexNo: 'IDX-' + Math.floor(Math.random() * 900 + 100),
    model: '',
    modelNo: '',
    fileLocation: '',
    fileName: ''
  })

  const [indices, setIndices] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    if (!form.model || !form.modelNo) {
      toast.warning('Required: Model and Model No.')
      return
    }
    setIsSaving(true)
    setTimeout(() => {
      const newIdx = { ...form, id: Date.now() }
      const existing = JSON.parse(localStorage.getItem('velson_bom_indices') || '[]')
      const updated = [newIdx, ...existing]
      localStorage.setItem('velson_bom_indices', JSON.stringify(updated))
      setIndices(updated)
      setIsSaving(false)
      toast.success('Index Created Successfully!')
      handleReset()
    }, 600)
  }

  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      indexNo: 'IDX-' + Math.floor(Math.random() * 900 + 100),
      model: '',
      modelNo: '',
      fileLocation: '',
      fileName: ''
    })
  }

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_bom_indices') || '[]')
    setIndices(saved)
  }, [])

  const deleteIdx = (id) => {
    const updated = indices.filter(i => i.id !== id)
    setIndices(updated)
    localStorage.setItem('velson_bom_indices', JSON.stringify(updated))
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Index Creation</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">BOM Index Master</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-2">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Form Fields */}
              <div className="col-span-6">
                <div className="space-y-5 bg-slate-50/30 p-6 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label>Creation Date</Label></div>
                    <div className="col-span-4"><Input type="date" value={form.date} onChange={u('date')} /></div>
                    <div className="col-span-2 text-right"><Label>ID No</Label></div>
                    <div className="col-span-3"><Input value={form.indexNo} readOnly className="!font-black text-[#0097A7] !bg-white" /></div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label required>Model</Label></div>
                    <div className="col-span-9"><Select options={['Model 1', 'Model 2', 'Model 3']} value={form.model} onChange={u('model')} placeholder="--- Select Primary Model ---" /></div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label required>Model No</Label></div>
                    <div className="col-span-9"><Input placeholder="Enter Model Serial Number..." value={form.modelNo} onChange={u('modelNo')} /></div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label>File Location</Label></div>
                    <div className="col-span-9"><Input placeholder="C:\ERP\BOM\Indices..." value={form.fileLocation} onChange={u('fileLocation')} /></div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label required>File Path</Label></div>
                    <div className="col-span-9"><Select options={['Index_V1.xlsx', 'Index_V2.xlsx']} value={form.fileName} onChange={u('fileName')} placeholder="Select Resource File" /></div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95">
                      <Search size={18} className="text-[#0097A7]" /> Browse
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <RotateCcw size={18} className="animate-spin" /> : <Upload size={18} />}
                      {isSaving ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Visualization */}
              <div className="col-span-6 space-y-4">
                <div className="bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#0097A7]/10 group-hover:bg-[#0097A7]/20 transition-colors" />
                  <ImageIcon size={80} strokeWidth={1} className="text-white/20 mb-4 group-hover:scale-110 transition-transform group-hover:text-[#0097A7] z-10" />
                  <div className="text-center z-10">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Model Digital Twin</p>
                    <p className="text-white text-[14px] font-bold">{form.modelNo || 'PENDING SELECTION'}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#0097A7]/10 rounded-full flex items-center justify-center text-[#0097A7]">
                        <Plus size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Registered Indices</p>
                        <p className="text-[18px] font-black text-slate-700">{indices.length}</p>
                     </div>
                   </div>
                   <button className="text-[11px] font-black text-[#0097A7] uppercase hover:underline">View All Records</button>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-4 px-2">
                   <div className="flex items-center gap-6">
                      <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-700 rounded-full" />
                        Existing BOM Indices
                      </h3>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        <input 
                          type="checkbox" 
                          id="selectAll"
                          checked={selectedIds.length === indices.length && indices.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(indices.map(i => i.id))
                            else setSelectedIds([])
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                        />
                        <label htmlFor="selectAll" className="text-[11px] font-bold text-slate-500 uppercase cursor-pointer select-none">Select All</label>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-[#0097A7] text-[11px] font-bold uppercase transition-colors">
                        <Download size={15} /> Export Registry
                      </button>
                   </div>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-100 w-16 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length === indices.length && indices.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(indices.map(i => i.id))
                              else setSelectedIds([])
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-4 border-r border-slate-100 w-16 text-center">#</th>
                        <th className="px-6 py-4 border-r border-slate-100">Index No</th>
                        <th className="px-6 py-4 border-r border-slate-100">Date</th>
                        <th className="px-6 py-4 border-r border-slate-100">Model</th>
                        <th className="px-6 py-4 border-r border-slate-100">Model No</th>
                        <th className="px-6 py-4 border-r border-slate-100">File Path</th>
                        <th className="px-6 py-4 text-center w-20">Action</th>
                      </tr>
                    </thead>
                   <tbody className="divide-y divide-slate-50 text-[12.5px]">
                     {indices.length === 0 ? (
                       <tr>
                         <td colSpan={8} className="py-20 text-center text-slate-300 italic text-sm">
                            <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-10" />
                            No index records found in local storage.
                         </td>
                       </tr>
                     ) : (
                       indices.map((row, idx) => (
                         <tr key={row.id} className={`${selectedIds.includes(row.id) ? 'bg-[#0097A7]/5' : 'hover:bg-slate-50'} transition-colors h-14 group`}>
                           <td className="px-6 py-2 border-r border-slate-50 text-center">
                             <input 
                               type="checkbox" 
                               checked={selectedIds.includes(row.id)}
                               onChange={(e) => {
                                 if (e.target.checked) setSelectedIds(s => [...s, row.id])
                                 else setSelectedIds(s => s.filter(id => id !== row.id))
                               }}
                               className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                             />
                           </td>
                           <td className="px-6 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{idx + 1}</td>
                           <td className="px-6 py-2 border-r border-slate-50 font-black text-[#0097A7] uppercase">{row.indexNo}</td>
                           <td className="px-6 py-2 border-r border-slate-50 text-slate-500">{row.date}</td>
                           <td className="px-6 py-2 border-r border-slate-50 font-bold text-slate-700">{row.model}</td>
                           <td className="px-6 py-2 border-r border-slate-50 font-semibold">{row.modelNo}</td>
                           <td className="px-6 py-2 border-r border-slate-50 text-slate-400 font-medium italic">{row.fileName}</td>
                           <td className="px-6 py-2 text-center">
                             <button onClick={() => deleteIdx(row.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
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
        </div>
      </div>
    </div>
  )
}
