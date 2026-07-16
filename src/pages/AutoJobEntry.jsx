import { useState, useEffect } from 'react'
import { 
  ChevronRight, X, Search, FileText, LayoutGrid, Calendar, Camera, CheckCircle2, Play,
  Plus, RotateCcw, Package, ClipboardList, Database, FileSpreadsheet, Save, Trash2, Eraser, Edit, Filter, Settings, Printer
} from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const TableLabel = ({ children, className = "" }) => (
  <td className={`bg-[#B0BEC5]/30 border border-slate-300 px-3 py-1 text-[11px] font-bold text-slate-700 uppercase min-w-[120px] ${className}`}>
    {children}
  </td>
)

const TableInput = ({ children, className = "", colSpan = 1 }) => (
  <td colSpan={colSpan} className={`border border-slate-300 px-0 py-0 ${className}`}>
    {children}
  </td>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "", readOnly = false }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`w-full h-full px-2 py-1 text-[12px] border-none bg-white text-slate-700 placeholder-slate-400 focus:outline-none transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative h-full ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full h-full px-2 py-1 pr-6 text-[12px] border-none bg-white text-slate-700 appearance-none focus:outline-none cursor-pointer font-bold"
    >
      <option value="">{placeholder || ''}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const ActionButton = ({ onClick, children, className = "", color = "slate" }) => {
  const styles = {
    amber: "text-[#f57c00]",
    emerald: "text-[#2e7d32]",
    rose: "text-[#c62828]",
    slate: "text-slate-600",
    blue: "text-blue-600"
  }
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1 flex items-center gap-1 text-[11px] font-black uppercase transition-all active:scale-95 hover:bg-slate-50 rounded ${styles[color] || styles.slate} ${className}`}
    >
      {children}
    </button>
  )
}

