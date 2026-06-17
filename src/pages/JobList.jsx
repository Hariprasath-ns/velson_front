import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Search, FileSpreadsheet, Play, Calendar, CheckCircle2, LayoutGrid, Settings, Filter, Download, FileJson, Camera, RotateCcw, Printer, FileText
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-2 py-0.5 text-[12px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2 py-0.5 pr-6 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer shadow-sm font-bold"
    >
      <option value="">{placeholder || 'All'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const HeaderButton = ({ children, onClick, className = "", color = "slate" }) => {
  const styles = {
    slate: "text-slate-600 hover:bg-slate-50",
    emerald: "text-emerald-600 hover:bg-emerald-50",
    rose: "text-rose-600 hover:bg-rose-50"
  }
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1 border border-slate-200 bg-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 ${styles[color]} ${className}`}>
      {children}
    </button>
  )
}

export default function JobList() {
  const [fromDate, setFromDate] = useState('15-Apr-2026')
  const [toDate, setToDate] = useState('15-Apr-2026')
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_production_jobs') || '[]')
    setData(saved)
    setFilteredData(saved)
  }, [])

  const dates = ['15-Apr-2026', '16-Apr-2026', '17-Apr-2026']

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-700 rounded-sm" />
           <h1 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">JOB LIST</h1>
        </div>
        <div className="flex items-center gap-3">
           <HeaderButton><Printer size={14} className="text-slate-400" /> Job Process Details</HeaderButton>
           <HeaderButton color="emerald"><FileSpreadsheet size={14} /> Excel</HeaderButton>
           <HeaderButton onClick={() => window.history.back()} color="rose"><X size={16} strokeWidth={3} /> Close</HeaderButton>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filter Area */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-4 shadow-sm relative">
           <div className="grid grid-cols-12 gap-x-12 gap-y-3">
              <div className="col-span-8 flex flex-col gap-3">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 flex-1">
                       <Label>Search :</Label>
                       <Input placeholder="" className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2 w-64">
                       <Label>Process Stage :</Label>
                       <Select options={['Machining', 'Assembly', 'Quality']} className="flex-1" />
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <Label>From Date :</Label>
                       <Select options={dates} value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                       <Label>To Date :</Label>
                       <Select options={dates} value={toDate} onChange={e => setToDate(e.target.value)} className="w-32" />
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                       <button className="flex items-center gap-1.5 px-4 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 shadow-sm hover:border-[#0097A7] transition-all active:scale-95">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full" /> Search
                       </button>
                       <button className="flex items-center gap-1.5 px-4 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 shadow-sm hover:border-[#0097A7] transition-all active:scale-95">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full" /> Completed Job
                       </button>
                    </div>
                 </div>
              </div>

              {/* Part Image Preview */}
              <div className="col-span-4 flex justify-end">
                 <div className="relative">
                    <Label className="mb-1 text-right">Part Image</Label>
                    <div className="w-48 h-24 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center opacity-40">
                       <Camera size={24} className="text-slate-300" />
                       <span className="text-[9px] font-black uppercase mt-1 opacity-20">No Visual</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Matrix Data Layer */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[500px]">
           <table className="w-full text-left border-collapse min-w-[2000px]">
              <thead className="bg-[#f8fafc] text-[10px] uppercase text-slate-500 font-bold border-b border-slate-300 sticky top-0 z-10">
                 <tr className="divide-x divide-slate-300">
                    <th className="px-3 py-2 w-16 text-center">ID</th>
                    <th className="px-3 py-2">Job No</th>
                    <th className="px-3 py-2">Vehicle Type</th>
                    <th className="px-3 py-2">Part No</th>
                    <th className="px-3 py-2">Product Name</th>
                    <th className="px-3 py-2 text-center w-24">Completed %</th>
                    <th className="px-3 py-2 text-center w-20">Qty</th>
                    <th className="px-3 py-2 text-center w-32">Plan Date</th>
                    <th className="px-3 py-2 text-center w-32">Required Date</th>
                    <th className="px-3 py-2">Issue Month Name</th>
                    <th className="px-3 py-2 text-center w-24">Priority</th>
                    <th className="px-3 py-2 text-center w-40">Technical Approval Date</th>
                    <th className="px-3 py-2">Approval Person</th>
                    <th className="px-3 py-2 text-center w-32">Stage</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {filteredData.length === 0 ? (
                    [...Array(15)].map((_, i) => (
                      <tr key={i} className="h-9 hover:bg-slate-50 divide-x divide-slate-200">
                        <td className="px-3 py-1 text-center text-slate-200 font-bold">{i + 1}</td>
                        {[...Array(13)].map((_, j) => <td key={j} className="px-3 py-1"></td>)}
                      </tr>
                    ))
                 ) : (
                    filteredData.map((row, idx) => (
                       <tr key={row.id} className="h-9 hover:bg-[#f0f9fa]/40 transition-colors text-[12px] divide-x divide-slate-100 group">
                          <td className="px-3 py-1 text-center text-slate-300 font-bold">
                             <div className="w-3 h-3 bg-blue-500 rounded-sm mx-auto flex items-center justify-center">
                               <Play size={8} className="text-white fill-white" />
                             </div>
                          </td>
                          <td className="px-3 py-1 font-bold text-slate-700">{row.jobNo}</td>
                          <td className="px-3 py-1 font-bold text-rose-600">{row.vehicleType || 'V10'}</td>
                          <td className="px-3 py-1 font-black text-[#0097A7]">{row.partNo}</td>
                          <td className="px-3 py-1 font-bold text-slate-600">{row.model}</td>
                          <td className="px-3 py-1 text-center font-black text-blue-600">0.00</td>
                          <td className="px-3 py-1 text-center font-black text-rose-600">{row.qty}</td>
                          <td className="px-3 py-1 text-center text-slate-400">{row.reqDate}</td>
                          <td className="px-3 py-1 text-center text-slate-400 font-bold">{row.reqDate}</td>
                          <td className="px-3 py-1 text-slate-400 italic">April</td>
                          <td className="px-3 py-1 text-center">
                             <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{row.priority}</span>
                          </td>
                          <td className="px-3 py-1 text-center text-slate-400 font-bold">{row.reqDate}</td>
                          <td className="px-3 py-1 text-rose-600 font-bold uppercase text-[10px]">ERP1</td>
                          <td className="px-3 py-1 text-center">
                             <span className="text-red-500 font-bold uppercase text-[10px]">Waiting</span>
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
