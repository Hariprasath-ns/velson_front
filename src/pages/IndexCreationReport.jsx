import { useState, useEffect, useCallback, Fragment } from 'react'
import api from '../services/api'
import {
  ChevronRight, Search, Printer, X, Download,
  FileSpreadsheet, FileJson, Image as ImageIcon, RotateCcw,
  Edit, Trash2, Info, Loader2, Eye
} from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const isImageHeader = (h) => {
  if (!h) return false
  const lower = h.toLowerCase()
  return lower.includes('image') || lower.includes('diagram') || lower.includes('pic') || lower.includes('photo')
}

const resolveImageSrc = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 64) {
    return `data:image/png;base64,${trimmed}`;
  }
  return '';
}


export default function IndexCreationReport() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [modelName, setModelName] = useState('')
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searching, setSearching] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailRow, setDetailRow] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [reportPopupImage, setReportPopupImage] = useState(null)
  const [viewModelImage, setViewModelImage] = useState(null)
  const [hoverImage, setHoverImage] = useState(null) // { src, x, y }


  const fetchIndices = useCallback(async () => {
    try {
      const res = await api.get(`/api/index-creation?_t=${Date.now()}`)
      const records = res.data?.data || []
      setData(records)
      setFilteredData(records)
    } catch {
      setData([])
      setFilteredData([])
    }
  }, [])

  useEffect(() => {
    fetchIndices()
  }, [fetchIndices])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      const start = new Date(fromDate)
      const end = new Date(toDate)
      end.setHours(23, 59, 59, 999)
      const result = data.filter(r => {
        const d = new Date(r.date)
        const dateMatch = d >= start && d <= end
        const modelMatch = modelName ? r.model === modelName : true
        return dateMatch && modelMatch
      })
      setFilteredData(result)
      setSearching(false)
    }, 300)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/index-creation/${confirmDelete}`)
      toast.success('Index deleted.')
      setConfirmDelete(null)
      setData(prev => prev.filter(r => r.id !== confirmDelete))
      setFilteredData(prev => prev.filter(r => r.id !== confirmDelete))
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete index.')
    } finally {
      setDeleting(false)
    }
  }

  const expandedRowData = expandedRow ? filteredData.find(r => r.id === expandedRow) : null

  const handleEdit = row => {
    localStorage.setItem('velson:index-creation-edit', String(row.id))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'IndexCreation' } }))
  }

  const handleDeleteConfirm = id => setConfirmDelete(id)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Index Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Index Creation Registry</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <Printer size={16} /> Print Records
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-8 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 items-center">
              <div className="col-span-8 space-y-4">
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Label>From Date :</Label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40 shadow-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>To Date :</Label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40 shadow-sm" />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 px-8 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-md transition-all active:scale-95 whitespace-nowrap"
                  >
                    {searching ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
                    Search
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2"><Label>Model Name :</Label></div>
                  <div className="col-span-10">
                    <Select
                      options={Array.from(new Set(data.map(r => r.model).filter(Boolean)))}
                      placeholder="--- All Models ---"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center pt-3">
                  <div className="col-span-2"><Label>Actions :</Label></div>
                  <div className="col-span-10 flex items-center gap-3">
                    <button
                      onClick={() => expandedRowData && setDetailRow(expandedRowData)}
                      disabled={!expandedRowData}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Eye size={15} /> View
                    </button>
                    <button
                      onClick={() => expandedRowData && handleEdit(expandedRowData)}
                      disabled={!expandedRowData}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Edit size={15} /> Edit
                    </button>
                    <button
                      onClick={() => expandedRowData && handleDeleteConfirm(expandedRowData.id)}
                      disabled={!expandedRowData}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-bold rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-8">
                {expandedRowData ? (
                  expandedRowData.hasImage ? (
                    <div className="text-center w-full">
                      <div
                        className="w-full max-w-[260px] aspect-square bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-md bg-slate-50 cursor-pointer hover:shadow-lg hover:border-[#0097A7]/40 transition-all duration-200 mx-auto"
                        onClick={() => setViewModelImage(`/api/index-creation/${expandedRowData.id}/download-image`)}
                      >
                        <img
                          src={`/api/index-creation/${expandedRowData.id}/download-image`}
                          alt="Model Preview"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <p className="text-[12px] font-black text-[#0097A7] mt-4 uppercase tracking-widest">
                        {expandedRowData.modelNo}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center group">
                      <div className="w-36 h-36 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
                        <ImageIcon size={52} />
                      </div>
                      <p className="text-[11px] font-black text-slate-400 mt-3 uppercase tracking-widest">No Image</p>
                    </div>
                  )
                ) : (
                  <div className="text-center group cursor-pointer">
                    <div className="w-36 h-36 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-200 group-hover:border-[#0097A7] group-hover:text-[#0097A7] transition-all">
                      <ImageIcon size={52} />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 mt-3 uppercase tracking-widest">Select record</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-right justify-between mb-4">
              <div className="flex items-right gap-2">
                {[
                  { icon: <Download size={14} />, l: 'CSV' },
                  { icon: <FileSpreadsheet size={14} />, l: 'Excel' },
                  { icon: <FileJson size={14} />, l: 'JSON' },
                ].map(tool => (
                  <button key={tool.l} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-[#0097A7] text-[11px] font-bold uppercase transition-all">
                    {tool.icon} {tool.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 border-r border-slate-100 w-16 text-center">S.No</th>
                    <th className="px-5 py-4 border-r border-slate-100">Index No</th>
                    <th className="px-5 py-4 border-r border-slate-100">Model Name</th>
                    <th className="px-5 py-4 border-r border-slate-100">Model No</th>
                    <th className="px-5 py-4 border-r border-slate-100">Creation By</th>
                    <th className="px-5 py-4 border-r border-slate-100">Creation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[12.5px]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-300 italic text-sm">
                        No records match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <Fragment key={row.id}>
                        <tr 
                          onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} 
                          className="hover:bg-[#0097A7]/5 transition-colors h-14 group cursor-pointer"
                        >
                          <td className="px-5 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-black text-[#0097A7] uppercase">{String(row.indexNo).padStart(3, '0')}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-700">{row.model}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-medium text-slate-600">{row.modelNo}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-medium text-slate-600">{row.createdBy || '—'}</td>
                          <td className="px-5 py-2 border-r border-slate-50 text-slate-500 font-bold">{row.date?.split('T')[0] || row.date}</td>
                        </tr>
                        {expandedRow === row.id && (
                          <tr>
                            <td colSpan={6} className="p-0 border-b border-slate-200">
                              <div className="bg-slate-50/80 p-6 shadow-inner border-t border-slate-200 overflow-x-auto">
                                <h4 className="text-[12px] font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                                  <FileSpreadsheet size={16} className="text-[#0097A7]" /> Excel Data Preview
                                </h4>
                                {(() => {
                                  const raw = row.excelData;
                                  const excelRows = raw && Array.isArray(raw)
                                    ? raw
                                    : raw && raw.excelData && Array.isArray(raw.excelData)
                                      ? raw.excelData
                                      : null;
                                  return excelRows && excelRows.length > 0 ? (
                                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                      <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                                        <tr>
                                          {Object.keys(excelRows[0] || {}).filter(k => k !== '_rowNum').map(header => (
                                            <th key={header} className="px-4 py-3 border-r border-slate-100">{header}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600 font-medium">
                                        {excelRows.map((exRow, i) => (
                                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                                              {Object.keys(excelRows[0] || {}).filter(k => k !== '_rowNum').map(k => {
                                                const isImg = isImageHeader(k)
                                                if (isImg) {
                                                  const imgSrc = resolveImageSrc(exRow[k])
                                                  return (
                                                    <td key={k} className="px-4 py-1.5 border-r border-slate-50 text-center align-middle">
                                                      {imgSrc ? (
                                                        <div className="flex items-center justify-center">
                                                          <div 
                                                            className="w-20 h-20 rounded border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer hover:opacity-85 transition-opacity inline-flex items-center justify-center shadow-sm"
                                                            onMouseEnter={e => {
                                                              const r = e.currentTarget.getBoundingClientRect()
                                                              setHoverImage({ src: imgSrc, x: r.left + r.width / 2, y: r.top })
                                                            }}
                                                            onMouseLeave={() => setHoverImage(null)}
                                                            onClick={() => setReportPopupImage(imgSrc)}
                                                          >
                                                            <img src={imgSrc} alt="preview" className="w-full h-full object-contain" />
                                                          </div>
                                                        </div>
                                                      ) : exRow[k] ? (
                                                        <span className="text-slate-655 text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[100px] inline-block shadow-inner" title={exRow[k]}>
                                                          📄 {exRow[k]}
                                                        </span>
                                                      ) : (
                                                        <span className="text-slate-300 italic">—</span>
                                                      )}
                                                    </td>
                                                  )
                                                }
                                              return (
                                                <td key={k} className="px-4 py-2 border-r border-slate-50 whitespace-nowrap">{exRow[k] || ''}</td>
                                              )
                                            })}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-400 italic font-medium">No Excel data available for this model.</p>
                                );})()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-slate-600">
                  Total Entries :
                </span>
                <span className="text-[13px] font-semibold text-slate-800">
                  {filteredData.length}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailRow(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Info size={16} className="text-[#0097A7]" />
                Index Details
              </h3>
              <button onClick={() => setDetailRow(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              {detailRow.hasImage && (
                <div className="flex justify-center mb-4">
                  <div
                    className="w-full max-w-[320px] aspect-[4/3] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-2 cursor-pointer hover:shadow-lg hover:border-[#0097A7]/40 transition-all duration-200"
                    onClick={() => setViewModelImage(`/api/index-creation/${detailRow.id}/download-image`)}
                  >
                    <img
                      src={`/api/index-creation/${detailRow.id}/download-image`}
                      alt="Model Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              {[
                ['Index No', detailRow.indexNo],
                ['Model', detailRow.model],
                ['Model No', detailRow.modelNo],
                ['Creation Date', detailRow.date?.split('T')[0] || detailRow.date],
                ['Excel Sheet Number', detailRow.fileLocation || '—'],
                ['File Name', detailRow.fileName || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center border-b border-slate-50 pb-2">
                  <span className="w-36 font-semibold text-slate-500 text-[12px] uppercase tracking-wider">{label}</span>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm Delete"
        message="Delete this index record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Image hover preview — fixed so table overflow doesn't clip it */}
      {hoverImage && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: hoverImage.x, top: hoverImage.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-[#0097A7] p-2">
            <img src={hoverImage.src} alt="preview" className="w-64 h-44 object-contain rounded-lg" />
          </div>
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-[#0097A7] rotate-45 -mt-1.5" />
          </div>
        </div>
      )}

      {reportPopupImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReportPopupImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setReportPopupImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors z-10"
            >
              ✕
            </button>
            <img 
              src={reportPopupImage.startsWith('data:') ? reportPopupImage : `data:image/png;base64,${reportPopupImage}`} 
              alt="full size preview" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}

      {viewModelImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewModelImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setViewModelImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors z-10"
            >
              ✕
            </button>
            <img 
              src={viewModelImage} 
              alt="Model full size preview" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}
