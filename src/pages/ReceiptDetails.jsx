import { useState, useEffect } from 'react'
import { 
  ChevronRight, Search, RotateCcw, Edit2, Trash2, Printer, 
  X, Download, FileSpreadsheet, FileJson, Filter, Settings 
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

// ── Shared UI primitives (Consistent with Item Master & Receipt Entry) ──
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

export default function ReceiptDetails() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_receipts') || '[]')
    setData(saved)
    setFilteredData(saved)
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

  const handleDelete = () => {
    const next = data.filter(r => r.id !== confirmDelete.id)
    setData(next)
    setFilteredData(next)
    localStorage.setItem('velson_receipts', JSON.stringify(next))
    setConfirmDelete({ open: false, id: null })
    setSelectedId(null)
  }

  const handleExport = (type) => {
    toast.info(`Exporting ${filteredData.length} records as ${type}...`)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <ConfirmDialog 
        open={confirmDelete.open} 
        onConfirm={handleDelete} 
        onCancel={() => setConfirmDelete({ open: false, id: null })} 
      />

      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold">Receipt Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Receipt Details</h2>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: 'Edit',      icon: <Edit2 size={14} />,   bg: 'bg-green-500', action: () => selectedId ? toast.info(`Editing ID: ${selectedId}`) : toast.warning('Select a row first') },
                { label: 'Delete',    icon: <Trash2 size={14} />,  bg: 'bg-rose-500',  action: () => selectedId ? setConfirmDelete({ open: true, id: selectedId }) : toast.warning('Select a row first') },
                { label: 'PrintData', icon: <Printer size={14} />, bg: 'bg-slate-700', action: () => toast.info('Printing data...') },
                { label: 'Close',     icon: <X size={14} />,       bg: 'bg-slate-400',  action: () => toast.info('Closing page...') },
              ].map(btn => (
                <button 
                  key={btn.label} 
                  onClick={btn.action}
                  className={`flex items-center gap-1.5 px-3 py-1.5 ${btn.bg} hover:opacity-90 text-white text-[12px] font-semibold rounded-lg transition-all shadow-sm active:scale-95`}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-6 mb-6 pb-4 border-b border-slate-100">
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
                className="flex items-center gap-2 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-all shadow-md active:scale-95"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Search
              </button>
              
              <div className="ml-auto flex items-center gap-4">
                 <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-slate-500 hover:text-[#0097A7] text-[12px] font-semibold transition-colors">
                   <RotateCcw size={16} /> Refresh
                 </button>
                 <button onClick={() => handleExport('Excel')} className="flex items-center gap-1.5 text-slate-500 hover:text-green-600 text-[12px] font-semibold transition-colors">
                   <FileSpreadsheet size={16} /> Excel
                 </button>
              </div>
            </div>

            {/* Table Toolbar */}
            <div className="flex items-center justify-end gap-4 mb-3">
               <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                 <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">LS</span>
                 <input className="w-8 bg-transparent text-center text-sm font-bold border-b border-slate-300 focus:outline-none" value={filteredData.length} readOnly />
               </div>
               <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                 {[
                   { icon: <Download size={14} />, label: 'Dos' },
                   { icon: <FileSpreadsheet size={14} />, label: 'Excel' },
                   { icon: <FileJson size={14} />, label: 'Pdf' },
                   { icon: <Filter size={14} />, label: 'Filter' },
                   { icon: <Settings size={14} />, label: 'Setting' },
                 ].map(tool => (
                   <button 
                    key={tool.label} 
                    onClick={() => handleExport(tool.label)}
                    className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-[#0097A7] transition-colors group"
                   >
                     {tool.icon}
                     <span className="text-[11px] font-bold uppercase group-hover:text-slate-600">{tool.label}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* Main Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">S.No</th>
                    {[
                      'Rec NO','DATE','TYPE','LEDGER NAME','AMOUNT','PAY MODE','BANK','CREATED_BY'
                    ].map(h => (
                      <th key={h} className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-20 text-center text-slate-300 italic text-sm">
                        No receipt records found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        onClick={() => setSelectedId(row.id)}
                        className={`cursor-pointer transition-colors ${selectedId === row.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 border-r border-slate-200 font-semibold text-slate-800">{row.receiptNo}</td>
                        <td className="px-4 py-3 border-r border-slate-200">{row.date}</td>
                        <td className="px-4 py-3 border-r border-slate-200 uppercase text-[11px] font-bold">{row.receiptType}</td>
                        <td className="px-4 py-3 border-r border-slate-200 font-bold text-[#0097A7]">{row.partyName}</td>
                        <td className="px-4 py-3 border-r border-slate-200 text-right font-black text-rose-600">{parseFloat(row.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 border-r border-slate-200 uppercase text-[11px] font-bold text-slate-500">{row.cashBank}</td>
                        <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-600">{row.bankName || '-'}</td>
                        <td className="px-4 py-3 border-r border-slate-200 text-slate-500">Admin</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-4 flex items-center bg-slate-50 border border-slate-200 rounded-lg p-2 text-[12px] font-bold text-slate-600">
               <div className="px-4 border-r border-slate-200 whitespace-nowrap">
                 Row : <span className="text-[#0097A7] ml-1">{filteredData.length}</span>
               </div>
               <div className="flex-1 text-center">
                 {/* Empty spaces as in image */}
               </div>
               <div className="px-8 border-l border-slate-200 whitespace-nowrap">
                 <span className="text-slate-400 mr-2 uppercase text-[10px]">Total Amount</span>
                 <span className="text-[14px] text-[#0097A7]">
                   {filteredData.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)}
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
