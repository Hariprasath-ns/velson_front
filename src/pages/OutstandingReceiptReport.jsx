import { useState, useEffect } from 'react'
import { 
  ChevronRight, Search, Printer, X, Download, FileSpreadsheet, 
  FileJson, Filter, Settings, RotateCcw
} from 'lucide-react'
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

const SEED_OUTSTANDING = [
  { ledger: 'JSA HI TECH ROOF INDIA PVT LTD', billType: 'GRN ENTRY', billNo: 'GRN/101', billDate: '2026-01-15', billAmt: '3540.00', adj: '0.00', balance: '3540.00', paidAmt: '0', days: '91' },
  { ledger: 'ABC Enterprises', billType: 'SALES INV', billNo: 'INV/24/01', billDate: '2026-02-10', billAmt: '50000.00', adj: '5000.00', balance: '45000.00', paidAmt: '0', days: '65' },
  { ledger: 'X-Caliber Forge', billType: 'PURCHASE INV', billNo: 'PINV/88', billDate: '2026-03-01', billAmt: '12000.00', adj: '0.00', balance: '12000.00', paidAmt: '0', days: '45' },
  { ledger: 'Tata Steel Ltd', billType: 'GRN ENTRY', billNo: 'GRN/205', billDate: '2026-03-20', billAmt: '85000.00', adj: '0.00', balance: '85000.00', paidAmt: '20000.00', days: '26' },
]

