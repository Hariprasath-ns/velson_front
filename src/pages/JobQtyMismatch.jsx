import { useState } from 'react'
import { ChevronRight, X, Search, FileSpreadsheet, FileText, Filter, Settings, Image } from 'lucide-react'
import { useToast } from '../components/Toast'

const DateInput = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{label} :</span>
    <input type="date" value={value} onChange={onChange}
      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36" />
  </div>
)

const SEED = [
  { sno:1,  jobNo:12973, vehicleType:'V10',    partNo:'VGH-1003608',   productName:'V10 THREAD ROD-6 mtr chain type',                   qty:1.00,  planDate:'11/01/2024', reqDate:'11/01/2024', closedDate:'25/01/2024', barcode:'018921/2024', jedQty:3,  prodQty:2  },
  { sno:2,  jobNo:17910, vehicleType:'HMD',    partNo:'VGH-10060267',  productName:'HMD ROD BOX 60X40X300',                              qty:1.00,  planDate:'10/07/2024', reqDate:'10/07/2024', closedDate:'21/11/2024', barcode:'024842/2024', jedQty:8,  prodQty:4  },
  { sno:3,  jobNo:20125, vehicleType:'V10',    partNo:'VGH-1000158',   productName:'V10 GH L ANGLE SUPPORT PLATE',                       qty:5.00,  planDate:'16/09/2024', reqDate:'16/09/2024', closedDate:'19/11/2024', barcode:'028045/2024', jedQty:20, prodQty:5  },
  { sno:4,  jobNo:20586, vehicleType:'V10',    partNo:'VGH-1001078',   productName:'HITACHI CABIN EXTENTION PLATE 3',                    qty:1.00,  planDate:'27/09/2024', reqDate:'27/09/2024', closedDate:'19/11/2024', barcode:'028045/2024', jedQty:4,  prodQty:2  },
  { sno:5,  jobNo:20586, vehicleType:'V10',    partNo:'VGH-1001079',   productName:'HITACHI CABIN EXTENTION PLATE 4',                    qty:1.00,  planDate:'27/09/2024', reqDate:'27/09/2024', closedDate:'19/11/2024', barcode:'028046/2024', jedQty:4,  prodQty:1  },
  { sno:6,  jobNo:20586, vehicleType:'V10',    partNo:'VGH-1001081',   productName:'HITACHI CABIN EXTENTION PLATE 6',                    qty:1.00,  planDate:'27/09/2024', reqDate:'27/09/2024', closedDate:'19/11/2024', barcode:'028047/2024', jedQty:8,  prodQty:1  },
  { sno:7,  jobNo:20586, vehicleType:'V10',    partNo:'VGH-1001082',   productName:'HITACHI CABIN EXTENTION PLATE 7',                    qty:1.00,  planDate:'27/09/2024', reqDate:'27/09/2024', closedDate:'19/11/2024', barcode:'028048/2024', jedQty:4,  prodQty:1  },
  { sno:8,  jobNo:20586, vehicleType:'V10',    partNo:'VGH-1001084',   productName:'HITACHI CABIN FRONT GLASS FRAME SIDE BEEDING 1',     qty:1.00,  planDate:'27/09/2024', reqDate:'27/09/2024', closedDate:'19/11/2024', barcode:'028049/2024', jedQty:8,  prodQty:1  },
  { sno:9,  jobNo:20586, vehicleType:'V10',    partNo:'VGH-1001085',   productName:'HITACHI CABIN FRONT GLASS FRAME SIDE BEEDING 2',     qty:1.00,  planDate:'27/09/2024', reqDate:'27/09/2024', closedDate:'19/11/2024', barcode:'028050/2024', jedQty:8,  prodQty:1  },
  { sno:10, jobNo:21261, vehicleType:'V10',    partNo:'VGH-1003765',   productName:'V10-9.5 MTR TOP DRIVE CORNER PIECE 1',               qty:2.00,  planDate:'24/10/2024', reqDate:'24/10/2024', closedDate:'18/12/2024', barcode:'028844/2024', jedQty:6,  prodQty:3  },
  { sno:11, jobNo:21261, vehicleType:'V10',    partNo:'VGH-1003766',   productName:'V10-9.5 MTR TOP DRIVE CORNER PIECE 2',               qty:2.00,  planDate:'24/10/2024', reqDate:'24/10/2024', closedDate:'19/11/2024', barcode:'028845/2024', jedQty:6,  prodQty:3  },
  { sno:12, jobNo:21500, vehicleType:'V3i',    partNo:'VCS-300409',    productName:'V3 TRACK & TANK SUPPORT PLATE 6',                    qty:20.00, planDate:'30/10/2024', reqDate:'30/10/2024', closedDate:'18/12/2024', barcode:'9128/2024',   jedQty:20, prodQty:5  },
  { sno:13, jobNo:21543, vehicleType:'V3i',    partNo:'VCS-300471',    productName:'V3 MASTER 80 X 40 PIPE 250MM',                       qty:4.00,  planDate:'05/11/2024', reqDate:'05/11/2024', closedDate:'18/12/2024', barcode:'029188/2024', jedQty:8,  prodQty:2  },
  { sno:14, jobNo:21543, vehicleType:'V3i',    partNo:'VCS-300157',    productName:'V3 MASTER 80 X 40 PIPE 135MM',                       qty:4.00,  planDate:'05/11/2024', reqDate:'05/11/2024', closedDate:'19/11/2024', barcode:'029189/2024', jedQty:28, prodQty:2  },
  { sno:15, jobNo:21839, vehicleType:'V2I',    partNo:'VM-201373',     productName:'V2-I NEW ROD CHANGER TILTING BUSH EAR PIECE-1',      qty:2.00,  planDate:'13/11/2024', reqDate:'13/11/2024', closedDate:'18/12/2024', barcode:'029545/2024', jedQty:2,  prodQty:1  },
  { sno:16, jobNo:23324, vehicleType:'V10',    partNo:'VGH-1000255',   productName:'V10 MASTER M2 REMOVAL TYPE U PIECE - 676MM',         qty:1.00,  planDate:'31/12/2024', reqDate:'31/12/2024', closedDate:'04/04/2025', barcode:'031180/2024', jedQty:5,  prodQty:4  },
  { sno:17, jobNo:23759, vehicleType:'VLD',    partNo:'VGH-1200269',   productName:'VHT LOADER MAST RC CATCH BAR 2',                     qty:2.00,  planDate:'16/01/2025', reqDate:'16/01/2025', closedDate:'04/04/2025', barcode:'031686/2025', jedQty:6,  prodQty:3  },
  { sno:18, jobNo:24033, vehicleType:'V10',    partNo:'VGH-1001328',   productName:'V10 HITACHI - CP 1100 COMPRESSOR BACK STAIR FRAME 1 PIPE 1', qty:2.00, planDate:'22/01/2025', reqDate:'22/01/2025', closedDate:'12/03/2025', barcode:'032002/2025', jedQty:6, prodQty:3 },
  { sno:19, jobNo:24035, vehicleType:'V10',    partNo:'VGH-1001329',   productName:'V10 HITACHI - CP 1100 COMPRESSOR BACK STAIR FRAME 2 PIPE 1', qty:2.00, planDate:'22/01/2025', reqDate:'22/01/2025', closedDate:'12/03/2025', barcode:'032008/2025', jedQty:6, prodQty:3 },
  { sno:20, jobNo:24082, vehicleType:'V10',    partNo:'VGH-1001318',   productName:'V10 - 1020 X 640 SIDE PLATFORM FRAME PIPE 1',        qty:2.00,  planDate:'23/01/2025', reqDate:'23/01/2025', closedDate:'12/03/2025', barcode:'032064/2025', jedQty:6,  prodQty:3  },
  { sno:21, jobNo:24383, vehicleType:'V10',    partNo:'VCS-005211',    productName:'TRIBLE RC SQUARE PIPE',                               qty:3.00,  planDate:'29/01/2025', reqDate:'29/01/2025', closedDate:'14/03/2025', barcode:'032416/2025', jedQty:6,  prodQty:3  },
  { sno:22, jobNo:24476, vehicleType:'V2I',    partNo:'VM-200449',     productName:'BUTTERFLY SPANNER RH',                               qty:40.00, planDate:'31/01/2025', reqDate:'31/01/2025', closedDate:'07/05/2025', barcode:'2520/2025',   jedQty:40, prodQty:10 },
  { sno:23, jobNo:24565, vehicleType:'V2I',    partNo:'VM-201392',     productName:'V2-I RC BOLT PLATE 20MM',                            qty:10.00, planDate:'04/02/2025', reqDate:'04/02/2025', closedDate:'04/04/2025', barcode:'2625/2025',   jedQty:10, prodQty:6  },
  { sno:24, jobNo:24591, vehicleType:'V2I',    partNo:'VM-201392',     productName:'V2-I NEW ROD CHANGER CATCH PLATE',                   qty:3.00,  planDate:'04/02/2025', reqDate:'04/02/2025', closedDate:'28/05/2025', barcode:'032654/2025', jedQty:3,  prodQty:1  },
]

