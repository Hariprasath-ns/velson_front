import { useState } from 'react'
import { ChevronRight, X } from 'lucide-react'

const JOB_NOS = [
  '','1275','1414','1929','2155','2330','2355','2532','2663','2993','3112',
  '3409','3819','3820','3930','4164','4269','4306','31973','34107','34885',
  '34931','34938','34943','34946','34947','34949','34954','34955','34965',
  '34966','34970','34975','34980','34985','34990','41432','41433','41434',
  '41435','41436','41437','41438','41439','41440','41441','41442','41443',
  '41444','41445','41446','41447','41448',
]

const JOB_STATUS_OPTIONS = ['Waiting for Process', 'In Process', 'Close']

const ITEM_NAMES = [
  '', 'LW TILT MAST HOSE SLIDING 20MM PIN 75MM', 'CABIN ELECTRICAL BOX PLATE 6',
  '6MM SQUARE ROD-80MM', 'M1 YTYPE 110 BOTTOM OIL SEAL FLANGE',
  'V10 SOLAR MAST TILTING MOUNT BASE FRAME', 'D50 HITACHI 210 HAND RAIL FRAME 1 COVER PLATE 1',
  'V10 7.7 MTR MASTER ARM PLATE TILTING SU', 'LW MASTER ROPE & CHAIN MOUNT ROPE BED P',
  'V3 TRACK OPERATED JOYSTIC MOUNT PLATE 4', 'V10 COMPRESSOR SMALL TOOLS BOX FRAME CH',
]

const SEED = [
  { sno:1,  jobNo:41448, partNo:'VGH-1004441', partName:'LW TILT MAST HOSE SLIDING 20MM PIN 75MM', barcode:'052449/2026', jobStatus:'Close', jobCompleted:100, processCompleted:100 },
  { sno:2,  jobNo:41447, partNo:'VGH-1004439', partName:'LW TILT MAST HOSE SLIDING PIPE 32',        barcode:'052448/2026', jobStatus:'Close', jobCompleted:100, processCompleted:100 },
  { sno:3,  jobNo:41446, partNo:'VGH-1004438', partName:'LW TILT MAST HOSE SLIDING PIPE 40',        barcode:'052447/2026', jobStatus:'Close', jobCompleted:100, processCompleted:100 },
  { sno:4,  jobNo:41445, partNo:'VGH-1000564', partName:'V10 6MTR TILTING MASTER ROPE LAYING ASSM', barcode:'052446/2026', jobStatus:'Close', jobCompleted:100, processCompleted:100 },
  { sno:5,  jobNo:41444, partNo:'VC-100923',   partName:'LW MASTER ROPE & CHAIN MOUNT ROPE BED P',  barcode:'2445/2026',   jobStatus:'In Process', jobCompleted:60,  processCompleted:50  },
  { sno:6,  jobNo:41443, partNo:'VCS-300471',  partName:'V3 TRACK OPERATED JOYSTIC MOUNT PLATE 4',  barcode:'2444/2026',   jobStatus:'In Process', jobCompleted:40,  processCompleted:33  },
  { sno:7,  jobNo:41442, partNo:'VE-70805',    partName:'CABIN ELECTRICAL BOX PLATE 6',              barcode:'2443/2026',   jobStatus:'Waiting for Process', jobCompleted:0, processCompleted:0 },
]

export default function ProcessCardClose() {
  const [jobNo,     setJobNo]     = useState('')
  const [barcode,   setBarcode]   = useState('')
  const [jobStatus, setJobStatus] = useState('Close')
  const [itemName,  setItemName]  = useState('')
  const [rows]                    = useState(SEED)
  const [selectedRow, setSelectedRow] = useState(null)

  const selectedData = selectedRow !== null ? rows[selectedRow] : null
  const jobCompleted     = selectedData ? selectedData.jobCompleted     : 0
  const processCompleted = selectedData ? selectedData.processCompleted : 0

  const displayed = rows.filter(r =>
    (!jobNo     || String(r.jobNo) === jobNo) &&
    (!barcode   || r.barcode.toLowerCase().includes(barcode.toLowerCase())) &&
    (!itemName  || r.partName === itemName) &&
    (jobStatus === '' || r.jobStatus === jobStatus)
  )

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Process Card Close</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Job Card Close</h2>
            </div>
            <button className="flex items-center gap-1 text-slate-400 hover:text-red-600 text-[11px] font-bold transition-colors">
              <X size={16} strokeWidth={2.5} /> Close
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Filter Area + Completion Stats */}
            <div className="flex items-start gap-6">
              {/* Filter Fields */}
              <div className="flex-1 space-y-2">
                {/* Row 1: Job No, Barcode, Job Status */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Job No :</span>
                    <select value={jobNo} onChange={e => setJobNo(e.target.value)}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36">
                      {JOB_NOS.map(n => <option key={n} value={n}>{n || '-- Select --'}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Barcode :</span>
                    <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Job Status :</span>
                    <select value={jobStatus} onChange={e => setJobStatus(e.target.value)}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-44">
                      {JOB_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                {/* Row 2: Item Name */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Item Name :</span>
                  <select value={itemName} onChange={e => setItemName(e.target.value)}
                    className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-96">
                    {ITEM_NAMES.map(n => <option key={n} value={n}>{n || '-- Select Item --'}</option>)}
                  </select>
                </div>
              </div>

              {/* Completion Stats (right side) */}
              <div className="flex flex-col gap-3 shrink-0 text-center min-w-[160px]">
                <div>
                  <div className="text-[11px] font-bold text-slate-600">Job Completed [%]</div>
                  <div className="text-[22px] font-black text-slate-700 leading-tight">{jobCompleted}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${jobCompleted}%` }} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-600">Process Completed [%]</div>
                  <div className="text-[22px] font-black text-slate-700 leading-tight">{processCompleted}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div className="bg-[#0097A7] h-1.5 rounded-full transition-all" style={{ width: `${processCompleted}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[860px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-10 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16">Job No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Barcode</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-36">Job Status</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28 text-center">Job Completed [%]</th>
                      <th className="px-3 py-2.5 w-32 text-center">Process Completed [%]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-[12px] text-slate-400">
                          No records found. Select filters above to load data.
                        </td>
                      </tr>
                    ) : displayed.map((r, i) => {
                      const isSel = selectedRow === rows.indexOf(r)
                      return (
                        <tr key={i} onClick={() => setSelectedRow(rows.indexOf(r))}
                          className={`h-9 cursor-pointer text-[12px] transition-colors ${isSel ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-400'}`}>{r.sno}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-bold ${isSel ? '' : 'text-slate-700'}`}>{r.jobNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-[#0097A7]'}`}>{r.partNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[220px] ${isSel ? '' : 'text-slate-700'}`}>{r.partName}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[11px] ${isSel ? '' : 'text-slate-600'}`}>{r.barcode}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[11px] font-semibold ${isSel ? '' : r.jobStatus === 'Close' ? 'text-emerald-600' : r.jobStatus === 'In Process' ? 'text-amber-600' : 'text-slate-500'}`}>
                            {r.jobStatus}
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-600'}`}>{r.jobCompleted}%</td>
                          <td className={`px-3 py-1 text-center font-bold ${isSel ? '' : 'text-slate-600'}`}>{r.processCompleted}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                Row : {displayed.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
