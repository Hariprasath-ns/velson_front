import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Search, Printer, Download, FileSpreadsheet, FileJson, Filter, Settings, Barcode, LayoutGrid, RotateCcw, FileText
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Select = ({ options, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2 py-0.5 pr-6 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer font-bold shadow-sm"
    >
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

export default function BarcodeDetails() {
  const [fromDate, setFromDate] = useState('15-Apr-2026')
  const [toDate, setToDate] = useState('15-Apr-2026')
  const [data, setData] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_production_jobs') || '[]')
    setData(saved)
  }, [])

  const dates = ['15-Apr-2026', '16-Apr-2026', '17-Apr-2026']

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-700 rounded-sm" />
           <h1 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">Barcode Details</h1>
        </div>
        <div className="flex items-center gap-3">
           <HeaderButton><Printer size={14} className="text-slate-400" /> Print Pincode</HeaderButton>
           <HeaderButton color="emerald"><FileSpreadsheet size={14} /> Excel</HeaderButton>
           <HeaderButton onClick={() => window.history.back()} color="rose"><X size={16} strokeWidth={3} /> Close</HeaderButton>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filter Area */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-3 shadow-sm relative">
           <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                 <Label>From Date :</Label>
                 <Select options={dates} value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-32" />
              </div>
              <div className="flex items-center gap-2">
                 <Label>To Date :</Label>
                 <Select options={dates} value={toDate} onChange={e => setToDate(e.target.value)} className="w-32" />
              </div>
              
              <div className="w-[1px] h-6 bg-slate-300 mx-2" />
              
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-1.5 px-4 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 shadow-sm hover:border-[#0097A7] transition-all active:scale-95">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full" /> Search
                 </button>
                 <button className="flex items-center gap-1.5 px-4 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 shadow-sm hover:border-[#0097A7] transition-all active:scale-95">
                    <Printer size={14} className="text-emerald-500" /> Print Barcode
                 </button>
              </div>

              <div className="ml-auto flex items-center gap-4 text-slate-500">
                 <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>LS</span>
                    <input type="text" value="1" readOnly className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center text-[#0097A7] font-black" />
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="hover:text-slate-800 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Printer size={14} className="text-slate-400" /> Dos</button>
                    <button className="hover:text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><FileSpreadsheet size={14} className="text-emerald-500" /> Excel</button>
                    <button className="hover:text-rose-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><FileText size={14} className="text-rose-500" /> Pdf</button>
                    <button className="hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Filter size={14} /> Filter</button>
                    <button className="hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Settings size={14} /> Setting</button>
                 </div>
              </div>
           </div>
        </div>

        {/* Matrix Data Area */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[600px]">
           <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#f8fafc] text-[10px] uppercase text-slate-500 font-bold border-b border-slate-300 sticky top-0 z-10">
                 <tr className="divide-x divide-slate-300">
                    <th className="px-3 py-2 w-16 text-center">S.No</th>
                    <th className="px-3 py-2">Barcode</th>
                    <th className="px-3 py-2">Job No</th>
                    <th className="px-3 py-2">Part No</th>
                    <th className="px-3 py-2">Material</th>
                    <th className="px-3 py-2">Dimension</th>
                    <th className="px-3 py-2 text-right">Weight</th>
                    <th className="px-3 py-2 text-center">Target Date</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {data.length === 0 ? (
                    [...Array(20)].map((_, i) => (
                      <tr key={i} className="h-8 hover:bg-slate-50 divide-x divide-slate-200 text-transparent select-none">
                        <td className="px-3 py-1 text-center text-slate-200 font-bold text-slate-300 select-auto">{i + 1}</td>
                        <td className="px-3 py-1">.</td>
                        <td className="px-3 py-1">.</td>
                        <td className="px-3 py-1">.</td>
                        <td className="px-3 py-1">.</td>
                        <td className="px-3 py-1">.</td>
                        <td className="px-3 py-1">.</td>
                        <td className="px-3 py-1 text-center">.</td>
                      </tr>
                    ))
                 ) : (
                    data.map((row, idx) => (
                       <tr key={row.id} className="h-8 hover:bg-[#f0f9fa]/40 transition-colors text-[12px] divide-x divide-slate-100 group">
                          <td className="px-3 py-1 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="px-3 py-1 font-bold text-slate-700">{(idx + 52433)}/2026</td>
                          <td className="px-3 py-1 font-bold text-blue-600">{(idx + 41433)}</td>
                          <td className="px-3 py-1 font-black text-[#0097A7]">{row.partNo || 'VGH-1003450'}</td>
                          <td className="px-3 py-1 font-bold text-slate-500 uppercase text-[10px]">D50 HITAC...</td>
                          <td className="px-3 py-1">-</td>
                          <td className="px-3 py-1 text-right font-black text-slate-400">0.00</td>
                          <td className="px-3 py-1 text-center text-slate-400">{row.reqDate || '15/04/2026'}</td>
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
