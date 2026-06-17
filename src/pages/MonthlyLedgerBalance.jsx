import { useState, useEffect } from 'react'
import { ChevronRight, Search, Printer, X, Calendar, Download, FileSpreadsheet, FileJson, RotateCcw } from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
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

const SAMPLE_MONTHLY = [
  { sno: 1, month: 'April 2026', credit: '150000.00', debit: '120000.00', balance: '30000.00 CR' },
  { sno: 2, month: 'May 2026', credit: '180000.00', debit: '145000.00', balance: '65000.00 CR' },
  { sno: 3, month: 'June 2026', credit: '165000.00', debit: '170000.00', balance: '60000.00 CR' },
  { sno: 4, month: 'July 2026', credit: '210000.00', debit: '190000.00', balance: '80000.00 CR' },
]

export default function MonthlyLedgerBalance() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2027-03-30')
  const [acName, setAcName] = useState('Sales A/C')
  const [reportData, setReportData] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = () => {
    if (!acName) { toast.warning('Enter A/C Name first'); return }
    setSearching(true)
    setTimeout(() => {
      setReportData(SAMPLE_MONTHLY)
      setSearching(false)
    }, 600)
  }

  const handleExport = (t) => toast.info(`Exporting monthly report as ${t}...`)

  const totalCredit = reportData.reduce((acc, r) => acc + parseFloat(r.credit), 0)
  const totalDebit = reportData.reduce((acc, r) => acc + parseFloat(r.debit), 0)

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-tight">Monthly Ledger Balance</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Monthly Ledger Balance</h2>
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

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Section */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6 space-y-4">
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-3">
                   <Label>From Date</Label>
                   <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
                 </div>
                 <div className="flex items-center gap-3">
                   <Label>To Date</Label>
                   <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
                 </div>
                 <button 
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded shadow-sm transition-all active:scale-95"
                 >
                   {searching ? <RotateCcw size={16} className="animate-spin" /> : <Search size={16} />}
                   Search
                 </button>
               </div>
               
               <div className="flex items-center gap-3">
                 <Label>A/C Name</Label>
                 <Input placeholder="Enter Account Name..." value={acName} onChange={e => setAcName(e.target.value)} className="flex-1 !font-bold text-[#0097A7]" />
               </div>
            </div>

            {reportData.length === 0 ? (
               <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30 flex items-center justify-center min-h-[400px]">
                  <div className="text-center space-y-2">
                    <Calendar size={48} className="text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-semibold">Monthly Breakdown Area</p>
                    <p className="text-slate-300 text-[12px]">Enter account name and search to generate the monthly report</p>
                  </div>
               </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-end gap-3 mb-4">
                  {[{ icon: <Download size={14} />, l: 'Excel' }, { icon: <FileJson size={14} />, l: 'Pdf' }].map(tool => (
                    <button key={tool.l} onClick={() => handleExport(tool.l)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#0097A7] text-[11px] font-bold rounded-lg transition-all uppercase">{tool.icon} {tool.l}</button>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#fcfdfe] text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-200 w-16 text-center">SNO</th>
                        <th className="px-6 py-4 border-r border-slate-200">Month Name</th>
                        <th className="px-6 py-4 border-r border-slate-200 text-right">Credit Amount (In)</th>
                        <th className="px-6 py-4 border-r border-slate-200 text-right">Debit Amount (Out)</th>
                        <th className="px-6 py-4 text-right bg-slate-50">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {reportData.map((row) => (
                        <tr key={row.sno} className="hover:bg-slate-50 transition-colors h-12">
                          <td className="px-6 py-2 border-r border-slate-200 text-center text-slate-400">{row.sno}</td>
                          <td className="px-6 py-2 border-r border-slate-200 font-black text-slate-700">{row.month}</td>
                          <td className="px-6 py-2 border-r border-slate-200 text-right font-bold text-green-600">{row.credit}</td>
                          <td className="px-6 py-2 border-r border-slate-200 text-right font-bold text-rose-600">{row.debit}</td>
                          <td className="px-6 py-2 text-right font-black text-slate-800 bg-slate-50/50">{row.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800 text-white font-bold">
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-wider text-[10px] text-white/50">Cumulative Year Totals</td>
                        <td className="px-6 py-4 text-right text-green-400 text-[15px]">{totalCredit.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-rose-400 text-[15px]">{totalDebit.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right bg-[#0097A7] text-[16px]">
                          <span className="text-white/50 text-[10px] mr-3 uppercase">Net YTD:</span>
                          {(totalCredit - totalDebit).toFixed(2)} CR
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
