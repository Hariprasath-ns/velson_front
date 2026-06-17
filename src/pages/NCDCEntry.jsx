import { useState, useEffect } from 'react'
import { 
  ChevronRight, Save, X, Search, RefreshCw, Trash2, Eraser, 
  FileSpreadsheet, Camera, Truck, ChevronUp, CheckCircle2, ShieldAlert,
  Plus, RotateCcw, Package, ClipboardList, RefreshCcw
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 mr-1">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-2 py-0.5 text-[12px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} shadow-sm ${className}`}
    {...props}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2 py-0.5 pr-6 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer shadow-sm font-bold"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const TextArea = ({ placeholder, value, onChange, className = "", rows = 2 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-2 py-1 text-[12px] border border-slate-300 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all duration-200 hover:border-slate-300 resize-none shadow-sm ${className}`}
  />
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

export default function NCDCEntry() {
  const [form, setForm] = useState({
    dcNo: '',
    date: '15-Apr-2026',
    dcType: '',
    vehicleNo: '',
    customerName: '',
    customerDetails: '',
    contPerson: '',
    driverName: '',
    contactNo: '',
    desThrough: '',
    gstNo: '',
    dcPartNo: '',
    partNo: '',
    partName: '',
    spec: '',
    brand: '',
    qty: '',
    uom: '',
    rate: '',
    amount: '',
    mGrade: '',
    hrc: '',
    weight: '',
    barcode: '',
    details: ''
  })

  const [items, setItems] = useState([])
  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleReset = () => {
    setForm({
      ...form,
      customerName: '',
      customerDetails: '',
      dcPartNo: '',
      partNo: '',
      qty: '',
      amount: ''
    })
    setItems([])
  }

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-700 rounded-sm" />
           <h1 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">NC DC Entry</h1>
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
        {/* Section 1: Logistics & Customer */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-4 shadow-sm">
           <div className="grid grid-cols-12 gap-x-8 gap-y-3">
              {/* Row 1 */}
              <div className="col-span-3 flex items-center gap-2">
                <Label required>DC No :</Label>
                <Input value={form.dcNo} onChange={u('dcNo')} className="flex-1" />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Label>Date :</Label>
                <Select options={['15-Apr-2026']} value={form.date} onChange={u('date')} className="flex-1" />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Label required>DC Type :</Label>
                <Select options={['Non-Conformance', 'Returnable']} value={form.dcType} onChange={u('dcType')} className="flex-1" />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Label>Vehicle No :</Label>
                <Select options={['TN-37-AA-1234', 'TN-38-BB-5678']} value={form.vehicleNo} onChange={u('vehicleNo')} className="flex-1" />
              </div>

              {/* Row 2 & 3 & 4 */}
              <div className="col-span-6 space-y-3">
                 <div className="flex items-start gap-2">
                    <Label required>Customer Name :</Label>
                    <div className="flex-1 space-y-2">
                       <Select options={['Client X', 'Client Y']} placeholder="" value={form.customerName} onChange={u('customerName')} />
                       <TextArea value={form.customerDetails} onChange={u('customerDetails')} rows={3} placeholder="Customer Address..." />
                    </div>
                 </div>
              </div>
              
              <div className="col-span-3 space-y-3">
                 <div className="flex items-center gap-2">
                    <Label>Cont. Person :</Label>
                    <Input value={form.contPerson} onChange={u('contPerson')} className="flex-1" />
                 </div>
                 <div className="flex items-center gap-2">
                    <Label>Contact No :</Label>
                    <Input value={form.contactNo} onChange={u('contactNo')} className="flex-1" />
                 </div>
                 <div className="flex items-center gap-2">
                    <Label>GST No :</Label>
                    <Input value={form.gstNo} onChange={u('gstNo')} className="flex-1" />
                 </div>
              </div>

              <div className="col-span-3 space-y-3">
                 <div className="flex items-center gap-2">
                    <Label>Driver Name :</Label>
                    <Select options={['John Doe', 'Mike Smith']} value={form.driverName} onChange={u('driverName')} className="flex-1" />
                 </div>
                 <div className="flex items-center gap-2">
                    <Label>Des. Through :</Label>
                    <Select options={['Self', 'Courier']} value={form.desThrough} onChange={u('desThrough')} className="flex-1" />
                 </div>
              </div>
           </div>
        </div>

        {/* Section 2: Part Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm relative">
           <div className="grid grid-cols-12 gap-x-8 gap-y-3">
              <div className="col-span-8 grid grid-cols-12 gap-x-6 gap-y-3">
                 <div className="col-span-6 flex items-center gap-2">
                    <Label>DC Part No :</Label>
                    <Select options={['P-101', 'P-102']} className="flex-1" />
                 </div>
                 <div className="col-span-6 flex items-center gap-2">
                    <Label>Part No :</Label>
                    <Select options={['PT-001', 'PT-002']} value={form.partNo} onChange={u('partNo')} className="flex-1" />
                 </div>

                 <div className="col-span-4 flex items-center gap-2">
                    <Label>Part Name :</Label>
                    <Input value={form.partName} onChange={u('partName')} className="flex-1" />
                 </div>
                 <div className="col-span-4 flex items-center gap-2">
                    <Label>Spec :</Label>
                    <Input value={form.spec} onChange={u('spec')} className="flex-1" />
                 </div>
                 <div className="col-span-4 flex items-center gap-2">
                    <Label>Brand :</Label>
                    <Input value={form.brand} onChange={u('brand')} className="flex-1" />
                 </div>

                 <div className="col-span-3 flex items-center gap-2">
                    <Label>Qty :</Label>
                    <Input value={form.qty} onChange={u('qty')} className="flex-1" />
                 </div>
                 <div className="col-span-3 flex items-center gap-2">
                    <Label>UOM :</Label>
                    <Input value={form.uom} onChange={u('uom')} className="flex-1" />
                 </div>
                 <div className="col-span-3 flex items-center gap-2">
                    <Label>Rate :</Label>
                    <Input value={form.rate} onChange={u('rate')} className="flex-1" />
                 </div>
                 <div className="col-span-3 flex items-center gap-2">
                    <Label>Amount :</Label>
                    <Input value={form.amount} onChange={u('amount')} className="flex-1" />
                 </div>

                 <div className="col-span-4 flex items-center gap-2">
                    <Label>M. Grade :</Label>
                    <Input value={form.mGrade} onChange={u('mGrade')} className="flex-1" />
                 </div>
                 <div className="col-span-4 flex items-center gap-2">
                    <Label>HRC :</Label>
                    <Input value={form.hrc} onChange={u('hrc')} className="flex-1" />
                 </div>
                 <div className="col-span-4 flex items-center gap-2">
                    <Label>Weight :</Label>
                    <Input value={form.weight} onChange={u('weight')} className="flex-1" />
                 </div>

                 <div className="col-span-6 flex items-center gap-2">
                    <Label>Barcode :</Label>
                    <Input value={form.barcode} onChange={u('barcode')} className="flex-1" />
                 </div>
                 <div className="col-span-6 flex items-center gap-2">
                    <Label>Details :</Label>
                    <Select options={['Rejected', 'Retesting']} value={form.details} onChange={u('details')} className="flex-1" />
                 </div>
              </div>

              {/* Image Box */}
              <div className="col-span-4 space-y-2">
                 <Label>File Image</Label>
                 <div className="w-full h-40 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center gap-2 group relative overflow-hidden">
                    <Camera size={32} className="text-slate-300 group-hover:scale-110 transition-transform" />
                    <div className="absolute bottom-2">
                       <button className="px-3 py-1 bg-white border border-slate-300 rounded text-[10px] font-black uppercase shadow-sm hover:bg-[#0097A7] hover:text-white transition-all">Browse Image</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Section 3: Action Bar */}
        <div className="bg-slate-700 p-2 rounded-lg flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-2 bg-white rounded px-2 py-1 w-[400px]">
              <div className="w-4 h-4 bg-red-700 rounded-sm" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Search</span>
              <div className="flex-1 relative">
                <input type="text" className="w-full px-2 py-0.5 text-[12px] border-none focus:ring-0" placeholder="Search NC Entries..." />
                <Search size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
           </div>
           
           <div className="flex items-center gap-4 pr-2 text-white">
              <ActionButton color="slate" className="!text-white hover:!bg-white/10"><RefreshCcw size={14} /> Refresh</ActionButton>
              <ActionButton color="slate" className="!text-white hover:!bg-white/10"><Save size={14} /> Save</ActionButton>
              <ActionButton color="rose" className="hover:!bg-rose-500/20"><Trash2 size={14} /> Delete</ActionButton>
              <ActionButton color="amber" className="hover:!bg-amber-500/20"><Eraser size={14} /> Clear</ActionButton>
           </div>
        </div>

        {/* Section 4: Data Table Placeholder */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[300px]">
           <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-[#f8fafc] text-[10px] uppercase text-slate-500 font-bold border-b border-slate-300">
                 <tr className="divide-x divide-slate-300">
                    <th className="px-3 py-2 w-16 text-center">ID</th>
                    <th className="px-3 py-2">DC No</th>
                    <th className="px-3 py-2">DC Date</th>
                    <th className="px-3 py-2">Customer Name</th>
                    <th className="px-3 py-2">Part No</th>
                    <th className="px-3 py-2">Part Name</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2">UOM</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Vehicle No</th>
                    <th className="px-3 py-2">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 <tr>
                    <td colSpan={11} className="py-24 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest opacity-40">Registry Offline</td>
                 </tr>
              </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
