import { useState } from 'react'
import {
  ChevronRight, X, Search, FileText, Download, FileSpreadsheet, FileJson, Filter, Settings, LayoutGrid, CheckCircle2
} from 'lucide-react'

// ── Shared UI primitives (Consistent with design system) ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    className={`px-3 py-[6px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
  />
)

export default function ServiceJobEntryDetails() {
  const [fromDate, setFromDate] = useState('2026-04-15')
  const [toDate, setToDate] = useState('2026-04-15')
  const [filterType, setFilterType] = useState('Job Entry')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Production</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold">Service Job Entry Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Service Job Entry Details</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-bold rounded-lg transition-all shadow-sm">
              <X size={18} strokeWidth={2.5} /> Close
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="flex items-center flex-wrap gap-x-8 gap-y-4 mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Label>From Date :</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
              </div>
              <div className="flex items-center gap-3">
                <Label>To Date :</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
              </div>

              <button className="flex items-center gap-2 px-6 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-300 transition-all shadow-sm active:scale-95 group">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                <Search size={16} className="text-[#0097A7] group-hover:scale-110 transition-transform" />
                Search
              </button>

              <div className="flex items-center gap-6 border-l border-slate-200 pl-8 ml-4">
                {['All', 'Job Entry', 'PO Entry'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      checked={filterType === type}
                      onChange={() => setFilterType(type)}
                      className="w-4 h-4 accent-[#0097A7]"
                    />
                    <span className="text-[11px] font-bold text-slate-600 uppercase group-hover:text-[#0097A7] transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-end gap-4 mb-4">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">LS</span>
                <input className="w-8 bg-transparent text-center text-sm font-bold border-b border-slate-300 focus:outline-none" value="1" readOnly />
              </div>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                {[
                  { icon: <Download size={14} />, label: 'Dos' },
                  { icon: <FileSpreadsheet size={14} />, label: 'Excel' },
                  { icon: <FileJson size={14} />, label: 'Pdf' },
                  { icon: <Filter size={14} />, label: 'Filter' },
                  { icon: <Settings size={14} />, label: 'Setting' },
                ].map(tool => (
                  <button key={tool.label} className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-[#0097A7] transition-colors group">
                    {tool.icon}
                    <span className="text-[11px] font-bold uppercase group-hover:text-slate-600">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[2400px]">
                <thead className="bg-[#fcfdfe] text-[10.5px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    {[
                      'S.No', 'ID', 'Customer_Name', 'Customer_Code', 'Assembly_Part_Name', 'Bom_No', 'Bom_Part_No', 'Bom_Part_Name', 'Qty', 'Job_created_By', 'Job No', 'Job Date', 'Job_Status', 'Apprival Rejection', 'Apprival', 'PO'
                    ].map(h => (
                      <th key={h} className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {/* Empty Fill */}
                  {[...Array(25)].map((_, i) => (
                    <tr key={`empty-${i}`} className="h-9 hover:bg-slate-50/50 transition-colors">
                      {[...Array(16)].map((_, j) => (
                        <td key={j} className="border-r border-slate-50 last:border-r-0"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Branding Overlay */}
            <div className="mt-4 flex items-center justify-end opacity-20 pointer-events-none">
              <div className="flex items-center gap-1">
                <LayoutGrid size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">Service Engineering Production Console</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
