import { useState } from 'react'
import { ChevronRight, X, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { useToast } from '../components/Toast'

const STORAGE_KEY = 'velson_mr_approval'

const SEED_MRS = [
  { reqNo: '25-26/MQ000840', reqDate: '19/03/2026', deptName: 'PURCHASE', requiredDate: '22/03/2026', requestFor: 'PRODUCTION', createdUser: 'V10GROUNDHOG' },
  { reqNo: '25-26/MQ000841', reqDate: '19/03/2026', deptName: 'PURCHASE', requiredDate: '22/03/2026', requestFor: 'SALES',      createdUser: 'VELSON SPARES' },
  { reqNo: '25-26/MQ000843', reqDate: '19/03/2026', deptName: 'PURCHASE', requiredDate: '21/03/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '25-26/MQ000844', reqDate: '20/03/2026', deptName: 'PURCHASE', requiredDate: '22/03/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '25-26/MQ000845', reqDate: '20/03/2026', deptName: 'PURCHASE', requiredDate: '22/03/2026', requestFor: 'SALES',      createdUser: 'VELSON SPARES' },
  { reqNo: '25-26/MQ000848', reqDate: '23/03/2026', deptName: 'PURCHASE', requiredDate: '26/03/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '25-26/MQ000849', reqDate: '24/03/2026', deptName: 'PURCHASE', requiredDate: '25/03/2026', requestFor: 'PRODUCTION', createdUser: 'sheetmetaling' },
  { reqNo: '25-26/MQ000850', reqDate: '24/03/2026', deptName: 'PURCHASE', requiredDate: '25/03/2026', requestFor: 'PRODUCTION', createdUser: 'gas cutting' },
  { reqNo: '25-26/MQ000852', reqDate: '24/03/2026', deptName: 'PURCHASE', requiredDate: '25/03/2026', requestFor: 'SALES',      createdUser: 'VELSON SPARES' },
  { reqNo: '25-26/MQ000854', reqDate: '25/03/2026', deptName: 'PURCHASE', requiredDate: '28/03/2026', requestFor: 'PRODUCTION', createdUser: 'conventional' },
  { reqNo: '25-26/MQ000855', reqDate: '25/03/2026', deptName: 'PURCHASE', requiredDate: '26/03/2026', requestFor: 'PRODUCTION', createdUser: 'gas cutting' },
  { reqNo: '25-26/MQ000858', reqDate: '27/03/2026', deptName: 'PURCHASE', requiredDate: '06/04/2026', requestFor: 'SALES',      createdUser: 'velson spares' },
  { reqNo: '25-26/MQ000862', reqDate: '28/03/2026', deptName: 'PURCHASE', requiredDate: '26/03/2026', requestFor: 'PRODUCTION', createdUser: 'ELECTRICAL' },
  { reqNo: '25-26/MQ000864', reqDate: '30/03/2026', deptName: 'PURCHASE', requiredDate: '31/03/2026', requestFor: 'PRODUCTION', createdUser: 'ELECTRICAL' },
  { reqNo: '25-26/MQ000860', reqDate: '31/03/2026', deptName: 'PURCHASE', requiredDate: '02/04/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '25-26/MQ000869', reqDate: '31/03/2026', deptName: 'PURCHASE', requiredDate: '02/04/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '26-27/MQ000003', reqDate: '02/04/2026', deptName: 'PURCHASE', requiredDate: '04/04/2026', requestFor: 'PRODUCTION', createdUser: 'designd' },
  { reqNo: '26-27/MQ000004', reqDate: '02/04/2026', deptName: 'PURCHASE', requiredDate: '04/04/2026', requestFor: 'PRODUCTION', createdUser: 'ELECTRICAL' },
  { reqNo: '26-27/MQ000005', reqDate: '02/04/2026', deptName: 'PURCHASE', requiredDate: '05/04/2026', requestFor: 'PRODUCTION', createdUser: 'conventional' },
  { reqNo: '26-27/MQ000008', reqDate: '03/04/2026', deptName: 'PURCHASE', requiredDate: '04/04/2026', requestFor: 'SALES',      createdUser: 'VELSON SPARES' },
  { reqNo: '26-27/MQ000009', reqDate: '04/04/2026', deptName: 'PURCHASE', requiredDate: '06/04/2026', requestFor: 'SALES',      createdUser: 'VELSON SPARES' },
  { reqNo: '26-27/MQ000012', reqDate: '07/04/2026', deptName: 'PURCHASE', requiredDate: '09/04/2026', requestFor: 'PRODUCTION', createdUser: 'ACCOUNTS' },
  { reqNo: '26-27/MQ000016', reqDate: '08/04/2026', deptName: 'PURCHASE', requiredDate: '10/04/2026', requestFor: 'PRODUCTION', createdUser: 'V3IMYRMAX' },
  { reqNo: '26-27/MQ000018', reqDate: '08/04/2026', deptName: 'PURCHASE', requiredDate: '10/04/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '26-27/MQ000021', reqDate: '09/04/2026', deptName: 'PURCHASE', requiredDate: '11/04/2026', requestFor: 'PRODUCTION', createdUser: 'ACCOUNTS' },
  { reqNo: '26-27/MQ000022', reqDate: '09/04/2026', deptName: 'PURCHASE', requiredDate: '10/04/2026', requestFor: 'PRODUCTION', createdUser: 'gas cutting' },
  { reqNo: '26-27/MQ000023', reqDate: '09/04/2026', deptName: 'PURCHASE', requiredDate: '10/04/2026', requestFor: 'PRODUCTION', createdUser: 'SHEETMETALING' },
  { reqNo: '26-27/MQ000024', reqDate: '10/04/2026', deptName: 'PURCHASE', requiredDate: '13/04/2026', requestFor: 'PRODUCTION', createdUser: 'v10groundhog' },
  { reqNo: '26-27/MQ000025', reqDate: '10/04/2026', deptName: 'PURCHASE', requiredDate: '13/04/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '26-27/MQ000028', reqDate: '10/04/2026', deptName: 'PURCHASE', requiredDate: '13/04/2026', requestFor: 'PRODUCTION', createdUser: 'V10GROUNDHOG' },
  { reqNo: '26-27/MQ000031', reqDate: '10/04/2026', deptName: 'PURCHASE', requiredDate: '11/04/2026', requestFor: 'SALES',      createdUser: 'velson spares' },
  { reqNo: '26-27/MQ000032', reqDate: '11/04/2026', deptName: 'PURCHASE', requiredDate: '14/04/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '26-27/MQ000033', reqDate: '11/04/2026', deptName: 'PURCHASE', requiredDate: '13/04/2026', requestFor: 'PRODUCTION', createdUser: 'electrical' },
  { reqNo: '26-27/MQ000035', reqDate: '11/04/2026', deptName: 'PURCHASE', requiredDate: '13/04/2026', requestFor: 'PRODUCTION', createdUser: 'electrical' },
  { reqNo: '26-27/MQ000036', reqDate: '11/04/2026', deptName: 'PURCHASE', requiredDate: '13/04/2026', requestFor: 'PRODUCTION', createdUser: 'electrical' },
  { reqNo: '26-27/MQ000038', reqDate: '12/04/2026', deptName: 'PURCHASE', requiredDate: '14/04/2026', requestFor: 'PRODUCTION', createdUser: 'CONVENTIONAL' },
  { reqNo: '26-27/MQ000039', reqDate: '12/04/2026', deptName: 'PURCHASE', requiredDate: '14/04/2026', requestFor: 'SALES',      createdUser: 'VELSON SPARES' },
  { reqNo: '26-27/MQ000041', reqDate: '13/04/2026', deptName: 'PURCHASE', requiredDate: '15/04/2026', requestFor: 'PRODUCTION', createdUser: 'gas cutting' },
  { reqNo: '26-27/MQ000042', reqDate: '13/04/2026', deptName: 'PURCHASE', requiredDate: '15/04/2026', requestFor: 'PRODUCTION', createdUser: 'SHEETMETALING' },
  { reqNo: '26-27/MQ000043', reqDate: '14/04/2026', deptName: 'PURCHASE', requiredDate: '16/04/2026', requestFor: 'PRODUCTION', createdUser: 'V10GROUNDHOG' },
]

export default function MRApproval() {
  const toast = useToast()

  const [rows, setRows] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return SEED_MRS.map(r => ({ ...r, status: saved[r.reqNo] || 'Pending' }))
  })
  const [selectedRow, setSelectedRow] = useState(null)

  const setStatus = (reqNo, status) => {
    setRows(prev => prev.map(r => r.reqNo === reqNo ? { ...r, status } : r))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    saved[reqNo] = status
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    if (status === 'Approved') toast.success(`MR ${reqNo} approved.`)
    else toast.warning(`MR ${reqNo} rejected.`)
  }

  const pending  = rows.filter(r => r.status === 'Pending').length
  const approved = rows.filter(r => r.status === 'Approved').length
  const rejected = rows.filter(r => r.status === 'Rejected').length

  const reqColor = (r) => {
    if (r === 'PRODUCTION') return 'text-sky-700 font-bold'
    if (r === 'SALES') return 'text-emerald-700 font-bold'
    return 'text-slate-600'
  }

  const userColor = (u = '') => {
    const l = u.toLowerCase()
    if (l.includes('velson') || l.includes('spares')) return 'text-emerald-600'
    if (l.includes('electrical')) return 'text-amber-600'
    if (l.includes('gas') || l.includes('cutting')) return 'text-orange-600'
    if (l.includes('v10') || l.includes('groundhog')) return 'text-blue-600'
    return 'text-slate-600'
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">MR Approval</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Material Request Approval Pending</h2>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* Sub header */}
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Material Request Approval Pending</p>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-[11px] font-bold text-amber-700 uppercase">{pending} Pending</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-700 uppercase">{approved} Approved</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <XCircle size={13} className="text-red-400" />
                <span className="text-[11px] font-bold text-red-600 uppercase">{rejected} Rejected</span>
              </div>
              <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase">{rows.length} total requests</span>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[11px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-44">Req_No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Req_Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Dept_Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Required Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24">Request For</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Created User</th>
                      <th className="px-3 py-2.5 w-40 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => {
                      const isSel = selectedRow === r.reqNo
                      const isPending  = r.status === 'Pending'
                      const isApproved = r.status === 'Approved'
                      const isRejected = r.status === 'Rejected'

                      const rowBg = isApproved ? 'bg-emerald-50/60'
                        : isRejected ? 'bg-red-50/60'
                        : isSel ? 'bg-[#1565C0]/8'
                        : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'

                      return (
                        <tr key={r.reqNo} onClick={() => setSelectedRow(r.reqNo)}
                          className={`h-9 transition-colors cursor-pointer hover:bg-blue-50/30 ${rowBg}`}>
                          <td className="px-3 py-1 border-r border-slate-100 text-[12px] font-bold text-[#0097A7]">{r.reqNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500">{r.reqDate}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-[12px] font-semibold text-slate-600">{r.deptName}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500">{r.requiredDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[12px] ${reqColor(r.requestFor)}`}>{r.requestFor}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[12px] ${userColor(r.createdUser)}`}>{r.createdUser}</td>
                          <td className="px-3 py-1 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} /> Approved
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                <XCircle size={11} /> Rejected
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={e => { e.stopPropagation(); setStatus(r.reqNo, 'Approved') }}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-sm">
                                  <CheckCircle2 size={11} /> Approve
                                </button>
                                <button onClick={e => { e.stopPropagation(); setStatus(r.reqNo, 'Rejected') }}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-sm">
                                  <XCircle size={11} /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                <span>Row : {rows.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
