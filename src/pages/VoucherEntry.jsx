import { useState, useEffect } from 'react'
import { ChevronRight, Save, X, RotateCcw, Trash2, Plus } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

// ── Shared UI primitives (Consistent with Item Master & Receipt Entry) ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
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

const Select = ({ options, placeholder, value, onChange }) => (
  <div className="relative">
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

const emptyRow = () => ({ 
  id: Math.random().toString(36).substr(2, 9),
  ledger: '', narration: '', amt: '' 
})

export default function VoucherEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    tempVoucher: 'TV-' + Math.floor(Math.random() * 900 + 100),
    voucherType: '',
    voucherDate: new Date().toISOString().split('T')[0],
    accountType: '',
    autoNo: Math.floor(Math.random() * 1000 + 1),
    voucherNo: '',
    voucherSection: '',
    details: ''
  })

  const [rows, setRows] = useState([emptyRow()])
  const [confirmDelete, setConfirmDelete] = useState({ open: false, index: null })

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  
  const setRowField = (idx, k, v) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [k]: v } : r)
    setRows(next)
  }

  const addRow = () => setRows([...rows, emptyRow()])

  const handleDeleteRow = () => {
    const next = rows.filter((_, i) => i !== confirmDelete.index)
    setRows(next.length ? next : [emptyRow()])
    setConfirmDelete({ open: false, index: null })
  }

  const handleSave = () => {
    if (!form.voucherType || rows.every(r => !r.amt)) {
      toast.warning('Please select Voucher Type and add amount.')
      return
    }
    const voucher = { ...form, rows, id: Date.now() }
    const existing = JSON.parse(localStorage.getItem('velson_vouchers') || '[]')
    localStorage.setItem('velson_vouchers', JSON.stringify([...existing, voucher]))
    toast.success('Voucher Saved to LocalStorage Successfully!')
    handleCancel()
  }

  const handleCancel = () => {
    setForm({
      tempVoucher: 'TV-' + Math.floor(Math.random() * 900 + 100),
      voucherType: '',
      voucherDate: new Date().toISOString().split('T')[0],
      accountType: '',
      autoNo: Math.floor(Math.random() * 1000 + 1),
      voucherNo: '',
      voucherSection: '',
      details: ''
    })
    setRows([emptyRow()])
  }

  const totalAmt = rows.reduce((acc, r) => acc + (parseFloat(r.amt) || 0), 0).toFixed(2)

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <ConfirmDialog 
        open={confirmDelete.open} 
        onConfirm={handleDeleteRow} 
        onCancel={() => setConfirmDelete({ open: false, index: null })} 
      />

      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black">
          {/* <span>Dashboard</span> <ChevronRight size={12} /> */}
           <span>Account</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Voucher Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-700 rounded-sm" />
                <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Voucher Management</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Temp ID</span>
                <Input className="!w-24 !py-1 !font-bold" value={form.tempVoucher} onChange={u('tempVoucher')} placeholder="TV-000" />
              </div>
            </div>
            <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-2 flex items-center gap-1 text-[11px] font-bold uppercase">
              <X size={18} strokeWidth={2.5} /> Close
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-x-12 gap-y-4 mb-8">
              <div className="col-span-7 space-y-4">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Voucher Type</Label></div>
                  <div className="col-span-4"><Select options={['RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL']} value={form.voucherType} onChange={u('voucherType')} placeholder="Select Type" /></div>
                  <div className="col-span-1 text-center"><Label>Date</Label></div>
                  <div className="col-span-4"><Input type="date" value={form.voucherDate} onChange={u('voucherDate')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Account</Label></div>
                  <div className="col-span-4"><Select options={['Cash', 'Bank']} value={form.accountType} onChange={u('accountType')} placeholder="Select Account" /></div>
                  <div className="col-span-1 text-center"><Label required>Auto</Label></div>
                  <div className="col-span-4"><Input value={form.autoNo} onChange={u('autoNo')} placeholder="000" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Voucher No</Label></div>
                  <div className="col-span-4"><Input value={form.voucherNo} onChange={u('voucherNo')} placeholder="V-0000" /></div>
                  <div className="col-span-1 text-center"><Label>Sec</Label></div>
                  <div className="col-span-4"><Select options={['General', 'Purchase', 'Sales']} value={form.voucherSection} onChange={u('voucherSection')} placeholder="Section" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Details</Label></div>
                  <div className="col-span-9"><Input placeholder="Enter voucher narration/details..." value={form.details} onChange={u('details')} /></div>
                </div>
              </div>

              <div className="col-span-5 flex flex-col justify-center items-center border-l border-slate-100 pl-10">
                 <div className="w-full space-y-3">
                    <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-all shadow-md active:scale-95">
                      <Save size={18} /> Save Voucher
                    </button>
                    <button onClick={handleCancel} className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[13px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                      <RotateCcw size={18} /> Reset Form
                    </button>
                 </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-700 px-4 py-2.5 flex items-center justify-between">
                <h3 className="text-white text-[11px] font-bold uppercase tracking-widest">Entry Rows</h3>
      
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">S.No</th>
                      <th className="px-4 py-3 border-r border-slate-200">Ledger Account</th>
                      <th className="px-4 py-3 border-r border-slate-200">Particulars</th>
                      <th className="px-4 py-3 text-right w-40">Amount</th>
                      <th className="px-4 py-3 w-12 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors group h-12">
                        <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-400 font-bold text-[11px]">{idx + 1}</td>
                        <td className="px-1 py-1 border-r border-slate-200"><Input placeholder="Enter Ledger Name..." className="!border-none !bg-transparent font-semibold" value={row.ledger} onChange={e => setRowField(idx, 'ledger', e.target.value)} /></td>
                        <td className="px-1 py-1 border-r border-slate-200"><Input placeholder="Add narration..." className="!border-none !bg-transparent" value={row.narration} onChange={e => setRowField(idx, 'narration', e.target.value)} /></td>
                        <td className="px-1 py-1 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right font-black text-[#0097A7]" value={row.amt} onChange={e => setRowField(idx, 'amt', e.target.value)} /></td>
                        <td className="px-2 py-1 text-center">
                          <button onClick={() => setConfirmDelete({ open: true, index: idx })} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 text-[12px] font-black text-white shadow-xl">
               <span className="uppercase text-white/40 tracking-widest">Total Transaction Amount</span>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] text-white/30 uppercase">Debit Sum:</span>
                 <span className="text-[20px] text-[#00BCD4] tracking-tighter">{totalAmt}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
