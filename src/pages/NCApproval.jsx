import { useState } from 'react'
import { ChevronRight, Search, CheckCircle2, XCircle, X } from 'lucide-react'
import { useToast } from '../components/Toast'

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]}-${y}`
}

const toISO = (ddMonyyyy) => {
  if (!ddMonyyyy) return ''
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' }
  const [dd, mon, yyyy] = ddMonyyyy.split('-')
  return `${yyyy}-${months[mon]}-${dd}`
}

/* ── seed data matching legacy screenshot columns ─────────── */
const SEED = [
  {
    id: 1,
    ncDate: '15-04-2026 12:08:00',
    grnNo:  '26-27/GRN00115',
    partNo: 'VC-100042',
    partName: 'HOUSING-2',
    qcQty: 30.00,
    rejectionQty: 2.00,
    okQty: 55.00,
    uom: 'No',
    barcode: '202604073',
    createdBy: 'QUALITY',
    qcStatus: 'Rejected',
    qcRemarks: '2-NO\'S NOT ARIVED [SATHISH]',
    remarks: '',
  },
  {
    id: 2,
    ncDate: '14-04-2026 09:30:00',
    grnNo:  '26-27/GRN00114',
    partNo: 'VC-200018',
    partName: 'SHAFT ASSEMBLY',
    qcQty: 20.00,
    rejectionQty: 3.00,
    okQty: 17.00,
    uom: 'No',
    barcode: '202604062',
    createdBy: 'QUALITY',
    qcStatus: 'Rejected',
    qcRemarks: 'DIMENSION NOT OK',
    remarks: '',
  },
  {
    id: 3,
    ncDate: '13-04-2026 11:15:00',
    grnNo:  '26-27/GRN00110',
    partNo: 'VM-300054',
    partName: 'GEAR BOX COVER',
    qcQty: 10.00,
    rejectionQty: 1.00,
    okQty: 9.00,
    uom: 'No',
    barcode: '202604051',
    createdBy: 'QUALITY',
    qcStatus: 'Rejected',
    qcRemarks: 'SURFACE DEFECT',
    remarks: '',
  },
  {
    id: 4,
    ncDate: '12-04-2026 14:45:00',
    grnNo:  '26-27/GRN00108',
    partNo: 'VGH-100221',
    partName: 'MAST PIN ASSEMBLY',
    qcQty: 50.00,
    rejectionQty: 5.00,
    okQty: 45.00,
    uom: 'No',
    barcode: '202604044',
    createdBy: 'QUALITY',
    qcStatus: 'Rejected',
    qcRemarks: 'THREADING NOT OK',
    remarks: '',
  },
  {
    id: 5,
    ncDate: '11-04-2026 10:00:00',
    grnNo:  '26-27/GRN00105',
    partNo: 'VCS-400033',
    partName: 'BRACKET WELD ASSY',
    qcQty: 25.00,
    rejectionQty: 0.00,
    okQty: 25.00,
    uom: 'No',
    barcode: '202604035',
    createdBy: 'QUALITY',
    qcStatus: 'Accepted',
    qcRemarks: 'ALL OK',
    remarks: '',
  },
]

const STORAGE_KEY = 'velson_nc_approval_v2'

const today = () => new Date().toISOString().split('T')[0]

/* ── component ────────────────────────────────────────────── */
export default function NCApproval() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState(today())
  const [toDate,   setToDate]   = useState(today())
  const [rows, setRows] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return SEED.map(r => ({
      ...r,
      ncStatus: saved[r.id]?.ncStatus || 'Pending',
    }))
  })
  const [selected, setSelected] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)

  /* toggle row checkbox */
  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* toggle all */
  const toggleAll = () => {
    if (selectAll) { setSelected(new Set()); setSelectAll(false) }
    else           { setSelected(new Set(rows.map(r => r.id))); setSelectAll(true) }
  }

  /* apply status to selected (or all pending if none selected) */
  const applyStatus = (status) => {
    const targets = selected.size > 0
      ? rows.filter(r => selected.has(r.id) && r.ncStatus === 'Pending').map(r => r.id)
      : rows.filter(r => r.ncStatus === 'Pending').map(r => r.id)

    if (!targets.length) { toast.warning('No pending records to update.'); return }

    setRows(prev => prev.map(r => targets.includes(r.id) ? { ...r, ncStatus: status } : r))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    targets.forEach(id => { saved[id] = { ncStatus: status } })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    setSelected(new Set()); setSelectAll(false)
    status === 'Approved'
      ? toast.success(`${targets.length} NC record(s) approved.`)
      : toast.warning(`${targets.length} NC record(s) rejected.`)
  }

  const statusBadge = (s) => {
    if (s === 'Approved') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={10}/>Approved</span>
    if (s === 'Rejected') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><XCircle size={10}/>Rejected</span>
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>
  }

  const qcStatusColor = (s) => {
    if (!s) return 'text-slate-500'
    const l = s.toLowerCase()
    if (l === 'rejected') return 'text-red-600 font-bold'
    if (l === 'accepted') return 'text-emerald-700 font-bold'
    return 'text-slate-600'
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12}/> */}
          <span>Technical</span><ChevronRight size={12}/>
          <span className="text-[#0097A7]">NC Approval</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* ── Card header ── */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm"/>
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">NC Approval</h2>
            </div>
            {/* Approve / Reject / Close toolbar buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => applyStatus('Approved')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1A76D1] hover:bg-[#1560b0] text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm"
              >
                <CheckCircle2 size={13}/> Approve
              </button>
              <button
                onClick={() => applyStatus('Rejected')}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm"
              >
                <XCircle size={13}/> Reject
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600 text-[11px] font-bold rounded border border-slate-200 hover:border-red-300 transition-all active:scale-95">
                <X size={13}/> Close
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Filter bar ── */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* From Date */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">From Date :</span>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36"
                  />
                </div>
              </div>

              {/* To Date */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">To Date :</span>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36"
                  />
                </div>
              </div>

              {/* Search */}
              <button
                onClick={() => toast.info(`${rows.length} NC record(s) loaded.`)}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm"
              >
                <Search size={13}/> Search
              </button>
            </div>

            {/* ── Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 1300 }}>
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      {/* Select */}
                      <th className="px-2 py-2.5 border-r border-blue-400 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleAll}
                          className="w-3 h-3 cursor-pointer accent-white"
                        />
                      </th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-10">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 whitespace-nowrap w-44">NC_Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 whitespace-nowrap w-36">GRN_NO</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 whitespace-nowrap w-28">Part_No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-48">Part_Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 text-center whitespace-nowrap w-20">QC_Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 text-center whitespace-nowrap w-24">Rejection_Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 text-center whitespace-nowrap w-20">OK Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 text-center w-16">UOM</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 whitespace-nowrap w-28">Barcode</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 whitespace-nowrap w-24">Created_by</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 whitespace-nowrap w-24">QC Status</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-48">QC Remarks</th>
                      <th className="px-3 py-2.5 w-32">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((r, i) => {
                      const isSel = selected.has(r.id)
                      const rowBg = r.ncStatus === 'Approved'
                        ? 'bg-emerald-50/60'
                        : r.ncStatus === 'Rejected'
                          ? 'bg-red-50/60'
                          : isSel
                            ? 'bg-[#1565C0]/10'
                            : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/50'

                      return (
                        <tr
                          key={r.id}
                          onClick={() => toggleRow(r.id)}
                          className={`h-9 cursor-pointer text-[12px] transition-colors ${rowBg}`}
                        >
                          {/* Checkbox */}
                          <td className="px-2 py-1 border-r border-slate-100 text-center">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => toggleRow(r.id)}
                              onClick={e => e.stopPropagation()}
                              className="w-3 h-3 cursor-pointer accent-[#0097A7]"
                            />
                          </td>
                          {/* S.No */}
                          <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-400 font-bold">{i + 1}</td>
                          {/* NC_Date */}
                          <td className="px-3 py-1 border-r border-slate-100 text-slate-600 whitespace-nowrap text-[11px]">{r.ncDate}</td>
                          {/* GRN_NO */}
                          <td className="px-3 py-1 border-r border-slate-100 font-bold text-[#0097A7] text-[11px]">{r.grnNo}</td>
                          {/* Part_No */}
                          <td className="px-3 py-1 border-r border-slate-100 font-mono text-[11px] text-slate-700">{r.partNo}</td>
                          {/* Part_Name */}
                          <td className="px-3 py-1 border-r border-slate-100 text-slate-700 truncate max-w-[200px]">{r.partName}</td>
                          {/* QC_Qty */}
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-600">{r.qcQty.toFixed(2)}</td>
                          {/* Rejection_Qty */}
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-red-600">{r.rejectionQty.toFixed(2)}</td>
                          {/* OK Qty */}
                          <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-emerald-700">{r.okQty.toFixed(2)}</td>
                          {/* UOM */}
                          <td className="px-3 py-1 border-r border-slate-100 text-center text-slate-500">{r.uom}</td>
                          {/* Barcode */}
                          <td className="px-3 py-1 border-r border-slate-100 font-mono text-[11px] text-slate-600">{r.barcode}</td>
                          {/* Created_by */}
                          <td className="px-3 py-1 border-r border-slate-100 font-semibold text-slate-600 text-[11px]">{r.createdBy}</td>
                          {/* QC Status */}
                          <td className={`px-3 py-1 border-r border-slate-100 text-[11px] ${qcStatusColor(r.qcStatus)}`}>{r.qcStatus}</td>
                          {/* QC Remarks */}
                          <td className="px-3 py-1 border-r border-slate-100 text-slate-500 italic text-[11px] truncate max-w-[180px]">{r.qcRemarks}</td>
                          {/* Remarks */}
                          <td className="px-3 py-1 text-slate-500 text-[11px]">{r.remarks}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
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
