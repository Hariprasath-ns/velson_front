import { useState } from 'react'
import { ChevronRight, CheckCircle2, X } from 'lucide-react'
import { useToast } from '../components/Toast'

const SEED = [
  { id:1,  reqNo:'23-24/PQ00001', reqDate:'21/03/2023', deptName:'ACCOUNTS',  requiredDate:'21/03/2023', createdUser:'purchase'  },
  { id:2,  reqNo:'23-24/PQ00100', reqDate:'05/08/2023', deptName:'PARCEL',     requiredDate:'05/08/2023', createdUser:'PURCHASE'  },
  { id:3,  reqNo:'23-24/PQ00106', reqDate:'09/08/2023', deptName:'PURCHASE',   requiredDate:'09/08/2023', createdUser:'PURCHASE'  },
  { id:4,  reqNo:'23-24/PQ00110', reqDate:'16/08/2023', deptName:'PURCHASE',   requiredDate:'16/08/2023', createdUser:'PURCHASE'  },
  { id:5,  reqNo:'23-24/PQ00111', reqDate:'16/08/2023', deptName:'PURCHASE',   requiredDate:'16/08/2023', createdUser:'PURCHASE'  },
  { id:6,  reqNo:'23-24/PQ00117', reqDate:'16/09/2023', deptName:'PURCHASE',   requiredDate:'16/09/2023', createdUser:'purchase'  },
  { id:7,  reqNo:'23-24/PQ00118', reqDate:'16/09/2023', deptName:'PURCHASE',   requiredDate:'16/09/2023', createdUser:'purchase'  },
  { id:8,  reqNo:'23-24/PQ00119', reqDate:'16/09/2023', deptName:'PURCHASE',   requiredDate:'16/09/2023', createdUser:'purchase'  },
  { id:9,  reqNo:'23-24/PQ00131', reqDate:'05/12/2023', deptName:'PURCHASE',   requiredDate:'05/12/2023', createdUser:'purchase1' },
  { id:10, reqNo:'23-24/PQ00132', reqDate:'05/12/2023', deptName:'PURCHASE',   requiredDate:'05/12/2023', createdUser:'purchase1' },
  { id:11, reqNo:'23-24/PQ00137', reqDate:'18/12/2023', deptName:'PURCHASE',   requiredDate:'18/12/2023', createdUser:'purchase2' },
  { id:12, reqNo:'23-24/PQ00138', reqDate:'19/12/2023', deptName:'PURCHASE',   requiredDate:'19/12/2023', createdUser:'PURCHASE1' },
  { id:13, reqNo:'23-24/PQ00139', reqDate:'20/12/2023', deptName:'PURCHASE',   requiredDate:'20/12/2023', createdUser:'purchase1' },
  { id:14, reqNo:'23-24/PQ00140', reqDate:'20/12/2023', deptName:'PURCHASE',   requiredDate:'20/12/2023', createdUser:'purchase2' },
  { id:15, reqNo:'23-24/PQ00141', reqDate:'20/12/2023', deptName:'PURCHASE',   requiredDate:'20/12/2023', createdUser:'purchase2' },
  { id:16, reqNo:'23-24/PQ00144', reqDate:'02/01/2024', deptName:'PURCHASE',   requiredDate:'02/01/2024', createdUser:'PURCHASE1' },
  { id:17, reqNo:'23-24/PQ00183', reqDate:'22/03/2024', deptName:'MARKETING',  requiredDate:'22/03/2024', createdUser:'purchase1' },
  { id:18, reqNo:'23-24/PQ00184', reqDate:'22/03/2024', deptName:'MARKETING',  requiredDate:'22/03/2024', createdUser:'purchase1' },
  { id:19, reqNo:'24-25/PQ00078', reqDate:'25/07/2024', deptName:'PURCHASE',   requiredDate:'25/07/2024', createdUser:'purchase2' },
  { id:20, reqNo:'25-26/PQ00097', reqDate:'30/07/2025', deptName:'PURCHASE',   requiredDate:'30/07/2025', createdUser:'purchase2' },
  { id:21, reqNo:'25-26/PQ00156', reqDate:'19/09/2025', deptName:'PURCHASE',   requiredDate:'19/09/2025', createdUser:'purchase2' },
  { id:22, reqNo:'25-26/PQ00157', reqDate:'19/09/2025', deptName:'PURCHASE',   requiredDate:'19/09/2025', createdUser:'purchase2' },
  { id:23, reqNo:'25-26/PQ00162', reqDate:'20/09/2025', deptName:'PURCHASE',   requiredDate:'20/09/2025', createdUser:'purchase2' },
  { id:24, reqNo:'25-26/PQ00176', reqDate:'10/10/2025', deptName:'PURCHASE',   requiredDate:'10/10/2025', createdUser:'purchase1' },
  { id:25, reqNo:'25-26/PQ00177', reqDate:'10/10/2025', deptName:'PURCHASE',   requiredDate:'10/10/2025', createdUser:'purchase1' },
  { id:26, reqNo:'25-26/PQ00178', reqDate:'10/10/2025', deptName:'PURCHASE',   requiredDate:'10/10/2025', createdUser:'purchase1' },
  { id:27, reqNo:'25-26/PQ00184', reqDate:'14/10/2025', deptName:'PURCHASE',   requiredDate:'14/10/2025', createdUser:'purchase2' },
  { id:28, reqNo:'25-26/PQ00257', reqDate:'08/01/2026', deptName:'PURCHASE',   requiredDate:'08/01/2026', createdUser:'purchase2' },
  { id:29, reqNo:'25-26/PQ00279', reqDate:'30/01/2026', deptName:'PURCHASE',   requiredDate:'30/01/2026', createdUser:'purchase2' },
  { id:30, reqNo:'25-26/PQ00322', reqDate:'05/03/2026', deptName:'PURCHASE',   requiredDate:'05/03/2026', createdUser:'purchase1' },
]