export default function OutstandingReceiptReport() {
  const toast = useToast()
  const [asOnDate, setAsOnDate] = useState('')
  const [group, setGroup] = useState('Sundry Debtors')
  const [reportData, setReportData] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setReportData(SEED_OUTSTANDING)
  }, [])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      setReportData(SEED_OUTSTANDING)
      setSearching(false)
    }, 600)
  }

  const handleExport = (t) => toast.info(`Exporting outstanding report as ${t}...`)

  const totalBillAmt = reportData.reduce((acc, r) => acc + parseFloat(r.billAmt), 0)
  const totalBalance = reportData.reduce((acc, r) => acc + parseFloat(r.balance), 0)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-tight">Outstanding Receipt Reports</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm shadow-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Outstanding Receipt Reports</h2>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mr-2 shadow-sm">
                  {[
                    'Print Bill Wise Age Report',
                    'Print Ledger Wise Age Report',
                    'Print Data BillWise'
                  ].map(lbl => (
                    <button 
                      key={lbl} 
                      onClick={() => window.print()} 
                      title={lbl}
                      className="p-1.5 text-slate-400 hover:text-[#0097A7] hover:bg-[#0097A7]/5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap px-3"
                    >
                      <Printer size={15} /> 
                      <span className="text-[10px] font-black uppercase hidden xl:inline">{lbl}</span>
                    </button>
                  ))}
               </div>
              <button onClick={() => toast.info('Closing...')} className="flex items-center gap-1.5 text-slate-400 hover:text-red-600 px-3 py-1.5 text-[11px] font-bold transition-all border-l border-slate-200 ml-1">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            {/* Filter Section */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 mb-6 shadow-inner">
              <div className="grid grid-cols-12 gap-5">
                 {/* Left Column: Dates & IDs */}
                 <div className="col-span-12 lg:col-span-3 space-y-4">
                    <div>
                      <Label>As on Date</Label>
                      <Input type="date" value={asOnDate} onChange={e => setAsOnDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Ledger Id</Label>
                      <Input placeholder="Enter Ledger ID" />
                    </div>
                 </div>

                 {/* Middle Column: Group & Area */}
                 <div className="col-span-12 lg:col-span-3 space-y-4">
                    <div>
                      <Label>Group Name</Label>
                      <Select options={['Sundry Debtors', 'Sundry Creditors']} value={group} onChange={e => setGroup(e.target.value)} placeholder="---Select Group---" />
                    </div>
                    <div>
                      <Label>Area</Label>
                      <Select options={['Local', 'Outstation']} placeholder="---Select---" />
                    </div>
                 </div>

                 {/* Right Column: State & Days */}
                 <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div>
                      <Label>State</Label>
                      <Select options={['Tamil Nadu', 'Karnataka', 'Maharashtra']} placeholder="---Select---" />
                    </div>
                    <div>
                      <Label>From / To Days</Label>
                      <div className="flex items-center gap-2">
                        <Input value="0" className="text-center font-bold text-[#0097A7]" />
                        <span className="text-slate-300 font-bold">/</span>
                        <Input value="365" className="text-center font-bold text-[#0097A7]" />
                      </div>
                    </div>
                 </div>

                 {/* Action Column: Search & Tools */}
                 <div className="col-span-12 lg:col-span-2 flex flex-col justify-end gap-3">
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records:</span>
                       <span className="text-[13px] font-black text-[#0097A7]">{reportData.length}</span>
                    </div>
                    <button 
                      onClick={handleSearch}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                      {searching ? <RotateCcw size={16} className="animate-spin" /> : <Search size={18} />}
                      SEARCH
                    </button>
                    <div className="flex items-center justify-around border-t border-slate-200 pt-3">
                       {[
                         { icon: <Download size={14} />, label: 'Dos' },
                         { icon: <FileSpreadsheet size={14} />, label: 'Excel' },
                         { icon: <FileJson size={14} />, label: 'Pdf' },
                       ].map(tool => (
                         <button key={tool.label} onClick={() => handleExport(tool.label)} className="p-1.5 text-slate-400 hover:text-[#0097A7] transition-all" title={tool.label}>
                           {tool.icon}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            {/* Main Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md flex-1 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="bg-slate-50/80 backdrop-blur-sm text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-4 border-r border-slate-200/60 w-12 text-center">S.No</th>
                      <th className="px-5 py-4 border-r border-slate-200/60">Particulars (Ledger)</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 w-28">Bill Type</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 w-28">Bill No</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 w-28">Bill Date</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 text-right w-36">Bill Amt</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 text-right w-28">Adj</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 text-right w-36 bg-slate-50/50 font-black">Balance</th>
                      <th className="px-5 py-4 border-r border-slate-200/60 text-right w-28 font-bold">Paid</th>
                      <th className="px-5 py-4 text-right w-24 text-slate-400">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors h-12 group">
                        <td className="px-5 py-2 border-r border-slate-200/60 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 font-black text-slate-700 group-hover:text-[#0097A7] transition-colors">{row.ledger}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 uppercase">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded border border-slate-200">{row.billType}</span>
                        </td>
                        <td className="px-5 py-2 border-r border-slate-200/60 font-bold text-[#0097A7] tracking-tight">{row.billNo}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 font-medium text-slate-600">{row.billDate}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 text-right font-bold text-slate-600">₹{row.billAmt}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 text-right text-slate-400">{row.adj}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 text-right font-black text-rose-500 bg-slate-50/30">₹{row.balance}</td>
                        <td className="px-5 py-2 border-r border-slate-200/60 text-right text-emerald-600 font-black">₹{row.paidAmt}</td>
                        <td className="px-5 py-2 text-right font-black text-orange-500">{row.days}</td>
                      </tr>
                    ))}
                  </tbody>
                  <thead className="bg-slate-800 text-white font-bold shadow-lg relative z-10">
                    <tr>
                      <td colSpan={5} className="px-5 py-4 text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Report Totals Summary</span>
                      </td>
                      <td className="px-5 py-4 text-right border-l border-slate-700/50">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Bill Amt</div>
                        <div className="text-[15px] font-black text-white">₹{totalBillAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-5 py-4 border-l border-slate-700/50" />
                      <td className="px-5 py-4 text-right bg-rose-900/20 border-l border-rose-900/30">
                        <div className="text-[10px] text-rose-400 uppercase font-bold mb-1 font-black">Net Balance</div>
                        <div className="text-[18px] font-black text-rose-400">₹{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td colSpan={2} className="px-5 py-4 bg-[#0097A7] border-l border-[#0097A7]/50" />
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
