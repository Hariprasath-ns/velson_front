import { useState } from 'react'
import { ChevronRight, X, Search, FileText, Image } from 'lucide-react'
import { useToast } from '../components/Toast'

const LabelInput = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{label} :</span>
    {children}
  </div>
)

const DatePicker = ({ value, onChange }) => (
  <input type="date" value={value} onChange={onChange}
    className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36" />
)

const JOB_STATUS_OPTIONS = ['Waiting for Process', 'In Process', 'Close']

const SEED = [
  { sno: 1,  jobNo: 41432, barcode: '2432/2026',     partNo: 'VGH-1002109', partName: 'V10 SOLAR MAST TILTING MOUNT BASE FRAME',       createdDate: '15-04-2026 09:12:12', processCardStatus: 'Waiting for Process' },
  { sno: 2,  jobNo: 41433, barcode: '052433/2026',   partNo: 'VGH-1003450', partName: 'D50 HITACHI 210 HAND RAIL FRAME 1 COVER PLATE 1', createdDate: '15-04-2026 09:16:34', processCardStatus: 'Waiting for Process' },
  { sno: 3,  jobNo: 41434, barcode: '2434/2026',     partNo: 'VGH-1002457', partName: 'V10 7.7 MTR MASTER ARM PLATE TILTING SU',          createdDate: '15-04-2026 09:17:11', processCardStatus: 'Waiting for Process' },
  { sno: 4,  jobNo: 41435, barcode: '052435/2026',   partNo: 'VGH-1003451', partName: 'D50 HITACHI 210 HAND RAIL FRAME 2 COVER PLATE 1', createdDate: '15-04-2026 09:17:20', processCardStatus: 'Waiting for Process' },
  { sno: 5,  jobNo: 41436, barcode: '2436/2026',     partNo: 'VGH-1003452', partName: 'D50 HITACHI 210 HAND RAIL FRAME 3 COVER PLATE 1', createdDate: '15-04-2026 09:18:01', processCardStatus: 'Waiting for Process' },
  { sno: 6,  jobNo: 41437, barcode: '2437/2026',     partNo: 'VGH-1002456', partName: 'V10 7.7 MTR MASTER ARM PLATE TILTING SU',          createdDate: '15-04-2026 09:18:31', processCardStatus: 'Waiting for Process' },
  { sno: 7,  jobNo: 41438, barcode: '052438/2026',   partNo: 'VGH-1003453', partName: 'D50 HITACHI 210 HAND RAIL FRAME 4 COVER PLATE 1', createdDate: '15-04-2026 09:18:56', processCardStatus: 'Waiting for Process' },
  { sno: 8,  jobNo: 41439, barcode: '2439/2026',     partNo: 'VGH-1001283', partName: 'V10 COMPRESSOR SMALL TOOLS BOX FRAME CH',          createdDate: '15-04-2026 09:20:41', processCardStatus: 'Waiting for Process' },
  { sno: 9,  jobNo: 41439, barcode: '2440/2026',     partNo: 'VGH-1001284', partName: 'V10 COMPRESSOR SMALL TOOLS BOX FRAME CH',          createdDate: '15-04-2026 09:20:52', processCardStatus: 'Waiting for Process' },
  { sno: 10, jobNo: 41440, barcode: '2441/2026',     partNo: 'VGH-1001128', partName: '6MM SQUARE ROD-80MM',                              createdDate: '15-04-2026 09:27:27', processCardStatus: 'Waiting for Process' },
  { sno: 11, jobNo: 41441, barcode: '2442/2026',     partNo: 'VG-21905',    partName: 'M1 YTYPE 110 BOTTOM OIL SEAL FLANGE',              createdDate: '15-04-2026 09:29:16', processCardStatus: 'Waiting for Process' },
  { sno: 12, jobNo: 41442, barcode: '2443/2026',     partNo: 'VE-70805',    partName: 'CABIN ELECTRICAL BOX PLATE 6',                     createdDate: '15-04-2026 09:30:28', processCardStatus: 'Waiting for Process' },
  { sno: 13, jobNo: 41443, barcode: '2444/2026',     partNo: 'VCS-300471',  partName: 'V3 TRACK OPERATED JOYSTIC MOUNT PLATE 4',          createdDate: '15-04-2026 09:33:42', processCardStatus: 'Waiting for Process' },
  { sno: 14, jobNo: 41444, barcode: '2445/2026',     partNo: 'VC-100923',   partName: 'LW MASTER ROPE & CHAIN MOUNT ROPE BED P',          createdDate: '15-04-2026 09:35:04', processCardStatus: 'Waiting for Process' },
  { sno: 15, jobNo: 41445, barcode: '052446/2026',   partNo: 'VGH-1000564', partName: 'V10 6MTR TILTING MASTER ROPE LAYING ASSM',         createdDate: '15-04-2026 10:43:17', processCardStatus: 'Waiting for Process' },
  { sno: 16, jobNo: 41446, barcode: '052447/2026',   partNo: 'VGH-1004438', partName: 'LW TILT MAST HOSE SLIDING PIPE 40',                createdDate: '15-04-2026 13:53:44', processCardStatus: 'Waiting for Process' },
  { sno: 17, jobNo: 41447, barcode: '052448/2026',   partNo: 'VGH-1004439', partName: 'LW TILT MAST HOSE SLIDING PIPE 32',                createdDate: '15-04-2026 13:54:35', processCardStatus: 'Waiting for Process' },
  { sno: 18, jobNo: 41448, barcode: '052449/2026',   partNo: 'VGH-1004441', partName: 'LW TILT MAST HOSE SLIDING PIPE 20MM PIN 75MM',     createdDate: '15-04-2026 13:55:18', processCardStatus: 'Waiting for Process' },
]

