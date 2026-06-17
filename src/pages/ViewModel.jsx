import { useState, useEffect } from 'react'
import { ChevronRight, Search, FileText, X, Layers, Printer, FileDown, RotateCcw, Box } from 'lucide-react'
import { useToast } from '../components/Toast'
// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-1">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
    {...props}
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

export default function ViewModel() {
  const toast = useToast()
  const [form, setForm] = useState({
    customerName: '',
    customerCode: '',
    modelNo: '',
    partNo: '',
    stockNill: false
  })

  const [structure, setStructure] = useState([])
  const [loading, setLoading] = useState(false)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleFetchHierarchy = () => {
    if (!form.modelNo) {
      toast.warning('Select a Model No to view hierarchy.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setStructure([
        { id: 1, level: 'L1', component: 'Chassis Base', status: 'In Stock', qty: 1 },
        { id: 2, level: 'L2', component: 'Front Axle Assembly', status: 'Ordered', qty: 1 },
        { id: 3, level: 'L3', component: 'Hydraulic Cylinder X1', status: 'In Stock', qty: 4 },
        { id: 4, level: 'L2', component: 'Electrical Wiring Harness', status: 'Shortage', qty: 1 },
      ])
      setLoading(false)
    }, 700)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">View Model</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Model Configuration Explorer</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <Printer size={15} /> Print PDF
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-12 gap-10 items-start">
              {/* Left Column: Intelligence Filters */}
              <div className="col-span-8 space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 text-right"><Label>Customer Name :</Label></div>
                  <div className="col-span-6"><Select options={['Customer A', 'Customer B', 'Customer C']} placeholder="Select Customer Account" value={form.customerName} onChange={u('customerName')} /></div>
                  <div className="col-span-3">
                    <button className="flex items-center justify-center gap-2 w-full px-4 py-[9px] bg-[#dcfce7] hover:bg-[#bbf7d0] text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-200 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                      <Search size={14} /> All Assembly PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 text-right"><Label>Booking Customer Code :</Label></div>
                  <div className="col-span-6"><Select options={['CODE-001', 'CODE-002']} placeholder="Select Code" value={form.customerCode} onChange={u('customerCode')} /></div>
                  <div className="col-span-3">
                    <button 
                      onClick={handleFetchHierarchy}
                      className="flex items-center justify-center gap-2 w-full px-4 py-[9px] bg-[#dcfce7] hover:bg-[#bbf7d0] text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-200 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                    >
                      {loading ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
                      Single Assembly
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 text-right"><Label>Model No :</Label></div>
                  <div className="col-span-6"><Select options={['MOD-V10-2026', 'MOD-V7-2026', 'MOD-X500']} placeholder="Choose Manufacturing Model" value={form.modelNo} onChange={u('modelNo')} /></div>
                  <div className="col-span-3 pl-3 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="stockNill" 
                      checked={form.stockNill} 
                      onChange={e => setForm(f => ({...f, stockNill: e.target.checked}))}
                      className="w-4.5 h-4.5 accent-[#0097A7] rounded-lg cursor-pointer" 
                    />
                    <label htmlFor="stockNill" className="text-[10px] font-black text-slate-500 uppercase cursor-pointer hover:text-[#0097A7] tracking-tighter">Stock Nill Item</label>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 text-right"><Label>Assembly Part No :</Label></div>
                  <div className="col-span-6"><Select options={['ASSY-HYD-001', 'ASSY-ELE-002']} placeholder="Filter by Sub-Assembly" value={form.partNo} onChange={u('partNo')} /></div>
                  <div className="col-span-3 flex items-center gap-3 pl-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Count :</span>
                    <span className="text-[20px] font-black text-[#0097A7] leading-none">{structure.length}</span>
                    <div className="w-16 h-8 bg-slate-100 rounded border border-slate-200" />
                  </div>
                </div>
              </div>

              {/* Right Column: Visualization Panel */}
              <div className="col-span-12 lg:col-span-4 h-full">
                 <div className="bg-slate-900 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden h-[280px] flex flex-col items-center justify-center border border-slate-800 group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#0097A722,transparent)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#0097A711,transparent)]" />
                    
                    <div className="relative mb-6">
                       <div className="absolute inset-0 bg-[#0097A7] blur-[30px] opacity-20 animate-pulse" />
                       <Box size={70} strokeWidth={1} className="text-[#0097A7] relative z-10 group-hover:scale-110 transition-transform duration-700 opacity-80" />
                    </div>
                    
                    <div className="text-center z-10 space-y-2">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Structure Integrity</p>
                      <p className="text-white text-[16px] font-bold tracking-tight px-4 leading-snug">
                        {form.modelNo || 'STANDBY - WAITING INPUT'}
                      </p>
                    </div>

                    {structure.length > 0 && (
                      <div className="absolute bottom-8 left-0 right-0 px-10 flex flex-col gap-3 z-10">
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-gradient-to-r from-[#0097A7] to-cyan-400 w-3/4 rounded-full" />
                         </div>
                         <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Analysis Engine</span>
                            <span className="text-[10px] font-black text-[#0097A7]">75% ANALYZED</span>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Content Area - Hierarchical View */}
            <div className="mt-12 flex-1 flex flex-col">
               <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-2 h-5 bg-[#0097A7] rounded-sm" />
                    BOM Hierarchy Ledger
                  </h3>
                  {structure.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Operational View</span>
                    </div>
                  )}
               </div>

               <div className={`flex-1 border border-slate-200 rounded-[2rem] overflow-hidden transition-all duration-500 min-h-[400px] shadow-lg ${structure.length > 0 ? 'bg-white' : 'bg-slate-50/50 border-dashed border-2'}`}>
                  {structure.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32">
                       <div className="relative mb-8">
                          <div className="absolute inset-0 bg-[#0097A7] blur-[40px] opacity-10" />
                          <Layers size={100} strokeWidth={0.5} className="opacity-10 relative z-10" />
                       </div>
                       <p className="text-[14px] font-black uppercase tracking-[0.5em] opacity-40">Visualization Offline</p>
                       <p className="text-[11px] font-medium mt-3 opacity-50 uppercase tracking-widest">Compile model parameters to initialize explorer</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-500 font-black border-b border-slate-200">
                          <tr>
                            <th className="px-8 py-5 border-r border-slate-200/60 w-24 text-center">Layer</th>
                            <th className="px-8 py-5 border-r border-slate-200/60">Component Specification</th>
                            <th className="px-8 py-5 border-r border-slate-200/60 text-center w-36">Req. Qty</th>
                            <th className="px-8 py-5 text-center w-48 bg-slate-50/30">Inventory Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[13px]">
                          {structure.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors h-16 group">
                              <td className="px-8 py-2 border-r border-slate-200/60 text-center">
                                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black shadow-sm ${item.level === 'L1' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {item.level}
                                </span>
                              </td>
                              <td className="px-8 py-2 border-r border-slate-200/60 font-bold text-slate-700 uppercase tracking-tight group-hover:text-[#0097A7] transition-colors">{item.component}</td>
                              <td className="px-8 py-2 border-r border-slate-200/60 text-center font-black text-[18px] text-slate-400 group-hover:text-slate-800 transition-colors">{item.qty}</td>
                              <td className="px-8 py-2 text-center bg-slate-50/10">
                                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border ${
                                  item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  item.status === 'Shortage' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                  {item.status}
                                </span>
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
