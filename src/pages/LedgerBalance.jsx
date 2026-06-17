import { useState, useEffect } from 'react'
import { ChevronRight, Search, Printer, X, FileBarChart, Download, FileSpreadsheet, FileJson, Filter, Settings, RotateCcw } from 'lucide-react'
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

const Select = ({ options, placeholder, value, onChange }) => (
  <div className="relative group">
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

const LEDGERS = [
  { name: 'JSA HI TECH ROOF INDIA PVT LTD', group: 'SUNDRY CREDITORS', id: '593', bal: '666544.24' },
  { name: 'ABC Enterprises', group: 'SUNDRY DEBTORS', id: '1001', bal: '38000.00' },
  { name: 'X-Caliber Forge', group: 'SUNDRY CREDITORS', id: '5001', bal: '87000.00' },
  { name: 'Electricity Expenses', group: 'INDIRECT EXPENSES', id: '2001', bal: '1500.00' },
  { name: 'Depreciation A/C', group: 'INDIRECT EXPENSES', id: '3001', bal: '5000.00' },
]

const SAMPLE_TRANS = [
  { id: 1, date: '2026-04-01', vouType: 'VOUCHER', vouNo: 'V-101', particulars: 'Opening Balance', debit: '0.00', credit: '10000.00', balance: '10000.00 CR' },
  { id: 2, date: '2026-04-05', vouType: 'RECEIPT', vouNo: 'R-501', particulars: 'Cash Receipt', debit: '0.00', credit: '5000.00', balance: '15000.00 CR' },
  { id: 3, date: '2026-04-10', vouType: 'PAYMENT', vouNo: 'P-202', particulars: 'Vendor Payment', debit: '8000.00', credit: '0.00', balance: '7000.00 CR' },
  { id: 4, date: '2026-04-15', vouType: 'JOURNAL', vouNo: 'J-808', particulars: 'Adjustment Entry', debit: '2000.00', credit: '0.00', balance: '5000.00 CR' },
]

export default function LedgerBalance() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState('2026-04-01')
  const [toDate, setToDate] = useState('2026-04-15')
  const [ledgerAc, setLedgerAc] = useState('')
  const [type, setType] = useState('ALL')
  const [isDateWise, setIsDateWise] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [reportData, setReportData] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = () => {
    if (!ledgerAc) { toast.warning('Select a ledger first'); return }
    setSearching(true)
    setTimeout(() => {
      setReportData(SAMPLE_TRANS)
      setSearching(false)
    }, 600)
  }

  const handleExport = (t) => toast.info(`Exporting report as ${t}...`)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Ledger Balance</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[800px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Ledger Balance</h2>
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

          <div className="p-6 flex-1 flex flex-col">
            {/* Filter Section */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 mb-6 shadow-inner">
              <div className="grid grid-cols-12 gap-5">
                {/* Dates Section */}
                <div className="col-span-12 lg:col-span-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Date</Label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
                </div>

                {/* Ledger Selection */}
                <div className="col-span-12 lg:col-span-5 relative">
                  <Label>Ledger A/c</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Type to search Ledger Account..." 
                      value={ledgerAc} 
                      onChange={e => { setLedgerAc(e.target.value); setShowDropdown(true); }} 
                      onFocus={() => setShowDropdown(true)}
                      className="!font-bold text-[#0097A7] pr-10" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                      <Search size={16} />
                    </div>
                  </div>
                  
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-[300px] overflow-hidden mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2">Ledger Name</th>
                              <th className="px-4 py-2">Group</th>
                              <th className="px-4 py-2 text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {LEDGERS.filter(l => l.name.toLowerCase().includes(ledgerAc.toLowerCase())).map((l, idx) => (
                              <tr 
                                key={idx} 
                                className="hover:bg-[#0097A7]/5 cursor-pointer transition-colors group"
                                onClick={() => { setLedgerAc(l.name); setShowDropdown(false); }}
                              >
                                <td className="px-4 py-3">
                                  <div className="text-[13px] font-bold text-slate-700 group-hover:text-[#0097A7]">{l.name}</div>
                                  <div className="text-[10px] text-slate-400">ID: {l.id}</div>
                                </td>
                                <td className="px-4 py-3 text-[11px] font-medium text-slate-500">{l.group}</td>
                                <td className="px-4 py-3 text-[13px] font-black text-slate-700 text-right">₹{l.bal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}
                </div>

                {/* Type Selection */}
                <div className="col-span-12 lg:col-span-2">
                  <Label>Type</Label>
                  <Select options={['ALL', 'CASH', 'ADJUSTMENT']} value={type} onChange={e => setType(e.target.value)} />
                </div>

                {/* Search Button & Date Wise */}
                <div className="col-span-12 lg:col-span-2 flex flex-col justify-end gap-1.5">
                   <div className="flex items-center justify-center lg:justify-start mb-0.5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={isDateWise} 
                            onChange={e => setIsDateWise(e.target.checked)} 
                            className="w-4 h-4 accent-[#0097A7] rounded border-slate-300 cursor-pointer" 
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#0097A7] transition-colors uppercase tracking-tight">Date Wise</span>
                      </label>
                   </div>
                   <button 
                    onClick={handleSearch}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                   >
                     {searching ? <RotateCcw size={16} className="animate-spin" /> : <Search size={16} />}
                     Search
                   </button>
                </div>
              </div>
            </div>

            {reportData.length === 0 ? (
              <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30 flex items-center justify-center min-h-[400px]">
                 <div className="text-center space-y-2">
                   <FileBarChart size={48} className="text-slate-200 mx-auto" />
                   <p className="text-slate-400 font-semibold">Ledger Balance Report</p>
                   <p className="text-slate-300 text-[12px]">Please select a ledger account and click search</p>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 bg-[#0097A7]/10 px-4 py-2 rounded-lg border border-[#0097A7]/20">
                    <span className="text-[11px] font-bold text-[#0097A7] uppercase">Selected Ledger:</span>
                    <span className="text-[13px] font-black text-slate-700">{ledgerAc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     {[{ icon: <Download size={14} />, l: 'Dos' }, { icon: <FileSpreadsheet size={14} />, l: 'Excel' }, { icon: <FileJson size={14} />, l: 'Pdf' }].map(tool => (
                        <button key={tool.l} onClick={() => handleExport(tool.l)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#0097A7] text-[11px] font-bold rounded-lg transition-all uppercase">{tool.icon} {tool.l}</button>
                     ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md flex-1 bg-white">
                   <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50/80 backdrop-blur-sm text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                         <tr>
                           <th className="px-5 py-4 border-r border-slate-200/60 w-12 text-center">S.No</th>
                           <th className="px-5 py-4 border-r border-slate-200/60 w-32">Date</th>
                           <th className="px-5 py-4 border-r border-slate-200/60 w-32">Vou Type</th>
                           <th className="px-5 py-4 border-r border-slate-200/60 w-32">Vou No</th>
                           <th className="px-5 py-4 border-r border-slate-200/60">Particulars</th>
                           <th className="px-5 py-4 border-r border-slate-200/60 text-right w-36">Debit</th>
                           <th className="px-5 py-4 border-r border-slate-200/60 text-right w-36">Credit</th>
                           <th className="px-5 py-4 text-right w-44 bg-slate-50/50">Balance</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 text-[13px]">
                         {reportData.map((row, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/80 transition-colors h-12 group">
                             <td className="px-5 py-2 border-r border-slate-200/60 text-center text-slate-400 font-medium">{idx + 1}</td>
                             <td className="px-5 py-2 border-r border-slate-200/60 font-medium text-slate-600">{row.date}</td>
                             <td className="px-5 py-2 border-r border-slate-200/60 uppercase">
                               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded border border-slate-200">{row.vouType}</span>
                             </td>
                             <td className="px-5 py-2 border-r border-slate-200/60 font-bold text-[#0097A7] tracking-tight">{row.vouNo}</td>
                             <td className="px-5 py-2 border-r border-slate-200/60 font-semibold text-slate-700">{row.particulars}</td>
                             <td className="px-5 py-2 border-r border-slate-200/60 text-right font-bold text-rose-500">₹{row.debit}</td>
                             <td className="px-5 py-2 border-r border-slate-200/60 text-right font-bold text-emerald-500">₹{row.credit}</td>
                             <td className="px-5 py-2 text-right font-black text-slate-800 bg-slate-50/30">₹{row.balance}</td>
                           </tr>
                         ))}
                       </tbody>
                       <tfoot className="bg-slate-800 text-white shadow-lg relative z-10">
                         <tr>
                           <td colSpan={5} className="px-5 py-4 text-right">
                             <div className="flex flex-col items-end">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Total Period Summary</span>
                             </div>
                           </td>
                           <td className="px-5 py-4 text-right border-l border-slate-700/50">
                             <div className="text-[10px] text-rose-400 uppercase font-bold mb-1">Total Debit</div>
                             <div className="text-[15px] font-black text-rose-400">₹10,000.00</div>
                           </td>
                           <td className="px-5 py-4 text-right border-l border-slate-700/50">
                             <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Total Credit</div>
                             <div className="text-[15px] font-black text-emerald-400">₹15,000.00</div>
                           </td>
                           <td className="px-5 py-4 text-right bg-[#0097A7] border-l border-[#0097A7]/50 shadow-inner">
                             <div className="text-[10px] text-white/70 uppercase font-bold mb-1">Net Balance</div>
                             <div className="text-[16px] font-black text-white">5,000.00 CR</div>
                           </td>
                         </tr>
                       </tfoot>
                    </table>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
