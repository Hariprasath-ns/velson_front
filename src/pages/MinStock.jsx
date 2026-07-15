import { useState } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, 
  FileSpreadsheet, FileText, Filter, Settings, Download
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
  />
)

const MOCK_DATA = [
  { sNo: 91, partNo: 'VAC-5000226', partName: 'AIR GUN', closingQty: '2.00', imMinStock: '2', minStock: '2' },
  { sNo: 151, partNo: 'VAG-100555', partName: 'GRIPPER BASE SUPPORT PLATE 2', closingQty: '2.00', imMinStock: '3', minStock: '3' },
  { sNo: 156, partNo: 'VAG-100562', partName: 'GRIPPER SIDE PLATE 3', closingQty: '3.00', imMinStock: '3', minStock: '3' },
  { sNo: 157, partNo: 'VAG-100563', partName: 'GRIPPER BUSH', closingQty: '2.00', imMinStock: '3', minStock: '3' },
  { sNo: 161, partNo: 'VAG-100569', partName: 'SUPPORT PIECE 2', closingQty: '0.00', imMinStock: '6', minStock: '6' },
  { sNo: 162, partNo: 'VAG-100570', partName: 'SUPPORT PIECE 1', closingQty: '0.00', imMinStock: '6', minStock: '6' },
]

export default function MinStock() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Min Stock</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Min Stock</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm">
              <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" strokeWidth={3} />
              </div>
              Close
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <Label>From Date :</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
                </div>
                <div className="flex items-center gap-3">
                  <Label>To Date :</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
                </div>
                <button className="flex items-center justify-center gap-2 px-8 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 group">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full group-hover:animate-pulse" />
                  Search
                </button>
              </div>

              {/* Tool Icons Bar */}
              <div className="flex items-center gap-5 border-l border-slate-200 pl-6 text-slate-500">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#0097A7] transition-colors pr-2">
                  <span className="text-[11px] font-bold">LS</span>
                  <span className="text-[12px] font-black text-[#0097A7]">1</span>
                </div>
                <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Dos">
                  <Download size={16} />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#0097A7]">Dos</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors group" title="Excel">
                  <FileSpreadsheet size={16} />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-600">Excel</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors group" title="Pdf">
                  <FileText size={16} />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-rose-600">Pdf</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Filter">
                  <Filter size={16} />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#0097A7]">Filter</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Setting">
                  <Settings size={16} />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#0097A7]">Setting</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm max-w-[1200px]">
              <table className="w-full text-left border-collapse bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    {[
                      { label: 'S. No', w: 'w-16' },
                      { label: 'Part No', w: 'w-40' },
                      { label: 'Part Name', w: 'w-80' },
                      { label: 'Closing Qty', w: 'w-32' },
                      { label: 'IM_Min_Stock', w: 'w-32' },
                      { label: 'Min Stock', w: 'w-32' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {MOCK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f9fa]/40 transition-colors group">
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">{row.sNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-blue-600">{row.partNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-semibold text-slate-700">{row.partName}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-slate-800">{row.closingQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-600">{row.imMinStock}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-blue-700">{row.minStock}</td>
                    </tr>
                  ))}
                  {/* Empty Rows */}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20"></td>
                      {[...Array(5)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2 max-w-[1200px]">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Inventory Minimum Levels Registry</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Items Below Limit: <span className="text-[#0097A7]">{MOCK_DATA.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
