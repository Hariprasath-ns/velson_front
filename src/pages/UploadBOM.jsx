import { useState, useEffect } from 'react'
import { ChevronRight, Upload, Search, Download, X, Trash2, FileSpreadsheet, RotateCcw } from 'lucide-react'
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

export default function UploadBOM() {
  const toast = useToast()
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    modelNo: '',
    assemblyPartNo: '',
    fileLocation: '',
    fileName: ''
  })

  const [assemblyList, setAssemblyList] = useState([])
  const [selectedParts, setSelectedParts] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleProcess = () => {
    if (!form.modelNo || !form.fileName) {
      toast.warning('Required: Model No and File Name.')
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      const mockItems = [
        { id: 1, part: 'P-100', desc: 'Main Frame', qty: 1, unit: 'PCS' },
        { id: 2, part: 'P-200', desc: 'Sub Assembly A', qty: 2, unit: 'SET' },
        { id: 3, part: 'P-300', desc: 'Connector Bolts', qty: 12, unit: 'NOS' },
      ]
      setAssemblyList(mockItems)
      setIsProcessing(false)
      toast.success('BOM File Processed Successfully!')
    }, 800)
  }

  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      modelNo: '',
      assemblyPartNo: '',
      fileLocation: '',
      fileName: ''
    })
    setAssemblyList([])
    setSelectedParts([])
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Advanced Upload</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[750px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">BOM Specification Upload</h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <RotateCcw size={14} /> Clear
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm">
                <FileSpreadsheet size={16} className="text-green-600" /> Download Template
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-12 gap-12 flex-1">
            {/* Left Section: Control Panel */}
            <div className="col-span-5 flex flex-col gap-8">
              <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Entry Date</Label></div>
                  <div className="col-span-9"><Input type="date" value={form.date} onChange={u('date')} className="!w-48" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Model No</Label></div>
                  <div className="col-span-6"><Input placeholder="Search Model No..." value={form.modelNo} onChange={u('modelNo')} /></div>
                  <div className="col-span-3">
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-[7px] bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] text-[11px] font-bold rounded-lg border border-[#0097A7]/20 transition-all shadow-sm active:scale-95">
                      <Search size={14} /> Browse
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Assembly Part No</Label></div>
                  <div className="col-span-6"><Input placeholder="Enter Assembly Part..." value={form.assemblyPartNo} onChange={u('assemblyPartNo')} /></div>
                  <div className="col-span-3">
                    <button 
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 px-3 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? <RotateCcw size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4 pt-2 border-t border-slate-100">
                  <div className="col-span-3"><Label>File Location</Label></div>
                  <div className="col-span-9"><Input placeholder="Paste directory path here..." value={form.fileLocation} onChange={u('fileLocation')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>File Name</Label></div>
                  <div className="col-span-9"><Select options={['Specification_A.xlsx', 'Specification_B.xlsx']} value={form.fileName} onChange={u('fileName')} placeholder="Choose File Source" /></div>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1">BOM Upload Count</p>
                   <p className="text-[24px] font-black text-[#0097A7]">{assemblyList.length}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1">BOM Un Upload Count</p>
                   <p className="text-[24px] font-black text-rose-500">0</p>
                 </div>
              </div>
            </div>

            {/* Right Section: Interactive Assembly List */}
            <div className="col-span-7 flex flex-col gap-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-4 bg-[#0097A7] rounded-full" />
                    Processed Assembly List
                 </h3>
                 {assemblyList.length > 0 && (
                   <button onClick={() => setAssemblyList([])} className="text-rose-500 hover:text-rose-600 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors">
                     <Trash2 size={14} /> Clear List
                   </button>
                 )}
               </div>

               <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative group transition-all">
                  {assemblyList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileSpreadsheet size={40} className="opacity-20" />
                      </div>
                      <div className="text-center">
                        <p className="font-black uppercase tracking-widest text-[12px]">No Data Loaded</p>
                        <p className="text-[11px] italic mt-1">Upload a BOM file to see the breakdown</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 overflow-y-auto p-4 bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedParts.length === assemblyList.length && assemblyList.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedParts(assemblyList.map(item => item.id))
                                  else setSelectedParts([])
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                              />
                            </th>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3">Part Number</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-center">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {assemblyList.map((item, idx) => (
                            <tr key={item.id} className={`${selectedParts.includes(item.id) ? 'bg-[#0097A7]/5' : 'hover:bg-[#0097A7]/5'} transition-colors group h-12`}>
                              <td className="px-4 py-2 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedParts.includes(item.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedParts(s => [...s, item.id])
                                    else setSelectedParts(s => s.filter(id => id !== item.id))
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-2 text-center text-slate-300 font-bold">{idx + 1}</td>
                              <td className="px-4 py-2 font-black text-[#0097A7]">{item.part}</td>
                              <td className="px-4 py-2 font-semibold text-slate-600 uppercase text-[11px]">{item.desc}</td>
                              <td className="px-4 py-2 text-right font-black text-slate-900">{item.qty}</td>
                              <td className="px-4 py-2 text-center">
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black">{item.unit}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
