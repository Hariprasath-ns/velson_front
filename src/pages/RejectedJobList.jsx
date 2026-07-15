import { useState, useEffect } from 'react'
import { ChevronRight, Search, X, FileSpreadsheet, FileText, Filter, Settings, Printer } from 'lucide-react'
import { useToast } from '../components/Toast'

const FilterInput = ({ value, onChange, type = 'text', className = '' }) => (
  <input type={type} value={value} onChange={onChange}
    className={`px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all ${className}`} />
)

// Simulated rejected jobs
const SEED_REJECTED = [
  { jobNo: 41320, partNo: 'VC-100015',   productName: '10" SINGLE ROPE PULLEY 54',                    qtyV: 60,  planDate: '10/04/2026', requireDate: '12/04/2026', rejectionDate: '13/04/2026', rejectionPerson: 'ERP2', rejectionReason: 'Material spec mismatch' },
  { jobNo: 41298, partNo: 'VGH-1004441', productName: 'LW TILT MAST HOSE SLIDING 20MM PIN 75MM',      qtyV: 1,   planDate: '08/04/2026', requireDate: '10/04/2026', rejectionDate: '11/04/2026', rejectionPerson: 'ERP1', rejectionReason: 'Drawing revision pending' },
  { jobNo: 41275, partNo: 'VC-103207',   productName: 'FOOT CLAMP 180 TILTING JACKEY PIN',             qtyV: 4,   planDate: '06/04/2026', requireDate: '09/04/2026', rejectionDate: '10/04/2026', rejectionPerson: 'ADMIN', rejectionReason: 'Route card not created' },
  { jobNo: 41261, partNo: 'VG-20114',    productName: 'XL ROTATION MOTOR OIL PUMP BODY',              qtyV: 20,  planDate: '05/04/2026', requireDate: '08/04/2026', rejectionDate: '09/04/2026', rejectionPerson: 'ERP1', rejectionReason: 'Qty mismatch with BOM' },
  { jobNo: 41244, partNo: 'VCS-300470',  productName: 'V3 CHAIN SPROCKET FOR 705C2K DEVICE',          qtyV: 6,   planDate: '03/04/2026', requireDate: '06/04/2026', rejectionDate: '07/04/2026', rejectionPerson: 'ERP3', rejectionReason: 'Part number incorrect' },
  { jobNo: 41231, partNo: 'VC-106260',   productName: 'LW MAST CHAIN BOTTOM ROLLER BASE PLATE',       qtyV: 5,   planDate: '02/04/2026', requireDate: '05/04/2026', rejectionDate: '06/04/2026', rejectionPerson: 'ERP2', rejectionReason: 'Required date not met' },
  { jobNo: 41209, partNo: 'VM-200253',   productName: 'V2-I 10.5 INCH CHASSIS BED SUPPORT PLATE 3',   qtyV: 2,   planDate: '01/04/2026', requireDate: '04/04/2026', rejectionDate: '05/04/2026', rejectionPerson: 'ERP1', rejectionReason: 'Incomplete process entry' },
  { jobNo: 41185, partNo: 'VRC-601987',  productName: 'GRC CYCLONE SAMPLE INLET PIPE PLATE RH',       qtyV: 1,   planDate: '30/03/2026', requireDate: '02/04/2026', rejectionDate: '03/04/2026', rejectionPerson: 'ADMIN', rejectionReason: 'Supplier material rejected' },
  { jobNo: 41162, partNo: 'VGH-1002100', productName: 'V10 7.7 MTR MASTER ARM PLATE TILTING SUPPORT', qtyV: 8,   planDate: '28/03/2026', requireDate: '01/04/2026', rejectionDate: '02/04/2026', rejectionPerson: 'ERP2', rejectionReason: 'NC raised — rework needed' },
  { jobNo: 41140, partNo: 'VC-101128',   productName: '6MM SQUARE ROD-83MM',                          qtyV: 100, planDate: '27/03/2026', requireDate: '30/03/2026', rejectionDate: '31/03/2026', rejectionPerson: 'ERP1', rejectionReason: 'Dimension out of tolerance' },
]

