import { useState, useRef } from 'react'
import { ChevronRight, X, FileSpreadsheet, Upload, Eye } from 'lucide-react'
import { useToast } from '../components/Toast'

const FL = ({ children }) => (
  <td className="bg-[#dce3ea] border border-slate-300 px-2 py-[5px] text-[11px] font-bold text-slate-700 whitespace-nowrap">{children}</td>
)
const FC = ({ children, colSpan = 1 }) => (
  <td colSpan={colSpan} className="border border-slate-300 px-1 py-[3px] bg-white">{children}</td>
)
const TI = ({ value, onChange, placeholder = '', type = 'text', readOnly = false }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
    className={`w-full px-2 py-[4px] text-[12px] border-none outline-none bg-transparent text-slate-700 placeholder-slate-400 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`} />
)
const TS = ({ value, onChange, options, placeholder = '-- Select --' }) => (
  <select value={value} onChange={onChange}
    className="w-full px-2 py-[4px] text-[12px] border-none outline-none bg-transparent text-slate-700 cursor-pointer">
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
)

const JOB_NO_OPTIONS = [
  '4479 - 5050/2023 - VGH-10060315 - DEVICE COVER 3',
  '4506 - 5081/2023 - VCV-900113 - V9 RC LH RH NUT',
  '4516 - 5092/2023 - VCD-500613 - EX CD 140 SCREW ROD LOCK',
  '4536 - 5118/2023 - VGH-1000413 - V10 MASTER LOCK SETUP PLATE',
  '4536 - 5119/2023 - VGH-1000418 - V10-9.5MTR MASTER-MASTER ARM',
  '4536 - 5120/2023 - VGH-1000419 - V10 MASTER LOCK SETUP PLATE 2',
  '4536 - 5121/2023 - VGH-1000420 - V10-9.5MTR MASTER-MASTER ARM 2',
  '4536 - 5122/2023 - VGH-1000410 - MASTER LOCK SETUP PLATE ASSY',
  '4537 - 5123/2023 - VGH-10060320 - HMD CONTROL BOX 60X40X4MM',
  '4538 - 5124/2023 - VGH-10060321 - HMD CONTROL BOX 60X40X4MM 2',
  '4539 - 5125/2023 - VGH-10060322 - TUBE SQUARE 40X40X4MM PIPE 1',
  '4539 - 5126/2023 - VGH-10060323 - TUBE SQUARE 40X40X4MM PIPE 2',
  '4539 - 5127/2023 - VGH-10060324 - PLATE 5X30X30',
  '4540 - 5128/2023 - VGH-10060326 - HMD STAND 1-2 INCH WASHER',
  '4541 - 5129/2023 - VGH-10060327 - HMD STAND PATTA 2',
  '4542 - 5130/2023 - VGH-10060328 - HMD STAND PATTA 2',
  '4543 - 5131/2023 - VGH-10060329 - HMD CONTROL BOX FRAME',
  '4550 - 5138/2023 - VRC-601829 - GRC TOP WINCH STOPPER PLATE',
  '4561 - 5149/2023 - VGH-1001659 - SUPPORT BAR - 600MM',
  '4569 - 5158/2023 - VGH-1002006 - ARM PLATE JOINT PIN LOCK',
  '4573 - 5162/2023 - VGH-1002009 - MASTER TILTING SHAFT SUPPORT',
  '4576 - 5167/2023 - VGH-1002012 - ARM PLATE BUSH SUPPORT',
  '4581 - 5174/2023 - VGH-1001667 - V10 SOLAR TILTING MAST PLATE 1',
  '4581 - 5175/2023 - VGH-1001668 - V10 SOLAR TILTING MAST PLATE 2',
  '4591 - 5186/2023 - VGH-1002736 - V10 JCB LEVEL JACKEY SUPPORT 1',
  '4591 - 5187/2023 - VGH-1002736 - V10 JCB LEVEL JACKEY SUPPORT 2',
  '4600 - 5197/2023 - VGH-1001352 - FLOAT TILTING JOINT',
  '4619 - 5218/2023 - VC-105323 - V3 1.75 INCH CHAIN TIGHT TOP',
  '4620 - 5219/2023 - VC-105324 - V3 1.5 INCH CHAIN TIGHT THREAD',
]

