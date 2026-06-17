import { useState, useEffect } from 'react'
import { 
  ChevronRight, Search, Printer, X, Trash2, Download, 
  FileSpreadsheet, FileJson, Filter, Settings, Image as ImageIcon, RotateCcw 
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
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

export default function IndexCreationReport() {
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [modelName, setModelName] = useState('')
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_bom_indices') || '[]')
    setData(saved)
    setFilteredData(saved)
  }, [])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      const start = new Date(fromDate)
      const end = new Date(toDate)
      const result = data.filter(r => {
        const d = new Date(r.date)
        const dateMatch = d >= start && d <= end
        const modelMatch = modelName ? r.model === modelName : true
        return dateMatch && modelMatch
      })
      setFilteredData(result)
      setSearching(false)
    }, 600)
  }

  const handleDelete = (id) => {
    const next = data.filter(r => r.id !== id)
    setData(next)
    setFilteredData(next)
    localStorage.setItem('velson_bom_indices', JSON.stringify(next))
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Index Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Index Creation Registry</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <Printer size={16} /> Print Records
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-8 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 items-center">
              <div className="col-span-8 space-y-4">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <Label>From Date :</Label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40 shadow-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>To Date :</Label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40 shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleSearch}
                      className="flex items-center gap-2 px-8 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-md transition-all active:scale-95 whitespace-nowrap"
                    >
                      {searching ? <RotateCcw size={14} className="animate-spin" /> : <div className="w-2 h-2 bg-red-500 rounded-full" />}
                      Search
                    </button>
                    <button 
                      onClick={handleSearch}
                      className="flex items-center gap-2 px-8 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      Search Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2"><Label>Model Name :</Label></div>
                  <div className="col-span-10">
                    <Select 
                      options={Array.from(new Set(data.map(r => r.model).filter(Boolean)))} 
                      placeholder="--- All Models ---" 
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-8">
                <div className="text-center group cursor-pointer">
                  <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-200 group-hover:border-[#0097A7] group-hover:text-[#0097A7] transition-all">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Model Preview</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-4">
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Registry Status:</span>
                 <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Online
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {[
                   { icon: <Download size={14} />, l: 'CSV' },
                   { icon: <FileSpreadsheet size={14} />, l: 'Excel' },
                   { icon: <FileJson size={14} />, l: 'JSON' },
                 ].map(tool => (
                   <button key={tool.l} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-[#0097A7] text-[11px] font-bold uppercase transition-all">
                     {tool.icon} {tool.l}
                   </button>
                 ))}
               </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 border-r border-slate-100 w-16 text-center">S.No</th>
                    <th className="px-5 py-4 border-r border-slate-100">Index ID</th>
                    <th className="px-5 py-4 border-r border-slate-100">Model Name</th>
                    <th className="px-5 py-4 border-r border-slate-100">Model No</th>
                    <th className="px-5 py-4 border-r border-slate-100">Creation Date</th>
                    <th className="px-5 py-4 border-r border-slate-100">Created By</th>
                    <th className="px-5 py-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[12.5px]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-slate-300 italic text-sm">
                        No records match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-[#0097A7]/5 transition-colors h-14 group">
                        <td className="px-5 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{idx + 1}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-black text-[#0097A7] uppercase">{row.indexNo}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-700">{row.model}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-medium text-slate-600">{row.modelNo}</td>
                        <td className="px-5 py-2 border-r border-slate-50 text-slate-500 font-bold">{row.date}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-black text-slate-400 uppercase text-[11px]">Administrator</td>
                        <td className="px-5 py-2 text-center">
                          <button onClick={() => handleDelete(row.id)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800">
               <div className="flex items-center gap-6 px-4 border-r border-white/10">
                 <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total Entries</span>
                 <span className="text-[18px] font-black">{filteredData.length}</span>
               </div>
               <div className="flex-1 text-right px-6">
                 <span className="text-white/20 text-[10px] italic">BOM Index System v1.2</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
