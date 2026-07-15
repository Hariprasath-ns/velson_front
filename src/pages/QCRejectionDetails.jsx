import { useState } from 'react'
import { 
  ChevronRight, X, Search, Download, FileSpreadsheet, FileJson, Filter, Settings, ShieldAlert, CheckCircle2 
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

const MOCK_DATA = [
  { 
    sno: 1, date: '15-04-2026 12:08:00', grn: '26-27/GRN00115', partNo: 'VC-100042', partName: 'HOUSING 2', 
    qty: '58.00', rejQty: '2.00', okQty: '56.00', barcode: '2026040773', createdBy: 'QUALITY', 
    approval: 'W', qcStatus: 'Rejected', remarks: "2-NO'S NOT REIVED (SATHISH)", qcType: 'QC' 
  },
]

export default function QCRejectionDetails() {
  const [fromDate, setFromDate] = useState('2026-04-15')
  const [toDate, setToDate] = useState('2026-04-15')
  const [listType, setListType] = useState('Pending List')

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">NC</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold">QC Rejection Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">QC Rejection Details</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-bold rounded-lg transition-all shadow-sm">
              <X size={18} strokeWidth={2.5} /> Close
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Section */}
            <div className="bg-[#fcfdfe] p-4 rounded-xl border border-slate-100 shadow-sm mb-6">
               <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
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

                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-6">
                        {['Pending List', 'Approval List', 'Rejected List'].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer group">
                             <input 
                                type="radio" 
                                name="listType" 
                                checked={listType === type}
                                onChange={() => setListType(type)}
                                className="w-4 h-4 accent-[#0097A7]" 
                             />
                             <span className="text-[11px] font-bold text-slate-600 uppercase group-hover:text-[#0097A7] transition-colors">{type}</span>
                          </label>
                        ))}
                     </div>
                     <div className="flex items-center gap-6">
                        {['DC Pending List', 'DC Completed List'].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer group">
                             <input 
                                type="radio" 
                                name="listType" 
                                checked={listType === type}
                                onChange={() => setListType(type)}
                                className="w-4 h-4 accent-[#0097A7]" 
                             />
                             <span className="text-[11px] font-bold text-slate-600 uppercase group-hover:text-[#0097A7] transition-colors">{type}</span>
                          </label>
                        ))}
                     </div>
                  </div>
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
              <table className="w-full text-left border-collapse min-w-[2200px]">
                <thead className="bg-[#fcfdfe] text-[10.5px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    {[
                      'S.No','NC_Date','GRN_NO','Part_No','Part_Name','QC_Qty','QC_Rejection_Qty','QC_OK_Qty','Barcode','Created_by','Approval Status','QC Status','QC Remarks','QC Type','Approval_R'
                    ].map(h => (
                      <th key={h} className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {MOCK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f9fa]/30 transition-colors bg-blue-50/40">
                      <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-blue-700">{row.sno}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-slate-500">{row.date}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">{row.grn}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-bold text-[#0097A7]">{row.partNo}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-600">{row.partName}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-right font-black text-slate-700">{row.qty}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-right font-black text-rose-600">{row.rejQty}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-right font-black text-emerald-600">{row.okQty}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-medium text-slate-500">{row.barcode}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-bold text-slate-600 uppercase">{row.createdBy}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-amber-600">{row.approval}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-black text-rose-600 uppercase">{row.qcStatus}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-slate-500 italic">{row.remarks}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-bold text-[#0097A7] uppercase">{row.qcType}</td>
                      <td className="px-3 py-2">---</td>
                    </tr>
                  ))}
                  {/* Empty Fill */}
                  {[...Array(15)].map((_, i) => (
                    <tr key={`empty-${i}`} className="h-9">
                      {[...Array(15)].map((_, j) => (
                        <td key={j} className="border-r border-slate-50 last:border-r-0"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between px-2">
               <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[11px] font-bold text-slate-600 px-8 italic tracking-wider">
                  Total Rejections Found : {MOCK_DATA.length}
               </div>
               <div className="flex items-center gap-1 opacity-20">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Quality Assurance NC Management</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