export default function AutoJobEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    jobNo: '77',
    model: 'Model B',
    priority: 'high',
    reqDate: '16-Apr-2026',
    note: 'do',
    qty: '1',
    cusName: 'Customer 1',
    cusCode: 'C001',
    assembly: 'Assy 1',
    mode: 'Production'
  })

  const [jobs, setJobs] = useState([])
  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_production_jobs') || '[]')
    setJobs(saved)
  }, [])

  const handleSave = () => {
    const entry = { ...form, id: Date.now() }
    const saved = JSON.parse(localStorage.getItem('velson_production_jobs') || '[]')
    const updated = [entry, ...saved]
    localStorage.setItem('velson_production_jobs', JSON.stringify(updated))
    setJobs(updated)
    toast.success('Job registered.')
  }

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-700 rounded-sm" />
           <h1 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">Auto Job Entry</h1>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-0.5 rounded transition-colors">
              <FileSpreadsheet size={14} /> Excel
           </button>
           <button onClick={() => window.history.back()} className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded transition-colors shadow-sm">
              <X size={16} strokeWidth={3} />
           </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Entry Table Section */}
        <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-sm flex">
           <div className="flex-1">
              <table className="w-full border-collapse">
                 <tbody>
                    <tr>
                       <TableLabel>Job No</TableLabel>
                       <TableInput className="w-[30%]"><Input value={form.jobNo} onChange={u('jobNo')} /></TableInput>
                       <TableLabel className="text-center">Model</TableLabel>
                       <TableInput><Select options={['Model A', 'Model B']} value={form.model} onChange={u('model')} /></TableInput>
                    </tr>
                    <tr>
                       <TableLabel>Priority</TableLabel>
                       <TableInput><Input value={form.priority} onChange={u('priority')} /></TableInput>
                       <TableLabel>Required Date</TableLabel>
                       <TableInput>
                          <div className="flex items-center h-full">
                             <Select options={['16-Apr-2026', '17-Apr-2026']} value={form.reqDate} onChange={u('reqDate')} className="flex-1" />
                             <div className="px-1 border-l border-slate-300 h-full flex items-center bg-slate-50"><Calendar size={12} className="text-slate-400" /></div>
                          </div>
                       </TableInput>
                    </tr>
                    <tr>
                       <TableLabel>Note</TableLabel>
                       <TableInput><Input value={form.note} onChange={u('note')} /></TableInput>
                       <TableLabel>Qty</TableLabel>
                       <TableInput><Input value={form.qty} onChange={u('qty')} className="font-bold text-slate-400" /></TableInput>
                    </tr>
                    <tr>
                       <TableLabel>Cus. Name</TableLabel>
                       <TableInput colSpan={1}><Select options={['Customer 1', 'Customer 2']} value={form.cusName} onChange={u('cusName')} /></TableInput>
                       <td rowSpan={3} colSpan={2} className="border border-slate-300 p-4 align-top">
                          <div className="flex flex-col gap-4">
                             <div className="flex items-center gap-6">
                                {['Production', 'Purchase'].map(m => (
                                   <label key={m} className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                         type="radio" 
                                         checked={form.mode === m}
                                         onChange={() => setForm(f => ({ ...f, mode: m }))}
                                         className="w-4 h-4 accent-blue-600" 
                                      />
                                      <span className="text-[12px] font-bold text-slate-700">{m}</span>
                                   </label>
                                ))}
                             </div>
                             <button className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border border-slate-300 rounded shadow-sm hover:border-[#0097A7] transition-all active:scale-95 text-[11px] font-bold text-slate-700 w-max">
                                <div className="w-3 h-3 bg-red-600 rounded-full" /> Created Route Card
                             </button>
                          </div>
                       </td>
                    </tr>
                    <tr>
                       <TableLabel>Cus.Code</TableLabel>
                       <TableInput><Select options={['C001', 'C002']} value={form.cusCode} onChange={u('cusCode')} /></TableInput>
                    </tr>
                    <tr>
                       <TableLabel>Assembly</TableLabel>
                       <TableInput><Select options={['Assy 1', 'Assy 2']} value={form.assembly} onChange={u('assembly')} /></TableInput>
                    </tr>
                 </tbody>
              </table>
           </div>

           {/* Part Image Section */}
           <div className="w-[300px] border-l border-slate-300 p-3 bg-slate-50/30">
              <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Part Image</p>
              <div className="aspect-video bg-white border border-slate-300 rounded flex items-center justify-center text-slate-200">
                 <Camera size={48} strokeWidth={1} />
              </div>
           </div>
        </div>

        {/* Action Bar & Metadata Toolbar */}
        <div className="flex items-center justify-between px-2 pt-2">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <input type="checkbox" id="selectAll" className="w-4 h-4 rounded border-slate-300" />
                 <label htmlFor="selectAll" className="text-[11px] font-bold text-slate-600 uppercase">Select All</label>
              </div>
              <div className="flex items-center gap-3 bg-slate-700 px-3 py-1 rounded shadow-lg text-white">
                 <ActionButton onClick={handleSave} color="slate" className="!text-white hover:!bg-white/10"><Save size={14} /> Save</ActionButton>
                 <ActionButton color="slate" className="!text-white hover:!bg-white/10"><Edit size={14} /> Edit</ActionButton>
                 <ActionButton color="rose" className="hover:!bg-rose-500/20"><Trash2 size={14} /> Delete</ActionButton>
                 <ActionButton color="amber" className="hover:!bg-amber-500/20"><Eraser size={14} /> Clear</ActionButton>
              </div>
           </div>

           <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-3">
                 <button className="hover:text-slate-800 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Printer size={14} className="text-slate-400" /> Dos</button>
                 <button className="hover:text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><FileSpreadsheet size={14} className="text-emerald-500" /> Excel</button>
                 <button className="hover:text-rose-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><FileText size={14} className="text-rose-500" /> Pdf</button>
                 <button className="hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Filter size={14} /> Filter</button>
                 <button className="hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Settings size={14} /> Setting</button>
              </div>
           </div>
        </div>

        {/* Results Table */}
        <div className="border border-slate-300 rounded overflow-hidden bg-white min-h-[400px]">
           <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-[#f8fafc] text-[10px] uppercase text-slate-500 font-bold border-b border-slate-300">
                 <tr className="divide-x divide-slate-300">
                    <th className="px-3 py-2 w-16 text-center">S.No</th>
                    <th className="px-3 py-2">Job No</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2 text-center">Required Date</th>
                    <th className="px-3 py-2">Note</th>
                    <th className="px-3 py-2 text-center w-20">Qty</th>
                    <th className="px-3 py-2">Customer Name</th>
                    <th className="px-3 py-2">Customer Code</th>
                    <th className="px-3 py-2">Assembly</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {jobs.length === 0 ? (
                    [...Array(15)].map((_, i) => (
                      <tr key={i} className="h-9 hover:bg-slate-50 divide-x divide-slate-200 text-transparent select-none">
                        <td className="px-3 py-1 text-center text-slate-200 font-bold select-auto">{i + 1}</td>
                        {[...Array(9)].map((_, j) => <td key={j} className="px-3 py-1">.</td>)}
                      </tr>
                    ))
                 ) : (
                    jobs.map((j, idx) => (
                       <tr key={j.id} className="h-9 hover:bg-[#f0f9fa]/40 transition-colors text-[12px] divide-x divide-slate-100 group">
                          <td className="px-3 py-1 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="px-3 py-1 font-bold text-[#0097A7]">{j.jobNo}</td>
                          <td className="px-3 py-1 text-slate-600">{j.model}</td>
                          <td className="px-3 py-1 text-slate-500 font-bold">{j.priority}</td>
                          <td className="px-3 py-1 text-center text-slate-400">{j.reqDate}</td>
                          <td className="px-3 py-1 text-slate-400 italic">{j.note || '-'}</td>
                          <td className="px-3 py-1 text-center font-black text-slate-400">{j.qty}</td>
                          <td className="px-3 py-1 font-bold text-slate-700">{j.cusName}</td>
                          <td className="px-3 py-1 text-slate-500">{j.cusCode}</td>
                          <td className="px-3 py-1 text-slate-500">{j.assembly}</td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
