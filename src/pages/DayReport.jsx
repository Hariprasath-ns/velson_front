import { useState, useEffect } from 'react'
import { 
  ChevronRight, Search, Download, FileSpreadsheet, FileJson, 
  Filter, Settings, X, RotateCcw
} from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {children}
  </label>
)

const Input = ({ value, onChange, type = 'text', className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
  />
)

const SEED_DAY_REPORT = [
  { ord1: '1', sno: '1', date: '2026-04-01', credit: '15000.00', debit: '2000.00', cashBal: '13000.00', adjCredit: '0.00', adjDebit: '0.00', adjBal: '13000.00' },
  { ord1: '1', sno: '2', date: '2026-04-02', credit: '8000.00', debit: '5000.00', cashBal: '16000.00', adjCredit: '1200.00', adjDebit: '0.00', adjBal: '17200.00' },
  { ord1: '1', sno: '3', date: '2026-04-03', credit: '22000.00', debit: '12000.00', cashBal: '26000.00', adjCredit: '0.00', adjDebit: '500.00', adjBal: '25500.00' },
  { ord1: '1', sno: '4', date: '2026-04-04', credit: '10000.00', debit: '4000.00', cashBal: '32000.00', adjCredit: '0.00', adjDebit: '0.00', adjBal: '32000.00' },
  { ord1: '1', sno: '5', date: '2026-04-06', credit: '45000.00', debit: '30000.00', cashBal: '47000.00', adjCredit: '5000.00', adjDebit: '0.00', adjBal: '52000.00' },
]

export default function DayReport() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportData, setReportData] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setReportData(SEED_DAY_REPORT)
  }, [])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      setReportData(SEED_DAY_REPORT)
      setSearching(false)
    }, 600)
  }

  const handleExport = (t) => toast.info(`Exporting day report as ${t}...`)

  const totalCredit = reportData.reduce((acc, r) => acc + parseFloat(r.credit), 0)
  const totalDebit = reportData.reduce((acc, r) => acc + parseFloat(r.debit), 0)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-tight">Day Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Day Report Summary</h2>
            </div>
            <button onClick={() => toast.info('Closing...')} className="text-slate-400 hover:text-red-600 transition-colors">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Label>From Date</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Label>To Date</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <button 
                onClick={handleSearch}
                className="flex items-center gap-2 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded shadow-sm transition-all active:scale-95"
              >
                {searching ? <RotateCcw size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
              
              {/* Toolbar */}
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                   <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">LS</span>
                   <input className="w-8 bg-transparent text-center text-sm font-bold border-b border-slate-300 focus:outline-none" value={reportData.length} readOnly />
                </div>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                   {[
                     { icon: <Download size={14} />, label: 'Dos' },
                     { icon: <FileSpreadsheet size={14} />, label: 'Excel' },
                     { icon: <FileJson size={14} />, label: 'Pdf' },
                   ].map(tool => (
                     <button key={tool.label} onClick={() => handleExport(tool.label)} className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-[#0097A7] transition-colors group">
                       {tool.icon}
                       <span className="text-[11px] font-bold uppercase group-hover:text-slate-600">{tool.label}</span>
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Main Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-[#fcfdfe] text-[10.5px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">Ord</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">SNo</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">Date</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32 bg-green-50/30">Credit Amt</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32 bg-rose-50/30">Debit Amt</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32 font-black text-slate-800">Cash Bal</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32 text-slate-400">Adj. Credit</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right w-32 text-slate-400">Adj. Debit</th>
                    <th className="px-4 py-3 text-right bg-slate-50 font-black text-[#0097A7]">Adj Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors h-11">
                      <td className="px-4 py-2 border-r border-slate-200 text-center font-bold text-slate-400">{row.ord1}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-400">{row.sno}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-medium">{row.date}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-green-600 bg-green-50/10">{row.credit}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-rose-600 bg-rose-50/10">{row.debit}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-black text-slate-700">{row.cashBal}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-500 font-semibold">{row.adjCredit}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-500 font-semibold">{row.adjDebit}</td>
                      <td className="px-4 py-2 text-right font-black text-[#0097A7] bg-slate-50/50">{row.adjBal}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 text-white font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-[10px] text-white/50">Totals Period Cumulative</td>
                    <td className="px-4 py-3 text-right text-green-400 text-[15px]">{totalCredit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-rose-400 text-[15px]">{totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-white text-[16px]">{(totalCredit - totalDebit).toFixed(2)}</td>
                    <td colSpan={2} className="px-4 py-2 border-r border-white/10" />
                    <td className="px-4 py-3 text-right bg-[#0097A7] text-[16px]">
                       <span className="text-white/50 text-[10px] mr-3 uppercase">Net Balance:</span>
                       {(totalCredit - totalDebit).toFixed(2)}
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
