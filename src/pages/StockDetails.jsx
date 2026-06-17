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

const Select = ({ value, onChange, options = [], className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_12px_center] bg-no-repeat pr-10 ${className}`}
  >
    <option value="">-- Select --</option>
    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
  </select>
)

const MOCK_DATA = [
  { sNo: 1, partNo: 'VAC-5000067', partName: 'T-SHIRT (L)', currentStock: '189.00', reorderLeve: '150', minStock: '70', jobQty: '0.00', poQty: '0.00', autoQty: '0.00', grnQty: '0.00', closingQty: '189.00', source: 'Purchase' },
  { sNo: 2, partNo: 'VAC-5000068', partName: 'T-SHIRT (XL)', currentStock: '167.00', reorderLeve: '150', minStock: '70', jobQty: '0.00', poQty: '0.00', autoQty: '0.00', grnQty: '0.00', closingQty: '167.00', source: 'Purchase' },
  { sNo: 3, partNo: 'VAC-5000222', partName: 'PATTI PASTE', currentStock: '5.90', reorderLeve: '3', minStock: '2', jobQty: '0.00', poQty: '0.00', autoQty: '0.00', grnQty: '0.00', closingQty: '5.90', source: 'Purchase' },
  { sNo: 4, partNo: 'VAC-5000224', partName: '120 EMERY CLOTH SHEET', currentStock: '297.00', reorderLeve: '100', minStock: '50', jobQty: '0.00', poQty: '0.00', autoQty: '0.00', grnQty: '0.00', closingQty: '297.00', source: 'Purchase' },
  { sNo: 5, partNo: 'VAC-5000225', partName: 'PAINT TAPE-2"', currentStock: '21.00', reorderLeve: '40', minStock: '20', jobQty: '0.00', poQty: '0.00', autoQty: '0.00', grnQty: '0.00', closingQty: '21.00', source: 'Purchase' },
]

export default function StockDetails() {
  const [fromDate, setFromDate] = useState('2023-01-01')
  const [toDate, setToDate] = useState('2027-03-30')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Stock Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Stock Details</h2>
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
            <div className="flex flex-wrap items-center gap-6 mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <Select className="w-48" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 accent-[#0097A7] rounded" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Show Min Qty</span>
                </div>
              </div>

              <button className="flex items-center justify-center gap-2 px-8 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 group">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full group-hover:animate-pulse" />
                Search
              </button>

              <div className="flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-3">
                  <Label>From Date :</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
                </div>
                <div className="flex items-center gap-3">
                  <Label>To Date :</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
                </div>
              </div>
            </div>

            {/* Tool Icons Bar */}
            <div className="flex items-center justify-end gap-5 mb-4 px-2 text-slate-500">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#0097A7] transition-colors border-r border-slate-200 pr-5">
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

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1800px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-2 py-3 border-r border-slate-300 w-10 text-center"></th>
                    {[
                      { label: 'S.No', w: 'w-16' },
                      { label: 'Part No', w: 'w-40' },
                      { label: 'PartName', w: 'w-80' },
                      { label: 'CurrentStock', w: 'w-32' },
                      { label: 'ReorderLeve', w: 'w-32' },
                      { label: 'Min Stock', w: 'w-32' },
                      { label: 'JobQty', w: 'w-24' },
                      { label: 'PO.Qty', w: 'w-24' },
                      { label: 'Autoqty', w: 'w-24' },
                      { label: 'GRN Qty', w: 'w-24' },
                      { label: 'Closing Qty', w: 'w-32' },
                      { label: 'Source', w: 'w-32' }
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
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-blue-600">{row.partNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-semibold text-slate-700">{row.partName}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-blue-700">{row.currentStock}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-800">{row.reorderLeve}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-rose-600">{row.minStock}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right text-slate-500">{row.jobQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right text-slate-500">{row.poQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right text-slate-500">{row.autoQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right text-slate-500">{row.grnQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-slate-800">{row.closingQty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-600 uppercase">{row.source}</td>
                    </tr>
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20 text-center text-[10px] font-black text-slate-200">{i + 6}</td>
                      {[...Array(12)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Inventory Audit & Procurement Analysis Console</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Records Found: <span className="text-[#0097A7]">{MOCK_DATA.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
