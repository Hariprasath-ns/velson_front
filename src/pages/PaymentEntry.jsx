import { useState, useEffect } from 'react'
import { X, Save, ChevronRight, Plus, Trash2, RotateCcw } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

// ── Shared UI primitives (Styling from Item Master) ────────────────
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
  billType: '', billNo: '', billDate: '', billAmt: '', adjustAmt: '', balance: '', received: '', days: '', intPer: '', interest: '', shiftAmt: '', discAmt: '', ledgerAc: ''
})

export default function PaymentEntry() {
  const toast = useToast()
  const [form, setForm] = useState({
    paymentType: 'PAYMENT',
    paymentNo: 'P-' + Math.floor(Math.random() * 9000 + 1000),
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
      paymentType: 'PAYMENT', paymentNo: 'P-' + Math.floor(Math.random() * 9000 + 1000), date: new Date().toISOString().split('T')[0],
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
    const payment = { ...form, rows, id: Date.now() }
    const existing = JSON.parse(localStorage.getItem('velson_payments') || '[]')
    localStorage.setItem('velson_payments', JSON.stringify([...existing, payment]))
    toast.success('Payment Saved to LocalStorage Successfully!')
    handleClear()
  }

  // Calculations
  const totalBalanceAmt = rows.reduce((acc, r) => acc + (parseFloat(r.balance) || 0), 0).toFixed(2)
  const totalReceivedAmt = rows.reduce((acc, r) => acc + (parseFloat(r.received) || 0), 0).toFixed(2)
  const totalIntAmt = rows.reduce((acc, r) => acc + (parseFloat(r.shiftAmt) || 0), 0).toFixed(2)
  const grandTotal = (parseFloat(totalReceivedAmt) + parseFloat(totalIntAmt)).toFixed(2)
  const remainingBalance = (parseFloat(totalBalanceAmt) - parseFloat(grandTotal)).toFixed(2)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-20">
      <ConfirmDialog 
        open={confirmDelete.open} 
        onConfirm={removeRow} 
        onCancel={() => setConfirmDelete({ open: false, index: null })} 
      />

      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>Account</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Payment Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Payment Entry Interface</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <RotateCcw size={14} /> Clear
              </button>
              <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-2">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-x-12 gap-y-4">
              <div className="col-span-6 space-y-4">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Payment</Label></div>
                  <div className="col-span-9"><Select options={['RECEIPT', 'PAYMENT']} value={form.paymentType} onChange={u('paymentType')} placeholder="Select Entry Type" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Payment No</Label></div>
                  <div className="col-span-4"><Input value={form.paymentNo} onChange={u('paymentNo')} placeholder="P-0000" /></div>
                  <div className="col-span-1 text-center"><Label required>Date</Label></div>
                  <div className="col-span-4"><Input type="date" value={form.date} onChange={u('date')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Account</Label></div>
                  <div className="col-span-9"><Select options={['CASH', 'BANK']} value={form.cashBank} onChange={u('cashBank')} placeholder="Select Cash/Bank" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Vendor/Party</Label></div>
                  <div className="col-span-9"><Input placeholder="Search Vendor Name..." value={form.partyName} onChange={u('partyName')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Details</Label></div>
                  <div className="col-span-9"><Input placeholder="Enter payment details..." value={form.details} onChange={u('details')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label required>Amount</Label></div>
                  <div className="col-span-3"><Input className="text-right font-bold text-red-600" placeholder="0.00" value={form.amount} onChange={u('amount')} /></div>
                  <div className="col-span-6 flex items-center gap-6 pl-4">
                    {['Auto', 'Manual'].map(mode => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={form.selectionMode === mode} onChange={() => setForm(f => ({...f, selectionMode: mode}))} className="accent-[#0097A7] w-4 h-4" />
                        <span className="text-[12px] font-bold text-slate-600 uppercase">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-6 space-y-4">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Bank Name</Label></div>
                  <div className="col-span-9"><Select options={['SBI', 'HDFC', 'ICICI', 'KOTAK', 'AXIS']} value={form.bankName} onChange={u('bankName')} placeholder="Select Bank" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Chq Date</Label></div>
                  <div className="col-span-4"><Input type="date" value={form.chqDate} onChange={u('chqDate')} /></div>
                  <div className="col-span-5"><Input placeholder="Reference" value={form.extraField} onChange={u('extraField')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3"><Label>Chq No</Label></div>
                  <div className="col-span-9"><Input placeholder="Enter Cheque No" value={form.chqNo} onChange={u('chqNo')} /></div>
                </div>

                <div className="flex justify-end pt-8">
                  <button onClick={handleSave} className="flex items-center gap-2 px-10 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-all shadow-lg active:scale-95">
                    <Save size={18} /> Save Payment
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-700 px-4 py-2.5 flex items-center justify-between">
                <h3 className="text-white text-[11px] font-bold uppercase tracking-widest">Adjustment Rows</h3>
                <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors border border-white/20">
                  <Plus size={14} /> Add Row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3 border-r border-slate-200 w-10 text-center">#</th>
                      {[
                        'Bill Type','Bill No','Bill Date','Bill Amt','Adjust Amt','Balance','Received','Days','Int%','Interest','Shift Amt','Disc Amt','Ledger A/C'
                      ].map(h => (
                        <th key={h} className="px-3 py-3 border-r border-slate-200 whitespace-nowrap">{h}</th>
                      ))}
                      <th className="px-3 py-3 w-12 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors group h-10">
                        <td className="px-3 py-1 border-r border-slate-200 text-center text-slate-400 font-bold text-[11px]">{idx + 1}</td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="Type" className="!border-none !bg-transparent" value={row.billType} onChange={e => setRowField(idx, 'billType', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="No" className="!border-none !bg-transparent" value={row.billNo} onChange={e => setRowField(idx, 'billNo', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input type="date" className="!border-none !bg-transparent" value={row.billDate} onChange={e => setRowField(idx, 'billDate', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right" value={row.billAmt} onChange={e => setRowField(idx, 'billAmt', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right" value={row.adjustAmt} onChange={e => setRowField(idx, 'adjustAmt', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right font-bold text-slate-900" value={row.balance} onChange={e => setRowField(idx, 'balance', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right text-red-600 font-black" value={row.received} onChange={e => setRowField(idx, 'received', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0" className="!border-none !bg-transparent text-right" value={row.days} onChange={e => setRowField(idx, 'days', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0%" className="!border-none !bg-transparent text-right" value={row.intPer} onChange={e => setRowField(idx, 'intPer', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right" value={row.interest} onChange={e => setRowField(idx, 'interest', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right" value={row.shiftAmt} onChange={e => setRowField(idx, 'shiftAmt', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="0.00" className="!border-none !bg-transparent text-right" value={row.discAmt} onChange={e => setRowField(idx, 'discAmt', e.target.value)} /></td>
                        <td className="px-1 py-0.5 border-r border-slate-200"><Input placeholder="Ledger..." className="!border-none !bg-transparent font-semibold" value={row.ledgerAc} onChange={e => setRowField(idx, 'ledgerAc', e.target.value)} /></td>
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
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-[210px] right-0 bg-slate-900 text-white p-4 flex items-center justify-around text-[11px] font-black uppercase tracking-widest z-20 border-t border-white/10">
        <div className="flex flex-col items-center">
          <span className="text-white/40 mb-1">Bill Balance</span>
          <span className="text-[16px] text-white">{totalBalanceAmt}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/40 mb-1">Paid Amount</span>
          <span className="text-[16px] text-red-400">{totalReceivedAmt}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/40 mb-1">Interest Sum</span>
          <span className="text-[16px] text-white">{totalIntAmt}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/40 mb-1">Total Adjustment</span>
          <span className="text-[18px] text-[#00BCD4]">{grandTotal}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/40 mb-1">Net Balance</span>
          <span className="text-[18px] text-orange-400">{remainingBalance}</span>
        </div>
      </div>
    </div>
  )
}
