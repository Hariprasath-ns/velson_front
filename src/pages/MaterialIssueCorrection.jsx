import { useState } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, Trash2, 
  RotateCcw, CheckSquare, Square
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
  { sNo: 630, vehicleSerial: 'V7/032600037', serviceJob: '25-26/S000613', barcode: '20240725178', partNo: 'VC-104203', partName: 'V10 GH DIESEL ...', issueNo: '26-27/00365', issueDate: '15-04-2026 15:1...', dept: 'Production', customerCode: '25-26/S000613', receiver: 'MOULISHWARAN', specification: '', qty: '1.00', uom: 'No', rate: '252.00', amount: '252.0' },
  { sNo: 629, vehicleSerial: 'V7/032600037', serviceJob: '25-26/S000613', barcode: 'M98511', partNo: 'VC-104216', partName: 'LUBRICATION ...', issueNo: '26-27/00365', issueDate: '15-04-2026 15:1...', dept: 'Production', customerCode: '25-26/S000613', receiver: 'MOULISHWARAN', specification: '', qty: '1.00', uom: 'No', rate: '24.00', amount: '24.00' },
  { sNo: 628, vehicleSerial: 'V7/032600037', serviceJob: '25-26/S000613', barcode: '2024062011', partNo: 'VC-104214', partName: 'LUBRICATION ...', issueNo: '26-27/00365', issueDate: '15-04-2026 15:1...', dept: 'Production', customerCode: '25-26/S000613', receiver: 'MOULISHWARAN', specification: '', qty: '1.00', uom: 'No', rate: '396.00', amount: '396.0' },
]

export default function MaterialIssueCorrection() {
  const [selectAll, setSelectAll] = useState(false)

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Material Issue Correction</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Material Issue Correction</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-lg transition-all shadow-sm group">
                <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Delete
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
            {/* Complex Filter Section */}
            <div className="bg-[#00BCD4]/10 p-6 rounded-2xl border border-[#00BCD4]/20 mb-8">
              <div className="grid grid-cols-[1fr_auto] gap-x-12 items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <Label>From Date :</Label>
                      <Input type="date" className="w-44" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label>To Date :</Label>
                      <Input type="date" className="w-44" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center justify-center gap-2 px-8 py-2 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm active:scale-95 group">
                        <div className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-pulse" />
                        Show
                      </button>
                      <button className="flex items-center justify-center gap-2 px-8 py-2 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm active:scale-95">
                        <RotateCcw size={14} className="text-[#0097A7]" />
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Customer Name :</Label></div>
                    <Select className="flex-1 max-w-[400px]" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32"><Label>Service Job No :</Label></div>
                    <Select className="flex-1 max-w-[400px]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => setSelectAll(!selectAll)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-600"
                  >
                    {selectAll ? <CheckSquare size={16} className="text-[#0097A7]" /> : <Square size={16} />}
                    <span className="text-[11px] font-bold uppercase tracking-widest">Select All</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[2400px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-3 py-3 border-r border-slate-300 w-16 text-center">Select</th>
                    {[
                      { label: 'S.No', w: 'w-16' },
                      { label: 'Vehicle Serial.No', w: 'w-48' },
                      { label: 'Service Job.no', w: 'w-48' },
                      { label: 'Barcode', w: 'w-40' },
                      { label: 'Part No', w: 'w-40' },
                      { label: 'Part Name', w: 'w-64' },
                      { label: 'Issue No', w: 'w-44' },
                      { label: 'Issue Date', w: 'w-48' },
                      { label: 'Department', w: 'w-40' },
                      { label: 'Customer Code', w: 'w-44' },
                      { label: 'Receiver', w: 'w-48' },
                      { label: 'Speification', w: 'w-48' },
                      { label: 'Qty', w: 'w-24' },
                      { label: 'UOM', w: 'w-24' },
                      { label: 'Rate', w: 'w-32' },
                      { label: 'Amount', w: 'w-32' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {MOCK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f9fa]/40 transition-colors group">
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                        <input type="checkbox" checked={selectAll} className="w-4 h-4 accent-[#0097A7] rounded" />
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-600 italic">{row.sNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-700">{row.vehicleSerial}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-blue-600">{row.serviceJob}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-500">{row.barcode}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-700">{row.partNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-black text-[#0097A7] uppercase">{row.partName}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-600">{row.issueNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-500">{row.issueDate}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 uppercase font-bold text-slate-400">{row.dept}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-600">{row.customerCode}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 uppercase font-medium text-slate-700">{row.receiver}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-400">{row.specification}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-slate-800">{row.qty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-600">{row.uom}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-blue-700">{row.rate}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-emerald-600">{row.amount}</td>
                    </tr>
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20 text-center">
                        <div className="w-4 h-4 border border-slate-200 rounded mx-auto opacity-30" />
                      </td>
                      {[...Array(16)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Disbursement Reconciliation & Correction Ledger</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Selected Records: <span className="text-[#0097A7]">{selectAll ? MOCK_DATA.length : 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
