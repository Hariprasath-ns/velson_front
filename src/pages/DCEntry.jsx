import { useState, useEffect } from 'react'
import { 
  ChevronRight, Save, X, Search, RotateCcw, Edit, Trash2, Eraser, 
  FileSpreadsheet, Camera, Package, ChevronUp, CheckCircle2,
  ClipboardList, Plus, FileText, Printer, Eye, Download, Settings, Filter
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 mr-0.5">*</span>}
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
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} shadow-sm ${className}`}
    {...props}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-1.5 pr-8 text-[12px] border border-slate-200 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer shadow-sm"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const TextArea = ({ placeholder, value, onChange, className = "", rows = 3 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-3 py-2 text-[12px] border border-slate-200 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 resize-none shadow-sm ${className}`}
  />
)

const ActionButton = ({ onClick, children, className = "", color = "amber" }) => {
  const styles = {
    amber: "bg-[#fff8e1] hover:bg-[#ffecb3] text-[#f57c00] border-[#ffe082]",
    emerald: "bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#2e7d32] border-[#a5d6a7]",
    rose: "bg-[#ffebee] hover:bg-[#ffcdd2] text-[#c62828] border-[#ef9a9a]",
    slate: "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"
  }
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded border transition-all shadow-sm active:scale-95 ${styles[color] || styles.slate} ${className}`}
    >
      {children}
    </button>
  )
}

export default function DCEntry() {
  const [form, setForm] = useState({
    dcNo: 'DC-' + Math.floor(Math.random() * 90000 + 10000),
    date: '15-Apr-2026',
    customerName: '',
    customerDetails: '',
    dcType: '',
    vehicleNo: '',
    contPerson: '',
    driverName: '',
    contactNo: '',
    desThrough: '',
    gstNo: '',
    barcode: '',
    partNo: '',
    partName: '',
    spec: '',
    brand: '',
    qty: '',
    uom: 'PCS',
    rate: '',
    amount: '',
    availableStock: '0.0',
    stockLocation: '',
    heatTreatment: '',
    mGrade: '',
    hrc: '',
    weight: '',
    rework: 'NO',
    details: '',
    searchQuery: ''
  })

  const [items, setItems] = useState([])
  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleReset = () => {
    setForm({
      ...form,
      dcNo: 'DC-' + Math.floor(Math.random() * 90000 + 10000),
      date: '15-Apr-2026',
      customerName: '',
      customerDetails: '',
      items: []
    })
    setItems([])
  }

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-700 rounded-sm" />
           <h1 className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">DC Entry</h1>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-0.5 rounded">
              <FileSpreadsheet size={14} /> Excel
           </button>
           <button onClick={() => window.history.back()} className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded transition-colors">
              <X size={16} strokeWidth={3} />
           </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Step 1: Customer & Logistics Info */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-12 gap-x-10 gap-y-4">
            {/* Left Info */}
            <div className="col-span-4 space-y-3">
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-3 text-right"><Label required>DC No :</Label></div>
                <div className="col-span-9"><Input value={form.dcNo} onChange={u('dcNo')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-3 text-right"><Label required>Customer Name :</Label></div>
                <div className="col-span-9"><Select options={['Customer A', 'Customer B']} placeholder="" value={form.customerName} onChange={u('customerName')} /></div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3"></div>
                <div className="col-span-9"><TextArea value={form.customerDetails} onChange={u('customerDetails')} rows={3} /></div>
              </div>
            </div>

            {/* Middle Info */}
            <div className="col-span-4 space-y-3">
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Date :</Label></div>
                <div className="col-span-8"><Select options={['15-Apr-2026', '16-Apr-2026']} value={form.date} onChange={u('date')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label required>DC Type :</Label></div>
                <div className="col-span-8"><Select options={['Sales', 'Returnable']} placeholder="" value={form.dcType} onChange={u('dcType')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Cont.Person :</Label></div>
                <div className="col-span-8"><Input value={form.contPerson} onChange={u('contPerson')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Contact No :</Label></div>
                <div className="col-span-8"><Input value={form.contactNo} onChange={u('contactNo')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>GST No :</Label></div>
                <div className="col-span-8"><Input value={form.gstNo} onChange={u('gstNo')} /></div>
              </div>
            </div>

            {/* Right Info */}
            <div className="col-span-4 space-y-3">
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Vehicle No :</Label></div>
                <div className="col-span-8"><Select options={['TN-37-XY-0001', 'TN-37-XY-0002']} placeholder="" value={form.vehicleNo} onChange={u('vehicleNo')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Driver Name :</Label></div>
                <div className="col-span-8"><Select options={['Driver X', 'Driver Y']} placeholder="" value={form.driverName} onChange={u('driverName')} /></div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 text-right"><Label>Des.Through :</Label></div>
                <div className="col-span-8"><Select options={['By Hand', 'Transport']} placeholder="" value={form.desThrough} onChange={u('desThrough')} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Item Details Section */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-7 space-y-3">
               <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3 text-right"><Label>Barcode :</Label></div>
                  <div className="col-span-5"><Input value={form.barcode} onChange={u('barcode')} /></div>
                  <div className="col-span-2">
                    <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50">Search</button>
                  </div>
                  <div className="col-span-2 text-right"><Label>Part No :</Label></div>
               </div>
               <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3 text-right"><Label>Part Name :</Label></div>
                  <div className="col-span-5"><Input value={form.partName} onChange={u('partName')} /></div>
                  <div className="col-span-4"><Select options={['P-001', 'P-002']} value={form.partNo} onChange={u('partNo')} /></div>
               </div>
               <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3 text-right"><Label>Qty :</Label></div>
                  <div className="col-span-3"><Input value={form.qty} onChange={u('qty')} type="number" /></div>
                  <div className="col-span-2 text-right"><Label>UOM :</Label></div>
                  <div className="col-span-4 flex items-center gap-2">
                     <Input value={form.uom} onChange={u('uom')} className="flex-1" />
                     <Label>Rate :</Label>
                     <Input value={form.rate} onChange={u('rate')} type="number" className="flex-1" />
                  </div>
               </div>
               <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3 text-right font-bold text-[#0097A7] text-[11px]">Available Stock :</div>
                  <div className="col-span-2 font-bold text-blue-600 text-[11px]">{form.availableStock}</div>
                  <div className="col-span-3 text-right"><Label>Stock Location :</Label></div>
                  <div className="col-span-4 flex items-center gap-2">
                     <Select options={['A-01', 'B-02']} placeholder="" value={form.stockLocation} onChange={u('stockLocation')} className="flex-1" />
                     <Label>Amount :</Label>
                     <Input value={form.amount} onChange={u('amount')} readOnly className="flex-1 !bg-slate-100" />
                  </div>
               </div>
               <div className="grid grid-cols-12 items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="col-span-3 text-right"><Label>Heat Treatment :</Label></div>
                  <div className="col-span-3"><Input value={form.heatTreatment} onChange={u('heatTreatment')} /></div>
                  <div className="col-span-2 text-right"><Label>M.Grade :</Label></div>
                  <div className="col-span-4"><Input value={form.mGrade} onChange={u('mGrade')} /></div>
               </div>
               <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3 text-right"><Label>Rework :</Label></div>
                  <div className="col-span-3"><Select options={['NO', 'YES']} value={form.rework} onChange={u('rework')} /></div>
                  <div className="col-span-2 text-right"><Label>HRC :</Label></div>
                  <div className="col-span-1"><Input value={form.hrc} onChange={u('hrc')} /></div>
                  <div className="col-span-1 text-right"><Label>Weight :</Label></div>
                  <div className="col-span-2"><Input value={form.weight} onChange={u('weight')} /></div>
               </div>
               <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3 text-right"><Label>Details :</Label></div>
                  <div className="col-span-9"><Select options={['N/A', 'D-001']} value={form.details} onChange={u('details')} /></div>
               </div>
            </div>

            {/* Stock Detail & Image Panel */}
            <div className="col-span-5 space-y-4">
               <div className="grid grid-cols-12 gap-4 h-full">
                  <div className="col-span-6 flex flex-col">
                     <Label>Part Stock Details</Label>
                     <div className="flex-1 bg-slate-400 rounded border border-slate-500 shadow-inner flex items-center justify-center">
                        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Stock Data Grid</span>
                     </div>
                  </div>
                  <div className="col-span-6 flex flex-col space-y-2">
                     <Label>File Image</Label>
                     <div className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-300">
                        <Camera size={32} strokeWidth={1} />
                        <span className="text-[9px] font-bold uppercase mt-1 italic">Preview</span>
                     </div>
                     <button className="w-full py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded shadow-sm hover:bg-slate-50">Browse Image</button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions & Registry Search */}
        <div className="bg-slate-700 p-2 rounded-lg flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-2 bg-white rounded px-2 py-1 w-[400px]">
              <div className="w-4 h-4 bg-red-700 rounded-sm" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Search</span>
              <div className="flex-1 relative">
                <input type="text" className="w-full px-2 py-0.5 text-[12px] border-none focus:ring-0" />
                <Search size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
           </div>
           
           <div className="flex items-center gap-2 pr-2">
              <ActionButton color="amber"><RotateCcw size={14} /> Refresh</ActionButton>
              <ActionButton color="emerald"><Save size={14} /> Save</ActionButton>
              <ActionButton color="slate"><Edit size={14} /> Edit</ActionButton>
              <ActionButton color="rose"><Trash2 size={14} /> Delete</ActionButton>
              <ActionButton color="amber"><Eraser size={14} /> Clear</ActionButton>
           </div>
        </div>

        {/* Items Table / Registry Area */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[300px]">
           <table className="w-full text-left border-collapse">
              <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                 <tr>
                    <th className="px-4 py-3 border-r border-slate-100 w-12 text-center">#</th>
                    <th className="px-4 py-3 border-r border-slate-100">Part No</th>
                    <th className="px-4 py-3 border-r border-slate-100">Part Name</th>
                    <th className="px-4 py-3 border-r border-slate-100 text-right">Qty</th>
                    <th className="px-4 py-3 border-r border-slate-100 text-center">UOM</th>
                    <th className="px-4 py-3 border-r border-slate-100 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {items.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="py-24 text-center text-slate-200 italic uppercase font-black text-[10px] tracking-widest">Despatch Table Offline</td>
                    </tr>
                 ) : (
                    items.map((item, idx) => (
                       <tr key={item.id} className="hover:bg-slate-50 transition-colors h-12 text-[12px]">
                          <td className="px-4 py-1 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="px-4 py-1 font-bold text-[#0097A7]">{item.partNo}</td>
                          <td className="px-4 py-1 font-semibold text-slate-700 uppercase">{item.partName}</td>
                          <td className="px-4 py-1 text-right font-black text-slate-900">{item.qty}</td>
                          <td className="px-4 py-1 text-center font-bold text-slate-500">{item.uom}</td>
                          <td className="px-4 py-1 text-right text-slate-600">{item.rate}</td>
                          <td className="px-4 py-1 text-right font-black text-[#0097A7]">{item.amount}</td>
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