const STORAGE_KEY = 'velson_pr_approval'

export default function PRApproval() {
  const toast = useToast()

  const [rows, setRows] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return SEED.map(r => ({ ...r, status: saved[r.id] || 'Pending' }))
  })
  const [selectedRow, setSelectedRow] = useState(1)

  const handleApprove = () => {
    const target = rows.find(r => r.id === selectedRow)
    if (!target) { toast.warning('Select a row to approve.'); return }
    if (target.status !== 'Pending') { toast.info(`Already ${target.status}.`); return }
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    saved[selectedRow] = 'Approved'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    setRows(prev => prev.map(r => r.id === selectedRow ? { ...r, status: 'Approved' } : r))
    toast.success(`${target.reqNo} approved.`)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">PR Approval</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">
                Purchase Request Approval Pending
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleApprove}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1A76D1] hover:bg-[#1560b0] text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                <CheckCircle2 size={13} /> Approve
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600 text-[11px] font-bold rounded border border-slate-200 hover:border-red-300 transition-all">
                <X size={13} /> Close
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Sub-heading */}
            <div className="text-[12px] font-bold text-slate-600 mb-2 px-1">
              Purchase Request Approval Pending
            </div>

            {/* Table */}
            <div className="border border-slate-300 overflow-hidden">
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="sticky top-0 z-10 bg-white text-slate-700 text-[11px] font-bold border-b border-slate-300">
                    <tr>
                      <th className="w-6 border-r border-slate-300 px-1" />
                      <th className="px-3 py-2 border-r border-slate-300 w-36">Req_No</th>
                      <th className="px-3 py-2 border-r border-slate-300 w-24">Req Date</th>
                      <th className="px-3 py-2 border-r border-slate-300 w-28">Dept<br />Name</th>
                      <th className="px-3 py-2 border-r border-slate-300 w-28">Required<br />Date</th>
                      <th className="px-3 py-2">Created<br />User</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {rows.map((r, i) => {
                      const isSel = selectedRow === r.id
                      return (
                        <tr key={r.id} onClick={() => setSelectedRow(r.id)}
                          className={`h-8 cursor-pointer border-b border-slate-200 transition-colors ${isSel ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/50'}`}>
                          {/* Row selector arrow */}
                          <td className={`border-r border-slate-200 text-center w-6 text-[10px] ${isSel ? 'text-white' : 'text-transparent'}`}>
                            ▶
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-200 font-semibold text-[11px] ${isSel ? 'text-white' : 'text-[#1565C0]'}`}>
                            {r.reqNo}
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-200 ${isSel ? 'text-white' : 'text-slate-600'}`}>
                            {r.reqDate}
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-200 font-semibold ${isSel ? 'text-white' : 'text-slate-700'}`}>
                            {r.deptName}
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-200 ${isSel ? 'text-white' : 'text-slate-600'}`}>
                            {r.requiredDate}
                          </td>
                          <td className={`px-3 py-1 ${isSel ? 'text-white' : 'text-slate-600'}`}>
                            {r.createdUser}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Empty new-row indicator */}
                    <tr className="h-7 border-b border-slate-200 bg-white">
                      <td className="border-r border-slate-200 text-center text-[10px] text-slate-400 px-1">*</td>
                      <td colSpan={5} />
                    </tr>
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