export default function JobEntryClosed() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [jobStatus, setJobStatus] = useState('Close')
  const [remark, setRemark] = useState('')
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [rows] = useState(SEED)
  const [partImage] = useState(null)

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    setSelectedRows(checked ? new Set(rows.map((_, i) => i)) : new Set())
  }

  const handleRowSelect = (i, checked) => {
    const next = new Set(selectedRows)
    checked ? next.add(i) : next.delete(i)
    setSelectedRows(next)
    setSelectAll(next.size === rows.length)
  }

  const handleSearch = () => {
    toast.info(`Searching ${jobStatus} jobs from ${fromDate} to ${toDate}`)
  }

  const handleClosedRouteCard = () => {
    const sel = [...selectedRows]
    if (!sel.length) { toast.warning('Please select at least one row.'); return }
    toast.success(`Closed Route Card for ${sel.length} job(s).`)
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Job Entry Closed</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Job Entry Closed</h2>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* Filter Row 1: From Date, To Date, Search, Closed Route Card | Part Image */}
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex flex-col gap-2 flex-1">
                {/* Row 1 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <LabelInput label="From Date">
                    <DatePicker value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </LabelInput>
                  <LabelInput label="To Date">
                    <DatePicker value={toDate} onChange={e => setToDate(e.target.value)} />
                  </LabelInput>
                  <button onClick={handleSearch}
                    className="flex items-center gap-1.5 px-4 py-[5px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                    <Search size={13} /> Search
                  </button>
                  <button onClick={handleClosedRouteCard}
                    className="flex items-center gap-1.5 px-4 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                    <FileText size={13} /> Closed Route Card
                  </button>
                </div>
                {/* Row 2 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <LabelInput label="Job Status">
                    <select value={jobStatus} onChange={e => setJobStatus(e.target.value)}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-44">
                      {JOB_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </LabelInput>
                  <LabelInput label="Remark's">
                    <input type="text" value={remark} onChange={e => setRemark(e.target.value)}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-64" />
                  </LabelInput>
                </div>
              </div>

              {/* Part Image Panel */}
              <div className="border border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center w-36 h-24 shrink-0">
                <span className="text-[11px] font-bold text-slate-500 mb-1">Part Image</span>
                {partImage
                  ? <img src={partImage} alt="Part" className="max-h-16 max-w-full object-contain" />
                  : <Image size={28} className="text-slate-300" />
                }
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="selectAll" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#0097A7] cursor-pointer" />
              <label htmlFor="selectAll" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">Select All</label>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[980px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-8 text-center">Select</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-10 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16">Job_No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Barcode</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part_No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-36">Created_Date</th>
                      <th className="px-3 py-2.5">Process_Card_Status</th>
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
                              className="w-3.5 h-3.5 accent-[#0097A7] cursor-pointer" />
                          </td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-400'}`}>{r.sno}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-bold ${isSel ? '' : 'text-slate-700'}`}>{r.jobNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[11px] ${isSel ? '' : 'text-slate-600'}`}>{r.barcode}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-[#0097A7]'}`}>{r.partNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[260px] ${isSel ? '' : 'text-slate-700'}`}>{r.partName}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.createdDate}</td>
                          <td className={`px-3 py-1 text-[11px] ${isSel ? '' : 'text-slate-600'}`}>{r.processCardStatus}</td>
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
