import { useState } from 'react'
import { ChevronRight, Search, CheckCircle2, X, FileText } from 'lucide-react'
import { useToast } from '../components/Toast'

const TextInput = ({ value, onChange }) => (
  <input type="text" value={value} onChange={onChange}
    className="w-full px-2 py-[3px] text-[12px] border-none outline-none bg-transparent text-slate-700" />
)

const DateInput = ({ value, onChange }) => (
  <input type="date" value={value} onChange={onChange}
    className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36" />
)

const FL = ({ children }) => (
  <td className="bg-[#dce3ea] border border-slate-300 px-2 py-[5px] text-[11px] font-bold text-slate-700 whitespace-nowrap w-28">{children}</td>
)
const FC = ({ children, colSpan = 1 }) => (
  <td colSpan={colSpan} className="border border-slate-300 px-1 py-[2px] bg-white">{children}</td>
)

const SEED = [
  { sno:1, jobNo:41399, vehicleType:'V10',  partNo:'VC-100015',   partName:'10" SINGLE ROPE PULLEY 54',             planDate:'14-04-2026', targetDate:'18-04-2026', qty:5,  status:'Cancelled' },
  { sno:2, jobNo:41387, vehicleType:'V10',  partNo:'VGH-1002100', partName:'V10 7.7 MTR MASTER ARM PLATE TILTING',  planDate:'13-04-2026', targetDate:'17-04-2026', qty:2,  status:'Cancelled' },
  { sno:3, jobNo:41372, vehicleType:'V3i',  partNo:'VC-103207',   partName:'FOOT CLAMP 180 TILTING JACKEY PIN',     planDate:'12-04-2026', targetDate:'16-04-2026', qty:4,  status:'Cancelled' },
  { sno:4, jobNo:41358, vehicleType:'V2I',  partNo:'VM-200253',   partName:'V2-I 10.5 INCH CHASSIS BED SUPPORT',   planDate:'11-04-2026', targetDate:'15-04-2026', qty:8,  status:'Cancelled' },
  { sno:5, jobNo:41341, vehicleType:'GRC',  partNo:'VRC-601987',  partName:'GRC CYCLONE SAMPLE INLET PIPE PLATE RH',planDate:'10-04-2026', targetDate:'14-04-2026', qty:1,  status:'Cancelled' },
  { sno:6, jobNo:41325, vehicleType:'V3i',  partNo:'VCS-300471',  partName:'V3 TRACK OPERATED JOYSTIC MOUNT PLATE', planDate:'09-04-2026', targetDate:'13-04-2026', qty:3,  status:'Cancelled' },
  { sno:7, jobNo:41312, vehicleType:'V10',  partNo:'VE-70895',    partName:'CABIN ELECTRICAL BOX PLATE 9',          planDate:'08-04-2026', targetDate:'12-04-2026', qty:10, status:'Cancelled' },
]

