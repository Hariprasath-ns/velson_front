import { useState } from 'react'
import { 
  ChevronRight, Save, X, Search, Edit, Trash2, Eraser, 
  FileSpreadsheet, LayoutGrid, CheckCircle2, ChevronUp 
} from 'lucide-react'

// ── Shared UI primitives (Consistent with design system) ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed border-dashed' : 'hover:border-slate-300'} shadow-sm ${className}`}
    {...props}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "", required }) => (
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
    {required && <span className="absolute -right-3 top-2 text-red-500 font-black">*</span>}
  </div>
)

const TextArea = ({ placeholder, value, onChange, className = "", rows = 2 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-4 py-3 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 resize-none shadow-sm ${className}`}
  />
)

export default function ConformationList() {
  const [form, setForm] = useState({
    bookingCusCode: '',
    cusName: '',
    cusCode: '',
    bookingId: '',
    serialNo: '',
    vehicleModelNo: '',
    vehicleName: '',
    tempConformationNo: '',
    conformationNo: '26-27/CN00005',
    date: '2026-04-15',
    modelSubType: '',
    vehicleNo: '',
    quotationNo: '',
    description: '',
    type: '',
    remarks: ''
  })

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Production</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Conformation List</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Conformation List</h2>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm">
              <X size={18} strokeWidth={2.5} /> Close
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {/* Form Section */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-inner">
              <div className="grid grid-cols-12 gap-x-16 gap-y-6">
                 {/* Left Column */}
                 <div className="col-span-12 lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Booking Customer Code:</Label></div>
                      <div className="col-span-7"><Select options={['C001', 'C002']} value={form.bookingCusCode} onChange={u('bookingCusCode')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Customer Name :</Label></div>
                      <div className="col-span-7"><Select options={['Customer A', 'Customer B']} value={form.cusName} onChange={u('cusName')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Customer Code :</Label></div>
                      <div className="col-span-7"><Input value={form.cusCode} onChange={u('cusCode')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Booking ID :</Label></div>
                      <div className="col-span-7"><Input value={form.bookingId} onChange={u('bookingId')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Serial No :</Label></div>
                      <div className="col-span-7"><Input value={form.serialNo} onChange={u('serialNo')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Vehicle Model No :</Label></div>
                      <div className="col-span-7"><Select options={['V-001', 'V-002']} value={form.vehicleModelNo} onChange={u('vehicleModelNo')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Vehicle Name :</Label></div>
                      <div className="col-span-7"><Select options={['Vehicle X', 'Vehicle Y']} value={form.vehicleName} onChange={u('vehicleName')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Temp Conformation No:</Label></div>
                      <div className="col-span-7"><Input value={form.tempConformationNo} onChange={u('tempConformationNo')} /></div>
                    </div>
                 </div>

                 {/* Right Column */}
                 <div className="col-span-12 lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Conformation No:</Label></div>
                      <div className="col-span-7">
                         <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-7"><Input value={form.conformationNo} readOnly className="font-bold text-[#0097A7]" /></div>
                            <div className="col-span-5 flex items-center gap-2">
                               <Label>Date:</Label>
                               <Input type="date" value={form.date} onChange={u('date')} className="!px-2" />
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Model Sub Type :</Label></div>
                      <div className="col-span-7"><Select options={['Sub 1', 'Sub 2']} value={form.modelSubType} onChange={u('modelSubType')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Vehicle No :</Label></div>
                      <div className="col-span-7"><Input value={form.vehicleNo} onChange={u('vehicleNo')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Quotation No :</Label></div>
                      <div className="col-span-7"><Input value={form.quotationNo} onChange={u('quotationNo')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Description :</Label></div>
                      <div className="col-span-7"><Select required options={['Desc 1', 'Desc 2']} value={form.description} onChange={u('description')} /></div>
                    </div>
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>Type :</Label></div>
                      <div className="col-span-7"><Select required options={['Type A', 'Type B']} value={form.type} onChange={u('type')} /></div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-5 text-right pt-2"><Label>Remark's :</Label></div>
                      <div className="col-span-7"><TextArea rows={3} value={form.remarks} onChange={u('remarks')} /></div>
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6 mt-10 pt-8 border-t border-slate-200/60">
                 <button className="flex items-center gap-2 px-8 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-black rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 group">
                    <Save size={16} className="text-[#0097A7] group-hover:scale-110 transition-transform" /> Bulk Save
                 </button>
                 <button className="flex items-center gap-2 px-8 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-xl shadow-lg transition-all active:scale-95 group">
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Delete
                 </button>
                 <button className="flex items-center gap-2 px-8 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-black rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 group">
                    <Eraser size={16} className="text-orange-500 group-hover:scale-110 transition-transform" /> Clear
                 </button>
              </div>
            </div>

            {/* Dark Blue Toolbar */}
            <div className="mt-auto bg-[#607D8B] px-4 py-2 flex items-center justify-between rounded-t-lg shadow-md mt-12">
               <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded w-full border border-slate-400/50">
                     <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                     <span className="text-[10px] font-black text-[#607D8B] uppercase">Search</span>
                     <input className="bg-transparent text-sm w-full focus:outline-none text-slate-700" placeholder="Conformation Code..." />
                     <Search className="text-slate-400 w-4 h-4 cursor-pointer" />
                  </div>
               </div>
               <div className="flex items-center gap-8">
                  {[
                    { icon: <Save size={14} />, label: 'Save' },
                    { icon: <Edit size={14} />, label: 'Edit' },
                    { icon: <Trash2 size={14} />, label: 'Delete' },
                    { icon: <Eraser size={14} />, label: 'Clear' },
                    { icon: <ChevronUp size={14} />, label: '' },
                  ].map(tool => (
                    <button key={tool.label} className="flex items-center gap-1.5 text-white/90 hover:text-white text-[11px] font-bold uppercase transition-all tracking-wider group">
                       <span className="group-hover:scale-110 transition-transform">{tool.icon}</span>
                       {tool.label}
                    </button>
                  ))}
               </div>
            </div>

            {/* List Area */}
            <div className="h-64 bg-slate-50/50 border border-slate-200 rounded-b-xl flex flex-col items-center justify-center text-slate-300">
               <LayoutGrid size={48} strokeWidth={1} className="opacity-10 mb-2" />
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Conformation Items Table</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