export default function RejectedJobList() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [rows, setRows] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)

  useEffect(() => {
    // Load rejected jobs from WaitingForApproval localStorage overrides + seed
    const overrides = JSON.parse(localStorage.getItem('velson_wfa_overrides') || '{}')
    const rejectedFromWFA = Object.entries(overrides)
      .filter(([, v]) => v.rejected)
      .map(([jobNo]) => ({
        jobNo: Number(jobNo),
        partNo: 'N/A',
        productName: 'Rejected from Waiting For Approval',
        qtyV: '-',
        planDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
        requireDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
        rejectionDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
        rejectionPerson: 'ERP1',
        rejectionReason: 'Rejected via Waiting For Approval',
      }))
    setRows([...SEED_REJECTED, ...rejectedFromWFA])
  }, [])

  const handleSearch = () => toast.info(`Showing ${rows.length} rejected job(s).`)
  const handleExcel = () => toast.info(`Exporting ${rows.length} records to Excel...`)
  const handlePdf   = () => toast.info('Generating PDF...')

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Rejected Job List</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Rejection Job List</h2>
              <span className="ml-1 text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{rows.length} records</span>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Filter + Toolbar Row ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">From Date :</span>
                <FilterInput type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">To Date :</span>
                <FilterInput type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
              </div>
              <button onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <Search size={13} /> Search
              </button>

              {/* Right toolbar */}
              <div className="ml-auto flex items-center gap-3 text-slate-500">
                <span className="text-[11px] font-bold">LS {rows.length}</span>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-800 transition-colors"><Printer size={13} /> Dos</button>
                <button onClick={handleExcel} className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"><FileSpreadsheet size={13} /> Excel</button>
                <button onClick={handlePdf}   className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"><FileText size={13} /> Pdf</button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-700 transition-colors"><Filter size={13} /> Filter</button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-700 transition-colors"><Settings size={13} /> Setting</button>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-12 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16">Job No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Product Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-14 text-center">Qty/V</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Plan Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Require Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Rejection Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Rejection Person</th>
                      <th className="px-3 py-2.5">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-20 text-center text-slate-300">
                          <p className="text-[11px] font-bold uppercase tracking-widest">Row : 0</p>
                          <p className="text-[11px] text-slate-400 mt-1">No rejected jobs in selected date range</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => {
                        const isSelected = selectedRow === i
                        return (
                          <tr key={i} onClick={() => setSelectedRow(i)}
                            className={`h-9 transition-colors cursor-pointer text-[12px] ${
                              isSelected ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-red-50/30' : 'bg-slate-50/50 hover:bg-red-50/30'
                            }`}>
                            <td className="px-3 py-1 border-r border-slate-100 text-center font-bold text-slate-400">{i + 1}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 font-bold ${isSelected ? '' : 'text-slate-700'}`}>{r.jobNo}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSelected ? '' : 'text-[#0097A7]'}`}>{r.partNo}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[260px] ${isSelected ? '' : 'text-slate-700'}`}>{r.productName}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSelected ? '' : 'text-slate-600'}`}>{r.qtyV}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 text-center ${isSelected ? '' : 'text-slate-500'}`}>{r.planDate}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 text-center ${isSelected ? '' : 'text-slate-500'}`}>{r.requireDate}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 text-center ${isSelected ? '' : 'text-red-500 font-bold'}`}>{r.rejectionDate}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 font-semibold ${isSelected ? '' : 'text-slate-600'}`}>{r.rejectionPerson}</td>
                            <td className={`px-3 py-1 italic ${isSelected ? '' : 'text-slate-500'}`}>{r.rejectionReason}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer summary */}
              <div className="flex items-center border-t border-slate-200 bg-slate-50 px-3 py-1.5 gap-8 text-[11px] font-bold text-slate-500">
                <span>Row : {rows.length}</span>
                <span>{rows.reduce((s, r) => s + (Number(r.qtyV) || 0), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
