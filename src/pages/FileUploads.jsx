import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Search, X, FileSpreadsheet, FileText, Filter, Settings, Printer, Upload, Eye, RefreshCw } from 'lucide-react'
import { useToast } from '../components/Toast'

const FilterInput = ({ value, onChange, type = 'text', className = '' }) => (
  <input type={type} value={value} onChange={onChange}
    className={`px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all ${className}`} />
)
const TSelect = ({ options, value, onChange, placeholder = '', className = '' }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={onChange}
      className="w-full px-2 py-[5px] pr-6 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
)

const STORAGE_KEY = 'velson_file_uploads'

// Job numbers matching the legacy dropdown (504–532+)
const JOB_NOS = Array.from({ length: 60 }, (_, i) => String(500 + i))

const now = () => new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
const nowFull = () => {
  const d = new Date()
  return d.toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function FileUploads() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]
  const fileRef = useRef(null)

  const [jobNo, setJobNo] = useState('')
  const [date, setDate] = useState(today)
  const [docName, setDocName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [rows, setRows] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [viewFile, setViewFile] = useState(null)   // for inline preview

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setRows(saved)
  }, [])

  const handleBrowse = () => fileRef.current?.click()

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setSelectedFile(f)
      if (!docName) setDocName(f.name)
    }
  }

  const handleUpload = () => {
    if (!jobNo)        { toast.warning('Please select a Job No.'); return }
    if (!selectedFile) { toast.warning('Please browse and select a file to upload.'); return }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const entry = {
        id: Date.now(),
        jobNo,
        jobDate: date,
        fileName: selectedFile.name,
        fileLocation: 'Local Storage',
        createdBy: 'ERP1',
        createdDate: nowFull(),
        deletedBy: '',
        deletedDate: '',
        status: 'Active',
        industryType: 'Manufacturing',
        drawingNo: '',
        revisionNo: '1',
        image: selectedFile.type.startsWith('image/') ? ev.target.result : null,
        dataUrl: ev.target.result,
        itemId: '',
        itemName: docName || selectedFile.name,
        barcode: '',
        fileType: selectedFile.type,
      }
      const updated = [entry, ...rows]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setRows(updated)
      toast.success(`File "${selectedFile.name}" uploaded successfully!`)
      // Reset
      setSelectedFile(null)
      setDocName('')
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleViewFile = () => {
    if (selectedRow === null) { toast.warning('Please select a row to view.'); return }
    const row = rows.find(r => r.id === selectedRow)
    if (!row) { toast.warning('No file found.'); return }
    setViewFile(row)
  }

  const handleShow = () => {
    toast.info(`Showing ${rows.length} record(s).`)
  }

  const handleRefresh = () => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setRows(saved)
    toast.info('Refreshed.')
  }

  const handleExcel = () => toast.info(`Exporting ${rows.length} records to Excel...`)
  const handlePdf   = () => toast.info('Generating PDF...')

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">File Uploads</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">File Upload</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <RefreshCw size={12} /> Refresh
              </button>
              <button onClick={handleExcel} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <FileSpreadsheet size={12} /> Excel
              </button>
              <button className="text-slate-400 hover:text-red-600 transition-colors ml-1"><X size={20} strokeWidth={2.5} /></button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Top Form ── */}
            <div className="grid grid-cols-12 gap-4 items-end">
              {/* Left: Job No + Date */}
              <div className="col-span-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap w-16 text-right">Job No :</span>
                  <TSelect options={JOB_NOS} value={jobNo} onChange={e => setJobNo(e.target.value)} placeholder="--- Select ---" className="flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap w-16 text-right">Date :</span>
                  <FilterInput type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
                </div>
              </div>

              {/* Middle: Upload Document Name + Browse */}
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Upload Document Name</span>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={docName}
                      onChange={e => setDocName(e.target.value)}
                      placeholder="File Name"
                      className="flex-1 px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all"
                    />
                    <button onClick={handleBrowse}
                      className="px-3 py-[5px] text-[11px] font-bold border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-600 transition-all whitespace-nowrap">
                      Browse
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {selectedFile ? `✓ ${selectedFile.name}` : '---'}
                    </span>
                    <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              </div>

              {/* Right: Upload File + View File */}
              <div className="col-span-3 flex items-end gap-2 justify-end">
                <button onClick={handleUpload}
                  className="flex items-center gap-1.5 px-4 py-[6px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                  <Upload size={13} /> Upload File
                </button>
                <button onClick={handleViewFile}
                  className="flex items-center gap-1.5 px-4 py-[6px] bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                  <Eye size={13} /> View File
                </button>
              </div>
            </div>

            {/* ── Date Filter + Toolbar ── */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">From Date :</span>
                <FilterInput type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">To Date :</span>
                <FilterInput type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
              </div>
              <button onClick={handleShow}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                Show
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

            {/* ── Inline file preview panel ── */}
            {viewFile && (
              <div className="border border-[#0097A7] rounded-xl p-3 bg-[#0097A7]/5 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-[#0097A7] uppercase mb-1">Viewing: {viewFile.fileName}</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-[11px] text-slate-600">
                    <span><b>Job No:</b> {viewFile.jobNo}</span>
                    <span><b>Job Date:</b> {viewFile.jobDate}</span>
                    <span><b>Status:</b> {viewFile.status}</span>
                    <span><b>Created By:</b> {viewFile.createdBy}</span>
                    <span><b>Created Date:</b> {viewFile.createdDate}</span>
                    <span><b>Revision No:</b> {viewFile.revisionNo}</span>
                  </div>
                  {viewFile.image && (
                    <img src={viewFile.image} alt="preview" className="mt-2 max-h-40 object-contain rounded border border-slate-200 bg-white p-1" />
                  )}
                  {!viewFile.image && viewFile.dataUrl && (
                    <p className="mt-2 text-[11px] text-slate-500 italic">Binary file — cannot preview inline.</p>
                  )}
                </div>
                <button onClick={() => setViewFile(null)} className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"><X size={16} /></button>
              </div>
            )}

            {/* ── Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-12 text-center">ID</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-16">Job_No</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-24">Job_Date</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-36">File_Name</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-28">File_Location</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-20">Created_By</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-32">Created_Dat</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-20">Deleted_By</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-24">Deleted_Date</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-16">Status</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-28">Industry_Typ</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-24">Drawing_No</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-20">Revision_No</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-16 text-center">Image</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-16">Item_Id</th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-36">Item_Name</th>
                      <th className="px-2 py-2.5 w-24">barcode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="py-16 text-center text-slate-300">
                          <Upload size={36} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
                          <p className="text-[11px] font-bold uppercase tracking-widest">Row : 0</p>
                          <p className="text-[11px] text-slate-400 mt-1">No files uploaded yet. Select a Job No and upload a file.</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => {
                        const isSel = selectedRow === r.id
                        return (
                          <tr key={r.id} onClick={() => setSelectedRow(r.id)}
                            className={`h-9 transition-colors cursor-pointer text-[11px] ${isSel ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}>
                            <td className={`px-2 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-400'}`}>{i + 1}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 font-bold ${isSel ? '' : 'text-slate-700'}`}>{r.jobNo}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-500'}`}>{r.jobDate}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 truncate max-w-[140px] font-semibold ${isSel ? '' : 'text-[#0097A7]'}`}>{r.fileName}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-400'}`}>{r.fileLocation}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-600'}`}>{r.createdBy}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-500'}`}>{r.createdDate}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-400'}`}>{r.deletedBy}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-400'}`}>{r.deletedDate}</td>
                            <td className="px-2 py-1 border-r border-slate-100">
                              {isSel
                                ? <span className="font-bold">{r.status}</span>
                                : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">{r.status}</span>
                              }
                            </td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-500'}`}>{r.industryType}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-400'}`}>{r.drawingNo}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 text-center ${isSel ? '' : 'text-slate-500'}`}>{r.revisionNo}</td>
                            <td className="px-2 py-1 border-r border-slate-100 text-center">
                              {r.image
                                ? <img src={r.image} alt="" className="h-6 w-6 object-cover rounded mx-auto" />
                                : <span className={`${isSel ? '' : 'text-slate-300'}`}>—</span>
                              }
                            </td>
                            <td className={`px-2 py-1 border-r border-slate-100 ${isSel ? '' : 'text-slate-400'}`}>{r.itemId}</td>
                            <td className={`px-2 py-1 border-r border-slate-100 truncate max-w-[140px] ${isSel ? '' : 'text-slate-600'}`}>{r.itemName}</td>
                            <td className={`px-2 py-1 ${isSel ? '' : 'text-slate-400'}`}>{r.barcode}</td>
                          </tr>
                        )
                      })
                    )}
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
