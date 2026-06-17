import { useState, useEffect } from 'react'
import { ChevronRight, Save, X, Database, FileText, RotateCcw, Search, Plus } from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

export default function MainIndex() {
  const toast = useToast()
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    no: 'IDX-' + Math.floor(Math.random() * 9000 + 1000),
    customerName: '',
    customerCode: '',
    vehicleCount: '',
    vehicleModelNo: '',
    serialJobNo: '',
    vehicleSerialNo: '',
    vehicleQty: '1',
    bomModelNo: '',
    vehicleArrivalDate: '',
    compressorArrivalDate: '',
    workCompleteDate: '',
    workCommsingDate: '',
    workDeliveryDate: '',
  })

  const [childParts, setChildParts] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLoadParts = () => {
    if (!form.bomModelNo) {
      toast.warning('Select BOM Model No first.')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      setChildParts([
        { partNo: 'P-900', desc: 'Engine Block', qty: 1, remarks: 'Primary' },
        { partNo: 'P-901', desc: 'Transmission Case', qty: 1, remarks: 'Secondary' },
        { partNo: 'P-902', desc: 'Hydraulic Pump', qty: 2, remarks: 'Accessory' },
      ])
      setIsLoading(false)
    }, 800)
  }

  const handleSave = () => {
    if (!form.customerName || !form.serialJobNo) {
      toast.warning('Required: Customer and Job No.')
      return
    }
    const entry = { ...form, childParts, id: Date.now() }
    const existing = JSON.parse(localStorage.getItem('velson_bom_main_index') || '[]')
    localStorage.setItem('velson_bom_main_index', JSON.stringify([entry, ...existing]))
    toast.success('Main Index Entry Saved Successfully!')
    handleReset()
  }

  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      no: 'IDX-' + Math.floor(Math.random() * 9000 + 1000),
      customerName: '',
      customerCode: '',
      vehicleCount: '',
      vehicleModelNo: '',
      serialJobNo: '',
      vehicleSerialNo: '',
      vehicleQty: '1',
      bomModelNo: '',
      vehicleArrivalDate: '',
      compressorArrivalDate: '',
      workCompleteDate: '',
      workCommsingDate: '',
      workDeliveryDate: '',
    })
    setChildParts([])
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Main Index</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[750px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Main Production Index</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <div className="grid grid-cols-12 gap-x-12 gap-y-6">
              {/* Left Column: BOM & Vehicle Details */}
              <div className="col-span-6 space-y-4">
                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label>Entry Date</Label></div>
                   <div className="col-span-4"><Input type="date" value={form.date} onChange={u('date')} /></div>
                   <div className="col-span-2 text-right"><Label>Index ID</Label></div>
                   <div className="col-span-3"><Input value={form.no} readOnly className="!font-black text-[#0097A7] !bg-white" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label required>Customer Name</Label></div>
                   <div className="col-span-9"><Select options={['Customer A', 'Customer B', 'Customer C']} placeholder="--- Search Customer ---" value={form.customerName} onChange={u('customerName')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label>Customer Code :</Label></div>
                   <div className="col-span-4"><Select options={['C-100', 'C-200', 'C-300']} placeholder="Select Code" value={form.customerCode} onChange={u('customerCode')} /></div>
                   <div className="col-span-2 text-right"><Label>Vehicle Count :</Label></div>
                   <div className="col-span-3"><Select options={['1', '2', '3', '4', '5']} placeholder="0" value={form.vehicleCount} onChange={u('vehicleCount')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label>Vehicle Model</Label></div>
                   <div className="col-span-9"><Select options={['MOD-X', 'MOD-Y', 'MOD-Z']} placeholder="Select Vehicle Model" value={form.vehicleModelNo} onChange={u('vehicleModelNo')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label required>Serial Job No</Label></div>
                   <div className="col-span-9"><Select options={['JOB-101', 'JOB-102', 'JOB-103']} placeholder="Select Active Job" value={form.serialJobNo} onChange={u('serialJobNo')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label>Vehicle Serial No :</Label></div>
                   <div className="col-span-4"><Input placeholder="SN-0000" value={form.vehicleSerialNo} onChange={u('vehicleSerialNo')} /></div>
                   <div className="col-span-2 text-right"><Label>No.of Vehicle Qty :</Label></div>
                   <div className="col-span-3"><Input type="number" placeholder="1" value={form.vehicleQty} onChange={u('vehicleQty')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-3"><Label required>BOM Model No</Label></div>
                   <div className="col-span-9"><Select options={['BOM-V1', 'BOM-V2', 'BOM-V3']} placeholder="Select BOM Configuration" value={form.bomModelNo} onChange={u('bomModelNo')} /></div>
                </div>
              </div>

              {/* Right Column: Workflow Dates */}
              <div className="col-span-6 space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  {[
                    { label: 'Vehicle Arrival Date :', key: 'vehicleArrivalDate' },
                    { label: 'Compressor Arrival Date :', key: 'compressorArrivalDate' },
                    { label: 'Work Complete Date :', key: 'workCompleteDate' },
                    { label: 'Work Commsing Date :', key: 'workCommsingDate' },
                    { label: 'Work Delivery Date :', key: 'workDeliveryDate' },
                  ].map(item => (
                    <div key={item.key} className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 text-right"><Label>{item.label}</Label></div>
                      <div className="col-span-7"><Select options={['15-Apr-2026', '16-Apr-2026', '17-Apr-2026']} placeholder="dd-mm-yyyy" value={form[item.key]} onChange={u(item.key)} /></div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                    <button 
                      onClick={handleLoadParts}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-8 py-3 bg-[#FFB300] hover:bg-[#FFA000] text-white text-[13px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? <RotateCcw size={16} className="animate-spin" /> : <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />}
                      Load Child Part
                    </button>
                   <button onClick={handleSave} className="flex items-center gap-2 px-12 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg active:scale-95">
                     <Save size={18} /> Save Entry
                   </button>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pr-2">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked readOnly className="accent-[#0097A7] w-4 h-4" />
                      <span className="text-[11px] font-black text-[#0097A7] uppercase tracking-widest group-hover:text-[#00BCD4]">BOM</span>
                   </label>
                </div>
              </div>
            </div>

            {/* Content Area - Child Parts Table */}
            <div className="mt-10 flex-1 flex flex-col">
               <div className="flex items-center justify-between mb-3 px-2">
                 <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#0097A7] pl-3">BOM Structure / Child Parts</h3>
                 {childParts.length > 0 && (
                   <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                     {childParts.length} Components Loaded
                   </span>
                 )}
               </div>

               <div className={`flex-1 border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-500 ${childParts.length > 0 ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>
                  {childParts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                       <Database size={64} strokeWidth={1} className="opacity-20 mb-4" />
                       <p className="text-[12px] font-black uppercase tracking-[0.25em]">Registry Offline</p>
                       <p className="text-[11px] italic mt-1">Load components to populate the structure</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 border-r border-slate-100 w-16 text-center">#</th>
                            <th className="px-6 py-4 border-r border-slate-100">Part Number</th>
                            <th className="px-6 py-4 border-r border-slate-100">Component Description</th>
                            <th className="px-6 py-4 border-r border-slate-100 text-right w-32">Req. Qty</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4 w-12 text-center">Del</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {childParts.map((part, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors h-14 group">
                              <td className="px-6 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{idx + 1}</td>
                              <td className="px-6 py-2 border-r border-slate-50 font-black text-[#0097A7]">{part.partNo}</td>
                              <td className="px-6 py-2 border-r border-slate-50 font-bold text-slate-700 uppercase text-[11px]">{part.desc}</td>
                              <td className="px-6 py-2 border-r border-slate-50 text-right font-black text-slate-900">{part.qty}</td>
                              <td className="px-6 py-2 text-slate-500 italic text-[11px]">{part.remarks}</td>
                              <td className="px-6 py-2 text-center">
                                <button onClick={() => setChildParts(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
