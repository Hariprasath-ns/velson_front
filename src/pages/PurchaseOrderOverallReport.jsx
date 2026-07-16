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
  { id: '15,456', document: '26-27/PO0...', purchase: '', poDate: '15-Apr-2026', delivery: '15-04-2026', vendorCode: '', vendor: 'SRI SAKTHI...', itemNo: '', itemName: '', size: '', qty: '', price: '', rowTotal: '' },
  { id: '15,471', document: '26-27/PO0...', purchase: '0', poDate: '15-Apr-2026', delivery: '15-04-2026', vendorCode: '', vendor: 'RAJ TOOLS...', itemNo: 'VF-90142', itemName: 'M10 HEX B...', size: '', qty: '200.00', price: '10.55', rowTotal: '1,319.59' },
  { id: '15,471', document: '26-27/PO0...', purchase: '0', poDate: '15-Apr-2026', delivery: '15-04-2026', vendorCode: '', vendor: 'RAJ TOOLS...', itemNo: 'VF-90095', itemName: 'M8 HEX BO...', size: '', qty: '200.00', price: '6.25', rowTotal: '781.75' },
  { id: '15,471', document: '26-27/PO0...', purchase: '0', poDate: '15-Apr-2026', delivery: '15-04-2026', vendorCode: '', vendor: 'RAJ TOOLS...', itemNo: 'VF-90689', itemName: 'M12 SPRIN...', size: '', qty: '300.00', price: '1.20', rowTotal: '424.80' },
  { id: '15,471', document: '26-27/PO0...', purchase: '0', poDate: '15-Apr-2026', delivery: '15-04-2026', vendorCode: '', vendor: 'RAJ TOOLS...', itemNo: 'VF-90691', itemName: 'M16 SPRIN...', size: '', qty: '500.00', price: '2.70', rowTotal: '1,593.00' },
]

export default function PurchaseOrderOverallReport() {
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
          <span className="text-[#0097A7] font-semibold uppercase">Purchase Order Overall Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Purchase Order Overall Report</h2>
            </div>
            
            <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#0097A7] transition-colors">
                  <span className="text-[11px] font-bold">LS</span>
                  <span className="text-[12px] font-black text-[#0097A7]">1</span>
                </div>
                <button className="hover:text-[#0097A7] transition-colors" title="Dos">
                  <Download size={16} />
                </button>
                <button className="hover:text-emerald-600 transition-colors" title="Excel">
                  <FileSpreadsheet size={16} />
                </button>
                <button className="hover:text-rose-600 transition-colors" title="Pdf">
                  <FileText size={16} />
                </button>
                <button className="hover:text-[#0097A7] transition-colors" title="Filter">
                  <Filter size={16} />
                </button>
                <button className="hover:text-[#0097A7] transition-colors" title="Setting">
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1800px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-2 py-3 border-r border-slate-300 w-10 text-center"></th>
                    {[
                      { label: 'ID', w: 'w-24' },
                      { label: 'Document', w: 'w-40' },
                      { label: 'Purchase', w: 'w-32' },
                      { label: 'PO Date', w: 'w-36' },
                      { label: 'Delivery', w: 'w-36' },
                      { label: 'Vendor Code', w: 'w-32' },
                      { label: 'Vendor', w: 'w-48' },
                      { label: 'Item No', w: 'w-36' },
                      { label: 'Item Name', w: 'w-64' },
                      { label: 'Size', w: 'w-28' },
                      { label: 'Qty', w: 'w-28' },
                      { label: 'Price', w: 'w-28' },
                      { label: 'Row Total', w: 'w-32' }
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
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">{row.id}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-blue-600">{row.document}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-500">{row.purchase}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-700">{row.poDate}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-700">{row.delivery}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-600 uppercase">{row.vendorCode}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-black text-[#0097A7] uppercase">{row.vendor}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-700">{row.itemNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-semibold text-slate-600">{row.itemName}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center text-slate-500">{row.size}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-slate-800">{row.qty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-800">{row.price}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-blue-700">{row.rowTotal}</td>
                    </tr>
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20 text-center text-[10px] font-black text-slate-200">{i === 0 ? '*' : ''}</td>
                      {[...Array(13)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Procurement Operations Overall Audit Console</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Line Items: <span className="text-[#0097A7]">{MOCK_DATA.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
