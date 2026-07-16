import { useState } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, Edit2, Trash2, 
  FileSpreadsheet, FileText, Filter, Settings, Download
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider whitespace-nowrap">
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

export default function ServiceLabourBillDetails() {
  const [fromDate, setFromDate] = useState('2026-04-15')
  const [toDate, setToDate] = useState('2026-04-15')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Service Labour Bill Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Service Labour Bill Entry Details</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm group">
                <Edit2 size={14} className="text-[#0097A7] group-hover:scale-110 transition-transform" /> Edit
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-md transition-all shadow-sm group">
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> Delete
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm">
                <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" strokeWidth={3} />
                </div>
                Close
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-8 mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-6">
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
            </div>

            {/* Tool Icons Bar */}
            <div className="flex items-center justify-end gap-5 mb-4 px-2 text-slate-500">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#0097A7] transition-colors border-r border-slate-200 pr-5">
                <span className="text-[11px] font-bold">LS</span>
                <span className="text-[12px] font-black text-[#0097A7]">1</span>
              </div>
              <button className="hover:text-[#0097A7] transition-colors" title="Dos"><Download size={16} /></button>
              <button className="hover:text-emerald-600 transition-colors" title="Excel"><FileSpreadsheet size={16} /></button>
              <button className="hover:text-rose-600 transition-colors" title="Pdf"><FileText size={16} /></button>
              <button className="hover:text-[#0097A7] transition-colors" title="Filter"><Filter size={16} /></button>
              <button className="hover:text-[#0097A7] transition-colors" title="Setting"><Settings size={16} /></button>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1400px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    {[
                      { label: 'S.No', w: 'w-20' },
                      { label: 'ID', w: 'w-24' },
                      { label: 'Customer Code', w: 'w-48' },
                      { label: 'BILLNO', w: 'w-32' },
                      { label: 'BILLDATE', w: 'w-36' },
                      { label: 'Item Name', w: 'w-80' },
                      { label: 'Labour_Charge', w: 'w-36' },
                      { label: 'CREATED_BY', w: 'w-40' },
                      { label: 'CREATED_DATE', w: 'w-40' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {[...Array(15)].map((_, i) => (
                    <tr key={i} className="h-10 hover:bg-[#f0f9fa]/40 transition-colors group">
                      {[...Array(9)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Labour Charge Billing Audit & Workforce Analysis Console</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Records: <span className="text-[#0097A7]">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
