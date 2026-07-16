import { useState } from 'react'
import {
  ChevronRight, X, Search, Printer, Download, FileSpreadsheet, FileJson, Filter, Settings, LayoutGrid, Edit, Trash2
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

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[6px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
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

export default function ConformationEntryDetails() {
  const [fromDate, setFromDate] = useState('2026-04-15')
  const [toDate, setToDate] = useState('2026-04-15')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Production</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Conformation Entry Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Conformation Entry Details</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm group">
                <Edit size={16} className="text-green-600 group-hover:scale-110 transition-transform" /> Edit
              </button>
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm group">
                <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Delete
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Section */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6">
              <div className="flex items-center flex-wrap gap-x-12 gap-y-4 mb-4">
                <div className="flex items-center gap-3">
                  <Label>From Date :</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
                </div>
                <div className="flex items-center gap-3">
                  <Label>To Date :</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-6 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-300 transition-all shadow-sm active:scale-95 group">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                    <Search size={16} className="text-[#0097A7] group-hover:scale-110 transition-transform" />
                    Search
                  </button>
                  <button className="flex items-center gap-2 px-6 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-300 transition-all shadow-sm active:scale-95 group ml-2">
                    <Printer size={16} className="text-slate-400 group-hover:scale-110 transition-transform" />
                    Print
                  </button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-x-12 gap-y-4">
                <div className="flex items-center gap-4 w-[400px]">
                  <Label>Booking Customer Code :</Label>
                  <Select options={['C001', 'C002']} placeholder="---Select---" className="flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-6 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-300 transition-all shadow-sm active:scale-95 group">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                    <Search size={16} className="text-[#0097A7] group-hover:scale-110 transition-transform" />
                    Search Details
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 w-[400px]">
                <Label>Customer Name :</Label>
                <Select options={['Customer A', 'Customer B']} placeholder="---Select---" className="flex-1 ml-[4.5rem]" />
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
              <table className="w-full text-left border-collapse min-w-[1600px]">
                <thead className="bg-[#fcfdfe] text-[10.5px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    {[
                      'S.No', 'Conformation_No', 'Customer_Name', 'Customer_Code', 'Booking_No', 'Created_Date', 'Created_By', 'Remarks'
                    ].map(h => (
                      <th key={h} className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {/* Empty Fill */}
                  {[...Array(25)].map((_, i) => (
                    <tr key={`empty-${i}`} className="h-9 hover:bg-slate-50/50 transition-colors">
                      {[...Array(8)].map((_, j) => (
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">Production Booking Audit Console</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
