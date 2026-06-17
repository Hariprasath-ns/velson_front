import { useState } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, Edit2, Trash2, Printer, 
  FileSpreadsheet, FileText, Filter, Settings, Download, Camera, FileDown
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Select = ({ options, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2 py-0.5 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer font-bold"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const HeaderButton = ({ children, onClick, className = "", color = "slate" }) => {
  const colors = {
    slate: "text-slate-600 hover:bg-slate-50",
    emerald: "text-emerald-600 hover:bg-emerald-50",
    rose: "text-rose-600 hover:bg-rose-50",
    teal: "text-[#0097A7] hover:bg-[#f0f9fa]"
  }
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-3 py-1 border border-slate-200 bg-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 ${colors[color]} ${className}`}>
      {children}
    </button>
  )
}

const FilterButton = ({ children, onClick, className = "", icon = null }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1 bg-[#f8fafc] border border-slate-300 hover:border-[#0097A7] text-slate-700 text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap ${className}`}>
    {icon === 'dot' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />}
    {icon === 'printer' && <Printer size={14} className="text-slate-400" />}
    {children}
  </button>
)

export default function DCDetails() {
  const [fromDate, setFromDate] = useState('15-Apr-2026')
  const [toDate, setToDate] = useState('15-Apr-2026')

  const dates = ['15-Apr-2026', '16-Apr-2026', '17-Apr-2026']

  return (
    <div className="bg-[#f1f5f9] min-h-screen">
      <div className="p-4">
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col min-h-[90vh]">
          {/* Main Header */}
          <div className="flex items-center justify-between border-b border-slate-300 bg-[#f8fafc] px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">DC Details</h2>
            </div>
            
            <div className="flex items-center gap-1.5">
              <HeaderButton color="emerald"><Edit2 size={14} className="text-emerald-600" /> Edit</HeaderButton>
              <HeaderButton color="rose"><Trash2 size={14} className="text-rose-600" /> Delete</HeaderButton>
              <div className="w-[1px] h-4 bg-slate-300 mx-1" />
              <HeaderButton><Printer size={14} /> Print Image</HeaderButton>
              <HeaderButton onClick={() => window.history.back()} color="rose"><X size={16} strokeWidth={3} /> Close</HeaderButton>
            </div>
          </div>

          {/* Filters & Reports Bar */}
          <div className="flex items-center gap-4 bg-white border-b border-slate-200 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>From Date :</Label>
              <Select options={dates} value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Label>To Date :</Label>
              <Select options={dates} value={toDate} onChange={e => setToDate(e.target.value)} className="w-32" />
            </div>
            
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            
            <FilterButton icon="dot">Search</FilterButton>
            <FilterButton icon="dot">DC Details</FilterButton>
            
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            
            <FilterButton icon="printer">PDF M1</FilterButton>
            <FilterButton icon="printer">PDF M2</FilterButton>
            <FilterButton icon="printer">PDF M3</FilterButton>

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

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-[#f8fafc] text-[10px] uppercase text-slate-500 font-bold border-b border-slate-300 sticky top-0 z-10">
                <tr className="divide-x divide-slate-300">
                  <th className="px-2 py-1.5 w-12 text-center">S.No</th>
                  <th className="px-3 py-1.5">DC No</th>
                  <th className="px-3 py-1.5">DC Date</th>
                  <th className="px-3 py-1.5">DC Type</th>
                  <th className="px-3 py-1.5">Customer Name</th>
                  <th className="px-3 py-1.5">Contact Person</th>
                  <th className="px-3 py-1.5">Contact No</th>
                  <th className="px-3 py-1.5 text-right">Total Qty</th>
                  <th className="px-3 py-1.5 text-right">Total Amount</th>
                  <th className="px-3 py-1.5">Vehicle No</th>
                  <th className="px-3 py-1.5">Driver Name</th>
                  <th className="px-3 py-1.5">Despatch Through</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[...Array(20)].map((_, i) => (
                  <tr key={i} className="h-8 hover:bg-slate-50 divide-x divide-slate-200 group">
                    <td className="px-2 py-1 text-center text-slate-300 font-bold">{i + 1}</td>
                    {[...Array(11)].map((_, j) => <td key={j} className="px-3 py-1"></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
