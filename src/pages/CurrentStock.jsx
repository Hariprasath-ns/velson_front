import { useState } from 'react'
import {
  ChevronRight, X, FileBarChart, Play, 
  FileSpreadsheet, FileText, Filter, Settings, Download
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-3 py-1.5 text-[13px] border border-slate-200 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
  />
)

const Select = ({ value, onChange, options = [], className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`px-3 py-1.5 text-[13px] border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_8px_center] bg-no-repeat pr-8 ${className}`}
  >
    <option value="">-- Select --</option>
    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
  </select>
)

const ActionBtn = ({ label }) => (
  <button className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded border border-slate-200 transition-all shadow-sm active:scale-95 group">
    <div className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-pulse" />
    {label}
  </button>
)

const MOCK_DATA = [
  { sNo: 1, partNo: 'VC-100551', partName: "3/8\"SINGLE HOLES PIPECLAMP", brand: '', inward: '100.00', outward: '3.00', current: '97.00' },
  { sNo: 2, partNo: 'VC-100611', partName: 'STEELBUSH 100x115x100', brand: '', inward: '12.00', outward: '0.00', current: '12.00' },
  { sNo: 3, partNo: 'VC-100721', partName: '6022 BEARING', brand: 'TIMKEN', inward: '10.00', outward: '0.00', current: '10.00' },
  { sNo: 4, partNo: 'VC-100962', partName: 'STEEL BUSH 110 X 135 X 100', brand: '', inward: '12.00', outward: '0.00', current: '12.00' },
  { sNo: 5, partNo: 'VC-104405', partName: 'BREAK OUTER ROLLER', brand: '', inward: '5.00', outward: '0.00', current: '5.00' },
  { sNo: 6, partNo: 'VC-104464', partName: 'HP 68 OIL', brand: 'HP', inward: '10,500.00', outward: '420.00', current: '10,080.00' },
]

export default function CurrentStock() {
  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Current Stock</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[900px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Current Stock</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm">
              <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" strokeWidth={3} />
              </div>
              Close
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Complex Filter Section */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner mb-8">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-12">
                
                {/* Left Column: Selects and Inputs */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Item Group :</Label></div>
                    <Select className="flex-1" options={['ALL']} value="ALL" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 accent-[#0097A7]" />
                      <Label>Date</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>From Date :</Label></div>
                    <div className="flex items-center gap-2 flex-1">
                      <Input type="date" className="flex-1" />
                      <Label>To Date :</Label>
                      <Input type="date" className="flex-1" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Store Name :</Label></div>
                    <Select className="flex-1" options={['STORE 1-MAINSTORE']} value="STORE 1-MAINSTORE" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Aging Day's :</Label></div>
                    <div className="flex gap-2 flex-1">
                      <Input className="flex-1" />
                      <Input className="flex-1" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Type :</Label></div>
                    <Select className="flex-1" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Item Master Rate value :</Label></div>
                    <Input className="flex-1" />
                  </div>
                </div>

                {/* Center Column: Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <ActionBtn label="GRN Barcode" />
                  <ActionBtn label="Itemwise Stock" />
                  <ActionBtn label="Zero Stock" />
                  <ActionBtn label="Minimum Stock" />
                  <ActionBtn label="Agingwise Report" />
                  <ActionBtn label="Locationwise" />
                  <ActionBtn label="Show details" />
                  <ActionBtn label="Itemwise StockValue" />
                  <ActionBtn label="Itemwise StockValue" />
                  <ActionBtn label="Barcodewise StockValue" />
                  <ActionBtn label="Job QC Barcode" />
                </div>

                <div className="grid grid-cols-1 gap-y-2">
                  <ActionBtn label="Barcodewise Stock" />
                  <ActionBtn label="Material Issue" />
                  <ActionBtn label="Qtywise Stock" />
                  <div className="mt-2 flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 accent-[#0097A7]" />
                    <Label>ALL Store</Label>
                  </div>
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
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm max-w-[1400px]">
              <table className="w-full text-left border-collapse bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    {[
                      { label: 'S.No', w: 'w-16' },
                      { label: 'Part No', w: 'w-40' },
                      { label: 'Part Name', w: 'w-96' },
                      { label: 'Brand', w: 'w-40' },
                      { label: 'Inward Qty', w: 'w-32' },
                      { label: 'Outward Qty', w: 'w-32' },
                      { label: 'Current Stock', w: 'w-36' }
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
                      <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-500 uppercase">{row.brand}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-slate-800">{row.inward}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-rose-600">{row.outward}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-blue-700">{row.current}</td>
                    </tr>
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20 text-center text-[10px] font-black text-slate-200">{i + 7}</td>
                      {[...Array(6)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2 max-w-[1400px]">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Inventory Valuation & Warehouse Registry</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Stock Items: <span className="text-[#0097A7]">{MOCK_DATA.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