export default function JobCardCancel() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]

  const [jobNumber,   setJobNumber]   = useState('')
  const [planDate,    setPlanDate]    = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [targetDate,  setTargetDate]  = useState('')
  const [partNo,      setPartNo]      = useState('')
  const [qtyV,        setQtyV]        = useState('')
  const [partName,    setPartName]    = useState('')
  const [fromDate,    setFromDate]    = useState(today)
  const [toDate,      setToDate]      = useState(today)

  const [rows] = useState(SEED)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [selectAll,    setSelectAll]    = useState(false)

  const handleSelectAll = checked => {
    setSelectAll(checked)
    setSelectedRows(checked ? new Set(rows.map((_, i) => i)) : new Set())
  }
  const handleRowSelect = (i, checked) => {
    const next = new Set(selectedRows)
    checked ? next.add(i) : next.delete(i)
    setSelectedRows(next)
    setSelectAll(next.size === rows.length)
  }

  const handleClear = () => {
    setJobNumber(''); setPlanDate(''); setVehicleType('')
    setTargetDate(''); setPartNo(''); setQtyV(''); setPartName('')
    setFromDate(today); setToDate(today)
  }

  const handleCancelJob = () => {
    const sel = [...selectedRows]
    if (!sel.length) { toast.warning('Select at least one row to cancel.'); return }
    toast.warning(`Cancel Job for ${sel.length} row(s).`)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Job Card Cancel</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">JOB LIST</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toast.success('Approved successfully.')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1A76D1] hover:bg-[#1560b0] text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                <CheckCircle2 size={13} /> Approve
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600 text-[11px] font-bold rounded border border-slate-200 hover:border-red-300 transition-all">
                <X size={13} /> Close
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Filter Form grid */}
            <div className="border border-slate-300">
              {/* Row 1 */}
              <div className="grid grid-cols-2 border-b border-slate-300">
                <div className="flex items-center border-r border-slate-300">
                  <FL>JOB Number :</FL>
                  <FC><TextInput value={jobNumber} onChange={e => setJobNumber(e.target.value)} /></FC>
                </div>
                <div className="flex items-center">
                  <FL>Plan Date :</FL>
                  <FC><TextInput value={planDate} onChange={e => setPlanDate(e.target.value)} /></FC>
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 border-b border-slate-300">
                <div className="flex items-center border-r border-slate-300">
                  <FL>Vehicle Type :</FL>
                  <FC><TextInput value={vehicleType} onChange={e => setVehicleType(e.target.value)} /></FC>
                </div>
                <div className="flex items-center">
                  <FL>Target Date :</FL>
                  <FC><TextInput value={targetDate} onChange={e => setTargetDate(e.target.value)} /></FC>
                </div>
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 border-b border-slate-300">
                <div className="flex items-center border-r border-slate-300">
                  <FL>Part No :</FL>
                  <FC><TextInput value={partNo} onChange={e => setPartNo(e.target.value)} /></FC>
                </div>
                <div className="flex items-center">
                  <FL>Qty/V :</FL>
                  <FC><TextInput value={qtyV} onChange={e => setQtyV(e.target.value)} /></FC>
                </div>
              </div>
              {/* Row 4 */}
              <div className="flex items-center">
                <FL>Part Name :</FL>
                <FC colSpan={3}><TextInput value={partName} onChange={e => setPartName(e.target.value)} /></FC>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">From Date :</span>
              <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">To Date :</span>
              <DateInput value={toDate} onChange={e => setToDate(e.target.value)} />
              <button onClick={() => toast.info(`${rows.length} records loaded.`)}
                className="flex items-center gap-1.5 px-3 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                <Search size={12} /> Search
              </button>
              <button onClick={() => toast.info('Details view...')}
                className="flex items-center gap-1.5 px-3 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                <FileText size={12} /> Details
              </button>
              <button onClick={handleClear}
                className="px-3 py-[5px] bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                Clear
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleCancelJob}
                  className="flex items-center gap-1 px-3 py-[5px] text-red-600 hover:text-red-700 text-[11px] font-bold rounded border border-red-300 hover:border-red-400 transition-all active:scale-95">
                  <X size={12} /> Cancel Job
                </button>
                <button onClick={() => toast.warning('Cancel Route Card...')}
                  className="flex items-center gap-1 px-3 py-[5px] text-red-600 hover:text-red-700 text-[11px] font-bold rounded border border-red-300 hover:border-red-400 transition-all active:scale-95">
                  <X size={12} /> Cancel Route Card
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[960px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-8 text-center">
                        <input type="checkbox" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)}
                          className="w-3 h-3 cursor-pointer accent-white" />
                      </th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-10 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16">Job No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-20">Vehicle Type</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Plan Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Target Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-14 text-center">Qty/V</th>
                      <th className="px-3 py-2.5 w-20 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((r, i) => {
                      const isSel = selectedRows.has(i)
                      return (
                        <tr key={i} onClick={() => handleRowSelect(i, !selectedRows.has(i))}
                          className={`h-9 cursor-pointer text-[12px] transition-colors ${isSel ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}>
                          <td className="px-2 py-1 border-r border-slate-100 text-center" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSel} onChange={e => handleRowSelect(i, e.target.checked)}
                              className="w-3 h-3 cursor-pointer accent-[#0097A7]" />
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-400'}`}>{r.sno}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-bold ${isSel ? '' : 'text-slate-700'}`}>{r.jobNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-semibold ${isSel ? '' : 'text-[#0097A7]'}`}>{r.vehicleType}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-slate-700'}`}>{r.partNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[220px] ${isSel ? '' : 'text-slate-700'}`}>{r.partName}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.planDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.targetDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-600'}`}>{r.qty}</td>
                          <td className="px-3 py-1 text-center">
                            {isSel ? r.status : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{r.status}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                Row : {rows.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
