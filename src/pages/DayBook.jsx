import { useState, useEffect } from 'react'
import { ChevronRight, Search, Printer, X, FileText, Download, FileSpreadsheet, FileJson, Filter, Settings } from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
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

const SEED_DATA = [
  { id: 1, date: '2026-04-15', voucherType: 'RECEIPT', voucherNo: 'R-1001', ledger: 'ABC Enterprises', debit: '0.00', credit: '38000.00', narration: 'Payment for April Invoices' },
  { id: 2, date: '2026-04-15', voucherType: 'PAYMENT', voucherNo: 'P-5001', ledger: 'X-Caliber Forge', debit: '87000.00', credit: '0.00', narration: 'Vendor Payment' },
  { id: 3, date: '2026-04-15', voucherType: 'JOURNAL', voucherNo: 'J-5003', ledger: 'Depreciation A/C', debit: '5000.00', credit: '0.00', narration: 'Monthly Depreciation' },
  { id: 4, date: '2026-04-15', voucherType: 'VOUCHER', voucherNo: 'V-2001', ledger: 'Electricity Expenses', debit: '1500.00', credit: '0.00', narration: 'March Bill' },
]

export default function DayBook() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [company, setCompany] = useState('VELSON')
  const [openingBalance, setOpeningBalance] = useState('50000.00')
  const [isDetailReport, setIsDetailReport] = useState(true)
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])

  useEffect(() => {
    // Combine data from various Account modules
    const r = JSON.parse(localStorage.getItem('velson_receipts') || '[]')
    const p = JSON.parse(localStorage.getItem('velson_payments') || '[]')
    const v = JSON.parse(localStorage.getItem('velson_vouchers') || '[]')
    const j = JSON.parse(localStorage.getItem('velson_journals') || '[]')
    
    const combined = [
      ...r.map(i => ({ id: i.id, date: i.date, voucherType: 'RECEIPT', voucherNo: i.receiptNo, ledger: i.partyName, debit: '0.00', credit: i.amount, narration: i.details })),
      ...p.map(i => ({ id: i.id, date: i.date, voucherType: 'PAYMENT', voucherNo: i.receiptNo || i.paymentNo, ledger: i.partyName, debit: i.amount, credit: '0.00', narration: i.details })),
      ...v.map(i => ({ id: i.id, date: i.voucherDate, voucherType: 'VOUCHER', voucherNo: i.voucherNo, ledger: 'Multiple Ledgers', debit: i.rows.reduce((a, b) => a + parseFloat(b.amt || 0), 0).toString(), credit: '0.00', narration: i.details })),
      ...j.map(i => ({ id: i.id, date: i.voucherDate, voucherType: 'JOURNAL', voucherNo: i.voucherNo, ledger: 'Multiple Ledgers', debit: i.rows.filter(r => r.type === 'DR').reduce((a, b) => a + parseFloat(b.payment || 0), 0).toString(), credit: i.rows.filter(r => r.type === 'CR').reduce((a, b) => a + parseFloat(b.receipt || 0), 0).toString(), narration: 'Journal Entry' }))
    ]

    if (combined.length === 0) {
      setData(SEED_DATA)
      setFilteredData(SEED_DATA)
    } else {
      setData(combined)
      setFilteredData(combined)
    }
  }, [])

  const handleSearch = () => {
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const result = data.filter(r => {
      const d = new Date(r.date)
      return d >= start && d <= end
    })
    setFilteredData(result)
  }

  const handleExport = (type) => toast.info(`Exporting ${filteredData.length} records as ${type}...`)

  const totalDebit = filteredData.reduce((acc, r) => acc + parseFloat(r.debit || 0), 0)
  const totalCredit = filteredData.reduce((acc, r) => acc + parseFloat(r.credit || 0), 0)
  const closingBalance = parseFloat(openingBalance) + totalCredit - totalDebit

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold">Day Book</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Day Book</h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-slate-500 hover:text-[#0097A7] text-[12px] font-bold transition-colors">
                <Printer size={16} /> PrintData
              </button>
              <button onClick={() => toast.info('Closing...')} className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 text-[12px] font-bold transition-colors">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Filter Section */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6 space-y-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                  <Label>From Date</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
                </div>
                <div className="flex items-center gap-3">
                  <Label>To Date</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
                </div>
                <button onClick={handleSearch} className="flex items-center gap-2 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded shadow-sm transition-all active:scale-95">
                  <Search size={16} /> Search
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  <Label>Opening Balance</Label>
                  <Input value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="w-32 text-right font-bold" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3 min-w-[250px]">
                    <Label>Company</Label>
                    <div className="flex-1">
                      <Select options={['VELSON', 'OTHER COMPANY']} value={company} onChange={e => setCompany(e.target.value)} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={isDetailReport} 
                      onChange={e => setIsDetailReport(e.target.checked)} 
                      className="w-4 h-4 accent-[#0097A7] rounded" 
                    />
                    <span className="text-[12px] font-semibold text-slate-600 group-hover:text-[#0097A7] transition-colors">Detail Daybook Reports</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => handleExport('Excel')} className="flex items-center gap-1.5 text-slate-400 hover:text-green-600 text-[11px] font-bold uppercase transition-colors">
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                  <button onClick={() => handleExport('PDF')} className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 text-[11px] font-bold uppercase transition-colors">
                    <FileJson size={16} /> PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#fcfdfe] text-[10.5px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">S.No</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-28">Date</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">Type</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">Vou No</th>
                    <th className="px-4 py-3 border-r border-slate-200">Particulars (Ledger)</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32">Debit (Out)</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32">Credit (In)</th>
                    <th className="px-4 py-3 text-slate-400 italic">Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  <tr className="bg-slate-50/50 font-bold">
                    <td colSpan={6} className="px-4 py-2 border-r border-slate-200 text-right uppercase text-slate-400 text-[10px]">Opening Balance</td>
                    <td className="px-4 py-2 border-r border-slate-200 text-right text-[#0097A7]">{parseFloat(openingBalance).toFixed(2)}</td>
                    <td className="px-4 py-2" />
                  </tr>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors h-10">
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.date}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase font-bold text-slate-600">{row.voucherType}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-bold text-[#0097A7]">{row.voucherNo}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-bold">{row.ledger}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-black text-rose-600">{parseFloat(row.debit || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-black text-green-600">{parseFloat(row.credit || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-slate-500 italic truncate max-w-[200px]">{row.narration}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 text-white font-bold">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right uppercase tracking-wider text-[10px] text-white/50">Totals & Closing</td>
                    <td className="px-4 py-3 text-right text-rose-400 text-[14px]">{totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-400 text-[14px]">{totalCredit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right bg-[#0097A7]">
                       <span className="text-white/50 text-[10px] mr-2 uppercase">Closing:</span>
                       <span className="text-[15px]">{closingBalance.toFixed(2)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
