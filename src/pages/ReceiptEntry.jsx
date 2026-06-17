import { useState, useEffect } from 'react'
import { X, Save, ChevronRight, Plus, Trash2, RotateCcw } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

// ── Shared UI primitives (Enhanced Professional Styling) ────────────────
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
    {required && <span className="text-rose-500 mr-1">*</span>}
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
    className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'hover:border-slate-300 shadow-sm focus:shadow-md'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange }) => (
  <div className="relative group">
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 hover:border-slate-300 cursor-pointer shadow-sm group-hover:shadow-md"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const emptyRow = () => ({
  id: Math.random().toString(36).substr(2, 9),
  billType: '', billNo: '', billDate: '', billAmt: '', adjustAmt: '', balance: '', received: '', shiftAmt: '', discAmt: '', ledgerAc: ''
})

export default function ReceiptEntry() {
  const toast = useToast()
  // Initial state empty for "Enterable" experience
  const [form, setForm] = useState({
    receiptType: 'RECEIPT',
    receiptNo: 'R-' + Math.floor(Math.random() * 9000 + 1000),
    date: new Date().toISOString().split('T')[0],
    cashBank: '',
    partyName: '',
    details: '',
    amount: '',
    selectionMode: 'Auto',
    bankName: '',
    chqDate: '',
    chqNo: '',
    extraField: '',
  })

  const [rows, setRows] = useState([emptyRow()])
  const [confirmDelete, setConfirmDelete] = useState({ open: false, index: null })

  // Synchronize rows with state updates for real-time calculation feel
  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  
  const setRowField = (idx, k, v) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [k]: v } : r)
    setRows(next)
  }

  const addRow = () => setRows([...rows, emptyRow()])

  const removeRow = () => {
    const next = rows.filter((_, i) => i !== confirmDelete.index)
    setRows(next.length ? next : [emptyRow()])
    setConfirmDelete({ open: false, index: null })
  }

  const handleClear = () => {
    setForm({
      receiptType: 'RECEIPT', receiptNo: 'R-' + Math.floor(Math.random() * 9000 + 1000), date: new Date().toISOString().split('T')[0],
      cashBank: '', partyName: '', details: '', amount: '',
      selectionMode: 'Auto', bankName: '', chqDate: '',
      chqNo: '', extraField: '',
    })
    setRows([emptyRow()])
  }

  const handleSave = () => {
    if (!form.partyName || !form.amount) {
      toast.warning('Please fill Party Name and Amount.')
      return
    }
    const receipt = { ...form, rows, id: Date.now() }
    const existing = JSON.parse(localStorage.getItem('velson_receipts') || '[]')
    localStorage.setItem('velson_receipts', JSON.stringify([...existing, receipt]))
    toast.success('Receipt Saved to LocalStorage Successfully!')
    handleClear()
  }

  // Real-time Calculations
  const totalBalanceAmt = rows.reduce((acc, r) => acc + (parseFloat(r.balance) || 0), 0).toFixed(2)
  const totalReceivedAmt = rows.reduce((acc, r) => acc + (parseFloat(r.received) || 0), 0).toFixed(2)
  const totalIntAmt = rows.reduce((acc, r) => acc + (parseFloat(r.shiftAmt) || 0), 0).toFixed(2)
  const grandTotal = (parseFloat(totalReceivedAmt) + parseFloat(totalIntAmt)).toFixed(2)
  const remainingBalance = (parseFloat(totalBalanceAmt) - parseFloat(grandTotal)).toFixed(2)

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32">
      <ConfirmDialog 
        open={confirmDelete.open} 
        onConfirm={removeRow} 
        onCancel={() => setConfirmDelete({ open: false, index: null })} 
      />
      
      <div className="px-8 py-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-6 uppercase font-bold tracking-[0.2em]">
          {/* <span className="hover:text-teal-600 cursor-pointer transition-colors">Dashboard</span>  */}
          {/* <ChevronRight size={10} className="text-slate-300" />  */}
          <span className="hover:text-teal-600 cursor-pointer transition-colors">Account</span> 
          <ChevronRight size={10} className="text-slate-300" /> 
          <span className="text-teal-600">Receipt Entry</span>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
                <RotateCcw className="text-teal-600" size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-extrabold text-slate-800 uppercase tracking-tight">Receipt Details Entry</h2>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em]">Create and manage financial receipts</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95">
                <RotateCcw size={14} className="text-slate-400" /> Clear Form
              </button>
              <button onClick={() => window.history.back()} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-12 gap-x-16 gap-y-6">
              {/* Main Fields */}
              <div className="col-span-6 space-y-5">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Receipt</Label></div>
                  <div className="col-span-9"><Select options={['RECEIPT', 'PAYMENT']} value={form.receiptType} onChange={u('receiptType')} placeholder="Select Type" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Receipt No</Label></div>
                  <div className="col-span-4"><Input value={form.receiptNo} onChange={u('receiptNo')} placeholder="R-0000" className="font-mono tracking-wider text-teal-700 bg-teal-50/30" /></div>
                  <div className="col-span-1 text-center"><Label required>Date</Label></div>
                  <div className="col-span-4"><Input type="date" value={form.date} onChange={u('date')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Cash/Bank</Label></div>
                  <div className="col-span-9"><Select options={['CASH', 'BANK']} value={form.cashBank} onChange={u('cashBank')} placeholder="Choose Account" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Party Name</Label></div>
                  <div className="col-span-9"><Input placeholder="Enter Party Name..." value={form.partyName} onChange={u('partyName')} className="placeholder:italic" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Details</Label></div>
                  <div className="col-span-9"><Input placeholder="Enter transaction details..." value={form.details} onChange={u('details')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Amount</Label></div>
                  <div className="col-span-4"><Input placeholder="0.00" className="text-right font-black text-teal-600 text-lg bg-teal-50/50 border-teal-100" value={form.amount} onChange={u('amount')} /></div>
                  <div className="col-span-5 flex items-center justify-around bg-slate-50 p-2 rounded-xl border border-slate-100 ml-4">
                    {['Auto', 'Manual'].map(mode => (
                      <label key={mode} className={`flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-lg transition-all ${form.selectionMode === mode ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'opacity-60 hover:opacity-100'}`}>
                        <input type="radio" checked={form.selectionMode === mode} onChange={() => setForm(f => ({...f, selectionMode: mode}))} className="accent-teal-600 w-4 h-4" />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${form.selectionMode === mode ? 'text-teal-700' : 'text-slate-500'}`}>{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extra Fields */}
              <div className="col-span-6 space-y-5">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Bank</Label></div>
                  <div className="col-span-9"><Select options={['SBI', 'HDFC', 'ICICI', 'KOTAK', 'AXIS']} value={form.bankName} onChange={u('bankName')} placeholder="Select Bank Name" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Chq Date</Label></div>
                  <div className="col-span-4"><Input type="date" value={form.chqDate} onChange={u('chqDate')} /></div>
                  <div className="col-span-5"><Input placeholder="Reference/Ref No" value={form.extraField} onChange={u('extraField')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Chq No</Label></div>
                  <div className="col-span-9"><Input placeholder="Enter Cheque/Transaction No" value={form.chqNo} onChange={u('chqNo')} /></div>
                </div>

                <div className="flex justify-end pt-12">
                  <button onClick={handleSave} className="group flex items-center gap-3 px-12 py-4 bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-extrabold rounded-2xl transition-all shadow-[0_10px_20px_-5px_rgba(13,148,136,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(13,148,136,0.4)] active:scale-95">
                    <Save size={20} className="group-hover:scale-110 transition-transform" /> Save Receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="mt-12 border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                  <h3 className="text-white text-[12px] font-extrabold uppercase tracking-[0.2em]">Adjustment Ledger</h3>
                </div>
                
              </div>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead className="bg-slate-50/80 backdrop-blur-sm text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-4 border-r border-slate-100 w-12 text-center bg-slate-50/50">#</th>
                      {['Bill Type','Bill No','Bill Date','Bill Amt','Adjust Amt','Balance','Received','Shift Amt','Disc Amt','Ledger A/C'].map(h => (
                        <th key={h} className="px-4 py-4 border-r border-slate-100 last:border-r-0">{h}</th>
                      ))}
                      <th className="px-4 py-4 w-14 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-teal-50/30 transition-colors group h-12">
                        <td className="px-4 py-1 border-r border-slate-100 text-center text-slate-400 font-bold text-[11px] bg-slate-50/30">{idx + 1}</td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="Type" className="!border-none !bg-transparent !shadow-none focus:!bg-white" value={row.billType} onChange={e => setRowField(idx, 'billType', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="Number" className="!border-none !bg-transparent !shadow-none focus:!bg-white font-mono" value={row.billNo} onChange={e => setRowField(idx, 'billNo', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input type="date" className="!border-none !bg-transparent !shadow-none focus:!bg-white" value={row.billDate} onChange={e => setRowField(idx, 'billDate', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="0.00" className="!border-none !bg-transparent !shadow-none focus:!bg-white text-right" value={row.billAmt} onChange={e => setRowField(idx, 'billAmt', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="0.00" className="!border-none !bg-transparent !shadow-none focus:!bg-white text-right" value={row.adjustAmt} onChange={e => setRowField(idx, 'adjustAmt', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="0.00" className="!border-none !bg-transparent !shadow-none focus:!bg-white text-right font-bold text-slate-900" value={row.balance} onChange={e => setRowField(idx, 'balance', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="0.00" className="!border-none !bg-transparent !shadow-none focus:!bg-white text-right text-teal-600 font-black" value={row.received} onChange={e => setRowField(idx, 'received', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="0.00" className="!border-none !bg-transparent !shadow-none focus:!bg-white text-right" value={row.shiftAmt} onChange={e => setRowField(idx, 'shiftAmt', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="0.00" className="!border-none !bg-transparent !shadow-none focus:!bg-white text-right" value={row.discAmt} onChange={e => setRowField(idx, 'discAmt', e.target.value)} /></td>
                        <td className="px-2 py-1 border-r border-slate-100"><Input placeholder="Ledger Account..." className="!border-none !bg-transparent !shadow-none focus:!bg-white font-semibold" value={row.ledgerAc} onChange={e => setRowField(idx, 'ledgerAc', e.target.value)} /></td>
                        <td className="px-4 py-1 text-center">
                          <button onClick={() => setConfirmDelete({ open: true, index: idx })} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Summary Bar (Premium Glassmorphism) */}
      <div className="fixed bottom-6 left-[230px] right-6 bg-slate-900/95 backdrop-blur-md text-white px-8 py-5 flex items-center justify-between rounded-2xl z-20 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 mb-1 uppercase tracking-[0.2em] font-bold">Total Balance</span>
            <span className="text-[20px] text-white font-black leading-none">{totalBalanceAmt}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 mb-1 uppercase tracking-[0.2em] font-bold">Received</span>
            <span className="text-[20px] text-emerald-400 font-black leading-none">{totalReceivedAmt}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 mb-1 uppercase tracking-[0.2em] font-bold">Interest</span>
            <span className="text-[20px] text-white font-black leading-none">{totalIntAmt}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-teal-400 mb-1 uppercase tracking-[0.2em] font-bold">Total Adjustment</span>
            <span className="text-[24px] text-teal-400 font-black leading-none">{grandTotal}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-orange-400 mb-1 uppercase tracking-[0.2em] font-bold">Remaining</span>
            <span className="text-[24px] text-orange-400 font-black leading-none">{remainingBalance}</span>
          </div>
        </div>
      </div>
    </div>
    
  )
}
