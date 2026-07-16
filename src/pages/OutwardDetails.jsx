import { useState } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, Edit, Trash2, RotateCcw, 
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
    className={`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat pr-10 ${className}`}
  >
    <option value="">-- Select --</option>
    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
  </select>
)

export default function OutwardDetails() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [vehicleCount, setVehicleCount] = useState('')
  const [serviceJobNo, setServiceJobNo] = useState('')
  const [vehicleSerialNo, setVehicleSerialNo] = useState('')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Outward Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Outward Details</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-md transition-all">
                <Edit size={14} /> Edit
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold rounded-md transition-all">
                <Trash2 size={14} /> Delete
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold rounded-md transition-all">
                <RotateCcw size={14} /> Return
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
            {/* Filter Section */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner mb-8">
              {/* Row 1: Dates & Search */}
              <div className="flex flex-wrap items-center gap-8 mb-6 pb-6 border-b border-slate-200/50">
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

              {/* Row 2 & 3: Selects */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Customer Name :</Label></div>
                    <Select value={customerName} onChange={e => setCustomerName(e.target.value)} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Customer Code :</Label></div>
                    <Select value={customerCode} onChange={e => setCustomerCode(e.target.value)} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Vehicle Count :</Label></div>
                    <Select value={vehicleCount} onChange={e => setVehicleCount(e.target.value)} className="flex-1" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-36"><Label>Service Job No :</Label></div>
                    <Select value={serviceJobNo} onChange={e => setServiceJobNo(e.target.value)} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-36"><Label>Vehicle Serial No :</Label></div>
                    <Select value={vehicleSerialNo} onChange={e => setVehicleSerialNo(e.target.value)} className="flex-1" />
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
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[2800px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    {[
                      { label: 'S.No', w: 'w-16' },
                      { label: 'ID', w: 'w-20' },
                      { label: 'Issue No', w: 'w-44' },
                      { label: 'Issue Date', w: 'w-36' },
                      { label: 'Department', w: 'w-44' },
                      { label: 'Service Job', w: 'w-44' },
                      { label: 'Vehicle Count', w: 'w-32' },
                      { label: 'Vehicle Serial.No', w: 'w-48' },
                      { label: 'Customer Code', w: 'w-40' },
                      { label: 'Receiver', w: 'w-48' },
                      { label: 'Barcode', w: 'w-40' },
                      { label: 'Assembly Name', w: 'w-64' },
                      { label: 'Part No', w: 'w-44' },
                      { label: 'Part Name', w: 'w-80' },
                      { label: 'Speification', w: 'w-64' },
                      { label: 'Qty', w: 'w-24' },
                      { label: 'UOM', w: 'w-20' },
                      { label: 'Rate', w: 'w-28' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {[...Array(15)].map((_, i) => (
                    <tr key={i} className="h-10 hover:bg-[#f0f9fa]/40 transition-colors">
                      <td className="border-r border-slate-100 bg-slate-50/20 text-center text-[10px] font-black text-slate-300 italic">{i + 1}</td>
                      {[...Array(17)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Outward Operations Registry Console</span>
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