const PLAN_QTY_OPTIONS = ['All', '1', '2', '3', '4', '5', '10', '20', '40', '100']

export default function JobQtyMismatch() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate]     = useState(today)
  const [planQty, setPlanQty]   = useState('All')
  const [rows]                  = useState(SEED)
  const [selectedRow, setSelectedRow] = useState(null)

  const displayed = planQty === 'All' ? rows : rows.filter(r => String(r.qty) === planQty || r.qty === Number(planQty))

  const totalQty    = displayed.reduce((s, r) => s + r.qty, 0)
  const totalJed    = displayed.reduce((s, r) => s + r.jedQty, 0)
  const totalProd   = displayed.reduce((s, r) => s + r.prodQty, 0)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Job Qty Mismatch</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Production Qty Mismatch</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="border border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center w-24 h-12 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 leading-tight">Part Image</span>
                <Image size={16} className="text-slate-300 mt-0.5" />
              </div>
              <button className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600 text-[11px] font-bold rounded border border-slate-200 hover:border-red-300 transition-all">
                <X size={13} /> Close
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {/* Filter Row 1 */}
            <div className="flex items-center gap-3 flex-wrap">
              <DateInput label="From Date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <DateInput label="To Date"   value={toDate}   onChange={e => setToDate(e.target.value)} />
              <button onClick={() => toast.info(`${displayed.length} records loaded.`)}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                <Search size={12} /> Search
              </button>
              <button onClick={() => toast.info('Displaying all records...')}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                Display All
              </button>
            </div>

            {/* Filter Row 2 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Plan Qty :</span>
              <select value={planQty} onChange={e => setPlanQty(e.target.value)}
                className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-28">
                {PLAN_QTY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 border border-slate-200 rounded bg-slate-50 px-3 py-1.5">
              <button className="text-[11px] font-bold text-slate-600 hover:text-[#0097A7] border border-slate-300 rounded px-2 py-0.5 bg-white transition-all">
                LS&nbsp;1
              </button>
              <button className="text-[11px] font-bold text-slate-600 hover:text-[#0097A7] transition-all">Dos</button>
              <div className="w-px h-4 bg-slate-300" />
              <button onClick={() => toast.info('Exporting Excel...')} className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-all">
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button onClick={() => toast.info('Exporting PDF...')} className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-all">
                <FileText size={13} /> Pdf
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#0097A7] transition-all">
                <Filter size={12} /> Filter
              </button>
              <button className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#0097A7] transition-all">
                <Settings size={12} /> Setting
              </button>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 1300 }}>
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-10 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16">Job No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24">Vehicle Type</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Product Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16 text-center">Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Plan Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Required Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Closed Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Barcode</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16 text-center">JED_Qty</th>
                      <th className="px-3 py-2.5 w-24 text-center">Production Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayed.map((r, i) => {
                      const isSel = selectedRow === i
                      return (
                        <tr key={i} onClick={() => setSelectedRow(i)}
                          className={`h-9 cursor-pointer text-[12px] transition-colors ${isSel ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-400'}`}>{r.sno}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-bold ${isSel ? '' : 'text-slate-700'}`}>{r.jobNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-semibold ${isSel ? '' : 'text-[#0097A7]'}`}>{r.vehicleType}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-slate-700'}`}>{r.partNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[260px] ${isSel ? '' : 'text-slate-700'}`}>{r.productName}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-600'}`}>{r.qty.toFixed(2)}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.planDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.reqDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.closedDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[11px] ${isSel ? '' : 'text-slate-600'}`}>{r.barcode}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-sky-600'}`}>{r.jedQty}</td>
                          <td className={`px-3 py-1 text-center font-bold ${isSel ? '' : 'text-red-600'}`}>{r.prodQty}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer totals */}
              <div className="flex items-center gap-8 border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                <span>Row : {displayed.length}</span>
                <span className="text-slate-500">Qty : {totalQty.toFixed(2)}</span>
                <span className="text-sky-600">JED_Qty : {totalJed}</span>
                <span className="text-red-600">Production Qty : {totalProd}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
