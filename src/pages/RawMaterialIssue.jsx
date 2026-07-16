import { useState } from 'react'
import { 
  ChevronRight, X, LayoutGrid, Camera, FileText, Image as ImageIcon, CheckCircle2 
} from 'lucide-react'

// ── Shared UI primitives (Consistent with design system) ──
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

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 pr-10 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer shadow-sm"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

// Removed redundant BoxLabel

export default function RawMaterialIssue() {
  const [form, setForm] = useState({
    jobNumber: '',
    planQty: '',
    barcode: '',
    vehicleType: '',
    planDate: '',
    requiredDate: '',
    partNo: ''
  })

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Production</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Raw Material Issue</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[900px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Raw Material Issue</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm">
              <X size={18} strokeWidth={2.5} /> Close
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Form Section */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 mb-10 shadow-inner">
              <div className="grid grid-cols-12 gap-10">
                 {/* Form Fields */}
                 <div className="col-span-12 lg:col-span-9">
                    <div className="grid grid-cols-12 gap-6 items-end">
                       <div className="col-span-4">
                          <Label>JOB Number :</Label>
                          <Input value={form.jobNumber} onChange={u('jobNumber')} placeholder="Enter Job No..." className="w-full" />
                       </div>
                       <div className="col-span-4">
                          <Label>Plan Qty :</Label>
                          <Input value={form.planQty} onChange={u('planQty')} placeholder="Enter Qty..." className="w-full" />
                       </div>
                       <div className="col-span-4">
                          <Label>Barcode :</Label>
                          <Input value={form.barcode} onChange={u('barcode')} placeholder="Scan Barcode..." className="w-full" />
                       </div>
                       
                       <div className="col-span-4">
                          <Label>Vehicle Type :</Label>
                          <Input value={form.vehicleType} onChange={u('vehicleType')} placeholder="Enter Vehicle Type..." className="w-full" />
                       </div>
                       <div className="col-span-4">
                          <Label>Plan Date :</Label>
                          <Input type="date" value={form.planDate} onChange={u('planDate')} className="w-full" />
                       </div>
                       <div className="col-span-4">
                          <Label>Required Date :</Label>
                          <Input type="date" value={form.requiredDate} onChange={u('requiredDate')} className="w-full" />
                       </div>

                       <div className="col-span-8">
                          <Label>Part No :</Label>
                          <Select options={['PART-001', 'PART-002']} placeholder="---Select Part No---" value={form.partNo} onChange={u('partNo')} />
                       </div>
                       <div className="col-span-4">
                          <button className="w-full flex items-center justify-center gap-2 px-12 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white text-[12px] font-black rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                             Submit
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Asset Preview */}
                 <div className="col-span-12 lg:col-span-3 border-l border-slate-200/50 pl-10 flex flex-col">
                    <Label>Part Image</Label>
                    <div className="mt-2 flex-1 min-h-[160px] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-200 relative overflow-hidden group shadow-sm">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0097A708,transparent)]" />
                       <Camera size={40} strokeWidth={1} className="group-hover:scale-110 transition-transform opacity-10 relative z-10" />
                    </div>
                 </div>
              </div>
            </div>

            {/* Content Area (Split Table and Drawing Lists) */}
            <div className="flex-1 flex gap-8">
               {/* Issue Table */}
               <div className="flex-[4] border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-400/20">
                  <table className="w-full text-left border-collapse bg-white">
                     <thead className="bg-[#fcfdfe] text-[10.5px] uppercase text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                           <th className="px-2 py-2.5 border-r border-slate-200 w-8"></th>
                           {[
                             'S.No','Barcode','Part No','Stock','Issue Qty','Unit','Notes'
                           ].map(h => (
                             <th key={h} className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap">{h}</th>
                           ))}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 text-[12px]">
                        <tr className="h-10 hover:bg-slate-50/50 transition-colors">
                           <td className="px-2 py-2 border-r border-slate-100 text-center font-bold text-slate-400 italic">*</td>
                           <td className="px-3 py-2 border-r border-slate-100 text-rose-600 font-bold">1</td>
                           {[...Array(6)].map((_, i) => <td key={i} className="border-r border-slate-50 last:border-r-0"></td>)}
                        </tr>
                        {[...Array(20)].map((_, i) => (
                           <tr key={i} className="h-10 border-b border-slate-50">
                              <td className="border-r border-slate-50 bg-slate-50/30"></td>
                              <td className="border-r border-slate-50"></td>
                              {[...Array(6)].map((_, j) => <td key={j} className="border-r border-slate-50 last:border-r-0"></td>)}
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* Drawing Lists Sidebar */}
               <div className="w-[300px] flex flex-col gap-6">
                  <div className="flex flex-col flex-1">
                     <div className="flex items-center justify-between mb-2">
                        <Label>Job Drawing List</Label>
                        <FileText size={14} className="text-slate-400" />
                     </div>
                     <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner p-4 flex flex-col items-center justify-center text-slate-300 italic text-[11px] min-h-[150px]">
                        <p className="opacity-40">Empty List</p>
                     </div>
                  </div>

                  <div className="flex flex-col flex-1">
                     <div className="flex items-center justify-between mb-2">
                        <Label>Part Drawing List</Label>
                        <ImageIcon size={14} className="text-slate-400" />
                     </div>
                     <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner p-4 flex flex-col items-center justify-center text-slate-300 italic text-[11px] min-h-[150px]">
                        <p className="opacity-40">Empty List</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer Branding */}
            <div className="mt-6 flex items-center gap-2 opacity-20 pointer-events-none">
               <LayoutGrid size={16} />
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 italic">Production Inventory Issue Intelligence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
