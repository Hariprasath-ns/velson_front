import { useState } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, Printer, 
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
  { sNo: 1, grnNo: '26-27/GRN00261', grnDate: '14/04/2026', partNo: 'VCV-901311', partName: 'V9 ROD CHANGER HOOK SUPPORT PLATE 2', barcode: '2026041414', grnQty: '6.00', qcStatus: 'Approve', okQty: '6.00', rejectQty: '0.00', specification: 'Length', qcType: 'Number', min: '120.00', max: '120.00', actual: '120', result: 'OK', createdBy: 'quality', remark: 'CHINNA DURAI' },
  { sNo: 2, grnNo: '26-27/GRN00261', grnDate: '14/04/2026', partNo: 'VCV-901311', partName: 'V9 ROD CHANGER HOOK SUPPORT PLATE 2', barcode: '2026041414', grnQty: '6.00', qcStatus: 'Approve', okQty: '6.00', rejectQty: '0.00', specification: 'Width', qcType: 'Number', min: '50.00', max: '50.00', actual: '50', result: 'OK', createdBy: 'quality', remark: 'CHINNA DURAI' },
  { sNo: 3, grnNo: '26-27/GRN00261', grnDate: '14/04/2026', partNo: 'VCV-901311', partName: 'V9 ROD CHANGER HOOK SUPPORT PLATE 2', barcode: '2026041414', grnQty: '6.00', qcStatus: 'Approve', okQty: '6.00', rejectQty: '0.00', specification: 'Thickness', qcType: 'Number', min: '12.00', max: '12.00', actual: '12', result: 'OK', createdBy: 'quality', remark: 'CHINNA DURAI' },
]

export default function QCEntryReport() {
  const [fromDate, setFromDate] = useState('2026-04-15')
  const [toDate, setToDate] = useState('2026-04-15')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">QC Entry Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[900px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">QC Entry Report</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold rounded-md transition-all">
                <Printer size={14} /> PrintData
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-md transition-all">
                <FileSpreadsheet size={14} /> Excel
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
              <div className="flex items-center gap-3">
                <Label>From Date :</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
              </div>
              <div className="flex items-center gap-3">
                <Label>To Date :</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 accent-[#0097A7] rounded" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">Job QC Report</span>
              </div>
              <button className="flex items-center justify-center gap-2 px-8 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 group">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full group-hover:animate-pulse" />
                Search
              </button>
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
              <table className="w-full text-left border-collapse min-w-[2800px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-2 py-3 border-r border-slate-300 w-10 text-center"></th>
                    {[
                      { label: 'S.No', w: 'w-16' },
                      { label: 'GRN No', w: 'w-40' },
                      { label: 'GRN Date', w: 'w-36' },
                      { label: 'Part No', w: 'w-40' },
                      { label: 'Part Name', w: 'w-80' },
                      { label: 'Barcode', w: 'w-40' },
                      { label: 'GRN Qty', w: 'w-28' },
                      { label: 'QC Status', w: 'w-32' },
                      { label: 'OK Qty', w: 'w-24' },
                      { label: 'Reject Qty', w: 'w-24' },
                      { label: 'Specification', w: 'w-64' },
                      { label: 'QC Type', w: 'w-32' },
                      { label: 'Min', w: 'w-28' },
                      { label: 'Max', w: 'w-28' },
                      { label: 'Actual Value', w: 'w-32' },
                      { label: 'Result', w: 'w-24' },
                      { label: 'CreatedBy', w: 'w-32' },
                      { label: 'QC Remark', w: 'w-64' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {MOCK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f9fa]/40 transition-colors group">
                      <td className="px-2 py-2.5 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                        <Play size={10} className="text-[#0097A7] fill-[#0097A7] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">{row.sNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-blue-600">{row.grnNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-500">{row.grnDate}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-700">{row.partNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-semibold text-slate-600 uppercase">{row.partName}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-500">{row.barcode}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-slate-800">{row.grnQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-black text-emerald-600">{row.qcStatus}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-800">{row.okQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-rose-600">{row.rejectQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-700 italic">{row.specification}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center text-slate-500 uppercase">{row.qcType}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-600">{row.min}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-600">{row.max}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-blue-700">{row.actual}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-black text-emerald-600">{row.result}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 italic text-slate-400">{row.createdBy}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-600 uppercase">{row.remark}</td>
                    </tr>
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20 text-center text-[10px] font-black text-slate-200">{i + 4}</td>
                      {[...Array(18)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Quality Assurance Fulfillment & Compliance Audit Console</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Records: <span className="text-[#0097A7]">{MOCK_DATA.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