const STATUS_OPTIONS = ['QC REJECT', 'QC REWORK', 'QC OK', 'MSCRAB']

const INSP_COLS = ['ID','Part No','Part Name','Specification','Type','Min','Max','Equal','Text','Check Method','Actual','Result','Remark']
const QC_COLS   = ['ID','Job.No','Barcode','Part No','Part Name','Job Qty','Qty','Unit Rate','QC OK Qty','Reject Qty','Document']

export default function JobQCEntry() {
  const toast   = useToast()
  const fileRef = useRef(null)

  const todayISO = new Date().toISOString().split('T')[0]

  const [jobNoText,     setJobNoText]     = useState('')
  const [jobNoSel,      setJobNoSel]      = useState('')
  const [jobQty,        setJobQty]        = useState('')
  const [productionQty, setProductionQty] = useState('')
  const [jobDate,       setJobDate]       = useState(todayISO)
  const [barcode,       setBarcode]       = useState('')
  const [balanceQty,    setBalanceQty]    = useState('')
  const [testFileName,  setTestFileName]  = useState('')
  const [testFile,      setTestFile]      = useState(null)
  const [status,        setStatus]        = useState('')
  const [qcRemark,      setQcRemark]      = useState('')
  const [revNo,         setRevNo]         = useState('')
  const [revDate,       setRevDate]       = useState('')
  const [testStatus]                      = useState('--')

  const handleBrowse = () => fileRef.current?.click()
  const handleFileChange = e => {
    const f = e.target.files?.[0]
    if (f) { setTestFileName(f.name); setTestFile(f) }
  }
  const handleUpload = () => {
    if (!testFile) { fileRef.current?.click(); return }
    toast.success(`"${testFile.name}" uploaded successfully.`)
  }
  const handleView = () => {
    if (!testFile) { toast.warning('No test report file selected.'); return }
    const url = URL.createObjectURL(testFile)
    window.open(url, '_blank')
  }

  const handleValidate = () => {
    if (!jobNoText && !jobNoSel) { toast.warning('Job No is required.'); return }
    toast.success('QC Entry validated successfully!')
  }
  const handleReject   = () => toast.warning('Job rejected.')
  const handleApproval = () => toast.info('Approval GRN process started.')

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Job QC Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Job QC Entry</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toast.info('Exporting Excel...')}
                className="flex items-center gap-1 px-3 py-1 text-emerald-600 hover:text-emerald-700 text-[11px] font-bold border border-emerald-300 rounded transition-all">
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600 text-[11px] font-bold border border-slate-200 rounded hover:border-red-300 transition-all">
                <X size={13} /> Close
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Form ── */}
            <table className="w-full border-collapse text-[12px]">
              <tbody>
                {/* Row 1: * Job No | Job Qty */}
                <tr>
                  <FL><span className="text-red-600">*</span> Job No :</FL>
                  <FC><TI value={jobNoText} onChange={e => setJobNoText(e.target.value)} placeholder="" /></FC>
                  <FL>Job Qty :</FL>
                  <FC colSpan={3}><TI value={jobQty} onChange={e => setJobQty(e.target.value)} /></FC>
                </tr>
                {/* Row 2: Job No (dropdown) | Production Qty */}
                <tr>
                  <FL>Job No :</FL>
                  <FC colSpan={3}>
                    <select value={jobNoSel} onChange={e => setJobNoSel(e.target.value)}
                      className="w-full px-2 py-[4px] text-[12px] border-none outline-none bg-transparent text-slate-700 cursor-pointer">
                      <option value=""></option>
                      {JOB_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FC>
                  <FL>Production Qty :</FL>
                  <FC><TI value={productionQty} onChange={e => setProductionQty(e.target.value)} /></FC>
                </tr>
                {/* Row 3: Job Date | Barcode | Balance Qty */}
                <tr>
                  <FL>Job Date :</FL>
                  <FC>
                    <input type="date" value={jobDate} onChange={e => setJobDate(e.target.value)}
                      className="w-full px-2 py-[4px] text-[12px] border-none outline-none bg-transparent text-slate-700" />
                  </FC>
                  <FL>Barcode :</FL>
                  <FC><TI value={barcode} onChange={e => setBarcode(e.target.value)} /></FC>
                  <FL>Balance Qty :</FL>
                  <FC><TI value={balanceQty} onChange={e => setBalanceQty(e.target.value)} readOnly /></FC>
                </tr>
                {/* Row 4: Test Report | Status */}
                <tr>
                  <FL>Test Report :</FL>
                  <FC colSpan={2}>
                    <div className="flex items-center gap-1 px-1">
                      <input type="text" value={testFileName} readOnly placeholder="File Name"
                        className="flex-1 px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-slate-50 text-slate-500 placeholder-slate-400 outline-none" />
                      <button onClick={handleBrowse}
                        className="px-3 py-[3px] text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded border border-slate-300 transition-all whitespace-nowrap">
                        Browse
                      </button>
                      <span className="text-[11px] text-slate-400 px-1">--</span>
                      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                    </div>
                  </FC>
                  <FL>Status</FL>
                  <FC colSpan={2}>
                    <TS value={status} onChange={e => setStatus(e.target.value)} options={STATUS_OPTIONS} />
                  </FC>
                </tr>
                {/* Row 5: Upload / View */}
                <tr>
                  <td colSpan={6} className="border border-slate-300 bg-white px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <button onClick={handleUpload}
                        className="flex items-center gap-1.5 px-4 py-[5px] bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded border border-slate-300 transition-all active:scale-95">
                        <Upload size={12} /> Upload Test Report
                      </button>
                      <button onClick={handleView}
                        className="flex items-center gap-1.5 px-4 py-[5px] bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded border border-slate-300 transition-all active:scale-95">
                        <Eye size={12} /> View Test Report
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Income Inspection Standard ── */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <div className="bg-white px-3 py-1.5 border-b border-slate-300">
                <span className="text-[12px] font-bold text-slate-700">Income Inspection Standard</span>
              </div>
              <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 1100 }}>
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      {INSP_COLS.map((h, i) => (
                        <th key={h} className={`px-3 py-2 ${i < INSP_COLS.length - 1 ? 'border-r border-blue-400' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr><td colSpan={INSP_COLS.length} className="px-3 py-6 text-center text-[11px] text-slate-300">&nbsp;</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Test Status + QC Table ── */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <div className="flex items-center justify-end bg-white px-3 py-1.5 border-b border-slate-300 gap-2">
                <span className="text-[11px] font-bold text-slate-600">Test Status :</span>
                <span className="text-[11px] text-slate-500">{testStatus}</span>
              </div>
              <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 1000 }}>
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      {QC_COLS.map((h, i) => (
                        <th key={h} className={`px-3 py-2 ${i < QC_COLS.length - 1 ? 'border-r border-blue-400' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr><td colSpan={QC_COLS.length} className="px-3 py-6 text-center text-[11px] text-slate-300">&nbsp;</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="border border-slate-300 rounded bg-white">
              <div className="flex items-center gap-4 px-3 py-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">QC Remark</span>
                  <input type="text" value={qcRemark} onChange={e => setQcRemark(e.target.value)}
                    className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-52" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Rev No :</span>
                  <input type="text" value={revNo} onChange={e => setRevNo(e.target.value)}
                    className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Rev Date :</span>
                  <input type="text" value={revDate} onChange={e => setRevDate(e.target.value)}
                    className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-28" />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={handleValidate}
                    className="px-4 py-[5px] bg-[#1A76D1] hover:bg-[#1560b0] text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                    Validate
                  </button>
                  <button onClick={handleReject}
                    className="px-4 py-[5px] bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                    Reject
                  </button>
                  <button onClick={handleApproval}
                    className="px-4 py-[5px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-all active:scale-95 shadow-sm">
                    Approval GRN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
