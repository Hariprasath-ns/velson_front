import { useState } from 'react'
import {
  ChevronRight, X, Save, Trash2, Plus, 
  Truck, LayoutGrid
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

export default function DCSales() {
  const [dcDate, setDcDate] = useState('2026-04-15')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">DC Sales</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">DC Sales</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm">
              <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" strokeWidth={3} />
              </div>
              Close
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {/* Form Section */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-x-12 gap-y-6 items-start">
                
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>DC No</Label>
                      <Input value="16" className="w-full" />
                    </div>
                    <div>
                      <Label>DC . Date</Label>
                      <Input type="date" value={dcDate} onChange={e => setDcDate(e.target.value)} className="w-full" />
                    </div>
                  </div>
                  <div>
                    <Label>Godown</Label>
                    <Select className="w-full" />
                  </div>
                  <div>
                    <Label>Party Name</Label>
                    <Input className="w-full" />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <div className="space-y-2">
                      <Input className="w-full" />
                      <Input className="w-full" />
                      <Input className="w-full" />
                      <Input className="w-full" />
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block w-px h-full bg-slate-200 mx-4" />

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <Label>Stock Reduce</Label>
                    <Select className="w-full max-w-[200px]" options={['No']} value="No" />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button className="flex items-center justify-center gap-2 px-8 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-black rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest min-w-[160px]">
                      <Save size={18} /> Save
                    </button>
                    <button className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[13px] font-black rounded-xl transition-all shadow-sm active:scale-95 uppercase tracking-widest min-w-[160px]">
                      <Trash2 size={18} /> Delete Row
                    </button>
                  </div>

                  <div className="mt-8 p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-[#0097A7]/10 rounded-lg flex items-center justify-center text-[#0097A7] group-hover:scale-110 transition-transform">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Delivery Challan Information</h4>
                      <p className="text-[10px] text-slate-400 font-medium italic">Stock adjustment will be processed based on selection.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1200px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-2 py-3 border-r border-slate-300 w-10 text-center">*</th>
                    {[
                      { label: 'S.No', w: 'w-16' },
                      { label: 'Item Name', w: 'w-96' },
                      { label: 'Barcode', w: 'w-40' },
                      { label: 'Qty', w: 'w-24' },
                      { label: 'Rate', w: 'w-32' },
                      { label: 'Total Amt', w: 'w-36' },
                      { label: 'STOCK', w: 'w-32' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  <tr className="hover:bg-[#f0f9fa]/40 transition-colors group">
                    <td className="px-2 py-2.5 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                      <Plus size={10} className="text-[#0097A7] fill-[#0097A7]" />
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">1</td>
                    {[...Array(6)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                  </tr>
                  {[...Array(15)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/10"></td>
                      {[...Array(7)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <Truck size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Sales Delivery Challan & Dispatch Ledger Console</span>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Items: <span className="text-[#0097A7]">0</span>
                <span className="w-px h-3 bg-slate-200" />
                Dispatch Value: <span className="text-emerald-600">0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
